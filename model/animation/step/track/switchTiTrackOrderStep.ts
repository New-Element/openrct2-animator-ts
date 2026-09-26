/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {SwitchTiTrackOrderStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields, resolveStepTiles} from "../tileTarget";

/**
 * Cycle this ride's track pieces on a tile (TI / Advanced Track Switch Track).
 */
export default class SwitchTiTrackOrderStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;

    constructor(obj: SwitchTiTrackOrderStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
    }

    protected apply(run: StepRunContext): void {
        const tiles = resolveStepTiles(run, this.tileTarget, "Switch TI Track Order");
        for (let i = 0; i < tiles.length; i++) {
            const mapTile = MapTile.at(tiles[i]);
            if (!mapTile) {
                continue;
            }
            mapTile.switchTrackOrderForRide(this.rideId);
        }
    }

    getDataToPersist(): object {
        return {
            type: "switchTiTrackOrder",
            ...persistTileTargetFields(this.tileTarget),
            rideId: this.rideId
        };
    }
}
