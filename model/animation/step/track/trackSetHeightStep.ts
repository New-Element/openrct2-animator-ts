/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import TileCoords from "../../../../game/tileCoords";
import {TrackSetHeightStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";

export default class TrackSetHeightStep extends InstantStep {
    tile: TileCoords;
    rideId: number;
    trackType: number;
    baseHeight: number;

    constructor(obj: TrackSetHeightStepDesc) {
        super(obj);
        this.tile = obj.tile;
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.baseHeight = obj.baseHeight;
    }

    protected apply(_run: StepRunContext): void {
        const mapTile = MapTile.at(this.tile);
        if (!mapTile) {
            return;
        }
        const track = mapTile.findTrack(this.rideId, this.trackType);
        if (!track) {
            return;
        }
        mapTile.setTrackBaseHeight(track, this.baseHeight);
    }

    getDataToPersist(): object {
        return {
            type: "trackSetHeight",
            tile: this.tile,
            rideId: this.rideId,
            trackType: this.trackType,
            baseHeight: this.baseHeight
        };
    }
}
