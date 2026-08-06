/* ══════════════════════════════════════════════════════════════════
   fix.js — correções da v2
   Versão 2026-08-01h · seis correções, cada uma isolada.

   MUDANÇA DESTA VERSÃO: antes as seis partes eram blocos soltos no
   mesmo arquivo. Um erro em qualquer uma derrubava todas as outras,
   sem aviso nenhum. Agora cada parte roda dentro do seu próprio
   try/catch: se uma falhar, as cinco restantes continuam valendo.

   E aparece um selo no alto da tela, ao lado do relógio:
     · "fix 01h" em verde  → tudo rodando
     · "fix ✗ N" em vermelho → N partes falharam; toque para ver quais

   INSTALAÇÃO: envie este arquivo para a pasta treinos-v2 pelo
   Add file → Upload files. Não é preciso editar o index.html.

   1) Botão "Começar" da capa
   2) Máscara de tempo na calculadora de pace
   3) Gráficos da aba Saúde legíveis no celular
   4) Gráficos da aba Evolução legíveis no celular
   5) Mapa de semanas da aba Treinos: nunca colapsa e enche a largura
   6) Aba Coach: cancelar treino, remanejar cada um, corrida no 2º treino,
      e incluir treino em dia de descanso ou cancelado
   ══════════════════════════════════════════════════════════════════ */

const FIX_VERSAO = '01h';
const FIX_FALHAS = [];

function PARTE(nome, fn){
  try{
    fn();
  }catch(erro){
    FIX_FALHAS.push(nome + ' — ' + (erro && erro.message ? erro.message : erro));
    console.error('fix.js · falhou em "' + nome + '":', erro);
  }
}

/* ═══════════ 1 e 2 ═══════════ */
/* ───────────── 1. CAPA ───────────── */
PARTE('capa', function(){
  const capa = document.getElementById('capa');
  const bt   = document.getElementById('btEntrar');
  if(!capa || !bt) return;

  let fechada = false;
  function fecharCapa(){
    if(fechada) return;
    fechada = true;
    capa.classList.add('saindo');
    setTimeout(function(){ capa.style.display = 'none' }, 520);
  }

  /* addEventListener convive com o onclick que o montarCapa() atribui
     depois, se ele chegar a rodar. Fechar duas vezes não faz nada.    */
  bt.addEventListener('click', fecharCapa);
  bt.addEventListener('touchend', function(e){ e.preventDefault(); fecharCapa() });

  capa.addEventListener('click', function(e){
    if(e.target === capa || e.target.closest('.miolo')) fecharCapa();
  });

  document.addEventListener('keydown', function(e){
    if(fechada) return;
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') fecharCapa();
  });
});

/* ───────────── 2. MÁSCARA DE TEMPO ───────────── */
PARTE('mascara de tempo', function(){
  function maskTime(el, modo){
    const max = modo === 'ms' ? 4 : 6;
    const d = String(el.value || '').replace(/\D/g, '').slice(0, max);
    let v;
    if(!d)                 v = '';
    else if(d.length <= 2) v = d;
    else if(modo === 'ms') v = d.slice(0,-2) + ':' + d.slice(-2);
    else if(d.length <= 4) v = d.slice(0,-2) + ':' + d.slice(-2);
    else                   v = d.slice(0,-4) + ':' + d.slice(-4,-2) + ':' + d.slice(-2);
    if(el.value !== v) el.value = v;
  }

  /* fase de captura: a máscara roda antes do calcSplits e do
     calcEstrategia, então os dois já leem o valor formatado */
  const MODOS = {cSplitTempo:'hms', eP1:'ms', eP2:'ms', eP3:'ms'};
  document.addEventListener('input', function(e){
    const modo = e.target && MODOS[e.target.id];
    if(modo) maskTime(e.target, modo);
  }, true);

  const alvo = document.getElementById('cSplitTempo');
  if(!alvo) return;
  alvo.setAttribute('maxlength', '8');
  alvo.setAttribute('enterkeyhint', 'done');
  alvo.setAttribute('autocomplete', 'off');

  ['eP1','eP2','eP3'].forEach(function(id){
    const e = document.getElementById(id);
    if(!e) return;
    e.setAttribute('inputmode', 'numeric');
    e.setAttribute('maxlength', '5');
    e.setAttribute('autocomplete', 'off');
  });

  const css = document.createElement('style');
  css.textContent =
    '.attempo{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}' +
    ".attempo button{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;" +
    'font-size:11.5px;font-weight:700;color:var(--tx2);background:var(--s2);' +
    'border-radius:20px;padding:6px 11px;transition:.15s}' +
    '.attempo button:active{transform:scale(.95)}' +
    '.attempo button:hover{background:var(--acc);color:var(--bg)}';
  document.head.appendChild(css);

  const extra = document.createElement('div');
  extra.innerHTML =
    '<span class="dica">Digite só os números — os dois-pontos entram sozinhos. ' +
    '<b style="color:var(--acc)">22200</b> vira <b style="color:var(--acc)">2:22:00</b>.</span>' +
    '<div class="attempo">' +
      ['2:22:00','2:30:00','1:48:00','55:00']
        .map(function(v){ return '<button type="button" data-t="' + v + '">' + v + '</button>' })
        .join('') +
    '</div>';
  alvo.parentNode.appendChild(extra);

  extra.querySelectorAll('[data-t]').forEach(function(b){
    b.onclick = function(){
      alvo.value = b.dataset.t;
      alvo.dispatchEvent(new Event('input', {bubbles:true}));
    };
  });
});


/* ═══════════ 3. GRÁFICOS DA ABA SAÚDE ═══════════
   Os quatro gráficos eram desenhados numa área de 680 × 200 e
   encolhidos para a largura do iPhone (~326 px): a fonte de 10 px
   virava 4,8 px e a altura de 200 virava 96 px. Agora a área é
   380 × 270, quase 1:1 com a tela.                              */
