/// <reference path="./../../../../openrct2.d.ts" />

import {SceneryObjectType} from "../../jsonTypes";

export type SceneryQuery = {
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    tileLocation?: number;
    primaryColour?: number;
    secondaryColour?: number;
    tertiaryColour?: number;
};

export type SceneryTargetFields = {
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    tileLocation?: number;
};

export function sceneryQueryFromTarget(target: SceneryTargetFields): SceneryQuery {
    const query: SceneryQuery = {};
    if (target.objectType) {
        query.objectType = target.objectType;
    }
    if (target.objectIdentifier) {
        query.objectIdentifier = target.objectIdentifier;
    }
    if (target.baseHeight !== undefined) {
        query.baseHeight = target.baseHeight;
    }
    if (target.tileLocation !== undefined) {
        query.tileLocation = target.tileLocation;
    }
    return query;
}

export function persistSceneryTargetFields(target: SceneryTargetFields): SceneryTargetFields {
    const data: SceneryTargetFields = {};
    if (target.objectType) {
        data.objectType = target.objectType;
    }
    if (target.objectIdentifier) {
        data.objectIdentifier = target.objectIdentifier;
    }
    if (target.baseHeight !== undefined) {
        data.baseHeight = target.baseHeight;
    }
    if (target.tileLocation !== undefined) {
        data.tileLocation = target.tileLocation;
    }
    return data;
}

export type ResolvedSceneryObject = {
    type: SceneryObjectType;
    index: number;
    identifier: string;
    name: string;
};

const SCENERY_TYPES: SceneryObjectType[] = ["small_scenery", "large_scenery", "wall"];

/** identifier + type → loaded object. Filled on first use; park reload restarts the plugin. */
const resolvedObjects: { [key: string]: ResolvedSceneryObject | null } = {};

function resolvedObjectKey(identifier: string, objectType?: SceneryObjectType): string {
    return (objectType ? objectType : "*") + "\n" + identifier;
}

export function isSceneryObjectType(type: string): type is SceneryObjectType {
    return type === "small_scenery" || type === "large_scenery" || type === "wall";
}

export function resolveSceneryObject(
    identifier: string,
    objectType?: SceneryObjectType
): ResolvedSceneryObject | null {
    const key = resolvedObjectKey(identifier, objectType);
    if (Object.prototype.hasOwnProperty.call(resolvedObjects, key)) {
        return resolvedObjects[key];
    }
    if (typeof objectManager === "undefined") {
        return null;
    }
    const types = objectType ? [objectType] : SCENERY_TYPES;
    let resolved: ResolvedSceneryObject | null = null;
    for (let t = 0; t < types.length && !resolved; t++) {
        const loaded = objectManager.getAllObjects(types[t]);
        for (let i = 0; i < loaded.length; i++) {
            if (loaded[i].identifier === identifier) {
                resolved = {
                    type: types[t],
                    index: loaded[i].index,
                    identifier: loaded[i].identifier,
                    name: loaded[i].name
                };
                break;
            }
        }
    }
    resolvedObjects[key] = resolved;
    return resolved;
}

export function sceneryObjectFromElement(element: TileElement): ResolvedSceneryObject | null {
    if (!isSceneryObjectType(element.type)) {
        return null;
    }
    if (typeof objectManager === "undefined") {
        return null;
    }
    const scenery = element as SmallSceneryElement | WallElement | LargeSceneryElement;
    const loaded = objectManager.getObject(scenery.type, scenery.object);
    if (!loaded) {
        return null;
    }
    return {
        type: scenery.type,
        index: loaded.index,
        identifier: loaded.identifier,
        name: loaded.name
    };
}

/**
 * Match a tile element against optional Any filters.
 * Location is only applied when objectType is small_scenery or wall.
 * Pass resolvedObject when objectIdentifier was looked up for this apply.
 */
export function matchSceneryElement(
    element: TileElement,
    query: SceneryQuery,
    resolvedObject?: ResolvedSceneryObject
): boolean {
    if (element.isGhost) {
        return false;
    }
    if (!isSceneryObjectType(element.type)) {
        return false;
    }
    if (query.objectType && element.type !== query.objectType) {
        return false;
    }
    if (resolvedObject) {
        const scenery = element as SmallSceneryElement | WallElement | LargeSceneryElement;
        if (scenery.type !== resolvedObject.type || scenery.object !== resolvedObject.index) {
            return false;
        }
    }
    if (query.baseHeight !== undefined && element.baseHeight !== query.baseHeight) {
        return false;
    }
    if (query.tileLocation !== undefined) {
        if (query.objectType === "small_scenery") {
            if ((element as SmallSceneryElement).quadrant !== query.tileLocation) {
                return false;
            }
        } else if (query.objectType === "wall") {
            if ((element as WallElement).direction !== query.tileLocation) {
                return false;
            }
        }
    }
    const coloured = element as SmallSceneryElement | WallElement | LargeSceneryElement;
    if (query.primaryColour !== undefined && coloured.primaryColour !== query.primaryColour) {
        return false;
    }
    if (query.secondaryColour !== undefined && coloured.secondaryColour !== query.secondaryColour) {
        return false;
    }
    if (query.tertiaryColour !== undefined && coloured.tertiaryColour !== query.tertiaryColour) {
        return false;
    }
    return true;
}

export function tileLocationFromElement(element: TileElement): number | undefined {
    if (element.type === "small_scenery") {
        return (element as SmallSceneryElement).quadrant;
    }
    if (element.type === "wall") {
        return (element as WallElement).direction;
    }
    return undefined;
}
