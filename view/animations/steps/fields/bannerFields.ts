/// <reference path="./../../../../openrct2.d.ts" />

import {
    checkbox,
    compute,
    dropdown,
    groupbox,
    horizontal,
    label,
    store,
    twoway
} from "openrct2-flexui";
import {
    BannerColoursStepDesc,
    BannerNoEntryStepDesc,
    BannerTextStepDesc,
    NumberSourceOrigin
} from "../../../../model/animation/jsonTypes";
import {ON_OFF_TOGGLE, ON_OFF_TOGGLE_LABELS, indexOfValue} from "../../../triggers/conditions/labels";
import {createColourSourceFields} from "./colourSourceFields";
import {createStringSourceFields} from "./stringSourceFields";
import {createTileTargetFields} from "./tileTargetFields";

type BannerType = "bannerText" | "bannerColours" | "bannerNoEntry";

export function createBannerFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const title = store<string>("Banner");
    const tileTarget = createTileTargetFields(onPersist, visibility);
    const setPrimary = store<boolean>(false);
    const setSecondary = store<boolean>(false);
    const setTertiary = store<boolean>(false);
    const modeIndex = store<number>(0);
    const textVisibility = store<"visible" | "none">("none");
    const colourVisibility = store<"visible" | "none">("none");
    const modeVisibility = store<"visible" | "none">("none");
    const primaryValueVisibility = compute(colourVisibility, setPrimary, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const secondaryValueVisibility = compute(colourVisibility, setSecondary, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const tertiaryValueVisibility = compute(colourVisibility, setTertiary, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const textFields = createStringSourceFields({
        label: "Text",
        onPersist: onPersist,
        visibility: textVisibility
    });
    const primaryFields = createColourSourceFields({
        label: "Primary",
        onPersist: onPersist,
        visibility: primaryValueVisibility
    });
    const secondaryFields = createColourSourceFields({
        label: "Secondary",
        onPersist: onPersist,
        visibility: secondaryValueVisibility
    });
    const tertiaryFields = createColourSourceFields({
        label: "Tertiary",
        onPersist: onPersist,
        visibility: tertiaryValueVisibility
    });

    function applyColour(
        desc: BannerColoursStepDesc,
        field: "primaryColour" | "secondaryColour" | "tertiaryColour",
        source: {value: number; origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        desc[field] = source.value;
        if (source.origin === "variable") {
            desc[`${field}Origin`] = "variable";
            desc[`${field}VariableId`] = source.variableId || "";
        }
    }
    let currentType: BannerType = "bannerText";

    function hide(): void {
        visibility.set("none");
        textVisibility.set("none");
        colourVisibility.set("none");
        modeVisibility.set("none");
    }

    function load(desc: BannerTextStepDesc | BannerColoursStepDesc | BannerNoEntryStepDesc): void {
        currentType = desc.type;
        visibility.set("visible");
        tileTarget.load(desc);
        textVisibility.set("none");
        colourVisibility.set("none");
        modeVisibility.set("none");
        if (desc.type === "bannerText") {
            title.set("Banner Text");
            textFields.load(desc.text, desc.textOrigin, desc.textVariableId);
            textVisibility.set("visible");
            return;
        }
        if (desc.type === "bannerColours") {
            title.set("Banner Colours");
            setPrimary.set(desc.primaryColour !== undefined || desc.primaryColourOrigin === "variable");
            primaryFields.load(desc.primaryColour !== undefined ? desc.primaryColour : 0, desc.primaryColourOrigin, desc.primaryColourVariableId);
            setSecondary.set(desc.secondaryColour !== undefined || desc.secondaryColourOrigin === "variable");
            secondaryFields.load(desc.secondaryColour !== undefined ? desc.secondaryColour : 0, desc.secondaryColourOrigin, desc.secondaryColourVariableId);
            setTertiary.set(desc.tertiaryColour !== undefined || desc.tertiaryColourOrigin === "variable");
            tertiaryFields.load(desc.tertiaryColour !== undefined ? desc.tertiaryColour : 0, desc.tertiaryColourOrigin, desc.tertiaryColourVariableId);
            colourVisibility.set("visible");
            return;
        }
        title.set("Banner No Entry");
        modeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
        modeVisibility.set("visible");
    }

    function persist(): BannerTextStepDesc | BannerColoursStepDesc | BannerNoEntryStepDesc {
        const tile = tileTarget.readTarget();
        if (currentType === "bannerText") {
            const source = textFields.read();
            return {
                type: "bannerText",
                ...tile,
                text: source.value,
                ...(source.origin === "variable" ? {textOrigin: "variable", textVariableId: source.variableId || ""} : {})
            };
        }
        if (currentType === "bannerColours") {
            const desc: BannerColoursStepDesc = {type: "bannerColours", ...tile};
            if (setPrimary.get()) {
                applyColour(desc, "primaryColour", primaryFields.read());
            }
            if (setSecondary.get()) {
                applyColour(desc, "secondaryColour", secondaryFields.read());
            }
            if (setTertiary.get()) {
                applyColour(desc, "tertiaryColour", tertiaryFields.read());
            }
            return desc;
        }
        return {
            type: "bannerNoEntry",
            ...tile,
            mode: ON_OFF_TOGGLE[modeIndex.get()] || "on"
        };
    }

    const widgets = [
        groupbox({
            text: title,
            visibility,
            content: [
                ...tileTarget.widgets,
                ...textFields.widgets,
                horizontal([
                    label({text: "Primary", width: 70, visibility: colourVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setPrimary),
                        visibility: colourVisibility,
                        onChange: (checked) => {
                            setPrimary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...primaryFields.widgets,
                horizontal([
                    label({text: "Secondary", width: 70, visibility: colourVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setSecondary),
                        visibility: colourVisibility,
                        onChange: (checked) => {
                            setSecondary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...secondaryFields.widgets,
                horizontal([
                    label({text: "Tertiary", width: 70, visibility: colourVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setTertiary),
                        visibility: colourVisibility,
                        onChange: (checked) => {
                            setTertiary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...tertiaryFields.widgets,
                horizontal([
                    label({text: "Mode", width: 70, visibility: modeVisibility}),
                    dropdown({
                        items: ON_OFF_TOGGLE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        visibility: modeVisibility,
                        onChange: (index) => {
                            modeIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type BannerFields = ReturnType<typeof createBannerFields>;
