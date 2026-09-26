/// <reference path="./../../openrct2.d.ts" />

import MapTile from "../../game/mapTile";
import TileCoords from "../../game/tileCoords";
import {
    isSceneryObjectType,
    sceneryObjectFromElement,
    tileLocationFromElement
} from "../../model/animation/step/scenery/sceneryQuery";
import {
    activatePickerTool,
    cancelToolIfId,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile,
    PickerToolEvent
} from "./pickerTool";

const TOOL_ID = "animator-pick-scenery";

export type PickedScenery = {
    tile: TileCoords;
    objectType: "small_scenery" | "large_scenery" | "wall";
    objectIdentifier: string;
    objectName: string;
    baseHeight: number;
    tileLocation?: number;
    direction: number;
    primaryColour: number;
    secondaryColour: number;
    tertiaryColour: number;
};

export function pickedFromElement(tile: TileCoords, element: TileElement): PickedScenery | null {
    if (!isSceneryObjectType(element.type)) {
        return null;
    }
    const loaded = sceneryObjectFromElement(element);
    if (!loaded) {
        return null;
    }
    const scenery = element as SmallSceneryElement | WallElement | LargeSceneryElement;
    const picked: PickedScenery = {
        tile: tile,
        objectType: scenery.type,
        objectIdentifier: loaded.identifier,
        objectName: loaded.name,
        baseHeight: scenery.baseHeight,
        direction: scenery.direction,
        primaryColour: scenery.primaryColour,
        secondaryColour: scenery.secondaryColour,
        tertiaryColour: scenery.tertiaryColour
    };
    const location = tileLocationFromElement(element);
    if (location !== undefined) {
        picked.tileLocation = location;
    }
    return picked;
}

function resolvePickedScenery(event: PickerToolEvent): PickedScenery | null {
    const tile = mapCoordsToTile(event.mapCoords);
    if (!tile) {
        return null;
    }
    const mapTile = MapTile.at(tile);
    if (!mapTile) {
        return null;
    }

    if (event.tileElementIndex !== undefined) {
        const element = mapTile.getElement(event.tileElementIndex);
        const picked = pickedFromElement(tile, element);
        if (picked) {
            return picked;
        }
    }

    for (let i = 0; i < mapTile.numElements; i++) {
        const picked = pickedFromElement(tile, mapTile.getElement(i));
        if (picked) {
            return picked;
        }
    }

    return null;
}

/**
 * Activate a scenery picker. Click small scenery, a wall, or large scenery.
 * Cancels after one pick unless stayActive is true.
 */
export function pickScenery(
    onPicked: (picked: PickedScenery) => void,
    onToolFinish?: () => void,
    stayActive?: boolean
): void {
    activatePickerTool<PickedScenery>({
        id: TOOL_ID,
        filter: ["scenery", "wall", "large_scenery"],
        resolve: (event) => resolvePickedScenery(event),
        onHover: (picked) => highlightMapTile(picked.tile),
        onPick: onPicked,
        stayActive: stayActive,
        onFinish: () => {
            clearTileSelection();
            if (onToolFinish) {
                onToolFinish();
            }
        }
    });
}

export function cancelPickScenery(): void {
    cancelToolIfId(TOOL_ID);
}

export type CollectSceneryOptions = {
    objectType?: "small_scenery" | "large_scenery" | "wall";
    minBaseHeight?: number;
};

/** Scenery on the given tiles, skipping ghosts. minBaseHeight is exclusive (above). */
export function collectPickedSceneryOnTiles(
    tiles: TileCoords[],
    options?: CollectSceneryOptions
): PickedScenery[] {
    const out: PickedScenery[] = [];
    for (let t = 0; t < tiles.length; t++) {
        const tile = tiles[t];
        const mapTile = MapTile.at(tile);
        if (!mapTile) {
            continue;
        }
        for (let i = 0; i < mapTile.numElements; i++) {
            const element = mapTile.getElement(i);
            if (element.isGhost) {
                continue;
            }
            const picked = pickedFromElement(tile, element);
            if (!picked) {
                continue;
            }
            if (options && options.objectType && picked.objectType !== options.objectType) {
                continue;
            }
            if (options && options.minBaseHeight !== undefined && picked.baseHeight <= options.minBaseHeight) {
                continue;
            }
            out.push(picked);
        }
    }
    return out;
}
