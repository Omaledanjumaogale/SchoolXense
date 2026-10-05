import { LANDINGS } from '$hive/landings';
export const load = ({ params }) => ({ key: params.landing, l: LANDINGS[params.landing] });
