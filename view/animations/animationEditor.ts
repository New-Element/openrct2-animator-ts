/// <reference path="./../../openrct2.d.ts" />

import {
    button,
    checkbox,
    Colour,
    colourPicker,
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
import {StepDesc} from "../../model/animation/jsonTypes";
import createStep from "../../model/animation/step/createStep";
import {UNSELECTED_COLOUR} from "../../model/animation/step/car/vehicleColour";
import {
    addLink,
    availableTriggersFor,
    linkedTriggers,
    removeLink,
    unlinkAnimationFromAllTriggers
} from "../../model/animation/triggerAnimationLinks";
import {walkRide} from "../../model/animation/trigger/rideCarSnapshot";
import getConductor from "../../model/getConductor";
import {indexOfRideId, listParkRides, RideOption} from "../triggers/rideOptions";
import {pickRide} from "../ui/pickRide";
import {pickTile} from "../ui/pickTile";
import {bindAnimationEditorOpener, goToTriggerEditor} from "../editorNavigation";
import {confirmDeleteAnimation} from "./confirmDeleteAnimation";
import {ADD_STEP_LABELS, createStepStub, stepRowLabel} from "./stepLabels";

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
const waitVisibility = store<"visible" | "none">("none");
const colourVisibility = store<"visible" | "none">("none");
const vehicleTargetVisibility = store<"visible" | "none">("none");
const vehicleCarVisibility = store<"visible" | "none">("none");
const variableVisibility = store<"visible" | "none">("none");
const variableAmountVisibility = store<"visible" | "none">("none");
const variableValueVisibility = store<"visible" | "none">("none");
const trackVisibility = store<"visible" | "none">("none");
const coordsVisibility = store<"visible" | "none">("none");

const waitTicks = store<number>(40);
const colourBody = store<number>(UNSELECTED_COLOUR);
const colourTrim = store<number>(UNSELECTED_COLOUR);
const colourTertiary = store<number>(UNSELECTED_COLOUR);
const useTriggerTargetChecked = store<boolean>(true);
const applyToTriggerLabel = store<string>("Apply To Trigger Car");
const vehicleSelectTitle = store<string>("Select Car");
const trainDropdownItems = store<string[]>(["(No Trains)"]);
const trainSelectedIndex = store<number>(0);
const carDropdownItems = store<string[]>(["(No Cars)"]);
const carSelectedIndex = store<number>(0);

const variableDropdownItems = store<string[]>(["(No Variables)"]);
const variableSelectedIndex = store<number>(0);
const variableAmount = store<number>(1);
const variableValueText = store<string>("0");
let variableOptionIds: string[] = [];

const rideDropdownItems = store<string[]>(["(No Rides)"]);
const rideSelectedIndex = store<number>(0);
const tileX = store<number>(0);
const tileY = store<number>(0);
const trackType = store<number>(0);
const trackBaseHeight = store<number>(0);
let rideOptions: RideOption[] = [];

const deltaX = store<number>(0);
const deltaY = store<number>(0);
const deltaZ = store<number>(0);
const durationTicks = store<number>(40);

let onEditorClosed: (() => void) | null = null;

function editingAnimation() {
    return getConductor().animationsArray.findById(editingAnimationId.get());
}

function isKnownStepDesc(desc: { type: string }): desc is StepDesc {
    switch (desc.type) {
        case "wait":
        case "carEditColour":
        case "trainEditColour":
        case "variableSet":
        case "variableIncrement":
        case "variableDecrement":
        case "trackSetHeight":
        case "carCoordsOverTime":
        case "trainCoordsOverTime":
            return true;
        default:
            return false;
    }
}

function selectedStepDesc(): StepDesc | null {
    const animation = editingAnimation();
    const index = selectedStepIndex.get();
    if (!animation || index < 0 || index >= animation.steps.length) {
        return null;
    }
    const desc = animation.steps[index].getDataToPersist() as { type: string };
    return isKnownStepDesc(desc) ? desc : null;
}

function hideAllStepSections(): void {
    waitVisibility.set("none");
    colourVisibility.set("none");
    vehicleTargetVisibility.set("none");
    vehicleCarVisibility.set("none");
    variableVisibility.set("none");
    variableAmountVisibility.set("none");
    variableValueVisibility.set("none");
    trackVisibility.set("none");
    coordsVisibility.set("none");
}

function showEmptySelectedStep(): void {
    stepEditorVisibility.set("none");
    selectedStepEmptyVisibility.set("visible");
    selectedStepTitle.set("Selected Step");
    hideAllStepSections();
}

function showSelectedStepEditor(): void {
    selectedStepEmptyVisibility.set("none");
    stepEditorVisibility.set("visible");
}

function selectedRideId(): number {
    const ride = rideOptions[rideSelectedIndex.get()];
    return ride ? ride.id : 0;
}

function refreshTrainOptions(rideId: number, preferredIndex?: number): void {
    const ride = map.getRide(rideId);
    const count = ride ? ride.vehicles.length : 0;
    if (count === 0) {
        trainDropdownItems.set(["(No Trains)"]);
        trainSelectedIndex.set(0);
        return;
    }
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
        labels.push(`Train ${i + 1}`);
    }
    trainDropdownItems.set(labels);
    let index = typeof preferredIndex === "number" ? preferredIndex : trainSelectedIndex.get();
    if (index < 0 || index >= count) {
        index = 0;
    }
    trainSelectedIndex.set(index);
}

