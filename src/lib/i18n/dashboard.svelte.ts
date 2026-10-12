import catalogue from './dashboard.json';
export const dashboardLocale=$state({value:'en'});
export function dashboardText(source:string):string {return (catalogue as Record<string,Record<string,string>>)[dashboardLocale.value]?.[source]??source;}
export function validDashboardLocale(value:string){return ['en','ha','ig','yo','fr','ar','pt','sw'].includes(value);}
