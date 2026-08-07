/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    Colour,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    listview,
    spinner,
    store,
    textbox,
    twoway,
    vertical,
    window
} from "openrct2-flexui";
import {ConditionDesc} from "../../model/animation/jsonTypes";
import {
    addLink,
    availableAnimationsFor,
    linkedAnimations,
    removeLink
} from "../../model/animation/triggerAnimationLinks";
import CarEntersEvent from "../../model/animation/trigger/event/carEntersEvent";
import VariableChangeEvent from "../../model/animation/trigger/event/variableChangeEvent";
import getConductor from "../../model/getConductor";
import {bindTriggerEditorOpener, goToAnimationEditor} from "../editorNavigation";
import {confirmDeleteTrigger} from "./confirmDeleteTrigger";
import {openObserveTrigger} from "./observeTrigger";
import {
    ADD_CONDITION_LABELS,
    conditionRowLabel,
    createConditionStub
} from "./conditionLabels";
import {availableVariablesLabel} from "./eventVariables";
import {formatErrorText} from "../ui/errorText";
import {pickRide} from "../ui/pickRide";
import {pickTile} from "../ui/pickTile";
import {
    createEventStub,
    EDITOR_EVENT_LABELS,
    editorIndexFromKind,
    eventKindFromTrigger,
    kindFromEditorIndex,
    TriggerEventKind,
    UNKNOWN_EVENT_LABEL
} from "./eventType";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "./rideOptions";

const editingTriggerId = store<string>("");
const nameText = store<string>("");
const eventTypeIndex = store<number>(0);
const unknownEventHint = store<string>("");
const unknownEventHintVisibility = store<"visible" | "none">("none");

const carEntersVisibility = store<"visible" | "none">("none");
const rideDropdownItems = store<string[]>(["(No Rides)"]);
const rideSelectedIndex = store<number>(0);
const tileX = store<number>(0);
const tileY = store<number>(0);

const variableChangeVisibility = store<"visible" | "none">("none");
const variableDropdownItems = store<string[]>(["(No Variables)"]);
const variableSelectedIndex = store<number>(0);

/** Parallel to variableDropdownItems for resolving selected variable id. */
let variableOptionIds: string[] = [];

const conditionsVariablesText = store<string>("No Condition Variables");
const conditionsListItems = store<string[]>([]);
const selectedConditionIndex = store<number>(-1);
/** Drives the listview highlight so it stays in sync when the list refreshes. */
const conditionsSelectedCell = store<RowColumn | null>(null);
const addConditionIndex = store<number>(0);

/** Right-hand selected-condition body; hidden in empty state. */
const conditionEditorVisibility = store<"visible" | "none">("none");
const selectedConditionEmptyVisibility = store<"visible" | "none">("visible");
const selectedConditionTitle = store<string>("Selected Condition");
const conditionModuloVisibility = store<"visible" | "none">("none");
const conditionEqualsVisibility = store<"visible" | "none">("none");
const conditionModulo = store<number>(2);
const conditionRemainder = store<number>(0);
const conditionEqualsValue = store<number>(0);

const linkedAnimationsListItems = store<string[]>([]);
const selectedLinkedAnimationIndex = store<number>(-1);
const addAnimationDropdownItems = store<string[]>(["(No Animations)"]);
const addAnimationSelectedIndex = store<number>(0);
/** Parallel to addAnimationDropdownItems for resolving selected animation id. */
let addAnimationOptionIds: string[] = [];
/** Parallel to linkedAnimationsListItems for resolving selected linked animation id. */
let linkedAnimationIds: string[] = [];

let rideOptions: RideOption[] = [];
let onEditorClosed: (() => void) | null = null;

function setUnknownEventHint(text: string): void {
    unknownEventHint.set(text);
    unknownEventHintVisibility.set(text ? "visible" : "none");
}

function editingTrigger() {
    return getConductor().triggersArray.findById(editingTriggerId.get());
}

function currentEventKind(): TriggerEventKind {
    const trigger = editingTrigger();
    if (!trigger) {
        return "manual";
    }
    return eventKindFromTrigger(trigger);
}

function refreshRideOptions(): void {
    rideOptions = listParkRides();
    if (rideOptions.length === 0) {
        rideDropdownItems.set(["(No Rides)"]);
        rideSelectedIndex.set(0);
        return;
    }
    rideDropdownItems.set(rideNames(rideOptions));
}

