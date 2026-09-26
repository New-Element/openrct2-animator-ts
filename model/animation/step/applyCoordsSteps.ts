/// <reference path="./../../../openrct2.d.ts" />

import {error} from "../../logger";
import {SetCarCoordsStepDesc, SetStaffCoordsStepDesc} from "../jsonTypes";
import {persistVehicleTargetFields, resolveTargetHeadCars} from "./car/vehicleTarget";
import {persistCoordsSource, readCoordsSourceOrigin, resolveCoordsSource} from "./coordsSource";
import InstantStep from "./instantStep";
import {logMetaFromRun, persistStaffTarget, resolveStepStaffMembers} from "./stepHelpers";
import StepRunContext from "./stepRunContext";

export class SetCarCoordsStep extends InstantStep {
    useTriggerTarget?: boolean;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;
    coordsOrigin: ReturnType<typeof readCoordsSourceOrigin>;
    x: number;
    y: number;
    z: number;
    coordsVariableId: string;

    constructor(obj: SetCarCoordsStepDesc) {
        super(obj);
        this.useTriggerTarget = obj.useTriggerTarget;
        this.rideId = obj.rideId;
        this.trainIndex = obj.trainIndex;
        this.carIndex = obj.carIndex;
        this.coordsOrigin = readCoordsSourceOrigin(obj);
        this.x = typeof obj.x === "number" ? obj.x : 0;
        this.y = typeof obj.y === "number" ? obj.y : 0;
        this.z = typeof obj.z === "number" ? obj.z : 0;
        this.coordsVariableId = typeof obj.coordsVariableId === "string" ? obj.coordsVariableId : "";
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const coords = resolveCoordsSource(this, "Set Car Coords", meta);
        if (!coords) {
            return;
        }
        const cars = resolveTargetHeadCars(run, this);
        if (cars.length === 0) {
            error("step", "Set Car Coords: no car", undefined, meta);
            return;
        }
        for (let i = 0; i < cars.length; i++) {
            cars[i].x = coords.x;
            cars[i].y = coords.y;
            cars[i].z = coords.z;
        }
    }

    getDataToPersist(): object {
        return {
            type: "setCarCoords",
            ...persistCoordsSource({
                origin: this.coordsOrigin,
                x: this.x,
                y: this.y,
                z: this.z,
                coordsVariableId: this.coordsVariableId
            }),
            ...persistVehicleTargetFields(this)
        };
    }
}

export class SetStaffCoordsStep extends InstantStep {
    useTriggerStaff?: boolean;
    staffId?: number;
    coordsOrigin: ReturnType<typeof readCoordsSourceOrigin>;
    x: number;
    y: number;
    z: number;
    coordsVariableId: string;

    constructor(obj: SetStaffCoordsStepDesc) {
        super(obj);
        this.useTriggerStaff = obj.useTriggerStaff;
        this.staffId = obj.staffId;
        this.coordsOrigin = readCoordsSourceOrigin(obj);
        this.x = typeof obj.x === "number" ? obj.x : 0;
        this.y = typeof obj.y === "number" ? obj.y : 0;
        this.z = typeof obj.z === "number" ? obj.z : 0;
        this.coordsVariableId = typeof obj.coordsVariableId === "string" ? obj.coordsVariableId : "";
    }

    protected apply(run: StepRunContext): void {
        const coords = resolveCoordsSource(this, "Set Staff Coords", logMetaFromRun(run));
        if (!coords) {
            return;
        }
        const staff = resolveStepStaffMembers(run, this.useTriggerStaff, this.staffId, "Set Staff Coords");
        for (let i = 0; i < staff.length; i++) {
            staff[i].x = coords.x;
            staff[i].y = coords.y;
            staff[i].z = coords.z;
        }
    }

    getDataToPersist(): object {
        return {
            type: "setStaffCoords",
            ...persistCoordsSource({
                origin: this.coordsOrigin,
                x: this.x,
                y: this.y,
                z: this.z,
                coordsVariableId: this.coordsVariableId
            }),
            ...persistStaffTarget(this.useTriggerStaff !== false, this.staffId)
        };
    }
}
