import {StepDesc} from "../../../model/animation/jsonTypes";
import {TrackFields} from "./fields/trackFields";
import {StepUiModule} from "./stepUiTypes";

export function createTrackSetHeightStepUi(fields: TrackFields): StepUiModule {
    return {
        type: "trackSetHeight",
        addLabel: "Set Track Height",
        rowLabel: () => "Set Track Height",
        createStub: () => ({
            type: "trackSetHeight",
            tile: {x: 0, y: 0},
            rideId: 0,
            trackType: 0,
            baseHeight: 0
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "trackSetHeight") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "trackSetHeight") {
                return null;
            }
            return fields.persist();
        }
    };
}
