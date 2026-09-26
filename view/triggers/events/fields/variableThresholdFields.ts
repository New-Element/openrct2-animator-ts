/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {VariableThresholdDirection} from "../../../../model/animation/jsonTypes";
import VariableThresholdEvent from "../../../../model/animation/trigger/event/variableThresholdEvent";
import Trigger from "../../../../model/animation/trigger/trigger";
import getConductor from "../../../../model/getConductor";

const DIRECTION_LABELS = ["Crosses Above", "Crosses Below", "Crosses Either Way"];
const DIRECTIONS: VariableThresholdDirection[] = ["above", "below", "either"];

function directionIndex(direction: VariableThresholdDirection): number {
    for (let i = 0; i < DIRECTIONS.length; i++) {
        if (DIRECTIONS[i] === direction) {
            return i;
        }
    }
    return 0;
}

export function createVariableThresholdFields(
    getTrigger: () => Trigger | null,
    onAfterSave: () => void,
    canPersist: () => boolean = () => true
) {
    const visibility = store<"visible" | "none">("none");
    const variableDropdownItems = store<string[]>(["(No Variables)"]);
    const variableSelectedIndex = store<number>(0);
    const directionIndexStore = store<number>(0);
    const threshold = store<number>(0);
    let variableOptionIds: string[] = [];

    function variableDisplayName(name: string): string {
        const trimmed = name.trim();
        return trimmed ? trimmed : "(Unnamed)";
    }

    function refreshVariableOptions(): void {
        const variables = getConductor().variablesArray.items;
        variableOptionIds = [];
        const labels: string[] = [];
        for (let i = 0; i < variables.length; i++) {
            if (variables[i].valueType === "string") {
                continue;
            }
            variableOptionIds.push(variables[i].id);
            labels.push(variableDisplayName(variables[i].name));
        }
        if (labels.length === 0) {
            variableDropdownItems.set(["(No Variables)"]);
            variableSelectedIndex.set(0);
            return;
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

    function hide(): void {
        visibility.set("none");
    }

    function save(trigger: Trigger): void {
        if (!(trigger.event instanceof VariableThresholdEvent)) {
            return;
        }
        if (variableOptionIds.length === 0) {
            trigger.event.setVariableId("");
        }
        else {
            const idx = variableSelectedIndex.get();
            if (idx >= 0 && idx < variableOptionIds.length) {
                trigger.event.setVariableId(variableOptionIds[idx]);
            }
        }
        const dirIdx = directionIndexStore.get();
        trigger.event.setDirection(DIRECTIONS[dirIdx] || "above");
        trigger.event.setThreshold(threshold.get());
        getConductor().triggersArray.save();
        onAfterSave();
    }

    function persistFromUi(): void {
        if (!canPersist()) {
            return;
        }
        const trigger = getTrigger();
        if (trigger) {
            save(trigger);
        }
    }

    function load(trigger: Trigger): void {
        refreshVariableOptions();
        if (!(trigger.event instanceof VariableThresholdEvent)) {
            hide();
            return;
        }
        visibility.set("visible");
        const index = indexOfVariableId(trigger.event.variableId);
        if (index < 0 && variableOptionIds.length > 0) {
            variableSelectedIndex.set(0);
            directionIndexStore.set(directionIndex(trigger.event.direction));
            threshold.set(trigger.event.threshold);
            save(trigger);
            return;
        }
        variableSelectedIndex.set(index < 0 ? 0 : index);
        directionIndexStore.set(directionIndex(trigger.event.direction));
        threshold.set(trigger.event.threshold);
    }

    const widgets = [
        label({
            text: "Variable",
            visibility
        }),
        dropdown({
            items: variableDropdownItems,
            selectedIndex: twoway(variableSelectedIndex),
            visibility,
            onChange: (index) => {
                variableSelectedIndex.set(index);
                persistFromUi();
            }
        }),
        label({
            text: "Direction",
            visibility
        }),
        dropdown({
            items: DIRECTION_LABELS,
            selectedIndex: twoway(directionIndexStore),
            visibility,
            onChange: (index) => {
                directionIndexStore.set(index);
                persistFromUi();
            }
        }),
        horizontal([
            label({
                text: "Threshold",
                width: 70,
                visibility
            }),
            spinner({
                step: spinnerStep,
                value: twoway(threshold),
                minimum: -100000,
                maximum: 100000,
                visibility,
                onChange: (value) => {
                    threshold.set(value);
                    persistFromUi();
                }
            })
        ])
    ];

    return {hide, load, save, selectedVariableName, widgets};
}

export type VariableThresholdFields = ReturnType<typeof createVariableThresholdFields>;
