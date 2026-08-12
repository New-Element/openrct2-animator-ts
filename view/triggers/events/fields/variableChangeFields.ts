/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, label, store, twoway} from "openrct2-flexui";
import VariableChangeEvent from "../../../../model/animation/trigger/event/variableChangeEvent";
import Trigger from "../../../../model/animation/trigger/trigger";
import getConductor from "../../../../model/getConductor";

export function createVariableChangeFields(
    getTrigger: () => Trigger | null,
    onAfterSave: () => void
) {
    const visibility = store<"visible" | "none">("none");
    const variableDropdownItems = store<string[]>(["(No Variables)"]);
    const variableSelectedIndex = store<number>(0);
    let variableOptionIds: string[] = [];

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

    function hide(): void {
        visibility.set("none");
    }

    function save(trigger: Trigger): void {
        if (!(trigger.event instanceof VariableChangeEvent)) {
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
        getConductor().triggersArray.save();
        onAfterSave();
    }

    function persistFromUi(): void {
        const trigger = getTrigger();
        if (trigger) {
            save(trigger);
        }
    }

    function load(trigger: Trigger): void {
        refreshVariableOptions();
        if (!(trigger.event instanceof VariableChangeEvent)) {
            hide();
            return;
        }
        visibility.set("visible");
        const index = indexOfVariableId(trigger.event.variableId);
        if (index < 0 && variableOptionIds.length > 0) {
            variableSelectedIndex.set(0);
            save(trigger);
            return;
        }
        variableSelectedIndex.set(index < 0 ? 0 : index);
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
        })
    ];

    return {hide, load, save, selectedVariableName, refreshVariableOptions, widgets};
}

export type VariableChangeFields = ReturnType<typeof createVariableChangeFields>;
