"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class DisplayCardSettings extends FormattingSettingsCard {
    topN = new formattingSettings.NumUpDown({
        name: "topN",
        displayName: "Tools to show",
        value: 14
    });

    showMatrix = new formattingSettings.ToggleSwitch({
        name: "showMatrix",
        displayName: "Role-family heat matrix",
        value: true
    });

    showCounts = new formattingSettings.ToggleSwitch({
        name: "showCounts",
        displayName: "Show counts",
        value: true
    });

    name: string = "display";
    displayName: string = "Display";
    slices: Array<FormattingSettingsSlice> = [this.topN, this.showMatrix, this.showCounts];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    displayCard = new DisplayCardSettings();
    cards = [this.displayCard];
}
