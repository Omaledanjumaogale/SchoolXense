import type {SchemaObject} from './builders';
/** Escape HTML delimiters so content cannot terminate the JSON-LD script. */
export function buildPageGraph(schemas:SchemaObject[]):string{return JSON.stringify({'@context':'https://schema.org','@graph':schemas}).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');}
