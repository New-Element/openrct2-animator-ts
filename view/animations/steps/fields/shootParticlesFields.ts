/// <reference path="./../../../../openrct2.d.ts" />

import {colourPicker, groupbox, horizontal, label, spinner, store, twoway, WritableStore} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import {ShootParticlesStepDesc} from "../../../../model/animation/jsonTypes";
import {createParticleLaunchFields} from "./particleLaunchFields";
import {RideSelectFields} from "./rideSelectFields";

function numberRow(
    text: string,
    value: WritableStore<number>,
    minimum: number,
    maximum: number,
    visibility: WritableStore<"visible" | "none">,
    onPersist: () => void
) {
    return horizontal([
        label({text: text, width: 70, visibility: visibility}),
        spinner({
            step: spinnerStep,
            value: twoway(value),
            minimum: minimum,
            maximum: maximum,
            visibility: visibility,
            onChange: (next) => {
                value.set(next);
                onPersist();
            }
        })
    ]);
}

function colourRow(
    text: string,
    value: WritableStore<number>,
    visibility: WritableStore<"visible" | "none">,
    onPersist: () => void
) {
    return horizontal([
        label({text: text, width: 70, visibility: visibility}),
        colourPicker({
            colour: twoway(value),
            visibility: visibility,
            onChange: (colour) => {
                value.set(colour);
                onPersist();
            }
        })
    ]);
}

export function createShootParticlesFields(onPersist: () => void, rideSelect: RideSelectFields) {
    const visibility = store<"visible" | "none">("none");
    const count = store<number>(24);
    const direction = store<number>(0);
    const tilt = store<number>(0);
    const spread = store<number>(12);
    const distance = store<number>(3);
    const lifetime = store<number>(40);
    const body = store<number>(17);
    const trim = store<number>(20);
    const body2 = store<number>(28);
    const trim2 = store<number>(21);
    const launch = createParticleLaunchFields({
        onPersist: onPersist,
        visibility: visibility,
        rideSelect: rideSelect,
        carTitle: "Launch From Car"
    });

    function hide(): void {
        visibility.set("none");
        launch.hide();
    }

    function load(desc: ShootParticlesStepDesc): void {
        visibility.set("visible");
        count.set(desc.count);
        direction.set(desc.direction);
        tilt.set(desc.tilt);
        spread.set(desc.spread);
        distance.set(desc.distance);
        lifetime.set(desc.lifetime);
        body.set(desc.body);
        trim.set(desc.trim);
        body2.set(desc.body2);
        trim2.set(desc.trim2);
        launch.load(desc);
    }

    function persist(): ShootParticlesStepDesc {
        const from = launch.read();
        const numbers = {
            type: "shootParticles" as const,
            count: count.get(),
            direction: direction.get(),
            tilt: tilt.get(),
            spread: spread.get(),
            distance: distance.get(),
            lifetime: lifetime.get(),
            body: body.get(),
            trim: trim.get(),
            body2: body2.get(),
            trim2: trim2.get()
        };
        if (from.launch === "tile") {
            return {
                ...numbers,
                launch: "tile",
                tile: from.tile,
                z: from.z
            };
        }
        return {
            ...numbers,
            launch: "car",
            ...from.target
        };
    }

    const widgets = [
        groupbox({
            text: "Shoot Particles",
            visibility,
            content: [
                ...launch.widgets,
                numberRow("Count", count, 1, 60, visibility, onPersist),
                numberRow("Direction", direction, 0, 359, visibility, onPersist),
                numberRow("Tilt", tilt, 0, 90, visibility, onPersist),
                numberRow("Spread", spread, 0, 90, visibility, onPersist),
                numberRow("Distance", distance, 1, 30, visibility, onPersist),
                numberRow("Lifetime", lifetime, 2, 200, visibility, onPersist),
                colourRow("Body", body, visibility, onPersist),
                colourRow("Trim", trim, visibility, onPersist),
                colourRow("Body 2", body2, visibility, onPersist),
                colourRow("Trim 2", trim2, visibility, onPersist)
            ]
        }),
        ...launch.vehicleWidgets
    ];

    return {hide, load, persist, widgets};
}

export type ShootParticlesFields = ReturnType<typeof createShootParticlesFields>;
