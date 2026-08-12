/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";

export function createCoordsFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const deltaX = store<number>(0);
    const deltaY = store<number>(0);
    const deltaZ = store<number>(0);
    const durationTicks = store<number>(40);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: {
        deltaX?: number;
        deltaY?: number;
        deltaZ?: number;
        durationTicks: number;
    }): void {
        visibility.set("visible");
        deltaX.set(desc.deltaX || 0);
        deltaY.set(desc.deltaY || 0);
        deltaZ.set(desc.deltaZ || 0);
        durationTicks.set(desc.durationTicks);
    }

    function readCoords() {
        return {
            deltaX: deltaX.get(),
            deltaY: deltaY.get(),
            deltaZ: deltaZ.get(),
            durationTicks: durationTicks.get()
        };
    }

    const widgets = [
        groupbox({
            text: "Coordinates",
            visibility,
            content: [
                horizontal([
                    label({
                        text: "ΔX",
                        width: 24,
                        visibility
                    }),
                    spinner({
                        value: twoway(deltaX),
                        minimum: -100000,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            deltaX.set(value);
                            onPersist();
                        }
                    }),
                    label({
                        text: "ΔY",
                        width: 24,
                        visibility
                    }),
                    spinner({
                        value: twoway(deltaY),
                        minimum: -100000,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            deltaY.set(value);
                            onPersist();
                        }
                    }),
                    label({
                        text: "ΔZ",
                        width: 24,
                        visibility
                    }),
                    spinner({
                        value: twoway(deltaZ),
                        minimum: -100000,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            deltaZ.set(value);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Duration",
                        width: 55,
                        visibility
                    }),
                    spinner({
                        value: twoway(durationTicks),
                        minimum: 1,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            durationTicks.set(value);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, readCoords, widgets};
}

export type CoordsFields = ReturnType<typeof createCoordsFields>;
