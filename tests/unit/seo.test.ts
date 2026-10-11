import {test,expect} from 'vitest';
import {buildMeta,privatePath} from '../../src/lib/seo';
import {buildPageGraph} from '../../src/lib/schema/graph';
test('private and public crawl signals remain separate',()=>{for(const path of ['/ops','/wallet','/login','/api/media'])expect(privatePath(path)).toBe(true);expect(buildMeta('/faq').robots).toBe('index,follow');expect(buildMeta('/wallet').robots).toBe('noindex,nofollow');expect(buildMeta('/faq/').canonical).toBe('https://schoolxense.ewinproject.org/faq');});
test('structured data cannot terminate its script container',()=>{const graph=buildPageGraph([{'@type':'CreativeWork',name:'</script><script>alert(1)</script>'}]);expect(graph).not.toContain('<');expect(JSON.parse(graph)['@graph'][0].name).toContain('</script>');});
