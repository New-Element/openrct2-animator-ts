import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {ConditionUiModule} from "./conditionUiTypes";

export function createRideOpenConditionUi(): ConditionUiModule {
    return {
        type: "rideOpen",
        addLabel: null,
        rowLabel: (desc: ConditionDesc) => {
            if (desc.type !== "rideOpen") {
                return "Ride Open";
            }
            return desc.rideId !== undefined ? `Ride Open: ${desc.rideId}` : "Ride Open";
        },
        createStub: () => ({type: "rideOpen"}),
        hide: () => undefined,
        load: () => undefined,
        persist: () => undefined
    };
}
