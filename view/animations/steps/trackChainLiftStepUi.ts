import {StepDesc} from "../../../model/animation/jsonTypes";
import {TrackChainLiftFields} from "./fields/trackChainLiftFields";
import {StepUiModule} from "./stepUiTypes";

export function createTrackChainLiftStepUi(fields: TrackChainLiftFields): StepUiModule {
    return {
        type: "trackChainLift",
        addLabel: "Chain Lift",
        rowLabel: (desc) => {
            if (desc.type !== "trackChainLift") {
                return "Chain Lift";
            }
            if (desc.mode === "off") {
                return "Chain Lift (Off)";
            }
            if (desc.mode === "toggle") {
                return "Chain Lift (Toggle)";
            }
            return "Chain Lift (On)";
        },
        createStub: () => ({
            type: "trackChainLift",
            tile: {x: 0, y: 0},
            rideId: 0,
            trackType: 0,
            mode: "on"
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "trackChainLift") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "trackChainLift") {
                return null;
            }
            return fields.persist();
        }
    };
}
