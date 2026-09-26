/// <reference path="./../../../../openrct2.d.ts" />

import {EntityCoordsOverTimeStepDesc, NumberSourceOrigin} from "../../jsonTypes";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import TimedStep from "../timedStep";

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
    deltaXOrigin?: NumberSourceOrigin;
    deltaXVariableId?: string;
    deltaY: number;
    deltaYOrigin?: NumberSourceOrigin;
    deltaYVariableId?: string;
    deltaZ: number;
    deltaZOrigin?: NumberSourceOrigin;
    deltaZVariableId?: string;
    durationTicksOrigin?: NumberSourceOrigin;
    durationTicksVariableId?: string;
    private storedDurationTicks: number;
    private resolvedDeltaX: number = 0;
    private resolvedDeltaY: number = 0;
    private resolvedDeltaZ: number = 0;

    private snapshots: CarCoordSnapshot[] = [];

    constructor(obj: EntityCoordsOverTimeStepDesc & { type: string }) {
        super(obj, typeof obj.durationTicks === "number" ? obj.durationTicks : 1);
        this.deltaX = typeof obj.deltaX === "number" ? obj.deltaX : 0;
        this.deltaXOrigin = obj.deltaXOrigin;
        this.deltaXVariableId = obj.deltaXVariableId;
        this.deltaY = typeof obj.deltaY === "number" ? obj.deltaY : 0;
        this.deltaYOrigin = obj.deltaYOrigin;
        this.deltaYVariableId = obj.deltaYVariableId;
        this.deltaZ = typeof obj.deltaZ === "number" ? obj.deltaZ : 0;
        this.deltaZOrigin = obj.deltaZOrigin;
        this.deltaZVariableId = obj.deltaZVariableId;
        this.durationTicksOrigin = obj.durationTicksOrigin;
        this.durationTicksVariableId = obj.durationTicksVariableId;
        this.storedDurationTicks = this.durationTicks;
    }

    protected abstract resolveCars(run: StepRunContext): Car[];

    protected onTimedStart(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const deltaX = resolveNumberSource(this.deltaX, this.deltaXOrigin, this.deltaXVariableId, "int", "Coords Over Time ΔX", meta);
        const deltaY = resolveNumberSource(this.deltaY, this.deltaYOrigin, this.deltaYVariableId, "int", "Coords Over Time ΔY", meta);
        const deltaZ = resolveNumberSource(this.deltaZ, this.deltaZOrigin, this.deltaZVariableId, "int", "Coords Over Time ΔZ", meta);
        const duration = resolveNumberSource(
            this.storedDurationTicks,
            this.durationTicksOrigin,
            this.durationTicksVariableId,
            "int",
            "Coords Over Time Duration",
            meta
        );
        this.resolvedDeltaX = deltaX === null ? 0 : deltaX;
        this.resolvedDeltaY = deltaY === null ? 0 : deltaY;
        this.resolvedDeltaZ = deltaZ === null ? 0 : deltaZ;
        this.durationTicks = duration === null ? this.storedDurationTicks : Math.max(0, duration | 0);
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
            car.x = Math.round(snap.startX + this.resolvedDeltaX * t);
            car.y = Math.round(snap.startY + this.resolvedDeltaY * t);
            car.z = Math.round(snap.startZ + this.resolvedDeltaZ * t);
        }
    }

    protected persistCoordsFields(): object {
        const data: PersistCoords = {
            durationTicks: this.storedDurationTicks
        };
        persistNamedNumber(data, "deltaX", this.deltaX, this.deltaXOrigin, this.deltaXVariableId, true);
        persistNamedNumber(data, "deltaY", this.deltaY, this.deltaYOrigin, this.deltaYVariableId, true);
        persistNamedNumber(data, "deltaZ", this.deltaZ, this.deltaZOrigin, this.deltaZVariableId, true);
        persistNamedNumber(data, "durationTicks", this.storedDurationTicks, this.durationTicksOrigin, this.durationTicksVariableId, false);
        return data;
    }
}

interface PersistCoords {
    deltaX?: number;
    deltaXOrigin?: NumberSourceOrigin;
    deltaXVariableId?: string;
    deltaY?: number;
    deltaYOrigin?: NumberSourceOrigin;
    deltaYVariableId?: string;
    deltaZ?: number;
    deltaZOrigin?: NumberSourceOrigin;
    deltaZVariableId?: string;
    durationTicks: number;
    durationTicksOrigin?: NumberSourceOrigin;
    durationTicksVariableId?: string;
}

function persistNamedNumber(
    data: PersistCoords,
    field: "deltaX" | "deltaY" | "deltaZ" | "durationTicks",
    hardcoded: number,
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined,
    omitZeroHardcoded: boolean
): void {
    const source = persistNumberSource(hardcoded, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    if (omitZeroHardcoded && source.origin !== "variable" && source.value === 0) {
        return;
    }
    data[field] = source.value;
    if (source.origin === "variable") {
        data[`${field}Origin`] = "variable";
        data[`${field}VariableId`] = source.variableId || "";
    }
}
