/// <reference path="./../../../../../openrct2.d.ts" />

import Action from "../action";
import {CarTarget} from "../../../animationTarget";

export default class TrainEditColourAction extends Action {

    value: VehicleColour;

    getDataToPersist(): object {
        return {
            type: this.type,
            value: this.value
        };
    }

    apply(target: CarTarget): void {
        let carId = typeof(target.carId) !== 'undefined' ? target.carId : 0,
            car;
        while (carId) {
            car = map.getEntity(carId);
            if (!car) {
                break;
            }
            car.colours = this.value;
            carId = car.nextCarOnTrain;
        }
    }

}