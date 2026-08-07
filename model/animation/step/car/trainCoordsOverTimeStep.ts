/// <reference path="./../../../../openrct2.d.ts" />

import {TrainCoordsOverTimeStepDesc} from "../../jsonTypes";
import StepRunContext from "../stepRunContext";
import EntityCoordsOverTimeStep from "./entityCoordsOverTimeStep";
import {resolveTriggerTrainCars} from "./resolveCars";

export default class TrainCoordsOverTimeStep extends EntityCoordsOverTimeStep {
    constructor(obj: TrainCoordsOverTimeStepDesc) {
        super(obj);
    }

    protected resolveCars(run: StepRunContext): Car[] {
        return resolveTriggerTrainCars(run);
    }

    getDataToPersist(): object {
        return {
            type: "trainCoordsOverTime",
            ...this.persistCoordsFields()
        };
    }
}
