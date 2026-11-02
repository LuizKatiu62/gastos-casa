#!/usr/bin/env python3
"""
Academia do dia -> Garmin.

O app (treinos-v2) decide o dia e o tipo da academia — e ele quem evita
perna antes do longao e dos treinos de qualidade. Quando o Luiz ativa um
dia ("Vou a academia"), o app grava a lista final daquele dia (YMCA ou
Casa, com as trocas) em treinos_coach_v2/luiz/garmin_forca. Este robo le
esse no e poe NAQUELA DATA do calendario do Garmin um treino de forca
(exercicio, series, reps, carga em libras, descanso), pronto para o
relogio executar passo a passo.

REGRAS DE SEGURANCA ("jamais apagar o que o meu coach humano colocou no
garmin, jamais"):
  · so altera, desagenda ou apaga treino com a marca deste robo na
    descricao ("[forca:AAAA-MM-DD]" ou a antiga "[hevy:id]") E que esteja
    no registro treinos-v2/garmin-forca.json. Treino do coach nunca.
  · antes de qualquer alteracao, o treino e relido do Garmin e a marca
    conferida.
  · dia que ja passou nao e mexido: fica no Garmin como historico.
  · sem novidade, nem faz login no Garmin.

Modos (MODO): ensaio = so mostra · enviar = aplica (padrao no agendamento)
"""

import hashlib, json, os, re, sys, time
import urllib.request as urlreq
import urllib.error
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

GARMIN_EMAIL = "lcdsilva@hotmail.com"
FIREBASE_DB  = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
FIREBASE_KEY = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"
NO_PACOTE    = "treinos_coach_v2/luiz/garmin_forca"
FUSO         = ZoneInfo("America/Moncton")
AQUI         = os.path.dirname(os.path.abspath(__file__))
REGISTRO     = os.path.join(AQUI, "treinos-v2", "garmin-forca.json")
HEVY_JSON    = os.path.join(AQUI, "treinos-v2", "hevy.json")
RESUMO       = os.environ.get("GITHUB_STEP_SUMMARY", "")

MODO    = "enviar" if os.environ.get("MODO", "ensaio").strip().lower() == "enviar" else "ensaio"
UNIDADE = "kg" if os.environ.get("UNIDADE", "lb").strip().lower() == "kg" else "lb"

FORCA = {"sportTypeId": 5, "sportTypeKey": "strength_training"}
LIBRA = {"unitId": 9, "unitKey": "pound", "factor": 453.59237}
QUILO = {"unitId": 8, "unitKey": "kilogram", "factor": 1000.0}
KG_LB = 2.20462262185
DESCANSO_PADRAO = 90

