import {EventUiModule} from "./eventUiTypes";

export function createGuestGenerationEventUi(): EventUiModule {
    return {
        kind: "guestGeneration",
        editorLabel: "Guest Spawns",
        createStub: () => ({type: "guestGeneration"}),
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