function refreshCarOptions(rideId: number, trainIndex: number, preferredIndex?: number): void {
    const cars = walkRide(rideId);
    let count = 0;
    for (let i = 0; i < cars.length; i++) {
        if (cars[i].trainIndex === trainIndex) {
            count += 1;
        }
    }
    if (count === 0) {
        carDropdownItems.set(["(No Cars)"]);
        carSelectedIndex.set(0);
        return;
    }
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
        labels.push(`Car ${i + 1}`);
    }
    carDropdownItems.set(labels);
    let index = typeof preferredIndex === "number" ? preferredIndex : carSelectedIndex.get();
    if (index < 0 || index >= count) {
        index = 0;
    }
    carSelectedIndex.set(index);
}

function syncVehicleTargetVisibility(isCarStep: boolean): void {
    const useTrigger = useTriggerTargetChecked.get();
    vehicleTargetVisibility.set(useTrigger ? "none" : "visible");
    vehicleCarVisibility.set(!useTrigger && isCarStep ? "visible" : "none");
}

function loadVehicleTargetFields(
    desc: {
        useTriggerTarget?: boolean;
        rideId?: number;
        trainIndex?: number;
        carIndex?: number;
    },
    isCarStep: boolean
): void {
    applyToTriggerLabel.set(isCarStep ? "Apply To Trigger Car" : "Apply To Trigger Train");
    vehicleSelectTitle.set(isCarStep ? "Select Car" : "Select Train");
    useTriggerTargetChecked.set(desc.useTriggerTarget !== false);
    syncVehicleTargetVisibility(isCarStep);
    refreshRideOptions();
    const rideId = typeof desc.rideId === "number" ? desc.rideId : selectedRideId();
    rideSelectedIndex.set(Math.max(0, indexOfRideId(rideOptions, rideId)));
    const resolvedRideId = selectedRideId();
    refreshTrainOptions(
        resolvedRideId,
        typeof desc.trainIndex === "number" ? desc.trainIndex : 0
    );
    if (isCarStep) {
        refreshCarOptions(
            resolvedRideId,
            trainSelectedIndex.get(),
            typeof desc.carIndex === "number" ? desc.carIndex : 0
        );
    }
}

function updateSelectedStepTitle(): void {
    const index = selectedStepIndex.get();
    if (index < 0) {
        selectedStepTitle.set("Selected Step");
        return;
    }
    const desc = selectedStepDesc();
    const name = desc ? stepRowLabel(desc) : "Unknown";
    selectedStepTitle.set(`Selected Step (${index + 1}): ${name}`);
}

function setSelectedStepIndex(index: number): void {
    selectedStepIndex.set(index);
    if (index < 0) {
        stepsSelectedCell.set(null);
        return;
    }
    stepsSelectedCell.set({ row: index, column: 0 });
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
        const name = variables[i].name.trim() ? variables[i].name : "(Unnamed)";
        labels.push(name);
        variableOptionIds.push(variables[i].id);
    }
    variableDropdownItems.set(labels);
}

