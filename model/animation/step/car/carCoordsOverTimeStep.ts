/// <reference path="./../../../../openrct2.d.ts" />

import {CarCoordsOverTimeStepDesc} from "../../jsonTypes";
import StepRunContext from "../stepRunContext";
import EntityCoordsOverTimeStep from "./entityCoordsOverTimeStep";
import {resolveTriggerCar} from "./resolveCars";

export default class CarCoordsOverTimeStep extends EntityCoordsOverTimeStep {
    constructor(obj: CarCoordsOverTimeStepDesc) {
        super(obj);
    }

    protected resolveCars(run: StepRunContext): Car[] {
        const car = resolveTriggerCar(run);
        return car ? [car] : [];
    }

    getDataToPersist(): object {
        return {
            type: "carCoordsOverTime",
            ...this.persistCoordsFields()
        };
    }
}
