"""Stage 2 (plan A): plain markdown scrape of every job URL, 1 credit each, cached."""
import json
from concurrent.futures import ThreadPoolExecutor
import fc

urls = list(json.load(open(fc.ROOT / "data" / "job_urls.json")))
start = fc.credits_remaining()
with ThreadPoolExecutor(2) as ex:
    ok = 0
    for i, d in enumerate(ex.map(fc.scrape, urls), 1):
        ok += bool(d)
        if i % 100 == 0: print(f"{i}/{len(urls)} ok={ok}", flush=True)
print(f"done: {ok}/{len(urls)} | credits {start} -> {fc.credits_remaining()}")
