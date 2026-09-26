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
    NumberSourceOrigin,
    SceneryObjectType,
    SceneryVisibilityMode,
    SceneryVisibilityStepDesc
} from "../../../../model/animation/jsonTypes";
import {resolveSceneryObject} from "../../../../model/animation/step/scenery/sceneryQuery";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {pickScenery} from "../../../ui/pickScenery";
import {createColourSourceFields} from "./colourSourceFields";
import {createNumberSourceFields} from "./numberSourceFields";
import {createTileTargetFields} from "./tileTargetFields";

const TYPE_LABELS = ["Any", "Small Scenery", "Large Scenery", "Wall"];
const TYPE_VALUES: Array<SceneryObjectType | undefined> = [
    undefined,
    "small_scenery",
    "large_scenery",
    "wall"
];

const MODE_LABELS = ["Visible", "Invisible", "Toggle"];
const MODE_VALUES: SceneryVisibilityMode[] = ["visible", "invisible", "toggle"];

function typeToIndex(type: SceneryObjectType | undefined): number {
    for (let i = 0; i < TYPE_VALUES.length; i++) {
        if (TYPE_VALUES[i] === type) {
            return i;
        }
    }
    return 0;
}

function modeToIndex(mode: SceneryVisibilityMode): number {
    for (let i = 0; i < MODE_VALUES.length; i++) {
        if (MODE_VALUES[i] === mode) {
            return i;
        }
    }
    return 0;
}

function objectDisplay(identifier: string): string {
    const resolved = resolveSceneryObject(identifier);
    if (resolved) {
        return `${resolved.name} (${identifier})`;
    }
    return identifier;
}

