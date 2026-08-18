#!/usr/bin/env python3
"""
Garmin → Firebase — sync automático (sem senha, usa sessão salva)
Rode sync-garmin.py manualmente se a sessão expirar.
"""

import json, sys, os, time
from datetime import datetime, timedelta

GARMIN_EMAIL    = "lcdsilva@hotmail.com"
FIREBASE_DB     = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
FIREBASE_PATH   = "treinos/luiz"
FIREBASE_KEY    = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"
CIRURGIA_DATA   = "2025-06-11"   # marco do projeto: dia da cirurgia
# A janela precisa cobrir desde a cirurgia, senao o total do site comeca a
# encolher sozinho quando o projeto passar de um ano. Antes era fixo em 365.
DIAS_ATIVIDADES = max(365, (datetime.today() -
                            datetime.strptime(CIRURGIA_DATA, "%Y-%m-%d")).days + 30)
DIAS_SAUDE      = 180
SESSION_DIR     = os.path.expanduser("~/.garth")
LOG_FILE        = os.path.expanduser("~/gastos-casa/sync.log")

try:
    from garminconnect import Garmin
except ImportError:
    print("Instale: pip3 install garminconnect")
    sys.exit(1)

import urllib.request as urlreq


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass


def fmt_dur(secs):
    if not secs: return ""
    h, rem = divmod(int(secs), 3600)
    m, s   = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def calc_pace(dist_m, dur_secs):
    if not dist_m or not dur_secs or dist_m < 100: return ""
    pace_secs = dur_secs / (dist_m / 1000)
    return f"{int(pace_secs//60)}:{int(pace_secs%60):02d}"


TIPO_MAP = {
    "running": "facil", "trail_running": "trilha", "ultra_run": "trilha",
    "treadmill_running": "esteira", "walking": "caminhada",
    "hiking": "caminhada", "indoor_running": "esteira",
    "virtual_run": "virtual", "track_running": "intervalado",
    "obstacle_run": "intervalado",
    "cycling": "bike", "road_biking": "bike", "gravel_cycling": "bike",
    "indoor_cycling": "bike_indoor", "track_cycling": "bike",
    "mountain_biking": "bike_trilha", "cyclocross": "bike_trilha",
    "virtual_ride": "bike_virtual", "e_bike_road": "bike", "e_bike_fitness": "bike",
    "swimming": "natacao", "lap_swimming": "natacao", "open_water_swimming": "natacao_ar",
    "strength_training": "musculacao", "weight_training": "musculacao",
    "fitness_equipment": "musculacao", "cardio_training": "musculacao",
    "hiit": "musculacao", "indoor_cardio": "musculacao",
    "barre": "musculacao", "pilates": "musculacao",
    "multi_sport": "multi_sport", "multisport": "multi_sport",
    "duathlon": "duathlon", "triathlon": "triathlon",
}
ESPORTE_MAP = {
    "running": "corrida", "trail_running": "corrida", "ultra_run": "corrida",
    "treadmill_running": "corrida",
    # walking e hiking NAO entram: veja IGNORAR, mais abaixo.
    "indoor_running": "corrida", "virtual_run": "corrida", "track_running": "corrida",
    "obstacle_run": "corrida",
    "cycling": "bike", "road_biking": "bike", "gravel_cycling": "bike",
    "indoor_cycling": "bike", "track_cycling": "bike",
    "mountain_biking": "bike", "cyclocross": "bike",
    "virtual_ride": "bike", "e_bike_road": "bike", "e_bike_fitness": "bike",
    "swimming": "natacao", "lap_swimming": "natacao", "open_water_swimming": "natacao",
    "strength_training": "academia", "weight_training": "academia",
    "fitness_equipment": "academia", "cardio_training": "academia",
    "hiit": "academia", "indoor_cardio": "academia",
    "barre": "academia", "pilates": "academia",
    "multi_sport": "duathlon", "multisport": "duathlon",
    "duathlon": "duathlon", "triathlon": "triathlon",
}
# O app so acompanha corrida, bike e natacao (mais forca, que aparece a
# parte). Caminhada a pe, trilha a pe e esportes de inverno nao entram —
# antes viravam "corrida" ou "outro" e cada lado contava de um jeito, que
# era a causa da diferenca de km entre o site e o app.
IGNORAR = {
    "yoga", "elliptical", "rowing", "incident_detected",
    "walking", "hiking", "casual_walking", "speed_walking",
    "mountaineering", "backcountry_skiing", "resort_skiing",
    "resort_skiing_snowboarding", "snowboarding", "cross_country_skiing",
    "skate_skiing", "snowshoeing", "ice_skating",
}

