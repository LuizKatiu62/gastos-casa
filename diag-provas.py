# diagnostico temporario 2
import re, json, urllib.request, html, http.cookiejar
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def get(u):
    req = urllib.request.Request(u, headers={"User-Agent": UA, "Accept-Language": "en-CA,en;q=0.9,fr;q=0.8", "Accept": "text/html,*/*"})
    with op.open(req, timeout=30) as r: return r.read().decode("utf-8", "replace"), r.geturl()
for u in ["https://www.nyrr.org/tcsnycmarathon", "https://www.jecoursqc.com/en/beneva-quebec-city-marathon-presented-by-montellier/", "https://www.baa.org/races/boston-marathon"]:
    try: h, fu = get(u)
    except Exception as e: print("DIAG", u, "ERRO", repr(e)[:150]); continue
    t = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"(?is)<(script|style).*?</\1>", " ", h))))
    print("DIAG", u, fu, len(h))
    for m in re.finditer(r"2027", t):
        print("DIAG   ctx", t[max(0,m.start()-80):m.end()+40])
        if m.start() > 0 and len([1 for _ in range(1)]) and m.start() > 10**9: break
for u in ["https://running.life/running-calendar/canada/ontario", "https://running.life/running-calendar/canada/quebec",
          "https://running.life/running-calendar/canada/ontario/marathons", "https://running.life/running-calendar/canada/ontario/half-marathons",
          "https://findarace.com/ca/running/marathons/ontario", "https://findarace.com/ca/running/marathons/quebec", "https://findarace.com/ca/running/half-marathons/quebec"]:
    try: h, fu = get(u)
    except Exception as e: print("DIAG", u, "ERRO", repr(e)[:150]); continue
    print("DIAG", u, fu, len(h))
    for ld in re.findall(r'(?is)<script[^>]+application/ld\+json[^>]*>(.*?)</script>', h):
        try: j = json.loads(ld)
        except Exception as e: print("DIAG   ld invalido", ld[:200]); continue
        s = json.dumps(j, ensure_ascii=False)
        print("DIAG   ld", len(s), s[:1500])
