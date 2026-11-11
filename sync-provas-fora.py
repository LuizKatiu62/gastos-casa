#!/usr/bin/env python3
"""
Provas fora de New Brunswick -> treinos-v2/provas-fora.json

Duas fontes, as duas lidas pelo GitHub Actions (o celular nao consegue):

1. PROVAS-ALVO: as grandes maratonas que o Luiz acompanha. O robo abre o
   site oficial de cada uma e procura a data da proxima edicao, no mes em
   que ela costuma acontecer. Se o site mudar e a data sumir, a prova fica
   com a ultima leitura boa (o arquivo anterior) e o log avisa.

2. ONTARIO E QUEBEC: o calendario do running.life (dados estruturados,
   schema.org), so meia e maratona de rua. Trilha, raquete de neve,
   backyard, ultra e revezamento ficam de fora.

Situacao da inscricao: so e marcada quando o site diz com clareza
("sold out", "register for 2027"...). No resto fica "confira no site".
"""
import html
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone

SAIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "treinos-v2", "provas-fora.json")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")

# mes: em que mes a prova costuma cair (filtra datas de noticias e prazos)
ALVOS = [
    {"k": "boston",   "nome": "Boston Marathon",                 "cidade": "Boston, MA",      "regiao": "usa",
     "url": "https://www.baa.org/races/boston-marathon",           "mes": 4,  "dists": [42.2]},
    {"k": "nyc",      "nome": "TCS New York City Marathon",      "cidade": "Nova York, NY",   "regiao": "usa",
     "url": "https://www.nyrr.org/tcsnycmarathon",                 "mes": 11, "dists": [42.2]},
    {"k": "phila",    "nome": "TIAA Philadelphia Marathon",      "cidade": "Filadélfia, PA",  "regiao": "usa",
     "url": "https://www.philadelphiamarathon.com",                "mes": 11, "dists": [8, 21.1, 42.2]},
    {"k": "chicago",  "nome": "Bank of America Chicago Marathon", "cidade": "Chicago, IL",    "regiao": "usa",
     "url": "https://www.chicagomarathon.com",                     "mes": 10, "dists": [42.2]},
    {"k": "ottawa",   "nome": "Tamarack Ottawa Race Weekend",    "cidade": "Ottawa, ON",      "regiao": "ontario",
     "url": "https://www.runottawa.ca",                            "mes": 5,  "dists": [2, 5, 10, 21.1, 42.2]},
    {"k": "toronto",  "nome": "TCS Toronto Waterfront Marathon", "cidade": "Toronto, ON",     "regiao": "ontario",
     "url": "https://www.torontowaterfrontmarathon.com",           "mes": 10, "dists": [5, 21.1, 42.2]},
    {"k": "montreal", "nome": "Marathon Beneva de Montréal",     "cidade": "Montréal, QC",    "regiao": "quebec",
     "url": "https://mtlmarathon.com",                             "mes": 9,  "dists": [5, 10, 21.1, 42.2]},
    {"k": "quebec",   "nome": "Marathon Beneva de Québec",       "cidade": "Québec, QC",      "regiao": "quebec",
     "url": "https://www.jecoursqc.com/en/beneva-quebec-city-marathon-presented-by-montellier/", "mes": 10,
     "dists": [5, 10, 21.1, 42.2]},
]

AGREGADOR = [  # (url base, regiao)
    ("https://running.life/running-calendar/canada/ontario", "ontario"),
    ("https://running.life/running-calendar/canada/quebec", "quebec"),
]
MAX_PAGINAS = 25
FORA_AGREG = re.compile(r"mini marathon|miniest|trail|sentier|snowshoe|raquette|backyard|ultra|relay|relais|ski|triathlon|duathlon|"
                        r"virtual|virtuel|obstacle|stairs|escalier|hike|randonn|swim|bike|v[eé]lo|neige|snow|winter|hivern|polar|cross[ -]?country", re.I)

MESES = {}
for i, ns in enumerate([
        ("jan", "january", "janvier", "janv"), ("feb", "february", "février", "fevrier", "fév", "fev"),
        ("mar", "march", "mars"), ("apr", "april", "avril", "avr"), ("may", "mai"),
        ("jun", "june", "juin"), ("jul", "july", "juillet", "juil"), ("aug", "august", "août", "aout"),
        ("sep", "sept", "september", "septembre"), ("oct", "october", "octobre"),
        ("nov", "november", "novembre"), ("dec", "december", "décembre", "decembre", "déc")]):
    for n in ns:
        MESES[n] = i + 1
