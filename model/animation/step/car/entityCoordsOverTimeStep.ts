/// <reference path="./../../../../openrct2.d.ts" />

import {EntityCoordsOverTimeStepDesc} from "../../jsonTypes";
import TimedStep from "../timedStep";
import StepRunContext from "../stepRunContext";

interface CarCoordSnapshot {
    carId: number;
    startX: number;
    startY: number;
    startZ: number;
}

/**
 * Linearly tweens car x/y/z by relative deltas over durationTicks.
 * Subclasses only decide which cars (trigger car vs whole train).
 */
export default abstract class EntityCoordsOverTimeStep extends TimedStep {
    deltaX: number;
    deltaY: number;
    deltaZ: number;

    private snapshots: CarCoordSnapshot[] = [];

    constructor(obj: EntityCoordsOverTimeStepDesc & { type: string }) {
        super(obj, typeof obj.durationTicks === "number" ? obj.durationTicks : 1);
        this.deltaX = typeof obj.deltaX === "number" ? obj.deltaX : 0;
        this.deltaY = typeof obj.deltaY === "number" ? obj.deltaY : 0;
        this.deltaZ = typeof obj.deltaZ === "number" ? obj.deltaZ : 0;
    }

    protected abstract resolveCars(run: StepRunContext): Car[];

    protected onTimedStart(run: StepRunContext): void {
        this.snapshots = [];
        const cars = this.resolveCars(run);
        for (let i = 0; i < cars.length; i++) {
            const car = cars[i];
            if (car.id === null) {
                continue;
            }
            car.velocity = 0;
            car.acceleration = 0;
            this.snapshots.push({
                carId: car.id,
                startX: car.x,
                startY: car.y,
                startZ: car.z
            });
        }
    }

    protected onProgress(_run: StepRunContext, t: number): void {
        for (let i = 0; i < this.snapshots.length; i++) {
            const snap = this.snapshots[i];
            const entity = map.getEntity(snap.carId);
            if (!entity || entity.type !== "car") {
                continue;
            }
            const car = entity as Car;
            car.velocity = 0;
            car.acceleration = 0;
            car.x = Math.round(snap.startX + this.deltaX * t);
            car.y = Math.round(snap.startY + this.deltaY * t);
            car.z = Math.round(snap.startZ + this.deltaZ * t);
        }
    }

    protected persistCoordsFields(): object {
        const data: {
            deltaX?: number;
            deltaY?: number;
            deltaZ?: number;
            durationTicks: number;
        } = {
            durationTicks: this.durationTicks
        };
        if (this.deltaX !== 0) {
            data.deltaX = this.deltaX;
        }
        if (this.deltaY !== 0) {
            data.deltaY = this.deltaY;
        }
        if (this.deltaZ !== 0) {
            data.deltaZ = this.deltaZ;
        }
        return data;
    }
}
