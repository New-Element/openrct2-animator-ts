/// <reference path="./../../openrct2.d.ts" />

import MapTile from "../../game/mapTile";
import {error} from "../logger";
import {
    matchSceneryElement,
    resolveSceneryObject,
    ResolvedSceneryObject,
    SceneryQuery
} from "../animation/step/scenery/sceneryQuery";
import Building from "./building";
import {RoofObject} from "./buildingTypes";

type RememberedRoof = {
    originalHidden: boolean;
    buildingId: string;
    tileX: number;
    tileY: number;
    elementIndex: number;
};

type TileRoofGroup = {
    x: number;
    y: number;
    objects: RoofObject[];
};

const remembered: {[key: string]: RememberedRoof} = {};
const resolvedCache: {[key: string]: ResolvedSceneryObject | null} = {};

type CachedTileRoofs = {
    numElements: number;
    indicesByObjectId: {[objectId: string]: number[]};
};

/** buildingId + tile → element indexes found for each roof piece. */
let tileRoofCache: {[key: string]: CachedTileRoofs} = {};

/** Drop remembered element indexes. No id clears every building. */
export function clearRoofElementCache(buildingId?: string): void {
    if (!buildingId) {
        tileRoofCache = {};
        return;
    }
    const prefix = buildingId + ":";
    const next: {[key: string]: CachedTileRoofs} = {};
    for (const key in tileRoofCache) {
        if (key.indexOf(prefix) !== 0) {
            next[key] = tileRoofCache[key];
        }
    }
    tileRoofCache = next;
}

function tileCacheKey(buildingId: string, x: number, y: number): string {
    return buildingId + ":" + x + "," + y;
}

let applyDepth = 0;
let lastApplyTick = -1;

const MAP_CHANGE_IGNORE_TICKS = 8;

function currentTick(): number {
    if (typeof date !== "undefined") {
        return date.ticksElapsed;
    }
    return 0;
}

export function beginRoofVisibilityApply(): void {
    applyDepth += 1;
    lastApplyTick = currentTick();
}

export function endRoofVisibilityApply(): void {
    applyDepth -= 1;
    if (applyDepth < 0) {
        applyDepth = 0;
    }
    lastApplyTick = currentTick();
}

export function shouldIgnoreLookInsideMapChange(): boolean {
    if (applyDepth > 0) {
        return true;
    }
    return currentTick() - lastApplyTick <= MAP_CHANGE_IGNORE_TICKS;
}

function rememberedKey(tileX: number, tileY: number, elementIndex: number): string {
    return `${tileX},${tileY},${elementIndex}`;
}

function groupRoofObjectsByTile(objects: RoofObject[]): TileRoofGroup[] {
    const indexByKey: {[key: string]: number} = {};
    const groups: TileRoofGroup[] = [];
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const key = `${object.tile.x},${object.tile.y}`;
        if (!Object.prototype.hasOwnProperty.call(indexByKey, key)) {
            indexByKey[key] = groups.length;
            groups.push({x: object.tile.x, y: object.tile.y, objects: []});
        }
        groups[indexByKey[key]].objects.push(object);
    }
    return groups;
}

export function hideFlagForRotation(object: RoofObject, rotation: number): boolean {
    const r = ((rotation % 4) + 4) % 4;
    if (r === 0) {
        return object.hideNorth !== false;
    }
    if (r === 1) {
        return object.hideEast !== false;
    }
    if (r === 2) {
        return object.hideSouth !== false;
    }
    return object.hideWest !== false;
}

function queryFromRoofObject(object: RoofObject): SceneryQuery {
    const query: SceneryQuery = {
        objectType: object.objectType,
        objectIdentifier: object.objectIdentifier,
        baseHeight: object.baseHeight,
        primaryColour: object.primaryColour,
        secondaryColour: object.secondaryColour,
        tertiaryColour: object.tertiaryColour
    };
    if (object.tileLocation !== undefined) {
        query.tileLocation = object.tileLocation;
    }
    return query;
}

