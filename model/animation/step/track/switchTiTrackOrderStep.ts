/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import TileCoords from "../../../../game/tileCoords";
import {SwitchTiTrackOrderStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";

/**
 * Cycle this ride's track pieces on a tile (TI / Advanced Track Switch Track).
 */
export default class SwitchTiTrackOrderStep extends InstantStep {
    tile: TileCoords;
    rideId: number;

    constructor(obj: SwitchTiTrackOrderStepDesc) {
        super(obj);
        this.tile = obj.tile;
        this.rideId = obj.rideId;
    }

    protected apply(_run: StepRunContext): void {
        const mapTile = MapTile.at(this.tile);
        if (!mapTile) {
            return;
        }
        mapTile.switchTrackOrderForRide(this.rideId);
    }

    getDataToPersist(): object {
        return {
            type: "switchTiTrackOrder",
            tile: this.tile,
            rideId: this.rideId
        };
    }
}