function saveCarEntersFields(): void {
    const trigger = editingTrigger();
    if (!trigger || !(trigger.event instanceof CarEntersEvent)) {
        return;
    }
    const event = trigger.event;
    if (rideOptions.length > 0) {
        const idx = rideSelectedIndex.get();
        if (idx >= 0 && idx < rideOptions.length) {
            event.rideId = rideOptions[idx].id;
        }
    }
    event.tile = { x: tileX.get(), y: tileY.get() };
    getConductor().triggersArray.save();
}

function loadCarEntersFieldsFromTrigger(): void {
    const trigger = editingTrigger();
    refreshRideOptions();
    if (!trigger || !(trigger.event instanceof CarEntersEvent)) {
        carEntersVisibility.set("none");
        return;
    }
    carEntersVisibility.set("visible");
    const event = trigger.event;
    tileX.set(event.tile.x);
    tileY.set(event.tile.y);
    const rideIndex = indexOfRideId(rideOptions, event.rideId);
    rideSelectedIndex.set(rideIndex < 0 ? 0 : rideIndex);
}

function variableDisplayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function refreshVariableOptions(): void {
    const variables = getConductor().variablesArray.items;
    variableOptionIds = [];
    if (variables.length === 0) {
        variableDropdownItems.set(["(No Variables)"]);
        variableSelectedIndex.set(0);
        return;
    }
    const labels: string[] = [];
    for (let i = 0; i < variables.length; i++) {
        variableOptionIds.push(variables[i].id);
        labels.push(variableDisplayName(variables[i].name));
    }
    variableDropdownItems.set(labels);
}

function indexOfVariableId(variableId: string): number {
    for (let i = 0; i < variableOptionIds.length; i++) {
        if (variableOptionIds[i] === variableId) {
            return i;
        }
    }
    return -1;
}

function selectedVariableName(): string {
    const idx = variableSelectedIndex.get();
    if (idx < 0 || idx >= variableOptionIds.length) {
        return "";
    }
    const variable = getConductor().variablesArray.findById(variableOptionIds[idx]);
    return variable ? variable.name : "";
}

function saveVariableChangeFields(): void {
    const trigger = editingTrigger();
    if (!trigger || !(trigger.event instanceof VariableChangeEvent)) {
        return;
    }
    if (variableOptionIds.length === 0) {
        trigger.event.setVariableId("");
    } else {
        const idx = variableSelectedIndex.get();
        if (idx >= 0 && idx < variableOptionIds.length) {
            trigger.event.setVariableId(variableOptionIds[idx]);
        }
    }
    getConductor().triggersArray.save();
    conditionsVariablesText.set(
        availableVariablesLabel("variableChange", selectedVariableName())
    );
}

function loadVariableChangeFieldsFromTrigger(): void {
    const trigger = editingTrigger();
    refreshVariableOptions();
    if (!trigger || !(trigger.event instanceof VariableChangeEvent)) {
        variableChangeVisibility.set("none");
        return;
    }
    variableChangeVisibility.set("visible");
    const index = indexOfVariableId(trigger.event.variableId);
    if (index < 0 && variableOptionIds.length > 0) {
        variableSelectedIndex.set(0);
        saveVariableChangeFields();
        return;
    }
    variableSelectedIndex.set(index < 0 ? 0 : index);
}

function syncEventKindUi(kind: TriggerEventKind): void {
    if (kind === "carEnters") {
        loadCarEntersFieldsFromTrigger();
        variableChangeVisibility.set("none");
        conditionsVariablesText.set(availableVariablesLabel(kind));
    }
    else if (kind === "variableChange") {
        carEntersVisibility.set("none");
        loadVariableChangeFieldsFromTrigger();
        conditionsVariablesText.set(
            availableVariablesLabel(kind, selectedVariableName())
        );
    }
    else {
        carEntersVisibility.set("none");
        variableChangeVisibility.set("none");
        conditionsVariablesText.set(availableVariablesLabel(kind));
    }
}

function setSelectedConditionIndex(index: number): void {
    selectedConditionIndex.set(index);
    if (index < 0) {
        conditionsSelectedCell.set(null);
        return;
    }
    conditionsSelectedCell.set({ row: index, column: 0 });
}

