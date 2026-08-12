import {TriggerEventDesc} from "../../../model/animation/jsonTypes";
import CarEntersEvent from "../../../model/animation/trigger/event/carEntersEvent";
import TrainEntersEvent from "../../../model/animation/trigger/event/trainEntersEvent";
import Trigger from "../../../model/animation/trigger/trigger";
import {createCarEntersEventUi} from "./carEntersEventUi";
import {EventUiModule, TriggerEventKind} from "./eventUiTypes";
import {createRideTileFields} from "./fields/rideTileFields";
import {createVariableChangeFields} from "./fields/variableChangeFields";
import {createManualEventUi} from "./manualEventUi";
import {createSingleImmediateEventUi} from "./singleImmediateEventUi";
import {createStaffEventUi} from "./staffEventUi";
import {createTrainEntersEventUi} from "./trainEntersEventUi";
import {createUnknownEventUi} from "./unknownEventUi";
import {createVariableChangeEventUi} from "./variableChangeEventUi";

export type {EventUiModule, TriggerEventKind} from "./eventUiTypes";

export type EventEditorUi = {
    EDITOR_EVENT_LABELS: string[];
    getEventUi(kind: TriggerEventKind): EventUiModule;
    kindFromEditorIndex(index: number): TriggerEventKind;
    editorIndexFromKind(kind: TriggerEventKind): number;
    createEventStub(kind: TriggerEventKind): TriggerEventDesc | null;
    hideAllEventSections(): void;
    syncEventKind(kind: TriggerEventKind, trigger: Trigger): void;
    saveCurrentEvent(trigger: Trigger): void;
    conditionVariablesLabel(kind: TriggerEventKind, variableName?: string): string;
    selectedVariableName(): string;
    widgets: unknown[];
};

export function createEventEditorUi(
    getTrigger: () => Trigger | null,
    onVariableHintChange: () => void
): EventEditorUi {
    // Shared ride+tile editors for carEnters and trainEnters (same fields, different event).
    const rideTileFields = createRideTileFields(getTrigger, (trigger) => {
        if (trigger.event instanceof CarEntersEvent || trigger.event instanceof TrainEntersEvent) {
            return trigger.event;
        }
        return null;
    });
    const variableChangeFields = createVariableChangeFields(getTrigger, onVariableHintChange);

    const modules: EventUiModule[] = [
        createManualEventUi(),
        createCarEntersEventUi(rideTileFields),
        createTrainEntersEventUi(rideTileFields),
        createSingleImmediateEventUi(),
        createStaffEventUi(),
        createVariableChangeEventUi(variableChangeFields),
        createUnknownEventUi()
    ];

    const byKind: {[kind: string]: EventUiModule} = {};
    for (let i = 0; i < modules.length; i++) {
        byKind[modules[i].kind] = modules[i];
    }

    const editorModules: EventUiModule[] = [];
    const EDITOR_EVENT_LABELS: string[] = [];
    for (let i = 0; i < modules.length; i++) {
        if (modules[i].editorLabel !== null) {
            editorModules.push(modules[i]);
            EDITOR_EVENT_LABELS.push(modules[i].editorLabel as string);
        }
    }

    function getEventUi(kind: TriggerEventKind): EventUiModule {
        return byKind[kind] || byKind.unknown;
    }

    function kindFromEditorIndex(index: number): TriggerEventKind {
        const module = editorModules[index];
        return module ? module.kind : "manual";
    }

    function editorIndexFromKind(kind: TriggerEventKind): number {
        for (let i = 0; i < editorModules.length; i++) {
            if (editorModules[i].kind === kind) {
                return i;
            }
        }
        // Unknown is not in the dropdown; force Manual until the user picks a real type.
        return 0;
    }

    function createEventStub(kind: TriggerEventKind): TriggerEventDesc | null {
        return getEventUi(kind).createStub();
    }

    function hideAllEventSections(): void {
        for (let i = 0; i < modules.length; i++) {
            modules[i].hide();
        }
    }

    function syncEventKind(kind: TriggerEventKind, trigger: Trigger): void {
        hideAllEventSections();
        getEventUi(kind).load(trigger);
    }

    function saveCurrentEvent(trigger: Trigger): void {
        if (!trigger.event) {
            return;
        }
        const kind = eventKindFromEventType(trigger.event.type);
        getEventUi(kind).save(trigger);
    }

    function conditionVariablesLabel(kind: TriggerEventKind, variableName?: string): string {
        const vars = getEventUi(kind).conditionVariableNames(variableName);
        if (vars.length === 0) {
            return "No Condition Variables";
        }
        return `Available: ${vars.join(", ")}`;
    }

    return {
        EDITOR_EVENT_LABELS,
        getEventUi,
        kindFromEditorIndex,
        editorIndexFromKind,
        createEventStub,
        hideAllEventSections,
        syncEventKind,
        saveCurrentEvent,
        conditionVariablesLabel,
        selectedVariableName: () => variableChangeFields.selectedVariableName(),
        widgets: [...rideTileFields.widgets, ...variableChangeFields.widgets]
    };
}

function eventKindFromEventType(type: string): TriggerEventKind {
    switch (type) {
        case "carEnters":
            return "carEnters";
        case "trainEnters":
            return "trainEnters";
        case "vehicleEnters":
            // Legacy type string if somehow still present at runtime.
            return "carEnters";
        case "singleImmediate":
            return "singleImmediate";
        case "staff":
            return "staff";
        case "variableChange":
            return "variableChange";
        default:
            return "unknown";
    }
}