# ──────────────────────────────────────────────────────────────────────
#  Exercicio do Hevy -> exercicio do Garmin (categoria, nome).
#  Os nomes do Garmin sao os do FIT SDK oficial. Com o nome certo o
#  relogio mostra o exercicio e a animacao; sem ele, o passo aparece
#  generico, com o nome do Hevy na descricao. Exercicio novo que nao
#  estiver aqui sobe do jeito generico e o ensaio avisa.
# ──────────────────────────────────────────────────────────────────────
MAPA = {
    "Back Extension (Hyperextension)":          ("CORE", "GHD_BACK_EXTENSIONS"),
    "Back Extension (Weighted Hyperextension)": ("CORE", "WEIGHTED_GHD_BACK_EXTENSIONS"),
    "Bench Press (Barbell)":                    ("BENCH_PRESS", "BARBELL_BENCH_PRESS"),
    "Bench Press (Dumbbell)":                   ("BENCH_PRESS", "DUMBBELL_BENCH_PRESS"),
    "Bicep Curl (Dumbbell)":                    ("CURL", "DUMBBELL_BICEPS_CURL"),
    "Bird Dog":                                 ("HIP_STABILITY", "QUADRUPED_WITH_LEG_LIFT"),
    "Bulgarian Split Squat (Dumbbell)":         ("LUNGE", "DUMBBELL_BULGARIAN_SPLIT_SQUAT"),
    "Calf Press (Machine)":                     ("CALF_RAISE", "WEIGHTED_STANDING_CALF_RAISE"),
    "Clamshell":                                ("HIP_RAISE", "CLAMS"),
    "Concentration Curl":                       ("CURL", "ONE_ARM_CONCENTRATION_CURL"),
    "Crunch (Machine)":                         ("CRUNCH", "CRUNCH"),
    "Dead Bug":                                 ("HIP_STABILITY", "DEAD_BUG"),
    "Decline Crunch":                           ("CRUNCH", "CRUNCH"),
    "Dumbbell Row":                             ("ROW", "DUMBBELL_ROW"),
    "Farmers Walk":                             ("CARRY", "FARMERS_WALK"),
    "Goblet Squat":                             ("SQUAT", "GOBLET_SQUAT"),
    "Hack Squat (Machine)":                     ("SQUAT", "BARBELL_HACK_SQUAT"),
    "Hamstring Stretch":                        ("WARM_UP", "STRETCH_HAMSTRING"),
    "Hanging Knee Raise":                       ("LEG_RAISE", "HANGING_KNEE_RAISE"),
    "Hip Abduction (Machine)":                  ("HIP_STABILITY", "STANDING_HIP_ABDUCTION"),
    "Hip Adduction (Machine)":                  ("HIP_STABILITY", "STANDING_ADDUCTION"),
    "Hip Thrust (Barbell)":                     ("HIP_RAISE", "BARBELL_HIP_THRUST_WITH_BENCH"),
    "Hip Thrust (Smith Machine)":               ("HIP_RAISE", "BARBELL_HIP_THRUST_WITH_BENCH"),
    "Inverted Row":                             ("ROW", "INVERTED_ROW"),
    "Jump Squat":                               ("PLYO", "JUMP_SQUAT"),
    "Kettlebell Swing":                         ("HIP_RAISE", "KETTLEBELL_SWING"),
    "Knee Raise Parallel Bars":                 ("LEG_RAISE", "HANGING_KNEE_RAISE"),
    "Lat Pulldown (Cable)":                     ("PULL_UP", "LAT_PULLDOWN"),
    "Lateral Band Walks":                       ("HIP_STABILITY", "LATERAL_WALKS_WITH_BAND_AT_ANKLES"),
    "Leg Press (Machine)":                      ("SQUAT", "LEG_PRESS"),
    "Plank":                                    ("PLANK", "PLANK"),
    "Plank Pushup":                             ("PUSH_UP", "PUSH_UP"),
    "Preacher Curl (Dumbbell)":                 ("CURL", "ONE_ARM_PREACHER_CURL"),
    "Pull Up (Band)":                           ("PULL_UP", "BANDED_PULL_UPS"),
    "Romanian Deadlift (Barbell)":              ("DEADLIFT", "ROMANIAN_DEADLIFT"),
    "Romanian Deadlift (Dumbbell)":             ("DEADLIFT", "DUMBBELL_STRAIGHT_LEG_DEADLIFT"),
    "Seated Cable Row - Bar Grip":              ("ROW", "SEATED_CABLE_ROW"),
    "Seated Calf Raise":                        ("CALF_RAISE", "SEATED_CALF_RAISE"),
    "Shoulder Press (Dumbbell)":                ("SHOULDER_PRESS", "DUMBBELL_SHOULDER_PRESS"),
    "Side Plank":                               ("PLANK", "SIDE_PLANK"),
    "Single Arm Tricep Extension (Dumbbell)":   ("TRICEPS_EXTENSION", "SINGLE_ARM_DUMBBELL_OVERHEAD_TRICEPS_EXTENSION"),
    "Single Leg Glute Bridge":                  ("HIP_RAISE", "SINGLE_LEG_HIP_RAISE"),
    "Single Leg Press (Machine)":               ("SQUAT", "LEG_PRESS"),
    "Single Leg Romanian Deadlift (Dumbbell)":  ("DEADLIFT", "SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL"),
    "Single Leg Standing Calf Raise":           ("CALF_RAISE", "SINGLE_LEG_STANDING_CALF_RAISE"),
    "Skullcrusher (Dumbbell)":                  ("TRICEPS_EXTENSION", "DUMBBELL_LYING_TRICEPS_EXTENSION"),
    "Squat (Barbell)":                          ("SQUAT", "BARBELL_BACK_SQUAT"),
    "Squat (Smith Machine)":                    ("SQUAT", "SQUAT"),
    "Standing Calf Raise":                      ("CALF_RAISE", "STANDING_CALF_RAISE"),
    "Standing Calf Raise (Barbell)":            ("CALF_RAISE", "STANDING_BARBELL_CALF_RAISE"),
    "Standing Calf Raise (Dumbbell)":           ("CALF_RAISE", "STANDING_DUMBBELL_CALF_RAISE"),
    "Standing Calf Raise (Machine)":            ("CALF_RAISE", "WEIGHTED_STANDING_CALF_RAISE"),
    "Step Up":                                  ("SQUAT", "STEP_UP"),
    "Straight Leg Raise":                       ("LEG_RAISE", "LYING_STRAIGHT_LEG_RAISE"),
    "Triceps Kickback (Dumbbell)":              ("TRICEPS_EXTENSION", "DUMBBELL_KICKBACK"),
    "Walking Lunge":                            ("LUNGE", "WALKING_LUNGE"),
    "Wall Sit":                                 ("SQUAT", "BODY_WEIGHT_WALL_SQUAT"),
}
AQUECIMENTO = {"warm up", "warm-up", "warmup"}


