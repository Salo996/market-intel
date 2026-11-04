// Renders the Power BI visual's React component outside Power BI, fed from the same star-schema data.
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Board } from "../../pbiviz/ToolDemand/src/components/Board.tsx";

function Harness() {
  const [rows, setRows] = useState(null);
  const [sel, setSel] = useState(new Set());
  useEffect(() => {
    fetch("./dashboard.json").then((r) => r.json()).then((d) => {
      const m = new Map();
      d.jobs.forEach((j) => j.tools.forEach((t) => { const k = t + "|" + j.role_family; m.set(k, (m.get(k) || 0) + 1); }));
      setRows([...m].map(([k, value]) => { const [tool, family] = k.split("|"); return { tool, category: d.tool_category[tool] || "", family, value }; }));
    });
  }, []);
  if (!rows) return "loading…";
  const props = { rows, hasFamily: true, topN: 14, showMatrix: true, showCounts: true, selected: sel,
    onSelect: (t, multi) => setSel((s) => { const n = new Set(multi ? s : []); n.has(t) && s.has(t) ? n.delete(t) : n.add(t); return n; }), onClear: () => setSel(new Set()) };
  return (<>
    <div className="frame" style={{ width: 1650, height: 790 }}><Board {...props} width={1650} height={790} /></div>
    <div className="frame" style={{ width: 380, height: 560 }}><Board {...props} width={380} height={560} hasFamily={false} rows={rows} showMatrix={false} /></div>
  </>);
}
createRoot(document.getElementById("root")).render(<Harness />);
