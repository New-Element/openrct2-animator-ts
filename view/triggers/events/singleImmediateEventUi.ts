import {EventUiModule} from "./eventUiTypes";

export function createSingleImmediateEventUi(): EventUiModule {
    return {
        kind: "singleImmediate",
        editorLabel: "Immediate",
        createStub: () => ({type: "singleImmediate"}),
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
