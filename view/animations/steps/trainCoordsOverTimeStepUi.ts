import {StepDesc} from "../../../model/animation/jsonTypes";
import {CoordsFields} from "./fields/coordsFields";
import {StepUiModule} from "./stepUiTypes";

export function createTrainCoordsOverTimeStepUi(fields: CoordsFields): StepUiModule {
    return {
        type: "trainCoordsOverTime",
        addLabel: "Train Coords Over Time",
        rowLabel: () => "Train Coords Over Time",
        createStub: () => ({type: "trainCoordsOverTime", deltaZ: -16, durationTicks: 40}),
        load: (desc: StepDesc) => {
            if (desc.type !== "trainCoordsOverTime") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "trainCoordsOverTime") {
                return null;
            }
            const coords = fields.readCoords();
            return {
                type: "trainCoordsOverTime",
                deltaX: coords.deltaX,
                deltaY: coords.deltaY,
                deltaZ: coords.deltaZ,
                durationTicks: coords.durationTicks
            };
        }
    };
}
