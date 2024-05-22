import Trigger from "./trigger";
import TileCoords from "../../../game/tileCoords";
import {AnimationTarget} from "../animationTarget";

/// <reference path="./../../../openrct2.d.ts" />

type detectArg = 'car'|'train';


export default class RideEntersTrigger extends Trigger {

    type: 'rideEnters';
    rideId: number;
    tile: TileCoords;
    detect: detectArg = 'train';

    test(): false|AnimationTarget {
        let found:false|AnimationTarget = false,
            ride = map.getRide(this.rideId),
            vehicleIds: number[],
            ln: number,
            i,
            v,
            x, y, c;

        if (!ride) {
            return;
        }

        vehicleIds = ride.vehicles;
        ln = vehicleIds.length;
        for (i = 0; i < ln; i += 1) {
            v = vehicleIds[i];
            while (v) {
                c = (<Car>map.getEntity(v)).trackLocation;
                x = Math.floor(c.x / 32);
                y = Math.floor(c.y / 32);
                if (x === this.tile.x && y === this.tile.y) {
                    found = {
                        carId: v
                    };
                    break;
                }
                if (this.detect === 'car') {
                    v = c.nextCarOnTrain;
                } else {
                    v = null;
                }
                if (found !== false) {
                    break;
                }
            }

        }

        return found;
    }

    getDataToPersist(): object {
        return {
            type: 'rideEnters',
            rideId: this.rideId,
            tile: this.tile
        }
    }


}