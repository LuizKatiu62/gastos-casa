# diagnostico temporario 3
import re, json, urllib.request, html, http.cookiejar
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def get(u):
    req = urllib.request.Request(u, headers={"User-Agent": UA, "Accept-Language": "en-CA,en;q=0.9", "Accept": "text/html,*/*"})
    with op.open(req, timeout=30) as r: return r.read().decode("utf-8", "replace")
def itens(h):
    out = []
    for ld in re.findall(r'(?is)<script[^>]+application/ld\+json[^>]*>(.*?)</script>', h):
        try: j = json.loads(ld)
        except Exception: continue
        if isinstance(j, dict) and j.get("@type") == "ItemList":
            for it in j.get("itemListElement", []):
                out.append(it.get("item", it))
    return out
for u in ["https://findarace.com/ca/running/marathons/ontario", "https://findarace.com/ca/running/marathons/ontario?page=2",
          "https://findarace.com/ca/running/half-marathons/ontario", "https://findarace.com/ca/running/half-marathons/ontario?page=2",
          "https://findarace.com/ca/running/marathons/quebec", "https://findarace.com/ca/running/half-marathons/quebec",
          "https://running.life/running-calendar/canada/quebec", "https://running.life/running-calendar/canada/quebec?page=2",
          "https://running.life/running-calendar/canada/ontario?distance=marathon", "https://running.life/fr/calendrier-course/canada/quebec/marathon"]:
    try: h = get(u)
    except Exception as e: print("DIAG", u, "ERRO", repr(e)[:120]); continue
    its = itens(h)
    print("DIAG", u, len(h), "itens", len(its), "| links event:", len(set(re.findall(r'href="(/ca/events/[^"?#]+)"', h))) or len(set(re.findall(r'href="([^"]*/event/[^"?#]+)"', h))))
    for it in its:
        offs = it.get("offers") or []
        if isinstance(offs, dict): offs = [offs]
        loc = it.get("location") or {}
        city = loc.get("name") if isinstance(loc, dict) else ""
        print("DIAG   ", it.get("startDate"), "|", it.get("name"), "|", city, "|", [o.get("name") for o in offs][:6], "|", (it.get("description") or "")[:90])
    if not its:
        for x in list(dict.fromkeys(re.findall(r'href="(/ca/events/[^"?#]+)"', h)))[:12]: print("DIAG   link", x)
