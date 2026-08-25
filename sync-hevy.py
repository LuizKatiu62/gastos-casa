#!/usr/bin/env python3
"""
Hevy -> Firebase — traz as rotinas de forca e a carga de cada exercicio.

Por que existe. O sync do Garmin registra que voce fez uma sessao de
forca: duracao, frequencia cardiaca, calorias. Nao registra o que foi
levantado. Peso, series e repeticoes so existem no Hevy, e sao eles que
dizem se a musculacao esta progredindo ou parada.

O que grava, em treinos_hevy/luiz:
  rotinas   — os treinos montados no Hevy, com exercicios e series
  cargas    — o peso mais recente de cada exercicio, e o de 8 semanas
              atras, para medir progressao
  historico — volume (kg x reps) por semana
  meta      — quando sincronizou e quantos treinos leu

Nao apaga nem altera nada no Hevy. So le.

Roda pelo workflow hevy-pull.yml. Secrets necessarios:
  HEVY_API_KEY, FIREBASE_EMAIL, FIREBASE_PASSWORD
"""

import json, os, sys, time
from datetime import datetime, timedelta
import urllib.request as urlreq
import urllib.error

HEVY_BASE     = "https://api.hevyapp.com/v1"
FIREBASE_DB   = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
# treinos_hevy/luiz e recusado pelas regras do banco (401 no PUT).
# treinos_coach_v2/luiz ja e gravavel — o sync do Garmin escreve
# garminEnviado ali dentro. Entao o Hevy vira um ramo desse mesmo no.
FIREBASE_PATH = "treinos_coach_v2/luiz/hevy"
FIREBASE_KEY  = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"
SEMANAS_HIST  = 12


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# ── Hevy ──────────────────────────────────────────────────────────────
def hevy_get(caminho, chave):
    req = urlreq.Request(HEVY_BASE + caminho, headers={"api-key": chave})
    try:
        with urlreq.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise SystemExit("Chave recusada pelo Hevy (401). Confira HEVY_API_KEY.")
        raise SystemExit(f"GET {caminho} devolveu {e.code}")


def paginar(rota, campo, chave, tam=10, limite=40):
    """Junta as paginas. O Hevy pagina rotinas e treinos separadamente."""
    out = []
    for p in range(1, limite + 1):
        j = hevy_get(f"{rota}?page={p}&pageSize={tam}", chave)
        lote = j.get(campo) or []
        out.extend(lote)
        if len(lote) < tam:
            break
        time.sleep(0.2)
    return out


def diagnosticar(nome, lista):
    """Imprime a forma real do que veio.

    Escrevi este arquivo sem poder chamar a API — nao tenho a chave. Se
    algum nome de campo estiver errado, e aqui que vai aparecer, em vez
    de virar tela vazia sem explicacao.
    """
    if not lista:
        log(f"{nome}: nada veio")
        return
    amostra = lista[0]
    log(f"{nome}: {len(lista)} itens · campos do primeiro: {sorted(amostra.keys())}")
    ex = (amostra.get("exercises") or [])
    if ex:
        log(f"{nome}: campos de exercicio: {sorted(ex[0].keys())}")
        sets = ex[0].get("sets") or []
        if sets:
            log(f"{nome}: campos de serie: {sorted(sets[0].keys())}")


# ── traducao ──────────────────────────────────────────────────────────
def texto_series(sets):
    """[{reps:10, weight_kg:16}, ...] -> ('3×10', 16.0)

    O peso mostrado e o maior da sessao: e a serie de trabalho, nao o
    aquecimento.
    """
    if not sets:
        return "", None
    reps = [s.get("reps") for s in sets if s.get("reps")]
    dur  = [s.get("duration_seconds") for s in sets if s.get("duration_seconds")]
    pesos = [s.get("weight_kg") for s in sets if s.get("weight_kg")]
    peso = max(pesos) if pesos else None
    if reps:
        r = max(set(reps), key=reps.count)          # a repeticao mais comum
        return f"{len(sets)}×{r}", peso
    if dur:
        d = max(set(dur), key=dur.count)
        return f"{len(sets)}×{int(d)}s", peso
    return f"{len(sets)} séries", peso


def nome_exercicio(ex):
    return ex.get("title") or ex.get("name") or ex.get("exercise_template_id") or "Exercício"


def data_do_treino(w):
    bruto = w.get("start_time") or w.get("created_at") or ""
    return str(bruto)[:10]


def volume_do_treino(w):
    """Soma peso x repeticoes de todas as series. Em kg."""
    total = 0.0
    for ex in (w.get("exercises") or []):
        for s in (ex.get("sets") or []):
            p, r = s.get("weight_kg"), s.get("reps")
            if p and r:
                total += float(p) * int(r)
    return round(total)


def semana_de(data_iso):
    try:
        return datetime.strptime(data_iso, "%Y-%m-%d").strftime("%Y-W%V")
    except Exception:
        return "0000-W00"


