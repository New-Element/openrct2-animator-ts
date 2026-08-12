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
import {StepDesc} from "../../model/animation/jsonTypes";
import createStep from "../../model/animation/step/createStep";
import {
    addLink,
    availableTriggersFor,
    linkedTriggers,
    removeLink,
    unlinkAnimationFromAllTriggers
} from "../../model/animation/triggerAnimationLinks";
import getConductor from "../../model/getConductor";
import {bindAnimationEditorOpener, goToTriggerEditor} from "../editorNavigation";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {confirmDeleteAnimation} from "./confirmDeleteAnimation";
import {createStepEditorUi} from "./steps/stepUi";

const editingAnimationId = store<string>("");
const nameText = store<string>("");

const stepsListItems = store<string[]>([]);
const selectedStepIndex = store<number>(-1);
/** Drives the listview highlight so it stays in sync when steps are reordered. */
const stepsSelectedCell = store<RowColumn | null>(null);
const addStepIndex = store<number>(0);

const linkedTriggersListItems = store<string[]>([]);
const selectedLinkedTriggerIndex = store<number>(-1);
const addTriggerDropdownItems = store<string[]>(["(No Triggers)"]);
const addTriggerSelectedIndex = store<number>(0);
/** Parallel to addTriggerDropdownItems for resolving selected trigger id. */
let addTriggerOptionIds: string[] = [];
/** Parallel to linkedTriggersListItems for resolving selected linked trigger id. */
let linkedTriggerIds: string[] = [];

/** Right-hand editor body (move/delete + section boxes); hidden in empty state. */
const stepEditorVisibility = store<"visible" | "none">("none");
const selectedStepEmptyVisibility = store<"visible" | "none">("visible");
const selectedStepTitle = store<string>("Selected Step");

let onEditorClosed: (() => void) | null = null;

function persistSelectedStepFields(): void {
    const current = selectedStepDesc();
    if (!current) {
        return;
    }
    const next = stepUi.persistStep(current);
    if (next) {
        replaceSelectedStep(next);
    }
}

const stepUi = createStepEditorUi(() => persistSelectedStepFields());

function editingAnimation() {
    return getConductor().animationsArray.findById(editingAnimationId.get());
}

function selectedStepDesc(): StepDesc | null {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return null;
    }
    const desc = animation.steps[index].getDataToPersist() as {type: string};
    return stepUi.isKnownStepDesc(desc) ? desc : null;
}

function showEmptySelectedStep(): void {
    stepEditorVisibility.set("none");
    selectedStepEmptyVisibility.set("visible");
    selectedStepTitle.set("Selected Step");
    stepUi.hideAllStepSections();
}

function showSelectedStepEditor(): void {
    selectedStepEmptyVisibility.set("none");
    stepEditorVisibility.set("visible");
}

function updateSelectedStepTitle(): void {
    const index = selectedStepIndex.get();
    if (index < 0) {
        selectedStepTitle.set("Selected Step");
        return;
    }
    const desc = selectedStepDesc();
    const name = desc ? stepUi.stepRowLabel(desc) : "Unknown";
    selectedStepTitle.set(`Selected Step (${index + 1}): ${name}`);
}

function setSelectedStepIndex(index: number): void {
    selectedStepIndex.set(index);
    if (index < 0) {
        stepsSelectedCell.set(null);
        return;
    }
    stepsSelectedCell.set({row: index, column: 0});
}

function refreshStepsList(): void {
    const animation = editingAnimation();
    if (!animation) {
        stepsListItems.set([]);
        return;
    }
    const rows: string[] = [];
    for (let i = 0; i < animation.steps.length; i++) {
        const desc = animation.steps[i].getDataToPersist() as {type: string};
        rows.push(
            stepUi.isKnownStepDesc(desc)
                ? stepUi.stepRowLabel(desc)
                : `Unknown: ${desc.type}`
        );
    }
    stepsListItems.set(rows);

    const selected = selectedStepIndex.get();
    if (selected < 0 || selected >= animation.steps.length) {
        setSelectedStepIndex(-1);
        showEmptySelectedStep();
        return;
    }
    // Keep listview highlight aligned after reorder / refresh.
    stepsSelectedCell.set({row: selected, column: 0});
    loadSelectedStepFields();
}

