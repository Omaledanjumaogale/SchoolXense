/**
 * Realtime rooms — one Durable Object per session room (whiteboard + draft-feedback workspace).
 * Relays Yjs updates between peers, keeps the merged state in DO storage, and snapshots to R2.
 * Dropped connections rejoin the same room state. Video/audio uses Cloudflare Realtime (SFU) separately.
 */
import { verifyRoomToken } from './token';
export interface Env { ROOMS: DurableObjectNamespace; SNAPSHOTS: R2Bucket; JWT_SECRET: string; ROOMS_ENABLED?:string }

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const url = new URL(req.url);
		const m = url.pathname.match(/^\/rooms\/([\w-]+)$/);
		if (!m) return new Response('not found', { status: 404 });
		if(env.ROOMS_ENABLED!=='true')return new Response('Rooms unavailable',{status:503});
		const claims=await verifyRoomToken(url.searchParams.get('token')??'',env.JWT_SECRET??'',m[1],req.headers.get('Origin')??'');
		if(!claims)return new Response('Unauthorized',{status:401});
		const forwarded=new Request(req);forwarded.headers.set('X-Room-Expiry',String(claims.exp));
		const id = env.ROOMS.idFromName(m[1]);
		return env.ROOMS.get(id).fetch(forwarded);
	}
};

export class Room implements DurableObject {
	private sockets = new Set<WebSocket>();
	private updates: ArrayBuffer[] = [];
	constructor(private state: DurableObjectState, private env: Env) {
		state.blockConcurrencyWhile(async () => { this.updates = (await state.storage.get<ArrayBuffer[]>('updates')) ?? []; });
	}
	async fetch(req: Request): Promise<Response> {
		if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
		if (this.sockets.size >= 12) return new Response('room full', { status: 429 });
		const [client, server] = Object.values(new WebSocketPair());
		server.accept();
		this.sockets.add(server);
		const expire=setTimeout(()=>server.close(1008,'Reauthorize session'),Math.max(0,Number(req.headers.get('X-Room-Expiry'))*1000-Date.now()));
		let messages=0,windowAt=Date.now();
		for (const u of this.updates) server.send(u); // catch up on rejoin
		server.addEventListener('message', async (ev) => {
			if(Date.now()-windowAt>60000){messages=0;windowAt=Date.now();}
			if(!(ev.data instanceof ArrayBuffer)||ev.data.byteLength>32768||++messages>120){server.close(1008,'Invalid or excessive updates');return;}
			if(this.updates.reduce((n,u)=>n+u.byteLength,0)+ev.data.byteLength>2*1024*1024){server.close(1009,'Room state limit reached');return;}
			const data = ev.data as ArrayBuffer;
			this.updates.push(data);
			if (this.updates.length % 50 === 0) await this.snapshot();
			await this.state.storage.put('updates', this.updates.slice(-2000));
			for (const s of this.sockets) if (s !== server) try { s.send(data); } catch { this.sockets.delete(s); }
		});
		server.addEventListener('close', () => {clearTimeout(expire);this.sockets.delete(server);});
		return new Response(null, { status: 101, webSocket: client });
	}
	private async snapshot() {
		const total = this.updates.reduce((n, u) => n + u.byteLength, 0);
		const buf = new Uint8Array(total);
		let o = 0;
		for (const u of this.updates) { buf.set(new Uint8Array(u), o); o += u.byteLength; }
		await this.env.SNAPSHOTS.put(`rooms/${this.state.id.toString()}/${Date.now()}.bin`, buf);
	}
}
