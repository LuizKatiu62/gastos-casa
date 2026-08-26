/* ══════════════════════════════════════════════════════════════════
   fix.js — correções da v2
   Versão 2026-08-12 · 02j · a análise passa a incluir o treino de hoje.

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
  13) Força como 2º treino do dia, com envio ao MOTRA e exercícios
      em inglês
  14) Step Speed Loss do HRM 600, na aba Índices junto da mecânica
  15) Números em cima das barras da Saúde e tabela de fases do sono
  16) Painel de objetivos recolhido quando já há prova escolhida
  17) Mover e cancelar treino deixam de duplicar e passam a durar
  18) Apagar que dura: a remoção viaja entre iPhone e Mac
  19) Análise feito x planejado no fim da aba Coach: veredito do bloco,
      último treino comparado, projeção da maratona e propostas de
      mudança que só valem depois que você tocar em Aplicar
   ══════════════════════════════════════════════════════════════════ */

const FIX_VERSAO = '06a';
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
  const pts = sem ? porSemana(sono, ['duracao','profundo','rem','soneca']) : sono;
  /* a barra agora e o sono das 24 h: a noite mais a soneca do dia */
  const tot = n => (+n.duracao || 0) + (+n.soneca || 0);
  const topo = Math.max(9, Math.ceil(Math.max(...pts.map(tot)) + 0.5));
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
    const nap  = +n.soneca || 0;
    /* filtro antes de desenhar: assim o ultimo pedaco da lista e sempre
       o topo real da barra, e so ele recebe o canto arredondado */
    const segs = [[prof,'var(--acc)'],[rem,'var(--swim)'],[leve,'var(--s3)'],
                  [nap,'var(--gym)']].filter(seg => seg[0] > 0.02);
    let base = 0;
    segs.forEach(([v,c],k)=>{
      const topoY = y(base+v), alt = Math.max(2, y(base)-y(base+v));
      const r = (k === segs.length-1) ? Math.min(larg/2,5) : 0;
      s += `<path d="M${x(i)-larg/2},${topoY+r} a${r},${r} 0 0 1 ${r},${-r} h${larg-2*r} ` +
           `a${r},${r} 0 0 1 ${r},${r} v${alt-r} h${-larg} Z" fill="${c}"/>`;
      base += v;
    });
  });
  const totU = tot(ult);
  const corS = totU>=7?'var(--ok)':totU>=6?'var(--warn)':'var(--bad)';
  s += selo(totU.toFixed(1)+' h', corS);
  s += eixoX(pts, x);
  host.innerHTML = svg('Fases do sono por '+(sem?'semana':'noite'), s);

  const md = +(sono.reduce((a,b)=>a+b.duracao,0)/sono.length).toFixed(1);
  const boas = sono.filter(n=>tot(n)>=7).length;
  const comNap = sono.filter(n=>(+n.soneca||0) > 0.02);
  const mdNap = comNap.length
    ? +(comNap.reduce((a,b)=>a+(+b.soneca||0),0)/comNap.length).toFixed(1) : 0;
  q('#sSonosub').innerHTML = `${sem?'Cada barra é a média de uma semana. ':''}` +
    `Média de <b>${md} h</b> por noite. <b>${boas}</b> de ${sono.length} ` +
    `${sem?'semanas':'dias'} acima de 7 h somando noite e soneca. ` +
    (comNap.length
      ? `O pedaço laranja no alto é a soneca: <b>${comNap.length}</b> ` +
        `${comNap.length===1?'dia':'dias'} com cochilo, média de <b>${mdNap} h</b>. `
      : '') +
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

   NATAÇÃO: segunda-feira, regenerativa e opcional. A semana 1 fica
   sem — a segunda dela é 10/08, que já estava acabando quando o plano
   ficou pronto. O ciclo começa na terça, dia 11. Zero impacto, no
   dia seguinte ao longo. Sexta continua folga inteira.

   FORÇA: duas por semana, na terça e na quinta, como SEGUNDO treino
   do dia — sessão separada, não etapa dentro da corrida. Assim segunda e sexta
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

  const PLANO = {"2026-08-11":{"id":"2026-08-11","data":"2026-08-11","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem leve","detalhe":"7 km soltos + 6 acelerações de 20 s no fim. Aceleração não é tiro: é acordar a passada.","km":7,"bikeKm":null,"metros":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"6:35","prova":false,"forca":"base_a","min":46,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"7 km soltos + 6 acelerações de 20 s no fim. Aceleração não é tiro: é acordar a passada.","tags":[{"t":"7 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-12":{"id":"2026-08-12","data":"2026-08-12","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem curta","detalhe":"6 km em ritmo de conversa. Se não consegue falar uma frase inteira, está rápido demais.","km":6,"bikeKm":null,"metros":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km em ritmo de conversa. Se não consegue falar uma frase inteira, está rápido demais.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-13":{"id":"2026-08-13","data":"2026-08-13","mod":"corrida","foco":"limiar","fase":"Base","titulo":"Limiar 4×5 min","detalhe":"2 km aquecimento · 4×5 min a 5:00/km com 2 min de trote · 2 km soltando.","km":9,"bikeKm":null,"metros":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"5:00","prova":false,"forca":"base_b","min":45,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 4×5 min a 5:00/km com 2 min de trote · 2 km soltando.","tags":[{"t":"9 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-08-15":{"id":"2026-08-15","data":"2026-08-15","mod":"bike","foco":"cross","fase":"Base","titulo":"Bike na estrada 22 km","detalhe":"60 min na estrada, em Z2. Terreno ondulado como o de Quispamsis serve bem: subida na bike é força de perna sem nenhum impacto.","km":0,"bikeKm":22,"metros":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":null,"prova":false,"forca":null,"min":58,"passos":[{"t":"Bike na estrada","d":"60 min na estrada, em Z2. Terreno ondulado como o de Quispamsis serve bem: subida na bike é força de perna sem nenhum impacto.","tags":[{"t":"22 km"},{"t":"58 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-08-16":{"id":"2026-08-16","data":"2026-08-16","mod":"corrida","foco":"longo","fase":"Base","titulo":"Longo 20 km","detalhe":"Conversa do início ao fim. <b>De manhã</b>: a prova larga às 7h e todos os seus treinos são de tarde.","km":20,"bikeKm":null,"metros":null,"semana":1,"alvoSem":"Voltar à rotina depois da 25k de 2 de agosto","pace":"6:10","prova":false,"forca":null,"min":123,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Conversa do início ao fim. <b>De manhã</b>: a prova larga às 7h e todos os seus treinos são de tarde.","tags":[{"t":"20 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-08-17":{"id":"2026-08-17","data":"2026-08-17","mod":"natacao","foco":"natacao","fase":"Base","titulo":"Natação regenerativa 1000 m","detalhe":"6×100 m + 4×50 m de pernada com prancha. A pernada solta o tornozelo, que corrida enrijece.","km":0,"bikeKm":null,"metros":1000,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":null,"prova":false,"forca":null,"min":26,"passos":[{"t":"Natação regenerativa","d":"6×100 m + 4×50 m de pernada com prancha. A pernada solta o tornozelo, que corrida enrijece.","tags":[{"t":"1000 m"},{"t":"26 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-08-18":{"id":"2026-08-18","data":"2026-08-18","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem leve","detalhe":"8 km soltos + 6 acelerações de 20 s.","km":8,"bikeKm":null,"metros":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"6:35","prova":false,"forca":"base_a","min":53,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km soltos + 6 acelerações de 20 s.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-19":{"id":"2026-08-19","data":"2026-08-19","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem curta","detalhe":"6 km fáceis.","km":6,"bikeKm":null,"metros":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km fáceis.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-20":{"id":"2026-08-20","data":"2026-08-20","mod":"corrida","foco":"mp","fase":"Base","titulo":"Prova 2×4 km","detalhe":"2 km aquecimento · 2×4 km a 5:27/km com 3 min de trote · 2 km soltando. Grave a sensação: é ela que você persegue em 18/10.","km":10,"bikeKm":null,"metros":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"5:27","prova":false,"forca":"base_b","min":54,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 2×4 km a 5:27/km com 3 min de trote · 2 km soltando. Grave a sensação: é ela que você persegue em 18/10.","tags":[{"t":"10 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-08-22":{"id":"2026-08-22","data":"2026-08-22","mod":"bike","foco":"cross","fase":"Base","titulo":"Bike na estrada 25 km","detalhe":"65 min em Z2, respirando pelo nariz. Se ofegar na subida, troque a marcha em vez de forçar.","km":0,"bikeKm":25,"metros":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":null,"prova":false,"forca":null,"min":66,"passos":[{"t":"Bike na estrada","d":"65 min em Z2, respirando pelo nariz. Se ofegar na subida, troque a marcha em vez de forçar.","tags":[{"t":"25 km"},{"t":"66 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-08-23":{"id":"2026-08-23","data":"2026-08-23","mod":"corrida","foco":"longo","fase":"Base","titulo":"Longo 23 km","detalhe":"Últimos 4 km acelerando para 5:45/km. Terminar forte ensina o corpo a poupar glicogênio.","km":23,"bikeKm":null,"metros":null,"semana":2,"alvoSem":"Primeiro contato com o ritmo de prova","pace":"6:10","prova":false,"forca":null,"min":142,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Últimos 4 km acelerando para 5:45/km. Terminar forte ensina o corpo a poupar glicogênio.","tags":[{"t":"23 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-08-24":{"id":"2026-08-24","data":"2026-08-24","mod":"natacao","foco":"natacao","fase":"Base","titulo":"Natação regenerativa 1100 m","detalhe":"8×100 m com 20 s de pausa. Se o ombro reclamar, corte pela metade — isto aqui é recuperação, não treino.","km":0,"bikeKm":null,"metros":1100,"semana":3,"alvoSem":"Maior volume até aqui","pace":null,"prova":false,"forca":null,"min":29,"passos":[{"t":"Natação regenerativa","d":"8×100 m com 20 s de pausa. Se o ombro reclamar, corte pela metade — isto aqui é recuperação, não treino.","tags":[{"t":"1100 m"},{"t":"29 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-08-25":{"id":"2026-08-25","data":"2026-08-25","mod":"corrida","foco":"facil","fase":"Base","titulo":"Rodagem leve","detalhe":"8 km + 6 acelerações.","km":8,"bikeKm":null,"metros":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"6:35","prova":false,"forca":"base_a","min":53,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km + 6 acelerações.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-08-26":{"id":"2026-08-26","data":"2026-08-26","mod":"corrida","foco":"vo2","fase":"Base","titulo":"Intervalado 5×3 min","detalhe":"2 km aquecimento · 5×3 min a 4:35/km com 2 min de trote · 2 km soltando. Sobe o VO2max, que é o teto de tudo o mais.","km":9,"bikeKm":null,"metros":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"4:35","prova":false,"forca":null,"min":41,"passos":[{"t":"Aquecimento","d":"12 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"12 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Educativos","d":"4×20 s: skipping alto, anfersen, dribles, passada saltada. Caminhe 40 s entre eles.","tags":[{"t":"≈4 min"}]},{"t":"Parte principal","d":"2 km aquecimento · 5×3 min a 4:35/km com 2 min de trote · 2 km soltando. Sobe o VO2max, que é o teto de tudo o mais.","tags":[{"t":"9 km"},{"t":"4:35/km","c":"z"},{"t":"156–163 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Trechos curtos e fortes sobem o VO₂max, que é o teto de tudo. Aos 64 é o que mais se perde com a idade e o que mais responde ao treino.","tags":[]}]},"2026-08-27":{"id":"2026-08-27","data":"2026-08-27","mod":"corrida","foco":"limiar","fase":"Base","titulo":"Limiar 2×12 min","detalhe":"2 km aquecimento · 2×12 min a 5:00/km com 3 min de trote · 2 km soltando.","km":10,"bikeKm":null,"metros":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"5:00","prova":false,"forca":"base_b","min":50,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 2×12 min a 5:00/km com 3 min de trote · 2 km soltando.","tags":[{"t":"10 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-08-29":{"id":"2026-08-29","data":"2026-08-29","mod":"bike","foco":"cross","fase":"Base","titulo":"Bike na estrada 27 km","detalhe":"70 min em Z2. Aproveite que ainda está calor — em novembro esta sessão vira rolo dentro de casa.","km":0,"bikeKm":27,"metros":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":null,"prova":false,"forca":null,"min":72,"passos":[{"t":"Bike na estrada","d":"70 min em Z2. Aproveite que ainda está calor — em novembro esta sessão vira rolo dentro de casa.","tags":[{"t":"27 km"},{"t":"72 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-08-30":{"id":"2026-08-30","data":"2026-08-30","mod":"corrida","foco":"longo","fase":"Base","titulo":"Longo 26 km","detalhe":"Solto. Treine o abastecimento: um gel aos 40 min e a cada 40 min depois. Use o que vai usar na prova.","km":26,"bikeKm":null,"metros":null,"semana":3,"alvoSem":"Maior volume até aqui","pace":"6:10","prova":false,"forca":null,"min":160,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Solto. Treine o abastecimento: um gel aos 40 min e a cada 40 min depois. Use o que vai usar na prova.","tags":[{"t":"26 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-08-31":{"id":"2026-08-31","data":"2026-08-31","mod":"natacao","foco":"natacao","fase":"Recuperação","titulo":"Natação regenerativa 700 m","detalhe":"Semana leve também na água. 5×100 m soltos, e fim.","km":0,"bikeKm":null,"metros":700,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":null,"prova":false,"forca":null,"min":18,"passos":[{"t":"Natação regenerativa","d":"Semana leve também na água. 5×100 m soltos, e fim.","tags":[{"t":"700 m"},{"t":"18 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-09-01":{"id":"2026-09-01","data":"2026-09-01","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Rodagem leve","detalhe":"7 km soltos.","km":7,"bikeKm":null,"metros":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"6:35","prova":false,"forca":"base_a","min":46,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"7 km soltos.","tags":[{"t":"7 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-02":{"id":"2026-09-02","data":"2026-09-02","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Regenerativo","detalhe":"6 km bem devagar.","km":6,"bikeKm":null,"metros":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"7:00","prova":false,"forca":null,"min":42,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km bem devagar.","tags":[{"t":"6 km"},{"t":"7:00/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-03":{"id":"2026-09-03","data":"2026-09-03","mod":"corrida","foco":"mp","fase":"Recuperação","titulo":"Prova 3×3 km","detalhe":"2 km aquecimento · 3×3 km a 5:27/km com 2 min de trote · 1 km soltando.","km":8,"bikeKm":null,"metros":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"5:27","prova":false,"forca":"base_b","min":44,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×3 km a 5:27/km com 2 min de trote · 1 km soltando.","tags":[{"t":"8 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-09-05":{"id":"2026-09-05","data":"2026-09-05","mod":"bike","foco":"cross","fase":"Recuperação","titulo":"Bike leve na estrada 18 km","detalhe":"50 min bem soltos, terreno plano. Semana de recuperação: a bike é passeio, não treino.","km":0,"bikeKm":18,"metros":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":null,"prova":false,"forca":null,"min":48,"passos":[{"t":"Bike na estrada","d":"50 min bem soltos, terreno plano. Semana de recuperação: a bike é passeio, não treino.","tags":[{"t":"18 km"},{"t":"48 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-06":{"id":"2026-09-06","data":"2026-09-06","mod":"corrida","foco":"longo","fase":"Recuperação","titulo":"Longo curto 17 km","detalhe":"Curto de propósito. Corpo cansado não absorve treino.","km":17,"bikeKm":null,"metros":null,"semana":4,"alvoSem":"Semana leve — é aqui que o ganho gruda","pace":"6:10","prova":false,"forca":null,"min":105,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Curto de propósito. Corpo cansado não absorve treino.","tags":[{"t":"17 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-07":{"id":"2026-09-07","data":"2026-09-07","mod":"natacao","foco":"natacao","fase":"Construção","titulo":"Natação regenerativa 1200 m","detalhe":"8×100 m + 4×50 m de pernada. Respiração bilateral, a cada 3 braçadas.","km":0,"bikeKm":null,"metros":1200,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":null,"prova":false,"forca":null,"min":31,"passos":[{"t":"Natação regenerativa","d":"8×100 m + 4×50 m de pernada. Respiração bilateral, a cada 3 braçadas.","tags":[{"t":"1200 m"},{"t":"31 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-09-08":{"id":"2026-09-08","data":"2026-09-08","mod":"corrida","foco":"facil","fase":"Construção","titulo":"Rodagem leve","detalhe":"8 km + 6 acelerações.","km":8,"bikeKm":null,"metros":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"6:35","prova":false,"forca":"pico_a","min":53,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km + 6 acelerações.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-09":{"id":"2026-09-09","data":"2026-09-09","mod":"corrida","foco":"vo2","fase":"Construção","titulo":"Intervalado 6×3 min","detalhe":"2 km aquecimento · 6×3 min a 4:35/km com 2 min de trote · 1 km soltando.","km":9,"bikeKm":null,"metros":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"4:35","prova":false,"forca":null,"min":41,"passos":[{"t":"Aquecimento","d":"12 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"12 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Educativos","d":"4×20 s: skipping alto, anfersen, dribles, passada saltada. Caminhe 40 s entre eles.","tags":[{"t":"≈4 min"}]},{"t":"Parte principal","d":"2 km aquecimento · 6×3 min a 4:35/km com 2 min de trote · 1 km soltando.","tags":[{"t":"9 km"},{"t":"4:35/km","c":"z"},{"t":"156–163 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Trechos curtos e fortes sobem o VO₂max, que é o teto de tudo. Aos 64 é o que mais se perde com a idade e o que mais responde ao treino.","tags":[]}]},"2026-09-10":{"id":"2026-09-10","data":"2026-09-10","mod":"corrida","foco":"limiar","fase":"Construção","titulo":"Limiar 3×10 min","detalhe":"2 km aquecimento · 3×10 min a 5:00/km com 2 min de trote · 1 km soltando.","km":10,"bikeKm":null,"metros":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"5:00","prova":false,"forca":"pico_b","min":50,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×10 min a 5:00/km com 2 min de trote · 1 km soltando.","tags":[{"t":"10 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-09-12":{"id":"2026-09-12","data":"2026-09-12","mod":"bike","foco":"cross","fase":"Construção","titulo":"Bike na estrada 27 km","detalhe":"70 min em Z2, com 300 m de subida acumulada se possível.","km":0,"bikeKm":27,"metros":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":null,"prova":false,"forca":null,"min":72,"passos":[{"t":"Bike na estrada","d":"70 min em Z2, com 300 m de subida acumulada se possível.","tags":[{"t":"27 km"},{"t":"72 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-13":{"id":"2026-09-13","data":"2026-09-13","mod":"corrida","foco":"longo","fase":"Construção","titulo":"Longo 28 km · 8 km de prova","detalhe":"20 km soltos e os últimos <b>8 km a 5:27/km</b>. Correr no ritmo com a perna cansada é o treino mais parecido com a maratona.","km":28,"bikeKm":null,"metros":null,"semana":5,"alvoSem":"Começa o bloco que decide a prova","pace":"6:10","prova":false,"forca":null,"min":173,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"20 km soltos e os últimos <b>8 km a 5:27/km</b>. Correr no ritmo com a perna cansada é o treino mais parecido com a maratona.","tags":[{"t":"28 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-14":{"id":"2026-09-14","data":"2026-09-14","mod":"natacao","foco":"natacao","fase":"Construção","titulo":"Natação regenerativa 1200 m","detalhe":"10×100 m com 20 s de pausa, ritmo constante do primeiro ao último.","km":0,"bikeKm":null,"metros":1200,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":null,"prova":false,"forca":null,"min":31,"passos":[{"t":"Natação regenerativa","d":"10×100 m com 20 s de pausa, ritmo constante do primeiro ao último.","tags":[{"t":"1200 m"},{"t":"31 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-09-15":{"id":"2026-09-15","data":"2026-09-15","mod":"corrida","foco":"facil","fase":"Construção","titulo":"Rodagem leve","detalhe":"9 km + 6 acelerações.","km":9,"bikeKm":null,"metros":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"6:35","prova":false,"forca":"pico_a","min":59,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"9 km + 6 acelerações.","tags":[{"t":"9 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-16":{"id":"2026-09-16","data":"2026-09-16","mod":"corrida","foco":"subidas","fase":"Construção","titulo":"Subidas 8×60 s","detalhe":"2 km aquecimento · 8×60 s subindo forte, descendo trotando · 2 km soltando. Força de perna sem academia e sem o impacto do tiro no plano.","km":9,"bikeKm":null,"metros":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"4:35","prova":false,"forca":null,"min":41,"passos":[{"t":"Aquecimento","d":"12 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"12 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Educativos","d":"4×20 s: skipping alto, anfersen, dribles, passada saltada. Caminhe 40 s entre eles.","tags":[{"t":"≈4 min"}]},{"t":"Parte principal","d":"2 km aquecimento · 8×60 s subindo forte, descendo trotando · 2 km soltando. Força de perna sem academia e sem o impacto do tiro no plano.","tags":[{"t":"9 km"},{"t":"4:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Subida é musculação disfarçada de corrida: ganha força de perna sem o impacto que o tiro no plano cobra.","tags":[]}]},"2026-09-17":{"id":"2026-09-17","data":"2026-09-17","mod":"corrida","foco":"mp","fase":"Construção","titulo":"Prova 3×5 km","detalhe":"2 km aquecimento · 3×5 km a 5:27/km com 3 min de trote · 1 km soltando.","km":13,"bikeKm":null,"metros":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"5:27","prova":false,"forca":"pico_b","min":71,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×5 km a 5:27/km com 3 min de trote · 1 km soltando.","tags":[{"t":"13 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-09-19":{"id":"2026-09-19","data":"2026-09-19","mod":"bike","foco":"cross","fase":"Construção","titulo":"Bike na estrada 29 km","detalhe":"75 min em Z2. O maior giro do ciclo — no dia seguinte vem o longo com 12 km em ritmo, então nada de forçar hoje.","km":0,"bikeKm":29,"metros":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":null,"prova":false,"forca":null,"min":77,"passos":[{"t":"Bike na estrada","d":"75 min em Z2. O maior giro do ciclo — no dia seguinte vem o longo com 12 km em ritmo, então nada de forçar hoje.","tags":[{"t":"29 km"},{"t":"77 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-20":{"id":"2026-09-20","data":"2026-09-20","mod":"corrida","foco":"longo","fase":"Construção","titulo":"Longo 26 km · 12 km de prova","detalhe":"14 km soltos e <b>12 km a 5:27/km</b>. Sessão-chave do ciclo: se esta sair inteira, 3:50 deixa de ser aposta.","km":26,"bikeKm":null,"metros":null,"semana":6,"alvoSem":"Volume alto, cabeça calma","pace":"6:10","prova":false,"forca":null,"min":160,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"14 km soltos e <b>12 km a 5:27/km</b>. Sessão-chave do ciclo: se esta sair inteira, 3:50 deixa de ser aposta.","tags":[{"t":"26 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-21":{"id":"2026-09-21","data":"2026-09-21","mod":"natacao","foco":"natacao","fase":"Pico","titulo":"Natação regenerativa 800 m","detalhe":"Semana mais dura do ciclo: aqui só 6×100 m bem soltos, para tirar a rigidez do longo.","km":0,"bikeKm":null,"metros":800,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":null,"prova":false,"forca":null,"min":21,"passos":[{"t":"Natação regenerativa","d":"Semana mais dura do ciclo: aqui só 6×100 m bem soltos, para tirar a rigidez do longo.","tags":[{"t":"800 m"},{"t":"21 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-09-22":{"id":"2026-09-22","data":"2026-09-22","mod":"corrida","foco":"facil","fase":"Pico","titulo":"Rodagem leve","detalhe":"9 km + 6 acelerações.","km":9,"bikeKm":null,"metros":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"6:35","prova":false,"forca":"pico_a","min":59,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"9 km + 6 acelerações.","tags":[{"t":"9 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-23":{"id":"2026-09-23","data":"2026-09-23","mod":"corrida","foco":"limiar","fase":"Pico","titulo":"Limiar 4×8 min","detalhe":"2 km aquecimento · 4×8 min a 5:00/km com 2 min de trote · 2 km soltando.","km":11,"bikeKm":null,"metros":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"5:00","prova":false,"forca":null,"min":55,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 4×8 min a 5:00/km com 2 min de trote · 2 km soltando.","tags":[{"t":"11 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-09-24":{"id":"2026-09-24","data":"2026-09-24","mod":"corrida","foco":"facil","fase":"Pico","titulo":"Rodagem","detalhe":"8 km fáceis. Não invente nada: o longo de domingo é o treino da semana.","km":8,"bikeKm":null,"metros":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"6:35","prova":false,"forca":"pico_b","min":53,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km fáceis. Não invente nada: o longo de domingo é o treino da semana.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-26":{"id":"2026-09-26","data":"2026-09-26","mod":"bike","foco":"cross","fase":"Pico","titulo":"Bike leve na estrada 18 km","detalhe":"50 min soltos, plano. Amanhã é o longo de 32 km: as pernas precisam chegar frescas.","km":0,"bikeKm":18,"metros":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":null,"prova":false,"forca":null,"min":48,"passos":[{"t":"Bike na estrada","d":"50 min soltos, plano. Amanhã é o longo de 32 km: as pernas precisam chegar frescas.","tags":[{"t":"18 km"},{"t":"48 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-09-27":{"id":"2026-09-27","data":"2026-09-27","mod":"corrida","foco":"longo","fase":"Pico","titulo":"Longo 32 km · 10 km de prova","detalhe":"22 km soltos e os últimos <b>10 km a 5:27/km</b>. O maior do ciclo. Ensaio geral: mesma roupa, mesmo tênis, mesmo gel, mesma hora da largada.","km":32,"bikeKm":null,"metros":null,"semana":7,"alvoSem":"A semana mais dura — e a última dura","pace":"6:10","prova":false,"forca":null,"min":197,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"22 km soltos e os últimos <b>10 km a 5:27/km</b>. O maior do ciclo. Ensaio geral: mesma roupa, mesmo tênis, mesmo gel, mesma hora da largada.","tags":[{"t":"32 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"Abastecimento","d":"Um gole de água a cada 15 min a partir do km 6. Um gel aos 40 min e a cada 40 min depois. Use exatamente o que vai usar em 18/10 — o estômago também treina.","tags":[{"t":"obrigatório"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-09-28":{"id":"2026-09-28","data":"2026-09-28","mod":"natacao","foco":"natacao","fase":"Recuperação","titulo":"Natação regenerativa 700 m","detalhe":"5×100 m em ritmo de conversa.","km":0,"bikeKm":null,"metros":700,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":null,"prova":false,"forca":null,"min":18,"passos":[{"t":"Natação regenerativa","d":"5×100 m em ritmo de conversa.","tags":[{"t":"700 m"},{"t":"18 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-09-29":{"id":"2026-09-29","data":"2026-09-29","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Rodagem leve","detalhe":"8 km soltos.","km":8,"bikeKm":null,"metros":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"6:35","prova":false,"forca":"manut","min":53,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km soltos.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-09-30":{"id":"2026-09-30","data":"2026-09-30","mod":"corrida","foco":"facil","fase":"Recuperação","titulo":"Regenerativo","detalhe":"6 km bem devagar.","km":6,"bikeKm":null,"metros":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"7:00","prova":false,"forca":null,"min":42,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km bem devagar.","tags":[{"t":"6 km"},{"t":"7:00/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-01":{"id":"2026-10-01","data":"2026-10-01","mod":"corrida","foco":"mp","fase":"Recuperação","titulo":"Prova 2×5 km","detalhe":"2 km aquecimento · 2×5 km a 5:27/km com 3 min de trote · 1 km soltando.","km":10,"bikeKm":null,"metros":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"5:27","prova":false,"forca":null,"min":54,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 2×5 km a 5:27/km com 3 min de trote · 1 km soltando.","tags":[{"t":"10 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-10-03":{"id":"2026-10-03","data":"2026-10-03","mod":"bike","foco":"cross","fase":"Recuperação","titulo":"Bike leve na estrada 18 km","detalhe":"50 min soltos.","km":0,"bikeKm":18,"metros":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":null,"prova":false,"forca":null,"min":48,"passos":[{"t":"Bike na estrada","d":"50 min soltos.","tags":[{"t":"18 km"},{"t":"48 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-10-04":{"id":"2026-10-04","data":"2026-10-04","mod":"corrida","foco":"longo","fase":"Recuperação","titulo":"Longo 20 km","detalhe":"Solto do começo ao fim.","km":20,"bikeKm":null,"metros":null,"semana":8,"alvoSem":"Descarga — resista à vontade de fazer mais","pace":"6:10","prova":false,"forca":null,"min":123,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"Solto do começo ao fim.","tags":[{"t":"20 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-10-05":{"id":"2026-10-05","data":"2026-10-05","mod":"natacao","foco":"natacao","fase":"Polimento","titulo":"Natação regenerativa 600 m","detalhe":"4×100 m. Só para mexer o corpo.","km":0,"bikeKm":null,"metros":600,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":null,"prova":false,"forca":null,"min":16,"passos":[{"t":"Natação regenerativa","d":"4×100 m. Só para mexer o corpo.","tags":[{"t":"600 m"},{"t":"16 min"},{"t":"ritmo de conversa"}]},{"t":"É opcional","d":"Se o corpo pedir descanso, descanse. Isto está aqui para soltar quadril e tornozelo no dia seguinte ao longo, com zero impacto — não para somar treino.","tags":[]},{"t":"Por que está aqui","d":"Correr encurta e enrijece flexor de quadril e panturrilha. Nadar move as mesmas articulações em amplitude total, sem peso do corpo. Aos 64 isso vale mais que um dia parado.","tags":[]}]},"2026-10-06":{"id":"2026-10-06","data":"2026-10-06","mod":"corrida","foco":"facil","fase":"Polimento","titulo":"Rodagem leve","detalhe":"8 km + 6 acelerações.","km":8,"bikeKm":null,"metros":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"6:35","prova":false,"forca":"manut","min":53,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"8 km + 6 acelerações.","tags":[{"t":"8 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-07":{"id":"2026-10-07","data":"2026-10-07","mod":"corrida","foco":"limiar","fase":"Polimento","titulo":"Limiar 3×8 min","detalhe":"2 km aquecimento · 3×8 min a 5:00/km com 2 min de trote · 2 km soltando.","km":10,"bikeKm":null,"metros":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"5:00","prova":false,"forca":null,"min":50,"passos":[{"t":"Aquecimento","d":"10 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"10 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km aquecimento · 3×8 min a 5:00/km com 2 min de trote · 2 km soltando.","tags":[{"t":"10 km"},{"t":"5:00/km","c":"z"},{"t":"148–156 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Limiar é o ritmo que você aguentaria por uma hora em prova. Treinar aqui empurra para cima o teto do que você sustenta sem acumular lactato.","tags":[]}]},"2026-10-08":{"id":"2026-10-08","data":"2026-10-08","mod":"corrida","foco":"facil","fase":"Polimento","titulo":"Rodagem","detalhe":"6 km fáceis.","km":6,"bikeKm":null,"metros":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km fáceis.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-10":{"id":"2026-10-10","data":"2026-10-10","mod":"bike","foco":"cross","fase":"Polimento","titulo":"Bike leve na estrada 14 km","detalhe":"40 min bem leves. Última bike antes da prova.","km":0,"bikeKm":14,"metros":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":null,"prova":false,"forca":null,"min":37,"passos":[{"t":"Bike na estrada","d":"40 min bem leves. Última bike antes da prova.","tags":[{"t":"14 km"},{"t":"37 min"},{"t":"115–132 bpm","c":"hr"}]},{"t":"Enquanto dá","d":"Na estrada até o frio chegar. Em Saint John isso vale até o fim de outubro — depois desta prova a bike migra para o rolo, e o plano de inverno já vai considerar isso.","tags":[]},{"t":"Por que está aqui","d":"Bike dá estímulo aeróbico sem impacto. Aos 64, é o que permite manter volume sem somar desgaste nas articulações. Na estrada ainda ganha o trabalho de equilíbrio e a cabeça arejada, que o rolo não dá.","tags":[]}]},"2026-10-11":{"id":"2026-10-11","data":"2026-10-11","mod":"corrida","foco":"longo","fase":"Polimento","titulo":"Longo 16 km · 6 km de prova","detalhe":"10 km soltos e <b>6 km a 5:27/km</b>. Último longo do ciclo.","km":16,"bikeKm":null,"metros":null,"semana":9,"alvoSem":"Cai o volume, o ritmo fica","pace":"6:10","prova":false,"forca":null,"min":99,"passos":[{"t":"Aquecimento","d":"Os 2 primeiros km já são o aquecimento. Comece mais devagar do que quer.","tags":[{"t":"6:40/km","c":"z"}]},{"t":"Parte principal","d":"10 km soltos e <b>6 km a 5:27/km</b>. Último longo do ciclo.","tags":[{"t":"16 km"},{"t":"6:10/km","c":"z"},{"t":"130–142 bpm","c":"hr"}]},{"t":"De manhã","d":"Todos os seus treinos são de tarde e a prova larga às 7h. Faça pelo menos o longo de manhã, em jejum leve ou com o café da prova.","tags":[{"t":"7h–9h"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"O longo é o treino da maratona. Ele ensina o corpo a usar gordura como combustível e endurece tendão e osso para as quatro horas de impacto.","tags":[]}]},"2026-10-13":{"id":"2026-10-13","data":"2026-10-13","mod":"corrida","foco":"mp","fase":"Semana da prova","titulo":"Rodagem com prova","detalhe":"2 km soltos · 3 km a 5:27/km · 3 km soltos. Só para o corpo lembrar o ritmo.","km":8,"bikeKm":null,"metros":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"5:27","prova":false,"forca":null,"min":44,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"2 km soltos · 3 km a 5:27/km · 3 km soltos. Só para o corpo lembrar o ritmo.","tags":[{"t":"8 km"},{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Correr no ritmo exato da prova ensina duas coisas: a economia do gesto naquela velocidade e, principalmente, como esse ritmo deve SENTIR. No dia 18 você não vai olhar o relógio o tempo todo.","tags":[]}]},"2026-10-14":{"id":"2026-10-14","data":"2026-10-14","mod":"corrida","foco":"facil","fase":"Semana da prova","titulo":"Rodagem curta","detalhe":"6 km fáceis.","km":6,"bikeKm":null,"metros":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"6:35","prova":false,"forca":null,"min":40,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"6 km fáceis.","tags":[{"t":"6 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-15":{"id":"2026-10-15","data":"2026-10-15","mod":"corrida","foco":"facil","fase":"Semana da prova","titulo":"Soltura","detalhe":"5 km soltos + 4 acelerações de 20 s.","km":5,"bikeKm":null,"metros":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"6:35","prova":false,"forca":null,"min":33,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"5 km soltos + 4 acelerações de 20 s.","tags":[{"t":"5 km"},{"t":"6:35/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-17":{"id":"2026-10-17","data":"2026-10-17","mod":"corrida","foco":"facil","fase":"Semana da prova","titulo":"Soltura pré-prova","detalhe":"4 km bem leves. Retire o número e deixe tudo separado hoje.","km":4,"bikeKm":null,"metros":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"7:00","prova":false,"forca":null,"min":28,"passos":[{"t":"Aquecimento","d":"8 min bem leves. Se as pernas estiverem pesadas, comece caminhando 3 min.","tags":[{"t":"8 min"},{"t":"6:30–7:00/km","c":"z"}]},{"t":"Parte principal","d":"4 km bem leves. Retire o número e deixe tudo separado hoje.","tags":[{"t":"4 km"},{"t":"7:00/km","c":"z"},{"t":"120–135 bpm","c":"hr"}]},{"t":"Desaquecimento","d":"5 min de trote muito leve, depois 5 min de mobilidade: panturrilha, posterior, quadril e tornozelo.","tags":[{"t":"10 min"}]},{"t":"Por que está aqui","d":"Rodagem fácil é onde mora o volume. Ela não te deixa mais rápido sozinha — ela permite que os treinos fortes existam sem te quebrar.","tags":[]}]},"2026-10-18":{"id":"2026-10-18","data":"2026-10-18","mod":"corrida","foco":"prova","fase":"Semana da prova","titulo":"PEI MARATHON · Charlottetown","detalhe":"Largada 7h. Primeiros 5 km <b>a 5:35</b>, mais devagar que o alvo, de propósito. Depois assente em 5:27. Se aos 32 km ainda estiver bem, aperte.","km":42.2,"bikeKm":null,"metros":null,"semana":10,"alvoSem":"Chegar descansado vale mais que qualquer treino","pace":"5:27","prova":true,"forca":null,"min":230,"passos":[{"t":"Antes da largada","d":"Acorde 3 h antes. Café da manhã testado nos longos, nada novo. Chegue com 1 h de folga: são 7h da manhã e vai estar frio em Charlottetown.","tags":[{"t":"7h00"}]},{"t":"Km 1 a 5 — segure","d":"A 5:35/km, mais devagar que o alvo. Todo mundo sai rápido demais e todo mundo paga depois dos 30. Esses 40 segundos guardados valem 4 minutos no fim.","tags":[{"t":"5:35/km","c":"z"},{"t":"136–144 bpm","c":"hr"}]},{"t":"Km 5 a 32 — assente","d":"5:27/km, o ritmo que você repetiu em todos os longos. Gel a cada 40 min, água em todos os postos. Não acelere quando se sentir bem — você vai se sentir bem, é assim que funciona.","tags":[{"t":"5:27/km","c":"z"},{"t":"140–148 bpm","c":"hr"}]},{"t":"Km 32 ao fim — decida","d":"Se ainda estiver inteiro, aperte para 5:20. Se estiver sofrendo, segure 5:27 e não olhe para trás. 3:50 dá 15 min de folga no índice; 3:55 ainda te classifica com sobra.","tags":[{"t":"5:20–5:27/km","c":"z"}]},{"t":"Alvos do dia","d":"A · 3:50:00 (5:27/km) — folga larga no índice.<br>B · 3:55:00 (5:34/km) — classifica com folga sobre o corte histórico.<br>C · 4:04:59 — índice cravado; entra na seleção aleatória.<br>Qualquer um dos três é uma primeira maratona bem corrida aos 64 anos.","tags":[]}]}};

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
  const TUM = 'bq.apagados';

  /* Lápides. A sincronia traz do servidor tudo que falta aqui — e é
     exatamente isso que ressuscita o que você acabou de apagar. Quem
     apaga em um aparelho registra aqui, e por 24 h a sincronia
     respeita. Vale para o segundo treino do dia e para as trocas. */
  window.bqApagar = function(tipo, chave){
    try{
      const m = JSON.parse(localStorage.getItem(TUM) || '{}');
      m[tipo + '|' + chave] = Date.now();
      localStorage.setItem(TUM, JSON.stringify(m));
    }catch(e){}
  };
  window.bqFoiApagado = function(tipo, chave){
    try{
      const m = JSON.parse(localStorage.getItem(TUM) || '{}');
      const t = m[tipo + '|' + chave];
      return !!t && (Date.now() - t) < JANELA;
    }catch(e){ return false }
  };

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

  /* Passa a lápide por cima do estado, seja de onde ele tenha vindo:
     do servidor no arranque, de uma sincronia, ou de um backup. Antes
     eu só protegia a mesclagem — e o restaurar() do arranque, que
     SUBSTITUI os extras pelo que está no servidor, passava por fora. */
  window.bqLimparApagados = function(){
    let n = 0;
    ['extras','trocas'].forEach(function(campo){
      const o = ST[campo]; if(!o) return;
      Object.keys(o).forEach(function(k){
        if(window.bqFoiApagado(campo, k)){ delete o[k]; n++ }
      });
    });
    return n;
  };

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
      for(const k in r[campo]){
        if(k in ST[campo]) continue;
        if(window.bqFoiApagado(campo, k)) continue;   /* você apagou: fica apagado */
        ST[campo][k] = r[campo][k]; novos++;
      }
    });
    window.bqLimparApagados();
    return novos;
  }

  /* ---- gravar: lê o servidor e funde antes de mandar ---- */
  const salvarApp = window.salvarCoach;
  let ocupado = false, naFila = false;
  window.salvarCoach = async function(){
    /* Antes eu devolvia sem fazer nada quando havia outra gravação em
       curso. A gravação seguinte — justamente a que carregava o que
       você acabou de apagar — sumia sem aviso. Agora ela fica na fila
       e roda logo depois. */
    if(ocupado){ naFila = true; return }
    ocupado = true;
    try{ mesclar(await window.lerCoach()) }catch(e){ console.warn('merge antes de gravar:', e) }
    try{ window.bqLimparApagados() }catch(e){}
    let r;
    try{ r = await salvarApp.apply(this, arguments) }
    finally{ ocupado = false }
    if(naFila){ naFila = false; setTimeout(function(){ window.salvarCoach() }, 250) }
    return r;
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

  /* o restaurar() do arranque substitui extras e trocas pelo que está
     no servidor; passo a lápide por cima logo depois dele */
  const restaurarApp = window.restaurar;
  if(typeof restaurarApp === 'function'){
    window.restaurar = async function(){
      const r = await restaurarApp.apply(this, arguments);
      try{ window.bqLimparApagados() }catch(e){}
      return r;
    };
  }
  [1500, 4000, 8000].forEach(function(ms){
    setTimeout(function(){ try{ window.bqLimparApagados() }catch(e){} }, ms);
  });

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



/* ═══════════ 13. FORÇA COMO 2º TREINO, COM ENVIO AO MOTRA ═══════════
   Na parte 7 eu tinha posto a força como etapas DENTRO do treino de
   corrida. Funcionava para ler, mas matava o envio ao MOTRA: aquele
   botão só aparece em sessão com mod:'forca'.

   Agora a força entra como SEGUNDO TREINO do dia (ST.extras), que é o
   encaixe que o app já tem para isso. O botão "Enviar ao MOTRA" volta,
   e os exercícios ficam com nome em inglês para bater com o que você
   vê lá.

   Semeia uma vez por data. Se você apagar uma sessão, ela não volta.
   ══════════════════════════════════════════════════════════════════ */

PARTE('força no motra', function(){
  if(typeof ACADEMIA !== 'object' || typeof SESSOES_ACADEMIA !== 'object')
    throw new Error('app sem ACADEMIA/SESSOES_ACADEMIA');

  const EX = {
    bqSquat  :{n:'Goblet Squat',            m:'quadríceps, glúteo e core',  s:'3×12',        c:'Descida em 3 segundos, subida firme. Joelho na linha do pé.'},
    bqSquatHv:{n:'Back Squat',              m:'força máxima de perna',      s:'4×5',         c:'Carga que você faria 7 vezes, não mais. Pare com 2 repetições de sobra.'},
    bqRdl    :{n:'Romanian Deadlift',       m:'posterior de coxa e glúteo', s:'3×12',        c:'Empurre o quadril para trás, coluna neutra. Protege o joelho na descida.'},
    bqRdlHv  :{n:'Romanian Deadlift',       m:'posterior de coxa e glúteo', s:'4×6',         c:'Mesma técnica, carga alta, longe da falha.'},
    bqLunge  :{n:'Walking Lunge',           m:'perna unilateral e equilíbrio', s:'3×10 cada', c:'Corrida é exercício de uma perna só. Treine assim.'},
    bqCalf2  :{n:'Standing + Seated Calf Raise', m:'panturrilha e sóleo',   s:'3×15 + 3×15', c:'O sentado pega o sóleo, que é onde o aquiles do veterano rompe.'},
    bqCalfHv :{n:'Standing Calf Raise',     m:'panturrilha com carga',      s:'4×8',         c:'Pausa de 2 segundos embaixo.'},
    bqCalf1  :{n:'Single-Leg Calf Raise',   m:'panturrilha unilateral',     s:'3×12 cada',   c:'No degrau, descendo bem abaixo da linha do pé.'},
    bqCalfSt :{n:'Standing Calf Raise',     m:'panturrilha',                s:'3×10',        c:'Manutenção. Amplitude completa.'},
    bqPlank  :{n:'Plank + Side Plank',      m:'core e anti-rotação',        s:'3×40s + 3×30s cada', c:'Core segura a postura no quilômetro 35.'},
    bqPlank1 :{n:'Plank',                   m:'core',                       s:'3×45s',       c:'Costelas para baixo, glúteo ativo.'},
    bqPlank2 :{n:'Plank',                   m:'core',                       s:'2×40s',       c:'Manutenção.'},
    bqBridge :{n:'Single-Leg Glute Bridge', m:'glúteo máximo',              s:'3×12 cada',   c:'Glúteo fraco vira dor lombar no fim do longo.'},
    bqBridge2:{n:'Single-Leg Glute Bridge', m:'glúteo máximo',              s:'3×10 cada',   c:'Volume baixo: a corrida é a prioridade do dia.'},
    bqStep   :{n:'Step-Up',                 m:'perna unilateral',           s:'3×10 cada',   c:'Subida controlada, sem impulso da perna de baixo.'},
    bqAbd    :{n:'Banded Hip Abduction',    m:'glúteo médio',               s:'3×15 cada',   c:'É o que evita o joelho cair para dentro com a fadiga.'},
    bqBird   :{n:'Bird Dog',                m:'core e estabilidade',        s:'3×10 cada',   c:'Lento. Ensina o tronco a ficar quieto enquanto as pernas trabalham.'},
    bqDead   :{n:'Dead Bug',                m:'core profundo',              s:'3×10 cada',   c:'Lombar colada no chão o tempo todo.'},
    bqPlyo   :{n:'Pogo Hops + Vertical Jumps', m:'elasticidade do tendão',  s:'2×10 + 2×8',  c:'Não é para ganhar músculo: deixa o tendão devolver energia a cada passada.'},
  };
  for(const k in EX) if(!ACADEMIA[k]) ACADEMIA[k] = EX[k];

  const SES = {
    BQ_BASE_A:{nome:'Força — Pernas e Core (base)', itens:[
      {k:'bqSquat', p:'base de pernas para a maratona'},
      {k:'bqRdl',   p:'posterior forte protege o joelho'},
      {k:'bqLunge', p:'corrida é exercício de uma perna só'},
      {k:'bqCalf2', p:'aquiles e sóleo, onde o veterano mais se machuca'},
      {k:'bqPlank', p:'core para o fim da prova'}]},
    BQ_BASE_B:{nome:'Força — Quadril e Core (base)', itens:[
      {k:'bqBridge', p:'glúteo máximo'},
      {k:'bqStep',   p:'subida unilateral controlada'},
      {k:'bqAbd',    p:'glúteo médio, estabiliza o joelho'},
      {k:'bqBird',   p:'tronco quieto sob fadiga'},
      {k:'bqCalf1',  p:'panturrilha unilateral'}]},
    BQ_PICO_A:{nome:'Força — Máxima (pico)', itens:[
      {k:'bqSquatHv', p:'carga alta, poucas repetições: economia de corrida'},
      {k:'bqRdlHv',   p:'posterior sob carga'},
      {k:'bqCalfHv',  p:'panturrilha com carga'},
      {k:'bqPlyo',    p:'elasticidade do tendão'},
      {k:'bqPlank1',  p:'core'}]},
    BQ_PICO_B:{nome:'Força — Quadril e Core (pico)', itens:[
      {k:'bqBridge2', p:'glúteo, volume baixo'},
      {k:'bqAbd',     p:'glúteo médio'},
      {k:'bqCalf1',   p:'panturrilha unilateral'},
      {k:'bqDead',    p:'core profundo'}]},
    BQ_MANUT:{nome:'Força — Manutenção', itens:[
      {k:'bqSquat',   p:'carga do pico, 2×5, longe da falha'},
      {k:'bqRdl',     p:'2×6'},
      {k:'bqCalfSt',  p:'3×10'},
      {k:'bqPlank2',  p:'2×40s'}]},
  };
  for(const k in SES) if(!SESSOES_ACADEMIA[k]) SESSOES_ACADEMIA[k] = SES[k];

  const MAPA = {base_a:'BQ_BASE_A', base_b:'BQ_BASE_B',
                pico_a:'BQ_PICO_A', pico_b:'BQ_PICO_B', manut:'BQ_MANUT'};
  const MIN  = {BQ_BASE_A:35, BQ_BASE_B:30, BQ_PICO_A:30, BQ_PICO_B:25, BQ_MANUT:20};
  const SEM  = 'bq.forcaSemeada';

  function semeadas(){ try{ return JSON.parse(localStorage.getItem(SEM)||'[]') }catch(e){ return [] } }

  const OFF = 'bq.forcaOff';
  const desligada = function(){
    try{ return localStorage.getItem(OFF) === '1' }catch(e){ return false }
  };

  function semear(){
    if(desligada()) return 0;
    if(!window.planoBQ || !window.planoBQ.ligado()) return 0;
    if(typeof ST !== 'object') return 0;
    ST.extras = ST.extras || {};
    const feitas = semeadas(); let novas = 0;
    const P = window.planoBQ.plano;
    for(const k in P){
      const sid = MAPA[P[k].forca];
      if(!sid) continue;
      if(feitas.indexOf(k) >= 0) continue;
      feitas.push(k);                       /* registra antes de tudo: senão a
                                               proteção vencia junto com a lápide */
      if(window.bqFoiApagado && window.bqFoiApagado('extras', k)) continue;
      if(ST.extras[k]) continue;                /* já existe algo aí */
      ST.extras[k] = {id:k+'-forca', data:k, mod:'forca', foco:'forca',
        sessao:sid, titulo:SESSOES_ACADEMIA[sid].nome, min:MIN[sid]||30};
      novas++;
    }
    try{ localStorage.setItem(SEM, JSON.stringify(feitas)) }catch(e){}
    if(novas){
      try{ renderTudo() }catch(e){}
      try{ persistir() }catch(e){}
    }
    return novas;
  }

  /* Varre e remove tudo que EU criei, sempre que a força estiver
     desligada. É a rede de baixo: mesmo que alguma coisa ressuscite
     uma sessão, ela sai de novo na próxima passada. */
  function varrer(){
    if(!desligada() || typeof ST !== 'object' || !ST.extras) return 0;
    let n = 0;
    Object.keys(ST.extras).forEach(function(k){
      const x = ST.extras[k];
      if(x && x.mod === 'forca' && String(x.sessao || '').indexOf('BQ_') === 0){
        delete ST.extras[k]; n++;
        if(window.bqApagar) window.bqApagar('extras', k);
      }
    });
    if(n){
      try{ renderTudo() }catch(e){}
      try{ persistir() }catch(e){}
    }
    return n;
  }

  setTimeout(semear, 4000);
  setTimeout(semear, 9000);
  [1200, 3000, 6000, 12000].forEach(function(ms){ setTimeout(varrer, ms) });
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden) setTimeout(varrer, 400);
  });

  window.bqForca = {
    semear:semear, varrer:varrer, desligada:desligada,
    desligar:function(){
      try{ localStorage.setItem(OFF, '1') }catch(e){}
      const n = varrer();
      try{ renderTudo() }catch(e){}
      return n;
    },
    ligar:function(){
      try{ localStorage.removeItem(OFF); localStorage.removeItem(SEM) }catch(e){}
      try{
        const m = JSON.parse(localStorage.getItem('bq.apagados') || '{}');
        Object.keys(m).forEach(function(c){ if(c.indexOf('extras|') === 0) delete m[c] });
        localStorage.setItem('bq.apagados', JSON.stringify(m));
        if(window.bqLapides) window.bqLapides.enviar();
      }catch(e){}
      return semear();
    },
    resetar:function(){ try{ localStorage.removeItem(SEM) }catch(e){}; return semear() }
  };
});



/* ═══════════ 14. STEP SPEED LOSS (HRM 600) ═══════════
   Quanto de velocidade você perde a cada aterrissagem. O relógio mede
   a diferença entre a sua velocidade no instante em que o pé toca o
   chão e a menor velocidade durante o apoio. Menor é melhor: significa
   que você freia menos e gasta menos energia para reacelerar.

   Vem em duas formas. O valor bruto em cm/s sobe naturalmente quando
   você corre mais rápido, então serve pouco para comparar treinos. O
   PERCENTUAL normaliza pela velocidade — é ele que diz se a sua
   mecânica melhorou, e é ele que eu uso como número principal.

   Leio direto de RAW.atividades, que é onde ficam os campos crus do
   Garmin. O mapAtividade() do app descarta o que não conhece.

   Aviso honesto: o Garmin não publica tabela de referência. As faixas
   abaixo saem da física da coisa e do que se observa na prática, não
   de um padrão oficial. Use a SUA tendência como juiz, não o número
   absoluto de outra pessoa.
   ══════════════════════════════════════════════════════════════════ */

PARTE('step speed loss', function(){
  const ALVO = 7.5;                 /* % — meta de trabalho para o ciclo */

  const FAIXAS = [
    {ate:7.0,  n:'excelente', c:'#2fbf71'},
    {ate:8.5,  n:'bom',       c:'#7fbf5a'},
    {ate:10.0, n:'médio',     c:'#e0a33f'},
    {ate:99,   n:'alto',      c:'#e0714f'}
  ];
  const faixa = p => FAIXAS.find(f => p <= f.ate);

  function corridas(){
    const R = (typeof RAW === 'object' && RAW && RAW.atividades) ? RAW.atividades : [];
    return R.filter(function(a){
      const km = +a.distancia || 0;
      return a.esporte === 'corrida' && km >= 3 && +a.sslPct > 0;
    }).map(function(a){
      return {d:a.data, km:+a.distancia, pct:+a.sslPct, ssl:+a.ssl || 0,
              cad:+a.cadencia || 0, gct:+a.contatoSolo || 0, nome:a.notas || ''};
    }).sort(function(x,y){ return x.d < y.d ? 1 : -1 });
  }

  const medPond = a => {
    const km = a.reduce(function(s,x){ return s + x.km }, 0);
    return km ? a.reduce(function(s,x){ return s + x.pct * x.km }, 0) / km : 0;
  };

  /* O conselho muda conforme onde você está. Cadência é a alavanca de
     quem corre abaixo de 170 ppm; acima disso, forçar mais deixa a
     passada frenética e ganha pouco. Perto do alvo, o que sobra é
     consistência e comparar terreno com terreno.                    */
  function conselho(pct, cad){
    if(pct <= 7.0)
      return 'Está no nível que eu chamaria de excelente. Aqui não se persegue mais número: '
           + 'mantenha, e use este painel só para perceber se algo piorar.';
    if(cad && cad < 170)
      return '<b style="color:var(--acc)">Sua alavanca é a cadência.</b> A ' + Math.round(cad)
           + ' ppm a passada está longa e o pé cai à frente do quadril — cada aterrissagem '
           + 'dessas é um freio. Suba para ' + Math.round(cad*1.04) + '–' + Math.round(cad*1.05)
           + ' ppm nas rodagens, sem mudar o ritmo. O passo encurta sozinho.';
    if(pct <= 8.0)
      return 'Cadência de ' + Math.round(cad) + ' ppm já é adequada — forçar mais deixa a passada '
           + 'frenética e ganha pouco. Daqui em diante o ganho é lento: toque leve (corra tentando '
           + 'fazer menos barulho) e a pliometria das semanas 5 a 7. Compare sempre terreno com '
           + 'terreno: descida infla este número por natureza.';
    return 'Com ' + Math.round(cad) + ' ppm a cadência não é o problema. Olhe para o toque: '
         + 'aterrissar leve, com o pé debaixo do quadril, e evitar estender a perna para alcançar '
         + 'o chão. A pliometria das semanas 5 a 7 ataca exatamente isso.';
  }

  /* Vive na aba ÍNDICES, logo depois do card "Mecânica de corrida" —
     é ali que moram cadência, contato com o solo e oscilação, que são
     os vizinhos naturais desta métrica. Estava no Coach por preguiça
     minha: era onde eu já tinha um card para me pendurar.          */
  function ondeVou(){
    const mec = document.getElementById('iMec');
    if(mec && mec.closest) { const c = mec.closest('.card'); if(c) return c }
    return document.getElementById('iZonas') || document.getElementById('iCards') || null;
  }

  function montar(){
    const alvoEl = ondeVou();
    if(!alvoEl || !alvoEl.parentNode) return;
    const C = corridas();
    let box = document.getElementById('bqSSL');

    if(!C.length){
      if(box) box.innerHTML = '<span class="kicker">Step Speed Loss</span>'
        + '<div class="nota">Nenhuma corrida com o dado ainda. Ele precisa da cinta '
        + 'HRM 600 e chega junto com a próxima sincronia do Garmin.</div>';
      return;
    }
    if(!box){
      box = document.createElement('section');
      box.className = 'card'; box.id = 'bqSSL';
      alvoEl.parentNode.insertBefore(box, alvoEl.nextSibling);
    }

    const hoje = C.slice(0, 8), antes = C.slice(8, 16);
    const a1 = medPond(hoje), a0 = antes.length ? medPond(antes) : 0;
    const dif = a0 ? a1 - a0 : 0;
    const F = faixa(a1);
    const cad = hoje.filter(x=>x.cad).reduce(function(s,x,_,A){ return s + x.cad/A.length }, 0);

    let tendencia = '';
    if(a0){
      /* abaixo de 0,3 ponto é ruído de terreno, não mudança de mecânica */
      const txt = dif < -0.30 ? '▼ ' + Math.abs(dif).toFixed(2) + ' melhor'
                : dif >  0.30 ? '▲ ' + dif.toFixed(2) + ' pior'
                : 'estável (' + (dif >= 0 ? '+' : '') + dif.toFixed(2) + ', dentro do ruído)';
      tendencia = '<span style="font-size:11.5px;opacity:.7;margin-left:auto">'
                + txt + ' que as 8 anteriores</span>';
    }

    /* barra de 5 a 12%, com a marca do alvo */
    const pos = v => Math.max(0, Math.min(100, (v - 5) / 7 * 100));

    box.innerHTML =
      '<span class="kicker">Step Speed Loss · freada a cada passada</span>'
      + '<div style="display:flex;align-items:baseline;gap:9px;margin:2px 0 3px">'
      +   '<span style="font-size:30px;font-weight:800;color:' + F.c + ';line-height:1">'
      +     a1.toFixed(2) + '<small style="font-size:14px;font-weight:600">%</small></span>'
      +   '<span style="font-size:12px;color:' + F.c + ';font-weight:700">' + F.n + '</span>'
      +   tendencia
      + '</div>'
      + '<div style="position:relative;height:10px;border-radius:5px;margin:12px 0 6px;'
      +   'background:linear-gradient(90deg,#2fbf71 0%,#7fbf5a 29%,#e0a33f 57%,#e0714f 100%);opacity:.85">'
      +   '<i style="position:absolute;left:' + pos(ALVO) + '%;top:-4px;width:2px;height:18px;'
      +     'background:var(--tx,#fff);opacity:.9"></i>'
      +   '<i style="position:absolute;left:' + pos(a1) + '%;top:-5px;width:12px;height:20px;'
      +     'margin-left:-6px;border-radius:6px;background:#fff;border:2px solid ' + F.c + '"></i>'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:10.5px;opacity:.55">'
      +   '<span>5%</span><span>alvo ' + ALVO + '%</span><span>12%</span></div>'
      + '<div class="nota" style="margin-top:11px">Média das últimas <b>' + hoje.length
      +   '</b> corridas, ponderada por distância · cadência média <b>'
      +   Math.round(cad) + '</b> ppm'
      + '<br>' + conselho(a1, cad)
      + '</div>';
  }

  const indicesApp = window.renderIndices;
  if(typeof indicesApp === 'function'){
    window.renderIndices = function(){
      const r = indicesApp.apply(this, arguments);
      try{ montar() }catch(e){ console.warn('ssl:', e) }
      return r;
    };
  }
  /* a aba Índices só é desenhada quando você entra nela */
  document.addEventListener('click', function(){ setTimeout(function(){
    try{ montar() }catch(e){}
  }, 120) }, true);
  setTimeout(function(){ try{ montar() }catch(e){} }, 3500);
  setTimeout(function(){ try{ montar() }catch(e){} }, 8000);
  window.bqSSL = {corridas:corridas, montar:montar};
});



/* ═══════ 15. RÓTULOS NAS BARRAS E SONO DETALHADO ═══════
   Duas queixas justas:

   1) Barras sem número obrigam a mirar na grade para adivinhar o
      valor. Agora cada barra leva o número em cima. Só no modo
      diário — agrupado por semana as barras ficam juntas demais e o
      rótulo vira borrão. A densidade também se ajusta: até 12 barras
      rotula todas, até 22 rotula uma sim uma não, acima disso marca
      só a maior, a menor e a última.

   2) O gráfico de sono mostrava as fases empilhadas sem dizer quanto
      de cada uma. Agora vem a tabela com horas, percentual e a faixa
      de referência, para a última noite e para a média do período.

   As faixas são da fisiologia do sono em adultos, NÃO um padrão do
   Garmin. E vale saber: a concordância das fases do Garmin com
   polissonografia fica em torno de 40 a 50%. Use a TENDÊNCIA de
   semanas, não a fase de uma noite isolada.
   ══════════════════════════════════════════════════════════════════ */

PARTE('rotulos e sono detalhado', function(){
  const W=380, H=270, ML=42, MR=14, MT=22, MB=40;
  const IW=W-ML-MR, IH=H-MT-MB, LIM=26;

  const css=document.createElement('style');
  css.textContent = `
  .bqrot{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;
    font-weight:700;fill:var(--tx);paint-order:stroke;stroke:var(--bg);
    stroke-width:3px;stroke-linejoin:round}
  #bqSono .lin{display:grid;grid-template-columns:74px 1fr 58px 66px;gap:8px;
    align-items:center;padding:7px 0;font-size:12px}
  #bqSono .lin+.lin{border-top:1px solid var(--line)}
  #bqSono .bar{height:8px;border-radius:4px;background:var(--s2);overflow:hidden;position:relative}
  #bqSono .bar i{display:block;height:100%;border-radius:4px}
  #bqSono .bar u{position:absolute;top:-2px;height:12px;width:2px;background:var(--tx3);opacity:.55}
  #bqSono b.v{font-variant-numeric:tabular-nums;text-align:right}
  #bqSono .ok{color:var(--ok)} #bqSono .fora{color:var(--warn)}`;
  document.head.appendChild(css);

  /* quais índices rotular, conforme quantas barras cabem */
  function quais(n, vals){
    if(n<=12) return vals.map((_,i)=>i);
    if(n<=22) return vals.map((_,i)=>i).filter(i=>i%2===0 || i===n-1);
    let mx=0, mn=0;
    vals.forEach((v,i)=>{ if(v>vals[mx]) mx=i; if(v<vals[mn]) mn=i });
    return [...new Set([mx,mn,n-1])];
  }

  function rotular(host, vals, fmt){
    if(!host) return;
    const sv = host.querySelector('svg'); if(!sv) return;
    if(sv.querySelector('.bqrot')) return;
    const n = vals.length;
    const passo = IW/n, x = i => ML + passo*i + passo/2;
    const topo = Math.max.apply(null, vals);
    let txt='';
    quais(n, vals).forEach(function(i){
      const v = vals[i];
      const y = MT + IH - (v/topo)*IH;
      const anc = i===0 ? 'start' : i===n-1 ? 'end' : 'middle';
      const px = i===0 ? ML : i===n-1 ? W-MR : x(i);
      txt += '<text class="bqrot" x="'+px.toFixed(1)+'" y="'+Math.max(MT+9, y-6).toFixed(1)
           + '" text-anchor="'+anc+'">'+fmt(v)+'</text>';
    });
    sv.insertAdjacentHTML('beforeend', txt);
  }

  /* ── Body Battery ── */
  const bbApp = window.grafBodyBattery;
  if(typeof bbApp === 'function'){
    window.grafBodyBattery = function(bb){
      const r = bbApp.apply(this, arguments);
      try{
        if(bb && bb.length >= 2 && bb.length <= LIM){
          /* a escala do BB é fixa de 0 a 100, então normalizo por 100 */
          const host = document.querySelector('#sBB'), sv = host && host.querySelector('svg');
          if(sv && !sv.querySelector('.bqrot')){
            const n=bb.length, passo=IW/n, x=i=>ML+passo*i+passo/2;
            let t='';
            quais(n, bb.map(b=>b.max)).forEach(function(i){
              const v=bb[i].max, y=MT+IH-(v/100)*IH;
              const anc=i===0?'start':i===n-1?'end':'middle';
              const px=i===0?ML:i===n-1?W-MR:x(i);
              t+='<text class="bqrot" x="'+px.toFixed(1)+'" y="'+Math.max(MT+9,y-6).toFixed(1)
                +'" text-anchor="'+anc+'">'+Math.round(v)+'</text>';
            });
            sv.insertAdjacentHTML('beforeend', t);
          }
        }
      }catch(e){ console.warn('rotulo bb:', e) }
      return r;
    };
  }

  /* ── Sono: rótulos + tabela de fases ── */
  const FAIXAS = [
    {k:'profundo', n:'Profundo', c:'var(--acc)',  lo:13, hi:23,
     d:'Recupera músculo e consolida a adaptação ao treino. É a fase que o treino forte mais exige.'},
    {k:'rem',      n:'REM',      c:'var(--swim)', lo:20, hi:25,
     d:'Memória e regulação do humor. Cai quando você dorme pouco, porque vem mais no fim da noite.'},
    {k:'leve',     n:'Leve',     c:'var(--s3)',   lo:50, hi:60,
     d:'A maior parte da noite. Não é sono ruim: é o tecido que liga as outras fases.'},
    {k:'acordado', n:'Acordado', c:'var(--warn)', lo:0,  hi:5,
     d:'Despertares curtos são normais. Muito acima de 5% costuma indicar álcool, calor ou treino tarde demais.'}
  ];

  function fases(n){
    const dur = +n.duracao || 0;
    if(!dur) return null;
    const prof = +n.profundo||0, rem = +n.rem||0, ac = +n.acordado||0;
    const leve = (n.leve != null) ? +n.leve : Math.max(0, dur - prof - rem);
    return {duracao:dur, profundo:prof, rem:rem, leve:leve, acordado:ac,
            soneca:+n.soneca||0,
            score:+n.score||0, base:prof+rem+leve || dur};
  }

  function tabela(arr){
    const host = document.querySelector('#sSono');
    if(!host || !host.parentNode) return;
    const card = host.closest ? host.closest('.card') : null;
    const onde = card || host;
    let box = document.getElementById('bqSono');
    if(!box){
      box = document.createElement('section');
      box.className='card'; box.id='bqSono';
      onde.parentNode.insertBefore(box, onde.nextSibling);
    }
    const F = arr.map(fases).filter(Boolean);
    if(!F.length){ box.innerHTML=''; return }
    const ult = F[F.length-1];
    const med = {};
    ['duracao','profundo','rem','leve','acordado','score'].forEach(function(k){
      med[k] = F.reduce(function(s,x){ return s+x[k] },0)/F.length;
    });
    med.base = med.profundo+med.rem+med.leve || med.duracao;

    const hm = h => Math.floor(h)+'h'+String(Math.round((h%1)*60)).padStart(2,'0');

    const linha = (f, base, ref) => FAIXAS.map(function(x){
      const v = f[x.k] || 0;
      const pct = base ? v/base*100 : 0;
      const dentro = pct >= x.lo && pct <= x.hi;
      return '<div class="lin">'
        + '<span>'+x.n+'</span>'
        + '<span class="bar"><i style="width:'+Math.min(100,pct).toFixed(0)+'%;background:'+x.c+'"></i>'
        +   '<u style="left:'+x.lo+'%"></u><u style="left:'+Math.min(100,x.hi)+'%"></u></span>'
        + '<b class="v">'+hm(v)+'</b>'
        + '<b class="v '+(dentro?'ok':'fora')+'">'+pct.toFixed(0)+'%'
        +   '<span style="opacity:.45;font-weight:400"> /'+x.lo+'–'+x.hi+'</span></b>'
        + '</div>';
    }).join('');

    box.innerHTML =
      '<span class="kicker">Fases do sono · última noite</span>'
      + '<div style="display:flex;align-items:baseline;gap:10px;margin:2px 0 10px">'
      +   '<span style="font-size:26px;font-weight:800;line-height:1">'+hm(ult.duracao)+'</span>'
      +   (ult.score ? '<span style="font-size:12px;opacity:.7">score '+Math.round(ult.score)+'</span>' : '')
      +   '<span style="font-size:11.5px;opacity:.6;margin-left:auto">média do período '
      +     hm(med.duracao)+'</span></div>'
      + linha(ult, ult.base)
      + (ult.soneca > 0.02
          ? '<div class="nota" style="margin-top:10px">Mais <b>'+hm(ult.soneca)+'</b> de soneca '
            + 'nesse dia, fora da noite. Somando as duas, <b>'+hm(ult.duracao+ult.soneca)+'</b> '
            + 'de sono em 24 h. As porcentagens acima são só da noite, que é onde o relógio '
            + 'mede as fases.</div>'
          : '')
      + '<div class="nota" style="margin-top:12px">As duas marcas em cada barra são a faixa de '
      + 'referência para adultos. Média do período: profundo <b>'
      + (med.profundo/med.base*100).toFixed(0)+'%</b>, REM <b>'
      + (med.rem/med.base*100).toFixed(0)+'%</b>, leve <b>'
      + (med.leve/med.base*100).toFixed(0)+'%</b>.<br><br>'
      + 'Duas ressalvas honestas: essas faixas são da fisiologia do sono, não um padrão do Garmin. '
      + 'E a concordância das fases medidas por relógio com um exame de sono fica em torno de '
      + '40 a 50% — leia a tendência de semanas, nunca a fase de uma noite isolada.</div>';
  }

  const sonoApp = window.grafSono;
  if(typeof sonoApp === 'function'){
    window.grafSono = function(sono){
      const r = sonoApp.apply(this, arguments);
      try{
        if(sono && sono.length >= 2){
          if(sono.length <= LIM)
            rotular(document.querySelector('#sSono'),
                    sono.map(n=>(+n.duracao||0)+(+n.soneca||0)),
                    v => v.toFixed(1));
          tabela(sono);
        }
      }catch(e){ console.warn('sono detalhado:', e) }
      return r;
    };
  }
});



/* ═══════ 16. PAINEL DE OBJETIVOS FECHADO POR PADRÃO ═══════
   O app já sabe recolher esse painel: a classe .on em #objPainel é
   quem o mantém aberto, e o botão "Trocar" alterna. Só que o
   renderObjetivo() ADICIONA .on quando não há objetivo e nunca a
   remove quando passa a haver. Resultado: uma vez aberto, fica aberto
   para sempre, com as sete provas ocupando meia tela sem motivo.

   Aqui eu fecho UMA VEZ, no arranque, quando já existe objetivo com
   data. Depois disso não encosto mais: o "Trocar" volta a mandar, e
   se você abrir para ver as opções, fica aberto.
   ══════════════════════════════════════════════════════════════════ */

PARTE('objetivos recolhidos', function(){
  let jaFechei = false;

  function fechar(){
    if(jaFechei) return;
    const p = document.getElementById('objPainel');
    if(!p) return;
    let temAlvo = false;
    try{
      const o = (typeof objetivoAtivo === 'function') ? objetivoAtivo() : null;
      temAlvo = !!(o && o.data);
    }catch(e){ return }
    if(!temAlvo) return;              /* sem objetivo, o painel deve abrir mesmo */
    p.classList.remove('on');
    jaFechei = true;
  }

  setTimeout(fechar, 3000);
  setTimeout(fechar, 7000);
  setTimeout(fechar, 11000);
});



/* ═══════ 17. MOVER E CANCELAR QUE NÃO VOLTAM SOZINHOS ═══════
   O app monta o plano do zero a cada rebuild(), a partir do gerador.
   O que você muda à mão vive só em ST.plano — que NÃO é gravado.
   Mover um treino altera ST.plano e chama persistir(), mas persistir
   salva ST.trocas, ST.feitas e ST.extras; ST.plano não vai junto.

   Resultado: no próximo rebuild o treino reaparece no dia de origem,
   enquanto a cópia do dia de destino também segue lá. Um vira dois.
   E rebuild acontece bastante — ao sincronizar, ao voltar o foco, ao
   trocar de objetivo.

   Conserto em duas pontas:

   a) Antes de cada gravação, comparo o plano que está na tela com o
      plano recém-gerado e guardo a DIFERENÇA em ST.trocas — inclusive
      os dias que ficaram vazios, marcados com __vazio.

   b) aplicarTrocas() passa a entender __vazio (apaga o dia) e objetos
      completos (põe o treino no dia), além do que já fazia.

   Assim mover, cancelar e incluir sobrevivem a qualquer rebuild, e
   viajam entre iPhone e Mac como o resto.
   ══════════════════════════════════════════════════════════════════ */

PARTE('mover e cancelar', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof window.gerarPlano !== 'function' || typeof window.aplicarTrocas !== 'function')
    throw new Error('app sem gerarPlano/aplicarTrocas');

  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const limpo = s => {
    if(!s) return null;
    const c = {};
    Object.keys(s).sort().forEach(function(k){
      if(k === 'trocado' || k === 'cache') return;
      c[k] = s[k];
    });
    return c;
  };

  /* plano como o gerador o entrega, sem nada aplicado por cima */
  function base(){
    try{ return window.gerarPlano() || {} }catch(e){ return {} }
  }

  /* ── b) aplicar ── */
  const aplicarApp = window.aplicarTrocas;
  window.aplicarTrocas = function(){
    const T = ST.trocas || {};
    let sobrou = false;
    Object.keys(T).forEach(function(k){
      const t = T[k];
      if(!t) return;
      if(t.__vazio){ delete ST.plano[k]; return }
      /* cancelado: o dia continua existindo, marcado como descanso,
         para você poder voltar atrás. Marco eu mesmo, sem depender da
         ordem em que as funções do app rodam. */
      if(t.__cancelado || t.cancelado){
        if(ST.plano[k]) ST.plano[k] = Object.assign({}, ST.plano[k],
          {cancelado:true, trocado:true, id:k, data:k});
        return;
      }
      if(t.mod || t.foco || t.titulo || t.km !== undefined){
        const antes = ST.plano[k];
        if(antes && antes.prova) return;             /* prova não se mexe */
        ST.plano[k] = Object.assign({}, antes || {}, t, {id:k, data:k, trocado:true});
        return;
      }
      sobrou = true;
    });
    if(sobrou){ try{ aplicarApp.call(this) }catch(e){} }
  };

  /* ── a) registrar ── */
  function registrar(){
    const B = base();
    ST.trocas = ST.trocas || {};
    /* olho os três conjuntos: o plano original, o que está na tela e
       o que já estava anotado. Sem o terceiro, um dia que sai dos dois
       primeiros ficaria anotado para sempre e voltaria a cada rebuild. */
    const dias = {};
    Object.keys(B).forEach(function(k){ dias[k] = 1 });
    Object.keys(ST.plano || {}).forEach(function(k){ dias[k] = 1 });
    Object.keys(ST.trocas).forEach(function(k){ dias[k] = 1 });

    Object.keys(dias).forEach(function(k){
      /* dia cancelado tem marca própria: não deixo o registrador
         trocá-la por uma cópia da sessão, senão o cancelamento se
         perde na volta. */
      /* marca posta por mim no toque: só o desfazer explícito a tira.
         Antes eu deixava o registrador reavaliá-la, e ela morria entre
         uma reconstrução e outra. */
      const marca = ST.trocas[k];
      if(marca && (marca.__cancelado || marca.__vazio || marca.cancelado)) return;
      const noBase  = limpo(B[k]);
      const naTela  = limpo((ST.plano || {})[k]);
      if(noBase && !naTela){ ST.trocas[k] = {__vazio:true}; return }
      if(naTela && !igual(noBase, naTela)){ ST.trocas[k] = naTela; return }
      /* voltou a ser igual ao original: não precisa mais guardar */
      if(!noBase && !naTela){ delete ST.trocas[k]; return }
      const t = ST.trocas[k];
      if(t && t.id === k) delete ST.trocas[k];
    });
  }

  const persistirApp = window.persistir;
  if(typeof persistirApp === 'function'){
    window.persistir = function(){
      try{ registrar() }catch(e){ console.warn('registrar trocas:', e) }
      return persistirApp.apply(this, arguments);
    };
  }

  /* ── c) anotar no toque ──
     As funções de cancelar e mover vivem dentro de blocos fechados do
     app; não dá para envelopá-las de fora. Mas os botões passam pelo
     documento, e aí eu chego. Escuto o clique na fase de captura,
     anoto a intenção na hora, e só depois deixo o app fazer o dele.
     Assim nada depende da ordem em que as funções rodam. */
  function diaAberto(){
    return ST.sel || (ST.plano && Object.keys(ST.plano).find(function(k){
      return ST.plano[k] && ST.plano[k].aberto })) || null;
  }

  document.addEventListener('click', function(e){
    const alvo = e.target && e.target.closest ? e.target : null;
    if(!alvo) return;

    /* remover o segundo treino do dia (a força) */
    const rx = alvo.closest('[data-remex]');
    if(rx){
      const k = rx.dataset.remex || diaAberto();
      if(k){
        if(window.bqApagar) window.bqApagar('extras', k);
        setTimeout(function(){
          if(ST.extras) delete ST.extras[k];
          if(window.bqApagar) window.bqApagar('extras', k);
          try{ renderCoach() }catch(err){}
          try{ persistirApp() }catch(err){}
        }, 120);
      }
      return;
    }

    /* confirmação de cancelar */
    if(alvo.closest('#cSim')){
      const k = diaAberto();
      if(k){
        ST.trocas[k] = {__cancelado:true};
        if(window.bqApagar) window.bqApagar('trocas', k);
        setTimeout(function(){
          ST.trocas[k] = {__cancelado:true};
          try{ rebuild(); renderCoach() }catch(err){}
          try{ persistirApp() }catch(err){}
        }, 120);
      }
      return;
    }

    /* escolha do dia de destino ao mover */
    const mv = alvo.closest('[data-mv]');
    if(mv){
      const origem = diaAberto(), destino = mv.dataset.mv;
      if(origem && destino){
        setTimeout(function(){
          const s = (ST.plano || {})[destino];
          if(s){
            ST.trocas[destino] = limpo(s);
            if(origem !== destino && !(ST.plano || {})[origem])
              ST.trocas[origem] = {__vazio:true};
          }
          try{ persistirApp() }catch(err){}
        }, 150);
      }
    }
  }, true);

  /* Diagnóstico: o que está realmente guardado, agora. Sem isso eu
     fico adivinhando de fora e fazendo você perder tempo. */
  window.bqDiag = function(){
    const T = ST.trocas || {}, P = ST.plano || {}, E = ST.extras || {};
    const ks = Object.keys(T).sort();
    let s = 'trocas: ' + ks.length + '\n';
    ks.slice(-6).forEach(function(k){
      const t = T[k], p = P[k];
      s += k + ' → ' + JSON.stringify(t).slice(0, 60) + '\n'
        + '    plano: ' + (p ? (p.titulo || p.foco) + (p.cancelado ? ' [CANCELADO]' : '') : 'vazio')
        + (E[k] ? ' + extra' : '') + '\n';
    });
    let lap = 0;
    try{ lap = Object.keys(JSON.parse(localStorage.getItem('bq.apagados') || '{}')).length }catch(e){}
    s += '\napagados guardados: ' + lap;
    s += '\ndia aberto: ' + (ST.sel || '?');
    s += '\naplicarTrocas minha: ' + (String(window.aplicarTrocas).indexOf('__vazio') > 0);
    s += '\npersistir minha: ' + (String(window.persistir).indexOf('registrar') > 0);
    s += '\ndias no plano: ' + Object.keys(P).length + ' · extras: ' + Object.keys(E).length;
    return s;
  };

  window.bqTrocas = {registrar:registrar, base:base,
    limpar:function(){ ST.trocas = {}; try{ rebuild(); renderTudo() }catch(e){} }};
});



/* ═══════════ 18. APAGAR QUE DURA ═══════════
   A mesclagem da parte 9 só sabe somar: tudo que está no servidor e
   não está aqui volta. Apagar é uma ausência — e ausência, para ela,
   é sempre "este aparelho está atrasado".

   Era por isso que cancelar corrida funcionava e apagar força não:
   cancelar grava uma marca POSITIVA em ST.trocas, e marca presente a
   mesclagem respeita. Apagar força é um delete, e delete ela desfaz.
   Pior: essa mesclagem roda DENTRO da gravação, antes do envio — a
   gravação que deveria salvar a remoção era a que a desfazia.

   A lápide local que eu tinha feito não bastava: vencia em 24 h, não
   viajava para o outro aparelho, e o botão grande "Cancelar este
   treino" nem passava por ela — eu só escutava o × pequeno.

   Agora a lápide não vence, viaja num campo próprio do Firebase, e é
   posta em todos os caminhos de apagar.
   ══════════════════════════════════════════════════════════════════ */

PARTE('apagar que dura', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof FB_DB !== 'string' || typeof FB_COACH !== 'string')
    throw new Error('sem FB_DB/FB_COACH');
  if(typeof window.salvarCoach !== 'function' || typeof window.lerCoach !== 'function')
    throw new Error('app sem salvarCoach/lerCoach');

  const TUM   = 'bq.apagados';
  const ler   = function(){ try{ return JSON.parse(localStorage.getItem(TUM) || '{}') }catch(e){ return {} } };
  const grava = function(m){ try{ localStorage.setItem(TUM, JSON.stringify(m)) }catch(e){} };

  window.bqFoiApagado = function(tipo, chave){ return !!ler()[tipo + '|' + chave] };
  window.bqApagar = function(tipo, chave){
    if(!chave) return;
    const m = ler(), c = tipo + '|' + chave;
    if(!m[c]){ m[c] = Date.now(); grava(m) }
    enviar();
  };
  /* incluir de novo levanta a lápide, senão a limpeza apagaria em
     seguida o treino que você acabou de pôr */
  window.bqDesapagar = function(tipo, chave){
    const m = ler(), c = tipo + '|' + chave;
    if(m[c]){ delete m[c]; grava(m); enviar() }
  };

  /* o salvarCoach do app faz PUT no nó inteiro e apagaria este campo;
     por isso regravo o filho /apagados logo depois */
  let enviando = null;
  function enviar(){
    if(enviando) return enviando;
    enviando = (async function(){
      try{
        const t = await fbToken(); if(!t) return;
        await fetch(FB_DB + '/' + FB_COACH + '/apagados.json?auth=' + t,
          {method:'PUT', headers:{'Content-Type':'application/json'},
           body: JSON.stringify(ler())});
      }catch(e){ console.warn('lapides:', e && e.message) }
      finally{ enviando = null }
    })();
    return enviando;
  }
  function absorverLapides(r){
    if(!r || !r.apagados) return 0;
    const m = ler(); let n = 0;
    for(const k in r.apagados) if(!m[k]){ m[k] = r.apagados[k]; n++ }
    if(n) grava(m);
    return n;
  }

  const lerApp = window.lerCoach;
  window.lerCoach = async function(){
    const r = await lerApp.apply(this, arguments);
    try{ absorverLapides(r) }catch(e){}
    return r;
  };
  const salvarWrap = window.salvarCoach;
  window.salvarCoach = async function(){
    const r = await salvarWrap.apply(this, arguments);
    try{ await enviar() }catch(e){}
    setTimeout(enviar, 4000);
    try{ window.bqLimparApagados && window.bqLimparApagados() }catch(e){}
    return r;
  };

  /* TODOS os caminhos de apagar, inclusive o botão grande */
  document.addEventListener('click', function(e){
    const alvo = e.target && e.target.closest ? e.target : null;
    if(!alvo) return;
    const b = alvo.closest('[data-remex],[data-excancel]');
    if(b) window.bqApagar('extras', b.dataset.remex || b.dataset.excancel || ST.sel);
    const mv = alvo.closest('[data-mvx]');
    if(mv){ window.bqApagar('extras', ST.sel); window.bqDesapagar('extras', mv.dataset.mvx) }
    const ad = alvo.closest('[data-add],[data-addex]');
    if(ad) window.bqDesapagar('extras', ad.dataset.addex || ST.sel);
  }, true);

  /* no arranque: limpar E GRAVAR. Sem persistir a limpeza, a cópia
     velha ressuscita na abertura seguinte. */
  function firmar(){
    let n = 0;
    try{ n = window.bqLimparApagados ? window.bqLimparApagados() : 0 }catch(e){}
    if(n){ try{ renderTudo() }catch(e){} try{ persistir() }catch(e){} }
    return n;
  }
  (async function(){ try{ absorverLapides(await window.lerCoach()); firmar() }catch(e){} })();
  [3000, 7000, 12000].forEach(function(ms){ setTimeout(firmar, ms) });
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden) setTimeout(firmar, 600);
  });

  window.bqLapides = {ler:ler, enviar:enviar, firmar:firmar,
    zerar:function(){ grava({}); return enviar() }};
});



/* ───────────── 19. ANÁLISE: FEITO x PLANEJADO ─────────────
   Depois que o Garmin sincroniza, cada dia do plano é cruzado com o
   que realmente aconteceu. O painel fica no fim da aba Coach.

   O que ele julga e o que ele NÃO julga:

   · Rodagem fácil, recuperação e longo são esforços continuos. O pace
     médio da atividade significa alguma coisa, então esses são
     comparados por pace e por FC.
   · Limiar, intervalado e ritmo têm aquecimento e desaquecimento
     dentro da mesma atividade. O pace médio dessa sessão NÃO é
     comparável ao pace dos tiros — comparar seria mentira. Nessas eu
     julgo por distância e por FC média, e mostro o pace só como
     informação.

   Nenhuma proposta muda o plano sozinha. Só o botão Aplicar mexe.
   E o motor só reescreve sessões contínuas: um treino de tiro nunca
   é reescrito por mim, porque o texto das séries é específico.
   ───────────────────────────────────────────────────────────── */
PARTE('analise feito x planejado', function(){

  if(typeof ST !== 'object' || typeof sessaoDe !== 'function')
    throw new Error('app antigo: sem ST/sessaoDe');

  const K_DISPENSA = 'bq.analise.dispensadas';
  const K_HIST     = 'bq.analise.aplicadas';
  const JANELA     = 21;               // dias olhados para trás
  const ALVO_SEG   = 327;              // 5:27/km — alvo da maratona
  const ALVO_TXT   = '3:50';

  /* ═══════ utilidades ═══════ */
  const nz  = v => { const x = parseFloat(v); return isFinite(x) ? x : NaN };
  const pct = (a, b) => b > 0 ? a / b : NaN;
  const dataDe = r => iso(addD(HOJE, -r.d));
  const hojeIso = () => iso(HOJE);

  function hms(seg){
    seg = Math.round(seg);
    const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function hm(seg){
    seg = Math.round(seg);
    return Math.floor(seg / 3600) + ':' + String(Math.floor((seg % 3600) / 60)).padStart(2, '0');
  }
  function pc(seg){                      // pace em s/km -> "5:27"
    seg = Math.round(seg);
    return Math.floor(seg / 60) + ':' + String(seg % 60).padStart(2, '0');
  }
  function alvoSeg(s){                   // pace alvo da sessão, em s/km
    if(!s) return NaN;
    if(typeof s.pace === 'string' && s.pace.indexOf(':') > 0){
      const [a, b] = s.pace.split(':').map(Number);
      return a * 60 + b;
    }
    const p = nz(s.pace);
    if(isFinite(p) && p > 60) return p;
    if(s.km > 0 && s.min > 0) return s.min * 60 / s.km;
    return NaN;
  }
  function brev(k){ const d = dt(k); return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') }

  function guardar(chave, obj){ try{ localStorage.setItem(chave, JSON.stringify(obj)) }catch(e){} }
  function ler(chave){ try{ return JSON.parse(localStorage.getItem(chave) || '{}') || {} }catch(e){ return {} } }

  /* pr(), fcr() e MOD vivem no index.html. Se um dia mudarem de lugar,
     a análise inteira cairia por causa de um rótulo. Não vale o risco. */
  const faixaP  = z => typeof pr  === 'function' ? pr(z)  : pc(Z[z].p[0]) + '–' + pc(Z[z].p[1]) + '/km';
  const faixaFC = z => typeof fcr === 'function' ? fcr(z) : Z[z].fc[0] + '–' + Z[z].fc[1] + ' bpm';
  const nomeMod = m => (typeof MOD === 'object' && MOD[m]) ? MOD[m].n.toLowerCase() : m;

  /* ═══════ classificação do foco ═══════ */
  const CONTINUO = {facil:1, longo:1, rec:1, regenerativo:1, rodagem:1};
  const continuo = f => !!CONTINUO[f];

  /* ═══════ o que aconteceu num dia ═══════ */
  function atividades(k, mod){
    mod = mod || 'corrida';
    return (ST.runs || []).filter(function(r){
      return dataDe(r) === k && (r.mod || 'corrida') === mod && !r.walk;
    });
  }
  function juntar(acts){                 // duas corridas no mesmo dia viram uma
    if(!acts.length) return null;
    const km  = acts.reduce((a, r) => a + (+r.km || 0), 0);
    const dur = acts.reduce((a, r) => a + (+r.dur || (r.km * r.pace) || 0), 0);
    const cf  = acts.filter(r => isFinite(r.fc) && r.fc > 80);
    const fc  = cf.length ? cf.reduce((a, r) => a + r.fc, 0) / cf.length : NaN;
    const cc  = acts.filter(r => isFinite(r.cad) && r.cad > 120);
    const cad = cc.length ? cc.reduce((a, r) => a + r.cad, 0) / cc.length : NaN;
    return {km: km, dur: dur, pace: km > 0 ? dur / km : NaN, fc: fc, cad: cad, n: acts.length};
  }

  /* ═══════ veredito de uma sessão ═══════ */
  /* devolve {classe:'bom'|'atencao'|'ruim'|'info', txt:'…'} */
  function julgar(s, f){
    if(!s) return null;
    if(s.mod !== 'corrida')
      return {classe:'bom', txt:'Sessão de ' + nomeMod(s.mod) + ' registrada.'};

    const alvo = alvoSeg(s), difKm = f.km - (+s.km || 0);
    const faixaFC = Z[s.foco === 'longo' ? 'long' : 'faci'].fc;
    const pisoQual = Z.faci.fc[1];   // media da sessao de tiro tem que passar do teto da zona facil

    if(!continuo(s.foco)){
      /* sessão de qualidade: pace médio inclui aquecimento, não julgo por ele */
      const partes = [];
      if(Math.abs(difKm) <= Math.max(1, s.km * 0.12)) partes.push('distância cumprida');
      else if(difKm < 0) partes.push('faltaram ' + Math.abs(difKm).toFixed(1) + ' km');
      else partes.push('passou ' + difKm.toFixed(1) + ' km do previsto');

      if(isFinite(f.fc)){
        if(f.fc >= pisoQual) partes.push('FC média ' + Math.round(f.fc) + ' bpm, a intensidade aconteceu');
        else partes.push('FC média ' + Math.round(f.fc) + ' bpm, abaixo de ' + pisoQual + ' — os trechos fortes podem ter ficado leves');
      }
      const bom = Math.abs(difKm) <= Math.max(1, s.km * 0.12) && (!isFinite(f.fc) || f.fc >= pisoQual);
      return {classe: bom ? 'bom' : 'atencao', txt: partes.join(' · ')};
    }

    /* esforço continuo: aqui o pace médio vale */
    const dif = isFinite(alvo) ? f.pace - alvo : NaN;   // negativo = mais rápido
    if(!isFinite(dif))
      return {classe:'info', txt:'Sem pace alvo para comparar.'};

    if(dif < -25)
      return {classe:'atencao', txt:'Correu ' + Math.round(-dif) + ' s/km mais rápido que o pedido. '
              + 'Rodagem fácil rápida demais é o erro clássico: ela cansa como treino forte e não rende como treino forte.'};
    if(dif > 60)
      return {classe:'atencao', txt:'Correu ' + Math.round(dif) + ' s/km mais devagar que o pedido. '
              + 'Uma vez é cansaço ou calor. Repetido, é sinal de carga acumulada.'};
    if(difKm < -Math.max(1.5, s.km * 0.15))
      return {classe:'atencao', txt:'Pace certo, mas faltaram ' + Math.abs(difKm).toFixed(1) + ' km.'};
    return {classe:'bom', txt:'No ritmo e na distância pedidos.'};
  }

  /* ═══════ agregados do bloco ═══════ */
  function bloco(){
    const ini = iso(addD(HOJE, -JANELA)), hoje = hojeIso();
    /* hoje entra na conta. Se o treino de hoje já apareceu, ele é
       analisado na hora; se ainda não apareceu, o dia não conta como
       falta — o dia não acabou. */
    const chaves = Object.keys(ST.plano || {}).filter(k => k >= ini && k <= hoje).sort();

    let plan = 0, done = 0, kmPlan = 0, kmFeito = 0;
    let facilN = 0, facilOk = 0, facilRapida = 0;
    let qualN = 0, qualOk = 0;
    let longoN = 0, longoOk = 0, longoPlan = 0;
    const detalhes = [];

    chaves.forEach(function(k){
      const s = sessaoDe(k);
      if(!s || s.prova) return;
      const acts = atividades(k, s.mod);
      const f = juntar(acts);
      if(k === hoje && !f && !concluida(s)) return;   // o dia ainda não acabou
      plan++;
      if(s.mod === 'corrida') kmPlan += (+s.km || 0);
      if(s.mod === 'corrida' && s.foco === 'longo') longoPlan++;
      if(f){
        done++;
        if(s.mod === 'corrida') kmFeito += f.km;
        const v = julgar(s, f);
        detalhes.push({k: k, s: s, f: f, v: v});
        if(s.mod === 'corrida'){
          if(s.foco === 'longo'){ longoN++; if(v.classe === 'bom') longoOk++ }
          else if(continuo(s.foco)){
            facilN++;
            const d = f.pace - alvoSeg(s);
            if(d < -25) facilRapida++; else if(v.classe === 'bom') facilOk++;
          } else { qualN++; if(v.classe === 'bom') qualOk++ }
        }
      } else if(concluida(s)){
        done++;
      }
      /* segundo treino do dia (força, natação) */
      const x = extraDe(k);
      if(x){ plan++; if(atividades(k, x.mod).length || concluida(x)) done++ }
    });

    /* corridas em dias que o plano não previa: não somem, viram extra */
    let kmExtra = 0, nExtra = 0;
    (ST.runs || []).forEach(function(r){
      const k = dataDe(r);
      if(k < ini || k > hoje) return;
      if((r.mod || 'corrida') !== 'corrida' || r.walk) return;
      const s = sessaoDe(k);
      if(s && s.mod === 'corrida') return;
      kmExtra += (+r.km || 0); nExtra++;
    });

    /* eficiência aeróbica: metros por minuto para cada batimento.
       Só rodagens contínuas com FC válida — tiro não entra. */
    function efDe(de, ate){
      const v = (ST.runs || []).filter(function(r){
        return r.d >= de && r.d < ate && !r.walk && (r.mod || 'corrida') === 'corrida'
            && r.km >= 5 && isFinite(r.fc) && r.fc > 90 && r.pace > PERFIL.paceLimiar + 25;
      });
      /* AMOSTRA MINIMA DE TRES, e nao duas.
         Com duas corridas de cada lado, o numero diz mais sobre qual
         treino caiu em qual balde do que sobre o seu condicionamento —
         uma rodagem fria a mais de um lado move o resultado em dez
         pontos. Preferi um traco a um numero que engana, ainda mais
         num indicador que voce usa para decidir treino. */
      if(v.length < 3) return null;
      const m = v.map(r => (60000 / r.pace) / r.fc);
      return {v: m.reduce((a, b) => a + b, 0) / m.length, n: v.length};
    }
    const efAgora = efDe(0, JANELA), efAntes = efDe(JANELA, JANELA * 2);
    const efDelta = (efAgora && efAntes) ? (efAgora.v / efAntes.v - 1) : null;

    /* carga aguda sobre crônica */
    const somaKm = d => (ST.runs || [])
      .filter(r => r.d < d && !r.walk && (r.mod || 'corrida') === 'corrida')
      .reduce((a, r) => a + (+r.km || 0), 0);
    const km7 = somaKm(7), km28 = somaKm(28);
    const acwr = km28 > 0 ? km7 / (km28 / 4) : null;

    return {
      plan: plan, done: done, kmPlan: kmPlan, kmFeito: kmFeito,
      pctSessoes: pct(done, plan), pctKm: pct(kmFeito, kmPlan),
      facilN: facilN, facilOk: facilOk, facilRapida: facilRapida, longoPlan: longoPlan,
      qualN: qualN, qualOk: qualOk, longoN: longoN, longoOk: longoOk,
      efDelta: efDelta, efN: efAgora ? efAgora.n : 0,
      km7: km7, km28: km28, acwr: acwr, kmExtra: kmExtra, nExtra: nExtra,
      inicio: chaves.length ? chaves[0] : null,
      detalhes: detalhes
    };
  }

  /* ═══════ projeção da maratona ═══════
     Riegel a partir do melhor esforço longo recente. Dois expoentes:
     1,06 para quem tem base sólida, 1,12 para primeira maratona.
     A verdade fica entre os dois. */
  function projecao(){
    const cand = (ST.runs || []).filter(function(r){
      /* so esforcos de verdade: um longao em ritmo facil projeta uma
         maratona assustadora que nao significa nada */
      return r.d <= 75 && !r.walk && (r.mod || 'corrida') === 'corrida'
          && r.km >= 14 && r.pace > 200 && r.pace <= PERFIL.paceLimiar + 45;
    });
    if(!cand.length) return null;
    let melhor = null;
    cand.forEach(function(r){
      const t = r.km * r.pace;
      const otim = t * Math.pow(42.195 / r.km, 1.06);
      if(!melhor || otim < melhor.otim)
        melhor = {r: r, otim: otim, pess: t * Math.pow(42.195 / r.km, 1.12)};
    });
    melhor.alvo = 42.195 * ALVO_SEG;
    return melhor;
  }

  /* ═══════ reescrever uma sessão contínua ═══════ */
  function passosDe(foco, km, paceTxt, motivo){
    const longo = foco === 'longo';
    return [
      {t:'Aquecimento', d:'8 minutos bem leves. Se as pernas estiverem pesadas, comece caminhando 3 minutos.',
       tags:[{t:'8 min'}, {t:faixaP('rec'), c:'z'}]},
      {t:'Parte principal',
       d: longo
          ? km + ' km continuos. Primeiros ' + Math.round(km * 0.6) + ' km em rodagem, últimos '
            + Math.round(km * 0.4) + ' km um pouco mais firmes, sem chegar a difícil.'
          : km + ' km em ritmo de conversa. Se não consegue falar uma frase inteira, está rápido demais.',
       tags:[{t: km + ' km'}, {t: paceTxt + '/km', c:'z'}, {t: faixaFC(longo ? 'long' : 'faci'), c:'hr'}]},
      {t:'Desaquecimento', d:'5 minutos de trote muito leve, depois 5 minutos de mobilidade: panturrilha, posterior, quadril e tornozelo.',
       tags:[{t:'10 min'}]},
      {t:'Por que mudou', d: motivo, tags:[{t:'ajuste'}]}
    ];
  }
  function reescrever(s, novoKm, motivo){
    const p = alvoSeg(s), paceTxt = isFinite(p) ? pc(p) : (s.pace || '6:35');
    const km = Math.max(4, Math.round(novoKm));
    return Object.assign({}, s, {
      km: km,
      min: isFinite(p) ? Math.round(km * p / 60) : s.min,
      detalhe: (s.foco === 'longo' ? 'Longo de ' : 'Rodagem de ') + km + ' km a ' + paceTxt + '/km. ' + motivo,
      passos: passosDe(s.foco, km, paceTxt, motivo),
      bqAjuste: motivo
    });
  }

  /* ═══════ propostas ═══════ */
  function futuros(dias){
    const de = iso(addD(HOJE, 1)), ate = iso(addD(HOJE, dias + 1));
    return Object.keys(ST.plano || {}).filter(k => k >= de && k < ate).sort();
  }
  function cortar(fator, titulo, porque, incluirLongo){
    const muda = [];
    futuros(7).forEach(function(k){
      const s = sessaoDe(k);
      if(!s || s.prova || s.mod !== 'corrida') return;
      if(!continuo(s.foco)) return;
      if(s.foco === 'longo' && !incluirLongo) return;
      const novo = Math.max(4, Math.round(s.km * (1 - fator)));
      if(novo < s.km) muda.push({data: k, de: s.km, para: novo, s: s});
    });
    if(!muda.length) return null;
    return {id:'corte' + Math.round(fator * 100), classe:'atencao', titulo: titulo, porque: porque, muda: muda};
  }

  function propostas(b, proj){
    const out = [];

    /* 1 · carga subindo rápido demais */
    if(b.acwr && b.acwr > 1.45){
      const p = cortar(0.15,
        'Tirar 15% das rodagens fáceis da próxima semana',
        'Você correu ' + Math.round(b.km7) + ' km nos últimos 7 dias contra uma média de '
        + Math.round(b.km28 / 4) + ' km por semana no último mês. A razão está em ' + b.acwr.toFixed(2)
        + '. Acima de 1,5 é a faixa onde a lesão aparece — e aos 64 anos o tendão avisa depois, não durante. '
        + 'O longo fica intacto: ele é o treino que constrói a maratona.', false);
      if(p) out.push(p);
    }

    /* 2 · plano grande demais para a vida real */
    else if(b.plan >= 8 && isFinite(b.pctKm) && b.pctKm < 0.78){
      const falta = Math.round((1 - b.pctKm) * 100);
      const p = cortar(Math.min(0.18, 1 - b.pctKm),
        'Encolher a próxima semana para o volume que você realmente cumpre',
        'Nos últimos ' + JANELA + ' dias o plano pediu ' + Math.round(b.kmPlan) + ' km e você fez '
        + Math.round(b.kmFeito) + ' km, ou seja, ' + falta + '% a menos. '
        + 'Um plano que não se cumpre não treina ninguém — ele só gera culpa. '
        + 'Melhor um volume menor cumprido inteiro do que um volume grande cumprido pela metade.', false);
      if(p) out.push(p);
    }

    /* 3 · perdeu o longo */
    if(b.longoPlan >= 2 && b.longoN === 0){
      const prox = futuros(9).map(sessaoDe).filter(s => s && s.foco === 'longo' && s.mod === 'corrida')[0];
      if(prox && prox.km > 16){
        const alvo = Math.round(prox.km * 0.82);
        out.push({id:'longo', classe:'atencao',
          titulo:'Encurtar o próximo longo de ' + prox.km + ' para ' + alvo + ' km',
          porque:'Você não completou nenhum longo nos últimos ' + JANELA + ' dias. '
            + 'Voltar direto no número cheio é como o corredor se machuca depois de uma pausa. '
            + 'Este longo menor recoloca o degrau e a progressão retoma na semana seguinte.',
          muda:[{data: prox.data || prox.id, de: prox.km, para: alvo, s: prox}]});
      }
    }

    /* 4 · indo bem: um degrau a mais no longo */
    if(b.plan >= 8 && b.pctSessoes >= 0.9 && b.pctKm >= 0.95 && b.longoOk >= 2
       && (b.efDelta === null || b.efDelta >= 0) && (!b.acwr || b.acwr < 1.3)){
      const prox = futuros(9).map(sessaoDe).filter(s => s && s.foco === 'longo' && s.mod === 'corrida')[0];
      if(prox && prox.km < 32){
        const alvo = Math.min(32, prox.km + 2);
        out.push({id:'sobe', classe:'bom',
          titulo:'Somar 2 km ao próximo longo, de ' + prox.km + ' para ' + alvo + ' km',
          porque:'Você cumpriu ' + Math.round(b.pctSessoes * 100) + '% das sessões, '
            + Math.round(b.pctKm * 100) + '% do volume, fechou ' + b.longoOk + ' longos no ritmo'
            + (b.efDelta > 0 ? ' e sua eficiência aeróbica subiu ' + (b.efDelta * 100).toFixed(1) + '%' : '')
            + '. O corpo está absorvendo. Dois quilômetros é um degrau pequeno o bastante para ser seguro '
            + 'e grande o bastante para contar até 18 de outubro.',
          muda:[{data: prox.data || prox.id, de: prox.km, para: alvo, s: prox}]});
      }
    }

    const disp = ler(K_DISPENSA);
    return out.filter(p => !disp[p.id + '|' + iso(addD(HOJE, -dow(HOJE) + 1))]);
  }

  /* ═══════ avisos (sem botão, só verdade) ═══════ */
  function avisos(b, proj){
    const a = [];
    if(b.facilN >= 3 && b.facilRapida / b.facilN >= 0.5)
      a.push({classe:'atencao', t:'Rodagem fácil rápida demais',
        d: b.facilRapida + ' das ' + b.facilN + ' rodagens fáceis saíram bem acima do ritmo pedido. '
          + 'Isso não é falta de disciplina, é o erro mais comum de quem corre há anos: o corpo já sabe '
          + 'aquele ritmo e vai sozinho. O custo aparece no limiar e no longo, que chegam com a perna gasta. '
          + 'Segure em ' + faixaP('faci') + '.'});

    if(b.qualN >= 2 && b.qualOk / b.qualN < 0.5)
      a.push({classe:'atencao', t:'Sessões fortes não estão saindo',
        d: 'Só ' + b.qualOk + ' de ' + b.qualN + ' treinos de qualidade bateram distância e FC. '
          + 'Se as pernas não respondem no dia forte, quase sempre a causa está no dia anterior.'});

    if(b.efDelta !== null && b.efDelta <= -0.03)
      a.push({classe:'atencao', t:'Eficiência aeróbica caindo',
        d:'No mesmo batimento você está correndo ' + Math.abs(b.efDelta * 100).toFixed(1) + '% mais devagar '
          + 'do que há três semanas. Isso costuma ser sono, calor ou carga acumulada — não perda de forma.'});

    if(b.efDelta !== null && b.efDelta >= 0.02)
      a.push({classe:'bom', t:'Eficiência aeróbica subindo',
        d:'No mesmo batimento você está ' + (b.efDelta * 100).toFixed(1) + '% mais rápido do que há três semanas. '
          + 'É exatamente o que a fase de base deveria produzir.'});

    if(proj){
      const dif = proj.otim - proj.alvo;
      if(dif > 8 * 60)
        a.push({classe:'info', t:'A projeção ainda está acima de ' + ALVO_TXT,
          d:'Pelo seu melhor esforço longo recente (' + proj.r.km.toFixed(1) + ' km a ' + pc(proj.r.pace) + '/km), '
            + 'a maratona sai hoje entre ' + hm(proj.otim) + ' e ' + hm(proj.pess) + '. '
            + 'Isso é esperado: faltam as semanas de ritmo específico, que é justamente onde esse tempo cai. '
            + 'O número a acompanhar não é este, é se ele encolhe a cada bloco.'});
      else
        a.push({classe:'bom', t:'A projeção já cabe no alvo',
          d:'Seu melhor esforço recente projeta entre ' + hm(proj.otim) + ' e ' + hm(proj.pess)
            + ' na maratona, contra o alvo de ' + ALVO_TXT + '.'});
    }
    return a;
  }

  /* ═══════ veredito geral ═══════ */
  function veredito(b, props){
    if(!b.plan){
      /* DIAGNOSTICO, e nao so uma mensagem bonita.
         "Nenhum treino avaliado" pode ser tres coisas muito diferentes:
         o plano nao cobre a janela, o plano sumiu, ou as atividades
         nao casaram. Antes eu chutava qual era. Agora o proprio cartao
         conta o que existe em ST.plano, para o motivo aparecer na tela
         em vez de virar mais uma rodada de adivinhacao. */
      var ini0 = iso(addD(HOJE, -JANELA)), h0 = hojeIso();
      var todas = Object.keys(ST.plano || {}).sort();
      var naJanela = todas.filter(function(k){ return k >= ini0 && k <= h0 });
      var corridaNaJanela = naJanela.filter(function(k){
        var x = ST.plano[k]; return x && x.mod === 'corrida' && !x.prova });

      /* Listar os dias, e nao so contar. Com 11 dias na mao eu vejo de
         imediato se e o bloco, se e o objetivo ou se sao cancelamentos
         — tres causas diferentes que a contagem nao distingue. */
      var lista = todas.slice(0, 16).map(function(k){
        var x = ST.plano[k] || {};
        return k.slice(5) + ' ' + (x.prova ? 'PROVA' : (x.mod || '?').slice(0,4) +
               (x.km ? ' ' + x.km : ''));
      }).join(' · ');

      var jan = (typeof window.bqJanela === 'object' && window.bqJanela.ligado)
                ? (window.bqJanela.ligado() ? 'ligada' : 'DESLIGADA') : 'ausente';
      var blo = (window.bqBloco && window.bqBloco.atual && window.bqBloco.atual())
                ? 'sim' : 'NENHUM';
      var obj = null;
      try{ obj = (typeof objetivoAtivo === 'function') ? objetivoAtivo() : null }catch(e){}

      var diag = 'Plano: ' + todas.length + ' dia' + (todas.length === 1 ? '' : 's') +
                 (todas.length ? ' (' + todas[0] + ' a ' + todas[todas.length-1] + ')' : '') +
                 ' · na janela: ' + naJanela.length + '. ' +
                 'Objetivo: ' + (obj ? (obj.nome || obj.n) + ' em ' + obj.data +
                                       ', ' + (obj.sem || '?') + ' semanas' : 'NENHUM') +
                 ' · janela 14d: ' + jan + ' · bloco vigente: ' + blo + '. ' +
                 'Dias: ' + lista;

      return {classe:'info', t:'Nenhum treino do plano avaliado ainda',
        d: (naJanela.length === 0
             ? 'O plano não tem nenhum dia entre ' + ini0 + ' e hoje. '
             : 'Há dias de plano na janela, mas nenhum foi avaliado — as atividades do Garmin não casaram com eles. ')
        + 'A sincronia roda de hora em hora. ' + diag};
    }
    if(b.plan < 4)
      return {classe:'info', t:'Poucos dias para julgar o bloco',
        d:'O plano tem ' + b.plan + (b.plan === 1 ? ' dia avaliado' : ' dias avaliados') + ' até agora. '
        + 'Dá para comparar treino por treino, e é o que está logo abaixo. Mas aderência, carga e tendência '
        + 'só significam alguma coisa com duas ou três semanas de plano rodado. '
        + 'Prefiro te dizer isso a inventar um veredito em cima de três pontos.'};
    if(b.acwr && b.acwr > 1.45)
      return {classe:'ruim', t:'Segure a carga',
        d:'O volume subiu rápido demais nos últimos 7 dias. A prioridade agora é chegar inteiro em outubro, não ganhar uma semana.'};
    if(b.pctSessoes < 0.7)
      return {classe:'ruim', t:'O plano está passando por cima de você',
        d:'Menos de 70% das sessões saíram. Ou a semana está grande demais, ou a vida está grande demais. Os dois têm conserto — o plano é que tem que ceder.'};
    if(b.pctSessoes >= 0.9 && b.pctKm >= 0.9 && (b.efDelta === null || b.efDelta >= 0))
      return {classe:'bom', t:'Indo bem',
        d:'Aderência alta, volume cumprido e a resposta do corpo está estável ou melhorando. É assim que se chega em 18 de outubro.'};
    return {classe:'atencao', t:'No caminho, com pontos a corrigir',
      d:'Nada grave, mas há detalhes que cobram juros lá na frente. Estão listados abaixo.'};
  }

  /* ═══════ pintura ═══════ */
  const CSS = `
  #bqAn{padding:15px 13px 14px}
  .bqa-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}
  .bqa-v{border-radius:12px;padding:11px 12px;margin-bottom:12px;border:1px solid}
  .bqa-v b{display:block;font-size:15px;margin-bottom:3px}
  .bqa-v span{font-size:12.5px;line-height:1.45;opacity:.88}
  .bqa-bom{background:rgba(46,182,125,.10);border-color:rgba(46,182,125,.35)}
  .bqa-atencao{background:rgba(232,163,54,.10);border-color:rgba(232,163,54,.35)}
  .bqa-ruim{background:rgba(226,86,86,.10);border-color:rgba(226,86,86,.35)}
  .bqa-info{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.13)}
  .bqa-g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .bqa-leg{margin:0 0 12px;border-radius:10px;background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.07);overflow:hidden}
  .bqa-leg>summary{list-style:none;cursor:pointer;padding:9px 11px;font-size:11.5px;
    font-weight:700;color:var(--tx2);display:flex;align-items:center;justify-content:space-between}
  .bqa-leg>summary::-webkit-details-marker{display:none}
  .bqa-leg>summary:after{content:'▾';font-size:10px;opacity:.6;transition:.2s}
  .bqa-leg[open]>summary:after{transform:rotate(180deg)}
  .bqa-leg .li{padding:0 11px 11px}
  .bqa-leg dl{margin:0}
  .bqa-leg dt{font-size:11.5px;font-weight:700;color:var(--tx);margin-top:10px}
  .bqa-leg dt:first-child{margin-top:2px}
  .bqa-leg dd{margin:2px 0 0;font-size:11px;color:var(--tx3);line-height:1.5}
  .bqa-leg dd b{color:var(--tx2)}
  .bqa-leg .alvo{display:inline-block;margin-top:3px;font-size:10.5px;font-weight:700;
    padding:2px 7px;border-radius:99px;background:rgba(255,255,255,.06);color:var(--tx2)}
  .bqa-c{background:rgba(255,255,255,.04);border-radius:10px;padding:9px 10px}
  .bqa-c i{display:block;font-style:normal;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.55;margin-bottom:3px}
  .bqa-c b{font-size:16px;font-variant-numeric:tabular-nums}
  .bqa-c u{display:block;text-decoration:none;font-size:11px;opacity:.6;margin-top:2px}
  .bqa-t{font-size:11px;letter-spacing:.07em;text-transform:uppercase;opacity:.55;margin:14px 0 7px}
  .bqa-u{background:rgba(255,255,255,.04);border-radius:10px;padding:10px 11px;font-size:12.5px;line-height:1.5}
  .bqa-u em{font-style:normal;opacity:.6}
  .bqa-p{border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:11px 12px;margin-bottom:9px}
  .bqa-p h4{margin:0 0 5px;font-size:13.5px;line-height:1.35}
  .bqa-p p{margin:0 0 8px;font-size:12.5px;line-height:1.5;opacity:.85}
  .bqa-m{font-size:12px;font-variant-numeric:tabular-nums;opacity:.75;margin-bottom:9px}
  .bqa-m span{display:inline-block;margin-right:9px}
  .bqa-b{display:flex;gap:8px}
  .bqa-b button{flex:0 0 auto;border:0;border-radius:9px;padding:8px 15px;font-size:12.5px;font-weight:600;cursor:pointer}
  .bqa-ap{background:var(--ok,#2eb67d);color:#06231a}
  .bqa-di{background:rgba(255,255,255,.08);color:inherit}
  .bqa-nada{font-size:12.5px;line-height:1.5;opacity:.7}`;

  (function(){
    if(document.getElementById('bqa-css')) return;
    const st = document.createElement('style');
    st.id = 'bqa-css'; st.textContent = CSS;
    document.head.appendChild(st);
  })();

  function caixa(){
    let el = document.getElementById('bqAn');
    if(el) return el;
    const alvo = document.getElementById('v-coach');
    if(!alvo) return null;
    el = document.createElement('section');
    el.className = 'card'; el.id = 'bqAn';
    alvo.appendChild(el);
    return el;
  }

  let ULTIMAS = [];      // propostas da pintura corrente

  function pintar(){
    const el = caixa();
    if(!el) return;
    if(!ST.plano || !Object.keys(ST.plano).length){ el.style.display = 'none'; return }
    el.style.display = '';

    const b = bloco(), proj = projecao(), props = propostas(b, proj), av = avisos(b, proj), v = veredito(b, props);
    ULTIMAS = props;

    const num = (x, s) => isFinite(x) ? Math.round(x * 100) + '%' : '—';
    const ult = b.detalhes[b.detalhes.length - 1];

    let h = '<div class="bqa-h"><span class="kicker">Feito x planejado</span>'
          + '<span class="v" style="opacity:.6;font-size:11.5px">últimos ' + JANELA + ' dias</span></div>';

    h += '<div class="bqa-v bqa-' + v.classe + '"><b>' + v.t + '</b><span>' + v.d + '</span></div>';

    h += '<div class="bqa-g">'
      + '<div class="bqa-c"><i>Sessões</i><b>' + b.done + '/' + b.plan + '</b><u>' + num(b.pctSessoes) + ' do plano</u></div>'
      /* O "Volume" mostrava so o kmFeito — os quilometros de corridas
         que casaram com um dia PLANEJADO. Tudo que voce correu num dia
         sem sessao prevista ia para kmExtra e nao aparecia em lugar
         nenhum: 111,7 km reais viravam "34 km" na tela. Rotulo de uma
         coisa, medida de outra, o mesmo defeito do "189%".
         Agora o numero grande e o que voce CORREU DE VERDADE, e a
         linha de baixo diz quanto disso saiu do plano. */
      + '<div class="bqa-c"><i>Volume</i><b>' + Math.round(b.kmFeito + b.kmExtra) + ' km</b><u>'
        + Math.round(b.kmFeito) + ' de ' + Math.round(b.kmPlan) + ' km do plano'
        + (b.kmExtra >= 1 ? ' · +' + Math.round(b.kmExtra) + ' fora dele' : '') + '</u></div>'
      + '<div class="bqa-c"><i>Carga 7d ÷ média</i><b>' + (b.acwr ? b.acwr.toFixed(2) : '—') + '</b><u>'
        + (b.acwr ? (b.acwr > 1.45 ? 'subindo rápido' : b.acwr < 0.8 ? 'caindo' : 'faixa segura') : 'sem dados') + '</u></div>'
      + '<div class="bqa-c"><i>Eficiência aeróbica</i><b>'
        + (b.efDelta === null ? '—' : (b.efDelta >= 0 ? '+' : '') + (b.efDelta * 100).toFixed(1) + '%')
        + '</b><u>' + (b.efDelta === null
             ? 'precisa de 3 rodagens com FC em cada período'
             : 'contra as 3 semanas antes · ' + b.efN + ' rodagens') + '</u></div>'
      + '</div>';

    /* LEGENDA. Um numero sem referencia nao ajuda ninguem a decidir
       treino: 1.19 e bom ou ruim? +11,8% e muito? Cada verbete diz o
       que a conta mede, qual e a faixa que interessa e — quando existe
       — em que ponto o numero deixa de ser confiavel. */
    h += '<details class="bqa-leg"><summary>O que cada número quer dizer</summary><div class="li"><dl>'

      + '<dt>Sessões</dt><dd>Quantos treinos de corrida que o plano pediu nos últimos '
      + JANELA + ' dias tiveram uma atividade correspondente no Garmin. '
      + 'Só conta sessão que ainda está no calendário: o que você cancelou sai da conta.'
      + '<span class="alvo">alvo: 90% ou mais</span></dd>'

      + '<dt>Volume</dt><dd>Os quilômetros que você <b>correu de verdade</b> nos últimos '
      + JANELA + ' dias. A linha de baixo separa o que saiu do plano do que você fez por fora — '
      + 'os dois contam para o corpo, mas só o primeiro mede a aderência.'
      + '<span class="alvo">sem alvo fixo: o que importa é a progressão</span></dd>'

      + '<dt>Carga 7d ÷ média</dt><dd>Os quilômetros da última semana divididos pela sua média '
      + 'das últimas quatro. É o <b>ACWR</b>, e mede o quanto você acelerou em relação ao que o seu '
      + 'corpo já está acostumado. Subir demais de uma vez é a receita clássica da lesão — e aos 64 '
      + 'anos o tendão avisa depois, não durante.'
      + '<span class="alvo">0,8 a 1,3 seguro · acima de 1,45 é risco · abaixo de 0,8 é destreino</span></dd>'

      + '<dt>Eficiência aeróbica</dt><dd>Quantos metros você percorre por minuto para <b>cada '
      + 'batimento do coração</b>, nas rodagens fáceis. Sobe quando você corre mais rápido com o '
      + 'mesmo esforço cardíaco — é o sinal mais honesto de base aeróbica, porque não depende de '
      + 'você se esforçar mais no dia do teste. A comparação é contra as três semanas anteriores.'
      + '<span class="alvo">positivo é bom · 3 a 8% em 3 semanas é ganho real · acima de 15% quase '
      + 'sempre é amostra pequena, não condicionamento</span></dd>'

      + '<dt>Projeção para 18 de outubro</dt><dd>O tempo de maratona que o seu melhor esforço '
      + 'recente projeta, pela fórmula de Riegel. Serve para responder uma pergunta só: '
      + '<b>o alvo ainda é viável?</b> O número a acompanhar não é o valor de hoje, é se ele '
      + 'encolhe a cada bloco.'
      + '<span class="alvo">alvo: 3:50 (5:27/km)</span></dd>'

      + '</dl></div></details>';

    if(!proj){
      h += '<div class="bqa-t">Projeção para 18 de outubro</div>'
         + '<div class="bqa-u">Ainda não há esforço recente forte o bastante para projetar. '
         + 'Rodagem fácil não serve: ela diz como você recupera, não a que ritmo você aguenta 42 km. '
         + 'O próximo limiar longo ou um trecho em ritmo dentro do longão já dá o número.</div>';
    }
    if(proj){
      h += '<div class="bqa-t">Projeção para 18 de outubro</div>'
         + '<div class="bqa-u"><b style="font-size:15px">' + hm(proj.otim) + ' – ' + hm(proj.pess) + '</b> '
         + '<em>· alvo ' + ALVO_TXT + ' (' + pc(ALVO_SEG) + '/km)</em><br>'
         + '<em>a partir de ' + proj.r.km.toFixed(1) + ' km a ' + pc(proj.r.pace) + '/km em ' + brev(dataDe(proj.r)) + '</em></div>';
    }

    if(ult && b.plan < 4 && b.detalhes.length > 1){
      h += '<div class="bqa-t">Treinos comparados</div>';
      b.detalhes.slice().reverse().forEach(function(x){
        h += '<div class="bqa-u" style="margin-bottom:7px"><b>' + brev(x.k) + ' · ' + (x.s.titulo || x.s.foco) + '</b><br>'
           + '<em>planejado</em> ' + (x.s.km || '—') + ' km a ' + (isFinite(alvoSeg(x.s)) ? pc(alvoSeg(x.s)) : '—') + '/km'
           + ' &nbsp;·&nbsp; <em>feito</em> ' + x.f.km.toFixed(1) + ' km a ' + pc(x.f.pace) + '/km'
           + (isFinite(x.f.fc) ? ' · FC ' + Math.round(x.f.fc) : '') + '<br><br>' + x.v.txt + '</div>';
      });
    } else if(ult){
      h += '<div class="bqa-t">Último treino comparado</div>'
         + '<div class="bqa-u"><b>' + brev(ult.k) + ' · ' + (ult.s.titulo || ult.s.foco) + '</b><br>'
         + '<em>planejado</em> ' + (ult.s.km || '—') + ' km a ' + (isFinite(alvoSeg(ult.s)) ? pc(alvoSeg(ult.s)) : '—') + '/km'
         + ' &nbsp;·&nbsp; <em>feito</em> ' + ult.f.km.toFixed(1) + ' km a ' + pc(ult.f.pace) + '/km'
         + (isFinite(ult.f.fc) ? ' · FC ' + Math.round(ult.f.fc) : '') + '<br><br>' + ult.v.txt + '</div>';
    }

    const sHoje = sessaoDe(hojeIso());
    if(sHoje && sHoje.mod === 'corrida' && !atividades(hojeIso(), 'corrida').length){
      h += '<div class="bqa-t">Hoje</div><div class="bqa-u"><b>' + (sHoje.titulo || sHoje.foco) + '</b> · '
         + (sHoje.km || '—') + ' km a ' + (isFinite(alvoSeg(sHoje)) ? pc(alvoSeg(sHoje)) : '—') + '/km<br>'
         + '<em>Ainda não chegou nenhuma corrida de hoje do Garmin. Se você já treinou, a sincronia roda de hora '
         + 'em hora: espere o relógio subir a atividade e puxe a tela para baixo.</em></div>';
    }

    if(b.kmExtra > 0){
      h += '<div class="bqa-t">Fora do plano</div><div class="bqa-u">'
         + b.nExtra + (b.nExtra === 1 ? ' corrida' : ' corridas') + ' em dias que o plano não previa, somando '
         + b.kmExtra.toFixed(1) + ' km. Contam para a carga, mesmo não contando para a aderência.</div>';
    }

    if(av.length){
      h += '<div class="bqa-t">O que os números dizem</div>';
      av.forEach(a => { h += '<div class="bqa-v bqa-' + a.classe + '"><b>' + a.t + '</b><span>' + a.d + '</span></div>' });
    }

    h += '<div class="bqa-t">Mudanças propostas</div>';
    if(!props.length){
      h += '<div class="bqa-nada">Nada a mudar. O plano das próximas semanas continua adequado ao que você vem entregando. '
         + 'Quando eu achar que ele deve mudar, a proposta aparece aqui com o motivo e você decide.</div>';
    } else {
      props.forEach(function(p, i){
        h += '<div class="bqa-p"><h4>' + p.titulo + '</h4><p>' + p.porque + '</p><div class="bqa-m">'
           + p.muda.map(m => '<span>' + brev(m.data) + ' &nbsp;' + m.de + ' → <b>' + m.para + ' km</b></span>').join('')
           + '</div><div class="bqa-b"><button class="bqa-ap" data-bqap="' + i + '">Aplicar</button>'
           + '<button class="bqa-di" data-bqdi="' + i + '">Dispensar</button></div></div>';
      });
    }
    el.innerHTML = h;
  }

  /* ═══════ aplicar e dispensar ═══════ */
  function aplicar(p){
    if(!p || !p.muda.length) return;
    p.muda.forEach(function(m){
      const k = m.data;
      const s = sessaoDe(k) || m.s;
      if(!s || s.prova) return;
      ST.trocas[k] = reescrever(s, m.para, p.titulo + '. ' + p.porque.split('.')[0] + '.');
    });
    const hist = ler(K_HIST);
    hist[Date.now()] = {id: p.id, titulo: p.titulo, dias: p.muda.map(m => m.data)};
    guardar(K_HIST, hist);
    try{ rebuild() }catch(e){}
    try{ renderCoach() }catch(e){}
    try{ persistir() }catch(e){}
  }
  function dispensar(p){
    const d = ler(K_DISPENSA);
    d[p.id + '|' + iso(addD(HOJE, -dow(HOJE) + 1))] = 1;   // volta a perguntar na semana seguinte
    guardar(K_DISPENSA, d);
    pintar();
  }

  document.addEventListener('click', function(e){
    const alvo = e.target;
    if(!alvo || !alvo.closest) return;
    const a = alvo.closest('[data-bqap]');
    if(a){
      const p = ULTIMAS[+a.dataset.bqap];
      if(p && confirm(p.titulo + '\n\n' + p.muda.length + ' treino(s) mudam. Você pode desfazer cada um no próprio dia.\n\nAplicar?'))
        aplicar(p);
      return;
    }
    const d = alvo.closest('[data-bqdi]');
    if(d){ const p = ULTIMAS[+d.dataset.bqdi]; if(p) dispensar(p) }
  });

  /* ═══════ engate ═══════ */
  const renderCoachApp = window.renderCoach;
  if(typeof renderCoachApp === 'function'){
    window.renderCoach = function(){
      const r = renderCoachApp.apply(this, arguments);
      try{ pintar() }catch(err){ console.error('fix.js · análise:', err) }
      return r;
    };
  }
  setTimeout(function(){ try{ pintar() }catch(e){} }, 3000);
  setTimeout(function(){ try{ pintar() }catch(e){} }, 7000);

  /* console: window.bqAnalise.ver() devolve os números crus */
  window.bqAnalise = {
    aplicar: aplicar,
    reescrever: reescrever,
    ver   : function(){ const b = bloco(), pj = projecao();
                        return {bloco: b, projecao: pj, propostas: propostas(b, pj), avisos: avisos(b, pj), veredito: veredito(b)} },
    pintar: pintar
  };
});


/* ═══════════════════ 20. CANCELAR DE VERDADE ═══════════════════
   Sintoma: em um dia cujo treino JA TINHA SIDO TROCADO, o botao
   "Cancelar este treino" abria a pergunta, voce confirmava, a janela
   fechava — e o treino continuava na tela.

   Por que: existem duas rotinas cuidando de cancelamento, escritas em
   momentos diferentes. Uma APAGA o dia do plano; a outra o MANTEM,
   apenas marcado como cancelado, para dar o desfazer. Num dia trocado
   as duas se cruzam e o dia sobra no plano. Como a tela pergunta
   "existe treino neste dia?" olhando o plano, ela continua achando que
   sim e desenha o treino de novo.

   Conserto: em vez de disputar com elas, ponho uma peneira na frente de
   cada desenho de tela. Antes de renderizar qualquer coisa, todo dia
   marcado como cancelado sai do plano. Nao importa qual das duas
   rotinas o repos: quando a tela for desenhada, ele nao esta la.

   Nada se perde: o plano e refeito do zero a cada rebuild, e a marca de
   cancelado mora em ST.trocas, que vai para o Firebase. O desfazer
   continua funcionando — apaga a marca e o dia volta.
   ══════════════════════════════════════════════════════════════════ */

PARTE('cancelar de verdade', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  const foiCancelado = function(k){
    const t = ST.trocas && ST.trocas[k];
    return !!(t && (t.cancelado || t.__cancelado));
  };

  /* tira do plano todo dia que voce cancelou */
  function peneirar(){
    if(!ST.plano || !ST.trocas) return 0;
    let n = 0;
    Object.keys(ST.trocas).forEach(function(k){
      if(foiCancelado(k) && ST.plano[k]){ delete ST.plano[k]; n++ }
    });
    return n;
  }

  /* a peneira roda antes de cada desenho de tela */
  ['renderCoach', 'renderDia', 'renderSemana', 'renderCal'].forEach(function(nome){
    const orig = window[nome];
    if(typeof orig !== 'function') return;
    window[nome] = function(){
      try{ peneirar() }catch(e){ console.warn('cancelar:', e.message) }
      return orig.apply(this, arguments);
    };
  });

  peneirar();

  /* console, para conferir sem adivinhar */
  window.bqCancelar = {
    peneirar:   peneirar,
    cancelados: function(){
      return Object.keys(ST.trocas || {}).filter(foiCancelado).sort();
    },
    desfazer: function(k){
      if(!ST.trocas || !ST.trocas[k]) return 'nada marcado em ' + k;
      delete ST.trocas[k];
      if(typeof rebuild === 'function') rebuild();
      if(typeof renderCoach === 'function') renderCoach();
      if(typeof persistir === 'function') persistir();
      return 'treino de ' + k + ' devolvido ao plano';
    }
  };
});


/* ═══════ 21. CALENDARIO MAIOR E TREINO FECHADO POR PADRAO ═══════
   Duas mudancas na aba Coach, pedidas em 15/08/2026:

   1) O treino do dia nao abre mais sozinho. No lugar dele fica uma
      faixa fina com o essencial — "Hoje · Longo na bike · 110 min".
      Toque na faixa, ou num dia do calendario, e o treino inteiro abre.
      Para fechar: toque de novo no mesmo dia do calendario, ou no x no
      canto do treino.

   2) Os quadradinhos do calendario vao de 34 para 46 pixels de altura,
      com mais folga entre eles e numero maior. A Apple recomenda 44
      como minimo para o dedo; 34 estava abaixo disso, e por isso era
      facil errar o dia. O mes inteiro continua cabendo sem rolar.

   Nada disso mexe no index.html nem nos dados.
   ══════════════════════════════════════════════════════════════════ */

PARTE('calendario maior e treino fechado', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof window.renderDia !== 'function' || typeof window.renderCal !== 'function')
    throw new Error('app sem renderDia/renderCal');

  const css = document.createElement('style');
  css.textContent = `
/* ── calendario com alvo maior para o dedo ── */
.grid{gap:4px!important}
.day{height:46px!important;border-radius:11px!important;gap:4px!important}
.day .dn{font-size:15px!important}
.day .dot{width:5px!important;height:5px!important}
.dow{gap:4px!important;margin-bottom:5px!important}
.dow span{font-size:10px!important}

/* ── faixa do treino fechado ── */
.sessbar{width:100%;display:flex;align-items:center;gap:11px;padding:13px 14px;
  background:var(--s1);border:1px solid var(--line);border-radius:var(--r-md);
  text-align:left;margin-bottom:10px;transition:.15s}
.sessbar:hover{background:var(--s2)}
.sessbar .pt{width:9px;height:9px;border-radius:50%;flex:none}
.sessbar .tx{flex:1;min-width:0}
.sessbar .tx b{display:block;font-size:14px;font-weight:700;letter-spacing:-.01em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sessbar .tx span{display:block;font-size:11px;color:var(--tx2);margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sessbar .ch{color:var(--tx3);font-size:12px;flex:none;transition:.2s}
.sessbar.aberta .ch{transform:rotate(180deg)}

/* ── x para fechar o treino aberto ── */
#sess{position:relative}
.fechar-dia{position:absolute;top:11px;right:11px;width:32px;height:32px;border-radius:50%;
  background:var(--s2);color:var(--tx2);font-size:17px;line-height:1;z-index:4;
  display:flex;align-items:center;justify-content:center}
.fechar-dia:hover{background:var(--s3);color:var(--tx)}
`;
  document.head.appendChild(css);

  let aberto = false;              /* ao abrir o app, fechado */

  const painel = () => document.querySelector('#sess');

  /* o que vai na faixa quando o treino esta fechado */
  function resumo(){
    const k = ST.sel;
    const s = (typeof sessaoDe === 'function') ? sessaoDe(k) : (ST.plano || {})[k];
    const x = (ST.extras || {})[k];
    const d = dt(k);
    const quando = k === iso(HOJE) ? 'Hoje'
                 : k === iso(addD(HOJE, 1)) ? 'Amanhã'
                 : DIA[dow(d)] + ', ' + fmt(k);
    const alvo = s || x || null;
    const cor  = alvo ? MOD[alvo.mod].c : 'var(--rest)';

    let titulo = 'Descanso', linha = quando + ' · sem treino';
    if(alvo){
      titulo = alvo.titulo || MOD[alvo.mod].n;
      const p = [quando, MOD[alvo.mod].n];
      if(alvo.km)     p.push(alvo.km + ' km');
      if(alvo.metros) p.push(alvo.metros + ' m');
      if(alvo.min)    p.push(alvo.min + ' min');
      if(s && x)      p.push('2 treinos');
      linha = p.join(' · ');
    }
    return '<span class="pt" style="background:' + cor + '"></span>' +
           '<span class="tx"><b>' + titulo + '</b><span>' + linha + '</span></span>' +
           '<span class="ch">▼</span>';
  }

  /* mostra ou esconde o painel do dia, conforme o estado */
  function aplicar(){
    const el = painel();
    if(!el || !el.parentNode) return;

    let faixa = document.getElementById('sessBar');
    if(!faixa){
      faixa = document.createElement('button');
      faixa.id = 'sessBar';
      faixa.type = 'button';
      faixa.className = 'sessbar';
      faixa.onclick = function(){ aberto = !aberto; aplicar() };
      el.parentNode.insertBefore(faixa, el);
    }
    faixa.innerHTML = resumo();
    faixa.classList.toggle('aberta', aberto);

    el.style.display = aberto ? '' : 'none';

    if(aberto && !el.querySelector('.fechar-dia')){
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'fechar-dia';
      x.setAttribute('aria-label', 'Fechar o treino');
      x.textContent = '×';
      x.onclick = function(){ aberto = false; aplicar() };
      el.insertBefore(x, el.firstChild);
    }
  }

  /* depois de cada desenho do dia, reaplica o estado */
  const origDia = window.renderDia;
  window.renderDia = function(){
    const r = origDia.apply(this, arguments);
    try{ aplicar() }catch(e){ console.warn('faixa:', e.message) }
    return r;
  };

  /* tocar num dia abre; tocar de novo no mesmo dia fecha */
  function religar(){
    document.querySelectorAll('#grid [data-d]').forEach(function(b){
      b.onclick = function(){
        const k = b.dataset.d;
        if(k === ST.sel && aberto) aberto = false;
        else { ST.sel = k; aberto = true }
        renderCal(); renderDia();
        if(typeof renderSemana === 'function') renderSemana();
      };
    });
  }
  const origCal = window.renderCal;
  window.renderCal = function(){
    const r = origCal.apply(this, arguments);
    try{ religar() }catch(e){ console.warn('calendario:', e.message) }
    return r;
  };

  window.bqDia = {
    abrir:  function(){ aberto = true;  aplicar(); return 'aberto' },
    fechar: function(){ aberto = false; aplicar(); return 'fechado' },
    estado: function(){ return aberto ? 'aberto' : 'fechado' }
  };

  if(ST.aba === 'coach' && typeof renderCoach === 'function'){
    try{ renderCoach() }catch(e){}
  }
});


/* ═══════════ 22. PROVAS VINDAS DE UM ARQUIVO ═══════════
   O catalogo de provas estava escrito dentro do index.html. Toda vez que
   uma prova nova saia, ou uma data mudava, era preciso mexer no codigo do
   app — e foi assim que o Run for Renee acabou sumindo numa troca de
   versao.

   Agora existe o arquivo treinos-v2/provas.json. O app le esse arquivo
   toda vez que abre e junta ao catalogo interno: id igual substitui, id
   novo entra, e os ids listados em "remover" saem. Atualizar a lista
   passa a ser trocar um arquivo, sem tocar em codigo.

   Se o arquivo nao existir ou estiver quebrado, nada acontece: o app
   segue com o catalogo interno, como antes.

   Provas cuja distancia nao esta publicada ficam com a lista vazia. Nesse
   caso o cartao mostra "distancias no site" e esconde o botao "Treinar
   para esta" — sem distancia ele montaria um plano no chute.
   ══════════════════════════════════════════════════════════════════ */

PARTE('provas de arquivo', function(){
  if(typeof PROVAS_CAT === 'undefined') throw new Error('app sem PROVAS_CAT');

  const css = document.createElement('style');
  css.textContent =
    '.pvdists .semdist{background:transparent!important;border:1px dashed var(--line)!important;' +
    'color:var(--tx3)!important;font-style:italic}';
  document.head.appendChild(css);

  /* cartao de prova sem distancia publicada */
  const cardApp = window.cardProva;
  if(typeof cardApp === 'function'){
    window.cardProva = function(p){
      let h = cardApp.apply(this, arguments);
      if(p && Array.isArray(p.dists) && p.dists.length === 0){
        h = h.replace('<div class="pvdists"></div>',
              '<div class="pvdists"><span class="semdist">distâncias no site</span></div>');
        h = h.replace(/<button class="btmini pri"[^>]*data-treinar[\s\S]*?<\/button>/, '');
      }
      return h;
    };
  }

  function juntar(dados){
    if(!dados || !Array.isArray(dados.provas)) throw new Error('arquivo sem a lista "provas"');
    let novas = 0, trocadas = 0;
    dados.provas.forEach(function(p){
      if(!p || !p.id || !p.data) return;
      if(!Array.isArray(p.dists)) p.dists = [];
      const i = PROVAS_CAT.findIndex(function(x){ return x.id === p.id });
      if(i >= 0){ PROVAS_CAT[i] = Object.assign({}, PROVAS_CAT[i], p); trocadas++ }
      else { PROVAS_CAT.push(p); novas++ }
    });
    (dados.remover || []).forEach(function(id){
      const i = PROVAS_CAT.findIndex(function(x){ return x.id === id });
      if(i >= 0) PROVAS_CAT.splice(i, 1);
    });
    window.bqProvas.info = {novas:novas, trocadas:trocadas,
                            atualizado:dados.atualizado || '?', total:PROVAS_CAT.length};
    return window.bqProvas.info;
  }

  window.bqProvas = {
    info: null,
    juntar: juntar,
    recarregar: function(){ return carregar() },
    lista: function(){
      return PROVAS_CAT.slice().sort(function(a,b){ return a.data.localeCompare(b.data) })
        .map(function(p){ return p.data + '  ' + p.nome + '  (' + p.cidade + ')' });
    }
  };

  function carregar(){
    /* cache:'reload' obriga a ir ao servidor; sem isso o Safari serve a
       copia velha e a lista nova nao aparece */
    return fetch('./provas.json', {cache:'reload'})
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function(d){
        const info = juntar(d);
        if(typeof ST === 'object' && ST.aba === 'provas' && typeof renderProvas === 'function')
          renderProvas();
        console.log('provas.json de ' + info.atualizado + ': ' + info.novas +
                    ' novas, ' + info.trocadas + ' atualizadas, ' + info.total + ' no total');
        return info;
      })
      .catch(function(e){ console.warn('provas.json:', e.message); return null });
  }

  carregar();
});



/* ═══════════ 23. QUESTIONARIO DO CORREDOR (ANAMNESE) ═══════════
   Ate agora o app so sabia quem voce era porque os seus dados estavam
   escritos no codigo: idade 64, cinco dias por semana, pace de limiar
   5:40. Para outra pessoa usar, isso precisa ser perguntado.

   Sao 22 perguntas em cinco telas curtas. Aparece uma vez, na primeira
   abertura, e depois fica disponivel na aba Dados para refazer quando
   algo mudar.

   O QUE AS RESPOSTAS MEXEM DE VERDADE:

     dias disponiveis   -> PERFIL.dias, que decide em que dias o plano
                           poe treino
     melhor marca       -> PERFIL.paceLimiar, que e a base de TODOS os
                           ritmos e volumes que o motor calcula
     idade              -> PERFIL.idade e a FC maxima estimada, quando
                           a pessoa nao sabe a dela
     volume atual       -> um fator que encolhe o plano inteiro quando
                           ele for grande demais para quem esta comecando
     dor, lesao, PAR-Q  -> travas de seguranca: reduzem carga e trocam
                           treino forte por rodagem leve

   SOBRE A TRIAGEM DE SAUDE: as perguntas do bloco 5 seguem a ideia do
   PAR-Q, o questionario de prontidao para atividade fisica. O app NAO
   diagnostica nada e nao impede ninguem de treinar — ele avisa, com
   todas as letras, para procurar um medico antes de aumentar carga.

   COMO O PACE DE LIMIAR E CALCULADO: pela formula de Riegel, que
   projeta o tempo de uma distancia a partir de outra
   (T2 = T1 x (D2/D1)^1,06). Uso ela para achar quanto a pessoa
   correria em exatamente uma hora, e esse ritmo e o limiar. E o mesmo
   principio das tabelas de VDOT, com uma conta que da para conferir.
   ══════════════════════════════════════════════════════════════════ */

PARTE('questionario do corredor', function(){
  if(typeof ST !== 'object' || typeof PERFIL !== 'object') throw new Error('app sem ST/PERFIL');

  var DIAS_N = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

  /* ---------- estilo ---------- */
  var css = document.createElement('style');
  css.textContent = [
'#qz{position:fixed;inset:0;z-index:400;background:var(--bg);overflow-y:auto;display:none}',
'#qz.on{display:block}',
'.qz-in{max-width:560px;margin:0 auto;padding:calc(22px + env(safe-area-inset-top)) 18px 40px}',
'.qz-pass{display:flex;gap:5px;margin-bottom:18px}',
'.qz-pass i{flex:1;height:4px;border-radius:2px;background:var(--s3)}',
'.qz-pass i.on{background:var(--acc)}',
'.qz-kick{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--acc)}',
'.qz-h{font-size:23px;font-weight:800;letter-spacing:-.02em;margin:6px 0 4px}',
'.qz-sub{font-size:13.5px;color:var(--tx2);line-height:1.5;margin:0 0 20px}',
'.qz-q{margin-bottom:18px}',
'.qz-lb{display:block;font-size:13.5px;font-weight:600;margin-bottom:8px}',
'.qz-hint{display:block;font-size:11.5px;color:var(--tx3);font-weight:400;margin-top:3px}',
'.qz-in input[type=text],.qz-in input[type=number]{width:100%;padding:12px 14px;font-size:16px;',
'  background:var(--s2);border:1px solid var(--line);border-radius:12px;color:var(--tx)}',
'.qz-opts{display:flex;flex-wrap:wrap;gap:7px}',
'.qz-opt{padding:9px 14px;font-size:13.5px;font-weight:600;border-radius:999px;',
'  background:var(--s2);border:1px solid var(--line);color:var(--tx2)}',
'.qz-opt.on{background:var(--acc-wash);border-color:var(--acc);color:var(--acc)}',
'.qz-chk{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;margin-bottom:6px;',
'  background:var(--s2);border:1px solid var(--line);border-radius:12px;text-align:left;width:100%}',
'.qz-chk .bx{width:19px;height:19px;border-radius:6px;border:1.5px solid var(--line);flex:none;margin-top:1px}',
'.qz-chk.on .bx{background:var(--acc);border-color:var(--acc)}',
'.qz-chk span{font-size:13.5px;line-height:1.4}',
'.qz-pe{display:flex;gap:9px;margin-top:26px}',
'.qz-bt{flex:1;padding:14px;border-radius:14px;font-size:15px;font-weight:700}',
'.qz-bt.pri{background:var(--acc);color:var(--bg)}',
'.qz-bt.sec{background:var(--s2);border:1px solid var(--line);color:var(--tx2)}',
'.qz-pular{display:block;width:100%;margin-top:14px;padding:10px;font-size:12.5px;color:var(--tx3)}',
'.qz-res{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px}',
'.qz-res b{color:var(--acc)}',
'.qz-alerta{background:var(--warn-wash);border:1px solid rgba(245,197,68,.3);border-radius:16px;',
'  padding:16px;margin-bottom:12px;font-size:13.5px;line-height:1.55}',
'.qz-alerta.grave{background:var(--bad-wash);border-color:rgba(242,104,92,.35)}',
'.qz-alerta b{display:block;margin-bottom:5px}',
'#btQuest{width:100%;margin-top:10px;padding:13px;border-radius:14px;background:var(--s2);',
'  border:1px solid var(--line);color:var(--tx);font-size:14px;font-weight:600}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- as perguntas ---------- */
  var BLOCOS = [
    { kick:'Bloco 1 de 5', h:'Quem é você',
      sub:'Idade e peso entram no cálculo de zonas e de carga. Nada disso sai do seu aparelho e do seu Firebase.',
      qs:[
        {k:'sexo', t:'Sexo', tipo:'opt', ops:[['m','Masculino'],['f','Feminino'],['x','Prefiro não dizer']]},
        {k:'idade', t:'Idade', tipo:'num', un:'anos', min:10, max:100},
        {k:'altura', t:'Altura', tipo:'num', un:'cm', min:120, max:230},
        {k:'peso', t:'Peso', tipo:'num', un:'kg', min:30, max:250},
        {k:'fcMax', t:'Frequência cardíaca máxima, se você souber',
         dica:'Deixe em branco se não souber — eu estimo pela idade.', tipo:'num', un:'bpm', min:120, max:220, opcional:true}
      ]},
    { kick:'Bloco 2 de 5', h:'Sua história na corrida',
      sub:'É daqui que sai o tamanho do plano. Um plano grande demais para quem está começando é a receita da lesão.',
      qs:[
        {k:'tempoCorrida', t:'Há quanto tempo você corre?', tipo:'opt',
         ops:[['<6m','Menos de 6 meses'],['6-12m','6 a 12 meses'],['1-3a','1 a 3 anos'],['3-5a','3 a 5 anos'],['+5a','Mais de 5 anos']]},
        {k:'vezesSemana', t:'Quantas vezes por semana você corre hoje?', tipo:'opt',
         ops:[['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7']]},
        {k:'kmSemana', t:'Quantos quilômetros por semana, mais ou menos?',
         dica:'A média das últimas quatro semanas serve.', tipo:'num', un:'km', min:0, max:250},
        {k:'maiorDist', t:'Maior distância que você já correu de uma vez', tipo:'num', un:'km', min:0, max:300},
        {k:'jaProva', t:'Já participou de alguma prova?', tipo:'opt',
         ops:[['nao','Nunca'],['5k','Até 5 km'],['10k','10 km'],['21k','Meia maratona'],['42k','Maratona'],['ultra','Ultra']]}
      ]},
    { kick:'Bloco 3 de 5', h:'Seu ritmo',
      sub:'Esta é a parte que mais muda o plano. Todo ritmo e todo volume que o app calcula sai daqui.',
      qs:[
        {k:'marcaDist', t:'Melhor marca dos últimos 12 meses — distância',
         dica:'Prova ou treino forte, tanto faz. Pule se não tiver.', tipo:'opt', opcional:true,
         ops:[['','Não tenho'],['5','5 km'],['10','10 km'],['21.1','Meia'],['42.2','Maratona']]},
        {k:'marcaTempo', t:'Tempo dessa marca', dica:'No formato hh:mm:ss ou mm:ss.',
         tipo:'txt', ph:'ex.: 55:30', opcional:true},
        {k:'paceFacil', t:'Seu ritmo de rodagem confortável',
         dica:'Aquele em que dá para conversar. Uso este se você não tiver marca.',
         tipo:'txt', ph:'ex.: 6:30', opcional:true}
      ]},
    { kick:'Bloco 4 de 5', h:'Rotina e disponibilidade',
      sub:'O melhor plano é o que cabe na sua semana. Marque só os dias em que você realmente treina.',
      qs:[
        {k:'dias', t:'Dias disponíveis para treinar', tipo:'multi',
         ops:[['1','Seg'],['2','Ter'],['3','Qua'],['4','Qui'],['5','Sex'],['6','Sáb'],['7','Dom']]},
        {k:'tempoSessao', t:'Tempo disponível por sessão', tipo:'opt',
         ops:[['30','Até 30 min'],['45','45 min'],['60','1 hora'],['90','1h30 ou mais']]},
        {k:'forca', t:'Faz musculação ou treino de força?', tipo:'opt',
         ops:[['0','Não faço'],['1','1× por semana'],['2','2× por semana'],['3','3× ou mais']]},
        {k:'outros', t:'Pratica outro esporte?', tipo:'multi',
         ops:[['bike','Bike'],['natacao','Natação'],['futebol','Futebol'],['tenis','Tênis'],['caminhada','Caminhada'],['outro','Outro']]}
      ]},
    { kick:'Bloco 5 de 5', h:'Saúde e objetivo',
      sub:'As perguntas de saúde seguem o PAR-Q, o questionário padrão de prontidão para atividade física. O app não diagnostica nada — ele só avisa quando vale conversar com um médico antes de subir a carga.',
      qs:[
        {k:'dor', t:'Sente dor ou desconforto ao correr?', tipo:'opt',
         ops:[['nao','Não'],['asvezes','Às vezes'],['sim','Sim, quase sempre']]},
        {k:'ondeDoi', t:'Onde dói?', dica:'Só se você marcou às vezes ou sim.', tipo:'txt',
         ph:'ex.: joelho direito', opcional:true},
        {k:'lesao', t:'Teve lesão nos últimos 12 meses?', tipo:'opt',
         ops:[['nao','Não'],['recuperado','Sim, já recuperado'],['ativa','Sim, ainda incomoda']]},
        {k:'parq', t:'Alguma destas situações se aplica a você?', tipo:'chk',
         ops:[
           ['peito','Já sentiu dor no peito em repouso ou fazendo esforço'],
           ['tontura','Tem tontura, desmaio ou perda de equilíbrio'],
           ['pressao','Pressão alta sem acompanhamento médico'],
           ['coracao','Problema cardíaco diagnosticado'],
           ['cirurgia','Cirurgia nos últimos 12 meses'],
           ['medicacao','Toma medicação contínua para coração ou pressão'],
           ['medico','Um médico já disse para você não fazer exercício'],
           ['nenhuma','Nenhuma destas']
         ]},
        {k:'sono', t:'Quantas horas você dorme por noite, em média?', tipo:'num', un:'h', min:3, max:14},
        {k:'objetivo', t:'Qual é o seu objetivo principal agora?', tipo:'opt',
         ops:[['saude','Saúde e condicionamento'],['5k','Correr 5 km'],['10k','Correr 10 km'],
              ['21k','Meia maratona'],['42k','Maratona'],['ultra','Ultramaratona']]}
      ]}
  ];

  /* ---------- contas ---------- */

  /* mm:ss ou hh:mm:ss -> segundos */
  function paraSeg(txt){
    var p = String(txt || '').trim().split(':').map(Number);
    if(p.some(isNaN) || !p.length) return null;
    if(p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
    if(p.length === 2) return p[0]*60 + p[1];
    return null;
  }

  /* Riegel: quanto essa pessoa correria em exatamente uma hora?
     Esse ritmo e o limiar. T2 = T1 x (D2/D1)^1,06, resolvido para D2
     quando T2 = 3600 s. */
  function limiarPorMarca(km, seg){
    if(!(km > 0) || !(seg > 0)) return null;
    var distHora = km * Math.pow(3600 / seg, 1/1.06);
    if(!(distHora > 0)) return null;
    return Math.round(3600 / distHora);
  }

  /* Sem marca, vale a mesma regra que o app ja usa com os dados do
     Garmin: o limiar fica cerca de 65 s/km abaixo do ritmo facil. */
  function limiarPorRodagem(segPorKm){
    if(!(segPorKm > 0)) return null;
    return Math.round(segPorKm - 65);
  }

  var trava = function(v){ return Math.min(540, Math.max(210, v)) };

  /* Tanaka: 208 - 0,7 x idade. Mais fiel que os 220 - idade, sobretudo
     depois dos 50, que e exatamente o caso de quem mais precisa. */
  function fcMaxEstimada(idade){ return Math.round(208 - 0.7 * idade) }

  /* O fator encolhe o plano inteiro. Nunca aumenta: o motor ja foi
     calibrado no teto, entao so faz sentido puxar para baixo. */
  function calcularFator(q, volBaseObjetivo){
    var motivos = [];

    /* TETO — quanto o corpo desta pessoa aguenta hoje.
       Regra de bolso das assessorias: o pico do ciclo nao deve passar de
       uma vez e meia o volume semanal atual. Este teto NAO tem piso: se
       alguem corre 8 km por semana, nenhum ciclo comeca em 26.  */
    var teto = 1;
    var vol = +q.kmSemana || 0;
    if(vol > 0 && volBaseObjetivo > 0){
      teto = (vol * 1.5) / volBaseObjetivo;
      if(teto < 1) motivos.push('seu volume atual de ' + vol + ' km por semana');
    }

    /* RISCO — o quanto encolher por cima do teto, por dor, lesao ou
       saude. Aqui existe piso de 0,6: cautela nao pode zerar o treino,
       senao a pessoa fica sem plano nenhum e abandona.  */
    var risco = 1;
    if(q.tempoCorrida === '<6m'){ risco *= 0.85; motivos.push('menos de 6 meses de corrida'); }
    else if(q.tempoCorrida === '6-12m'){ risco *= 0.92; motivos.push('menos de um ano de corrida'); }

    if(q.dor === 'sim'){ risco *= 0.80; motivos.push('dor ao correr'); }
    else if(q.dor === 'asvezes'){ risco *= 0.90; motivos.push('desconforto ocasional'); }

    if(q.lesao === 'ativa'){ risco *= 0.80; motivos.push('lesão que ainda incomoda'); }
    else if(q.lesao === 'recuperado'){ risco *= 0.93; motivos.push('lesão no último ano'); }

    if(parqAcendeu(q)){ risco *= 0.85; motivos.push('a triagem de saúde'); }

    var f = Math.min(1, teto) * Math.max(0.6, risco);
    return { fator: Math.max(0.15, Math.min(1, f)), motivos: motivos };
  }

  function parqAcendeu(q){
    var m = q.parq || [];
    return m.length > 0 && m.indexOf('nenhuma') < 0;
  }

  /* Treino forte vira rodagem leve enquanto houver dor ou lesao ativa */
  function segurarIntensidade(q){
    return q.dor === 'sim' || q.lesao === 'ativa' || parqAcendeu(q);
  }

  /* ---------- aplicar no app ---------- */
  function aplicar(q){
    if(+q.idade  > 0) PERFIL.idade  = +q.idade;
    if(+q.altura > 0) PERFIL.altura = +q.altura;
    if(+q.peso   > 0) PERFIL.peso   = +q.peso;
    if(q.sexo) PERFIL.sexo = q.sexo;

    PERFIL.fcMax = +q.fcMax > 0 ? +q.fcMax
                 : (+q.idade > 0 ? fcMaxEstimada(+q.idade) : PERFIL.fcMax);

    if(Array.isArray(q.dias) && q.dias.length >= 2){
      PERFIL.dias = q.dias.map(Number).sort(function(a,b){ return a-b });
    }

    var lim = null;
    if(q.marcaDist && q.marcaTempo) lim = limiarPorMarca(+q.marcaDist, paraSeg(q.marcaTempo));
    if(lim == null && q.paceFacil)  lim = limiarPorRodagem(paraSeg(q.paceFacil));
    if(lim != null){
      PERFIL.paceLimiar = trava(lim);
      if(typeof zonas === 'function'){ try{ Z = zonas() }catch(e){} }
    }

    ST.quest = q;
    if(typeof rebuild === 'function') rebuild();
    if(typeof renderAll === 'function') { try{ renderAll() }catch(e){} }
    else if(typeof renderCoach === 'function') { try{ renderCoach() }catch(e){} }
    if(typeof persistir === 'function') persistir();
  }

  /* O motor le volBase e longoMax de objetivoAtivo(). Encolher ali
     encolhe o ciclo inteiro sem tocar em mais nada. */
  var objApp = window.objetivoAtivo;
  if(typeof objApp === 'function'){
    window.objetivoAtivo = function(){
      var o = objApp.apply(this, arguments);
      if(!o || !ST.quest) return o;
      var r = calcularFator(ST.quest, o.volBase || 0);
      if(r.fator >= 0.999) return o;
      var novo = Object.assign({}, o);
      ['volBase','volNat','volBike','longoMax','longNat','longBike'].forEach(function(k){
        if(typeof novo[k] === 'number') novo[k] = Math.round(novo[k] * r.fator * 10) / 10;
      });
      /* o longo nunca deve passar muito da maior distancia ja feita */
      var maior = +ST.quest.maiorDist || 0;
      if(maior > 0 && typeof novo.longoMax === 'number'){
        novo.longoMax = Math.min(novo.longoMax, Math.max(maior * 1.2, 6));
      }
      novo.__fator = r.fator;
      return novo;
    };
  }

  /* Com dor, lesao ativa ou PAR-Q aceso, o treino forte da semana vira
     rodagem leve. Nao e o app decidindo por voce: e nao piorar o que
     voce mesmo disse que esta doendo. */
  var sessaoApp = window.montarSessao;
  if(typeof sessaoApp === 'function'){
    var FORTES = ['intervalado','sprint','subidas','limiar','fartlek','bikeInt','natInt'];
    window.montarSessao = function(k, o, r, F, semAte, semanas){
      if(ST.quest && segurarIntensidade(ST.quest) && r && FORTES.indexOf(r.f) >= 0){
        r = Object.assign({}, r, { f: r.m === 'corrida' ? 'facil' : 'cross' });
      }
      return sessaoApp.call(this, k, o, r, F, semAte, semanas);
    };
  }

  /* ---------- a tela ---------- */
  var passo = 0, resp = {};

  function campo(qq){
    var v = resp[qq.k];
    var h = '<div class="qz-q"><label class="qz-lb">' + qq.t +
            (qq.dica ? '<span class="qz-hint">' + qq.dica + '</span>' : '') + '</label>';
    if(qq.tipo === 'num'){
      h += '<input type="number" inputmode="decimal" data-k="' + qq.k + '" value="' +
           (v == null ? '' : v) + '" placeholder="' + (qq.un || '') + '">';
    } else if(qq.tipo === 'txt'){
      h += '<input type="text" data-k="' + qq.k + '" value="' + (v == null ? '' : v) +
           '" placeholder="' + (qq.ph || '') + '">';
    } else if(qq.tipo === 'opt' || qq.tipo === 'multi'){
      h += '<div class="qz-opts">' + qq.ops.map(function(o){
        var on = qq.tipo === 'multi'
          ? (Array.isArray(v) && v.indexOf(o[0]) >= 0)
          : (String(v == null ? '' : v) === o[0]);
        return '<button type="button" class="qz-opt' + (on ? ' on' : '') +
               '" data-k="' + qq.k + '" data-v="' + o[0] + '" data-multi="' +
               (qq.tipo === 'multi' ? 1 : 0) + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    } else if(qq.tipo === 'chk'){
      h += qq.ops.map(function(o){
        var on = Array.isArray(v) && v.indexOf(o[0]) >= 0;
        return '<button type="button" class="qz-chk' + (on ? ' on' : '') +
               '" data-k="' + qq.k + '" data-v="' + o[0] + '" data-multi="1">' +
               '<span class="bx"></span><span>' + o[1] + '</span></button>';
      }).join('');
    }
    return h + '</div>';
  }

  function desenhar(){
    var el = document.getElementById('qz');
    if(!el) return;
    if(passo >= BLOCOS.length) return resumo();
    var b = BLOCOS[passo];
    el.innerHTML = '<div class="qz-in">' +
      '<div class="qz-pass">' + BLOCOS.map(function(_,i){
        return '<i class="' + (i <= passo ? 'on' : '') + '"></i>' }).join('') + '</div>' +
      '<div class="qz-kick">' + b.kick + '</div>' +
      '<h1 class="qz-h">' + b.h + '</h1>' +
      '<p class="qz-sub">' + b.sub + '</p>' +
      b.qs.map(campo).join('') +
      '<div class="qz-pe">' +
        (passo > 0 ? '<button class="qz-bt sec" id="qzVolta">Voltar</button>' : '') +
        '<button class="qz-bt pri" id="qzSegue">' +
          (passo === BLOCOS.length - 1 ? 'Ver o resultado' : 'Continuar') + '</button>' +
      '</div>' +
      (passo === 0 ? '<button class="qz-pular" id="qzPular">Responder depois</button>' : '') +
      '</div>';

    el.querySelectorAll('input[data-k]').forEach(function(i){
      i.oninput = function(){ resp[i.dataset.k] = i.value };
    });
    el.querySelectorAll('[data-v]').forEach(function(b2){
      b2.onclick = function(){
        var k = b2.dataset.k, v = b2.dataset.v;
        if(b2.dataset.multi === '1'){
          var arr = Array.isArray(resp[k]) ? resp[k].slice() : [];
          var i = arr.indexOf(v);
          if(i >= 0) arr.splice(i,1); else arr.push(v);
          /* "nenhuma destas" nao convive com as outras */
          if(v === 'nenhuma' && arr.indexOf('nenhuma') >= 0) arr = ['nenhuma'];
          else arr = arr.filter(function(x){ return x !== 'nenhuma' });
          resp[k] = arr;
        } else {
          resp[k] = v;
        }
        desenhar();
      };
    });
    var seg = document.getElementById('qzSegue');
    if(seg) seg.onclick = function(){ passo++; desenhar(); window.scrollTo(0,0) };
    var vol = document.getElementById('qzVolta');
    if(vol) vol.onclick = function(){ passo--; desenhar(); window.scrollTo(0,0) };
    var pul = document.getElementById('qzPular');
    if(pul) pul.onclick = function(){
      try{ localStorage.setItem('quest_adiado', '1') }catch(e){}
      fecharQuest();
    };
  }

  function resumo(){
    var el = document.getElementById('qz');
    aplicar(resp);

    var q = resp;
    var o = (typeof objetivoAtivo === 'function') ? objetivoAtivo() : null;
    var fator = o && o.__fator ? o.__fator : 1;
    var alertas = [];

    if(parqAcendeu(q)){
      alertas.push(['grave', 'Converse com um médico antes de aumentar a carga',
        'Você marcou pelo menos uma situação da triagem de saúde. Isso não quer dizer que você não possa correr — quer dizer que a decisão de subir volume ou intensidade não deveria ser tomada só por um aplicativo. Enquanto isso, o plano fica mais conservador e sem treino forte.']);
    }
    if(q.dor === 'sim' || q.lesao === 'ativa'){
      alertas.push(['', 'Dor não é para ser treinada por cima',
        'Enquanto você marcar dor ao correr ou lesão que ainda incomoda, os treinos fortes viram rodagem leve e o volume fica reduzido. Refaça o questionário quando melhorar e a intensidade volta sozinha.']);
    }
    var alvo = { '5k':5, '10k':10, '21k':21.1, '42k':42.2, 'ultra':50 }[q.objetivo];
    var maior = +q.maiorDist || 0;
    if(alvo && maior > 0 && alvo > maior * 2){
      alertas.push(['', 'O objetivo está longe do que você já fez',
        'Sua maior distância é ' + maior + ' km e o objetivo é ' + alvo + ' km. Dá para chegar lá, mas não em um ciclo só. Um alvo intermediário primeiro costuma ser o caminho mais curto — e o que menos machuca.']);
    }
    if(+q.idade >= 55 && q.forca === '0'){
      alertas.push(['', 'Falta o treino de força',
        'Depois dos 55, força duas vezes por semana é o que mais protege a continuidade do plano: previne lesão e melhora a economia de corrida. É o treino com melhor retorno que existe nessa faixa etária.']);
    }
    if(+q.sono > 0 && +q.sono < 6){
      alertas.push(['', 'Sono curto limita a adaptação',
        'Você dorme ' + q.sono + ' h por noite. É durante o sono que o corpo assimila o treino; abaixo de 6 h o ganho do que você treinou fica pela metade.']);
    }

    var linhas = [];
    linhas.push('Dias de treino: <b>' + PERFIL.dias.map(function(d){ return DIAS_N[d-1] }).join(', ') + '</b>');
    linhas.push('Ritmo de limiar: <b>' + mmss(PERFIL.paceLimiar) + '/km</b>' +
      (q.marcaDist && q.marcaTempo
        ? ' — calculado a partir dos seus ' + q.marcaTempo + ' em ' + q.marcaDist + ' km'
        : (q.paceFacil ? ' — estimado pela sua rodagem de ' + q.paceFacil : ' — mantido como estava')));
    linhas.push('FC máxima: <b>' + PERFIL.fcMax + ' bpm</b>' +
      (+q.fcMax > 0 ? ' — a que você informou' : ' — estimada pela idade'));
    if(fator < 0.999){
      var r = calcularFator(q, o ? (o.volBase / fator) : 0);
      linhas.push('Volume do plano: <b>' + Math.round(fator*100) + '% do padrão</b>' +
        (r.motivos.length ? ' — por causa de ' + r.motivos.join(', ') : ''));
    } else {
      linhas.push('Volume do plano: <b>integral</b> — seu histórico comporta o ciclo completo');
    }

    el.innerHTML = '<div class="qz-in">' +
      '<div class="qz-pass">' + BLOCOS.map(function(){ return '<i class="on"></i>' }).join('') + '</div>' +
      '<div class="qz-kick">Pronto</div>' +
      '<h1 class="qz-h">O que mudou no seu plano</h1>' +
      '<p class="qz-sub">Estas respostas passam a valer para todos os treinos que o app montar daqui para frente. Dá para refazer quando quiser, na aba Dados.</p>' +
      '<div class="qz-res">' + linhas.map(function(l){
        return '<div style="padding:7px 0;border-bottom:1px solid var(--line);font-size:13.5px;line-height:1.5">' + l + '</div>';
      }).join('') + '</div>' +
      alertas.map(function(a){
        return '<div class="qz-alerta' + (a[0] ? ' ' + a[0] : '') + '"><b>' + a[1] + '</b>' + a[2] + '</div>';
      }).join('') +
      '<div class="qz-pe"><button class="qz-bt pri" id="qzFim">Ver meus treinos</button></div>' +
      '</div>';
    var f = document.getElementById('qzFim');
    if(f) f.onclick = fecharQuest;
    window.scrollTo(0,0);
  }

  function abrirQuest(){
    var el = document.getElementById('qz');
    if(!el){
      el = document.createElement('div');
      el.id = 'qz';
      document.body.appendChild(el);
    }
    resp = ST.quest ? JSON.parse(JSON.stringify(ST.quest)) : {};
    passo = 0;
    el.classList.add('on');
    document.body.style.overflow = 'hidden';
    desenhar();
  }
  function fecharQuest(){
    var el = document.getElementById('qz');
    if(el) el.classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ---------- guardar junto com o resto do Coach ---------- */
  var lerApp = window.lerCoach;
  if(typeof lerApp === 'function'){
    window.lerCoach = async function(){
      var c = await lerApp.apply(this, arguments);
      if(c && c.quest){ ST.quest = c.quest; try{ aplicarSemRender(c.quest) }catch(e){} }
      return c;
    };
  }
  function aplicarSemRender(q){
    if(+q.idade > 0) PERFIL.idade = +q.idade;
    if(+q.peso  > 0) PERFIL.peso  = +q.peso;
    if(+q.altura> 0) PERFIL.altura= +q.altura;
    if(q.sexo) PERFIL.sexo = q.sexo;
    PERFIL.fcMax = +q.fcMax > 0 ? +q.fcMax : (+q.idade > 0 ? fcMaxEstimada(+q.idade) : PERFIL.fcMax);
    if(Array.isArray(q.dias) && q.dias.length >= 2)
      PERFIL.dias = q.dias.map(Number).sort(function(a,b){ return a-b });
    var lim = null;
    if(q.marcaDist && q.marcaTempo) lim = limiarPorMarca(+q.marcaDist, paraSeg(q.marcaTempo));
    if(lim == null && q.paceFacil)  lim = limiarPorRodagem(paraSeg(q.paceFacil));
    if(lim != null) PERFIL.paceLimiar = trava(lim);
  }

  var salvarApp = window.salvarCoach;
  if(typeof salvarApp === 'function'){
    window.salvarCoach = async function(){
      var r = await salvarApp.apply(this, arguments);
      /* PATCH em vez de PUT: acrescenta o questionario sem reescrever o
         que o app acabou de gravar */
      try{
        if(ST.quest){
          var t = await fbToken();
          if(t) await fetch(FB_DB + '/' + FB_COACH + '.json?auth=' + t,
            { method:'PATCH', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ quest: ST.quest }) });
        }
      }catch(e){ console.warn('quest:', e.message) }
      return r;
    };
  }

  /* ---------- botao na aba Dados ---------- */
  function poeBotao(){
    var alvo = document.querySelector('#v-dados') || document.querySelector('#tab-dados');
    if(!alvo || document.getElementById('btQuest')) return;
    var b = document.createElement('button');
    b.id = 'btQuest';
    b.type = 'button';
    b.textContent = ST.quest ? '📋 Refazer o questionário do corredor'
                             : '📋 Responder o questionário do corredor';
    b.onclick = abrirQuest;
    alvo.appendChild(b);
  }
  poeBotao();
  var irApp = window.irPara;
  if(typeof irApp === 'function'){
    window.irPara = function(v){
      var r = irApp.apply(this, arguments);
      try{ poeBotao() }catch(e){}
      return r;
    };
  }

  window.bqQuest = {
    abrir: abrirQuest,
    respostas: function(){ return ST.quest || null },
    fator: function(){
      var o = (typeof objetivoAtivo === 'function') ? objetivoAtivo() : null;
      return o && o.__fator ? o.__fator : 1;
    },
    limiarPorMarca: limiarPorMarca,
    fcMaxEstimada: fcMaxEstimada
  };

  /* Primeira abertura: se nunca houve questionario e o usuario nao
     pediu para deixar para depois, a tela aparece sozinha. */
  var adiado = false;
  try{ adiado = localStorage.getItem('quest_adiado') === '1' }catch(e){}
  setTimeout(function(){
    if(!ST.quest && !adiado) abrirQuest();
  }, 1800);
});



/* ═══════ 24. AS SEIS ETAPAS DA SESSAO (estrutura do Tiago Mecabo) ═══════

   1. Pre-aquecimento      2. Alongamentos dinamicos    3. Educativos
   4. Parte principal      5. Desaquecimento            6. Alongamento

   O app ja fazia quatro delas: aquecimento, parte principal,
   desaquecimento e mobilidade no fim. Faltavam os alongamentos
   dinamicos como etapa propria e os educativos, que so apareciam no
   intervalado e no fartlek. Agora as seis entram em TODO treino de
   corrida, na ordem.

   POR QUE A ORDEM E ESSA, e nao um detalhe de gosto:

   - O alongamento estatico ANTES de correr reduz a producao de forca
     por algumas dezenas de minutos. Por isso, no comeco, so movimento
     (dinamico); o estatico vai para o fim, quando o musculo ja esta
     quente e o objetivo passa a ser amplitude, nao desempenho.

   - Os educativos vem DEPOIS do dinamico e ANTES do principal porque
     eles nao sao aquecimento: sao tecnica. Feitos com o corpo frio nao
     ensinam nada, e feitos cansados ensinam o gesto errado.

   - O desaquecimento existe para a frequencia cardiaca cair devagar.
     Parar de vez depois de treino forte e o que mais causa aquela
     tontura no fim.

   DURACAO: a sessao passa a durar cerca de 11 minutos a mais. A parte
   principal nao encolheu — o volume da semana continua o mesmo.

   VIDEOS: cada etapa leva a uma BUSCA dentro do canal do Tiago Mecabo,
   nao a um video fixo. Endereco de video sai do ar; busca dentro do
   canal, nao. E sempre traz o material mais recente dele sobre aquilo.
   ══════════════════════════════════════════════════════════════════ */

PARTE('seis etapas da sessao', function(){
  if(typeof window.etapas !== 'function') throw new Error('app sem etapas()');

  /* O guia mora ao lado do app, na mesma pasta, e traz o passo a passo
     de cada movimento: como fazer, erros comuns e um video de
     demonstracao por exercicio. Antes estes botoes abriam o canal do
     Tiago Mecabo, o que levava a uma pagina de canal e nao ao
     exercicio — sem serventia na hora de aquecer. */
  var GUIA = './guia-aquecimento.html';
  var VIDEOS = [
    ['1 · Pré-aquecimento',        'pre'],
    ['2 · Alongamentos dinâmicos', 'dinamicos'],
    ['3 · Educativos',             'educativos'],
    ['5 · Desaquecimento',         'desaquecimento'],
    ['6 · Alongamento',            'alongamento']
  ];

  var css = document.createElement('style');
  css.textContent = [
'.seisv{margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}',
'.seisv .cab{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;',
'  color:var(--tx3);margin-bottom:9px}',
'.seisv .lks{display:flex;flex-wrap:wrap;gap:7px}',
'.seisv a{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;',
'  background:var(--s2);border:1px solid var(--line);color:var(--tx2);',
'  font-size:12.5px;font-weight:600;text-decoration:none}',
'.seisv a:hover{color:var(--tx);border-color:var(--tx3)}',
'.seisv a i{font-style:normal;color:#FF3B30;font-size:11px}',
'.seisv .nota{margin:10px 0 0;font-size:11.5px;color:var(--tx3);line-height:1.5}'
  ].join('\n');
  document.head.appendChild(css);

  var CHAVES = /^(Aquecimento|Educativos|Desaquecimento|Mobilidade|Alongamento|Pré-aquecimento|Alongamentos dinâmicos)$/;
  var FORTE  = ['intervalado','fartlek','limiar','subidas','sprint','longo','longo2','prova'];

  var etapasApp = window.etapas;
  window.etapas = function(foco, mod, p){
    var orig = etapasApp.apply(this, arguments);
    if(mod !== 'corrida' || !Array.isArray(orig)) return orig;

    var pesado = FORTE.indexOf(foco) >= 0;
    var mPre = pesado ? 10 : 8;
    var mDes = pesado ? 8 : 5;

    /* tudo que nao for aquecimento, educativo, desaquecimento ou
       mobilidade e conteudo de verdade da sessao — fica no meio */
    var nucleo = orig.filter(function(e){ return !CHAVES.test(e.t) });

    var zonaRec = [];
    try { zonaRec = [{t:pr('rec'), c:'z'}, {t:fcr('rec'), c:'hr'}] } catch(e){ zonaRec = [] }

    var seis = [
      E('1 · Pré-aquecimento',
        mPre + ' minutos subindo devagar: comece caminhando rápido por 3 minutos e passe a trote muito leve. ' +
        'O objetivo é só um — aquecer o músculo de verdade. Se você chegar ofegante ao fim disto, foi rápido demais.',
        zonaRec.concat([{t: mPre + ' min'}])),

      E('2 · Alongamentos dinâmicos',
        '5 minutos, tudo em movimento, sem segurar em nenhuma posição. Dez repetições de cada: balanço de perna para frente e para trás, ' +
        'balanço lateral, círculo de quadril, agachamento livre, afundo com rotação de tronco e elevação de joelho andando. ' +
        'Alongamento parado fica para o fim — feito agora, ele reduz a força que você vai precisar daqui a pouco.',
        [{t:'5 min'}]),

      E('3 · Educativos',
        '4 séries de 20 segundos, caminhando 40 segundos entre elas: skipping alto, anfersen, dribles baixos e passada saltada. ' +
        'Isto não é aquecimento, é técnica: postura, cadência e coordenação. Faça com atenção no gesto, não na velocidade.',
        [{t:'≈4 min'}])
    ];

    seis = seis.concat(nucleo);

    seis.push(E('5 · Desaquecimento',
      mDes + ' minutos de trote muito leve até a respiração normalizar. ' +
      'Parar de vez depois de treino forte é o que causa aquela tontura — o sangue fica represado na perna.',
      zonaRec.concat([{t: mDes + ' min'}])));

    seis.push(E('6 · Alongamento',
      '5 minutos, agora sim parado e segurando 30 segundos em cada: panturrilha, posterior de coxa, quadríceps, ' +
      'flexor do quadril e glúteo. Sem forçar até doer — a sensação é de tensão, nunca de dor.',
      [{t:'5 min'}]));

    /* So o primeiro item da parte principal leva o numero 4. Quando o
       treino tem varios blocos (o longo tem tres), repetir "4 ·" em
       todos deixa a lista poluida e da a impressao de erro. */
    if(nucleo.length && !/^\d+ · /.test(seis[3].t)) seis[3].t = '4 · ' + seis[3].t;
    return seis;
  };

  /* A sessao ficou ~11 min mais longa: 3 do pre-aquecimento a mais que
     o aquecimento antigo, 5 do dinamico e 4 dos educativos, menos o que
     ja estava contado. O volume em km nao muda. */
  var sessaoApp = window.montarSessao;
  if(typeof sessaoApp === 'function'){
    window.montarSessao = function(k, o, r, F, semAte, semanas){
      var s = sessaoApp.apply(this, arguments);
      if(s && s.mod === 'corrida' && typeof s.min === 'number'){
        s.min = s.min + 11;
        s.__seisEtapas = true;
      }
      return s;
    };
  }

  /* barra de videos, abaixo das etapas do dia */
  function poeVideos(){
    var el = document.querySelector('#sess');
    if(!el) return;
    var velho = el.querySelector('.seisv');
    var s = (typeof sessaoDe === 'function') ? sessaoDe(ST.sel) : null;
    if(!s || s.mod !== 'corrida'){ if(velho) velho.remove(); return }
    if(velho) return;

    var box = document.createElement('div');
    box.className = 'seisv';
    box.innerHTML =
      '<div class="cab">Como fazer cada etapa</div>' +
      '<div class="lks">' + VIDEOS.map(function(v){
        return '<a href="' + GUIA + '#' + v[1] + '" target="_blank" rel="noopener">' +
               '<i>▶</i>' + v[0] + '</a>';
      }).join('') + '</div>' +
      '<p class="nota">Cada botão abre o guia direto na etapa: passo a passo de cada movimento, ' +
      'os erros que mais aparecem e um vídeo de demonstração por exercício.</p>';

    var acts = el.querySelector('.acts');
    if(acts) acts.parentNode.insertBefore(box, acts);
    else el.appendChild(box);
  }

  var diaApp = window.renderDia;
  if(typeof diaApp === 'function'){
    window.renderDia = function(){
      var r = diaApp.apply(this, arguments);
      try{ poeVideos() }catch(e){ console.warn('videos:', e.message) }
      return r;
    };
  }

  /* o cache guarda as etapas antigas; limpar faz as seis aparecerem ja */
  if(ST && ST.cache) ST.cache = {};
  if(typeof renderCoach === 'function'){ try{ renderCoach() }catch(e){} }

  window.bqSeis = {
    guias: VIDEOS.map(function(v){ return v[0] + ' -> ' + GUIA + '#' + v[1] }),
    etapasDe: function(foco){
      return window.etapas(foco || 'facil', 'corrida', {km:8, reps:6, dist:800, rec:'2 min'})
        .map(function(e){ return e.t });
    }
  };
});



/* ═══════════════ 25. ABA KPI — EVOLUCAO ATE A PROVA ═══════════════

   Uma aba propria na barra de baixo, com seis indicadores medidos
   semana a semana desde o inicio do ciclo. A analise que ja existia
   responde "como foi o treino de hoje"; esta tela responde
   "estou melhorando?".

   SOBRE OS GRAFICOS (segunda versao)
   A primeira tentativa era barra simples e nao dizia nada: voce via um
   numero por semana sem saber se aquilo era bom, e sem enxergar para
   onde a coisa ia. O que mudou:

   - Todo grafico com valor planejado mostra o planejado como barra
     FANTASMA atras e o realizado como barra solida na frente. Num
     relance da para ver o buraco, sem precisar comparar numeros.
   - As linhas ganharam area preenchida em degrade e RETA DE TENDENCIA,
     por minimos quadrados. A reta e o que responde "para onde vai".
   - O ultimo ponto de cada linha leva um balao com o valor.
   - Na previsao, a area pintada entre a sua linha e a linha do alvo E o
     indicador: quanto menor a mancha, mais perto voce esta de 3:50.
   - O risco virou faixa com agulha, em vez de numero solto.

   OS SEIS INDICADORES, E POR QUE CADA UM

   1. ADERENCIA   quanto do plano voce cumpriu, em km. De todos os
                  numeros, e o que melhor prevê resultado em prova longa.
   2. VOLUME      km realizados contra planejados, semana a semana.
   3. LONGAO      o maior treino de cada semana ate o pico do ciclo.
                  Numa maratona, e o treino que decide.
   4. PREVISAO    o melhor esforco das seis semanas anteriores projetado
                  para 42,195 km por Riegel (T2 = T1 x (D2/D1)^1,06).
   5. EFICIENCIA  metros por minuto por batimento, nas rodagens leves.
                  Subir essa linha e a definicao de evoluir: mesmo
                  esforco do coracao, mais velocidade.
   6. RISCO       carga dos ultimos 7 dias sobre a media de 28. Acima de
                  1,5 a literatura associa a mais lesao.

   TUDO SO LEITURA: nada aqui grava, altera plano ou toca no Firebase.
   ══════════════════════════════════════════════════════════════════ */

PARTE('aba kpi', function(){
  if(typeof ST !== 'object' || typeof irPara !== 'function') throw new Error('app sem ST/irPara');

  var ALVO_SEG = 327;                     /* 5:27/km, alvo de 3:50 */
  var W = 340, H = 172, ML = 34, MR = 14, MT = 20, MB = 26;
  var IW = W - ML - MR, IH = H - MT - MB;
  var uid = 0;

  var css = document.createElement('style');
  css.textContent = [
'#v-kpi{padding-bottom:30px}',
'#v-kpi .kcard{background:var(--s1);border:1px solid var(--line);border-radius:18px;padding:17px 16px 14px;margin-bottom:12px}',
'#v-kpi .kcab{display:flex;align-items:center;gap:8px;margin-bottom:9px}',
'#v-kpi .bqTssAtalhos{display:flex;gap:6px;margin:10px 0 2px}',
'#v-kpi .bqTssPer{flex:1;padding:7px 0;border-radius:9px;border:1px solid var(--line);',
'  background:var(--s2);color:var(--tx3);font:inherit;font-size:12px;font-weight:700;cursor:pointer}',
'#v-kpi .bqTssPer.on{background:var(--acc);border-color:var(--acc);color:#0b0f14}',
'#v-kpi .kcab h3{margin:0;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--tx3);flex:1}',
'#v-kpi .delta{font-size:11px;font-weight:800;padding:3px 8px;border-radius:999px;white-space:nowrap}',
'#v-kpi .delta.up{background:rgba(63,217,138,.16);color:var(--ok)}',
'#v-kpi .delta.dn{background:rgba(242,104,92,.16);color:var(--bad)}',
'#v-kpi .delta.fl{background:var(--s3);color:var(--tx2)}',
'#v-kpi .kbig{font-size:33px;font-weight:800;letter-spacing:-.035em;line-height:1;margin:0 0 5px;font-variant-numeric:tabular-nums}',
'#v-kpi .kbig small{display:block;font-size:12.5px;font-weight:500;color:var(--tx2);margin-top:6px;letter-spacing:0;line-height:1.45}',
'#v-kpi .ksub{font-size:12.5px;color:var(--tx2);line-height:1.55;margin:9px 0 0}',
'#v-kpi .ksub b{color:var(--tx);font-weight:700}',
'#v-kpi svg{display:block;width:100%;height:auto;margin-top:12px;overflow:visible}',
'#v-kpi .leg{display:flex;flex-wrap:wrap;gap:12px;margin-top:9px}',
'#v-kpi .leg span{display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--tx3);font-weight:600}',
'#v-kpi .leg i{width:11px;height:8px;border-radius:2px;display:block}',
'#v-kpi .leg i.gh{border:1px dashed var(--tx3);background:transparent}',
'#v-kpi .leg i.ln{height:2px;border-radius:1px}',
'#v-kpi .kfoot{margin:11px 0 0;padding-top:9px;border-top:1px solid var(--line);',
'  font-size:11.5px;color:var(--tx3);line-height:1.55}',
'#v-kpi .khero{position:relative;overflow:hidden;background:var(--s1);',
'  border:1px solid var(--line);border-radius:20px;padding:20px 18px;margin-bottom:14px}',
'#v-kpi .khero::after{content:"";position:absolute;inset:0;',
'  background:radial-gradient(120% 100% at 100% 0%,var(--acc-wash),transparent 60%);pointer-events:none}',
'#v-kpi .khero .d{font-size:46px;font-weight:800;letter-spacing:-.04em;line-height:.95;font-variant-numeric:tabular-nums}',
'#v-kpi .khero .t{font-size:13px;color:var(--tx2);margin-top:7px}',
'#v-kpi .khero .t b{color:var(--tx)}',
'#v-kpi .kbar{display:flex;gap:3px;margin-top:13px;position:relative;z-index:1}',
'#v-kpi .kbar i{flex:1;height:5px;border-radius:3px;background:var(--s3)}',
'#v-kpi .kbar i.on{background:var(--acc)}',
'#v-kpi .kbar i.hoje{background:var(--tx)}',
'#v-kpi .vazio{padding:30px 6px;text-align:center;color:var(--tx3);font-size:13px;line-height:1.6}'
  ].join('\n');
  document.head.appendChild(css);

  /* ═══════ desenho ═══════ */

  function grade(max, min, fmtY){
    var s = '', n = 4;
    for(var i = 0; i <= n; i++){
      var v = min + (max - min) * i / n;
      var y = MT + IH - ((v - min) / ((max - min) || 1)) * IH;
      s += '<line x1="' + ML + '" x2="' + (W - MR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) +
           '" stroke="var(--line)" stroke-width="1" stroke-dasharray="1 4" opacity=".8"/>';
      if(fmtY) s += '<text x="' + (ML - 6) + '" y="' + (y + 3.2).toFixed(1) +
           '" text-anchor="end" font-size="8.5" fill="var(--tx3)">' + fmtY(v) + '</text>';
    }
    return s;
  }
  /* Rotulo da semana pela DATA da segunda-feira.
     O eixo dizia S1, S2, S3... contando da semana mais antiga desta
     aba — numeracao diferente da do card do ciclo, onde S1 e a semana
     passada. Dois "S3" com significados diferentes na mesma tela e o
     que tornava este grafico impossivel de ler. Data nao tem esse
     problema: 10/08 e 10/08 em qualquer tela. */
  function rotSem(lista){
    return function(i){
      var w = lista[i];
      if(!w || !w.ini) return '';
      var d = dt(w.ini);
      return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
    };
  }

  function eixoX(n, rotulo){
    var s = '', passo = IW / Math.max(1, n), salto = n > 9 ? 2 : 1;
    for(var i = 0; i < n; i++){
      if(i % salto) continue;
      s += '<text x="' + (ML + passo*i + passo/2).toFixed(1) + '" y="' + (H - MB + 14) +
           '" text-anchor="middle" font-size="8.5" fill="var(--tx3)">' + rotulo(i) + '</text>';
    }
    return s;
  }
  /* barra com o topo arredondado */
  function barra(x, larg, alt, cor, op){
    if(alt <= 0.5) return '';
    var r = Math.min(larg/2, 4), y = MT + IH - alt;
    return '<path d="M' + (x-larg/2) + ',' + (MT+IH) + ' V' + (y+r) +
           ' a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) +
           ' h' + (larg-2*r) + ' a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
           ' V' + (MT+IH) + ' Z" fill="' + cor + '"' + (op ? ' opacity="'+op+'"' : '') + '/>';
  }
  /* barra fantasma: contorno tracejado do que era para ter sido feito */
  function fantasma(x, larg, alt){
    if(alt <= 0.5) return '';
    var y = MT + IH - alt;
    return '<rect x="' + (x-larg/2) + '" y="' + y.toFixed(1) + '" width="' + larg + '" height="' + alt.toFixed(1) +
           '" rx="4" fill="none" stroke="var(--tx3)" stroke-width="1" stroke-dasharray="2 2.5" opacity=".65"/>';
  }
  function paresDeBarras(reais, planos, max, cor){
    var s = '', passo = IW / Math.max(1, reais.length);
    var larg = Math.max(6, Math.min(24, passo * 0.66));
    for(var i = 0; i < reais.length; i++){
      var x = ML + passo*i + passo/2;
      if(planos && planos[i] > 0) s += fantasma(x, larg, (planos[i]/(max||1))*IH);
      var c = typeof cor === 'function' ? cor(reais[i], i) : cor;
      s += barra(x, larg, (reais[i]/(max||1))*IH, c);
    }
    return s;
  }
  function pontos(vals, min, max){
    var p = [], passo = IW / Math.max(1, vals.length);
    vals.forEach(function(v,i){
      if(v == null || !isFinite(v)) return;
      p.push([ML + passo*i + passo/2, MT + IH - ((v-min)/((max-min)||1))*IH, v, i]);
    });
    return p;
  }
  function area(p, cor){
    if(p.length < 2) return '';
    var id = 'kg' + (++uid);
    var d = p.map(function(q,i){ return (i?'L':'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1) }).join(' ');
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0%" stop-color="' + cor + '" stop-opacity=".30"/>' +
           '<stop offset="100%" stop-color="' + cor + '" stop-opacity="0"/></linearGradient></defs>' +
           '<path d="' + d + ' L' + p[p.length-1][0].toFixed(1) + ',' + (MT+IH) +
           ' L' + p[0][0].toFixed(1) + ',' + (MT+IH) + ' Z" fill="url(#' + id + ')"/>';
  }
  function curva(p, cor, largura){
    if(!p.length) return '';
    if(p.length === 1) return '<circle cx="' + p[0][0].toFixed(1) + '" cy="' + p[0][1].toFixed(1) + '" r="3.4" fill="' + cor + '"/>';
    var d = p.map(function(q,i){ return (i?'L':'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1) }).join(' ');
    return '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="' + (largura||2.4) +
           '" stroke-linecap="round" stroke-linejoin="round"/>' +
           p.map(function(q,i){
             var ult = i === p.length-1;
             return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (ult?4:2.6) +
                    '" fill="' + (ult ? cor : 'var(--bg)') + '" stroke="' + cor + '" stroke-width="1.8"/>';
           }).join('');
  }
  /* reta de tendencia por minimos quadrados — responde "para onde vai" */
  function tendencia(vals, min, max, cor){
    var xs = [], ys = [];
    vals.forEach(function(v,i){ if(v != null && isFinite(v)){ xs.push(i); ys.push(v) } });
    if(xs.length < 3) return {svg:'', incl:0};
    var n = xs.length, sx = 0, sy = 0, sxy = 0, sxx = 0;
    for(var i = 0; i < n; i++){ sx += xs[i]; sy += ys[i]; sxy += xs[i]*ys[i]; sxx += xs[i]*xs[i] }
    var den = n*sxx - sx*sx;
    if(!den) return {svg:'', incl:0};
    var a = (n*sxy - sx*sy)/den, b = (sy - a*sx)/n;
    var passo = IW / Math.max(1, vals.length);
    var xy = function(i){
      var v = a*i + b;
      return [ML + passo*i + passo/2, MT + IH - ((v-min)/((max-min)||1))*IH];
    };
    var p0 = xy(xs[0]), p1 = xy(xs[n-1]);
    return { incl: a,
      svg: '<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) +
           '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) +
           '" stroke="' + cor + '" stroke-width="1.6" stroke-dasharray="4 4" opacity=".85"/>' };
  }
  function refLinha(v, min, max, cor, txt){
    var y = MT + IH - ((v-min)/((max-min)||1))*IH;
    if(y < MT-4 || y > MT+IH+4) return '';
    return '<line x1="' + ML + '" x2="' + (W-MR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) +
           '" stroke="' + cor + '" stroke-width="1.5" stroke-dasharray="5 4" opacity=".8"/>' +
           '<text x="' + (W-MR) + '" y="' + (y-5).toFixed(1) + '" text-anchor="end" font-size="8.5" ' +
           'font-weight="700" fill="' + cor + '">' + txt + '</text>';
  }
  /* balao com o valor no ultimo ponto */
  function balao(p, txt, cor){
    if(!p.length) return '';
    var q = p[p.length-1], larg = txt.length*5.6 + 12;
    var x = Math.min(q[0] + 8, W - MR - larg), y = Math.max(MT + 8, q[1] - 4);
    return '<rect x="' + x.toFixed(1) + '" y="' + (y-10).toFixed(1) + '" width="' + larg.toFixed(1) +
           '" height="16" rx="8" fill="' + cor + '"/>' +
           '<text x="' + (x + larg/2).toFixed(1) + '" y="' + (y+1.5).toFixed(1) +
           '" text-anchor="middle" font-size="9.5" font-weight="800" fill="var(--bg)">' + txt + '</text>';
  }
  /* area pintada entre duas linhas — a mancha e o proprio indicador */
  function entre(pA, valB, min, max, cor){
    if(pA.length < 2) return '';
    var yB = MT + IH - ((valB-min)/((max-min)||1))*IH;
    var id = 'ke' + (++uid);
    var d = pA.map(function(q,i){ return (i?'L':'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1) }).join(' ');
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0%" stop-color="' + cor + '" stop-opacity=".26"/>' +
           '<stop offset="100%" stop-color="' + cor + '" stop-opacity=".05"/></linearGradient></defs>' +
           '<path d="' + d + ' L' + pA[pA.length-1][0].toFixed(1) + ',' + yB.toFixed(1) +
           ' L' + pA[0][0].toFixed(1) + ',' + yB.toFixed(1) + ' Z" fill="url(#' + id + ')"/>';
  }
  function svgBox(inner){ return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' + inner + '</svg>' }
  function legenda(itens){
    return '<div class="leg">' + itens.map(function(it){
      return '<span><i class="' + (it[2]||'') + '" style="' + (it[1] ? 'background:'+it[1] : '') + '"></i>' + it[0] + '</span>';
    }).join('') + '</div>';
  }
  function chip(v, sufixo, invertido){
    if(v == null || !isFinite(v)) return '';
    var bom = invertido ? v < 0 : v > 0;
    var cls = Math.abs(v) < 0.5 ? 'fl' : (bom ? 'up' : 'dn');
    var sinal = v > 0 ? '+' : '';
    return '<span class="delta ' + cls + '">' + sinal + v.toFixed(v % 1 ? 1 : 0) + (sufixo||'') + '</span>';
  }

  /* ═══════ contas ═══════ */
  function hm(seg){
    seg = Math.round(seg);
    return Math.floor(seg/3600) + ':' + String(Math.floor((seg%3600)/60)).padStart(2,'0');
  }
  function dataDe(r){ return iso(addD(HOJE, -r.d)) }
  function segunda(d){ var x = new Date(d); return addD(x, -(dow(x)-1)) }
  function corridas(){
    return (ST.runs || []).filter(function(r){
      return !r.walk && (r.mod || 'corrida') === 'corrida' && r.km > 0;
    });
  }

  function semanas(){
    var o = (typeof objetivoAtivo === 'function') ? objetivoAtivo() : null;
    if(!o || !o.data) return null;
    var chaves = Object.keys(ST.plano || {}).sort();
    var runs = corridas();

    /* O comeco do ciclo NAO pode vir do plano: desde que o plano passou
       a ter 14 dias, ele so conheceria as duas ultimas semanas e todo o
       historico do KPI sumia — uma barra so na aderencia. O ciclo comeca
       na mais antiga entre a primeira corrida registrada, a primeira
       semana do historico de blocos e a primeira data do plano. */
    var cands = [];
    if(chaves.length) cands.push(chaves[0]);
    Object.keys(ST.hist || {}).forEach(function(k){ cands.push(k) });
    runs.forEach(function(r){ cands.push(iso(addD(HOJE, -r.d))) });
    if(!cands.length) return null;
    cands.sort();
    /* nao mostro mais que 20 semanas de historico: passa disso vira ruido */
    var maisAntiga = cands[0];
    var limite = iso(addD(HOJE, -84));   /* 12 semanas: alem disso vira ruido */
    if(maisAntiga < limite) maisAntiga = limite;

    var ini = segunda(dt(maisAntiga)), fimProva = dt(o.data);
    var sems = [], n = 0;

    for(var d = new Date(ini); d <= fimProva && n < 40; d = addD(d, 7)){
      n++;
      var a = iso(d), b = iso(addD(d, 6));
      var plan = 0, planN = 0, longoPlan = 0;
      chaves.forEach(function(k){
        if(k < a || k > b) return;
        var s = ST.plano[k];
        if(!s || s.mod !== 'corrida' || s.prova) return;
        plan += (+s.km || 0); planN++;
        if((+s.km || 0) > longoPlan) longoPlan = +s.km;
      });
      /* semana fora da janela do plano: o planejado vem do registro que
         o bloco deixou quando a compos */
      if(!plan && ST.hist && ST.hist[a]){
        plan = +ST.hist[a].planKm || 0;
        longoPlan = +ST.hist[a].longoPlan || 0;
      }
      var feito = 0, feitoN = 0, longoFeito = 0, efs = [];
      runs.forEach(function(r){
        var k = dataDe(r);
        if(k < a || k > b) return;
        feito += r.km; feitoN++;
        if(r.km > longoFeito) longoFeito = r.km;
        if(r.fc > 60 && r.pace > PERFIL.paceLimiar + 20 && r.pace < 700)
          efs.push((60000 / r.pace) / r.fc);
      });
      sems.push({ n:n, ini:a, fim:b, futura: a > iso(HOJE),
        planKm:+plan.toFixed(1), planN:planN, longoPlan:+longoPlan.toFixed(1),
        feitoKm:+feito.toFixed(1), feitoN:feitoN, longoFeito:+longoFeito.toFixed(1),
        ef: efs.length ? +(efs.reduce(function(s,v){return s+v},0)/efs.length).toFixed(2) : null });
    }
    /* Semanas do fim sem plano nem treino nao dizem nada e esticam todos
       os graficos. Acontece quando o plano acaba antes da data da prova. */
    while(sems.length && sems[sems.length-1].planKm === 0 && sems[sems.length-1].feitoKm === 0) sems.pop();
    return { sems:sems, o:o, prova:o.data };
  }

  function previsoes(sems){
    var runs = corridas();
    return sems.map(function(w){
      if(w.futura) return null;
      var fim = w.fim, ini = iso(addD(dt(w.fim), -42)), melhor = null;
      runs.forEach(function(r){
        var k = dataDe(r);
        if(k < ini || k > fim) return;
        /* Corridas de 8 km ou mais, num ritmo que ainda e esforco.
           O teto era limiar + 45 s/km, o mesmo da analise — mas ali ele
           serve para uma projecao pontual, e aqui deixava semanas
           inteiras sem numero. Com limiar + 75 quase toda semana tem
           valor, e como o grafico usa sempre o MELHOR esforco da janela,
           uma rodagem lenta nao puxa a linha para baixo. */
        if(r.km < 8 || !(r.pace > 200) || r.pace > PERFIL.paceLimiar + 75) return;
        var proj = (r.km * r.pace) * Math.pow(42.195 / r.km, 1.06);
        if(melhor == null || proj < melhor) melhor = proj;
      });
      return melhor;
    });
  }

  function risco(){
    var a7 = 0, a28 = 0;
    corridas().forEach(function(r){
      if(r.d < 7) a7 += r.km;
      if(r.d < 28) a28 += r.km;
    });
    var cron = a28 / 4;
    return { agudo:+a7.toFixed(1), cronico:+cron.toFixed(1),
             razao: cron > 0 ? +(a7/cron).toFixed(2) : null };
  }

  /* ═══════ a tela ═══════ */
  function render(){
    var el = document.getElementById('v-kpi');
    if(!el) return;
    uid = 0;
    var dados = semanas();
    if(!dados){
      el.innerHTML = '<div class="vazio">Escolha um objetivo na aba Coach<br>para o KPI ter o que medir.</div>';
      return;
    }
    var sems = dados.sems, o = dados.o;
    var passadas = sems.filter(function(w){ return !w.futura });
    var dias = diff(iso(HOJE), dados.prova);
    var atual = passadas.length;
    var h = '';

    /* Semanas ate a prova, nao semanas do plano.
       Depois que o plano passou a ter so 14 dias, este contador dizia
       "semana 2 de 3" — contava o bloco, nao a preparacao. Agora conta o
       que falta para 18/10, que e o numero que interessa. */
    var semRestam = Math.max(0, Math.ceil(dias / 7));

    /* ── cabeçalho ── */
    h += '<div class="khero"><div class="d">' + Math.max(0, dias) + ' dias</div>' +
      '<div class="t">para ' + (o.nome || o.n) + ' · faltam <b>' +
        semRestam + '</b> ' + (semRestam === 1 ? 'semana' : 'semanas') + '</div>' +
      '<div class="kbar">' + (function(){
        /* uma marca por semana ate a prova; as que ja passaram ficam acesas */
        var total = semRestam + passadas.length, out = '';
        for(var i = 0; i < Math.min(total, 26); i++)
          out += '<i class="' + (i < passadas.length - 1 ? 'on' :
                 (i === passadas.length - 1 ? 'hoje' : '')) + '"></i>';
        return out;
      })() + '</div></div>';

    if(!passadas.length){
      el.innerHTML = h + '<div class="vazio">O ciclo ainda não começou.<br>Os indicadores aparecem na primeira semana de treino.</div>';
      return;
    }

    /* ── 1. aderência ── */
    /* semanas sem planejado registrado ficam de fora da aderencia — nao
       da para cobrar cumprimento de um plano que nunca existiu */
    /* A SEMANA EM CURSO NAO ENTRA NA ADERENCIA.
       Ela aparecia aqui como se estivesse terminada: o plano da semana
       inteira no denominador, e so os dias ja corridos no numerador.
       Uma terca-feira virava "fracasso". Volume e um FATO e continua
       mostrando a semana em curso; aderencia e um JULGAMENTO, e so
       julga o que acabou. */
    var fechadas = passadas.filter(function(w){ return w.fim < iso(HOJE) });
    var comPlano = fechadas.filter(function(w){ return w.planKm > 0 });
    var totPlan = comPlano.reduce(function(s,w){ return s+w.planKm }, 0);
    var totFeito = comPlano.reduce(function(s,w){ return s+w.feitoKm }, 0);
    var ader = totPlan > 0 ? totFeito/totPlan*100 : 0;
    var perSem = comPlano.map(function(w){ return w.planKm > 0 ? +(w.feitoKm/w.planKm*100).toFixed(0) : 0 });
    var seq = 0;
    for(var i = perSem.length-1; i >= 0; i--){ if(perSem[i] >= 85) seq++; else break }
    var corA = function(v){ return v >= 85 ? 'var(--ok)' : v >= 65 ? 'var(--warn)' : 'var(--bad)' };
    var maxA = Math.max(115, Math.max.apply(null, perSem.concat([100])));
    var d4 = perSem.length >= 5 ? perSem[perSem.length-1] - perSem[perSem.length-5] : null;

    /* O cartao "Aderencia ao plano" saiu em 26/08/2026.
       Ele comparava o que voce correu contra o que o coach do app tinha
       planejado. Sem plano de corrida no app — quem monta agora e o
       treinador humano, no Garmin — o denominador nao existe, e uma
       porcentagem sem denominador e so um numero bonito.             */

    /* ── 2. volume ── */
    var vFeito = passadas.map(function(w){ return w.feitoKm });
    /* sem barra de planejado: o plano de corrida saiu do app */
    var maxV = Math.max.apply(null, vFeito.concat([10])) * 1.12;
    var ult = passadas[passadas.length-1];
    var tV = tendencia(vFeito, 0, maxV, 'var(--run)');
    var dV = vFeito.length >= 5 ? vFeito[vFeito.length-1] - vFeito[vFeito.length-5] : null;

    h += '<div class="kcard"><div class="kcab"><h3>Volume semanal</h3>' + chip(dV, ' km vs 4 semanas atrás') + '</div>' +
      '<div class="kbig">' + ult.feitoKm.toFixed(0) + '<small>km nesta semana · a linha tracejada é a tendência</small></div>' +
      svgBox(grade(maxV, 0, function(v){ return v.toFixed(0) }) +
        paresDeBarras(vFeito, null, maxV, 'var(--run)') +
        tV.svg +
        eixoX(vFeito.length, rotSem(passadas))) +
      legenda([['realizado','var(--run)'],['tendência','var(--run)','ln']]) +
      '<p class="ksub">' + (tV.incl > 0.5 ? 'Seu volume vem <b>subindo</b>.'
        : tV.incl < -0.5 ? 'Seu volume vem <b>caindo</b>.'
        : 'Volume <b>estável</b>.') + '</p></div>';

    /* ── 2b. TSS por treino ──
       Como o TrainingPeaks calcula (rTSS):

           IF  = pace de limiar / pace do treino
           TSS = (segundos x IF²) / 3600 x 100

       Uma hora exata no pace de limiar da 100 por definicao. Mais lento
       da menos, mais rapido da mais, e o quadrado faz a intensidade
       pesar mais que a duracao.

       UMA DIFERENCA HONESTA: o TrainingPeaks usa Normalized Graded Pace,
       que corrige o pace pela subida. Aqui so existe o pace medio da
       atividade — o sync nao guarda altimetria por trecho. Em treino de
       ladeira o numero sai abaixo do deles. Esta escrito na tela.

       A LINHA DE REFERENCIA nao e um alvo: e a sua propria mediana das
       ultimas 8 semanas. Serve para ver o treino de hoje contra o seu
       normal, que foi o que voce pediu.                              */
    var LIMIAR = (typeof PERFIL === 'object' && PERFIL && +PERFIL.paceLimiar) || 340;

    function tssDe(r){
      if(!r || r.mod !== 'corrida') return null;
      var pace = +r.pace || 0, dur = +r.dur || 0;
      if(pace <= 0 || dur <= 0) return null;
      var iF = LIMIAR / pace;                       // >1 = mais rapido que o limiar
      if(iF > 1.6 || iF < 0.35) return null;        // pace absurdo: dado ruim
      return Math.round(dur * iF * iF / 3600 * 100);
    }

    /* A janela e a mesma que voce escolhe nas outras abas (ST.periodo).
       Fixo em 8 semanas ficava um amontoado de barras finas.        */
    var janela = (typeof ST === 'object' && ST && +ST.periodo) || 30;
    var corridas = (ST.runs || []).filter(function(r){ return r.mod === 'corrida' && r.d <= janela });
    var pontosTss = corridas.map(function(r){
      return { d: +r.d, tss: tssDe(r), titulo: r.titulo || '' };
    }).filter(function(x){ return x.tss !== null })
      .sort(function(a,b){ return b.d - a.d });      // antigo -> recente

    if(pontosTss.length >= 3){
      var vals = pontosTss.map(function(x){ return x.tss });
      var ordenados = vals.slice().sort(function(a,b){ return a-b });
      var mediana = ordenados.length % 2
        ? ordenados[(ordenados.length-1)/2]
        : Math.round((ordenados[ordenados.length/2 - 1] + ordenados[ordenados.length/2]) / 2);
      var maxT = Math.max.apply(null, vals.concat([mediana])) * 1.15;
      var ultimo = pontosTss[pontosTss.length - 1];
      var dif = ultimo.tss - mediana;
      var pct = mediana > 0 ? Math.round(dif / mediana * 100) : 0;

      var corT = function(v){
        return v >= mediana * 1.5 ? 'var(--bad)'
             : v >= mediana * 1.15 ? 'var(--warn)'
             : 'var(--run)';
      };

      /* Atalhos de intervalo, no mesmo padrao das outras abas. Mudam
         ST.periodo — a mesma variavel que Treinos, Indices, Evolucao e
         Saude usam — entao a escolha vale para o app inteiro.        */
      var ATALHOS_TSS = [7, 30, 90, 180];
      var botoes = ATALHOS_TSS.map(function(v){
        return '<button class="bqTssPer' + (janela === v ? ' on' : '') + '" data-tssper="' + v + '">'
             + v + 'd</button>';
      }).join('');

      h += '<div class="kcard"><div class="kcab"><h3>TSS por treino</h3>'
        + chip(dif, ' vs sua mediana') + '</div>'
        + '<div class="kbig" style="color:' + corT(ultimo.tss) + '">' + ultimo.tss
        + '<small>no último treino · sua mediana em ' + janela + ' dias é ' + mediana
        + (pct ? ' · ' + (pct > 0 ? '+' : '') + pct + '%' : '') + '</small></div>'
        + svgBox(grade(maxT, 0, function(v){ return v.toFixed(0) })
            + refLinha(mediana, 0, maxT, 'var(--ok)', 'seu normal · ' + mediana)
            + paresDeBarras(vals, null, maxT, corT)
            + eixoX(vals.length, function(i){
                var p = pontosTss[i];
                return p ? diaMes(p.d) : '';
              }))
        + '<div class="bqTssAtalhos">' + botoes + '</div>'
        + legenda([['até 15% acima do normal','var(--run)'],
                   ['15 a 50% acima','var(--warn)'],
                   ['50% acima ou mais','var(--bad)']])
        + '<p class="ksub">Cada barra é um treino. A linha verde é a sua <b>mediana</b>, '
        + 'não uma meta — serve para ver o treino de hoje contra o seu normal. '
        + 'Calculado como no TrainingPeaks: uma hora no pace de limiar vale 100. '
        + '<b>Em treino de ladeira o número sai abaixo do deles</b>, porque aqui não há '
        + 'correção de altimetria.</p></div>';
    }

    /* dia/mes a partir do campo d (dias atras). Formatacao propria:
       brev() existe, mas dentro da PARTE 'analise feito x planejado'.
       Cada PARTE e uma funcao isolada — chamar de la daqui da
       ReferenceError, a montagem da aba para no meio e tudo abaixo
       deste cartao some da tela. Foi o que aconteceu.                */
    function diaMes(d){
      var x = new Date(HOJE.getTime() - (+d || 0) * 86400000);
      return ('0'+x.getDate()).slice(-2) + '/' + ('0'+(x.getMonth()+1)).slice(-2);
    }

    /* ── 3. longão ──
       ATENCAO ao que este cartao NAO faz mais: ele nao olha o historico
       inteiro. Olhava, e o resultado foi absurdo — pegava a ultra de 65
       km do ano passado, comparava com o alvo do objetivo e anunciava
       "258% do pico, voce ja passou pelo longao de pico". Uma corrida de
       meses atras nao diz nada sobre o preparo de hoje, e aquela frase
       poderia levar alguem a pular justamente o treino que mais importa.

       Agora a janela e de 8 SEMANAS, e o alvo e a faixa de 28 a 32 km,
       que e o longao de quem vai correr uma maratona — nao o longoMax do
       objetivo generico, que estava em 25. */
    var JANELA_LONGO = 8;
    var recentes = passadas.slice(-JANELA_LONGO);
    var lFeito = recentes.map(function(w){ return w.longoFeito });
    var lPlan  = recentes.map(function(w){ return w.longoPlan });
    var alvoL = 30;                       /* meio da faixa de 28 a 32 km */
    var maiorL = Math.max.apply(null, lFeito.concat([0]));
    /* o proximo longao que o plano ja tem marcado */
    var proxL = 0, chavesP = Object.keys(ST.plano || {}).sort();
    chavesP.forEach(function(k){
      if(k < iso(HOJE)) return;
      var s2 = ST.plano[k];
      if(s2 && s2.mod === 'corrida' && /longo/.test(s2.foco || '') && !s2.prova && !proxL)
        proxL = +s2.km || 0;
    });
    var maxL = Math.max(alvoL, maiorL, proxL) * 1.18;
    var pL = pontos(lFeito.map(function(v){ return v > 0 ? v : null }), 0, maxL);
    var faltamSem = Math.max(0, Math.ceil(diff(iso(HOJE), dados.prova) / 7));

    h += '<div class="kcard"><div class="kcab"><h3>Treino longo</h3>' +
        '<span class="delta ' + (maiorL >= 28 ? 'up' : 'fl') + '">' +
        (maiorL >= 28 ? 'na faixa' : Math.max(0, Math.round(28 - maiorL)) + ' km para a faixa') + '</span></div>' +
      '<div class="kbig">' + maiorL.toFixed(0) + '<small>km, seu maior nas últimas ' +
        JANELA_LONGO + ' semanas' + (proxL ? ' · o próximo do plano é ' + proxL.toFixed(0) + ' km' : '') +
        '</small></div>' +
      svgBox(grade(maxL, 0, function(v){ return v.toFixed(0) }) +
        refLinha(28, 0, maxL, 'var(--acc)', 'faixa de maratona · 28 a 32 km') +
        paresDeBarras(lFeito, lPlan, maxL, 'rgba(201,242,78,.30)') +
        area(pL, 'var(--run)') + curva(pL, 'var(--run)') +
        balao(pL, maiorL.toFixed(0) + ' km', 'var(--run)') +
        eixoX(lFeito.length, rotSem(passadas))) +
      legenda([['maior treino da semana','var(--run)'],['planejado','', 'gh']]) +
      '<p class="ksub">' + (maiorL >= 28
        ? 'Seus longões já estão na faixa que uma maratona pede. Daqui para frente o trabalho é <b>manter e chegar inteiro</b>, não subir mais.'
        : 'Para a maratona, o ideal é chegar a <b>28 a 32 km</b> num longão, pelo menos três semanas antes da prova. ' +
          'Faltam <b>' + Math.max(0, (28 - maiorL)).toFixed(0) + ' km</b> e <b>' + faltamSem +
          '</b> ' + (faltamSem === 1 ? 'semana' : 'semanas') + '.') + '</p>' +
      '<p class="kfoot">Só as últimas ' + JANELA_LONGO + ' semanas entram aqui. Antes eu olhava o histórico ' +
      'inteiro — e a sua ultra de 65 km aparecia como se fosse preparo atual, o que não é verdade: ' +
      'o que conta para outubro é o que suas pernas fizeram nas últimas semanas.</p></div>';

    /* ── 4. previsão ── */
    var prev = previsoes(passadas);
    var comPrev = prev.filter(function(v){ return v != null });
    var alvoT = 42.195 * ALVO_SEG;
    if(comPrev.length){
      var pAtual = comPrev[comPrev.length-1], pIni = comPrev[0];
      var minP = Math.min.apply(null, comPrev.concat([alvoT])) * 0.985;
      var maxP = Math.max.apply(null, comPrev.concat([alvoT])) * 1.015;
      var pts = pontos(prev, minP, maxP);
      var tP = tendencia(prev, minP, maxP, 'var(--tx3)');
      var difP = pAtual - alvoT, ganho = pIni - pAtual;

      h += '<div class="kcard"><div class="kcab"><h3>Previsão para os 42 km</h3>' +
          '<span class="delta ' + (ganho > 60 ? 'up' : ganho < -60 ? 'dn' : 'fl') + '">' +
          (ganho > 0 ? '−' : '+') + hm(Math.abs(ganho)) + ' no ciclo</span></div>' +
        '<div class="kbig" style="color:' + (difP <= 0 ? 'var(--ok)' : 'var(--warn)') + '">' + hm(pAtual) +
          '<small>' + (difP <= 0 ? hm(-difP) + ' abaixo do alvo de 3:50'
                                 : hm(difP) + ' acima do alvo de 3:50 · a mancha é a distância que falta') + '</small></div>' +
        svgBox(grade(maxP, minP, function(v){ return hm(v) }) +
          entre(pts, alvoT, minP, maxP, 'var(--warn)') +
          refLinha(alvoT, minP, maxP, 'var(--acc)', 'alvo 3:50') +
          tP.svg + curva(pts, 'var(--run)') +
          balao(pts, hm(pAtual), 'var(--run)') +
          eixoX(prev.length, rotSem(passadas))) +
        legenda([['sua previsão','var(--run)'],['alvo','var(--acc)','ln'],['tendência','var(--tx3)','ln']]) +
        '<p class="ksub">' + (ganho > 60 ? 'A previsão melhorou <b>' + hm(ganho) + '</b> desde o começo do ciclo — a mancha vem encolhendo.'
          : ganho < -60 ? 'A previsão piorou <b>' + hm(-ganho) + '</b> desde o começo do ciclo.'
          : 'A previsão está estável desde o começo do ciclo.') + '</p>' +
        '<p class="kfoot">A cada semana, seu melhor esforço das seis anteriores projetado para 42,195 km pela fórmula de Riegel. ' +
        'Entram corridas de 8 km ou mais em ritmo de esforço — uma rodagem leve não conta.</p></div>';
    }

    /* ── 5. eficiência aeróbica ── */
    var efs = passadas.map(function(w){ return w.ef });
    var comEf = efs.filter(function(v){ return v != null });
    if(comEf.length >= 2){
      var eAtual = comEf[comEf.length-1], eIni = comEf[0];
      var varia = (eAtual-eIni)/eIni*100;
      var minE = Math.min.apply(null, comEf) * 0.985, maxE = Math.max.apply(null, comEf) * 1.015;
      var ptsE = pontos(efs, minE, maxE);
      var tE = tendencia(efs, minE, maxE, 'var(--swim)');

      h += '<div class="kcard"><div class="kcab"><h3>Eficiência aeróbica</h3>' + chip(varia, '% no ciclo') + '</div>' +
        '<div class="kbig" style="color:' + (varia >= 0 ? 'var(--ok)' : 'var(--warn)') + '">' + eAtual.toFixed(1) +
          '<small>metros por minuto a cada batimento, nas rodagens leves</small></div>' +
        svgBox(grade(maxE, minE, function(v){ return v.toFixed(1) }) +
          area(ptsE, 'var(--swim)') + tE.svg + curva(ptsE, 'var(--swim)') +
          balao(ptsE, eAtual.toFixed(1), 'var(--swim)') +
          eixoX(efs.length, rotSem(passadas))) +
        legenda([['eficiência','var(--swim)'],['tendência','var(--swim)','ln']]) +
        '<p class="ksub">' + (varia >= 2 ? 'Você está correndo <b>mais rápido com o mesmo esforço do coração</b>. É a definição de evoluir.'
          : varia <= -2 ? 'A linha caiu. Fadiga acumulada, calor ou noites ruins costumam explicar antes de perda de forma.'
          : 'Estável. Em semana de carga alta, manter já é bom sinal.') + '</p>' +
        '<p class="kfoot">Só entram rodagens leves com cardíaco medido. É o indicador que menos engana: não depende de você ter feito um treino forte na semana.</p></div>';
    }

    /* ── 6. risco de carga ── */
    var rk = risco();
    if(rk.razao != null){
      var faixa = rk.razao < 0.8 ? 0 : rk.razao <= 1.3 ? 1 : rk.razao <= 1.5 ? 2 : 3;
      var cores = ['var(--tx3)','var(--ok)','var(--warn)','var(--bad)'];
      var nomes = ['baixa','faixa boa','atenção','alta'];
      var textos = [
        'Você está fazendo menos que a média das últimas quatro semanas. Em semana de polimento é exatamente o esperado.',
        'A carga desta semana está coerente com o que seu corpo vem aguentando.',
        'Carga subindo rápido. Vale segurar o próximo treino forte.',
        'Salto grande de carga. É a faixa que a literatura associa a mais lesão — considere reduzir esta semana.'];
      /* faixa horizontal com agulha, de 0 a 2 */
      var LW = W - ML - MR, x0 = ML;
      var limites = [0, 0.8, 1.3, 1.5, 2];
      var fx = function(v){ return x0 + Math.min(1, Math.max(0, v/2)) * LW };
      var barraRisco = '<svg viewBox="0 0 ' + W + ' 58" role="img">';
      for(var z = 0; z < 4; z++){
        barraRisco += '<rect x="' + fx(limites[z]).toFixed(1) + '" y="18" width="' +
          (fx(limites[z+1]) - fx(limites[z])).toFixed(1) + '" height="12" rx="6" fill="' + cores[z] +
          '" opacity="' + (z === faixa ? '1' : '.22') + '"/>';
      }
      [0.8, 1.3, 1.5].forEach(function(v){
        barraRisco += '<text x="' + fx(v).toFixed(1) + '" y="44" text-anchor="middle" font-size="8.5" fill="var(--tx3)">' +
          String(v).replace('.', ',') + '</text>';
      });
      barraRisco += '<path d="M' + fx(rk.razao).toFixed(1) + ',10 l5,-8 l-10,0 Z" fill="var(--tx)"/>' +
        '<line x1="' + fx(rk.razao).toFixed(1) + '" y1="12" x2="' + fx(rk.razao).toFixed(1) +
        '" y2="34" stroke="var(--tx)" stroke-width="2"/></svg>';

      h += '<div class="kcard"><div class="kcab"><h3>Risco de carga</h3>' +
          '<span class="delta ' + (faixa === 1 ? 'up' : faixa >= 2 ? 'dn' : 'fl') + '">' + nomes[faixa] + '</span></div>' +
        '<div class="kbig" style="color:' + cores[faixa] + '">' + rk.razao.toFixed(2) +
          '<small>últimos 7 dias sobre a média das últimas 4 semanas</small></div>' +
        barraRisco +
        '<p class="ksub">' + textos[faixa] + '</p>' +
        '<p class="kfoot">Últimos 7 dias: <b>' + rk.agudo + ' km</b>. Média semanal das últimas 4: <b>' +
          rk.cronico + ' km</b>. A faixa considerada segura vai de 0,80 a 1,30.</p></div>';
    }

    el.innerHTML = h;

    /* Liga os atalhos de intervalo. Precisa vir DEPOIS do innerHTML —
       antes disso os botoes ainda nao existem no DOM.

       Escrevem em ST.periodo, a mesma variavel das outras abas, e
       chamam os renders delas para tudo ficar no mesmo intervalo. */
    el.querySelectorAll('[data-tssper]').forEach(function(b){
      b.onclick = function(){
        var v = +b.getAttribute('data-tssper');
        if(!v) return;
        ST.periodo = v;
        render();                                   // redesenha a KPI
        ['renderTreinos','renderIndices','renderEvolucao','renderSaude'].forEach(function(fn){
          if(typeof window[fn] === 'function'){ try{ window[fn]() }catch(e){} }
        });
        if(typeof persistir === 'function'){ try{ persistir() }catch(e){} }
      };
    });
  }

  /* ═══════ a aba ═══════ */
  function montar(){
    if(document.getElementById('v-kpi')) return;
    var barra = document.querySelector('.tabbar .in');
    var provas = document.getElementById('v-provas') || document.querySelector('main');
    if(!barra || !provas || !provas.parentNode) return;

    var sec = document.createElement('main');
    sec.className = 'wrap hide';
    sec.id = 'v-kpi';
    provas.parentNode.insertBefore(sec, provas.nextSibling);

    var bt = document.createElement('button');
    bt.className = 'tab';
    bt.type = 'button';
    bt.setAttribute('data-v', 'kpi');
    bt.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg><span>KPI</span>';
    bt.onclick = function(){ irPara('kpi') };
    barra.appendChild(bt);
  }
  montar();

  /* irPara nao conhece a aba nova: o subtitulo viria vazio e o render
     nunca seria chamado */
  var irApp = window.irPara;
  window.irPara = function(v){
    var r = irApp.apply(this, arguments);
    try{
      if(v === 'kpi'){
        var sub = document.getElementById('abSub');
        if(sub) sub.textContent = 'Evolução até a prova';
        render();
      }
    }catch(e){ console.warn('kpi:', e.message) }
    return r;
  };

  window.bqKPI = {
    render: render,
    semanas: function(){ var d = semanas(); return d ? d.sems : null },
    previsoes: function(){ var d = semanas(); return d ? previsoes(d.sems.filter(function(w){return !w.futura})) : null },
    risco: risco
  };
});



/* ═══ 26. O QUE VOCE MUDA SOBREVIVE A FECHAR O APP ═══

   SINTOMA: voce cancela um treino, ele sai da tela, voce fecha o app —
   e quando volta o treino esta de novo lá.

   CAUSA: o app nao grava na hora. O persistir() do index.html faz
   assim:

       clearTimeout(_salvando);
       _salvando = setTimeout(() => salvarCoach(), 600);

   Sao 600 milissegundos de espera, de proposito, para nao disparar uma
   gravacao a cada toque. O problema e o que acontece nesses 600 ms: se
   voce fecha o app, o iOS congela a pagina, o temporizador nunca
   dispara e a gravacao nunca sai. A tela ja tinha mudado, entao parecia
   feito — mas o Firebase nunca soube.

   E tem um segundo caminho para o mesmo estrago: se o celular estiver
   sem sinal na hora, a gravacao falha em silencio. Foi o que aquela
   faixa amarela de "Cópia local, não consegui falar com o servidor"
   estava avisando.

   CONSERTO EM TRES PONTAS:

   a) ESPELHO LOCAL — a cada mudanca, uma copia vai para o localStorage
      NA HORA, sem espera e sem rede. localStorage e sincrono: mesmo que
      o app morra no milissegundo seguinte, ela ja esta gravada.

   b) DESCARGA NA SAIDA — quando o app vai para segundo plano
      (visibilitychange e pagehide), a gravacao no Firebase e disparada
      imediatamente, sem esperar os 600 ms.

   c) NA VOLTA, O MAIS NOVO GANHA — no arranque, comparo a data do
      espelho local com a data do que veio do Firebase. Se o local for
      mais recente, ele vale, e eu subo para o Firebase para os dois
      ficarem iguais. E o que resolve o caso em que a gravacao nunca
      saiu.

   Vale para tudo que voce edita: cancelar, mover, incluir segundo
   treino, marcar etapa, trocar objetivo, responder o questionario.
   ══════════════════════════════════════════════════════════════════ */

PARTE('salvar que sobrevive', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof window.salvarCoach !== 'function' || typeof window.lerCoach !== 'function')
    throw new Error('app sem salvarCoach/lerCoach');

  var CHAVE = 'bq.espelho';
  var CAMPOS = ['objetivo','feitas','filtro','extras','trocas','periodo','quest'];

  function lerEspelho(){
    try{ return JSON.parse(localStorage.getItem(CHAVE) || 'null') }catch(e){ return null }
  }
  function gravarEspelho(){
    try{
      var s = { em: Date.now() };
      CAMPOS.forEach(function(k){ if(ST[k] !== undefined) s[k] = ST[k] });
      if(typeof PERFIL === 'object'){
        s.dias = PERFIL.dias; s.marcoData = PERFIL.marcoData; s.marcoNome = PERFIL.marcoNome;
      }
      localStorage.setItem(CHAVE, JSON.stringify(s));
      return true;
    }catch(e){ console.warn('espelho:', e && e.message); return false }
  }

  /* ── a) espelho local a cada mudanca ── */
  var persistirApp = window.persistir;
  if(typeof persistirApp === 'function'){
    window.persistir = function(){
      gravarEspelho();                       /* sincrono, antes de tudo */
      return persistirApp.apply(this, arguments);
    };
  }

  /* ── b) descarga imediata quando o app sai de cena ── */
  var salvandoAgora = false;
  function descarregar(motivo){
    if(salvandoAgora) return;
    gravarEspelho();
    salvandoAgora = true;
    try{
      var p = window.salvarCoach();
      if(p && typeof p.then === 'function')
        p.then(function(){ salvandoAgora = false }, function(){ salvandoAgora = false });
      else salvandoAgora = false;
    }catch(e){ salvandoAgora = false; console.warn('descarga (' + motivo + '):', e && e.message) }
  }
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden') descarregar('segundo plano');
  });
  window.addEventListener('pagehide', function(){ descarregar('pagehide') });
  window.addEventListener('blur', function(){ descarregar('blur') });

  /* ── c) na volta, o mais novo ganha ── */
  var doFirebase = null;
  var lerApp = window.lerCoach;
  window.lerCoach = async function(){
    var c = await lerApp.apply(this, arguments);
    doFirebase = c;
    return c;
  };

  function aplicarEspelho(){
    var s = lerEspelho();
    if(!s || !s.em) return null;
    var nuvem = 0;
    if(doFirebase && doFirebase.em){ var t = Date.parse(doFirebase.em); if(isFinite(t)) nuvem = t }
    /* 2 segundos de folga: relogio do aparelho e do servidor nunca
       batem exatamente, e nao quero trocar por empate */
    if(s.em <= nuvem + 2000) return null;

    CAMPOS.forEach(function(k){ if(s[k] !== undefined) ST[k] = s[k] });
    if(typeof PERFIL === 'object'){
      if(Array.isArray(s.dias) && s.dias.length) PERFIL.dias = s.dias;
      if(s.marcoData) PERFIL.marcoData = s.marcoData;
      if(s.marcoNome) PERFIL.marcoNome = s.marcoNome;
    }
    return { local: new Date(s.em).toISOString(), nuvem: doFirebase && doFirebase.em || 'nada' };
  }

  /* roda depois do restaurar() do app, que e quem le o Firebase */
  setTimeout(function(){
    try{
      var r = aplicarEspelho();
      if(!r) return;
      console.log('espelho local era mais novo que o Firebase; recuperado.', r);
      if(typeof rebuild === 'function') rebuild();
      if(typeof renderAll === 'function') renderAll();
      else if(typeof renderCoach === 'function') renderCoach();
      /* sobe para a nuvem para os dois ficarem iguais */
      try{ window.salvarCoach() }catch(e){}
    }catch(e){ console.warn('espelho na volta:', e && e.message) }
  }, 2600);

  window.bqSalvar = {
    agora: function(){ descarregar('manual'); return 'gravando' },
    espelho: lerEspelho,
    nuvem: function(){ return doFirebase },
    comparar: function(){
      var s = lerEspelho();
      return { local: s && s.em ? new Date(s.em).toISOString() : 'nada',
               nuvem: doFirebase && doFirebase.em || 'nada' };
    }
  };
});



/* ═══ 27. O CANCELAMENTO PARAVA DE VALER POR CULPA DE UMA LAPIDE ═══

   Este e o motivo de verdade do treino cancelado voltar. Nao era a
   gravacao com atraso (parte 26) nem o plano se repondo (parte 20):
   era uma parte do fix.js apagando o trabalho da outra.

   O QUE ACONTECIA, na ordem:

   1. Voce confirma o cancelamento. A parte "aba coach" grava o marcador
      e, na linha seguinte, tambem grava uma LAPIDE:

          ST.trocas[k] = {__cancelado:true};
          window.bqApagar('trocas', k);

   2. Lapide, na parte "sincronia entre aparelhos", quer dizer "isto foi
      apagado neste aparelho; nao deixe voltar do servidor". Ela dura 24
      horas e e respeitada por bqLimparApagados(), que faz assim:

          if(bqFoiApagado(campo, k)) delete ST[campo][k];

   3. Repare no que isso significa para "trocas": a lapide manda apagar
      ST.trocas[k] — que e exatamente o marcador de cancelado do passo 1.

   4. bqLimparApagados() roda dentro de salvarCoach, dentro da mesclagem
      e quando a tela volta. Ou seja: na primeira gravacao depois do
      cancelamento, o marcador morre. A tela ja tinha atualizado, entao
      parecia certo — e o treino voltava na proxima remontagem.

   5. E como a lapide vale 24 horas, cancelar de novo no mesmo dia dava
      no mesmo. Era por isso que insistia.

   A lapide faz todo sentido para o SEGUNDO TREINO do dia, que voce
   apaga de verdade. Para "trocas" ela e o oposto do que se quer: ali o
   marcador precisa SOBREVIVER, nao ser varrido.

   CONSERTO:

   a) bqApagar('trocas', dia) passa a ser ignorado quando aquele dia
      esta marcado como cancelado. Nao se poe lapide no que precisa
      viver. Para 'extras' nada muda.

   b) bqLimparApagados ganha uma cerca: antes de rodar, guardo os
      marcadores de cancelado; depois, devolvo os que tenham sido
      varridos.

   c) As lapides de 'trocas' que ja estao no aparelho sao removidas no
      arranque. Elas so existem por causa deste erro — a unica linha do
      app que criava lapide de troca era a do cancelamento — e enquanto
      estiverem lá, continuariam matando o marcador por 24 horas. A
      protecao contra ressuscitar do servidor continua existindo por
      outro caminho, o "if(k in ST.trocas) continue" da mesclagem.
   ══════════════════════════════════════════════════════════════════ */

PARTE('lapide nao mata cancelamento', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  var TUM = 'bq.apagados';

  function ehCancelado(t){
    return !!(t && (t.cancelado || t.__cancelado));
  }
  function cancelados(){
    var o = {}, T = ST.trocas || {};
    Object.keys(T).forEach(function(k){ if(ehCancelado(T[k])) o[k] = T[k] });
    return o;
  }

  /* ── a) nao poe lapide em dia cancelado ── */
  var apagarApp = window.bqApagar;
  if(typeof apagarApp === 'function'){
    window.bqApagar = function(tipo, chave){
      if(tipo === 'trocas' && ehCancelado((ST.trocas || {})[chave])){
        console.log('lápide ignorada em trocas|' + chave + ': o dia está cancelado e o marcador precisa viver');
        return;
      }
      return apagarApp.apply(this, arguments);
    };
  }

  /* ── b) cerca em volta da limpeza ── */
  var limparApp = window.bqLimparApagados;
  if(typeof limparApp === 'function'){
    window.bqLimparApagados = function(){
      var guardados = cancelados();
      var r = limparApp.apply(this, arguments);
      var devolvidos = 0;
      ST.trocas = ST.trocas || {};
      Object.keys(guardados).forEach(function(k){
        if(!ehCancelado(ST.trocas[k])){ ST.trocas[k] = guardados[k]; devolvidos++ }
      });
      if(devolvidos) console.log('cancelamentos devolvidos depois da limpeza:', devolvidos);
      return r;
    };
  }

  /* ── c) tira as lápides de trocas que já estão no aparelho ── */
  function limparLapidesDeTrocas(){
    try{
      var m = JSON.parse(localStorage.getItem(TUM) || '{}');
      var tirou = 0;
      Object.keys(m).forEach(function(c){
        if(c.indexOf('trocas|') === 0){ delete m[c]; tirou++ }
      });
      if(tirou){
        localStorage.setItem(TUM, JSON.stringify(m));
        console.log('lápides de trocas removidas:', tirou);
      }
      return tirou;
    }catch(e){ console.warn('lápides:', e && e.message); return 0 }
  }
  limparLapidesDeTrocas();

  window.bqLapide = {
    limpar: limparLapidesDeTrocas,
    cancelados: cancelados,
    lapides: function(){
      try{ return JSON.parse(localStorage.getItem(TUM) || '{}') }catch(e){ return {} }
    }
  };
});



/* ═══ 28. SEGUNDA E SEXTA DE FOLGA · LONGAO NO SABADO ═══

   Pedido de 17/08/2026, e o que o plano da PEI tinha antes:

     seg  natacao          ter  rodagem + forca      qua  VO2
     qui  limiar + forca   sex  (ja estava livre)    sab  bike
     dom  longao

   Como fica:

     seg  FOLGA            ter  rodagem + forca      qua  VO2
     qui  limiar + forca   sex  FOLGA                sab  LONGAO
     dom  bike

   TRES MUDANCAS:

   1. Sexta ja estava livre — nao havia nenhum treino em sexta nas dez
      semanas. Nada a fazer.

   2. Segunda tinha uma coisa so: natacao, oito sessoes de 600 a 1.200 m.
      Saem do plano. Nadar deixa de ser tarefa marcada e passa a ser
      quando der.

   3. Sabado e domingo trocam de conteudo. O longao vai para sabado e a
      bike para domingo.

   POR QUE A TROCA E BOA, e nao so conveniente: o longao passa a ter
   DOIS dias leves depois dele — domingo sem impacto na bike e segunda
   de folga. Antes o longao caia no domingo e a segunda ja tinha
   natacao, entao a recuperacao era mais curta.

   SO DE HOJE PARA FRENTE. Nao reescrevo o passado por dois motivos: o
   historico do KPI compara o que foi planejado com o que foi feito, e
   mexer nisso falsearia as semanas que ja passaram; e as etapas que
   voce marcou como feitas sao guardadas pela data, entao trocar o
   conteudo de um dia ja vivido marcaria como concluido um treino que
   nunca aconteceu.

   Para desfazer, no console: bqFolgas.desligar()
   ══════════════════════════════════════════════════════════════════ */

PARTE('folgas e longao no sabado', function(){
  if(typeof window.gerarPlano !== 'function') throw new Error('app sem gerarPlano');

  var DESLIGADO = 'bq.folgas.off';
  var ligado = function(){ try{ return localStorage.getItem(DESLIGADO) !== '1' }catch(e){ return true } };

  var conta = { natacaoFora: 0, trocados: 0 };

  function arrumar(p){
    if(!p) return p;
    var hoje = iso(HOJE);
    conta = { natacaoFora: 0, trocados: 0 };

    /* ── 1. natacao sai do plano, de hoje para frente ── */
    Object.keys(p).forEach(function(k){
      if(k < hoje) return;
      var s = p[k];
      if(s && s.mod === 'natacao' && !s.prova){ delete p[k]; conta.natacaoFora++ }
    });

    /* ── 2. sabado e domingo trocam de conteudo ── */
    Object.keys(p).sort().forEach(function(k){
      if(k < hoje) return;
      var d = dt(k);
      if(dow(d) !== 6) return;                 /* 6 = sabado */
      var kd = iso(addD(d, 1));                /* o domingo seguinte */
      var sab = p[k], dom = p[kd];
      if(!sab || !dom || sab.prova || dom.prova) return;

      /* so troco o par que interessa: um lado bike/cross e o outro longao */
      var sabLeve  = sab.mod === 'bike' || sab.foco === 'cross';
      var domLongo = dom.foco === 'longo' || dom.foco === 'longo2';
      if(!(sabLeve && domLongo)) return;

      p[k]  = Object.assign({}, dom, { id: k,  data: k  });
      p[kd] = Object.assign({}, sab, { id: kd, data: kd });
      conta.trocados++;
    });

    return p;
  }

  var gerarApp = window.gerarPlano;
  window.gerarPlano = function(){
    var p = gerarApp.apply(this, arguments);
    if(!ligado()) return p;
    try{ return arrumar(p) }catch(e){ console.warn('folgas:', e && e.message); return p }
  };

  /* as etapas sao guardadas por id da sessao; como o conteudo de sabado
     e domingo mudou, o cache antigo mostraria o treino errado */
  function refazer(){
    try{ if(ST && ST.cache) ST.cache = {} }catch(e){}
    try{ rebuild() }catch(e){}
    try{ if(typeof selecionarProximo === 'function') selecionarProximo() }catch(e){}
    try{ if(typeof renderTudo === 'function') renderTudo() }
    catch(e){ try{ renderCoach() }catch(e2){} }
  }

  /* o plano da PEI e aplicado por temporizador no arranque (2,5 s e 6 s);
     entro depois dele para o meu ajuste nao ser desfeito */
  setTimeout(refazer, 3200);
  setTimeout(refazer, 6600);

  /* ── 3. perfil: segunda e sexta deixam de ser dias de treino ──
     O plano da PEI ignora PERFIL.dias, mas qualquer plano que o app
     montar depois dele obedece. Sem isto, o proximo objetivo voltaria a
     por treino na segunda e na sexta. */
  var ALVO = [2,3,4,6,7];                      /* ter, qua, qui, sab, dom */
  function ajustarPerfil(){
    if(typeof PERFIL !== 'object' || !ligado()) return false;
    var atual = (PERFIL.dias || []).slice().sort().join(',');
    if(atual === ALVO.join(',')) return false;
    PERFIL.dias = ALVO.slice();
    try{ if(typeof persistir === 'function') persistir() }catch(e){}
    console.log('perfil: dias de treino agora são ter, qua, qui, sáb e dom');
    return true;
  }
  setTimeout(ajustarPerfil, 3400);

  window.bqFolgas = {
    ligar:    function(){ try{ localStorage.removeItem(DESLIGADO) }catch(e){}
                          ajustarPerfil(); refazer(); return 'ligado' },
    desligar: function(){ try{ localStorage.setItem(DESLIGADO, '1') }catch(e){}
                          refazer(); return 'desligado — plano original de volta' },
    ligado:   ligado,
    resumo:   function(){ return conta },
    semana:   function(){
      var P = ST.plano || {}, DIA = ['dom','seg','ter','qua','qui','sex','sáb'];
      return Object.keys(P).sort().filter(function(k){ return k >= iso(HOJE) })
        .slice(0, 14).map(function(k){
          var s = P[k];
          return k + ' ' + DIA[dt(k).getDay()] + '  ' + (s.mod || '') + '  ' +
                 (s.foco || '') + '  ' + (s.km ? s.km + ' km' : (s.metros ? s.metros + ' m' : ''));
        });
    }
  };
});



/* ═══ 29. NUTRICAO NO DIA DO LONGAO ═══

   Num longao e na prova, aparece uma faixa dentro do treino dizendo o
   que levar naquele dia especifico: quantos gramas de carboidrato por
   hora, quantos geis, quantas pastilhas de eletrolito. E um botao que
   abre o guia completo.

   POR QUE ISSO EXISTE: a informacao de nutricao so serve na hora de
   sair de casa. Guardada num documento, ninguem le. Aqui ela aparece
   junto do treino que a exige.

   A PROGRESSAO NAO E ARBITRARIA. Estomago se treina: sobe-se cerca de
   10 g/h a cada uma ou duas semanas, dentro do longao, ate chegar ao
   alvo de prova. Pular etapas da enjoo e banheiro no dia errado. Sao
   oito longoes ate a PEI, que e exatamente a janela necessaria.

   As contas por dia:
     geis      = carboidrato total / 22 g por gel
     pastilhas = uma a cada hora, cerca de 500 ml e 300 mg de sodio
     sodio     = 300 a 600 mg/h e a faixa recomendada acima de 2 h

   Se o plano mudar de datas, a tabela ALVO precisa mudar junto — por
   isso ela esta aqui em cima, facil de achar.
   ══════════════════════════════════════════════════════════════════ */

PARTE('nutricao no longao', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  var GUIA = './guia-nutricao.html';
  var G_POR_GEL = 22;

  /* alvo de carboidrato por hora, longao a longao ate a PEI */
  var ALVO = {
    '2026-08-22': 30, '2026-08-29': 40, '2026-09-05': 40, '2026-09-12': 50,
    '2026-09-19': 55, '2026-09-26': 60, '2026-10-03': 60, '2026-10-10': 50,
    '2026-10-18': 58
  };

  var css = document.createElement('style');
  css.textContent = [
'.nutri{margin-top:14px;padding:13px 14px;border-radius:14px;',
'  background:var(--s2);border:1px solid var(--line)}',
'.nutri .cab{display:flex;align-items:center;gap:7px;margin-bottom:9px}',
'.nutri .cab b{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--tx3);flex:1}',
'.nutri .cab i{font-style:normal;font-size:13px}',
'.nutri .gh{font-size:23px;font-weight:800;letter-spacing:-.02em;line-height:1}',
'.nutri .gh small{font-size:12px;font-weight:600;color:var(--tx2);margin-left:5px;letter-spacing:0}',
'.nutri .itens{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}',
'.nutri .it{padding:6px 11px;border-radius:999px;background:var(--s3);font-size:12.5px;font-weight:600}',
'.nutri .nota{margin:9px 0 0;font-size:11.5px;color:var(--tx3);line-height:1.5}',
'.nutri .ensaio{color:var(--acc);font-weight:700}',
'.nutri a.gui{display:inline-flex;align-items:center;gap:6px;margin-top:11px;padding:9px 13px;',
'  border-radius:999px;background:var(--s3);border:1px solid var(--line);color:var(--tx2);',
'  font-size:12.5px;font-weight:600;text-decoration:none}',
'.nutri a.gui:hover{color:var(--tx);border-color:var(--tx3)}'
  ].join('\n');
  document.head.appendChild(css);

  function precisa(s){
    if(!s || s.mod !== 'corrida') return false;
    if(s.prova) return true;
    var min = +s.min || 0;
    return /longo/.test(s.foco || '') || min >= 90;
  }

  function montar(k, s){
    var horas = (+s.min || 0) / 60;
    if(!(horas > 0)) return '';
    var gh = ALVO[k];
    if(gh == null) gh = horas >= 2.5 ? 55 : horas >= 1.5 ? 45 : 30;

    var totalG    = Math.round(gh * horas);
    var geis      = Math.max(1, Math.round(totalG / G_POR_GEL));
    var pastilhas = Math.max(1, Math.round(horas));
    var sodio     = pastilhas * 300;
    var ensaio    = k === '2026-09-26';

    return '<div class="nutri">' +
      '<div class="cab"><i>🥤</i><b>O que levar neste treino</b></div>' +
      '<div class="gh">' + gh + ' g/h<small>de carboidrato · ' + totalG + ' g no total</small></div>' +
      '<div class="itens">' +
        '<span class="it">' + geis + ' ' + (geis === 1 ? 'gel' : 'géis') + '</span>' +
        '<span class="it">' + pastilhas + ' ' + (pastilhas === 1 ? 'pastilha' : 'pastilhas') + ' de eletrólito</span>' +
        '<span class="it">' + Math.round(horas * 500) + ' ml de água</span>' +
        '<span class="it">~' + sodio + ' mg de sódio</span>' +
      '</div>' +
      '<p class="nota">' + (ensaio
        ? '<span class="ensaio">Ensaio geral.</span> Use exatamente o que vai usar na prova: mesma comida no café, mesmo horário, mesma roupa, mesmos géis. O que der errado hoje você ainda tem três semanas para arrumar.'
        : s.prova
          ? 'Dia da prova. Nada de estreia: só o que você já testou nos longões. Confira o que os postos oferecem para não carregar tudo.'
          : 'Suba devagar. Enjoo ou vontade de banheiro querem dizer que você passou do ponto — volte um degrau e fique nele mais duas semanas.') +
      '</p>' +
      '<a class="gui" href="' + GUIA + '#progressao" target="_blank" rel="noopener">Guia completo de nutrição</a>' +
      '</div>';
  }

  function poe(){
    var el = document.querySelector('#sess');
    if(!el) return;
    var velho = el.querySelector('.nutri');
    var k = ST.sel;
    var s = (typeof sessaoDe === 'function') ? sessaoDe(k) : null;
    if(!precisa(s)){ if(velho) velho.remove(); return }
    if(velho) return;
    var html = montar(k, s);
    if(!html) return;
    var acts = el.querySelector('.acts');
    if(acts) acts.parentNode.insertBefore(criar(html), acts);
    else el.insertAdjacentHTML('beforeend', html);
  }
  function criar(html){
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstChild;
  }

  var diaApp = window.renderDia;
  if(typeof diaApp === 'function'){
    window.renderDia = function(){
      var r = diaApp.apply(this, arguments);
      try{ poe() }catch(e){ console.warn('nutrição:', e.message) }
      return r;
    };
  }

  window.bqNutri = {
    alvo: ALVO,
    doDia: function(k){
      var s = (typeof sessaoDe === 'function') ? sessaoDe(k || ST.sel) : null;
      if(!precisa(s)) return 'sem nutrição marcada neste dia';
      return montar(k || ST.sel, s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  };
});



/* ═══════ 30. RECALIBRACAO QUINZENAL ═══════

   A cada 14 dias o app le o que voce REALMENTE fez nas duas semanas
   anteriores e reescreve as duas seguintes. Nada de seguir dez semanas
   escritas num domingo de agosto como se o corpo fosse obedecer.

   O QUE ELE LE, na janela de 14 dias:
     · km corridos contra km planejados
     · sessoes feitas contra sessoes previstas
     · maior treino longo
     · melhor esforco, para recalcular o ritmo de limiar
     · eficiencia aerobica media
     · carga aguda sobre cronica

   O QUE ELE MUDA, para as duas semanas seguintes:
     1. RITMO DE LIMIAR  — recalculado pelo melhor esforco da janela,
        por Riegel. E dele que saem todos os ritmos e volumes do motor.
     2. VOLUME           — as sessoes sao reescaladas pelo que voce
        aguentou de fato, nao pelo que estava no papel.
     3. TETO DO LONGAO   — o proximo longo nao passa de 15% do seu maior
        longo recente, por mais que o plano peca.

   POR QUE AMORTECER, e nao simplesmente obedecer aos dados:

   Duas semanas e pouca amostra. Uma quinzena de chuva, uma gripe ou uma
   viagem derrubariam o limiar e encolheriam o plano; um unico dia bom o
   inflaria. Um treinador olha isso e pondera. O codigo aqui pondera
   assim:

     · o limiar anda no maximo 8 s/km por recalibracao
     · o fator de volume anda no maximo 15% por recalibracao
     · o fator nunca passa de 1,05 — o plano original ja e o teto
     · abaixo de 4 corridas na janela, nada muda: amostra insuficiente

   NADA E APLICADO SEM VOCE MANDAR. A tela mostra a leitura e o que
   mudaria; quem decide e voce. Um aplicativo que reescreve o treino
   sozinho, sem explicar, e pior que um plano fixo.
   ══════════════════════════════════════════════════════════════════ */

PARTE('recalibracao quinzenal', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  var ANCORA = '2026-08-17';        /* segunda-feira: inicio do 1o ciclo */
  var CICLO  = 14;
  var MAX_LIMIAR = 8;               /* s/km por recalibracao */
  var MAX_FATOR  = 0.15;            /* 15% por recalibracao */
  var MIN_CORRIDAS = 4;

  var css = document.createElement('style');
  css.textContent = [
'.recal{background:var(--s1);border:1px solid var(--acc);border-radius:18px;padding:17px 16px;margin-bottom:14px}',
'.recal .cab{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--acc);margin-bottom:7px}',
'.recal h3{margin:0 0 4px;font-size:18px;font-weight:800;letter-spacing:-.02em}',
'.recal .per{font-size:12px;color:var(--tx3);margin:0 0 13px}',
'.recal .ln{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13.5px}',
'.recal .ln:last-of-type{border-bottom:none}',
'.recal .ln .k{flex:1;color:var(--tx2)}',
'.recal .ln .v{font-weight:700;text-align:right;white-space:nowrap}',
'.recal .v.up{color:var(--ok)} .recal .v.dn{color:var(--bad)} .recal .v.fl{color:var(--tx2)}',
'.recal .porque{margin:11px 0 0;padding-top:10px;border-top:1px solid var(--line);',
'  font-size:12.5px;color:var(--tx3);line-height:1.55}',
'.recal .bts{display:flex;gap:9px;margin-top:14px}',
'.recal .bt{flex:1;padding:12px;border-radius:13px;font-size:14px;font-weight:700;border:0}',
'.recal .bt.sim{background:var(--acc);color:var(--bg)}',
'.recal .bt.nao{background:var(--s2);border:1px solid var(--line);color:var(--tx2)}',
'.recal.feito{border-color:var(--line)}',
'.recal.feito .cab{color:var(--tx3)}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- utilidades ---------- */
  function dataDe(r){ return iso(addD(HOJE, -r.d)) }
  function corridas(){
    return (ST.runs || []).filter(function(r){
      return !r.walk && (r.mod || 'corrida') === 'corrida' && r.km > 0;
    });
  }
  function limiarPorEsforco(km, paceSeg){
    /* Riegel ate a distancia de uma hora; esse ritmo e o limiar */
    var t = km * paceSeg;
    var distHora = km * Math.pow(3600 / t, 1/1.06);
    return distHora > 0 ? Math.round(3600 / distHora) : null;
  }

  /* qual ciclo estamos, contando a partir da ancora */
  function cicloAtual(){
    var d = Math.floor((dt(iso(HOJE)) - dt(ANCORA)) / 864e5);
    var n = Math.floor(d / CICLO);
    if(n < 0) n = 0;
    return { n: n,
             ini: iso(addD(dt(ANCORA), n * CICLO)),
             fim: iso(addD(dt(ANCORA), (n + 1) * CICLO - 1)) };
  }

  /* ---------- a leitura das duas semanas ---------- */
  function leitura(ini, fim){
    var runs = corridas().filter(function(r){
      var k = dataDe(r); return k >= ini && k <= fim;
    });
    var plan = 0, planN = 0;
    Object.keys(ST.plano || {}).forEach(function(k){
      if(k < ini || k > fim) return;
      var s = ST.plano[k];
      if(!s || s.mod !== 'corrida' || s.prova) return;
      plan += (+s.km || 0); planN++;
    });

    var km = 0, longo = 0, melhor = null, efs = [];
    runs.forEach(function(r){
      km += r.km;
      if(r.km > longo) longo = r.km;
      if(r.km >= 5 && r.pace > 200 && r.pace <= PERFIL.paceLimiar + 75){
        var lim = limiarPorEsforco(r.km, r.pace);
        if(lim && (melhor == null || lim < melhor)) melhor = lim;
      }
      if(r.fc > 60 && r.pace > PERFIL.paceLimiar + 20 && r.pace < 700)
        efs.push((60000 / r.pace) / r.fc);
    });

    return {
      ini: ini, fim: fim,
      corridas: runs.length, sessoesPlan: planN,
      km: +km.toFixed(1), kmPlan: +plan.toFixed(1),
      longo: +longo.toFixed(1),
      limiar: melhor,
      ef: efs.length ? +(efs.reduce(function(s,v){return s+v},0)/efs.length).toFixed(2) : null,
      aderencia: plan > 0 ? +(km / plan * 100).toFixed(0) : null
    };
  }

  /* ---------- o que mudaria ---------- */
  function proposta(L){
    var p = { ok: false, motivos: [] };
    if(L.corridas < MIN_CORRIDAS){
      p.motivo = 'Só ' + L.corridas + ' corrida' + (L.corridas === 1 ? '' : 's') +
                 ' nas duas semanas. Amostra pequena demais para recalibrar com honestidade — o plano segue como está.';
      return p;
    }
    p.ok = true;

    /* 1. limiar, com passo amortecido */
    var atual = PERFIL.paceLimiar;
    p.limiarAtual = atual;
    if(L.limiar){
      var alvo = L.limiar, passo = alvo - atual;
      if(Math.abs(passo) > MAX_LIMIAR) passo = passo > 0 ? MAX_LIMIAR : -MAX_LIMIAR;
      p.limiarNovo = Math.min(540, Math.max(210, atual + Math.round(passo)));
      if(p.limiarNovo !== atual)
        p.motivos.push(passo < 0
          ? 'seu melhor esforço da quinzena projeta um limiar mais rápido'
          : 'seu melhor esforço da quinzena projeta um limiar mais lento');
    } else {
      p.limiarNovo = atual;
      p.motivos.push('nenhum esforço qualificado na janela; o limiar fica onde está');
    }

    /* 2. fator de volume */
    var anterior = (ST.recal && ST.recal.fator) || 1;
    var bruto = L.kmPlan > 0 ? (L.km * 1.05) / L.kmPlan : 1;
    var alvoF = Math.min(1.05, Math.max(0.60, bruto));
    var passoF = alvoF - anterior;
    if(Math.abs(passoF) > MAX_FATOR) passoF = passoF > 0 ? MAX_FATOR : -MAX_FATOR;
    p.fatorAtual = anterior;
    p.fatorNovo = +Math.min(1.05, Math.max(0.55, anterior + passoF)).toFixed(2);
    if(L.aderencia != null && L.aderencia < 90)
      p.motivos.push('você cumpriu ' + L.aderencia + '% do volume planejado');
    else if(L.aderencia != null && L.aderencia >= 100)
      p.motivos.push('você cumpriu o volume inteiro');

    /* 3. teto do longao */
    p.tetoLongo = L.longo > 0 ? +(L.longo * 1.15).toFixed(1) : null;
    if(p.tetoLongo) p.motivos.push('o próximo longo não passa de ' + p.tetoLongo +
      ' km, 15% acima do seu maior recente');

    /* 4. dor ou lesao, do questionario */
    var q = ST.quest;
    if(q && (q.dor === 'sim' || q.lesao === 'ativa')){
      p.fatorNovo = +(p.fatorNovo * 0.9).toFixed(2);
      p.motivos.push('você marcou dor ou lesão no questionário');
    }
    return p;
  }

  /* ---------- aplicar ---------- */
  function aplicar(p, L){
    if(!p.ok) return;
    PERFIL.paceLimiar = p.limiarNovo;
    try{ Z = zonas() }catch(e){}
    ST.recal = { ciclo: cicloAtual().n, em: iso(HOJE),
                 fator: p.fatorNovo, tetoLongo: p.tetoLongo,
                 limiar: p.limiarNovo, leitura: L };
    try{ if(ST.cache) ST.cache = {} }catch(e){}
    try{ rebuild() }catch(e){}
    try{ if(typeof renderTudo === 'function') renderTudo() }
    catch(e){ try{ renderCoach() }catch(e2){} }
    try{ persistir() }catch(e){}
  }
  function adiar(){
    ST.recal = ST.recal || {};
    ST.recal.adiado = cicloAtual().n;
    try{ persistir() }catch(e){}
    try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
  }

  /* ---------- o plano obedece ao fator e ao teto ---------- */
  var gerarApp = window.gerarPlano;
  window.gerarPlano = function(){
    var p = gerarApp.apply(this, arguments);
    var R = ST.recal;
    /* Quando existe gerador de blocos (parte 32), quem manda no futuro e
       ele: apaga tudo e poe as suas sessoes por cima. Escalar aqui seria
       trabalho perdido — e pior, o cartao desta parte prometia um ajuste
       que nunca chegava na tela. Uma so mecanica, para nao haver duvida
       sobre quem decidiu o seu treino. */
    if(window.bqBloco) return p;
    if(!p || !R || !(R.fator > 0)) return p;
    var hoje = iso(HOJE);
    var ate  = iso(addD(HOJE, CICLO));       /* vale para as 2 semanas seguintes */
    try{
      Object.keys(p).forEach(function(k){
        if(k < hoje || k > ate) return;
        var s = p[k];
        if(!s || s.prova || s.mod !== 'corrida') return;
        if(typeof s.km === 'number'){
          var novo = s.km * R.fator;
          if(R.tetoLongo && /longo/.test(s.foco || '')) novo = Math.min(novo, R.tetoLongo);
          s.km = Math.round(novo * 10) / 10;
        }
        if(typeof s.min === 'number') s.min = Math.round(s.min * R.fator);
      });
    }catch(e){ console.warn('recal:', e && e.message) }
    return p;
  };

  /* ---------- o cartao ---------- */
  function chip(a, b, sufixo, menorEhMelhor){
    if(a === b) return '<span class="v fl">' + b + sufixo + '</span>';
    var bom = menorEhMelhor ? b < a : b > a;
    return '<span class="v ' + (bom ? 'up' : 'dn') + '">' + a + sufixo + ' → ' + b + sufixo + '</span>';
  }
  function cartao(){
    var c = cicloAtual();
    var jaFeito  = ST.recal && ST.recal.ciclo === c.n;
    var jaAdiado = ST.recal && ST.recal.adiado === c.n;
    if(jaAdiado && !jaFeito) return '';

    var ini = iso(addD(dt(c.ini), -CICLO)), fim = iso(addD(dt(c.ini), -1));
    var L = leitura(ini, fim);
    var p = proposta(L);
    var per = fmtCurto(ini) + ' a ' + fmtCurto(fim);

    if(jaFeito){
      return '<div class="recal feito"><div class="cab">Recalibrado</div>' +
        '<h3>Ciclo ' + (c.n + 1) + ' ajustado</h3>' +
        '<p class="per">Leitura de ' + per + ' · vale até ' + fmtCurto(c.fim) + '</p>' +
        '<div class="ln"><span class="k">Ritmo de limiar</span><span class="v">' + mmss(PERFIL.paceLimiar) + '/km</span></div>' +
        '<div class="ln"><span class="k">Volume do plano</span><span class="v">' + Math.round(ST.recal.fator * 100) + '%</span></div>' +
        (ST.recal.tetoLongo ? '<div class="ln"><span class="k">Teto do longo</span><span class="v">' + ST.recal.tetoLongo + ' km</span></div>' : '') +
        '</div>';
    }

    var h = '<div class="recal"><div class="cab">Recalibração quinzenal</div>' +
      '<h3>' + (p.ok ? 'O que muda nas próximas 2 semanas' : 'Sem dados para recalibrar') + '</h3>' +
      '<p class="per">Leitura de ' + per + ' · ' + L.corridas + ' corrida' + (L.corridas === 1 ? '' : 's') +
        ', ' + L.km + ' km de ' + L.kmPlan + ' planejados</p>';

    if(!p.ok){
      h += '<p class="porque">' + p.motivo + '</p>' +
           '<div class="bts"><button class="bt nao" data-recal="nao">Entendi</button></div></div>';
      return h;
    }

    h += '<div class="ln"><span class="k">Ritmo de limiar</span>' +
         chip(mmss(p.limiarAtual), mmss(p.limiarNovo), '/km', true) + '</div>';
    h += '<div class="ln"><span class="k">Volume do plano</span>' +
         chip(Math.round(p.fatorAtual * 100), Math.round(p.fatorNovo * 100), '%', false) + '</div>';
    if(p.tetoLongo)
      h += '<div class="ln"><span class="k">Teto do próximo longo</span><span class="v">' + p.tetoLongo + ' km</span></div>';
    if(L.aderencia != null)
      h += '<div class="ln"><span class="k">Aderência da quinzena</span><span class="v ' +
           (L.aderencia >= 90 ? 'up' : L.aderencia >= 70 ? 'fl' : 'dn') + '">' + L.aderencia + '%</span></div>';

    h += '<p class="porque">Por quê: ' + (p.motivos.length ? p.motivos.join('; ') : 'ajuste de rotina') + '. ' +
      'Os saltos são amortecidos de propósito — o limiar anda no máximo 8 s/km e o volume 15% por vez, ' +
      'porque duas semanas são pouca amostra para virar o plano de cabeça para baixo.</p>' +
      '<div class="bts">' +
        '<button class="bt sim" data-recal="sim">Aplicar</button>' +
        '<button class="bt nao" data-recal="nao">Agora não</button>' +
      '</div></div>';
    return h;
  }

  function ligar(host){
    if(!host) return;
    host.querySelectorAll('[data-recal]').forEach(function(b){
      b.onclick = function(){
        var c = cicloAtual();
        var ini = iso(addD(dt(c.ini), -CICLO)), fim = iso(addD(dt(c.ini), -1));
        var L = leitura(ini, fim);
        if(b.dataset.recal === 'sim') aplicar(proposta(L), L);
        else adiar();
      };
    });
  }

  /* entra no topo da aba KPI */
  var kpiApp = window.bqKPI && window.bqKPI.render;
  function injetar(){
    var el = document.getElementById('v-kpi');
    if(!el || el.querySelector('.recal')) return;
    if(window.bqBloco) return;          /* o cartao do bloco ja diz tudo isto */
    var h = cartao();
    if(!h) return;
    el.insertAdjacentHTML('afterbegin', h);
    ligar(el);
  }
  if(typeof kpiApp === 'function'){
    window.bqKPI.render = function(){
      var r = kpiApp.apply(this, arguments);
      try{ injetar() }catch(e){ console.warn('recal:', e && e.message) }
      return r;
    };
  }

  window.bqRecal = {
    ciclo: cicloAtual,
    leitura: function(){
      var c = cicloAtual();
      return leitura(iso(addD(dt(c.ini), -CICLO)), iso(addD(dt(c.ini), -1)));
    },
    proposta: function(){ return proposta(window.bqRecal.leitura()) },
    aplicar: function(){ var L = window.bqRecal.leitura(); aplicar(proposta(L), L); return ST.recal },
    estado: function(){ return ST.recal || null },
    zerar: function(){ delete ST.recal; try{ rebuild(); renderTudo() }catch(e){} return 'zerado' }
  };
});



/* ═══ 31. JANELA DE 14 DIAS ═══

   O plano deixa de existir alem de duas semanas. So aparecem os
   treinos de hoje ate hoje mais 14 dias, mais o dia da prova, que fica
   sempre visivel como alvo.

   POR QUE: planejar dez semanas de treino num domingo de agosto e
   ficcao — o corpo nao obedece a planilha, e o que estava escrito para
   a semana 8 ja nasce errado. A cada quinzena o app le o que voce
   realmente fez (parte 30) e reescreve as duas seguintes.

   O QUE ISTO NAO FAZ: nao apaga nada. O plano inteiro continua sendo
   gerado; o que muda e o que voce enxerga. Amanha a janela anda um dia
   e o dia 15 aparece. Nenhum treino foi perdido, e o KPI continua
   sabendo o que estava planejado nas semanas que ja passaram.

   O PASSADO FICA. Dias anteriores a hoje continuam no calendario, para
   voce ver o que fez e o que faltou. A janela corta so o futuro
   distante.

   Para ver o plano inteiro de novo, no console: bqJanela.desligar()
   ══════════════════════════════════════════════════════════════════ */

PARTE('janela de 14 dias', function(){
  if(typeof window.gerarPlano !== 'function') throw new Error('app sem gerarPlano');

  var DIAS = 14;
  var DESLIGADO = 'bq.janela.off';
  var ligado = function(){ try{ return localStorage.getItem(DESLIGADO) !== '1' }catch(e){ return true } };

  var css = document.createElement('style');
  css.textContent = [
'.jan-nota{margin:14px 0 0;padding:13px 15px;border-radius:14px;background:var(--s2);',
'  border:1px dashed var(--line);font-size:12.5px;color:var(--tx3);line-height:1.55}',
'.jan-nota b{color:var(--tx2)}'
  ].join('\n');
  document.head.appendChild(css);

  function limite(){ return iso(addD(HOJE, DIAS)) }

  var gerarApp = window.gerarPlano;
  window.gerarPlano = function(){
    var p = gerarApp.apply(this, arguments);
    if(!p || !ligado()) return p;
    var ate = limite();
    try{
      Object.keys(p).forEach(function(k){
        if(k <= ate) return;              /* dentro da janela, fica */
        if(p[k] && p[k].prova) return;    /* a prova nunca some */
        delete p[k];
      });
    }catch(e){ console.warn('janela:', e && e.message) }
    return p;
  };

  /* explica o calendario vazio, para nao parecer defeito */
  function nota(){
    var el = document.querySelector('#sess');
    if(!el || !ligado()) return;
    if(el.querySelector('.jan-nota')) return;
    var k = ST.sel;
    if(!k || k <= limite()) return;
    var s = (typeof sessaoDe === 'function') ? sessaoDe(k) : null;
    if(s) return;                          /* e a prova, ou algo que ficou */

    var faltam = diff(limite(), k);
    var d = document.createElement('p');
    d.className = 'jan-nota';
    d.innerHTML = 'Este dia ainda não tem treino porque o plano só vai até <b>' +
      fmtCurto(limite()) + '</b>. Ele é reescrito de duas em duas semanas, a partir do que você ' +
      'realmente treinou — planejar mais longe que isso é ficção. ' +
      (faltam > 0 ? 'Faltam <b>' + faltam + ' dia' + (faltam === 1 ? '' : 's') +
        '</b> para este dia entrar na janela.' : '');
    el.appendChild(d);
  }

  var diaApp = window.renderDia;
  if(typeof diaApp === 'function'){
    window.renderDia = function(){
      var r = diaApp.apply(this, arguments);
      try{ nota() }catch(e){}
      return r;
    };
  }

  window.bqJanela = {
    dias: DIAS,
    limite: limite,
    ligado: ligado,
    ligar: function(){
      try{ localStorage.removeItem(DESLIGADO) }catch(e){}
      try{ if(ST.cache) ST.cache = {}; rebuild(); renderTudo() }catch(e){}
      return 'janela de ' + DIAS + ' dias ligada';
    },
    desligar: function(){
      try{ localStorage.setItem(DESLIGADO, '1') }catch(e){}
      try{ if(ST.cache) ST.cache = {}; rebuild(); renderTudo() }catch(e){}
      return 'plano inteiro visível de novo';
    }
  };

  setTimeout(function(){
    try{ if(ST.cache) ST.cache = {}; rebuild();
      if(typeof renderTudo === 'function') renderTudo(); else renderCoach(); }catch(e){}
  }, 3600);
});



/* ═══ 32. BLOCOS DE 14 DIAS, COMPOSTOS A CADA QUINZENA ═══

   Isto substitui o plano fixo. Nao existe mais planilha escrita ate
   18/10: existe UM bloco de 14 dias por vez. Quando ele acaba, o app
   compoe o proximo a partir do que voce realmente treinou.

   Antes eu estava ENCOLHENDO um plano pronto. Nao e a mesma coisa —
   e era razoavel a reclamacao: ninguem sabe hoje o que voce vai
   produzir em setembro, entao escrever setembro hoje e chute.

   COMO O BLOCO E COMPOSTO

   Entram tres coisas:

   1. O QUE VOCE FEZ nos 14 dias anteriores — km reais, maior longo,
      melhor esforco, quantas sessoes cumpriu.
   2. QUANTO FALTA para 18/10, que decide a fase.
   3. SEUS DIAS — ter, qua, qui, sab, dom, do seu perfil.

   VOLUME. A base e a media semanal REAL das duas semanas anteriores,
   nao o que estava no papel. Sobre ela:
     aderencia >= 85% e sem dor .... +6% por semana
     aderencia 70 a 85% ............ mantem
     aderencia < 70% ............... -10%
   E um teto duro: o bloco nunca passa de 1,10x a media real. Progressao
   e degrau, nao salto.

   LONGAO. 32% do volume da semana, limitado por tres tetos: 1,15x o
   maior longo recente, o teto da fase, e 32 km em absoluto. O ultimo
   longo grande cai a tres semanas da prova; depois disso so encurta.

   QUALIDADE, pelo tempo restante:
     mais de 7 semanas .... VO2, tiros de 800 a 1000 m
     4 a 7 semanas ........ limiar e ritmo de prova
     3 semanas ............ ritmo de prova, volume ja caindo
     2 semanas ou menos ... polimento

   A SEGUNDA SEMANA DO BLOCO e de recuperacao quando as duas anteriores
   foram de carga: volume x 0,78. Sem isso a carga so sobe.

   TIROS CURTOS EM LADEIRA entram toda terca, o ano todo — 6 a 8 de 10
   a 12 s, com recuperacao completa. Custo de fadiga quase zero, e e a
   lacuna que a auditoria do plano antigo encontrou.

   O PASSADO NAO E TOCADO. Dias anteriores a hoje continuam como
   estavam, para o KPI comparar planejado com feito com honestidade.
   ══════════════════════════════════════════════════════════════════ */

PARTE('blocos de 14 dias', function(){
  if(typeof window.gerarPlano !== 'function') throw new Error('app sem gerarPlano');
  if(typeof PERFIL !== 'object') throw new Error('app sem PERFIL');

  var PROVA = '2026-10-18';
  var DIAS  = 14;
  var LONGO_MAX = 32;

  var css = document.createElement('style');
  css.textContent = [
'.blk{background:var(--s1);border:1px solid var(--acc);border-radius:18px;padding:17px 16px;margin-bottom:14px}',
'.blk .cab{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--acc);margin-bottom:7px}',
'.blk h3{margin:0 0 4px;font-size:19px;font-weight:800;letter-spacing:-.02em}',
'.blk .per{font-size:12px;color:var(--tx3);margin:0 0 13px}',
'.blk .ln{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13.5px}',
'.blk .ln:last-of-type{border-bottom:none}',
'.blk .ln .k{flex:1;color:var(--tx2)}',
'.blk .ln .v{font-weight:700;text-align:right;white-space:nowrap}',
'.blk .porque{margin:11px 0 0;padding-top:10px;border-top:1px solid var(--line);',
'  font-size:12.5px;color:var(--tx3);line-height:1.55}',
'.blk .bt{width:100%;margin-top:14px;padding:13px;border-radius:13px;font-size:14.5px;',
'  font-weight:700;border:0;background:var(--acc);color:var(--bg)}',
'.blk.aberto{border-color:var(--line)}',
'.blk.aberto .cab{color:var(--tx3)}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- leitura dos 14 dias anteriores ---------- */
  function dataDe(r){ return iso(addD(HOJE, -r.d)) }
  function corridas(){
    return (ST.runs || []).filter(function(r){
      return !r.walk && (r.mod || 'corrida') === 'corrida' && r.km > 0;
    });
  }
  function limiarPor(km, pace){
    var t = km * pace, d = km * Math.pow(3600 / t, 1/1.06);
    return d > 0 ? Math.round(3600 / d) : null;
  }
  function leitura(ini, fim){
    var runs = corridas().filter(function(r){
      var k = dataDe(r); return k >= ini && k <= fim;
    });
    var plan = 0;
    Object.keys(ST.plano || {}).forEach(function(k){
      if(k < ini || k > fim) return;
      var s = ST.plano[k];
      if(s && s.mod === 'corrida' && !s.prova) plan += (+s.km || 0);
    });
    var km = 0, longo = 0, melhor = null;
    runs.forEach(function(r){
      km += r.km;
      if(r.km > longo) longo = r.km;
      if(r.km >= 5 && r.pace > 200 && r.pace <= PERFIL.paceLimiar + 75){
        var l = limiarPor(r.km, r.pace);
        if(l && (melhor == null || l < melhor)) melhor = l;
      }
    });
    return { corridas: runs.length, km: +km.toFixed(1), kmPlan: +plan.toFixed(1),
             semanal: +(km/2).toFixed(1), longo: +longo.toFixed(1), limiar: melhor,
             aderencia: plan > 0 ? Math.round(km/plan*100) : null };
  }

  /* ---------- composicao do bloco ---------- */
  function fase(semanas){
    if(semanas > 7) return {n:'Construção',   qual:'vo2',    tetoLongo:28, cresce:true};
    if(semanas > 4) return {n:'Específica',   qual:'limiar', tetoLongo:32, cresce:true};
    if(semanas > 3) return {n:'Pico',         qual:'mp',     tetoLongo:32, cresce:false};
    if(semanas > 2) return {n:'Transição',    qual:'mp',     tetoLongo:24, cresce:false};
    return             {n:'Polimento',    qual:'soltura',tetoLongo:16, cresce:false};
  }

  var PISO_SEMANAL = 25;      /* km: abaixo disso nao se prepara maratona */
  var ALVO_LONGO   = 32;      /* km: o longao de pico do ciclo */
  var PASSO_LONGO  = 3;       /* km por bloco */

  /* Base do volume. NAO e so o que ele correu: se fosse, um bloco ruim
     encolheria o proximo, que encolheria o seguinte, e em quatro blocos
     o plano viraria 6 km por semana. Testei e foi exatamente isso que
     aconteceu. A base e a MAIOR entre o realizado e 85% do que havia
     sido proposto — o plano cede, mas nao desaba — com piso absoluto. */
  function volumeAlvo(L, F){
    var real     = L.semanal > 0 ? L.semanal : 0;
    var anterior = (ST.bloco && ST.bloco.resumo && ST.bloco.resumo.vol1) || 0;
    var base = Math.max(real, anterior * 0.85, PISO_SEMANAL);

    var f = 1;
    var q = ST.quest;
    var dor = q && (q.dor === 'sim' || q.lesao === 'ativa');
    if(!F.cresce) f = 0.85;
    else if(dor) f = 0.95;
    else if(L.aderencia == null) f = 1.0;
    else if(L.aderencia >= 85) f = 1.06;
    else if(L.aderencia >= 70) f = 1.0;
    else f = 0.90;

    return { sem1: +Math.max(PISO_SEMANAL, Math.min(base * 1.10, base * f)).toFixed(1),
             fator: f, base: +base.toFixed(1), real: +real.toFixed(1) };
  }

  /* Longao. Ele NAO e uma porcentagem do volume: numa maratona com
     volume modesto, 32% dariam 15 km e voce nunca passaria disso — o
     bloco seguinte leria 15 como referencia e travaria ali. Aqui ele
     sobe por degraus de 3 km em direcao aos 32, respeitando o teto de
     1,15x o maior recente e o teto da fase. */
  function longoAlvo(L, Fw){
    var recente = L.longo > 0 ? L.longo : 10;
    var passo   = Math.min(recente + PASSO_LONGO, recente * 1.15 + PASSO_LONGO);
    var alvo    = Math.min(passo, ALVO_LONGO, Fw.tetoLongo);
    return Math.max(6, +alvo.toFixed(1));
  }

  var PACES = {
    facil:   function(){ return PERFIL.paceLimiar + 70 },
    longo:   function(){ return PERFIL.paceLimiar + 55 },
    mp:      function(){ return PERFIL.paceLimiar + 22 },
    limiar:  function(){ return PERFIL.paceLimiar },
    vo2:     function(){ return PERFIL.paceLimiar - 22 },
    soltura: function(){ return PERFIL.paceLimiar + 80 }
  };
  function pc(seg){ return Math.floor(seg/60) + ':' + String(Math.round(seg%60)).padStart(2,'0') }

  function sessao(k, mod, foco, km, extra){
    var s = { id:k, data:k, mod:mod, foco:foco, prova:false, bloco:true };
    if(mod === 'corrida'){
      s.km = +km.toFixed(1);
      s.min = Math.round(s.km * (PACES[foco] ? PACES[foco]() : PACES.facil()) / 60);
      s.pace = pc(PACES[foco] ? PACES[foco]() : PACES.facil());
    } else {
      s.min = Math.round(km);
    }
    return Object.assign(s, extra || {});
  }

  function gerarBloco(ini){
    var L = leitura(iso(addD(dt(ini), -DIAS)), iso(addD(dt(ini), -1)));
    var semanas = Math.max(0, diff(ini, PROVA) / 7);
    var F = fase(semanas);
    var V = volumeAlvo(L, F);
    var dias = (PERFIL.dias || [2,3,4,6,7]).slice().sort();

    var sess = {}, resumo = { leitura:L, fase:F.n, semanas:+semanas.toFixed(1),
                              vol1:V.sem1, vol2:0, longo1:0, longo2:0, qual:F.qual };

    for(var w = 0; w < 2; w++){
      /* segunda semana do bloco recua, se a fase ainda cresce */
      var vol = w === 0 ? V.sem1 : (F.cresce ? +(V.sem1 * 0.78).toFixed(1) : +(V.sem1 * 0.85).toFixed(1));

      /* SEMANA PARCIAL. Se o bloco nasce numa quinta, a primeira semana
         tem 4 dias, nao 7 — e enfiar o volume inteiro neles seria um
         salto de carga disfarcado. Aqui o volume e proporcional aos
         dias de treino que sobraram. */
      var disponiveis = 0;
      /* Sem piso rigido por sessao. O piso de 5 km que eu tinha posto
         inflava semanas leves: numa semana de 25 km ele entregava 28,8.
         Agora o resto e distribuido proporcionalmente e so nao desce de
         3 km, que e o minimo para uma sessao fazer sentido. */
      dias.forEach(function(d){
        for(var i = 0; i < 7; i++){
          var c = addD(dt(ini), w*7 + i);
          if(dow(c) === d && iso(c) >= iso(HOJE) && iso(c) <= PROVA){ disponiveis++; break }
        }
      });
      if(disponiveis < dias.length && disponiveis > 0)
        vol = +(vol * disponiveis / dias.length).toFixed(1);
      var semRest = semanas - w;
      var Fw = fase(semRest);

      /* Longao por degraus rumo aos 32 km — mas LIMITADO pelo volume da
         semana, nunca o contrario. Na primeira versao eu deixava o
         longao puxar o volume para cima e ele saltava de 45 para 71 km
         por semana num bloco so. Quem manda e o volume: o longao pode
         chegar a 55% dele, que e a proporcao do seu proprio plano
         original (32 km numa semana de 60).

         Consequencia honesta: com o volume que voce tem hoje, o longao
         maximo desta preparacao fica por volta de 28 a 30 km, nao 32.
         Para 32 seria preciso uma semana de 58 km, e nao ha tempo de
         chegar la com seguranca. */
      var longo = Math.min(longoAlvo(w === 0 ? L : {longo: resumo.longo1 || L.longo}, Fw),
                           +(vol * 0.55).toFixed(1));
      longo = Math.max(6, +longo.toFixed(1));
      var resto = Math.max(0, vol - longo);
      /* resto dividido entre os dias de corrida que nao sao o longao */
      var diasCorrida = dias.filter(function(d){ return d !== 7 });   /* domingo e bike */
      var nRest = Math.max(1, diasCorrida.length - 1);
      var kmDia = resto / nRest;

      dias.forEach(function(d){
        var data = null;
        for(var i = 0; i < 7; i++){
          var cand = addD(dt(ini), w*7 + i);
          if(dow(cand) === d){ data = iso(cand); break }
        }
        if(!data || data > PROVA) return;
        if(data === PROVA) return;

        if(d === 6){                       /* sábado: longão */
          sess[data] = sessao(data, 'corrida', semRest <= 2 ? 'soltura' : 'longo', longo, {
            titulo: semRest <= 2 ? 'Soltura pré-prova' : 'Longão',
            detalhe: semRest <= 2
              ? longo.toFixed(0) + ' km bem leves. Nada de testar ritmo na véspera.'
              : longo.toFixed(0) + ' km contínuos. Primeiros 60% em rodagem, últimos 40% um pouco mais firmes. Treine a alimentação.',
            fase: Fw.n });
          resumo['longo' + (w+1)] = longo;
        } else if(d === 7){                /* domingo: bike, sem impacto */
          sess[data] = sessao(data, 'bike', 'cross', Math.round(vol * 1.5), {
            titulo: 'Bike aeróbica',
            detalhe: 'Volume sem impacto no dia seguinte ao longão. Acelera a recuperação em vez de atrapalhar.',
            fase: Fw.n });
        } else if(d === 3){                /* quarta: a sessão de qualidade */
          var q = Fw.qual, km = Math.max(3, kmDia * 1.05);
          var txt = {
            vo2:    '5 a 6 tiros de 1000 m em ' + pc(PACES.vo2()) + '/km, com 3 min de trote entre eles.',
            limiar: 'Bloco contínuo de 20 a 25 min em ' + pc(PACES.limiar()) + '/km. Confortavelmente difícil.',
            mp:     km.toFixed(0) + ' km em ritmo de prova, ' + pc(PACES.mp()) + '/km. É o ritmo que você quer sentir no dia 18.',
            soltura:'Rodagem leve com 4 acelerações de 20 s no fim.'
          }[q];
          sess[data] = sessao(data, 'corrida', q, km, {
            titulo: {vo2:'Intervalado VO₂', limiar:'Limiar', mp:'Ritmo de prova', soltura:'Soltura'}[q],
            detalhe: txt, fase: Fw.n });
        } else if(d === 2){                /* terça: fácil + tiros curtos + força */
          sess[data] = sessao(data, 'corrida', 'facil', Math.max(3, kmDia * 0.975), {
            titulo: 'Rodagem leve + tiros curtos',
            detalhe: kmDia.toFixed(0) + ' km soltos e, no fim, 6 a 8 tiros de 10 a 12 s numa ladeira leve, ' +
                     'descendo caminhando com recuperação completa. São curtos demais para cansar — é ' +
                     'estímulo de fibra rápida, a lacuna que a auditoria encontrou.',
            forca: 'base_a', fase: Fw.n });
        } else {                            /* quinta: moderado + força */
          sess[data] = sessao(data, 'corrida', 'facil', Math.max(3, kmDia * 0.975), {
            titulo: 'Rodagem moderada',
            detalhe: kmDia.toFixed(0) + ' km em ritmo confortável, com 2 blocos de 5 min de cadência alta ' +
                     '— passos mais curtos e frequentes, sem acelerar.',
            forca: 'base_b', fase: Fw.n });
        }
      });
      if(w === 1) resumo.vol2 = vol;
    }
    return { ini: ini, fim: iso(addD(dt(ini), DIAS - 1)), sessoes: sess, resumo: resumo };
  }

  /* ---------- estado ---------- */
  function blocoAtual(){ return ST.bloco && ST.bloco.fim >= iso(HOJE) ? ST.bloco : null }

  /* O bloco comeca HOJE, nao na segunda-feira.
     Tentei alinhar na segunda e foi pior: a segunda da semana CORRENTE
     ja passou, entao metade do bloco nascia no passado e sobravam 7
     dias de treino em vez de 14. A dupla longao-sabado / bike-domingo
     nao depende disso — as sessoes sao atribuidas por dia da semana,
     entao sabado sempre vem antes do domingo dentro da mesma semana. */
  /* O limiar e a ancora de TODOS os ritmos. A cada bloco ele e recalculado
     pelo melhor esforco da quinzena, por Riegel, com passo amortecido de
     8 s/km — duas semanas sao pouca amostra para virar tudo de cabeca
     para baixo, e uma quinzena de chuva nao pode redefinir quem voce e. */
  function atualizarLimiar(L){
    if(!L || !L.limiar) return null;
    var atual = PERFIL.paceLimiar, passo = L.limiar - atual;
    if(Math.abs(passo) > 8) passo = passo > 0 ? 8 : -8;
    var novo = Math.min(540, Math.max(210, atual + Math.round(passo)));
    if(novo === atual) return null;
    PERFIL.paceLimiar = novo;
    try{ Z = zonas() }catch(e){}
    return { de: atual, para: novo };
  }

  /* Registro do que foi planejado, semana a semana.
     Sem isto o KPI perde a memoria: como o plano passou a ter so 14
     dias, as semanas anteriores ficavam sem "planejado" e a aderencia
     do ciclo inteiro virava uma barra so. Aqui cada bloco deixa
     escrito quanto pediu em cada semana, e o KPI le daqui. */
  function registrarHistorico(B){
    if(!B || !B.sessoes) return;
    ST.hist = ST.hist || {};
    Object.keys(B.sessoes).forEach(function(k){
      var s = B.sessoes[k];
      if(!s || s.mod !== 'corrida' || s.prova) return;
      var seg = iso(addD(dt(k), -(dow(dt(k)) - 1)));       /* segunda da semana */
             var segHoje2 = iso(addD(HOJE, -(dow(HOJE) - 1)));
      if(seg <= segHoje2 && ST.hist[seg] && ST.hist[seg].planKm > 0) return;
      ST.hist[seg] = ST.hist[seg] || { planKm: 0, longoPlan: 0 };
      ST.hist[seg].planKm = +(ST.hist[seg].planKm + (+s.km || 0)).toFixed(1);
      if((+s.km || 0) > ST.hist[seg].longoPlan) ST.hist[seg].longoPlan = +s.km;
    });
  }

  function criar(ini){
    var pre = leitura(iso(addD(dt(ini || iso(HOJE)), -DIAS)), iso(addD(dt(ini || iso(HOJE)), -1)));
    var mudou = atualizarLimiar(pre);
    /* semanas do bloco antigo saem do historico antes de reescrever,
       senao um bloco refeito soma duas vezes */
    if(ST.hist && ST.bloco) Object.keys(ST.hist).forEach(function(seg){
      /* comparava chave de SEGUNDA com a data de HOJE: numa terca a
         semana em curso nao era limpa e o plano somava duas vezes */
      var segHoje = iso(addD(HOJE, -(dow(HOJE) - 1)));
      if(seg > segHoje) delete ST.hist[seg];
    });
    ST.bloco = gerarBloco(ini || iso(HOJE));
    registrarHistorico(ST.bloco);
    if(mudou) ST.bloco.resumo.limiar = mudou;
    try{ if(ST.cache) ST.cache = {} }catch(e){}
    try{ rebuild() }catch(e){}
    try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){ try{ renderCoach() }catch(e2){} }
    try{ persistir() }catch(e){}
    return ST.bloco;
  }

  /* ---------- o plano passa a ser o bloco ---------- */
  var gerarApp = window.gerarPlano;
  window.gerarPlano = function(){
    var p = gerarApp.apply(this, arguments) || {};
    var hoje = iso(HOJE);
    var B = blocoAtual();
    try{
      /* o futuro sai: quem manda agora e o bloco */
      Object.keys(p).forEach(function(k){
        if(k >= hoje && !(p[k] && p[k].prova)) delete p[k];
      });
      if(B) Object.keys(B.sessoes).forEach(function(k){
        if(k >= hoje) p[k] = Object.assign({}, B.sessoes[k]);
      });
    }catch(e){ console.warn('bloco:', e && e.message) }
    return p;
  };

  /* ---------- cartao ---------- */
  function cartao(){
    var B = blocoAtual();
    if(B){
      var r = B.resumo;
      return '<div class="blk aberto"><div class="cab">Bloco em andamento</div>' +
        '<h3>' + r.fase + '</h3>' +
        '<p class="per">' + fmtCurto(B.ini) + ' a ' + fmtCurto(B.fim) + ' · ' +
          r.semanas.toFixed(1) + ' semanas até a prova</p>' +
        '<div class="ln"><span class="k">Volume semana 1</span><span class="v">' + r.vol1 + ' km</span></div>' +
        '<div class="ln"><span class="k">Volume semana 2</span><span class="v">' + r.vol2 + ' km</span></div>' +
        '<div class="ln"><span class="k">Longão</span><span class="v">' +
          (r.longo2 > 0 ? r.longo1 + ' e ' + r.longo2 + ' km' : r.longo1 + ' km') + '</span></div>' +
        '<div class="ln"><span class="k">Sessão de qualidade</span><span class="v">' +
          {vo2:'VO₂', limiar:'Limiar', mp:'Ritmo de prova', soltura:'Soltura'}[r.qual] + '</span></div>' +
        (r.limiar ? '<div class="ln"><span class="k">Ritmo de limiar</span><span class="v">' +
          mmss(r.limiar.de) + ' → ' + mmss(r.limiar.para) + '/km</span></div>' : '') +
        '<p class="porque">Composto em ' + fmtCurto(B.ini) + ' a partir dos seus ' + r.leitura.km +
        ' km reais das duas semanas anteriores' +
        (r.leitura.aderencia != null ? ' (' + r.leitura.aderencia + '% do previsto)' : '') +
        '. O próximo bloco será composto em <b>' + fmtCurto(iso(addD(dt(B.fim), 1))) + '</b>.</p></div>';
    }
    /* sem bloco: hora de compor */
    var prev = gerarBloco(iso(HOJE)).resumo;
    return '<div class="blk"><div class="cab">Hora de compor</div>' +
      '<h3>Suas próximas 2 semanas</h3>' +
      '<p class="per">Fase: ' + prev.fase + ' · ' + prev.semanas.toFixed(1) + ' semanas até 18/10</p>' +
      '<div class="ln"><span class="k">Você correu na quinzena</span><span class="v">' + prev.leitura.km + ' km</span></div>' +
      '<div class="ln"><span class="k">Média semanal real</span><span class="v">' + prev.leitura.semanal + ' km</span></div>' +
      '<div class="ln"><span class="k">Maior longo recente</span><span class="v">' + prev.leitura.longo + ' km</span></div>' +
      '<div class="ln"><span class="k">Volume proposto</span><span class="v">' + prev.vol1 + ' e ' + prev.vol2 + ' km</span></div>' +
      '<div class="ln"><span class="k">Longão proposto</span><span class="v">' +
        (prev.longo2 > 0 ? prev.longo1 + ' e ' + prev.longo2 + ' km' : prev.longo1 + ' km') + '</span></div>' +
      '<p class="porque">O volume parte da sua média real, não do que estava no papel, e sobe no máximo 10%. ' +
      'O longão respeita três tetos: 1,15× o seu maior recente, o teto da fase e 32 km em absoluto.</p>' +
      '<button class="bt" data-blk="criar">Compor as próximas 2 semanas</button></div>';
  }

  function injetar(){
    var el = document.getElementById('v-kpi');
    if(!el || el.querySelector('.blk')) return;
    el.insertAdjacentHTML('afterbegin', cartao());
    var b = el.querySelector('[data-blk]');
    if(b) b.onclick = function(){ criar(iso(HOJE)) };
  }
  /* Eu embrulhava window.bqKPI.render — e quem desenha a aba e uma
     funcao INTERNA da parte 25; bqKPI.render e so um atalho de console,
     que o app nunca chama. O cartao nunca teve chance de ser injetado.
     Agora entro por irPara, que e por onde a aba KPI de fato aparece,
     e tambem observo a aba caso ela seja redesenhada por outro caminho. */
  var kpiApp = window.bqKPI && window.bqKPI.render;
  if(typeof kpiApp === 'function'){
    window.bqKPI.render = function(){
      var r = kpiApp.apply(this, arguments);
      try{ injetar() }catch(e){ console.warn('bloco:', e && e.message) }
      return r;
    };
  }
  var irApp32 = window.irPara;
  if(typeof irApp32 === 'function'){
    window.irPara = function(v){
      var r = irApp32.apply(this, arguments);
      if(v === 'kpi') setTimeout(function(){
        try{ injetar() }catch(e){ console.warn('bloco:', e && e.message) }
      }, 30);
      return r;
    };
  }
  setTimeout(function(){
    try{
      var alvo = document.getElementById('v-kpi');
      if(alvo && window.MutationObserver){
        new MutationObserver(function(){
          if(!alvo.querySelector('.blk')){ try{ injetar() }catch(e){} }
        }).observe(alvo, {childList:true});
      }
      if(ST.aba === 'kpi') injetar();
    }catch(e){}
  }, 4600);

  /* primeiro bloco automatico, se ainda nao existe nenhum */
  setTimeout(function(){
    try{ if(!blocoAtual()) criar(iso(HOJE)) }catch(e){ console.warn('bloco:', e && e.message) }
  }, 4200);

  window.bqBloco = {
    atual: blocoAtual,
    criar: criar,
    prever: function(){ return gerarBloco(iso(HOJE)).resumo },
    lista: function(){
      var B = blocoAtual(); if(!B) return 'nenhum bloco';
      var D = ['','seg','ter','qua','qui','sex','sáb','dom'];
      return Object.keys(B.sessoes).sort().map(function(k){
        var s = B.sessoes[k];
        return k + ' ' + D[dow(dt(k))] + '  ' + s.mod + '  ' + s.foco + '  ' +
               (s.km ? s.km + ' km' : s.min + ' min');
      });
    },
    zerar: function(){ delete ST.bloco; try{ rebuild(); renderTudo() }catch(e){} return 'zerado' }
  };
});



/* ═══ 33. A FORÇA TAMBEM OBEDECE AO BLOCO ═══

   DEFEITO QUE ISTO CONSERTA, encontrado por voce: depois de trocar o
   plano fixo pelos blocos de 14 dias, corrida e bike sumiram do futuro
   mas a ACADEMIA continuou aparecendo ate 18/10.

   POR QUE ACONTECEU. As sessoes de academia nao vivem no plano. Elas
   sao "segundo treino do dia" — ST.extras — e foram semeadas de uma so
   vez, la em agosto, para todas as datas do plano antigo. Meu gerador
   de blocos reescreve ST.plano e nunca encostou em ST.extras. Duas
   estruturas diferentes, e eu so tinha lembrado de uma.

   E havia a outra metade: o bloco marca forca na terca e na quinta
   (campo `forca`), mas ninguem transformava essa marca em sessao. A
   intencao existia no papel e nao chegava na tela.

   O QUE ESTA PARTE FAZ, toda vez que um bloco e composto:

   1. Apaga as sessoes de academia semeadas automaticamente que estejam
      ALEM do bloco. So as automaticas — as que voce criou a mao ficam.
   2. Semeia academia nos dias do bloco que pedem forca: terca (pernas e
      core) e quinta (quadril e core).

   O QUE ELA NAO FAZ: nao mexe no passado, e nao apaga nada que voce
   tenha incluido manualmente. A distincao e o campo `sessao` comecando
   com "BQ_", que so o semeador automatico usa.
   ══════════════════════════════════════════════════════════════════ */

PARTE('força obedece ao bloco', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(!window.bqBloco) throw new Error('sem gerador de blocos');

  /* BQ_BASE_A e companhia nao existem: o index.html so tem PERNAS e
     COSTAS. A guarda do semear batia sempre e esta parte nunca semeou
     nada — so apagava. */
  var MAPA = { base_a:'PERNAS', base_b:'COSTAS',
               pico_a:'PERNAS', pico_b:'COSTAS', manut:'PERNAS' };

  function ehAuto(x){
    return !!(x && x.mod === 'forca' &&
              (x.auto === true || String(x.sessao || '').indexOf('BQ_') === 0));
  }

  /* 1. limpa a academia automatica que ficou solta alem do bloco */
  function limpar(fim){
    if(!ST.extras) return 0;
    /* SEM BLOCO, NAO SE APAGA NADA. Com fim nulo a guarda abaixo nunca
       protegia ninguem e o laco apagava toda a academia futura. */
    if(!fim) return 0;
    var hoje = iso(HOJE), n = 0;
    Object.keys(ST.extras).forEach(function(k){
      if(k < hoje) return;                    /* passado nao se mexe */
      if(fim && k <= fim) return;             /* dentro do bloco, fica */
      if(!ehAuto(ST.extras[k])) return;       /* criada por voce, fica */
      delete ST.extras[k];
      if(window.bqApagar) window.bqApagar('extras', k);
      n++;
    });
    return n;
  }

  /* 2. semeia a academia que o bloco pediu */
  function semear(B){
    if(!B || !B.sessoes) return 0;
    ST.extras = ST.extras || {};
    var hoje = iso(HOJE), n = 0;
    Object.keys(B.sessoes).forEach(function(k){
      if(k < hoje) return;
      var s = B.sessoes[k];
      if(!s || !s.forca) return;
      var sid = MAPA[s.forca];
      if(typeof sessaoAcademiaDe === 'function'){
        try{ sid = sessaoAcademiaDe(k) || sid }catch(e){}
      }
      if(!sid || typeof SESSOES_ACADEMIA !== 'object' || !SESSOES_ACADEMIA[sid]){
        console.warn('força: sessão "' + sid + '" não existe — não semeio o que não sei montar');
        return;
      }
      var existe = ST.extras[k];
      if(existe && !ehAuto(existe)) return;   /* voce pos algo ai: respeito */
      /* NAO derruba lapide aqui: semear e automatico, cancelar e seu.
         A parte 42 barra a escrita se o dia estiver cancelado. */
      ST.extras[k] = { id: 'x' + k, data: k, mod: 'forca', foco: 'forca',
                       sessao: sid, titulo: SESSOES_ACADEMIA[sid].nome,
                       min: 45, extra: true, auto: true };
      n++;
    });
    return n;
  }

  function sincronizar(){
    var B = window.bqBloco.atual();
    if(!B){
      console.warn('força: sem bloco vigente — não mexo na academia');
      return { semeadas: 0, removidas: 0, motivo: 'sem bloco' };
    }
    var fora = limpar(B.fim);
    var novas = semear(B);
    if(fora || novas){
      console.log('força ajustada ao bloco: ' + novas + ' semeadas, ' + fora + ' removidas do futuro');
      try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
      try{ persistir() }catch(e){}
    }
    return { semeadas: novas, removidas: fora };
  }

  /* roda junto com a criacao do bloco */
  var criarApp = window.bqBloco.criar;
  window.bqBloco.criar = function(){
    var B = criarApp.apply(this, arguments);
    try{ sincronizar() }catch(e){ console.warn('força/bloco:', e && e.message) }
    return B;
  };

  /* e uma vez no arranque, para arrumar o que ficou de antes */
  setTimeout(function(){ try{ sincronizar() }catch(e){} }, 5200);

  window.bqForcaBloco = {
    sincronizar: sincronizar,
    lista: function(){
      var D = ['','seg','ter','qua','qui','sex','sáb','dom'];
      return Object.keys(ST.extras || {}).sort()
        .filter(function(k){ return k >= iso(HOJE) })
        .map(function(k){
          var x = ST.extras[k];
          return k + ' ' + D[dow(dt(k))] + '  ' + (x.titulo || x.mod) +
                 (ehAuto(x) ? '  (automática)' : '  (sua)');
        });
    }
  };
});


/* ═══ 34. RITMOS QUE EXISTEM ═══

   O DEFEITO, encontrado por voce: o app pediu 5 km continuos a
   "4:25 a 4:55/km" com o coracao em "112 a 125 bpm". As duas
   instrucoes se contradizem, e nenhuma das duas servia.

   AUTOPSIA. Sao tres defeitos somados, nao um:

   1) A ZONA DE VO2 ERA UMA SUBTRACAO, NAO UMA MEDIDA.
      O index.html define  vo2 = [limiar-45, limiar-25].
      Com o limiar em 5:10/km isso da 4:25 a 4:45/km.
      O seu quilometro mais rapido ja registrado em treino e 5:28/km
      (9,9 km em 13/08, FC 133). Uma faixa que nenhum esforco medido
      sustenta nao e uma zona de treino: e uma conta.

   2) O RITMO E A FREQUENCIA CARDIACA VINHAM DE ZONAS DIFERENTES.
      O ritmo mostrado era da zona de VO2. A FC mostrada, 112 a 125,
      e 68 a 76% da FC maxima — a zona de RODAGEM FACIL. Duas zonas
      no mesmo cartao, e nada no app conferia se combinavam.

   3) UM RITMO DE TIRO FOI COLADO NUM ESFORCO CONTINUO.
      Meu gerador de blocos calcula a duracao da sessao como
      km x ritmo_do_foco, ou seja: trata os 5 km inteiros como se
      fossem corridos no ritmo de VO2. Ritmo de VO2 so existe dentro
      de repeticoes de 2 a 4 minutos. Como bloco continuo de 5 km,
      e ritmo de PROVA de 5 km, nao de treino.

   O QUE ESTA PARTE FAZ.

   a) UM SO DONO PARA O LIMIAR. Antes, sete lugares diferentes
      escreviam PERFIL.paceLimiar: uma constante fixa 305 que eu
      deixei no fix.js, a regra "mediana - 65 s" do index.html, o
      questionario, a recalibracao e o gerador de blocos. Nenhum
      olhava para o outro. Agora existe bqRitmo.limiar(), calculado
      pela formula de Riegel sobre os seus TRES melhores esforcos
      reais de 8 km ou mais, e reafirmado depois de cada sincronia.

   b) TRAVA CONTRA O IMPOSSIVEL. O limiar nunca pode ficar mais
      rapido que o quilometro mais rapido que voce ja correu menos
      10 s. Se a conta der um numero que os seus dados nao sustentam,
      a trava vence a conta.

   c) ZONAS ANCORADAS EM PREVISAO DE PROVA, nao em subtracao. O
      ritmo de maratona vem do Riegel para 42,195 km. O ritmo de VO2
      vem do Riegel para 3 a 5 km. Acrescentei a zona de RITMO DE
      MARATONA, que faltava e e a mais importante para 18/10.

   d) PORTAO DE COERENCIA. Antes de qualquer etapa aparecer na tela,
      se ela mostra um ritmo E uma FC, as duas passam a sair da MESMA
      zona. Se divergirem, a FC e corrigida e o console avisa. Vale
      para as etapas de hoje e para qualquer parte que eu escrever
      depois — o portao fica no caminho de todas.

   e) TIRO NUNCA VIRA CONTINUO. Sessao de vo2, limiar ou mp passa a
      ter ritmo MEDIO da sessao (aquecimento + parte forte + volta a
      calma) no campo pace, e o ritmo forte aparece so no texto, com
      a duracao das repeticoes escrita.

   NO CONSOLE:
     bqRitmo.mostrar()     — o limiar, de onde veio, e a tabela de zonas
     bqRitmo.evidencia()   — os esforcos que sustentam o numero
     bqRitmo.coerencia()   — quantas incoerencias foram barradas
   ══════════════════════════════════════════════════════════════════ */

PARTE('ritmos que existem', function(){
  if(typeof PERFIL !== 'object') throw new Error('sem PERFIL');

  var MIN_LIM = 270;          /* 4:30/km — piso absoluto, ninguem passa  */
  var MAX_LIM = 480;          /* 8:00/km — teto absoluto                 */
  var JANELA  = 120;          /* dias de historico que valem como prova  */
  var barrados = [];          /* incoerencias barradas, para auditoria   */

  function riegel(km, seg, d){ return seg * Math.pow(d / km, 1.06) }
  function segDe(r){ return (isFinite(r.dur) && r.dur > 0) ? r.dur : r.km * r.pace }

  /* ── 1. os esforcos que podem sustentar um limiar ── */
  function esforcos(){
    var lista = (typeof ST === 'object' && Array.isArray(ST.runs)) ? ST.runs : [];
    return lista.filter(function(r){
      return r && r.mod === 'corrida' && !r.walk
          && r.km >= 8 && r.d <= JANELA
          && isFinite(r.pace) && r.pace > 200 && r.pace < 700;
    });
  }

  /* ── 2. o limiar, com trava ── */
  var _cache = null, _cacheN = -1;

  function medir(){
    var E = esforcos();
    if(E.length < 1) return null;

    var proj = E.map(function(r){
      var seg = segDe(r);
      var dh  = r.km * Math.pow(3600 / seg, 1 / 1.06);   /* km em 1 hora */
      return { L: 3600 / dh, km: r.km, pace: r.pace, d: r.d, fc: r.fc, seg: seg };
    }).sort(function(a, b){ return a.L - b.L });          /* melhor primeiro */

    var top = proj.slice(0, Math.min(3, proj.length));
    var L   = top.reduce(function(a, b){ return a + b.L }, 0) / top.length;

    /* TRAVA: mais rapido que o km mais rapido ja medido, menos 10 s, nao existe */
    var todas = (typeof ST === 'object' && Array.isArray(ST.runs)) ? ST.runs : [];
    var rapidas = todas.filter(function(r){
      return r && r.mod === 'corrida' && !r.walk && r.km >= 5
          && r.d <= JANELA && isFinite(r.pace) && r.pace > 200;
    }).map(function(r){ return r.pace });
    var maisRapido = rapidas.length ? Math.min.apply(null, rapidas) : null;

    var travou = false;
    if(maisRapido != null && L < maisRapido - 10){ L = maisRapido - 10; travou = true }
    if(L < MIN_LIM){ L = MIN_LIM; travou = true }
    if(L > MAX_LIM){ L = MAX_LIM; travou = true }

    return { L: Math.round(L), base: top[0], top: top,
             maisRapido: maisRapido, travou: travou, n: E.length };
  }

  function evid(){
    var n = (typeof ST === 'object' && Array.isArray(ST.runs)) ? ST.runs.length : 0;
    if(!_cache || _cacheN !== n){ _cache = medir(); _cacheN = n }
    return _cache;
  }

  function limiar(){
    var e = evid();
    if(e) return e.L;
    var p = +PERFIL.paceLimiar;
    return isFinite(p) && p >= MIN_LIM && p <= MAX_LIM ? p : 340;
  }

  /* previsao de prova a partir do melhor esforco real */
  function prev(d){
    var e = evid();
    if(!e || !e.base) return null;
    return riegel(e.base.km, e.base.seg, d) / d;
  }

  /* ── 3. as zonas, refeitas ── */
  var FC_PCT = {
    rec : [0.60, 0.68], faci: [0.68, 0.76], long: [0.70, 0.80],
    mp  : [0.80, 0.86], lim : [0.86, 0.91], vo2 : [0.91, 0.97]
  };

  function novasZonas(){
    var L = limiar(), F = +PERFIL.fcMax || 163;
    var p3 = prev(3), p5 = prev(5), p42 = prev(42.195);
    var r  = function(x){ return Math.round(x) };
    var fc = function(k){ return [r(F * FC_PCT[k][0]), r(F * FC_PCT[k][1])] };

    /* ritmo de maratona: previsao real; se nao houver, limiar + 22 */
    var mp = p42 ? [r(p42) - 6, r(p42) + 6] : [L + 16, L + 28];
    /* VO2: previsao de 3 a 5 km. Nunca mais rapido que a previsao de 3 km. */
    var vo = (p3 && p5) ? [r(p3) - 5, r(p5)] : [L - 26, L - 12];
    if(vo[1] <= vo[0]) vo[1] = vo[0] + 12;

    return {
      rec :{n:'Recuperação',       s:'REC', p:[L+95, L+125], fc:fc('rec'),
            d:'Conversa fluida o tempo todo'},
      faci:{n:'Rodagem fácil',     s:'FÁC', p:[L+45, L+75],  fc:fc('faci'),
            d:'Base aeróbica, onde mora o volume'},
      long:{n:'Longo',             s:'LON', p:[L+35, L+65],  fc:fc('long'),
            d:'Resistência, o treino mais importante'},
      mp  :{n:'Ritmo de maratona', s:'MP',  p:mp,            fc:fc('mp'),
            d:'O ritmo do dia 18 de outubro. Firme, mas você fala frases curtas'},
      lim :{n:'Limiar',            s:'LIM', p:[L-8, L+12],   fc:fc('lim'),
            d:'Confortavelmente difícil, 20 a 25 min sustentáveis'},
      vo2 :{n:'VO₂ máx',           s:'VO₂',p:vo,             fc:fc('vo2'),
            d:'Só dentro de tiros de 2 a 4 min. Nunca como bloco contínuo'}
    };
  }

  /* ── 4. assumir o comando ── */
  function assumir(motivo){
    var L = limiar();
    if(PERFIL.paceLimiar !== L){
      var antes = PERFIL.paceLimiar;
      PERFIL.paceLimiar = L;
      console.log('ritmo: limiar ' + mmss(antes) + ' -> ' + mmss(L) + '/km  (' + motivo + ')');
    }
    try{ Z = zonas() }catch(e){}
  }

  /* zonas() passa a ser minha */
  window.zonas = novasZonas;
  try{ Z = zonas() }catch(e){}
  assumir('posse inicial');

  /* depois de cada sincronia o index.html reescreve o limiar pela regra
     "mediana - 65 s". Essa regra supoe que a sua mediana e rodagem facil,
     e a sua nao e: 5:48/km com FC 133 a 138 e ritmo firme, nao facil.
     Por isso ela erra por excesso, e por isso eu reafirmo depois dela. */
  if(typeof window.absorver === 'function'){
    var absApp = window.absorver;
    window.absorver = function(){
      var r = absApp.apply(this, arguments);
      try{ _cache = null; _cacheN = -1; assumir('depois da sincronia') }catch(e){}
      return r;
    };
  }

  /* ── 5. portao de coerencia ── */
  function pcs(s){ return Math.floor(s/60) + ':' + String(Math.round(s%60)).padStart(2,'0') }

  function paceDoTexto(t){                  /* le "5:20–5:40/km" ou "5:44/km" */
    var m = String(t).match(/(\d+):(\d{2})\D+(\d+):(\d{2})/);
    if(m) return [(+m[1])*60 + (+m[2]), (+m[3])*60 + (+m[4])];
    m = String(t).match(/(\d+):(\d{2})/);
    if(m){ var v = (+m[1])*60 + (+m[2]); return [v, v] }
    return null;
  }

  function zonaDoPace(faixa){
    var chaves = Object.keys(Z), melhor = null, menor = 1e9;
    var mid = (faixa[0] + faixa[1]) / 2;
    chaves.forEach(function(k){
      var z = Z[k]; if(!z || !z.p) return;
      /* casamento exato da faixa ganha de tudo */
      if(z.p[0] === faixa[0] && z.p[1] === faixa[1]){ melhor = k; menor = -1; return }
      if(menor === -1) return;
      var zm = (z.p[0] + z.p[1]) / 2, d = Math.abs(zm - mid);
      if(d < menor){ menor = d; melhor = k }
    });
    return melhor;
  }

  function conferir(et){
    if(!et || !Array.isArray(et.tags)) return et;
    var tp = null, tf = null;
    et.tags.forEach(function(t){
      if(!t) return;
      if(t.c === 'z'  && tp === null) tp = t;
      if(t.c === 'hr' && tf === null) tf = t;
    });
    if(!tp || !tf) return et;

    var faixa = paceDoTexto(tp.t);
    if(!faixa) return et;
    var zk = zonaDoPace(faixa);
    if(!zk || !Z[zk] || !Z[zk].fc) return et;

    var certo = Z[zk].fc[0] + '–' + Z[zk].fc[1] + ' bpm';
    var atual = String(tf.t).match(/(\d+)\D+(\d+)/);
    if(atual){
      var a0 = +atual[1], a1 = +atual[2];
      /* tolerancia de 2 bpm por arredondamento */
      if(Math.abs(a0 - Z[zk].fc[0]) <= 2 && Math.abs(a1 - Z[zk].fc[1]) <= 2) return et;
    }
    barrados.push({ etapa: et.t, pace: tp.t, fcErrada: tf.t, fcCerta: certo, zona: Z[zk].n });
    if(barrados.length <= 12)
      console.warn('coerência: "' + et.t + '" mostrava ' + tp.t + ' (' + Z[zk].n +
                   ') com ' + tf.t + '. Corrigido para ' + certo + '.');
    tf.t = certo;
    return et;
  }

  if(typeof window.etapas === 'function'){
    var etApp = window.etapas;
    window.etapas = function(){
      var r = etApp.apply(this, arguments);
      try{ if(Array.isArray(r)) r.forEach(conferir) }catch(e){ console.warn('coerência:', e && e.message) }
      return r;
    };
  }

  /* ── 6. tiro nunca vira continuo ── */
  var QUAL = {
    /* fracao da sessao no ritmo forte, e como descrever */
    /* O volume forte sai da propria sessao, nao de um numero fixo. Se a
       sessao for curta, o tiro encurta em vez de estourar a distancia —
       era assim que "4 x 800 m" acabava dentro de uma sessao de 5 km. */
    vo2:    { frac: 0.35, txt: function(km, z){
      var qv = Math.min(6, km * 0.35);                 /* km no ritmo forte */
      var n8 = Math.round(qv / 0.8);
      var m, n;
      if(n8 >= 4){ m = 800; n = Math.min(8, n8) }
      else if(qv >= 1.2){ m = 600; n = Math.max(3, Math.min(6, Math.round(qv / 0.6))) }
      else { m = 400; n = Math.max(4, Math.min(8, Math.round(qv / 0.4))) }
      var seg = Math.round(m / 1000 * (z.vo2.p[0] + z.vo2.p[1]) / 2);
      var dur = Math.floor(seg / 60) + ' min ' + (seg % 60) + ' s';
      return n + ' tiros de ' + m + ' m em ' + pcs(z.vo2.p[0]) + '–' + pcs(z.vo2.p[1]) +
             '/km (cerca de ' + dur + ' cada), FC subindo até ' + z.vo2.fc[0] + '–' +
             z.vo2.fc[1] + ' bpm, com ' + (m >= 800 ? '3' : '2') +
             ' min de trote leve entre eles. Aquecimento e volta à calma em ' +
             pcs(z.faci.p[0]) + '–' + pcs(z.faci.p[1]) + '/km. ' +
             'Este ritmo só existe dentro dos tiros — nunca corra os ' + km +
             ' km inteiros nele.' } },
    limiar: { frac: 0.45, txt: function(km, z){
      return 'Bloco contínuo de 20 a 25 min em ' + pcs(z.lim.p[0]) + '–' + pcs(z.lim.p[1]) +
             '/km, FC ' + z.lim.fc[0] + '–' + z.lim.fc[1] + ' bpm. Confortavelmente difícil: ' +
             'você fala 3 ou 4 palavras, não uma frase. Antes e depois, ' +
             pcs(z.faci.p[0]) + '–' + pcs(z.faci.p[1]) + '/km.' } },
    mp:     { frac: 0.70, txt: function(km, z){
      return Math.round(km * 0.7) + ' km em ritmo de maratona, ' + pcs(z.mp.p[0]) + '–' +
             pcs(z.mp.p[1]) + '/km, FC ' + z.mp.fc[0] + '–' + z.mp.fc[1] + ' bpm. ' +
             'É o ritmo que você quer sentir no dia 18. O restante em ' +
             pcs(z.faci.p[0]) + '–' + pcs(z.faci.p[1]) + '/km.' } }
  };

  function honesto(s){
    if(!s || s.mod !== 'corrida') return s;
    var q = QUAL[s.foco];
    var km = +s.km || 0;
    if(!km) return s;

    if(!q){
      /* sessao continua: ritmo da propria zona, sem invencao */
      var zk = s.foco === 'longo' ? 'long' : (s.foco === 'soltura' ? 'rec' : 'faci');
      var z  = Z[zk];
      if(z){
        var medio = Math.round((z.p[0] + z.p[1]) / 2);
        s.pace = pcs(medio);
        s.min  = Math.round(km * medio / 60);
        /* o texto tambem: um ritmo velho escrito no detalhe continuaria
           contradizendo o campo, e e o texto que voce le no relogio */
        if(typeof s.detalhe === 'string' && /\d+:\d{2}\s*\/?\s*km/.test(s.detalhe))
          s.detalhe = s.detalhe.replace(/\d+:\d{2}(\s*[–\-a]\s*\d+:\d{2})?\s*\/?\s*km/g,
                        pcs(z.p[0]) + '–' + pcs(z.p[1]) + '/km');
      }
      return s;
    }

    /* sessao de qualidade: pace do CAMPO e a media da sessao inteira */
    var zq = Z[s.foco === 'vo2' ? 'vo2' : (s.foco === 'limiar' ? 'lim' : 'mp')];
    var zf = Z.faci;
    if(!zq || !zf) return s;
    var pq = (zq.p[0] + zq.p[1]) / 2, pf = (zf.p[0] + zf.p[1]) / 2;
    var medio = Math.round(q.frac * pq + (1 - q.frac) * pf);

    s.pace    = pcs(medio);
    s.min     = Math.round(km * medio / 60) + (s.foco === 'vo2' ? 6 : 4);
    s.detalhe = q.txt(km, Z);
    s.bqRitmo = true;
    return s;
  }

  function arrumar(p){
    if(!p) return p;
    try{
      Object.keys(p).forEach(function(k){
        if(k < iso(HOJE)) return;            /* passado nao se reescreve */
        if(p[k] && p[k].prova) return;       /* a prova tem ritmo proprio */
        honesto(p[k]);
      });
    }catch(e){ console.warn('ritmo/plano:', e && e.message) }
    return p;
  }

  if(typeof window.gerarPlano === 'function'){
    var gerApp = window.gerarPlano;
    window.gerarPlano = function(){ return arrumar(gerApp.apply(this, arguments)) };
  }
  if(window.bqBloco && typeof window.bqBloco.criar === 'function'){
    var criarApp = window.bqBloco.criar;
    window.bqBloco.criar = function(){
      var B = criarApp.apply(this, arguments);
      try{ if(B && B.sessoes) Object.keys(B.sessoes).forEach(function(k){ honesto(B.sessoes[k]) }) }catch(e){}
      try{ arrumar(ST.plano) }catch(e){}
      return B;
    };
  }

  /* ── 7. aviso sobre a FC maxima ── */
  /* mapAtividade nao guarda a FC maxima da sessao — so a media. Ela existe
     no dado bruto que o sync grava, e e de la que eu leio. */
  function fcMaxSuspeita(){
    var brutas = (typeof RAW === 'object' && RAW && Array.isArray(RAW.atividades))
                 ? RAW.atividades : [];
    var corte = iso(addD(HOJE, -JANELA));
    var vistas = brutas.filter(function(a){
      return a && a.data && String(a.data).slice(0,10) >= corte
          && String(a.esporte||'').toLowerCase() === 'corrida'
          && +a.fcMax > 100 && +a.fcMax < 230;
    }).map(function(a){ return +a.fcMax });
    if(!vistas.length) return null;
    var obs = Math.max.apply(null, vistas), F = +PERFIL.fcMax || 163;
    return obs > F * 0.955 ? { obs: obs, cfg: F } : null;
  }

  /* ── 8. o que dizer no console ── */
  window.bqRitmo = {
    limiar: limiar,
    zonas : function(){ return Z },
    evidencia: function(){
      var e = evid();
      if(!e) return 'sem corridas de 8 km ou mais nos últimos ' + JANELA + ' dias';
      return e.top.map(function(t){
        return 'há ' + t.d + ' dias · ' + t.km.toFixed(1) + ' km em ' + mmss(t.pace) +
               '/km' + (isFinite(t.fc) ? ' · FC ' + Math.round(t.fc) : '') +
               '  ->  limiar ' + mmss(Math.round(t.L));
      }).concat([
        'quilômetro mais rápido medido: ' + (e.maisRapido ? mmss(e.maisRapido) + '/km' : '—'),
        'trava aplicada: ' + (e.travou ? 'sim' : 'não'),
        'limiar adotado: ' + mmss(e.L) + '/km'
      ]);
    },
    coerencia: function(){ return barrados.length ? barrados : 'nenhuma incoerência encontrada' },
    mostrar: function(){
      var L = limiar(), out = ['limiar: ' + mmss(L) + '/km', ''];
      ['rec','faci','long','mp','lim','vo2'].forEach(function(k){
        var z = Z[k]; if(!z) return;
        out.push(z.n.padEnd(20) + (mmss(z.p[0]) + '–' + mmss(z.p[1]) + '/km').padEnd(18) +
                 z.fc[0] + '–' + z.fc[1] + ' bpm');
      });
      var p = fcMaxSuspeita();
      if(p) out.push('', 'atenção: FC máxima configurada ' + p.cfg + ' bpm, mas o relógio já ' +
                         'registrou ' + p.obs + ' bpm. A sua máxima real é provavelmente mais alta, ' +
                         'e todas as faixas de FC saem baixas por causa disso.');
      return out.join('\n');
    }
  };

  /* refaz o que estava na tela com os numeros certos */
  setTimeout(function(){
    try{
      _cache = null; _cacheN = -1;
      assumir('após carregar os dados');
      if(ST.cache) ST.cache = {};
      arrumar(ST.plano);
      if(typeof rebuild === 'function') rebuild();
      if(typeof renderTudo === 'function') renderTudo();
      var p = fcMaxSuspeita();
      if(p) console.warn('FC máxima configurada ' + p.cfg + ', observada ' + p.obs +
                         '. Confira em Configurações — as faixas de FC dependem dela.');
    }catch(e){ console.warn('ritmo/boot:', e && e.message) }
  }, 6000);
});


/* ═══ 35. PLANILHA DE TREINOS ═══

   O QUE VOCE PEDIU: "nao gosto do visual dos meus treinos, nao chamam
   a atencao e sao todas as fases da mesma cor. Ha como melhorar isso
   produzindo como se fosse uma planilha mesmo?"

   DE ONDE VEM A COR. Nao inventei paleta. A convencao vem de Jack
   Daniels, que classifica todo treino de corrida em cinco intensidades
   — E (easy), M (marathon), T (threshold), I (interval), R (repetition)
   — e e a base de praticamente toda planilha de treinador serio. Renato
   Canova usa quatro familias com a mesma ideia (regeneracao, fundamental,
   especial, especifico). O que as duas escolas tem em comum e o que
   importa aqui: a intensidade e a informacao que precisa ser lida de
   relance, antes de qualquer numero.

   Por isso a cor sai da ZONA, nao da modalidade:

     Recuperação      cinza-azul   o treino que quase nao conta
     Rodagem fácil    verde        onde mora 80% do volume
     Longo            limão        a sessao mais importante da semana
     Ritmo maratona   âmbar        o ritmo do dia 18/10
     Limiar           laranja      confortavelmente dificil
     VO₂ máx          vermelho     forte, so dentro de tiros
     Tiros curtos     violeta      o R de Daniels, neuromuscular
     Bike             azul         volume sem impacto
     Natação          turquesa
     Força            cinza        trabalho de suporte, cor discreta de proposito
     Prova            branco       a linha que interessa

   Verde a vermelho segue a ordem da intensidade. Nao e decoracao: se a
   sua semana esta cheia de laranja e vermelho, voce ve isso sem ler
   nada, e sabe que o problema existe antes de sentir na perna.

   O QUE A PLANILHA MOSTRA QUE A LISTA ANTIGA NAO MOSTRAVA:

   1. As duas semanas inteiras de uma vez, dia por dia, uma linha cada.
   2. Total de km e de horas por semana, na linha de fechamento.
   3. A REPARTICAO 80/20 de cada semana — quanto do volume foi leve e
      quanto foi forte. E o unico numero que quase todo corredor de 60+
      erra, e o app nunca te mostrou. Verde acima de 75% e o alvo.
   4. Se o treino foi feito, esta na coluna da direita.
   5. A fase do ciclo aparece na barra de cada semana.

   COMO FUNCIONA. Toque numa linha e o dia abre embaixo, com as seis
   etapas, exatamente como antes — nada do que ja existia foi jogado
   fora. A faixa de um dia so (a sessbar) sai de cena, porque a linha
   da planilha faz o mesmo trabalho e melhor.

   NO IPHONE. A coluna do dia fica congelada e o resto rola para o lado.
   Os alvos de toque tem 44 px de altura, que e o minimo da Apple.

   NO CONSOLE:
     bqPlanilha.desligar()   — volta a lista antiga
     bqPlanilha.ligar()
     bqPlanilha.dados()      — as linhas em texto, para conferir
   ══════════════════════════════════════════════════════════════════ */

PARTE('planilha de treinos', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof q !== 'function') throw new Error('sem q()');

  var OFF = 'bq.planilha.off';
  var ligado = function(){ try{ return localStorage.getItem(OFF) !== '1' }catch(e){ return true } };

  /* ── a paleta, por zona de intensidade ── */
  var ZC = {
    prova   : { n:'Prova',           c:'#FFFFFF', o:0 },
    soltura : { n:'Recuperação',     c:'#7C93A8', o:1 },
    rec     : { n:'Recuperação',     c:'#7C93A8', o:1 },
    facil   : { n:'Rodagem fácil',   c:'#3FD98A', o:2 },
    longo   : { n:'Longo',           c:'#C9F24E', o:3 },
    mp      : { n:'Ritmo maratona',  c:'#F5C544', o:4 },
    progressivo:{n:'Progressivo',    c:'#F5C544', o:4 },
    limiar  : { n:'Limiar',          c:'#F79256', o:5 },
    tempo   : { n:'Limiar',          c:'#F79256', o:5 },
    vo2     : { n:'VO₂ máx',         c:'#F2685C', o:6 },
    intervalado:{n:'VO₂ máx',        c:'#F2685C', o:6 },
    fartlek : { n:'Fartlek',         c:'#F2685C', o:6 },
    tiros   : { n:'Tiros curtos',    c:'#C77DFF', o:7 },
    ladeira : { n:'Ladeiras',        c:'#C77DFF', o:7 },
    forca   : { n:'Força',           c:'#9AA5B8', o:8 },
    cross   : { n:'Cruzado',         c:'#4FA6F5', o:9 },
    brick   : { n:'Combinado',       c:'#4FA6F5', o:9 }
  };
  var MODC = { bike:{n:'Bike', c:'#4FA6F5'}, natacao:{n:'Natação', c:'#3FE0C4'},
               forca:{n:'Força', c:'#9AA5B8'} };

  /* focos que contam como volume FORTE na conta do 80/20 */
  var FORTE = { mp:1, limiar:1, tempo:1, vo2:1, intervalado:1, fartlek:1,
                tiros:1, ladeira:1, progressivo:1, prova:1 };

  function zonaDe(s){
    if(!s) return null;
    if(s.prova) return ZC.prova;
    if(s.mod && s.mod !== 'corrida') return MODC[s.mod] || ZC[s.foco] || MODC.forca;
    return ZC[s.foco] || ZC.facil;
  }

  /* ── estilo ── */
  var css = document.createElement('style');
  css.textContent = [
'#bqPl{background:var(--s1);border-radius:var(--r-lg);padding:0;margin-bottom:14px;overflow:hidden}',
'#bqPl .plhead{display:flex;align-items:baseline;justify-content:space-between;',
'  padding:15px 16px 11px;gap:10px}',
'#bqPl .plhead h2{margin:0;font-size:15px;font-weight:800;letter-spacing:-.02em}',
'#bqPl .plhead .sub{font-size:11px;color:var(--tx3);text-align:right;line-height:1.35}',
'#bqPl .rolo{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin}',
'#bqPl table{border-collapse:separate;border-spacing:0;width:100%;',
'  font-size:12.5px;table-layout:fixed}',
'#bqPl th:nth-child(3){text-align:right;padding-right:12px}',
'#bqPl td:nth-child(3){padding-right:12px}',
'#bqPl th{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;',
'  color:var(--tx3);text-align:right;padding:7px 9px;background:var(--s2);',
'  border-bottom:1px solid var(--line);white-space:nowrap;position:sticky;top:0;z-index:3}',
'#bqPl th.d,#bqPl th.t{text-align:left}',
'#bqPl td{padding:9px;min-height:46px;vertical-align:middle;border-bottom:1px solid rgba(34,43,54,.75);',
'  text-align:right;white-space:nowrap;color:var(--tx2)}',
'#bqPl td.t{white-space:normal}',
/* coluna do dia: congelada */
'#bqPl td.d,#bqPl th.d{position:sticky;left:0;z-index:2;width:74px;min-width:74px;',
'  background:var(--s1);text-align:left;padding-left:14px}',
'#bqPl th.d{z-index:4;background:var(--s2)}',
'#bqPl tr.sel td.d{background:var(--s3)}',
'#bqPl td.d .dw{font-size:9.5px;font-weight:800;letter-spacing:.08em;color:var(--tx3);',
'  text-transform:uppercase;display:block;line-height:1.1}',
'#bqPl td.d .dn{font-size:13px;font-weight:700;color:var(--tx2);display:block;line-height:1.25}',
'#bqPl tr.hoje td.d .dn{color:var(--acc)}',
'#bqPl tr.hoje td.d .dw{color:var(--acc)}',
/* a faixa de cor da zona */
'#bqPl td.t{text-align:left;width:auto;position:relative;padding-left:16px}',
'#bqPl td.t:before{content:"";position:absolute;left:0;top:6px;bottom:6px;width:4px;',
'  border-radius:0 3px 3px 0;background:var(--zc,transparent)}',
'#bqPl td.t .tt{display:block;font-weight:700;color:var(--tx);font-size:13.5px;',
'  line-height:1.3;white-space:normal;overflow-wrap:anywhere}',
'#bqPl td.t .zx{display:block;margin-top:3px;font-size:9.5px;font-weight:800;',
  'letter-spacing:.07em;text-transform:uppercase;color:#9AA5B8}',
'#bqPl td.t .zz{display:block;font-size:9.5px;font-weight:800;letter-spacing:.07em;',
'  text-transform:uppercase;color:var(--zc,var(--tx3));margin-top:1px;line-height:1.1}',
'#bqPl tr.linha{cursor:pointer;transition:background .12s}',
'#bqPl tr.linha:active{background:var(--s2)}',
'#bqPl tr.linha.pint td{background:var(--zw)}',
'#bqPl tr.linha.pint td.d{background:linear-gradient(90deg,var(--zw),var(--zw))}',
'#bqPl tr.sel.linha td{box-shadow:inset 0 -2px 0 var(--zc)}',
'#bqPl .num{font-family:"JetBrains Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;',
'  letter-spacing:-.03em;color:var(--tx)}',
'#bqPl .dim{color:var(--tx3)}',
'#bqPl td.ok{width:34px;min-width:34px;text-align:center;padding:0 4px}',
'#bqPl .vv{display:inline-block;width:17px;height:17px;border-radius:50%;line-height:17px;',
'  font-size:10px;font-weight:900;background:rgba(63,217,138,.16);color:var(--ok)}',
'#bqPl .oo{display:inline-block;width:17px;height:17px;border-radius:50%;',
'  border:1.5px dashed var(--line);box-sizing:border-box}',
'#bqPl .xx{display:inline-block;width:17px;height:17px;border-radius:50%;line-height:17px;',
'  font-size:10px;font-weight:900;background:rgba(242,104,92,.14);color:var(--bad)}',
/* barra de semana */
'#bqPl tr.sem td{background:var(--s2);height:auto;padding:8px 9px 7px;border-bottom:1px solid var(--line);',
'  border-top:1px solid var(--line)}',
'#bqPl tr.sem td.d{background:var(--s2);padding-left:14px}',
'#bqPl .semtag{font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--tx2)}',
'#bqPl .semfase{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;',
'  padding:2px 7px;border-radius:99px;background:var(--s3);color:var(--tx2);margin-left:7px}',
/* fechamento da semana */
'#bqPl tr.tot td{height:auto;padding:9px 9px 11px;background:var(--s2);border-bottom:2px solid var(--line);',
'  font-size:11px}',
'#bqPl tr.tot td.d{background:var(--s2);padding-left:14px;font-size:9.5px;font-weight:800;',
'  letter-spacing:.09em;text-transform:uppercase;color:var(--tx3)}',
'#bqPl .totn{font-family:"JetBrains Mono",ui-monospace,monospace;font-weight:800;font-size:13px;color:var(--tx)}',
'#bqPl .mixbar{display:flex;height:5px;border-radius:3px;overflow:hidden;background:var(--s3);',
'  margin-top:5px;min-width:110px}',
'#bqPl .mixbar i{display:block;height:100%}',
'#bqPl .mixtx{font-size:9.5px;font-weight:700;color:var(--tx3);letter-spacing:.02em}',
/* legenda */
'#bqPl .pleg{display:flex;flex-wrap:wrap;gap:5px 12px;padding:12px 16px 15px;border-top:1px solid var(--line)}',
'#bqPl .pleg span{display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--tx3);font-weight:600}',
'#bqPl .pleg i{width:9px;height:9px;border-radius:2.5px;flex:none}',
'#bqPl .plnota{padding:0 16px 15px;font-size:11px;color:var(--tx3);line-height:1.5}',
'#bqPl .plnota b{color:var(--tx2)}',
'@media(max-width:400px){',
'  #bqPl td.t{width:132px;min-width:132px}',
'  #bqPl table{min-width:404px;font-size:12px}',
'}'
  ].join('\n');
  document.head.appendChild(css);

  /* ── utilidades ── */
  var D3 = ['','SEG','TER','QUA','QUI','SEX','SÁB','DOM'];

  function alfa(hex, a){
    var h = String(hex).replace('#','');
    if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }
  function pcNum(s){                       /* pace da sessao, em texto */
    if(!s) return null;
    if(typeof s.pace === 'string' && s.pace.indexOf(':') > 0) return s.pace;
    if(s.km > 0 && s.min > 0) return mmss(Math.round(s.min * 60 / s.km));
    return null;
  }
  function distDe(s){
    if(!s) return null;
    if(s.foco === 'brick') return (+s.bikeKm || 0) + (+s.runKm || 0);
    if(s.metros) return +(s.metros / 1000).toFixed(2);
    return +s.km || null;
  }

  /* ── quais dias entram: a semana corrente + tudo o que o bloco tem ── */
  function dias(){
    var ini = addD(HOJE, -(dow(HOJE) - 1));          /* segunda desta semana */
    var chaves = Object.keys(ST.plano || {});
    var fim = addD(HOJE, 13);
    chaves.forEach(function(k){
      if(ST.plano[k] && ST.plano[k].prova) return;   /* a prova nao estica a tabela */
      var d = dt(k);
      if(d > fim && d <= addD(HOJE, 27)) fim = d;
    });
    var out = [], d = ini;
    while(d <= fim){ out.push(iso(d)); d = addD(d, 1) }
    /* corta folga solta no fim: uma segunda-feira sozinha abrindo uma
       "semana 3" vazia era feio e nao informava nada */
    while(out.length > 7){
      var u = out[out.length - 1];
      if((ST.plano && ST.plano[u]) || (ST.extras && ST.extras[u])) break;
      out.pop();
    }
    return out;
  }

  function faseDe(ks){
    for(var i = 0; i < ks.length; i++){
      var s = ST.plano[ks[i]];
      if(s && s.fase) return s.fase;
    }
    return '';
  }

  /* ── uma linha ── */
  function linha(k){
    var s = (typeof sessaoDe === 'function') ? sessaoDe(k) : (ST.plano[k] || null);
    var x = (typeof extraDe  === 'function') ? extraDe(k)  : (ST.extras && ST.extras[k]) || null;
    var d = dt(k), hoje = k === iso(HOJE), passado = k < iso(HOJE);
    var z = zonaDe(s) || (x ? (MODC[x.mod] || ZC.forca) : null);
    var cor = z ? z.c : null;

    var tit, sub;
    if(s){
      tit = s.titulo || (typeof MOD === 'object' && MOD[s.mod] ? MOD[s.mod].n : s.mod);
      sub = z.n;
      // juntar modalidade e foco dava "Forca · Forca" quando os dois eram o mesmo
      if(s.mod !== 'corrida' && ZC[s.foco] && !s.prova && ZC[s.foco].n !== z.n)
        sub = z.n + ' · ' + ZC[s.foco].n;
    } else if(x){
      tit = x.titulo || 'Academia';
      sub = 'Força';
    } else {
      tit = 'Descanso';
      sub = '';
    }

    var km   = distDe(s);
    var min  = s ? (+s.min || null) : null;
    var pace = s && s.mod === 'corrida' ? pcNum(s) : null;
    var xmin = x ? (+x.min || 45) : 0;

    var feito = s && typeof concluida === 'function' ? concluida(s) : false;
    var estado = !s ? '' : feito ? 'v' : (passado ? 'x' : 'o');

    /* ── O SEGUNDO TREINO PRECISA APARECER PELO NOME ──
       A linha ja somava os minutos dele (por isso quarta dava 80: 35
       da corrida do treinador mais 45 da academia), mas so escrevia o
       titulo do treino principal. Na tela ficava "Rodagem leve 35' /
       RODAGEM FACIL" e a academia, invisivel.

       So vale quando ha treino principal: se s nao existe, o proprio
       titulo da linha ja e o do extra, logo acima.                   */
    var segundo = (s && x) ? (x.titulo || 'Academia') : null;

    var cls = ['linha'];
    if(hoje) cls.push('hoje');
    if(k === ST.sel) cls.push('sel');
    if(s || x) cls.push('pint');
    if(!s && !x) cls.push('folga');

    var estilo = cor ? ('--zc:' + cor + ';--zw:' + alfa(cor, hoje ? 0.13 : 0.075)) : '';

    var html = '<tr class="' + cls.join(' ') + '" data-k="' + k + '" style="' + estilo + '">'
      + '<td class="d"><span class="dw">' + D3[dow(d)] + '</span>'
      + '<span class="dn">' + String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '</span></td>'
      + '<td class="t"><span class="tt">' + tit + '</span>'
      + (sub ? '<span class="zz">' + sub + '</span>' : '')
      + (segundo ? '<span class="zx">+ ' + segundo + '</span>' : '') + '</td>'
      + '<td>' + ((min || xmin) ? '<span class="num">' + ((min || 0) + xmin) + '</span>' : '<span class="dim">—</span>') + '</td>'
      + '<td class="ok">' + (estado === 'v' ? '<span class="vv">✓</span>'
                          : estado === 'x' ? '<span class="xx">!</span>'
                          : estado === 'o' ? '<span class="oo"></span>' : '') + '</td>'
      + '</tr>';

    return { html: html, km: km || 0, min: (min || 0) + xmin,
             forte: s && FORTE[s.foco] ? (km || 0) : 0,
             corrida: s && s.mod === 'corrida' ? (km || 0) : 0,
             feito: feito, tem: !!(s || x) };
  }

  /* ── a tabela inteira ── */
  function tabela(){
    var ks = dias(), semanas = [], atual = null;
    ks.forEach(function(k){
      if(!atual || dow(dt(k)) === 1){ atual = { ks: [] }; semanas.push(atual) }
      atual.ks.push(k);
    });

    /* Só a semana em curso. A seguinte abre quando virar a semana —
       ver duas de uma vez so enchia a tela de coisa que nao e de hoje. */
    var hojeIso = iso(HOJE);
    var emCurso = semanas.filter(function(w){
      return w.ks[0] <= hojeIso && w.ks[w.ks.length - 1] >= hojeIso;
    });
    if(emCurso.length) semanas = emCurso;
    else if(semanas.length) semanas = [semanas[0]];

    var corpo = '', nsem = 0;
    semanas.forEach(function(w){
      nsem++;
      var somaKm = 0, somaMin = 0, forte = 0, corrida = 0, feitos = 0, tem = 0;
      var linhas = w.ks.map(function(k){
        var L = linha(k);
        somaKm += L.km; somaMin += L.min; forte += L.forte; corrida += L.corrida;
        if(L.tem){ tem++; if(L.feito) feitos++ }
        return L.html;
      }).join('');

      /* A fase (Base, Construcao, Polimento) era a periodizacao da
         corrida. Sem plano de corrida, a etiqueta nao diz nada. */
      var fase = '';
      var rot = w.ks[0] <= iso(HOJE) && w.ks[w.ks.length-1] >= iso(HOJE)
                ? 'Esta semana' : 'Semana ' + nsem;

      corpo += '<tr class="sem"><td class="d"><span class="semtag">' + rot + '</span></td>'
             + '<td class="t" colspan="3" style="text-align:left">'
             + (fase ? '<span class="semfase">' + fase + '</span>' : '') + '</td></tr>'
             + linhas;

      /* fechamento: km, horas e a reparticao 80/20 */
      var leve = corrida - forte;
      var pctLeve = corrida > 0 ? Math.round(leve / corrida * 100) : null;
      var corMix = pctLeve == null ? 'var(--tx3)' : pctLeve >= 75 ? '#3FD98A'
                 : pctLeve >= 65 ? '#F5C544' : '#F2685C';

      corpo += '<tr class="tot"><td class="d">Semana</td>'
        + '<td class="t" style="text-align:left;padding-left:16px">'
        + '<span class="mixtx">' + (tem ? feitos + ' de ' + tem + ' sessões' : '') + '</span>'
        + '</td>'
        + '<td><span class="totn">' + (somaMin ? (somaMin / 60).toFixed(1) : '—') + '</span>'
          + '<span class="mixtx"> h</span></td>'
        + '<td class="ok"><span class="mixtx">' + (tem ? feitos + '/' + tem : '') + '</span></td></tr>';
    });

    /* So academia na planilha: as zonas de corrida (Rodagem facil,
       Longo, Limiar, VO2...) nao aparecem mais, entao a legenda delas
       era so ruido. */
    var leg = '<span><i style="background:' + MODC.forca.c + '"></i>Força</span>';

    return ''
      + '<div class="plhead"><h2>Planilha</h2><div class="sub">'
      + 'toque numa linha<br>para abrir o treino</div></div>'
      + '<div class="rolo"><table><thead><tr>'
      + '<th class="d">Dia</th><th class="t">Treino</th><th>min</th><th class="ok"></th>'
      + '</tr></thead><tbody>' + corpo + '</tbody></table></div>'
      + '<div class="pleg">' + leg + '</div>'
      + '<p class="plnota">Academia às segundas, quartas e sextas, 5:30. '
      + 'A corrida fica no relógio, montada pelo seu treinador.</p>';
  }

  /* ── montagem e religação ── */
  function alvo(){
    var s = q('#sess');
    return s && s.parentNode ? s.parentNode : null;
  }

  function montar(){
    if(!ligado()) return;
    var pai = alvo(), sess = q('#sess');
    if(!pai || !sess) return;
    var el = q('#bqPl');
    if(!el){
      el = document.createElement('section');
      el.id = 'bqPl';
      pai.insertBefore(el, sess);
    }
    el.innerHTML = tabela();

    Array.prototype.forEach.call(el.querySelectorAll('tr.linha'), function(tr){
      tr.onclick = function(){
        var k = tr.getAttribute('data-k');
        if(!k) return;
        var mesmo = (k === ST.sel);
        ST.sel = k;
        try{
          if(window.bqDia) mesmo ? (window.bqDia.estado() === 'aberto' ? window.bqDia.fechar()
                                                                      : window.bqDia.abrir())
                                 : window.bqDia.abrir();
        }catch(e){}
        try{ if(typeof renderDia === 'function') renderDia();
             if(typeof renderCal === 'function') renderCal();
             if(typeof renderSemana === 'function') renderSemana() }catch(e){}
        try{ montar() }catch(e){}
        try{ q('#sess').scrollIntoView({behavior:'smooth', block:'nearest'}) }catch(e){}
      };
    });

    /* a faixa de um dia so vira redundante: a linha ja faz o trabalho */
    try{
      var faixa = sess.querySelector('.sessbar');
      if(faixa) faixa.style.display = 'none';
    }catch(e){}
  }

  function tirar(){
    var el = q('#bqPl');
    if(el && el.parentNode) el.parentNode.removeChild(el);
    try{
      var faixa = q('#sess') && q('#sess').querySelector('.sessbar');
      if(faixa) faixa.style.display = '';
    }catch(e){}
  }

  /* redesenha junto com o resto */
  ['renderDia','renderCoach','renderCal','renderSemana'].forEach(function(nome){
    var orig = window[nome];
    if(typeof orig !== 'function') return;
    window[nome] = function(){
      var r = orig.apply(this, arguments);
      try{ if(ligado()) montar() }catch(e){ console.warn('planilha:', e && e.message) }
      return r;
    };
  });

  window.bqPlanilha = {
    ligar: function(){
      try{ localStorage.removeItem(OFF) }catch(e){}
      montar(); return 'planilha ligada';
    },
    desligar: function(){
      try{ localStorage.setItem(OFF, '1') }catch(e){}
      tirar(); return 'lista antiga de volta';
    },
    montar: montar,
    html: tabela,
    dados: function(){
      return dias().map(function(k){
        var s = ST.plano[k], x = ST.extras && ST.extras[k];
        var z = zonaDe(s);
        return k + ' ' + D3[dow(dt(k))] + '  ' +
               (s ? (s.titulo || s.mod) : (x ? 'academia' : 'descanso')) +
               (z ? '  [' + z.n + ' ' + z.c + ']' : '') +
               (s && s.km ? '  ' + s.km + ' km' : '') +
               (s && s.pace ? '  ' + s.pace + '/km' : '');
      });
    }
  };

  setTimeout(function(){ try{ if(ligado()) montar() }catch(e){} }, 4200);
});


/* ═══ 36. O QUILOMETRO E O TOTAL ═══

   A DUVIDA QUE VOCE LEVANTOU, e que estava certa: "vc fala em 5,1 km
   continuos, porem se eu acrescentar o warm up e o cool down vai dar
   mais de 5,1 km e depois estes numeros vao mexer na minha performance".

   AUTOPSIA. O app tinha DUAS contas brigando, e nenhuma avisava:

   a) As etapas do index.html tratam s.km como sendo so a PARTE
      PRINCIPAL. Escrevem "aquecimento 8 min" e depois "5,1 km
      continuos" — ou seja, aquecimento POR CIMA dos 5,1.

   b) A minha parte 34 calculava s.min = km x ritmo, tratando os mesmos
      5,1 km como a SESSAO INTEIRA, e de quebra apagava os 11 minutos
      que a parte 24 tinha somado pelas seis etapas.

   Resultado pratico: o relogio gravava ~7 km, o plano dizia 5,1, e o
   julgamento da sessao acusava "passou 2 km do previsto" num treino
   que voce cumpriu exatamente. Pior: o volume semanal e o ACWR saem
   do que o Garmin gravou, entao o plano media uma coisa e a realidade
   outra. Voce ia carregar esse erro ate 18/10.

   A REGRA, DAQUI EM DIANTE, UMA SO:

     s.km e s.min sao o TOTAL da sessao, porta a porta.
     Aquecimento e desaquecimento estao DENTRO. Nada por cima.

   Por que essa e a escolha certa e nao a outra: o relogio grava o
   total. O volume semanal, o ACWR e a evolucao do limiar saem do
   total. Se o plano falasse em "parte principal" e a realidade em
   "total", as duas nunca se encontrariam — e e exatamente por isso
   que voce teve a duvida.

   O QUE MUDA NA TELA. Cada etapa passa a dizer quantos km ela ocupa,
   e a soma bate com o numero do cartao. Um treino de 8 km vira:
   aquecimento 1,2 km, principal 6,1 km, desaquecimento 0,7 km.

   E ENTRA UM CARTAO NOVO: "Montar no Garmin", com os passos exatos do
   Workout, ja com tempo ou distancia em cada um. E copiavel.

   ALONGAMENTOS E EDUCATIVOS ficam FORA da conta de propria, porque
   voce os faz com o relogio parado. So o pre-aquecimento correndo,
   a parte principal e o desaquecimento entram nos km.
   ══════════════════════════════════════════════════════════════════ */

PARTE('o quilômetro é o total', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  /* minutos de aquecimento e desaquecimento CORRENDO, por tipo */
  var WU = { facil:8, longo:10, soltura:6, rec:6, mp:12, limiar:12, vo2:12,
             intervalado:12, fartlek:10, tiros:12, progressivo:8 };
  var CD = { facil:5, longo:6, soltura:4, rec:4, mp:8, limiar:8, vo2:8,
             intervalado:8, fartlek:6, tiros:8, progressivo:6 };
  var QUAL = { mp:1, limiar:1, vo2:1, intervalado:1, fartlek:1, tiros:1 };

  function paceZ(k){
    try{
      var z = Z[k];
      if(z && z.p) return (z.p[0] + z.p[1]) / 2;
    }catch(e){}
    return (PERFIL.paceLimiar || 340) + 60;
  }
  function pcs(s){ return Math.floor(s/60) + ':' + String(Math.round(s%60)).padStart(2,'0') }

  /* ── a reparticao de uma sessao de corrida ── */
  function repartir(s){
    if(!s || s.mod !== 'corrida' || s.prova) return null;
    var total = +s.km || 0;
    if(total <= 0) return null;

    var foco = s.foco || 'facil';
    var mWU = WU[foco] != null ? WU[foco] : 8;
    var mCD = CD[foco] != null ? CD[foco] : 5;

    var pRec = paceZ('rec'), pFac = paceZ('faci');
    var kmWU = mWU * 60 / pRec;
    var kmCD = mCD * 60 / pRec;

    /* sessao curta demais para o aquecimento previsto: encolhe os dois,
       nunca a parte principal abaixo de 45% do total */
    var piso = total * 0.45;
    if(total - kmWU - kmCD < piso){
      var sobra = total - piso;
      var esc = sobra / (kmWU + kmCD);
      kmWU *= esc; kmCD *= esc;
      mWU = Math.max(4, Math.round(kmWU * pRec / 60));
      mCD = Math.max(3, Math.round(kmCD * pRec / 60));
    }

    var kmMain = total - kmWU - kmCD;
    var r = { total:total, kmWU:+kmWU.toFixed(1), kmCD:+kmCD.toFixed(1),
              kmMain:+kmMain.toFixed(1), minWU:mWU, minCD:mCD, qual:!!QUAL[foco] };

    /* dentro da parte principal, quanto e forte e quanto e trote de
       recuperacao entre os tiros */
    if(r.qual){
      var zq = foco === 'vo2' || foco === 'intervalado' || foco === 'fartlek' ? 'vo2'
             : foco === 'mp' ? 'mp' : foco === 'tiros' ? 'vo2' : 'lim';
      var pQ = paceZ(zq);
      var kmForte = Math.min(kmMain * 0.62, total * 0.38);
      r.kmForte = +kmForte.toFixed(1);
      r.kmTrote = +(kmMain - kmForte).toFixed(1);
      r.paceForte = pQ;
      r.zonaForte = zq;
      r.minMain = Math.round((kmForte * pQ + (kmMain - kmForte) * pFac) / 60);
    } else {
      var pM = foco === 'longo' ? paceZ('long') : foco === 'soltura' ? paceZ('rec') : pFac;
      r.paceMain = pM;
      r.minMain = Math.round(kmMain * pM / 60);
    }

    r.min = r.minWU + r.minMain + r.minCD;
    r.paceMedio = Math.round(r.min * 60 / total);
    return r;
  }

  /* ── o total mandado para o campo do plano ── */
  function ajustar(s){
    var r = repartir(s);
    if(!r) return s;
    s.min   = r.min;                    /* correndo, porta a porta */
    s.pace  = pcs(r.paceMedio);         /* media da sessao inteira */
    s.bqRep = r;                        /* a reparticao, para as etapas */
    return s;
  }

  function varrer(p){
    if(!p) return p;
    try{
      Object.keys(p).forEach(function(k){
        if(k < iso(HOJE)) return;
        ajustar(p[k]);
      });
    }catch(e){ console.warn('total:', e && e.message) }
    return p;
  }

  var gerApp = window.gerarPlano;
  if(typeof gerApp === 'function')
    window.gerarPlano = function(){ return varrer(gerApp.apply(this, arguments)) };

  if(window.bqBloco && typeof window.bqBloco.criar === 'function'){
    var criarApp = window.bqBloco.criar;
    window.bqBloco.criar = function(){
      var B = criarApp.apply(this, arguments);
      try{ if(B && B.sessoes) Object.keys(B.sessoes).forEach(function(k){ ajustar(B.sessoes[k]) }) }catch(e){}
      try{ varrer(ST.plano) }catch(e){}
      return B;
    };
  }

  /* ── as etapas passam a declarar os km de cada uma ── */
  var etApp = window.etapas;
  if(typeof etApp === 'function'){
    window.etapas = function(foco, mod, p){
      var lista = etApp.apply(this, arguments);
      try{
        if(!Array.isArray(lista) || !p || p.mod !== 'corrida' || p.prova) return lista;
        var r = p.bqRep || repartir(p);
        if(!r) return lista;

        /* O longo vem partido em "Bloco 1" e "Bloco 2". Se eu escrever o
           total da parte principal nos dois, a soma dobra. Entao primeiro
           descubro quantas etapas sao parte principal e reparto entre elas
           na mesma proporcao que o app ja tinha escrito. */
        function ehMain(t){
          return /principal|contínuo|continuo|bloco|longo|tiros|ritmo|limiar/i.test(t)
              && !/alongamento|mobilidade|educativo|hidrat|nutri|aquecimento/i.test(t);
        }
        function kmDaTag(et){
          var v = 0;
          (et.tags || []).forEach(function(tag){
            if(tag && !tag.c){
              var m = String(tag.t).match(/^([\d.,]+)\s*km$/);
              if(m) v = parseFloat(m[1].replace(',', '.'));
            }
          });
          return v;
        }
        var mains = lista.filter(function(et){ return et && et.t && ehMain(String(et.t)) });
        var somaAntiga = mains.reduce(function(a, et){ return a + kmDaTag(et) }, 0);
        var fatia = {};
        mains.forEach(function(et, i){
          var p = somaAntiga > 0 ? kmDaTag(et) / somaAntiga : 1 / mains.length;
          fatia[i] = +(r.kmMain * p).toFixed(1);
        });
        /* arredondamento nao pode comer nem sobrar quilometro */
        var conf = mains.reduce(function(a, _, i){ return a + fatia[i] }, 0);
        if(mains.length) fatia[mains.length - 1] = +(fatia[mains.length - 1] + (r.kmMain - conf)).toFixed(1);

        lista.forEach(function(et){
          if(!et || !et.t) return;
          var t = String(et.t);
          var km = null, extra = null;

          if(/aquecimento/i.test(t) && !/desaquecimento/i.test(t)){
            km = r.kmWU; extra = r.minWU + ' min';
          } else if(/desaquecimento/i.test(t)){
            km = r.kmCD; extra = r.minCD + ' min';
          } else if(ehMain(t)){
            var i = mains.indexOf(et);
            km = fatia[i];
            extra = Math.round(r.minMain * (r.kmMain > 0 ? km / r.kmMain : 1)) + ' min';
          }
          if(km == null) return;

          et.tags = et.tags || [];
          /* troca a etiqueta de distancia que ja existia, se existia */
          var trocou = false, temMin = false;
          et.tags.forEach(function(tag){
            if(!tag || tag.c) return;
            var v = String(tag.t);
            if(/^[\d.,]+\s*km$/.test(v)){ tag.t = km.toFixed(1) + ' km'; trocou = true }
            /* o aquecimento ja vinha com "8 min": atualiza em vez de duplicar */
            else if(/^≈?\s*[\d.,]+\s*min$/.test(v)){ tag.t = extra; temMin = true }
          });
          if(!trocou) et.tags.unshift({ t: km.toFixed(1) + ' km' });
          if(!temMin) et.tags.push({ t: extra });
        });

        /* Aqui existia uma etapa "A conta fecha", so informativa. Ela
           contava no concluida() e um treino terminado virava
           incompleto: 6 marcas para 7 etapas. A informacao continua no
           cartao "Montar no Garmin", onde nao atrapalha a contagem. */
      }catch(e){ console.warn('etapas/total:', e && e.message) }
      return lista;
    };
  }

  /* ── cartao: montar no Garmin ── */
  var css = document.createElement('style');
  css.textContent = [
'#bqGar{margin:14px 0 0;background:var(--s2);border:1px dashed var(--line);border-radius:14px;padding:14px 15px}',
'#bqGar h4{margin:0 0 3px;font-size:12.5px;font-weight:800;letter-spacing:-.01em;color:var(--tx)}',
'#bqGar .gsub{font-size:11px;color:var(--tx3);margin:0 0 11px;line-height:1.5}',
'#bqGar ol{margin:0;padding:0;list-style:none;counter-reset:g}',
'#bqGar li{counter-increment:g;display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);align-items:flex-start}',
'#bqGar li:last-child{border-bottom:0}',
'#bqGar li:before{content:counter(g);flex:none;width:19px;height:19px;border-radius:50%;',
'  background:var(--s3);color:var(--tx2);font-size:10px;font-weight:800;text-align:center;line-height:19px;margin-top:1px}',
'#bqGar .gt{flex:1;min-width:0}',
'#bqGar .gt b{display:block;font-size:12.5px;font-weight:700;color:var(--tx);line-height:1.3}',
'#bqGar .gt span{display:block;font-size:11px;color:var(--tx3);margin-top:2px;line-height:1.45}',
'#bqGar .gv{flex:none;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11.5px;',
'  font-weight:700;color:var(--acc);text-align:right;white-space:nowrap;margin-top:1px}',
'#bqGar .gnota{margin:11px 0 0;font-size:11px;color:var(--tx3);line-height:1.5}',
'#bqGar .gnota b{color:var(--tx2)}'
  ].join('\n');
  document.head.appendChild(css);

  function passosGarmin(s){
    var r = s.bqRep || repartir(s);
    if(!r) return null;
    var faci = pcs(paceZ('faci') - 15) + '–' + pcs(paceZ('faci') + 15);
    var rec  = pcs(paceZ('rec') - 15) + '–' + pcs(paceZ('rec') + 15);
    var P = [];

    P.push({ t:'Aquecimento', v:r.minWU + ' min',
             d:'Por TEMPO, não por distância. Ritmo ' + rec + '/km, subindo devagar.' });

    if(r.qual){
      var z = Z[r.zonaForte] || {};
      var fx = z.p ? pcs(z.p[0]) + '–' + pcs(z.p[1]) : pcs(r.paceForte);
      var mrep = r.zonaForte === 'mp' ? null : 600;
      if(mrep){
        var n = Math.max(3, Math.round(r.kmForte * 1000 / mrep));
        P.push({ t:'Repetir ' + n + '×', v:'', d:'Crie um bloco de repetição com os dois passos abaixo.' });
        P.push({ t:'— Tiro', v:mrep + ' m',
                 d:'Por DISTÂNCIA. Alvo de ritmo ' + fx + '/km' +
                   (z.fc ? ', FC subindo até ' + z.fc[0] + '–' + z.fc[1] + ' bpm' : '') + '.' });
        P.push({ t:'— Recuperação', v:'2 min',
                 d:'Por TEMPO, trote leve. Não pare de correr.' });
      } else {
        P.push({ t:'Bloco em ritmo', v:r.kmForte.toFixed(1) + ' km',
                 d:'Por DISTÂNCIA. Alvo ' + fx + '/km' +
                   (z.fc ? ', FC ' + z.fc[0] + '–' + z.fc[1] + ' bpm' : '') + '.' });
      }
    } else {
      P.push({ t:'Parte principal', v:r.kmMain.toFixed(1) + ' km',
               d:'Por DISTÂNCIA. Alvo de ritmo ' + faci + '/km.' });
    }

    P.push({ t:'Desaquecimento', v:r.minCD + ' min',
             d:'Por TEMPO. Trote muito leve até a respiração normalizar.' });
    return { passos:P, r:r };
  }

  function cartao(){
    try{
      var el = q('#sess');
      if(!el) return;
      var velho = el.querySelector('#bqGar');
      if(velho) velho.parentNode.removeChild(velho);

      var s = (typeof sessaoDe === 'function') ? sessaoDe(ST.sel) : (ST.plano || {})[ST.sel];
      if(!s || s.mod !== 'corrida' || s.prova) return;
      var G = passosGarmin(s);
      if(!G) return;

      var div = document.createElement('div');
      div.id = 'bqGar';
      div.innerHTML = '<h4>Montar no Garmin</h4>'
        + '<p class="gsub">Um único Workout, do começo ao fim. O relógio grava tudo como '
        + 'uma atividade só — que é exatamente o que o plano espera.</p>'
        + '<ol>' + G.passos.map(function(p){
            return '<li><div class="gt"><b>' + p.t + '</b><span>' + p.d + '</span></div>'
                 + (p.v ? '<div class="gv">' + p.v + '</div>' : '') + '</li>';
          }).join('') + '</ol>'
        + '<p class="gnota">Soma <b>' + G.r.total.toFixed(1) + ' km</b> em cerca de <b>'
        + G.r.min + ' min</b> — o mesmo número do cartão acima. Os alongamentos '
        + 'dinâmicos e os educativos ficam <b>fora do Workout</b>: faça antes de apertar '
        + 'o start, com o relógio parado. Eles não são quilômetro de treino.</p>';
      el.appendChild(div);
    }catch(e){ console.warn('garmin:', e && e.message) }
  }

  var diaApp = window.renderDia;
  if(typeof diaApp === 'function'){
    window.renderDia = function(){
      var r = diaApp.apply(this, arguments);
      try{ cartao() }catch(e){}
      return r;
    };
  }

  window.bqTotal = {
    repartir: repartir,
    hoje: function(){
      var s = (ST.plano || {})[iso(HOJE)];
      if(!s) return 'sem treino hoje';
      var r = repartir(s);
      if(!r) return 'sessão sem quilometragem';
      return ['total ' + r.total.toFixed(1) + ' km · ' + r.min + ' min · ' + pcs(r.paceMedio) + '/km médio',
              '  aquecimento    ' + r.kmWU.toFixed(1) + ' km  (' + r.minWU + ' min)',
              (r.qual ? '  forte          ' + r.kmForte.toFixed(1) + ' km  em ' + pcs(r.paceForte) + '/km'
                      : '  parte principal ' + r.kmMain.toFixed(1) + ' km  em ' + pcs(r.paceMain) + '/km'),
              (r.qual ? '  trote entre    ' + r.kmTrote.toFixed(1) + ' km' : ''),
              '  desaquecimento ' + r.kmCD.toFixed(1) + ' km  (' + r.minCD + ' min)'
             ].filter(Boolean).join('\n');
    },
    garmin: function(){
      var s = (ST.plano || {})[iso(HOJE)];
      var G = s && passosGarmin(s);
      if(!G) return 'sem treino de corrida hoje';
      return G.passos.map(function(p){ return (p.v ? p.v.padEnd(9) : '         ') + p.t + ' — ' + p.d });
    }
  };

  setTimeout(function(){
    try{
      if(ST.cache) ST.cache = {};
      varrer(ST.plano);
      if(typeof rebuild === 'function') rebuild();
      if(typeof renderTudo === 'function') renderTudo();
    }catch(e){}
  }, 6800);
});


/* ═══ 37. PONTE PARA O GARMIN ═══

   O QUE ISTO RESOLVE. Voce quis que a semana subisse sozinha para o
   relogio. O problema e que o seu plano mora no Firebase, protegido por
   senha — e quem for montar os workouts la fora nao consegue ler.

   A TENTACAO ERRADA, que eu quase segui: deixar o script do GitHub, ou
   o assistente, recalcular os ritmos e a reparticao da sessao por conta
   propria. Seria uma SEGUNDA implementacao da mesma regra, vivendo
   longe daqui. Ja cometi esse erro neste projeto — os testes do bloco
   reimplementavam a logica em vez de carregar o fix.js — e ele custou
   caro. Duas copias da mesma conta sempre acabam discordando, e voce
   descobriria correndo.

   ENTAO A REGRA AQUI E: toda a decisao de treino continua sendo tomada
   NESTE arquivo. Esta parte apenas TRADUZ o que as partes 34 e 36 ja
   decidiram para o vocabulario do Garmin — passo, condicao de fim e
   alvo de ritmo em metros por segundo — e guarda o resultado pronto em
   ST.garminSemana.

   Quem estiver do outro lado so copia. Nao calcula nada.

   O QUE VAI NO PACOTE, para os proximos 7 dias:
     - so corridas (foi a sua escolha)
     - nome, data, km e minutos totais
     - os passos ja traduzidos, com ritmo em m/s
     - o carimbo de quando foi gerado, para ninguem subir semana velha

   METROS POR SEGUNDO: o Garmin nao entende "6:10/km". Ele guarda
   velocidade. 6:10/km sao 370 segundos, e 1000/370 = 2,703 m/s. O
   campo "rapido" leva o maior numero, que e o ritmo mais forte — foi
   assim que achei no seu workout de 12/08, e mantive.

   NO CONSOLE:
     bqPonte.ver()      — a semana que seria enviada, em texto
     bqPonte.pacote()   — o JSON exato que vai para o Firebase
     bqPonte.gravar()   — forca a gravacao agora
   ══════════════════════════════════════════════════════════════════ */

PARTE('ponte para o Garmin', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  var DIAS = 7;

  function ms(seg){ return seg > 0 ? +(1000 / seg).toFixed(4) : null }
  function pcs(s){ return Math.floor(s/60) + ':' + String(Math.round(s%60)).padStart(2,'0') }
  function zona(k){ try{ return Z[k] || null }catch(e){ return null } }

  function faixaMs(zk, folga){
    var z = zona(zk);
    if(!z || !z.p) return null;
    var rapido = z.p[0] - (folga || 0), lento = z.p[1] + (folga || 0);
    return { rapido: ms(rapido), lento: ms(lento),
             txt: pcs(rapido) + '–' + pcs(lento) + '/km',
             fc: z.fc ? z.fc.slice() : null };
  }

  /* ── traduz UMA sessao de corrida em passos do Garmin ── */
  function passosDe(s){
    /* a reparticao vem pronta da parte 36. Se ela nao existir, eu NAO
       invento: devolvo nulo e a sessao fica de fora do pacote. */
    var R = s && s.bqRep;
    if(!R && window.bqTotal && typeof window.bqTotal.repartir === 'function')
      R = window.bqTotal.repartir(s);
    if(!R) return null;

    var rec  = faixaMs('rec', 0);
    var faci = faixaMs('faci', 0);
    if(!rec || !faci) return null;

    var P = [];

    P.push({ tipo:'warmup', fim:'time', valor: R.minWU * 60,
             rapido: rec.rapido, lento: rec.lento,
             texto: R.minWU + ' min subindo devagar, ' + rec.txt +
                    '. Se chegar ofegante ao fim, foi rapido demais.' });

    if(R.qual){
      var zk = R.zonaForte === 'mp' ? 'mp' : R.zonaForte === 'lim' ? 'lim' : 'vo2';
      var forte = faixaMs(zk, 0);
      if(!forte) return null;

      if(zk === 'mp' || zk === 'lim'){
        /* Bloco continuo. O volume facil que sobra vem ANTES do bloco
           forte, nao depois. Terminar um limiar e ainda ter 5 km de
           trote pela frente e desmotivador e nao rende nada; a escola
           classica poe esse volume na entrada, com a perna fresca, e
           deixa so o desaquecimento no fim. */
        if(R.kmTrote > 0.4)
          P.push({ tipo:'interval', fim:'distance', valor: Math.round(R.kmTrote * 1000),
                   rapido: faci.rapido, lento: faci.lento,
                   texto: 'Rodagem de entrada, ' + R.kmTrote.toFixed(1) + ' km em ' +
                          faci.txt + '. Segure aqui: o trabalho vem a seguir.' });
        P.push({ tipo:'interval', fim:'distance', valor: Math.round(R.kmForte * 1000),
                 rapido: forte.rapido, lento: forte.lento,
                 texto: R.kmForte.toFixed(1) + ' km em ' + forte.txt +
                        (forte.fc ? ', FC ' + forte.fc[0] + '-' + forte.fc[1] + ' bpm' : '') + '.' });
      } else {
        /* tiros: grupo de repeticao */
        var m = 600, n = Math.max(3, Math.min(10, Math.round(R.kmForte * 1000 / m)));
        var trote = Math.max(90, Math.round(R.kmTrote * 1000 / n * (faci.lento ? 1/faci.lento : 0.4)));
        trote = Math.min(210, Math.max(90, Math.round(trote / 30) * 30));
        P.push({ tipo:'repetir', vezes: n, passos: [
          { tipo:'interval', fim:'distance', valor: m,
            rapido: forte.rapido, lento: forte.lento,
            texto: m + ' m em ' + forte.txt +
                   (forte.fc ? ', FC ate ' + forte.fc[0] + '-' + forte.fc[1] + ' bpm' : '') + '.' },
          { tipo:'recovery', fim:'time', valor: trote,
            texto: Math.round(trote/60) + ' min de trote leve. Nao pare de correr.' }
        ]});
      }
    } else {
      var zm = s.foco === 'longo' ? 'long' : s.foco === 'soltura' ? 'rec' : 'faci';
      var alvo = faixaMs(zm, 0);
      if(!alvo) return null;
      P.push({ tipo:'interval', fim:'distance', valor: Math.round(R.kmMain * 1000),
               rapido: alvo.rapido, lento: alvo.lento,
               texto: R.kmMain.toFixed(1) + ' km em ' + alvo.txt +
                      '. Voce deve conseguir falar frases inteiras.' });
    }

    P.push({ tipo:'cooldown', fim:'time', valor: R.minCD * 60,
             texto: R.minCD + ' min de trote muito leve ate a respiracao normalizar.' });

    return P;
  }

  /* ── monta o pacote da semana ── */
  function pacote(){
    var hoje = iso(HOJE), fim = iso(addD(HOJE, DIAS - 1));
    var out = [];

    Object.keys(ST.plano || {}).sort().forEach(function(k){
      if(k < hoje || k > fim) return;
      var s = ST.plano[k];
      if(!s || s.mod !== 'corrida' || s.prova) return;   /* so corridas */
      var P = passosDe(s);
      if(!P) return;

      var d = dt(k);
      var nome = String(d.getDate()).padStart(2,'0') + '/' +
                 String(d.getMonth()+1).padStart(2,'0') + ' · ' +
                 (s.titulo || s.foco) + ' · ' + (+s.km).toFixed(1) + ' km total';

      out.push({
        data: k, nome: nome, foco: s.foco,
        km: +(+s.km).toFixed(1), min: +s.min || null,
        paceMedio: s.pace || null,
        nota: 'Total porta a porta ' + (+s.km).toFixed(1) + ' km. Alongamentos e ' +
              'educativos ANTES do start, relogio parado.',
        passos: P
      });
    });

    var lim = null;
    try{ lim = PERFIL.paceLimiar }catch(e){}

    return {
      gerado: new Date().toISOString(),
      versao: (typeof FIX_VERSAO === 'string' ? FIX_VERSAO : '?'),
      de: hoje, ate: fim,
      limiar: lim ? pcs(lim) : null,
      fcMax: (PERFIL && PERFIL.fcMax) || null,
      zonas: ['rec','faci','long','mp','lim','vo2'].reduce(function(a, k){
        var z = zona(k);
        if(z && z.p) a[k] = { n:z.n, pace: pcs(z.p[0]) + '–' + pcs(z.p[1]),
                              fc: z.fc ? z.fc[0] + '–' + z.fc[1] : null };
        return a;
      }, {}),
      sessoes: out
    };
  }

  /* ── grava junto com o resto do estado ── */
  function gravar(){
    try{
      var p = pacote();
      ST.garminSemana = p;
      return p.sessoes.length + ' sessões no pacote';
    }catch(e){ console.warn('ponte:', e && e.message); return 'falhou' }
  }

  var persistApp = window.persistir;
  if(typeof persistApp === 'function'){
    window.persistir = function(){
      try{ gravar() }catch(e){}
      return persistApp.apply(this, arguments);
    };
  }

  /* O ERRO QUE ME CUSTOU UMA RODADA INTEIRA.
     salvarCoach() do index.html nao grava ST inteiro: monta um corpo com
     uma lista fixa de campos — objetivo, feitas, filtro, extras, trocas,
     dias, marcoData, marcoNome, periodo — e manda com PUT. PUT substitui
     o no inteiro. Ou seja: eu montava o pacote na memoria e o proprio
     salvamento seguinte o apagava, sem erro nenhum na tela.

     A parte 23 ja tinha esbarrado nisso e resolvido com um PATCH depois
     do PUT. Eu sabia disso e mesmo assim esqueci. Mesma solucao aqui:
     PATCH acrescenta a chave sem reescrever o que o app acabou de salvar. */
  var salvarApp = window.salvarCoach;
  if(typeof salvarApp === 'function'){
    window.salvarCoach = async function(){
      var r = await salvarApp.apply(this, arguments);
      try{
        if(!ST.garminSemana) gravar();
        var p = ST.garminSemana;
        if(p && p.sessoes && p.sessoes.length){
          var t = await fbToken();
          if(t) await fetch(FB_DB + '/' + FB_COACH + '.json?auth=' + t,
            { method:'PATCH', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ garminSemana: p }) });
        }
      }catch(e){ console.warn('ponte/salvar:', e && e.message) }
      return r;
    };
  }

  window.bqPonte = {
    pacote: pacote,
    gravar: gravar,
    ver: function(){
      var p = pacote();
      if(!p.sessoes.length) return 'nenhuma corrida nos próximos ' + DIAS + ' dias';
      var L = ['gerado ' + p.gerado.slice(0,16).replace('T',' ') + ' · fix ' + p.versao,
               'limiar ' + p.limiar + '/km · janela ' + p.de + ' a ' + p.ate, ''];
      p.sessoes.forEach(function(s){
        L.push(s.nome);
        s.passos.forEach(function(x){
          if(x.tipo === 'repetir'){
            L.push('   repetir ' + x.vezes + '×:');
            x.passos.forEach(function(y){
              L.push('     ' + y.tipo.padEnd(9) +
                     (y.fim === 'time' ? y.valor + ' s' : y.valor + ' m').padEnd(9) +
                     (y.rapido ? pcs(Math.round(1000/y.rapido)) + '–' + pcs(Math.round(1000/y.lento)) + '/km' : ''));
            });
          } else {
            L.push('   ' + x.tipo.padEnd(9) +
                   (x.fim === 'time' ? x.valor + ' s' : x.valor + ' m').padEnd(9) +
                   (x.rapido ? pcs(Math.round(1000/x.rapido)) + '–' + pcs(Math.round(1000/x.lento)) + '/km' : 'livre'));
          }
        });
        L.push('');
      });
      return L.join('\n');
    }
  };

  /* Abrir o app tem que ser suficiente.
     Antes eu so montava o pacote na memoria e esperava que algum
     salvamento acontecesse por outro motivo. Se voce abrisse o app e
     nao mexesse em nada, nada era salvo, o Firebase nunca recebia o
     pacote e a corrente inteira ficava parada — sem erro na tela, sem
     aviso, sem nada. Agora, se o pacote mudou em relacao ao que ja
     estava gravado, eu forco um salvamento. */
  setTimeout(function(){
    try{
      var antes = ST.garminSemana && JSON.stringify(ST.garminSemana.sessoes || []);
      gravar();
      var depois = ST.garminSemana && JSON.stringify(ST.garminSemana.sessoes || []);
      if(antes !== depois && typeof window.persistir === 'function'){
        window.persistir();
        console.log('ponte: semana do Garmin salva (' +
                    (ST.garminSemana.sessoes || []).length + ' sessões)');
      }
    }catch(e){ console.warn('ponte/boot:', e && e.message) }
  }, 7200);
});


/* ═══ 38. O BLOCO SOBREVIVE ═══

   O QUE ACONTECEU COM A SUA ACADEMIA, na ordem:

   1. salvarCoach() do index.html grava uma lista fixa de campos:
      objetivo, feitas, filtro, extras, trocas, dias, marcoData,
      marcoNome, periodo. ST.bloco e ST.hist NAO estao nela, e o
      lerCoach() tambem nao os le de volta. Os dois so viviam no
      espelho de localStorage da parte 26.

   2. No iPhone, o app aberto pelo icone da tela de inicio e o app
      aberto pelo Safari nao compartilham esse armazenamento. Ao abrir
      pelo Safari — como eu te pedi para fazer —, ST.bloco chegou vazio.

   3. Sem bloco, blocoAtual() devolve null. A parte 33 chamava
      limpar(null), e a guarda dela ("se estiver dentro do bloco,
      fica") nunca protegia ninguem com fim nulo. Resultado: apagou
      TODA a academia futura de uma vez.

   4. persistir() salvou isso. E extras ESTA na lista do salvarCoach.
      A exclusao virou permanente e desceu para o celular.

   Duas falhas somadas, as duas minhas: uma que apaga diante da
   duvida, e outra que deixa a informacao se perder entre um
   armazenamento e outro.

   A parte 33 ja foi corrigida: sem bloco, nao apaga nada. Esta parte
   ataca a outra metade — o bloco e o historico passam a viajar junto
   com o resto para o Firebase, por PATCH, como a parte 23 ja fazia
   com o questionario e a 37 com a semana do Garmin. Assim o app e o
   mesmo esteja voce no icone, no Safari, no Mac ou num celular novo.

   E SE MESMO ASSIM NAO HOUVER BLOCO: em vez de apagar, esta parte
   MANDA CRIAR um. Foi o oposto do que acontecia.

   NO CONSOLE:
     bqBlocoSalvo.ver()       — o que esta guardado
     bqBlocoSalvo.repor()     — refaz o bloco e a academia agora
   ══════════════════════════════════════════════════════════════════ */

PARTE('o bloco sobrevive', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  /* ── guarda: PATCH acrescenta sem reescrever o PUT do app ── */
  var salvarApp = window.salvarCoach;
  if(typeof salvarApp === 'function'){
    window.salvarCoach = async function(){
      var r = await salvarApp.apply(this, arguments);
      try{
        var corpo = {};
        if(ST.bloco) corpo.bloco = ST.bloco;
        if(ST.hist)  corpo.hist  = ST.hist;
        if(Object.keys(corpo).length){
          var t = await fbToken();
          if(t) await fetch(FB_DB + '/' + FB_COACH + '.json?auth=' + t,
            { method:'PATCH', headers:{'Content-Type':'application/json'},
              body: JSON.stringify(corpo) });
        }
      }catch(e){ console.warn('bloco/salvar:', e && e.message) }
      return r;
    };
  }

  /* ── leitura: o app so aplica os campos que conhece ── */
  var lerApp = window.lerCoach;
  if(typeof lerApp === 'function'){
    window.lerCoach = async function(){
      var c = await lerApp.apply(this, arguments);
      try{
        if(c && typeof c === 'object'){
          /* so aceita se for mais novo que o que ja esta na memoria —
             o espelho local pode estar a frente da nuvem */
          if(c.bloco && c.bloco.fim &&
             (!ST.bloco || !ST.bloco.fim || c.bloco.fim > ST.bloco.fim)){
            ST.bloco = c.bloco;
            console.log('bloco recuperado da nuvem, até ' + c.bloco.fim);
          }
          if(c.hist){
            ST.hist = Object.assign({}, c.hist, ST.hist || {});
          }
        }
      }catch(e){ console.warn('bloco/ler:', e && e.message) }
      return c;
    };
  }

  /* ── rede de seguranca: sem bloco, CRIA. Nunca apaga. ── */
  function repor(){
    if(!window.bqBloco) return 'sem gerador de blocos';
    var B = window.bqBloco.atual();
    if(!B){
      B = window.bqBloco.criar();
      console.log('bloco recriado: ' + (B && B.inicio) + ' a ' + (B && B.fim));
    }
    var f = window.bqForcaBloco && window.bqForcaBloco.sincronizar();
    try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
    try{ persistir() }catch(e){}
    return B ? ('bloco até ' + B.fim + (f ? ' · academia: ' + f.semeadas + ' sessões' : ''))
             : 'não consegui criar o bloco';
  }

  /* no arranque, depois que a nuvem ja respondeu */
  setTimeout(function(){
    try{
      if(!window.bqBloco) return;
      if(!window.bqBloco.atual()){
        console.warn('sem bloco vigente no arranque — recriando');
        repor();
      }
    }catch(e){ console.warn('bloco/boot:', e && e.message) }
  }, 9000);

  window.bqBlocoSalvo = {
    repor: repor,
    ver: function(){
      var B = ST.bloco;
      if(!B) return 'nenhum bloco em memória';
      var ex = Object.keys(ST.extras || {}).filter(function(k){ return k >= iso(HOJE) });
      return ['bloco ' + B.inicio + ' a ' + B.fim,
              'sessões no bloco: ' + Object.keys(B.sessoes || {}).length,
              'academia futura: ' + ex.length + (ex.length ? ' (' + ex.join(', ') + ')' : ''),
              'histórico de semanas: ' + Object.keys(ST.hist || {}).length].join('\n');
    }
  };
});


/* ═══ 39. A MARCA DE CONCLUIDO TEM QUE GRUDAR ═══

   O QUE VOCE VIU: marca o treino como concluido, vai na aba Provas,
   volta no Coach, e ele esta desmarcado de novo.

   A CAUSA. Cada etapa recebe o id de um contador global:

       let _id = 0;  const eid = () => 'e' + (++_id);
       const E = (t, d, tags) => ({ id: eid(), t, d, tags: tags || [] });

   As suas marcas ficam guardadas em ST.feitas[id_da_sessao] como uma
   lista desses ids. Mas o contador nunca volta ao mesmo lugar: basta
   ST.cache ser limpo para as etapas serem geradas de novo e ganharem
   numeros DIFERENTES. As marcas antigas viram orfas, e concluida()
   compara 6 marcas contra 6 etapas que agora se chamam outra coisa.

   E eu limpo ST.cache em nove lugares do fix.js — nas partes do
   ritmo, do total, da planilha, da janela, do bloco. Cada uma delas
   tinha um bom motivo isolado, e juntas transformaram um defeito raro
   num defeito de toda hora. A culpa da piora recente e minha.

   A CORRECAO. O id da etapa passa a sair do que ela E, nao da ordem em
   que foi criada: sessao + titulo. "2026-08-18" mais "parte principal"
   da sempre o mesmo id, hoje, amanha e depois de dez recargas. Assim o
   ST.cache pode ser limpo a vontade que a marca continua no lugar.

   O titulo perde a numeracao antes de virar id ("4 · Parte principal"
   vira "parte principal"), porque a parte 24 renumera as etapas e eu
   nao quero que renumerar apague marca.

   AS MARCAS ANTIGAS. Elas guardam numeros do contador velho, que nao
   casam com nada. Na primeira vez que uma sessao e desenhada, se ha
   marcas e nenhuma delas casa, eu converto pela QUANTIDADE: seis
   marcas viram as seis primeiras etapas. Nao e exato — nao da para
   saber quais eram —, mas preserva o quanto voce tinha feito, e
   preserva o principal, que e o treino terminado continuar terminado.

   NO CONSOLE:
     bqMarcas.ver()        — as marcas de hoje e se casam com as etapas
     bqMarcas.conferir()   — varre o plano e mostra sessoes com marca orfa
   ══════════════════════════════════════════════════════════════════ */

PARTE('a marca de concluído gruda', function(){
  if(typeof window.etapas !== 'function') throw new Error('app sem etapas()');
  if(typeof ST !== 'object') throw new Error('sem ST');


  /* titulo -> pedaco estavel de id */
  function chave(t){
    return String(t || '')
      .replace(/^\s*\d+\s*[·.\-]\s*/, '')        /* tira "4 · " */
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function idDe(sid, titulo, i){
    var c = chave(titulo);
    return 'e:' + sid + ':' + (c || 'etapa' + i);
  }

  var etApp = window.etapas;
  window.etapas = function(foco, mod, p){
    var lista = etApp.apply(this, arguments);
    try{
      if(!Array.isArray(lista) || !p || !p.id) return lista;

      var usados = {};
      lista.forEach(function(et, i){
        if(!et) return;
        var id = idDe(p.id, et.t, i);
        /* dois titulos iguais na mesma sessao: desempata pela posicao,
           senao as duas etapas dividiriam a mesma marca */
        if(usados[id]) id = id + '-' + i;
        usados[id] = 1;
        et.id = id;
      });

      /* Aqui eu convertia marcas antigas PELA QUANTIDADE, e assim
         fabricava exatamente o numero que o concluida() precisava para
         fechar — foi o que marcou o VO2 de amanha como feito. Agora so
         LIMPO o que nao casa. */
      if(ST.feitas && ST.feitas[p.id]){
        var novos = lista.map(function(et){ return et.id });
        var casam = (ST.feitas[p.id] || []).filter(function(x){ return novos.indexOf(x) >= 0 });
        if(casam.length !== ST.feitas[p.id].length){
          if(casam.length) ST.feitas[p.id] = casam;
          else delete ST.feitas[p.id];
        }
      }
    }catch(e){ console.warn('marcas:', e && e.message) }
    return lista;
  };

  /* ---- diagnostico ---- */
  window.bqMarcas = {
    ver: function(){
      var k = ST.sel || iso(HOJE);
      var s = (typeof sessaoDe === 'function') ? sessaoDe(k) : (ST.plano || {})[k];
      if(!s) return 'sem treino em ' + k;
      var ets = (typeof etapasDe === 'function') ? etapasDe(s) : [];
      var f = (ST.feitas || {})[s.id] || [];
      return [k + ' · ' + (s.titulo || s.foco),
              'etapas: ' + ets.length + ' · marcas: ' + f.length,
              'concluída: ' + (typeof concluida === 'function' ? concluida(s) : '?'),
              ''].concat(ets.map(function(e){
                return (f.indexOf(e.id) >= 0 ? '  [x] ' : '  [ ] ') + e.t + '   ' + e.id;
              })).join('\n');
    },
    conferir: function(){
      var out = [];
      Object.keys(ST.plano || {}).sort().forEach(function(k){
        var s = ST.plano[k];
        if(!s) return;
        var f = (ST.feitas || {})[s.id] || [];
        if(!f.length) return;
        var ets = (typeof etapasDe === 'function') ? etapasDe(s) : [];
        var ids = ets.map(function(e){ return e.id });
        var orfas = f.filter(function(x){ return ids.indexOf(x) < 0 });
        out.push(k + '  ' + f.length + '/' + ets.length + ' marcas' +
                 (orfas.length ? '  ÓRFÃS: ' + orfas.length : '  ok'));
      });
      return out.length ? out.join('\n') : 'nenhuma sessão com marcas';
    }
  };

  /* redesenha com os ids novos, sem apagar nada */
  setTimeout(function(){
    try{
      if(ST.cache) ST.cache = {};
      if(typeof renderTudo === 'function') renderTudo();
    }catch(e){}
  }, 3000);
});


/* ═══ 40. A LAPIDE NAO MATA O QUE NASCEU DEPOIS DELA ═══

   O DEFEITO, provado com o codigo de verdade e nao por suposicao.

   Voce tirou a academia de hoje e pos amanha, 19/08, e ela sumiu.
   Instrumentei ST.extras com um vigia que grava quem apaga cada dia, e
   a sequencia foi esta:

     1. De manha, o limpar() quebrado da parte 33 apagou toda a academia
        futura e deixou uma LAPIDE em cada dia, inclusive 19/08.
        As lapides valem 24 horas (JANELA = 24 * 3600 * 1000).
     2. Voce removeu a de hoje. Certo, lapide em 18/08.
     3. Voce criou a de amanha. O caminho do app e este, no index.html:
              ST.extras[k] = x;  ...  persistir();
        Ele NAO chama bqDesapagar. A lapide de 19/08 continuou de pe.
     4. No salvamento, bqLimparApagados() varreu ST.extras, viu a lapide
        de 19/08 ainda valida e apagou a sessao que voce tinha acabado
        de criar. Sem erro, sem aviso.

   POR QUE ISSO NAO SE CONSERTA COM MAIS UM REMENDO. Existem doze
   lugares que escrevem em ST.extras, entre index.html e fix.js. Tapar
   um por um e como eu vinha fazendo — e por isso quebrava de novo a
   cada versao. Basta um caminho novo esquecer a linha e o defeito
   volta.

   A REGRA, QUE VALE PARA SEMPRE:

       uma lapide so pode matar o que e MAIS VELHO QUE ELA.

   Isso e o que qualquer sistema de sincronia faz para distinguir
   "apagado" de "recriado depois". Sem carimbo de hora, as duas coisas
   sao indistinguiveis, e o app sempre vai escolher errado.

   COMO ISTO E GARANTIDO, e nao pedido por favor:

   a) ST.extras passa a ser um objeto vigiado. Toda escrita, venha de
      onde vier — do botao do app, do semeador, da sincronia, de uma
      parte que eu ainda nem escrevi — recebe um carimbo __em e derruba
      a lapide daquele dia. Nao ha como um caminho novo esquecer,
      porque nao ha o que lembrar.

   b) bqLimparApagados compara os carimbos antes de apagar. Se a sessao
      nasceu depois da lapide, ela fica. Isso cobre o caso em que a
      lapide volta da nuvem depois da escrita, num segundo aparelho.

   c) Se alguem trocar ST.extras inteiro (o lerCoach faz isso), o vigia
      e reposto na hora, por um getter/setter em ST.

   NO CONSOLE:
     bqLapide.ver()        — as lapides de pe e o que elas ameacam
     bqLapide.limpar()     — derruba todas as lapides de extras
   ══════════════════════════════════════════════════════════════════ */

PARTE('lápide não mata o que nasceu depois', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  var TUM = 'bq.apagados';

  function tumulos(){
    try{ return JSON.parse(localStorage.getItem(TUM) || '{}') }catch(e){ return {} }
  }
  function tumuloEm(tipo, chave){
    var t = tumulos()[tipo + '|' + chave];
    return typeof t === 'number' ? t : null;
  }

  /* Derruba a lapide EU MESMO. Antes eu chamava window.bqDesapagar,
     que mora noutra parte — depender de outra parte para uma garantia
     e o mesmo que nao ter garantia. */
  function derrubar(tipo, chave){
    try{
      var m = tumulos(), c = tipo + '|' + chave;
      if(m[c]){ delete m[c]; localStorage.setItem(TUM, JSON.stringify(m)) }
    }catch(e){}
    try{ if(window.bqDesapagar) window.bqDesapagar(tipo, chave) }catch(e){}
  }

  /* O VIGIA SAIU DAQUI: havia um Proxy nesta parte e outro na 42, os
     dois tomando conta de ST.extras. Dois donos do mesmo objeto e como
     dois freios no mesmo pedal. O dono agora e a parte 42. Aqui fica so
     a guarda de idade abaixo. */

  /* ── b) a limpeza passa a comparar idades ── */
  var limparApp = window.bqLimparApagados;
  if(typeof limparApp === 'function'){
    window.bqLimparApagados = function(){
      var salvos = {};
      try{
        Object.keys(ST.extras || {}).forEach(function(k){
          var x = ST.extras[k];
          if(!x || typeof x !== 'object') return;
          var t = tumuloEm('extras', k);
          /* sem carimbo, a sessao e antiga: a lapide vale.
             com carimbo posterior a lapide, ela nasceu depois e fica. */
          /* >= e nao >: apagar e recriar no mesmo instante e comum, e
             Date.now() tem resolucao de milissegundo. Com > estrito, a
             recriacao rapida demais era tratada como anterior a lapide. */
          if(t && x.__em && x.__em >= t) salvos[k] = x;
        });
      }catch(e){}

      var r = limparApp.apply(this, arguments);

      var devolvidos = 0;
      Object.keys(salvos).forEach(function(k){
        if(!ST.extras[k]){
          derrubar('extras', k);         /* senão ela mata de novo no próximo save */
          ST.extras[k] = salvos[k];
          devolvidos++;
        }
      });
      if(devolvidos)
        console.log('lápide barrada: ' + devolvidos + ' sessão(ões) de academia ' +
                    'nasceram depois da lápide e ficaram');
      return r;
    };
  }

  /* ── diagnostico ── */
  window.bqLapide = {
    ver: function(){
      var m = tumulos(), agora = Date.now(), out = [];
      Object.keys(m).sort().forEach(function(c){
        var idade = Math.round((agora - m[c]) / 60000);
        var viva = (agora - m[c]) < 24 * 3600 * 1000;
        var chave = c.split('|')[1], tipo = c.split('|')[0];
        var alvo = tipo === 'extras' ? (ST.extras || {})[chave] : null;
        out.push(c.padEnd(28) + (viva ? 'de pé' : 'vencida').padEnd(9) +
                 'há ' + idade + ' min' +
                 (alvo ? '   ameaça: ' + (alvo.titulo || alvo.mod) +
                         (alvo.__em > m[c] ? ' (protegida)' : ' (VULNERÁVEL)') : ''));
      });
      return out.length ? out.join('\n') : 'nenhuma lápide';
    },
    limpar: function(){
      try{
        var m = tumulos(), n = 0;
        Object.keys(m).forEach(function(c){
          if(c.indexOf('extras|') === 0){ delete m[c]; n++ }
        });
        localStorage.setItem(TUM, JSON.stringify(m));
        try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
        return n + ' lápide(s) de academia derrubada(s)';
      }catch(e){ return 'falhou: ' + (e && e.message) }
    }
  };

  /* As lapides que a parte 33 quebrada deixou hoje ainda estao de pe e
     vao barrar academia por 24 horas. Como elas foram postas por um
     defeito, e nao por voce, derrubo as de academia uma unica vez. */
  try{
    var m = tumulos(), sujas = 0;
    Object.keys(m).forEach(function(c){
      if(c.indexOf('extras|') !== 0) return;
      var dia = c.split('|')[1];
      if(dia >= iso(HOJE)){ delete m[c]; sujas++ }
    });
    if(sujas){
      localStorage.setItem(TUM, JSON.stringify(m));
      console.log('limpeza única: ' + sujas + ' lápide(s) de academia futura removidas — ' +
                  'foram postas pelo defeito da parte 33, não por você');
    }
  }catch(e){}
});


/* ═══ 41. CONCLUIDO E O QUE VOCE FEZ, NAO UMA CONTA ═══

   O DEFEITO: o treino de VO2 de AMANHA apareceu como concluido, sem
   voce ter tocado nele.

   AS DUAS CAUSAS, somadas:

   1) O id de uma sessao do plano e a DATA. "2026-08-19", so isso.
      As suas marcas ficam em ST.feitas["2026-08-19"]. Quando o bloco e
      recomposto e coloca outro treino naquele dia, o treino novo herda
      as marcas do treino velho — porque para o app os dois sao "o
      treino do dia 19". Havia marcas de uma sessao anterior naquela
      data, e o VO2 nasceu vestindo elas.

   2) concluida() conta em vez de conferir:

          feitasDe(s.id).length >= e.length

      Sete marcas contra sete etapas da verdade a bandeira de
      concluido, mesmo que as sete marcas sejam de OUTRO treino e nao
      correspondam a nenhuma das etapas atuais.

      E a minha parte 39 piorou isso: ao converter marcas antigas "pela
      quantidade", eu produzia exatamente o numero necessario para a
      conta fechar. Eu criei o falso concluido tentando preservar
      historico.

   AS TRES REGRAS QUE ENTRAM NO LUGAR:

   a) CONCLUIDO E INTERSECAO, NAO SOMA. So contam as marcas que
      correspondem a uma etapa que existe agora. Marca orfa nao vale.

   b) TREINO NO FUTURO NAO PODE ESTAR CONCLUIDO. Nenhuma conta, nenhuma
      migracao, nenhuma sincronia pode dizer que amanha ja aconteceu.
      Esta e a trava que eu deveria ter posto desde o inicio: quando o
      mundo diz que uma coisa e impossivel, o app nao discute.

   c) MARCA ORFA DE DIA FUTURO E APAGADA. Se o bloco trocou o treino do
      dia, as marcas do treino antigo nao pertencem a ninguem.

   O QUE ISTO CUSTA: marcas antigas que nao casam com nenhuma etapa
   atual deixam de contar. Voce pode ter que remarcar algum treino
   passado. Preferi isso a te mostrar como feito algo que voce nao fez —
   um treino marcado errado some do KPI, some da aderencia, e a proxima
   quinzena e composta em cima de uma mentira.

   NO CONSOLE:
     bqConcluido.ver()       — hoje: etapas, marcas que casam e veredito
     bqConcluido.varrer()    — lista futuros com marca orfa
   ══════════════════════════════════════════════════════════════════ */

PARTE('concluído é o que você fez', function(){
  if(typeof window.concluida !== 'function') throw new Error('app sem concluida()');
  if(typeof ST !== 'object') throw new Error('sem ST');

  function ids(s){
    try{
      var e = (typeof etapasDe === 'function') ? etapasDe(s) : [];
      return e.map(function(x){ return x.id });
    }catch(err){ return [] }
  }
  function casadas(s){
    var f = (ST.feitas || {})[s.id] || [], lista = ids(s);
    return f.filter(function(x){ return lista.indexOf(x) >= 0 });
  }
  function futuro(s){
    var d = s && (s.data || s.id);
    return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && d > iso(HOJE);
  }

  /* ── a) e b) ── */
  var conclApp = window.concluida;
  window.concluida = function(s){
    if(!s) return false;
    /* b) amanhã não aconteceu. Ponto. */
    if(futuro(s)) return false;
    var lista = ids(s);
    if(!lista.length) return false;
    /* a) interseção, não soma */
    return casadas(s).length >= lista.length;
  };

  /* ── c) limpa marca órfã de dia futuro ── */
  function varrerFuturos(apagar){
    var out = [], hoje = iso(HOJE);
    var fontes = [ST.plano || {}, ST.extras || {}];
    fontes.forEach(function(fonte){
      Object.keys(fonte).forEach(function(k){
        var s = fonte[k];
        if(!s || !s.id) return;
        var d = s.data || k;
        if(!(d > hoje)) return;
        var f = (ST.feitas || {})[s.id] || [];
        if(!f.length) return;
        var boas = casadas(s);
        var orfas = f.length - boas.length;
        if(!orfas) return;
        out.push(d + '  ' + (s.titulo || s.foco) + ': ' + orfas + ' marca(s) órfã(s)');
        if(apagar){
          if(boas.length) ST.feitas[s.id] = boas;
          else delete ST.feitas[s.id];
        }
      });
    });
    return out;
  }

  window.bqConcluido = {
    ver: function(){
      var k = ST.sel || iso(HOJE);
      var s = (typeof sessaoDe === 'function') ? sessaoDe(k) : (ST.plano || {})[k];
      if(!s) return 'sem treino em ' + k;
      var lista = ids(s), f = (ST.feitas || {})[s.id] || [], c = casadas(s);
      return [k + ' · ' + (s.titulo || s.foco),
              'etapas agora     : ' + lista.length,
              'marcas guardadas : ' + f.length,
              'marcas que casam : ' + c.length,
              'é futuro         : ' + (futuro(s) ? 'sim — nunca conta como feito' : 'não'),
              'concluída        : ' + window.concluida(s)].join('\n');
    },
    varrer: function(){
      var r = varrerFuturos(false);
      return r.length ? r.join('\n') : 'nenhum treino futuro com marca órfã';
    }
  };

  /* na entrada, tira as marcas que nao pertencem a ninguem */
  setTimeout(function(){
    try{
      var r = varrerFuturos(true);
      if(r.length){
        console.log('marcas órfãs removidas de dias futuros:\n  ' + r.join('\n  '));
        try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
        try{ persistir() }catch(e){}
      }
    }catch(e){ console.warn('concluído/boot:', e && e.message) }
  }, 4000);
});


/* ═══ 42. CANCELADO FICA CANCELADO ═══

   O DEFEITO: voce cancelou a forca de hoje e ela voltou.

   A CAUSA, e ela e minha, de ontem. O unico mecanismo que impedia o
   semeador de reescrever um dia era a lapide. A parte 40, que escrevi
   para resolver OUTRO problema (a academia que voce movia sumia),
   passou a derrubar a lapide em TODA escrita — inclusive na escrita
   do proprio semeador. Consertei um lado e abri o outro.

   O ERRO DE FUNDO foi tratar todas as escritas como iguais. Nao sao:

     - voce criar uma academia    -> decisao sua
     - voce remover uma academia  -> decisao sua
     - o semeador criar uma       -> automatico

   O automatico NUNCA pode passar por cima da decisao. Essa e a regra
   que faltava, e ela vale para sempre, nao so para hoje.

   E A LAPIDE NAO SERVIA PARA ISSO. Ela vale 24 horas — foi feita para
   sincronia entre aparelhos, para um apagamento nao ser desfeito pelo
   celular que estava desligado. Se voce cancelar a forca do dia 25, a
   lapide vence amanha e o semeador repoe. O seu cancelamento tem que
   durar enquanto voce nao mudar de ideia, nao 24 horas.

   O QUE ESTA PARTE FAZ:

   1. ST.cancelExtra guarda os dias em que VOCE tirou a forca. Sem
      prazo de validade.
   2. O vigia de ST.extras (parte 40) passa a distinguir quem escreve.
      Escrita automatica (auto:true) em dia cancelado e IGNORADA, em
      silencio. Escrita sua apaga o cancelamento — porque por o treino
      de volta tambem e decisao sua.
   3. Apagar uma forca registra o cancelamento, venha o apagamento de
      onde vier: do botao do app, do painel do dia, de qualquer lugar.
   4. A lista viaja para o Firebase junto com o resto, por PATCH, e
      volta na leitura. Vale no iPhone, no Mac e num aparelho novo.

   PARA DESFAZER: crie a academia de novo pelo botao do app, no dia. O
   cancelamento daquele dia cai sozinho.

   NO CONSOLE:
     bqCancel.ver()          — os dias com força cancelada
     bqCancel.desfazer(dia)  — libera um dia
     bqCancel.limpar()       — libera todos
   ══════════════════════════════════════════════════════════════════ */

PARTE('cancelado fica cancelado', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  ST.cancelExtra = ST.cancelExtra || {};

  function cancelado(k){ return !!ST.cancelExtra[k] }
  function marcar(k){
    if(!k || typeof k !== 'string') return;
    ST.cancelExtra[k] = new Date().toISOString();
    console.log('força de ' + k + ' cancelada — o semeador não vai repor');
  }
  function liberar(k){
    if(ST.cancelExtra[k]){
      delete ST.cancelExtra[k];
      console.log('força de ' + k + ' liberada de novo');
    }
  }

  /* ── o vigia passa a distinguir quem escreve ── */
  function envolver(alvo){
    alvo = alvo || {};
    /* O objeto inteiro pode ser TROCADO (o lerCoach faz isso). Quem
       entra por essa porta nao passa pela armadilha de escrita:
       - forca automatica em dia cancelado nao entra
       - o que entra sem carimbo ganha um, senao a lapide mata tudo */
    try{
      Object.keys(alvo).forEach(function(k){
        var x = alvo[k];
        if(!x || typeof x !== 'object') return;
        if(x.auto === true && cancelado(k)){ delete alvo[k]; return }
        if(!x.__em) x.__em = Date.now();
      });
    }catch(e){}

    return new Proxy(alvo, {
      set: function(o, k, v){
        if(typeof k === 'string' && v && typeof v === 'object'){
          var auto = (v.auto === true);
          if(auto && cancelado(k)){
            /* o semeador tentando repor o que voce tirou: nao entra */
            return true;
          }
          if(!auto && v.mod === 'forca') liberar(k);   /* voce pos de volta */
          if(!v.__em) v.__em = Date.now();
          /* quem guarda a sua intencao agora e o cancelExtra, nao a
             lapide — entao a lapide pode cair nos dois casos */
          {
            try{
              var TUM = 'bq.apagados';
              var m = JSON.parse(localStorage.getItem(TUM) || '{}');
              if(m['extras|' + k]){ delete m['extras|' + k]; localStorage.setItem(TUM, JSON.stringify(m)) }
            }catch(e){}
            try{ if(window.bqDesapagar) window.bqDesapagar('extras', k) }catch(e){}
          }
        }
        o[k] = v;
        return true;
      },
      deleteProperty: function(o, k){
        /* apagar uma forca e sempre uma decisao, venha de onde vier */
        try{
          var x = o[k];
          if(x && x.mod === 'forca' && typeof k === 'string' && k >= iso(HOJE)) marcar(k);
        }catch(e){}
        delete o[k];
        return true;
      }
    });
  }

  var _ex = envolver(ST.extras);
  try{
    Object.defineProperty(ST, 'extras', {
      configurable: true,
      get: function(){ return _ex },
      set: function(v){ _ex = envolver(v) }
    });
  }catch(e){ throw new Error('não consegui vigiar ST.extras: ' + (e && e.message)) }

  /* ── viaja para a nuvem junto com o resto ── */
  var salvarApp = window.salvarCoach;
  if(typeof salvarApp === 'function'){
    window.salvarCoach = async function(){
      var r = await salvarApp.apply(this, arguments);
      try{
        if(ST.cancelExtra && Object.keys(ST.cancelExtra).length){
          var t = await fbToken();
          if(t) await fetch(FB_DB + '/' + FB_COACH + '.json?auth=' + t,
            { method:'PATCH', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ cancelExtra: ST.cancelExtra }) });
        }
      }catch(e){ console.warn('cancel/salvar:', e && e.message) }
      return r;
    };
  }

  var lerApp = window.lerCoach;
  if(typeof lerApp === 'function'){
    window.lerCoach = async function(){
      var c = await lerApp.apply(this, arguments);
      try{
        if(c && c.cancelExtra) ST.cancelExtra = Object.assign({}, c.cancelExtra, ST.cancelExtra || {});
      }catch(e){}
      return c;
    };
  }

  /* ── faxina: cancelamento de dia que ja passou nao serve mais ── */
  function podar(){
    var hoje = iso(HOJE), n = 0;
    Object.keys(ST.cancelExtra || {}).forEach(function(k){
      if(k < hoje){ delete ST.cancelExtra[k]; n++ }
    });
    return n;
  }

  window.bqCancel = {
    ver: function(){
      var ks = Object.keys(ST.cancelExtra || {}).sort();
      if(!ks.length) return 'nenhum dia com força cancelada';
      var D = ['','seg','ter','qua','qui','sex','sáb','dom'];
      return ks.map(function(k){
        return k + '  ' + D[dow(dt(k))] + '   cancelada em ' +
               String(ST.cancelExtra[k]).slice(0, 16).replace('T', ' ');
      }).join('\n');
    },
    desfazer: function(k){
      liberar(k);
      try{ if(window.bqForcaBloco) window.bqForcaBloco.sincronizar() }catch(e){}
      try{ renderTudo(); persistir() }catch(e){}
      return 'liberado ' + k;
    },
    limpar: function(){
      var n = Object.keys(ST.cancelExtra || {}).length;
      ST.cancelExtra = {};
      try{ if(window.bqForcaBloco) window.bqForcaBloco.sincronizar() }catch(e){}
      try{ renderTudo(); persistir() }catch(e){}
      return n + ' dia(s) liberado(s)';
    }
  };

  setTimeout(function(){ try{ if(podar()) persistir() }catch(e){} }, 8000);
});


/* ═══ 43. UM PLANO SO ═══

   VOCE DISSE: "os numeros nao batem com os do Coach". Estao os dois
   errados de origens diferentes, e as duas causas sao minhas.

   CAUSA 1 — DOIS PLANOS VIVENDO JUNTOS.
   O card "Progresso do ciclo" nao le o bloco. Ele le um plano fixo de
   dez semanas que eu deixei cravado no fix.js meses atras:

       S1 42 · S2 47 · S3 53 · S4 38 · S5 55
       S6 57 · S7 60 · S8 44 · S9 40 · S10 23 km

   Sao exatamente os numeros da sua tela. E e justamente o que voce me
   pediu tres vezes para NAO existir: plano pronto alem de duas
   semanas. Eu troquei o motor por blocos de 14 dias e esqueci de
   desligar o painel antigo. O app passou a mostrar dois planos que
   discordam, e voce, com razao, nao soube em qual acreditar.

   CAUSA 2 — O "189% DO PREVISTO".
   O bloco compara os km reais das duas semanas anteriores com o que
   estava planejado para elas. Mas ele procura esse "planejado" em
   ST.plano — que so guarda os 14 dias vigentes. As duas semanas
   ANTERIORES ja nao estao la. Entao dividia 66,2 km reais por um
   plano quase vazio e dava 189%.

   E o mesmo erro do "5/47 = 66%" de ontem: numerador e denominador
   medindo periodos diferentes. Eu ja tinha escrito o ST.hist
   exatamente para guardar quanto cada bloco pediu por semana — e nao
   usei na hora de fazer a conta.

   O QUE MUDA:

   a) O card do ciclo passa a sair do que REALMENTE foi planejado: o
      ST.hist para as semanas que ja passaram, e o bloco vigente para
      as duas atuais. As semanas seguintes aparecem como "—" e o
      rodape diz por que: elas ainda nao existem.

   b) A aderencia so conta semanas com plano registrado. Sem registro,
      "—". Preferi um traco a um numero inventado.

   c) O plano fixo de dez semanas e desligado. Ele nao manda em nada
      ha semanas; so enfeitava a tela com numeros que ninguem estava
      cumprindo.

   NO CONSOLE:
     bqCiclo.ver()   — semana a semana, planejado e real, com a origem
   ══════════════════════════════════════════════════════════════════ */

PARTE('um plano só', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');

  /* ── a) o plano fixo sai de cena ── */
  try{
    if(window.planoBQ && window.planoBQ.ligado && window.planoBQ.ligado()){
      window.planoBQ.desligar();
      console.log('plano fixo de 10 semanas desligado — quem manda é o bloco');
    }
  }catch(e){}

  var segDe = function(k){ return iso(addD(dt(k), -(dow(dt(k)) - 1))) };

  function reais(){
    var m = {};
    ((ST.runs) || []).forEach(function(r){
      if(!r || r.walk || (r.mod || 'corrida') !== 'corrida' || !(r.km > 0)) return;
      var k = r.data || iso(addD(HOJE, -r.d));
      var s = segDe(k);
      m[s] = +((m[s] || 0) + r.km).toFixed(1);
    });
    return m;
  }

  /* planejado por semana: hist para o passado, bloco para o presente */
  function planejado(){
    var m = {};

    /* FONTE 1 — o plano que estava em vigor ANTES do primeiro bloco.
       Ate 17/08 quem mandava era o plano fixo de dez semanas. Ele e um
       registro do que foi pedido naquele periodo, e por isso serve de
       denominador para aquelas semanas.

       AQUI EU JA ERREI DUAS VEZES, e vale deixar escrito:
         1a) usei o ST.hist, que estava vazio, e disse que o plano "nao
             existia em lugar nenhum". Existia.
         2a) usei o ST.plano. Parecia certo, mas o peneirar() APAGA de
             la os dias cancelados ou movidos, a cada desenho de tela.
             O ST.plano de uma semana passada nao e "o que o plano
             pediu": e "o que sobrou do plano". Como denominador ele
             encolhe e infla a porcentagem — 39 de 22 daria 177%. Era o
             mesmo defeito do "189%", so que a meu favor, o que o torna
             mais perigoso, nao menos. */
    /* O plano fixo so vale ATE o primeiro bloco. Dali em diante quem
       manda sao os blocos, e semana que o bloco ainda nao compos NAO
       pode ganhar um numero vindo do plano de dez semanas — seria
       justamente o plano pronto que voce mandou tirar, entrando pela
       porta dos fundos. Sem isso, a S3 aparecia com 53 km previstos
       para uma quinzena que ainda nem foi montada. */
    var corte = null;
    try{
      var cands = [];
      if(ST.bloco && ST.bloco.inicio) cands.push(segDe(ST.bloco.inicio));
      Object.keys(ST.hist || {}).forEach(function(k){ cands.push(k) });
      if(cands.length){ cands.sort(); corte = cands[0] }
    }catch(e){}

    try{
      var fixo = window.planoBQ && window.planoBQ.plano;
      if(fixo){
        var acc = {};
        Object.keys(fixo).forEach(function(k){
          var x = fixo[k];
          if(!x || x.prova || !(x.km > 0)) return;
          var seg = segDe(k);
          acc[seg] = +((acc[seg] || 0) + (+x.km || 0)).toFixed(1);
        });
        Object.keys(acc).forEach(function(seg){
          if(!(acc[seg] > 0)) return;
          if(corte && seg >= corte) return;      /* dali em diante, quem manda e o bloco */
          m[seg] = { km: acc[seg], de: 'plano fixo' };
        });
      }
    }catch(e){}

    /* FONTE 2 — o registro que cada bloco deixou ao compor a quinzena.
       Sobrepoe o plano fixo, porque a partir do primeiro bloco e ele
       quem passou a mandar. */
    Object.keys(ST.hist || {}).forEach(function(seg){
      var h = ST.hist[seg];
      if(h && h.planKm > 0) m[seg] = { km: +h.planKm, de: 'bloco anterior' };
    });

    /* FONTE 3 — o bloco vigente manda nas duas semanas dele. */
    var B = ST.bloco;
    if(B && B.sessoes){
      var bl = {};
      Object.keys(B.sessoes).forEach(function(k){
        var x = B.sessoes[k];
        if(!x || x.mod !== 'corrida' || x.prova) return;
        var seg = segDe(k);
        bl[seg] = +((bl[seg] || 0) + (+x.km || 0)).toFixed(1);
      });
      Object.keys(bl).forEach(function(seg){ m[seg] = { km: bl[seg], de: 'bloco vigente' } });
    }

    /* O ST.plano NAO entra. Ele e a agenda, nao o registro do previsto:
       o que voce cancela some de la. */
    return m;
  }

  function dataProva(){
    try{ if(ST.objetivo && ST.objetivo.data) return ST.objetivo.data }catch(e){}
    return '2026-10-18';
  }

  function semanas(){
    /* NUMERACAO FIXA E ANCORADA NO CALENDARIO:
         S1 = a semana passada
         S2 = esta semana
         ... ate a semana da prova.

       Antes eu montava a lista a partir do que existia no banco, e por
       isso a numeracao ANDAVA: quando entrava registro de mais uma
       semana antiga, o que era S1 virava S5 e voce perdia a
       referencia. Um rotulo que muda de significado sozinho nao serve
       para nada. A regua e o calendario. */
    var P = planejado(), R = reais();
    var hojeSeg = segDe(iso(HOJE));
    var ini = segDe(iso(addD(HOJE, -7)));
    var fim = segDe(dataProva());
    if(fim < hojeSeg) fim = hojeSeg;

    var out = [], k = ini, i = 0;
    while(k <= fim && i < 60){
      out.push({ seg: k, n: i + 1,
                 plan: P[k] != null ? P[k].km : null,
                 de:   P[k] != null ? P[k].de : null,
                 real: R[k] || 0,
                 atual: k === hojeSeg,
                 futura: k > hojeSeg,
                 prova: k === segDe(dataProva()) });
      k = iso(addD(dt(k), 7)); i++;
    }
    return out;
  }

  window.bqCiclo = {
    semanas: semanas,
    /* Para as semanas anteriores ao registro de planos, o previsto nao
       existe em lugar nenhum — o ST.hist so comecou a ser gravado
       agora. Em vez de inventar um numero, deixo voce dizer qual era:
         bqCiclo.registrar('2026-08-10', 42)
       A partir dai a linha passa a ter plano, porcentagem e a entrar
       na aderencia do ciclo, como qualquer outra. */
    registrar: function(segunda, km){
      if(!segunda || !(km > 0)) return 'use bqCiclo.registrar("2026-08-10", 42)';
      ST.hist = ST.hist || {};
      ST.hist[segunda] = ST.hist[segunda] || { planKm: 0, longoPlan: 0 };
      ST.hist[segunda].planKm = +km;
      try{ montar(); persistir() }catch(e){}
      return 'semana de ' + segunda + ' agora tem plano de ' + km + ' km';
    },
    ver: function(){
      var L = semanas();
      if(!L.length) return 'sem semanas para mostrar';
      return L.map(function(w){
        return w.seg + (w.atual ? ' *' : '  ') + '  real ' +
               String(w.real.toFixed(1)).padStart(6) + ' km   plano ' +
               (w.plan != null ? String(w.plan.toFixed(1)).padStart(6) + ' km  (' + w.de + ')'
                               : '     —   (ainda não composto)');
      }).join('\n');
    }
  };

  /* ── b) o card, refeito ── */
  var CSS = [
'#bqCic{background:var(--s1);border-radius:var(--r-lg);padding:16px;margin-bottom:14px}',
'#bqCic .kicker{display:block;margin-bottom:9px}',
'#bqCic .topo{display:flex;align-items:baseline;gap:9px;margin-bottom:3px}',
'#bqCic .pct{font-size:29px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums}',
'#bqCic .sub{font-size:11.5px;color:var(--tx3);line-height:1.5;margin:0 0 12px}',
'#bqCic .lin{display:grid;grid-template-columns:30px 1fr 74px 40px;gap:8px;align-items:center;',
'  padding:5px 0;font-size:11.5px;font-variant-numeric:tabular-nums}',
'#bqCic .lin+.lin{border-top:1px solid rgba(128,128,128,.13)}',
'#bqCic .lin b{font-weight:700;opacity:.75}',
'#bqCic .lin.hoje{background:rgba(128,128,128,.07);border-radius:6px;padding-left:4px;padding-right:4px}',
'#bqCic .bar{height:9px;border-radius:5px;background:rgba(128,128,128,.16);overflow:hidden;position:relative}',
'#bqCic .bar i{display:block;height:100%;border-radius:5px}',
'#bqCic .km{opacity:.6;text-align:right}',
'#bqCic .p{text-align:right;font-weight:700}',
'#bqCic .nota{font-size:11px;color:var(--tx3);margin-top:11px;line-height:1.5}',
'#bqCic .nota b{color:var(--tx2)}'
  ].join('\n');

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  function cor(p){ return p >= .95 ? '#3FD98A' : p >= .80 ? '#F5C544' : '#F2685C' }

  function montar(){
    var alvo = document.getElementById('objBox');
    if(!alvo || !alvo.parentNode) return;

    /* o card antigo, se ainda existir, sai */
    var velho = document.getElementById('bqLinha');
    if(velho && velho.parentNode) velho.parentNode.removeChild(velho);

    var L = semanas();
    if(!L.length) return;

    var box = document.getElementById('bqCic');
    if(!box){
      box = document.createElement('section');
      box.id = 'bqCic';
      alvo.parentNode.insertBefore(box, alvo);
    }

    /* aderencia so nas semanas FECHADAS e com plano registrado */
    var somaP = 0, somaR = 0, n = 0;
    L.forEach(function(w){
      if(w.atual || w.plan == null || w.seg > segDe(iso(HOJE))) return;
      somaP += w.plan; somaR += Math.min(w.real, w.plan); n++;
    });
    var ad = somaP > 0 ? somaR / somaP : null;

    /* Para a semana SEM plano registrado eu mostrava "39/— km" e uma
       barra cheia e chapada. Os km estavam la, mas o "/—" fazia a linha
       parecer vazia — e ela nao esta vazia: e uma semana que voce
       cumpriu, so que o app ainda nao guardava o que tinha pedido.
       Agora ela mostra "39 km", e a barra tem o tamanho do volume
       comparado a maior semana da lista. Informa sem julgar. */
    var maiorReal = 0;
    L.forEach(function(w){ if(w.real > maiorReal) maiorReal = w.real });

    var linhas = L.map(function(w){
      var temPlano = w.plan != null && w.plan > 0;
      var p = temPlano ? Math.min(1.15, w.real / w.plan) : 0;

      var comecou  = !w.futura;
      var vazia    = !temPlano && w.futura;
      var orfa     = !temPlano && comecou;
      var julgavel = temPlano && comecou && !w.atual;

      var larg = orfa ? (maiorReal > 0 ? Math.round(w.real / maiorReal * 100) : 0)
                      : Math.round(Math.min(1, p) * 100);

      var fundo = (vazia || !comecou) ? 'transparent'
                : orfa                ? 'rgba(155,169,188,.55)'
                : w.atual             ? 'var(--acc,#C9F24E)'
                                      : cor(p);

      return '<div class="lin' + (w.atual ? ' hoje' : '') + '">'
        + '<b>' + (w.prova ? 'PEI' : 'S' + w.n) + '</b>'
        + '<span class="bar"><i style="width:' + larg + '%;background:' + fundo + '"></i></span>'
        + '<span class="km">' + (orfa ? w.real.toFixed(0) + ' km'
             : w.real.toFixed(0) + '/' + (temPlano ? w.plan.toFixed(0) + ' km' : '— km')) + '</span>'
        + '<span class="p" style="opacity:' + (julgavel ? '1' : w.atual ? '.7' : '.35')
        + ';color:' + (julgavel ? cor(p) : 'inherit') + '">'
        + (temPlano && comecou ? Math.round(p * 100) + '%' : orfa ? '' : '—')
        + '</span></div>';
    }).join('');

    var semPlano = L.filter(function(w){ return w.plan == null }).length;
    var faltam = Math.max(0, Math.ceil(diff(iso(HOJE), dataProva()) / 7));

    /* Sem semana fechada, o cabecalho mostrava um traco grande — inutil
       justamente agora, que e quando o ST.hist esta comecando. Entao
       mostro a semana EM CURSO, que e o numero que interessa hoje. */
    var atual = null;
    L.forEach(function(w){ if(w.atual) atual = w });
    var temAtual = atual && atual.plan != null && atual.plan > 0;
    var pAtual = temAtual ? Math.min(1.15, atual.real / atual.plan) : null;

    var cabeca, sub;
    if(ad != null){
      cabeca = '<span class="pct" style="color:' + cor(ad) + '">' + Math.round(ad * 100) + '%</span>'
             + '<span style="font-size:11.5px;opacity:.65">' + n + ' semana' + (n > 1 ? 's' : '')
             + ' fechada' + (n > 1 ? 's' : '') + ' · faltam ' + faltam + ' até a prova</span>';
      sub = Math.round(somaR) + ' km dos ' + Math.round(somaP) +
            ' km que os blocos pediram nas semanas já fechadas.';
    } else if(temAtual){
      cabeca = '<span class="pct">' + atual.real.toFixed(0)
             + '<span style="font-size:15px;opacity:.55">/' + atual.plan.toFixed(0) + ' km</span></span>'
             + '<span style="font-size:11.5px;opacity:.65">nesta semana · faltam '
             + faltam + ' até a prova</span>';
      sub = 'Você fez <b style="color:var(--tx2)">' + Math.round((pAtual || 0) * 100) +
            '%</b> do que o bloco pediu para esta semana. A aderência do ciclo aparece quando ' +
            'a primeira semana com plano registrado fechar.';
    } else {
      cabeca = '<span class="pct">—</span><span style="font-size:11.5px;opacity:.65">faltam '
             + faltam + ' até a prova</span>';
      sub = 'Ainda não há semana com plano registrado para comparar.';
    }

    box.innerHTML =
      '<span class="kicker">Progresso do ciclo</span>'
      + '<div class="topo">' + cabeca + '</div>'
      + '<p class="sub">' + sub + '</p>'
      + linhas
      + '<p class="nota">Cada linha compara o que você correu com o que <b>o bloco daquela '
      + 'quinzena pediu</b>. As primeiras não têm previsto porque o app ainda não guardava esse '
      + 'registro — mostro os quilômetros que você fez, e a barra é o volume comparado à sua maior '
      + 'semana. As com <b>—</b> ainda não começaram, e a semana em curso só entra na aderência '
      + 'quando fechar.</p>';
  }

  ['renderCoach','renderDia','renderSemana'].forEach(function(nome){
    var orig = window[nome];
    if(typeof orig !== 'function') return;
    window[nome] = function(){
      var r = orig.apply(this, arguments);
      try{ montar() }catch(e){ console.warn('ciclo:', e && e.message) }
      return r;
    };
  });

  setTimeout(function(){ try{ montar() }catch(e){} }, 5000);
});


/* ═══ 44. O DIA VIRA A MEIA-NOITE ═══

   ESTE E O DEFEITO DE RAIZ POR TRAS DE VARIAS COISAS ESTRANHAS QUE
   VOCE VIU HOJE — inclusive a semana em curso aparecer com 0 km
   depois de voce ter corrido.

   O QUE ACONTECE. O index.html calcula o dia UMA VEZ, ao carregar:

       const HOJE = new Date(); HOJE.setHours(0,0,0,0);   (linha 1070)

   O app instalado na tela de inicio do iPhone nao recarrega. Ele
   dorme e acorda, e pode ficar dias com a mesma pagina viva. Entao o
   HOJE fica parado no dia em que voce abriu.

   E ISSO JOGA TREINO FORA. Em mapAtividade:

       const d = Math.round((HOJE - dd)/864e5);
       if(d < 0 || d > 3000) return null;                 (linha 1806)

   Com o HOJE de ontem, a corrida de hoje tem d = -1 e e DESCARTADA
   antes de chegar a qualquer tela. Nao e o card que erra: o treino
   nunca chega nele.

   O estrago vai muito alem disso: "hoje" no calendario, o que conta
   como passado ou futuro, a janela de 14 dias, a aderencia, o KPI, o
   bloco — tudo compara com o HOJE. Um dia congelado desalinha o app
   inteiro em silencio.

   O CONSERTO. HOJE e const, entao nao da para reatribuir. Mas e um
   Date, e Date e mutavel: setTime() muda o valor no lugar, e todas as
   referencias que ja existem passam a ver o dia certo. Nao e truque —
   e a unica forma de corrigir sem reescrever o index.html inteiro.

   QUANDO VERIFICO: ao voltar para o app (visibilitychange, focus,
   pageshow) e uma vez por minuto para quem deixa a tela aberta. A
   verificacao e uma comparacao de numeros; so faz trabalho de verdade
   quando o dia mudou mesmo.

   AO VIRAR O DIA: releio as atividades do dado bruto (que guarda a
   data escrita, e nao depende de HOJE), limpo os caches e redesenho.

   NO CONSOLE:
     bqHoje.ver()     — o dia que o app pensa que e, e o de verdade
     bqHoje.virar()   — forca a virada agora
   ══════════════════════════════════════════════════════════════════ */

PARTE('o dia vira à meia-noite', function(){
  if(typeof HOJE === 'undefined' || !(HOJE instanceof Date))
    throw new Error('app sem HOJE');

  function alvo(){
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  var virando = false;

  function virar(){
    if(virando) return false;
    var novo = alvo();
    if(HOJE.getTime() === novo) return false;

    virando = true;
    var antes = iso(HOJE);
    try{
      /* HOJE e const: nao da para reatribuir, mas Date e mutavel.
         setTime muda o valor no lugar e todo mundo passa a ver o dia
         certo, inclusive o codigo que ja guardou a referencia. */
      HOJE.setTime(novo);
      console.log('o dia virou: ' + antes + ' → ' + iso(HOJE) +
                  ' — relendo as atividades');

      /* releitura: o dado bruto tem a data ESCRITA em cada atividade,
         entao nao carrega o erro do dia congelado */
      try{
        if(typeof RAW === 'object' && RAW && typeof absorver === 'function') absorver(RAW);
      }catch(e){ console.warn('hoje/absorver:', e && e.message) }

      try{ if(ST && ST.cache) ST.cache = {} }catch(e){}
      try{ if(typeof rebuild === 'function') rebuild() }catch(e){}

      /* se o dia selecionado ficou para tras, pula para hoje */
      try{
        if(ST && ST.sel && ST.sel < iso(HOJE)) ST.sel = iso(HOJE);
      }catch(e){}

      try{ if(typeof renderTudo === 'function') renderTudo();
           else if(typeof renderCoach === 'function') renderCoach() }catch(e){}
    } finally {
      virando = false;
    }
    return true;
  }

  try{
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden) virar();
    });
  }catch(e){}
  try{ window.addEventListener('focus', virar) }catch(e){}
  try{ window.addEventListener('pageshow', virar) }catch(e){}

  /* para quem deixa o app aberto atravessando a meia-noite */
  try{ setInterval(virar, 60000) }catch(e){}

  window.bqHoje = {
    virar: virar,
    ver: function(){
      var real = new Date(alvo());
      return ['o app pensa que hoje é : ' + iso(HOJE),
              'hoje de verdade é       : ' + iso(real),
              'defasagem               : ' +
                Math.round((alvo() - HOJE.getTime()) / 864e5) + ' dia(s)'].join('\n');
    }
  };

  /* uma virada na entrada, caso a pagina tenha ficado viva desde ontem */
  setTimeout(function(){ try{ virar() }catch(e){} }, 2500);
});


/* ═══ 45. UM ALVO SO: PEI, 18/10/2026 ═══

   O DEFEITO, e ele foi causado por mim ontem.

   O cartao "Feito x planejado" mostrava 0/0, o plano comecava HOJE e
   ia ate 09/12. O diagnostico na tela deu a resposta:

       Objetivo: Maratona em 2026-12-09, 16 semanas

   O objetivo ativo do app nao era a PEI. Era a "Maratona" generica do
   catalogo, de 16 semanas. E 09/12 menos 16 semanas da exatamente
   19/08 — por isso o ciclo inteiro nasceu hoje e o passado sumiu.

   POR QUE ACONTECEU. A parte que marca a PEI como objetivo e a MESMA
   que gerava o plano fixo de dez semanas:

       function aplicar(){
         if(!ligado()) return;
         ST.objetivo = {fam:'corrida', id:'bq42', data:'2026-10-18', ...};
         rebuild(); ...
       }

   Quando a parte 43 chamou planoBQ.desligar() para tirar o plano
   pronto de dez semanas — que voce mandou tirar, com razao —, ela
   desligou junto a atribuicao do objetivo. As duas coisas moravam
   atras da mesma chave. O app entao caiu no objetivo padrao dele.

   E o resto continuou mirando 18/10: a projecao, o contador de dias,
   o gerador de blocos. O app passou a ter dois alvos, e todo numero
   que dependia do ciclo saiu errado.

   O CONSERTO. O alvo passa a ter dono proprio, separado do plano
   fixo. Esta parte garante, a cada arranque, que o objetivo ativo e a
   PEI de 18/10/2026, com as 10 semanas de ciclo — independente de o
   plano fixo estar ligado ou desligado.

   NAO E CRAVAR DE NOVO NO CODIGO: se um dia voce escolher outra prova
   pela tela, o app respeita, porque so corrijo quando o objetivo esta
   no item generico '42k' que ninguem escolheu de proposito. Trocar de
   alvo continua sendo decisao sua; cair no padrao por acidente, nao.

   NO CONSOLE:
     bqAlvo.ver()      — o objetivo ativo e o que o ciclo cobre
     bqAlvo.fixar()    — forca a PEI agora
   ══════════════════════════════════════════════════════════════════ */

PARTE('um alvo só: PEI', function(){
  if(typeof ST !== 'object') throw new Error('sem ST');
  if(typeof OBJETIVOS !== 'object') throw new Error('sem OBJETIVOS');

  var ALVO = { fam:'corrida', id:'bq42', data:'2026-10-18',
               nome:'PEI Marathon · índice Boston' };

  /* o item precisa existir no catalogo, senao objetivoAtivo() devolve
     null e o app fica sem plano nenhum */
  function garantirItem(){
    try{
      var itens = OBJETIVOS.corrida && OBJETIVOS.corrida.itens;
      if(!itens) return false;
      if(!itens.some(function(x){ return x.id === ALVO.id })){
        itens.push({ id: ALVO.id, n: ALVO.nome, dist: 42.2, sem: 10,
                     longoMax: 32, volBase: 60 });
        console.log('alvo: item da PEI recolocado no catálogo');
      }
      return true;
    }catch(e){ return false }
  }

  function precisaCorrigir(){
    var o = ST.objetivo;
    if(!o) return true;
    if(o.id === ALVO.id && o.data === ALVO.data) return false;
    /* se voce escolheu outra prova de proposito, eu nao mexo.
       So corrijo o caso do item generico '42k', que e onde o app cai
       sozinho quando perde o objetivo. */
    if(o.id === '42k' || !o.id) return true;
    return false;
  }

  function fixar(forcado){
    if(!garantirItem()) return 'catálogo sem corrida';
    if(!forcado && !precisaCorrigir()) return 'objetivo já é a PEI';
    var antes = ST.objetivo ? (ST.objetivo.nome || ST.objetivo.id) + ' em ' + ST.objetivo.data : 'nenhum';
    ST.objetivo = { fam: ALVO.fam, id: ALVO.id, data: ALVO.data,
                    nome: ALVO.nome, dataManual: true };
    console.log('alvo corrigido: ' + antes + ' → PEI em ' + ALVO.data);
    try{ if(ST.cache) ST.cache = {} }catch(e){}
    try{ if(typeof rebuild === 'function') rebuild() }catch(e){}
    try{ if(typeof selecionarProximo === 'function') selecionarProximo() }catch(e){}
    try{ if(typeof renderTudo === 'function') renderTudo() }catch(e){}
    try{ if(typeof persistir === 'function') persistir() }catch(e){}
    return 'objetivo agora é a PEI em ' + ALVO.data;
  }

  window.bqAlvo = {
    fixar: function(){ return fixar(true) },
    ver: function(){
      var o = null;
      try{ o = (typeof objetivoAtivo === 'function') ? objetivoAtivo() : null }catch(e){}
      var ks = Object.keys(ST.plano || {}).sort();
      return ['objetivo em ST : ' + (ST.objetivo ? ST.objetivo.id + ' · ' + ST.objetivo.data : 'nenhum'),
              'objetivo ativo : ' + (o ? (o.nome || o.n) + ' · ' + o.data + ' · ' + o.sem + ' semanas' : 'nenhum'),
              'plano          : ' + ks.length + ' dias' +
                (ks.length ? ' (' + ks[0] + ' a ' + ks[ks.length-1] + ')' : ''),
              'precisa corrigir: ' + (precisaCorrigir() ? 'SIM' : 'não')].join('\n');
    }
  };

  /* no arranque, e de novo depois que a nuvem responde — o boot do app
     e assincrono e sobrescreve ST.objetivo com o que veio do Firebase */
  fixar(false);
  setTimeout(function(){ try{ fixar(false) }catch(e){} }, 3000);
  setTimeout(function(){ try{ fixar(false) }catch(e){} }, 9500);
});


/* ═══ 46. A ABA COACH GANHA HIERARQUIA E COR ═══

   O QUE VOCE PEDIU: a aba Coach esta monocromatica, sem vida, e nao
   da para saber onde olhar primeiro.

   O DIAGNOSTICO. Tudo na tela tem o mesmo peso visual: titulo de
   secao, nome do treino, texto explicativo e numero importante usam
   pesos e tamanhos parecidos, e quase tudo e cinza. Quando tudo grita
   igual, nada e ouvido. E o oposto do que a planilha fez do outro
   lado, onde a cor carrega significado.

   O QUE ESTA PARTE FAZ — e o que ela NAO faz.

   NAO MEXE EM NENHUMA CONTA. Nenhum numero muda, nenhuma regra muda,
   nenhuma funcao e embrulhada. E so folha de estilo e uma marcacao de
   cor na etapa principal do dia. Se voce apagar esta parte, os mesmos
   numeros continuam na tela, so que sem enfase.

   AS TRES REGRAS DE ESTILO:

   1. HIERARQUIA. Titulo de secao (o "kicker") fica maior e mais
      claro, com um filete na cor de destaque a esquerda. Nome de
      treino ganha peso. Texto explicativo diminui e recua. Assim o
      olho encontra a ordem: onde estou, o que e hoje, os detalhes.

   2. COR COM SIGNIFICADO, nunca decorativa. Uso a mesma paleta da
      planilha, para verde continuar querendo dizer "leve" e vermelho
      "forte" nas duas telas. A etapa PRINCIPAL do dia recebe a cor da
      intensidade do treino; as etapas de apoio ficam discretas.

   3. O NUMERO GRANDE E O PROTAGONISTA. Dias para a prova, km do dia e
      ritmo alvo ganham tamanho e cor. Eram do mesmo tamanho do texto
      ao lado.

   NO CONSOLE:
     bqVisual.desligar()   — volta ao visual anterior
     bqVisual.ligar()
   ══════════════════════════════════════════════════════════════════ */

PARTE('visual da aba coach', function(){
  var OFF = 'bq.visual.off';
  var ligado = function(){ try{ return localStorage.getItem(OFF) !== '1' }catch(e){ return true } };

  /* mesma paleta da planilha: a cor quer dizer a mesma coisa nas duas telas */
  var ZC = {
    prova:'#FFFFFF', soltura:'#7C93A8', rec:'#7C93A8', facil:'#3FD98A',
    longo:'#C9F24E', mp:'#F5C544', progressivo:'#F5C544', limiar:'#F79256',
    tempo:'#F79256', vo2:'#F2685C', intervalado:'#F2685C', fartlek:'#F2685C',
    tiros:'#C77DFF', ladeira:'#C77DFF', forca:'#9AA5B8', cross:'#4FA6F5', brick:'#4FA6F5'
  };
  var MODC = { bike:'#4FA6F5', natacao:'#3FE0C4', forca:'#9AA5B8' };

  function corDe(s){
    if(!s) return null;
    if(s.prova) return ZC.prova;
    if(s.mod && s.mod !== 'corrida') return MODC[s.mod] || ZC.forca;
    return ZC[s.foco] || ZC.facil;
  }

  var css = document.createElement('style');
  css.id = 'bqVisualCSS';
  css.textContent = [
/* ── 1. hierarquia: o titulo de secao vira ancora ── */
'body.bqv .kicker{font-size:10.5px;letter-spacing:.14em;color:var(--tx2);',
'  display:inline-flex;align-items:center;gap:7px}',
'body.bqv .kicker:before{content:"";width:3px;height:11px;border-radius:2px;',
'  background:var(--acc);flex:none;opacity:.85}',

/* ── 2. o hero: o contador de dias e o protagonista ── */
'body.bqv .hero h1{font-weight:800;letter-spacing:-.02em}',
'body.bqv .hero .cd .n{font-weight:800;letter-spacing:-.04em}',
'body.bqv .hero .barlab{font-weight:700}',
'body.bqv .hero .barlab span:first-child{color:var(--acc)}',

/* ── 3. o treino do dia ── */
'body.bqv .sess .et .t{font-size:14.5px;font-weight:800;letter-spacing:-.015em;color:var(--tx)}',
'body.bqv .sess .et .d{font-size:12px;line-height:1.55;color:var(--tx3)}',
/* a etapa principal recebe a cor da intensidade */
'body.bqv .sess .et.bq-principal{background:var(--bqw,rgba(255,255,255,.03));border-radius:14px}',
'body.bqv .sess .et.bq-principal .t{color:var(--bqc,var(--tx))}',
'body.bqv .sess .et.bq-principal .box{border-color:var(--bqc,var(--s3))}',
/* as de apoio ficam discretas, para nao competir */
'body.bqv .sess .et.bq-apoio .t{font-weight:700;font-size:13.5px;color:var(--tx2)}',
'body.bqv .sess .et.bq-apoio .d{font-size:11.5px;opacity:.85}',

/* ── 4. etiquetas: ritmo em destaque, FC em tom proprio ── */
'body.bqv .tg{font-weight:800;letter-spacing:.01em}',
'body.bqv .tg.z{background:var(--acc-wash);color:var(--acc)}',
'body.bqv .tg.hr{background:rgba(242,104,92,.14);color:#F2685C}',

/* ── 5. a barra de progresso do dia ── */
'body.bqv .prog .ptrack i{background:linear-gradient(90deg,var(--acc),var(--ok))}',
'body.bqv .prog .plab{font-weight:700;color:var(--tx2)}',

/* ── 6. cartoes com separacao mais clara ── */
'body.bqv .card,body.bqv .sess{border:1px solid rgba(255,255,255,.055)}',
'body.bqv #bqCic .pct{letter-spacing:-.035em}',

/* ── 7. o objetivo ── */
'body.bqv #objAtual{font-weight:800;letter-spacing:-.01em}',
'body.bqv .objacao{color:var(--acc);font-weight:800}',

/* ── 8. O CARTAO DE ANALISE (bqa-*) ──
   Foi o que voce me mostrou e o que eu nao tinha tocado: ele tem
   classes proprias, entao nada do estilo acima o alcancava. E onde
   moram "Projecao", "Ultimo treino comparado", "Hoje", "Fora do
   plano" — os titulos que estavam cinza e apagados. */
'body.bqv .bqa-t{font-size:10.5px;letter-spacing:.13em;opacity:1;color:var(--tx2);',
'  font-weight:800;display:inline-flex;align-items:center;gap:7px;margin:18px 0 8px}',
'body.bqv .bqa-t:before{content:"";width:3px;height:11px;border-radius:2px;',
'  background:var(--acc);flex:none;opacity:.85}',

/* os blocos de texto ganham respiro e um filete lateral discreto */
'body.bqv .bqa-u{background:rgba(255,255,255,.035);border-left:2px solid rgba(255,255,255,.10);',
'  border-radius:0 10px 10px 0;padding:11px 12px;font-size:12.5px;color:var(--tx2)}',

/* o veredito no topo: titulo com peso de verdade */
'body.bqv .bqa-v b{font-size:15.5px;font-weight:800;letter-spacing:-.015em}',
'body.bqv .bqa-v span{opacity:1;color:var(--tx3)}',
'body.bqv .bqa-bom b{color:var(--ok)}',
'body.bqv .bqa-atencao b{color:var(--warn)}',
'body.bqv .bqa-ruim b{color:var(--bad)}',
'body.bqv .bqa-info b{color:var(--tx)}',

/* os quatro numeros: rotulo apagado, numero em destaque */
'body.bqv .bqa-c{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.06)}',
'body.bqv .bqa-c i{color:var(--tx3);font-weight:800;letter-spacing:.09em}',
'body.bqv .bqa-c b{font-size:21px;font-weight:800;letter-spacing:-.035em;color:var(--tx)}',
'body.bqv .bqa-c u{text-decoration:none;color:var(--tx3);font-size:10.5px;line-height:1.4}',

/* dentro dos blocos, o que e numero vira monoespacado e claro */
'body.bqv .bqa-u b,body.bqv .bqa-p b{color:var(--tx);font-weight:800}',
'body.bqv .bqa-di{color:var(--tx3)}',

/* a projecao e a pergunta central: "da para a PEI?" */
'body.bqv .bqa-p{background:var(--acc-wash);border:1px solid rgba(201,242,78,.18)}',
'body.bqv .bqa-p b:first-child{color:var(--acc)}',

/* a legenda recolhida fica com cara de botao, nao de texto solto */
'body.bqv .bqa-leg>summary{color:var(--acc);font-weight:800}'
  ].join('\n');
  document.head.appendChild(css);

  /* ── marca a etapa principal e injeta a cor do dia ── */
  var RE_PRINCIPAL = /principal|contínuo|continuo|bloco|longo|tiros|ritmo|limiar|intervalado/i;
  var RE_APOIO = /aquecimento|alongamento|educativo|mobilidade|desaquecimento|hidrat|nutri|conta fecha/i;

  function pintar(){
    if(!ligado()) return;
    try{
      var el = document.querySelector('#sess');
      if(!el) return;
      var s = (typeof sessaoDe === 'function') ? sessaoDe(ST.sel) : (ST.plano || {})[ST.sel];
      var cor = corDe(s);

      Array.prototype.forEach.call(el.querySelectorAll('.et'), function(et){
        et.classList.remove('bq-principal', 'bq-apoio');
        var t = '';
        try{ t = (et.querySelector('.t') || {}).textContent || '' }catch(e){}
        if(RE_APOIO.test(t)) et.classList.add('bq-apoio');
        else if(RE_PRINCIPAL.test(t)){
          et.classList.add('bq-principal');
          if(cor){
            et.style.setProperty('--bqc', cor);
            et.style.setProperty('--bqw', alfa(cor, 0.09));
          }
        }
      });
    }catch(e){ console.warn('visual:', e && e.message) }
  }

  function alfa(hex, a){
    var h = String(hex).replace('#','');
    if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  function aplicar(){
    try{
      document.body.classList.toggle('bqv', ligado());
      pintar();
    }catch(e){}
  }

  ['renderDia','renderCoach'].forEach(function(nome){
    var orig = window[nome];
    if(typeof orig !== 'function') return;
    window[nome] = function(){
      var r = orig.apply(this, arguments);
      try{ aplicar() }catch(e){}
      return r;
    };
  });

  window.bqVisual = {
    ligar: function(){ try{ localStorage.removeItem(OFF) }catch(e){} aplicar(); return 'visual novo' },
    desligar: function(){ try{ localStorage.setItem(OFF, '1') }catch(e){} aplicar(); return 'visual anterior' },
    ligado: ligado
  };

  aplicar();
  setTimeout(aplicar, 2000);
});


/* ═══ 47. O TEXTO QUE VAI PARA O MOTRA ═══

   POR QUE ISTO E COPIAR E COLAR, e nao um envio automatico como o
   Garmin: o Garmin tem uma API de escrita, e o garth fala com ela. O
   MOTRA lancou integracao por MCP este ano, mas ela e SOMENTE LEITURA
   — a propria documentacao diz que a escrita "will be available soon",
   e o Claude ainda nao esta entre os clientes suportados. Nao existe
   hoje caminho nenhum para criar um treino dentro dele. Enquanto nao
   existir, o melhor que da para fazer e entregar o texto pronto.

   O QUE MUDA. O texto copiado tinha uma linha por exercicio:

       1. Agachamento Goblet — 3×10-12 · Desça controlando...

   Agora sai separado em blocos, com series e repeticoes em linha
   propria e a dica de execucao embaixo. Colando no MOTRA, cada campo
   ja esta onde voce precisa ler, sem ter que garimpar dentro de uma
   frase corrida. E acrescentei o musculo trabalhado e o porque de
   cada exercicio estar ali — os dois ja existiam no app, mas ficavam
   so na tela e nao iam junto.

   O QUE NAO MUDA. Esta parte troca UMA funcao: textoMotra. O botao, a
   folha que abre, a copia para a area de transferencia, o cabecalho
   com data e hora, e o caminho de volta pelo Atalho do iPhone
   continuam exatamente como estao. Se voce apagar esta parte, o texto
   volta ao formato de antes e nada mais muda.

   NO CONSOLE:
     bqMotra.ver('PERNAS')   — como o texto vai sair
   ══════════════════════════════════════════════════════════════════ */

PARTE('texto do MOTRA', function(){
  if(typeof textoMotra !== 'function') throw new Error('app sem textoMotra');
  if(typeof SESSOES_ACADEMIA !== 'object') throw new Error('sem SESSOES_ACADEMIA');
  if(typeof ACADEMIA !== 'object') throw new Error('sem ACADEMIA');

  var antigo = window.textoMotra;

  function montar(sid){
    var S = SESSOES_ACADEMIA[sid];
    /* sessao desconhecida: devolvo vazio em vez de estourar. O
       original fazia SESSOES_ACADEMIA[sid].itens direto e quebrava a
       tela inteira se o id nao existisse. */
    if(!S || !S.itens) return '';

    var linhas = [];
    S.itens.forEach(function(it, i){
      var e = ACADEMIA[it.k];
      if(!e) return;
      linhas.push((i + 1) + ') ' + e.n);
      linhas.push('   Séries: ' + e.s);
      if(e.m) linhas.push('   Trabalha: ' + e.m);
      if(e.c) linhas.push('   Execução: ' + e.c);
      if(it.p) linhas.push('   Por que: ' + it.p);
      linhas.push('');
    });

    /* tira a linha vazia do fim, para o texto nao chegar com sobra */
    while(linhas.length && linhas[linhas.length - 1] === '') linhas.pop();
    return linhas.join('\n');
  }

  window.textoMotra = function(sid){
    try{ return montar(sid) }
    catch(e){
      console.warn('motra:', e && e.message);
      return antigo.apply(this, arguments);   /* na duvida, o de antes */
    }
  };

  window.bqMotra = {
    ver: function(sid){
      var k = sid || (typeof sessaoAcademiaDe === 'function'
                      ? sessaoAcademiaDe(iso(HOJE)) : 'PERNAS');
      return (SESSOES_ACADEMIA[k] ? SESSOES_ACADEMIA[k].nome + '\n\n' : '') + montar(k);
    },
    sessoes: function(){ return Object.keys(SESSOES_ACADEMIA) }
  };
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
        var diag = '';
        try{ diag = window.bqDiag ? '\n\n── diagnóstico ──\n' + window.bqDiag() : '' }catch(e){}
        if(confirm('fix.js ' + FIX_VERSAO + ' — as 54 partes carregaram.\n\n'
          + 'Plano PEI Marathon: ' + (l ? 'LIGADO' : 'desligado') + diag
          + '\n\nOK ' + (l ? 'desliga o plano e volta ao automático do app.'
                             : 'liga o plano da maratona.'))){
          l ? window.planoBQ.desligar() : window.planoBQ.ligar();
          return;
        }
        /* recusou a primeira: ofereço o interruptor da força */
        if(window.bqForca){
          var f = window.bqForca.desligada();
          if(confirm('Sessões de força automáticas: ' + (f ? 'DESLIGADAS' : 'ligadas')
            + '\n\n' + (f
              ? 'OK volta a criar a força como segundo treino nos dias do plano.'
              : 'OK desliga e remove todas as sessões de força que eu criei. '
              + 'Elas param de voltar. Seus treinos de corrida não mudam.'))){
            if(f){ var n = window.bqForca.ligar(); alert(n + ' sessões de força recriadas.') }
            else { var m = window.bqForca.desligar(); alert(m + ' sessões de força removidas.\n\n'
                   + 'Elas não voltam mais.') }
          }
        }
        return;
      }
      alert(ok
        ? 'fix.js ' + FIX_VERSAO + ' — as 54 partes carregaram.\n\nPlano PEI Marathon: ' + (window.planoBQ && window.planoBQ.ligado() ? 'LIGADO' : 'desligado') + '\n\nOK para trocar.'
        : 'fix.js ' + FIX_VERSAO + '\n\nFalharam:\n\n' + FIX_FALHAS.join('\n\n'));
    };
    barra.insertBefore(s, barra.firstChild.nextSibling);
    if(!ok) console.warn('fix.js · falhas:', FIX_FALHAS);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
  setTimeout(montar, 1500);
})();

PARTE('botão hevy', function(){
  if(typeof SESSOES_ACADEMIA !== 'object') throw new Error('app sem SESSOES_ACADEMIA');
  var WF = 'hevy-sync.yml';

  function payload(s){
    var sid = s.sessao || (typeof sessaoAcademiaDe === 'function' ? sessaoAcademiaDe(s.data) : null);
    var ses = sid && SESSOES_ACADEMIA[sid];
    if(!ses) throw new Error('sessão de força não identificada');
    return { rotina: ses.nome, data: s.data,
      itens: ses.itens.map(function(it){
        var e = ACADEMIA[it.k] || {};
        return { n: e.n || it.k, s: e.s || '', c: e.c || '' };
      }) };
  }

  function token(){
    try{ return (typeof GH_TOKEN === 'string' && GH_TOKEN) ? GH_TOKEN : (cofre.ler('gh_token') || '') }
    catch(e){ return '' }
  }

  function aviso(t, tipo){
    if(typeof avisar === 'function') avisar(t, tipo || 'ok'); else alert(t.replace(/<[^>]+>/g,''));
  }

  async function enviar(s, botao){
    var t = token();
    if(!t){ aviso('Conecte o GitHub pelo botão <b>Sync Garmin</b> primeiro.','err'); return }
    var dados;
    try{ dados = payload(s) }catch(e){ aviso(e.message,'err'); return }
    var rotulo = botao ? botao.textContent : '';
    if(botao){ botao.disabled = true; botao.textContent = 'Enviando…' }
    var solta = function(txt, av){
      if(botao){ botao.disabled = false; botao.textContent = txt || rotulo;
        if(txt) setTimeout(function(){ botao.textContent = rotulo }, 2600) }
      if(av) aviso(av[0], av[1]);
    };
    var cab = {'Authorization':'Bearer ' + t, 'Accept':'application/vnd.github.v3+json', 'Content-Type':'application/json'};
    var desde = new Date(Date.now() - 60000).toISOString();
    try{
      var r = await fetch('https://api.github.com/repos/' + GH_REPO + '/actions/workflows/' + WF + '/dispatches',
        {method:'POST', headers:cab, body:JSON.stringify({ref:'main', inputs:{payload: JSON.stringify(dados)}})});
      if(r.status === 401){ solta('', ['Token recusado. Gere outro pelo Sync Garmin.','err']); return }
      if(r.status === 403){ solta('', ['Erro 403. O token precisa da permissão <b>workflow</b>.','err']); return }
      if(r.status === 404){ solta('', ['Não achei o ' + WF + ' no repositório.','err']); return }
      if(r.status !== 204){ solta('', ['Erro ' + r.status + ' ao disparar.','err']); return }
      var espera = function(ms){ return new Promise(function(x){ setTimeout(x, ms) }) };
      var t0 = Date.now();
      while(Date.now() - t0 < 5*60*1000){
        await espera(6000);
        var run = null, podeLer = true;
        try{
          var u = 'https://api.github.com/repos/' + GH_REPO + '/actions/workflows/' + WF +
                  '/runs?event=workflow_dispatch&per_page=5&created=>=' + encodeURIComponent(desde);
          var rr = await fetch(u, {headers:cab});
          if(!rr.ok) podeLer = false;
          else{ var j = await rr.json();
            run = (j.workflow_runs || []).sort(function(a,c){ return new Date(c.created_at) - new Date(a.created_at) })[0] || null }
        }catch(e){ podeLer = false }
        if(!podeLer){ solta('✓ Disparado', ['Enviado ao Hevy. Confira em um minuto.','ok']); return }
        if(!run) continue;
        if(run.status !== 'completed'){
          if(botao) botao.textContent = run.status === 'in_progress' ? 'Processando…' : 'Na fila…';
          continue;
        }
        if(run.conclusion === 'success'){ solta('✓ No Hevy', ['Rotina <b>' + dados.rotina + '</b> atualizada.','ok']); return }
        solta('', ['O envio falhou (' + run.conclusion + '). Veja a aba Actions.','err']); return;
      }
      solta('', ['Demorou mais que o esperado.','err']);
    }catch(e){ solta('', ['Erro de rede: ' + e.message,'err']) }
  }

  function coloca(){
    document.querySelectorAll('button').forEach(function(b){
      if(!/MOTRA/i.test(b.textContent)) return;
      if(b.dataset.hevyOk) return;
      b.dataset.hevyOk = '1';
      var k = b.dataset.exmotra || null;
      var h = document.createElement('button');
      h.textContent = 'Hevy';
      h.className = b.className;
      h.onclick = function(ev){
        ev.preventDefault(); ev.stopPropagation();
        var s = null;
        if(k && ST.extras && ST.extras[k]) s = ST.extras[k];
        else if(typeof ST === 'object' && ST.sel && typeof sessaoDe === 'function') s = sessaoDe(ST.sel);
        if(!s){ aviso('Não identifiquei a sessão desta tela.','err'); return }
        enviar(s, h);
      };
      b.insertAdjacentElement('afterend', h);
    });
  }
  coloca();
  new MutationObserver(coloca).observe(document.body, {childList:true, subtree:true});
  window.bqHevy = { enviar: enviar };
});



/* ───────────── 50. A ABA COACH E SO DA ACADEMIA ─────────────
   Decisao do Luiz, 25/08/2026. A corrida sai do app: quem monta e o
   treinador humano, no TrainingPeaks, e ela chega ao relogio por ali.
   O proprio Garmin Connect nao abre esses treinos na tela — so o
   relogio mostra os blocos — entao espelhar isso aqui era construir
   sobre um caminho que nao se sustenta.

   Fica na aba Coach: a academia de segunda, quarta e sexta, que o app
   ja monta com os exercicios e que o botao Hevy manda para a rotina.
   Mais a data da prova, como referencia.

   Sai: corrida, bike, natacao e o progresso de ciclo.

   O que voce EXECUTA continua entrando pelo sync do Garmin e alimenta
   Treinos, Indices, Evolucao, Saude e KPI — isso nao muda.

   Esta parte NAO escreve no Garmin. O envio app->Garmin ja esta travado
   no sync (ENVIAR_SEMANA_PARA_GARMIN = False); aqui so se filtra o que
   aparece na tela.                                                   */
PARTE('a aba coach e so da academia', function(){
  if(typeof window.gerarPlano !== 'function') throw new Error('app sem gerarPlano');

  function ehForca(s){
    if(!s) return false;
    if(s.mod === 'forca') return true;
    return /academia|for[c\u00e7]a|muscula|core|mobilidade/i.test(String(s.titulo || ''));
  }

  function hojeIso(){
    var d = (typeof HOJE !== 'undefined' && HOJE) ? HOJE : new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  var DIAS_ACADEMIA = {1:1, 3:1, 5:1};      // 1=seg 3=qua 5=sex

  function diaSemana(iso){
    var q = String(iso).split('-');
    var d = new Date(+q[0], +q[1] - 1, +q[2]).getDay();
    return d === 0 ? 7 : d;
  }

  /* Guarda e remove o "segundo treino do dia". Sem duracao propria ele
     virava um card de 45 min sozinho assim que a corrida saia — era
     por isso que terca e quinta apareciam com forca.                */
  function tirarExtra(iso){
    if(typeof ST !== 'object' || !ST || !ST.extras || !ST.extras[iso]) return;
    ST.extrasGarmin = ST.extrasGarmin || {};
    ST.extrasGarmin[iso] = ST.extras[iso];
    delete ST.extras[iso];
  }

  /* Poe a academia no encaixe de segundo treino do dia.

     O id precisa ser 'x' + data, com extra:true — e a convencao que o
     montarExtra usa. Se eu reaproveitasse o id da sessao principal, as
     duas dividiriam a mesma entrada em ST.feitas e concluir uma
     concluiria a outra.

     Nao piso em extra que voce criou na mao: so substituo o que este
     codigo mesmo pos ali antes (origem 'academia').                 */
  /* ── LIMPEZA UNICA DAS LAPIDES QUE EU MESMO CAUSEI ──
     Enquanto a academia saia com auto:true, a limpar() da outra parte
     a apagava e gravava lapide. A lapide vale 24h e faria a academia
     continuar sumindo mesmo depois do conserto acima.

     Entao apago essas lapides uma vez so, nos dias de academia dos
     proximos dois meses, e deixo marca no aparelho para nunca mais
     repetir — senao eu passaria a ignorar cancelamento de verdade. */
  try{
    var MARCA = 'bq_lapide_academia_v1';
    if(typeof localStorage === 'object' && !localStorage.getItem(MARCA)){
      if(typeof window.bqDesapagar === 'function' && typeof iso === 'function'){
        var hj = new Date(); hj.setHours(0,0,0,0);
        for(var i = 0; i < 60; i++){
          var dd = new Date(hj.getTime() + i * 864e5);
          var n = dd.getDay() === 0 ? 7 : dd.getDay();
          if(DIAS_ACADEMIA[n]) window.bqDesapagar('extras', iso(dd));
        }
      }
      localStorage.setItem(MARCA, '1');
    }
  }catch(e){ console.warn('lapide academia:', e && e.message) }

  function academiaDeSegundo(iso){
    if(typeof ST !== 'object' || !ST) return;
    ST.extras = ST.extras || {};

    /* Academia que VOCE montou na mao fica intacta.
       Qualquer outra coisa no encaixe e sobra do plano de corrida
       antigo — e a varredura logo abaixo ia apagar de qualquer jeito.
       Entao a academia toma o lugar, em vez de eu desistir e o dia
       terminar sem nada. Foi esse o furo: eu voltava cedo demais.   */
    /* Se VOCE cancelou a academia desse dia, ela fica cancelada.
       O app guarda uma lapide de 24h para isso, e eu nao a consultava:
       recriava o extra, e o bqLimparApagados apagava de novo no save
       seguinte. Cancelar parecia nao funcionar. */
    if(typeof window.bqFoiApagado === 'function' &&
       window.bqFoiApagado('extras', iso)) return;

    var atual = ST.extras[iso];
    if(atual && atual.mod === 'forca' && atual.auto !== true &&
       atual.origem !== 'academia' &&
       String(atual.sessao || '').indexOf('BQ_') !== 0) return;

    var n = nomeAcademia(iso);
    /* SEM auto:true. Foi ele que tirou a sexta-feira.
       A parte 'forca obedece ao bloco' tem uma rotina limpar() que
       apaga toda academia AUTOMATICA depois do fim do bloco antigo —
       e ainda deixa lapide. Como o bloco acabou no meio desta semana,
       quarta ficava e sexta era apagada. Marcada so com origem
       'academia', ela conta como sua e ninguem mais mexe.           */
    ST.extras[iso] = { id:'x' + iso, data:iso, mod:'forca', foco:'forca',
                       sessao:n.sid, titulo:n.nome, min:45,
                       extra:true, origem:'academia' };
    if(ST.cache) delete ST.cache['x' + iso];
  }

  /* De hoje em diante: so segunda, quarta e sexta, e so forca. O
     passado nao se toca — e historico, e apagar estragaria a conta
     de aderencia.                                                   */
  /* Segunda-feira da semana em curso. O filtro vale para a semana
     inteira, nao so de hoje em diante: senao os dias ja passados desta
     semana ficam mostrando o plano de corrida antigo — foi assim que
     "Rodagem leve" reapareceu numa segunda de academia. Semanas
     anteriores nao se tocam: sao historico de aderencia.            */
  function inicioDaSemana(){
    var d = new Date();
    var n = d.getDay(); n = (n === 0 ? 7 : n);
    d.setDate(d.getDate() - (n - 1));
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
  }

  /* O NOME E A SESSAO SAO OS DO PROPRIO APP.
     O app ja tem duas sessoes de academia — Pernas e Core, Costas e
     Postura — que alternam por semana (SESSOES_ACADEMIA e
     sessaoAcademiaDe, no index.html). E o campo 'sessao' que faz
     aparecer a lista de exercicios e o texto do MOTRA.

     Eu tinha inventado um titulo solto, sem esse campo: o bloco vinha
     sem exercicio nenhum. Aqui volto a usar o que o app ja sabe, com
     o nome comecando por "Academia", que foi o que voce pediu.      */
  function nomeAcademia(iso){
    var sid = null;
    try{
      if(typeof sessaoAcademiaDe === 'function') sid = sessaoAcademiaDe(iso);
    }catch(e){}
    if(sid && typeof SESSOES_ACADEMIA === 'object' && SESSOES_ACADEMIA[sid])
      return {sid:sid,
              nome:'Academia — ' +
                   String(SESSOES_ACADEMIA[sid].nome).replace(/^Força\s*—\s*/, '')};
    return {sid:null, nome:'Academia'};
  }

  function sessaoAcademia(iso){
    return {id:iso, data:iso, mod:'forca', foco:'forca',
            titulo:nomeAcademia(iso).nome, sessao:nomeAcademia(iso).sid,
            min:60, origem:'academia'};
  }

  /* ── os treinos do treinador, so para VISUALIZAR ──
     Voltaram em 26/08/2026. O app nao planeja corrida nenhuma: le a
     agenda que o treinador montou no Garmin (RAW.agendados, gravado
     pelo sync) e mostra nome, distancia e tempo.

     O motivo de voltarem: a faixa de nutricao do longao (parte 29) so
     aparece em sessao de corrida com 90 min ou mais. Sem os treinos
     dele na tela, ela nao tinha onde se pendurar — e a informacao de
     gel, eletrolito e sodio sumiu junto.

     Esta parte NAO escreve no Garmin. Quem escrevia era o sync, e esta
     travado la (ENVIAR_SEMANA_PARA_GARMIN = False).                  */
  var SPORT_ICO = {corrida:'🏃', bike:'🚴', natacao:'🏊', academia:'💪', outro:'🏅'};

  function agendaDoGarmin(){
    var l = (typeof RAW === 'object' && RAW) ? RAW.agendados : null;
    return Array.isArray(l) ? l : [];
  }

  function doDia(iso){
    return agendaDoGarmin().filter(function(a){
      return a && a.data === iso && !a.descanso;
    });
  }

  function sessaoDoTreinador(iso, itens){
    var nomes = [], km = 0, min = 0;
    itens.forEach(function(a){
      nomes.push(a.nome || 'Treino');
      if(a.distanciaM) km += a.distanciaM / 1000;
      if(a.duracaoSeg) min += Math.round(a.duracaoSeg / 60);
    });
    var esporte = itens[0].esporte || 'corrida';
    var s = {
      id: iso, data: iso,
      mod: esporte === 'bike' ? 'bike' : esporte === 'natacao' ? 'natacao' : 'corrida',
      foco: focoDoNome(nomes.join(' '), km),
      fase: 'Plano do treinador',
      titulo: nomes.join(' + '),
      origem: 'garmin',
      soLeitura: true                       // o app nao mexe nele
    };
    if(km)  s.km  = Math.round(km * 10) / 10;
    if(min) s.min = min;                    // e o min que aciona a nutricao
    if(itens.some(function(i){ return i.prova })) s.prova = true;
    return s;
  }

  /* O nome que o treinador deu diz o tipo. A planilha pinta a linha por
     este campo, e a nutricao usa /longo/ como um dos gatilhos.        */
  function focoDoNome(nome, km){
    var t = String(nome || '').toLowerCase();
    if(/prova|race/.test(t))                   return 'prova';
    if(/stride|tiro|sprint/.test(t))           return 'tiros';
    if(/ladeira|subida|hill/.test(t))          return 'ladeira';
    if(/long[aã]o|longo/.test(t))              return 'longo';
    if(/z4|vo2|intervalad|blocos/.test(t))     return 'vo2';
    if(/limiar|tempo|z3/.test(t))              return 'limiar';
    if(/fartlek/.test(t))                      return 'fartlek';
    if(km >= 18)                               return 'longo';
    if(/regenerat|soltura|recupera/.test(t))   return 'soltura';
    return 'facil';
  }

  function sohAcademia(plano){
    var deste = inicioDaSemana();
    Object.keys(plano).forEach(function(iso){
      if(iso < deste) return;               // semanas passadas: historico
      var s = plano[iso];
      if(s && s.prova) return;              // a prova continua no calendario

      var doTreinador = doDia(iso);
      if(doTreinador.length){
        plano[iso] = sessaoDoTreinador(iso, doTreinador);
        /* ── A ACADEMIA NAO SAI DO DIA SO PORQUE ELE MARCOU CORRIDA ──
           Este era o defeito: em dia de academia com corrida do
           treinador, o tirarExtra apagava a academia — e junto foi o
           botao MOTRA/Hevy, que so existe no cartao de segundo treino.
           Ficou invisivel ate hoje porque foi a primeira quarta-feira
           em que o treinador marcou corrida; segunda nao teve.

           Voce faz as duas: academia 5:30 e corrida depois. Entao a
           corrida dele fica como treino principal e a academia vai
           para o segundo treino, que e o encaixe que o app ja tem
           para isso desde a parte 13.                               */
        if(DIAS_ACADEMIA[diaSemana(iso)]) academiaDeSegundo(iso);
        else tirarExtra(iso);
        return;
      }
      if(!DIAS_ACADEMIA[diaSemana(iso)]){
        delete plano[iso];
        tirarExtra(iso);
      }else if(!ehForca(s)){
        plano[iso] = sessaoAcademia(iso);
        tirarExtra(iso);
      }else{
        /* Ja e forca, entao a sessao fica — mas o nome passa a ser o
           mesmo em toda a tela. Antes, dia de academia em que o plano
           do app ja tinha forca guardava o titulo antigo, e a mesma
           coisa aparecia com dois nomes em telas diferentes.

           Marco tambem a origem: sem ela o Resumo da semana e a lista
           do mes tratariam este dia como plano velho e o descartariam
           da comparacao. */
        s.titulo = nomeAcademia(iso).nome;
        if(!s.sessao) s.sessao = nomeAcademia(iso).sid;
        if(!s.origem) s.origem = 'academia';
      }
    });

    /* ── NAO INVENTAR ETAPAS PARA TREINO QUE NAO E NOSSO ──
     O app monta seis etapas para qualquer corrida: pre-aquecimento,
     alongamentos, educativos, parte principal, com pace e batimento
     calculados dos SEUS numeros. Isso servia quando o plano era dele.

     Num treino do treinador, vira mentira: aparecia "undefined km" na
     parte principal e paces que ele nunca definiu. Quem abrisse ia
     correr uma coisa que ninguem prescreveu.

     Entao: sessao com origem 'garmin' devolve etapa nenhuma. Sem
     etapas, o card nao abre — e o que o treinador montou fica so no
     relogio, que e onde esta certo.                                  */
  function doTreinador(s){
    return !!(s && (s.origem === 'garmin' || s.soLeitura));
  }

  ['etapas', 'etapasDe'].forEach(function(nome){
    if(typeof window[nome] !== 'function') return;
    var antes = window[nome];
    window[nome] = function(s){
      if(doTreinador(s)) return [];
      return antes.apply(this, arguments);
    };
  });

  /* Efeito colateral do bloqueio acima: concluida() decide pelo numero
     de etapas marcadas, e sem etapas ela diria "nao cumprido" em todo
     treino do treinador — alerta vermelho no dia em que voce correu.

     Para esses dias a verdade esta na atividade que o relogio gravou,
     nao numa caixinha marcada no app. ST.runs guarda 'd', a distancia
     em dias ate hoje; invertendo a conta chego na data.              */
  function correuNoDia(iso){
    if(typeof ST !== 'object' || !ST || !Array.isArray(ST.runs)) return false;
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    return ST.runs.some(function(r){
      if(!r || r.mod === 'forca') return false;
      var d = new Date(hoje.getTime() - (+r.d || 0) * 86400000);
      var q = d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
      return q === iso;
    });
  }

  if(typeof window.concluida === 'function'){
    var concluidaAntes = window.concluida;
    window.concluida = function(s){
      if(doTreinador(s)) return correuNoDia(s && s.data);
      return concluidaAntes.apply(this, arguments);
    };
  }

  /* ── O CARTAO DO TREINO DELE NAO TEM ETAPAS. ENTAO NAO MOSTRE
        BARRA DE ETAPAS. ──
     Bloquear as etapas (acima) resolveu a mentira, mas deixou o
     cartao com o resto do enfeite: o app calcula o progresso como
     feitas/total, e com total zero isso da NaN. Na tela saia uma
     barra de largura "NaN%" e o texto "0 de 0 etapas · NaN%".
     Aqui esse bloco simplesmente sai, junto com a lista vazia. */
  if(typeof window.renderDia === 'function'){
    var renderDiaApp = window.renderDia;
    window.renderDia = function(){
      var r = renderDiaApp.apply(this, arguments);
      try{
        var el = document.getElementById('sess');
        var sel = (typeof ST === 'object' && ST) ? ST.sel : null;
        var s = (sel && typeof sessaoDe === 'function') ? sessaoDe(sel) : null;
        if(el && doTreinador(s)){
          var p = el.querySelector('.prog');
          if(p && p.parentNode) p.parentNode.removeChild(p);
          var e = el.querySelector('.etapas');
          if(e && !e.children.length && e.parentNode) e.parentNode.removeChild(e);
        }
      }catch(err){ console.warn('cartao do treinador:', err && err.message) }
      return r;
    };
  }

  window.bqCorreuNoDia = correuNoDia;      // para conferir no console

  /* dias que o treinador marcou e o plano do app nem tinha */
    agendaDoGarmin().forEach(function(a){
      if(!a || !a.data || a.descanso || a.data < deste) return;
      if(plano[a.data] && plano[a.data].origem === 'garmin') return;
      if(plano[a.data] && plano[a.data].prova) return;
      plano[a.data] = sessaoDoTreinador(a.data, doDia(a.data));
      tirarExtra(a.data);
    });
    /* Varredura final: tira segundo treino que sobrou de plano antigo.

       Ela apagava TUDO, e por isso comia tambem a academia que o
       academiaDeSegundo acabou de por — que e justamente onde mora o
       botao "Ver e enviar ao MOTRA", e o botao do Hevy que se pendura
       nele. Agora a academia deste codigo passa. */
    Object.keys(plano).forEach(function(iso){
      if(iso < deste) return;
      if(plano[iso] && plano[iso].prova) return;
      /* Nenhum segundo treino de FORCA e apagado aqui. Era isso que
         comia a academia — inclusive a que o proprio app semeia. O que
         esta varredura existe para tirar e sobra de corrida do plano
         antigo, nao musculacao. */
      var x = (typeof ST === 'object' && ST && ST.extras) ? ST.extras[iso] : null;
      if(x && x.mod === 'forca') return;
      tirarExtra(iso);
    });
    return plano;
  }

  var gerarApp = window.gerarPlano;
  window.gerarPlano = function(){
    return sohAcademia(gerarApp.apply(this, arguments) || {});
  };

  /* rebuild() chama aplicarTrocas() depois de gerarPlano(), e uma troca
     antiga podia ressuscitar uma corrida. Filtro de novo, por ultimo. */
  if(typeof window.rebuild === 'function'){
    var rebuildApp = window.rebuild;
    window.rebuild = function(){
      var r = rebuildApp.apply(this, arguments);
      try{
        if(typeof ST === 'object' && ST && ST.plano){
          sohAcademia(ST.plano);
          ST.cache = {};
        }
      }catch(e){ console.warn('coach academia:', e && e.message) }
      return r;
    };
  }

  /* A secao inteira de "feito x planejado" sai. Ela comparava o que
     voce executou contra o plano de corrida do app — plano que nao
     existe mais. Sem base de comparacao, todo o bloco perde sentido:
     projecao, treinos comparados, fora do plano, o que os numeros
     dizem e as mudancas propostas.

     Escondo em vez de apagar o codigo: se um dia voltar a fazer
     sentido, e so tirar o #bqAn desta regra de CSS.                 */

  /* progresso de ciclo sai da tela; a data da prova fica */
  try{
    var tag = document.createElement('style');
    tag.textContent = '#bqAn,#bqCic,.bqa-ciclo,#coach-plan-levels{display:none !important}';
    document.head.appendChild(tag);
  }catch(e){}
});

/* ───────────── 51. PAINEL DA ACADEMIA ─────────────
   O que o Hevy sabe e o Garmin nao: carga, series e repeticoes. O
   sync-hevy.py le a conta e grava em treinos_coach_v2/luiz/hevy; aqui
   so desenhamos.

   Tres blocos, nesta ordem de utilidade:
     sessao do dia   — o que fazer hoje, com peso da ultima vez
     aderencia       — quantas sessoes das planejadas, 4 semanas
     progressao      — carga de agora contra a de 12 semanas atras,
                       e o aviso de exercicio parado

   Nada de nota geral ou indice de prontidao: sem base, seria chute
   com cara de precisao.                                             */
PARTE('painel da academia', function(){
  if(typeof FB_DB !== 'string' || typeof FB_COACH !== 'string')
    throw new Error('sem FB_DB/FB_COACH');

  var HEVY = null;
  var DIAS_ACADEMIA = {1:1, 3:1, 5:1};

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function kg(v){
    if(v == null) return '';
    return (Math.round(v * 10) / 10).toString().replace('.', ',') + ' kg';
  }
  function diaSemana(d){ var n = d.getDay(); return n === 0 ? 7 : n }

  function caixa(){
    var el = document.getElementById('bqAcad');
    if(el) return el;
    var alvo = document.getElementById('v-coach');
    if(!alvo) return null;
    el = document.createElement('section');
    el.className = 'card'; el.id = 'bqAcad';
    alvo.insertBefore(el, alvo.firstChild);
    return el;
  }

  /* ══ PERIODIZAÇÃO ATÉ A MARATONA — 18/10/2026 ══
     Montada a partir das 9 rotinas que existem no seu Hevy.

     A regra que manda: forca pesada para 2 a 3 semanas antes da prova.
     Nao por perda de forca (ela se mantem ate 4 semanas), mas pela
     fadiga do sistema nervoso, que leva de 10 a 14 dias para sair.

     O Jump Squat da "Maxima (pico)" sai antes do resto: e pliometria
     de impacto, e aos 64 a recuperacao excentrica e mais lenta. Fica
     ate 20/09 e depois nao volta.

     Se voce mover a academia de dia — porque o longao mudou — a fase
     acompanha a data, nao o dia da semana.                           */
  var PROVA = '2026-10-18';
  var FASES = [
    {ate:'2026-09-20', nome:'Construção',
     rotinas:['pernas e core (base)', 'quadril e core (base)', 'maxima (pico)'],
     nota:'Fase de carga. Máxima e Pernas nunca nas 48h antes do longão.'},
    {ate:'2026-09-27', nome:'Última semana pesada',
     rotinas:['pernas e core (base)', 'quadril e core (base)', 'maxima (pico)'],
     nota:'Última semana com carga alta. Tire o Jump Squat da Máxima a partir de agora.'},
    {ate:'2026-10-11', nome:'Redução',
     rotinas:['manutencao', 'quadril e core (pico)', 'manutencao'],
     nota:'Nada pesado. O ganho já está feito; agora é chegar inteiro.'},
    {ate:'2026-10-18', nome:'Semana da prova',
     rotinas:['manutencao', null, null],
     nota:'Só a segunda, e leve. Depois de 14/10, nada.'}
  ];

  function faseDe(iso){
    for(var i = 0; i < FASES.length; i++) if(iso <= FASES[i].ate) return FASES[i];
    return null;                       // depois da prova
  }

  function acharRotina(chave){
    if(!chave || !HEVY || !HEVY.rotinas) return null;
    var nomes = Object.keys(HEVY.rotinas);
    var alvo = chave.toLowerCase();
    var achou = nomes.filter(function(n){
      return n.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .indexOf(alvo.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) >= 0;
    })[0];
    return achou ? HEVY.rotinas[achou] : null;
  }

  /* Seg = 1a rotina da fase, Qua = 2a, Sex = 3a */
  function rotinaDoDia(dia, iso){
    var f = faseDe(iso || hojeIso());
    if(!f) return null;
    var pos = dia === 1 ? 0 : dia === 3 ? 1 : 2;
    return acharRotina(f.rotinas[pos]);
  }

  function hojeIso(){
    var d = new Date();
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
  }

  function diasAteProva(){
    var h = new Date(hojeIso()), p = new Date(PROVA);
    return Math.round((p - h) / 86400000);
  }

  function cargaDe(nome){
    var c = HEVY && HEVY.cargas;
    if(!c) return null;
    if(c[nome]) return c[nome];
    var alvo = String(nome).toLowerCase();
    var k = Object.keys(c).filter(function(x){
      return String(x).toLowerCase() === alvo;
    })[0];
    return k ? c[k] : null;
  }

  function blocoFase(){
    var f = faseDe(hojeIso());
    var d = diasAteProva();
    if(!f) return '';
    return '<div class="bqa-t">' + esc(f.nome) + ' · ' + d + ' dias para a prova</div>'
         + '<div class="bqa-u">' + esc(f.nota) + '</div>';
  }

  function blocoSessao(){
    var hoje = new Date();
    var dia = diaSemana(hoje);
    if(!DIAS_ACADEMIA[dia])
      return '<div class="bqa-t">Academia</div>'
           + '<div class="bqa-u">Hoje não tem. Próxima sessão: '
           + (dia < 3 ? 'quarta' : dia < 5 ? 'sexta' : 'segunda') + ', 5:30.</div>';

    var r = rotinaDoDia(dia, hojeIso());
    if(!r) return '<div class="bqa-t">Academia</div>'
                + '<div class="bqa-u">Descanso hoje — a fase atual não prevê sessão nesta '
                + (dia === 1 ? 'segunda' : dia === 3 ? 'quarta' : 'sexta') + '.</div>';

    var linhas = (r.exercicios || []).map(function(e){
      var c = cargaDe(e.nome);
      var peso = e.peso || (c && c.atual);
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0">'
           + '<span>' + esc(e.nome) + '</span>'
           + '<span style="white-space:nowrap;opacity:.85">' + esc(e.series || '')
           + (peso ? ' · ' + kg(peso) : '') + '</span></div>';
    }).join('');

    var feito = fezNoDia(hojeIso());
    return '<div class="bqa-t">Hoje · 5:30 · ' + esc(r.titulo)
         + (feito ? ' <span style="color:#3FD98A">✓ feito</span>' : '') + '</div>'
         + '<div class="bqa-u" style="font-size:13px">' + linhas + '</div>';
  }

  /* Contar pelo Garmin dava sempre zero: o Hevy nao envia nada para la,
     entao uma academia feita so no Hevy nunca aparecia. Agora conta na
     fonte onde o registro existe de verdade.                         */
  function sessoesFeitas(){
    return (HEVY && Array.isArray(HEVY.sessoes)) ? HEVY.sessoes : [];
  }

  function fezNoDia(iso){
    return sessoesFeitas().some(function(s){ return s && s.data === iso });
  }

  function blocoAderencia(){
    var corte = new Date(); corte.setDate(corte.getDate() - 28);
    var isoCorte = corte.toISOString().slice(0,10);
    var feitas = sessoesFeitas().filter(function(s){ return s.data >= isoCorte }).length;
    var previstas = 12;                       // 3 por semana x 4 semanas
    if(!HEVY) return '';
    var pct = Math.round(feitas / previstas * 100);
    var cor = pct >= 80 ? '#3FD98A' : pct >= 60 ? '#F5C544' : '#F2685C';
    return '<div class="bqa-t">Aderência · 4 semanas</div>'
         + '<div class="bqa-u"><b style="font-size:15px;color:' + cor + '">' + feitas + '</b> de '
         + previstas + ' sessões previstas'
         + (feitas ? ' · última em ' + esc(ultimaSessao()) : '') + '.</div>';
  }

  function ultimaSessao(){
    var l = sessoesFeitas();
    if(!l.length) return '';
    var d = l[l.length - 1].data;
    return d.split('-').reverse().slice(0,2).join('/');
  }

  function blocoProgressao(){
    var c = HEVY && HEVY.cargas;
    if(!c) return '';
    var itens = Object.keys(c).map(function(k){ return c[k] })
      .filter(function(x){ return x && x.atual });
    if(!itens.length) return '';

    itens.sort(function(a,b){ return (b.ganho || 0) - (a.ganho || 0) });

    var linhas = itens.slice(0, 8).map(function(x){
      var subiu = (x.ganho || 0) > 0;
      var cor = subiu ? '#3FD98A' : 'inherit';
      var de = (x.primeiro != null && x.primeiro !== x.atual)
             ? '<span style="opacity:.6">' + kg(x.primeiro) + '</span> → ' : '';
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0">'
           + '<span>' + esc(x.nome) + '</span>'
           + '<span style="white-space:nowrap">' + de
           + '<b style="color:' + cor + '">' + kg(x.atual) + '</b></span></div>';
    }).join('');

    var parados = itens.filter(function(x){
      return (x.ganho || 0) <= 0 && x.primeiroEm && x.primeiroEm !== x.atualEm;
    });
    var aviso = parados.length
      ? '<div class="bqa-u" style="margin-top:8px;opacity:.9">'
        + esc(parados[0].nome) + ' está no mesmo peso desde '
        + esc((parados[0].primeiroEm || '').split('-').reverse().slice(0,2).join('/'))
        + '.</div>'
      : '';

    return '<div class="bqa-t">Progressão de carga</div>'
         + '<div class="bqa-u" style="font-size:13px">' + linhas + '</div>' + aviso;
  }

  function pintar(){
    var el = caixa();
    if(!el) return;
    if(!HEVY){
      el.innerHTML = '<div class="bqa-t">Academia</div>'
                   + '<div class="bqa-u">Carregando os dados do Hevy…</div>';
      return;
    }
    el.innerHTML = blocoFase() + blocoSessao() + blocoAderencia() + blocoProgressao();
  }

  var ultimoErro = '';

  async function buscar(){
    try{
      if(typeof fbToken !== 'function'){ ultimoErro = 'sem fbToken'; return false }
      var t = await fbToken();
      if(!t){ ultimoErro = 'sem token do Firebase ainda'; return false }
      var r = await fetch(FB_DB + '/' + FB_COACH + '/hevy.json?auth=' + t);
      if(!r.ok){ ultimoErro = 'HTTP ' + r.status; return false }
      var j = await r.json();
      if(!j || !j.rotinas){ ultimoErro = 'o sync do Hevy ainda não gravou'; return false }
      HEVY = j;
      window.bqAcademia = HEVY;          // para conferir no console
      pintar();
      return true;
    }catch(e){
      ultimoErro = (e && e.message) || 'erro de rede';
      return false;
    }
  }

  /* O login no Firebase e assincrono: na primeira tentativa o token
     costuma nao existir. Buscar uma vez so deixava o painel presa em
     "Carregando" para sempre. Agora insiste, e se desistir diz por que
     em vez de ficar mudo.                                            */
  var tentativas = 0;
  function insistir(){
    tentativas++;
    buscar().then(function(ok){
      if(ok) return;
      if(tentativas < 8){ setTimeout(insistir, 1500); return }   // 12s no total, nao 42
      var el = caixa();
      if(el && !HEVY){
        el.innerHTML = '<div class="bqa-t">Academia</div>'
          + '<div class="bqa-u">Não consegui ler os dados do Hevy: '
          + esc(ultimoErro) + '. Rode o Hevy Pull no GitHub e recarregue.</div>';
      }
    });
  }

  window.bqAcademiaRecarregar = function(){ tentativas = 0; insistir(); return 'buscando…' };

  /* A planilha marcava o dia como nao cumprido porque concluida() exige
     que voce toque em cada etapa no app. Quem treina abre o Hevy, nao
     este app — entao o dia ficava com o alerta vermelho mesmo tendo
     sido feito. Aqui: se existe treino registrado no Hevy naquela data,
     a sessao de forca conta como concluida.                          */
  if(typeof window.concluida === 'function'){
    var concluidaApp = window.concluida;
    window.concluida = function(s){
      try{
        if(s && s.data && (s.mod === 'forca' || /academia|for[cç]a/i.test(String(s.titulo||'')))
           && fezNoDia(s.data)) return true;
      }catch(e){}
      return concluidaApp.apply(this, arguments);
    };
  }

  pintar();
  setTimeout(insistir, 1200);
});


/* ══════════════════════════════════════════════════════════════════════
   RESUMO DA SEMANA — no formato do Weekly Snapshot do TrainingPeaks.

   Substitui o cartao "Carga da semana", que mostrava uma barra por dia
   e nada mais. O que faltava era a comparacao: a barra dizia que voce
   correu 60 minutos, mas nao dizia se o treinador tinha pedido 60 ou 90.

   Tres abas, como no TrainingPeaks: Duracao, Distancia e TSS. Em cada
   dia, duas barras — o que foi feito (cheia) e o que estava previsto
   (contornada). Embaixo, a Aderencia: quantos dias bateram o alvo,
   quantos ficaram fora da faixa, quantos foram perdidos e quantos
   foram extra.

   De onde vem cada numero, sem invencao nenhuma:
     previsto  — sessaoDe(dia), que ja junta a agenda do treinador
                 (RAW.agendados, lida do Garmin) com a academia
     realizado — ST.runs, as atividades que o relogio gravou; e, para
                 a academia, RAW.hevy.sessoes, porque o Hevy nao manda
                 nada para o Garmin e sem isso o dia contaria como perdido
     TSS       — calculado so no que foi FEITO. O previsto nao traz ritmo,
                 entao previsto de TSS nao existe e a aba nao finge que sim.

   Dia no futuro com treino marcado nao entra na aderencia: ainda da tempo.
   ══════════════════════════════════════════════════════════════════════ */
PARTE('resumo da semana estilo trainingpeaks', function(){

  var row = document.getElementById('wkRow');
  if(!row) return;
  if(typeof window.renderSemana !== 'function') return;

  var DIAS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  var MESES = ['jan','fev','mar','abr','mai','jun',
               'jul','ago','set','out','nov','dez'];

  /* ── estilo ── */
  var css = document.createElement('style');
  css.textContent = [
    '.snapTabs{display:flex;gap:4px;background:var(--s1);padding:3px;',
      'border-radius:10px;margin:2px 0 14px}',
    '.snapTabs button{flex:1;border:0;background:transparent;color:var(--tx3);',
      'font:600 12px/1 inherit;padding:8px 4px;border-radius:8px;cursor:pointer}',
    '.snapTabs button.on{background:var(--s3);color:var(--tx)}',

    '.snapG{display:flex;align-items:flex-end;gap:2px;height:104px;',
      'padding:0 2px;border-bottom:1px solid var(--line)}',
    '.snapD{flex:1;display:flex;flex-direction:column;align-items:center;',
      'justify-content:flex-end;height:100%;gap:3px}',
    '.snapD .par{display:flex;align-items:flex-end;justify-content:center;',
      'gap:2px;width:100%;height:100%}',
    '.snapD i{display:block;width:9px;border-radius:3px 3px 0 0;min-height:2px}',
    '.snapD i.plan{background:transparent;border:1px dashed var(--tx3);',
      'border-bottom:0;opacity:.75}',
    '.snapD .vv{font:600 9px/1 inherit;color:var(--tx2);height:10px}',

    '.snapX{display:flex;gap:2px;padding:6px 2px 0}',
    '.snapX span{flex:1;text-align:center;font:600 10px/1 inherit;color:var(--tx3)}',
    '.snapX span.hoje{color:var(--acc)}',

    '.snapLeg{display:flex;gap:14px;justify-content:center;margin-top:10px;',
      'font:500 10px/1 inherit;color:var(--tx3)}',
    '.snapLeg b{display:inline-block;width:8px;height:8px;border-radius:2px;',
      'margin-right:5px;vertical-align:-1px}',

    '.snapAd{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}',
    '.snapAd .t{display:flex;justify-content:space-between;align-items:baseline;',
      'margin-bottom:8px}',
    '.snapAd .t span{font:600 10px/1 inherit;letter-spacing:.08em;',
      'text-transform:uppercase;color:var(--tx3)}',
    '.snapAd .t b{font:700 15px/1 inherit;color:var(--tx)}',
    '.snapBar{display:flex;height:8px;border-radius:5px;overflow:hidden;',
      'background:var(--s1);gap:1px}',
    '.snapBar i{display:block;height:100%}',
    '.snapCt{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:10px}',
    '.snapCt em{font:500 11px/1.3 inherit;color:var(--tx2);font-style:normal}',
    '.snapCt em b{display:inline-block;width:7px;height:7px;border-radius:50%;',
      'margin-right:6px;vertical-align:1px}',
    '.snapNada{color:var(--tx3);font:500 12px/1.5 inherit;padding:18px 0;',
      'text-align:center}'
  ].join('');
  document.head.appendChild(css);

  /* ── datas ── */
  function chave(d){
    return d.getFullYear() + '-' +
           String(d.getMonth()+1).padStart(2,'0') + '-' +
           String(d.getDate()).padStart(2,'0');
  }
  function curto(d){ return d.getDate() + ' ' + MESES[d.getMonth()] }
  var HJ = chave(new Date());

  /* ── o que foi feito ──
     ST.runs guarda r.d = quantos dias atras foi. Inverto para virar data.

     Caminhada fica de fora. Ela chega marcada com walk=true e mod
     'corrida', e o app inteiro ja a tira das contas de quilometragem
     (linhas 1901, 2636, 2712 e 2727 do index.html). Aqui o motivo e
     ainda mais direto: seu treinador nao prescreve caminhada, entao
     cada uma viraria um dia "extra" na aderencia e sujaria o numero. */
  function feitoNoDia(iso){
    var lista = (typeof ST === 'object' && ST && ST.runs) || [];
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    var out = [];
    for(var i=0;i<lista.length;i++){
      var r = lista[i];
      if(!r || !isFinite(r.d) || r.walk) continue;
      var d = new Date(hoje.getTime() - r.d*864e5);
      if(chave(d) !== iso) continue;
      out.push(r);
    }
    return out;
  }

  /* A academia so existe no Hevy: o Hevy nao manda nada para o Garmin. */
  function academiaNoDia(iso){
    var h = (typeof RAW === 'object' && RAW && RAW.hevy) || null;
    var s = (h && h.sessoes) || [];
    var out = [];
    for(var i=0;i<s.length;i++){
      if(s[i] && s[i].data === iso) out.push(s[i]);
    }
    return out;
  }

  var LIMIAR = (typeof PERFIL === 'object' && PERFIL && +PERFIL.paceLimiar) || 340;
  function tssDe(r){
    if(!r || r.mod !== 'corrida') return 0;
    var pace = +r.pace || 0, dur = +r.dur || 0;
    if(pace <= 0 || dur <= 0) return 0;
    var iF = LIMIAR / pace;
    if(iF > 1.6 || iF < 0.35) return 0;      // fora disso o dado esta sujo
    return Math.round(dur * iF * iF / 3600 * 100);
  }

  /* ── o que conta como PREVISTO ──
     ST.plano so foi reescrito da semana atual para frente. Em semanas
     passadas ele ainda guarda o plano de corrida que o app gerava
     sozinho — plano que nao vale mais nada. Comparar o que voce fez
     contra aquilo seria inventar cobranca.

     Fonte de verdade: os treinos do treinador tem origem 'garmin' e os
     da academia tem origem 'academia'. O plano velho nao tem campo
     origem nenhum. So esses dois entram como previsto; o resto conta
     como sem plano, que e a verdade. */
  function planoReal(s){
    return !!(s && (s.origem === 'garmin' || s.origem === 'academia' || s.prova));
  }

  /* A barra do feito usa a cor da modalidade, como o resto do app
     (MOD[m].c). Antes eu pintava de azul o dia sem previsao, e como
     esta semana so ha um treino, e justamente sem previsao, o grafico
     inteiro ficava azul e brigava com a legenda, que diz "Feito" em
     verde-limao. Quem informa "sem previsao" e a Aderencia, abaixo. */
  function corDoDia(x){
    var m = x.modFeito || 'corrida';
    var M = (typeof MOD === 'object' && MOD) ? MOD[m] : null;
    return (M && M.c) || 'var(--acc)';
  }

  /* ── um dia ── */
  function montarDia(d){
    var iso = chave(d);
    var s   = (typeof sessaoDe === 'function') ? sessaoDe(iso) : null;
    if(!planoReal(s)) s = null;

    var planMin = (s && +s.min) || 0;
    var planKm  = (s && +s.km)  || 0;

    var runs = feitoNoDia(iso);
    var realMin = 0, realKm = 0, realTss = 0;
    var temForca = false, modFeito = '', maisLongo = 0;
    for(var i=0;i<runs.length;i++){
      var r = runs[i];
      realMin += Math.round((+r.dur || 0) / 60);
      realKm  += (+r.km || 0);
      realTss += tssDe(r);
      if(r.mod === 'forca') temForca = true;
      // a modalidade do treino mais longo do dia manda na cor
      if(!maisLongo || (+r.dur||0) > maisLongo){ maisLongo = +r.dur||0; modFeito = r.mod }
    }
    /* So conto o Hevy se o Garmin nao registrou forca no dia — senao
       a mesma sessao entraria duas vezes. */
    if(!temForca){
      var g = academiaNoDia(iso);
      for(var j=0;j<g.length;j++) realMin += (+g[j].min || 0);
      if(g.length && !realMin) realMin = 45;   // sessao sem duracao gravada
      if(g.length && !modFeito) modFeito = 'forca';
    }

    return {
      iso: iso, dia: d,
      futuro: iso > HJ,
      hoje: iso === HJ,
      planMin: planMin, planKm: planKm,
      realMin: realMin, realKm: Math.round(realKm*10)/10,
      realTss: realTss,
      fonte: (s && s.origem) || '',
      modFeito: modFeito,
      titulo: (s && s.titulo) || ''
    };
  }

  /* O Hevy so passou a valer agora — antes voce marcava no Motra, e o
     Motra nao deixou historico aqui. Enquanto nao houver NENHUMA sessao
     registrada, dia de academia sem registro nao vira falta: vira
     "sem registro". Falta e quando ha como saber e nao foi feito. */
  function temHevy(){
    var h = (typeof RAW === 'object' && RAW && RAW.hevy) || null;
    return !!(h && h.sessoes && h.sessoes.length);
  }

  /* ── aderencia ──
     A faixa e sobre a duracao, que e o que o treinador controla. */
  var CORES = {
    alvo:   {c:'var(--ok)',   t:'no alvo'},
    fora:   {c:'var(--warn)', t:'fora da faixa'},
    perdido:{c:'var(--bad)',  t:'não feito'},
    extra:  {c:'var(--bike)', t:'sem previsão'}
  };
  function classificar(x, hevy){
    if(x.futuro) return null;                       // ainda da tempo
    if(!x.planMin && !x.realMin) return null;       // descanso, nada a dizer
    if(!x.planMin) return 'extra';
    if(!x.realMin){
      // HOJE ainda nao acabou. Marcar falta antes do fim do dia foi
      // reclamacao sua, com razao: as 8h da manha o app ja dizia que
      // voce tinha perdido o treino da tarde.
      if(x.hoje) return null;
      // academia sem fonte de dado ainda: nao acuso de falta
      if(x.fonte === 'academia' && !hevy) return null;
      return 'perdido';
    }
    var razao = x.realMin / x.planMin;
    if(razao >= .85 && razao <= 1.25) return 'alvo';
    if(razao >= .50 && razao <= 1.60) return 'fora';
    return 'perdido';
  }

  /* ── formatos ── */
  function hm(min){
    min = Math.round(min || 0);
    if(!min) return '';
    if(min < 60) return min + 'm';
    var h = Math.floor(min/60), m = min%60;
    return m ? h + 'h' + String(m).padStart(2,'0') : h + 'h';
  }
  function km(v){ return v ? (Math.round(v*10)/10).toString().replace('.',',') : '' }

  var ABAS = [
    {id:'dur', nome:'Duração',   real:function(x){return x.realMin}, plan:function(x){return x.planMin}, rot:hm},
    {id:'km',  nome:'Distância', real:function(x){return x.realKm},  plan:function(x){return x.planKm},  rot:km},
    {id:'tss', nome:'TSS',       real:function(x){return x.realTss}, plan:function(){return 0},
     rot:function(v){return v ? Math.round(v) : ''}}
  ];
  function abaAtual(){
    var id = (typeof ST === 'object' && ST && ST.snapAba) || 'dur';
    for(var i=0;i<ABAS.length;i++) if(ABAS[i].id === id) return ABAS[i];
    return ABAS[0];
  }

  /* ── desenho ── */
  function desenhar(){
    if(typeof ST !== 'object' || !ST || !ST.sel) return false;
    if(typeof dt !== 'function' || typeof dow !== 'function' ||
       typeof addD !== 'function') return false;

    var base = dt(ST.sel);
    var ini  = addD(base, -(dow(base) - 1));
    var dias = [];
    for(var i=0;i<7;i++) dias.push(montarDia(addD(ini, i)));

    var aba = abaAtual();
    var mx  = 0;
    dias.forEach(function(x){
      mx = Math.max(mx, aba.real(x) || 0, aba.plan(x) || 0);
    });

    /* cabecalho: intervalo da semana e o total feito */
    var totMin = 0, totKm = 0, totTss = 0, nTreinos = 0;
    dias.forEach(function(x){
      totMin += x.realMin; totKm += x.realKm; totTss += x.realTss;
      if(x.realMin) nTreinos++;
    });
    var vv = document.getElementById('wkV');
    if(vv){
      vv.textContent = curto(ini) + ' – ' + curto(addD(ini,6));
    }
    var kick = document.querySelector('#wkRow');
    kick = kick && kick.parentNode && kick.parentNode.querySelector('.kicker');
    if(kick) kick.textContent = 'Resumo da semana';

    var h = '';

    /* abas */
    h += '<div class="snapTabs">' + ABAS.map(function(a){
      return '<button data-aba="' + a.id + '"' +
             (a.id === aba.id ? ' class="on"' : '') + '>' + a.nome + '</button>';
    }).join('') + '</div>';

    if(!mx){
      h += '<p class="snapNada">Nada previsto nem feito nesta semana.</p>';
    }else{
      /* barras */
      h += '<div class="snapG">' + dias.map(function(x){
        var r = aba.real(x) || 0, p = aba.plan(x) || 0;
        var hr = r ? Math.max(3, Math.round(r/mx*82)) : 0;
        var hp = p ? Math.max(3, Math.round(p/mx*82)) : 0;
        var cor = corDoDia(x);
        return '<div class="snapD">' +
          '<span class="vv">' + (aba.rot(r) || '') + '</span>' +
          '<div class="par">' +
            (hp ? '<i class="plan" style="height:' + hp + '%"></i>' : '') +
            (hr ? '<i style="height:' + hr + '%;background:' + cor + '"></i>' : '') +
          '</div></div>';
      }).join('') + '</div>';

      h += '<div class="snapX">' + dias.map(function(x, i){
        return '<span' + (x.iso === HJ ? ' class="hoje"' : '') + '>' +
               DIAS[i] + '</span>';
      }).join('') + '</div>';

      h += '<div class="snapLeg">' +
             '<span>Barra cheia: feito</span>' +
             (aba.id === 'tss'
               ? '<span>o previsto não traz ritmo, então não há TSS previsto</span>'
               : '<span><b style="border:1px dashed var(--tx3);background:none"></b>Tracejada: previsto</span>') +
           '</div>';
    }

    /* aderencia */
    var hevy = temHevy();
    var contas = {alvo:0, fora:0, perdido:0, extra:0}, total = 0;
    var temPlano = false, academiaSemFonte = 0;
    dias.forEach(function(x){
      if(x.planMin) temPlano = true;
      if(x.fonte === 'academia' && !x.realMin && !x.futuro && !x.hoje && !hevy) academiaSemFonte++;
      var c = classificar(x, hevy);
      if(!c) return;
      contas[c]++; total++;
    });

    h += '<div class="snapAd">';
    if(!temPlano){
      /* Semanas anteriores a esta nao tem plano de verdade guardado: o
         que havia era o plano que o app gerava sozinho, e ele foi
         aposentado. Melhor dizer isso do que marcar tudo como "sem
         previsao" e parecer que voce treinou fora de plano. */
      h += '<div class="t"><span>Aderência</span></div>' +
           '<p class="snapNada" style="padding:6px 0">Não há plano registrado ' +
           'para esta semana — nada a comparar.</p>';
    }else if(!total){
      h += '<div class="t"><span>Aderência</span></div>' +
           '<p class="snapNada" style="padding:6px 0">Nada a comparar ainda ' +
           'nesta semana.</p>';
    }else{
      /* O percentual mede o plano cumprido. Treino sem previsao entra
         na barra e na contagem, mas fica FORA do denominador: se ele
         contasse, fazer um treino a mais derrubaria sua aderencia. */
      var comPlano = contas.alvo + contas.fora + contas.perdido;
      var pct = comPlano ? Math.round(contas.alvo / comPlano * 100) : null;
      h += '<div class="t"><span>Aderência</span>' +
           (pct === null ? '' : '<b>' + pct + '%</b>') + '</div>';
      h += '<div class="snapBar">' + ['alvo','fora','perdido','extra'].map(function(k){
        if(!contas[k]) return '';
        return '<i style="width:' + (contas[k]/total*100) + '%;background:' +
               CORES[k].c + '"></i>';
      }).join('') + '</div>';
      h += '<div class="snapCt">' + ['alvo','fora','perdido','extra'].map(function(k){
        if(!contas[k]) return '';
        return '<em><b style="background:' + CORES[k].c + '"></b>' +
               contas[k] + ' ' + CORES[k].t + '</em>';
      }).join('') + '</div>';
    }
    if(academiaSemFonte){
      h += '<p class="snapNada" style="padding:10px 0 0;text-align:left">' +
           academiaSemFonte + (academiaSemFonte > 1 ? ' dias' : ' dia') +
           ' de academia sem registro. Marque a sessão no Hevy para ela ' +
           'entrar na conta.</p>';
    }
    h += '</div>';

    row.innerHTML = h;
    row.className = 'snapWrap';
    return true;
  }

  /* trocar de aba sem redesenhar a aba inteira do Coach */
  row.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-aba]');
    if(!b || !row.contains(b)) return;
    ST.snapAba = b.getAttribute('data-aba');
    desenhar();
  });

  /* Chamo SEMPRE a versao anterior antes de desenhar a minha.

     Motivo, achado na conferencia: outras tres partes ja embrulharam
     renderSemana e penduraram efeito nela — o peneirar() dos treinos
     cancelados (parte 20), o montar() da planilha (parte 46) e o
     montar() do ciclo (parte 49). Se eu desenhasse e retornasse sem
     chamar a cadeia, quem chamasse renderSemana sozinho (e ha quatro
     lugares que chamam) perderia os tres.

     Efeito de brinde: se o meu desenho quebrar, o cartao antigo ja
     esta na tela. Nao sobra buraco. */
  var antes = window.renderSemana;
  window.renderSemana = function(){
    var r = antes.apply(this, arguments);
    try{
      desenhar();
    }catch(e){
      console.error('resumo da semana:', e);
      row.className = 'wrow';       // devolve o flex do cartao antigo
    }
    return r;
  };

  if(typeof renderCoach === 'function' && document.getElementById('wkRow')){
    try{ desenhar() }catch(e){}
  }
});


/* ══════════════════════════════════════════════════════════════════════
   TREINOS DO MES — a lista que fica embaixo do calendario, como no
   TrainingPeaks: uma linha por treino, com data, titulo e tempo.

   O calendario ja existia e ja funciona: grade do mes, bolinha colorida
   por modalidade, dia de hoje destacado. O que faltava era poder ler o
   mes sem ter que tocar em cada dia para descobrir o que tinha nele.

   O que entra na lista, do mes que estiver aberto no calendario:
     feito     — ST.runs, as atividades que o relogio gravou
     previsto  — ST.plano, mas so o que tem origem de verdade: o
                 treinador ('garmin') ou a academia ('academia'). O
                 plano de corrida que o app gerava sozinho foi
                 aposentado e nao pode voltar por aqui.

   Dia com treino feito abre o detalhe da atividade — a mesma tela que
   ja existe na aba de historico. Dia so previsto nao abre nada: o que
   o treinador montou fica no relogio, e o app nao inventa o conteudo.
   ══════════════════════════════════════════════════════════════════════ */
PARTE('treinos do mes embaixo do calendario', function(){

  var grade = document.getElementById('grid');
  if(!grade) return;
  /* So preciso do cartao para pendurar a lista dentro dele. Exigir
     que ele tivesse pai era exigencia a toa — e um jeito silencioso
     de a lista nunca aparecer. */
  var cartao = grade.closest && grade.closest('.card');
  if(!cartao) return;
  if(typeof window.renderCal !== 'function') return;

  /* ── estilo ── */
  var css = document.createElement('style');
  css.textContent = [
    '.mesLista{margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}',
    '.mesLista>h4{margin:0 0 10px;font:600 10px/1 inherit;letter-spacing:.08em;',
      'text-transform:uppercase;color:var(--tx3)}',
    '.mesRow{display:flex;align-items:center;gap:11px;width:100%;border:0;',
      'background:transparent;padding:9px 2px;text-align:left;',
      'border-bottom:1px solid var(--line);color:inherit;font:inherit}',
    '.mesRow:last-child{border-bottom:0}',
    '.mesRow.clic{cursor:pointer}',
    '.mesRow .dd{flex:0 0 34px;text-align:center}',
    '.mesRow .dd b{display:block;font:700 15px/1 inherit;color:var(--tx)}',
    '.mesRow .dd span{display:block;margin-top:2px;font:600 9px/1 inherit;color:var(--tx3)}',
    '.mesRow .risco{flex:0 0 3px;align-self:stretch;border-radius:2px;min-height:26px}',
    '.mesRow .txt{flex:1;min-width:0}',
    '.mesRow .txt b{display:block;font:600 13px/1.25 inherit;color:var(--tx);',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mesRow .txt span{display:block;margin-top:2px;font:500 11px/1 inherit;color:var(--tx3)}',
    '.mesRow .tempo{flex:0 0 auto;text-align:right}',
    '.mesRow .tempo b{display:block;font:700 13px/1 inherit;color:var(--tx2)}',
    '.mesRow .tempo span{display:block;margin-top:2px;font:600 9px/1 inherit;color:var(--tx3)}',
    '.mesRow.hoje .dd b{color:var(--acc)}',
    '.mesRow.aguardando{opacity:.62}',
    '.mesVazio{color:var(--tx3);font:500 12px/1.5 inherit;padding:14px 0;text-align:center}',

    /* cabecalho do mes */
    '.mesTopo{display:flex;align-items:center;gap:11px;width:100%;border:0;',
      'background:transparent;padding:0 2px 10px;color:inherit;font:inherit;',
      'text-align:left;cursor:pointer}',
    '.mesTopo .seta{flex:none;width:12px;text-align:center;color:var(--tx3);',
      'font-size:15px;transition:transform .2s;transform:rotate(90deg)}',
    '.mesLista.fechado .mesTopo .seta{transform:none}',
    '.mesTopo .rot{flex:1;font:600 10px/1 inherit;letter-spacing:.08em;',
      'text-transform:uppercase;color:var(--tx3)}',
    '.mesTopo .tot{font:600 10px/1 inherit;color:var(--tx3)}',
    '.mesLista.fechado .mesCorpo{display:none}',

    /* cabecalho da semana */
    '.semBloco{background:var(--s1);border-radius:var(--r-md);margin-bottom:7px;',
      'overflow:hidden}',
    '.semTopo{display:flex;align-items:center;gap:11px;width:100%;border:0;',
      'background:transparent;padding:11px 12px;color:inherit;font:inherit;',
      'text-align:left;cursor:pointer}',
    '.semTopo .seta{flex:none;width:12px;text-align:center;color:var(--tx3);',
      'font-size:15px;transition:transform .2s}',
    '.semBloco.aberta .semTopo .seta{transform:rotate(90deg)}',
    '.semTopo .rot{flex:1;min-width:0}',
    '.semTopo .rot b{display:block;font:700 10.5px/1 inherit;letter-spacing:.09em;',
      'text-transform:uppercase;color:var(--tx2)}',
    '.semTopo .rot span{display:block;margin-top:3px;font:600 10.5px/1 inherit;',
      'color:var(--tx3)}',
    '.semTopo .mini{display:flex;align-items:flex-end;gap:2px;height:17px;flex:none}',
    '.semTopo .mini i{display:block;width:4px;border-radius:1.5px;min-height:2px}',
    '.semBloco .dentro{display:none;padding:0 12px 4px}',
    '.semBloco.aberta .dentro{display:block}',
    '.semBloco.aberta .semTopo{padding-bottom:4px}',
    '.semBloco.atual .semTopo .rot b{color:var(--acc)}'
  ].join('');
  document.head.appendChild(css);

  /* Monto com createElement e guardo a referencia do corpo, em vez de
     escrever innerHTML e reprocurar por seletor depois. Um seletor que
     nao acha devolve null em silencio e a lista some sem explicacao. */
  var caixa = document.createElement('div');
  caixa.className = 'mesLista';
  var titulo = document.createElement('button');
  titulo.type = 'button';
  titulo.className = 'mesTopo';
  var corpo = document.createElement('div');
  corpo.className = 'mesCorpo';
  caixa.appendChild(titulo);
  caixa.appendChild(corpo);
  cartao.appendChild(caixa);

  titulo.addEventListener('click', function(){
    caixa.classList.toggle('fechado');
  });

  function chave(d){
    return d.getFullYear() + '-' +
           String(d.getMonth()+1).padStart(2,'0') + '-' +
           String(d.getDate()).padStart(2,'0');
  }
  var HJ = chave(new Date());
  var MESES3 = ['jan','fev','mar','abr','mai','jun',
                'jul','ago','set','out','nov','dez'];
  var MESES  = ['janeiro','fevereiro','março','abril','maio','junho','julho',
                'agosto','setembro','outubro','novembro','dezembro'];

  /* Data a partir de 'AAAA-MM-DD' no fuso local. new Date(str) leria a
     string como UTC e no Brasil voltaria um dia — a semana inteira
     escorregaria para tras. */
  function dtLocal(iso){
    var p = String(iso).split('-').map(Number);
    return new Date(p[0], p[1]-1, p[2]);
  }

  function hm(min){
    min = Math.round(min || 0);
    if(!min) return '—';
    if(min < 60) return min + 'm';
    var hh = Math.floor(min/60), mm = min%60;
    return mm ? hh + 'h' + String(mm).padStart(2,'0') : hh + 'h';
  }

  function corDe(mod, caminhada){
    if(caminhada) return 'var(--rest)';
    var M = (typeof MOD === 'object' && MOD) ? MOD[mod] : null;
    return (M && M.c) || 'var(--rest)';
  }
  function nomeDe(mod){
    var M = (typeof MOD === 'object' && MOD) ? MOD[mod] : null;
    return (M && M.n) || 'Treino';
  }

  /* So conta como previsto o que tem procedencia. Mesmo criterio do
     Resumo da semana — ver a parte anterior. */
  function planoReal(s){
    if(!s) return false;
    if(s.origem === 'garmin' || s.origem === 'academia' || s.prova) return true;
    /* academia como 2o treino montada por voce nao tem origem, mas e
       treino de verdade e precisa aparecer na lista */
    return !!(s.extra && s.mod === 'forca');
  }

  function montar(){
    if(typeof ST !== 'object' || !ST || !ST.mes) return;

    var ano = ST.mes.getFullYear(), mes = ST.mes.getMonth();
    var prefixo = ano + '-' + String(mes+1).padStart(2,'0');
    var linhas = [];

    /* ── o que foi feito ── */
    var runs = (ST.runs || []);
    var hoje0 = new Date(); hoje0.setHours(0,0,0,0);
    for(var i=0;i<runs.length;i++){
      var r = runs[i];
      if(!r || !isFinite(r.d)) continue;
      var dd = new Date(hoje0.getTime() - r.d*864e5);
      var iso = chave(dd);
      if(iso.slice(0,7) !== prefixo) continue;
      var min = Math.round((typeof duracaoDe === 'function' ? duracaoDe(r) : (+r.dur||0)) / 60);
      linhas.push({
        iso: iso, dia: dd, feito: true, run: r,
        cor: corDe(r.mod, r.walk),
        titulo: r.walk ? 'Caminhada' : (r.titulo || nomeDe(r.mod)),
        sub: (r.km ? r.km.toFixed(1).replace('.',',') + ' km' : '') +
             (isFinite(r.fc) && r.fc > 0 ? (r.km ? ' · ' : '') + r.fc + ' bpm' : ''),
        min: min
      });
    }

    /* ── o que esta previsto e ainda nao tem atividade no dia ── */
    var jaTem = {};
    linhas.forEach(function(l){ jaTem[l.iso] = true });

    /* O SEGUNDO TREINO DO DIA TAMBEM E TREINO.
       Esta lista lia so ST.plano e ignorava ST.extras. Em dia que o
       treinador marca corrida, a academia vai para o encaixe de
       segundo treino — e sumia daqui, dando a impressao de que a
       academia tinha virado a corrida dele. */
    var plano = {};
    Object.keys(ST.plano || {}).forEach(function(k){ plano[k] = ST.plano[k] });
    Object.keys(ST.extras || {}).forEach(function(k){
      var x = ST.extras[k];
      /* qualquer segundo treino de forca entra — inclusive academia que
         voce montou na mao, que nao tem o campo origem */
      if(!x || x.mod !== 'forca') return;
      if(plano['x' + k]) return;
      plano['x' + k] = x;
    });

    Object.keys(plano).forEach(function(chaveP){
      var iso = chaveP.charAt(0) === 'x' ? chaveP.slice(1) : chaveP;
      var segundo = chaveP.charAt(0) === 'x';
      if(iso.slice(0,7) !== prefixo) return;
      if(jaTem[iso] && !segundo) return;
      var s = plano[chaveP];
      if(!planoReal(s)) return;
      var d = (typeof dt === 'function') ? dt(iso) : null;
      if(!d) return;
      linhas.push({
        iso: iso, dia: d, feito: false, run: null,
        cor: corDe(s.mod, false),
        titulo: s.titulo || nomeDe(s.mod),
        sub: (s.km ? (+s.km).toFixed(1).replace('.',',') + ' km · ' : '') +
             (segundo ? '2º treino · ' : '') +
             (iso < HJ ? 'não registrado' : 'previsto'),
        min: +s.min || 0,
        aguardando: true
      });
    });

    if(!linhas.length){
      corpo.innerHTML = '<p class="mesVazio">Nenhum treino neste mês.</p>';
      return;
    }

    linhas.sort(function(a,b){ return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0 });

    var D3 = (typeof DIA3 !== 'undefined') ? DIA3
           : ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
    var diaDaSemana = (typeof dow === 'function') ? dow : function(d){
      return d.getDay() === 0 ? 7 : d.getDay();
    };

    /* ── uma linha ── */
    function linhaHTML(l, idx){
      var cls = ['mesRow'];
      if(l.feito) cls.push('clic');
      if(l.aguardando) cls.push('aguardando');
      if(l.iso === HJ) cls.push('hoje');
      return '<' + (l.feito ? 'button' : 'div') + ' class="' + cls.join(' ') + '"' +
             (l.feito ? ' data-lin="' + idx + '" type="button"' : '') + '>' +
        '<span class="dd"><b>' + l.dia.getDate() + '</b><span>' +
          D3[diaDaSemana(l.dia)-1] + '</span></span>' +
        '<span class="risco" style="background:' + l.cor + '"></span>' +
        '<span class="txt"><b>' + l.titulo + '</b>' +
          (l.sub ? '<span>' + l.sub + '</span>' : '') + '</span>' +
        '<span class="tempo"><b>' + hm(l.min) + '</b><span>TEMPO</span></span>' +
      '</' + (l.feito ? 'button' : 'div') + '>';
    }

    /* ── agrupar por semana ──
       O mes inteiro aberto virava uma parede de linhas. Agrupo por
       semana e abro so a do dia que estiver selecionado no calendario:
       assim tocar num dia la em cima e o jeito de navegar aqui embaixo.

       A chave da semana e a segunda-feira, mesmo criterio que a aba de
       historico usa (segundaDe), para as duas telas nunca discordarem
       sobre onde uma semana comeca.                                   */
    var segunda = (typeof segundaDe === 'function') ? segundaDe : function(d){
      var x = new Date(d); x.setDate(x.getDate() - (diaDaSemana(d) - 1)); return x;
    };
    var semanaSel = chave(segunda((typeof dt === 'function' && ST.sel)
                                  ? dt(ST.sel) : new Date()));

    var ordem = [], porSemana = {};
    linhas.forEach(function(l, idx){
      var k = chave(segunda(l.dia));
      if(!porSemana[k]){ porSemana[k] = []; ordem.push(k) }
      porSemana[k].push({l:l, idx:idx});
    });

    var maxMin = 1;
    ordem.forEach(function(k){
      porSemana[k].forEach(function(x){ maxMin = Math.max(maxMin, x.l.min || 0) });
    });

    /* Se o dia selecionado esta noutro mes, abro a ultima semana da
       lista — melhor que deixar tudo fechado sem motivo aparente. */
    var abrir = porSemana[semanaSel] ? semanaSel : ordem[ordem.length - 1];

    var blocos = ordem.map(function(k){
      var itens = porSemana[k];
      var ini = dtLocal(k), fim = new Date(ini.getTime() + 6*864e5);
      var min = 0, km = 0, feitos = 0;
      itens.forEach(function(x){
        min += x.l.min || 0;
        if(x.l.feito){ feitos++; km += (+x.l.run.km || 0) }
      });
      var rotulo = k === chave(segunda(new Date())) ? 'Esta semana'
                 : ini.getMonth() === fim.getMonth()
                   ? ini.getDate() + ' – ' + fim.getDate() + ' ' + MESES3[fim.getMonth()]
                   : ini.getDate() + ' ' + MESES3[ini.getMonth()] + ' – ' +
                     fim.getDate() + ' ' + MESES3[fim.getMonth()];
      var resumo = itens.length + (itens.length === 1 ? ' treino' : ' treinos') +
                   (km ? ' · ' + (Math.round(km*10)/10).toString().replace('.',',') + ' km' : '') +
                   ' · ' + hm(min);
      var barrinhas = itens.map(function(x){
        var a = x.l.min ? Math.max(3, Math.round(x.l.min / maxMin * 17)) : 2;
        return '<i style="height:' + a + 'px;background:' + x.l.cor +
               (x.l.aguardando ? ';opacity:.4' : '') + '"></i>';
      }).join('');

      var cls = ['semBloco'];
      if(k === abrir) cls.push('aberta');
      if(k === chave(segunda(new Date()))) cls.push('atual');

      /* Monto o bloco e o cabecalho com createElement, nao com uma
         string unica. A sanfona precisa achar os blocos depois
         (querySelectorAll) e ligar/desligar a classe 'aberta' neles;
         com tudo vindo de innerHTML isso funciona no navegador mas nao
         da para testar aqui fora, e eu fico sem saber se quebrou. */
      var bloco = document.createElement('div');
      bloco.className = cls.join(' ');
      bloco.setAttribute('data-sem', k);

      var cabec = document.createElement('button');
      cabec.type = 'button';
      cabec.className = 'semTopo';
      cabec.setAttribute('data-abre', k);
      cabec.innerHTML =
        '<span class="seta">›</span>' +
        '<span class="rot"><b>' + rotulo + '</b><span>' + resumo + '</span></span>' +
        '<span class="mini">' + barrinhas + '</span>';

      var dentro = document.createElement('div');
      dentro.className = 'dentro';
      dentro.innerHTML = itens.map(function(x){ return linhaHTML(x.l, x.idx) }).join('');

      bloco.appendChild(cabec);
      bloco.appendChild(dentro);
      return bloco;
    });

    corpo.innerHTML = '';
    blocos.forEach(function(b){ corpo.appendChild(b) });

    /* cabecalho do mes: nome, quantos treinos e o tempo total */
    var totMin = 0, totFeitos = 0;
    linhas.forEach(function(l){
      totMin += l.min || 0;
      if(l.feito) totFeitos++;
    });
    titulo.innerHTML =
      '<span class="seta">›</span>' +
      '<span class="rot">' + MESES[mes] + ' ' + ano + '</span>' +
      '<span class="tot">' + totFeitos + ' de ' + linhas.length +
        ' feitos · ' + hm(totMin) + '</span>';

    /* guardo as linhas para o clique achar a atividade certa sem
       depender de casar numeros de novo */
    caixa._linhas = linhas;
  }

  caixa.addEventListener('click', function(ev){
    if(!ev.target.closest) return;

    /* abrir/fechar semana. Sanfona: abrir uma fecha as outras, senao o
       cartao volta a ficar do tamanho que voce reclamou. */
    var cab = ev.target.closest('[data-abre]');
    if(cab && caixa.contains(cab)){
      var bloco = cab.parentNode;
      var jaAberta = bloco.classList.contains('aberta');
      var todos = caixa.querySelectorAll('.semBloco');
      for(var i=0;i<todos.length;i++) todos[i].classList.remove('aberta');
      if(!jaAberta) bloco.classList.add('aberta');
      return;
    }

    var b = ev.target.closest('[data-lin]');
    if(!b || !caixa.contains(b)) return;
    var l = (caixa._linhas || [])[+b.getAttribute('data-lin')];
    if(l && l.run && typeof sheetAtividade === 'function') sheetAtividade(l.run);
  });

  /* Chamo sempre a cadeia anterior antes de montar a minha lista:
     outras partes penduraram efeito no renderCal e nao podem ser
     puladas. Ver a nota na parte do Resumo da semana. */
  var antes = window.renderCal;
  window.renderCal = function(){
    var r = antes.apply(this, arguments);
    try{ montar() }catch(e){ console.error('treinos do mes:', e) }
    return r;
  };

  try{ montar() }catch(e){}
});


/* ══════════════════════════════════════════════════════════════════════
   PREVISTO x REALIZADO no detalhe do treino — o bloco de baixo da tela
   de treino concluido do TrainingPeaks.

   A tela de detalhe ja mostrava o que voce fez: distancia, duracao,
   ritmo, frequencia cardiaca e a mecanica da passada. Nao dizia se
   aquilo era o que o treinador tinha pedido. Este bloco acrescenta a
   barra de Compliance e a tabela lado a lado.

   O que da para comparar, e de onde vem:
     Duracao   — previsto: duracaoSeg da agenda do Garmin · feito: r.dur
     Distancia — previsto: distanciaM da agenda      · feito: r.km
     Ritmo     — o previsto NAO traz ritmo. Fica travessao, nao chute.
     Calorias  — so o feito. Vem de RAW.atividades, porque o mapeamento
                 do app descarta esse campo ao montar ST.runs.
     TSS       — so o feito, calculado do seu pace de limiar.

   Sem barra de fases. Ela precisa dos dados de cada volta, que o robo
   de sincronizacao nao guarda, e a decisao foi nao mexer no robo.

   Se nao havia treino previsto no dia, o bloco diz isso em uma linha e
   nao mostra tabela nenhuma. Inventar um previsto seria pior que nada.
   ══════════════════════════════════════════════════════════════════════ */
PARTE('previsto x realizado no detalhe do treino', function(){

  if(typeof window.sheetAtividade !== 'function') return;

  var css = document.createElement('style');
  css.textContent = [
    '.pxr{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}',
    '.pxr h4{margin:0 0 10px;font:600 10px/1 inherit;letter-spacing:.08em;',
      'text-transform:uppercase;color:var(--tx3)}',
    '.pxrTopo{display:flex;justify-content:space-between;align-items:baseline;',
      'margin-bottom:7px}',
    '.pxrTopo b{font:700 15px/1 inherit;color:var(--tx)}',
    '.pxrTrilho{height:8px;border-radius:5px;background:var(--s1);overflow:hidden}',
    '.pxrTrilho i{display:block;height:100%;border-radius:5px}',
    '.pxrTab{width:100%;border-collapse:collapse;margin-top:14px}',
    '.pxrTab th{font:600 9px/1 inherit;letter-spacing:.06em;text-transform:uppercase;',
      'color:var(--tx3);text-align:right;padding:0 0 7px;font-weight:600}',
    '.pxrTab th:first-child{text-align:left}',
    '.pxrTab td{font:500 12px/1 inherit;color:var(--tx2);text-align:right;',
      'padding:8px 0;border-top:1px solid var(--line)}',
    '.pxrTab td:first-child{text-align:left;color:var(--tx3)}',
    '.pxrTab td.feito{color:var(--tx);font-weight:600}',
    '.pxrNota{margin:12px 0 0;font:500 11px/1.5 inherit;color:var(--tx3)}'
  ].join('');
  document.head.appendChild(css);

  function chave(d){
    return d.getFullYear() + '-' +
           String(d.getMonth()+1).padStart(2,'0') + '-' +
           String(d.getDate()).padStart(2,'0');
  }

  function hm(min){
    min = Math.round(min || 0);
    if(!min) return '—';
    if(min < 60) return min + ' min';
    var hh = Math.floor(min/60), mm = min%60;
    return mm ? hh + 'h' + String(mm).padStart(2,'0') : hh + 'h';
  }
  function kmT(v){
    return (v && v > 0) ? (Math.round(v*100)/100).toFixed(2).replace('.',',') + ' km' : '—';
  }
  function paceT(seg){
    if(!seg || seg <= 0 || !isFinite(seg)) return '—';
    return Math.floor(seg/60) + ':' + String(Math.round(seg%60)).padStart(2,'0') + ' /km';
  }

  var LIMIAR = (typeof PERFIL === 'object' && PERFIL && +PERFIL.paceLimiar) || 340;
  function tssDe(r){
    if(!r || r.mod !== 'corrida' || r.walk) return 0;
    var pace = +r.pace || 0, dur = +r.dur || 0;
    if(pace <= 0 || dur <= 0) return 0;
    var iF = LIMIAR / pace;
    if(iF > 1.6 || iF < 0.35) return 0;
    return Math.round(dur * iF * iF / 3600 * 100);
  }

  /* As calorias existem no Firebase mas somem no caminho: mapAtividade
     (index.html) nao copia o campo para ST.runs. Entao busco na fonte
     crua, casando pelo id do Garmin — que e o unico criterio que nao
     erra quando ha dois treinos no mesmo dia. */
  function caloriasDe(r){
    var R = (typeof RAW === 'object' && RAW && RAW.atividades) ? RAW.atividades : [];
    if(!R.length) return 0;
    var gid = String(r.gid || '');
    for(var i=0;i<R.length;i++){
      var a = R[i];
      if(!a) continue;
      if(gid && (String(a.garminId) === gid || String(a.id) === gid))
        return +a.calorias || 0;
    }
    return 0;
  }

  function planoReal(s){
    return !!(s && (s.origem === 'garmin' || s.origem === 'academia' || s.prova));
  }

  function bloco(r){
    if(!r) return '';
    var dia = (typeof HOJE !== 'undefined' && typeof addD === 'function')
              ? addD(HOJE, -r.d) : null;
    if(!dia) return '';
    var iso = chave(dia);

    var s = (typeof sessaoDe === 'function') ? sessaoDe(iso) : null;
    if(!planoReal(s)) s = null;

    var realMin = Math.round((typeof duracaoDe === 'function'
                              ? duracaoDe(r) : (+r.dur||0)) / 60);
    var realKm  = +r.km || 0;
    var realCal = caloriasDe(r);
    var realTss = tssDe(r);

    var h = '<div class="pxr"><h4>Previsto x realizado</h4>';

    if(!s){
      h += '<p class="pxrNota">Não havia treino previsto para este dia, ' +
           'então não há o que comparar.</p></div>';
      return h;
    }

    var planMin = +s.min || 0;
    var planKm  = +s.km  || 0;

    /* Compliance sobre a duracao, que e o que o treinador controla.
       Passar de 100% nao e melhor: a barra pinta de laranja quando
       estoura, igual a quando falta. */
    if(planMin){
      var razao = realMin / planMin;
      var pct   = Math.round(razao * 100);
      var cor   = (razao >= .85 && razao <= 1.25) ? 'var(--ok)'
                : (razao >= .50 && razao <= 1.60) ? 'var(--warn)'
                : 'var(--bad)';
      h += '<div class="pxrTopo"><span style="font:600 10px/1 inherit;' +
             'letter-spacing:.08em;text-transform:uppercase;color:var(--tx3)">' +
             'Compliance</span><b>' + pct + '%</b></div>' +
           '<div class="pxrTrilho"><i style="width:' +
             Math.max(2, Math.min(100, razao*100)) + '%;background:' + cor +
           '"></i></div>';
    }

    var linhas = [
      ['Duração',   hm(planMin),   hm(realMin)],
      ['Distância', kmT(planKm),   kmT(realKm)],
      ['Ritmo médio', '—',         paceT(+r.pace)],
      ['Calorias',  '—',           realCal ? realCal + ' kcal' : '—'],
      ['TSS',       '—',           realTss ? String(realTss) : '—']
    ];

    h += '<table class="pxrTab"><thead><tr><th></th>' +
         '<th>Previsto</th><th>Realizado</th></tr></thead><tbody>' +
         linhas.map(function(l){
           return '<tr><td>' + l[0] + '</td><td>' + l[1] +
                  '</td><td class="feito">' + l[2] + '</td></tr>';
         }).join('') + '</tbody></table>';

    h += '<p class="pxrNota">O que o treinador agenda no Garmin traz ' +
         'duração e distância, mas não ritmo — por isso os travessões.</p>';

    return h + '</div>';
  }

  var antes = window.sheetAtividade;
  window.sheetAtividade = function(r){
    var out = antes.apply(this, arguments);
    try{
      var alvo = document.getElementById('sheetIn');
      if(alvo && r) alvo.insertAdjacentHTML('beforeend', bloco(r));
    }catch(e){
      console.error('previsto x realizado:', e);
    }
    return out;
  };
});


/* ══════════════════════════════════════════════════════════════════════
   TEMA CLARO — escolha entre o fundo escuro de hoje e um fundo claro.

   Deu para fazer sem reescrever a folha de estilo porque o app quase
   todo ja pinta por variavel: 868 usos de var(--...) contra 140 cores
   escritas direto. Destas, so 12 eram fundo e 18 eram texto — e essas
   estao corrigidas aqui embaixo, uma a uma.

   O verde-limao (#C9F24E) nao vem para o tema claro. Sobre branco ele
   tem contraste 1.4 e some. No lugar entra um verde fechado (#46700C)
   com contraste 5.9 sobre branco, que faz o mesmo papel e se le.

   Todas as cores do tema claro foram medidas pela regra WCAG e passam
   de 4.5 sobre os dois fundos (branco e o cinza de fundo). A unica
   abaixo disso e a de descanso, de proposito: ela existe para parecer
   apagada, e 3.5 e o suficiente para um ponto colorido.

   O tema escuro nao muda em nada. Tudo aqui esta dentro de
   html[data-tema="claro"] e so vale quando voce escolhe.
   ══════════════════════════════════════════════════════════════════════ */
PARTE('tema claro', function(){

  var CHAVE = 'bq_tema';
  var raiz  = document.documentElement;

  function atual(){
    try{ return localStorage.getItem(CHAVE) === 'claro' ? 'claro' : 'escuro' }
    catch(e){ return 'escuro' }
  }
  function aplicar(t){
    if(t === 'claro') raiz.setAttribute('data-tema', 'claro');
    else raiz.removeAttribute('data-tema');
    /* a barra de status do iPhone acompanha */
    var m = document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', t === 'claro' ? '#F5F7FA' : '#0A0D12');
  }

  var css = document.createElement('style');
  css.textContent = [

    /* ── a paleta clara ── */
    'html[data-tema="claro"]{',
      '--bg:#F5F7FA; --s1:#FFFFFF; --s2:#EEF2F7; --s3:#E2E8F0; --line:#D8E0E9;',
      '--tx:#111820; --tx2:#44515F; --tx3:#5C6875;',
      '--acc:#46700C; --acc-wash:rgba(70,112,12,.12);',
      '--run:#46700C; --bike:#1A62A6; --swim:#0A6E62; --gym:#A34A08; --rest:#78859A;',
      '--ok:#157347; --ok-wash:rgba(21,115,71,.12);',
      '--warn:#835A00; --warn-wash:rgba(131,90,0,.14);',
      '--bad:#B5332A; --bad-wash:rgba(181,51,42,.12);',
      '--acc-tx:#FFFFFF;',
    '}',
    /* no escuro, texto sobre a cor de destaque continua sendo o preto */
    ':root{--acc-tx:#0A0D12}',

    /* ── as cores que estavam escritas direto no codigo ── */
    'html[data-tema="claro"]{background:var(--bg)}',
    'html[data-tema="claro"] body{background:var(--bg)}',

    /* abertura do app */
    'html[data-tema="claro"] #capa{background:var(--bg)}',
    'html[data-tema="claro"] .clock,',
    'html[data-tema="claro"] .clock .l3,',
    'html[data-tema="claro"] .cresumo .v{color:var(--tx)}',
    'html[data-tema="claro"] .cresumo{color:var(--tx2)}',
    'html[data-tema="claro"] .centrar{color:var(--acc-tx)}',

    /* calendario: dia de outro mes */
    'html[data-tema="claro"] .day.off .dn{color:#C3CCD8}',

    /* o quadro do resumo desde uma data */
    'html[data-tema="claro"] .marco{',
      'background:linear-gradient(140deg,#EAF1E4,#E6EDF4 55%,#E3F0E9)}',

    /* botao de periodo do TSS, na aba KPI */
    'html[data-tema="claro"] #v-kpi .bqTssPer.on{color:var(--acc-tx)}',

    /* segunda linha da planilha (o "+ Academia") */
    'html[data-tema="claro"] #bqPl td.t .zx{color:var(--tx3)}',

    /* pontinhos de legenda com cor escrita direto (classe .leg > i.sq) */
    'html[data-tema="claro"] .leg i[style*="#3A4757"],',
    'html[data-tema="claro"] .leg i[style*="#4A5768"]{background:var(--rest)!important}',

    /* sombras: no claro, sombra preta forte fica suja */
    'html[data-tema="claro"] .card{box-shadow:0 1px 2px rgba(16,24,40,.05),',
      '0 1px 3px rgba(16,24,40,.06)}',

    /* ── o seletor, na aba Dados ── */
    '.bqTema{display:flex;gap:6px;background:var(--s1);padding:4px;',
      'border-radius:12px;margin-top:14px}',
    '.bqTema button{flex:1;border:0;background:transparent;color:var(--tx3);',
      'font:600 13px/1 inherit;padding:11px 6px;border-radius:9px;cursor:pointer}',
    '.bqTema button.on{background:var(--s3);color:var(--tx)}',
    '.bqTema button .am{display:inline-block;width:11px;height:11px;border-radius:50%;',
      'margin-right:7px;vertical-align:-1px;border:1px solid var(--line)}'
  ].join('');
  document.head.appendChild(css);

  aplicar(atual());

  /* ── o cartao de escolha, na aba Dados ── */
  var alvo = document.getElementById('v-dados');
  if(!alvo) return;

  var cartao = document.createElement('section');
  cartao.className = 'card';
  cartao.innerHTML =
    '<div class="head"><div><h2>Aparência</h2></div></div>' +
    '<p class="ajuda" style="margin-top:10px">O tema claro tem contraste maior ' +
    'no sol. O verde de destaque fica mais fechado nele, porque o verde-limão ' +
    'não se enxerga sobre branco.</p>' +
    '<div class="bqTema">' +
      '<button data-tema="escuro"><span class="am" style="background:#0A0D12"></span>Escuro</button>' +
      '<button data-tema="claro"><span class="am" style="background:#F5F7FA"></span>Claro</button>' +
    '</div>';
  alvo.appendChild(cartao);

  function pintarBotoes(){
    var t = atual();
    Array.prototype.forEach.call(cartao.querySelectorAll('[data-tema]'), function(b){
      if(b.getAttribute('data-tema') === t) b.classList.add('on');
      else b.classList.remove('on');
    });
  }
  pintarBotoes();

  cartao.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('[data-tema]');
    if(!b || !cartao.contains(b)) return;
    var t = b.getAttribute('data-tema');
    try{ localStorage.setItem(CHAVE, t) }catch(e){}
    aplicar(t);
    pintarBotoes();
  });

  /* para conferir pelo console sem procurar a aba */
  window.bqTema = function(t){
    if(t !== 'claro' && t !== 'escuro') return 'use bqTema("claro") ou bqTema("escuro")';
    try{ localStorage.setItem(CHAVE, t) }catch(e){}
    aplicar(t); pintarBotoes();
    return 'tema: ' + t;
  };
});