PARTE('graficos saude', function(){
'use strict';

/* ─────────── medidas ─────────── */
const W = 380, H = 270;
const ML = 42, MR = 14, MT = 22, MB = 40;
const IW = W - ML - MR, IH = H - MT - MB;
const LIMITE_SEMANA = 26;          // acima disso, agrupa por semana

/* ─────────── tipografia ─────────── */
const css = document.createElement('style');
css.textContent = `
#sBB text, #sSono text, #sHRV text, #sStress text{
  font-family:'JetBrains Mono',ui-monospace,monospace;
  font-variant-numeric:tabular-nums; font-size:13px; fill:var(--tx3)}
#sBB text.on, #sSono text.on, #sHRV text.on, #sStress text.on{fill:var(--tx);font-weight:700}
#sBB text.val, #sSono text.val, #sHRV text.val, #sStress text.val{font-size:15px;font-weight:700}
#sBB text.ref, #sSono text.ref, #sHRV text.ref, #sStress text.ref{font-size:12px}
.chsub{font-size:12.5px !important;line-height:1.55 !important}
.faselg{gap:14px !important;margin-top:13px !important}
.faselg span{font-size:12px !important}
.faselg i{width:10px !important;height:10px !important}
.anelnome{font-size:11px !important}
.anelstatus{font-size:13.5px !important}
.aneldesc{font-size:11.5px !important;line-height:1.5 !important}
.anelmeta span{font-size:10px !important}
.anelmeta b{font-size:13px !important}
`;
document.head.appendChild(css);

/* ─────────── auxiliares ─────────── */
const q = s => document.querySelector(s);

function grade(tk, y, rotulo){
  return tk.map(t =>
    `<line x1="${ML}" x2="${W-MR}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/>` +
    `<text x="${ML-8}" y="${y(t)+4.5}" text-anchor="end">${rotulo?rotulo(t):t}</text>`
  ).join('');
}

function eixoX(pts, x){
  if(!pts.length) return '';
  const n = pts.length;
  const marcas = n <= 3 ? pts.map((_,i)=>i)
               : n <= 8 ? [0, Math.floor(n/2), n-1]
               : [0, Math.floor(n/3), Math.floor(2*n/3), n-1];
  const vistos = new Set();
  return marcas.filter(i=>!vistos.has(i)&&vistos.add(i)).map((i,k,arr)=>{
    const d = dt(pts[i].d);
    const anc = k===0 ? 'start' : k===arr.length-1 ? 'end' : 'middle';
    return `<text class="${i===n-1?'on':''}" x="${x(i)}" y="${H-14}" text-anchor="${anc}">` +
           `${d.getDate()} ${MES3[d.getMonth()]}</text>`;
  }).join('');
}

/* rótulo do último valor, encostado no topo à direita */
function selo(txt, cor){
  return `<text class="val" x="${W-MR}" y="${MT-7}" text-anchor="end" fill="${cor}">${txt}</text>`;
}

const svg = (rot, corpo) =>
  `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${rot}">${corpo}</svg>`;

/* ═════════ BODY BATTERY ═════════ */
window.grafBodyBattery = function(bb){
  const host = q('#sBB'); if(!host) return;
  if(bb.length < 2){
    host.innerHTML = '<p class="ajuda">Sem leituras suficientes no período.</p>';
    q('#sBBsub').textContent = ''; return;
  }
  const sem = bb.length > LIMITE_SEMANA;
  const pts = sem ? porSemana(bb, ['max','min']) : bb;
  const tk = [0,25,50,75,100], y = v => MT + IH - (v/100)*IH;
  const passo = IW/pts.length, x = i => ML + passo*i + passo/2;
  const larg = Math.max(4, Math.min(sem?26:14, passo*0.66));
  const ult = pts[pts.length-1];
  const cor = v => v>=75?'var(--ok)' : v>=50?'var(--acc)' : v>=25?'var(--warn)':'var(--bad)';

  let s = `<defs><linearGradient id="gbb2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3FD98A" stop-opacity=".22"/>
      <stop offset="100%" stop-color="#3FD98A" stop-opacity="0"/></linearGradient></defs>`;
  s += grade(tk, y);
  const topo = pts.map((b,i)=>[x(i), y(b.max)]);
  const dTopo = spline(topo);
  s += `<path d="${dTopo}L${topo[topo.length-1][0]},${MT+IH}L${topo[0][0]},${MT+IH}Z" fill="url(#gbb2)"/>`;
  pts.forEach((b,i)=>{
    s += `<rect x="${x(i)-larg/2}" y="${y(b.max)}" width="${larg}" ` +
         `height="${Math.max(3, y(b.min)-y(b.max))}" rx="${Math.min(larg/2,6)}" ` +
         `fill="${cor(b.max)}" opacity=".9"/>`;
  });
  s += `<path d="${dTopo}" fill="none" stroke="var(--ok)" stroke-width="2.2" opacity=".6" stroke-linecap="round"/>`;
  s += `<circle cx="${x(pts.length-1)}" cy="${y(ult.max)}" r="5" fill="var(--bg)" stroke="${cor(ult.max)}" stroke-width="2.6"/>`;
  s += selo(Math.round(ult.max)+' / '+Math.round(ult.min), cor(ult.max));
  s += eixoX(pts, x);
  host.innerHTML = svg('Body Battery por '+(sem?'semana':'dia'), s);

  const mMax = Math.round(bb.reduce((a,b)=>a+b.max,0)/bb.length);
  const mMin = Math.round(bb.reduce((a,b)=>a+b.min,0)/bb.length);
  q('#sBBsub').innerHTML = `Cada barra vai do fundo ao pico de energia` +
    `${sem?' de uma semana':' do dia'}. No período, o pico médio foi <b>${mMax}</b> ` +
    `e o fundo médio <b>${mMin}</b>. O número no alto é a última leitura: pico e fundo.`;
};

/* ═════════ SONO ═════════ */
window.grafSono = function(sono){
  const host = q('#sSono'); if(!host) return;
  if(sono.length < 2){
    host.innerHTML = '<p class="ajuda">Sem noites suficientes no período.</p>';
    q('#sSonosub').textContent = ''; return;
  }
  const sem = sono.length > LIMITE_SEMANA;
  const pts = sem ? porSemana(sono, ['duracao','profundo','rem']) : sono;
  const topo = Math.max(9, Math.ceil(Math.max(...pts.map(n=>n.duracao)) + 0.5));
  const tk = ticks(0, topo, 4).filter(t=>t<=topo);
  const y = v => MT + IH - (v/topo)*IH;
  const passo = IW/pts.length, x = i => ML + passo*i + passo/2;
  const larg = Math.max(4, Math.min(sem?28:15, passo*0.7));
  const ult = pts[pts.length-1];

  let s = grade(tk, y, t => t+'h');
  /* faixa boa: 7 a 9 h */
  s += `<rect x="${ML}" y="${y(Math.min(9,topo))}" width="${IW}" ` +
       `height="${Math.max(0, y(7)-y(Math.min(9,topo)))}" fill="var(--ok)" opacity=".07"/>`;
  s += `<line x1="${ML}" x2="${W-MR}" y1="${y(7)}" y2="${y(7)}" stroke="var(--ok)" ` +
       `stroke-width="1.5" stroke-dasharray="5 4" opacity=".7"/>`;
  s += `<text class="ref" x="${W-MR}" y="${y(7)-7}" text-anchor="end" fill="var(--ok)">alvo 7h</text>`;

  pts.forEach((n,i)=>{
    const prof = n.profundo||0, rem = n.rem||0;
    const leve = Math.max(0, n.duracao - prof - rem);
    let base = 0;
    [[prof,'var(--acc)'],[rem,'var(--swim)'],[leve,'var(--s3)']].forEach(([v,c],k,arr)=>{
      if(v <= 0.02) return;
      const topoY = y(base+v), alt = Math.max(2, y(base)-y(base+v));
      const r = (k===arr.length-1 || base+v >= n.duracao-0.02) ? Math.min(larg/2,5) : 0;
      s += `<path d="M${x(i)-larg/2},${topoY+r} a${r},${r} 0 0 1 ${r},${-r} h${larg-2*r} ` +
           `a${r},${r} 0 0 1 ${r},${r} v${alt-r} h${-larg} Z" fill="${c}"/>`;
      base += v;
    });
  });
  const corS = ult.duracao>=7?'var(--ok)':ult.duracao>=6?'var(--warn)':'var(--bad)';
  s += selo(ult.duracao.toFixed(1)+' h', corS);
  s += eixoX(pts, x);
  host.innerHTML = svg('Fases do sono por '+(sem?'semana':'noite'), s);

  const md = +(sono.reduce((a,b)=>a+b.duracao,0)/sono.length).toFixed(1);
  const boas = sono.filter(n=>n.duracao>=7).length;
  q('#sSonosub').innerHTML = `${sem?'Cada barra é a média de uma semana. ':''}` +
    `Média de <b>${md} h</b> por noite. <b>${boas}</b> de ${sono.length} noites acima de 7 h. ` +
    `A faixa verde clara é onde a recuperação acontece.`;
};

/* ═════════ HRV ═════════ */
window.grafHRV = function(hrv, hv){
  const host = q('#sHRV'); if(!host) return;
  if(hrv.length < 3){
    host.innerHTML = '<p class="ajuda">Sem leituras de HRV suficientes.</p>';
    q('#sHRVsub').textContent = ''; return;
  }
  const base = hrv.map(h=>({d:h.d, v:hv(h)}));
  const sem = base.length > LIMITE_SEMANA;
  const pts = sem ? porSemana(base, ['v']) : base;
  const vals = base.map(b=>b.v);
  const tk = ticks(Math.min(...vals), Math.max(...vals), 4);
  const lo = tk[0], hi = tk[tk.length-1];
  const y = v => MT + IH - ((v-lo)/(hi-lo||1))*IH;
  const passo = IW/Math.max(1, pts.length-1), x = i => ML + passo*i;

  let s = grade(tk, y, t => t);
  if(sem){
    const cima = pts.map((p,i)=>[x(i), y(p.max_v)]);
    const baixo = pts.map((p,i)=>[x(i), y(p.min_v)]).reverse();
    const db = spline(baixo);
    s += `<path d="${spline(cima)} L${baixo[0][0]},${baixo[0][1]} ${db.slice(db.indexOf('C'))} Z" ` +
         `fill="rgba(201,242,78,.14)"/>`;
  } else {
    base.forEach((b,i)=>{ s += `<circle cx="${x(i)}" cy="${y(b.v)}" r="3.2" fill="#4A5768"/>` });
  }
  const linha = pts.map((p,i)=>[x(i), y(p.v)]);
  s += `<path d="${spline(linha)}" fill="none" stroke="var(--acc)" stroke-width="2.8" stroke-linecap="round"/>`;
  const u = linha[linha.length-1];
  s += `<circle cx="${u[0]}" cy="${u[1]}" r="6" fill="var(--bg)" stroke="var(--acc)" stroke-width="2.8"/>`;
  s += selo(Math.round(pts[pts.length-1].v)+' ms', 'var(--acc)');
  s += eixoX(pts, x);
  host.innerHTML = svg('HRV noturno', s);

  const a = vals[0], b2 = vals[vals.length-1];
  q('#sHRVsub').innerHTML = `${sem?'A linha é a média de cada semana; a faixa clara mostra a variação entre as noites. '
    :'Cada ponto é uma noite. '}De <b>${a} ms</b> para <b>${b2} ms</b> no período. ` +
    `Queda que se sustenta por vários dias costuma vir antes da fadiga.`;
};

/* ═════════ STRESS ═════════ */
window.grafStress = function(str){
  const host = q('#sStress'); if(!host) return;
  if(str.length < 2){
    host.innerHTML = '<p class="ajuda">Sem leituras de stress no período.</p>';
    q('#sStresssub').textContent = ''; return;
  }
  const sem = str.length > LIMITE_SEMANA;
  const pts = sem ? porSemana(str, ['avg','max']) : str;
  const tk = [0,25,50,75,100], y = v => MT + IH - (v/100)*IH;
  const passo = IW/Math.max(1, pts.length-1), x = i => ML + passo*i;
  const linha = pts.map((p,i)=>[x(i), y(p.avg)]);

  let s = `<defs><linearGradient id="gstr2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5C544" stop-opacity=".32"/>
      <stop offset="100%" stop-color="#F5C544" stop-opacity="0"/></linearGradient></defs>`;
  s += grade(tk, y);
  s += `<line x1="${ML}" x2="${W-MR}" y1="${y(50)}" y2="${y(50)}" stroke="var(--tx3)" ` +
       `stroke-width="1" stroke-dasharray="4 5" opacity=".55"/>`;
  s += `<text class="ref" x="${W-MR}" y="${y(50)-7}" text-anchor="end">alto acima de 50</text>`;
  const d = spline(linha);
  s += `<path d="${d}L${linha[linha.length-1][0]},${MT+IH}L${linha[0][0]},${MT+IH}Z" fill="url(#gstr2)"/>`;
  s += `<path d="${d}" fill="none" stroke="var(--warn)" stroke-width="2.8" stroke-linecap="round"/>`;
  const u = linha[linha.length-1];
  s += `<circle cx="${u[0]}" cy="${u[1]}" r="6" fill="var(--bg)" stroke="var(--warn)" stroke-width="2.8"/>`;
  s += selo(Math.round(pts[pts.length-1].avg), 'var(--warn)');
  s += eixoX(pts, x);
  host.innerHTML = svg('Stress diário', s);

  const md = Math.round(str.reduce((a,b)=>a+b.avg,0)/str.length);
  const altos = str.filter(x2=>x2.avg>50).length;
  q('#sStresssub').innerHTML = `${sem?'Média de cada semana. ':''}Média do período: <b>${md}</b>.` +
    `${altos?` <b>${altos}</b> dias acima de 50.`:''} Abaixo de 50 o corpo está recuperando; acima, gastando.`;
};

/* redesenha se a aba Saúde já estiver aberta quando este arquivo carregar */
if(typeof renderSaude === 'function' && typeof ST === 'object' && ST.aba === 'saude'){
  try{ renderSaude() }catch(e){}
}

});


