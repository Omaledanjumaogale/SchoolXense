import {SITE,MOTHER} from '$lib/seo';
export type SchemaObject=Record<string,unknown>;
export const buildOrganizationSchema=():SchemaObject=>({'@type':'EducationalOrganization','@id':SITE+'/#organization',name:'SchoolXense',url:SITE,logo:SITE+'/icon-512.png',description:'Education and reviewed exam practice within the E-WIN Project ecosystem.',parentOrganization:{'@id':MOTHER+'/#organization'}});
export const buildMotherSchema=():SchemaObject=>({'@type':'Organization','@id':MOTHER+'/#organization',name:'Elite Workforce Impact Nigeria (E-WIN) Project',legalName:'Elite Workforce Enterprises and Digital Emerging Arbitrage & Leverage Services',url:MOTHER});
export const buildWebSiteSchema=():SchemaObject=>({'@type':'WebSite','@id':SITE+'/#website',name:'SchoolXense',url:SITE,inLanguage:'en-NG',publisher:{'@id':SITE+'/#organization'}});
export const buildBreadcrumbSchema=(path:string):SchemaObject=>({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'SchoolXense',item:SITE+'/'},...path.split('/').filter(Boolean).map((part,index,parts)=>({'@type':'ListItem',position:index+2,name:part.replaceAll('-',' '),item:SITE+'/'+parts.slice(0,index+1).join('/')}))]});
export const buildFAQSchema=(items:readonly (readonly [string,string])[]):SchemaObject=>({'@type':'FAQPage',mainEntity:items.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))});
export const buildPersonSchema=():SchemaObject=>({'@type':'Person',name:'Omale Danjuma Ogale',jobTitle:'Founder & CEO',url:'https://omaledanjumaogale.ewinproject.org/'});
