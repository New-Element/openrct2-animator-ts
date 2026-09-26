/// <reference path="./../../openrct2.d.ts" />

import {store} from "openrct2-flexui";
import {
    getLookInsideTabMode,
    onLookInsideTabModeChanged
} from "../../model/lookInside/lookInsideHover";
import {TabRoofMode} from "../../model/lookInside/buildingTypes";

export const CYCLE_ROOF_MODE_DEFAULT_BINDINGS = ["SHIFT+A"];
export const CYCLE_ROOF_MODE_DEFAULT_LABEL = "Default Shortcut: SHIFT+A";

/** Park-persisted; defaults to Show All until park storage is loaded. */
export const tabRoofMode = store<TabRoofMode>("showAll");

export const tabShowAllPressed = store<boolean>(true);
export const tabHideAllPressed = store<boolean>(false);
export const tabCursorHoverPressed = store<boolean>(false);

function syncTabRoofModeStores(mode: TabRoofMode): void {
    tabRoofMode.set(mode);
    tabShowAllPressed.set(mode === "showAll");
    tabHideAllPressed.set(mode === "hideAll");
    tabCursorHoverPressed.set(mode === "cursorHover");
}

/** Copy the park-loaded tab mode into the Look Inside toggles (window open). */
export function syncTabRoofModeUi(): void {
    syncTabRoofModeStores(getLookInsideTabMode());
}

export function setTabRoofMode(mode: TabRoofMode): void {
    syncTabRoofModeStores(mode);
    onLookInsideTabModeChanged(mode);
}

const TAB_ROOF_MODE_CYCLE: TabRoofMode[] = ["showAll", "hideAll", "cursorHover"];

/** Same roof change as Shift+A landing on this mode. */
export function applyTabRoofMode(mode: TabRoofMode): void {
    setTabRoofMode(mode);
}

export function cycleTabRoofMode(): void {
    const current = getLookInsideTabMode();
    const index = TAB_ROOF_MODE_CYCLE.indexOf(current);
    const next = TAB_ROOF_MODE_CYCLE[(index + 1) % TAB_ROOF_MODE_CYCLE.length];
    applyTabRoofMode(next);
}

export function onTabRoofToggle(mode: TabRoofMode, isPressed: boolean): void {
    if (isPressed) {
        setTabRoofMode(mode);
        return;
    }
    setTabRoofMode(tabRoofMode.get());
}
