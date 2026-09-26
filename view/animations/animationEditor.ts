/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    listview,
    spinner,
    store,
    twoway,
    vertical,
    window
} from "openrct2-flexui";
import {spinnerStep, spinnerStepSelector} from "../ui/spinnerStep";
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
import {error} from "../../model/logger";
import {bindAnimationEditorOpener, goToTriggerEditor} from "../editorNavigation";
import {nameTextField} from "../ui/nameTextField";
import {WINDOW_COLOURS} from "../ui/windowColours";
import {confirmDeleteAnimation} from "./confirmDeleteAnimation";
import {openStepHelp} from "./steps/stepHelp";
import {createStepEditorUi} from "./steps/stepUi";

const editingAnimationId = store<string>("");
const nameText = store<string>("");
const ticksBetweenSteps = store<number>(0);

const stepsListItems = store<string[]>([]);
const selectedStepIndex = store<number>(-1);
/** Drives the listview highlight so it stays in sync when steps are reordered. */
const stepsSelectedCell = store<RowColumn | null>(null);
const addStepCategoryIndex = store<number>(0);
const addStepIndex = store<number>(0);
const addStepLabels = store<string[]>([]);

const linkedTriggersListItems = store<string[]>([]);
const selectedLinkedTriggerIndex = store<number>(-1);
const addTriggerDropdownItems = store<string[]>(["(No Triggers)"]);
const addTriggerSelectedIndex = store<number>(0);
/** Parallel to addTriggerDropdownItems for resolving selected trigger id. */
let addTriggerOptionIds: string[] = [];
/** Parallel to linkedTriggersListItems for resolving selected linked trigger id. */
let linkedTriggerIds: string[] = [];

/** Right-hand editor body (move/clone/delete + section boxes); hidden in empty state. */
const stepEditorVisibility = store<"visible" | "none">("none");
const selectedStepEmptyVisibility = store<"visible" | "none">("visible");
const selectedStepTitle = store<string>("Selected Step");
const stepNameText = store<string>("");

let onEditorClosed: (() => void) | null = null;

function persistSelectedStepFields(): void {
    const current = selectedStepDesc();
    if (!current) {
        return;
    }
    const next = stepUi.persistStep(current);
    if (next) {
        // Reloading the step editor would close the branch condition window.
        replaceSelectedStep(next, false);
    }
}

const stepUi = createStepEditorUi(
    () => persistSelectedStepFields(),
    () => {
        const animation = editingAnimation();
        return animation ? animation.steps.length : 0;
    }
);
addStepLabels.set(stepUi.stepLabelsForCategory(0));

function selectAddStepCategory(index: number): void {
    addStepCategoryIndex.set(index);
    addStepIndex.set(0);
    addStepLabels.set(stepUi.stepLabelsForCategory(index));
}

function editingAnimation() {
    return getConductor().animationsArray.findById(editingAnimationId.get());
}

function selectedStepDesc(): StepDesc | null {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return null;
    }
    const desc = animation.steps[index].persistData() as {type: string};
    return stepUi.isKnownStepDesc(desc) ? desc : null;
}

