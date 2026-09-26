/// <reference path="./../../../../openrct2.d.ts" />

import {
    CarLocationConditionDesc,
    CarSpeedConditionDesc,
    CarStatusConditionDesc,
    CompareOp,
    MatchOp,
    TrainLocationConditionDesc,
    VehicleLocationMode,
    VehicleTargetDesc
} from "../../jsonTypes";
import {persistVehicleTargetFields} from "../../step/car/vehicleTarget";
import {persistTileTargetFields} from "../../step/tileTarget";
import TriggerContext from "../triggerContext";
import {compareNumbers} from "./compare";
import Condition from "./condition";
import {
    carTrackTile,
    resolveConditionCar,
    resolveConditionTile,
    resolveConditionTrainHead,
    tilesEqual
} from "./resolveEntities";

function matchIs(op: MatchOp, equal: boolean): boolean {
    return op === "is" ? equal : !equal;
}

function evaluateLocation(
    car: Car | null,
    desc: {
        mode: VehicleLocationMode;
        stationIndex?: number;
        op?: CompareOp;
        value?: number;
    } & {relativeToTrigger?: boolean; tile?: {x: number; y: number}; offset?: {x: number; y: number}},
    context: TriggerContext
): boolean {
    if (!car) {
        return false;
    }
    if (desc.mode === "atStation") {
        if (typeof desc.stationIndex !== "number") {
            return false;
        }
        return car.currentStation === desc.stationIndex;
    }
    if (desc.mode === "trackProgress") {
        if (!desc.op || typeof desc.value !== "number") {
            return false;
        }
        return compareNumbers(car.trackProgress, desc.op, desc.value);
    }
    const expected = resolveConditionTile(desc, context);
    const actual = carTrackTile(car);
    if (!expected || !actual) {
        return false;
    }
    return tilesEqual(expected, actual);
}

export class CarStatusCondition extends Condition {
    type: "carStatus" = "carStatus";
    target: VehicleTargetDesc;
    op: MatchOp;
    status: VehicleStatus;

    constructor(obj: CarStatusConditionDesc) {
        super(obj);
        this.target = {
            useTriggerTarget: obj.useTriggerTarget,
            rideId: obj.rideId,
            trainIndex: obj.trainIndex,
            carIndex: obj.carIndex
        };
        this.op = obj.op;
        this.status = obj.status;
    }

    evaluate(context: TriggerContext): boolean {
        const car = resolveConditionCar(this.target, context);
        if (!car) {
            return false;
        }
        return matchIs(this.op, car.status === this.status);
    }

    getDataToPersist(): object {
        return {
            type: "carStatus",
            ...persistVehicleTargetFields(this.target),
            op: this.op,
            status: this.status
        };
    }
}

export class CarSpeedCondition extends Condition {
    type: "carSpeed" = "carSpeed";
    target: VehicleTargetDesc;
    op: CarSpeedConditionDesc["op"];
    value: number;

    constructor(obj: CarSpeedConditionDesc) {
        super(obj);
        this.target = {
            useTriggerTarget: obj.useTriggerTarget,
            rideId: obj.rideId,
            trainIndex: obj.trainIndex,
            carIndex: obj.carIndex
        };
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(context: TriggerContext): boolean {
        const car = resolveConditionCar(this.target, context);
        if (!car) {
            return false;
        }
        return compareNumbers(car.velocity, this.op, this.value);
    }

    getDataToPersist(): object {
        return {
            type: "carSpeed",
            ...persistVehicleTargetFields(this.target),
            op: this.op,
            value: this.value
        };
    }
}

export class CarLocationCondition extends Condition {
    type: "carLocation" = "carLocation";
    target: VehicleTargetDesc;
    mode: VehicleLocationMode;
    stationIndex?: number;
    op?: CompareOp;
    value?: number;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: CarLocationConditionDesc) {
        super(obj);
        this.target = {
            useTriggerTarget: obj.useTriggerTarget,
            rideId: obj.rideId,
            trainIndex: obj.trainIndex,
            carIndex: obj.carIndex
        };
        this.mode = obj.mode;
        if (obj.stationIndex !== undefined) {
            this.stationIndex = obj.stationIndex;
        }
        if (obj.op !== undefined) {
            this.op = obj.op;
        }
        if (obj.value !== undefined) {
            this.value = obj.value;
        }
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        return evaluateLocation(resolveConditionCar(this.target, context), this, context);
    }

    getDataToPersist(): object {
        const data: CarLocationConditionDesc = {
            type: "carLocation",
            ...persistVehicleTargetFields(this.target),
            ...persistTileTargetFields({
                relativeToTrigger: this.relativeToTrigger === true,
                tile: this.tile || {x: 0, y: 0},
                offset: this.offset || {x: 0, y: 0}
            }),
            mode: this.mode
        };
        if (this.stationIndex !== undefined) {
            data.stationIndex = this.stationIndex;
        }
        if (this.op !== undefined) {
            data.op = this.op;
        }
        if (this.value !== undefined) {
            data.value = this.value;
        }
        return data;
    }
}

export class TrainLocationCondition extends Condition {
    type: "trainLocation" = "trainLocation";
    target: VehicleTargetDesc;
    mode: VehicleLocationMode;
    stationIndex?: number;
    op?: CompareOp;
    value?: number;
    relativeToTrigger?: boolean;
    tile?: {x: number; y: number};
    offset?: {x: number; y: number};

    constructor(obj: TrainLocationConditionDesc) {
        super(obj);
        this.target = {
            useTriggerTarget: obj.useTriggerTarget,
            rideId: obj.rideId,
            trainIndex: obj.trainIndex
        };
        this.mode = obj.mode;
        if (obj.stationIndex !== undefined) {
            this.stationIndex = obj.stationIndex;
        }
        if (obj.op !== undefined) {
            this.op = obj.op;
        }
        if (obj.value !== undefined) {
            this.value = obj.value;
        }
        this.relativeToTrigger = obj.relativeToTrigger;
        this.tile = obj.tile;
        this.offset = obj.offset;
    }

    evaluate(context: TriggerContext): boolean {
        return evaluateLocation(resolveConditionTrainHead(this.target, context), this, context);
    }

    getDataToPersist(): object {
        const data: TrainLocationConditionDesc = {
            type: "trainLocation",
            ...persistVehicleTargetFields(this.target),
            ...persistTileTargetFields({
                relativeToTrigger: this.relativeToTrigger === true,
                tile: this.tile || {x: 0, y: 0},
                offset: this.offset || {x: 0, y: 0}
            }),
            mode: this.mode
        };
        if (this.stationIndex !== undefined) {
            data.stationIndex = this.stationIndex;
        }
        if (this.op !== undefined) {
            data.op = this.op;
        }
        if (this.value !== undefined) {
            data.value = this.value;
        }
        return data;
    }
}
