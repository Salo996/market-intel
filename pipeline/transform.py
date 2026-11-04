"""Stage 3: normalize extracted jobs -> dashboard.json (React) + star-schema CSVs (Power BI)."""
import csv, json, re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_CSV = ROOT / "data" / "powerbi"
OUT_CSV.mkdir(parents=True, exist_ok=True)

# canonical tool -> (category, aliases). Anything not matched is treated as a concept and ignored.
TAXONOMY = {
    "SQL": ("Language", ["sql", "t-sql", "tsql", "pl/sql", "mysql", "postgresql", "postgres", "sql server"]),
    "Python": ("Language", ["python", "pandas", "numpy", "pyspark"]),
    "R": ("Language", ["r programming", "r language", "rstudio"]),
    "Excel": ("Spreadsheet", ["excel", "microsoft excel", "advanced excel", "vba", "google sheets", "spreadsheets"]),
    "Power BI": ("BI", ["power bi", "powerbi", "microsoft power bi", "dax"]),
    "Tableau": ("BI", ["tableau"]),
    "Looker": ("BI", ["looker", "looker studio", "lookml", "data studio"]),
    "Metabase": ("BI", ["metabase"]), "Qlik": ("BI", ["qlik", "qlik sense", "qlikview"]),
    "Snowflake": ("Warehouse", ["snowflake"]), "BigQuery": ("Warehouse", ["bigquery", "google bigquery"]),
    "Redshift": ("Warehouse", ["redshift", "amazon redshift"]), "Databricks": ("Warehouse", ["databricks"]),
    "dbt": ("Data Eng", ["dbt", "data build tool"]), "Airflow": ("Data Eng", ["airflow", "apache airflow"]),
    "Spark": ("Data Eng", ["spark", "apache spark"]), "Fivetran": ("Data Eng", ["fivetran", "airbyte", "stitch"]),
    "Kafka": ("Data Eng", ["kafka"]),
    "Salesforce": ("CRM", ["salesforce", "sfdc", "salesforce crm"]), "HubSpot": ("CRM", ["hubspot"]),
    "Zoho": ("CRM", ["zoho", "zoho crm"]), "Outreach/Salesloft": ("CRM", ["outreach", "salesloft", "gong", "clari"]),
    "Marketo": ("Marketing Ops", ["marketo", "pardot", "eloqua", "braze", "klaviyo", "mailchimp"]),
    "Zapier": ("Automation", ["zapier"]), "Make": ("Automation", ["make.com", "integromat"]),
    "n8n": ("Automation", ["n8n"]), "Power Automate": ("Automation", ["power automate", "microsoft power automate", "power apps"]),
    "Workato": ("Automation", ["workato", "tray.io", "mulesoft"]),
    "AWS": ("Cloud", ["aws", "amazon web services", "s3", "lambda"]), "Azure": ("Cloud", ["azure", "microsoft azure"]),
    "GCP": ("Cloud", ["gcp", "google cloud", "google cloud platform"]),
    "LLMs / GenAI": ("AI", ["llm", "llms", "genai", "generative ai", "gpt", "chatgpt", "openai", "claude", "prompt engineering", "copilot", "langchain", "rag"]),
    "Machine Learning": ("AI", ["machine learning", "ml", "scikit-learn", "tensorflow", "pytorch"]),
    "Jira": ("Work Mgmt", ["jira", "asana", "monday.com", "smartsheet", "notion", "confluence"]),
    "Git": ("Dev", ["git", "github", "gitlab"]), "APIs": ("Dev", ["api", "apis", "rest api", "rest apis", "rest", "webhooks", "json"]),
    "Google Analytics": ("Analytics", ["google analytics", "ga4", "mixpanel", "amplitude", "segment", "heap"]),
    "NetSuite/ERP": ("Finance Ops", ["netsuite", "sap", "oracle", "quickbooks", "workday"]),
    "Zendesk/Support": ("Support", ["zendesk", "freshdesk", "freshworks", "intercom", "gainsight", "vitally", "totango"]),
}
ALIAS = {a: (tool, cat) for tool, (cat, al) in TAXONOMY.items() for a in al + [tool.lower()]}


def norm_skill(s):
    k = re.sub(r"\s+", " ", s.strip().lower())
    return ALIAS.get(k)


