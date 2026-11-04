import os, json, requests
k = os.environ["FIRECRAWL_API_KEY"]
H = {"Authorization": f"Bearer {k}", "Content-Type": "application/json"}
def scrape(url, **kw):
    r = requests.post("https://api.firecrawl.dev/v1/scrape", headers=H, json={"url": url, **kw}, timeout=90)
    r.raise_for_status(); return r.json()["data"]
for u in ["https://remoteok.com/remote-data-analyst-jobs", "https://himalayas.app/jobs/data-analyst", "https://weworkremotely.com/remote-jobs/search?term=data+analyst"]:
    try:
        d = scrape(u, formats=["markdown", "links"])
        links = [l for l in d.get("links", []) if "job" in l.lower() or "remote-jobs" in l.lower()]
        print(u, "| md chars:", len(d["markdown"]), "| job-ish links:", len(links))
        print("  sample:", links[:4])
    except Exception as e:
        print(u, "ERR", e)