/* ═══════════ 4. GRÁFICOS DA ABA EVOLUÇÃO ═══════════
   Mesmo problema da aba Saúde: área de 680 de largura encolhida para
   ~326 px no iPhone, ou seja 48% — fonte de 10 px virava 4,8 px.
   Pior nos dois gráficos de nuvem de pontos, que precisam de área
   mais quadrada para as duas escalas ficarem comparáveis.

   Agora: 380 de largura (escala 0,86) e altura maior, 300 nas nuvens.
   Os pontos também cresceram, porque com 3 px ninguém acerta o toque. */
PARTE('graficos evolucao', function(){
'use strict';

const W = 380;
const ML = 46, MR = 16, MT = 24, MB = 42;
const IW = W - ML - MR;

const css = document.createElement('style');
css.textContent = `
#pacePlot text, #effPlot text, #cadPlot text{
  font-family:'JetBrains Mono',ui-monospace,monospace;
  font-variant-numeric:tabular-nums; font-size:13px; fill:var(--tx3)}
#pacePlot text.on, #effPlot text.on, #cadPlot text.on{fill:var(--tx);font-weight:700}
#pacePlot text.val, #effPlot text.val, #cadPlot text.val{font-size:15px;font-weight:700}
#pacePlot text.eixo, #effPlot text.eixo, #cadPlot text.eixo{font-size:11.5px;opacity:.8}
.leg{gap:8px 16px !important;margin-top:15px !important}
.leg span{font-size:12.5px !important}
.note{font-size:12.5px !important;line-height:1.6 !important}
.sub{font-size:14px !important}
.tip{font-size:12.5px !important;padding:11px 13px !important}
`;
document.head.appendChild(css);

const q = s => document.querySelector(s);
const g = (H, rot, corpo) =>
  `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${rot}">${corpo}</svg>`;

function grade(tk, y, rot){
  return tk.map(t =>
    `<line x1="${ML}" x2="${W-MR}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/>` +
    `<text x="${ML-9}" y="${y(t)+4.5}" text-anchor="end">${rot?rot(t):t}</text>`).join('');
}
const selo = (H, txt, cor) =>
  `<text class="val" x="${W-MR}" y="${MT-8}" text-anchor="end" fill="${cor}">${txt}</text>`;

/* ─────────── PACE ─────────── */
window.chartPace = function(){
  const H = 290, IH = H - MT - MB;
  const D = ST.runs.filter(r=>noPeriodo(r) && (r.mod||'corrida')==='corrida');
  const runs = D.filter(r=>!r.walk);
  const host = q('#pacePlot');
  if(runs.length < 6){
    host.innerHTML = `<p class="note" style="border:0;padding:0;margin:0">Só ${runs.length} corrida${runs.length===1?'':'s'} em ${ST.periodo} dias. Aumente o intervalo na barra acima para ver a tendência.</p>`;
    q('#paceSub').textContent='Período curto demais'; q('#paceTag').textContent='—'; return;
  }
  const span = Math.max(...D.map(r=>r.d)) || 1;
  const wk = {};
  runs.forEach(r=>{ const k=Math.floor(r.d/7); (wk[k]=wk[k]||[]).push(r.pace) });
  const stats = Object.keys(wk).map(Number).sort((a,b)=>b-a)
    .map(k=>({k, med:med(wk[k]), lo:quant(wk[k],.25), hi:quant(wk[k],.75)}));
  const all = runs.map(r=>r.pace);
  const tk = timeTicks(Math.min(...all), Math.max(...all), 4);
  const lo = tk[0], hi = tk[tk.length-1];
  const x = d => ML + IW - (d/span)*IW;
  const y = v => MT + ((v-lo)/(hi-lo))*IH;     /* mais rápido em cima */

  let s = grade(tk, y, t=>mmss(t));
  if(stats.length > 1){
    const up = stats.map(a=>[x(a.k*7+3), y(a.lo)]);
    const dn = stats.map(a=>[x(a.k*7+3), y(a.hi)]).reverse();
    const dd = spline(dn);
    s += `<path d="${spline(up)} L${dn[0][0]},${dn[0][1]} ${dd.slice(dd.indexOf('C'))} Z" fill="rgba(201,242,78,.15)"/>`;
  }
  runs.forEach(r=>{ s += `<circle cx="${x(r.d)}" cy="${y(r.pace)}" r="3.6" fill="#3A4757"/>` });
  s += `<path d="${spline(stats.map(a=>[x(a.k*7+3), y(a.med)]))}" fill="none" stroke="#C9F24E" stroke-width="3" stroke-linecap="round"/>`;
  const last = stats[stats.length-1];
  s += `<circle cx="${x(last.k*7+3)}" cy="${y(last.med)}" r="6" fill="#0A0D12" stroke="#C9F24E" stroke-width="3"/>`;
  s += `<line class="cross" x1="0" x2="0" y1="${MT}" y2="${MT+IH}" stroke="#8FA0B4" stroke-dasharray="3 3" opacity="0"/>`;
  s += selo(H, mmss(last.med)+'/km', '#C9F24E');
  [span, Math.round(span*.5), 0].forEach((d,i,arr)=>{
    const anc = i===0?'start' : i===arr.length-1?'end' : 'middle';
    s += `<text class="${d===0?'on':''}" x="${x(d)}" y="${H-15}" text-anchor="${anc}">${d===0?'hoje':dLabel(d)}</text>`;
  });
  host.innerHTML = g(H, 'Pace por corrida com mediana semanal', s);

  hover(host, px=>{
    let b=null, bd=1e9;
    runs.forEach(r=>{ const dd=Math.abs(x(r.d)-px); if(dd<bd){bd=dd;b=r} });
    return b ? {...b, x:x(b.d)} : null;
  }, r=>`<div class="t">${dLabel(r.d)}</div>
      <div class="r"><i>Pace</i><b>${mmss(r.pace)}/km</b></div>
      <div class="r"><i>Distância</i><b>${r.km.toFixed(1)} km</b></div>
      <div class="r"><i>FC</i><b>${isFinite(r.fc)&&r.fc>0?r.fc+' bpm':'—'}</b></div>`);

  const ganho = stats[0].med - last.med;
  q('#paceSub').innerHTML = `Mediana da semana em <b>${mmss(last.med)}/km</b>` +
    (ganho>0 ? ` — <b>${Math.round(ganho)}s/km mais rápido</b> que no início` : '');
  q('#paceTag').textContent = ganho>0 ? `−${Math.round(ganho)}s/km` : 'estável';
};

/* ─────────── EFICIÊNCIA AERÓBICA ─────────── */
window.chartEff = function(){
  const H = 320, IH = H - MT - MB;
  const runs = ST.runs.filter(r=>noPeriodo(r) && !r.walk && (r.mod||'corrida')==='corrida' && isFinite(r.fc) && r.fc>60);
  const host = q('#effPlot');
  if(runs.length < 8){
    host.innerHTML = `<p class="note" style="border:0;padding:0;margin:0">Esta comparação precisa de 8 corridas com frequência cardíaca. Em ${ST.periodo} dias há ${runs.length}. Aumente o intervalo na barra acima.</p>`;
    q('#effSub').textContent='Período curto demais'; q('#effTag').textContent='—'; q('#effNote').textContent=''; return;
  }
  const half = Math.max(...runs.map(r=>r.d))/2;
  const px = runs.map(r=>r.pace), py = runs.map(r=>r.fc);
  const xt = timeTicks(Math.min(...px), Math.max(...px), 3);
  const yt = ticks(Math.min(...py), Math.max(...py), 4);
  const xlo=xt[0], xhi=xt[xt.length-1], ylo=yt[0], yhi=yt[yt.length-1];
  const X = v => ML + IW - ((v-xlo)/(xhi-xlo))*IW;
  const Y = v => MT + IH - ((v-ylo)/(yhi-ylo))*IH;

  let s = grade(yt, Y);
  xt.forEach(t=>{ s += `<text x="${X(t)}" y="${H-22}" text-anchor="middle">${mmss(t)}</text>` });
  runs.forEach(r=>{
    const novo = r.d < half;
    s += `<circle cx="${X(r.pace)}" cy="${Y(r.fc)}" r="${novo?5.4:4.6}" fill="${novo?'#C9F24E':'#4A5768'}" opacity="${novo?.88:.72}"/>`;
  });
  const fit = grp=>{
    const n=grp.length, sx=grp.reduce((a,b)=>a+b.pace,0), sy=grp.reduce((a,b)=>a+b.fc,0);
    const sxy=grp.reduce((a,b)=>a+b.pace*b.fc,0), sxx=grp.reduce((a,b)=>a+b.pace*b.pace,0);
    const m=(n*sxy-sx*sy)/(n*sxx-sx*sx||1); return {m, b:(sy-m*sx)/n};
  };
  const gA = runs.filter(r=>r.d>=half), gB = runs.filter(r=>r.d<half);
  [[gA,'#4A5768'],[gB,'#C9F24E']].forEach(([grp,c])=>{
    if(grp.length < 3) return;
    const {m,b} = fit(grp);
    s += `<line x1="${X(xlo+12)}" y1="${Y(m*(xlo+12)+b)}" x2="${X(xhi-12)}" y2="${Y(m*(xhi-12)+b)}" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>`;
  });
  s += `<text class="eixo" x="${W-MR}" y="${H-5}" text-anchor="end">mais rápido →</text>`;
  s += `<text class="eixo" x="${ML-9}" y="${MT-9}" text-anchor="end">bpm</text>`;
  host.innerHTML = g(H, 'Frequência cardíaca por pace, dois períodos', s);

  hover(host, (mx,my)=>{
    let b=null, bd=1e9;
    runs.forEach(r=>{ const d=Math.hypot(X(r.pace)-mx, Y(r.fc)-my); if(d<bd){bd=d;b=r} });
    return bd<45 && b ? {...b, x:X(b.pace)} : null;
  }, r=>`<div class="t">${dLabel(r.d)}</div>
      <div class="r"><i>Pace</i><b>${mmss(r.pace)}/km</b></div>
      <div class="r"><i>FC</i><b>${r.fc} bpm</b></div>`);

  if(gA.length>=3 && gB.length>=3){
    const ref = med(runs.map(r=>r.pace));
    const a = fit(gA), b = fit(gB);
    const queda = Math.round((a.m*ref+a.b) - (b.m*ref+b.b));
    q('#effSub').innerHTML = `No mesmo pace de <b>${mmss(ref)}/km</b>, seu coração trabalha <b>${Math.abs(queda)} bpm ${queda>0?'mais baixo':'mais alto'}</b> que há três meses`;
    q('#effTag').textContent = (queda>0?'−':'+') + Math.abs(queda) + ' bpm';
    q('#effTag').className = 'tag ' + (queda>0?'ok':'warn');
  }
  q('#effNote').innerHTML = `Cada ponto é uma corrida. Se a nuvem verde está deslocada para <b>baixo e para a direita</b> em relação à cinza, você ganhou base aeróbica: mais velocidade com menos esforço cardíaco. É mais confiável que o pace sozinho, que depende do dia, do terreno e do calor.`;
};

/* ─────────── CADÊNCIA ─────────── */
window.chartCad = function(){
  const H = 320, IH = H - MT - MB;
  const runs = ST.runs.filter(r=>noPeriodo(r) && !r.walk && (r.mod||'corrida')==='corrida' && isFinite(r.cad) && r.cad>120);
  const host = q('#cadPlot');
  if(runs.length < 8){
    host.innerHTML = `<p class="note" style="border:0;padding:0;margin:0">Só ${runs.length} corrida${runs.length===1?'':'s'} com cadência em ${ST.periodo} dias. Aumente o intervalo na barra acima.</p>`;
    q('#cadSub').textContent='Período curto demais'; q('#cadTag').textContent='—'; q('#cadNote').textContent=''; return;
  }
  const px = runs.map(r=>r.pace), py = runs.map(r=>r.cad);
  const xt = timeTicks(Math.min(...px), Math.max(...px), 3);
  const yt = ticks(Math.min(...py), Math.max(...py), 4);
  const xlo=xt[0], xhi=xt[xt.length-1], ylo=yt[0], yhi=yt[yt.length-1];
  const X = v => ML + IW - ((v-xlo)/(xhi-xlo))*IW;
  const Y = v => MT + IH - ((v-ylo)/(yhi-ylo))*IH;
  const esp = p => 150 + (430-p)*.115;

  let s = grade(yt, Y);
  const band = [];
  for(let p=xlo; p<=xhi; p+=6) band.push([X(p), Y(esp(p)+5)]);
  for(let p=xhi; p>=xlo; p-=6) band.push([X(p), Y(esp(p)-5)]);
  s += `<polygon points="${band.map(p=>p.join(',')).join(' ')}" fill="rgba(63,217,138,.14)"/>`;
  xt.forEach(t=>{ s += `<text x="${X(t)}" y="${H-22}" text-anchor="middle">${mmss(t)}</text>` });
  runs.forEach(r=>{ s += `<circle cx="${X(r.pace)}" cy="${Y(r.cad)}" r="5" fill="#C9F24E" opacity=".82"/>` });
  s += `<text class="eixo" x="${W-MR}" y="${H-5}" text-anchor="end">mais rápido →</text>`;
  s += `<text class="eixo" x="${ML-9}" y="${MT-9}" text-anchor="end">spm</text>`;
  host.innerHTML = g(H, 'Cadência por pace', s);

  hover(host, (mx,my)=>{
    let b=null, bd=1e9;
    runs.forEach(r=>{ const d=Math.hypot(X(r.pace)-mx, Y(r.cad)-my); if(d<bd){bd=d;b=r} });
    return bd<45 && b ? {...b, x:X(b.pace)} : null;
  }, r=>`<div class="t">${dLabel(r.d)}</div>
      <div class="r"><i>Cadência</i><b>${r.cad} spm</b></div>
      <div class="r"><i>Pace</i><b>${mmss(r.pace)}/km</b></div>`);

  const rec = runs.slice(0,10);
  const mc = Math.round(med(rec.map(r=>r.cad))), mp = med(rec.map(r=>r.pace));
  const alvo = Math.round(esp(mp)), ok = Math.abs(mc-alvo) <= 5;
  q('#cadSub').innerHTML = `<b>${mc} spm</b> no pace de <b>${mmss(mp)}/km</b> — ` +
    (ok ? 'dentro do esperado' : `${Math.abs(mc-alvo)} spm ${mc<alvo?'abaixo':'acima'} do esperado`);
  q('#cadTag').textContent = ok ? 'Coerente' : 'Revisar';
  q('#cadTag').className = 'tag ' + (ok?'ok':'warn');
  q('#cadNote').innerHTML = `Cadência não tem número ideal fixo: ela sobe junto com a velocidade. Comparar seus <b>${mc} spm</b> a um alvo de 180 spm — medido em atletas de elite em prova — não diz nada útil. A faixa verde é o esperado <b>para o seu pace</b>.`;
};

if(typeof renderEvolucao === 'function' && typeof ST === 'object' && ST.aba === 'evolucao'){
  try{ renderEvolucao() }catch(e){}
}

});