function loadSelectedStepFields(): void {
    const desc = selectedStepDesc();
    if (!desc) {
        showEmptySelectedStep();
        return;
    }

    showSelectedStepEditor();
    updateSelectedStepTitle();
    stepUi.loadStep(desc);
}

function replaceSelectedStep(desc: StepDesc): void {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return;
    }
    animation.steps[index] = createStep(desc);
    getConductor().animationsArray.save();
    refreshStepsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function addStep(): void {
    const animation = editingAnimation();
    if (!animation) {
        return;
    }
    animation.steps.push(createStep(stepUi.createStepStub(addStepIndex.get())));
    getConductor().animationsArray.save();
    setSelectedStepIndex(animation.steps.length - 1);
    refreshStepsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function deleteSelectedStep(): void {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return;
    }
    const next = animation.steps.slice(0, index).concat(animation.steps.slice(index + 1));
    animation.steps = next;
    setSelectedStepIndex(-1);
    getConductor().animationsArray.save();
    refreshStepsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function moveSelectedStep(delta: number): void {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0) {
        return;
    }
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= animation.steps.length) {
        return;
    }
    const steps = animation.steps;
    const moving = steps[index];
    steps[index] = steps[newIndex];
    steps[newIndex] = moving;
    setSelectedStepIndex(newIndex);
    getConductor().animationsArray.save();
    refreshStepsList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function refreshLinkedTriggersList(): void {
    const animationId = editingAnimationId.get();
    const linked = linkedTriggers(animationId);
    linkedTriggerIds = [];
    const rows: string[] = [];
    for (let i = 0; i < linked.length; i++) {
        linkedTriggerIds.push(linked[i].id);
        rows.push(linked[i].name);
    }
    linkedTriggersListItems.set(rows);

    const selected = selectedLinkedTriggerIndex.get();
    if (selected < 0 || selected >= linkedTriggerIds.length) {
        selectedLinkedTriggerIndex.set(-1);
    }

    const available = availableTriggersFor(animationId);
    addTriggerOptionIds = [];
    if (available.length === 0) {
        addTriggerDropdownItems.set(["(No Triggers)"]);
        addTriggerSelectedIndex.set(0);
        return;
    }
    const labels: string[] = [];
    for (let i = 0; i < available.length; i++) {
        addTriggerOptionIds.push(available[i].id);
        labels.push(available[i].name);
    }
    addTriggerDropdownItems.set(labels);
    if (addTriggerSelectedIndex.get() >= labels.length) {
        addTriggerSelectedIndex.set(0);
    }
}

