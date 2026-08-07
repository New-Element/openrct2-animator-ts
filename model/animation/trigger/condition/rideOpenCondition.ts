/// <reference path="./../../../../openrct2.d.ts" />

import {RideOpenConditionDesc} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import Condition from "./condition";

export default class RideOpenCondition extends Condition {
    type: "rideOpen" = "rideOpen";
    rideId?: number;

    constructor(obj: RideOpenConditionDesc) {
        super(obj);
        this.type = "rideOpen";
        if (obj.rideId !== undefined) {
            this.rideId = obj.rideId;
        }
    }

    evaluate(context: TriggerContext): boolean {
        const rideId = this.rideId !== undefined ? this.rideId : context.rideId;
        if (rideId === undefined) {
            return false;
        }
        const ride = map.getRide(rideId);
        if (!ride) {
            return false;
        }
        return ride.status === "open";
    }

    getDataToPersist(): object {
        const data: { type: "rideOpen"; rideId?: number } = {
            type: "rideOpen"
        };
        if (this.rideId !== undefined) {
            data.rideId = this.rideId;
        }
        return data;
    }
}
