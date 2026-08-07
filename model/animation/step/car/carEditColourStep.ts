/// <reference path="./../../../../openrct2.d.ts" />

import {CarEditColourStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";
import {mergeVehicleColours} from "./vehicleColour";
import {
    persistVehicleTargetFields,
    resolveTargetHeadCar,
    usesTriggerTarget
} from "./vehicleTarget";

export default class CarEditColourStep extends InstantStep {
    value: VehicleColour;
    useTriggerTarget: boolean = true;
    rideId?: number;
    trainIndex?: number;
    carIndex?: number;

    constructor(obj: CarEditColourStepDesc) {
        super(obj);
        this.value = obj.value;
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

    protected apply(run: StepRunContext): void {
        const car = resolveTargetHeadCar(run, this);
        if (!car) {
            return;
        }
        car.colours = mergeVehicleColours(car.colours, this.value);
    }

    getDataToPersist(): object {
        return {
            type: "carEditColour",
            value: this.value,
            ...persistVehicleTargetFields(this)
        };
    }
}
