import {ParkLoadedEventDesc} from "../../jsonTypes";
import {withContextLists} from "../contextLists";
import TriggerContext from "../triggerContext";
import TriggerEvent from "./triggerEvent";

/**
 * True only during the conductor's one startup pass.
 * Tick polling and a trigger created later in the session stay quiet.
 */
let acceptingParkLoad = false;

export function withParkLoadPass(fn: () => void): void {
    acceptingParkLoad = true;
    try {
        fn();
    } finally {
        acceptingParkLoad = false;
    }
}

export default class ParkLoadedEvent extends TriggerEvent {
    type: "parkLoaded" = "parkLoaded";

    constructor(obj: ParkLoadedEventDesc) {
        super(obj);
        this.type = "parkLoaded";
    }

    tryFire(): TriggerContext[] {
        if (!acceptingParkLoad) {
            return [];
        }
        return [
            withContextLists({
                target: {
                    static: true
                }
            })
        ];
    }

    getDataToPersist(): object {
        return {
            type: "parkLoaded"
        };
    }
}
