import Trigger from "./trigger";
import RideEntersTrigger from "./rideEntersTrigger";
import SingleImmediateTrigger from "./singleImmediate";

interface TriggerDesc {
    type: string;
}

export default function createTrigger(data: TriggerDesc): Trigger|undefined {
    switch(data.type) {
        case 'rideEnters': return new RideEntersTrigger(data);
        case 'singleImmediate': return new SingleImmediateTrigger(data);
        default: return undefined;
    }
}