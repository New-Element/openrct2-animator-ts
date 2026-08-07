/// <reference path="./../../../../openrct2.d.ts" />

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

export function resolveTriggerTrainCars(run: StepRunContext): Car[] {
    const cars: Car[] = [];
    let car = resolveTriggerCar(run);
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
