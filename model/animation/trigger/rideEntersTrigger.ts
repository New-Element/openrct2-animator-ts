import Trigger from "./trigger";
import TileCoords from "../../../game/tileCoords";
import {AnimationTarget} from "../animationTarget";

/// <reference path="./../../../openrct2.d.ts" />


export default class RideEntersTrigger extends Trigger {

    type: 'rideEnters';
    rideId: number;
    tile: TileCoords;

    test(): false|AnimationTarget {
        let found:false|AnimationTarget = false,
            vehicleIds = map.getRide(this.rideId).vehicles,
            ln = vehicleIds.length,
            i,
            v,
            x, y, c;
        for (i = 0; i < ln; i += 1) {
            v = vehicleIds[i];
            c = (<Car>map.getEntity(v)).trackLocation;
            x = Math.floor(c.x / 32);
            y = Math.floor(c.y / 32);
            if (x === this.tile.x && y === this.tile.y) {
                found = {
                    carId: v
                };
                break;
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