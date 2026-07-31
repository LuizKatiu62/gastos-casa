/* ══════════════════════════════════════════════════════════════
   Treinos · service worker

   Estratégia: REDE PRIMEIRO.
   Com internet, você sempre recebe a versão mais nova — nada de
   ficar preso numa cópia velha depois de publicar. Sem internet,
   o app abre a partir do cache e mostra a última leitura guardada.

   Ao publicar uma versão nova, mude VERSAO abaixo.
   ══════════════════════════════════════════════════════════════ */

const VERSAO = 'treinos-v2-2026-07-30-02';
const ESSENCIAIS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSAO).then(c=>c.addAll(ESSENCIAIS)).catch(()=>{})
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    const chaves = await caches.keys();
    await Promise.all(chaves.filter(k=>k!==VERSAO).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  // Firebase, GitHub e fontes nunca passam pelo cache
  if(url.origin !== self.location.origin) return;

  e.respondWith((async()=>{
    try{
      const resposta = await fetch(req);
      if(resposta && resposta.ok){
        const copia = resposta.clone();
        caches.open(VERSAO).then(c=>c.put(req, copia)).catch(()=>{});
      }
      return resposta;
    }catch(err){
      const guardado = await caches.match(req);
      if(guardado) return guardado;
      if(req.mode === 'navigate'){
        const inicio = await caches.match('./index.html');
        if(inicio) return inicio;
      }
      throw err;
    }
  })());
});
