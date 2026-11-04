"""Stage 2b: deterministic parser for scraped Himalayas job pages (no LLM, auditable).
Text after '### Browse similar jobs' is discarded, so other postings never leak in."""
import json, re
from datetime import datetime
import fc
from transform import TAXONOMY, ALIAS

# aliases too ambiguous to trust in free text (still accepted when they come from the site's own skill tags)
TEXT_STOP = {"r", "ml", "make", "rest", "rag", "outreach", "segment", "heap", "spark", "oracle", "notion", "stitch", "clari",
             "api", "apis", "json", "s3", "lambda", "git", "claude", "gong"}
TEXT_RX = {a: re.compile(r"(?<![\w+#])" + re.escape(a) + r"(?![\w+#])", re.I) for a in ALIAS if a not in TEXT_STOP and len(a) > 1}
AI_RX = re.compile(r"\b(ai|a\.i\.|artificial intelligence|llms?|gen ?ai|generative ai|chatgpt|openai|copilot|claude|machine learning)\b", re.I)
SENIORITY = [("director", r"director|head of|vp\b"), ("manager", r"manager"), ("lead", r"\blead\b|principal|staff"),
             ("senior", r"senior|sr\.?\b"), ("junior", r"junior|jr\.?\b|entry|associate"), ("intern", r"intern")]
CUR = {"$": "USD", "€": "EUR", "£": "GBP", "ZAR": "ZAR", "CAD": "CAD", "AUD": "AUD", "USD": "USD", "EUR": "EUR", "GBP": "GBP"}


def section(md, head):
    m = re.search(rf"### {re.escape(head)}\s*\n+(.*?)(?=\n### |\n## |\Z)", md, re.S)
    return m.group(1) if m else ""


def parse_date(s):
    try: return datetime.strptime(s.strip(), "%b %d, %Y").strftime("%Y-%m-%d")
    except ValueError: return ""


def parse(url, md, query):
    desc = md.split("## Apply now")[0]                       # the posting text itself
    body = re.split(r"### Browse similar jobs", md)[0]       # posting + its own metadata; drops 'similar jobs' noise
    title = (re.search(r"^# (.+)$", body, re.M) or [None, ""])[1].strip()
    slug = re.search(r"/companies/([^/]+)/jobs/", url).group(1)
    comp = re.search(r"\[([^\]]+)\]\(https://himalayas\.app/companies/" + re.escape(slug) + r"\)", body)
    company = comp.group(1) if comp else slug
    posted = parse_date(section(body, "Posted on"))
    jtype = re.sub(r"\[|\]\([^)]*\)", "", section(body, "Job type")).strip().lower()
    levels = [x.lower() for x in re.findall(r"\[([^\]]+)\]\(https://himalayas\.app/jobs/(?:entry-level|junior|mid-level|senior|manager|director|executive|intern)", section(body, "Experience level"))]
    sen = next((k for k, rx in SENIORITY if any(re.search(rx, l) for l in levels)), None) \
        or next((k for k, rx in SENIORITY if re.search(rx, title, re.I)), "mid" if levels else "unspecified")
    countries = re.findall(r"\)([A-Z][\w .'-]+)\]\(https://himalayas\.app/jobs/countries/", section(body, "Location requirements"))
    hdr = re.search(r"\.svg\)([^\n]*?)(?: only)?\n", body[:3500])
    if len(countries) > 25 or not countries: loc = "Worldwide" if (not hdr or "worldwide" in hdr.group(1).lower() or len(countries) > 25) else hdr.group(1).strip() + " only"
    else: loc = ", ".join(countries[:6]) + (" only" if len(countries) <= 6 else "")
    # salary: only trust the posting's own block (before Apply now)
    sal = re.search(r"Salary:\s*([^\d\n]*?)\s*([\d,.]+)\s*([KkMm])?\s*[–-]\s*[^\d\n]*?\s*([\d,.]+)\s*([KkMm])?\s*(?:per|/)\s*(year|month|hour)", body)
    smin = smax = cur = per = None
    if sal:
        f = lambda n, u: float(n.replace(",", "")) * (1000 if u and u.lower() == "k" else 1)
        smin, smax, per = f(sal.group(2), sal.group(3)), f(sal.group(4), sal.group(5)), sal.group(6)
        cur = next((v for k, v in CUR.items() if k in sal.group(1)), "USD")
    tags = re.findall(r"\[([^\]]+)\]\(https://himalayas\.app/jobs/[a-z0-9-]+\)", section(body, "Skills"))
    desc = re.sub(r"\]\([^)]*\)", "]", desc)
    found = {ALIAS[a][0] for a, rx in TEXT_RX.items() if rx.search(desc)}
    yrs = [int(x) for x in re.findall(r"(\d{1,2})\s*\+?\s*(?:years|yrs)", desc, re.I) if int(x) <= 20]
    return {"url": url, "query": query, "title": title, "company": company, "seniority": sen,
            "employment_type": {"full time": "full_time", "part time": "part_time", "contract": "contract", "internship": "internship"}.get(jtype, "unspecified"),
            "location_restriction": loc, "salary_min": smin, "salary_max": smax, "salary_currency": cur, "salary_period": per or "unspecified",
            "posted_date": posted, "skills_tools": sorted(found | set(tags)), "years_experience_min": min(yrs) if yrs else None,
            "mentions_ai_tools": bool(AI_RX.search(desc))}


if __name__ == "__main__":
    urls = json.load(open(fc.ROOT / "data" / "job_urls.json"))
    rows, miss = [], 0
    for u, q in urls.items():
        d = fc.scrape(u)  # cache hit; costs credits only if missing
        if not d or "markdown" not in d: miss += 1; continue
        r = parse(u, d["markdown"], q)
        if r["title"]: rows.append(r)
    (fc.ROOT / "data" / "jobs_extracted.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    sal = sum(1 for r in rows if r["salary_min"]); tl = sum(1 for r in rows if r["posted_date"])
    print(f"parsed {len(rows)}/{len(urls)} (missing {miss}) | salary {sal} | dated {tl} | credits used this run {fc.credits_used}")