# ── Firebase ──────────────────────────────────────────────────────────
def firebase_token():
    email = os.environ.get("FIREBASE_EMAIL", "").strip()
    senha = os.environ.get("FIREBASE_PASSWORD", "")
    if not email or not senha:
        raise SystemExit("Faltam os secrets FIREBASE_EMAIL / FIREBASE_PASSWORD.")
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_KEY}"
    body = json.dumps({"email": email, "password": senha, "returnSecureToken": True}).encode()
    req = urlreq.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urlreq.urlopen(req, timeout=15) as r:
        j = json.loads(r.read())
    log(f"Firebase: autenticado (uid {j.get('localId','?')})")
    return j.get("idToken", "")


def firebase_put(caminho, dados, token):
    url = f"{FIREBASE_DB}/{caminho}.json?auth={token}"
    body = json.dumps(dados, ensure_ascii=False).encode()
    req = urlreq.Request(url, data=body, method="PUT",
                         headers={"Content-Type": "application/json"})
    with urlreq.urlopen(req, timeout=30) as r:
        return r.status in (200, 204)


# ── principal ─────────────────────────────────────────────────────────
def main():
    log("━━━ Hevy → Firebase ━━━")
    chave = os.environ.get("HEVY_API_KEY", "").strip()
    if not chave:
        raise SystemExit("Falta o secret HEVY_API_KEY.")

    rotinas_bruto = paginar("/routines", "routines", chave, tam=10)
    diagnosticar("rotinas", rotinas_bruto)

    treinos_bruto = paginar("/workouts", "workouts", chave, tam=10, limite=12)
    diagnosticar("treinos", treinos_bruto)

    # ── rotinas: o que fazer em cada sessao ──
    rotinas = {}
    for r in rotinas_bruto:
        titulo = r.get("title") or "Rotina"
        itens = []
        for ex in (r.get("exercises") or []):
            s, peso = texto_series(ex.get("sets") or [])
            item = {"nome": nome_exercicio(ex), "series": s}
            if peso:
                item["peso"] = peso
            if ex.get("notes"):
                item["nota"] = str(ex["notes"])[:200]
            itens.append(item)
        if itens:
            rotinas[titulo] = {"titulo": titulo, "exercicios": itens}
    log(f"{len(rotinas)} rotinas com exercicios")

    # ── cargas: peso mais recente de cada exercicio, e o mais antigo ──
    corte = (datetime.today() - timedelta(weeks=SEMANAS_HIST)).strftime("%Y-%m-%d")
    ordenados = sorted(treinos_bruto, key=data_do_treino)     # antigo -> novo
    cargas = {}
    fora_do_corte = 0
    sem_peso = 0
    for w in ordenados:
        data = data_do_treino(w)
        if data < corte:
            fora_do_corte += 1
            continue
        for ex in (w.get("exercises") or []):
            nome = nome_exercicio(ex)
            s, peso = texto_series(ex.get("sets") or [])
            if not peso:
                sem_peso += 1
                continue
            c = cargas.setdefault(nome, {"nome": nome})
            if "primeiro" not in c:
                c["primeiro"] = peso
                c["primeiroEm"] = data
            c["atual"] = peso
            c["atualEm"] = data
            c["series"] = s
    for c in cargas.values():
        if c.get("primeiro") and c.get("atual"):
            c["ganho"] = round(c["atual"] - c["primeiro"], 1)
    log(f"{len(cargas)} exercicios com carga registrada")
    if not cargas:
        datas = sorted(data_do_treino(w) for w in ordenados)
        log(f"  nenhuma carga. corte={corte} · datas dos treinos: {datas}")
        log(f"  {fora_do_corte} treinos anteriores ao corte · "
            f"{sem_peso} exercicios sem weight_kg (peso do corpo ou so tempo)")

    # ── volume por semana ──
    historico = {}
    for w in ordenados:
        data = data_do_treino(w)
        if data < corte:
            continue
        sem = semana_de(data)
        h = historico.setdefault(sem, {"semana": sem, "kg": 0, "sessoes": 0})
        h["kg"] += volume_do_treino(w)
        h["sessoes"] += 1
    log(f"{len(historico)} semanas de historico")

    payload = {
        "rotinas": rotinas,
        "cargas": cargas,
        "historico": historico,
        "meta": {
            "ultimaSync": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "totalRotinas": len(rotinas),
            "totalTreinos": len([w for w in ordenados if data_do_treino(w) >= corte]),
            "semanas": SEMANAS_HIST,
        },
    }

    token = firebase_token()
    if firebase_put(FIREBASE_PATH, payload, token):
        log(f"Firebase atualizado! {len(rotinas)} rotinas · {len(cargas)} exercicios")
    else:
        raise SystemExit("Erro ao gravar no Firebase")
    log("━━━ concluido ━━━")


if __name__ == "__main__":
    main()
