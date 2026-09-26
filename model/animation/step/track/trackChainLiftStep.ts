/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {error} from "../../../logger";
import {TrackChainLiftMode, TrackChainLiftStepDesc} from "../../jsonTypes";
import InstantStep from "../instantStep";
import StepRunContext from "../stepRunContext";
import {LoadedTileTarget, loadTileTarget, persistTileTargetFields, resolveStepTiles} from "../tileTarget";

type RunLogIds = StepRunContext & {
    animation?: {id: string};
    sourceTriggerId?: string;
};

function logMetaFromRun(run: StepRunContext): {animationId?: string; triggerId?: string} {
    const r = run as RunLogIds;
    const meta: {animationId?: string; triggerId?: string} = {};
    if (r.animation && typeof r.animation.id === "string") {
        meta.animationId = r.animation.id;
    }
    if (typeof r.sourceTriggerId === "string") {
        meta.triggerId = r.sourceTriggerId;
    }
    return meta;
}

function segmentAllowsChainLift(trackType: number): boolean {
    if (typeof cheats !== "undefined" && cheats.enableChainLiftOnAllTrack) {
        return true;
    }
    const segment = context.getTrackSegment(trackType);
    return !!segment && segment.allowsChainLift;
}

/**
 * Instantly set or toggle chain lift on one track piece (tile + ride + trackType).
 */
export default class TrackChainLiftStep extends InstantStep {
    tileTarget: LoadedTileTarget;
    rideId: number;
    trackType: number;
    mode: TrackChainLiftMode;

    constructor(obj: TrackChainLiftStepDesc) {
        super(obj);
        this.tileTarget = loadTileTarget(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.mode = obj.mode;
    }

    protected apply(run: StepRunContext): void {
        const meta = logMetaFromRun(run);
        const tiles = resolveStepTiles(run, this.tileTarget, "Chain Lift");
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const mapTile = MapTile.at(tile);
            if (!mapTile) {
                error(
                    "step",
                    `Chain Lift: no tile at (${tile.x}, ${tile.y})`,
                    undefined,
                    meta
                );
                continue;
            }

            const track = mapTile.findTrack(this.rideId, this.trackType);
            if (!track) {
                error(
                    "step",
                    `Chain Lift: no track for ride ${this.rideId} type ${this.trackType} at (${tile.x}, ${tile.y})`,
                    undefined,
                    meta
                );
                continue;
            }

            let target: boolean;
            if (this.mode === "on") {
                target = true;
            } else if (this.mode === "off") {
                target = false;
            } else {
                target = !track.hasChainLift;
            }

            if (target && !segmentAllowsChainLift(track.trackType)) {
                error(
                    "step",
                    `Chain Lift: track type ${track.trackType} does not allow chain lift at (${tile.x}, ${tile.y})`,
                    undefined,
                    meta
                );
                continue;
            }

            track.hasChainLift = target;
        }
    }

    getDataToPersist(): object {
        return {
            type: "trackChainLift",
            ...persistTileTargetFields(this.tileTarget),
            rideId: this.rideId,
            trackType: this.trackType,
            mode: this.mode
        };
    }
}
