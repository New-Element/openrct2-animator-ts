/// <reference path="./../../../../openrct2.d.ts" />

import {colourPicker, compute, dropdown, horizontal, label, store, Store, twoway} from "openrct2-flexui";
import {NumberSourceOrigin} from "../../../../model/animation/jsonTypes";
import {persistNumberSource, readNumberOrigin} from "../../../../model/animation/step/numberSource";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

const ORIGIN_LABELS = ["Hardcoded", "Variable"];

export function createColourSourceFields(args: {
    label: string;
    onPersist: () => void;
    visibility: Store<"visible" | "none">;
}) {
    const originSelected = store<number>(0);
    const hardcoded = store<number>(0);
    const hardcodedVisibility = compute(args.visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 0 ? "visible" : "none" as const
    ));
    const variableVisibility = compute(args.visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const picker = createTypedVariablePicker({
        valueType: "int",
        emptyLabel: "(No Int Variables)",
        missingLabel: "Int Variable Missing",
        visibility: variableVisibility,
        onChange: () => args.onPersist()
    });

    function origin(): NumberSourceOrigin {
        return originSelected.get() === 1 ? "variable" : "hardcoded";
    }

    function load(value: number, valueOrigin?: NumberSourceOrigin, variableId?: string): void {
        originSelected.set(readNumberOrigin(valueOrigin) === "variable" ? 1 : 0);
        hardcoded.set(typeof value === "number" ? value : 0);
        picker.refresh(typeof variableId === "string" ? variableId : "");
    }

    function read(): {value: number; origin?: NumberSourceOrigin; variableId?: string} {
        return persistNumberSource(hardcoded.get(), origin(), picker.selectedId());
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
            }),
            colourPicker({
                colour: twoway(hardcoded),
                visibility: hardcodedVisibility,
                onChange: (colour) => {
                    hardcoded.set(colour);
                    args.onPersist();
                }
            })
        ]),
        ...picker.widgets
    ];

    return {load, read, origin, picker, widgets};
}

export type ColourSourceFields = ReturnType<typeof createColourSourceFields>;
