import { Visual } from "../../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api";
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import DialogConstructorOptions = powerbiVisualsApi.extensibility.visual.DialogConstructorOptions;
var powerbiKey: any = "powerbi";
var powerbi: any = window[powerbiKey];
var toolDemand7D214B9AECC24A54AD32CC8BD8591515: IVisualPlugin = {
    name: 'toolDemand7D214B9AECC24A54AD32CC8BD8591515',
    displayName: 'Tool Demand Board',
    class: 'Visual',
    apiVersion: '5.11.0',
    create: (options?: VisualConstructorOptions) => {
        if (Visual) {
            return new Visual(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId: string, options: DialogConstructorOptions, initialState: object) => {
        const dialogRegistry = (<any>globalThis).dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["toolDemand7D214B9AECC24A54AD32CC8BD8591515"] = toolDemand7D214B9AECC24A54AD32CC8BD8591515;
}
export default toolDemand7D214B9AECC24A54AD32CC8BD8591515;