function resolvedForRoofObject(object: RoofObject): ResolvedSceneryObject | null {
    const key = `${object.objectType}:${object.objectIdentifier}`;
    if (Object.prototype.hasOwnProperty.call(resolvedCache, key)) {
        return resolvedCache[key];
    }
    const resolved = resolveSceneryObject(object.objectIdentifier, object.objectType);
    resolvedCache[key] = resolved;
    return resolved;
}

function firstMatchingRoofObject(element: TileElement, objects: RoofObject[]): RoofObject | null {
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const resolved = resolvedForRoofObject(object);
        if (!resolved) {
            continue;
        }
        if (matchSceneryElement(element, queryFromRoofObject(object), resolved)) {
            return object;
        }
    }
    return null;
}

function setElementHidden(element: TileElement, hidden: boolean): void {
    if (element.isHidden === hidden) {
        return;
    }
    const nested = applyDepth > 0;
    if (!nested) {
        beginRoofVisibilityApply();
    }
    try {
        element.isHidden = hidden;
    } finally {
        if (!nested) {
            endRoofVisibilityApply();
        }
    }
}

function rememberAndSetHidden(
    buildingId: string,
    tileX: number,
    tileY: number,
    elementIndex: number,
    element: TileElement,
    hidden: boolean
): void {
    const key = rememberedKey(tileX, tileY, elementIndex);
    if (!remembered[key]) {
        remembered[key] = {
            originalHidden: element.isHidden,
            buildingId,
            tileX,
            tileY,
            elementIndex
        };
    }
    setElementHidden(element, hidden);
}

function restoreRememberedEntry(entry: RememberedRoof): void {
    const key = rememberedKey(entry.tileX, entry.tileY, entry.elementIndex);
    try {
        const mapTile = MapTile.atXY(entry.tileX, entry.tileY);
        if (mapTile && entry.elementIndex >= 0 && entry.elementIndex < mapTile.numElements) {
            setElementHidden(mapTile.getElement(entry.elementIndex), entry.originalHidden);
        }
    } catch (_e) {
        // Tile or element may be gone; still drop the remember slot.
    }
    delete remembered[key];
}

function cachedTileStillMatches(
    mapTile: MapTile,
    objects: RoofObject[],
    cached: CachedTileRoofs
): boolean {
    if (cached.numElements !== mapTile.numElements) {
        return false;
    }
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const indices = cached.indicesByObjectId[object.id];
        if (!indices) {
            return false;
        }
        const resolved = resolvedForRoofObject(object);
        if (!resolved) {
            if (indices.length !== 0) {
                return false;
            }
            continue;
        }
        const query = queryFromRoofObject(object);
        for (let n = 0; n < indices.length; n++) {
            const index = indices[n];
            if (index < 0 || index >= mapTile.numElements) {
                return false;
            }
            if (!matchSceneryElement(mapTile.getElement(index), query, resolved)) {
                return false;
            }
        }
    }
    return true;
}

function applyCachedTileRoofs(
    buildingId: string,
    x: number,
    y: number,
    mapTile: MapTile,
    objects: RoofObject[],
    cached: CachedTileRoofs,
    hiddenForObject: (object: RoofObject) => boolean
): void {
    for (let o = 0; o < objects.length; o++) {
        const object = objects[o];
        const indices = cached.indicesByObjectId[object.id];
        const hidden = hiddenForObject(object);
        for (let n = 0; n < indices.length; n++) {
            const index = indices[n];
            rememberAndSetHidden(
                buildingId,
                x,
                y,
                index,
                mapTile.getElement(index),
                hidden
            );
        }
    }
}