/* ═══════════ 5. MAPA DE SEMANAS DA ABA TREINOS ═══════════
   O mapa desenha uma coluna por semana com célula fixa de 13 px. Com o
   intervalo em 7 dias sobra UMA semana — duas colunas de 13 px grudadas
   na borda esquerda, impossíveis de acertar com o dedo.

   Duas mudanças:
   · piso de 10 semanas, para o mapa nunca colapsar. Ele é um panorama;
     não faz sentido encolher junto com o filtro das listas de baixo.
   · célula calculada pela largura disponível, entre 13 e 40 px, em vez
     de fixa. Com 10 semanas num iPhone dá ~29 px — dedo acerta.
   Acima de 24 semanas volta a 13 px e o mapa rola de lado, como antes. */
PARTE('mapa de semanas', function(){
'use strict';

const GAP = 3, MIN_SEM = 10, MAX_SEM = 26, CEL_MIN = 13, CEL_MAX = 40;

const css = document.createElement('style');
css.textContent = `
.mcell{width:var(--mc,13px) !important;height:var(--mc,13px) !important;
  border-radius:calc(var(--mc,13px) / 4) !important}
.mdias span{height:var(--mc,13px) !important;line-height:var(--mc,13px) !important;
  font-size:clamp(8px, calc(var(--mc,13px) * .5), 12px) !important}
.mlab span{width:var(--mc,13px) !important;
  font-size:clamp(8px, calc(var(--mc,13px) * .5), 12px) !important}
.mfoot{font-size:11.5px !important}
.mfoot i{width:13px !important;height:13px !important}
`;
document.head.appendChild(css);

const COR = {corrida:'var(--run)', bike:'var(--bike)', natacao:'var(--swim)', forca:'var(--gym)'};

function redesenhar(){
  const host = document.getElementById('tMapa');
  if(!host || typeof ST === 'undefined' || !ST.runs) return;

  /* quantas semanas cabem/valem */
  const SEM = Math.max(MIN_SEM, Math.min(MAX_SEM, Math.ceil(ST.periodo / 7)));
  const larg = host.clientWidth || 320;
  let cel = Math.floor((larg - (SEM - 1) * GAP) / SEM);
  cel = Math.max(CEL_MIN, Math.min(CEL_MAX, cel));
  document.documentElement.style.setProperty('--mc', cel + 'px');

  /* o mapa mostra a própria janela, não a do filtro das listas */
  const ini = segundaDe(addD(HOJE, -(SEM - 1) * 7));
  const dentro = ST.runs.filter(r => addD(HOJE, -r.d) >= ini);
  const porDia = {};
  dentro.forEach(r => { const k = iso(addD(HOJE, -r.d)); (porDia[k] = porDia[k] || []).push(r) });
  const maxMin = Math.max(...Object.values(porDia).map(v =>
    v.reduce((a, b) => a + duracaoDe(b), 0) / 60), 1);

  let colunas = '', rotulos = '', mesAnt = -1;
  for(let w = 0; w < SEM; w++){
    const iniSem = addD(ini, w * 7);
    const mostra = iniSem.getMonth() !== mesAnt;
    if(mostra) mesAnt = iniSem.getMonth();
    rotulos += `<span>${mostra ? MES3[iniSem.getMonth()][0].toUpperCase() : ''}</span>`;
    let celulas = '';
    for(let d = 0; d < 7; d++){
      const dia = addD(iniSem, d), k = iso(dia), its = porDia[k] || [];
      if(dia > HOJE){ celulas += '<div class="mcell" style="opacity:.25"></div>'; continue }
      if(!its.length){ celulas += '<div class="mcell"></div>'; continue }
      const min = its.reduce((a, b) => a + duracaoDe(b), 0) / 60;
      const dom = its.reduce((a, b) => duracaoDe(b) > duracaoDe(a) ? b : a);
      const op = (0.35 + 0.65 * Math.min(1, min / maxMin)).toFixed(2);
      const cor = dom.walk ? 'var(--rest)' : (COR[dom.mod] || 'var(--rest)');
      celulas += `<div class="mcell on" style="background:${cor};opacity:${op}" ` +
        `data-sem2="${iso(segundaDe(dia))}" ` +
        `title="${dia.getDate()} ${MES3[dia.getMonth()]} · ${Math.round(min)} min"></div>`;
    }
    colunas += `<div class="mcol">${celulas}</div>`;
  }
  host.innerHTML = `<div><div class="mlab">${rotulos}</div><div class="mapa-in">${colunas}</div></div>`;

  /* título e contagem passam a falar da janela do mapa */
  const card = host.closest('.card');
  const h2 = card && card.querySelector('h2');
  if(h2) h2.textContent = `Últimas ${SEM} semanas`;
  const tag = document.getElementById('tMapaTag');
  if(tag) tag.textContent = Object.keys(porDia).length + ' dias ativos';

  /* clicar numa semana abre o mês correspondente, como antes.
     Em vez de mexer no estado interno, aciono o próprio cabeçalho do mês. */
  host.querySelectorAll('[data-sem2]').forEach(c => {
    c.onclick = () => {
      const d = dt(c.dataset.sem2);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const bloco = document.getElementById('w-' + k);
      if(!bloco){                       // mês fora do filtro atual das listas
        const t = document.getElementById('tMapaAviso');
        if(t) t.textContent = 'Esse mês está fora do intervalo escolhido acima.';
        return;
      }
      if(!bloco.classList.contains('open')){
        const cab = bloco.querySelector('[data-m]');
        if(cab) cab.click();
      }
      bloco.scrollIntoView({behavior:'smooth', block:'start'});
    };
  });
}

/* roda depois do render original, sem alterá-lo */
if(typeof renderTreinos === 'function'){
  const original = renderTreinos;
  window.renderTreinos = function(){
    const r = original.apply(this, arguments);
    try{ redesenhar() }catch(e){ console.warn('mapa:', e.message) }
    return r;
  };
}

/* recalcula ao girar o aparelho ou mudar a largura */
let t = null;
window.addEventListener('resize', () => {
  clearTimeout(t);
  t = setTimeout(() => { if(ST && ST.aba === 'treinos') try{ redesenhar() }catch(e){} }, 200);
});

if(typeof ST === 'object' && ST.aba === 'treinos'){ try{ redesenhar() }catch(e){} }

});


