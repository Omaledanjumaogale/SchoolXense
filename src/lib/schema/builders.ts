import {SITE,MOTHER} from '$lib/seo';
export type SchemaObject=Record<string,unknown>;
export const buildOrganizationSchema=():SchemaObject=>({'@type':'EducationalOrganization','@id':SITE+'/#organization',name:'SchoolXense',url:SITE,logo:SITE+'/icon-512.png',description:'Education and reviewed exam practice within the E-WIN Project ecosystem.',parentOrganization:{'@id':MOTHER+'/#organization'}});
export const buildMotherSchema=():SchemaObject=>({'@type':'Organization','@id':MOTHER+'/#organization',name:'Elite Workforce Impact Nigeria (E-WIN) Project',legalName:'Elite Workforce Enterprises and Digital Emerging Arbitrage & Leverage Services',url:MOTHER});
export const buildWebSiteSchema=():SchemaObject=>({'@type':'WebSite','@id':SITE+'/#website',name:'SchoolXense',url:SITE,inLanguage:'en-NG',publisher:{'@id':SITE+'/#organization'}});
export const buildBreadcrumbSchema=(path:string):SchemaObject=>({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'SchoolXense',item:SITE+'/'},...path.split('/').filter(Boolean).map((part,index,parts)=>({'@type':'ListItem',position:index+2,name:part.replaceAll('-',' '),item:SITE+'/'+parts.slice(0,index+1).join('/')}))]});
export const buildFAQSchema=(items:readonly (readonly [string,string])[]):SchemaObject=>({'@type':'FAQPage',mainEntity:items.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))});
export const buildPersonSchema=():SchemaObject=>({'@type':'Person',name:'Omale Danjuma Ogale',jobTitle:'Founder & CEO',url:'https://omaledanjumaogale.ewinproject.org/'});
export interface ContentSchema {name:string;description:string;url:string;datePublished:string;dateModified:string;author:string}
export const buildArticleSchema=(content:ContentSchema):SchemaObject=>({'@type':'Article',headline:content.name,...content,author:{'@type':'Person',name:content.author},publisher:{'@id':SITE+'/#organization'},mainEntityOfPage:content.url});
export const buildHowToSchema=(content:ContentSchema,steps:{name:string;text:string}[]):SchemaObject=>({...buildArticleSchema(content),'@type':'HowTo',step:steps.map(step=>({'@type':'HowToStep',...step}))});
export const buildServiceSchema=(name:string,description:string,url:string):SchemaObject=>({'@type':'Service',name,description,url,provider:{'@id':SITE+'/#organization'},areaServed:'Nigeria'});
