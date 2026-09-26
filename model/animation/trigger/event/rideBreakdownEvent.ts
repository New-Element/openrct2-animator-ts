import {RideBreakdownEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import {matchesOptionalRide, optionalRideId, peekRideBreakdowns} from "./hookInbox";
import TriggerEvent from "./triggerEvent";

export default class RideBreakdownEvent extends TriggerEvent {
    type: "rideBreakdown" = "rideBreakdown";
    rideId?: number;

    constructor(obj: RideBreakdownEventDesc) {
        super(obj);
        this.type = "rideBreakdown";
        this.rideId = optionalRideId(obj.rideId);
    }

    setRideId(rideId: number | undefined): void {
        this.rideId = optionalRideId(rideId);
    }

    tryFire(): TriggerContext[] {
        const notices = peekRideBreakdowns();
        const out: TriggerContext[] = [];
        for (let i = 0; i < notices.length; i++) {
            const notice = notices[i];
            if (!matchesOptionalRide(this.rideId, notice.rideId)) {
                continue;
            }
            out.push(
                withContextLists({
                    target: {static: true},
                    rideId: notice.rideId,
                    breakdownReason: notice.breakdownReason
                })
            );
        }
        return out;
    }

    getDataToPersist(): object {
        const data: {type: "rideBreakdown"; rideId?: number} = {
            type: "rideBreakdown"
        };
        if (typeof this.rideId === "number") {
            data.rideId = this.rideId;
        }
        return data;
    }
}
