export interface OpenGraphMeta {title:string;description:string;url:string;image:string;type:'website'|'article';locale:string}
export interface TwitterMeta {title:string;description:string;image:string;card:'summary_large_image'}
export interface SchemaBase {'@type':string|string[];'@id'?:string;[key:string]:unknown}
export interface PageSEO {title:string;description:string;canonical:string;robots:string;image:string;graph:string}
