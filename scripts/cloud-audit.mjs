import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
const base = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}`;
for (const [name, path] of [['token', 'https://api.cloudflare.com/client/v4/user/tokens/verify'], ['pages', `${base}/pages/projects`], ['buckets', `${base}/r2/buckets`]]) {
  try {
    const response = await fetch(path, { headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` }, signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    console.log(JSON.stringify({ resource: name, status: response.status, success: data.success, errors: data.errors?.map(e => ({ code: e.code, message: e.message })), names: Array.isArray(data.result) ? data.result.map(x => x.name) : data.result?.buckets?.map(x => x.name), tokenStatus: name === 'token' ? data.result?.status : undefined }));
  } catch (error) { console.log(JSON.stringify({ resource: name, error: error.message })); }
}
