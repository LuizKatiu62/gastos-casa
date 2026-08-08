/* ══════════════════════════════════════════════════════════════════
   fix.js — correções da v2
   Versão 2026-08-07p · seis correções e o plano da maratona.

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
   7) Plano PEI Marathon 18/10/2026 — índice para Boston 2028,
      com força duas vezes por semana
   8) Linha do tempo do ciclo, com o percentual cumprido de verdade
   9) Sincronia iPhone ↔ Mac: relê ao voltar o foco e mescla em vez
      de sobrescrever
  10) Suas fotos como marca d'água, uma por aba, com intensidade
      ajustável
  11) Correções da varredura: limiar que era reescrito, backup que
      apagava treinos, e duas chamadas de rede sem prazo
  12) Login de verdade no Firebase, no lugar da conta anônima
   ══════════════════════════════════════════════════════════════════ */

const FIX_VERSAO = '01p';
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



/* ═══════════════════ 7. PLANO PEI MARATHON · ÍNDICE BOSTON 2028 ═══════════════════
   Ciclo de 10 semanas, 11/08 a 18/10/2026, alvo 3:50 (5:27/km).

   Por que 2028 e não 2027: a inscrição para Boston 2027 fecha em
   18/09/2026, um mês ANTES da PEI. Nenhuma maratona de outubro conta
   para 2027. E o índice usa a idade no dia da prova de Boston — em
   19/04/2027 você ainda tem 64 (faz 65 no dia 30) e precisaria de
   3:50:00. Em abril de 2028 você já é 65-69: o índice cai para
   4:05:00. Esperar um ano vale 15 minutos.

   Esta parte faz quatro coisas:
     a) corrige PERFIL.paceLimiar. Estava em 5:40/km, que era o seu
        ritmo de outro tempo. Pelos dados do Garmin (VO2max 47,6, meia
        prevista em 1:47:19) o limiar real é 5:05/km. Com o valor
        errado TODAS as zonas do app estavam lentas demais.
     b) registra a PEI como objetivo,
     c) substitui o plano gerado pelo plano periodizado,
     d) dá a cada sessão as suas próprias etapas, com pace e FC.

   FORÇA: duas sessões por semana, grudadas na terça (depois da
   rodagem) e na quinta (depois da qualidade). Assim segunda e sexta
   continuam sendo descanso de verdade e nunca há força na véspera do
   longo. Base 3×10-12 com carga moderada; do meio do ciclo em diante
   4×5 com carga alta, que é o que melhora economia de corrida sem
   gerar dano muscular; semanas 8 e 9 só manutenção; semana da prova,
   nada.

   Para voltar ao plano automático do app, toque no selo "fix" no alto
   da tela e confirme. Toque de novo para religar.
   ══════════════════════════════════════════════════════════════════ */