# Vale para os dois lados: so estes esportes sao gravados no Firebase.
ESPORTES_ACEITOS = {"corrida", "bike", "natacao", "academia",
                    "duathlon", "triathlon"}


def garmin_to_treino(act):
    tipo_g = (act.get("activityType") or {}).get("typeKey", "running").lower()
    if tipo_g in IGNORAR:
        return None
    # Tipo desconhecido do Garmin cairia em "outro" e entraria como corrida
    # no app. Melhor deixar de fora do que contar errado.
    if ESPORTE_MAP.get(tipo_g, "outro") not in ESPORTES_ACEITOS:
        return None
    dist_m   = act.get("distance", 0) or 0
    dur_secs = act.get("duration", 0) or 0
    start    = (act.get("startTimeLocal") or act.get("startTimeGMT") or "")[:10]
    return {
        "id":           "gm-" + str(act.get("activityId", "")),
        "esporte":      ESPORTE_MAP.get(tipo_g, "outro"),
        "tipo":         TIPO_MAP.get(tipo_g, "facil"),
        "data":         start,
        "distancia":    round(dist_m / 1000, 2),
        "duracao":      fmt_dur(dur_secs),
        "pace":         calc_pace(dist_m, dur_secs),
        "fcMed":        int(act.get("averageHR", 0) or 0),
        "fcMax":        int(act.get("maxHR", 0) or 0),
        "elevGain":     round(act.get("elevationGain", 0) or 0),
        "calorias":     int(act.get("calories", 0) or 0),
        "cadencia":     int(act.get("averageRunningCadenceInStepsPerMinute", 0) or 0),
        "oscilacao":    round(float(act.get("avgVerticalOscillation", 0) or act.get("averageVerticalOscillation", 0) or 0), 1),
        "contatoSolo":  int(act.get("avgGroundContactTime", 0) or act.get("averageGroundContactTime", 0) or 0),
        "razaoVertical": round(float(act.get("avgVerticalRatio", 0) or act.get("averageVerticalRatio", 0) or 0), 1),
        "passada":      round(float(act.get("avgStrideLength", 0) or act.get("averageStrideLength", 0) or 0), 2),
        "balanco":      round(float(act.get("avgGroundContactBalance", 0) or act.get("averageGroundContactBalance", 0) or 0), 1),
        "efAerobico":   round(float(act.get("trainingEffect", 0) or 0), 1),
        "efAnaerobico": round(float(act.get("anaerobicTrainingEffect", 0) or 0), 1),
        "vo2max":       round(float(act.get("vO2MaxValue", 0) or 0), 1),
        # Step Speed Loss (HRM 600): quanto de velocidade voce perde a
        # cada aterrissagem. O Garmin devolve em m/s; guardo em cm/s,
        # que e como o relogio mostra. Menor e melhor.
        "ssl":          round(float(act.get("avgStepSpeedLoss", 0) or 0) * 100, 1),
        "sslPct":       round(float(act.get("avgStepSpeedLossPercent", 0) or 0), 2),
        "notas":        act.get("activityName", ""),
        "garminId":     str(act.get("activityId", "")),
    }


def semana_iso(data_str):
    try:
        d = datetime.strptime(data_str, "%Y-%m-%d")
        return d.strftime("%Y-W%V")
    except Exception:
        return "0000-W00"


