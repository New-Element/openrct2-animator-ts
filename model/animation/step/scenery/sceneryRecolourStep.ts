/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {NumberSourceOrigin, SceneryObjectType, SceneryRecolourStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun, resolveStepMapTiles} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields} from "../tileTarget";
import {matchSceneryElement, resolveSceneryObject, ResolvedSceneryObject, SceneryQuery} from "./sceneryQuery";

export default class SceneryRecolourStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    baseHeightOrigin?: NumberSourceOrigin;
    baseHeightVariableId?: string;
    tileLocation?: number;
    tileLocationOrigin?: NumberSourceOrigin;
    tileLocationVariableId?: string;
    setPrimary?: number;
    setPrimaryOrigin?: NumberSourceOrigin;
    setPrimaryVariableId?: string;
    setSecondary?: number;
    setSecondaryOrigin?: NumberSourceOrigin;
    setSecondaryVariableId?: string;
    setTertiary?: number;
    setTertiaryOrigin?: NumberSourceOrigin;
    setTertiaryVariableId?: string;

    constructor(obj: SceneryRecolourStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.objectType = obj.objectType;
        this.objectIdentifier = obj.objectIdentifier;
        this.baseHeight = obj.baseHeight;
        this.baseHeightOrigin = obj.baseHeightOrigin;
        this.baseHeightVariableId = obj.baseHeightVariableId;
        this.tileLocation = obj.tileLocation;
        this.tileLocationOrigin = obj.tileLocationOrigin;
        this.tileLocationVariableId = obj.tileLocationVariableId;
        this.setPrimary = obj.setPrimary;
        this.setPrimaryOrigin = obj.setPrimaryOrigin;
        this.setPrimaryVariableId = obj.setPrimaryVariableId;
        this.setSecondary = obj.setSecondary;
        this.setSecondaryOrigin = obj.setSecondaryOrigin;
        this.setSecondaryVariableId = obj.setSecondaryVariableId;
        this.setTertiary = obj.setTertiary;
        this.setTertiaryOrigin = obj.setTertiaryOrigin;
        this.setTertiaryVariableId = obj.setTertiaryVariableId;
    }

    protected apply(run: StepRunContext): void {
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Recolour Scenery");
        if (mapTiles.length === 0) {
            return;
        }
        const meta = logMetaFromRun(run);
        const baseHeight = resolveOptionalInt(this.baseHeight, this.baseHeightOrigin, this.baseHeightVariableId, "Recolour Scenery Height", meta);
        const tileLocation = resolveOptionalInt(this.tileLocation, this.tileLocationOrigin, this.tileLocationVariableId, "Recolour Scenery Location", meta);
        const setPrimary = resolveOptionalInt(this.setPrimary, this.setPrimaryOrigin, this.setPrimaryVariableId, "Recolour Scenery Primary", meta);
        const setSecondary = resolveOptionalInt(this.setSecondary, this.setSecondaryOrigin, this.setSecondaryVariableId, "Recolour Scenery Secondary", meta);
        const setTertiary = resolveOptionalInt(this.setTertiary, this.setTertiaryOrigin, this.setTertiaryVariableId, "Recolour Scenery Tertiary", meta);
        const query: SceneryQuery = {};
        if (this.objectType) {
            query.objectType = this.objectType;
        }
        if (baseHeight !== undefined) {
            query.baseHeight = baseHeight;
        }
        if (tileLocation !== undefined) {
            query.tileLocation = tileLocation;
        }
        let resolved: ResolvedSceneryObject | undefined;
        if (this.objectIdentifier) {
            const found = resolveSceneryObject(this.objectIdentifier, this.objectType);
            if (!found) {
                error(
                    "step",
                    `Recolour Scenery: object "${this.objectIdentifier}" is not loaded`,
                    undefined,
                    logMetaFromRun(run)
                );
                return;
            }
            resolved = found;
        }
        let count = 0;
        for (let t = 0; t < mapTiles.length; t++) {
            const mapTile = mapTiles[t];
            for (let i = 0; i < mapTile.numElements; i++) {
                const element = mapTile.getElement(i);
                if (!matchSceneryElement(element, query, resolved)) {
                    continue;
                }
                const scenery = element as SmallSceneryElement | WallElement | LargeSceneryElement;
                if (setPrimary !== undefined) {
                    scenery.primaryColour = setPrimary;
                }
                if (setSecondary !== undefined) {
                    scenery.secondaryColour = setSecondary;
                }
                if (setTertiary !== undefined) {
                    scenery.tertiaryColour = setTertiary;
                }
                count += 1;
            }
        }
        if (count === 0) {
            error("step", "Recolour Scenery: no matching scenery", undefined, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        const data: SceneryRecolourStepDesc = {
            type: "sceneryRecolour",
            ...persistTileTargetFields(this.tileTarget)
        };
        if (this.objectType) {
            data.objectType = this.objectType;
        }
        if (this.objectIdentifier) {
            data.objectIdentifier = this.objectIdentifier;
        }
        persistOptionalNumber(data, "baseHeight", this.baseHeight, this.baseHeightOrigin, this.baseHeightVariableId);
        persistOptionalNumber(data, "tileLocation", this.tileLocation, this.tileLocationOrigin, this.tileLocationVariableId);
        persistOptionalNumber(data, "setPrimary", this.setPrimary, this.setPrimaryOrigin, this.setPrimaryVariableId);
        persistOptionalNumber(data, "setSecondary", this.setSecondary, this.setSecondaryOrigin, this.setSecondaryVariableId);
        persistOptionalNumber(data, "setTertiary", this.setTertiary, this.setTertiaryOrigin, this.setTertiaryVariableId);
        return data;
    }
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
    data: SceneryRecolourStepDesc,
    field: "baseHeight" | "tileLocation" | "setPrimary" | "setSecondary" | "setTertiary",
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
