/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {error} from "../../../logger";
import {
    NumberSourceOrigin,
    SceneryObjectType,
    SceneryVisibilityMode,
    SceneryVisibilityStepDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields, resolveStepTiles} from "../tileTarget";
import {matchSceneryElement, resolveSceneryObject, ResolvedSceneryObject, SceneryQuery} from "./sceneryQuery";

type RunLogIds = StepRunContext & {
    animation?: {id: string};
    sourceTriggerId?: string;
};

function logMetaFromRun(run: StepRunContext): {animationId?: string; triggerId?: string} {
    const r = run as RunLogIds;
    const meta: {animationId?: string; triggerId?: string} = {};
    if (r.animation && typeof r.animation.id === "string") {
        meta.animationId = r.animation.id;
    }
    if (typeof r.sourceTriggerId === "string") {
        meta.triggerId = r.sourceTriggerId;
    }
    return meta;
}

function resolveOptionalInt(
    hardcoded: number | undefined,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined,
    label: string,
    meta: {animationId?: string; triggerId?: string}
): number | undefined {
    if (hardcoded === undefined && origin !== "variable") {
        return undefined;
    }
    const value = resolveNumberSource(hardcoded || 0, origin, variableId, "int", label, meta);
    return value === null ? undefined : value;
}

