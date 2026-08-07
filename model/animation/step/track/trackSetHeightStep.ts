/// <reference path="./../../../../openrct2.d.ts" />

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
        const tile = map.getTile(this.tile.x, this.tile.y);
        if (!tile) {
            return;
        }

        for (let i = 0; i < tile.numElements; i++) {
            const element = tile.getElement(i);
            if (element.type !== "track") {
                continue;
            }
            const track = element as TrackElement;
            if (track.ride !== this.rideId || track.trackType !== this.trackType) {
                continue;
            }
            const heightDelta = this.baseHeight - track.baseHeight;
            track.baseHeight = this.baseHeight;
            track.clearanceHeight += heightDelta;
            return;
        }
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
