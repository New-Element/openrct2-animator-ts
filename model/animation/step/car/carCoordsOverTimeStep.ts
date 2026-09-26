/// <reference path="./../../../../openrct2.d.ts" />

import {CarCoordsOverTimeStepDesc} from "../../jsonTypes";
import StepRunContext from "../stepRunContext";
import EntityCoordsOverTimeStep from "./entityCoordsOverTimeStep";
import {
    persistVehicleTargetFields,
    resolveTargetHeadCars,
    usesTriggerTarget
} from "./vehicleTarget";

export default class CarCoordsOverTimeStep extends EntityCoordsOverTimeStep {
    useTriggerTarget: boolean = true;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;

    constructor(obj: CarCoordsOverTimeStepDesc) {
        super(obj);
        this.useTriggerTarget = usesTriggerTarget(obj);
        if (typeof obj.rideId === "number") {
            this.rideId = obj.rideId;
        }
        if (typeof obj.trainIndex === "number") {
            this.trainIndex = obj.trainIndex;
        }
        if (typeof obj.carIndex === "number") {
            this.carIndex = obj.carIndex;
        }
    }

    protected resolveCars(run: StepRunContext): Car[] {
        return resolveTargetHeadCars(run, this);
    }

    getDataToPersist(): object {
        return {
            type: "carCoordsOverTime",
            ...this.persistCoordsFields(),
            ...persistVehicleTargetFields(this)
        };
    }
}
