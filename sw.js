const CACHE_NAME="rar-rc44-v1";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./hero-rc21.png"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // 1ファイルの取得失敗でSW全体のinstallを落とさない。
    await Promise.allSettled(APP_SHELL.map(url=>cache.add(url)));
  })());
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const request=event.request;
  const url=new URL(request.url);

  // HTML/navigation: network first. 新しいRCを最優先。
  if(request.mode==="navigate" || url.pathname.endsWith("/index.html")){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:"no-store"});
        if(response && response.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(request,response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return (await caches.match(request)) || (await caches.match("./index.html")) ||
          new Response("Offline",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}});
      }
    })());
    return;
  }

  // 同一オリジン静的資産: cacheを即表示しつつ裏で更新。
  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(request);
      const networkPromise=fetch(request).then(async response=>{
        if(response && response.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(request,response.clone()).catch(()=>{});
        }
        return response;
      }).catch(()=>null);
      return cached || (await networkPromise) ||
        new Response("",{status:504,statusText:"Offline"});
    })());
  }
});
