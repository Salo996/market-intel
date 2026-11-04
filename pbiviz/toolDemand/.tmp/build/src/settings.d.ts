import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class DisplayCardSettings extends FormattingSettingsCard {
    topN: formattingSettings.NumUpDown;
    showMatrix: formattingSettings.ToggleSwitch;
    showCounts: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: Array<FormattingSettingsSlice>;
}
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    displayCard: DisplayCardSettings;
    cards: DisplayCardSettings[];
}
export {};
