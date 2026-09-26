import {error} from "../logger";
import {TabRoofMode} from "./buildingTypes";

type ApplyRoofModeFn = (mode: TabRoofMode) => void;

let applyRoofMode: ApplyRoofModeFn | null = null;

export function bindScriptRoofMode(fn: ApplyRoofModeFn): void {
    applyRoofMode = fn;
}

function isTabRoofMode(value: string): value is TabRoofMode {
    return value === "showAll" || value === "hideAll" || value === "cursorHover";
}

/** Show All, Hide All, or cursor hover. Same result as the Shift+A cycle. */
export function setScriptRoofMode(mode: string): boolean {
    if (!isTabRoofMode(mode) || !applyRoofMode) {
        error("step", `Custom Javascript: roof mode "${mode}" is not available`);
        return false;
    }
    applyRoofMode(mode);
    return true;
}