function refreshRideOptions(): void {
    rideOptions = listParkRides();
    if (rideOptions.length === 0) {
        rideDropdownItems.set(["(No Rides)"]);
        rideSelectedIndex.set(0);
        return;
    }
    const names: string[] = [];
    for (let i = 0; i < rideOptions.length; i++) {
        names.push(rideOptions[i].name);
    }
    rideDropdownItems.set(names);
}

function refreshStepsList(): void {
    const animation = editingAnimation();
    if (!animation) {
        stepsListItems.set([]);
        return;
    }
    const rows: string[] = [];
    for (let i = 0; i < animation.steps.length; i++) {
        const desc = animation.steps[i].getDataToPersist() as { type: string };
        rows.push(isKnownStepDesc(desc) ? stepRowLabel(desc) : `Unknown: ${desc.type}`);
    }
    stepsListItems.set(rows);

    const selected = selectedStepIndex.get();
    if (selected < 0 || selected >= animation.steps.length) {
        setSelectedStepIndex(-1);
        showEmptySelectedStep();
        return;
    }
    // Keep listview highlight aligned after reorder / refresh.
    stepsSelectedCell.set({ row: selected, column: 0 });
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
    hideAllStepSections();

    switch (desc.type) {
        case "wait":
            waitVisibility.set("visible");
            waitTicks.set(desc.ticks);
            break;
        case "carEditColour":
            colourVisibility.set("visible");
            colourBody.set(desc.value.body);
            colourTrim.set(desc.value.trim);
            colourTertiary.set(desc.value.tertiary);
            loadVehicleTargetFields(desc, true);
            break;
        case "trainEditColour":
            colourVisibility.set("visible");
            colourBody.set(desc.value.body);
            colourTrim.set(desc.value.trim);
            colourTertiary.set(desc.value.tertiary);
            loadVehicleTargetFields(desc, false);
            break;
        case "variableSet":
            variableVisibility.set("visible");
            variableValueVisibility.set("visible");
            refreshVariableOptions();
            variableSelectedIndex.set(Math.max(0, variableOptionIds.indexOf(desc.variableId)));
            variableValueText.set(String(desc.value));
            break;
        case "variableIncrement":
        case "variableDecrement":
            variableVisibility.set("visible");
            variableAmountVisibility.set("visible");
            refreshVariableOptions();
            variableSelectedIndex.set(Math.max(0, variableOptionIds.indexOf(desc.variableId)));
            variableAmount.set(desc.amount);
            break;
        case "trackSetHeight":
            trackVisibility.set("visible");
            refreshRideOptions();
            tileX.set(desc.tile.x);
            tileY.set(desc.tile.y);
            trackType.set(desc.trackType);
            trackBaseHeight.set(desc.baseHeight);
            rideSelectedIndex.set(Math.max(0, indexOfRideId(rideOptions, desc.rideId)));
            break;
        case "carCoordsOverTime":
        case "trainCoordsOverTime":
            coordsVisibility.set("visible");
            deltaX.set(desc.deltaX || 0);
            deltaY.set(desc.deltaY || 0);
            deltaZ.set(desc.deltaZ || 0);
            durationTicks.set(desc.durationTicks);
            break;
        default:
            showEmptySelectedStep();
            break;
    }
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

function persistSelectedStepFields(): void {
    const current = selectedStepDesc();
    if (!current) {
        return;
    }

    switch (current.type) {
        case "wait":
            replaceSelectedStep({ type: "wait", ticks: waitTicks.get() });
            break;
        case "carEditColour": {
            const useTrigger = useTriggerTargetChecked.get();
            replaceSelectedStep({
                type: "carEditColour",
                value: {
                    body: colourBody.get(),
                    trim: colourTrim.get(),
                    tertiary: colourTertiary.get()
                },
                useTriggerTarget: useTrigger,
                rideId: useTrigger ? undefined : selectedRideId(),
                trainIndex: useTrigger ? undefined : trainSelectedIndex.get(),
                carIndex: useTrigger ? undefined : carSelectedIndex.get()
            });
            break;
        }
        case "trainEditColour": {
            const useTrigger = useTriggerTargetChecked.get();
            replaceSelectedStep({
                type: "trainEditColour",
                value: {
                    body: colourBody.get(),
                    trim: colourTrim.get(),
                    tertiary: colourTertiary.get()
                },
                useTriggerTarget: useTrigger,
                rideId: useTrigger ? undefined : selectedRideId(),
                trainIndex: useTrigger ? undefined : trainSelectedIndex.get()
            });
            break;
        }
        case "variableSet": {
            const variableId = variableOptionIds[variableSelectedIndex.get()] || "";
            const raw = variableValueText.get();
            const asNumber = Number(raw);
            const value = raw !== "" && !isNaN(asNumber) ? asNumber : raw;
            replaceSelectedStep({ type: "variableSet", variableId, value });
            break;
        }
        case "variableIncrement":
            replaceSelectedStep({
                type: "variableIncrement",
                variableId: variableOptionIds[variableSelectedIndex.get()] || "",
                amount: variableAmount.get()
            });
            break;
        case "variableDecrement":
            replaceSelectedStep({
                type: "variableDecrement",
                variableId: variableOptionIds[variableSelectedIndex.get()] || "",
                amount: variableAmount.get()
            });
            break;
        case "trackSetHeight": {
            const ride = rideOptions[rideSelectedIndex.get()];
            replaceSelectedStep({
                type: "trackSetHeight",
                tile: { x: tileX.get(), y: tileY.get() },
                rideId: ride ? ride.id : 0,
                trackType: trackType.get(),
                baseHeight: trackBaseHeight.get()
            });
            break;
        }
        case "carCoordsOverTime":
            replaceSelectedStep({
                type: "carCoordsOverTime",
                deltaX: deltaX.get(),
                deltaY: deltaY.get(),
                deltaZ: deltaZ.get(),
                durationTicks: durationTicks.get()
            });
            break;
        case "trainCoordsOverTime":
            replaceSelectedStep({
                type: "trainCoordsOverTime",
                deltaX: deltaX.get(),
                deltaY: deltaY.get(),
                deltaZ: deltaZ.get(),
                durationTicks: durationTicks.get()
            });
            break;
    }
}

function addStep(): void {
    const animation = editingAnimation();
    if (!animation) {
        return;
    }
    animation.steps.push(createStep(createStepStub(addStepIndex.get())));
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
                                                items: ADD_STEP_LABELS,
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
                        groupbox({
                            text: "Wait",
                            visibility: waitVisibility,
                            content: [
                                horizontal([
                                    label({
                                        text: "Ticks",
                                        width: 40,
                                        visibility: waitVisibility
                                    }),
                                    spinner({
                                        value: twoway(waitTicks),
                                        minimum: 0,
                                        maximum: 100000,
                                        visibility: waitVisibility,
                                        onChange: (value) => {
                                            waitTicks.set(value);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ])
                            ]
                        }),
                        groupbox({
                            text: "Colours",
                            visibility: colourVisibility,
                            content: [
                                horizontal([
                                    label({
                                        text: "Body:",
                                        width: 55,
                                        visibility: colourVisibility
                                    }),
                                    colourPicker({
                                        colour: twoway(colourBody),
                                        visibility: colourVisibility,
                                        onChange: (colour) => {
                                            colourBody.set(colour);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ]),
                                horizontal([
                                    label({
                                        text: "Trim:",
                                        width: 55,
                                        visibility: colourVisibility
                                    }),
                                    colourPicker({
                                        colour: twoway(colourTrim),
                                        visibility: colourVisibility,
                                        onChange: (colour) => {
                                            colourTrim.set(colour);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ]),
                                horizontal([
                                    label({
                                        text: "Tertiary:",
                                        width: 55,
                                        visibility: colourVisibility
                                    }),
                                    colourPicker({
                                        colour: twoway(colourTertiary),
                                        visibility: colourVisibility,
                                        onChange: (colour) => {
                                            colourTertiary.set(colour);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ])
                            ]
                        }),
                        groupbox({
                            text: vehicleSelectTitle,
                            visibility: colourVisibility,
                            content: [
                                checkbox({
                                    text: applyToTriggerLabel,
                                    isChecked: twoway(useTriggerTargetChecked),
                                    visibility: colourVisibility,
                                    onChange: (checked) => {
                                        useTriggerTargetChecked.set(checked);
                                        const desc = selectedStepDesc();
                                        syncVehicleTargetVisibility(
                                            desc !== null && desc.type === "carEditColour"
                                        );
                                        if (!checked) {
                                            refreshRideOptions();
                                            refreshTrainOptions(
                                                selectedRideId(),
                                                trainSelectedIndex.get()
                                            );
                                            if (desc && desc.type === "carEditColour") {
                                                refreshCarOptions(
                                                    selectedRideId(),
                                                    trainSelectedIndex.get(),
                                                    carSelectedIndex.get()
                                                );
                                            }
                                        }
                                        persistSelectedStepFields();
                                    }
                                }),
                                label({
                                    text: "Ride",
                                    visibility: vehicleTargetVisibility
                                }),
                                horizontal([
                                    dropdown({
                                        items: rideDropdownItems,
                                        selectedIndex: twoway(rideSelectedIndex),
                                        visibility: vehicleTargetVisibility,
                                        onChange: (index) => {
                                            rideSelectedIndex.set(index);
                                            refreshTrainOptions(selectedRideId(), 0);
                                            const desc = selectedStepDesc();
                                            if (desc && desc.type === "carEditColour") {
                                                refreshCarOptions(
                                                    selectedRideId(),
                                                    trainSelectedIndex.get(),
                                                    0
                                                );
                                            }
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    button({
                                        text: "Pick Ride",
                                        width: 70,
                                        height: 14,
                                        visibility: vehicleTargetVisibility,
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
                                                refreshTrainOptions(selectedRideId(), 0);
                                                const desc = selectedStepDesc();
                                                if (desc && desc.type === "carEditColour") {
                                                    refreshCarOptions(
                                                        selectedRideId(),
                                                        trainSelectedIndex.get(),
                                                        0
                                                    );
                                                }
                                                persistSelectedStepFields();
                                            });
                                        }
                                    })
                                ]),
                                label({
                                    text: "Train",
                                    visibility: vehicleTargetVisibility
                                }),
                                dropdown({
                                    items: trainDropdownItems,
                                    selectedIndex: twoway(trainSelectedIndex),
                                    visibility: vehicleTargetVisibility,
                                    onChange: (index) => {
                                        trainSelectedIndex.set(index);
                                        const desc = selectedStepDesc();
                                        if (desc && desc.type === "carEditColour") {
                                            refreshCarOptions(
                                                selectedRideId(),
                                                trainSelectedIndex.get(),
                                                0
                                            );
                                        }
                                        persistSelectedStepFields();
                                    }
                                }),
                                label({
                                    text: "Car",
                                    visibility: vehicleCarVisibility
                                }),
                                dropdown({
                                    items: carDropdownItems,
                                    selectedIndex: twoway(carSelectedIndex),
                                    visibility: vehicleCarVisibility,
                                    onChange: (index) => {
                                        carSelectedIndex.set(index);
                                        persistSelectedStepFields();
                                    }
                                })
                            ]
                        }),
                        groupbox({
                            text: "Variable",
                            visibility: variableVisibility,
                            content: [
                                dropdown({
                                    items: variableDropdownItems,
                                    selectedIndex: twoway(variableSelectedIndex),
                                    visibility: variableVisibility,
                                    onChange: (index) => {
                                        variableSelectedIndex.set(index);
                                        persistSelectedStepFields();
                                    }
                                }),
                                horizontal([
                                    label({
                                        text: "Amount",
                                        width: 50,
                                        visibility: variableAmountVisibility
                                    }),
                                    spinner({
                                        value: twoway(variableAmount),
                                        minimum: -100000,
                                        maximum: 100000,
                                        visibility: variableAmountVisibility,
                                        onChange: (value) => {
                                            variableAmount.set(value);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ]),
                                horizontal([
                                    label({
                                        text: "Value",
                                        width: 40,
                                        visibility: variableValueVisibility
                                    }),
                                    textbox({
                                        text: variableValueText,
                                        visibility: variableValueVisibility,
                                        onChange: (text) => {
                                            variableValueText.set(text);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ])
                            ]
                        }),
                        groupbox({
                            text: "Track",
                            visibility: trackVisibility,
                            content: [
                                label({
                                    text: "Ride",
                                    visibility: trackVisibility
                                }),
                                horizontal([
                                    dropdown({
                                        items: rideDropdownItems,
                                        selectedIndex: twoway(rideSelectedIndex),
                                        visibility: trackVisibility,
                                        onChange: (index) => {
                                            rideSelectedIndex.set(index);
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    button({
                                        text: "Pick Ride",
                                        width: 70,
                                        height: 14,
                                        visibility: trackVisibility,
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
                                                persistSelectedStepFields();
                                            });
                                        }
                                    })
                                ]),
                                label({
                                    text: "Tile",
                                    visibility: trackVisibility
                                }),
                                horizontal([
                                    label({
                                        text: "X",
                                        width: 12,
                                        visibility: trackVisibility
                                    }),
                                    spinner({
                                        value: twoway(tileX),
                                        minimum: 0,
                                        maximum: 10000,
                                        visibility: trackVisibility,
                                        onChange: (value) => {
                                            tileX.set(value);
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    label({
                                        text: "Y",
                                        width: 12,
                                        visibility: trackVisibility
                                    }),
                                    spinner({
                                        value: twoway(tileY),
                                        minimum: 0,
                                        maximum: 10000,
                                        visibility: trackVisibility,
                                        onChange: (value) => {
                                            tileY.set(value);
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    button({
                                        text: "Pick Tile",
                                        width: 70,
                                        height: 14,
                                        visibility: trackVisibility,
                                        onClick: () => {
                                            pickTile((tile) => {
                                                tileX.set(tile.x);
                                                tileY.set(tile.y);
                                                persistSelectedStepFields();
                                            });
                                        }
                                    })
                                ]),
                                horizontal([
                                    label({
                                        text: "Track Type",
                                        width: 70,
                                        visibility: trackVisibility
                                    }),
                                    spinner({
                                        value: twoway(trackType),
                                        minimum: 0,
                                        maximum: 10000,
                                        visibility: trackVisibility,
                                        onChange: (value) => {
                                            trackType.set(value);
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    label({
                                        text: "Height",
                                        width: 45,
                                        visibility: trackVisibility
                                    }),
                                    spinner({
                                        value: twoway(trackBaseHeight),
                                        minimum: 0,
                                        maximum: 10000,
                                        visibility: trackVisibility,
                                        onChange: (value) => {
                                            trackBaseHeight.set(value);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ])
                            ]
                        }),
                        groupbox({
                            text: "Coordinates",
                            visibility: coordsVisibility,
                            content: [
                                horizontal([
                                    label({
                                        text: "ΔX",
                                        width: 24,
                                        visibility: coordsVisibility
                                    }),
                                    spinner({
                                        value: twoway(deltaX),
                                        minimum: -100000,
                                        maximum: 100000,
                                        visibility: coordsVisibility,
                                        onChange: (value) => {
                                            deltaX.set(value);
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    label({
                                        text: "ΔY",
                                        width: 24,
                                        visibility: coordsVisibility
                                    }),
                                    spinner({
                                        value: twoway(deltaY),
                                        minimum: -100000,
                                        maximum: 100000,
                                        visibility: coordsVisibility,
                                        onChange: (value) => {
                                            deltaY.set(value);
                                            persistSelectedStepFields();
                                        }
                                    }),
                                    label({
                                        text: "ΔZ",
                                        width: 24,
                                        visibility: coordsVisibility
                                    }),
                                    spinner({
                                        value: twoway(deltaZ),
                                        minimum: -100000,
                                        maximum: 100000,
                                        visibility: coordsVisibility,
                                        onChange: (value) => {
                                            deltaZ.set(value);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ]),
                                horizontal([
                                    label({
                                        text: "Duration",
                                        width: 55,
                                        visibility: coordsVisibility
                                    }),
                                    spinner({
                                        value: twoway(durationTicks),
                                        minimum: 1,
                                        maximum: 100000,
                                        visibility: coordsVisibility,
                                        onChange: (value) => {
                                            durationTicks.set(value);
                                            persistSelectedStepFields();
                                        }
                                    })
                                ])
                            ]
                        })
                    ]
                })
                    ]
                }),
                button({
                    text: "Delete Animation",
                    width: 120,
                    height: 14,
                    padding: { left: "1w" },
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
    refreshVariableOptions();
    refreshRideOptions();
    refreshStepsList();
    refreshLinkedTriggersList();
    editorWindow.open();
}

bindAnimationEditorOpener(openAnimationEditor);
