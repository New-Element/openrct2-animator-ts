import {EventUiModule} from "./eventUiTypes";

export function createManualEventUi(): EventUiModule {
    return {
        kind: "manual",
        editorLabel: "Manual",
        createStub: () => null,
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
