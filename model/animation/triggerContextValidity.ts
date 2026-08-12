/// <reference path="./../../openrct2.d.ts" />

import {identifyCar, resolveCarId} from "./entityRematch";
import TriggerContext from "./trigger/triggerContext";

export type TriggerContextInvalidReason =
    | "missing_car"
    | "missing_train"
    | "off_tile";

interface TrainResolveResult {
    cars: Car[];
    failReason?: string;
}

function resolveTrainCarsFromContext(context: TriggerContext): TrainResolveResult {
    const target = context.target;
    if (!("carId" in target)) {
        return {cars: [], failReason: "target_not_car"};
    }

    let rideId = context.rideId;
    let trainIndex = context.trainIndex;
    const carId = target.carId;

    if (typeof rideId !== "number" || typeof trainIndex !== "number") {
        const entity = map.getEntity(carId);
        if (!entity || entity.type !== "car" || entity.id === null) {
            return {
                cars: [],
                failReason: `no ride/train on context; target carId=${carId} entity missing/invalid`
            };
        }
        const identity = identifyCar(entity.id);
        if (!identity) {
            const car = entity as Car;
            return {
                cars: [],
                failReason:
                    `no ride/train on context; identifyCar failed for carId=${carId} ` +
                    `ride=${car.ride} track=(${Math.floor(car.trackLocation.x / 32)},${Math.floor(car.trackLocation.y / 32)})`
            };
        }
        rideId = identity.rideId;
        trainIndex = identity.trainIndex;
    }

    const headId = resolveCarId({
        rideId: rideId,
        trainIndex: trainIndex,
        carIndex: 0
    });
    if (headId === null) {
        return {
            cars: [],
            failReason:
                `resolveCarId head null for rideId=${rideId} trainIndex=${trainIndex} ` +
                `(contextCarId=${carId})`
        };
    }
    const headEntity = map.getEntity(headId);
    if (!headEntity || headEntity.type !== "car") {
        return {
            cars: [],
            failReason: `head entity missing/invalid headId=${headId} rideId=${rideId} trainIndex=${trainIndex}`
        };
    }

    const cars: Car[] = [];
    let car: Car | null = headEntity as Car;
    while (car) {
        cars.push(car);
        if (car.nextCarOnTrain === null) {
            break;
        }
        const next = map.getEntity(car.nextCarOnTrain);
        if (!next || next.type !== "car") {
            break;
        }
        car = next as Car;
    }
    return {cars};
}

function formatContextSummary(context: TriggerContext): string {
    const target = context.target;
    const carId = "carId" in target ? target.carId : "n/a";
    const tile = context.tile
        ? `(${context.tile.x},${context.tile.y})`
        : "none";
    return (
        `carId=${carId} rideId=${context.rideId} trainIndex=${context.trainIndex} ` +
        `carIndex=${context.carIndex} tile=${tile} allowOffTile=${!!context.allowOffTile}`
    );
}

/**
 * Whether a car-triggered run should keep going.
 * - Train must still resolve (unless allowOffTile: step may still need cleanup,
 *   e.g. Lift/Drop Track returning the track after the train is gone).
 * - If context.tile is set and allowOffTile is not true, at least one train car
 *   must still occupy that tile.
 */
export function getTriggerContextInvalidReason(
    context: TriggerContext
): TriggerContextInvalidReason | null {
    if (!("carId" in context.target)) {
        return null;
    }

    const resolved = resolveTrainCarsFromContext(context);
    if (resolved.cars.length === 0) {
        if (context.allowOffTile) {
            // Step is responsible for cleanup (e.g. track return). Log once per run context.
            const flagged = context as TriggerContext & {_missingTrainIgnoredLogged?: boolean};
            if (!flagged._missingTrainIgnoredLogged) {
                flagged._missingTrainIgnoredLogged = true;
                console.log(
                    `[Animator] missing_train ignored (allowOffTile): ${resolved.failReason || "unknown"} | ` +
                        formatContextSummary(context)
                );
            }
            return null;
        }
        console.log(
            `[Animator] missing_train: ${resolved.failReason || "unknown"} | ` +
                formatContextSummary(context)
        );
        return "missing_train";
    }

    if (context.allowOffTile || !context.tile) {
        return null;
    }

    const tileX = context.tile.x;
    const tileY = context.tile.y;
    for (let i = 0; i < resolved.cars.length; i++) {
        const car = resolved.cars[i];
        if (
            car.trackLocation.x === tileX * 32 &&
            car.trackLocation.y === tileY * 32
        ) {
            return null;
        }
    }

    const carTiles = resolved.cars
        .map(
            (c, i) =>
                `[${i}]id=${c.id}@(${Math.floor(c.trackLocation.x / 32)},${Math.floor(c.trackLocation.y / 32)})`
        )
        .join(" ");
    console.log(
        `[Animator] off_tile: want=(${tileX},${tileY}) cars=${resolved.cars.length} ` +
            `${carTiles} | ${formatContextSummary(context)}`
    );
    return "off_tile";
}
