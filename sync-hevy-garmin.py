#!/usr/bin/env python3
"""
Hevy -> Garmin: cada rotina de forca do Hevy vira um treino de forca
(strength training) na biblioteca de treinos do Garmin Connect, com
exercicio, series, repeticoes, carga em libras e descanso, pronto para
mandar para o relogio e executar passo a passo.

REGRAS DE SEGURANCA (a mesma regra do Luiz para o Garmin:
"jamais apagar o que o meu coach humano colocou no garmin, jamais"):

  · NUNCA mexe no calendario. Nao agenda, nao desagenda.
  · NUNCA apaga nada. Nenhum DELETE neste arquivo.
  · So ALTERA um treino do Garmin se ele tiver a marca deste robo na
    descricao ("[hevy:<id da rotina>]"). Treino sem a marca — do coach,
    do Luiz, de qualquer um — nunca e tocado.
  · Rotina que nao mudou desde o ultimo envio nao e reenviada: o robo
    nem faz login no Garmin quando nao ha novidade.

Modos (variavel MODO):
  ensaio  -> le o Hevy e mostra como cada rotina vai ficar no Garmin.
             Nao faz login no Garmin, nao cria nada.
  enviar  -> cria as novas e atualiza as que mudaram.

Quais rotinas vao: todas, menos as da Fit4Less (academia antiga).
Para mudar, ponha uma expressao regular em FILTRO (ex.: "YMCA").
"""

import hashlib, json, os, re, sys, time
import urllib.request as urlreq
import urllib.error
from datetime import datetime, timezone

GARMIN_EMAIL = "lcdsilva@hotmail.com"
HEVY_BASE    = "https://api.hevyapp.com/v1"
AQUI         = os.path.dirname(os.path.abspath(__file__))
REGISTRO     = os.path.join(AQUI, "treinos-v2", "garmin-forca.json")
RESUMO       = os.environ.get("GITHUB_STEP_SUMMARY", "")

MODO     = "enviar" if os.environ.get("MODO", "ensaio").strip().lower() == "enviar" else "ensaio"
FILTRO   = os.environ.get("FILTRO", "").strip()
EXCLUIR  = os.environ.get("EXCLUIR", r"fit\s*4\s*less").strip()
UNIDADE  = "kg" if os.environ.get("UNIDADE", "lb").strip().lower() == "kg" else "lb"

FORCA = {"sportTypeId": 5, "sportTypeKey": "strength_training"}
LIBRA = {"unitId": 9, "unitKey": "pound", "factor": 453.59237}
QUILO = {"unitId": 8, "unitKey": "kilogram", "factor": 1000.0}
KG_LB = 2.20462262185

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

def marca(rid):
    return f"[hevy:{rid}]"


# ── Hevy (so leitura) ─────────────────────────────────────────────────
def hevy_get(caminho, chave):
    req = urlreq.Request(HEVY_BASE + caminho, headers={"api-key": chave, "accept": "application/json"})
    for tentativa in range(3):
        try:
            with urlreq.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode() or "{}")
        except urllib.error.HTTPError as e:
            if e.code == 401:
                parar("Chave recusada pelo Hevy (401). Confira o secret HEVY_API_KEY.")
            if e.code == 404:
                return {}
            if e.code in (429, 500, 502, 503) and tentativa < 2:
                time.sleep(3 * (tentativa + 1)); continue
            parar(f"Hevy GET {caminho} devolveu {e.code}")
        except Exception as e:
            if tentativa < 2:
                time.sleep(3); continue
            parar(f"Hevy GET {caminho} falhou: {e}")

def rotinas_do_hevy(chave):
    out = []
    for p in range(1, 41):
        j = hevy_get(f"/routines?page={p}&pageSize=10", chave)
        lote = j.get("routines") or []
        out.extend(lote)
        if len(lote) < 10 or (j.get("page_count") and p >= j["page_count"]):
            break
    return out


# ── traducao Hevy -> Garmin ───────────────────────────────────────────
def peso(kg):
    if not kg:
        return None
    if UNIDADE == "lb":
        return round(kg * KG_LB * 2) / 2, LIBRA      # meia libra: 20 lb continua 20
    return round(kg * 4) / 4, QUILO