def role_family(title, query):
    t = title.lower()
    if re.search(r"revenue op|revops|sales op|sales enablement|gtm|go-to-market|customer success op|cx op|marketing op", t): return "RevOps / GTM Ops"
    if re.search(r"analytics engineer|data engineer|etl|pipeline|platform engineer|dba", t): return "Data / Analytics Engineering"
    if re.search(r"automation|integration|workflow|no-code|low-code|rpa", t): return "Automation / Integrations"
    if re.search(r"\bai\b|machine learning|ml |llm|prompt|genai", t): return "AI / ML"
    if re.search(r"data analyst|bi |business intelligence|reporting|insights|analytics|data scien", t): return "Data / BI Analyst"
    if re.search(r"operations|ops\b|business analyst|program|project|process", t): return "Business / Operations"
    return {"data-analyst": "Data / BI Analyst", "business-intelligence-analyst": "Data / BI Analyst", "revenue-operations": "RevOps / GTM Ops",
            "sales-operations": "RevOps / GTM Ops", "customer-success-operations": "RevOps / GTM Ops", "automation": "Automation / Integrations",
            "analytics-engineer": "Data / Analytics Engineering", "data-engineer": "Data / Analytics Engineering", "ai-engineer": "AI / ML"}.get(query, "Other")


def region(loc):
    l = (loc or "").lower()
    if not l or "worldwide" in l or "anywhere" in l or "global" in l: return "Worldwide"
    if re.search(r"latam|latin|mexico|brazil|argentina|colombia|south america", l): return "LATAM"
    if re.search(r"united states|\bus\b|usa|canada|north america", l): return "US / Canada"
    if re.search(r"europe|emea|uk|united kingdom|germany|france|spain|portugal|ireland|netherlands|poland|\beu\b", l): return "Europe / EMEA"
    return "Other regions"


# rough FX to USD, only to make salaries comparable on one chart
FX = {"USD": 1, "EUR": 1.08, "GBP": 1.27, "CAD": 0.73, "AUD": 0.65, "MXN": 0.055, "BRL": 0.18, "INR": 0.012, "PLN": 0.25}


def annual_usd(lo, hi, cur, period):
    if lo is None and hi is None: return None
    fx = FX.get((cur or "USD").upper())
    mult = {"year": 1, "month": 12, "hour": 2080}.get(period)
    if fx is None or mult is None: return None
    vals = [v for v in (lo, hi) if v]
    mid = sum(vals) / len(vals) * fx * mult
    return round(mid) if 10_000 <= mid <= 600_000 else None  # drop obvious extraction junk


def main():
    rows = [r for r in json.load(open(ROOT / "data" / "jobs_extracted.json", encoding="utf-8")) if not r.get("_failed") and r.get("title")]
    jobs, bridge, skill_cat = [], [], {}
    for i, r in enumerate(rows, 1):
        tools = {}
        for s in r.get("skills_tools") or []:
            n = norm_skill(s)
            if n: tools[n[0]] = n[1]
        skill_cat.update(tools)
        sal = annual_usd(r.get("salary_min"), r.get("salary_max"), r.get("salary_currency"), r.get("salary_period"))
        jobs.append({
            "job_id": i, "title": r["title"], "company": r.get("company") or "", "url": r["url"],
            "role_family": role_family(r["title"], r.get("query", "")), "seniority": r.get("seniority") or "unspecified",
            "employment_type": r.get("employment_type") or "unspecified", "location_restriction": r.get("location_restriction") or "Worldwide",
            "region": region(r.get("location_restriction")), "posted_date": r.get("posted_date") or "",
            "salary_annual_usd": sal, "years_experience_min": r.get("years_experience_min"),
            "mentions_ai": bool(r.get("mentions_ai_tools")), "tools": sorted(tools), "n_tools": len(tools),
        })
        bridge += [{"job_id": i, "tool": t} for t in tools]

    def write(name, rows_, cols):
        with open(OUT_CSV / name, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows_)

    write("fact_jobs.csv", [{**j, "tools": "|".join(j["tools"]), "mentions_ai": int(j["mentions_ai"])} for j in jobs],
          ["job_id", "title", "company", "url", "role_family", "seniority", "employment_type", "location_restriction", "region",
           "posted_date", "salary_annual_usd", "years_experience_min", "mentions_ai", "n_tools", "tools"])
    write("bridge_job_tool.csv", bridge, ["job_id", "tool"])
    write("dim_tool.csv", [{"tool": t, "category": c} for t, c in sorted(skill_cat.items())], ["tool", "category"])

    tool_counts = Counter(t for j in jobs for t in j["tools"])
    dash = {
        "generated": max((j["posted_date"] for j in jobs if j["posted_date"]), default=""),
        "tool_category": skill_cat, "tool_counts": tool_counts.most_common(), "jobs": jobs,
    }
    (ROOT / "web" / "public").mkdir(parents=True, exist_ok=True)
    (ROOT / "web" / "public" / "dashboard.json").write_text(json.dumps(dash, ensure_ascii=False), encoding="utf-8")
    sal = [j["salary_annual_usd"] for j in jobs if j["salary_annual_usd"]]
    print(f"{len(jobs)} jobs | {len(tool_counts)} distinct tools | salary coverage {len(sal)}/{len(jobs)} | with >=1 tool {sum(1 for j in jobs if j['n_tools'])}")
    print("top tools:", tool_counts.most_common(12))
    print("families:", Counter(j["role_family"] for j in jobs).most_common())


if __name__ == "__main__":
    main()