def firebase_token():
    """Entra como VOCE, nao como anonimo.

    accounts:signUp criava um usuario anonimo NOVO a cada execucao.
    Enquanto a regra fosse "auth != null" isso passava — e passava
    tambem para qualquer estranho que achasse a chave no codigo-fonte.
    Com a regra auth.uid === 'seu-uid' a conta anonima e barrada e a
    sincronia pararia. Por isso agora entra com e-mail e senha, vindos
    dos secrets FIREBASE_EMAIL e FIREBASE_PASSWORD do GitHub."""
    email = os.environ.get("FIREBASE_EMAIL", "").strip()
    senha = os.environ.get("FIREBASE_PASSWORD", "")
    if not email or not senha:
        # Os secrets ainda nao foram criados (Etapa 2 da seguranca). Ate la,
        # entra como anonimo, que e como o sync sempre funcionou. Sem este
        # retorno o sync abortaria e nenhum dado seria atualizado.
        log("AVISO: sem os secrets FIREBASE_EMAIL / FIREBASE_PASSWORD. "
            "Entrando como anonimo, como antes.")
        url  = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_KEY}"
        body = json.dumps({"returnSecureToken": True}).encode()
        req  = urlreq.Request(url, data=body,
                              headers={"Content-Type": "application/json"})
        with urlreq.urlopen(req, timeout=10) as r:
            return json.loads(r.read()).get("idToken", "")
    url  = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_KEY}"
    body = json.dumps({"email": email, "password": senha,
                       "returnSecureToken": True}).encode()
    req  = urlreq.Request(url, data=body, headers={"Content-Type": "application/json"})
    log(f"Firebase: tentando entrar como '{email}' (senha com {len(senha)} caracteres)")
    try:
        with urlreq.urlopen(req, timeout=15) as r:
            j = json.loads(r.read())
        log(f"Firebase: autenticado como {email} (uid {j.get('localId','?')})")
        return j.get("idToken", "")
    except urlreq.HTTPError as e:
        # o corpo da resposta traz o motivo exato; sem ler isto so sobra
        # "400 Bad Request", que nao ajuda ninguem
        try:
            detalhe = json.loads(e.read()).get("error", {}).get("message", "")
        except Exception:
            detalhe = ""
        explica = {
            "EMAIL_NOT_FOUND":  "esse e-mail nao existe no Authentication do projeto",
            "INVALID_PASSWORD": "a senha nao confere",
            "INVALID_LOGIN_CREDENTIALS": "e-mail ou senha nao conferem",
            "MISSING_PASSWORD": "o secret FIREBASE_PASSWORD chegou vazio",
            "INVALID_EMAIL":    "o secret FIREBASE_EMAIL nao parece um e-mail",
            "USER_DISABLED":    "essa conta esta desativada no console",
            "TOO_MANY_ATTEMPTS_TRY_LATER": "muitas tentativas seguidas; espere alguns minutos",
        }.get(detalhe.split(":")[0].strip(), "")
        log(f"ERRO no login do Firebase: HTTP {e.code} · {detalhe or 'sem detalhe'}"
            + (f" — {explica}" if explica else ""))
        sys.exit(1)
    except Exception as e:
        log(f"ERRO no login do Firebase: {e}")
        sys.exit(1)


CIRURGIA = CIRURGIA_DATA


# Gravacoes que misturam esportes numa atividade so. O Garmin salva tudo com
# um tipo unico, entao a quilometragem cai no balde errado. Aqui a atividade
# original vira a parte do esporte dominante e o restante sai como registro
# separado. Sem isso o duatlo de 26/04/2026 joga 16 km de corrida na bike.
AJUSTES_MULTISPORT = {
    "22667741915": {  # 26/04/2026 — "8k bike + 16k running + 8k bike"
        "esporte_extra": "corrida",
        "tipo_extra":    "facil",
        "km_original":   16.23,
        "km_extra":      16.23,
        "nota":          "Duatlo 26/04/2026 - parte de corrida (divisao 50/50)",
    },
}


def dur_seg(txt):
    """'2:51:07' ou '48:12' -> segundos. 0 se nao der para ler."""
    try:
        p = [int(x) for x in str(txt).split(":")]
    except Exception:
        return 0
    if len(p) == 3: return p[0] * 3600 + p[1] * 60 + p[2]
    if len(p) == 2: return p[0] * 60 + p[1]
    return 0


