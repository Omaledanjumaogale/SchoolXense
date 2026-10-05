import { test, expect } from '@playwright/test';
test('pricing and guardian consent use authenticated journeys',async({page})=>{
 await page.goto('/pricing');await page.getByRole('button',{name:'Go Plus',exact:true}).click();await expect(page).toHaveURL(/\/login\?next=\/pricing/);
 await page.goto('/guardian/consent/test-invitation');await page.getByLabel('I confirm that I am responsible for this learner.').check();await page.getByRole('button',{name:'Sign in to review',exact:true}).click();await expect(page).toHaveURL(/\/login\?next=/);
});
test('landing sections and real photos render once without horizontal overflow',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 for(const id of ['learning-community','testimonials','faq','enquiries'])await expect(page.locator('#'+id)).toHaveCount(1);
 await expect(page.locator('#learning-community img')).toHaveCount(3);
 for(const img of await page.locator('#learning-community img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);}
 await expect(page.getByText('Example story · not a customer testimonial')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);expect(errors).toEqual([]);
 await page.locator('#learning-community').screenshot({path:'.artifacts/landing-community-'+test.info().project.name+'.png'});
});
test('password visibility, FAQs and verification sign-in are accessible',async({page})=>{
 await page.goto('/login');await expect(page.getByLabel('Email address',{exact:true})).toBeVisible();
 const password=page.getByLabel('Password',{exact:true});await expect(password).toHaveAttribute('type','password');
 await page.getByRole('button',{name:'Show password',exact:true}).click();await expect(password).toHaveAttribute('type','text');
 await page.getByRole('button',{name:'Hide password',exact:true}).click();await expect(password).toHaveAttribute('type','password');
 await expect(page.getByText('Ada · SS3 learner')).toHaveCount(0);
 await page.goto('/#faq');await page.locator('#faq summary').first().click();await expect(page.locator('#faq details').first()).toHaveAttribute('open','');
});
test('anonymous account and admin access cannot use a demo persona',async({page})=>{
 await page.goto('/home');await expect(page).toHaveURL(/login/,{timeout:20000});
 await page.goto('/');await expect(page.getByRole('link',{name:'Admin console',exact:true})).toHaveCount(0);
 await page.goto('/admin-login');await expect(page.getByRole('heading',{level:1})).toContainText('Administrator');
});
test('server routes reject anonymous mutations, cross-origin writes and invalid enquiries',async({request,baseURL})=>{
 for(const path of ['/api/payments/initialize','/api/ai/generate','/api/media/sign-upload']){const response=await request.post(path,{headers:{Origin:baseURL!},data:{}});expect(response.status()).toBe(401);}
 const cross=await request.post('/api/ai/generate',{headers:{Origin:'https://untrusted.example'},data:{}});expect(cross.status()).toBe(403);
 const enquiry=await request.post('/api/enquiries',{headers:{Origin:baseURL!},form:{name:'A',email:'bad',message:'short',consent:'on'}});expect(enquiry.status()).toBe(400);
 const session=await request.get('/api/auth/get-session');expect(session.status()).toBe(200);expect(await session.json()).toBeNull();
});
test('PWA only caches public assets and declares installable icons',async({request})=>{
 const manifest=await(await request.get('/manifest.webmanifest')).json();expect(manifest.name).toBe('SchoolXense');
 for(const icon of manifest.icons){const response=await request.get(icon.src);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/png');}
	const offline=await request.get('/offline');expect(offline.status()).toBe(200);
	const sw=await(await request.get('/sw.js')).text();expect(sw).toContain("url.pathname.startsWith('/api/')");expect(sw).toContain("OFFLINE_URL = '/offline'");
});
test('signup residence dropdowns and identity visibility work on desktop and mobile',async({page,request})=>{
 await page.goto('/signup');const nin=page.getByLabel('NIN',{exact:true});const toggle=page.getByRole('button',{name:'Show NIN',exact:true});
 await expect.poll(async()=>{if(await nin.getAttribute('type')==='password')await toggle.click();return nin.getAttribute('type');}).toBe('text');
 const state=page.getByLabel('State of residence');expect(await state.locator('option').count()).toBe(38);
 const lga=page.getByLabel('LGA of residence');await expect.poll(async()=>{if(!(await lga.isEnabled()))await state.selectOption('Lagos');return lga.isEnabled();}).toBe(true);
 await lga.selectOption('Ikeja');await state.selectOption('Abia');await expect(lga).toHaveValue('');await expect(lga.locator('option')).toHaveCount(18);
 await expect(page.getByLabel('WhatsApp contact')).toBeVisible();
 expect((await request.get('/api/admin/health')).status()).toBe(401);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
