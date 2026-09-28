/// <reference path="./../../../../openrct2.d.ts" />

import {compute, dropdown, horizontal, label, spinner, store, twoway, WritableStore} from "openrct2-flexui";
import {spinnerStep} from "../../../ui/spinnerStep";
import TileCoords from "../../../../game/tileCoords";
import {CreateParticleLaunch, VehicleTargetDesc} from "../../../../model/animation/jsonTypes";
import {goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickTile} from "../../../ui/pickTile";
import {createVehicleTargetFields} from "./vehicleTargetFields";
import {RideSelectFields} from "./rideSelectFields";

const LAUNCH_LABELS = ["Car", "Tile Centre"];

export type ParticleLaunchInput = VehicleTargetDesc & {
    launch?: CreateParticleLaunch;
    tile?: TileCoords;
    z?: number;
};

export function createParticleLaunchFields(args: {
    onPersist: () => void;
    visibility: WritableStore<"visible" | "none">;
    rideSelect: RideSelectFields;
    carTitle: string;
}) {
    const launchIndex = store<number>(0);
    const tileX = store<number>(0);
    const tileY = store<number>(0);
    const z = store<number>(0);
    const tileVisibility = compute(args.visibility, launchIndex, (shown, index) => (
        shown === "visible" && index === 1 ? "visible" : "none" as const
    ));
    const vehicle = createVehicleTargetFields(args.rideSelect, args.onPersist, {
        carTitle: args.carTitle,
        allowTrigger: false
    });

    function sync(): void {
        const shown = args.visibility.get() === "visible" && launchIndex.get() === 0;
        vehicle.setShown(shown);
    }

    function hide(): void {
        vehicle.hide();
    }

    function load(desc: ParticleLaunchInput): void {
        launchIndex.set(desc.launch === "tile" ? 1 : 0);
        tileX.set(desc.tile && typeof desc.tile.x === "number" ? desc.tile.x : 0);
        tileY.set(desc.tile && typeof desc.tile.y === "number" ? desc.tile.y : 0);
        z.set(typeof desc.z === "number" ? desc.z : 0);
        vehicle.load({...desc, useTriggerTarget: false}, true);
        sync();
    }

    function read(): {
        launch: CreateParticleLaunch;
        tile: TileCoords;
        z: number;
        target: ReturnType<typeof vehicle.readTarget>;
    } {
        return {
            launch: launchIndex.get() === 1 ? "tile" : "car",
            tile: {x: tileX.get(), y: tileY.get()},
            z: z.get(),
            target: vehicle.readTarget()
        };
    }

    const widgets = [
        horizontal([
            label({text: "Launch From", width: 70}),
            dropdown({
                items: LAUNCH_LABELS,
                selectedIndex: twoway(launchIndex),
                onChange: (index) => {
                    launchIndex.set(index);
                    sync();
                    args.onPersist();
                }
            })
        ]),
        horizontal([
            label({text: "X", width: 55, visibility: tileVisibility}),
            spinner({
                step: spinnerStep,
                value: twoway(tileX),
                minimum: 0,
                maximum: 10000,
                visibility: tileVisibility,
                onChange: (value) => {
                    tileX.set(value);
                    args.onPersist();
                }
            }),
            label({text: "Y", width: 20, visibility: tileVisibility}),
            spinner({
                step: spinnerStep,
                value: twoway(tileY),
                minimum: 0,
                maximum: 10000,
                visibility: tileVisibility,
                onChange: (value) => {
                    tileY.set(value);
                    args.onPersist();
                }
            }),
            pickIconButton({
                tooltip: "Pick Tile",
                visibility: tileVisibility,
                onClick: () => {
                    pickTile((tile) => {
                        tileX.set(tile.x);
                        tileY.set(tile.y);
                        args.onPersist();
                    });
                }
            }),
            goToTileButton({
                visibility: tileVisibility,
                getTile: () => ({x: tileX.get(), y: tileY.get()})
            })
        ]),
        horizontal([
            label({text: "Z", width: 55, visibility: tileVisibility}),
            spinner({
                step: spinnerStep,
                value: twoway(z),
                minimum: 0,
                maximum: 10000,
                visibility: tileVisibility,
                onChange: (value) => {
                    z.set(value);
                    args.onPersist();
                }
            })
        ])
    ];

    return {widgets, vehicleWidgets: vehicle.widgets, hide, load, read, sync};
}
