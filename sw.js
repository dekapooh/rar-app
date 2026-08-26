const CACHE_NAME="rar-rc65-final-v2";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./hero-rc65.png",
  "./brand-horse-rc65.png"
];

const RC65_BRAND_CSS=`
/* RAR RC65 FINAL BRANDING ONLY */
.brand{
  gap:6px!important;
}
.brand::before{
  content:""!important;
  display:inline-block!important;
  width:32px!important;
  height:28px!important;
  flex:0 0 32px!important;
  border:0!important;
  border-radius:0!important;
  transform:none!important;
  box-sizing:border-box!important;
  background:url("./brand-horse-rc65.png") center/contain no-repeat!important;
}
.home-hero-natural{
  background-image:url("./hero-rc65.png")!important;
  background-position:center!important;
  background-size:cover!important;
  background-repeat:no-repeat!important;
}
`;

function makeRC65(html){
  let out=html
    .replaceAll("β Ver.1.0 RC64","β Ver.1.0 RC65")
    .replaceAll("RAR β Ver.1.0 RC64","RAR β Ver.1.0 RC65");
  if(out.includes("</style>")){
    out=out.replace("</style>",RC65_BRAND_CSS+"\n</style>");
  }else if(out.includes("</head>")){
    out=out.replace("</head>","<style>"+RC65_BRAND_CSS+"</style></head>");
  }
  return out;
}

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
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
  if(event.request.method!=="GET") return;

  const req=event.request;
  const url=new URL(req.url);

  if(req.mode==="navigate" || url.pathname.endsWith("/index.html")){
    event.respondWith((async()=>{
      try{
        const network=await fetch(req,{cache:"no-store"});
        if(!network.ok) throw new Error("HTTP "+network.status);
        const raw=await network.text();
        const rc65=makeRC65(raw);
        const headers=new Headers(network.headers);
        headers.set("content-type","text/html; charset=utf-8");
        const response=new Response(rc65,{
          status:network.status,
          statusText:network.statusText,
          headers
        });
        const cache=await caches.open(CACHE_NAME);
        cache.put("./index.html",response.clone()).catch(()=>{});
        return response;
      }catch(e){
        return (await caches.match("./index.html")) ||
          new Response("Offline",{status:503,headers:{"content-type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached) return cached;
      try{
        const response=await fetch(req);
        if(response && response.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(req,response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return new Response("",{status:504});
      }
    })());
  }
});