MES_RE = "|".join(sorted((re.escape(m) for m in MESES), key=len, reverse=True))

op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def log(*a):
    print("[provas-fora]", *a, flush=True)


def baixar(url, tentativas=3):
    for t in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*",
                                                       "Accept-Language": "en-CA,en;q=0.9,fr;q=0.8"})
            with op.open(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            log(f"falhou {url} ({str(e)[:90]}), tentativa {t + 1}")
            time.sleep(3 * (t + 1))
    return None


def texto(h):
    h = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", h)
    h = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", html.unescape(h)).strip()


def km_de(s):
    s = s.lower()
    out = set()
    meia = r"(half|demi|semi)[\s-]*marat\w*"
    if re.search(meia, s) or re.search(r"\b21[.,]1\s*k", s) or re.search(r"\b21\s*k\b", s):
        out.add(21.1)
    resto = re.sub(meia, " ", s)
    if re.search(r"\bmarat(h)?on\b(?!\s*(relay|relais|kids|des enfants))", resto) or re.search(r"\b42[.,]2\s*k", s):
        out.add(42.2)
    for n, u in re.findall(r"(\d+(?:[.,]\d+)?)\s*(km|k\b|kilom|miler|mile|mi\b)", s):
        v = float(n.replace(",", "."))
        if u.startswith("mi"):
            v = round(v * 1.609, 1)
        if 0.5 <= v <= 60 and abs(v - 21.1) > 0.15 and abs(v - 42.2) > 0.15 and abs(v - 21) > 0.01 and abs(v - 42) > 0.01:
            out.add(round(v, 1))
    return sorted(out)


def datas_no_texto(t):
    """todas as datas do texto -> lista de date (ultimo dia de cada faixa)"""
    out = []
    # en: "Apr 19th, 2027" | "May 29-30, 2027" | "Oct. 1 TO 3, 2027" | "October 16-17, 2027"
    for m in re.finditer(r"\b(" + MES_RE + r")\.?\s+(\d{1,2})(?:st|nd|rd|th)?"
                         r"(?:\s*(?:-|–|to|au|&|and)\s*(\d{1,2})(?:st|nd|rd|th)?)?,?\s+(20\d\d)\b", t, re.I):
        mes = MESES.get(m.group(1).lower())
        dia = int(m.group(3) or m.group(2))
        try:
            out.append(date(int(m.group(4)), mes, dia))
        except (ValueError, TypeError):
            pass
    # fr: "19 septembre 2027" | "1er au 3 octobre 2027"
    for m in re.finditer(r"\b(\d{1,2})(?:er)?(?:\s*(?:-|–|au|et)\s*(\d{1,2}))?\s+(" + MES_RE + r")\.?\s+(20\d\d)\b", t, re.I):
        mes = MESES.get(m.group(3).lower())
        dia = int(m.group(2) or m.group(1))
        try:
            out.append(date(int(m.group(4)), mes, dia))
        except (ValueError, TypeError):
            pass
    return out


def ler_alvo(a, hoje):
    h = baixar(a["url"])
    if not h:
        return None, "site nao respondeu"
    t = texto(h)
    limite = hoje + timedelta(days=600)
    cands = [d for d in datas_no_texto(t)
             if hoje <= d <= limite and (abs(d.month - a["mes"]) <= 1)]
    # json-ld tambem conta
    for sd in re.findall(r'"startDate"\s*:\s*"(\d{4}-\d{2}-\d{2})', h):
        d = date.fromisoformat(sd)
        if hoje <= d <= limite and abs(d.month - a["mes"]) <= 1:
            cands.append(d)
    if not cands:
        return None, "nenhuma data futura no mes esperado"
    # a data mais citada; empate -> a mais proxima
    cont = {}
    for d in cands:
        cont[d] = cont.get(d, 0) + 1
    d = sorted(cont, key=lambda x: (-cont[x], x))[0]
    ano = str(d.year)
    estado = "confira"
    janela = t.lower()
    if re.search(r"(" + ano + r"[^.]{0,80}sold out|sold out[^.]{0,80}" + ano + r")", janela):
        estado = "esgotada"
    elif re.search(r"register (now )?for (the )?" + ano + r"|" + ano + r" registration (is )?(now )?open|"
                   r"inscription " + ano + r"|inscriptions? " + ano + r"|register now", janela):
        estado = "aberta"
    return {"data": d.isoformat(), "estado": estado}, "ok"


def agregador(hoje):
    limite = hoje + timedelta(days=500)
    out = []
    for base, regiao in AGREGADOR:
        n_pag = 0
        for pg in range(1, MAX_PAGINAS + 1):
            h = baixar(base + ("" if pg == 1 else f"?page={pg}"))
            if not h:
                break
            itens = []
            for ld in re.findall(r'(?is)<script[^>]+application/ld\+json[^>]*>(.*?)</script>', h):
                try:
                    j = json.loads(ld)
                except Exception:
                    continue
                if isinstance(j, dict) and j.get("@type") == "ItemList":
                    itens += [x.get("item", x) for x in j.get("itemListElement", [])]
            if not itens:
                break
            n_pag += 1
            ultimo = None
            for it in itens:
                sd = str(it.get("startDate", ""))[:10]
                try:
                    d = date.fromisoformat(sd)
                except ValueError:
                    continue
                ultimo = d
                if d < hoje or d > limite:
                    continue
                nome = html.unescape(str(it.get("name", ""))).strip()
                desc = html.unescape(str(it.get("description", "")))
                if FORA_AGREG.search(nome) or FORA_AGREG.search(desc[:160]):
                    continue
                ds = [x for x in km_de(nome + " . " + desc) if x >= 2]
                if 21.1 not in ds and 42.2 not in ds:
                    continue
                loc = it.get("location") or {}
                adr = loc.get("address") if isinstance(loc, dict) else {}
                cid = (adr.get("addressLocality") if isinstance(adr, dict) else "") or (loc.get("name") if isinstance(loc, dict) else "")
                uf = {"ontario": "ON", "quebec": "QC"}[regiao]
                slug = re.sub(r"[^a-z0-9]+", "-", str(it.get("url", nome)).lower().split("/event/")[-1]).strip("-")[:60]
                out.append({
                    "id": "rl-" + slug + "-" + d.isoformat()[:4],
                    "nome": nome, "cidade": f"{cid}, {uf}" if cid else uf, "regiao": regiao,
                    "data": d.isoformat(), "dists": ds, "estado": "confira",
                    "url": it.get("url") or base, "fonte": "agregador",
                    "nota": (desc[:220] + ("…" if len(desc) > 220 else "")) +
                            " (Lista do running.life — confira data e inscrição no site oficial.)",
                })
            if ultimo and ultimo > limite:
                break
            time.sleep(0.8)
        log(f"{base}: {n_pag} paginas lidas")
    vistos, unicas = set(), []
    for p in out:
        if p["id"] in vistos:
            continue
        vistos.add(p["id"]); unicas.append(p)
    return unicas


def main():
    hoje = date.today()
    antigo = {}
    try:
        with open(SAIDA, encoding="utf-8") as f:
            antigo = json.load(f)
    except Exception:
        pass
    alvos_antigos = {p.get("alvo"): p for p in antigo.get("provas", []) if p.get("alvo")}

    provas, avisos = [], []
    for a in ALVOS:
        r, motivo = ler_alvo(a, hoje)
        if r:
            log(f"alvo {a['k']}: {r['data']} ({r['estado']})")
            provas.append({
                "id": f"alvo-{a['k']}-{r['data'][:4]}", "alvo": a["k"], "nome": a["nome"], "cidade": a["cidade"],
                "regiao": a["regiao"], "data": r["data"], "dists": a["dists"], "estado": r["estado"],
                "url": a["url"], "fonte": "alvo", "lidoEm": hoje.isoformat(),
                "nota": "Data lida no site oficial em " + hoje.strftime("%d/%m/%Y") + ".",
            })
        else:
            velho = alvos_antigos.get(a["k"])
            avisos.append(f"{a['k']}: {motivo}")
            log(f"AVISO alvo {a['k']}: {motivo}" + (" — mantenho a leitura anterior" if velho else ""))
            if velho and velho.get("data", "") >= hoje.isoformat():
                provas.append(velho)

    ag = agregador(hoje)
    log(f"agregador: {len(ag)} meias/maratonas em Ontario e Quebec")
    for p in ag[:40]:
        log(f"  {p['data']}  {p['nome']}  ({p['cidade']})  {p['dists']}")
    provas += ag

    if not provas:
        log("ERRO: nada lido; mantenho o arquivo anterior")
        sys.exit(1)
    doc = {
        "_leia": "Gerado por sync-provas-fora.py. Nao edite: e regravado toda semana. "
                 "Para corrigir uma prova, ponha a versao certa em provas.json (a lista curada vence).",
        "atualizado": hoje.isoformat(),
        "geradoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "avisos": avisos,
        "provas": provas,
    }
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    log(f"gravado {SAIDA}: {len(provas)} provas, {len(avisos)} aviso(s)")


if __name__ == "__main__":
    main()
