/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import {
    BlockBrakeOp,
    BlockBrakeStatusConditionDesc,
    OnOff,
    TileTargetDesc,
    TrackBrakeSpeedConditionDesc,
    TrackChainLiftConditionDesc,
    TrackInvertedConditionDesc
} from "../../jsonTypes";
import {persistTileTargetFields} from "../../step/tileTarget";
import TriggerContext from "../triggerContext";
import {compareNumbers} from "./compare";
import Condition from "./condition";
import {resolveConditionTile, resolveConditionTrack} from "./resolveEntities";

function persistTrackTarget(desc: {
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};
    rideId: number;
    trackType: number;
}): TileTargetDesc & {rideId: number; trackType: number} {
    return {
        ...persistTileTargetFields({
            relativeToTrigger: desc.relativeToTrigger === true,
            tile: desc.tile || {x: 0, y: 0},
            offset: desc.offset || {x: 0, y: 0}
        }),
        rideId: desc.rideId,
        trackType: desc.trackType
    };
}

export class TrackChainLiftCondition extends Condition {
    type: "trackChainLift" = "trackChainLift";
    rideId: number;
    trackType: number;
    expected: OnOff;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: TrackChainLiftConditionDesc) {
        super(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.expected = obj.expected;
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        const track = resolveConditionTrack(this, this.rideId, this.trackType, context);
        if (!track) {
            return false;
        }
        return track.hasChainLift === (this.expected === "on");
    }

    getDataToPersist(): object {
        return {
            type: "trackChainLift",
            ...persistTrackTarget(this),
            expected: this.expected
        };
    }
}

export class TrackBrakeSpeedCondition extends Condition {
    type: "trackBrakeSpeed" = "trackBrakeSpeed";
    rideId: number;
    trackType: number;
    op: TrackBrakeSpeedConditionDesc["op"];
    value: number;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: TrackBrakeSpeedConditionDesc) {
        super(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.op = obj.op;
        this.value = obj.value;
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        const track = resolveConditionTrack(this, this.rideId, this.trackType, context);
        if (!track || track.brakeBoosterSpeed === null) {
            return false;
        }
        return compareNumbers(track.brakeBoosterSpeed, this.op, this.value);
    }

    getDataToPersist(): object {
        return {
            type: "trackBrakeSpeed",
            ...persistTrackTarget(this),
            op: this.op,
            value: this.value
        };
    }
}

export class TrackInvertedCondition extends Condition {
    type: "trackInverted" = "trackInverted";
    rideId: number;
    trackType: number;
    expected: OnOff;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: TrackInvertedConditionDesc) {
        super(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.expected = obj.expected;
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        const track = resolveConditionTrack(this, this.rideId, this.trackType, context);
        if (!track) {
            return false;
        }
        return track.isInverted === (this.expected === "on");
    }

    getDataToPersist(): object {
        return {
            type: "trackInverted",
            ...persistTrackTarget(this),
            expected: this.expected
        };
    }
}

export class BlockBrakeStatusCondition extends Condition {
    type: "blockBrakeStatus" = "blockBrakeStatus";
    rideId: number;
    trackType: number;
    expected: BlockBrakeOp;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: BlockBrakeStatusConditionDesc) {
        super(obj);
        this.rideId = obj.rideId;
        this.trackType = obj.trackType;
        this.expected = obj.expected;
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        const tile = resolveConditionTile(this, context);
        if (!tile) {
            return false;
        }
        const mapTile = MapTile.at(tile);
        if (!mapTile) {
            return false;
        }
        const index = mapTile.findTrackIndex(this.rideId, this.trackType);
        if (index === null) {
            return false;
        }
        const closed = mapTile.isBlockBrakeClosed(index);
        return this.expected === "closed" ? closed : !closed;
    }

    getDataToPersist(): object {
        return {
            type: "blockBrakeStatus",
            ...persistTrackTarget(this),
            expected: this.expected
        };
    }
}
