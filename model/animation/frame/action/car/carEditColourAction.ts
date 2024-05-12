/// <reference path="./../../../../../openrct2.d.ts" />

import Action from "../action";
import {CarTarget} from "../../../animationTarget";

export default class CarEditColourAction extends Action {

    value: VehicleColour;

    getDataToPersist(): object {
        return {
            type: this.type,
            value: this.value
        };
    }

    apply(target: CarTarget): void {
        let carId = typeof (target.carId) !== 'undefined' ? target.carId : 0,
            car = map.getEntity(carId);
        if (!car) {
            return;
        }
        // @ts-ignore
        car.colours = this.value;
    }

}