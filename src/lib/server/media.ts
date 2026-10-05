import { env } from '$env/dynamic/private';
import { error, type RequestEvent } from '@sveltejs/kit';
export type MediaGrant = { key: string; ownerId: string; kind: 'image' | 'document'; contentType: string; size: number; expires: number };
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join('');
export function secret(event: RequestEvent) { const value = event.platform?.env?.MEDIA_SIGNING_SECRET ?? env.MEDIA_SIGNING_SECRET; if (!value) error(503, 'Media uploads are unavailable.'); return value; }
async function signature(payload: string, key: string) { const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return hex(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload))); }
export async function signGrant(grant: MediaGrant, key: string) { const payload = btoa(JSON.stringify(grant)); return payload + '.' + await signature(payload, key); }
export async function readGrant(token: string, key: string): Promise<MediaGrant> {
 const [payload, sig] = token.split('.');
 if (!payload || !sig || token.length > 2000) error(403, 'Invalid upload permission.');
 const expected = await signature(payload, key); let diff = sig.length ^ expected.length;
 for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (sig.charCodeAt(i) || 0);
 if (diff) error(403, 'Invalid upload permission.');
 let grant: MediaGrant;
 try { grant = JSON.parse(atob(payload)); } catch { error(403, 'Invalid upload permission.'); }
 if (grant.expires < Date.now() || !/^uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]+\.(pdf|png|jpg|webp)$/.test(grant.key)) error(403, 'Upload permission has expired.');
 return grant;
}
export function validMedia(kind: string, type: string, size: number) { return Number.isSafeInteger(size) && size > 0 && size <= (kind === 'image' ? 5 : 10) * 1024 * 1024 && (kind === 'image' ? ['image/jpeg','image/png','image/webp'].includes(type) : kind === 'document' && type === 'application/pdf'); }
export function validMagic(bytes: Uint8Array, type: string) { return type === 'application/pdf' ? new TextDecoder().decode(bytes.slice(0,5)) === '%PDF-' : type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : type === 'image/png' ? bytes.slice(0,8).every((x,i) => x === [137,80,78,71,13,10,26,10][i]) : new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP'; }
