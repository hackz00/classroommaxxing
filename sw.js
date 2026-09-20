/* Build replaces the revision; only this worker's scoped shell caches are managed. */
const REVISION = '28b43e2216a55216ce6092eba0c31ac26ff71e6948757226d9dd5cd5f0ae7035';
const SHELL_HASH = 'e65323fa0edd8279decc9aea30fcf123c826d45537246caf55871cd61626fdb4';
const ROOT = new URL('./', self.location.href);
const PREFIX = 'cmx-shell-' + encodeURIComponent(ROOT.pathname) + '-';
const CACHE = PREFIX + REVISION;
const entry = new URL('index.html', ROOT).href;
const local = name => new URL(name, ROOT).href;
const sha = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),b=>b.toString(16).padStart(2,'0')).join('');

self.addEventListener('install', event => event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const shell = await fetch(entry, {cache:'reload',referrerPolicy:'no-referrer'});
    if(!shell.ok || await sha(await shell.clone().arrayBuffer())!==SHELL_HASH) throw Error('Shell unavailable or revision mismatch');
    await cache.put(entry,shell);
    const response=await fetch(local('r.json'),{cache:'reload',referrerPolicy:'no-referrer'});
    if(!response.ok) throw Error('Manifest unavailable');
    const manifest=await response.clone().json();
    if(!/^r\/[a-f0-9]{64}\.js$/.test(manifest.path)||manifest.sha256!==REVISION) throw Error('Release revision mismatch');
    const payload=await fetch(local(manifest.path),{cache:'reload',referrerPolicy:'no-referrer'});
    if(!payload.ok) throw Error('Payload unavailable');
    const bytes=await payload.clone().arrayBuffer();
    if(bytes.byteLength!==manifest.size||await sha(bytes)!==manifest.sha256) throw Error('Payload integrity failed');
    await cache.put(local(manifest.path),payload);
    await cache.put(local('r.json'),response);
    await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async()=>{
    for(const key of await caches.keys()) if(key.startsWith(PREFIX)&&key!==CACHE) await caches.delete(key);
    await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
    const url=new URL(event.request.url);
    if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
    const relative=url.pathname.slice(ROOT.pathname.length);
    if(event.request.mode!=='navigate' && relative!=='r.json' && !/^r\/[a-f0-9]{64}\.js$/.test(relative))return;
    event.respondWith((async()=>{
        const cache=await caches.open(CACHE);
        if(event.request.mode==='navigate') {
            try {const response=await fetch(event.request);if(response.ok)return response;} catch {}
            return await cache.match(entry) || new Response('Offline',{status:503});
        }
        const saved=await cache.match(url.origin+url.pathname);
        if(saved)return saved;
        const response=await fetch(event.request);
        if(response.ok && /^r\/[a-f0-9]{64}\.js$/.test(relative)) {
            const bytes=await response.clone().arrayBuffer();
            if(await sha(bytes)===relative.slice(2,-3))await cache.put(url.origin+url.pathname,response.clone());
        }
        return response;
    })());
});
