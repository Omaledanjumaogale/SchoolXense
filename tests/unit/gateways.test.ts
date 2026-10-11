import {afterEach,expect,test,vi} from 'vitest';
import {createGatewayCheckout,verifyGatewayPayment,verifyHmacSignature,safeCheckoutUrl} from '../../src/lib/payments/gateways';
import {encryptAccount,decryptAccount} from '../../convex/lib/bankEncryption';
const secrets={KORAPAY_SECRET_KEY:'test-secret',FLW_CLIENT_ID:'test-client',FLW_SECRET_KEY:'test-client-secret'};
const order={txRef:'SX-test-order',amountKobo:2500000,currency:'NGN',customer:{name:'Ada Okafor',email:'ada@example.com'},purpose:'subscription' as const,redirectUrl:'https://schoolxense.ewinproject.org/checkout/order'};
afterEach(()=>vi.unstubAllEnvs());
test('Korapay uses the authoritative order amount and validates checkout identity',async()=>{
 const fetcher=vi.fn().mockResolvedValue(Response.json({status:true,data:{reference:order.txRef,checkout_url:'https://checkout.korapay.com/order'}}));
 expect(await createGatewayCheckout('korapay',secrets,order,fetcher)).toMatchObject({providerRef:order.txRef});
 const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(body.amount).toBe(25000);expect(body.notification_url).toBe('https://schoolxense.ewinproject.org/api/webhooks/korapay');
 fetcher.mockResolvedValue(Response.json({status:true,data:{reference:'other-order',checkout_url:'https://checkout.korapay.com/order'}}));
 await expect(createGatewayCheckout('korapay',secrets,order,fetcher)).rejects.toThrow('reference mismatch');
});
test('a provider rejection and hostile redirect fail closed',async()=>{
 await expect(createGatewayCheckout('korapay',secrets,order,vi.fn().mockResolvedValue(Response.json({status:false},{status:401})))).rejects.toThrow('401');
 for(const url of ['http://checkout.korapay.com','https://checkout.korapay.com.evil.test','https://user:password@checkout.korapay.com'])expect(()=>safeCheckoutUrl(url,'korapay')).toThrow();
});
test('verification uses provider status, reference and amount, never redirect parameters',async()=>{
 const fetcher=vi.fn().mockResolvedValue(Response.json({status:true,data:{reference:order.txRef,status:'processing',amount:25000,currency:'NGN'}}));
 expect(await verifyGatewayPayment('korapay',secrets,order.txRef,fetcher)).toMatchObject({status:'pending',amountKobo:2500000,id:'korapay:'+order.txRef});
 fetcher.mockResolvedValue(Response.json({status:true,data:{reference:'other',status:'success',amount:25000,currency:'NGN'}}));
 await expect(verifyGatewayPayment('korapay',secrets,order.txRef,fetcher)).rejects.toThrow('identity mismatch');
});
test('Flutterwave v4 exchanges client credentials and verifies the exact charge',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(Response.json({access_token:'test-token'})).mockResolvedValueOnce(Response.json({status:'success',data:{id:'chg_test',reference:order.txRef,status:'succeeded',amount:25000,currency:'NGN'}}));
 expect(await verifyGatewayPayment('flutterwave',secrets,'chg_test',fetcher)).toMatchObject({status:'successful',id:'flutterwave-v4:chg_test',txRef:order.txRef});
 expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer test-token');
});
test.each(['hex','base64'] as const)('HMAC %s rejects altered payloads and missing signatures',async encoding=>{
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('test-hash'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('payload'))).toString(encoding);
 expect(await verifyHmacSignature('payload',signed,'test-hash',encoding)).toBe(true);
 expect(await verifyHmacSignature('tampered',signed,'test-hash',encoding)).toBe(false);
 expect(await verifyHmacSignature('payload',null,'test-hash',encoding)).toBe(false);
});
test('encrypted bank routing is bound to its owner and fails for another owner',async()=>{
 vi.stubEnv('BANK_ENCRYPTION_KEY','ab'.repeat(32));const encrypted=await encryptAccount('1234567890','owner');
 expect(encrypted.ciphertext).not.toContain('1234567890');expect(await decryptAccount(encrypted.ciphertext,encrypted.iv,'owner')).toBe('1234567890');
 await expect(decryptAccount(encrypted.ciphertext,encrypted.iv,'other')).rejects.toThrow();
});
