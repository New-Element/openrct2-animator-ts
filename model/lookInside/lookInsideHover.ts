/// <reference path="./../../openrct2.d.ts" />

import {error, log} from "../logger";
import Building from "./building";
import BuildingsArray from "./buildingsArray";
import {TabRoofMode} from "./buildingTypes";
import {
    beginRoofVisibilityApply,
    clearRoofElementCache,
    currentViewportRotation,
    endRoofVisibilityApply,
    hideBuildingRoofs,
    shouldIgnoreLookInsideMapChange,
    showBuildingRoofs
} from "./roofVisibility";

export const LOOK_INSIDE_HOVER_TOOL_ID = "animator-look-inside-hover";
export const LOOK_INSIDE_HOVER_POLL_TICKS = 40;
const TAB_ROOF_MODE_KEY = "tabRoofModev1";
const TAB_ROOF_MODE_NAMESPACE = "animator";

let buildingsArray: BuildingsArray | null = null;
let tabMode: TabRoofMode = "showAll";
let hoveredBuildingId: string | null = null;
let lastRotation = -1;
let hoverArmed = false;
let armOriginSet = false;
let armScreenX = 0;
let armScreenY = 0;

function isTabRoofMode(value: unknown): value is TabRoofMode {
    return value === "showAll" || value === "hideAll" || value === "cursorHover";
}

function tabRoofModeStorageKey(): string {
    return TAB_ROOF_MODE_NAMESPACE + "." + TAB_ROOF_MODE_KEY;
}

function loadTabRoofModeFromPark(): TabRoofMode {
    try {
        const stored = context.getParkStorage().get(tabRoofModeStorageKey(), "showAll");
        if (isTabRoofMode(stored)) {
            return stored;
        }
    } catch (e) {
        error("lookInside", "Failed to load tab roof mode", e);
    }
    return "showAll";
}

function saveTabRoofModeToPark(mode: TabRoofMode): void {
    try {
        context.getParkStorage().set(tabRoofModeStorageKey(), mode);
    } catch (e) {
        error("lookInside", "Failed to save tab roof mode", e);
    }
}

export function getLookInsideTabMode(): TabRoofMode {
    return tabMode;
}

export function bindLookInsideHover(array: BuildingsArray): void {
    buildingsArray = array;
    tabMode = loadTabRoofModeFromPark();
    lastRotation = currentViewportRotation();
    applyCurrentTabRoofs();
}

function findBuildingById(id: string): Building | undefined {
    if (!buildingsArray) {
        return undefined;
    }
    return buildingsArray.findById(id);
}

function findBuildingByTile(x: number, y: number): Building | undefined {
    if (!buildingsArray) {
        return undefined;
    }
    return buildingsArray.findByTile(x, y);
}

function tileFromMapCoords(coords: CoordsXY | undefined): {x: number; y: number} | null {
    if (!coords || (coords.x === 0 && coords.y === 0)) {
        return null;
    }
    return {
        x: Math.floor(coords.x / 32),
        y: Math.floor(coords.y / 32)
    };
}

function disarmHover(): void {
    hoverArmed = false;
    armOriginSet = false;
    hoveredBuildingId = null;
}

function hoverIsArmed(screen: ScreenCoordsXY): boolean {
    if (hoverArmed) {
        return true;
    }
    const dx = screen.x - armScreenX;
    const dy = screen.y - armScreenY;
    if (dx * dx + dy * dy < 16) {
        return false;
    }
    hoverArmed = true;
    return true;
}

function screenIsOverPluginWindow(screen: ScreenCoordsXY): boolean {
    if (typeof ui === "undefined") {
        return false;
    }
    const count = ui.windows;
    for (let i = 0; i < count; i++) {
        let w: Window | undefined;
        try {
            w = ui.getWindow(i);
        } catch (_e) {
            continue;
        }
        if (!w) {
            continue;
        }
        const title = w.title;
        if (title !== "Animator" && title !== "Edit Building") {
            continue;
        }
        if (
            screen.x >= w.x &&
            screen.x < w.x + w.width &&
            screen.y >= w.y &&
            screen.y < w.y + w.height
        ) {
            return true;
        }
    }
    return false;
}

export function isLookInsideHoverActive(): boolean {
    return typeof ui !== "undefined" && ui.tool !== null && ui.tool.id === LOOK_INSIDE_HOVER_TOOL_ID;
}

