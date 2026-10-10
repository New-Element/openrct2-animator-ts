/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {StartFireworksStepDesc} from "../../../../model/animation/jsonTypes";
import {
    getFireworksShowNames,
    requestFireworksShowNames,
    subscribeFireworksShowNames
} from "../../../../model/fireworks/showNames";

const NO_SHOWS = "(No Shows)";

export type StartFireworksFields = ReturnType<typeof createStartFireworksFields>;

export function createStartFireworksFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const items = store<string[]>([NO_SHOWS]);
    const selectedIndex = store<number>(0);
    let chosen = "";
    let applying = false;

    subscribeFireworksShowNames((names) => {
        if (visibility.get() !== "visible") {
            return;
        }
        applyNames(names, selectedShowName() || chosen);
    });

    function selectedShowName(): string {
        const label = items.get()[selectedIndex.get()] || "";
        return label === NO_SHOWS ? "" : label;
    }

    function applyNames(names: string[], preferred: string): void {
        const labels: string[] = [];
        if (!preferred) {
            labels.push(NO_SHOWS);
        }
        else if (names.indexOf(preferred) < 0) {
            labels.push(preferred);
        }
        for (let i = 0; i < names.length; i++) {
            labels.push(names[i]);
        }
        if (labels.length === 0) {
            labels.push(NO_SHOWS);
        }
        let index = 0;
        if (preferred) {
            const found = labels.indexOf(preferred);
            index = found >= 0 ? found : 0;
        }
        applying = true;
        items.set(labels);
        selectedIndex.set(index);
        applying = false;
        chosen = preferred;
    }

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: StartFireworksStepDesc): void {
        chosen = typeof desc.showName === "string" ? desc.showName.trim() : "";
        visibility.set("visible");
        applyNames(getFireworksShowNames(), chosen);
        requestFireworksShowNames();
    }

    function persist(): StartFireworksStepDesc {
        return {
            type: "startFireworks",
            showName: selectedShowName()
        };
    }

    const widgets = [
        groupbox({
            text: "Start Fireworks",
            visibility,
            content: [
                horizontal([
                    label({text: "Show", width: 70, visibility}),
                    dropdown({
                        items: items,
                        selectedIndex: twoway(selectedIndex),
                        visibility,
                        onChange: (index) => {
                            if (applying) {
                                return;
                            }
                            selectedIndex.set(index);
                            chosen = selectedShowName();
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}
