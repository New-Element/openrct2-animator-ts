/// <reference path="./../../../../openrct2.d.ts" />

import {identifyCar, resolveCarId} from "../../entityRematch";
import StepRunContext from "../stepRunContext";

export function resolveTriggerCar(run: StepRunContext): Car | null {
    const target = run.target;
    if (!("carId" in target)) {
        return null;
    }
    const entity = map.getEntity(target.carId);
    if (!entity || entity.type !== "car") {
        return null;
    }
    return entity as Car;
}

/**
 * Head car of the train that contains the trigger car (not the firer itself).
 */
export function resolveTriggerTrainHead(run: StepRunContext): Car | null {
    const ctx = run.triggerContext;
    let rideId = ctx.rideId;
    let trainIndex = ctx.trainIndex;

    if (typeof rideId !== "number" || typeof trainIndex !== "number") {
        const triggerCar = resolveTriggerCar(run);
        if (!triggerCar || triggerCar.id === null) {
            return null;
        }
        const identity = identifyCar(triggerCar.id);
        if (!identity) {
            return null;
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
        return null;
    }
    const entity = map.getEntity(headId);
    if (!entity || entity.type !== "car") {
        return null;
    }
    return entity as Car;
}

/** Walk a train from any car on it by following nextCarOnTrain. */
export function walkTrainFromHead(head: Car | null): Car[] {
    const cars: Car[] = [];
    let car = head;
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
    return cars;
}

export function resolveTriggerTrainCars(run: StepRunContext): Car[] {
    return walkTrainFromHead(resolveTriggerTrainHead(run));
}
