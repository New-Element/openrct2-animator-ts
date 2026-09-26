import TileCoords from "../../../game/tileCoords";
import {error} from "../../logger";
import {TileTargetDesc, TileTargetOrigin, VariableTileValue} from "../jsonTypes";
import {contextTiles} from "../trigger/contextLists";
import {findVariableById} from "../variableLookup";
import StepRunContext from "./stepRunContext";

export type LoadedTileTarget = {
    origin: TileTargetOrigin;
    relativeToTrigger: boolean;
    tile: TileCoords;
    offset: TileCoords;
    tileVariableId: string;
};

function copyCoords(coords: TileCoords | undefined, fallback: TileCoords): TileCoords {
    if (!coords || typeof coords.x !== "number" || typeof coords.y !== "number") {
        return {x: fallback.x, y: fallback.y};
    }
    return {x: coords.x, y: coords.y};
}

export function readTileTargetOrigin(desc: TileTargetDesc): TileTargetOrigin {
    if (desc.origin === "variable") {
        return "variable";
    }
    if (desc.origin === "trigger" || desc.relativeToTrigger === true) {
        return "trigger";
    }
    return "fixed";
}

export function loadTileTarget(desc: TileTargetDesc): LoadedTileTarget {
    const origin = readTileTargetOrigin(desc);
    return {
        origin: origin,
        relativeToTrigger: origin === "trigger",
        tile: copyCoords(desc.tile, {x: 0, y: 0}),
        offset: copyCoords(desc.offset, {x: 0, y: 0}),
        tileVariableId: typeof desc.tileVariableId === "string" ? desc.tileVariableId : ""
    };
}

export function persistTileTargetFields(target: {
    origin?: TileTargetOrigin;
    relativeToTrigger?: boolean;
    tile: TileCoords;
    offset: TileCoords;
    tileVariableId?: string;
}): TileTargetDesc {
    const origin = target.origin || (target.relativeToTrigger ? "trigger" : "fixed");
    if (origin === "variable") {
        return {
            origin: "variable",
            tileVariableId: target.tileVariableId || "",
            offset: {x: target.offset.x, y: target.offset.y}
        };
    }
    if (origin === "trigger") {
        return {
            origin: "trigger",
            relativeToTrigger: true,
            offset: {x: target.offset.x, y: target.offset.y}
        };
    }
    return {
        tile: {x: target.tile.x, y: target.tile.y}
    };
}

function logMetaFromRun(run: StepRunContext): {animationId?: string; triggerId?: string} {
    const r = run as StepRunContext & {animation?: {id: string}; sourceTriggerId?: string};
    const meta: {animationId?: string; triggerId?: string} = {};
    if (r.animation && typeof r.animation.id === "string") {
        meta.animationId = r.animation.id;
    }
    if (typeof r.sourceTriggerId === "string") {
        meta.triggerId = r.sourceTriggerId;
    }
    return meta;
}

function addOffset(tile: TileCoords, offset: TileCoords): TileCoords {
    return {
        x: tile.x + offset.x,
        y: tile.y + offset.y
    };
}

/**
 * World tile for a loaded target. Variable origin uses the variable's current
 * stored tile (no formula evaluation).
 */
export function resolveLoadedTile(
    target: LoadedTileTarget,
    fireTile: TileCoords | undefined,
    stepLabel: string,
    meta?: {animationId?: string; triggerId?: string}
): TileCoords | null {
    if (target.origin === "fixed") {
        return {x: target.tile.x, y: target.tile.y};
    }

    if (target.origin === "variable") {
        const variable = findVariableById(target.tileVariableId);
        if (!variable || variable.valueType !== "tile") {
            error("step", `${stepLabel}: tile variable is missing`, undefined, meta);
            return null;
        }
        const value = variable.value;
        if (!value || typeof value !== "object") {
            error("step", `${stepLabel}: tile variable has no tile value`, undefined, meta);
            return null;
        }
        const tile = value as VariableTileValue;
        return addOffset({x: tile.x, y: tile.y}, target.offset);
    }

    if (!fireTile || typeof fireTile.x !== "number" || typeof fireTile.y !== "number") {
        error(
            "step",
            `${stepLabel}: relative tile needs a trigger that fired on a tile`,
            undefined,
            meta
        );
        return null;
    }

    return addOffset({x: fireTile.x, y: fireTile.y}, target.offset);
}

/**
 * World tiles for a step. Trigger origin uses every context tile + offset.
 */
export function resolveStepTiles(
    run: StepRunContext,
    target: LoadedTileTarget,
    stepLabel: string
): TileCoords[] {
    const meta = logMetaFromRun(run);
    if (target.origin === "trigger") {
        const tiles = contextTiles(run.triggerContext);
        if (tiles.length === 0) {
            error(
                "step",
                `${stepLabel}: relative tile needs a trigger that fired on a tile`,
                undefined,
                meta
            );
            return [];
        }
        const out: TileCoords[] = [];
        for (let i = 0; i < tiles.length; i++) {
            out.push(addOffset({x: tiles[i].x, y: tiles[i].y}, target.offset));
        }
        return out;
    }
    const tile = resolveLoadedTile(target, run.triggerContext.tile, stepLabel, meta);
    return tile ? [tile] : [];
}
