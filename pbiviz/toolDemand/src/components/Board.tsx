import * as React from "react";
import { CAT_COLOR, CSS, FALLBACK } from "../styles";

export interface Row { tool: string; category: string; family: string; value: number; }
export interface BoardProps {
    rows: Row[];
    width: number;
    height: number;
    topN: number;
    showMatrix: boolean;
    showCounts: boolean;
    hasFamily: boolean;
    selected: Set<string>;
    onSelect: (tool: string, multi: boolean) => void;
    onClear: () => void;
}

export const Board: React.FC<BoardProps> = ({ rows, width, height, topN, showMatrix, showCounts, hasFamily, selected, onSelect, onClear }) => {
    if (!rows.length) {
        return (
            <div className="td"><style>{CSS}</style>
                <div className="td-empty"><div>Add <b>Tool</b> and <b>Postings</b> to see demand.<br />Optional: <b>Tool category</b> for colors, <b>Role family</b> for the heat matrix.</div></div>
            </div>
        );
    }

    // aggregate per tool (a tool appears once per role family)
    const tools = new Map<string, { total: number; category: string; byFam: Map<string, number> }>();
    rows.forEach((r) => {
        const t = tools.get(r.tool) || { total: 0, category: r.category, byFam: new Map<string, number>() };
        t.total += r.value;
        if (r.category) t.category = r.category;
        t.byFam.set(r.family, (t.byFam.get(r.family) || 0) + r.value);
        tools.set(r.tool, t);
    });
    const ranked = [...tools.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, Math.max(3, topN));
    const max = ranked[0][1].total || 1;
    const cats = [...new Set(ranked.map(([, t]) => t.category).filter(Boolean))];
    const anySel = selected.size > 0;

    const famTotals = new Map<string, number>();
    ranked.forEach(([, t]) => t.byFam.forEach((v, f) => famTotals.set(f, (famTotals.get(f) || 0) + v)));
    const fams = [...famTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f);
    const matrixOn = showMatrix && hasFamily && fams.length > 0 && width >= 620;
    let cellMax = 1;
    ranked.slice(0, 10).forEach(([, t]) => fams.forEach((f) => { cellMax = Math.max(cellMax, t.byFam.get(f) || 0); }));

    // Fixed design sizes look tiny on a big canvas: scale everything to fill the visual (Chromium `zoom` keeps layout proportional).
    const designH = 36 + 30 + (cats.length ? 28 : 0) + (matrixOn ? 54 : 0) + ranked.length * 27 + 8;
    const scale = Math.max(1, Math.min(width / 940, height / designH, 2.6));

    return (
        <div className="td" onClick={(e) => { if (e.target === e.currentTarget) onClear(); }}>
            <style>{CSS}</style>
            <div className="td-in" style={{ zoom: scale } as React.CSSProperties}>
            <div className="td-head">
                <span className="td-title">Tool demand</span>
                <span className="td-sub">{ranked.length} tools · {anySel ? `${selected.size} selected · click empty space to clear` : "click a tool to cross-filter"}</span>
            </div>
            {cats.length > 0 && <div className="td-legend">{cats.map((c) => <span key={c}><i style={{ background: CAT_COLOR[c] || FALLBACK }} />{c}</span>)}</div>}
            <div className={"td-body" + (matrixOn ? " two" : "")}>
                <div>
                    {matrixOn && <><p className="td-h">postings by tool</p><div style={{ height: 40 }} /></>}
                    {ranked.map(([name, t]) => {
                        const sel = selected.has(name);
                        return (
                            <div key={name} className={"td-row" + (sel ? " sel" : anySel ? " dim" : "")} onClick={(e) => { e.stopPropagation(); onSelect(name, e.ctrlKey || e.metaKey); }} title={`${name}: ${t.total}`}>
                                <span className="td-name">{name}</span>
                                <span className="td-track"><span className="td-bar" style={{ display: "block", width: `${(t.total / max) * 100}%`, background: CAT_COLOR[t.category] || FALLBACK }} /></span>
                                <span className="td-val">{showCounts ? t.total : ""}</span>
                            </div>
                        );
                    })}
                </div>
                {matrixOn && (
                    <div>
                        <p className="td-h">postings by role family</p>
                        <div className="td-matrix" style={{ gridTemplateColumns: `92px repeat(${fams.length}, minmax(44px, 1fr))` }}>
                            <div className="td-mh" />
                            {fams.map((f) => <div key={f} className="td-mh" title={f}>{f.replace(" / ", " /\n")}</div>)}
                            {ranked.slice(0, 10).map(([name, t]) => (
                                <React.Fragment key={name}>
                                    <div className="td-ml">{name}</div>
                                    {fams.map((f) => {
                                        const v = t.byFam.get(f) || 0;
                                        return (
                                            <div key={f} className={"td-mc" + (selected.has(name) ? " sel" : "")} title={`${name} · ${f}: ${v}`}
                                                onClick={(e) => { e.stopPropagation(); onSelect(name, e.ctrlKey || e.metaKey); }}
                                                style={{ background: `rgba(95,227,192,${v ? 0.1 + (v / cellMax) * 0.78 : 0.04})`, color: v / cellMax > 0.55 ? "#06182b" : "#d7e2ee", opacity: v ? 1 : 0.4 }}>
                                                {v || ""}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};