# ── utilidades ────────────────────────────────────────────────────────
_linhas = []
def log(msg):
    print(msg, flush=True)

def resumo(txt=""):
    _linhas.append(txt)

def gravar_resumo():
    if RESUMO and _linhas:
        with open(RESUMO, "a", encoding="utf-8") as f:
            f.write("\n".join(_linhas) + "\n")

def parar(msg):
    log("::error::" + msg)
    resumo("**PAROU:** " + msg)
    gravar_resumo()
    sys.exit(1)

def agora_utc():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def marca(data):
    return f"[forca:{data}]"

def tem_nossa_marca(w):
    return bool(re.search(r"\[(forca|hevy):[^\]]+\]", (w or {}).get("description") or ""))


# ── Firebase (so leitura) ─────────────────────────────────────────────
def firebase_token():
    email = os.environ.get("FIREBASE_EMAIL", "").strip()
    senha = os.environ.get("FIREBASE_PASSWORD", "")
    if not email or not senha:
        parar("Faltam os secrets FIREBASE_EMAIL / FIREBASE_PASSWORD.")
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_KEY}"
    body = json.dumps({"email": email, "password": senha, "returnSecureToken": True}).encode()
    req = urlreq.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urlreq.urlopen(req, timeout=15) as r:
            return json.loads(r.read()).get("idToken", "")
    except Exception as e:
        parar(f"Login no Firebase falhou: {e}")

def firebase_get(path, token):
    try:
        with urlreq.urlopen(f"{FIREBASE_DB}/{path}.json?auth={token}", timeout=20) as r:
            return json.loads(r.read().decode() or "null")
    except Exception as e:
        parar(f"Leitura do Firebase falhou em {path}: {e}")


# ── traducao app -> Garmin ────────────────────────────────────────────
def cargas_do_hevy():
    try:
        with open(HEVY_JSON, encoding="utf-8") as f:
            return json.load(f).get("cargas") or {}
    except Exception:
        return {}

def peso(kg):
    if not kg or kg <= 0:
        return None
    if UNIDADE == "lb":
        return round(kg * KG_LB * 2) / 2, LIBRA      # meia libra: 20 lb continua 20
    return round(kg * 4) / 4, QUILO

