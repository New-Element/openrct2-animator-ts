/// <reference path="./../../../../openrct2.d.ts" />

import {CarIdentity, carById, resolveCarId} from "../../entityRematch";
import {contextCars, contextTrains} from "../../trigger/contextLists";
import StepRunContext from "../stepRunContext";

function carFromIdentity(identity: CarIdentity): Car | null {
    const carId = resolveCarId(identity);
    if (carId === null) {
        return null;
    }
    return carById(carId);
}

export function resolveTriggerCars(run: StepRunContext): Car[] {
    const identities = contextCars(run.triggerContext);
    const cars: Car[] = [];
    for (let i = 0; i < identities.length; i++) {
        const car = carFromIdentity(identities[i]);
        if (car) {
            cars.push(car);
        }
    }
    return cars;
}

export function resolveTriggerTrainHeads(run: StepRunContext): Car[] {
    const trains = contextTrains(run.triggerContext);
    const heads: Car[] = [];
    for (let i = 0; i < trains.length; i++) {
        const head = carFromIdentity({
            rideId: trains[i].rideId,
            trainIndex: trains[i].trainIndex,
            carIndex: 0
        });
        if (head) {
            heads.push(head);
        }
    }
    return heads;
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
        const next = carById(car.nextCarOnTrain);
        if (!next) {
            break;
        }
        car = next;
    }
    return cars;
}

export function resolveTriggerTrainCars(run: StepRunContext): Car[] {
    const heads = resolveTriggerTrainHeads(run);
    const cars: Car[] = [];
    for (let i = 0; i < heads.length; i++) {
        const trainCars = walkTrainFromHead(heads[i]);
        for (let j = 0; j < trainCars.length; j++) {
            cars.push(trainCars[j]);
        }
    }
    return cars;
}
