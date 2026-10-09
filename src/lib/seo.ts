export const SITE='https://schoolxense.ewinproject.org';
export const MOTHER='https://ewinproject.org';
export interface PageSEO { title:string; description:string; canonical:string; robots:string; image:string; graph:string }
export const PUBLIC_PAGES:Record<string,{title:string;description:string}>={
 '/':{title:'SchoolXense — Exam practice, tutoring and learning resources',description:'SchoolXense supports Nigerian learners with reviewed exam practice, tutoring and educational resources within the E-WIN Project ecosystem.'},
 '/faq':{title:'SchoolXense frequently asked questions',description:'Answers about SchoolXense signup, free practice limits, paid plans, guardian safeguards, tutoring, payments and mobile installation.'},
 '/about':{title:'About SchoolXense and the E-WIN Project',description:'Learn about SchoolXense, the education platform in the Elite Workforce Impact Nigeria Project ecosystem.'},
 '/pricing':{title:'SchoolXense plans and pricing',description:'Compare SchoolXense learning plans and their access conditions. Paid access requires a verified account and an active eligible subscription.'},
 '/library':{title:'SchoolXense study resource library',description:'Browse published SchoolXense study resources. Purchases and downloads are protected by authenticated server permissions.'},
 '/for-schools':{title:'SchoolXense for schools and institutions',description:'Explore institution learning support and contact SchoolXense about school onboarding.'},
 '/explore':{title:'Explore SchoolXense learning modules',description:'Explore exam practice, tutoring, learning resources and educational collaboration on SchoolXense.'}
};
export const privatePath=(path:string)=>/^\/(api|admin|auth|ops|inst|login|signup|admin-login|welcome|forgot-password|reset-password|home|wallet|checkout|practice|settings|sessions|threads|tutor-bundle|studio|teams|tasks|contracts|referrals|family|record|review|plan|packs|offers|requests|payouts|earn|skills|notifications|certificates|attempt|book)(\/|$)/.test(path);
export function buildMeta(path:string,override?:Partial<PageSEO>):PageSEO {
 const normalized=path==='/'?'/':path.replace(/\/$/,'');const entry=PUBLIC_PAGES[normalized];
 const title=entry?.title??`${normalized.split('/').filter(Boolean).map(s=>s.replaceAll('-',' ')).join(' · ')} · SchoolXense`;
 return {title,description:entry?.description??'Official SchoolXense information, learning services and educational resources in the E-WIN Project ecosystem.',canonical:SITE+normalized,robots:privatePath(normalized)?'noindex,nofollow':'index,follow',image:SITE+'/icon-512.png',graph:'',...override};
}
