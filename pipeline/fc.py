"""Tiny Firecrawl client with an on-disk cache so no URL is ever paid for twice."""
import hashlib, json, os, threading, time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "data" / "raw"
CACHE.mkdir(parents=True, exist_ok=True)
KEY = os.environ.get("FIRECRAWL_API_KEY")
if not KEY:
    raise SystemExit("FIRECRAWL_API_KEY is not set")
H = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
credits_used = 0
_lock = threading.Lock()
_last = [0.0]
MIN_GAP = 2.3  # seconds between requests: the plan allows ~32 req/min


def _throttle():
    with _lock:
        wait = _last[0] + MIN_GAP - time.time()
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()


def scrape(url, formats=("markdown",), retries=6):
    """Scrape one URL (1 credit). Returns the Firecrawl `data` dict, or None on failure."""
    global credits_used
    f = CACHE / (hashlib.sha1((url + "|" + ",".join(formats)).encode()).hexdigest() + ".json")
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    if os.environ.get("CACHE_ONLY"):
        return None
    for attempt in range(retries + 1):
        try:
            _throttle()
            r = requests.post("https://api.firecrawl.dev/v1/scrape", headers=H,
                              json={"url": url, "formats": list(formats)}, timeout=90)
            if r.status_code == 429:
                time.sleep(15 * (attempt + 1)); continue
            if r.status_code >= 400:
                return None
            data = r.json().get("data")
            if data:
                credits_used += 1
                f.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            return data
        except requests.RequestException:
            time.sleep(2)
    return None


def extract(url, schema, prompt, retries=2):
    """LLM structured extraction via Firecrawl JSON mode. Cached like scrape()."""
    global credits_used
    f = CACHE / (hashlib.sha1((url + "|json|" + json.dumps(schema, sort_keys=True)).encode()).hexdigest() + ".json")
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    for attempt in range(retries + 1):
        try:
            r = requests.post("https://api.firecrawl.dev/v1/scrape", headers=H, timeout=120,
                              json={"url": url, "formats": ["json"], "onlyMainContent": True,
                                    "jsonOptions": {"schema": schema, "prompt": prompt}})
            if r.status_code == 429:
                time.sleep(5 * (attempt + 1)); continue
            if r.status_code >= 400:
                return None
            j = (r.json().get("data") or {}).get("json")
            if j:
                f.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")
            return j
        except requests.RequestException:
            time.sleep(2)
    return None


def credits_remaining():
    r = requests.get("https://api.firecrawl.dev/v1/team/credit-usage", headers=H, timeout=30)
    return r.json().get("data", {}).get("remaining_credits") if r.ok else None