function persistOptionalNumber(
    data: SceneryVisibilityStepDesc,
    field: "baseHeight" | "tileLocation" | "primaryColour" | "secondaryColour" | "tertiaryColour",
    hardcoded: number | undefined,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined
): void {
    if (hardcoded === undefined && origin !== "variable") {
        return;
    }
    const source = persistNumberSource(hardcoded || 0, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    data[field] = source.value;
    if (source.origin === "variable") {
        data[`${field}Origin`] = "variable";
        data[`${field}VariableId`] = source.variableId || "";
    }
}

function queryFromStep(step: SceneryVisibilityStep, meta: {animationId?: string; triggerId?: string}): SceneryQuery {
    const query: SceneryQuery = {};
    if (step.objectType) {
        query.objectType = step.objectType;
    }
    if (step.objectIdentifier) {
        query.objectIdentifier = step.objectIdentifier;
    }
    const baseHeight = resolveOptionalInt(step.baseHeight, step.baseHeightOrigin, step.baseHeightVariableId, "Scenery Visibility Height", meta);
    const tileLocation = resolveOptionalInt(step.tileLocation, step.tileLocationOrigin, step.tileLocationVariableId, "Scenery Visibility Location", meta);
    const primaryColour = resolveOptionalInt(step.primaryColour, step.primaryColourOrigin, step.primaryColourVariableId, "Scenery Visibility Primary", meta);
    const secondaryColour = resolveOptionalInt(step.secondaryColour, step.secondaryColourOrigin, step.secondaryColourVariableId, "Scenery Visibility Secondary", meta);
    const tertiaryColour = resolveOptionalInt(step.tertiaryColour, step.tertiaryColourOrigin, step.tertiaryColourVariableId, "Scenery Visibility Tertiary", meta);
    if (baseHeight !== undefined) {
        query.baseHeight = baseHeight;
    }
    if (tileLocation !== undefined) {
        query.tileLocation = tileLocation;
    }
    if (primaryColour !== undefined) {
        query.primaryColour = primaryColour;
    }
    if (secondaryColour !== undefined) {
        query.secondaryColour = secondaryColour;
    }
    if (tertiaryColour !== undefined) {
        query.tertiaryColour = tertiaryColour;
    }
    return query;
}

/**
 * Instantly set or toggle isHidden on scenery matching optional Any filters on one tile.
 */
export default class SceneryVisibilityStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    mode: SceneryVisibilityMode;
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    baseHeightOrigin?: NumberSourceOrigin;
    baseHeightVariableId?: string;
    tileLocation?: number;
    tileLocationOrigin?: NumberSourceOrigin;
    tileLocationVariableId?: string;
    primaryColour?: number;
    primaryColourOrigin?: NumberSourceOrigin;
    primaryColourVariableId?: string;
    secondaryColour?: number;
    secondaryColourOrigin?: NumberSourceOrigin;
    secondaryColourVariableId?: string;
    tertiaryColour?: number;
    tertiaryColourOrigin?: NumberSourceOrigin;
    tertiaryColourVariableId?: string;

    constructor(obj: SceneryVisibilityStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.mode = obj.mode;
        this.objectType = obj.objectType;
        this.objectIdentifier = obj.objectIdentifier;
        this.baseHeight = obj.baseHeight;
        this.baseHeightOrigin = obj.baseHeightOrigin;
        this.baseHeightVariableId = obj.baseHeightVariableId;
        this.tileLocation = obj.tileLocation;
        this.tileLocationOrigin = obj.tileLocationOrigin;
        this.tileLocationVariableId = obj.tileLocationVariableId;
        this.primaryColour = obj.primaryColour;
        this.primaryColourOrigin = obj.primaryColourOrigin;
        this.primaryColourVariableId = obj.primaryColourVariableId;
        this.secondaryColour = obj.secondaryColour;
        this.secondaryColourOrigin = obj.secondaryColourOrigin;
        this.secondaryColourVariableId = obj.secondaryColourVariableId;
        this.tertiaryColour = obj.tertiaryColour;
        this.tertiaryColourOrigin = obj.tertiaryColourOrigin;
        this.tertiaryColourVariableId = obj.tertiaryColourVariableId;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const tiles = resolveStepTiles(run, this.tileTarget, "Scenery Visibility");
        const query = queryFromStep(this, meta);
        let resolvedObject: ResolvedSceneryObject | undefined;
        if (this.objectIdentifier) {
            const resolved = resolveSceneryObject(this.objectIdentifier, this.objectType);
            if (!resolved) {
                error(
                    "step",
                    `Scenery Visibility: object "${this.objectIdentifier}" is not loaded`,
                    undefined,
                    meta
                );
                return;
            }
            resolvedObject = resolved;
        }

        for (let t = 0; t < tiles.length; t++) {
            const tile = tiles[t];
            const mapTile = MapTile.at(tile);
            if (!mapTile) {
                error(
                    "step",
                    `Scenery Visibility: no tile at (${tile.x}, ${tile.y})`,
                    undefined,
                    meta
                );
                continue;
            }

            const matchIndices: number[] = [];
            for (let i = 0; i < mapTile.numElements; i++) {
                const element = mapTile.getElement(i);
                if (matchSceneryElement(element, query, resolvedObject)) {
                    matchIndices.push(i);
                }
            }

            if (matchIndices.length === 0) {
                error(
                    "step",
                    `Scenery Visibility: no matching scenery at (${tile.x}, ${tile.y})`,
                    undefined,
                    meta
                );
                continue;
            }

            for (let i = 0; i < matchIndices.length; i++) {
                const element = mapTile.getElement(matchIndices[i]);
                if (this.mode === "visible") {
                    element.isHidden = false;
                } else if (this.mode === "invisible") {
                    element.isHidden = true;
                } else {
                    element.isHidden = !element.isHidden;
                }
            }
        }
    }

    getDataToPersist(): object {
        const data: SceneryVisibilityStepDesc = {
            type: "sceneryVisibility",
            ...persistTileTargetFields(this.tileTarget),
            mode: this.mode
        };
        if (this.objectType) {
            data.objectType = this.objectType;
        }
        if (this.objectIdentifier) {
            data.objectIdentifier = this.objectIdentifier;
        }
        persistOptionalNumber(data, "baseHeight", this.baseHeight, this.baseHeightOrigin, this.baseHeightVariableId);
        persistOptionalNumber(data, "tileLocation", this.tileLocation, this.tileLocationOrigin, this.tileLocationVariableId);
        persistOptionalNumber(data, "primaryColour", this.primaryColour, this.primaryColourOrigin, this.primaryColourVariableId);
        persistOptionalNumber(data, "secondaryColour", this.secondaryColour, this.secondaryColourOrigin, this.secondaryColourVariableId);
        persistOptionalNumber(data, "tertiaryColour", this.tertiaryColour, this.tertiaryColourOrigin, this.tertiaryColourVariableId);
        return data;
    }
}