function showEmptySelectedStep(): void {
    stepEditorVisibility.set("none");
    selectedStepEmptyVisibility.set("visible");
    selectedStepTitle.set("Selected Step");
    stepNameText.set("");
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

function refreshStepsList(reloadEditor = true): void {
    const animation = editingAnimation();
    if (!animation) {
        stepsListItems.set([]);
        return;
    }
    const rows: string[] = [];
    for (let i = 0; i < animation.steps.length; i++) {
        const desc = animation.steps[i].persistData() as {type: string};
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
    if (reloadEditor) {
        loadSelectedStepFields();
    }
    else {
        updateSelectedStepTitle();
    }
}

function loadSelectedStepFields(): void {
    const desc = selectedStepDesc();
    if (!desc) {
        showEmptySelectedStep();
        return;
    }

    showSelectedStepEditor();
    updateSelectedStepTitle();
    stepNameText.set(desc.name ?? "");
    stepUi.loadStep(desc);
}

function persistSelectedStepName(text: string): void {
    stepNameText.set(text);
    const current = selectedStepDesc();
    if (!current) {
        return;
    }
    const trimmed = text.trim();
    const next = {...current};
    if (trimmed) {
        next.name = trimmed;
    } else {
        delete next.name;
    }
    replaceSelectedStep(next);
}

function replaceSelectedStep(desc: StepDesc, reloadEditor = true): void {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return;
    }
    animation.steps[index] = createStep(desc);
    getConductor().animationsArray.save();
    refreshStepsList(reloadEditor);
    if (onEditorClosed) {
        onEditorClosed();
    }
}

function addStep(): void {
    const animation = editingAnimation();
    if (!animation) {
        return;
    }
    const newStep = createStep(stepUi.createStepStub(addStepCategoryIndex.get(), addStepIndex.get()));
    const selected = selectedStepIndex.get();
    const insertAt =
        selected >= 0 && selected < animation.steps.length
            ? selected + 1
            : animation.steps.length;
    animation.steps.splice(insertAt, 0, newStep);
    getConductor().animationsArray.save();
    setSelectedStepIndex(insertAt);
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

function cloneSelectedStep(): void {
    persistSelectedStepFields();
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return;
    }
    const desc = JSON.parse(
        JSON.stringify(animation.steps[index].persistData())
    ) as StepDesc;
    const insertAt = index + 1;
    animation.steps.splice(insertAt, 0, createStep(desc));
    getConductor().animationsArray.save();
    setSelectedStepIndex(insertAt);
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
                                        nameTextField({
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
                                            label({
                                                text: "Ticks Between Steps",
                                                width: 130
                                            }),
                                            spinner({
                                                step: spinnerStep,
                                                value: twoway(ticksBetweenSteps),
                                                minimum: 0,
                                                maximum: 100000,
                                                onChange: (value) => {
                                                    ticksBetweenSteps.set(value);
                                                    const animation = editingAnimation();
                                                    if (!animation) {
                                                        return;
                                                    }
                                                    animation.ticksBetweenSteps = Math.max(0, value | 0);
                                                    getConductor().animationsArray.save();
                                                    if (onEditorClosed) {
                                                        onEditorClosed();
                                                    }
                                                }
                                            })
                                        ]),
                                        horizontal([
                                            dropdown({
                                                items: stepUi.ADD_STEP_CATEGORY_LABELS,
                                                selectedIndex: twoway(addStepCategoryIndex),
                                                width: 130,
                                                onChange: (index) => selectAddStepCategory(index)
                                            }),
                                            dropdown({
                                                items: addStepLabels,
                                                selectedIndex: twoway(addStepIndex),
                                                width: "1w"
                                            }),
                                            button({
                                                text: "Add Step",
                                                width: 72,
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
                                    label({
                                        text: "",
                                        width: "1w",
                                        height: 14,
                                        visibility: stepEditorVisibility
                                    }),
                                    button({
                                        text: "Help",
                                        width: 46,
                                        height: 14,
                                        tooltip: "Step Help",
                                        visibility: stepEditorVisibility,
                                        onClick: () => {
                                            const desc = selectedStepDesc();
                                            if (!desc) {
                                                return;
                                            }
                                            openStepHelp(desc);
                                        }
                                    })
                                ]),
                                groupbox({
                                    text: "Name",
                                    visibility: stepEditorVisibility,
                                    content: [
                                        nameTextField({
                                            text: stepNameText,
                                            onChange: (text) => persistSelectedStepName(text)
                                        })
                                    ]
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
                                    }),
                                    button({
                                        text: "Clone",
                                        width: 50,
                                        height: 14,
                                        visibility: stepEditorVisibility,
                                        onClick: () => cloneSelectedStep()
                                    })
                                ]),
                                ...(stepUi.widgets as Parameters<typeof groupbox>[0]["content"])
                            ]
                        })
                    ]
                }),
                horizontal({
                    padding: {left: "1w"},
                    spacing: 6,
                    content: [
                        spinnerStepSelector(),
                        button({
                            text: "Delete Animation",
                            width: 120,
                            height: 14,
                            onClick: () => deleteEditingAnimation()
                        })
                    ]
                })
            ]
        })
    ],
    onClose: () => {
        getConductor().animationsArray.save();
        stepUi.hideAllStepSections();
        if (onEditorClosed) {
            onEditorClosed();
        }
    }
});

export function openAnimationEditor(animationId: string, onClosed?: () => void): void {
    const animation = getConductor().animationsArray.findById(animationId);
    if (!animation) {
        error("animationEditor", `Animation "${animationId}" not found`);
        return;
    }
    onEditorClosed = onClosed || null;
    editingAnimationId.set(animation.id);
    nameText.set(animation.name);
    ticksBetweenSteps.set(animation.ticksBetweenSteps);
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
