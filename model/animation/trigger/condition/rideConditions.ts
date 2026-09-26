/// <reference path="./../../../../openrct2.d.ts" />

import {
    EmptyOp,
    MatchOp,
    RideBreakdownMode,
    RideBreakdownStatusConditionDesc,
    RideEmptyConditionDesc,
    RideGuestCountConditionDesc,
    RideStatusConditionDesc
} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import {compareNumbers} from "./compare";
import Condition from "./condition";
import {resolveConditionRide} from "./resolveEntities";

function matchIs(op: MatchOp, equal: boolean): boolean {
    return op === "is" ? equal : !equal;
}

function rideIsBrokenDown(ride: Ride): boolean {
    return String(ride.breakdown) !== "none";
}

export class RideStatusCondition extends Condition {
    type: "rideStatus" = "rideStatus";
    rideId?: number;
    op: MatchOp;
    status: RideStatus;

    constructor(obj: RideStatusConditionDesc) {
        super(obj);
        if (obj.rideId !== undefined) {
            this.rideId = obj.rideId;
        }
        this.op = obj.op;
        this.status = obj.status;
    }

    evaluate(context: TriggerContext): boolean {
        const ride = resolveConditionRide(this.rideId, context);
        if (!ride) {
            return false;
        }
        return matchIs(this.op, ride.status === this.status);
    }

    getDataToPersist(): object {
        const data: RideStatusConditionDesc = {
            type: "rideStatus",
            op: this.op,
            status: this.status
        };
        if (this.rideId !== undefined) {
            data.rideId = this.rideId;
        }
        return data;
    }
}

export class RideBreakdownStatusCondition extends Condition {
    type: "rideBreakdownStatus" = "rideBreakdownStatus";
    rideId?: number;
    mode: RideBreakdownMode;
    breakdownType?: BreakdownType;

    constructor(obj: RideBreakdownStatusConditionDesc) {
        super(obj);
        if (obj.rideId !== undefined) {
            this.rideId = obj.rideId;
        }
        this.mode = obj.mode;
        if (obj.breakdownType !== undefined) {
            this.breakdownType = obj.breakdownType;
        }
    }

    evaluate(context: TriggerContext): boolean {
        const ride = resolveConditionRide(this.rideId, context);
        if (!ride) {
            return false;
        }
        const broken = rideIsBrokenDown(ride);
        if (this.mode === "broken") {
            return broken;
        }
        if (this.mode === "notBroken") {
            return !broken;
        }
        if (!this.breakdownType) {
            return false;
        }
        const typeMatches = String(ride.breakdown) === this.breakdownType;
        return this.mode === "typeIs" ? typeMatches : !typeMatches;
    }

    getDataToPersist(): object {
        const data: RideBreakdownStatusConditionDesc = {
            type: "rideBreakdownStatus",
            mode: this.mode
        };
        if (this.rideId !== undefined) {
            data.rideId = this.rideId;
        }
        if (this.breakdownType !== undefined) {
            data.breakdownType = this.breakdownType;
        }
        return data;
    }
}

export class RideGuestCountCondition extends Condition {
    type: "rideGuestCount" = "rideGuestCount";
    rideId?: number;
    op: RideGuestCountConditionDesc["op"];
    value: number;

    constructor(obj: RideGuestCountConditionDesc) {
        super(obj);
        if (obj.rideId !== undefined) {
            this.rideId = obj.rideId;
        }
        this.op = obj.op;
        this.value = obj.value;
    }

    evaluate(context: TriggerContext): boolean {
        const ride = resolveConditionRide(this.rideId, context);
        if (!ride) {
            return false;
        }
        return compareNumbers(ride.guestCount, this.op, this.value);
    }

    getDataToPersist(): object {
        const data: RideGuestCountConditionDesc = {
            type: "rideGuestCount",
            op: this.op,
            value: this.value
        };
        if (this.rideId !== undefined) {
            data.rideId = this.rideId;
        }
        return data;
    }
}

export class RideEmptyCondition extends Condition {
    type: "rideEmpty" = "rideEmpty";
    rideId?: number;
    expected: EmptyOp;

    constructor(obj: RideEmptyConditionDesc) {
        super(obj);
        if (obj.rideId !== undefined) {
            this.rideId = obj.rideId;
        }
        this.expected = obj.expected;
    }

    evaluate(context: TriggerContext): boolean {
        const ride = resolveConditionRide(this.rideId, context);
        if (!ride) {
            return false;
        }
        return this.expected === "empty" ? ride.isEmpty : !ride.isEmpty;
    }

    getDataToPersist(): object {
        const data: RideEmptyConditionDesc = {
            type: "rideEmpty",
            expected: this.expected
        };
        if (this.rideId !== undefined) {
            data.rideId = this.rideId;
        }
        return data;
    }
}
