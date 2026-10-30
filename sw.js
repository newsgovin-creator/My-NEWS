const CACHE='indian-news-v2.1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>
    Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{
      if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}
      return res;
    }).catch(()=>hit||caches.match('./index.html'));
    return hit||net;
  }));
});
