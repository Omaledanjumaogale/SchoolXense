// Cache public assets only. Account pages and API responses must stay on the network.
const VERSION = 'schoolxense-public-v5';
const OFFLINE_URL = '/offline';
const SHELL = [OFFLINE_URL, '/favicon.svg', '/manifest.webmanifest'];
self.addEventListener('push',event=>{
 let payload={};try{payload=event.data?.json()??{};}catch{}
 event.waitUntil(self.registration.showNotification('SchoolXense',{body:typeof payload.body==='string'?payload.body.slice(0,200):'Sign in to view your account update.',icon:'/icon-192.png',badge:'/icon-192.png',tag:'schoolxense-account-update',data:{href:'/notifications'}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{const target=new URL('/notifications',self.location.origin).href;const existing=clients.find(c=>new URL(c.url).origin===self.location.origin);if(existing){await existing.navigate(target);return existing.focus();}return self.clients.openWindow(target);}));});
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then(async (cache) => {
    await cache.addAll(SHELL);
    const offline = await cache.match(OFFLINE_URL);
    const html = await offline.text();
    const styles = [...html.matchAll(/href="([^"]+\.css)"/g)].map(match => new URL(match[1], self.location.origin));
    await cache.addAll(styles.filter(url => url.origin === self.location.origin && url.pathname.startsWith('/_app/immutable/')).map(url => url.href));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('hive-') || (key.startsWith('schoolxense-') && key !== VERSION)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_app/immutable/') || SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(VERSION).then((cache) => cache.put(request, copy)));
      }
      return response;
    })));
  } else if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});
