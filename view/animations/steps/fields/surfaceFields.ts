/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {
    EdgeStyleStepDesc,
    GrassLengthStepDesc,
    LandHeightStepDesc,
    LandSlopeStepDesc,
    SurfaceStyleStepDesc,
    WaterHeightStepDesc
} from "../../../../model/animation/jsonTypes";
import {GRASS_LENGTH_LABELS} from "../../../triggers/conditions/labels";
import {createNumberSourceFields} from "./numberSourceFields";
import {createTileTargetFields} from "./tileTargetFields";

type SurfaceType = "landHeight" | "waterHeight" | "landSlope" | "surfaceStyle" | "edgeStyle" | "grassLength";

const TITLES: {[type in SurfaceType]: string} = {
    landHeight: "Land Height",
    waterHeight: "Water Height",
    landSlope: "Land Slope",
    surfaceStyle: "Surface Style",
    edgeStyle: "Edge Style",
    grassLength: "Grass Length"
};

export function createSurfaceFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const title = store<string>("Surface");
    const tileTarget = createTileTargetFields(onPersist, visibility);
    const grassIndex = store<number>(0);
    const valueVisibility = store<"visible" | "none">("none");
    const grassVisibility = store<"visible" | "none">("none");
    const valueFields = createNumberSourceFields({
        valueType: "int",
        label: "Value",
        minimum: 0,
        maximum: 10000,
        onPersist: onPersist,
        visibility: valueVisibility
    });
    let currentType: SurfaceType = "waterHeight";

    function hide(): void {
        visibility.set("none");
        valueVisibility.set("none");
        grassVisibility.set("none");
    }

    function load(
        desc:
            | LandHeightStepDesc
            | WaterHeightStepDesc
            | LandSlopeStepDesc
            | SurfaceStyleStepDesc
            | EdgeStyleStepDesc
            | GrassLengthStepDesc
    ): void {
        currentType = desc.type;
        visibility.set("visible");
        title.set(TITLES[desc.type]);
        tileTarget.load(desc);
        if (desc.type === "grassLength") {
            grassIndex.set(desc.value);
            valueVisibility.set("none");
            grassVisibility.set("visible");
            return;
        }
        valueFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
        valueVisibility.set("visible");
        grassVisibility.set("none");
    }

    function persist():
        | LandHeightStepDesc
        | WaterHeightStepDesc
        | LandSlopeStepDesc
        | SurfaceStyleStepDesc
        | EdgeStyleStepDesc
        | GrassLengthStepDesc {
        const tile = tileTarget.readTarget();
        if (currentType === "grassLength") {
            return {type: "grassLength", ...tile, value: grassIndex.get()};
        }
        const source = valueFields.read();
        return {
            type: currentType,
            ...tile,
            value: source.value,
            ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {})
        } as
            | LandHeightStepDesc
            | WaterHeightStepDesc
            | LandSlopeStepDesc
            | SurfaceStyleStepDesc
            | EdgeStyleStepDesc;
    }

    const widgets = [
        groupbox({
            text: title,
            visibility,
            content: [
                ...tileTarget.widgets,
                ...valueFields.widgets,
                horizontal([
                    label({text: "Length", width: 70, visibility: grassVisibility}),
                    dropdown({
                        items: GRASS_LENGTH_LABELS,
                        selectedIndex: twoway(grassIndex),
                        visibility: grassVisibility,
                        onChange: (index) => {
                            grassIndex.set(index);
                            onPersist();
                        }
                    })
                ])
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type SurfaceFields = ReturnType<typeof createSurfaceFields>;