/* ═══════════ 6. ABA COACH — cancelar, remanejar e segundo treino ═══════════
   Três coisas que faltavam:

   1) Cancelar um treino. Só existia "mover para outro dia". O cancelamento
      fica guardado em ST.trocas, que já é sincronizado entre aparelhos, e
      pode ser desfeito.
   2) Remanejar cada treino do dia por conta própria. O botão de mover só
      existia no treino principal; o segundo treino ficava preso ao dia.
   3) Corrida na lista de segundo treino. O app oferecia só academia,
      natação e bike, por uma regra fixa de "não somar impacto". A regra
      virou aviso: aparece o alerta quando o dia já é pesado, mas a
      decisão passa a ser sua.
   ══════════════════════════════════════════════════════════════════════ */
PARTE('aba coach', function(){
'use strict';

const css = document.createElement('style');
css.textContent = `
.btn-cancelar{width:100%;margin:8px 14px 16px;width:calc(100% - 28px);padding:12px;
  border-radius:13px;background:transparent;border:1.5px solid var(--s3);
  color:var(--tx3);font-size:12.5px;font-weight:700;transition:.15s}
.btn-cancelar:hover{border-color:var(--bad);color:var(--bad);background:var(--bad-wash)}
.btn-voltar{width:100%;margin-top:16px;padding:13px;border-radius:13px;
  background:var(--acc-wash);color:var(--acc);font-size:13px;font-weight:700}
.opt-grupo{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  color:var(--tx3);margin:16px 0 7px;padding-left:2px}
.opt-grupo:first-child{margin-top:4px}
.cancelado{padding:30px 20px;text-align:center}
.cancelado .tagc{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:var(--warn);background:var(--warn-wash);
  padding:4px 10px;border-radius:6px;margin-bottom:12px}
.cancelado h2{margin:0;font-size:17px;font-weight:700}
.cancelado p{margin:8px 0 0;font-size:13px;color:var(--tx2);line-height:1.5}
.cancelado.compacto{padding:14px 16px;text-align:left;display:flex;align-items:center;gap:12px}
.cancelado.compacto .tagc{margin:0;flex:1}
.cancelado.compacto .btn-voltar{width:auto;margin:0;padding:9px 14px;font-size:12px;flex:none}
`;
document.head.appendChild(css);

const cancelado = k => !!(ST.trocas && ST.trocas[k] && ST.trocas[k].cancelado);

/* ── 1. dias cancelados somem do plano depois de cada remontagem ── */
if(typeof rebuild === 'function'){
  const original = rebuild;
  window.rebuild = function(){
    const r = original.apply(this, arguments);
    Object.keys(ST.trocas || {}).forEach(k => {
      if(ST.trocas[k] && ST.trocas[k].cancelado) delete ST.plano[k];
    });
    return r;
  };
  window.rebuild();
}

/* ── 2. segundo treino: lista completa, com corrida ── */
/* Catálogo completo. Os volumes NÃO são fixos: quando há um objetivo
   ativo, cada treino é montado pelo montarSessao() do próprio app, que
   escala pela fase do ciclo e pelo seu pace de limiar — igual ao que
   acontece quando você troca o treino principal. Os números abaixo são
   só a reserva, para quando ainda não há prova escolhida. */
const OPCOES = [
  {g:'Corrida', mod:'corrida', foco:'regenerativo', t:'Regenerativo', i:'leve',
   d:'Trote bem leve. Recuperação ativa, não é treino.', min:25, km:4},
  {g:'Corrida', mod:'corrida', foco:'facil', t:'Rodagem leve', i:'leve',
   d:'Volume confortável, dá para conversar o tempo todo.', min:35, km:6},
  {g:'Corrida', mod:'corrida', foco:'longo', t:'Treino longo', i:'volume',
   d:'A sessão mais próxima da exigência da prova.', min:75, km:12},
  {g:'Corrida', mod:'corrida', foco:'progressivo', t:'Progressivo', i:'moderado',
   d:'Três blocos acelerando. Termina forte, sem quebrar.', min:48, km:8},
  {g:'Corrida', mod:'corrida', foco:'fartlek', t:'Fartlek', i:'forte',
   d:'Jogo de ritmo pela sensação, sem olhar o relógio.', min:45, km:8},
  {g:'Corrida', mod:'corrida', foco:'limiar', t:'Ritmo de limiar', i:'forte',
   d:'Confortavelmente difícil. O que mais muda o resultado.', min:40, km:7},
  {g:'Corrida', mod:'corrida', foco:'intervalado', t:'Intervalado', i:'forte',
   d:'Tiros de 800 m em ritmo forte. Potência aeróbica.', min:45, km:8},
  {g:'Corrida', mod:'corrida', foco:'subidas', t:'Subidas', i:'forte',
   d:'Ladeira em série. Força sem o impacto do intervalado.', min:50, km:8},
  {g:'Corrida', mod:'corrida', foco:'sprint', t:'Tiros curtos', i:'forte',
   d:'100 m quase máximos com descanso completo. Mecânica e velocidade.', min:45, km:7},

  {g:'Bike', mod:'bike', foco:'bikeFacil', t:'Giro regenerativo', i:'leve',
   d:'Leve, sem carga, 30 a 40 min.', min:35, km:16},
  {g:'Bike', mod:'bike', foco:'bikeLimiar', t:'Limiar na bike', i:'forte',
   d:'Blocos firmes e constantes, sem oscilar.', min:60, km:28},
  {g:'Bike', mod:'bike', foco:'bikeInt', t:'Intervalado na bike', i:'forte',
   d:'Séries de 4 min forte, cadência acima de 85 rpm.', min:60, km:26},
  {g:'Bike', mod:'bike', foco:'bikeLongo', t:'Longo na bike', i:'volume',
   d:'Resistência e ensaio de alimentação.', min:110, km:50},

  {g:'Natação', mod:'natacao', foco:'natTec', t:'Técnica', i:'leve',
   d:'Educativos e braçada longa. Zero impacto.', min:35, metros:1400},
  {g:'Natação', mod:'natacao', foco:'natInt', t:'Séries', i:'forte',
   d:'100 m fortes com descanso curto.', min:40, metros:1600},
  {g:'Natação', mod:'natacao', foco:'natLimiar', t:'Ritmo', i:'moderado',
   d:'Blocos de 400 m firmes e constantes.', min:45, metros:1800},
  {g:'Natação', mod:'natacao', foco:'natLongo', t:'Longo', i:'volume',
   d:'Distância contínua, sem parar.', min:50, metros:2000},

  {g:'Academia', mod:'forca', foco:'forca', t:'Sessão da semana', i:'moderado',
   d:'Alterna pernas e costas conforme a semana.', min:50},
];

/* monta o treino usando o motor do próprio app, quando possível */
function montarExtra(k, o){
  let base = null;
  const obj = objetivoAtivo();
  if(obj && obj.data){
    try{
      const semAte = Math.max(1, Math.ceil(diff(k, obj.data) / 7));
      base = montarSessao(k, obj, {f:o.foco, m:o.mod}, fase(semAte),
                          semAte, Math.min(obj.sem, 26));
    }catch(e){ base = null }
  }
  const x = Object.assign({}, base || {}, {
    id:'x' + k, data:k, mod:o.mod, foco:o.foco, extra:true
  });
  delete x.fase;
  if(!x.min) x.min = o.min;
  if(o.km && !x.km) x.km = o.km;
  if(o.metros && !x.metros) x.metros = o.metros;
  if(o.mod === 'forca'){
    const sid = x.sessao || sessaoAcademiaDe(k);
    x.sessao = sid;
    x.titulo = SESSOES_ACADEMIA[sid].nome;
  }
  if(!x.titulo) x.titulo = o.g + ' — ' + o.t.toLowerCase();
  return x;
}

window.sheetAdicionar = function(k){
  const s = sessaoDe(k), d = dt(k);
  const pesado = s && ['intervalado','limiar','longo','longo2','brick','bikeLongo','prova'].includes(s.foco);
  let grupo = '';
  const lista = OPCOES.map((o, i) => {
    const cab = o.g !== grupo ? (grupo = o.g, `<div class="opt-grupo">${o.g}</div>`) : '';
    return cab + `<button class="opt" data-add="${i}">
      <span class="oi" style="background:${CORTAG[o.i]}22">
        <span style="width:11px;height:11px;border-radius:50%;background:${CORTAG[o.i]};display:block"></span></span>
      <span class="ot"><b>${o.t}</b><span>${o.d}</span></span>
      <span class="tipotag" style="color:${CORTAG[o.i]}">${o.i}</span></button>`;
  }).join('');

  abrir(`<h3>${s ? 'Segundo treino' : 'Incluir um treino'}</h3>
    <p class="sd">${DIA[dow(d)].replace(/^./, c => c.toUpperCase())}, ${fmt(k)}${s ? ` · já tem <b>${s.titulo}</b>` : ' · o plano não pôs treino neste dia'}.
      ${pesado ? '<br><span style="color:var(--warn)">O treino de hoje já é exigente. Somar carga forte aqui atrasa a recuperação.</span>' : ''}
      <br>Volume e ritmo saem do seu plano, pela fase do ciclo.</p>
    <div class="tipolista">${lista}</div>`);

  document.querySelector('#sheetIn').querySelectorAll('[data-add]').forEach(bt => {
    bt.onclick = () => {
      const x = montarExtra(k, OPCOES[+bt.dataset.add]);
      ST.extras[k] = x;
      delete ST.cache[x.id];
      fechar(); renderCoach(); persistir();
    };
  });
};

/* ── 3. bloco do segundo treino, agora com mover e cancelar ── */
window.blocoExtra = function(k){
  const x = ST.extras[k] || null;
  const s = sessaoDe(k);
  if(!x) return `<div class="addex"><button data-addex="${k}">` +
    (s ? '+ Adicionar segundo treino' : '+ Incluir um treino neste dia') + `</button></div>`;
  const ets = etapasDe(x), fe = feitasDe(x.id);
  const pct = Math.round(fe.length / ets.length * 100);
  const fim = fe.length >= ets.length;
  const cor = MOD[x.mod].c;
  return `<div class="extra" style="border-color:${cor}">
    <div class="exch">
      <span class="mod" style="color:${cor}">${s ? 'Segundo treino' : 'Treino incluído'} · ${MOD[x.mod].n}</span>
      <button class="exrem" data-remex="${k}" aria-label="Cancelar">×</button>
    </div>
    <h3>${x.titulo}</h3>
    <div class="exfacts">${x.min ? `<span class="mono">${x.min} min</span>` : ''}${x.metros ? `<span class="mono">${x.metros} m</span>` : ''}${x.km ? `<span class="mono">${x.km} km</span>` : ''}</div>
    <div class="ptrack" style="margin:12px 0 8px"><i style="width:${pct}%"></i></div>
    <div class="plab"><span>${fe.length} de ${ets.length} etapas</span><span>${pct}%</span></div>
    <div class="etapas" style="padding:6px 0 0">${ets.map(e => {
      const on = fe.includes(e.id);
      return `<button class="et ${on ? 'on' : ''}" data-ex="${e.id}">
        <span class="box">${CHK}</span>
        <span class="body"><span class="t">${e.t}</span><span class="d">${e.d}</span>
        ${e.tags.length ? `<span class="tags">${e.tags.map(t => `<span class="tg ${t.c || ''}">${t.t}</span>`).join('')}</span>` : ''}
        </span></button>`}).join('')}</div>
    <div class="acts" style="padding:6px 0 0">
      <button data-exmover="${k}">Mover dia</button>
      ${x.mod === 'forca' ? `<button data-exmotra="${k}">MOTRA</button>` : ''}
      <button class="${fim ? 'done' : 'pri'}" data-exok="${k}">${fim ? '✓ Concluído' : 'Concluir'}</button>
    </div>
    <button class="btn-cancelar" data-excancel="${k}" style="margin:0">Cancelar este treino</button>
  </div>`;
};

window.ligarExtra = function(k){
  const el = document.querySelector('#sess');
  const b = sel => el.querySelector(sel);
  if(b('[data-addex]')) b('[data-addex]').onclick = () => sheetAdicionar(k);
  const remover = () => {
    const x = ST.extras[k];
    if(x) delete ST.feitas[x.id];
    delete ST.extras[k]; delete ST.cache['x' + k];
    renderCoach(); persistir();
  };
  if(b('[data-remex]')) b('[data-remex]').onclick = remover;
  if(b('[data-excancel]')) b('[data-excancel]').onclick = remover;

  const x = ST.extras[k];
  if(!x) return;
  el.querySelectorAll('[data-ex]').forEach(bt => bt.onclick = () => {
    marcarEtapa(x.id, bt.dataset.ex);
    renderDia(); renderCal(); renderSemana(); persistir();
  });
  if(b('[data-exok]')) b('[data-exok]').onclick = () => {
    const ets = etapasDe(x);
    if(feitasDe(x.id).length >= ets.length) delete ST.feitas[x.id];
    else ST.feitas[x.id] = ets.map(e => e.id);
    renderDia(); renderCal(); renderSemana(); persistir();
  };
  if(b('[data-exmotra]')) b('[data-exmotra]').onclick = () => sheetMotra(x);
  if(b('[data-exmover]')) b('[data-exmover]').onclick = () => moverExtra(k);
};

/* ── 4. mover só o segundo treino ── */
function moverExtra(k){
  const opts = [];
  for(let i = -3; i <= 7; i++){
    const d = addD(dt(k), i), dia = iso(d);
    if(dia === k || d < HOJE) continue;
    opts.push({k:dia, d, livre:!ST.extras[dia]});
  }
  abrir(`<h3>Mover o segundo treino</h3>
    <p class="sd">Só este treino muda de dia. O treino principal de ${fmt(k)} fica onde está.<br>
      Dias em destaque ainda não têm segundo treino.</p>
    <div class="dgrid">${opts.map(o => `<button class="${o.livre ? 'on' : ''}" data-mvx="${o.k}">
      <div style="font-size:15px">${o.d.getDate()}</div>
      <div style="font-size:9.5px;opacity:.7;margin-top:3px">${DIA3[dow(o.d) - 1]}</div></button>`).join('')}</div>`);
  document.querySelector('#sheetIn').querySelectorAll('[data-mvx]').forEach(b => b.onclick = () => {
    const dest = b.dataset.mvx, x = ST.extras[k];
    if(!x) return fechar();
    const feitas = ST.feitas[x.id];
    delete ST.feitas[x.id]; delete ST.cache[x.id]; delete ST.extras[k];
    x.data = dest; x.id = 'x' + dest;
    ST.extras[dest] = x;
    if(feitas) ST.feitas[x.id] = feitas;
    ST.sel = dest;
    fechar(); renderCoach(); persistir();
  });
}

/* ── 5. cancelar o treino principal, com desfazer ── */
function cancelarPrincipal(k){
  const s = sessaoDe(k);
  if(!s) return;
  abrir(`<h3>Cancelar o treino?</h3>
    <p class="sd"><b>${s.titulo}</b> · ${fmt(k)}<br>
      O dia passa a contar como descanso. Isso não some com o plano: dá para
      voltar atrás a qualquer momento, aqui mesmo.</p>
    <button class="opt" id="cSim" style="justify-content:center">
      <span class="ot" style="flex:none"><b style="color:var(--bad)">Sim, cancelar</b></span></button>
    <button class="opt" id="cNao" style="justify-content:center">
      <span class="ot" style="flex:none"><b>Manter o treino</b></span></button>`);
  document.getElementById('cNao').onclick = fechar;
  document.getElementById('cSim').onclick = () => {
    ST.trocas[k] = {cancelado:true};
    delete ST.feitas[k]; delete ST.cache[k];
    fechar(); rebuild(); renderCoach(); persistir();
  };
}

function desfazerCancelamento(k){
  delete ST.trocas[k];
  rebuild(); renderCoach(); persistir();
}

/* ── 6. injeta os botões depois que o dia é desenhado ── */
if(typeof renderDia === 'function'){
  const original = renderDia;
  window.renderDia = function(){
    const r = original.apply(this, arguments);
    try{ ajustar() }catch(e){ console.warn('coach:', e.message) }
    return r;
  };
}

function ajustar(){
  const el = document.querySelector('#sess');
  if(!el) return;
  const k = ST.sel;
  const s = sessaoDe(k);

  /* ── dia sem treino principal: descanso do plano ou cancelado por você ── */
  if(!s){
    const temExtra = !!ST.extras[k];
    const rd = el.querySelector('.restday') || el.querySelector('.cancelado');

    if(rd){
      if(cancelado(k)){
        /* com treino incluído, o aviso vira uma tarja fina: o dia deixou
           de ser descanso, mas a opção de restaurar continua à mão */
        rd.className = temExtra ? 'cancelado compacto' : 'cancelado';
        rd.innerHTML = temExtra
          ? `<div class="tagc">Treino do plano cancelado</div>
             <button class="btn-voltar" id="btVoltar">Restaurar</button>`
          : `<div class="tagc">Treino cancelado</div>
             <h2>Dia livre</h2>
             <p>Você cancelou o treino que o plano tinha posto aqui.
                Pode restaurá-lo, ou incluir outro no lugar.</p>
             <button class="btn-voltar" id="btVoltar">Restaurar o treino do plano</button>`;
        const b = document.getElementById('btVoltar');
        if(b) b.onclick = () => desfazerCancelamento(k);
      } else if(temExtra){
        /* dia de descanso do plano, mas com treino incluído por você:
           a mensagem "Hoje não é dia de treino" passa a ser falsa */
        rd.remove();
      }
    }

    /* o renderDia original sai antes de chamar o blocoExtra em dias sem
       treino, então o botão de incluir nunca aparecia. Acrescento aqui. */
    if(!el.querySelector('.extra') && !el.querySelector('[data-addex]')){
      el.insertAdjacentHTML('beforeend', blocoExtra(k));
      ligarExtra(k);
    }
    return;
  }

  /* ── dia com treino: botão de cancelar abaixo da barra de ações ── */
  const acts = el.querySelector('.acts');
  if(!acts || el.querySelector('[data-cancelar]')) return;
  const mover = acts.querySelector('[data-act="mover"]');
  if(mover) mover.textContent = 'Mover dia';
  const b = document.createElement('button');
  b.className = 'btn-cancelar';
  b.setAttribute('data-cancelar', k);
  b.textContent = 'Cancelar este treino';
  b.onclick = () => cancelarPrincipal(k);
  acts.insertAdjacentElement('afterend', b);
}

if(typeof ST === 'object' && ST.aba === 'coach' && typeof renderCoach === 'function'){
  try{ renderCoach() }catch(e){}
}

});