PARTE('plano boston', function(){
  const DESLIGADO = 'bq.desligado';
  if(typeof ST !== 'object' || typeof OBJETIVOS !== 'object')
    throw new Error('app antigo: sem ST/OBJETIVOS');

  const PLANO = {"2026-08-11":{"id":"2026-08-11","data":"2026-08-11","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem leve + força","detalhe":"7 km soltos + 6 acelerações de 20 s no fim. Aceleração não é tiro: é acordar a passada.","km":7,"bikeKm":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"6:35","prova":false,"forca":"base_a","min":76,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"7 km soltos + 6 acelerações de 20 s no fim. Aceleração não é tiro: é acordar a passada.","tags":[{"t":"7 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · pernas e core","d":"Fase de adaptação: amplitude completa e controle valem mais que peso. Termine cada série com 2 repetições de sobra.","tags":[{"t":"30–35 min"},{"t":"3×10 a 12, carga moderada"}]},{"t":"Agachamento","d":"3×12. Descida em 3 segundos, subida firme. Joelho na linha do pé.","tags":[{"t":"3×12"}]},{"t":"Levantamento terra romeno","d":"3×12. Posterior de coxa forte é o que protege o joelho na descida.","tags":[{"t":"3×12"}]},{"t":"Afundo caminhando","d":"3×10 de cada perna. Corrida é um exercício de uma perna só — treine assim.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha em pé e sentado","d":"3×15 em pé e 3×15 sentado. O sentado pega o sóleo, que é onde o aquiles rompe.","tags":[{"t":"3×15 + 3×15"}]},{"t":"Prancha e prancha lateral","d":"3×40 s de frente e 3×30 s de cada lado. Core segura a postura no km 35.","tags":[{"t":"3× cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-08-12":{"id":"2026-08-12","data":"2026-08-12","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem curta","detalhe":"6 km em ritmo de conversa. Se não consegue falar uma frase inteira, está rápido demais.","km":6,"bikeKm":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km em ritmo de conversa. Se não consegue falar uma frase inteira, está rápido demais.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-13":{"id":"2026-08-13","data":"2026-08-13","mod":"corrida","foco":"limiar","fase":"Base","titulo":"Limiar 4×5 min + força","detalhe":"2 km aquecimento · 4×5 min a 5:00/km com 2 min de trote · 2 km soltando.","km":9,"bikeKm":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"5:00","prova":false,"forca":"base_b","min":70,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 4×5 min a 5:00/km com 2 min de trote · 2 km soltando.","tags":[{"t":"9 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]},{"t":"Força · quadril e core","d":"Complementar. O dia já teve treino de qualidade, então aqui é volume baixo e foco no quadril, que é onde a passada se desmancha com a fadiga.","tags":[{"t":"25–30 min"},{"t":"3×12, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×12 de cada. Glúteo fraco vira dor lombar no fim do longo.","tags":[{"t":"3×12 cada"}]},{"t":"Step-up no banco","d":"3×10 de cada perna, subida controlada, sem impulso.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada. Glúteo médio é o que evita o joelho cair para dentro.","tags":[{"t":"3×15 cada"}]},{"t":"Bird dog","d":"3×10 de cada lado, lento. Ensina o tronco a ficar quieto enquanto as pernas trabalham.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada pé, no degrau, descendo bem.","tags":[{"t":"3×12 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-08-15":{"id":"2026-08-15","data":"2026-08-15","mod":"bike","foco":"cross","fase":"Base","titulo":"Bike na estrada 22 km","detalhe":"60 min na estrada, em Z2. Terreno ondulado como o de Quispamsis serve bem: subida na bike é força de perna sem nenhum impacto.","km":0,"bikeKm":22,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":null,"prova":false,"forca":null,"min":58,"passos":[{"t":"Bike na estrada","d":"60 min na estrada, em Z2. Terreno ondulado como o de Quispamsis serve bem: subida na bike é força de perna sem nenhum impacto.","tags":[{"t":"22 km"},{"t":"58 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-08-16":{"id":"2026-08-16","data":"2026-08-16","mod":"corrida","foco":"longo","fase":"Base","titulo":"Longo 20 km","detalhe":"Conversa do início ao fim. <b>De manhã</b>: a prova larga às 7h e todos os seus treinos são de tarde.","km":20,"bikeKm":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"6:10","prova":false,"forca":null,"min":123,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Conversa do início ao fim. <b>De manhã</b>: a prova larga às 7h e todos os seus treinos são de tarde.","tags":[{"t":"20 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-08-18":{"id":"2026-08-18","data":"2026-08-18","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem leve + força","detalhe":"8 km soltos + 6 acelerações de 20 s.","km":8,"bikeKm":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"6:35","prova":false,"forca":"base_a","min":83,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km soltos + 6 acelerações de 20 s.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · pernas e core","d":"Fase de adaptação: amplitude completa e controle valem mais que peso. Termine cada série com 2 repetições de sobra.","tags":[{"t":"30–35 min"},{"t":"3×10 a 12, carga moderada"}]},{"t":"Agachamento","d":"3×12. Descida em 3 segundos, subida firme. Joelho na linha do pé.","tags":[{"t":"3×12"}]},{"t":"Levantamento terra romeno","d":"3×12. Posterior de coxa forte é o que protege o joelho na descida.","tags":[{"t":"3×12"}]},{"t":"Afundo caminhando","d":"3×10 de cada perna. Corrida é um exercício de uma perna só — treine assim.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha em pé e sentado","d":"3×15 em pé e 3×15 sentado. O sentado pega o sóleo, que é onde o aquiles rompe.","tags":[{"t":"3×15 + 3×15"}]},{"t":"Prancha e prancha lateral","d":"3×40 s de frente e 3×30 s de cada lado. Core segura a postura no km 35.","tags":[{"t":"3× cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-08-19":{"id":"2026-08-19","data":"2026-08-19","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem curta","detalhe":"6 km fáceis.","km":6,"bikeKm":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km fáceis.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-20":{"id":"2026-08-20","data":"2026-08-20","mod":"corrida","foco":"mp","fase":"Base","titulo":"Prova 2×4 km + força","detalhe":"2 km aquecimento · 2×4 km a 5:27/km com 3 min de trote · 2 km soltando. Grave a sensação: é ela que você persegue em 18/10.","km":10,"bikeKm":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"5:27","prova":false,"forca":"base_b","min":79,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 2×4 km a 5:27/km com 3 min de trote · 2 km soltando. Grave a sensação: é ela que você persegue em 18/10.","tags":[{"t":"10 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]},{"t":"Força · quadril e core","d":"Complementar. O dia já teve treino de qualidade, então aqui é volume baixo e foco no quadril, que é onde a passada se desmancha com a fadiga.","tags":[{"t":"25–30 min"},{"t":"3×12, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×12 de cada. Glúteo fraco vira dor lombar no fim do longo.","tags":[{"t":"3×12 cada"}]},{"t":"Step-up no banco","d":"3×10 de cada perna, subida controlada, sem impulso.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada. Glúteo médio é o que evita o joelho cair para dentro.","tags":[{"t":"3×15 cada"}]},{"t":"Bird dog","d":"3×10 de cada lado, lento. Ensina o tronco a ficar quieto enquanto as pernas trabalham.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada pé, no degrau, descendo bem.","tags":[{"t":"3×12 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-08-22":{"id":"2026-08-22","data":"2026-08-22","mod":"bike","foco":"cross","fase":"Base","titulo":"Bike na estrada 25 km","detalhe":"65 min em Z2, respirando pelo nariz. Se ofegar na subida, troque a marcha em vez de forçar.","km":0,"bikeKm":25,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":null,"prova":false,"forca":null,"min":66,"passos":[{"t":"Bike na estrada","d":"65 min em Z2, respirando pelo nariz. Se ofegar na subida, troque a marcha em vez de forçar.","tags":[{"t":"25 km"},{"t":"66 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-08-23":{"id":"2026-08-23","data":"2026-08-23","mod":"corrida","foco":"longo","fase":"Base","titulo":"Longo 23 km","detalhe":"Últimos 4 km acelerando para 5:45/km. Terminar forte ensina o corpo a poupar glicogênio.","km":23,"bikeKm":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"6:10","prova":false,"forca":null,"min":142,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Últimos 4 km acelerando para 5:45/km. Terminar forte ensina o corpo a poupar glicogênio.","tags":[{"t":"23 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-08-25":{"id":"2026-08-25","data":"2026-08-25","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem leve + força","detalhe":"8 km + 6 acelerações.","km":8,"bikeKm":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"6:35","prova":false,"forca":"base_a","min":83,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km + 6 acelerações.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · pernas e core","d":"Fase de adaptação: amplitude completa e controle valem mais que peso. Termine cada série com 2 repetições de sobra.","tags":[{"t":"30–35 min"},{"t":"3×10 a 12, carga moderada"}]},{"t":"Agachamento","d":"3×12. Descida em 3 segundos, subida firme. Joelho na linha do pé.","tags":[{"t":"3×12"}]},{"t":"Levantamento terra romeno","d":"3×12. Posterior de coxa forte é o que protege o joelho na descida.","tags":[{"t":"3×12"}]},{"t":"Afundo caminhando","d":"3×10 de cada perna. Corrida é um exercício de uma perna só — treine assim.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha em pé e sentado","d":"3×15 em pé e 3×15 sentado. O sentado pega o sóleo, que é onde o aquiles rompe.","tags":[{"t":"3×15 + 3×15"}]},{"t":"Prancha e prancha lateral","d":"3×40 s de frente e 3×30 s de cada lado. Core segura a postura no km 35.","tags":[{"t":"3× cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-08-26":{"id":"2026-08-26","data":"2026-08-26","mod":"corrida","foco":"vo2","fase":"Base","titulo":"Intervalado 5×3 min","detalhe":"2 km aquecimento · 5×3 min a 4:35/km com 2 min de trote · 2 km soltando. Sobe o VO2max, que é o teto de tudo o mais.","km":9,"bikeKm":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"4:35","prova":false,"forca":null,"min":41,"passos":[{"t":"Aquecimento","d":"12 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"12 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Educativos","d":"4×20 s: skipping alto, anfersen, dribles, passada saltada. Caminhe 40 s entre eles.","tags":[{"t":"≈4 min"}]},{"t":"Parte principal","d":"2 km aquecimento · 5×3 min a 4:35/km com 2 min de trote · 2 km soltando. Sobe o VO2max, que é o teto de tudo o mais.","tags":[{"t":"9 km"},{"t":"4:35/km","c":"z"},{"t":"156–163 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Trechos curtos e fortes sobem o VO₂max, que é o teto de tudo. Aos 64 é o que mais se perde com a idade e o que mais responde ao treino.","tags":[]}]},"2026-08-27":{"id":"2026-08-27","data":"2026-08-27","mod":"corrida","foco":"limiar","fase":"Base","titulo":"Limiar 2×12 min + força","detalhe":"2 km aquecimento · 2×12 min a 5:00/km com 3 min de trote · 2 km soltando.","km":10,"bikeKm":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"5:00","prova":false,"forca":"base_b","min":75,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 2×12 min a 5:00/km com 3 min de trote · 2 km soltando.","tags":[{"t":"10 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]},{"t":"Força · quadril e core","d":"Complementar. O dia já teve treino de qualidade, então aqui é volume baixo e foco no quadril, que é onde a passada se desmancha com a fadiga.","tags":[{"t":"25–30 min"},{"t":"3×12, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×12 de cada. Glúteo fraco vira dor lombar no fim do longo.","tags":[{"t":"3×12 cada"}]},{"t":"Step-up no banco","d":"3×10 de cada perna, subida controlada, sem impulso.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada. Glúteo médio é o que evita o joelho cair para dentro.","tags":[{"t":"3×15 cada"}]},{"t":"Bird dog","d":"3×10 de cada lado, lento. Ensina o tronco a ficar quieto enquanto as pernas trabalham.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada pé, no degrau, descendo bem.","tags":[{"t":"3×12 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-08-29":{"id":"2026-08-29","data":"2026-08-29","mod":"bike","foco":"cross","fase":"Base","titulo":"Bike na estrada 27 km","detalhe":"70 min em Z2. Aproveite que ainda está calor — em novembro esta sessão vira rolo dentro de casa.","km":0,"bikeKm":27,"semana":3,"alvoSem":"Maior volume até aqui","pace":null,"prova":false,"forca":null,"min":72,"passos":[{"t":"Bike na estrada","d":"70 min em Z2. Aproveite que ainda está calor — em novembro esta sessão vira rolo dentro de casa.","tags":[{"t":"27 km"},{"t":"72 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-08-30":{"id":"2026-08-30","data":"2026-08-30","mod":"corrida","foco":"longo","fase":"Base","titulo":"Longo 26 km","detalhe":"Solto. Treine o abastecimento: um gel aos 40 min e a cada 40 min depois. Use o que vai usar na prova.","km":26,"bikeKm":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"6:10","prova":false,"forca":null,"min":160,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Solto. Treine o abastecimento: um gel aos 40 min e a cada 40 min depois. Use o que vai usar na prova.","tags":[{"t":"26 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-01":{"id":"2026-09-01","data":"2026-09-01","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Rodagem leve + força","detalhe":"7 km soltos.","km":7,"bikeKm":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"6:35","prova":false,"forca":"base_a","min":76,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"7 km soltos.","tags":[{"t":"7 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · pernas e core","d":"Fase de adaptação: amplitude completa e controle valem mais que peso. Termine cada série com 2 repetições de sobra.","tags":[{"t":"30–35 min"},{"t":"3×10 a 12, carga moderada"}]},{"t":"Agachamento","d":"3×12. Descida em 3 segundos, subida firme. Joelho na linha do pé.","tags":[{"t":"3×12"}]},{"t":"Levantamento terra romeno","d":"3×12. Posterior de coxa forte é o que protege o joelho na descida.","tags":[{"t":"3×12"}]},{"t":"Afundo caminhando","d":"3×10 de cada perna. Corrida é um exercício de uma perna só — treine assim.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha em pé e sentado","d":"3×15 em pé e 3×15 sentado. O sentado pega o sóleo, que é onde o aquiles rompe.","tags":[{"t":"3×15 + 3×15"}]},{"t":"Prancha e prancha lateral","d":"3×40 s de frente e 3×30 s de cada lado. Core segura a postura no km 35.","tags":[{"t":"3× cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-02":{"id":"2026-09-02","data":"2026-09-02","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Regenerativo","detalhe":"6 km bem devagar.","km":6,"bikeKm":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"7:00","prova":false,"forca":null,"min":42,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km bem devagar.","tags":[{"t":"6 km"},{"t":"7:00/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-03":{"id":"2026-09-03","data":"2026-09-03","mod":"corrida","foco":"mp","fase":"Recuperação","titulo":"Prova 3×3 km + força","detalhe":"2 km aquecimento · 3×3 km a 5:27/km com 2 min de trote · 1 km soltando.","km":8,"bikeKm":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"5:27","prova":false,"forca":"base_b","min":69,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×3 km a 5:27/km com 2 min de trote · 1 km soltando.","tags":[{"t":"8 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]},{"t":"Força · quadril e core","d":"Complementar. O dia já teve treino de qualidade, então aqui é volume baixo e foco no quadril, que é onde a passada se desmancha com a fadiga.","tags":[{"t":"25–30 min"},{"t":"3×12, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×12 de cada. Glúteo fraco vira dor lombar no fim do longo.","tags":[{"t":"3×12 cada"}]},{"t":"Step-up no banco","d":"3×10 de cada perna, subida controlada, sem impulso.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada. Glúteo médio é o que evita o joelho cair para dentro.","tags":[{"t":"3×15 cada"}]},{"t":"Bird dog","d":"3×10 de cada lado, lento. Ensina o tronco a ficar quieto enquanto as pernas trabalham.","tags":[{"t":"3×10 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada pé, no degrau, descendo bem.","tags":[{"t":"3×12 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-05":{"id":"2026-09-05","data":"2026-09-05","mod":"bike","foco":"cross","fase":"Recuperação","titulo":"Bike leve na estrada 18 km","detalhe":"50 min bem soltos, terreno plano. Semana de recuperação: a bike é passeio, não treino.","km":0,"bikeKm":18,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":null,"prova":false,"forca":null,"min":48,"passos":[{"t":"Bike na estrada","d":"50 min bem soltos, terreno plano. Semana de recuperação: a bike é passeio, não treino.","tags":[{"t":"18 km"},{"t":"48 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-06":{"id":"2026-09-06","data":"2026-09-06","mod":"corrida","foco":"longo","fase":"Recuperação","titulo":"Longo curto 17 km","detalhe":"Curto de propósito. Corpo cansado não absorve treino.","km":17,"bikeKm":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"6:10","prova":false,"forca":null,"min":105,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Curto de propósito. Corpo cansado não absorve treino.","tags":[{"t":"17 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-08":{"id":"2026-09-08","data":"2026-09-08","mod":"corrida","foco":"facil","fase":"Construção","titulo":"Rodagem leve + força","detalhe":"8 km + 6 acelerações.","km":8,"bikeKm":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"6:35","prova":false,"forca":"pico_a","min":78,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km + 6 acelerações.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · força máxima","d":"Muda a lógica: pouca repetição e carga alta. Parece contra-intuitivo, mas é o que melhora economia de corrida sem destruir a perna — série longa até a falha gera dano muscular e atrapalha o treino de amanhã. Pare sempre com 2 repetições de sobra.","tags":[{"t":"25–30 min"},{"t":"4×5, carga alta"}]},{"t":"Agachamento pesado","d":"4×5. Carga que você faria 7 vezes, não mais.","tags":[{"t":"4×5"}]},{"t":"Levantamento terra romeno","d":"4×6.","tags":[{"t":"4×6"}]},{"t":"Panturrilha em pé com carga","d":"4×8, pausa de 2 s embaixo.","tags":[{"t":"4×8"}]},{"t":"Pliometria leve","d":"2×10 pogos no lugar e 2×8 saltos verticais. Deixa o tendão mais elástico — devolve energia a cada passada.","tags":[{"t":"2×10 + 2×8"}]},{"t":"Prancha","d":"3×45 s.","tags":[{"t":"3×45 s"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-09":{"id":"2026-09-09","data":"2026-09-09","mod":"corrida","foco":"vo2","fase":"Construção","titulo":"Intervalado 6×3 min","detalhe":"2 km aquecimento · 6×3 min a 4:35/km com 2 min de trote · 1 km soltando.","km":9,"bikeKm":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"4:35","prova":false,"forca":null,"min":41,"passos":[{"t":"Aquecimento","d":"12 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"12 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Educativos","d":"4×20 s: skipping alto, anfersen, dribles, passada saltada. Caminhe 40 s entre eles.","tags":[{"t":"≈4 min"}]},{"t":"Parte principal","d":"2 km aquecimento · 6×3 min a 4:35/km com 2 min de trote · 1 km soltando.","tags":[{"t":"9 km"},{"t":"4:35/km","c":"z"},{"t":"156–163 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Trechos curtos e fortes sobem o VO₂max, que é o teto de tudo. Aos 64 é o que mais se perde com a idade e o que mais responde ao treino.","tags":[]}]},"2026-09-10":{"id":"2026-09-10","data":"2026-09-10","mod":"corrida","foco":"limiar","fase":"Construção","titulo":"Limiar 3×10 min + força","detalhe":"2 km aquecimento · 3×10 min a 5:00/km com 2 min de trote · 1 km soltando.","km":10,"bikeKm":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"5:00","prova":false,"forca":"pico_b","min":70,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×10 min a 5:00/km com 2 min de trote · 1 km soltando.","tags":[{"t":"10 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]},{"t":"Força · quadril e core","d":"Dia curto: o treino de corrida é a prioridade desta quinta.","tags":[{"t":"20–25 min"},{"t":"3×10, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×10 de cada.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada.","tags":[{"t":"3×15 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada.","tags":[{"t":"3×12 cada"}]},{"t":"Dead bug","d":"3×10 de cada lado.","tags":[{"t":"3×10 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-12":{"id":"2026-09-12","data":"2026-09-12","mod":"bike","foco":"cross","fase":"Construção","titulo":"Bike na estrada 27 km","detalhe":"70 min em Z2, com 300 m de subida acumulada se possível.","km":0,"bikeKm":27,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":null,"prova":false,"forca":null,"min":72,"passos":[{"t":"Bike na estrada","d":"70 min em Z2, com 300 m de subida acumulada se possível.","tags":[{"t":"27 km"},{"t":"72 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-13":{"id":"2026-09-13","data":"2026-09-13","mod":"corrida","foco":"longo","fase":"Construção","titulo":"Longo 28 km · 8 km de prova","detalhe":"20 km soltos e os últimos <b>8 km a 5:27/km</b>. Correr no ritmo com a perna cansada é o treino mais parecido com a maratona.","km":28,"bikeKm":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"6:10","prova":false,"forca":null,"min":173,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"20 km soltos e os últimos <b>8 km a 5:27/km</b>. Correr no ritmo com a perna cansada é o treino mais parecido com a maratona.","tags":[{"t":"28 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-15":{"id":"2026-09-15","data":"2026-09-15","mod":"corrida","foco":"facil","fase":"Construção","titulo":"Rodagem leve + força","detalhe":"9 km + 6 acelerações.","km":9,"bikeKm":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"6:35","prova":false,"forca":"pico_a","min":84,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"9 km + 6 acelerações.","tags":[{"t":"9 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · força máxima","d":"Muda a lógica: pouca repetição e carga alta. Parece contra-intuitivo, mas é o que melhora economia de corrida sem destruir a perna — série longa até a falha gera dano muscular e atrapalha o treino de amanhã. Pare sempre com 2 repetições de sobra.","tags":[{"t":"25–30 min"},{"t":"4×5, carga alta"}]},{"t":"Agachamento pesado","d":"4×5. Carga que você faria 7 vezes, não mais.","tags":[{"t":"4×5"}]},{"t":"Levantamento terra romeno","d":"4×6.","tags":[{"t":"4×6"}]},{"t":"Panturrilha em pé com carga","d":"4×8, pausa de 2 s embaixo.","tags":[{"t":"4×8"}]},{"t":"Pliometria leve","d":"2×10 pogos no lugar e 2×8 saltos verticais. Deixa o tendão mais elástico — devolve energia a cada passada.","tags":[{"t":"2×10 + 2×8"}]},{"t":"Prancha","d":"3×45 s.","tags":[{"t":"3×45 s"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-16":{"id":"2026-09-16","data":"2026-09-16","mod":"corrida","foco":"subidas","fase":"Construção","titulo":"Subidas 8×60 s","detalhe":"2 km aquecimento · 8×60 s subindo forte, descendo trotando · 2 km soltando. Força de perna sem academia e sem o impacto do tiro no plano.","km":9,"bikeKm":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"4:35","prova":false,"forca":null,"min":41,"passos":[{"t":"Aquecimento","d":"12 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"12 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Educativos","d":"4×20 s: skipping alto, anfersen, dribles, passada saltada. Caminhe 40 s entre eles.","tags":[{"t":"≈4 min"}]},{"t":"Parte principal","d":"2 km aquecimento · 8×60 s subindo forte, descendo trotando · 2 km soltando. Força de perna sem academia e sem o impacto do tiro no plano.","tags":[{"t":"9 km"},{"t":"4:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Subida é musculação disfarçada de corrida: ganha força de perna sem o impacto que o tiro no plano cobra.","tags":[]}]},"2026-09-17":{"id":"2026-09-17","data":"2026-09-17","mod":"corrida","foco":"mp","fase":"Construção","titulo":"Prova 3×5 km + força","detalhe":"2 km aquecimento · 3×5 km a 5:27/km com 3 min de trote · 1 km soltando.","km":13,"bikeKm":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"5:27","prova":false,"forca":"pico_b","min":91,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×5 km a 5:27/km com 3 min de trote · 1 km soltando.","tags":[{"t":"13 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]},{"t":"Força · quadril e core","d":"Dia curto: o treino de corrida é a prioridade desta quinta.","tags":[{"t":"20–25 min"},{"t":"3×10, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×10 de cada.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada.","tags":[{"t":"3×15 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada.","tags":[{"t":"3×12 cada"}]},{"t":"Dead bug","d":"3×10 de cada lado.","tags":[{"t":"3×10 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-19":{"id":"2026-09-19","data":"2026-09-19","mod":"bike","foco":"cross","fase":"Construção","titulo":"Bike na estrada 29 km","detalhe":"75 min em Z2. O maior giro do ciclo — no dia seguinte vem o longo com 12 km em ritmo, então nada de forçar hoje.","km":0,"bikeKm":29,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":null,"prova":false,"forca":null,"min":77,"passos":[{"t":"Bike na estrada","d":"75 min em Z2. O maior giro do ciclo — no dia seguinte vem o longo com 12 km em ritmo, então nada de forçar hoje.","tags":[{"t":"29 km"},{"t":"77 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-20":{"id":"2026-09-20","data":"2026-09-20","mod":"corrida","foco":"longo","fase":"Construção","titulo":"Longo 26 km · 12 km de prova","detalhe":"14 km soltos e <b>12 km a 5:27/km</b>. Sessão-chave do ciclo: se esta sair inteira, 3:50 deixa de ser aposta.","km":26,"bikeKm":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"6:10","prova":false,"forca":null,"min":160,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"14 km soltos e <b>12 km a 5:27/km</b>. Sessão-chave do ciclo: se esta sair inteira, 3:50 deixa de ser aposta.","tags":[{"t":"26 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-22":{"id":"2026-09-22","data":"2026-09-22","mod":"corrida","foco":"facil","fase":"Pico","titulo":"Rodagem leve + força","detalhe":"9 km + 6 acelerações.","km":9,"bikeKm":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"6:35","prova":false,"forca":"pico_a","min":84,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"9 km + 6 acelerações.","tags":[{"t":"9 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · força máxima","d":"Muda a lógica: pouca repetição e carga alta. Parece contra-intuitivo, mas é o que melhora economia de corrida sem destruir a perna — série longa até a falha gera dano muscular e atrapalha o treino de amanhã. Pare sempre com 2 repetições de sobra.","tags":[{"t":"25–30 min"},{"t":"4×5, carga alta"}]},{"t":"Agachamento pesado","d":"4×5. Carga que você faria 7 vezes, não mais.","tags":[{"t":"4×5"}]},{"t":"Levantamento terra romeno","d":"4×6.","tags":[{"t":"4×6"}]},{"t":"Panturrilha em pé com carga","d":"4×8, pausa de 2 s embaixo.","tags":[{"t":"4×8"}]},{"t":"Pliometria leve","d":"2×10 pogos no lugar e 2×8 saltos verticais. Deixa o tendão mais elástico — devolve energia a cada passada.","tags":[{"t":"2×10 + 2×8"}]},{"t":"Prancha","d":"3×45 s.","tags":[{"t":"3×45 s"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-23":{"id":"2026-09-23","data":"2026-09-23","mod":"corrida","foco":"limiar","fase":"Pico","titulo":"Limiar 4×8 min","detalhe":"2 km aquecimento · 4×8 min a 5:00/km com 2 min de trote · 2 km soltando.","km":11,"bikeKm":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"5:00","prova":false,"forca":null,"min":55,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 4×8 min a 5:00/km com 2 min de trote · 2 km soltando.","tags":[{"t":"11 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-09-24":{"id":"2026-09-24","data":"2026-09-24","mod":"corrida","foco":"facil","fase":"Pico","titulo":"Rodagem + força","detalhe":"8 km fáceis. Não invente nada: o longo de domingo é o treino da semana.","km":8,"bikeKm":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"6:35","prova":false,"forca":"pico_b","min":73,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km fáceis. Não invente nada: o longo de domingo é o treino da semana.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · quadril e core","d":"Dia curto: o treino de corrida é a prioridade desta quinta.","tags":[{"t":"20–25 min"},{"t":"3×10, carga leve"}]},{"t":"Ponte de glúteo unilateral","d":"3×10 de cada.","tags":[{"t":"3×10 cada"}]},{"t":"Abdução de quadril com elástico","d":"3×15 de cada.","tags":[{"t":"3×15 cada"}]},{"t":"Panturrilha unilateral","d":"3×12 de cada.","tags":[{"t":"3×12 cada"}]},{"t":"Dead bug","d":"3×10 de cada lado.","tags":[{"t":"3×10 cada"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-26":{"id":"2026-09-26","data":"2026-09-26","mod":"bike","foco":"cross","fase":"Pico","titulo":"Bike leve na estrada 18 km","detalhe":"50 min soltos, plano. Amanhã é o longo de 32 km: as pernas precisam chegar frescas.","km":0,"bikeKm":18,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":null,"prova":false,"forca":null,"min":48,"passos":[{"t":"Bike na estrada","d":"50 min soltos, plano. Amanhã é o longo de 32 km: as pernas precisam chegar frescas.","tags":[{"t":"18 km"},{"t":"48 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-27":{"id":"2026-09-27","data":"2026-09-27","mod":"corrida","foco":"longo","fase":"Pico","titulo":"Longo 32 km · 10 km de prova","detalhe":"22 km soltos e os últimos <b>10 km a 5:27/km</b>. O maior do ciclo. Ensaio geral: mesma roupa, mesmo tênis, mesmo gel, mesma hora da largada.","km":32,"bikeKm":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"6:10","prova":false,"forca":null,"min":197,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"22 km soltos e os últimos <b>10 km a 5:27/km</b>. O maior do ciclo. Ensaio geral: mesma roupa, mesmo tênis, mesmo gel, mesma hora da largada.","tags":[{"t":"32 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-29":{"id":"2026-09-29","data":"2026-09-29","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Rodagem leve + força","detalhe":"8 km soltos.","km":8,"bikeKm":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"6:35","prova":false,"forca":"manut","min":73,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km soltos.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · manutenção","d":"Só para não perder o que construiu. Volume mínimo, carga igual à do pico, longe da falha. Nada de novidade nesta altura.","tags":[{"t":"20 min"},{"t":"2×5, carga mantida"}]},{"t":"Agachamento","d":"2×5 com a carga do pico.","tags":[{"t":"2×5"}]},{"t":"Levantamento terra romeno","d":"2×6.","tags":[{"t":"2×6"}]},{"t":"Panturrilha em pé","d":"3×10.","tags":[{"t":"3×10"}]},{"t":"Prancha","d":"2×40 s.","tags":[{"t":"2×40 s"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-09-30":{"id":"2026-09-30","data":"2026-09-30","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Regenerativo","detalhe":"6 km bem devagar.","km":6,"bikeKm":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"7:00","prova":false,"forca":null,"min":42,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km bem devagar.","tags":[{"t":"6 km"},{"t":"7:00/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-01":{"id":"2026-10-01","data":"2026-10-01","mod":"corrida","foco":"mp","fase":"Recuperação","titulo":"Prova 2×5 km","detalhe":"2 km aquecimento · 2×5 km a 5:27/km com 3 min de trote · 1 km soltando.","km":10,"bikeKm":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"5:27","prova":false,"forca":null,"min":54,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 2×5 km a 5:27/km com 3 min de trote · 1 km soltando.","tags":[{"t":"10 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-10-03":{"id":"2026-10-03","data":"2026-10-03","mod":"bike","foco":"cross","fase":"Recuperação","titulo":"Bike leve na estrada 18 km","detalhe":"50 min soltos.","km":0,"bikeKm":18,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":null,"prova":false,"forca":null,"min":48,"passos":[{"t":"Bike na estrada","d":"50 min soltos.","tags":[{"t":"18 km"},{"t":"48 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-10-04":{"id":"2026-10-04","data":"2026-10-04","mod":"corrida","foco":"longo","fase":"Recuperação","titulo":"Longo 20 km","detalhe":"Solto do começo ao fim.","km":20,"bikeKm":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"6:10","prova":false,"forca":null,"min":123,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Solto do começo ao fim.","tags":[{"t":"20 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-10-06":{"id":"2026-10-06","data":"2026-10-06","mod":"corrida","foco":"facil","fase":"Polimento","titulo":"Rodagem leve + força","detalhe":"8 km + 6 acelerações.","km":8,"bikeKm":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"6:35","prova":false,"forca":"manut","min":73,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km + 6 acelerações.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]},{"t":"Força · manutenção","d":"Só para não perder o que construiu. Volume mínimo, carga igual à do pico, longe da falha. Nada de novidade nesta altura.","tags":[{"t":"20 min"},{"t":"2×5, carga mantida"}]},{"t":"Agachamento","d":"2×5 com a carga do pico.","tags":[{"t":"2×5"}]},{"t":"Levantamento terra romeno","d":"2×6.","tags":[{"t":"2×6"}]},{"t":"Panturrilha em pé","d":"3×10.","tags":[{"t":"3×10"}]},{"t":"Prancha","d":"2×40 s.","tags":[{"t":"2×40 s"}]},{"t":"Por que a força está aqui","d":"Depois dos 50 anos perde-se cerca de 1% de massa muscular por ano, e correr sozinho não segura isso. Força pesada 2× por semana melhora a economia de corrida entre 2% e 8% — numa maratona de quase quatro horas, isso são minutos. E a panturrilha e o aquiles, que é onde o corredor veterano mais se machuca, só ficam resistentes assim. Nunca faça força na véspera do longo.","tags":[]}]},"2026-10-07":{"id":"2026-10-07","data":"2026-10-07","mod":"corrida","foco":"limiar","fase":"Polimento","titulo":"Limiar 3×8 min","detalhe":"2 km aquecimento · 3×8 min a 5:00/km com 2 min de trote · 2 km soltando.","km":10,"bikeKm":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"5:00","prova":false,"forca":null,"min":50,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×8 min a 5:00/km com 2 min de trote · 2 km soltando.","tags":[{"t":"10 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-10-08":{"id":"2026-10-08","data":"2026-10-08","mod":"corrida","foco":"facil","fase":"Polimento","titulo":"Rodagem","detalhe":"6 km fáceis.","km":6,"bikeKm":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km fáceis.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-10":{"id":"2026-10-10","data":"2026-10-10","mod":"bike","foco":"cross","fase":"Polimento","titulo":"Bike leve na estrada 14 km","detalhe":"40 min bem leves. Última bike antes da prova.","km":0,"bikeKm":14,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":null,"prova":false,"forca":null,"min":37,"passos":[{"t":"Bike na estrada","d":"40 min bem leves. Última bike antes da prova.","tags":[{"t":"14 km"},{"t":"37 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-10-11":{"id":"2026-10-11","data":"2026-10-11","mod":"corrida","foco":"longo","fase":"Polimento","titulo":"Longo 16 km · 6 km de prova","detalhe":"10 km soltos e <b>6 km a 5:27/km</b>. Último longo do ciclo.","km":16,"bikeKm":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"6:10","prova":false,"forca":null,"min":99,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"10 km soltos e <b>6 km a 5:27/km</b>. Último longo do ciclo.","tags":[{"t":"16 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-10-13":{"id":"2026-10-13","data":"2026-10-13","mod":"corrida","foco":"mp","fase":"Semana da prova","titulo":"Rodagem com prova","detalhe":"2 km soltos · 3 km a 5:27/km · 3 km soltos. Só para o corpo lembrar o ritmo.","km":8,"bikeKm":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"5:27","prova":false,"forca":null,"min":44,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km soltos · 3 km a 5:27/km · 3 km soltos. Só para o corpo lembrar o ritmo.","tags":[{"t":"8 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-10-14":{"id":"2026-10-14","data":"2026-10-14","mod":"corrida","foco":"facil","fase":"Semana da prova","titulo":"Rodagem curta","detalhe":"6 km fáceis.","km":6,"bikeKm":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km fáceis.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-15":{"id":"2026-10-15","data":"2026-10-15","mod":"corrida","foco":"facil","fase":"Semana da prova","titulo":"Soltura","detalhe":"5 km soltos + 4 acelerações de 20 s.","km":5,"bikeKm":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"6:35","prova":false,"forca":null,"min":33,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"5 km soltos + 4 acelerações de 20 s.","tags":[{"t":"5 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-17":{"id":"2026-10-17","data":"2026-10-17","mod":"corrida","foco":"facil","fase":"Semana da prova","titulo":"Soltura pré-prova","detalhe":"4 km bem leves. Retire o número e deixe tudo separado hoje.","km":4,"bikeKm":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"7:00","prova":false,"forca":null,"min":28,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"4 km bem leves. Retire o número e deixe tudo separado hoje.","tags":[{"t":"4 km"},{"t":"7:00/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-18":{"id":"2026-10-18","data":"2026-10-18","mod":"corrida","foco":"prova","fase":"Semana da prova","titulo":"PEI MARATHON · Charlottetown","detalhe":"Largada 7h. Primeiros 5 km <b>a 5:35</b>, mais devagar que o alvo, de propósito. Depois assente em 5:27. Se aos 32 km ainda estiver bem, aperte.","km":42.2,"bikeKm":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"5:27","prova":true,"forca":null,"min":230,"passos":[{"t":"Antes da largada","d":"Acorde 3 h antes. Café da manhã testado nos longos, nada novo. Chegue com 1 h de folga: são 7h da manhã e vai estar frio em Charlottetown.","tags":[{"t":"7h00"}]},{"t":"Km 1 a 5 — segure","d":"A 5:35/km, mais devagar que o alvo. Todo mundo sai rápido demais e todo mundo paga depois dos 30. Esses 40 segundos guardados valem 4 minutos no fim.","tags":[{"t":"5:35/km","c":"z"},{"t":"136–144 bpm","c":"hr"}]},{"t":"Km 5 a 32 — assente","d":"5:27/km, o ritmo que você repetiu em todos os longos. Gel a cada 40 min, água em todos os postos. Não acelere quando se sentir bem — você vai se sentir bem, é assim que funciona.","tags":[{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Km 32 ao fim — decida","d":"Se ainda estiver inteiro, aperte para 5:20. Se estiver sofrendo, segure 5:27 e não olhe para trás. 3:50 dá 15 min de folga no índice; 3:55 ainda te classifica com sobra.","tags":[{"t":"5:20–5:27/km","c":"z"}]},{"t":"Alvos do dia","d":"A · 3:50:00 (5:27/km) — folga larga no índice.<br>B · 3:55:00 (5:34/km) — classifica com folga sobre o corte histórico.<br>C · 4:04:59 — índice cravado; entra na seleção aleatória.<br>Qualquer um dos três é uma primeira maratona bem corrida aos 64 anos.","tags":[]}]}};

  const ITEM = {id:'bq42', n:'PEI Marathon · índice Boston',
                dist:42.2, sem:10, longoMax:32, volBase:60};

  /* o limiar real, medido: sem isto as cinco zonas do app saem erradas */
  if(typeof PERFIL === 'object' && PERFIL.paceLimiar > 320){
    PERFIL.paceLimiar = 305;
    try{ Z = zonas() }catch(e){}
  }

  if(!OBJETIVOS.corrida.itens.some(x => x.id === ITEM.id))
    OBJETIVOS.corrida.itens.push(ITEM);

  const gerarApp   = window.gerarPlano;
  const etapasApp  = window.etapasDe;
  const ligado = () => localStorage.getItem(DESLIGADO) !== '1';

  window.gerarPlano = function(){
    if(!ligado()) return gerarApp.apply(this, arguments);
    const p = {};
    for(const k in PLANO) p[k] = Object.assign({}, PLANO[k]);
    return p;
  };

  /* etapas próprias: o app monta as dele por template e perderia os
     paces exatos de cada série */
  window.etapasDe = function(s){
    if(ligado() && s && s.passos)
      return s.passos.map(function(x, i){
        return {id:'bq-'+s.id+'-'+i, t:x.t, d:x.d, tags:x.tags || []};
      });
    return etapasApp.apply(this, arguments);
  };

  function aplicar(){
    if(!ligado()) return;
    ST.objetivo = {fam:'corrida', id:'bq42', data:'2026-10-18',
                   nome:'PEI Marathon · índice Boston', dataManual:true};
    try{ rebuild() }catch(e){ return }
    try{ selecionarProximo() }catch(e){}
    try{ renderTudo() }catch(e){}
  }

  /* o boot do app é assíncrono e sobrescreve ST.objetivo com o que
     está no Firebase. Por isso aplico depois que ele termina. */
  setTimeout(aplicar, 2500);
  setTimeout(aplicar, 6000);

  window.planoBQ = {
    ligar  : function(){ localStorage.removeItem(DESLIGADO); aplicar() },
    desligar:function(){ localStorage.setItem(DESLIGADO,'1');
                         try{ rebuild(); selecionarProximo(); renderTudo() }catch(e){} },
    ligado : ligado,
    plano  : PLANO
  };
});



/* ═══════════════════ 8. LINHA DO TEMPO DO CICLO ═══════════════════
   Uma barra por semana, do plano inteiro, com quanto foi cumprido.

   O número NÃO vem de marcar caixinha: vem do Garmin. Uso ST.runs,
   que são as corridas de verdade que o relógio registrou, e comparo
   com o que o plano pedia naquela semana. Marcar etapa é fácil;
   correr 32 km não é. A barra mostra a segunda coisa.

   Cores: verde a partir de 95%, âmbar de 80 a 94, vermelho abaixo.
   Semana futura fica cinza.
   ══════════════════════════════════════════════════════════════════ */

PARTE('linha do tempo', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  const CSS = `
  #bqLinha .bqtopo{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:2px}
  #bqLinha .bqpct{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
  #bqLinha .bqsub{font-size:11.5px;opacity:.65;margin-bottom:12px}
  #bqLinha .bqfaixa{display:flex;gap:3px;margin-bottom:14px}
  #bqLinha .bqfaixa i{flex:1;height:7px;border-radius:3px;background:currentColor;opacity:.22}
  #bqLinha .bqfaixa i.v{opacity:1}
  #bqLinha .bqsem{display:grid;grid-template-columns:26px 1fr 62px 40px;gap:7px;align-items:center;
    padding:5px 0;font-size:11.5px;font-variant-numeric:tabular-nums}
  #bqLinha .bqsem+.bqsem{border-top:1px solid rgba(128,128,128,.13)}
  #bqLinha .bqsem b{font-weight:700;opacity:.75}
  #bqLinha .bqbar{height:9px;border-radius:5px;background:rgba(128,128,128,.16);overflow:hidden;position:relative}
  #bqLinha .bqbar i{display:block;height:100%;border-radius:5px}
  #bqLinha .bqsem.hoje{background:rgba(128,128,128,.07);border-radius:6px;padding-left:4px;padding-right:4px}
  #bqLinha .bqkm{opacity:.6;text-align:right}
  #bqLinha .bqp{text-align:right;font-weight:700}
  #bqLinha .bqnota{font-size:11px;opacity:.6;margin-top:11px;line-height:1.45}`;

  const cor = p => p >= .95 ? '#2fbf71' : p >= .80 ? '#e0a33f' : '#e0714f';

  /* km realmente corridos por dia, vindos do relógio */
  function corridasPorDia(){
    const m = {};
    (ST.runs || []).forEach(function(r){
      if(r.mod !== 'corrida' || r.walk) return;
      m[iso(addD(HOJE, -r.d))] = (m[iso(addD(HOJE, -r.d))] || 0) + r.km;
    });
    return m;
  }

  function montar(){
    if(!window.planoBQ || !window.planoBQ.ligado()) {
      const v = document.getElementById('bqLinha'); if(v) v.remove();
      return;
    }
    const alvo = document.getElementById('objBox');
    if(!alvo) return;
    let box = document.getElementById('bqLinha');
    if(!box){
      box = document.createElement('section');
      box.className = 'card'; box.id = 'bqLinha';
      const st = document.createElement('style'); st.textContent = CSS;
      box.appendChild(st);
      const alvoIn = document.createElement('div'); alvoIn.id = 'bqLinhaIn';
      box.appendChild(alvoIn);
      alvo.parentNode.insertBefore(box, alvo);
    }

    const P = window.planoBQ.plano, feito = corridasPorDia(), hoje = iso(HOJE);
    const sem = {};
    Object.keys(P).forEach(function(k){
      const s = P[k];
      if(s.prova || !s.km) return;
      const w = sem[s.semana] || (sem[s.semana] = {n:s.semana, fase:s.fase, plan:0, real:0, venceu:0, ini:k, fim:k});
      w.plan += s.km;
      w.real += feito[k] || 0;
      if(k <= hoje) w.venceu += s.km;
      if(k < w.ini) w.ini = k;
      if(k > w.fim) w.fim = k;
    });
    const semanas = Object.values(sem).sort(function(a,b){ return a.n - b.n });
    if(!semanas.length) return;

    const inicio = semanas[0].ini, prova = '2026-10-18';
    const totalDias = diff(inicio, prova);
    const passou = Math.max(0, Math.min(totalDias, diff(inicio, hoje)));

    let venceu = 0, real = 0;
    semanas.forEach(function(w){ venceu += w.venceu; real += Math.min(w.real, w.plan) });
    const aderencia = venceu > 0 ? real / venceu : 0;
    const plano = semanas.reduce(function(a,w){ return a + w.plan }, 0);

    const antes = hoje < inicio;
    const linhas = semanas.map(function(w){
      const futura = w.venceu === 0;
      const agora = hoje >= w.ini && hoje <= w.fim;
      /* na semana em curso comparo com o que já venceu, não com a
         semana inteira: senão a quarta-feira sempre parece fracasso */
      const base = agora ? (w.venceu || w.plan) : w.plan;
      const p = base > 0 ? Math.min(1.15, w.real / base) : 0;
      return '<div class="bqsem' + (agora ? ' hoje' : '') + '">'
        + '<b>S' + w.n + '</b>'
        + '<span class="bqbar"><i style="width:' + Math.round(Math.min(1, p) * 100)
        + '%;background:' + (futura ? 'transparent' : cor(p)) + '"></i></span>'
        + '<span class="bqkm">' + Math.round(w.real) + '/' + Math.round(w.plan) + ' km</span>'
        + '<span class="bqp" style="color:' + (futura ? 'inherit' : cor(p)) + ';opacity:' + (futura ? '.35' : '1') + '">'
        + (futura ? '—' : Math.round(p * 100) + '%') + '</span></div>';
    }).join('');

    document.getElementById('bqLinhaIn').innerHTML =
      '<span class="kicker">Progresso do ciclo</span>'
      + '<div class="bqtopo"><span class="bqpct" style="color:' + (antes ? 'inherit' : cor(aderencia)) + '">'
      + (antes ? '—' : Math.round(aderencia * 100) + '%') + '</span>'
      + '<span style="font-size:11.5px;opacity:.65">semana ' + Math.max(1, Math.ceil((passou + 1) / 7))
      + ' de ' + semanas.length + '</span></div>'
      + '<div class="bqsub">' + (antes
          ? 'O ciclo começa em ' + fmt(inicio) + '. Nada a cumprir ainda.'
          : Math.round(real) + ' km dos ' + Math.round(venceu) + ' km que o plano pediu até hoje · '
            + Math.round(plano) + ' km de treino no ciclo, mais os 42,2 da prova')
      + '</div>'
      + '<div class="bqfaixa">' + Array.from({length: totalDias + 1}).map(function(_, i){
          return '<i class="' + (i <= passou ? 'v' : '') + '"></i>' }).join('') + '</div>'
      + linhas
      + '<div class="bqnota">A conta usa as corridas que o Garmin registrou, não as etapas marcadas. '
      + 'Semana acima de 100% conta como 100%: correr a mais não compensa a semana que faltou. '
      + 'A semana em curso é medida só pelos dias que já passaram. '
      + 'Abaixo de 80% em duas semanas seguidas, é hora de rever o alvo.</div>';
  }

  const coachApp = window.renderCoach;
  if(typeof coachApp === 'function'){
    window.renderCoach = function(){
      const r = coachApp.apply(this, arguments);
      try{ montar() }catch(e){ console.warn('linha do tempo:', e) }
      return r;
    };
  }
  setTimeout(function(){ try{ montar() }catch(e){} }, 3000);
  setTimeout(function(){ try{ montar() }catch(e){} }, 7000);
});



/* ═══════════════════ 9. SINCRONIA ENTRE APARELHOS ═══════════════════
   Dois problemas do jeito que estava:

   1) O app só lia o Firebase quando ABRIA. Marcar um treino no iPhone
      não aparecia no Mac que já estava aberto.
   2) O salvarCoach() grava o pacote INTEIRO de uma vez. Com os dois
      aparelhos abertos, o último a gravar apagava o trabalho do outro:
      você marcava o longo no iPhone à tarde, mexia em qualquer coisa
      no Mac à noite, e o Mac gravava por cima o estado que carregou
      de manhã. O longo sumia.

   Aqui: relê ao voltar o foco, e MESCLA em vez de sobrescrever.
   Treino marcado em qualquer aparelho continua marcado.

   O caso difícil é DESmarcar: sem carimbo de hora por item não dá
   para saber se o outro aparelho está desatualizado ou se você mudou
   de ideia. Resolvo guardando o que foi desmarcado nas últimas 24 h
   neste aparelho — dentro dessa janela, a desmarcação vence.
   ══════════════════════════════════════════════════════════════════ */

PARTE('sincronia entre aparelhos', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof window.salvarCoach !== 'function' || typeof window.lerCoach !== 'function')
    throw new Error('app sem salvarCoach/lerCoach');

  const RM = 'bq.desmarcadas', JANELA = 24 * 3600 * 1000;

  function lerRM(){
    try{
      const m = JSON.parse(localStorage.getItem(RM) || '{}'), agora = Date.now(), lim = {};
      for(const k in m) if(agora - m[k].t < JANELA) lim[k] = m[k];
      return lim;
    }catch(e){ return {} }
  }
  function gravaRM(m){ try{ localStorage.setItem(RM, JSON.stringify(m)) }catch(e){} }

  /* anota o que VOCÊ desmarcou, para o outro aparelho não ressuscitar */
  const marcarApp = window.marcarEtapa;
  if(typeof marcarApp === 'function'){
    window.marcarEtapa = function(id, etapa){
      const antes = (ST.feitas && ST.feitas[id] ? ST.feitas[id] : []).slice();
      const r = marcarApp.apply(this, arguments);
      const dep = (ST.feitas && ST.feitas[id]) ? ST.feitas[id] : [];
      const saiu = antes.filter(function(e){ return dep.indexOf(e) < 0 });
      if(saiu.length){
        const m = lerRM();
        m[id] = {t:Date.now(), e:(m[id] && m[id].e ? m[id].e : []).concat(saiu)};
        gravaRM(m);
      }
      return r;
    };
  }

  function mesclar(r){
    if(!r) return 0;
    let novos = 0;
    const rm = lerRM();

    if(r.feitas){
      ST.feitas = ST.feitas || {};
      for(const k in r.feitas){
        const remoto = r.feitas[k] || [];
        const local  = ST.feitas[k] || [];
        const negado = (rm[k] && rm[k].e) ? rm[k].e : [];
        const juntos = local.slice();
        remoto.forEach(function(e){
          if(juntos.indexOf(e) < 0 && negado.indexOf(e) < 0){ juntos.push(e); novos++ }
        });
        if(juntos.length) ST.feitas[k] = juntos;
      }
    }
    /* extras e trocas: só entra o que este aparelho não conhece.
       O que você acabou de fazer aqui nunca é sobrescrito.        */
    ['extras','trocas'].forEach(function(campo){
      if(!r[campo]) return;
      ST[campo] = ST[campo] || {};
      for(const k in r[campo]) if(!(k in ST[campo])){ ST[campo][k] = r[campo][k]; novos++ }
    });
    return novos;
  }

  /* ---- gravar: lê o servidor e funde antes de mandar ---- */
  const salvarApp = window.salvarCoach;
  let ocupado = false;
  window.salvarCoach = async function(){
    if(ocupado) return;
    ocupado = true;
    try{ mesclar(await window.lerCoach()) }catch(e){ console.warn('merge antes de gravar:', e) }
    ocupado = false;
    return salvarApp.apply(this, arguments);
  };

  /* ---- ler: sempre que a tela volta ---- */
  let ultima = 0, pendente = false;
  async function puxar(){
    if(pendente || Date.now() - ultima < 4000) return;
    pendente = true;
    try{
      const n = mesclar(await window.lerCoach());
      ultima = Date.now();
      if(n){
        try{ if(typeof rebuild === 'function') rebuild() }catch(e){}
        try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
        aviso(n);
      }
    }catch(e){}
    pendente = false;
  }

  function aviso(n){
    let t = document.getElementById('bqToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'bqToast';
      t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:86px;z-index:9999;'
        + 'background:rgba(20,24,31,.94);color:#fff;font-size:12.5px;font-weight:600;'
        + 'padding:9px 15px;border-radius:20px;box-shadow:0 6px 22px rgba(0,0,0,.35);'
        + 'opacity:0;transition:opacity .25s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = n === 1 ? 'Sincronizado · 1 registro do outro aparelho'
                            : 'Sincronizado · ' + n + ' registros do outro aparelho';
    t.style.opacity = '1';
    clearTimeout(aviso._t);
    aviso._t = setTimeout(function(){ t.style.opacity = '0' }, 3200);
  }

  document.addEventListener('visibilitychange', function(){ if(!document.hidden) puxar() });
  window.addEventListener('focus', puxar);
  window.addEventListener('online', puxar);
  window.bqSync = puxar;
});



/* ═══════════════════ 10. FOTOS DE FUNDO ═══════════════════
   Suas fotos como marca d'água, uma por aba.

   O app é escuro (#0A0D12). Foto sobre fundo escuro só funciona com
   duas coisas: baixa opacidade E um véu por cima. Sem o véu, um céu
   azul claro no alto da foto come o texto branco do cabeçalho.

   As imagens já saem tratadas: 560 px de largura, saturação em 62% e
   contraste em 92%. Ficam texturas, não retratos concorrendo com os
   números. E são arquivos à parte, não embutidos aqui: assim carrega
   só a da aba aberta e o navegador guarda no cache.

   Toque em "Fundo" no card Progresso do ciclo para mudar a
   intensidade: sutil · médio · forte · sem foto.
   ══════════════════════════════════════════════════════════════════ */

PARTE('fotos de fundo', function(){
  const CHAVE = 'bq.fundo';
  const NIVEIS = [
    {n:'médio',    o:0.14}, {n:'forte',    o:0.24},
    {n:'sem foto', o:0},    {n:'sutil',    o:0.08}
  ];
  const FOTOS = {
    coach   :'./foto-3-corrida.jpg',
    treinos :'./foto-2-trilha.jpg',
    saude   :'./foto-1-bike.jpg',
    evolucao:'./foto-4-medalhas.jpg',
    indices :'./foto-4-medalhas.jpg',
    provas  :'./foto-3-corrida.jpg',
    dados   :'./foto-2-trilha.jpg'
  };
  const ORDEM = ['./foto-1-bike.jpg','./foto-2-trilha.jpg','./foto-3-corrida.jpg','./foto-4-medalhas.jpg'];

  function nivel(){
    const i = parseInt(localStorage.getItem(CHAVE), 10);
    return NIVEIS[isNaN(i) ? 0 : i % NIVEIS.length];
  }

  const st = document.createElement('style');
  st.textContent = `
  html{background:#0A0D12}
  body{background:transparent !important}
  #bqFoto{position:fixed;inset:0;z-index:-1;pointer-events:none;
    background-position:center 12%;background-size:cover;background-repeat:no-repeat;
    transition:opacity .5s, background-image .3s}
  #bqFoto::after{content:'';position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(10,13,18,.80) 0%,rgba(10,13,18,.62) 38%,rgba(10,13,18,.86) 100%)}
  #bqFundoBt{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:12px;cursor:pointer;
    border:1px solid rgba(128,128,128,.3);background:transparent;color:inherit;opacity:.6}
  #bqFundoBt:hover{opacity:1;border-color:currentColor}`;
  document.head.appendChild(st);

  const capa = document.createElement('div');
  capa.id = 'bqFoto';
  document.body.appendChild(capa);

  function pintar(){
    const N = nivel();
    if(!N.o){ capa.style.opacity = '0'; capa.style.backgroundImage = 'none'; return }
    const aba = (typeof ST === 'object' && ST.aba) ? ST.aba : '';
    const dia = Math.floor(Date.now() / 864e5) % ORDEM.length;
    const url = FOTOS[aba] || ORDEM[dia];
    capa.style.backgroundImage = 'url("' + url + '")';
    capa.style.opacity = String(N.o);
  }

  /* o botão vive no card que eu mesmo criei, então não brigo com o app */
  function botao(){
    const dono = document.querySelector('#bqLinha .bqtopo');
    if(!dono || document.getElementById('bqFundoBt')) return;
    const b = document.createElement('button');
    b.id = 'bqFundoBt'; b.type = 'button';
    b.textContent = 'Fundo: ' + nivel().n;
    b.onclick = function(){
      const i = (parseInt(localStorage.getItem(CHAVE), 10) || 0) + 1;
      localStorage.setItem(CHAVE, String(i % NIVEIS.length));
      b.textContent = 'Fundo: ' + nivel().n;
      pintar();
    };
    dono.appendChild(b);
  }

  const coachApp = window.renderCoach;
  if(typeof coachApp === 'function'){
    window.renderCoach = function(){
      const r = coachApp.apply(this, arguments);
      try{ pintar(); botao() }catch(e){}
      return r;
    };
  }
  const tudoApp = window.renderTudo;
  if(typeof tudoApp === 'function'){
    window.renderTudo = function(){
      const r = tudoApp.apply(this, arguments);
      try{ pintar() }catch(e){}
      return r;
    };
  }
  document.addEventListener('click', function(){ setTimeout(pintar, 60) }, true);
  pintar();
  setTimeout(function(){ pintar(); botao() }, 3200);
  window.bqFundo = {pintar:pintar, nivel:nivel};
});



/* ═══════════════ 11. CORREÇÕES DA VARREDURA ═══════════════
   Quatro defeitos encontrados na revisão do index.html.

   A) O LIMIAR ERA REESCRITO A CADA SINCRONIA — o pior deles.
      absorver() estima o limiar como "mediana das corridas de 5 km ou
      mais, menos 65 s". Nos seus dados a mediana é 5:49/km, mas ela
      está contaminada pelas trilhas e pela ultra de 64 km, e o
      desconto fixo de 65 s é grande demais: no seu caso a distância
      entre rodagem e limiar é ~44 s. Resultado: 4:44/km.
      Com isso o app mandava rodagem a 5:39–6:09 (25 s/km rápido
      demais) e tiro a 3:59–4:19, que você não corre nem em 5 km.
      Como isso roda DEPOIS do fix.js, ele desfazia a correção da
      parte 7 a cada abertura. Agora eu reponho o valor logo após.

   B) O BACKUP NÃO SALVAVA A PROVA E PODIA APAGAR TUDO.
      A exportação grava estado:{prova:ST.prova,...} — mas o campo
      chama-se ST.objetivo. Gravava undefined. Pior: ao importar,
      ST.feitas = p.estado.feitas || {} zerava TODOS os treinos
      marcados se o arquivo não trouxesse esse campo, e o persistir()
      logo em seguida mandava o vazio para o Firebase. Reescrito para
      salvar objetivo, extras e trocas, e para nunca apagar nada.

   C) DUAS CHAMADAS DE REDE SEM PRAZO.
      puxarManuais() e lerCoach() esperam para sempre. Numa rede que
      aceita a conexão e não responde — wi-fi de hotel, de academia —
      o boot nunca chega ao fim e o app fica preso em "Carregando…".
      Era esse o travamento. Agora desistem em 9 segundos.

   D) Objetivo padrão apontava para 2 de agosto de 2026, data já
      vencida. Só vale quando o plano está desligado.
   ══════════════════════════════════════════════════════════════════ */

PARTE('correções da varredura', function(){
  const LIMIAR = 305;                     // 5:05/km — meia prevista 1:47:19

  /* ── A ── */
  if(typeof PERFIL === 'object'){
    const absorverApp = window.absorver;
    if(typeof absorverApp === 'function'){
      window.absorver = function(){
        const r = absorverApp.apply(this, arguments);
        PERFIL.paceLimiar = LIMIAR;
        try{ Z = zonas() }catch(e){}
        return r;
      };
    }
    PERFIL.paceLimiar = LIMIAR;
    try{ Z = zonas() }catch(e){}
  }

  /* ── C ── */
  function comPrazo(fn, ms, padrao, nome){
    if(typeof fn !== 'function') return fn;
    return function(){
      const eu = this, args = arguments;
      return Promise.race([
        Promise.resolve().then(function(){ return fn.apply(eu, args) }),
        new Promise(function(ok){ setTimeout(function(){
          console.warn('fix.js · ' + nome + ' passou de ' + ms + 'ms, seguindo sem ele');
          ok(padrao);
        }, ms) })
      ]);
    };
  }
  window.puxarManuais = comPrazo(window.puxarManuais, 9000, [],   'puxarManuais');
  window.lerCoach     = comPrazo(window.lerCoach,     9000, null, 'lerCoach');
  window.salvarCoach  = comPrazo(window.salvarCoach, 15000, null, 'salvarCoach');

  /* ── B ── */
  function arrumarBackup(){
    const exp = document.getElementById('btExp');
    const imp = document.getElementById('fileBk');
    if(!exp || !imp || exp.dataset.bqOk) return;
    exp.dataset.bqOk = '1';

    exp.onclick = function(){
      const pacote = {v:2, em:new Date().toISOString(),
        perfil: (typeof PERFIL === 'object' ? PERFIL : null),
        estado: {objetivo:ST.objetivo, feitas:ST.feitas, extras:ST.extras,
                 trocas:ST.trocas, periodo:ST.periodo, filtro:ST.filtro},
        atividades: ST.runs};
      const b = new Blob([JSON.stringify(pacote, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'treinos-' + iso(HOJE) + '.json';
      a.click(); URL.revokeObjectURL(a.href);
      if(typeof setStatus === 'function')
        setStatus('<span>✓</span><span>Backup completo: prova, treinos marcados, trocas e atividades.</span>','ok');
    };

    imp.onchange = async function(e){
      const f = e.target.files[0]; if(!f) return;
      try{
        const p = JSON.parse(await f.text());
        const es = p.estado || {};
        /* regra: só sobrescreve o que o arquivo REALMENTE traz.
           Campo ausente nunca zera o que já existe. */
        if(p.perfil && typeof PERFIL === 'object') Object.assign(PERFIL, p.perfil);
        if(es.objetivo) ST.objetivo = es.objetivo;
        if(es.prova && !es.objetivo) ST.objetivo = es.prova;      // arquivos v1
        if(es.feitas && Object.keys(es.feitas).length) ST.feitas = es.feitas;
        if(es.extras) ST.extras = es.extras;
        if(es.trocas) ST.trocas = es.trocas;
        if(es.periodo) ST.periodo = es.periodo;
        if(p.atividades && p.atividades.length){ ST.runs = p.atividades; ST.origem = 'garmin' }
        PERFIL.paceLimiar = LIMIAR;
        try{ Z = zonas() }catch(err){}
        try{ rebuild(); selecionarProximo(); renderTudo() }catch(err){}
        try{ persistir() }catch(err){}
        if(typeof setStatus === 'function')
          setStatus('<span>✓</span><span>Backup restaurado sem perder nada do que já estava aqui.</span>','ok');
      }catch(err){
        if(typeof setStatus === 'function')
          setStatus('<span>⚠︎</span><span>Arquivo inválido: ' + err.message + '</span>','err');
      }
      e.target.value = '';
    };
  }
  setTimeout(arrumarBackup, 3000);
  setTimeout(arrumarBackup, 8000);
  document.addEventListener('click', function(){ setTimeout(arrumarBackup, 200) }, true);
});



/* ═══════════════ 12. LOGIN DE VERDADE NO FIREBASE ═══════════════
   Hoje o app entra com conta ANÔNIMA: accounts:signUp cria um usuário
   novo a cada vez. Com a regra "auth != null", qualquer pessoa que ache
   a chave no código-fonte faz o mesmo e lê tudo — treinos, gastos e
   dívidas. A chave está à vista: é assim que o Firebase funciona.

   Aqui o app passa a entrar com e-mail e senha SEUS. Depois disso a
   regra pode virar auth.uid === 'seu-uid' e mais ninguém entra.

   A senha é digitada uma vez, nesta tela, e NÃO fica guardada. O que
   fica no aparelho é o refresh token, que só serve para esta conta e
   você revoga no console do Firebase quando quiser.
   ══════════════════════════════════════════════════════════════════ */

PARTE('login firebase', function(){
  if(typeof FB_KEY !== 'string') throw new Error('sem FB_KEY');
  const K_RT = 'bq.rt', K_MAIL = 'bq.mail';
  let idToken = null, expiraEm = 0;

  const g = k => { try{ return localStorage.getItem(k) }catch(e){ return null } };
  const s_ = (k,v) => { try{ localStorage.setItem(k,v) }catch(e){} };
  const d_ = k => { try{ localStorage.removeItem(k) }catch(e){} };

  async function comSenha(email, senha){
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+FB_KEY,
      {method:'POST', headers:{'Content-Type':'application/json'},
       body:JSON.stringify({email:email, password:senha, returnSecureToken:true})});
    const j = await r.json();
    if(!r.ok) throw new Error((j.error && j.error.message) || 'HTTP '+r.status);
    idToken = j.idToken; expiraEm = Date.now() + (+j.expiresIn - 120)*1000;
    s_(K_RT, j.refreshToken); s_(K_MAIL, email);
    return {token:j.idToken, uid:j.localId};
  }

  async function comRefresh(){
    const rt = g(K_RT); if(!rt) return null;
    const r = await fetch('https://securetoken.googleapis.com/v1/token?key='+FB_KEY,
      {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
       body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(rt)});
    const j = await r.json();
    if(!r.ok){ d_(K_RT); return null }
    idToken = j.id_token; expiraEm = Date.now() + (+j.expires_in - 120)*1000;
    if(j.refresh_token) s_(K_RT, j.refresh_token);
    return j.id_token;
  }

  function pedirLogin(recado){
    return new Promise(function(ok){
      if(document.getElementById('bqLogin')) return ok(null);
      const f = document.createElement('div');
      f.id = 'bqLogin';
      f.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(6,8,12,.92);'
        + 'display:flex;align-items:center;justify-content:center;padding:22px;'
        + 'font-family:-apple-system,system-ui,sans-serif';
      f.innerHTML =
        '<form style="width:100%;max-width:330px;background:#12171F;border:1px solid #222B36;'
        + 'border-radius:16px;padding:22px;color:#E8ECF2">'
        + '<div style="font-size:17px;font-weight:600;margin-bottom:5px">Entrar</div>'
        + '<div style="font-size:12.5px;color:#8A94A6;line-height:1.5;margin-bottom:16px">'
        + (recado || 'Seus dados agora ficam protegidos por senha. Entre uma vez — o aparelho lembra.')
        + '</div>'
        + '<input id="bqMail" type="email" autocomplete="username" placeholder="e-mail" value="'
        + (g(K_MAIL) || '') + '" style="width:100%;box-sizing:border-box;padding:11px 12px;margin-bottom:9px;'
        + 'border-radius:9px;border:1px solid #2A3442;background:#0A0D12;color:#E8ECF2;font-size:15px">'
        + '<input id="bqPass" type="password" autocomplete="current-password" placeholder="senha"'
        + ' style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:9px;'
        + 'border:1px solid #2A3442;background:#0A0D12;color:#E8ECF2;font-size:15px">'
        + '<div id="bqErro" style="font-size:12px;color:#E0714F;margin-top:9px;display:none"></div>'
        + '<button type="submit" id="bqEntrar" style="width:100%;margin-top:14px;padding:12px;'
        + 'border:0;border-radius:10px;background:#D9A441;color:#14181f;font-size:15px;'
        + 'font-weight:700;cursor:pointer">Entrar</button></form>';
      document.body.appendChild(f);
      const form = f.querySelector('form'), erro = f.querySelector('#bqErro'),
            bt = f.querySelector('#bqEntrar');
      form.onsubmit = async function(ev){
        ev.preventDefault();
        const email = f.querySelector('#bqMail').value.trim();
        const senha = f.querySelector('#bqPass').value;
        if(!email || !senha) return;
        bt.disabled = true; bt.textContent = 'Entrando…'; erro.style.display = 'none';
        try{
          const r = await comSenha(email, senha);
          f.remove();
          console.log('fix.js · entrou. Seu uid para a regra do Firebase:', r.uid);
          alert('Pronto.\n\nSeu uid, para colar na regra do Firebase:\n\n' + r.uid);
          try{ location.reload() }catch(e){}
          ok(r.token);
        }catch(e){
          const m = String(e.message);
          erro.textContent = /PASSWORD|EMAIL/.test(m) ? 'E-mail ou senha não conferem.'
                           : /TOO_MANY/.test(m) ? 'Muitas tentativas. Espere alguns minutos.'
                           : 'Não consegui entrar: ' + m;
          erro.style.display = 'block';
          bt.disabled = false; bt.textContent = 'Entrar';
        }
      };
    });
  }

  window.fbToken = async function(){
    if(idToken && Date.now() < expiraEm) return idToken;
    const t = await comRefresh();
    if(t) return t;
    return await pedirLogin();
  };

  window.bqSair = function(){ d_(K_RT); idToken = null; location.reload() };
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
      if(ok && window.planoBQ){
        var l = window.planoBQ.ligado();
        if(confirm('fix.js ' + FIX_VERSAO + ' — as doze partes carregaram.\n\n'
          + 'Plano PEI Marathon: ' + (l ? 'LIGADO' : 'desligado')
          + '\n\nOK ' + (l ? 'desliga o plano e volta ao automático do app.'
                             : 'liga o plano da maratona.'))){
          l ? window.planoBQ.desligar() : window.planoBQ.ligar();
        }
        return;
      }
      alert(ok
        ? 'fix.js ' + FIX_VERSAO + ' — as doze partes carregaram.\n\nPlano PEI Marathon: ' + (window.planoBQ && window.planoBQ.ligado() ? 'LIGADO' : 'desligado') + '\n\nOK para trocar.'
        : 'fix.js ' + FIX_VERSAO + '\n\nFalharam:\n\n' + FIX_FALHAS.join('\n\n'));
    };
    barra.insertBefore(s, barra.firstChild.nextSibling);
    if(!ok) console.warn('fix.js · falhas:', FIX_FALHAS);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
  setTimeout(montar, 1500);
})();
