import {StepDesc} from "../../../model/animation/jsonTypes";
import {CoordsFields} from "./fields/coordsFields";
import {StepUiModule} from "./stepUiTypes";

export function createCarCoordsOverTimeStepUi(fields: CoordsFields): StepUiModule {
    return {
        type: "carCoordsOverTime",
        addLabel: "Car Coords Over Time",
        rowLabel: () => "Car Coords Over Time",
        createStub: () => ({type: "carCoordsOverTime", deltaZ: -16, durationTicks: 40}),
        load: (desc: StepDesc) => {
            if (desc.type !== "carCoordsOverTime") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "carCoordsOverTime") {
                return null;
            }
            const coords = fields.readCoords();
            return {
                type: "carCoordsOverTime",
                deltaX: coords.deltaX,
                deltaY: coords.deltaY,
                deltaZ: coords.deltaZ,
                durationTicks: coords.durationTicks
            };
        }
    };
}
