import {StepDesc} from "../../../model/animation/jsonTypes";
import {SceneryVisibilityFields} from "./fields/sceneryVisibilityFields";
import {StepUiModule} from "./stepUiTypes";

export function createSceneryVisibilityStepUi(fields: SceneryVisibilityFields): StepUiModule {
    return {
        type: "sceneryVisibility",
        addLabel: "Scenery Visibility",
        rowLabel: (desc) => {
            if (desc.type !== "sceneryVisibility") {
                return "Scenery Visibility";
            }
            if (desc.mode === "invisible") {
                return "Scenery Visibility (Invisible)";
            }
            if (desc.mode === "toggle") {
                return "Scenery Visibility (Toggle)";
            }
            return "Scenery Visibility (Visible)";
        },
        createStub: () => ({
            type: "sceneryVisibility",
            tile: {x: 0, y: 0},
            mode: "visible"
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "sceneryVisibility") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "sceneryVisibility") {
                return null;
            }
            return fields.persist();
        }
    };
}
