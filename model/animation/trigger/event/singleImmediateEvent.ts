import {SingleImmediateEventDesc} from "../../jsonTypes";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

export default class SingleImmediateEvent extends TriggerEvent {
    type: "singleImmediate" = "singleImmediate";

    constructor(obj: SingleImmediateEventDesc) {
        super(obj);
        this.type = "singleImmediate";
    }

    tryFire(): TriggerContext[] {
        return [
            {
                target: {
                    static: true
                }
            }
        ];
    }

    getDataToPersist(): object {
        return {
            type: "singleImmediate"
        };
    }
}
