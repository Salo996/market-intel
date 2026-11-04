import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const CAT_COLOR = {
  Language: "#5fe3c0", BI: "#5aa9ff", Warehouse: "#a78bfa", "Data Eng": "#c084fc", CRM: "#f2b85b", "Marketing Ops": "#f59e6b",
  Automation: "#4ade80", Cloud: "#7dd3fc", AI: "#f472b6", Spreadsheet: "#86efac", "Work Mgmt": "#94a3b8", Dev: "#cbd5e1",
  Analytics: "#fda4af", "Finance Ops": "#fcd34d", Support: "#67e8f9",
};
const SENIORITY_ORDER = ["intern", "junior", "mid", "senior", "lead", "manager", "director", "unspecified"];
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const money = (n) => (n == null ? "—" : "$" + Math.round(n / 1000) + "K");
const count = (arr, f) => { const m = new Map(); arr.forEach((x) => { const k = f(x); if (k != null) m.set(k, (m.get(k) || 0) + 1); }); return [...m].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); };

const Tip = ({ active, payload, total }) => active && payload?.length ? (
  <div className="tip"><b>{payload[0].payload.name}</b><br />{payload[0].value} postings{total ? ` · ${pct(payload[0].value, total)}%` : ""}</div>
) : null;

export default function App() {
  const [data, setData] = useState(null);
  const [f, setF] = useState({ family: "All", seniority: "All", region: "All", ai: false, q: "" });
  const [sort, setSort] = useState({ k: "posted_date", dir: -1 });
  const [page, setPage] = useState(0);

  useEffect(() => { fetch("./dashboard.json").then((r) => r.json()).then(setData); }, []);
  useEffect(() => setPage(0), [f, sort]);

  const jobs = useMemo(() => {
    if (!data) return [];
    const q = f.q.trim().toLowerCase();
    return data.jobs.filter((j) =>
      (f.family === "All" || j.role_family === f.family) && (f.seniority === "All" || j.seniority === f.seniority) &&
      (f.region === "All" || j.region === f.region) && (!f.ai || j.mentions_ai) &&
      (!q || (j.title + " " + j.company + " " + j.tools.join(" ")).toLowerCase().includes(q)));
  }, [data, f]);

  const view = useMemo(() => {
    const n = jobs.length;
    const catOf = data?.tool_category || {};
    const toolCounts = count(jobs.flatMap((j) => j.tools), (t) => t).slice(0, 14).map((d) => ({ ...d, cat: catOf[d.name] }));
    const salaries = jobs.map((j) => j.salary_annual_usd).filter(Boolean);
    const families = count(jobs, (j) => j.role_family);
    const famSal = families.map((fm) => ({ name: fm.name, med: median(jobs.filter((j) => j.role_family === fm.name).map((j) => j.salary_annual_usd).filter(Boolean)) })).filter((x) => x.med);
    const seniority = count(jobs, (j) => j.seniority).sort((a, b) => SENIORITY_ORDER.indexOf(a.name) - SENIORITY_ORDER.indexOf(b.name));
    const region = count(jobs, (j) => j.region);
    const topTools = toolCounts.slice(0, 10).map((t) => t.name);
    const matrix = families.slice(0, 6).map((fm) => {
      const sub = jobs.filter((j) => j.role_family === fm.name);
      return { fam: fm.name, n: sub.length, cells: topTools.map((t) => pct(sub.filter((j) => j.tools.includes(t)).length, sub.length)) };
    });
    return { n, toolCounts, salaries, families, famSal, seniority, region, topTools, matrix,
      ai: jobs.filter((j) => j.mentions_ai).length, ww: jobs.filter((j) => j.region === "Worldwide").length, withTools: jobs.filter((j) => j.n_tools).length };
  }, [jobs, data]);

  const sorted = useMemo(() => [...jobs].sort((a, b) => {
    const x = a[sort.k] ?? "", y = b[sort.k] ?? "";
    return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
  }), [jobs, sort]);

  if (!data) return <div className="empty mono">loading dashboard.json…</div>;
  const all = data.jobs;
  const opts = (k) => ["All", ...new Set(all.map((j) => j[k]))].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : String(a).localeCompare(b)));
  const dirty = f.family !== "All" || f.seniority !== "All" || f.region !== "All" || f.ai || f.q;
  const tool0 = view.toolCounts[0];
  const PAGE = 12, pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const head = (k, label) => <th onClick={() => setSort((s) => ({ k, dir: s.k === k ? -s.dir : -1 }))}>{label}{sort.k === k ? (sort.dir < 0 ? " ↓" : " ↑") : ""}</th>;

  return (
    <>
      <div className="top"><div className="wrap">
        <span className="brand mono"><b>~/</b>salomon-santiago / market-intel</span>
        <span className="stamp"><span><i className="dot" />{all.length} postings scraped with Firecrawl</span><span>latest posting: {data.generated || "n/a"}</span>
          <a href="https://salo996.github.io/Data-analyst-portfolio/">← portfolio</a></span>
      </div></div>

      <div className="wrap">
        <header className="hero">
          <h1>What remote Data &amp; Automation roles actually ask for</h1>
          <p>A snapshot of the remote job market for analyst, RevOps and automation roles. Postings are collected with Firecrawl, parsed deterministically (no LLM guesswork) and normalized into a star schema, ready for both this dashboard and Power BI.</p>
        </header>

        <div className="filters">
          <select value={f.family} onChange={(e) => setF({ ...f, family: e.target.value })}>{opts("role_family").map((o) => <option key={o}>{o}</option>)}</select>
          <select value={f.seniority} onChange={(e) => setF({ ...f, seniority: e.target.value })}>{opts("seniority").map((o) => <option key={o}>{o}</option>)}</select>
          <select value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })}>{opts("region").map((o) => <option key={o}>{o}</option>)}</select>
          <span className={"toggle" + (f.ai ? " on" : "")} onClick={() => setF({ ...f, ai: !f.ai })}>{f.ai ? "■" : "□"} expects AI tools</span>
          <input type="search" placeholder="search title, company, tool…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          {dirty && <button className="reset" onClick={() => setF({ family: "All", seniority: "All", region: "All", ai: false, q: "" })}>reset</button>}
        </div>

        {!view.n ? <div className="empty mono">No postings match these filters.</div> : <>
          <div className="kpis">
            <div className="kpi"><div className="l mono">postings</div><div className="v">{view.n}</div><div className="s">{pct(view.n, all.length)}% of the dataset</div></div>
            <div className="kpi"><div className="l mono">expect AI tools</div><div className="v">{pct(view.ai, view.n)}%</div><div className="s">{view.ai} postings mention AI / LLMs</div></div>
            <div className="kpi"><div className="l mono">median salary</div><div className="v">{money(median(view.salaries))}</div><div className="s">only {view.salaries.length} postings disclose pay</div></div>
            <div className="kpi"><div className="l mono">#1 tool</div><div className="v">{tool0?.name || "—"}</div><div className="s">{tool0 ? `${pct(tool0.value, view.n)}% of postings` : ""}</div></div>
            <div className="kpi"><div className="l mono">open worldwide</div><div className="v">{pct(view.ww, view.n)}%</div><div className="s">no country restriction</div></div>
          </div>

          <div className="grid">
            <div className="card c7">
              <h3>Most requested tools</h3><div className="sub">share of postings naming each tool</div>
              <div className="legend">{[...new Set(view.toolCounts.map((t) => t.cat))].filter(Boolean).map((c) => <span key={c}><i style={{ background: CAT_COLOR[c] }} />{c}</span>)}</div>
              <ResponsiveContainer width="100%" height={Math.max(260, view.toolCounts.length * 30)}>
                <BarChart data={view.toolCounts} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="#15324f" />
                  <XAxis type="number" stroke="#6f8aa6" fontSize={11} /><YAxis type="category" dataKey="name" stroke="#a9bbcf" fontSize={12} width={110} />
                  <Tooltip cursor={{ fill: "rgba(95,227,192,.06)" }} content={<Tip total={view.n} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>{view.toolCounts.map((t) => <Cell key={t.name} fill={CAT_COLOR[t.cat] || "#5fe3c0"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card c5">
              <h3>What the data says</h3><div className="sub">auto-generated from the current filter</div>
              <div className="insights">
                {tool0 && <div className="insight"><span className="p">$</span><span><b>{tool0.name}</b> shows up in <b>{pct(tool0.value, view.n)}%</b> of postings, the most requested tool in this view.</span></div>}
                {(() => { const sql = view.toolCounts.find((t) => t.name === "SQL"), py = view.toolCounts.find((t) => t.name === "Python");
                  return sql && py ? <div className="insight"><span className="p">$</span><span>SQL appears in <b>{pct(sql.value, view.n)}%</b> and Python in <b>{pct(py.value, view.n)}%</b>: the baseline stack.</span></div> : null; })()}
                <div className="insight"><span className="p">$</span><span><b>{pct(view.ai, view.n)}%</b> of postings expect hands-on use of AI tools or LLMs.</span></div>
                {view.famSal.length > 0 && (() => { const t = [...view.famSal].sort((a, b) => b.med - a.med)[0];
                  return <div className="insight"><span className="p">$</span><span>Highest disclosed pay: <b>{t.name}</b>, median <b>{money(t.med)}</b>/yr (small sample, treat as directional).</span></div>; })()}
                <div className="insight"><span className="p">$</span><span><b>{pct(view.ww, view.n)}%</b> are open worldwide; the rest restrict by country or region.</span></div>
              </div>
            </div>

            <div className="card c4">
              <h3>Role families</h3><div className="sub">postings per family</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={view.families} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <XAxis type="number" hide /><YAxis type="category" dataKey="name" stroke="#a9bbcf" fontSize={11} width={150} />
                  <Tooltip cursor={{ fill: "rgba(95,227,192,.06)" }} content={<Tip total={view.n} />} />
                  <Bar dataKey="value" fill="#5aa9ff" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card c4">
              <h3>Seniority</h3><div className="sub">as listed or inferred from title</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={view.seniority} margin={{ right: 8 }}>
                  <XAxis dataKey="name" stroke="#a9bbcf" fontSize={11} /><YAxis stroke="#6f8aa6" fontSize={11} width={28} />
                  <Tooltip cursor={{ fill: "rgba(95,227,192,.06)" }} content={<Tip total={view.n} />} />
                  <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card c4">
              <h3>Where you can work from</h3><div className="sub">location restriction by region</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie data={view.region} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {view.region.map((r, i) => <Cell key={r.name} fill={["#5fe3c0", "#5aa9ff", "#a78bfa", "#f2b85b", "#f472b6"][i % 5]} />)}</Pie>
                  <Tooltip content={<Tip total={view.n} />} /></PieChart>
              </ResponsiveContainer>
              <div className="legend">{view.region.map((r, i) => <span key={r.name}><i style={{ background: ["#5fe3c0", "#5aa9ff", "#a78bfa", "#f2b85b", "#f472b6"][i % 5] }} />{r.name} · {r.value}</span>)}</div>
            </div>

            <div className="card c12">
              <h3>Tool demand by role family</h3><div className="sub">% of postings in each family that name the tool</div>
              <div className="matrix" style={{ gridTemplateColumns: `190px repeat(${view.topTools.length}, minmax(54px, 1fr))` }}>
                <div />{view.topTools.map((t) => <div key={t} className="h">{t}</div>)}
                {view.matrix.map((r) => <React.Fragment key={r.fam}>
                  <div className="rl">{r.fam} <span style={{ color: "#6f8aa6" }}>({r.n})</span></div>
                  {r.cells.map((v, i) => <div key={i} className="c" style={{ background: `rgba(95,227,192,${(v / 100) * 0.85 + (v ? 0.06 : 0)})`, color: v > 55 ? "#06182b" : "#d7e2ee", opacity: v ? 1 : 0.35 }}>{v}</div>)}
                </React.Fragment>)}
              </div>
            </div>

            <div className="card c12">
              <h3>Postings</h3><div className="sub">{sorted.length} results · click a column to sort · title opens the original posting</div>
              <div className="tablewrap"><table>
                <thead><tr>{head("title", "role")}{head("company", "company")}{head("seniority", "level")}{head("region", "region")}{head("salary_annual_usd", "pay (USD/yr)")}{head("posted_date", "posted")}<th>tools</th></tr></thead>
                <tbody>{sorted.slice(page * PAGE, page * PAGE + PAGE).map((j) => (
                  <tr key={j.job_id}>
                    <td><a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a></td><td>{j.company}</td><td className="mono">{j.seniority}</td>
                    <td className="mono">{j.region}</td><td className="mono">{money(j.salary_annual_usd)}</td><td className="mono">{j.posted_date || "—"}</td>
                    <td>{j.tools.slice(0, 6).map((t) => <span className="chip" key={t}>{t}</span>)}{j.mentions_ai && <span className="chip ai">AI</span>}</td>
                  </tr>))}</tbody>
              </table></div>
              <div className="pager"><span>page {page + 1} / {pages}</span>
                <button disabled={page === 0} onClick={() => setPage(page - 1)}>← prev</button><button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>next →</button></div>
            </div>
          </div>
        </>}

        <footer className="foot">
          Method: Firecrawl scrapes → deterministic Python parser (tool taxonomy with alias matching, salary only from the posting's own block) → star schema (<span style={{ color: "#a9bbcf" }}>fact_jobs · bridge_job_tool · dim_tool</span>) → this React dashboard (and a Power BI model on the same tables).<br />
          Caveats: one source board; salary is disclosed in a minority of postings and FX is approximate; tool counts reflect mentions, not depth of requirement. Independent project, no employer or product data.
        </footer>
      </div>
    </>
  );
}
