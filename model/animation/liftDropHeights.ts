import {LiftDropStageTriggers, LiftDropTrackStepDesc} from "./jsonTypes";

function copyStageTriggers(
    stageTriggers: LiftDropStageTriggers | undefined
): LiftDropStageTriggers | undefined {
    if (!stageTriggers) {
        return undefined;
    }
    const next: LiftDropStageTriggers = {};
    if (typeof stageTriggers.trainEnters === "string" && stageTriggers.trainEnters) {
        next.trainEnters = stageTriggers.trainEnters;
    }
    if (
        typeof stageTriggers.verticalMoveStarts === "string" &&
        stageTriggers.verticalMoveStarts
    ) {
        next.verticalMoveStarts = stageTriggers.verticalMoveStarts;
    }
    if (
        typeof stageTriggers.verticalMoveEnds === "string" &&
        stageTriggers.verticalMoveEnds
    ) {
        next.verticalMoveEnds = stageTriggers.verticalMoveEnds;
    }
    if (typeof stageTriggers.restoreStarts === "string" && stageTriggers.restoreStarts) {
        next.restoreStarts = stageTriggers.restoreStarts;
    }
    if (typeof stageTriggers.restoreEnds === "string" && stageTriggers.restoreEnds) {
        next.restoreEnds = stageTriggers.restoreEnds;
    }
    return Object.keys(next).length > 0 ? next : undefined;
}

/**
 * Coerce a stored height to land units.
 * Values ≥ 64 are treated as legacy pixel Z (÷8). Typical land heights are ≪ 64.
 */
function toLandUnits(value: number): number {
    return value >= 64 ? Math.floor(value / 8) : value;
}

/**
 * Read authored land-unit height from a lift/drop step desc.
 * Migrates legacy pixel `startZ`/`endZ`, and pixel-valued `startHeight`/`endHeight`.
 */
export function readLiftDropLandHeight(
    desc: LiftDropTrackStepDesc,
    which: "start" | "end"
): number {
    const modern = which === "start" ? desc.startHeight : desc.endHeight;
    if (typeof modern === "number") {
        return toLandUnits(modern);
    }
    const legacy = which === "start" ? desc.startZ : desc.endZ;
    if (typeof legacy === "number") {
        return toLandUnits(legacy);
    }
    return which === "start" ? 0 : 16;
}

/** Land units → pixel Z used by track baseHeight and car.z. */
export function landHeightToPixels(landHeight: number): number {
    return landHeight * 8;
}

/** Non-negative whole ticks. Missing or unusable values use `fallback`. */
export function readLiftDropWaitTicks(value: number | undefined, fallback: number): number {
    if (typeof value !== "number") {
        return fallback;
    }
    const ticks = Math.floor(value);
    if (ticks !== ticks || ticks === Infinity || ticks === -Infinity) {
        return fallback;
    }
    if (ticks < 0) {
        return 0;
    }
    return ticks > 100000 ? 100000 : ticks;
}

/**
 * Normalize a lift/drop step desc to land-unit fields only.
 * Returns whether the desc needed migration from legacy keys/values.
 */
export function normalizeLiftDropStepDesc(
    desc: LiftDropTrackStepDesc
): {desc: LiftDropTrackStepDesc; migrated: boolean} {
    const startHeight = readLiftDropLandHeight(desc, "start");
    const endHeight = readLiftDropLandHeight(desc, "end");
    const hadLegacyZ =
        typeof desc.startZ === "number" || typeof desc.endZ === "number";
    const hadLegacyWait = typeof desc.exitWaitTicks === "number";
    const missingModern =
        typeof desc.startHeight !== "number" || typeof desc.endHeight !== "number";
    const pixelValuedModern =
        (typeof desc.startHeight === "number" && desc.startHeight >= 64) ||
        (typeof desc.endHeight === "number" && desc.endHeight >= 64);
    const migrated =
        hadLegacyZ || hadLegacyWait || missingModern || pixelValuedModern;

    const next: LiftDropTrackStepDesc = {
        type: "liftDropTrack",
        startHeight: startHeight,
        endHeight: endHeight,
        speed: typeof desc.speed === "number" ? desc.speed : 100,
        reverseExitDirection: desc.reverseExitDirection === true,
        useTriggerTarget: desc.useTriggerTarget !== false
    };
    if (desc.startHeightOrigin === "variable") {
        next.startHeightOrigin = "variable";
        next.startHeightVariableId = desc.startHeightVariableId || "";
    }
    if (desc.endHeightOrigin === "variable") {
        next.endHeightOrigin = "variable";
        next.endHeightVariableId = desc.endHeightVariableId || "";
    }
    if (desc.speedOrigin === "variable") {
        next.speedOrigin = "variable";
        next.speedVariableId = desc.speedVariableId || "";
    }
    if (typeof desc.name === "string" && desc.name.trim()) {
        next.name = desc.name.trim();
    }
    if (typeof desc.rideId === "number") {
        next.rideId = desc.rideId;
    }
    if (typeof desc.trainIndex === "number") {
        next.trainIndex = desc.trainIndex;
    }
    if (typeof desc.carIndex === "number") {
        next.carIndex = desc.carIndex;
    }
    if (typeof desc.waitBeforeMoveTicks === "number") {
        next.waitBeforeMoveTicks = readLiftDropWaitTicks(desc.waitBeforeMoveTicks, 50);
    }
    if (typeof desc.waitAfterMoveTicks === "number") {
        next.waitAfterMoveTicks = readLiftDropWaitTicks(desc.waitAfterMoveTicks, 0);
    }
    const stageTriggers = copyStageTriggers(desc.stageTriggers);
    if (stageTriggers) {
        next.stageTriggers = stageTriggers;
    }
    return {desc: next, migrated};
}
