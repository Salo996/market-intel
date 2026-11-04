import * as React from "react";
export interface Row {
    tool: string;
    category: string;
    family: string;
    value: number;
}
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
export declare const Board: React.FC<BoardProps>;
