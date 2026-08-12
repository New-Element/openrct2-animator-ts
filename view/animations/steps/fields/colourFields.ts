/// <reference path="./../../../../openrct2.d.ts" />

import {colourPicker, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {UNSELECTED_COLOUR} from "../../../../model/animation/step/car/vehicleColour";

export function createColourFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const colourBody = store<number>(UNSELECTED_COLOUR);
    const colourTrim = store<number>(UNSELECTED_COLOUR);
    const colourTertiary = store<number>(UNSELECTED_COLOUR);

    function hide(): void {
        visibility.set("none");
    }

    function load(value: {body: number; trim: number; tertiary: number}): void {
        visibility.set("visible");
        colourBody.set(value.body);
        colourTrim.set(value.trim);
        colourTertiary.set(value.tertiary);
    }

    function readValue() {
        return {
            body: colourBody.get(),
            trim: colourTrim.get(),
            tertiary: colourTertiary.get()
        };
    }

    const widgets = [
        groupbox({
            text: "Colours",
            visibility,
            content: [
                horizontal([
                    label({
                        text: "Body:",
                        width: 55,
                        visibility
                    }),
                    colourPicker({
                        colour: twoway(colourBody),
                        visibility,
                        onChange: (colour) => {
                            colourBody.set(colour);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Trim:",
                        width: 55,
                        visibility
                    }),
                    colourPicker({
                        colour: twoway(colourTrim),
                        visibility,
                        onChange: (colour) => {
                            colourTrim.set(colour);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Tertiary:",
                        width: 55,
                        visibility
                    }),
                    colourPicker({
                        colour: twoway(colourTertiary),
                        visibility,
                        onChange: (colour) => {
                            colourTertiary.set(colour);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {visibility, hide, load, readValue, widgets};
}

export type ColourFields = ReturnType<typeof createColourFields>;
