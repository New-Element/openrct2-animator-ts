/// <reference path="./../../../../../openrct2.d.ts" />

import Action from "../action";
import {CarTarget} from "../../../animationTarget";

type RecolourTrainTarget = 'animationTarget' | number;

export default class TrainEditColourAction extends Action {

    recolour: VehicleColour;
    target: RecolourTrainTarget;

    getDataToPersist(): object {
        return {
            type: this.type
        };
    }

    apply(target: CarTarget): void {
        let carId = this.target === 'animationTarget' ? target.carId : this.target,
            car;
        while (carId) {
            car = map.getEntity(carId);
            if (!car) {
                break;
            }
            car.colours = this.recolour;
            carId = car.nextCarOnTrainId;
        }
    }

}