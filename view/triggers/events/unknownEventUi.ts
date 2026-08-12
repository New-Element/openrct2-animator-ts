import {EventUiModule} from "./eventUiTypes";

export function createUnknownEventUi(): EventUiModule {
    return {
        kind: "unknown",
        editorLabel: null,
        createStub: () => null,
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
