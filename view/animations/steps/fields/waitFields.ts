/// <reference path="./../../../../openrct2.d.ts" />

import {groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {WaitStepDesc} from "../../../../model/animation/jsonTypes";

export function createWaitFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const waitTicks = store<number>(40);

    function hide(): void {
        visibility.set("none");
    }

    function load(ticks: number): void {
        visibility.set("visible");
        waitTicks.set(ticks);
    }

    function persist(): WaitStepDesc {
        return {type: "wait", ticks: waitTicks.get()};
    }

    const widgets = [
        groupbox({
            text: "Wait",
            visibility,
            content: [
                horizontal([
                    label({
                        text: "Ticks",
                        width: 40,
                        visibility
                    }),
                    spinner({
                        value: twoway(waitTicks),
                        minimum: 0,
                        maximum: 100000,
                        visibility,
                        onChange: (value) => {
                            waitTicks.set(value);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {visibility, hide, load, persist, widgets};
}

export type WaitFields = ReturnType<typeof createWaitFields>;
