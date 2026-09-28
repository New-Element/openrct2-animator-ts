/// <reference path="./../../../../openrct2.d.ts" />

import {dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import {CreateParticleKind, CreateParticleStepDesc} from "../../../../model/animation/jsonTypes";
import {indexOfValue} from "../../../triggers/conditions/labels";
import {createParticleLaunchFields} from "./particleLaunchFields";
import {RideSelectFields} from "./rideSelectFields";

const KINDS: CreateParticleKind[] = ["steam", "explosionCloud", "explosionFlare"];
const KIND_LABELS = ["Steam", "Explosion Cloud", "Explosion Flare"];

export function createParticleFields(onPersist: () => void, rideSelect: RideSelectFields) {
    const visibility = store<"visible" | "none">("none");
    const kindIndex = store<number>(0);
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

    function load(desc: CreateParticleStepDesc): void {
        visibility.set("visible");
        kindIndex.set(indexOfValue(KINDS, desc.particle));
        launch.load(desc);
    }

    function persist(): CreateParticleStepDesc {
        const particle = KINDS[kindIndex.get()] || "steam";
        const from = launch.read();
        if (from.launch === "tile") {
            return {
                type: "createParticle",
                particle: particle,
                launch: "tile",
                tile: from.tile,
                z: from.z
            };
        }
        return {
            type: "createParticle",
            particle: particle,
            launch: "car",
            ...from.target
        };
    }

    const widgets = [
        groupbox({
            text: "Create Particle",
            visibility,
            content: [
                horizontal([
                    label({text: "Particle", width: 70}),
                    dropdown({
                        items: KIND_LABELS,
                        selectedIndex: twoway(kindIndex),
                        onChange: (index) => {
                            kindIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...launch.widgets
            ]
        }),
        ...launch.vehicleWidgets
    ];

    return {hide, load, persist, widgets};
}

export type CreateParticleFields = ReturnType<typeof createParticleFields>;
