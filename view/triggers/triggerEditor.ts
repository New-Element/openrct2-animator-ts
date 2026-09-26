/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    checkbox,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    listview,
    store,
    twoway,
    vertical,
    window
} from "openrct2-flexui";
import {
    addLink,
    availableAnimationsFor,
    linkedAnimations,
    removeLink
} from "../../model/animation/triggerAnimationLinks";
import getConductor from "../../model/getConductor";
import {error} from "../../model/logger";
import {bindTriggerEditorOpener, goToAnimationEditor} from "../editorNavigation";
import {formatErrorText} from "../ui/errorText";
import {nameTextField} from "../ui/nameTextField";
import {spinnerStepSelector} from "../ui/spinnerStep";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {createConditionListEditor} from "./conditions/conditionListEditor";
import {confirmDeleteTrigger} from "./confirmDeleteTrigger";
import {createEventEditorUi} from "./events/eventUi";
import {TriggerEventKind} from "./events/eventUiTypes";
import {eventKindFromTrigger, UNKNOWN_EVENT_LABEL} from "./eventType";
const editingTriggerId = store<string>("");
const nameText = store<string>("");
const enabledChecked = store<boolean>(true);
const eventTypeIndex = store<number>(0);
const unknownEventHint = store<string>("");
const unknownEventHintVisibility = store<"visible" | "none">("none");

const conditionsVariablesText = store<string>("No Condition Variables");

const linkedAnimationsListItems = store<string[]>([]);
const selectedLinkedAnimationIndex = store<number>(-1);
const addAnimationDropdownItems = store<string[]>(["(No Animations)"]);
const addAnimationSelectedIndex = store<number>(0);
/** Parallel to addAnimationDropdownItems for resolving selected animation id. */
let addAnimationOptionIds: string[] = [];
/** Parallel to linkedAnimationsListItems for resolving selected linked animation id. */
let linkedAnimationIds: string[] = [];

let onEditorClosed: (() => void) | null = null;
/** True while the open editor is being pointed at a trigger. Widget updates must not save. */
let suppressPersist = false;
let suppressGeneration = 0;

function setUnknownEventHint(text: string): void {
    unknownEventHint.set(text);
    unknownEventHintVisibility.set(text ? "visible" : "none");
}

function editingTrigger() {
    return getConductor().triggersArray.findById(editingTriggerId.get());
}

function updateConditionVariablesHint(kind: TriggerEventKind): void {
    const variableName =
        kind === "variableChange" || kind === "variableThreshold"
            ? eventUi.selectedVariableName(kind)
            : undefined;
    conditionsVariablesText.set(eventUi.conditionVariablesLabel(kind, variableName));
}

function persistConditionsFromList(): void {
    if (suppressPersist) {
        return;
    }
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    trigger.setConditions(conditionList.read());
    getConductor().triggersArray.save();
}

const eventUi = createEventEditorUi(
    () => editingTrigger() || null,
    () => {
        const trigger = editingTrigger();
        updateConditionVariablesHint(trigger ? eventKindFromTrigger(trigger) : "manual");
    },
    () => !suppressPersist
);

const conditionList = createConditionListEditor(() => persistConditionsFromList(), {
    listHeader: [
        label({
            text: conditionsVariablesText
        })
    ]
});

function syncEventKindUi(kind: TriggerEventKind): void {
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    eventUi.syncEventKind(kind, trigger);
    updateConditionVariablesHint(kind);
}

function persistEditingTrigger(): void {
    if (suppressPersist) {
        return;
    }
    const trigger = editingTrigger();
    if (!trigger) {
        return;
    }
    trigger.setName(nameText.get());
    trigger.setEnabled(enabledChecked.get());
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
    if (suppressPersist) {
        return;
    }
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
    conditionList.load(trigger.getConditionDescs());
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
                                        nameTextField({
                                            text: nameText,
                                            onChange: (text) => {
                                                if (suppressPersist) {
                                                    return;
                                                }
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
                                        }),
                                        checkbox({
                                            text: "Enabled",
                                            isChecked: enabledChecked,
                                            onChange: (checked) => {
                                                if (suppressPersist) {
                                                    return;
                                                }
                                                enabledChecked.set(checked);
                                                const trigger = editingTrigger();
                                                if (!trigger) {
                                                    return;
                                                }
                                                trigger.setEnabled(checked);
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
                            content: conditionList.widgets as Parameters<typeof vertical>[0]["content"]
                        })
                    ]
                }),
                horizontal({
                    padding: {left: "1w"},
                    spacing: 6,
                    content: [
                        spinnerStepSelector(),
                        button({
                            text: "Delete Trigger",
                            width: 100,
                            height: 14,
                            onClick: () => deleteEditingTrigger()
                        })
                    ]
                })
            ]
        })
    ],
    onClose: () => {
        persistEditingTrigger();
        eventUi.hideAllEventSections();
        conditionList.close();
        if (onEditorClosed) {
            onEditorClosed();
        }
    }
});

export function openTriggerEditor(triggerId: string, onClosed?: () => void): void {
    const trigger = getConductor().triggersArray.findById(triggerId);
    if (!trigger) {
        error("triggerEditor", `Trigger "${triggerId}" not found`);
        return;
    }
    suppressGeneration += 1;
    const generation = suppressGeneration;
    suppressPersist = true;
    try {
        onEditorClosed = onClosed || null;
        editingTriggerId.set(trigger.id);
        nameText.set(trigger.name);
        enabledChecked.set(trigger.enabled);
        conditionList.clearSelection();

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
        conditionList.load(trigger.getConditionDescs());
        selectedLinkedAnimationIndex.set(-1);
        refreshLinkedAnimationsList();
        editorWindow.open();
    }
    finally {
        context.setTimeout(() => {
            if (generation === suppressGeneration) {
                suppressPersist = false;
            }
        }, 1);
    }
}

bindTriggerEditorOpener(openTriggerEditor);
