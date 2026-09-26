/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {NumberSourceOrigin, TrackSetHeightStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import {persistNumberSource, resolveNumberSource} from "../numberSource";
import {logMetaFromRun} from "../stepHelpers";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields, resolveStepTiles} from "../tileTarget";

export default class TrackSetHeightStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    baseHeight: number;
    baseHeightOrigin?: NumberSourceOrigin;
    baseHeightVariableId?: string;

    constructor(obj: TrackSetHeightStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.baseHeight = typeof obj.baseHeight === "number" ? obj.baseHeight : 0;
        this.baseHeightOrigin = obj.baseHeightOrigin;
        this.baseHeightVariableId = obj.baseHeightVariableId;
    }

    protected apply(run: StepRunContext): void {
        const baseHeight = resolveNumberSource(
            this.baseHeight,
            this.baseHeightOrigin,
            this.baseHeightVariableId,
            "int",
            "Set Track Height",
            logMetaFromRun(run)
        );
        if (baseHeight === null) {
            return;
        }
        const tiles = resolveStepTiles(run, this.tileTarget, "Set Track Height");
        for (let i = 0; i < tiles.length; i++) {
            const mapTile = MapTile.at(tiles[i]);
            if (!mapTile) {
                continue;
            }
            const track = mapTile.findTrack(this.rideId, this.trackType);
            if (!track) {
                continue;
            }
            mapTile.setTrackBaseHeight(track, baseHeight);
        }
    }

    getDataToPersist(): object {
        const source = persistNumberSource(
            this.baseHeight,
            this.baseHeightOrigin === "variable" ? "variable" : "hardcoded",
            this.baseHeightVariableId || ""
        );
        return {
            type: "trackSetHeight",
            ...persistTileTargetFields(this.tileTarget),
            rideId: this.rideId,
            trackType: this.trackType,
            baseHeight: source.value,
            ...(source.origin === "variable" ? {baseHeightOrigin: "variable", baseHeightVariableId: source.variableId || ""} : {})
        };
    }
}
