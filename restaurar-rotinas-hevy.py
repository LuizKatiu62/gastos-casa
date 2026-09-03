#!/usr/bin/env python3
"""
Devolve ao Hevy as rotinas que sumiram da conta em 26/08/2026.

O QUE ACONTECEU. Em 26/08, entre 20:12 e 23:44 UTC, o numero de rotinas
lidas pela API do Hevy caiu de 9 para 1. Investiguei o repositorio
inteiro: nao existe DELETE em lugar nenhum, e o unico envio ao Hevy que
ja existiu (hevy-sync.yml, travado em 27/08) fazia PUT numa unica
rotina, achada pelo titulo — sobrescrevia o conteudo dela, nunca
apagava as outras. Ou seja: nao foi nada deste repositorio.

Mais um indicio de que as nove foram embora juntas: no backup a rotina
se chamava "Forca - Quadril e Core (base)"; a que existe hoje se chama
"FORCA - QUADRIL E CORE (BASE)", em maiusculas. Titulo diferente e
rotina diferente. A atual foi criada nova, nao sobreviveu.

O QUE ESTE ARQUIVO FAZ, E SO ISSO:

    POST /v1/routines   — cria rotina que nao existe

O QUE ELE NAO FAZ, EM HIPOTESE NENHUMA:

    DELETE  — nao existe neste arquivo. Procure.
    PUT     — nao existe neste arquivo. Procure.

Criar e a unica operacao segura: o que ja esta no Hevy continua onde
esta, intacto. Se uma rotina do backup tiver titulo que ja existe na
conta (comparando sem acento e sem caixa), ela e PULADA. Isso protege
a "FORCA - QUADRIL E CORE (BASE)" que o Luiz usou hoje.

MODO ENSAIO. Por padrao o script nao escreve nada: ele lista o que
faria e para. So escreve com CONFIRMAR=sim. A ideia e ver a lista
antes, e nao descobrir depois.

TEMPLATES. O Hevy nao aceita exercicio por nome — cada um tem um id de
template. O script le /v1/exercise_templates e casa pelo nome. Os nomes
do backup ja estao em ingles, iguais aos do Hevy, entao o casamento e
direto. Exercicio que nao casar fica de fora e aparece no relatorio: e
melhor uma rotina com um exercicio a menos, que voce completa em 10
segundos no telefone, do que um chute que coloca o movimento errado.
"""

import json, os, re, time, unicodedata
from datetime import datetime
import urllib.request as urlreq
import urllib.error

HEVY_BASE = "https://api.hevyapp.com/v1"
ARQ_BACKUP = "backup-rotinas-hevy.json"

# Descanso padrao. O backup guardou series e notas, mas nao o descanso,
# porque o resumo que gerou o arquivo nao lia esse campo. 90s e o valor
# comum para forca nesta faixa; ajuste no telefone se quiser outro.
DESCANSO_PADRAO = 90


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# ── comparacao de titulos ─────────────────────────────────────────────
def chave(txt):
    """'Forca - Quadril e Core (base)' e 'FORCA - QUADRIL E CORE (BASE)'
    tem que ser reconhecidos como a MESMA rotina, senao eu criaria uma
    copia da que o Luiz usou hoje. Tiro acento, caixa e espaco extra."""
    t = unicodedata.normalize("NFD", str(txt or ""))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^a-z0-9]+", " ", t.lower())
    return t.strip()


# ── HTTP ──────────────────────────────────────────────────────────────
def hevy_get(caminho, api_key):
    req = urlreq.Request(HEVY_BASE + caminho, headers={"api-key": api_key})
    try:
        with urlreq.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise SystemExit("Chave recusada pelo Hevy (401). Confira HEVY_API_KEY.")
        raise SystemExit(f"GET {caminho} devolveu {e.code}")


def hevy_post_rotina(corpo, api_key):
    """A UNICA escrita deste arquivo. Cria uma rotina nova."""
    dados = json.dumps(corpo, ensure_ascii=False).encode()
    req = urlreq.Request(
        HEVY_BASE + "/routines", data=dados, method="POST",
        headers={"api-key": api_key, "Content-Type": "application/json"})
    try:
        with urlreq.urlopen(req, timeout=30) as r:
            return True, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read()[:300].decode('utf-8', 'replace')}"


def paginar(rota, campo, api_key, tam=100, limite=30):
    out = []
    for p in range(1, limite + 1):
        j = hevy_get(f"{rota}?page={p}&pageSize={tam}", api_key)
        lote = j.get(campo) or []
        out.extend(lote)
        if len(lote) < tam:
            break
        time.sleep(0.2)
    return out


