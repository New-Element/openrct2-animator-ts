/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {
    PathAdditionVandalisedStepDesc,
    PathBinFullStepDesc,
    PathLitterStepDesc
} from "../../../../model/animation/jsonTypes";
import {
    indexOfValue,
    LITTER_TYPE_LABELS,
    LITTER_TYPES,
    ON_OFF_TOGGLE,
    ON_OFF_TOGGLE_LABELS
} from "../../../triggers/conditions/labels";
import {createTileTargetFields} from "./tileTargetFields";

type PathType = "pathAdditionVandalised" | "pathBinFull" | "pathLitter";

const TITLES: {[type in PathType]: string} = {
    pathAdditionVandalised: "Path Addition Vandalised",
    pathBinFull: "Bin Full",
    pathLitter: "Path Litter"
};

export function createPathFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const title = store<string>("Path");
    const tileTarget = createTileTargetFields(onPersist, visibility);
    const modeIndex = store<number>(0);
    const litterIndex = store<number>(0);
    const litterVisibility = store<"visible" | "none">("none");
    let currentType: PathType = "pathAdditionVandalised";

    function hide(): void {
        visibility.set("none");
        litterVisibility.set("none");
    }

    function load(desc: PathAdditionVandalisedStepDesc | PathBinFullStepDesc | PathLitterStepDesc): void {
        currentType = desc.type;
        visibility.set("visible");
        title.set(TITLES[desc.type]);
        tileTarget.load(desc);
        modeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
        if (desc.type === "pathLitter") {
            litterIndex.set(indexOfValue(LITTER_TYPES, desc.litterType));
            litterVisibility.set("visible");
            return;
        }
        litterVisibility.set("none");
    }

    function persist(): PathAdditionVandalisedStepDesc | PathBinFullStepDesc | PathLitterStepDesc {
        const tile = tileTarget.readTarget();
        const mode = ON_OFF_TOGGLE[modeIndex.get()] || "on";
        if (currentType === "pathLitter") {
            return {
                type: "pathLitter",
                ...tile,
                mode: mode,
                litterType: LITTER_TYPES[litterIndex.get()] || "rubbish"
            };
        }
        return {type: currentType, ...tile, mode: mode};
    }

    const widgets = [
        groupbox({
            text: title,
            visibility,
            content: [
                ...tileTarget.widgets,
                horizontal([
                    label({text: "Mode", width: 70}),
                    dropdown({
                        items: ON_OFF_TOGGLE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        onChange: (index) => {
                            modeIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Litter", width: 70, visibility: litterVisibility}),
                    dropdown({
                        items: LITTER_TYPE_LABELS,
                        selectedIndex: twoway(litterIndex),
                        visibility: litterVisibility,
                        onChange: (index) => {
                            litterIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type PathFields = ReturnType<typeof createPathFields>;
