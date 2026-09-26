/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {NumberSourceOrigin, SceneryObjectType, SceneryRotationStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun, resolveStepMapTiles} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields} from "../tileTarget";
import {
    matchSceneryElement,
    persistSceneryTargetFields,
    resolveSceneryObject,
    ResolvedSceneryObject,
    sceneryQueryFromTarget
} from "./sceneryQuery";

function asDirection(value: number): Direction {
    const n = ((value % 4) + 4) % 4;
    return n as Direction;
}

export default class SceneryRotationStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    tileLocation?: number;
    direction: number;
    directionOrigin?: NumberSourceOrigin;
    directionVariableId?: string;

    constructor(obj: SceneryRotationStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.objectType = obj.objectType;
        this.objectIdentifier = obj.objectIdentifier;
        this.baseHeight = obj.baseHeight;
        this.tileLocation = obj.tileLocation;
        this.direction = typeof obj.direction === "number" ? obj.direction : 0;
        this.directionOrigin = obj.directionOrigin;
        this.directionVariableId = obj.directionVariableId;
    }

    protected apply(run: StepRunContext): void {
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Rotate Scenery");
        if (mapTiles.length === 0) {
            return;
        }
        const query = sceneryQueryFromTarget(this);
        let resolvedObject: ResolvedSceneryObject | undefined;
        if (this.objectIdentifier) {
            const found = resolveSceneryObject(this.objectIdentifier, this.objectType);
            if (!found) {
                error(
                    "step",
                    `Rotate Scenery: object "${this.objectIdentifier}" is not loaded`,
                    undefined,
                    logMetaFromRun(run)
                );
                return;
            }
            resolvedObject = found;
        }
        const resolvedDirection = resolveNumberSource(
            this.direction,
            this.directionOrigin,
            this.directionVariableId,
            "direction",
            "Rotate Scenery Direction",
            logMetaFromRun(run)
        );
        if (resolvedDirection === null) {
            return;
        }
        const direction = asDirection(resolvedDirection);
        let count = 0;
        for (let t = 0; t < mapTiles.length; t++) {
            const mapTile = mapTiles[t];
            for (let i = 0; i < mapTile.numElements; i++) {
                const element = mapTile.getElement(i);
                if (!matchSceneryElement(element, query, resolvedObject)) {
                    continue;
                }
                const scenery = element as SmallSceneryElement | WallElement | LargeSceneryElement;
                scenery.direction = direction;
                count += 1;
            }
        }
        if (count === 0) {
            error("step", "Rotate Scenery: no matching scenery", undefined, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        const data: SceneryRotationStepDesc = {
            type: "sceneryRotation",
            ...persistTileTargetFields(this.tileTarget),
            ...persistSceneryTargetFields(this),
            ...persistNamedDirection(this.direction, this.directionOrigin, this.directionVariableId)
        };
        return data;
    }
}

function persistNamedDirection(
    hardcoded: number,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined
): {direction: number; directionOrigin?: NumberSourceOrigin; directionVariableId?: string} {
    const source = persistNumberSource(hardcoded, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    return {
        direction: asDirection(source.value),
        ...(source.origin === "variable" ? {directionOrigin: "variable" as const, directionVariableId: source.variableId || ""} : {})
    };
}
