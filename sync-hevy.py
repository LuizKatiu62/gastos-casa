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
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
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
# A aba GYM do app soma treinos, tempo e peso do Intervalo escolhido,
# que vai ate 180 dias. As sessoes entao vem de 26 semanas; cargas e
# historico continuam em 12 (a progressao compara com 12 semanas).
SEMANAS_SESSOES = 26
# O Hevy devolve o horario em UTC e o robo roda em UTC. Sem converter,
# um treino depois das 21h (horario do Atlantico) ganhava a data do dia
# seguinte e o app dizia que o dia do treino ficou sem registro.
FUSO = ZoneInfo("America/Moncton")


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# ── Hevy ──────────────────────────────────────────────────────────────
def hevy_get(caminho, chave, fim_se_404=False):
    """GET no Hevy. Com fim_se_404, uma pagina que nao existe devolve None
    em vez de parar o robo (ver paginar)."""
    req = urlreq.Request(HEVY_BASE + caminho, headers={"api-key": chave})
    try:
        with urlreq.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise SystemExit("Chave recusada pelo Hevy (401). Confira HEVY_API_KEY.")
        if e.code == 404 and fim_se_404:
            return None
        raise SystemExit(f"GET {caminho} devolveu {e.code}")


def paginar(rota, campo, chave, tam=10, limite=40):
    """Junta as paginas. O Hevy pagina rotinas e treinos separadamente.

    16/09/2026: com exatamente 10 treinos, a pagina 1 vinha cheia, o robo
    pedia a pagina 2, o Hevy respondia 404 (pagina que nao existe) e o
    robo parava ANTES de gravar — o treino do dia nunca chegava ao app.
    Agora: para quando chega em page_count, e 404 depois da pagina 1 e
    simplesmente o fim da lista. Na pagina 1, 404 continua sendo erro.
    """
    out = []
    for p in range(1, limite + 1):
        j = hevy_get(f"{rota}?page={p}&pageSize={tam}", chave, fim_se_404=(p > 1))
        if j is None:
            break
        lote = j.get(campo) or []
        out.extend(lote)
        total_paginas = j.get("page_count")
        if len(lote) < tam:
            break
        if isinstance(total_paginas, int) and p >= total_paginas:
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


def instante(bruto):
    """ISO do Hevy ("...Z" ou "+00:00") -> datetime no fuso local, ou None."""
    try:
        s = str(bruto or "").strip().replace("Z", "+00:00")
        d = datetime.fromisoformat(s)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(FUSO)
    except Exception:
        return None


def data_do_treino(w):
    bruto = w.get("start_time") or w.get("created_at") or ""
    d = instante(bruto)
    return d.strftime("%Y-%m-%d") if d else str(bruto)[:10]


def hora_do_treino(w):
    d = instante(w.get("start_time") or w.get("created_at"))
    return d.strftime("%H:%M") if d else ""


def serie_feita(s):
    """Serie executada: tem repeticoes, tempo ou distancia. Serie vazia
    (sem nada preenchido) nao conta como feita."""
    return bool((s.get("reps") or 0) > 0 or (s.get("duration_seconds") or 0) > 0
                or (s.get("distance_meters") or 0) > 0)


def exercicios_feitos(w):
    """So o que foi executado no treino salvo. Exercicio apagado no Hevy
    nao vem na API; exercicio sem nenhuma serie preenchida fica de fora.
    Pedido do Luiz, 16/09/2026: o app nao pode dar como feito o que ele
    nao fez (ex.: Standing Calf Raise apagado do treino)."""
    out = []
    for ex in (w.get("exercises") or []):
        sets = [s for s in (ex.get("sets") or []) if serie_feita(s)]
        if not sets:
            continue
        txt, peso = texto_series(sets)
        vol = sum(float(s.get("weight_kg") or 0) * int(s.get("reps") or 0) for s in sets)
        item = {"nome": nome_exercicio(ex), "series": txt}
        if peso:
            item["peso"] = peso
        if vol:
            item["kg"] = round(vol)
        out.append(item)
    return out


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
            # so series executadas: peso sugerido em serie nao feita
            # nao pode virar "carga atual"
            s, peso = texto_series([x for x in (ex.get("sets") or []) if serie_feita(x)])
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

    # ── sessoes: a data de cada treino feito ──
    # O Garmin nao sabe que voce treinou: o Hevy nao manda nada para la.
    # Sem esta lista, a aderencia do app conta zero mesmo voce treinando
    # todas as sessoes, e o dia ganha aquele alerta de nao cumprido.
    corte_sessoes = (datetime.today() - timedelta(weeks=SEMANAS_SESSOES)).strftime("%Y-%m-%d")
    sessoes = []
    for w in ordenados:
        data = data_do_treino(w)
        if data < corte_sessoes:
            continue
        dur = 0
        a1, a2 = instante(w.get("start_time")), instante(w.get("end_time"))
        if a1 and a2:
            dur = max(0, int((a2 - a1).total_seconds() // 60))
        item = {"data": data, "titulo": w.get("title") or "Treino"}
        if hora_do_treino(w):
            item["hora"] = hora_do_treino(w)
        if dur:
            item["min"] = dur
        v = volume_do_treino(w)
        if v:
            item["kg"] = v
        item["exercicios"] = exercicios_feitos(w)
        sessoes.append(item)
    sessoes.sort(key=lambda x: x["data"])
    log(f"{len(sessoes)} sessoes feitas no periodo")

    payload = {
        "rotinas": rotinas,
        "cargas": cargas,
        "historico": historico,
        "sessoes": sessoes,
        "meta": {
            "ultimaSync": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "totalRotinas": len(rotinas),
            "totalTreinos": len([w for w in ordenados if data_do_treino(w) >= corte]),
            "semanas": SEMANAS_HIST,
            "semanasSessoes": SEMANAS_SESSOES,
        },
    }

    # ── copia para o repositorio ──
    # O Firebase e para o app ler. Este arquivo e para PESSOAS lerem: eu,
    # voce, ou qualquer um que precise ver o que esta montado no Hevy sem
    # abrir o app nem copiar tela. Mesmo caminho que o sync do Garmin usa
    # para o semana.json.
    try:
        with open("treinos-v2/hevy.json", "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=1)
        log("treinos-v2/hevy.json escrito")
    except Exception as e:
        log(f"AVISO: nao consegui escrever hevy.json: {e}")

    token = firebase_token()
    if firebase_put(FIREBASE_PATH, payload, token):
        log(f"Firebase atualizado! {len(rotinas)} rotinas · {len(cargas)} exercicios")
    else:
        raise SystemExit("Erro ao gravar no Firebase")
    log("━━━ concluido ━━━")


if __name__ == "__main__":
    main()