export function createSceneryVisibilityFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const tileTarget = createTileTargetFields(onPersist, visibility);
    const typeIndex = store<number>(0);
    const modeIndex = store<number>(0);

    const anyObject = store<boolean>(true);
    const objectIdentifier = store<string>("");
    const objectLabel = compute(anyObject, objectIdentifier, (any, id) => {
        if (any || !id) {
            return "Any";
        }
        return objectDisplay(id);
    });

    const anyHeight = store<boolean>(true);
    const anyLocation = store<boolean>(true);
    const anyPrimary = store<boolean>(true);
    const anySecondary = store<boolean>(true);
    const anyTertiary = store<boolean>(true);
    const heightValueVisibility = compute(visibility, anyHeight, (shown, any) => (
        shown === "visible" && !any ? "visible" : "none" as const
    ));
    const locationValueVisibility = compute(visibility, anyLocation, typeIndex, (shown, any, idx) => {
        const type = TYPE_VALUES[idx];
        return shown === "visible" && !any && (type === "small_scenery" || type === "wall")
            ? "visible"
            : "none" as const;
    });
    const primaryValueVisibility = compute(visibility, anyPrimary, (shown, any) => (
        shown === "visible" && !any ? "visible" : "none" as const
    ));
    const secondaryValueVisibility = compute(visibility, anySecondary, (shown, any) => (
        shown === "visible" && !any ? "visible" : "none" as const
    ));
    const tertiaryValueVisibility = compute(visibility, anyTertiary, (shown, any) => (
        shown === "visible" && !any ? "visible" : "none" as const
    ));
    const heightFields = createNumberSourceFields({
        valueType: "int",
        label: "Height",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: heightValueVisibility
    });
    const locationFields = createNumberSourceFields({
        valueType: "int",
        label: "Location",
        minimum: 0,
        maximum: 3,
        onPersist: onPersist,
        visibility: locationValueVisibility
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

    function applySource(
        desc: SceneryVisibilityStepDesc,
        field: "baseHeight" | "tileLocation" | "primaryColour" | "secondaryColour" | "tertiaryColour",
        source: {value: number; origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        desc[field] = source.value;
        if (source.origin === "variable") {
            desc[`${field}Origin`] = "variable";
            desc[`${field}VariableId`] = source.variableId || "";
        }
    }

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: SceneryVisibilityStepDesc): void {
        visibility.set("visible");
        tileTarget.load(desc);
        typeIndex.set(typeToIndex(desc.objectType));
        modeIndex.set(modeToIndex(desc.mode));

        const hasObject = !!desc.objectIdentifier;
        anyObject.set(!hasObject);
        objectIdentifier.set(desc.objectIdentifier || "");

        if (desc.baseHeight !== undefined || desc.baseHeightOrigin === "variable") {
            anyHeight.set(false);
            heightFields.load(desc.baseHeight || 0, desc.baseHeightOrigin, desc.baseHeightVariableId);
        } else {
            anyHeight.set(true);
            heightFields.load(0);
        }

        if (desc.tileLocation !== undefined || desc.tileLocationOrigin === "variable") {
            anyLocation.set(false);
            locationFields.load(desc.tileLocation || 0, desc.tileLocationOrigin, desc.tileLocationVariableId);
        } else {
            anyLocation.set(true);
            locationFields.load(0);
        }

        if (desc.primaryColour !== undefined || desc.primaryColourOrigin === "variable") {
            anyPrimary.set(false);
            primaryFields.load(desc.primaryColour || 0, desc.primaryColourOrigin, desc.primaryColourVariableId);
        } else {
            anyPrimary.set(true);
            primaryFields.load(0);
        }

        if (desc.secondaryColour !== undefined || desc.secondaryColourOrigin === "variable") {
            anySecondary.set(false);
            secondaryFields.load(desc.secondaryColour || 0, desc.secondaryColourOrigin, desc.secondaryColourVariableId);
        } else {
            anySecondary.set(true);
            secondaryFields.load(0);
        }

        if (desc.tertiaryColour !== undefined || desc.tertiaryColourOrigin === "variable") {
            anyTertiary.set(false);
            tertiaryFields.load(desc.tertiaryColour || 0, desc.tertiaryColourOrigin, desc.tertiaryColourVariableId);
        } else {
            anyTertiary.set(true);
            tertiaryFields.load(0);
        }
    }

    function persist(): SceneryVisibilityStepDesc {
        const type = TYPE_VALUES[typeIndex.get()];
        const mode = MODE_VALUES[modeIndex.get()] || "visible";
        const desc: SceneryVisibilityStepDesc = {
            type: "sceneryVisibility",
            ...tileTarget.readTarget(),
            mode: mode
        };
        if (type) {
            desc.objectType = type;
        }
        if (!anyObject.get()) {
            const identifier = objectIdentifier.get();
            if (identifier) {
                desc.objectIdentifier = identifier;
            }
        }
        if (!anyHeight.get()) {
            applySource(desc, "baseHeight", heightFields.read());
        }
        if (!anyLocation.get() && (type === "small_scenery" || type === "wall")) {
            applySource(desc, "tileLocation", locationFields.read());
        }
        if (!anyPrimary.get()) {
            applySource(desc, "primaryColour", primaryFields.read());
        }
        if (!anySecondary.get()) {
            applySource(desc, "secondaryColour", secondaryFields.read());
        }
        if (!anyTertiary.get()) {
            applySource(desc, "tertiaryColour", tertiaryFields.read());
        }
        return desc;
    }

    const widgets = [
        groupbox({
            text: "Scenery Visibility",
            visibility,
            content: [
                ...tileTarget.widgets,
                horizontal([
                    label({
                        text: "Type",
                        width: 70,
                        visibility
                    }),
                    dropdown({
                        items: TYPE_LABELS,
                        selectedIndex: twoway(typeIndex),
                        visibility,
                        onChange: (index) => {
                            typeIndex.set(index);
                            onPersist();
                        }
                    }),
                    pickIconButton({
                        tooltip: "Pick Object",
                        visibility,
                        onClick: () => {
                            pickScenery((picked) => {
                                tileTarget.setAbsoluteTile(picked.tile);
                                typeIndex.set(typeToIndex(picked.objectType));
                                anyObject.set(false);
                                objectIdentifier.set(picked.objectIdentifier);
                                anyHeight.set(false);
                                heightFields.load(picked.baseHeight);
                                if (picked.tileLocation !== undefined) {
                                    anyLocation.set(false);
                                    locationFields.load(picked.tileLocation);
                                } else {
                                    anyLocation.set(true);
                                    locationFields.load(0);
                                }
                                anyPrimary.set(false);
                                primaryFields.load(picked.primaryColour);
                                anySecondary.set(false);
                                secondaryFields.load(picked.secondaryColour);
                                anyTertiary.set(false);
                                tertiaryFields.load(picked.tertiaryColour);
                                onPersist();
                            });
                        }
                    })
                ]),
                horizontal([
                    label({
                        text: "Object",
                        width: 70,
                        visibility
                    }),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyObject),
                        visibility,
                        onChange: (checked) => {
                            anyObject.set(checked);
                            onPersist();
                        }
                    }),
                    label({
                        text: objectLabel,
                        visibility
                    })
                ]),
                horizontal([
                    label({
                        text: "Height",
                        width: 70,
                        visibility
                    }),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyHeight),
                        visibility,
                        onChange: (checked) => {
                            anyHeight.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...heightFields.widgets,
                horizontal([
                    label({
                        text: "Location",
                        width: 70,
                        visibility
                    }),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyLocation),
                        disabled: compute(typeIndex, (idx) => {
                            const type = TYPE_VALUES[idx];
                            return type !== "small_scenery" && type !== "wall";
                        }),
                        visibility,
                        onChange: (checked) => {
                            anyLocation.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...locationFields.widgets,
                horizontal([
                    label({
                        text: "Primary Colour",
                        width: 90,
                        visibility
                    }),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyPrimary),
                        visibility,
                        onChange: (checked) => {
                            anyPrimary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...primaryFields.widgets,
                horizontal([
                    label({
                        text: "Secondary Colour",
                        width: 90,
                        visibility
                    }),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anySecondary),
                        visibility,
                        onChange: (checked) => {
                            anySecondary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...secondaryFields.widgets,
                horizontal([
                    label({
                        text: "Tertiary Colour",
                        width: 90,
                        visibility
                    }),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyTertiary),
                        visibility,
                        onChange: (checked) => {
                            anyTertiary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...tertiaryFields.widgets,
                horizontal([
                    label({
                        text: "Mode",
                        width: 70,
                        visibility
                    }),
                    dropdown({
                        items: MODE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        visibility,
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

export type SceneryVisibilityFields = ReturnType<typeof createSceneryVisibilityFields>;
