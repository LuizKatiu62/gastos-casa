#!/usr/bin/env python3
"""
Garmin → Treinos Firebase sync
Puxa atividades de corrida/caminhada do Garmin Connect e salva no Firebase.
"""

import json, getpass, sys, time, os
from datetime import datetime, timedelta

# ── Configuração ──────────────────────────────────────────────
GARMIN_EMAIL  = "lcdsilva@hotmail.com"
FIREBASE_DB   = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
FIREBASE_PATH = "treinos/luiz"
FIREBASE_KEY  = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"
DIAS_PARA_TRAS = 90   # quantos dias de histórico buscar
# ─────────────────────────────────────────────────────────────

try:
    from garminconnect import Garmin
except ImportError:
    print("Instale: pip3 install garminconnect")
    sys.exit(1)

try:
    import urllib.request as urlreq
except ImportError:
    import urllib2 as urlreq


def uid():
    import random, string
    return datetime.now().strftime("%Y%m%d%H%M%S") + ''.join(random.choices(string.ascii_lowercase, k=4))


def fmt_dur(secs):
    if not secs:
        return ""
    h = int(secs // 3600)
    m = int((secs % 3600) // 60)
    s = int(secs % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def calc_pace(dist_m, dur_secs):
    if not dist_m or not dur_secs or dist_m < 100:
        return ""
    dist_km = dist_m / 1000
    pace_secs = dur_secs / dist_km
    m = int(pace_secs // 60)
    s = int(pace_secs % 60)
    return f"{m}:{s:02d}"


# Mapeia tipo de atividade Garmin → tipo do app
TIPO_MAP = {
    "running":           "facil",
    "trail_running":     "trilha",
    "ultra_run":         "trilha",
    "treadmill_running": "indoor",
    "walking":           "caminhada",
    "hiking":            "trilha",
    "indoor_running":    "indoor",
    "virtual_run":       "corrida",
    "obstacle_run":      "intervalado",
    "track_running":     "intervalado",
}

# Atividades a ignorar (ciclismo, natação, etc.)
IGNORAR = {"cycling", "indoor_cycling", "swimming", "strength_training", "yoga",
           "elliptical", "rowing", "mountain_biking", "virtual_ride"}


def garmin_to_treino(act):
    tipo_garmin = (act.get("activityType", {}) or {}).get("typeKey", "running").lower()

    if tipo_garmin in IGNORAR:
        return None

    tipo = TIPO_MAP.get(tipo_garmin, "facil")

    dist_m   = act.get("distance", 0) or 0
    dur_secs = act.get("duration", 0) or 0
    fc_med   = int(act.get("averageHR", 0) or 0)
    fc_max   = int(act.get("maxHR", 0) or 0)

    # Data no formato YYYY-MM-DD
    start_raw = act.get("startTimeLocal") or act.get("startTimeGMT") or ""
    data = start_raw[:10] if start_raw else ""

    # Garmin ID como referência
    garmin_id = str(act.get("activityId", ""))

    return {
        "id":        "gm-" + garmin_id,
        "tipo":      tipo,
        "data":      data,
        "distancia": round(dist_m / 1000, 2),
        "duracao":   fmt_dur(dur_secs),
        "pace":      calc_pace(dist_m, dur_secs),
        "fcMed":     fc_med,
        "fcMax":     fc_max,
        "esforco":   5,
        "notas":     act.get("activityName", ""),
        "garminId":  garmin_id,
    }


def firebase_auth():
    """Autentica anonimamente no Firebase e retorna o idToken."""
    url  = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_KEY}"
    body = json.dumps({"returnSecureToken": True}).encode()
    req  = urlreq.Request(url, data=body)
    req.add_header("Content-Type", "application/json")
    with urlreq.urlopen(req, timeout=10) as r:
        return json.loads(r.read()).get("idToken", "")


def firebase_get(token):
    url = f"{FIREBASE_DB}/{FIREBASE_PATH}.json?auth={token}"
    try:
        with urlreq.urlopen(urlreq.Request(url), timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  ⚠️  Não foi possível ler Firebase: {e}")
        return None


def firebase_set(data, token):
    url  = f"{FIREBASE_DB}/{FIREBASE_PATH}.json?auth={token}"
    body = json.dumps(data).encode()
    req  = urlreq.Request(url, data=body, method="PUT")
    req.add_header("Content-Type", "application/json")
    with urlreq.urlopen(req, timeout=10) as r:
        return r.status == 200


def main():
    print("═" * 50)
    print("  Garmin → Treinos sync")
    print("═" * 50)
    print(f"  Conta: {GARMIN_EMAIL}")
    print(f"  Período: últimos {DIAS_PARA_TRAS} dias")
    print()

    senha = input("  Senha do Garmin Connect: ")
    if not senha:
        print("Senha vazia. Cancelado.")
        sys.exit(1)

    # ── Login (com cache de sessão e suporte a MFA) ──
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
            print("     Garmin bloqueou temporariamente. Aguarde 10 min e tente de novo.")
        elif "401" in msg or "password" in msg.lower():
            print("     Senha incorreta ou conta bloqueada. Tente fazer login em connect.garmin.com primeiro.")
        sys.exit(1)

    # ── Buscar atividades ──
    data_fim  = datetime.today()
    data_ini  = data_fim - timedelta(days=DIAS_PARA_TRAS)
    print(f"\n  Buscando atividades de {data_ini:%d/%m/%Y} a {data_fim:%d/%m/%Y}...")

    try:
        atividades = api.get_activities_by_date(
            data_ini.strftime("%Y-%m-%d"),
            data_fim.strftime("%Y-%m-%d")
        )
        print(f"  📋 {len(atividades)} atividades encontradas no Garmin")
    except Exception as e:
        print(f"  ❌ Erro ao buscar atividades: {e}")
        sys.exit(1)

    # ── Converter ──
    novos = []
    ignorados = 0
    for act in atividades:
        t = garmin_to_treino(act)
        if t:
            novos.append(t)
        else:
            ignorados += 1

    print(f"  🏃 {len(novos)} treinos de corrida/caminhada")
    print(f"  ⏭️  {ignorados} atividades ignoradas (ciclismo, natação, etc.)")

    if not novos:
        print("\n  Nenhum treino para importar.")
        return

    # ── Salvar arquivo de importação ──
    output = os.path.expanduser("~/garmin-import.json")
    payload = { "treinos": novos }
    with open(output, "w") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\n  ✅ {len(novos)} treinos salvos em:")
    print(f"     {output}")
    print("\n  Agora abra o app Treinos e use o botão Importar Garmin.")
    print("═" * 50)


if __name__ == "__main__":
    main()