def aplicar_ajustes(treinos):
    """Divide as atividades multiesporte listadas em AJUSTES_MULTISPORT.

    A duracao tambem e repartida, proporcional a distancia de cada trecho.
    Se ficasse inteira nos dois registros o total de horas de treino
    dobraria nesse dia."""
    extras = []
    for t in treinos:
        aj = AJUSTES_MULTISPORT.get(t.get("garminId"))
        if not aj:
            continue
        total_seg = dur_seg(t.get("duracao"))
        km_tot    = aj["km_original"] + aj["km_extra"]
        seg_orig  = int(total_seg * aj["km_original"] / km_tot) if km_tot else 0
        seg_extra = total_seg - seg_orig

        novo = dict(t)
        novo["id"]        = t["id"] + "-x"
        novo["garminId"]  = t["garminId"] + "-x"
        novo["esporte"]   = aj["esporte_extra"]
        novo["tipo"]      = aj["tipo_extra"]
        novo["distancia"] = aj["km_extra"]
        novo["duracao"]   = fmt_dur(seg_extra)
        novo["pace"]      = calc_pace(aj["km_extra"] * 1000, seg_extra)
        novo["notas"]     = aj["nota"]
        extras.append(novo)

        t["distancia"] = aj["km_original"]
        t["duracao"]   = fmt_dur(seg_orig)
        t["pace"]      = calc_pace(aj["km_original"] * 1000, seg_orig)

        log(f"Ajuste multiesporte em {t['garminId']}: "
            f"{aj['km_original']} km {t['esporte']} + {aj['km_extra']} km {aj['esporte_extra']}")
    return treinos + extras


def pace_seg(txt):
    """'5:33' -> 333. Devolve None se nao der para ler."""
    try:
        p = str(txt).split(":")
        return int(p[0]) * 60 + int(p[1]) if len(p) == 2 else None
    except Exception:
        return None


def resumo_publico(treinos):
    """So os totais de corrida, bike e natacao desde a cirurgia.

    Nada de sono, estresse, HRV ou coordenada — esses ficam no no
    protegido, que exige login. Aqui vai o que qualquer um veria no
    Strava: quanto de cada esporte."""
    desde = [t for t in treinos if t["data"] >= CIRURGIA]
    if not desde:
        return None

    def soma(esporte, fora=()):
        a = [t for t in desde if t["esporte"] == esporte and t["tipo"] not in fora]
        return {"km": round(sum(t["distancia"] for t in a), 1), "n": len(a)}

    hoje = datetime.today()
    return {
        "desde":      CIRURGIA,
        "atualizado": hoje.strftime("%Y-%m-%dT%H:%M:%S"),
        "corrida":    soma("corrida", ("caminhada",)),
        "bike":       soma("bike"),
        "natacao":    soma("natacao"),
    }


def firebase_put(path, data, token):
    url  = f"{FIREBASE_DB}/{path}.json?auth={token}"
    body = json.dumps(data, ensure_ascii=False).encode()
    req  = urlreq.Request(url, data=body, method="PUT",
                          headers={"Content-Type": "application/json"})
    with urlreq.urlopen(req, timeout=20) as r:
        return r.status == 200


def firebase_get(path, token):
    """Le um no do Firebase. Devolve None se nao existir ou se der erro."""
    url = f"{FIREBASE_DB}/{path}.json?auth={token}"
    try:
        with urlreq.urlopen(url, timeout=20) as r:
            if r.status != 200:
                return None
            return json.loads(r.read().decode() or "null")
    except Exception as e:
        log(f"Firebase leitura falhou em {path}: {e}")
        return None


def publicar_semana(token, pacote=None):
    """Copia o pacote que o app montou (ST.garminSemana) para um arquivo do
    repositorio, de onde o assistente le para criar os workouts no Garmin.

    Este script NAO decide nada de treino: ritmos, distancias e reparticao
    das sessoes vem prontos do fix.js. Aqui e so copia. Se um dia essa
    regra for quebrada, passam a existir duas versoes da mesma conta e
    elas vao discordar.
    """
    if pacote is None:
        pacote = firebase_get("treinos_coach_v2/luiz/garminSemana", token)
    if not pacote or not isinstance(pacote, dict):
        log("Semana do Garmin: o app ainda nao gravou o pacote (abra o app uma vez)")
        return False

    sessoes = pacote.get("sessoes") or []

    # Um pacote vazio ou sem carimbo NAO pode apagar a semana boa que ja
    # esta publicada. Se o app tropecar, o certo e o arquivo antigo ficar
    # onde esta — ele vem com data e quem le sabe julgar se envelheceu.
    if not sessoes or not pacote.get("gerado"):
        log("Semana do Garmin: pacote vazio ou sem carimbo, mantendo o anterior")
        return False

    destino = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "treinos-v2", "semana.json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)

    antigo = None
    if os.path.exists(destino):
        try:
            with open(destino, encoding="utf-8") as f:
                antigo = json.load(f)
        except Exception:
            antigo = None

    # nao reescreve por reescrever: o commit so acontece se mudou de verdade
    if antigo and antigo.get("gerado") == pacote.get("gerado"):
        log(f"Semana do Garmin: sem novidade ({len(sessoes)} sessoes)")
        return False

    with open(destino, "w", encoding="utf-8") as f:
        json.dump(pacote, f, ensure_ascii=False, indent=1)
    log(f"Semana do Garmin publicada: {len(sessoes)} sessoes, "
        f"gerada em {pacote.get('gerado', '?')[:16]}")
    return True


