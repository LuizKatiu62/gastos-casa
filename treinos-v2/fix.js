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

const FIX_VERSAO = '02v';
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
      if(v.length < 2) return null;
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
    if(!b.plan)
      return {classe:'info', t:'Nenhum treino do plano avaliado ainda',
        d:'Ou o plano começou hoje, ou o treino de hoje ainda não chegou do Garmin. '
        + 'A sincronia roda de hora em hora — quando a atividade aparecer na aba Evolução, ela aparece aqui também.'};
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
      + '<div class="bqa-c"><i>Volume</i><b>' + Math.round(b.kmFeito) + ' km</b><u>de ' + Math.round(b.kmPlan) + ' km · ' + num(b.pctKm) + '</u></div>'
      + '<div class="bqa-c"><i>Carga 7d ÷ média</i><b>' + (b.acwr ? b.acwr.toFixed(2) : '—') + '</b><u>'
        + (b.acwr ? (b.acwr > 1.45 ? 'subindo rápido' : b.acwr < 0.8 ? 'caindo' : 'faixa segura') : 'sem dados') + '</u></div>'
      + '<div class="bqa-c"><i>Eficiência aeróbica</i><b>'
        + (b.efDelta === null ? '—' : (b.efDelta >= 0 ? '+' : '') + (b.efDelta * 100).toFixed(1) + '%')
        + '</b><u>' + (b.efDelta === null ? 'faltam corridas com FC' : 'contra as 3 semanas antes') + '</u></div>'
      + '</div>';

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
    if(!chaves.length) return null;

    var ini = segunda(dt(chaves[0])), fimProva = dt(o.data);
    var runs = corridas(), sems = [], n = 0;

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

    /* ── cabeçalho ── */
    h += '<div class="khero"><div class="d">' + Math.max(0, dias) + ' dias</div>' +
      '<div class="t">para ' + (o.nome || o.n) + ' · semana <b>' + atual + '</b> de <b>' + sems.length + '</b></div>' +
      '<div class="kbar">' + sems.map(function(w,i){
        return '<i class="' + (i === atual-1 ? 'hoje' : (!w.futura ? 'on' : '')) + '"></i>' }).join('') +
      '</div></div>';

    if(!passadas.length){
      el.innerHTML = h + '<div class="vazio">O ciclo ainda não começou.<br>Os indicadores aparecem na primeira semana de treino.</div>';
      return;
    }

    /* ── 1. aderência ── */
    var comPlano = passadas.filter(function(w){ return w.planKm > 0 });
    var totPlan = comPlano.reduce(function(s,w){ return s+w.planKm }, 0);
    var totFeito = comPlano.reduce(function(s,w){ return s+w.feitoKm }, 0);
    var ader = totPlan > 0 ? totFeito/totPlan*100 : 0;
    var perSem = comPlano.map(function(w){ return w.planKm > 0 ? +(w.feitoKm/w.planKm*100).toFixed(0) : 0 });
    var seq = 0;
    for(var i = perSem.length-1; i >= 0; i--){ if(perSem[i] >= 85) seq++; else break }
    var corA = function(v){ return v >= 85 ? 'var(--ok)' : v >= 65 ? 'var(--warn)' : 'var(--bad)' };
    var maxA = Math.max(115, Math.max.apply(null, perSem.concat([100])));
    var d4 = perSem.length >= 5 ? perSem[perSem.length-1] - perSem[perSem.length-5] : null;

    h += '<div class="kcard"><div class="kcab"><h3>Aderência ao plano</h3>' + chip(d4, '% vs S-4') + '</div>' +
      '<div class="kbig" style="color:' + corA(ader) + '">' + ader.toFixed(0) + '%' +
        '<small>' + totFeito.toFixed(0) + ' km feitos dos ' + totPlan.toFixed(0) + ' km que o plano pediu até hoje</small></div>' +
      svgBox(grade(maxA, 0, function(v){ return v.toFixed(0) + '%' }) +
        refLinha(100, 0, maxA, 'var(--ok)', 'plano cheio') +
        paresDeBarras(perSem, null, maxA, corA) +
        eixoX(perSem.length, function(i){ return 'S'+(i+1) })) +
      legenda([['≥85%','var(--ok)'],['65 a 84%','var(--warn)'],['<65%','var(--bad)']]) +
      '<p class="ksub"><b>' + seq + '</b> ' + (seq === 1 ? 'semana seguida' : 'semanas seguidas') +
        ' fechando 85% ou mais. ' + (seq >= 3 ? 'É a sequência que constrói prova longa.'
          : seq >= 1 ? 'Duas ou três seguidas já mudam o resultado.'
          : 'Uma semana cheia recoloca a sequência de pé.') + '</p></div>';

    /* ── 2. volume ── */
    var vFeito = passadas.map(function(w){ return w.feitoKm });
    var vPlan  = passadas.map(function(w){ return w.planKm });
    var maxV = Math.max.apply(null, vFeito.concat(vPlan).concat([10])) * 1.12;
    var ult = passadas[passadas.length-1];
    var tV = tendencia(vFeito, 0, maxV, 'var(--run)');
    var dV = vFeito.length >= 5 ? vFeito[vFeito.length-1] - vFeito[vFeito.length-5] : null;

    h += '<div class="kcard"><div class="kcab"><h3>Volume semanal</h3>' + chip(dV, ' km vs S-4') + '</div>' +
      '<div class="kbig">' + ult.feitoKm.toFixed(0) + '<small>km nesta semana, de ' + ult.planKm.toFixed(0) +
        ' planejados · a linha tracejada é a tendência do ciclo</small></div>' +
      svgBox(grade(maxV, 0, function(v){ return v.toFixed(0) }) +
        paresDeBarras(vFeito, vPlan, maxV, 'var(--run)') +
        tV.svg +
        eixoX(vFeito.length, function(i){ return 'S'+(i+1) })) +
      legenda([['realizado','var(--run)'],['planejado','', 'gh'],['tendência','var(--run)','ln']]) +
      '<p class="ksub">' + (tV.incl > 0.5 ? 'Seu volume vem <b>subindo</b> ao longo do ciclo, que é o esperado até a semana de pico.'
        : tV.incl < -0.5 ? 'Seu volume vem <b>caindo</b>. Se ainda não é semana de polimento, vale entender por quê.'
        : 'Volume <b>estável</b> ao longo do ciclo.') + '</p></div>';

    /* ── 3. longão ── */
    var lFeito = passadas.map(function(w){ return w.longoFeito });
    var lPlan  = passadas.map(function(w){ return w.longoPlan });
    var alvoL = o.longoMax || Math.max.apply(null, lPlan.concat([10]));
    var maiorL = Math.max.apply(null, lFeito.concat([0]));
    var maxL = Math.max(alvoL, maiorL) * 1.18;
    var pL = pontos(lFeito.map(function(v){ return v > 0 ? v : null }), 0, maxL);

    h += '<div class="kcard"><div class="kcab"><h3>Treino longo</h3>' +
        '<span class="delta ' + (maiorL >= alvoL ? 'up' : 'fl') + '">' +
        Math.round(maiorL/alvoL*100) + '% do pico</span></div>' +
      '<div class="kbig">' + maiorL.toFixed(0) + '<small>km, seu maior até aqui. O pico do ciclo é ' +
        alvoL.toFixed(0) + ' km</small></div>' +
      svgBox(grade(maxL, 0, function(v){ return v.toFixed(0) }) +
        refLinha(alvoL, 0, maxL, 'var(--acc)', 'pico ' + alvoL.toFixed(0) + ' km') +
        paresDeBarras(lFeito, lPlan, maxL, 'rgba(201,242,78,.30)') +
        area(pL, 'var(--run)') + curva(pL, 'var(--run)') +
        balao(pL, maiorL.toFixed(0) + ' km', 'var(--run)') +
        eixoX(lFeito.length, function(i){ return 'S'+(i+1) })) +
      legenda([['maior treino da semana','var(--run)'],['planejado','', 'gh']]) +
      '<p class="ksub">' + (maiorL >= alvoL
        ? 'Você já passou pelo longão de pico. Daqui para frente o trabalho é <b>chegar inteiro</b>, não mais forte.'
        : 'Faltam <b>' + (alvoL-maiorL).toFixed(0) + ' km</b> até o longão de pico do plano.') + '</p></div>';

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
          eixoX(prev.length, function(i){ return 'S'+(i+1) })) +
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
          eixoX(efs.length, function(i){ return 'S'+(i+1) })) +
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
        if(confirm('fix.js ' + FIX_VERSAO + ' — as vinte e sete partes carregaram.\n\n'
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
        ? 'fix.js ' + FIX_VERSAO + ' — as vinte e sete partes carregaram.\n\nPlano PEI Marathon: ' + (window.planoBQ && window.planoBQ.ligado() ? 'LIGADO' : 'desligado') + '\n\nOK para trocar.'
        : 'fix.js ' + FIX_VERSAO + '\n\nFalharam:\n\n' + FIX_FALHAS.join('\n\n'));
    };
    barra.insertBefore(s, barra.firstChild.nextSibling);
    if(!ok) console.warn('fix.js · falhas:', FIX_FALHAS);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
  setTimeout(montar, 1500);
})();
