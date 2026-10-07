import { chromium } from '@playwright/test';
import { loadEnv } from 'vite';
const env={...loadEnv('development',process.cwd(),''),...process.env};
if(!env.SCHOOLXENSE_OWNER_TEST_PASSWORD||!env.SUPER_ADMIN_EMAIL)throw new Error('Owner test credentials are required.');
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 await page.goto((env.PUBLIC_APP_URL??'https://schoolxense.ewinproject.org')+'/admin-login');
 await page.getByLabel('Email address',{exact:true}).fill(env.SUPER_ADMIN_EMAIL);
 await page.getByLabel('Password',{exact:true}).fill(env.SCHOOLXENSE_OWNER_TEST_PASSWORD);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.waitForURL(/\/ops(?:\?|$)/,{timeout:60000});
 await page.getByRole('heading',{name:'Administration',exact:true}).waitFor({timeout:30000});
 const links=await page.locator('header').getByRole('link',{name:'Admin console',exact:true}).count();
 console.log(JSON.stringify({check:'owner admin UI',workspace:'ops',headerAdminLink:links>0}));
 if(!links)process.exitCode=1;
 await page.getByRole('heading',{name:'Tutor capacity and approval',exact:true}).waitFor({timeout:30000});
 for(const viewport of [{width:1440,height:900},{width:393,height:851}]){
  await page.setViewportSize(viewport);await page.goto((env.PUBLIC_APP_URL??'https://schoolxense.ewinproject.org')+'/tutor-bundle');
  await page.getByRole('heading',{name:'Your tutor bundle',exact:true}).waitFor();await page.getByRole('heading',{name:'Session resources',exact:true}).waitFor();
  const worksheets=await page.getByRole('button',{name:'Download worksheet',exact:true}).count();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  console.log(JSON.stringify({check:'tutor bundle admin UI',width:viewport.width,worksheets,horizontalOverflow:overflow}));if(worksheets!==6||overflow)process.exitCode=1;
 }
}finally{await browser.close();}
