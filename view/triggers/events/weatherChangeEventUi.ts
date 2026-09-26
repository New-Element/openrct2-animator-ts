import {EventUiModule} from "./eventUiTypes";

export function createWeatherChangeEventUi(): EventUiModule {
    return {
        kind: "weatherChange",
        editorLabel: "Weather Changes",
        createStub: () => ({type: "weatherChange"}),
        hide: () => undefined,
        load: () => undefined,
        save: () => undefined,
        conditionVariableNames: () => []
    };
}
