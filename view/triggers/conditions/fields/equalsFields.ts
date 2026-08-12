/// <reference path="./../../../../openrct2.d.ts" />

import {horizontal, label, spinner, store, twoway} from "openrct2-flexui";

export function createEqualsFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const conditionEqualsValue = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(value: number): void {
        visibility.set("visible");
        conditionEqualsValue.set(value);
    }

    function read(): number {
        return conditionEqualsValue.get();
    }

    const widgets = [
        horizontal([
            label({
                text: "Value",
                width: 40,
                visibility
            }),
            spinner({
                value: twoway(conditionEqualsValue),
                minimum: 0,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    conditionEqualsValue.set(value);
                    onPersist();
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type EqualsFields = ReturnType<typeof createEqualsFields>;
