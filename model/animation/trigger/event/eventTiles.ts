import TileCoords from "../../../../game/tileCoords";
import {TravelDirection} from "../../jsonTypes";
import {CarPos} from "../rideCarSnapshot";
import TriggerContext from "../triggerContext";

export type EventTilesSource = {
    tiles?: TileCoords[];
    /** @deprecated Old single-tile field; converted into a one-item list on load. */
    tile?: TileCoords;
};

export function tileLookupKey(x: number, y: number): string {
    return `${x},${y}`;
}

export function occupiedTileKey(carId: number, tileX: number, tileY: number): string {
    return `${carId}-${tileX}-${tileY}`;
}

export function copyTiles(tiles: TileCoords[]): TileCoords[] {
    const out: TileCoords[] = [];
    for (let i = 0; i < tiles.length; i++) {
        out.push({x: tiles[i].x, y: tiles[i].y});
    }
    return out;
}

export function buildTileLookup(tiles: TileCoords[]): {[key: string]: boolean} {
    const lookup: {[key: string]: boolean} = {};
    for (let i = 0; i < tiles.length; i++) {
        lookup[tileLookupKey(tiles[i].x, tiles[i].y)] = true;
    }
    return lookup;
}

/** Old parks with no direction field become either. */
export function loadTravelDirection(direction?: string): TravelDirection {
    if (direction === "forwards" || direction === "backwards") {
        return direction;
    }
    return "either";
}

export function matchesTravelDirection(direction: TravelDirection, velocity: number): boolean {
    if (direction === "either") {
        return true;
    }
    if (direction === "forwards") {
        return velocity > 0;
    }
    return velocity < 0;
}

/**
 * Always returns a list. Old parks with `tile` become a one-item array.
 */
export function loadTilesFromDesc(data: EventTilesSource): TileCoords[] {
    if (Array.isArray(data.tiles)) {
        const out: TileCoords[] = [];
        const seen: {[key: string]: boolean} = {};
        for (let i = 0; i < data.tiles.length; i++) {
            const tile = data.tiles[i];
            if (!tile || typeof tile.x !== "number" || typeof tile.y !== "number") {
                continue;
            }
            const key = tileLookupKey(tile.x, tile.y);
            if (seen[key]) {
                continue;
            }
            seen[key] = true;
            out.push({x: tile.x, y: tile.y});
        }
        if (out.length > 0 || !data.tile) {
            return out;
        }
    }
    if (data.tile && typeof data.tile.x === "number" && typeof data.tile.y === "number") {
        return [{x: data.tile.x, y: data.tile.y}];
    }
    return [];
}

/**
 * Edge-detect cars/train heads entering any watched tile.
 * Mutates `occupied` (persisted on-tile keys) the same way the old single-tile maps did.
 */
export function collectTileEnterContexts(
    positions: CarPos[],
    tiles: TileCoords[],
    occupied: {[key: string]: boolean},
    toContext: (pos: CarPos) => TriggerContext,
    direction: TravelDirection = "either"
): TriggerContext[] {
    if (tiles.length === 0) {
        return [];
    }

    const watched = buildTileLookup(tiles);
    const occupiedThisTick: {[key: string]: boolean} = {};
    const fired: TriggerContext[] = [];

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if (!watched[tileLookupKey(pos.tileX, pos.tileY)]) {
            continue;
        }

        const key = occupiedTileKey(pos.carId, pos.tileX, pos.tileY);
        occupiedThisTick[key] = true;
        if (!occupied[key]) {
            occupied[key] = true;
            if (matchesTravelDirection(direction, pos.velocity)) {
                fired.push(toContext(pos));
            }
        }
    }

    for (const key in occupied) {
        if (!occupied[key]) {
            continue;
        }
        const keyParts = key.split("-");
        if (keyParts.length < 3) {
            continue;
        }
        const keyTileX = parseInt(keyParts[1]);
        const keyTileY = parseInt(keyParts[2]);
        if (!watched[tileLookupKey(keyTileX, keyTileY)]) {
            continue;
        }
        if (!occupiedThisTick[key]) {
            delete occupied[key];
        }
    }

    return fired;
}
