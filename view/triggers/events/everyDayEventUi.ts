import {EventUiModule} from "./eventUiTypes";

export function createEveryDayEventUi(): EventUiModule {
    return {
        kind: "everyDay",
        editorLabel: "Every Day",
        createStub: () => ({type: "everyDay"}),
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
