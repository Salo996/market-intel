"""Stage 1: gather job-posting URLs from Himalayas listing pages (several role queries x pages)."""
import json, re
from concurrent.futures import ThreadPoolExecutor
import fc

QUERIES = ["data-analyst", "business-intelligence-analyst", "revenue-operations", "sales-operations",
           "automation", "analytics-engineer", "business-analyst", "operations-analyst",
           "customer-success-operations", "data-engineer", "ai-engineer", "marketing-operations"]
PAGES = 3
JOB = re.compile(r"^https://himalayas\.app/companies/[^/]+/jobs/[^/?#]+$")


def listing(args):
    q, p = args
    d = fc.scrape(f"https://himalayas.app/jobs/{q}" + (f"?page={p}" if p > 1 else ""), formats=("links",))
    return q, p, sorted({l for l in (d or {}).get("links", []) if JOB.match(l)})


if __name__ == "__main__":
    tasks = [(q, p) for q in QUERIES for p in range(1, PAGES + 1)]
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(listing, tasks))
    urls = {}
    for q, p, ls in res:
        print(f"{q:32s} p{p}: {len(ls)}")
        for l in ls:
            urls.setdefault(l, q)
    (fc.ROOT / "data" / "job_urls.json").write_text(json.dumps(urls, indent=1), encoding="utf-8")
    print(f"\nunique job URLs: {len(urls)} | credits used this run: {fc.credits_used}")