function updateSelectedConditionTitle(desc: ConditionDesc | null): void {
    const index = selectedConditionIndex.get();
    if (index < 0 || !desc) {
        selectedConditionTitle.set("Selected Condition");
        return;
    }
    selectedConditionTitle.set(`Selected Condition (${index + 1}): ${conditionRowLabel(desc)}`);
}

function showEmptySelectedCondition(): void {
    conditionEditorVisibility.set("none");
    selectedConditionEmptyVisibility.set("visible");
    selectedConditionTitle.set("Selected Condition");
    conditionModuloVisibility.set("none");
    conditionEqualsVisibility.set("none");
}

function showSelectedConditionEditor(desc: ConditionDesc): void {
    selectedConditionEmptyVisibility.set("none");
    conditionEditorVisibility.set("visible");
    updateSelectedConditionTitle(desc);
    if (desc.type === "trainModulo" || desc.type === "carModulo") {
        conditionModuloVisibility.set("visible");
        conditionEqualsVisibility.set("none");
        conditionModulo.set(desc.modulo);
        conditionRemainder.set(desc.remainder);
    }
    else if (desc.type === "carEquals") {
        conditionModuloVisibility.set("none");
        conditionEqualsVisibility.set("visible");
        conditionEqualsValue.set(desc.value);
    }
    else {
        conditionModuloVisibility.set("none");
        conditionEqualsVisibility.set("none");
    }
}

function refreshConditionsList(): void {
    const trigger = editingTrigger();
    if (!trigger) {
        conditionsListItems.set([]);
        setSelectedConditionIndex(-1);
        showEmptySelectedCondition();
        return;
    }
    const descs = trigger.getConditionDescs();
    const rows: string[] = [];
    for (let i = 0; i < descs.length; i++) {
        rows.push(conditionRowLabel(descs[i]));
    }
    conditionsListItems.set(rows);
    const selected = selectedConditionIndex.get();
    if (selected < 0 || selected >= descs.length) {
        setSelectedConditionIndex(-1);
        showEmptySelectedCondition();
        return;
    }
    conditionsSelectedCell.set({ row: selected, column: 0 });
    showSelectedConditionEditor(descs[selected]);
}

function persistSelectedConditionFields(): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    const index = selectedConditionIndex.get();
    const descs = trigger.getConditionDescs();
    if (index < 0 || index >= descs.length) {
        return;
    }
    const desc = descs[index];
    if (desc.type === "trainModulo" || desc.type === "carModulo") {
        desc.modulo = conditionModulo.get();
        desc.remainder = conditionRemainder.get();
    }
    else if (desc.type === "carEquals") {
        desc.value = conditionEqualsValue.get();
    }
    trigger.setConditions(descs);
    getConductor().triggersArray.save();
    refreshConditionsList();
}

function addCondition(): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    const descs = trigger.getConditionDescs();
    descs.push(createConditionStub(addConditionIndex.get()));
    trigger.setConditions(descs);
    getConductor().triggersArray.save();
    setSelectedConditionIndex(descs.length - 1);
    refreshConditionsList();
}

function deleteSelectedCondition(): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    const index = selectedConditionIndex.get();
    const descs = trigger.getConditionDescs();
    if (index < 0 || index >= descs.length) {
        return;
    }
    const next: ConditionDesc[] = [];
    for (let i = 0; i < descs.length; i++) {
        if (i !== index) {
            next.push(descs[i]);
        }
    }
    trigger.setConditions(next);
    getConductor().triggersArray.save();
    setSelectedConditionIndex(-1);
    refreshConditionsList();
}

function persistEditingTrigger(): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    trigger.setName(nameText.get());
    if (trigger.event instanceof CarEntersEvent) {
        saveCarEntersFields();
    }
    if (trigger.event instanceof VariableChangeEvent) {
        saveVariableChangeFields();
    }
    getConductor().triggersArray.save();
}

function deleteEditingTrigger(): void {
    const id = editingTriggerId.get();
    const trigger = getConductor().triggersArray.findById(id);
    if (!trigger) {
        return;
    }
    confirmDeleteTrigger(trigger.id, trigger.name, () => {
        getConductor().triggersArray.removeById(id);
        getConductor().triggersArray.save();
        editorWindow.close();
        if (onEditorClosed) {
            onEditorClosed();
        }
    });
}