def ler_series(txt):
    """'4×6' · '3×8 cada' · '3×6-8' · '3×40s' · '3×30 m' · '3 séries'.
    Devolve (quantas, condicao, chave, valor) — valor None = botao de volta."""
    t = str(txt or "")
    m = re.search(r"(\d+)\s*[x×]\s*(\d+)(?:\s*[-–a]\s*\d+)?\s*(min|seg|s|m)?\b", t, re.I)
    if m:
        n, v, un = int(m.group(1)), int(m.group(2)), (m.group(3) or "").lower()
        n = max(1, min(n, 10))
        if un == "min":
            return n, 2, "time", v * 60
        if un in ("s", "seg"):
            return n, 2, "time", v
        if un == "m":
            return n, 3, "distance", v
        return n, 10, "reps", v
    m = re.search(r"(\d+)\s*s[ée]ries?", t, re.I)
    n = max(1, min(int(m.group(1)), 10)) if m else 1
    return n, 1, "lap.button", None

def descanso_de(nota):
    return 150 if re.search(r"2 (a 3 )?min", nota or "") else DESCANSO_PADRAO

class Montador:
    def __init__(self):
        self.ordem = 0
        self.sem_mapa = set()

    def _n(self):
        self.ordem += 1
        return self.ordem

    def passo(self, tipo, cond, chave, valor, desc):
        p = {"type": "ExecutableStepDTO", "stepOrder": self._n(),
             "stepType": {"stepTypeId": tipo[0], "stepTypeKey": tipo[1]},
             "endCondition": {"conditionTypeId": cond, "conditionTypeKey": chave},
             "description": (desc or "")[:250]}
        if valor is not None:
            p["endConditionValue"] = valor
        if chave == "distance":
            p["preferredEndConditionUnit"] = {"unitId": 1, "unitKey": "meter", "factor": 100.0}
        return p

    def descanso(self, seg):
        return self.passo((5, "rest"), 2, "time", int(seg), "")

    def exercicio(self, it, cargas):
        nome = it.get("nome") or ""
        nota = (it.get("nota") or "").strip()
        n, cond, chave, valor = ler_series(it.get("series"))
        if re.search(r"\bcada\b", it.get("series") or "", re.I) and "cada" not in nota.lower():
            nota = ("Cada lado. " + nota).strip()
        serie = self.passo((3, "interval"), cond, chave, valor,
                           nome + (" · " + nota if nota else ""))
        par = MAPA.get(nome)
        if par:
            serie["category"], serie["exerciseName"] = par
        else:
            self.sem_mapa.add(nome)
        kg = float(it.get("peso") or 0) or float((cargas.get(nome) or {}).get("atual") or 0)
        pw = peso(kg)
        if pw:
            serie["weightValue"], serie["weightUnit"] = pw
        rest = self.descanso(descanso_de(nota))
        if n == 1:
            return [serie, rest], (n, valor, chave, pw)
        grupo = {"type": "RepeatGroupDTO", "stepOrder": None,
                 "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat"},
                 "numberOfIterations": n, "smartRepeat": False,
                 "endCondition": {"conditionTypeId": 7, "conditionTypeKey": "iterations"},
                 "endConditionValue": n, "skipLastRestStep": False,
                 "workoutSteps": [serie, rest]}
        return [grupo], (n, valor, chave, pw)

def renumerar(passos, c=None):
    """O Garmin numera os passos em sequencia, contando os de dentro
    dos blocos de repeticao."""
    c = c if c is not None else [0]
    for p in passos:
        c[0] += 1
        p["stepOrder"] = c[0]
        if p.get("workoutSteps"):
            renumerar(p["workoutSteps"], c)

def nome_do_treino(data, dia):
    d = f"{data[8:10]}/{data[5:7]}"
    nome = re.sub(r"^\s*for[cç]a\s*[-–]\s*", "", dia.get("nome") or "Academia", flags=re.I)
    local = "Casa" if dia.get("local") == "casa" else "YMCA"
    if not re.search(r"\b(ymca|casa)\b", nome, re.I):
        nome += " · " + local
    return f"Força {d} · {nome}"[:80]

