/// <reference path="./../../openrct2.d.ts" />

import {compute, dropdown, label, store, Store, twoway} from "openrct2-flexui";
import {VariableValueType} from "../../model/animation/jsonTypes";
import getConductor from "../../model/getConductor";

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function withoutParens(label: string): string {
    if (label.length >= 2 && label.charAt(0) === "(" && label.charAt(label.length - 1) === ")") {
        return label.slice(1, -1);
    }
    return label;
}

/**
 * Dropdown of variables of one type. Keeps a missing id until the user picks another.
 */
export function createTypedVariablePicker(args: {
    valueType: VariableValueType;
    emptyLabel: string;
    missingLabel: string;
    visibility: Store<"visible" | "none">;
    onChange: () => void;
    storedOnly?: boolean;
}) {
    const items = store<string[]>([args.emptyLabel]);
    const selectedIndex = store<number>(0);
    const hintText = store<string>("");
    const hintVisibility = compute(args.visibility, hintText, (shown: "visible" | "none", hint: string) => (
        shown === "visible" && hint ? "visible" : "none" as const
    ));
    let ids: string[] = [];
    let storedId = "";

    function refresh(preferredId?: string): void {
        if (preferredId !== undefined) {
            storedId = preferredId;
        }
        const variables = getConductor().variablesArray.items;
        ids = [];
        const labels: string[] = [];
        let found = -1;
        for (let i = 0; i < variables.length; i++) {
            if (variables[i].valueType !== args.valueType) {
                continue;
            }
            if (args.storedOnly && variables[i].isFormula()) {
                continue;
            }
            if (variables[i].id === storedId) {
                found = ids.length;
            }
            ids.push(variables[i].id);
            labels.push(displayName(variables[i].name));
        }
        if (labels.length === 0) {
            if (storedId) {
                items.set([args.missingLabel]);
                ids = [storedId];
                selectedIndex.set(0);
                hintText.set(args.missingLabel);
                return;
            }
            items.set([args.emptyLabel]);
            ids = [];
            selectedIndex.set(0);
            hintText.set(withoutParens(args.emptyLabel));
            return;
        }
        if (storedId && found < 0) {
            labels.unshift(args.missingLabel);
            ids.unshift(storedId);
            found = 0;
            hintText.set(args.missingLabel);
        }
        else {
            hintText.set("");
        }
        items.set(labels);
        const pick = found >= 0 ? found : 0;
        selectedIndex.set(pick);
        if (ids.length > 0) {
            storedId = ids[pick];
        }
    }

    function selectedId(): string {
        return ids[selectedIndex.get()] || storedId;
    }

    function hasValidSelection(): boolean {
        const id = selectedId();
        if (!id) {
            return false;
        }
        const variable = getConductor().variablesArray.findById(id);
        return !!variable && variable.valueType === args.valueType;
    }

    const widgets = [
        dropdown({
            items: items,
            selectedIndex: twoway(selectedIndex),
            visibility: args.visibility,
            onChange: (index) => {
                selectedIndex.set(index);
                storedId = ids[index] || storedId;
                refresh();
                args.onChange();
            }
        }),
        label({
            text: hintText,
            visibility: hintVisibility
        })
    ];

    return {
        refresh,
        selectedId,
        hasValidSelection,
        widgets
    };
}

export type TypedVariablePicker = ReturnType<typeof createTypedVariablePicker>;