# ══════════════════════════════════════════════════════════════════════
#  SEMANA NO GARMIN
#
#  Este bloco NAO decide nada de treino. Ritmos, distancias e a divisao
#  entre aquecimento e parte principal ja vem prontos do fix.js, dentro
#  do no garminSemana. Aqui e traducao para o vocabulario do Garmin e
#  mais nada. Se um dia alguem puser regra de treino aqui, passam a
#  existir duas versoes da mesma conta, e elas vao discordar.
# ══════════════════════════════════════════════════════════════════════


def _garth(api):
    """Devolve o cliente garth de dentro do garminconnect.

    POR QUE NAO USO api.connectapi(). O embrulho do garminconnect na
    versao instalada chama o transporte assim:

        self._run_request(method, path, ...)

    passando o method POR POSICAO. Quando eu tambem mandava
    method="POST" por palavra-chave, o Python reclamava:

        Client._run_request() got multiple values for argument 'method'

    e as quatro sessoes falhavam. O garth, que fica uma camada abaixo,
    tem a assinatura connectapi(path, method="GET", **kwargs) e aceita
    a palavra-chave sem ambiguidade. Entao falo com ele direto.

    O nome do atributo mudou entre versoes (client, garth), por isso
    procuro os dois em vez de fixar um.
    """
    for nome in ("garth", "client"):
        g = getattr(api, nome, None)
        if g is not None and hasattr(g, "connectapi"):
            return g, nome
    return None, None


PASSO_ID = {"warmup": (1, "warmup"), "cooldown": (2, "cooldown"),
            "interval": (3, "interval"), "recovery": (4, "recovery")}
FIM_ID   = {"time": (2, "time"), "distance": (3, "distance")}


def _passo_dto(p, ordem):
    """Traduz um passo do pacote para o formato que o Garmin espera."""
    if p.get("tipo") == "repetir":
        dentro = []
        for i, q in enumerate(p.get("passos") or [], start=1):
            dentro.append(_passo_dto(q, i))
        return {
            "type": "RepeatGroupDTO",
            "stepOrder": ordem,
            "stepType": {"stepTypeId": 6, "stepTypeKey": "repeat"},
            "numberOfIterations": p["vezes"],
            # sem o conditionTypeId 7 o Garmin corrompe a contagem em silencio
            "endCondition": {"conditionTypeId": 7, "conditionTypeKey": "iterations"},
            "endConditionValue": p["vezes"],
            "workoutSteps": dentro,
        }

    tid, tkey = PASSO_ID[p["tipo"]]
    cid, ckey = FIM_ID[p["fim"]]
    dto = {
        "type": "ExecutableStepDTO",
        "stepOrder": ordem,
        "stepType": {"stepTypeId": tid, "stepTypeKey": tkey},
        "description": p.get("texto", ""),
        "endCondition": {"conditionTypeId": cid, "conditionTypeKey": ckey},
        "endConditionValue": p["valor"],
    }
    if p.get("rapido"):
        # ja vem em metros por segundo, prontos. Nao converter.
        dto["targetType"] = {"workoutTargetTypeId": 6, "workoutTargetTypeKey": "pace.zone"}
        dto["targetValueOne"] = p["rapido"]
        dto["targetValueTwo"] = p["lento"]
    return dto