# ── series ────────────────────────────────────────────────────────────
def montar_series(texto):
    """'4×5' -> 4 series de 5 repeticoes. '3×45s' -> 3 series de 45s.

    '3 séries' -> 3 series em branco, para preencher no telefone.

    E o inverso exato do texto_series() do sync-hevy.py, que foi quem
    gerou o backup. Aquela funcao cai em "N séries" quando o exercicio
    nao tem repeticao nem duracao — o Farmers Walk do backup e assim, e
    faz sentido: carregar peso se mede por distancia ou tempo, e o
    resumo nao guardou nenhum dos dois. Nesse caso crio as N series
    vazias: o numero de series eu sei, o conteudo delas nao invento.

    Se nem isso bater, devolvo lista vazia e o exercicio entra sem
    serie definida, em vez de chutar numero.
    """
    t = str(texto or "").strip().replace("x", "×").replace("X", "×")
    serie = {"type": "normal", "weight_kg": None, "reps": None,
             "distance_meters": None, "duration_seconds": None,
             "custom_metric": None}

    # "3 séries" / "3 series": so o numero de series e conhecido
    m = re.match(r"^\s*(\d+)\s*s[ée]ries?\s*$", t, re.I)
    if m:
        quantas = int(m.group(1))
        return [dict(serie) for _ in range(quantas)] if 1 <= quantas <= 20 else []

    m = re.match(r"^\s*(\d+)\s*×\s*(\d+)\s*(s)?\s*$", t)
    if not m:
        return []
    quantas, valor, e_tempo = int(m.group(1)), int(m.group(2)), bool(m.group(3))
    if quantas < 1 or quantas > 20:
        return []
    if e_tempo:
        serie["duration_seconds"] = valor
    else:
        serie["reps"] = valor
    return [dict(serie) for _ in range(quantas)]


def achar_template(nome, mapa):
    k = chave(nome)
    if k in mapa:
        return mapa[k]
    # tentativa unica e conservadora: nome do backup contido no do Hevy,
    # ou o contrario, e so quando houver UM candidato. Dois candidatos
    # viram nenhum — chutar aqui trocaria o movimento.
    cands = [v for kk, v in mapa.items() if k and (k in kk or kk in k)]
    return cands[0] if len(cands) == 1 else None


# ── principal ─────────────────────────────────────────────────────────
def main():
    log("━━━ Restaurar rotinas no Hevy ━━━")
    log("Este script so CRIA. Nao existe DELETE nem PUT nele.")

    api_key = os.environ.get("HEVY_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Falta o secret HEVY_API_KEY.")

    confirmar = os.environ.get("CONFIRMAR", "").strip().lower()
    escrever = confirmar in ("sim", "s", "yes", "y", "true", "1")
    log("MODO: ENVIO REAL" if escrever else "MODO: ENSAIO (nada sera escrito)")

    if not os.path.exists(ARQ_BACKUP):
        raise SystemExit(f"Nao achei {ARQ_BACKUP} na raiz do repositorio.")
    with open(ARQ_BACKUP, encoding="utf-8") as f:
        backup = json.load(f)
    rotinas_bkp = backup.get("rotinas") or {}
    log(f"Backup de {backup.get('capturadoEm','?')}: {len(rotinas_bkp)} rotinas")

    # ── o que ja existe na conta, para nao duplicar ──
    existentes = paginar("/routines", "routines", api_key, tam=10)
    ja_tem = {chave(r.get("title")) for r in existentes}
    log(f"Na conta agora: {len(existentes)} rotina(s)")
    for r in existentes:
        log(f"    ja existe: {r.get('title')}")

    # ── catalogo de exercicios do Hevy ──
    templates = paginar("/exercise_templates", "exercise_templates", api_key, tam=100)
    mapa = {}
    for t in templates:
        k = chave(t.get("title"))
        if k and k not in mapa:
            mapa[k] = t.get("id")
    log(f"Catalogo do Hevy: {len(mapa)} exercicios")

    criadas, puladas, falhas = 0, 0, 0
    sem_template_geral = []

    for titulo, r in rotinas_bkp.items():
        if chave(titulo) in ja_tem:
            log(f"PULADA (ja existe na conta): {titulo}")
            puladas += 1
            continue

        exercicios, faltando = [], []
        for ex in (r.get("exercicios") or []):
            nome = ex.get("nome") or ""
            tid = achar_template(nome, mapa)
            if not tid:
                faltando.append(nome)
                continue
            exercicios.append({
                "exercise_template_id": tid,
                "superset_id": None,
                "rest_seconds": DESCANSO_PADRAO,
                "notes": str(ex.get("nota") or "")[:250],
                "sets": montar_series(ex.get("series")),
            })

        if faltando:
            sem_template_geral.extend(faltando)

        if not exercicios:
            log(f"NAO CRIADA (nenhum exercicio casou): {titulo}")
            falhas += 1
            continue

        log(f"{titulo}: {len(exercicios)} exercicio(s)"
            + (f" · {len(faltando)} sem equivalente: {faltando}" if faltando else ""))

        if not escrever:
            criadas += 1          # no ensaio, so conta o que faria
            continue

        corpo = {"routine": {
            "title": titulo,
            "folder_id": None,
            "notes": f"Restaurada do backup de {backup.get('capturadoEm','')[:10]}.",
            "exercises": exercicios,
        }}
        ok, resp = hevy_post_rotina(corpo, api_key)
        if ok:
            log(f"  CRIADA: {titulo}")
            criadas += 1
        else:
            log(f"  FALHOU: {titulo} · {resp}")
            falhas += 1
        time.sleep(0.5)

    log("")
    if escrever:
        log(f"RESULTADO: {criadas} criada(s) · {puladas} pulada(s) · {falhas} falha(s)")
    else:
        log(f"ENSAIO: criaria {criadas} · pularia {puladas} · {falhas} sem exercicio")
        log("Para valer, rode de novo com confirmar = sim.")
    if sem_template_geral:
        log(f"Sem equivalente no Hevy: {sorted(set(sem_template_geral))}")
        log("Esses voce adiciona no telefone; preferi deixar de fora a chutar o movimento.")
    log("━━━ concluido ━━━")


if __name__ == "__main__":
    main()
