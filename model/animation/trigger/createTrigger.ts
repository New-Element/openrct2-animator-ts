import Trigger from "./trigger";
import RideEntersTrigger from "./rideEntersTrigger";

interface TriggerDesc {
    type: string;
}

export default function createTrigger(data: TriggerDesc): Trigger|undefined {
    switch(data.type) {
        case 'rideEnters': return new RideEntersTrigger(data);
        default: return undefined;
    }
}