/// <reference path="./../../../../openrct2.d.ts" />

import {checkbox, groupbox, horizontal, label, spinner, store, twoway} from "openrct2-flexui";
import {LiftDropTrackStepDesc} from "../../../../model/animation/jsonTypes";
import {readLiftDropLandHeight} from "../../../../model/animation/liftDropHeights";

export function createLiftDropTrackFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    /** Land-height units, matching Advanced Track’s editor. Stored as-is. */
    const startHeight = store<number>(0);
    const endHeight = store<number>(16);
    const speed = store<number>(100);
    const reverseExitDirection = store<boolean>(false);

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: LiftDropTrackStepDesc): void {
        visibility.set("visible");
        startHeight.set(readLiftDropLandHeight(desc, "start"));
        endHeight.set(readLiftDropLandHeight(desc, "end"));
        speed.set(typeof desc.speed === "number" ? desc.speed : 100);
        reverseExitDirection.set(desc.reverseExitDirection === true);
    }

    function readFields(): {
        startHeight: number;
        endHeight: number;
        speed: number;
        reverseExitDirection: boolean;
    } {
        return {
            startHeight: startHeight.get(),
            endHeight: endHeight.get(),
            speed: speed.get(),
            reverseExitDirection: reverseExitDirection.get()
        };
    }

    const widgets = [
        groupbox({
            text: "Lift/Drop Track",
            visibility,
            content: [
                label({
                    text: "Height (land units)",
                    visibility
                }),
                horizontal([
                    label({
                        text: "Start",
                        width: 40,
                        visibility
                    }),
                    spinner({
                        value: twoway(startHeight),
                        minimum: 0,
                        maximum: 10000,
                        visibility,
                        onChange: (value) => {
                            startHeight.set(value);
                            onPersist();
                        }
                    }),
                    label({
                        text: "End",
                        width: 30,
                        visibility
                    }),
                    spinner({
                        value: twoway(endHeight),
                        minimum: 0,
                        maximum: 10000,
                        visibility,
                        onChange: (value) => {
                            endHeight.set(value);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Speed (%)",
                        width: 70,
                        visibility
                    }),
                    spinner({
                        value: twoway(speed),
                        minimum: 0,
                        maximum: 10000,
                        visibility,
                        onChange: (value) => {
                            const clamped = value < 0 ? 0 : value;
                            speed.set(clamped);
                            onPersist();
                        }
                    })
                ]),
                checkbox({
                    text: "Reverse Exit Direction",
                    isChecked: twoway(reverseExitDirection),
                    visibility,
                    onChange: (checked) => {
                        reverseExitDirection.set(checked);
                        onPersist();
                    }
                })
            ]
        })
    ];

    return {hide, load, readFields, widgets};
}

export type LiftDropTrackFields = ReturnType<typeof createLiftDropTrackFields>;
