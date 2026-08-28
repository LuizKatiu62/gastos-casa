#!/usr/bin/env python3
"""
Pressao arterial: do app Saude do iPhone para o Firebase.

Por que este arquivo existe. O app Saude nao tem nuvem nem endereco na
internet — os dados ficam criptografados dentro do iPhone, e a Apple so
deixa sair por um app nativo ou pelos Atalhos. O app de treinos e uma
pagina web, entao a unica ponte possivel e o Atalho.

O caminho e este:

    Omron  ->  app Saude  ->  Atalho do iPhone  ->  ESTE ROBO  ->  app

O Atalho faz UMA requisicao, para o GitHub, com o token que o Luiz ja
tem guardado no app para o Sync Garmin. Quem fala com o Firebase e este
robo, usando os secrets do repositorio. Assim a senha do Firebase nunca
sai para o telefone.

Formato aceito no payload (os dois funcionam):

    {"sis":128,"dia":78,"pul":58,"em":"2026-08-27T09:15"}

    {"medidas":[{"sis":128,"dia":78,"pul":58,"em":"2026-08-27T09:15"},
                {"sis":118,"dia":74,"em":"2026-08-26T21:40"}]}

O campo "pos" (deitado / sentado / em pe) e opcional e o Atalho nao tem
como saber — quem quiser marcar, marca depois pelo proprio app. E a
diferenca entre deitado e em pe que responde se a pressao cai ao
levantar, entao ela vale a pena nas medidas de investigacao.

Grava com PATCH. PUT substituiria o no inteiro e apagaria o historico —
ja aconteceu neste repositorio com o ramo do Hevy, e nao se repete.
"""

import json, os, sys
from datetime import datetime
import urllib.request as urlreq
import urllib.error

FIREBASE_DB   = "https://gastos-casa-7f431-default-rtdb.firebaseio.com"
FIREBASE_PATH = "treinos_coach_v2/luiz/pressao"
FIREBASE_KEY  = "AIzaSyB0hO4m0XPRqmrYegHtkV4KawJA2py1glU"


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# ── leitura do payload ────────────────────────────────────────────────
def normalizar(bruto):
    """Aceita uma medida ou uma lista, e devolve so o que faz sentido.

    O Atalho manda numero como texto com frequencia, entao converto
    tudo. Medida sem os dois numeros e descartada: meia medida nao
    serve para nada e sujaria o grafico.
    """
    if isinstance(bruto, dict) and "medidas" in bruto:
        itens = bruto["medidas"]
    elif isinstance(bruto, list):
        itens = bruto
    else:
        itens = [bruto]

    out = {}
    for it in itens:
        if not isinstance(it, dict):
            continue
        try:
            sis = int(float(it.get("sis") or it.get("sistolica") or 0))
            dia = int(float(it.get("dia") or it.get("diastolica") or 0))
        except (TypeError, ValueError):
            continue
        if not sis or not dia:
            continue
        # faixas largas: barram erro de digitacao, nao julgam a medida
        if not (60 <= sis <= 260) or not (30 <= dia <= 160) or dia >= sis:
            log(f"  descartada, fora do que o aparelho mede: {sis}/{dia}")
            continue

        em = str(it.get("em") or it.get("data") or "")[:16]
        if len(em) < 16:
            em = datetime.now().strftime("%Y-%m-%dT%H:%M")

        m = {"sis": sis, "dia": dia, "em": em}
        try:
            pul = int(float(it.get("pul") or it.get("pulso") or 0))
            if pul:
                m["pul"] = pul
        except (TypeError, ValueError):
            pass
        pos = str(it.get("pos") or it.get("posicao") or "").strip()
        if pos:
            m["pos"] = pos

        out[em] = m          # a hora e a chave: reenviar nao duplica
    return out


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


def firebase_patch(dados, token):
    """PATCH, nunca PUT: junta as medidas novas as que ja estao la."""
    url = f"{FIREBASE_DB}/{FIREBASE_PATH}.json?auth={token}"
    body = json.dumps(dados, ensure_ascii=False).encode()
    req = urlreq.Request(url, data=body, method="PATCH",
                         headers={"Content-Type": "application/json"})
    with urlreq.urlopen(req, timeout=30) as r:
        return r.status in (200, 204)


# ── principal ─────────────────────────────────────────────────────────
def main():
    log("━━━ Pressao: Saude → Firebase ━━━")
    # Dois jeitos de receber. O primeiro existe porque montar JSON
    # aninhado dentro do app Atalhos e sofrido: campos soltos evitam
    # isso por completo. O segundo serve para mandar varias medidas de
    # uma vez, por exemplo ao trazer o historico do app Saude.
    sis = os.environ.get("SIS", "").strip()
    dia = os.environ.get("DIA", "").strip()
    cru = os.environ.get("PAYLOAD", "").strip()

    if sis and dia:
        bruto = {"sis": sis, "dia": dia}
        if os.environ.get("PUL", "").strip():
            bruto["pul"] = os.environ["PUL"].strip()
        if os.environ.get("EM", "").strip():
            bruto["em"] = os.environ["EM"].strip()
        log("Recebido em campos soltos.")
    elif cru:
        try:
            bruto = json.loads(cru)
        except json.JSONDecodeError as e:
            log(f"O payload nao e JSON valido: {e}")
            log(f"Recebido: {cru[:300]}")
            raise SystemExit(1)
        log("Recebido como JSON.")
    else:
        raise SystemExit("Nao veio medida nenhuma: mande sis e dia, ou payload.")

    medidas = normalizar(bruto)
    if not medidas:
        raise SystemExit("Nenhuma medida aproveitavel no payload.")

    for em in sorted(medidas):
        m = medidas[em]
        log(f"  {em}  {m['sis']}/{m['dia']}"
            + (f"  {m['pul']} bpm" if m.get("pul") else "")
            + (f"  {m['pos']}" if m.get("pos") else ""))

    token = firebase_token()
    if firebase_patch(medidas, token):
        log(f"Gravadas {len(medidas)} medida(s).")
    else:
        raise SystemExit("Erro ao gravar no Firebase")
    log("━━━ concluido ━━━")


if __name__ == "__main__":
    main()
