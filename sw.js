// 先用快取立刻打開，背景再抓新版；首頁有新版時通知畫面（App 會在切到背景時自動重新整理）
const C='ledger-v2',F=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const nav=e.request.mode==='navigate';
  const job=caches.open(C).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:nav}),old=nav&&hit?hit.clone():null; // 先複製：hit 可能已經交給畫面用掉了
    const net=fetch(e.request,{cache:'no-cache'}).then(async r=>{if(!r.ok)return r;
      if(old){const[a,b]=await Promise.all([old.text(),r.clone().text()]);if(a!==b)(await self.clients.matchAll()).forEach(x=>x.postMessage('updated'))}
      await c.put(e.request,r.clone());return r}).catch(()=>hit);
    return{hit,net}});
  e.respondWith(job.then(({hit,net})=>hit||net));
  e.waitUntil(job.then(({net})=>net))});
