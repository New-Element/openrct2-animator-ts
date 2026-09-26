/// <reference path="./../../../../openrct2.d.ts" />

import {
    checkbox,
    compute,
    dropdown,
    horizontal,
    label,
    spinner,
    store,
    twoway,
    WritableStore
} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {SceneryObjectType, TileTargetDesc} from "../../../../model/animation/jsonTypes";
import {resolveSceneryObject} from "../../../../model/animation/step/scenery/sceneryQuery";
import {pickIconButton} from "../../../ui/mapIconButtons";
import {PickedScenery, pickScenery} from "../../../ui/pickScenery";
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

export type SceneryTargetDesc = TileTargetDesc & {
    objectType?: SceneryObjectType;
    objectIdentifier?: string;
    baseHeight?: number;
    tileLocation?: number;
};

/**
 * Shared Type / Object / Height / Location targeting for scenery steps.
 */
export function createSceneryTargetFields(
    onPersist: () => void,
    visibility: WritableStore<"visible" | "none">,
    onPicked?: (picked: PickedScenery) => void
) {
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
    const baseHeight = store<number>(0);
    const anyLocation = store<boolean>(true);
    const tileLocation = store<number>(0);
    const locationDisabled = compute(anyLocation, typeIndex, (any, idx) => {
        if (any) {
            return true;
        }
        const type = TYPE_VALUES[idx];
        return type !== "small_scenery" && type !== "wall";
    });

    function load(desc: SceneryTargetDesc): void {
        tileTarget.load(desc);
        typeIndex.set(typeToIndex(desc.objectType));
        const hasObject = !!desc.objectIdentifier;
        anyObject.set(!hasObject);
        objectIdentifier.set(desc.objectIdentifier || "");
        if (desc.baseHeight !== undefined) {
            anyHeight.set(false);
            baseHeight.set(desc.baseHeight);
        } else {
            anyHeight.set(true);
            baseHeight.set(0);
        }
        if (desc.tileLocation !== undefined) {
            anyLocation.set(false);
            tileLocation.set(desc.tileLocation);
        } else {
            anyLocation.set(true);
            tileLocation.set(0);
        }
    }

    function persistTarget(): SceneryTargetDesc {
        const type = TYPE_VALUES[typeIndex.get()];
        const desc: SceneryTargetDesc = {
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
            desc.baseHeight = baseHeight.get();
        }
        if (!anyLocation.get() && (type === "small_scenery" || type === "wall")) {
            desc.tileLocation = tileLocation.get();
        }
        return desc;
    }

    function applyPicked(picked: PickedScenery): void {
        tileTarget.setAbsoluteTile(picked.tile);
        typeIndex.set(typeToIndex(picked.objectType));
        anyObject.set(false);
        objectIdentifier.set(picked.objectIdentifier);
        anyHeight.set(false);
        baseHeight.set(picked.baseHeight);
        if (picked.tileLocation !== undefined) {
            anyLocation.set(false);
            tileLocation.set(picked.tileLocation);
        } else {
            anyLocation.set(true);
        }
        if (onPicked) {
            onPicked(picked);
        }
        onPersist();
    }

    const widgets = [
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
                    pickScenery(applyPicked);
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
            spinner({
                step: spinnerStep,
                value: twoway(baseHeight),
                minimum: 0,
                maximum: 10000,
                disabled: compute(anyHeight, (any) => any),
                visibility,
                onChange: (value) => {
                    baseHeight.set(value);
                    onPersist();
                }
            })
        ]),
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
            }),
            spinner({
                step: spinnerStep,
                value: twoway(tileLocation),
                minimum: 0,
                maximum: 3,
                disabled: locationDisabled,
                visibility,
                onChange: (value) => {
                    tileLocation.set(value);
                    onPersist();
                }
            })
        ])
    ];

    return {load, persistTarget, widgets};
}

export type SceneryTargetFieldsUi = ReturnType<typeof createSceneryTargetFields>;
