/// <reference path="./../../../../openrct2.d.ts" />

import {NumberSourceOrigin, TrainEditColourStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {mergeVehicleColours, UNSELECTED_COLOUR} from "./vehicleColour";
import {
    persistVehicleTargetFields,
    resolveTargetTrainCars,
    usesTriggerTarget
} from "./vehicleTarget";

export default class TrainEditColourStep extends InstantStep {
    value: VehicleColour;
    bodyOrigin?: NumberSourceOrigin;
    bodyVariableId?: string;
    trimOrigin?: NumberSourceOrigin;
    trimVariableId?: string;
    tertiaryOrigin?: NumberSourceOrigin;
    tertiaryVariableId?: string;
    useTriggerTarget: boolean = true;
    rideId?: number;
    trainIndex?: number;

    constructor(obj: TrainEditColourStepDesc) {
        super(obj);
        this.value = obj.value;
        this.bodyOrigin = obj.bodyOrigin;
        this.bodyVariableId = obj.bodyVariableId;
        this.trimOrigin = obj.trimOrigin;
        this.trimVariableId = obj.trimVariableId;
        this.tertiaryOrigin = obj.tertiaryOrigin;
        this.tertiaryVariableId = obj.tertiaryVariableId;
        this.useTriggerTarget = usesTriggerTarget(obj);
        if (typeof obj.rideId === "number") {
            this.rideId = obj.rideId;
        }
        if (typeof obj.trainIndex === "number") {
            this.trainIndex = obj.trainIndex;
        }
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const body = resolveNumberSource(this.value.body, this.bodyOrigin, this.bodyVariableId, "int", "Recolour Train Body", meta);
        const trim = resolveNumberSource(this.value.trim, this.trimOrigin, this.trimVariableId, "int", "Recolour Train Trim", meta);
        const tertiary = resolveNumberSource(this.value.tertiary, this.tertiaryOrigin, this.tertiaryVariableId, "int", "Recolour Train Tertiary", meta);
        const value: VehicleColour = {
            body: body === null ? UNSELECTED_COLOUR : body,
            trim: trim === null ? UNSELECTED_COLOUR : trim,
            tertiary: tertiary === null ? UNSELECTED_COLOUR : tertiary
        };
        const cars = resolveTargetTrainCars(run, this);
        for (let i = 0; i < cars.length; i++) {
            cars[i].colours = mergeVehicleColours(cars[i].colours, value);
        }
    }

    getDataToPersist(): object {
        return {
            type: "trainEditColour",
            value: this.value,
            ...persistOriginOnly("body", this.bodyOrigin, this.bodyVariableId),
            ...persistOriginOnly("trim", this.trimOrigin, this.trimVariableId),
            ...persistOriginOnly("tertiary", this.tertiaryOrigin, this.tertiaryVariableId),
            ...persistVehicleTargetFields(this)
        };
    }
}

function persistOriginOnly(
    field: "body" | "trim" | "tertiary",
    origin: NumberSourceOrigin | undefined,
    variableId: string | undefined
): {[key: string]: NumberSourceOrigin | string} {
    const source = persistNumberSource(0, origin === "variable" ? "variable" : "hardcoded", variableId || "");
    if (source.origin !== "variable") {
        return {};
    }
    const data: {[key: string]: NumberSourceOrigin | string} = {};
    data[`${field}Origin`] = "variable";
    data[`${field}VariableId`] = source.variableId || "";
    return data;
}
