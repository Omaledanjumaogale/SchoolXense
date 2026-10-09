export async function verifyRoomToken(token:string,secret:string,room:string,origin:string,now=Date.now()){
 try{
  if(secret.length<32||token.length>4096)return null;
  const parts=token.split('.');if(parts.length!==3)return null;
  const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
  if(header.alg!=='HS256'||header.typ!=='JWT'||claims.aud!=='schoolxense-room'||claims.iss!=='schoolxense'||claims.room!==room||claims.origin!==origin||typeof claims.sub!=='string'||!claims.sub||!Number.isInteger(claims.exp)||!Number.isInteger(claims.iat)||claims.exp*1000<=now||claims.iat*1000>now+30000||claims.exp-claims.iat>300)return null;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('HMAC',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]))?claims:null;
 }catch{return null;}
}
