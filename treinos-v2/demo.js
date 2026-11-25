/* ═══════════════════════════════════════════════════════════════════
   MODO DEMONSTRACAO (fix 08n, 25/11/2026)

   Abre o app com dados de exemplo para outra pessoa testar:
       https://treinosgarmin.runwithgratitude.ca/?demo

   Pedido do Luiz: "quero passar o app para alguem testar como funciona".
   O app e de uma pessoa so (tudo grava em treinos/luiz no Firebase), entao
   passar a senha mostraria e alteraria os dados reais dele.

   Aqui, ANTES de qualquer outro script da pagina:
     · localStorage e sessionStorage viram memoria: nada que o visitante
       fizer fica no aparelho, e nada do Luiz que esteja no mesmo aparelho
       e lido ou apagado;
     · fetch e interceptado: Firebase e GitHub nunca sao chamados. As
       leituras devolvem dados inventados; as gravacoes ficam so na
       memoria ate fechar a aba;
     · o login e o "Sync Garmin" fingem que deram certo.

   So liga com ?demo no endereco. Sem isso este arquivo nem e baixado
   (o index.html so o carrega quando ve o ?demo).
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  if(!/[?&]demo\b/.test(location.search)) return;
  window.BQ_DEMO = true;

  /* ── armazenamento em memoria ── */
  function Memoria(sem){
    var d = Object.create(null);
    Object.keys(sem || {}).forEach(function(k){ d[k] = String(sem[k]) });
    return {
      getItem: function(k){ k = String(k); return k in d ? d[k] : null },
      setItem: function(k, v){ d[String(k)] = String(v) },
      removeItem: function(k){ delete d[String(k)] },
      clear: function(){ d = Object.create(null) },
      key: function(i){ return Object.keys(d)[i] || null },
      get length(){ return Object.keys(d).length }
    };
  }
  var LS = Memoria({
    'bq.rt': 'demo', 'bq.mail': 'demo@runwithgratitude.ca', 'gh_token': 'demo',
    'bq_tema': 'escuro', 'quest_adiado': '1'
  });
  try{ Object.defineProperty(window, 'localStorage', {value: LS, configurable: true}) }catch(e){}
  try{ Object.defineProperty(window, 'sessionStorage', {value: Memoria(), configurable: true}) }catch(e){}
  /* Cinto e suspensorio: se algum navegador nao deixar trocar a
     propriedade, os metodos do Storage de verdade tambem passam a usar a
     memoria. Assim o login do dono do aparelho (bq.rt) nunca e tocado. */
  try{
    var SS = window.sessionStorage !== LS ? window.sessionStorage : Memoria();
    ['getItem','setItem','removeItem','clear','key'].forEach(function(m){
      var orig = Storage.prototype[m];
      Storage.prototype[m] = function(){
        var alvo = (this === SS) ? SS : LS;
        if(alvo === this) return orig.apply(this, arguments);
        return alvo[m].apply(alvo, arguments);
      };
    });
  }catch(e){}

  /* ── datas ── */
  var HOJE0 = new Date(); HOJE0.setHours(0,0,0,0);
  function isoDe(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth()+1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) }
  function diasAtras(n){ var d = new Date(HOJE0); d.setDate(d.getDate() - n); return d }
  function mmss(s){ s = Math.round(s); return Math.floor(s/60) + ':' + ('0' + (s % 60)).slice(-2) }
  function hms(s){ s = Math.round(s); var h = Math.floor(s/3600), m = Math.floor(s % 3600 / 60); return h + ':' + ('0'+m).slice(-2) + ':' + ('0'+(s%60)).slice(-2) }

  /* ── atividades inventadas: 6 meses de um corredor amador em evolucao ──
     Ter: intervalado · Qui: ritmo · Sab: longao · Dom: leve
     Seg e Qua: academia · de vez em quando uma bike                  */
  var semente = 7;
  function rnd(){ semente = (semente * 9301 + 49297) % 233280; return semente / 233280 }
  var ATIV = [], id = 900000;
  for(var n = 182; n >= 1; n--){
    var d = diasAtras(n), dow = d.getDay(), t = (182 - n) / 182;   // t: 0 no comeco, 1 hoje
    var falta = rnd() < 0.12 && n > 3;   // os ultimos dias sempre tem treino
    if(falta) continue;
    var base = 395 - t * 30;                                         // pace facil melhora ~30 s/km
    var a = null;
    if(dow === 2){        // terca: intervalado
      var km = 7 + Math.round(rnd() * 2);
      var p = base - 45 + (rnd() - .5) * 14;
      a = {esporte: 'corrida', tipo: 'Intervalado', km: km, pace: p, fc: 152 + Math.round(rnd()*8), notas: 'Intervalado 6x800 m'};
    }else if(dow === 4){  // quinta: ritmo
      var km2 = 8 + Math.round(rnd() * 3);
      a = {esporte: 'corrida', tipo: 'Ritmo', km: km2, pace: base - 30 + (rnd() - .5) * 12, fc: 150 + Math.round(rnd()*6), notas: 'Treino de ritmo'};
    }else if(dow === 6){  // sabado: longao, cresce com o tempo
      var km3 = Math.round(12 + t * 8 + rnd() * 2);
      a = {esporte: 'corrida', tipo: 'Longo', km: km3, pace: base + 15 + (rnd() - .5) * 16, fc: 138 + Math.round(rnd()*6), notas: 'Longão'};
    }else if(dow === 0){  // domingo: leve
      var km4 = 5 + Math.round(rnd() * 2);
      a = {esporte: 'corrida', tipo: 'Leve', km: km4, pace: base + 25 + (rnd() - .5) * 18, fc: 128 + Math.round(rnd()*6), notas: 'Rodagem leve'};
    }else if(dow === 1 || dow === 3){
      a = {esporte: 'strength', tipo: 'Academia', km: 0, dur: 45*60 + Math.round(rnd()*900), fc: 108 + Math.round(rnd()*10), notas: dow === 1 ? 'Força – Parte inferior' : 'Força – Parte superior'};
    }else if(dow === 5 && rnd() < 0.35){
      var km5 = 18 + Math.round(rnd() * 12);
      a = {esporte: 'cycling', tipo: 'Bike', km: km5, pace: 60*60/24, fc: 122 + Math.round(rnd()*8), notas: 'Pedal leve'};
    }
    if(!a) continue;
    var dur = a.dur || a.km * a.pace;
    ATIV.push({
      data: isoDe(d), garminId: String(id++), esporte: a.esporte, tipo: a.tipo, notas: a.notas,
      distancia: a.km ? +a.km.toFixed(2) : 0,
      pace: a.km ? mmss(a.pace) : '',
      duracao: hms(dur),
      fcMed: a.fc, fcMax: a.fc + 18,
      cadencia: a.esporte === 'corrida' ? Math.round(160 + t*5 + (a.pace < base ? 6 : 0) + (rnd()-.5)*6) : undefined,
      vo2max: a.esporte === 'corrida' ? Math.round(44 + t*3) : undefined,
      calorias: Math.round(dur / 60 * 11)
    });
  }

  /* prova-alvo: meia maratona da Blue Nose (Halifax), maio de 2027 */
  var COACH = {
    objetivo: {fam: 'corrida', id: '21k', data: '2027-05-23', nome: 'Meia maratona · Medavie Blue Nose Marathon',
               dataManual: true, prova: 'bluenose27', distProva: 21.1},
    quest: {sexo: 'x', idade: 42, altura: 172, peso: 72, maiorDist: 21, sono: 7},
    feitas: {}, extras: {}, trocas: {}, periodo: 90,
    em: new Date().toISOString()
  };
  var MAIN = {atividades: ATIV, atualizado: new Date().toISOString()};

  /* ── fetch falso para Firebase e GitHub ── */
  var fetchReal = window.fetch ? window.fetch.bind(window) : null;
  function resp(corpo, status){
    status = status || 200;
    var txt = corpo === undefined ? '' : JSON.stringify(corpo);
    try{ return new Response(status === 204 ? null : txt, {status: status, headers: {'Content-Type': 'application/json'}}) }
    catch(e){ return {ok: status < 300, status: status, json: function(){ return Promise.resolve(corpo) }, text: function(){ return Promise.resolve(txt) }} }
  }
  function caminhoFB(u){
    var m = u.match(/firebaseio\.com\/(.*?)\.json/) || u.match(/firebasedatabase\.app\/(.*?)\.json/);
    return m ? decodeURIComponent(m[1]).replace(/^\/+/, '') : null;
  }
  function ler(obj, partes){
    for(var i = 0; i < partes.length; i++){ if(obj == null) return null; obj = obj[partes[i]] }
    return obj === undefined ? null : obj;
  }
  function gravar(raiz, partes, metodo, valor){
    if(!partes.length){
      if(metodo === 'PATCH' && valor && typeof valor === 'object') Object.keys(valor).forEach(function(k){ raiz[k] = valor[k] });
      return;
    }
    var o = raiz;
    for(var i = 0; i < partes.length - 1; i++){ if(!o[partes[i]] || typeof o[partes[i]] !== 'object') o[partes[i]] = {}; o = o[partes[i]] }
    var k = partes[partes.length - 1];
    if(metodo === 'DELETE') delete o[k];
    else if(metodo === 'PATCH' && valor && typeof valor === 'object'){ if(!o[k] || typeof o[k] !== 'object') o[k] = {}; Object.keys(valor).forEach(function(x){ o[k][x] = valor[x] }) }
    else if(metodo === 'POST'){ if(!o[k] || typeof o[k] !== 'object') o[k] = {}; o[k]['demo' + Date.now()] = valor }
    else o[k] = valor;
  }

  window.fetch = function(entrada, op){
    var u = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || String(entrada);
    var metodo = String((op && op.method) || (entrada && entrada.method) || 'GET').toUpperCase();
    var corpo = null;
    try{ if(op && typeof op.body === 'string') corpo = JSON.parse(op.body) }catch(e){ corpo = null }

    if(/identitytoolkit\.googleapis\.com/.test(u))
      return Promise.resolve(resp({idToken: 'demo', refreshToken: 'demo', expiresIn: '3600', localId: 'demo', email: 'demo@runwithgratitude.ca'}));
    if(/securetoken\.googleapis\.com/.test(u))
      return Promise.resolve(resp({id_token: 'demo', refresh_token: 'demo', expires_in: '3600', user_id: 'demo'}));

    var c = caminhoFB(u);
    if(c !== null){
      var partes = c.split('/').filter(Boolean);
      var raiz = null, resto = [];
      if(partes[0] === 'treinos' && partes[1] === 'luiz'){ raiz = MAIN; resto = partes.slice(2) }
      else if(partes[0] === 'treinos_coach_v2' && partes[1] === 'luiz'){ raiz = COACH; resto = partes.slice(2) }
      /* academia: as rotinas de exemplo vem do hevy.json que ja e publico
         neste site (o mesmo formato do ramo hevy no Firebase) */
      if(metodo === 'GET' && raiz === COACH && resto[0] === 'hevy' && !COACH.hevy && fetchReal)
        return fetchReal('./hevy.json', {cache: 'no-store'}).then(function(r){ return r.json() })
          .then(function(j){ COACH.hevy = j; return resp(ler(COACH, resto)) })
          .catch(function(){ return resp(null) });
      if(metodo === 'GET') return Promise.resolve(resp(raiz ? ler(raiz, resto) : null));
      if(raiz) gravar(raiz, resto, metodo, corpo);
      return Promise.resolve(resp(corpo));
    }

    if(/api\.github\.com/.test(u)){
      if(/\/dispatches$/.test(u)) return Promise.resolve(resp(undefined, 204));
      if(/\/runs\b/.test(u)) return Promise.resolve(resp({total_count: 1, workflow_runs: [
        {id: 1, status: 'completed', conclusion: 'success', created_at: new Date().toISOString(), updated_at: new Date().toISOString()}]}));
      return Promise.resolve(resp({message: 'Not Found'}, 404));
    }
    if(/hevy(app)?\.com\/|api\.hevyapp/.test(u)) return Promise.resolve(resp({message: 'demo'}, 404));

    return fetchReal ? fetchReal(entrada, op) : Promise.reject(new Error('sem fetch'));
  };

  /* service worker: nao registra na demo, para nao misturar caches */
  try{
    if(navigator.serviceWorker) navigator.serviceWorker.register = function(){ return Promise.resolve({}) };
  }catch(e){}

  /* ── faixa "demonstracao" ── */
  function faixa(){
    if(document.getElementById('bqDemo')) return;
    var st = document.createElement('style');
    st.textContent = '#bqDemo{position:fixed;left:50%;transform:translateX(-50%);top:calc(6px + env(safe-area-inset-top));z-index:100001;' +
      'background:#F2B441;color:#14181f;font:700 11.5px/1 -apple-system,system-ui,sans-serif;letter-spacing:.02em;' +
      'padding:5px 11px;border-radius:999px;opacity:.92;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap}';
    document.head.appendChild(st);
    var f = document.createElement('div');
    f.id = 'bqDemo';
    f.textContent = 'DEMONSTRAÇÃO · dados de exemplo · nada é salvo';
    document.body.appendChild(f);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faixa); else faixa();
})();
