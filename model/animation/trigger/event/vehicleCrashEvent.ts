import {VehicleCrashEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import {matchesOptionalRide, optionalRideId, peekVehicleCrashes} from "./hookInbox";
import TriggerEvent from "./triggerEvent";

export default class VehicleCrashEvent extends TriggerEvent {
    type: "vehicleCrash" = "vehicleCrash";
    rideId?: number;

    constructor(obj: VehicleCrashEventDesc) {
        super(obj);
        this.type = "vehicleCrash";
        this.rideId = optionalRideId(obj.rideId);
    }

    setRideId(rideId: number | undefined): void {
        this.rideId = optionalRideId(rideId);
    }

    tryFire(): TriggerContext[] {
        const notices = peekVehicleCrashes();
        const out: TriggerContext[] = [];
        for (let i = 0; i < notices.length; i++) {
            const notice = notices[i];
            if (!matchesOptionalRide(this.rideId, notice.rideId)) {
                continue;
            }
            const context: TriggerContext = {
                target: {static: true},
                vehicleId: notice.vehicleId,
                crashIntoType: notice.crashIntoType
            };
            if (typeof notice.rideId === "number") {
                context.rideId = notice.rideId;
            }
            out.push(withContextLists(context));
        }
        return out;
    }

    getDataToPersist(): object {
        const data: {type: "vehicleCrash"; rideId?: number} = {
            type: "vehicleCrash"
        };
        if (typeof this.rideId === "number") {
            data.rideId = this.rideId;
        }
        return data;
    }
}
