#!/usr/bin/env python3
"""
Garmin → Firebase Treinos sync
Puxa atividades, body battery, sono, stress e HRV do Garmin Connect.
"""

import json, sys, os, time
from datetime import datetime, timedelta

# ── Configuração ──────────────────────────────────────────────
GARMIN_EMAIL     = "lcdsilva@hotmail.com"
FIREBASE_DB      = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
FIREBASE_PATH    = "treinos/luiz"
FIREBASE_KEY     = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"
DIAS_ATIVIDADES  = 365
DIAS_SAUDE       = 180
# ─────────────────────────────────────────────────────────────

try:
    from garminconnect import Garmin
except ImportError:
    print("Instale: pip3 install garminconnect")
    sys.exit(1)

import urllib.request as urlreq


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
    # Corrida
    "running": "facil", "trail_running": "trilha", "ultra_run": "trilha",
    "treadmill_running": "esteira", "walking": "caminhada",
    "hiking": "trilha", "indoor_running": "esteira",
    "virtual_run": "virtual", "track_running": "intervalado",
    "obstacle_run": "intervalado",
    # Bike — todos os tipos conhecidos do Garmin
    "cycling": "bike", "road_biking": "bike", "gravel_cycling": "bike",
    "indoor_cycling": "bike_indoor", "track_cycling": "bike",
    "mountain_biking": "bike_trilha", "cyclocross": "bike_trilha",
    "virtual_ride": "bike_virtual", "e_bike_mountain": "bike_trilha",
    "e_bike_road": "bike", "e_bike_fitness": "bike",
    "recumbent_cycling": "bike", "hand_cycling": "bike",
    "commuting": "bike", "bmx": "bike_trilha",
    # Natação
    "swimming": "natacao", "open_water_swimming": "natacao_ar",
    "lap_swimming": "natacao",
    # Multi-sport / Triathlon / Duathlon
    "multi_sport": "multi_sport", "multisport": "multi_sport",
    "duathlon": "duathlon", "triathlon": "triathlon",
    # Academia
    "strength_training": "musculacao", "weight_training": "musculacao",
    "fitness_equipment": "musculacao", "cardio_training": "musculacao",
    "barre": "musculacao", "pilates": "musculacao",
}
ESPORTE_MAP = {
    "running": "corrida", "trail_running": "corrida", "ultra_run": "corrida",
    "treadmill_running": "corrida", "walking": "corrida", "hiking": "corrida",
    "indoor_running": "corrida", "virtual_run": "corrida", "track_running": "corrida",
    "obstacle_run": "corrida",
    "cycling": "bike", "road_biking": "bike", "gravel_cycling": "bike",
    "indoor_cycling": "bike", "track_cycling": "bike",
    "mountain_biking": "bike", "cyclocross": "bike",
    "virtual_ride": "bike", "e_bike_mountain": "bike",
    "e_bike_road": "bike", "e_bike_fitness": "bike",
    "recumbent_cycling": "bike", "hand_cycling": "bike",
    "commuting": "bike", "bmx": "bike",
    "swimming": "natacao", "open_water_swimming": "natacao", "lap_swimming": "natacao",
    "strength_training": "academia", "weight_training": "academia",
    "fitness_equipment": "academia", "cardio_training": "academia",
    "barre": "academia", "pilates": "academia",
    "multi_sport": "duathlon", "multisport": "duathlon",
    "duathlon": "duathlon", "triathlon": "triathlon",
}
IGNORAR = {
    "yoga", "elliptical", "rowing", "incident_detected",
}


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


