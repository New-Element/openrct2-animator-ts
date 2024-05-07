import {Trigger} from "./trigger";
import {TileCoords} from "../../../game/tileCoords";

export default class RideEntersTrigger implements Trigger {

    type: 'rideEnters';
    rideId: number;
    tile: TileCoords;

    test(): boolean {
        return false;
    }


}