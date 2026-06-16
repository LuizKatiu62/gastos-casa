#!/usr/bin/env python3
"""
Garmin → Firebase Treinos sync
Puxa atividades, body battery e sono do Garmin Connect e salva no Firebase.
"""

import json, sys, os, time
from datetime import datetime, timedelta

# ── Configuração ──────────────────────────────────────────────
GARMIN_EMAIL     = "lcdsilva@hotmail.com"
FIREBASE_DB      = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
FIREBASE_PATH    = "treinos/luiz"
FIREBASE_KEY     = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"
DIAS_ATIVIDADES  = 90   # histórico de corridas
DIAS_SAUDE       = 14   # body battery e sono (últimos N dias)
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
    "running": "facil", "trail_running": "trilha", "ultra_run": "trilha",
    "treadmill_running": "esteira", "walking": "caminhada",
    "hiking": "trilha", "indoor_running": "esteira",
    "virtual_run": "virtual", "track_running": "intervalado",
    "obstacle_run": "intervalado",
}
IGNORAR = {
    "cycling", "indoor_cycling", "swimming", "strength_training", "yoga",
    "elliptical", "rowing", "mountain_biking", "virtual_ride"
}


def garmin_to_treino(act):
    tipo_g = (act.get("activityType") or {}).get("typeKey", "running").lower()
    if tipo_g in IGNORAR:
        return None
    dist_m   = act.get("distance", 0) or 0
    dur_secs = act.get("duration", 0) or 0
    start    = (act.get("startTimeLocal") or act.get("startTimeGMT") or "")[:10]
    return {
        "id":        "gm-" + str(act.get("activityId", "")),
        "tipo":      TIPO_MAP.get(tipo_g, "facil"),
        "data":      start,
        "distancia": round(dist_m / 1000, 2),
        "duracao":   fmt_dur(dur_secs),
        "pace":      calc_pace(dist_m, dur_secs),
        "fcMed":     int(act.get("averageHR", 0) or 0),
        "fcMax":     int(act.get("maxHR", 0) or 0),
        "elevGain":  round(act.get("elevationGain", 0) or 0),
        "calorias":  int(act.get("calories", 0) or 0),
        "notas":     act.get("activityName", ""),
        "garminId":  str(act.get("activityId", "")),
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


def main():
    print("═" * 52)
    print("  🏃 Garmin → Firebase Treinos")
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
        if "429" in msg:
            print("     Garmin bloqueou temporariamente. Aguarde 10 min.")
        elif "401" in msg or "password" in msg.lower():
            print("     Senha incorreta. Tente fazer login em connect.garmin.com primeiro.")
        sys.exit(1)

    # ── Atividades ──
    hoje = datetime.today()
    ini  = hoje - timedelta(days=DIAS_ATIVIDADES)
    print(f"\n  Buscando atividades (últimos {DIAS_ATIVIDADES} dias)...")
    try:
        raw = api.get_activities_by_date(ini.strftime("%Y-%m-%d"), hoje.strftime("%Y-%m-%d"))
        print(f"  📋 {len(raw)} atividades encontradas")
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        sys.exit(1)

    treinos   = [t for a in raw if (t := garmin_to_treino(a))]
    ignorados = len(raw) - len(treinos)
    print(f"  🏃 {len(treinos)} treinos de corrida | ⏭ {ignorados} ignorados")

    if not treinos:
        print("\n  Nenhum treino para sincronizar.")
        return

    # ── Estatísticas ──
    hoje_str = hoje.strftime("%Y-%m-%d")
    trintaDias = (hoje - timedelta(days=30)).strftime("%Y-%m-%d")
    treinos_30 = [t for t in treinos if t["data"] >= trintaDias]
    total_km   = round(sum(t["distancia"] for t in treinos), 1)
    km_30      = round(sum(t["distancia"] for t in treinos_30), 1)

    # Volume por semana
    semanal = {}
    for t in treinos:
        s = semana_iso(t["data"])
        if s not in semanal:
            semanal[s] = {"km": 0, "treinos": 0}
        semanal[s]["km"]      = round(semanal[s]["km"] + t["distancia"], 2)
        semanal[s]["treinos"] += 1

    # ── Body Battery ──
    print(f"\n  Buscando Body Battery ({DIAS_SAUDE} dias)...")
    bodyBattery = {}
    for i in range(DIAS_SAUDE):
        d = (hoje - timedelta(days=i)).strftime("%Y-%m-%d")
        try:
            bb = api.get_body_battery(d)
            if bb:
                vals = [v[1] for v in bb if isinstance(v, list) and len(v) > 1 and v[1] is not None]
                if vals:
                    bodyBattery[d] = {"max": max(vals), "min": min(vals)}
            time.sleep(0.4)
        except Exception:
            pass
    print(f"  🔋 {len(bodyBattery)} dias com Body Battery")

    # ── Sono ──
    print(f"  Buscando dados de sono ({DIAS_SAUDE} dias)...")
    sono = {}
    for i in range(DIAS_SAUDE):
        d = (hoje - timedelta(days=i)).strftime("%Y-%m-%d")
        try:
            s = api.get_sleep_data(d)
            if s and s.get("dailySleepDTO"):
                dto = s["dailySleepDTO"]
                scores = (dto.get("sleepScores") or {})
                overall = (scores.get("overall") or {})
                sono[d] = {
                    "duracao":  round((dto.get("sleepTimeSeconds",  0) or 0) / 3600, 1),
                    "profundo": round((dto.get("deepSleepSeconds",  0) or 0) / 3600, 1),
                    "leve":     round((dto.get("lightSleepSeconds", 0) or 0) / 3600, 1),
                    "rem":      round((dto.get("remSleepSeconds",   0) or 0) / 3600, 1),
                    "score":    overall.get("value", 0) if isinstance(overall, dict) else 0,
                }
            time.sleep(0.4)
        except Exception:
            pass
    print(f"  😴 {len(sono)} dias com dados de sono")

    # ── Firebase ──
    print("\n  Enviando para Firebase...")
    try:
        token = firebase_token()
        payload = {
            "atividades":  treinos,
            "meta": {
                "ultimaSync":     hoje.strftime("%Y-%m-%dT%H:%M:%S"),
                "totalTreinos":   len(treinos),
                "totalKm":        total_km,
                "km30dias":       km_30,
                "treinos30dias":  len(treinos_30),
            },
            "semanal":     semanal,
            "bodyBattery": bodyBattery,
            "sono":        sono,
        }
        ok = firebase_put(FIREBASE_PATH, payload, token)
        if ok:
            print(f"  ✅ Firebase atualizado com sucesso!")
            print(f"     {len(treinos)} treinos · {total_km} km total · {km_30} km nos últimos 30 dias")
        else:
            print("  ❌ Erro ao salvar no Firebase")
    except Exception as e:
        print(f"  ❌ Firebase: {e}")

    print("═" * 52)
    print("  Abra o app: luizkatiu62.github.io/treinos")
    print("═" * 52)


if __name__ == "__main__":
    main()
