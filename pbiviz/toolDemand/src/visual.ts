"use strict";

import powerbi from "powerbi-visuals-api";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";
import { Board, Row } from "./components/Board";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: Root;
    private selection: ISelectionManager;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private idsByTool = new Map<string, ISelectionId[]>();
    private selectedTools = new Set<string>();
    private last: { rows: Row[]; width: number; height: number; hasFamily: boolean } = { rows: [], width: 0, height: 0, hasFamily: false };

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selection = options.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = createRoot(options.element);
        // keep the highlight in sync when selection is changed or cleared from another visual
        this.selection.registerOnSelectCallback((ids: ISelectionId[]) => {
            this.selectedTools = new Set<string>();
            this.idsByTool.forEach((toolIds, tool) => {
                if (toolIds.some((t) => ids.some((i) => i.equals(t)))) this.selectedTools.add(tool);
            });
            this.render();
        });
    }

    public update(options: VisualUpdateOptions) {
        const events = this.host.eventService;
        events.renderingStarted(options);
        try {
            const dv: DataView | undefined = options.dataViews && options.dataViews[0];
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dv);
            this.last = { rows: [], width: options.viewport.width, height: options.viewport.height, hasFamily: false };
            this.idsByTool = new Map();

            const table = dv && dv.table;
            if (table) {
                const idx = (role: string) => table.columns.findIndex((c) => c.roles && c.roles[role]);
                const [it, ic, ifam, ip] = ["tool", "category", "family", "postings"].map(idx);
                if (it >= 0 && ip >= 0) {
                    this.last.hasFamily = ifam >= 0;
                    table.rows.forEach((r, rowIndex) => {
                        const tool = String(r[it] ?? "");
                        const value = Number(r[ip]) || 0;
                        if (!tool) return;
                        this.last.rows.push({ tool, category: ic >= 0 ? String(r[ic] ?? "") : "", family: ifam >= 0 ? String(r[ifam] ?? "") : "", value });
                        const id = this.host.createSelectionIdBuilder().withTable(table, rowIndex).createSelectionId();
                        this.idsByTool.set(tool, [...(this.idsByTool.get(tool) || []), id]);
                    });
                }
            }
            this.render();
            events.renderingFinished(options);
        } catch (error) {
            console.log("ToolDemand update error", error);
            events.renderingFailed(options, String(error));
        }
    }

    private render() {
        const d = this.formattingSettings.displayCard;
        this.root.render(
            React.createElement(Board, {
                rows: this.last.rows, width: this.last.width, height: this.last.height, hasFamily: this.last.hasFamily,
                topN: Number(d.topN.value) || 14, showMatrix: !!d.showMatrix.value, showCounts: !!d.showCounts.value,
                selected: this.selectedTools,
                onSelect: (tool: string, multi: boolean) => {
                    const ids = this.idsByTool.get(tool) || [];
                    this.selection.select(ids, multi).then(() => {
                        if (multi) { this.selectedTools.has(tool) ? this.selectedTools.delete(tool) : this.selectedTools.add(tool); }
                        else { this.selectedTools = this.selectedTools.size === 1 && this.selectedTools.has(tool) ? new Set() : new Set([tool]); }
                        this.render();
                    });
                },
                onClear: () => { this.selection.clear().then(() => { this.selectedTools = new Set(); this.render(); }); },
            })
        );
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