function refreshLinkedAnimationsList(): void {
    const triggerId = editingTriggerId.get();
    const linked = linkedAnimations(triggerId);
    linkedAnimationIds = [];
    const rows: string[] = [];
    for (let i = 0; i < linked.length; i++) {
        linkedAnimationIds.push(linked[i].id);
        rows.push(linked[i].name);
    }
    linkedAnimationsListItems.set(rows);

    const selected = selectedLinkedAnimationIndex.get();
    if (selected < 0 || selected >= linkedAnimationIds.length) {
        selectedLinkedAnimationIndex.set(-1);
    }

    const available = availableAnimationsFor(triggerId);
    addAnimationOptionIds = [];
    if (available.length === 0) {
        addAnimationDropdownItems.set(["(No Animations)"]);
        addAnimationSelectedIndex.set(0);
        return;
    }
    const labels: string[] = [];
    for (let i = 0; i < available.length; i++) {
        addAnimationOptionIds.push(available[i].id);
        labels.push(available[i].name);
    }
    addAnimationDropdownItems.set(labels);
    if (addAnimationSelectedIndex.get() >= labels.length) {
        addAnimationSelectedIndex.set(0);
    }
}

function addLinkedAnimation(): void {
    const animationId = addAnimationOptionIds[addAnimationSelectedIndex.get()];
    if (!animationId) {
        return;
    }
    if (!addLink(editingTriggerId.get(), animationId)) {
        return;
    }
    selectedLinkedAnimationIndex.set(-1);
    refreshLinkedAnimationsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function editSelectedLinkedAnimation(): void {
    const index = selectedLinkedAnimationIndex.get();
    if (index < 0 || index >= linkedAnimationIds.length) {
        return;
    }
    goToAnimationEditor(linkedAnimationIds[index], () => {
        refreshLinkedAnimationsList();
        if (onEditorClosed) {
            onEditorClosed();
        }
    });
}

function removeSelectedLinkedAnimation(): void {
    const index = selectedLinkedAnimationIndex.get();
    if (index < 0 || index >= linkedAnimationIds.length) {
        return;
    }
    if (!removeLink(editingTriggerId.get(), linkedAnimationIds[index])) {
        return;
    }
    selectedLinkedAnimationIndex.set(-1);
    refreshLinkedAnimationsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function applyEventType(index: number): void {
    eventTypeIndex.set(index);
    setUnknownEventHint("");
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    const kind = kindFromEditorIndex(index);
    trigger.setEvent(createEventStub(kind));
    getConductor().triggersArray.save();
    syncEventKindUi(kind);
    refreshConditionsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

const editorWindow = window({
    title: "Edit Trigger",
    colours: [Colour.DarkOliveGreen, Colour.DarkOliveGreen],
    width: { value: 720, min: 560, max: 1100 },
    height: { value: 520, min: 420, max: 740 },
    position: "center",
    padding: 8,
    content: [
        vertical({
            spacing: 4,
            height: "1w",
            content: [
                horizontal({
                    spacing: 8,
                    height: "1w",
                    content: [
                        vertical({
                            width: "1w",
                            height: "1w",
                            spacing: 4,
                            content: [
                                groupbox({
                                    text: "Name",
                                    content: [
                                        textbox({
                                            text: nameText,
                                            onChange: (text) => {
                                                nameText.set(text);
                                                const trigger = editingTrigger();
                                                if (!trigger) {
                                                    return;
                                                }
                                                trigger.setName(text);
                                                getConductor().triggersArray.save();
                                                if (onEditorClosed) {
                                                    onEditorClosed();
                                                }
                                            }
                                        })
                                    ]
                                }),
                                groupbox({
                                    text: "Event",
                                    height: "1w",
                                    content: [
                                        label({
                                            text: unknownEventHint,
                                            visibility: unknownEventHintVisibility
                                        }),
                                        dropdown({
                                            items: EDITOR_EVENT_LABELS,
                                            selectedIndex: eventTypeIndex,
                                            onChange: (index) => applyEventType(index)
                                        }),
                                        label({
                                            text: "Ride",
                                            visibility: carEntersVisibility
                                        }),
                                        horizontal([
                                            dropdown({
                                                items: rideDropdownItems,
                                                selectedIndex: twoway(rideSelectedIndex),
                                                visibility: carEntersVisibility,
                                                onChange: (index) => {
                                                    rideSelectedIndex.set(index);
                                                    saveCarEntersFields();
                                                }
                                            }),
                                            button({
                                                text: "Pick Ride",
                                                width: 70,
                                                height: 14,
                                                visibility: carEntersVisibility,
                                                onClick: () => {
                                                    pickRide((rideId) => {
                                                        refreshRideOptions();
                                                        const rideIndex = indexOfRideId(
                                                            rideOptions,
                                                            rideId
                                                        );
                                                        if (rideIndex < 0) {
                                                            return;
                                                        }
                                                        rideSelectedIndex.set(rideIndex);
                                                        saveCarEntersFields();
                                                    });
                                                }
                                            })
                                        ]),
                                        label({
                                            text: "Tile",
                                            visibility: carEntersVisibility
                                        }),
                                        horizontal([
                                            label({
                                                text: "X",
                                                width: 12,
                                                visibility: carEntersVisibility
                                            }),
                                            spinner({
                                                value: twoway(tileX),
                                                minimum: 0,
                                                maximum: 10000,
                                                visibility: carEntersVisibility,
                                                onChange: (value) => {
                                                    tileX.set(value);
                                                    saveCarEntersFields();
                                                }
                                            }),
                                            label({
                                                text: "Y",
                                                width: 12,
                                                visibility: carEntersVisibility
                                            }),
                                            spinner({
                                                value: twoway(tileY),
                                                minimum: 0,
                                                maximum: 10000,
                                                visibility: carEntersVisibility,
                                                onChange: (value) => {
                                                    tileY.set(value);
                                                    saveCarEntersFields();
                                                }
                                            }),
                                            button({
                                                text: "Pick Tile",
                                                width: 70,
                                                height: 14,
                                                visibility: carEntersVisibility,
                                                onClick: () => {
                                                    pickTile((tile) => {
                                                        tileX.set(tile.x);
                                                        tileY.set(tile.y);
                                                        saveCarEntersFields();
                                                    });
                                                }
                                            })
                                        ]),
                                        label({
                                            text: "Variable",
                                            visibility: variableChangeVisibility
                                        }),
                                        dropdown({
                                            items: variableDropdownItems,
                                            selectedIndex: twoway(variableSelectedIndex),
                                            visibility: variableChangeVisibility,
                                            onChange: (index) => {
                                                variableSelectedIndex.set(index);
                                                saveVariableChangeFields();
                                            }
                                        })
                                    ]
                                }),
                                groupbox({
                                    text: "Linked Animations",
                                    content: [
                                        listview({
                                            items: linkedAnimationsListItems,
                                            scrollbars: "vertical",
                                            canSelect: true,
                                            height: 70,
                                            onClick: (item) => {
                                                selectedLinkedAnimationIndex.set(item);
                                            }
                                        }),
                                        horizontal([
                                            dropdown({
                                                items: addAnimationDropdownItems,
                                                selectedIndex: twoway(addAnimationSelectedIndex),
                                                width: 140
                                            }),
                                            button({
                                                text: "Add",
                                                width: 40,
                                                height: 14,
                                                onClick: () => addLinkedAnimation()
                                            }),
                                            button({
                                                text: "Edit",
                                                width: 40,
                                                height: 14,
                                                disabled: compute(
                                                    selectedLinkedAnimationIndex,
                                                    (index) => index < 0
                                                ),
                                                onClick: () => editSelectedLinkedAnimation()
                                            }),
                                            button({
                                                text: "Delete",
                                                width: 55,
                                                height: 14,
                                                disabled: compute(
                                                    selectedLinkedAnimationIndex,
                                                    (index) => index < 0
                                                ),
                                                onClick: () => removeSelectedLinkedAnimation()
                                            })
                                        ])
                                    ]
                                })
                            ]
                        }),
                        vertical({
                            width: "1w",
                            height: "1w",
                            spacing: 4,
                            content: [
                                groupbox({
                                    text: "Conditions",
                                    height: "1w",
                                    content: [
                                        label({
                                            text: conditionsVariablesText
                                        }),
                                        listview({
                                            items: conditionsListItems,
                                            scrollbars: "vertical",
                                            canSelect: true,
                                            selectedCell: twoway(conditionsSelectedCell),
                                            height: "1w",
                                            onClick: (item) => {
                                                setSelectedConditionIndex(item);
                                                refreshConditionsList();
                                            }
                                        }),
                                        horizontal([
                                            dropdown({
                                                items: ADD_CONDITION_LABELS,
                                                selectedIndex: twoway(addConditionIndex),
                                                width: 140
                                            }),
                                            button({
                                                text: "Add",
                                                width: 40,
                                                height: 14,
                                                onClick: () => addCondition()
                                            })
                                        ])
                                    ]
                                }),
                                groupbox({
                                    text: selectedConditionTitle,
                                    height: "1w",
                                    content: [
                                        label({
                                            text: "Select A Condition From The List.",
                                            visibility: selectedConditionEmptyVisibility
                                        }),
                                        button({
                                            text: "Delete",
                                            width: 55,
                                            height: 14,
                                            visibility: conditionEditorVisibility,
                                            onClick: () => deleteSelectedCondition()
                                        }),
                                        horizontal([
                                            label({
                                                text: "Modulo",
                                                width: 50,
                                                visibility: conditionModuloVisibility
                                            }),
                                            spinner({
                                                value: twoway(conditionModulo),
                                                minimum: 1,
                                                maximum: 10000,
                                                visibility: conditionModuloVisibility,
                                                onChange: (value) => {
                                                    conditionModulo.set(value);
                                                    persistSelectedConditionFields();
                                                }
                                            }),
                                            label({
                                                text: "Remainder",
                                                width: 60,
                                                visibility: conditionModuloVisibility
                                            }),
                                            spinner({
                                                value: twoway(conditionRemainder),
                                                minimum: 0,
                                                maximum: 10000,
                                                visibility: conditionModuloVisibility,
                                                onChange: (value) => {
                                                    conditionRemainder.set(value);
                                                    persistSelectedConditionFields();
                                                }
                                            })
                                        ]),
                                        horizontal([
                                            label({
                                                text: "Value",
                                                width: 40,
                                                visibility: conditionEqualsVisibility
                                            }),
                                            spinner({
                                                value: twoway(conditionEqualsValue),
                                                minimum: 0,
                                                maximum: 10000,
                                                visibility: conditionEqualsVisibility,
                                                onChange: (value) => {
                                                    conditionEqualsValue.set(value);
                                                    persistSelectedConditionFields();
                                                }
                                            })
                                        ])
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                horizontal({
                    padding: { left: "1w" },
                    content: [
                        button({
                            text: "Delete Trigger",
                            width: 100,
                            height: 14,
                            onClick: () => deleteEditingTrigger()
                        }),
                        button({
                            text: "Observe Trigger",
                            width: 110,
                            height: 14,
                            onClick: () => {
                                const trigger = editingTrigger();
                                if (!trigger) {
                                    return;
                                }
                                openObserveTrigger(trigger.id, trigger.name);
                            }
                        })
                    ]
                })
            ]
        })
    ],
    onClose: () => {
        persistEditingTrigger();
        if (onEditorClosed) {
            onEditorClosed();
        }
    }
});

export function openTriggerEditor(triggerId: string, onClosed?: () => void): void {
    const trigger = getConductor().triggersArray.findById(triggerId);
    if (!trigger) {
        console.log(`[TriggerEditor] Trigger "${triggerId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingTriggerId.set(trigger.id);
    nameText.set(trigger.name);
    setSelectedConditionIndex(-1);
    showEmptySelectedCondition();

    const kind = eventKindFromTrigger(trigger);
    if (kind === "unknown" && trigger.event) {
        setUnknownEventHint(
            formatErrorText(`${UNKNOWN_EVENT_LABEL}: ${trigger.event.type}`)
        );
        eventTypeIndex.set(0);
        carEntersVisibility.set("none");
        variableChangeVisibility.set("none");
        conditionsVariablesText.set(availableVariablesLabel("unknown"));
    }
    else {
        setUnknownEventHint("");
        eventTypeIndex.set(editorIndexFromKind(kind));
        syncEventKindUi(kind);
    }
    refreshConditionsList();
    selectedLinkedAnimationIndex.set(-1);
    refreshLinkedAnimationsList();
    editorWindow.open();
}

bindTriggerEditorOpener(openTriggerEditor);
