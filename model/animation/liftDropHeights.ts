import {LiftDropTrackStepDesc} from "./jsonTypes";

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
    if (typeof desc.rideId === "number") {
        next.rideId = desc.rideId;
    }
    if (typeof desc.trainIndex === "number") {
        next.trainIndex = desc.trainIndex;
    }
    if (typeof desc.carIndex === "number") {
        next.carIndex = desc.carIndex;
    }
    return {desc: next, migrated};
}
