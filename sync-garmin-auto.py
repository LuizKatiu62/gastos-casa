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
DIAS_ATIVIDADES = 365
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
    "hiking": "trilha", "indoor_running": "esteira",
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
    "treadmill_running": "corrida", "walking": "corrida", "hiking": "corrida",
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
IGNORAR = {"yoga", "elliptical", "rowing", "incident_detected"}


def garmin_to_treino(act):
    tipo_g = (act.get("activityType") or {}).get("typeKey", "running").lower()
    if tipo_g in IGNORAR:
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
    url  = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_KEY}"
    body = json.dumps({"returnSecureToken": True}).encode()
    req  = urlreq.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urlreq.urlopen(req, timeout=10) as r:
        return json.loads(r.read()).get("idToken", "")


def firebase_put(path, data, token):
    url  = f"{FIREBASE_DB}/{path}.json?auth={token}"
    body = json.dumps(data, ensure_ascii=False).encode()
    req  = urlreq.Request(url, data=body, method="PUT",
                          headers={"Content-Type": "application/json"})
    with urlreq.urlopen(req, timeout=20) as r:
        return r.status == 200


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
    except Exception as e:
        log(f"ERRO Firebase: {e}")

    log("━━━ Sync concluído ━━━")


if __name__ == "__main__":
    main()
