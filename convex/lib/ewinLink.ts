export type EwinLinkAssertion={version:1;platformId:'schoolcbt';platformSubject:string;centralUserId:string;linkId:string;referralCode:string;issuedAt:number;expiresAt:number};

export async function verifyEwinLink(assertion:EwinLinkAssertion,signature:string,secret:string|undefined,now=Date.now()){
	if(!secret||!/^[0-9a-f]{64}$/i.test(signature)||assertion.issuedAt>now+30_000||assertion.expiresAt<now||assertion.expiresAt-assertion.issuedAt>5*60_000)return false;
	const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
	const bytes=new Uint8Array(signature.match(/.{2}/g)!.map(x=>parseInt(x,16)));
	const {version,platformId,platformSubject,centralUserId,linkId,referralCode,issuedAt,expiresAt}=assertion;
	return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(JSON.stringify({version,platformId,platformSubject,centralUserId,linkId,referralCode,issuedAt,expiresAt})));
}