def fim_da_serie(s):
    """(conditionTypeId, key, valor, texto) da serie do Hevy."""
    reps = s.get("reps")
    faixa = s.get("rep_range") or {}
    if not reps and faixa.get("start"):
        reps = faixa.get("start")
    if reps:
        return 10, "reps", int(reps), f"{int(reps)} reps"
    if s.get("duration_seconds"):
        v = int(s["duration_seconds"]);  return 2, "time", v, f"{v} s"
    if s.get("distance_meters"):
        v = int(s["distance_meters"]);   return 3, "distance", v, f"{v} m"
    return 1, "lap.button", None, "aperte a volta"

def assinatura(s):
    """Duas series iguais viram um bloco 'repita N vezes'."""
    return (s.get("type") or "normal", s.get("weight_kg"), s.get("reps"),
            json.dumps(s.get("rep_range"), sort_keys=True), s.get("duration_seconds"),
            s.get("distance_meters"))

class Montador:
    def __init__(self):
        self.ordem = 0
        self.sem_mapa = set()

    def _n(self):
        self.ordem += 1
        return self.ordem

    def serie(self, ex, s, nota):
        nome = ex.get("title") or ""
        cid, ckey, valor, _ = fim_da_serie(s)
        tipo = (3, "interval")
        if (s.get("type") or "") == "warmup" or nome.strip().lower() in AQUECIMENTO:
            tipo = (1, "warmup")
        passo = {
            "type": "ExecutableStepDTO",
            "stepOrder": self._n(),
            "stepType": {"stepTypeId": tipo[0], "stepTypeKey": tipo[1]},
            "endCondition": {"conditionTypeId": cid, "conditionTypeKey": ckey},
            "description": (nome + (" · " + nota if nota else ""))[:250],
        }
        if valor is not None:
            passo["endConditionValue"] = valor
        if ckey == "distance":
            passo["preferredEndConditionUnit"] = {"unitId": 1, "unitKey": "meter", "factor": 100.0}
        par = MAPA.get(nome)
        if par:
            passo["category"], passo["exerciseName"] = par
        elif nome.strip().lower() not in AQUECIMENTO:
            self.sem_mapa.add(nome)
        p = peso(s.get("weight_kg"))
        if p:
            passo["weightValue"], passo["weightUnit"] = p[0], p[1]
        return passo

    def descanso(self, seg):
        d = {"type": "ExecutableStepDTO", "stepOrder": self._n(),
             "stepType": {"stepTypeId": 5, "stepTypeKey": "rest"}}
        if seg and int(seg) > 0:
            d["endCondition"] = {"conditionTypeId": 2, "conditionTypeKey": "time"}
            d["endConditionValue"] = int(seg)
        else:
            d["endCondition"] = {"conditionTypeId": 1, "conditionTypeKey": "lap.button"}
        return d

    def exercicio(self, ex):
        """Uma lista de passos para um exercicio: blocos 'repita N' para
        series iguais seguidas, cada serie seguida do descanso."""
        nota = (ex.get("notes") or "").strip()
        rest = ex.get("rest_seconds")
        sets = ex.get("sets") or [{"type": "normal"}]
        grupos = []
        for s in sets:
            if grupos and assinatura(grupos[-1][0]) == assinatura(s):
                grupos[-1][1] += 1
            else:
                grupos.append([s, 1])
        passos = []
        for s, n in grupos:
            if n == 1:
                passos.append(self.serie(ex, s, nota))
                passos.append(self.descanso(rest))
            else:
                grupo = {"type": "RepeatGroupDTO", "stepOrder": self._n(),
                         "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat"},
                         "numberOfIterations": n, "smartRepeat": False,
                         "endCondition": {"conditionTypeId": 7, "conditionTypeKey": "iterations"},
                         "endConditionValue": n, "skipLastRestStep": False}
                grupo["workoutSteps"] = [self.serie(ex, s, nota), self.descanso(rest)]
                passos.append(grupo)
        return passos

