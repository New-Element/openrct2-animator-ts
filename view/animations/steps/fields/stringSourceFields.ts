/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, horizontal, label, store, Store, textbox, twoway} from "openrct2-flexui";
import {StringSourceOrigin} from "../../../../model/animation/jsonTypes";
import {persistStringSource, readStringOrigin} from "../../../../model/animation/step/stringSource";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

const ORIGIN_LABELS = ["Hardcoded", "Variable"];

export function createStringSourceFields(args: {
    label: string;
    onPersist: () => void;
    visibility: Store<"visible" | "none">;
}) {
    const originSelected = store<number>(0);
    const hardcoded = store<string>("");
    const hardcodedVisibility = compute(args.visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 0 ? "visible" : "none" as const
    ));
    const variableVisibility = compute(args.visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const picker = createTypedVariablePicker({
        valueType: "string",
        emptyLabel: "(No String Variables)",
        missingLabel: "String Variable Missing",
        visibility: variableVisibility,
        onChange: () => args.onPersist()
    });

    function origin(): StringSourceOrigin {
        return originSelected.get() === 1 ? "variable" : "hardcoded";
    }

    function load(value: string, valueOrigin?: StringSourceOrigin, variableId?: string): void {
        originSelected.set(readStringOrigin(valueOrigin) === "variable" ? 1 : 0);
        hardcoded.set(typeof value === "string" ? value : "");
        picker.refresh(typeof variableId === "string" ? variableId : "");
    }

    function read(): {value: string; origin?: StringSourceOrigin; variableId?: string} {
        return persistStringSource(hardcoded.get(), origin(), picker.selectedId());
    }

    const widgets = [
        horizontal([
            label({text: args.label, width: 70, visibility: args.visibility}),
            dropdown({
                items: ORIGIN_LABELS,
                selectedIndex: twoway(originSelected),
                visibility: args.visibility,
                onChange: (index) => {
                    originSelected.set(index);
                    if (index === 1) {
                        picker.refresh();
                    }
                    args.onPersist();
                }
            })
        ]),
        textbox({
            text: hardcoded,
            visibility: hardcodedVisibility,
            onChange: (text) => {
                hardcoded.set(text);
                args.onPersist();
            }
        }),
        ...picker.widgets
    ];

    return {load, read, origin, picker, widgets};
}

export type StringSourceFields = ReturnType<typeof createStringSourceFields>;
