#!/usr/bin/env python3
"""
Provas do calendario oficial da RunNB -> treinos-v2/provas-runnb.json

Roda no GitHub Actions (provas-runnb.yml): toda segunda de manha e quando
o botao "Atualizar" da aba Provas do app pede. O celular nao consegue ler
o site da RunNB direto (o navegador bloqueia), o GitHub consegue.

O app junta este arquivo a lista curada (provas.json). Prova que ja existe
na lista curada (mesma data e nome parecido) fica com a versao curada.

Distancias: primeiro o que a pagina da prova diz em "Main distance" e
"Other distances"; se nao houver, o que da para tirar do titulo.
"""
import html
import json
import os
import re
import sys
import time
import urllib.request
from datetime import date, datetime, timezone

CAL = "https://secure.runnb.ca/calendar/"
SAIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "treinos-v2", "provas-runnb.json")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")
MESES = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
MAX_DETALHE = 90          # paginas de prova lidas por rodada


def log(*a):
    print("[provas-runnb]", *a, flush=True)


def baixar(url, tentativas=3):
    for t in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-CA,en;q=0.9"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            log(f"falhou {url} ({e}), tentativa {t + 1}")
            time.sleep(3 * (t + 1))
    return None


def texto(h):
    h = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", h)
    h = re.sub(r"(?i)<br\s*/?>|</(p|li|div|tr|h\d)>", "\n", h)
    h = re.sub(r"<[^>]+>", " ", h)
    h = html.unescape(h)
    return re.sub(r"[ \t\r\f\v]+", " ", h).strip()


def ler_data(s):
    """'Aug 1, 2027' | 'May 8-9, 2027' | 'May 30 - Jun 1, 2027' -> ISO do ultimo dia.
    Faixa longa (desafio de ano inteiro) -> None."""
    s = s.replace("–", "-").replace("—", "-")
    m = re.search(r"([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:\s*-\s*(?:([A-Za-z]{3})[a-z]*\.?\s+)?(\d{1,2}))?,?\s+(\d{4})", s)
    if not m:
        return None
    m1, d1, m2, d2, ano = m.groups()
    mes1 = MESES.get(m1.lower())
    mes2 = MESES.get((m2 or m1).lower())
    if not mes1 or not mes2:
        return None
    try:
        ini = date(int(ano), mes1, int(d1))
        fim = date(int(ano), mes2, int(d2 or d1))
    except ValueError:
        return None
    if (fim - ini).days > 4:
        return None
    return fim.isoformat()


def km_de(s):
    """distancias citadas num texto -> lista em km"""
    s = s.lower()
    out = set()
    meia = r"(half|demi|semi)[\s-]*marat\w*"
    if re.search(meia, s) or re.search(r"\b21\.1\s*k", s):
        out.add(21.1)
    resto = re.sub(meia, " ", s)
    if re.search(r"\bmarat(h)?on\b(?!\s*relay)", resto) or re.search(r"\b42\.2\s*k", s):
        out.add(42.2)
    for n, u in re.findall(r"(\d+(?:[.,]\d+)?)\s*(km|k\b|kilom|miler|mile|mi\b)", s):
        v = float(n.replace(",", "."))
        if u.startswith("mi"):
            v = round(v * 1.609, 1)
        if 0.5 <= v <= 400 and abs(v - 21.1) > 0.05 and abs(v - 42.2) > 0.05:
            out.add(round(v, 1))
    return sorted(out)


def calendario():
    h = baixar(CAL)
    if not h:
        log("ERRO: calendario nao baixou")
        sys.exit(1)
    log(f"calendario: {len(h)} bytes")
    provas = []
    for tr in re.findall(r"(?is)<tr[^>]*>(.*?)</tr>", h):
        a = re.search(r'(?is)<a[^>]+href="([^"]*/event/([^/"]+)/(\d+)/?)"[^>]*>(.*?)</a>', tr)
        if not a:
            continue
        tds = re.findall(r"(?is)<td[^>]*>(.*?)</td>", tr)
        if len(tds) < 3:
            continue
        data = ler_data(texto(tds[0]))
        if not data:
            continue
        url = html.unescape(a.group(1))
        if url.startswith("/"):
            url = "https://secure.runnb.ca" + url
        nome = texto(a.group(4)) or texto(tds[1])
        cidade = texto(tds[2])
        provas.append({"rid": a.group(3), "nome": nome, "cidade": cidade, "data": data, "url": url})
    # sem tabela? tenta pelos links soltos
    if not provas:
        log("AVISO: nenhuma linha <tr> com evento; html tem",
            len(re.findall(r"/event/[^/\"]+/\d+/", h)), "links de evento")
    vistos, unicas = set(), []
    for p in provas:
        if p["rid"] in vistos:
            continue
        vistos.add(p["rid"]); unicas.append(p)
    return unicas


def detalhe(p):
    h = baixar(p["url"])
    if not h:
        return
    t = texto(h)
    main = re.search(r"Main distance\s*:\s*([^\n]+)", t, re.I)
    other = re.search(r"Other distances?\s*:\s*([^\n]+)", t, re.I)
    ds = set()
    if main:
        ds.update(km_de(main.group(1)))
    if other:
        ds.update(km_de(other.group(1)))
    if ds:
        p["dists"] = sorted(ds)
    # "registration closed" aparece em pagina com inscricao aberta (prazo de
    # uma categoria, texto antigo), entao nao marco encerrada por isso.
    if re.search(r"\bcancel+ed\b", p["nome"] + " " + t[:600], re.I):
        p["cancelada"] = True


def main():
    hoje = date.today().isoformat()
    cal = [p for p in calendario() if p["data"] >= hoje]
    log(f"{len(cal)} provas futuras no calendario")
    for i, p in enumerate(cal[:MAX_DETALHE]):
        detalhe(p)
        time.sleep(0.6)
    saida = []
    for p in cal:
        if p.get("cancelada"):
            continue
        ds = p.get("dists") or km_de(p["nome"])
        saida.append({
            "id": "runnb-" + p["rid"],
            "nome": p["nome"],
            "cidade": p["cidade"] or "NB",
            "regiao": "atlantic",
            "data": p["data"],
            "dists": ds,
            "estado": p.get("estado", "aberta"),
            "url": p["url"],
            "fonte": "runnb",
            "nota": "Do calendário oficial da RunNB. Confirme data e inscrição no site antes de pagar.",
        })
    for p in saida[:12]:
        log(f"  {p['data']}  {p['nome']}  ({p['cidade']})  {p['dists']}")
    if not saida:
        log("ERRO: nenhuma prova lida; mantenho o arquivo anterior")
        sys.exit(1)

    antigo = None
    try:
        with open(SAIDA, encoding="utf-8") as f:
            antigo = json.load(f)
    except Exception:
        pass
    doc = {
        "_leia": "Gerado por sync-provas-runnb.py a partir de " + CAL + ". Nao edite: e regravado. "
                 "Para corrigir uma prova, ponha a versao certa em provas.json (a lista curada vence).",
        "atualizado": hoje,
        "geradoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "fonte": CAL,
        "provas": saida,
    }
    if antigo and antigo.get("provas") == saida:
        log("nada mudou nas provas; so a data de conferencia")
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    log(f"gravado {SAIDA}: {len(saida)} provas")


if __name__ == "__main__":
    main()