function addLinkedTrigger(): void {
    const triggerId = addTriggerOptionIds[addTriggerSelectedIndex.get()];
    if (!triggerId) {
        return;
    }
    if (!addLink(triggerId, editingAnimationId.get())) {
        return;
    }
    selectedLinkedTriggerIndex.set(-1);
    refreshLinkedTriggersList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function editSelectedLinkedTrigger(): void {
    const index = selectedLinkedTriggerIndex.get();
    if (index < 0 || index >= linkedTriggerIds.length) {
        return;
    }
    goToTriggerEditor(linkedTriggerIds[index], () => {
        refreshLinkedTriggersList();
        if (onEditorClosed) {
            onEditorClosed();
        }
    });
}

function removeSelectedLinkedTrigger(): void {
    const index = selectedLinkedTriggerIndex.get();
    if (index < 0 || index >= linkedTriggerIds.length) {
        return;
    }
    if (!removeLink(linkedTriggerIds[index], editingAnimationId.get())) {
        return;
    }
    selectedLinkedTriggerIndex.set(-1);
    refreshLinkedTriggersList();
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function deleteEditingAnimation(): void {
    const animation = editingAnimation();
    if (!animation) {
        return;
    }
    confirmDeleteAnimation(animation.id, animation.name, () => {
        unlinkAnimationFromAllTriggers(animation.id);
        getConductor().animationsArray.removeById(animation.id);
        getConductor().animationsArray.save();
        editorWindow.close();
        if (onEditorClosed) {
            onEditorClosed();
        }
    });
}

const editorWindow = window({
    title: "Edit Animation",
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
                                                const animation = editingAnimation();
                                                if (!animation) {
                                                    return;
                                                }
                                                animation.name = text;
                                                getConductor().animationsArray.save();
                                                if (onEditorClosed) {
                                                    onEditorClosed();
                                                }
                                            }
                                        })
                                    ]
                                }),
                                groupbox({
                                    text: "Linked Triggers",
                                    content: [
                                        listview({
                                            items: linkedTriggersListItems,
                                            scrollbars: "vertical",
                                            canSelect: true,
                                            height: 70,
                                            onClick: (item) => {
                                                selectedLinkedTriggerIndex.set(item);
                                            }
                                        }),
                                        horizontal([
                                            dropdown({
                                                items: addTriggerDropdownItems,
                                                selectedIndex: twoway(addTriggerSelectedIndex),
                                                width: 140
                                            }),
                                            button({
                                                text: "Add",
                                                width: 40,
                                                height: 14,
                                                onClick: () => addLinkedTrigger()
                                            }),
                                            button({
                                                text: "Edit",
                                                width: 40,
                                                height: 14,
                                                disabled: compute(
                                                    selectedLinkedTriggerIndex,
                                                    (index) => index < 0
                                                ),
                                                onClick: () => editSelectedLinkedTrigger()
                                            }),
                                            button({
                                                text: "Delete",
                                                width: 55,
                                                height: 14,
                                                disabled: compute(
                                                    selectedLinkedTriggerIndex,
                                                    (index) => index < 0
                                                ),
                                                onClick: () => removeSelectedLinkedTrigger()
                                            })
                                        ])
                                    ]
                                }),
                                groupbox({
                                    text: "Steps",
                                    height: "1w",
                                    content: [
                                        listview({
                                            items: stepsListItems,
                                            scrollbars: "vertical",
                                            canSelect: true,
                                            selectedCell: twoway(stepsSelectedCell),
                                            height: "1w",
                                            onClick: (item) => {
                                                setSelectedStepIndex(item);
                                                refreshStepsList();
                                            }
                                        }),
                                        horizontal([
                                            dropdown({
                                                items: stepUi.ADD_STEP_LABELS,
                                                selectedIndex: twoway(addStepIndex),
                                                width: 160
                                            }),
                                            button({
                                                text: "Add",
                                                width: 40,
                                                height: 14,
                                                onClick: () => addStep()
                                            })
                                        ])
                                    ]
                                })
                            ]
                        }),
                        groupbox({
                            text: selectedStepTitle,
                            width: "1w",
                            height: "1w",
                            content: [
                                label({
                                    text: "Select A Step From The List.",
                                    visibility: selectedStepEmptyVisibility
                                }),
                                horizontal([
                                    button({
                                        text: "Move Up",
                                        width: 70,
                                        height: 14,
                                        visibility: stepEditorVisibility,
                                        onClick: () => moveSelectedStep(-1)
                                    }),
                                    button({
                                        text: "Move Down",
                                        width: 85,
                                        height: 14,
                                        visibility: stepEditorVisibility,
                                        onClick: () => moveSelectedStep(1)
                                    }),
                                    button({
                                        text: "Delete",
                                        width: 55,
                                        height: 14,
                                        visibility: stepEditorVisibility,
                                        onClick: () => deleteSelectedStep()
                                    })
                                ]),
                                ...(stepUi.widgets as Parameters<typeof groupbox>[0]["content"])
                            ]
                        })
                    ]
                }),
                button({
                    text: "Delete Animation",
                    width: 120,
                    height: 14,
                    padding: {left: "1w"},
                    onClick: () => deleteEditingAnimation()
                })
            ]
        })
    ],
    onClose: () => {
        getConductor().animationsArray.save();
        if (onEditorClosed) {
            onEditorClosed();
        }
    }
});

export function openAnimationEditor(animationId: string, onClosed?: () => void): void {
    const animation = getConductor().animationsArray.findById(animationId);
    if (!animation) {
        console.log(`[AnimationEditor] Animation "${animationId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingAnimationId.set(animation.id);
    nameText.set(animation.name);
    setSelectedStepIndex(-1);
    showEmptySelectedStep();
    selectedLinkedTriggerIndex.set(-1);
    stepUi.refreshVariableOptions();
    stepUi.refreshRideOptions();
    refreshStepsList();
    refreshLinkedTriggersList();
    editorWindow.open();
}

bindAnimationEditorOpener(openAnimationEditor);