function applyCurrentTabRoofs(): void {
    if (!buildingsArray) {
        return;
    }
    beginRoofVisibilityApply();
    try {
        const rotation = currentViewportRotation();
        const items = buildingsArray.items;
        for (let i = 0; i < items.length; i++) {
            const building = items[i];
            if (tabMode === "showAll") {
                showBuildingRoofs(building);
            } else if (tabMode === "hideAll") {
                hideBuildingRoofs(building, rotation);
            } else if (building.id === hoveredBuildingId) {
                hideBuildingRoofs(building, rotation);
            } else {
                showBuildingRoofs(building);
            }
        }
    } finally {
        endRoofVisibilityApply();
    }
}

function restoreCursorBuilding(id: string | null): void {
    if (!id) {
        return;
    }
    const building = findBuildingById(id);
    if (building) {
        showBuildingRoofs(building);
    }
}

function hideHoveredBuilding(building: Building | undefined): void {
    if (!building) {
        return;
    }
    hideBuildingRoofs(building, currentViewportRotation());
}

function onHoverMove(event: ToolEventArgs): void {
    try {
        const rotation = currentViewportRotation();
        if (rotation !== lastRotation) {
            lastRotation = rotation;
            applyCurrentTabRoofs();
        }

        if (screenIsOverPluginWindow(event.screenCoords)) {
            if (hoveredBuildingId) {
                restoreCursorBuilding(hoveredBuildingId);
                hoveredBuildingId = null;
            }
            return;
        }
        if (!armOriginSet) {
            armScreenX = event.screenCoords.x;
            armScreenY = event.screenCoords.y;
            armOriginSet = true;
        }
        if (!hoverIsArmed(event.screenCoords)) {
            return;
        }

        const tile = tileFromMapCoords(event.mapCoords);
        const building = tile ? findBuildingByTile(tile.x, tile.y) : undefined;
        const nextId = building ? building.id : null;
        if (nextId === hoveredBuildingId) {
            return;
        }

        restoreCursorBuilding(hoveredBuildingId);
        hoveredBuildingId = nextId;
        hideHoveredBuilding(building);
    } catch (e) {
        error("lookInside", "Cursor hover move failed", e);
    }
}

function activateHoverTool(): void {
    if (typeof ui === "undefined") {
        return;
    }
    try {
        ui.activateTool({
            id: LOOK_INSIDE_HOVER_TOOL_ID,
            cursor: "arrow",
            filter: ["terrain"],
            onStart: () => {
                log("lookInside", "Cursor hover tool grabbed");
                disarmHover();
                lastRotation = currentViewportRotation();
                applyCurrentTabRoofs();
            },
            onMove: (event) => {
                onHoverMove(event);
            },
            onDown: () => {
                return;
            },
            onFinish: () => {
                log("lookInside", "Cursor hover tool released");
                disarmHover();
                if (tabMode === "cursorHover") {
                    applyCurrentTabRoofs();
                }
            }
        });
    } catch (e) {
        error("lookInside", "Failed to grab cursor hover tool", e);
    }
}

export function maybeGrabLookInsideHover(): void {
    if (tabMode !== "cursorHover") {
        return;
    }
    if (typeof ui === "undefined") {
        return;
    }
    if (ui.tool !== null) {
        return;
    }
    activateHoverTool();
}

export function cancelLookInsideHover(): void {
    if (!isLookInsideHoverActive() || !ui.tool) {
        return;
    }
    ui.tool.cancel();
}

export function onLookInsideTabModeChanged(mode: TabRoofMode): void {
    tabMode = mode;
    saveTabRoofModeToPark(mode);
    disarmHover();
    if (mode !== "cursorHover") {
        cancelLookInsideHover();
    }
    lastRotation = currentViewportRotation();
    applyCurrentTabRoofs();
    if (mode === "cursorHover") {
        maybeGrabLookInsideHover();
    }
}

export function onLookInsideRoofsConfigChanged(): void {
    clearRoofElementCache();
    applyCurrentTabRoofs();
}

export function onLookInsideMapChange(): void {
    if (shouldIgnoreLookInsideMapChange()) {
        return;
    }
    lastRotation = currentViewportRotation();
    applyCurrentTabRoofs();
    maybeGrabLookInsideHover();
}

export function pollLookInsideHover(tickCount: number): void {
    const rotation = currentViewportRotation();
    if (rotation !== lastRotation) {
        lastRotation = rotation;
        applyCurrentTabRoofs();
    }
    if (tickCount % LOOK_INSIDE_HOVER_POLL_TICKS !== 0) {
        return;
    }
    maybeGrabLookInsideHover();
}