def main():
    print("═" * 52)
    print("  🏃 Garmin → Firebase Treinos (completo)")
    print("═" * 52)

    senha = input(f"\n  Senha do Garmin ({GARMIN_EMAIL}): ").strip()
    if not senha:
        print("  Cancelado.")
        sys.exit(1)

    SESSION_DIR = os.path.expanduser("~/.garth")
    print("\n  Conectando ao Garmin...")
    try:
        api = Garmin(GARMIN_EMAIL, senha)
        if os.path.exists(SESSION_DIR):
            try:
                api.login(SESSION_DIR)
                print("  ✅ Login OK (sessão reutilizada)")
            except Exception:
                api.login()
                api.garth.dump(SESSION_DIR)
                print("  ✅ Login OK (sessão renovada)")
        else:
            api.login()
            api.garth.dump(SESSION_DIR)
            print("  ✅ Login OK (sessão salva)")
    except Exception as e:
        msg = str(e)
        print(f"  ❌ Erro no login: {msg[:200]}")
        sys.exit(1)

    hoje = datetime.today()
    ini  = hoje - timedelta(days=DIAS_ATIVIDADES)

    # ── Atividades ──
    print(f"\n  Buscando atividades (últimos {DIAS_ATIVIDADES} dias)...")
    try:
        raw = api.get_activities_by_date(ini.strftime("%Y-%m-%d"), hoje.strftime("%Y-%m-%d"))
        print(f"  📋 {len(raw)} atividades encontradas")
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        sys.exit(1)

    treinos   = [t for a in raw if (t := garmin_to_treino(a))]
    ignorados = len(raw) - len(treinos)
    print(f"  🏃 {len(treinos)} treinos | ⏭ {ignorados} ignorados")

    # Diagnóstico: tipos encontrados
    tipos_raw = {}
    for a in raw:
        tg = (a.get("activityType") or {}).get("typeKey", "?").lower()
        tipos_raw[tg] = tipos_raw.get(tg, 0) + 1
    print("  📋 Tipos encontrados:", ", ".join(f"{k}({v})" for k, v in sorted(tipos_raw.items())))

    if not treinos:
        print("\n  Nenhum treino para sincronizar.")
        return

    # ── Estatísticas ──
    trintaDias = (hoje - timedelta(days=30)).strftime("%Y-%m-%d")
    seteDias   = (hoje - timedelta(days=7)).strftime("%Y-%m-%d")
    treinos_30 = [t for t in treinos if t["data"] >= trintaDias]
    treinos_7  = [t for t in treinos if t["data"] >= seteDias]
    total_km   = round(sum(t["distancia"] for t in treinos), 1)
    km_30      = round(sum(t["distancia"] for t in treinos_30), 1)
    km_7       = round(sum(t["distancia"] for t in treinos_7), 1)

    # Volume por semana
    semanal = {}
    for t in treinos:
        s = semana_iso(t["data"])
        if s not in semanal:
            semanal[s] = {"km": 0, "treinos": 0}
        semanal[s]["km"]      = round(semanal[s]["km"] + t["distancia"], 2)
        semanal[s]["treinos"] += 1

    # ── Saúde (loop único: BB + stress via get_stats, sono e HRV separados) ──
    print(f"\n  Buscando dados de saúde ({DIAS_SAUDE} dias)...")
    bodyBattery = {}
    stress      = {}
    sono        = {}
    hrv         = {}

    for i in range(DIAS_SAUDE):
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

        # Sono — chamada separada
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

        # HRV — chamada separada
        hv = safe_get(api, api.get_hrv_data, d, delay=0.5)
        if hv and hv.get("hrvSummary"):
            hs = hv["hrvSummary"]
            hrv[d] = {
                "semanal": hs.get("weeklyAvg", 0),
                "ontem":   hs.get("lastNight", 0),
                "avg":     hs.get("lastNight", 0),
                "status":  hs.get("status", ""),
            }

    print(f"  🔋 {len(bodyBattery)} dias com Body Battery")
    print(f"  😴 {len(sono)} dias com sono")
    print(f"  😰 {len(stress)} dias com stress")
    print(f"  💚 {len(hrv)} dias com HRV")

    # ── Firebase ──
    print("\n  Enviando para Firebase...")
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
            print(f"  ✅ Firebase atualizado!")
            print(f"     {len(treinos)} treinos · {total_km} km total")
            print(f"     {km_30} km nos últimos 30 dias · {km_7} km esta semana")
        else:
            print("  ❌ Erro ao salvar no Firebase")
    except Exception as e:
        print(f"  ❌ Firebase: {e}")

    print("═" * 52)
    print("  Abra o app: luizkatiu62.github.io/treinos")
    print("═" * 52)


if __name__ == "__main__":
    main()
