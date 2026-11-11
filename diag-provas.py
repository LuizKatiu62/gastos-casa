# diagnostico temporario: o que cada fonte devolve para um robo
import re, json, urllib.request, html
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
URLS = """https://www.baa.org/races/boston-marathon
https://www.nyrr.org/tcsnycmarathon
https://www.philadelphiamarathon.com
https://www.chicagomarathon.com
https://runottawa.ca
https://www.torontowaterfrontmarathon.com
https://mtlmarathon.com
https://marathonquebec.com
https://www.runguides.com/ontario/runs
https://www.runguides.com/quebec/runs
https://www.runguides.com/ontario/marathons
https://www.runguides.com/ontario/half-marathons
https://running.life/running-calendar/canada/ontario
https://www.findarace.com/ca/running/marathons/ontario
https://www.findarace.com/ca/running/half-marathons/ontario
https://raceroster.com/search?q=marathon&l=Ontario""".split()
for u in URLS:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": UA, "Accept-Language": "en-CA,en;q=0.9,fr;q=0.8"})
        with urllib.request.urlopen(req, timeout=30) as r:
            h = r.read().decode("utf-8", "replace"); fu = r.geturl(); st = r.status
    except Exception as e:
        print("DIAG", u, "ERRO", repr(e)[:150]); continue
    ld = re.findall(r'(?is)<script[^>]+application/ld\+json[^>]*>(.*?)</script>', h)
    sd = re.findall(r'"startDate"\s*:\s*"([^"]+)"', h)
    t = re.sub(r"<[^>]+>", " ", re.sub(r"(?is)<(script|style).*?</\1>", " ", h)); t = html.unescape(re.sub(r"\s+", " ", t))
    datas = re.findall(r"(?:January|February|March|April|May|June|July|August|September|October|November|December|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{1,2},?\s+20\d\d|\d{1,2}(?:er)?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d", t, re.I)
    reg = re.findall(r"[^.]{0,60}(?:registration|inscription|register|sold out|lottery|drawing|inscri)[^.]{0,60}", t, re.I)[:4]
    print("DIAG", u, st, fu, len(h), "ld", len(ld), "startDate", sd[:8])
    print("DIAG   datas", list(dict.fromkeys(datas))[:10])
    for x in reg: print("DIAG   reg", x.strip()[:140])
