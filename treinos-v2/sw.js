/* ══════════════════════════════════════════════════════════════
   Treinos · service worker
   Versão 2026-08-01d

   Estratégia: REDE PRIMEIRO, DE VERDADE.

   A versão anterior chamava fetch(req) sem desligar o cache do
   navegador. O Safari então respondia com a cópia guardada dele
   sem nem consultar o servidor — dava para publicar um arquivo
   novo no GitHub e o iPhone continuar rodando o antigo por horas.

   Agora os arquivos do próprio app são buscados com cache:'reload',
   que obriga a ida ao servidor e atualiza a cópia local. Sem
   internet, o app volta a abrir pelo que estiver guardado.

   O fix.js entrou na lista de essenciais: ele é parte do app.

   Ao publicar uma versão nova, mude VERSAO abaixo.
   ══════════════════════════════════════════════════════════════ */

const VERSAO = 'treinos-v2-2026-08-26a';
const ESSENCIAIS = ['./', './index.html', './manifest.json', './fix.js'];

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

/* busca sem passar pelo cache do navegador; se o navegador não
   aceitar a opção, cai no fetch comum em vez de quebrar */
async function buscarFresco(req){
  try{
    return await fetch(req, {cache:'reload'});
  }catch(err){
    if(err && err.name === 'TypeError') return await fetch(req);
    throw err;
  }
}

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  // Firebase, GitHub e fontes nunca passam pelo cache
  if(url.origin !== self.location.origin) return;

  e.respondWith((async()=>{
    try{
      const resposta = await buscarFresco(req);
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
