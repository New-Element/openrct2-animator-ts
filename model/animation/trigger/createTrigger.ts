import {TriggerDesc} from "../jsonTypes";
import Trigger from "./trigger";

export default function createTrigger(data: TriggerDesc): Trigger {
    return new Trigger(data);
}