def montar(data, dia, cargas):
    m = Montador()
    passos, tabela = [], []
    aq = (dia.get("aquecimento") or "").strip()
    if aq:
        passos.append(m.passo((1, "warmup"), 1, "lap.button", None, "Aquecimento: " + aq))
    for it in dia.get("itens") or []:
        ps, info = m.exercicio(it, cargas)
        passos.extend(ps)
        tabela.append((it, info))
    renumerar(passos)
    local = "Casa" if dia.get("local") == "casa" else "YMCA"
    dto = {
        "sportType": FORCA,
        "workoutName": nome_do_treino(data, dia),
        "description": f"{marca(data)} {local} · criado pelo app treinos-v2 a partir do dia que você ativou."[:500],
        "workoutSegments": [{"segmentOrder": 1, "sportType": FORCA, "workoutSteps": passos}],
    }
    return dto, m.sem_mapa, tabela

def sem_exercicio(dto):
    d = json.loads(json.dumps(dto))
    def limpa(passos):
        for p in passos:
            p.pop("category", None); p.pop("exerciseName", None)
            limpa(p.get("workoutSteps") or [])
    for seg in d["workoutSegments"]:
        limpa(seg["workoutSteps"])
    return d

def impressao(dto):
    return hashlib.sha1(json.dumps(dto, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]

def linhas(tabela):
    out = ["| Exercício | Séries | Carga | No Garmin |", "|---|---|---|---|"]
    for it, (n, valor, chave, pw) in tabela:
        alvo = {"reps": f"{valor} reps", "time": f"{valor} s", "distance": f"{valor} m"}.get(chave, "botão de volta")
        carga = f"{pw[0]:g} {UNIDADE}" if pw else "—"
        par = MAPA.get(it.get("nome") or "")
        out.append(f"| {it.get('nome')} | {n} × {alvo} | {carga} | "
                   f"{(par[0] + ' · ' + par[1]) if par else '⚠️ genérico'} |")
    return out


# ── Garmin (so os treinos com a nossa marca) ──────────────────────────
def _resposta(r):
    if r is None:
        return {}
    if hasattr(r, "json"):
        try:
            return r.json()
        except Exception:
            return {}
    return r if isinstance(r, (dict, list)) else {}

def chamar(g, metodo, path, payload=None):
    """Mesmo cuidado do sync-garmin-auto.py: o garth muda de assinatura
    entre versoes, entao tento as formas conhecidas e so troco de forma
    em erro de ASSINATURA (TypeError). Erro do Garmin sobe na hora."""
    assert metodo in ("GET", "POST", "PUT", "DELETE")
    kw = {"json": payload} if payload is not None else {}
    formas = []
    fn = getattr(g, metodo.lower(), None)
    if callable(fn):
        formas.append(lambda: fn("connectapi", path, api=True, **kw))
    if hasattr(g, "request"):
        formas.append(lambda: g.request(metodo, "connectapi", path, api=True, **kw))
    if metodo == "GET" and hasattr(g, "connectapi"):
        formas.append(lambda: g.connectapi(path))
    erros = []
    for f in formas:
        try:
            return _resposta(f())
        except TypeError as e:
            erros.append(str(e))
    raise RuntimeError(f"nenhuma assinatura serviu para {metodo}: {' | '.join(erros)}")

def login_garmin():
    try:
        from garminconnect import Garmin
    except ImportError:
        parar("Falta o pacote garminconnect (pip install garminconnect).")
    senha = os.environ.get("GARMIN_PASSWORD", "")
    if not senha:
        parar("Falta o secret GARMIN_PASSWORD.")
    try:
        api = Garmin(GARMIN_EMAIL, senha)
        api.login()
    except Exception as e:
        parar(f"Login no Garmin falhou: {e}")
    for nome in ("garth", "client"):
        g = getattr(api, nome, None)
        if g is not None and hasattr(g, "connectapi"):
            log(f"Garmin: login OK (via api.{nome})")
            return g
    parar("Nao achei o cliente garth dentro do garminconnect.")

def ler_nosso(g, wid):
    """O treino, so se tiver a NOSSA marca. None = nao existe / nao e nosso."""
    if not wid:
        return None
    try:
        w = chamar(g, "GET", f"/workout-service/workout/{wid}")
    except Exception:
        return None
    if not w or not w.get("workoutId") or not tem_nossa_marca(w):
        return None
    return w

def apagar_nosso(g, info):
    """Desagenda e apaga — SO treino com a nossa marca, conferida agora."""
    w = ler_nosso(g, info.get("workoutId"))
    if info.get("sched") and (w or not info.get("workoutId")):
        try:
            chamar(g, "DELETE", f"/workout-service/schedule/{info['sched']}")
        except Exception as e:
            log(f"Garmin: nao desagendei {info['sched']}: {e}")
    if w:
        chamar(g, "DELETE", f"/workout-service/workout/{w['workoutId']}")
        return True
    return False

def agendar(g, wid, data):
    ag = chamar(g, "POST", f"/workout-service/schedule/{wid}", {"date": data})
    return (ag or {}).get("workoutScheduleId") or (ag or {}).get("id")

def salvar_registro(reg):
    reg["atualizadoEm"] = agora_utc()
    reg["_leiame"] = ("Treinos de forca que o sync-hevy-garmin.py pos no Garmin, por data. "
                      "So o que esta aqui (e tem a marca [forca:data] na descricao) pode "
                      "ser alterado ou removido pelo robo. Treino do coach nunca.")
    os.makedirs(os.path.dirname(REGISTRO), exist_ok=True)
    with open(REGISTRO, "w", encoding="utf-8") as f:
        json.dump(reg, f, ensure_ascii=False, indent=1, sort_keys=True)


# ── principal ─────────────────────────────────────────────────────────
def main():
    hoje = datetime.now(FUSO).date().isoformat()
    resumo(f"## Academia do dia → Garmin — modo {MODO.upper()} · hoje {hoje} · cargas em {UNIDADE}")
    resumo("")

    token = firebase_token()
    pacote = firebase_get(NO_PACOTE, token) or {}
    dias = {k: v for k, v in (pacote.get("dias") or {}).items()
            if re.match(r"^\d{4}-\d{2}-\d{2}$", k) and k >= hoje and isinstance(v, dict)}
    log(f"App: {len(dias)} dia(s) de academia ativado(s) de hoje em diante"
        + (f" (pacote de {pacote.get('gerado', '?')[:16]})" if pacote else " (o app ainda nao publicou)"))

    try:
        with open(REGISTRO, encoding="utf-8") as f:
            reg = json.load(f)
    except Exception:
        reg = {}
    antigos = reg.pop("treinos", None) or {}          # 1a versao: biblioteca inteira
    reg.setdefault("dias", {})

    cargas = cargas_do_hevy()
    planos, genericos = {}, set()
    for data in sorted(dias):
        dto, sem, tabela = montar(data, dias[data], cargas)
        genericos |= sem
        imp = impressao(dto)
        ja = reg["dias"].get(data) or {}
        mudou = ja.get("impressao") != imp or not ja.get("workoutId")
        planos[data] = (dto, imp, mudou)
        resumo(f"### {dto['workoutName']}" + ("" if mudou else " — já está no Garmin, sem mudança"))
        resumo("")
        resumo("\n".join(linhas(tabela)))
        resumo("")

    sair = [d for d in reg["dias"] if d >= hoje and d not in dias]   # desativados
    passados = [d for d in reg["dias"] if d < hoje]
    for d in passados:                                             # ficam no Garmin como historico
        reg["dias"].pop(d, None)
    for d in sair:
        resumo(f"- 🗑️ {d}: você desativou a academia — sai do Garmin o treino deste robô")

    if genericos:
        msg = "Sem par no Garmin (vão genéricos, com o nome na descrição): " + ", ".join(sorted(genericos))
        log("::warning::" + msg); resumo("> ⚠️ " + msg); resumo("")

    pendentes = [d for d, p in planos.items() if p[2]]
    if MODO == "ensaio":
        msg = (f"ENSAIO: {len(pendentes)} dia(s) a criar/atualizar, {len(sair)} a remover, "
               f"{len(antigos)} treino(s) antigos da biblioteca a limpar. Nada foi enviado.")
        log(msg); resumo("**" + msg + "**"); gravar_resumo()
        return
    if not pendentes and not sair and not antigos:
        if passados:
            salvar_registro(reg)
        msg = "Nada mudou no app. Nem entrei no Garmin."
        log(msg); resumo("**" + msg + "**"); gravar_resumo()
        return

    g = login_garmin()
    feitos = erros = 0

    # 1) a 1a versao tinha posto TODAS as rotinas na biblioteca; saem
    for rid, info in list(antigos.items()):
        try:
            ok = apagar_nosso(g, {"workoutId": info.get("workoutId")})
            log(f"Garmin: biblioteca antiga — {info.get('titulo')}: {'removido' if ok else 'ja nao estava'}")
        except Exception as e:
            log(f"::warning::nao consegui remover {info.get('titulo')}: {e}")
            reg.setdefault("treinos", {})[rid] = info          # tenta de novo na proxima
    if antigos:
        resumo(f"- 🧹 limpei os {len(antigos)} treinos que a primeira versão tinha posto na biblioteca")
        salvar_registro(reg)

    # 2) dias desativados
    for d in sair:
        try:
            apagar_nosso(g, reg["dias"][d])
            reg["dias"].pop(d, None)
            log(f"Garmin: {d} desativado — treino do robo removido")
            salvar_registro(reg)
        except Exception as e:
            erros += 1
            log(f"::error::{d}: nao consegui remover — {e}")

    # 3) dias novos ou mudados
    for data in pendentes:
        dto, imp, _ = planos[data]
        ja = reg["dias"].get(data) or {}
        atual = ler_nosso(g, ja.get("workoutId"))
        aviso = ""
        for tentativa, corpo in enumerate((dto, sem_exercicio(dto))):
            try:
                if atual:
                    novo = dict(atual); novo.update(corpo); novo["workoutId"] = atual["workoutId"]
                    chamar(g, "PUT", f"/workout-service/workout/{atual['workoutId']}", novo)
                    wid, sched, feito = atual["workoutId"], ja.get("sched"), "atualizado"
                    if not sched:
                        sched = agendar(g, wid, data)
                else:
                    resp = chamar(g, "POST", "/workout-service/workout", corpo)
                    wid = (resp or {}).get("workoutId")
                    if not wid:
                        raise RuntimeError("o Garmin respondeu sem workoutId")
                    sched = agendar(g, wid, data)
                    feito = "criado e agendado"
                reg["dias"][data] = {"workoutId": wid, "sched": sched, "impressao": imp,
                                     "nome": dto["workoutName"], "enviadoEm": agora_utc(),
                                     "generico": tentativa == 1}
                salvar_registro(reg)
                feitos += 1
                log(f"Garmin: {dto['workoutName']} -> {feito} em {data}{aviso}")
                resumo(f"- ✅ **{dto['workoutName']}** — {feito}{aviso}")
                break
            except Exception as e:
                if tentativa == 0 and not atual:
                    log(f"::warning::{data}: o Garmin recusou com os exercicios ({e}); tento sem eles")
                    aviso = " (sem os nomes dos exercícios: o Garmin recusou algum)"
                    continue
                erros += 1
                log(f"::error::{data}: FALHOU — {e}")
                resumo(f"- ❌ **{dto['workoutName']}** — falhou: {str(e)[:200]}")
                break

    salvar_registro(reg)
    fim = f"PRONTO: {feitos} dia(s) no Garmin, {len(sair)} removido(s), {erros} com erro. Treino do coach: intocado."
    log(fim); resumo(""); resumo("**" + fim + "**"); gravar_resumo()
    if erros:
        sys.exit(1)


if __name__ == "__main__":
    main()
