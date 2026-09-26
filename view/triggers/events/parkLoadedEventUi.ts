import {EventUiModule} from "./eventUiTypes";

export function createParkLoadedEventUi(): EventUiModule {
    return {
        kind: "parkLoaded",
        editorLabel: "Park Loaded",
        createStub: () => ({type: "parkLoaded"}),
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
