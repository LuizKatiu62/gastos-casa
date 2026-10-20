/* ═══════════ RESUMO SEMANAL DOS GASTOS NO WHATSAPP (20/10/2026) ═══════════
   Toda segunda, o GitHub roda este script (workflow resumo-gastos.yml):
     1. entra no Firebase como o Luiz (secrets FIREBASE_EMAIL/PASSWORD,
        os mesmos do Sync Garmin);
     2. lê os lançamentos do app Gastos da Casa;
     3. calcula o resumo da semana com o MESMO código do app
        (semana-gastos.js, lido do site luizkatiu62.github.io);
     4. manda pelo WhatsApp para o próprio Luiz via CallMeBot
        (secrets CALLMEBOT_APIKEY e WHATSAPP_PHONE).

   Este repositório é PÚBLICO e os logs das Actions também: nenhum valor
   em dinheiro é impresso no log. Só "lido", "enviado" ou o erro.
   Só lê do Firebase; não grava nada.

   Teste local: DRY_RUN=1 GASTOS_JSON_FILE=dados.json SEMANA_JS_FILE=semana-gastos.js
   node resumo-gastos-whatsapp.js  → imprime a mensagem em vez de enviar.
   ══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const vm = require('vm');

const FB_KEY  = 'AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU';
const FB_DB   = 'https://gastos-casa-7f431-default-rtdb.firebaseio.com';
const FB_PATH = 'gastos/lk62-gastos-9f3a7b2e';
const SITE    = 'https://luizkatiu62.github.io';
const DRY     = !!process.env.DRY_RUN;

function hojeHalifax(){
  const p = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Halifax', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  return process.env.HOJE || p;                      // AAAA-MM-DD
}

async function token(){
  const email = (process.env.FIREBASE_EMAIL||'').trim(), senha = process.env.FIREBASE_PASSWORD||'';
  if(!email || !senha) throw new Error('faltam os secrets FIREBASE_EMAIL / FIREBASE_PASSWORD');
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+FB_KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email, password:senha, returnSecureToken:true})});
  const j = await r.json();
  if(!r.ok) throw new Error('login no Firebase recusado: '+((j.error&&j.error.message)||r.status));
  return j.idToken;
}

async function dados(){
  if(process.env.GASTOS_JSON_FILE) return JSON.parse(fs.readFileSync(process.env.GASTOS_JSON_FILE,'utf8'));
  const t = await token();
  const r = await fetch(FB_DB+'/'+FB_PATH+'.json?auth='+t);
  if(!r.ok) throw new Error('leitura do Firebase recusada: HTTP '+r.status);
  const d = await r.json();
  if(!d || !d.lancamentos) throw new Error('o Firebase não devolveu lançamentos');
  /* lançamentos do iPhone que o app ainda não puxou (mesma regra do app) */
  if(d.pending && typeof d.pending==='object'){
    const ids = new Set(d.lancamentos.map(l=>l&&l.id));
    Object.values(d.pending).forEach(l=>{ if(l && l.id && !ids.has(l.id)) d.lancamentos.push(l) });
  }
  return d;
}

async function analisador(){
  const src = process.env.SEMANA_JS_FILE ? fs.readFileSync(process.env.SEMANA_JS_FILE,'utf8')
            : await (await fetch(SITE+'/semana-gastos.js?_='+Date.now())).text();
  const ctx = {window:{}, console}; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx);
  if(!ctx.SemanaGastos) throw new Error('semana-gastos.js não carregou');
  return ctx.SemanaGastos;
}

/* HTML das ações → texto do WhatsApp (*negrito*) */
function txt(h){
  return String(h).replace(/<b[^>]*>/g,'*').replace(/<\/b>/g,'*').replace(/<[^>]+>/g,'')
    .replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\*\s*\*/g,'');
}
const MESC = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function fD(s){ const d=new Date(s+'T12:00:00'); return d.getDate()+' '+MESC[d.getMonth()] }
function m0(n){ n=Math.round(+n||0); return (n<0?'-':'')+'CA$ '+String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function limpo(s){ return String(s).replace(/^[^\wÀ-ÿ]+/,'').trim() }

function mensagem(r){
  const ref = r.alvoSem>0 ? r.alvoSem : r.normalTot;
  const sinal = r.tot>ref*1.05 ? '🔴' : r.tot<ref*.95 ? '🟢' : '🟡';
  const L = [];
  L.push('📌 *Gastos da semana '+fD(r.seg)+' – '+fD(r.dom)+'*');
  L.push(sinal+' Gasto comum: *'+m0(r.tot)+'* ('+(r.alvoSem>0?'alvo '+m0(r.alvoSem):'seu normal '+m0(r.normalTot))+')');
  if(r.vaz.length){
    L.push(''); L.push('*Onde mais vazou* (acima do seu normal):');
    r.vaz.forEach((x,i)=> L.push((i+1)+'. '+limpo(x.nome)+': '+m0(x.sem)+' (normal '+m0(x.normal)+', +'+m0(x.exc)+')'));
  } else { L.push(''); L.push('Nenhum lugar fugiu do seu normal. 👍') }
  L.push(''); L.push('*O que fazer esta semana:*');
  r.acoes.forEach(a=> L.push('• '+txt(a)));
  L.push(''); L.push('Detalhes: '+SITE+'/relatorio-gastos.html#semana');
  return L.join('\n');
}

async function enviar(msg){
  const key = (process.env.CALLMEBOT_APIKEY||'').trim(), fone = (process.env.WHATSAPP_PHONE||'+14379718925').trim();
  if(!key){ console.log('AVISO: falta o secret CALLMEBOT_APIKEY. Nada foi enviado.'); process.exitCode = 1; return }
  const url = 'https://api.callmebot.com/whatsapp.php?phone='+encodeURIComponent(fone)+'&text='+encodeURIComponent(msg)+'&apikey='+encodeURIComponent(key);
  const r = await fetch(url); const corpo = await r.text();
  /* o CallMeBot responde 200 mesmo com erro; o texto diz se saiu */
  const plano = corpo.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  if(!r.ok || !/queued|sent|success/i.test(plano))
    throw new Error('CallMeBot recusou (HTTP '+r.status+'): '+plano.replace(key,'***').slice(0,160));
  console.log('Mensagem enviada ao WhatsApp.');
}

(async()=>{
  try{
    const d = await dados(); console.log('Dados lidos ('+(d.lancamentos||[]).length+' lançamentos).');
    const S = await analisador();
    const r = S.analisar(d, hojeHalifax());
    if(!r || !r.n){ console.log('Semana sem lançamentos; nada a enviar.'); return }
    const msg = mensagem(r);
    if(DRY){ console.log('--- DRY_RUN: mensagem que seria enviada ---\n'+msg); return }
    await enviar(msg);
  }catch(e){ console.log('ERRO: '+(e && e.message || e)); process.exitCode = 1 }
})();
