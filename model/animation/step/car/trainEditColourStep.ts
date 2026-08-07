/// <reference path="./../../../../openrct2.d.ts" />

import {TrainEditColourStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";
import {mergeVehicleColours} from "./vehicleColour";
import {
    persistVehicleTargetFields,
    resolveTargetTrainCars,
    usesTriggerTarget
} from "./vehicleTarget";

export default class TrainEditColourStep extends InstantStep {
    value: VehicleColour;
    useTriggerTarget: boolean = true;
    rideId?: number;
    trainIndex?: number;

    constructor(obj: TrainEditColourStepDesc) {
        super(obj);
        this.value = obj.value;
        this.useTriggerTarget = usesTriggerTarget(obj);
        if (typeof obj.rideId === "number") {
            this.rideId = obj.rideId;
        }
        if (typeof obj.trainIndex === "number") {
            this.trainIndex = obj.trainIndex;
        }
    }

    protected apply(run: StepRunContext): void {
        const cars = resolveTargetTrainCars(run, this);
        for (let i = 0; i < cars.length; i++) {
            cars[i].colours = mergeVehicleColours(cars[i].colours, this.value);
        }
    }

    getDataToPersist(): object {
        return {
            type: "trainEditColour",
            value: this.value,
            ...persistVehicleTargetFields(this)
        };
    }
}
