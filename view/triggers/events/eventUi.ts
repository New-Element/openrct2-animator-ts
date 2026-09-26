import {TriggerEventDesc} from "../../../model/animation/jsonTypes";
import RideBreakdownEvent from "../../../model/animation/trigger/event/rideBreakdownEvent";
import CarEntersEvent from "../../../model/animation/trigger/event/carEntersEvent";
import TrainEntersEvent from "../../../model/animation/trigger/event/trainEntersEvent";
import VehicleCrashEvent from "../../../model/animation/trigger/event/vehicleCrashEvent";
import Trigger from "../../../model/animation/trigger/trigger";
import {createCarEntersEventUi} from "./carEntersEventUi";
import {createEveryDayEventUi} from "./everyDayEventUi";
import {createParkLoadedEventUi} from "./parkLoadedEventUi";
import {createEveryNTicksEventUi} from "./everyNTicksEventUi";
import {EventUiModule, TriggerEventKind} from "./eventUiTypes";
import {createEveryNTicksFields} from "./fields/everyNTicksFields";
import {createOptionalRideFields} from "./fields/optionalRideFields";
import {createRideTileFields} from "./fields/rideTileFields";
import {createVariableChangeFields} from "./fields/variableChangeFields";
import {createVariableThresholdFields} from "./fields/variableThresholdFields";
import {createGuestGenerationEventUi} from "./guestGenerationEventUi";
import {createManualEventUi} from "./manualEventUi";
import {createRideBreakdownEventUi} from "./rideBreakdownEventUi";
import {createSingleImmediateEventUi} from "./singleImmediateEventUi";
import {createStaffEventUi} from "./staffEventUi";
import {createTrainEntersEventUi} from "./trainEntersEventUi";
import {createUnknownEventUi} from "./unknownEventUi";
import {createVariableChangeEventUi} from "./variableChangeEventUi";
import {createVariableThresholdEventUi} from "./variableThresholdEventUi";
import {createVehicleCrashEventUi} from "./vehicleCrashEventUi";
import {createWeatherChangeEventUi} from "./weatherChangeEventUi";

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
    selectedVariableName(kind?: TriggerEventKind): string;
    widgets: unknown[];
};

export function createEventEditorUi(
    getTrigger: () => Trigger | null,
    onVariableHintChange: () => void,
    canPersist: () => boolean = () => true
): EventEditorUi {
    // Shared ride+tile editors for carEnters and trainEnters (same fields, different event).
    const rideTileFields = createRideTileFields(
        getTrigger,
        (trigger) => {
            if (trigger.event instanceof CarEntersEvent || trigger.event instanceof TrainEntersEvent) {
                return trigger.event;
            }
            return null;
        },
        canPersist
    );
    const optionalRideFields = createOptionalRideFields(
        getTrigger,
        (trigger) => {
            if (
                trigger.event instanceof RideBreakdownEvent ||
                trigger.event instanceof VehicleCrashEvent
            ) {
                return trigger.event;
            }
            return null;
        },
        canPersist
    );
    const variableChangeFields = createVariableChangeFields(
        getTrigger,
        onVariableHintChange,
        canPersist
    );
    const variableThresholdFields = createVariableThresholdFields(
        getTrigger,
        onVariableHintChange,
        canPersist
    );
    const everyNTicksFields = createEveryNTicksFields(getTrigger, canPersist);

    const modules: EventUiModule[] = [
        createManualEventUi(),
        createCarEntersEventUi(rideTileFields),
        createTrainEntersEventUi(rideTileFields),
        createSingleImmediateEventUi(),
        createEveryNTicksEventUi(everyNTicksFields),
        createEveryDayEventUi(),
        createParkLoadedEventUi(),
        createRideBreakdownEventUi(optionalRideFields),
        createVehicleCrashEventUi(optionalRideFields),
        createGuestGenerationEventUi(),
        createWeatherChangeEventUi(),
        createStaffEventUi(),
        createVariableChangeEventUi(variableChangeFields),
        createVariableThresholdEventUi(variableThresholdFields),
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

    function selectedVariableName(kind?: TriggerEventKind): string {
        if (kind === "variableThreshold") {
            return variableThresholdFields.selectedVariableName();
        }
        return variableChangeFields.selectedVariableName();
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
        selectedVariableName,
        widgets: [
            ...rideTileFields.widgets,
            ...optionalRideFields.widgets,
            ...everyNTicksFields.widgets,
            ...variableChangeFields.widgets,
            ...variableThresholdFields.widgets
        ]
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
        case "everyNTicks":
            return "everyNTicks";
        case "everyDay":
            return "everyDay";
        case "parkLoaded":
            return "parkLoaded";
        case "rideBreakdown":
            return "rideBreakdown";
        case "vehicleCrash":
            return "vehicleCrash";
        case "guestGeneration":
            return "guestGeneration";
        case "weatherChange":
            return "weatherChange";
        case "staff":
            return "staff";
        case "variableChange":
            return "variableChange";
        case "variableThreshold":
            return "variableThreshold";
        default:
            return "unknown";
    }
}
