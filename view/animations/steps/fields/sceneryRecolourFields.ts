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
import {NumberSourceOrigin, SceneryObjectType, SceneryRecolourStepDesc} from "../../../../model/animation/jsonTypes";
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

function typeToIndex(type: SceneryObjectType | undefined): number {
    for (let i = 0; i < TYPE_VALUES.length; i++) {
        if (TYPE_VALUES[i] === type) {
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

export function createSceneryRecolourFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const tileTarget = createTileTargetFields(onPersist, visibility);
    const typeIndex = store<number>(0);

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
    const heightValueVisibility = compute(visibility, anyHeight, (shown, any) => (
        shown === "visible" && !any ? "visible" : "none" as const
    ));
    const locationValueVisibility = compute(visibility, anyLocation, typeIndex, (shown, any, idx) => {
        const type = TYPE_VALUES[idx];
        return shown === "visible" && !any && (type === "small_scenery" || type === "wall")
            ? "visible"
            : "none" as const;
    });
    const setPrimary = store<boolean>(false);
    const setSecondary = store<boolean>(false);
    const setTertiary = store<boolean>(false);
    const primaryValueVisibility = compute(visibility, setPrimary, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const secondaryValueVisibility = compute(visibility, setSecondary, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const tertiaryValueVisibility = compute(visibility, setTertiary, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
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
        desc: SceneryRecolourStepDesc,
        field: "baseHeight" | "tileLocation" | "setPrimary" | "setSecondary" | "setTertiary",
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

    function load(desc: SceneryRecolourStepDesc): void {
        visibility.set("visible");
        tileTarget.load(desc);
        typeIndex.set(typeToIndex(desc.objectType));
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
        setPrimary.set(desc.setPrimary !== undefined || desc.setPrimaryOrigin === "variable");
        primaryFields.load(desc.setPrimary !== undefined ? desc.setPrimary : 0, desc.setPrimaryOrigin, desc.setPrimaryVariableId);
        setSecondary.set(desc.setSecondary !== undefined || desc.setSecondaryOrigin === "variable");
        secondaryFields.load(desc.setSecondary !== undefined ? desc.setSecondary : 0, desc.setSecondaryOrigin, desc.setSecondaryVariableId);
        setTertiary.set(desc.setTertiary !== undefined || desc.setTertiaryOrigin === "variable");
        tertiaryFields.load(desc.setTertiary !== undefined ? desc.setTertiary : 0, desc.setTertiaryOrigin, desc.setTertiaryVariableId);
    }

    function persist(): SceneryRecolourStepDesc {
        const type = TYPE_VALUES[typeIndex.get()];
        const desc: SceneryRecolourStepDesc = {
            type: "sceneryRecolour",
            ...tileTarget.readTarget()
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
        if (setPrimary.get()) {
            applySource(desc, "setPrimary", primaryFields.read());
        }
        if (setSecondary.get()) {
            applySource(desc, "setSecondary", secondaryFields.read());
        }
        if (setTertiary.get()) {
            applySource(desc, "setTertiary", tertiaryFields.read());
        }
        return desc;
    }

    const widgets = [
        groupbox({
            text: "Recolour Scenery",
            visibility,
            content: [
                ...tileTarget.widgets,
                horizontal([
                    label({text: "Type", width: 70, visibility}),
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
                                onPersist();
                            });
                        }
                    })
                ]),
                horizontal([
                    label({text: "Object", width: 70, visibility}),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyObject),
                        visibility,
                        onChange: (checked) => {
                            anyObject.set(checked);
                            onPersist();
                        }
                    }),
                    label({text: objectLabel, visibility})
                ]),
                horizontal([
                    label({text: "Height", width: 70, visibility}),
                    checkbox({
                        text: "Any",
                        isChecked: twoway(anyHeight),
                        visibility,
                        onChange: (checked) => {
                            anyHeight.set(checked);
                            onPersist();
                        }
                    }),
                ]),
                ...heightFields.widgets,
                horizontal([
                    label({text: "Location", width: 70, visibility}),
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
                    label({text: "Set Primary", width: 90, visibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setPrimary),
                        visibility,
                        onChange: (checked) => {
                            setPrimary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...primaryFields.widgets,
                horizontal([
                    label({text: "Set Secondary", width: 90, visibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setSecondary),
                        visibility,
                        onChange: (checked) => {
                            setSecondary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...secondaryFields.widgets,
                horizontal([
                    label({text: "Set Tertiary", width: 90, visibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setTertiary),
                        visibility,
                        onChange: (checked) => {
                            setTertiary.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...tertiaryFields.widgets
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type SceneryRecolourFields = ReturnType<typeof createSceneryRecolourFields>;