def montar(rotina):
    m = Montador()
    passos = []
    for ex in sorted(rotina.get("exercises") or [], key=lambda e: e.get("index", 0)):
        passos.extend(m.exercicio(ex))
    nota = re.sub(r"\s+", " ", (rotina.get("notes") or "")).strip()
    desc = (marca(rotina["id"]) + " Do Hevy. " + nota)[:500]
    dto = {
        "sportType": FORCA,
        "workoutName": (rotina.get("title") or "Forca")[:80],
        "description": desc,
        "workoutSegments": [{"segmentOrder": 1, "sportType": FORCA, "workoutSteps": passos}],
    }
    return dto, m.sem_mapa

def sem_exercicio(dto):
    """Copia do treino sem categoria/exercicio — reserva para quando o
    Garmin recusar algum nome do mapa."""
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

def linhas_do_treino(rotina, dto):
    """Tabela legivel para o resumo do GitHub."""
    out = ["| Exercício | Séries | Carga | Descanso | No Garmin |", "|---|---|---|---|---|"]
    for ex in sorted(rotina.get("exercises") or [], key=lambda e: e.get("index", 0)):
        sets = ex.get("sets") or []
        txt = ", ".join(fim_da_serie(s)[3] for s in sets) or "—"
        cargas = sorted({peso(s.get("weight_kg"))[0] for s in sets if peso(s.get("weight_kg"))})
        carga = " / ".join(f"{c:g} {UNIDADE}" for c in cargas) or "—"
        par = MAPA.get(ex.get("title") or "")
        g = f"{par[0]} · {par[1]}" if par else "⚠️ genérico (sem animação)"
        rest = ex.get("rest_seconds")
        out.append(f"| {ex.get('title')} | {len(sets)}: {txt} | {carga} | {rest or '—'} s | {g} |")
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
    assert metodo in ("GET", "POST", "PUT"), "este robo nunca apaga nada"
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

def nossos_no_garmin(g):
    """{id da rotina: workoutId} dos treinos que tem a NOSSA marca."""
    achados = {}
    try:
        lista = chamar(g, "GET", "/workout-service/workouts?start=0&limit=999&myWorkoutsOnly=true")
    except Exception as e:
        log(f"Garmin: nao consegui listar os treinos ({e}); sigo so com o registro")
        return achados
    for w in (lista if isinstance(lista, list) else []):
        m = re.search(r"\[hevy:([^\]]+)\]", w.get("description") or "")
        if m and w.get("workoutId"):
            achados[m.group(1)] = w["workoutId"]
    return achados

def eh_nosso(g, wid, rid):
    """Confere a marca no proprio treino antes de qualquer alteracao."""
    try:
        w = chamar(g, "GET", f"/workout-service/workout/{wid}")
    except Exception:
        return None
    if not w or not w.get("workoutId"):
        return None
    return w if marca(rid) in (w.get("description") or "") else False


