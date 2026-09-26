/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";
import {
    CarMoveToTrackStepDesc,
    CarNumberStepDesc,
    CarStatusStepDesc,
    CarToggleStepDesc,
    NumberSourceOrigin,
    OnOffToggle,
    VehicleTargetDesc
} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {
    applyOnOffToggle,
    logMetaFromRun,
    persistVehicleFields,
    resolveStepCars,
    resolveStepMapTiles
} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields} from "../tileTarget";

function writeCarNumber(car: Car, type: CarNumberStepDesc["type"], value: number): void {
    if (type === "carVelocity") {
        car.velocity = value;
        return;
    }
    if (type === "carAcceleration") {
        car.acceleration = value;
        return;
    }
    if (type === "carMass") {
        car.mass = value;
        return;
    }
    if (type === "carBankRotation") {
        car.bankRotation = value;
        return;
    }
    if (type === "carSpin") {
        car.spin = value;
        return;
    }
    if (type === "carPoweredAcceleration") {
        car.poweredAcceleration = value;
        return;
    }
    if (type === "carPoweredMaxSpeed") {
        car.poweredMaxSpeed = value;
        return;
    }
    car.travelBy(value);
}

export class CarNumberStep extends InstantStep {
    target: VehicleTargetDesc;
    value: number;
    valueOrigin?: NumberSourceOrigin;
    valueVariableId?: string;

    constructor(obj: CarNumberStepDesc) {
        super(obj);
        this.target = obj;
        this.value = typeof obj.value === "number" ? obj.value : 0;
        this.valueOrigin = obj.valueOrigin;
        this.valueVariableId = obj.valueVariableId;
    }

    protected apply(run: StepRunContext): void {
        const value = resolveNumberSource(
            this.value,
            this.valueOrigin,
            this.valueVariableId,
            "int",
            this.type,
            logMetaFromRun(run)
        );
        if (value === null) {
            return;
        }
        const cars = resolveStepCars(run, this.target, this.type);
        for (let i = 0; i < cars.length; i++) {
            writeCarNumber(cars[i], this.type as CarNumberStepDesc["type"], value);
        }
    }

    getDataToPersist(): object {
        const source = persistNumberSource(
            this.value,
            this.valueOrigin === "variable" ? "variable" : "hardcoded",
            this.valueVariableId || ""
        );
        return {
            type: this.type,
            value: source.value,
            ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {}),
            ...persistVehicleFields(this.target)
        };
    }
}

export class CarToggleStep extends InstantStep {
    target: VehicleTargetDesc;
    mode: OnOffToggle;

    constructor(obj: CarToggleStepDesc) {
        super(obj);
        this.target = obj;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const cars = resolveStepCars(run, this.target, this.type);
        for (let i = 0; i < cars.length; i++) {
            if (this.type === "carReversed") {
                cars[i].isReversed = applyOnOffToggle(cars[i].isReversed, this.mode);
            } else {
                cars[i].isCrashed = applyOnOffToggle(cars[i].isCrashed, this.mode);
            }
        }
    }

    getDataToPersist(): object {
        return {
            type: this.type,
            mode: this.mode,
            ...persistVehicleFields(this.target)
        };
    }
}

export class CarStatusStep extends InstantStep {
    target: VehicleTargetDesc;
    status: VehicleStatus;

    constructor(obj: CarStatusStepDesc) {
        super(obj);
        this.target = obj;
        this.status = obj.status;
    }

    protected apply(run: StepRunContext): void {
        const cars = resolveStepCars(run, this.target, "Car Status");
        for (let i = 0; i < cars.length; i++) {
            cars[i].status = this.status;
        }
    }

    getDataToPersist(): object {
        return {
            type: "carStatus",
            status: this.status,
            ...persistVehicleFields(this.target)
        };
    }
}

export class CarMoveToTrackStep extends InstantStep {
    target: VehicleTargetDesc;
    tileTarget: LoadedTileTarget;
    rideId?: number;
    trackType: number;

    constructor(obj: CarMoveToTrackStepDesc) {
        super(obj);
        this.target = obj;
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
    }

    protected apply(run: StepRunContext): void {
        const cars = resolveStepCars(run, this.target, "Move To Track");
        const mapTiles = resolveStepMapTiles(run, this.tileTarget, "Move To Track");
        if (mapTiles.length === 0) {
            return;
        }
        for (let i = 0; i < cars.length; i++) {
            const car = cars[i];
            const rideId = typeof this.rideId === "number" ? this.rideId : car.ride;
            for (let j = 0; j < mapTiles.length; j++) {
                const mapTile = mapTiles[j];
                const index = mapTile.findTrackIndex(rideId, this.trackType);
                if (index === null) {
                    error("step", "Move To Track: track piece not found", undefined, logMetaFromRun(run));
                    continue;
                }
                car.moveToTrack(mapTile.x, mapTile.y, index);
            }
        }
    }

    getDataToPersist(): object {
        const data: CarMoveToTrackStepDesc = {
            type: "carMoveToTrack",
            ...persistVehicleFields(this.target),
            ...persistTileTargetFields(this.tileTarget),
            trackType: this.trackType
        };
        if (typeof this.rideId === "number") {
            data.rideId = this.rideId;
        }
        return data;
    }
}
