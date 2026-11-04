"""Stage 2: structured extraction for every collected job URL (5 credits each, cached)."""
import json, sys
from concurrent.futures import ThreadPoolExecutor
import fc
from schema import SCHEMA, PROMPT

urls = json.load(open(fc.ROOT / "data" / "job_urls.json"))
limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(urls)
items = list(urls.items())[:limit]
start = fc.credits_remaining()


def one(kv):
    u, q = kv
    j = fc.extract(u, SCHEMA, PROMPT)
    return {"url": u, "query": q, **j} if j else {"url": u, "query": q, "_failed": True}


with ThreadPoolExecutor(5) as ex:
    rows = []
    for i, r in enumerate(ex.map(one, items), 1):
        rows.append(r)
        if i % 50 == 0:
            print(f"{i}/{len(items)}", flush=True)
(fc.ROOT / "data" / "jobs_extracted.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
failed = sum(1 for r in rows if r.get("_failed"))
end = fc.credits_remaining()
print(f"done: {len(rows)} rows, {failed} failed | credits {start} -> {end}")