/* ─────────── selo de diagnóstico ─────────── */
(function(){
  function montar(){
    const barra = document.querySelector('.appbar .in');
    if(!barra || document.getElementById('fixSelo')) return;
    const ok = FIX_FALHAS.length === 0;
    const s = document.createElement('button');
    s.id = 'fixSelo';
    s.type = 'button';
    s.textContent = ok ? 'fix ' + FIX_VERSAO : 'fix \u2717 ' + FIX_FALHAS.length;
    s.style.cssText = 'flex:none;padding:4px 8px;border-radius:8px;font-size:10px;' +
      "font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:.03em;" +
      'background:' + (ok ? 'rgba(63,217,138,.16)' : 'rgba(242,104,92,.18)') + ';' +
      'color:' + (ok ? 'var(--ok)' : 'var(--bad)') + ';border:0';
    s.onclick = function(){
      alert(ok
        ? 'fix.js ' + FIX_VERSAO + ' — as seis partes carregaram.'
        : 'fix.js ' + FIX_VERSAO + '\n\nFalharam:\n\n' + FIX_FALHAS.join('\n\n'));
    };
    barra.insertBefore(s, barra.firstChild.nextSibling);
    if(!ok) console.warn('fix.js · falhas:', FIX_FALHAS);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
  setTimeout(montar, 1500);
})();
