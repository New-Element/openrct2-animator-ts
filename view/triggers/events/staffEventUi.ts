import {EventUiModule} from "./eventUiTypes";

export function createStaffEventUi(): EventUiModule {
    return {
        kind: "staff",
        editorLabel: "Staff",
        createStub: () => ({type: "staff", staffId: 0}),
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