def _workout_dto(sessao):
    corrida = {"sportTypeId": 1, "sportTypeKey": "running"}
    passos  = [_passo_dto(p, i) for i, p in enumerate(sessao["passos"], start=1)]
    return {
        "sportType": corrida,
        "workoutName": sessao["nome"][:80],
        "description": sessao.get("nota", ""),
        "workoutSegments": [{
            "segmentOrder": 1,
            "sportType": corrida,
            "workoutSteps": passos,
        }],
    }


def subir_semana_garmin(api, token, pacote):
    """Cria e agenda no Garmin as corridas da semana.

    Idempotente: guarda no Firebase o que ja subiu, por data e por
    carimbo do pacote. Rodar de hora em hora nao cria duplicata. Se o
    app recompoe o bloco, o carimbo muda, o workout antigo daquele dia
    e apagado e entra o novo — substituicao, nunca acumulo.
    """
    sessoes = pacote.get("sessoes") or []
    carimbo = pacote.get("gerado")
    if not sessoes or not carimbo:
        return

    g, via = _garth(api)
    if g is None:
        log("Garmin: nao achei o cliente garth dentro do garminconnect — nada sobe")
        return
    log(f"Garmin: falando com o Connect via api.{via}")

    hoje  = datetime.now().date()
    envio = firebase_get("treinos_coach_v2/luiz/garminEnviado", token) or {}
    if not isinstance(envio, dict):
        envio = {}

    novos, trocados, erros = 0, 0, 0

    for s in sessoes:
        data = s.get("data")
        if not data:
            continue
        try:
            d = datetime.strptime(data, "%Y-%m-%d").date()
        except ValueError:
            continue
        if d < hoje or (d - hoje).days > 7:
            continue

        ja = envio.get(data) or {}
        if ja.get("gerado") == carimbo and ja.get("id"):
            continue                      # ja subiu, nada mudou

        # o plano mudou para este dia: tira o antigo antes de por o novo
        if ja.get("id"):
            try:
                g.connectapi(f"/workout-service/workout/{ja['id']}", method="DELETE")
                log(f"Garmin: workout antigo de {data} removido")
            except Exception as e:
                log(f"Garmin: nao consegui remover o antigo de {data}: {e}")

        try:
            criado = g.connectapi("/workout-service/workout",
                                  method="POST", json=_workout_dto(s))
            wid = (criado or {}).get("workoutId")
            if not wid:
                raise RuntimeError("resposta sem workoutId")

            g.connectapi(f"/workout-service/schedule/{wid}",
                         method="POST", json={"date": data})

            envio[data] = {"id": wid, "gerado": carimbo, "nome": s.get("nome")}
            if ja.get("id"):
                trocados += 1
            else:
                novos += 1
            log(f"Garmin: {s.get('nome')} agendado para {data}")
        except Exception as e:
            erros += 1
            log(f"Garmin: FALHOU {data} — {e}")

    # esquece o que ja passou, para o registro nao crescer para sempre
    envio = {k: v for k, v in envio.items()
             if k >= (hoje - timedelta(days=30)).strftime("%Y-%m-%d")}

    if novos or trocados:
        firebase_put("treinos_coach_v2/luiz/garminEnviado", envio, token)
        log(f"Garmin: {novos} novos, {trocados} substituidos, {erros} com erro")
    elif erros:
        log(f"Garmin: nenhum subiu, {erros} com erro")


def safe_get(api, fn, *args, delay=0.4):
    try:
        result = fn(*args)
        time.sleep(delay)
        return result
    except Exception:
        time.sleep(delay)
        return None


def env_int(name, default, min_v=1, max_v=365):
    raw = (os.environ.get(name, "") or "").strip()
    if not raw:
        return default
    try:
        v = int(raw)
    except Exception:
        return default
    return max(min_v, min(max_v, v))


