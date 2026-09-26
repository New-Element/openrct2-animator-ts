/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, horizontal, label, spinner, store, twoway, WritableStore} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {CoordsSourceDesc, CoordsSourceOrigin} from "../../../../model/animation/jsonTypes";
import {persistCoordsSource, readCoordsSourceOrigin} from "../../../../model/animation/step/coordsSource";
import {createTypedVariablePicker} from "../../../variables/typedVariablePicker";

const ORIGIN_LABELS = ["Hardcoded", "Coords Variable"];
const ORIGINS: CoordsSourceOrigin[] = ["hardcoded", "variable"];

function originIndex(origin: CoordsSourceOrigin): number {
    return origin === "variable" ? 1 : 0;
}

export function createCoordsSourceFields(
    onPersist: () => void,
    visibility: WritableStore<"visible" | "none">
) {
    const originSelected = store<number>(0);
    const x = store<number>(0);
    const y = store<number>(0);
    const z = store<number>(0);
    const hardcodedVisibility = compute(visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 0 ? "visible" : "none" as const
    ));
    const variableVisibility = compute(visibility, originSelected, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const picker = createTypedVariablePicker({
        valueType: "coords",
        emptyLabel: "(No Coords Variables)",
        missingLabel: "Coords Variable Missing",
        visibility: variableVisibility,
        onChange: () => onPersist()
    });

    function origin(): CoordsSourceOrigin {
        return ORIGINS[originSelected.get()] || "hardcoded";
    }

    function load(desc: CoordsSourceDesc): void {
        originSelected.set(originIndex(readCoordsSourceOrigin(desc)));
        x.set(typeof desc.x === "number" ? desc.x : 0);
        y.set(typeof desc.y === "number" ? desc.y : 0);
        z.set(typeof desc.z === "number" ? desc.z : 0);
        picker.refresh(typeof desc.coordsVariableId === "string" ? desc.coordsVariableId : "");
    }

    function read(): CoordsSourceDesc {
        return persistCoordsSource({
            origin: origin(),
            x: x.get(),
            y: y.get(),
            z: z.get(),
            coordsVariableId: picker.selectedId()
        });
    }

    const widgets = [
        dropdown({
            items: ORIGIN_LABELS,
            selectedIndex: twoway(originSelected),
            visibility,
            onChange: (index) => {
                originSelected.set(index);
                if (index === 1) {
                    picker.refresh();
                }
                onPersist();
            }
        }),
        ...picker.widgets,
        horizontal([
            label({text: "X", width: 20, visibility: hardcodedVisibility}),
            spinner({
                step: spinnerStep,
                value: twoway(x),
                minimum: -100000,
                maximum: 100000,
                visibility: hardcodedVisibility,
                onChange: (next) => {
                    x.set(next);
                    onPersist();
                }
            }),
            label({text: "Y", width: 20, visibility: hardcodedVisibility}),
            spinner({
                step: spinnerStep,
                value: twoway(y),
                minimum: -100000,
                maximum: 100000,
                visibility: hardcodedVisibility,
                onChange: (next) => {
                    y.set(next);
                    onPersist();
                }
            }),
            label({text: "Z", width: 20, visibility: hardcodedVisibility}),
            spinner({
                step: spinnerStep,
                value: twoway(z),
                minimum: -100000,
                maximum: 100000,
                visibility: hardcodedVisibility,
                onChange: (next) => {
                    z.set(next);
                    onPersist();
                }
            })
        ])
    ];

    return {load, read, widgets};
}

export type CoordsSourceFields = ReturnType<typeof createCoordsSourceFields>;
