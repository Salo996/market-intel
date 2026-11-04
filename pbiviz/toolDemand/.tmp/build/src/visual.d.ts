import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private host;
    private root;
    private selection;
    private formattingSettings;
    private formattingSettingsService;
    private idsByTool;
    private selectedTools;
    private last;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private render;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