def salvar_registro(reg):
    """Gravado depois de CADA envio: se o robo cair no meio, o proximo
    nao cria duplicata do que ja subiu."""
    reg["atualizadoEm"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    reg["_leiame"] = ("Rotinas do Hevy enviadas ao Garmin pelo sync-hevy-garmin.py. "
                      "So os treinos listados aqui (e com a marca [hevy:id] na descricao) "
                      "podem ser alterados pelo robo. Nada e apagado.")
    os.makedirs(os.path.dirname(REGISTRO), exist_ok=True)
    with open(REGISTRO, "w", encoding="utf-8") as f:
        json.dump(reg, f, ensure_ascii=False, indent=1, sort_keys=True)


# ── principal ─────────────────────────────────────────────────────────
def main():
    chave = os.environ.get("HEVY_API_KEY", "")
    if not chave:
        parar("Falta o secret HEVY_API_KEY.")

    resumo(f"## Hevy → Garmin — modo {MODO.upper()} · cargas em {UNIDADE}")
    resumo("")

    todas = rotinas_do_hevy(chave)
    escolhidas = []
    for r in todas:
        t = r.get("title") or ""
        if EXCLUIR and re.search(EXCLUIR, t, re.I):
            continue
        if FILTRO and not re.search(FILTRO, t, re.I):
            continue
        if not r.get("exercises"):
            continue
        escolhidas.append(r)
    log(f"Hevy: {len(todas)} rotinas, {len(escolhidas)} vao para o Garmin")
    resumo(f"Hevy: {len(todas)} rotinas · {len(escolhidas)} escolhidas "
           f"(fora: `{EXCLUIR or '—'}`{' · só: `' + FILTRO + '`' if FILTRO else ''})")
    resumo("")

    try:
        with open(REGISTRO, encoding="utf-8") as f:
            reg = json.load(f)
    except Exception:
        reg = {}
    reg.setdefault("treinos", {})

    planos, genericos = [], set()
    for r in escolhidas:
        dto, sem = montar(r)
        genericos |= sem
        imp = impressao(dto)
        antes = reg["treinos"].get(r["id"]) or {}
        mudou = antes.get("impressao") != imp or not antes.get("workoutId")
        planos.append((r, dto, imp, mudou))
        resumo(f"### {r.get('title')}" + ("" if mudou else " — sem mudança"))
        resumo("")
        for l in linhas_do_treino(r, dto):
            resumo(l)
        resumo("")

    if genericos:
        msg = "Sem par no Garmin (sobem genéricos, com o nome na descrição): " + ", ".join(sorted(genericos))
        log("::warning::" + msg)
        resumo("> ⚠️ " + msg)
        resumo("")

    pendentes = [p for p in planos if p[3]]
    if MODO == "ensaio":
        msg = f"ENSAIO: {len(pendentes)} de {len(planos)} rotina(s) seriam criadas/atualizadas. Nada foi enviado."
        log(msg); resumo("**" + msg + "**"); gravar_resumo()
        return
    if not pendentes:
        msg = "Nenhuma rotina mudou desde o último envio. Nem entrei no Garmin."
        log(msg); resumo("**" + msg + "**"); gravar_resumo()
        return

    g = login_garmin()
    nossos = nossos_no_garmin(g)
    criados = atualizados = erros = 0

    for r, dto, imp, _ in pendentes:
        rid, titulo = r["id"], r.get("title")
        wid = (reg["treinos"].get(rid) or {}).get("workoutId") or nossos.get(rid)
        atual = eh_nosso(g, wid, rid) if wid else None
        if atual is False:
            # o id existe mas o treino nao tem a nossa marca: nao e nosso
            log(f"::warning::{titulo}: o treino {wid} do Garmin nao tem a marca deste robo — nao toco nele, crio outro")
            atual = None
        aviso = ""
        for tentativa, corpo in enumerate((dto, sem_exercicio(dto))):
            try:
                if atual:
                    novo = dict(atual)
                    novo.update(corpo)
                    novo["workoutId"] = atual["workoutId"]
                    chamar(g, "PUT", f"/workout-service/workout/{atual['workoutId']}", novo)
                    wid_final = atual["workoutId"]
                    atualizados += 1
                    feito = "atualizado"
                else:
                    resp = chamar(g, "POST", "/workout-service/workout", corpo)
                    wid_final = (resp or {}).get("workoutId")
                    if not wid_final:
                        raise RuntimeError("o Garmin respondeu sem workoutId")
                    criados += 1
                    feito = "criado"
                reg["treinos"][rid] = {"workoutId": wid_final, "impressao": imp, "titulo": titulo,
                                       "enviadoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                                       "generico": tentativa == 1}
                salvar_registro(reg)
                log(f"Garmin: {titulo} -> {feito} ({wid_final}){aviso}")
                resumo(f"- ✅ **{titulo}** — {feito}{aviso}")
                break
            except Exception as e:
                if tentativa == 0:
                    log(f"::warning::{titulo}: o Garmin recusou com os exercicios ({e}); tento sem eles")
                    aviso = " (sem os nomes dos exercícios: o Garmin recusou algum)"
                    continue
                erros += 1
                log(f"::error::{titulo}: FALHOU — {e}")
                resumo(f"- ❌ **{titulo}** — falhou: {str(e)[:200]}")


    fim = f"PRONTO: {criados} criado(s), {atualizados} atualizado(s), {erros} com erro. Nada foi apagado nem agendado."
    log(fim); resumo(""); resumo("**" + fim + "**"); gravar_resumo()
    if erros:
        sys.exit(1)


if __name__ == "__main__":
    main()
