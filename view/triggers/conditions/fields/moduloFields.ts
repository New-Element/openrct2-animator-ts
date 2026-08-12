/// <reference path="./../../../../openrct2.d.ts" />

import {horizontal, label, spinner, store, twoway} from "openrct2-flexui";

export function createModuloFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const conditionModulo = store<number>(2);
    const conditionRemainder = store<number>(0);

    function hide(): void {
        visibility.set("none");
    }

    function load(modulo: number, remainder: number): void {
        visibility.set("visible");
        conditionModulo.set(modulo);
        conditionRemainder.set(remainder);
    }

    function read() {
        return {
            modulo: conditionModulo.get(),
            remainder: conditionRemainder.get()
        };
    }

    const widgets = [
        horizontal([
            label({
                text: "Modulo",
                width: 50,
                visibility
            }),
            spinner({
                value: twoway(conditionModulo),
                minimum: 1,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    conditionModulo.set(value);
                    onPersist();
                }
            }),
            label({
                text: "Remainder",
                width: 60,
                visibility
            }),
            spinner({
                value: twoway(conditionRemainder),
                minimum: 0,
                maximum: 10000,
                visibility,
                onChange: (value) => {
                    conditionRemainder.set(value);
                    onPersist();
                }
            })
        ])
    ];

    return {hide, load, read, widgets};
}

export type ModuloFields = ReturnType<typeof createModuloFields>;
