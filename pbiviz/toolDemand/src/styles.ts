// Shared by the Power BI visual and the standalone harness. Fonts are system fonts: Power BI visuals can't load web fonts.
export const CSS = `
.td{--bg:#06182b;--panel:#0a2540;--line:#1c3d60;--text:#d7e2ee;--muted:#8ea6bf;--dim:#6f8aa6;--strong:#f2f7fc;--accent:#5fe3c0;
  font-family:'Segoe UI',system-ui,sans-serif;color:var(--text);background:var(--bg);width:100%;height:100%;overflow:auto;padding:14px 16px;box-sizing:border-box;
  background-image:linear-gradient(rgba(120,160,200,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,200,.05) 1px,transparent 1px);background-size:32px 32px}
.td *{box-sizing:border-box}
.td-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px;flex-wrap:wrap}
.td-title{font-size:15px;font-weight:600;color:var(--strong);letter-spacing:-.01em}
.td-sub{font:11px Consolas,'Courier New',monospace;color:var(--dim)}
.td-legend{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:10px;font:10px Consolas,monospace;color:var(--muted)}
.td-legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px}
.td-body{display:grid;gap:18px;align-items:start}
.td-body.two{grid-template-columns:minmax(300px,420px) minmax(380px,1fr);gap:28px}
.td-row{display:grid;grid-template-columns:96px 1fr 34px;align-items:center;gap:8px;height:24px;margin-bottom:3px;padding:0 4px;border-radius:5px;cursor:pointer;transition:background .12s}
.td-row:hover{background:rgba(95,227,192,.07)}
.td-row.sel{background:rgba(95,227,192,.14);outline:1px solid rgba(95,227,192,.5)}
.td-row.dim{opacity:.38}
.td-name{font-size:13px;color:#a9bbcf;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.td-row.sel .td-name{color:var(--strong)}
.td-track{height:15px;background:rgba(28,61,96,.35);border-radius:3px;overflow:hidden}
.td-bar{height:100%;border-radius:3px;min-width:2px}
.td-val{font:11px Consolas,monospace;color:var(--muted);text-align:right}
.td-matrix{display:grid;gap:3px;font:10px Consolas,monospace}
.td-mh{font-size:10.5px;color:var(--dim);height:40px;display:flex;align-items:flex-end;justify-content:center;text-align:center;line-height:1.1;padding-bottom:2px;overflow:hidden;white-space:pre-line}
.td-ml{color:#a9bbcf;text-align:right;height:24px;line-height:24px;padding-right:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:12px 'Segoe UI',sans-serif}
.td-mc{font-size:11px;height:24px;border-radius:3px;display:flex;align-items:center;justify-content:center;color:var(--strong);cursor:pointer}
.td-mc.sel{outline:1px solid rgba(95,227,192,.7)}
.td-h{font:10px Consolas,monospace;color:var(--dim);margin:0 0 6px;height:14px}
.td-empty{height:100%;min-height:120px;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--muted);font-size:13px;padding:20px;line-height:1.6}
.td-empty b{color:var(--accent);font-weight:600}
`;

export const CAT_COLOR: Record<string, string> = {
    Language: "#5fe3c0", BI: "#5aa9ff", Warehouse: "#a78bfa", "Data Eng": "#c084fc", CRM: "#f2b85b", "Marketing Ops": "#f59e6b",
    Automation: "#4ade80", Cloud: "#7dd3fc", AI: "#f472b6", Spreadsheet: "#86efac", "Work Mgmt": "#94a3b8", Dev: "#cbd5e1",
    Analytics: "#fda4af", "Finance Ops": "#fcd34d", Support: "#67e8f9",
};
export const FALLBACK = "#5fe3c0";