function scanTileRoofs(
    buildingId: string,
    x: number,
    y: number,
    mapTile: MapTile,
    objects: RoofObject[],
    hiddenForObject: (object: RoofObject) => boolean
): void {
    const indicesByObjectId: {[objectId: string]: number[]} = {};
    for (let o = 0; o < objects.length; o++) {
        indicesByObjectId[objects[o].id] = [];
    }
    for (let i = 0; i < mapTile.numElements; i++) {
        const element = mapTile.getElement(i);
        const matched = firstMatchingRoofObject(element, objects);
        if (!matched) {
            continue;
        }
        indicesByObjectId[matched.id].push(i);
        rememberAndSetHidden(
            buildingId,
            x,
            y,
            i,
            element,
            hiddenForObject(matched)
        );
    }
    tileRoofCache[tileCacheKey(buildingId, x, y)] = {
        numElements: mapTile.numElements,
        indicesByObjectId: indicesByObjectId
    };
}

function applyMatchingRoofElements(
    building: Building,
    hiddenForObject: (object: RoofObject) => boolean
): void {
    const groups = groupRoofObjectsByTile(building.roofObjects);
    for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        const mapTile = MapTile.atXY(group.x, group.y);
        if (!mapTile) {
            continue;
        }
        const key = tileCacheKey(building.id, group.x, group.y);
        const cached = tileRoofCache[key];
        if (cached && cachedTileStillMatches(mapTile, group.objects, cached)) {
            applyCachedTileRoofs(
                building.id,
                group.x,
                group.y,
                mapTile,
                group.objects,
                cached,
                hiddenForObject
            );
            continue;
        }
        scanTileRoofs(
            building.id,
            group.x,
            group.y,
            mapTile,
            group.objects,
            hiddenForObject
        );
    }
}

function restoreRememberedForBuilding(buildingId: string): void {
    const keys: string[] = [];
    for (const key in remembered) {
        if (remembered[key] && remembered[key].buildingId === buildingId) {
            keys.push(key);
        }
    }
    for (let i = 0; i < keys.length; i++) {
        const entry = remembered[keys[i]];
        if (entry) {
            restoreRememberedEntry(entry);
        }
    }
}

function withRoofApply(work: () => void): void {
    beginRoofVisibilityApply();
    try {
        work();
    } finally {
        endRoofVisibilityApply();
    }
}

/** Force this building's roof objects visible (isHidden = false). */
export function showBuildingRoofs(building: Building): void {
    withRoofApply(() => {
        try {
            const hiddenForObject = (): boolean => false;
            applyMatchingRoofElements(building, hiddenForObject);
        } catch (e) {
            error("lookInside", `Failed to show roofs for "${building.id}"`, e);
        }
    });
}

/** Hide roof objects whose flag matches the current camera rotation. */
export function hideBuildingRoofs(building: Building, rotation: number): void {
    withRoofApply(() => {
        try {
            const hiddenForObject = (object: RoofObject): boolean => hideFlagForRotation(object, rotation);
            applyMatchingRoofElements(building, hiddenForObject);
        } catch (e) {
            error("lookInside", `Failed to hide roofs for "${building.id}"`, e);
        }
    });
}

export function restoreBuildingRoofs(building: Building): void {
    withRoofApply(() => {
        try {
            restoreRememberedForBuilding(building.id);
        } catch (e) {
            error("lookInside", `Failed to restore roof visibility for "${building.id}"`, e);
        }
    });
}

export function restoreAllRoofs(): void {
    withRoofApply(() => {
        try {
            const keys: string[] = [];
            for (const key in remembered) {
                if (remembered[key]) {
                    keys.push(key);
                }
            }
            for (let i = 0; i < keys.length; i++) {
                const entry = remembered[keys[i]];
                if (entry) {
                    restoreRememberedEntry(entry);
                }
            }
        } catch (e) {
            error("lookInside", "Failed to restore roof visibility", e);
        }
    });
}

export function currentViewportRotation(): number {
    if (typeof ui === "undefined" || !ui.mainViewport) {
        return 0;
    }
    return ui.mainViewport.rotation;
}