def main():
    log("━━━ Iniciando sync automático ━━━")

    dias_saude = env_int("DIAS_SAUDE", DIAS_SAUDE, 1, 365)
    log(f"Janela de saúde usada no sync: {dias_saude} dia(s)")

    senha_env = os.environ.get("GARMIN_PASSWORD", "")

    # Tenta sessão salva primeiro; se falhar usa senha do ambiente (GitHub Actions)
    api = None
    if os.path.exists(SESSION_DIR):
        try:
            api = Garmin(GARMIN_EMAIL, "")
            api.login(SESSION_DIR)
            log("Login OK (sessão reutilizada)")
        except Exception:
            api = None

    if api is None:
        if not senha_env:
            log("ERRO: sem sessão e sem GARMIN_PASSWORD. Configure o secret no GitHub.")
            sys.exit(1)
        try:
            api = Garmin(GARMIN_EMAIL, senha_env)
            api.login()
            log("Login OK (GARMIN_PASSWORD)")
        except Exception as e:
            log(f"ERRO no login: {e}")
            sys.exit(1)

    hoje = datetime.today()
    ini  = hoje - timedelta(days=DIAS_ATIVIDADES)

    try:
        raw = api.get_activities_by_date(ini.strftime("%Y-%m-%d"), hoje.strftime("%Y-%m-%d"))
        log(f"{len(raw)} atividades encontradas")
    except Exception as e:
        log(f"ERRO ao buscar atividades: {e}")
        sys.exit(1)

    treinos   = [t for a in raw if (t := garmin_to_treino(a))]
    treinos   = aplicar_ajustes(treinos)

    # O resumo da atividade nem sempre traz o Step Speed Loss; os splits
    # tipados sempre trazem. Busco so nas corridas dos ultimos 90 dias
    # que estao sem o dado — o resto nao vale a chamada extra.
    limite_ssl = (hoje - timedelta(days=90)).strftime("%Y-%m-%d")
    faltando = [t for t in treinos
                if t["esporte"] == "corrida" and not t["ssl"] and t["data"] >= limite_ssl]
    if faltando:
        log(f"Buscando Step Speed Loss em {len(faltando)} corridas...")
        achou = 0
        for t in faltando:
            sp = safe_get(api, api.get_activity_typed_splits, t["garminId"], delay=0.4)
            if not sp:
                continue
            trechos = [x for x in (sp.get("splits") or [])
                       if x.get("stepSpeedLoss") and x.get("distance", 0) > 200]
            if not trechos:
                continue
            # media ponderada pela distancia de cada trecho
            dist = sum(x["distance"] for x in trechos)
            t["ssl"]    = round(sum(x["stepSpeedLoss"] * x["distance"] for x in trechos) / dist * 100, 1)
            t["sslPct"] = round(sum(x["stepSpeedLossPercent"] * x["distance"] for x in trechos) / dist, 2)
            achou += 1
        log(f"Step Speed Loss encontrado em {achou} de {len(faltando)}")
    ignorados = len(raw) - len(treinos)
    log(f"{len(treinos)} treinos para sincronizar | {ignorados} ignorados")

    # Diagnóstico: tipos encontrados
    tipos_raw = {}
    for a in raw:
        tg = (a.get("activityType") or {}).get("typeKey", "?").lower()
        tipos_raw[tg] = tipos_raw.get(tg, 0) + 1
    log("Tipos Garmin: " + ", ".join(f"{k}({v})" for k, v in sorted(tipos_raw.items())))

    if not treinos:
        log("Nenhum treino — abortando.")
        return

    trintaDias = (hoje - timedelta(days=30)).strftime("%Y-%m-%d")
    seteDias   = (hoje - timedelta(days=7)).strftime("%Y-%m-%d")
    treinos_30 = [t for t in treinos if t["data"] >= trintaDias]
    treinos_7  = [t for t in treinos if t["data"] >= seteDias]
    total_km   = round(sum(t["distancia"] for t in treinos), 1)
    km_30      = round(sum(t["distancia"] for t in treinos_30), 1)
    km_7       = round(sum(t["distancia"] for t in treinos_7), 1)

    semanal = {}
    for t in treinos:
        s = semana_iso(t["data"])
        if s not in semanal:
            semanal[s] = {"km": 0, "treinos": 0}
        semanal[s]["km"]      = round(semanal[s]["km"] + t["distancia"], 2)
        semanal[s]["treinos"] += 1

    log(f"Buscando dados de saúde ({dias_saude} dias)...")
    bodyBattery = {}
    stress      = {}
    sono        = {}
    hrv         = {}

    for i in range(dias_saude):
        d = (hoje - timedelta(days=i)).strftime("%Y-%m-%d")

        # Body Battery + Stress — uma chamada só
        st = safe_get(api, api.get_stats, d, delay=0.5)
        if st:
            high = st.get("bodyBatteryHighestValue") or st.get("maxBodyBattery") or 0
            low  = st.get("bodyBatteryLowestValue")  or st.get("minBodyBattery") or 0
            if high:
                bodyBattery[d] = {"max": int(high), "min": int(low)}
            avg_s = st.get("averageStressLevel") or -1
            max_s = st.get("maxStressLevel") or 0
            if avg_s is not None and avg_s >= 0:
                stress[d] = {"avg": int(avg_s), "max": int(max_s)}

        # Sono
        sl = safe_get(api, api.get_sleep_data, d, delay=0.5)
        if sl and sl.get("dailySleepDTO"):
            dto     = sl["dailySleepDTO"]
            scores  = (dto.get("sleepScores") or {})
            overall = (scores.get("overall") or {})
            sono[d] = {
                "duracao":  round((dto.get("sleepTimeSeconds",  0) or 0) / 3600, 1),
                "profundo": round((dto.get("deepSleepSeconds",  0) or 0) / 3600, 1),
                "leve":     round((dto.get("lightSleepSeconds", 0) or 0) / 3600, 1),
                "rem":      round((dto.get("remSleepSeconds",   0) or 0) / 3600, 1),
                "score":    overall.get("value", 0) if isinstance(overall, dict) else 0,
                # tempo acordado durante a noite — o Garmin Connect mostra
                # como quarta fase e faltava aqui
                "acordado": round((dto.get("awakeSleepSeconds", 0) or 0) / 3600, 2),
                # soneca do dia. O que pesa na recuperacao e o sono das 24
                # horas, nao so o da noite; sem este campo um cochilo de
                # duas horas simplesmente sumia do app.
                "soneca": round((dto.get("napTimeSeconds", 0) or 0) / 3600, 2),
            }

        # HRV
        hv = safe_get(api, api.get_hrv_data, d, delay=0.5)
        if hv and hv.get("hrvSummary"):
            hs = hv["hrvSummary"]
            hrv[d] = {
                "semanal": hs.get("weeklyAvg", 0),
                "ontem":   hs.get("lastNight", 0),
                "status":  hs.get("status", ""),
            }

    log("Enviando para Firebase...")
    try:
        token = firebase_token()
        payload = {
            "atividades":  treinos,
            "meta": {
                "ultimaSync":    hoje.strftime("%Y-%m-%dT%H:%M:%S"),
                "totalTreinos":  len(treinos),
                "totalKm":       total_km,
                "km30dias":      km_30,
                "km7dias":       km_7,
                "treinos30dias": len(treinos_30),
                "treinos7dias":  len(treinos_7),
            },
            "semanal":     semanal,
            "bodyBattery": bodyBattery,
            "sono":        sono,
            "stress":      stress,
            "hrv":         hrv,
        }
        ok = firebase_put(FIREBASE_PATH, payload, token)
        if ok:
            log(f"Firebase atualizado! {len(treinos)} treinos · {total_km} km · {km_7} km esta semana")
        else:
            log("ERRO ao salvar no Firebase")

        # resumo publico do runwithgratitude.ca — so numeros agregados
        pub = resumo_publico(treinos)
        if pub:
            if firebase_put("blog/evolucao", pub, token):
                log(f"Evolucao publica: corrida {pub['corrida']['km']} km · "
                    f"bike {pub['bike']['km']} km · natacao {pub['natacao']['km']} km")
            else:
                log("ERRO ao salvar a evolucao publica")

        # A semana que o app montou: publica o arquivo e sobe no Garmin.
        # Le o pacote uma vez so e passa para os dois.
        try:
            pacote = firebase_get("treinos_coach_v2/luiz/garminSemana", token)
            publicar_semana(token, pacote)
            if pacote:
                subir_semana_garmin(api, token, pacote)
        except Exception as e:
            log(f"ERRO na semana do Garmin: {e}")
    except Exception as e:
        log(f"ERRO Firebase: {e}")

    log("━━━ Sync concluído ━━━")


if __name__ == "__main__":
    main()
