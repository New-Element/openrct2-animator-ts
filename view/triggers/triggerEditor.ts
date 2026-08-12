/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    listview,
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
import getConductor from "../../model/getConductor";
import {bindTriggerEditorOpener, goToAnimationEditor} from "../editorNavigation";
import {formatErrorText} from "../ui/errorText";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {createConditionEditorUi} from "./conditions/conditionUi";
import {confirmDeleteTrigger} from "./confirmDeleteTrigger";
import {createEventEditorUi} from "./events/eventUi";
import {TriggerEventKind} from "./events/eventUiTypes";
import {eventKindFromTrigger, UNKNOWN_EVENT_LABEL} from "./eventType";
import {openObserveTrigger} from "./observeTrigger";

const editingTriggerId = store<string>("");
const nameText = store<string>("");
const eventTypeIndex = store<number>(0);
const unknownEventHint = store<string>("");
const unknownEventHintVisibility = store<"visible" | "none">("none");

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

const linkedAnimationsListItems = store<string[]>([]);
const selectedLinkedAnimationIndex = store<number>(-1);
const addAnimationDropdownItems = store<string[]>(["(No Animations)"]);
const addAnimationSelectedIndex = store<number>(0);
/** Parallel to addAnimationDropdownItems for resolving selected animation id. */
let addAnimationOptionIds: string[] = [];
/** Parallel to linkedAnimationsListItems for resolving selected linked animation id. */
let linkedAnimationIds: string[] = [];

let onEditorClosed: (() => void) | null = null;

function setUnknownEventHint(text: string): void {
    unknownEventHint.set(text);
    unknownEventHintVisibility.set(text ? "visible" : "none");
}

function editingTrigger() {
    return getConductor().triggersArray.findById(editingTriggerId.get());
}

function updateConditionVariablesHint(kind: TriggerEventKind): void {
    const variableName =
        kind === "variableChange" ? eventUi.selectedVariableName() : undefined;
    conditionsVariablesText.set(eventUi.conditionVariablesLabel(kind, variableName));
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
    conditionUi.persistCondition(desc);
    trigger.setConditions(descs);
    getConductor().triggersArray.save();
    refreshConditionsList();
}

const eventUi = createEventEditorUi(
    () => editingTrigger() || null,
    () => updateConditionVariablesHint("variableChange")
);

const conditionUi = createConditionEditorUi(() => persistSelectedConditionFields());

function syncEventKindUi(kind: TriggerEventKind): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    eventUi.syncEventKind(kind, trigger);
    updateConditionVariablesHint(kind);
}

function setSelectedConditionIndex(index: number): void {
    selectedConditionIndex.set(index);
    if (index < 0) {
        conditionsSelectedCell.set(null);
        return;
    }
    conditionsSelectedCell.set({row: index, column: 0});
}

function updateSelectedConditionTitle(desc: ConditionDesc | null): void {
    const index = selectedConditionIndex.get();
    if (index < 0 || !desc) {
        selectedConditionTitle.set("Selected Condition");
        return;
    }
    selectedConditionTitle.set(
        `Selected Condition (${index + 1}): ${conditionUi.conditionRowLabel(desc)}`
    );
}

function showEmptySelectedCondition(): void {
    conditionEditorVisibility.set("none");
    selectedConditionEmptyVisibility.set("visible");
    selectedConditionTitle.set("Selected Condition");
    conditionUi.hideAllConditionSections();
}

function showSelectedConditionEditor(desc: ConditionDesc): void {
    selectedConditionEmptyVisibility.set("none");
    conditionEditorVisibility.set("visible");
    updateSelectedConditionTitle(desc);
    conditionUi.loadCondition(desc);
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
        rows.push(conditionUi.conditionRowLabel(descs[i]));
    }
    conditionsListItems.set(rows);
    const selected = selectedConditionIndex.get();
    if (selected < 0 || selected >= descs.length) {
        setSelectedConditionIndex(-1);
        showEmptySelectedCondition();
        return;
    }
    conditionsSelectedCell.set({row: selected, column: 0});
    showSelectedConditionEditor(descs[selected]);
}

function addCondition(): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    const descs = trigger.getConditionDescs();
    descs.push(conditionUi.createConditionStub(addConditionIndex.get()));
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
    eventUi.saveCurrentEvent(trigger);
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
    const kind = eventUi.kindFromEditorIndex(index);
    trigger.setEvent(eventUi.createEventStub(kind));
    getConductor().triggersArray.save();
    syncEventKindUi(kind);
    refreshConditionsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

const editorWindow = window({
    title: "Edit Trigger",
    colours: WINDOW_COLOURS,
    width: {value: 720, min: 560, max: 1100},
    height: {value: 520, min: 420, max: 740},
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
                                            items: eventUi.EDITOR_EVENT_LABELS,
                                            selectedIndex: eventTypeIndex,
                                            onChange: (index) => applyEventType(index)
                                        }),
                                        ...(eventUi.widgets as Parameters<
                                            typeof groupbox
                                        >[0]["content"])
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
                                                items: conditionUi.ADD_CONDITION_LABELS,
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
                                        ...(conditionUi.widgets as Parameters<
                                            typeof groupbox
                                        >[0]["content"])
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                horizontal({
                    padding: {left: "1w"},
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
        eventUi.hideAllEventSections();
        updateConditionVariablesHint("unknown");
    }
    else {
        setUnknownEventHint("");
        eventTypeIndex.set(eventUi.editorIndexFromKind(kind));
        syncEventKindUi(kind);
    }
    refreshConditionsList();
    selectedLinkedAnimationIndex.set(-1);
    refreshLinkedAnimationsList();
    editorWindow.open();
}

bindTriggerEditorOpener(openTriggerEditor);
