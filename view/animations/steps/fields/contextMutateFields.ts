/// <reference path="./../../../../openrct2.d.ts" />

import {checkbox, compute, dropdown, groupbox, horizontal, label, store, twoway} from "openrct2-flexui";
import TileCoords from "../../../../game/tileCoords";
import {walkRide} from "../../../../model/animation/trigger/rideCarSnapshot";
import {
    ContextMutateStepDesc,
    ContextOperation,
    ContextSelectorKind,
    ContextSlot
} from "../../../../model/animation/jsonTypes";
import {goToEntityButton, goToRideButton, goToTileButton, pickIconButton} from "../../../ui/mapIconButtons";
import {pickGuest} from "../../../ui/pickGuest";
import {pickRide} from "../../../ui/pickRide";
import {pickStaff} from "../../../ui/pickStaff";
import {pickTile} from "../../../ui/pickTile";
import {indexOfRideId, listParkRides, RideOption, rideNames} from "../../../triggers/rideOptions";

const SLOT_LABELS = ["Ride", "Train", "Car", "Guest", "Staff", "Tile"];
const SLOTS: ContextSlot[] = ["ride", "train", "car", "guest", "staff", "tile"];

type SelectorOption = {kind: ContextSelectorKind; label: string};

function selectorsForSlot(slot: ContextSlot): SelectorOption[] {
    if (slot === "ride") {
        return [{kind: "pick", label: "Pick Ride"}];
    }
    if (slot === "train") {
        return [
            {kind: "allTrainsOfRide", label: "All Trains Of Ride"},
            {kind: "pick", label: "Pick Train"}
        ];
    }
    if (slot === "car") {
        return [
            {kind: "carsOfContextTrains", label: "Cars Of Context Trains"},
            {kind: "carsOfTrain", label: "Cars Of A Train"},
            {kind: "pick", label: "Pick Car"}
        ];
    }
    if (slot === "guest") {
        return [
            {kind: "onTile", label: "Guests On Tile"},
            {kind: "pick", label: "Pick Guest"}
        ];
    }
    if (slot === "staff") {
        return [
            {kind: "onTile", label: "Staff On Tile"},
            {kind: "pick", label: "Pick Staff"}
        ];
    }
    return [{kind: "pick", label: "Pick Tile"}];
}

function selectorLabels(slot: ContextSlot): string[] {
    const options = selectorsForSlot(slot);
    const labels: string[] = [];
    for (let i = 0; i < options.length; i++) {
        labels.push(options[i].label);
    }
    return labels;
}

function selectorIndex(slot: ContextSlot, kind: ContextSelectorKind): number {
    const options = selectorsForSlot(slot);
    for (let i = 0; i < options.length; i++) {
        if (options[i].kind === kind) {
            return i;
        }
    }
    return 0;
}

function entityName(id: number | undefined, type: "guest" | "staff"): string {
    if (typeof id !== "number") {
        return type === "guest" ? "(No Guest)" : "(No Staff)";
    }
    const entity = map.getEntity(id);
    if (!entity || entity.type !== type) {
        return `${type === "guest" ? "Guest" : "Staff"} #${id}`;
    }
    const named = entity as Guest | Staff;
    const name = named.name && named.name.trim() ? named.name : "";
    return name ? name : `${type === "guest" ? "Guest" : "Staff"} #${id}`;
}

function listStaffOptions(): {id: number; name: string}[] {
    const staff = map.getAllEntities("staff");
    const options: {id: number; name: string}[] = [];
    for (let i = 0; i < staff.length; i++) {
        if (staff[i].id === null) {
            continue;
        }
        options.push({
            id: staff[i].id as number,
            name: staff[i].name && staff[i].name.trim() ? staff[i].name : `Staff #${staff[i].id}`
        });
    }
    return options;
}

export function createContextMutateFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const slotIndex = store<number>(1);
    const selectorItems = store<string[]>(selectorLabels("train"));
    const selectorIndexStore = store<number>(0);
    const useContextRide = store<boolean>(true);
    const useContextTiles = store<boolean>(true);
    const rideItems = store<string[]>(["(No Rides)"]);
    const rideIndex = store<number>(0);
    const trainItems = store<string[]>(["(No Trains)"]);
    const trainIndex = store<number>(0);
    const carItems = store<string[]>(["(No Cars)"]);
    const carIndex = store<number>(0);
    const peepLabel = store<string>("(No Guest)");
    const staffItems = store<string[]>(["(No Staff)"]);
    const staffIndex = store<number>(0);
    const tileLabel = store<string>("(No Tile)");
    const hasPickedPeep = store<boolean>(false);
    const rideVisibility = store<"visible" | "none">("none");
    const trainVisibility = store<"visible" | "none">("none");
    const carVisibility = store<"visible" | "none">("none");
    const contextRideVisibility = store<"visible" | "none">("none");
    const contextTileVisibility = store<"visible" | "none">("none");
    const peepVisibility = store<"visible" | "none">("none");
    const staffDropdownVisibility = store<"visible" | "none">("none");
    const tileVisibility = store<"visible" | "none">("none");
    let rideOptions: RideOption[] = [];
    let staffOptions: {id: number; name: string}[] = [];
    let pickedGuestId: number | undefined;
    let pickedStaffId: number | undefined;
    let pickedTile: TileCoords | undefined;
    let operation: ContextOperation = "set";

    function currentSlot(): ContextSlot {
        return SLOTS[slotIndex.get()] || "train";
    }

    function currentSelector(): ContextSelectorKind {
        const options = selectorsForSlot(currentSlot());
        const option = options[selectorIndexStore.get()];
        return option ? option.kind : options[0].kind;
    }

    function refreshRideOptions(preferredId?: number): void {
        rideOptions = listParkRides();
        if (rideOptions.length === 0) {
            rideItems.set(["(No Rides)"]);
            rideIndex.set(0);
            return;
        }
        rideItems.set(rideNames(rideOptions));
        if (typeof preferredId === "number") {
            const index = indexOfRideId(rideOptions, preferredId);
            rideIndex.set(index < 0 ? 0 : index);
        }
    }

    function selectedRideId(): number {
        const ride = rideOptions[rideIndex.get()];
        return ride ? ride.id : 0;
    }

    function refreshTrainOptions(rideId: number, preferred?: number): void {
        const ride = map.getRide(rideId);
        const count = ride ? ride.vehicles.length : 0;
        if (count === 0) {
            trainItems.set(["(No Trains)"]);
            trainIndex.set(0);
            return;
        }
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
            labels.push(`Train ${i + 1}`);
        }
        trainItems.set(labels);
        let index = typeof preferred === "number" ? preferred : trainIndex.get();
        if (index < 0 || index >= count) {
            index = 0;
        }
        trainIndex.set(index);
    }

    function refreshCarOptions(rideId: number, train: number, preferred?: number): void {
        const cars = walkRide(rideId);
        let count = 0;
        for (let i = 0; i < cars.length; i++) {
            if (cars[i].trainIndex === train) {
                count += 1;
            }
        }
        if (count === 0) {
            carItems.set(["(No Cars)"]);
            carIndex.set(0);
            return;
        }
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
            labels.push(`Car ${i + 1}`);
        }
        carItems.set(labels);
        let index = typeof preferred === "number" ? preferred : carIndex.get();
        if (index < 0 || index >= count) {
            index = 0;
        }
        carIndex.set(index);
    }

    function refreshStaffOptions(preferredId?: number): void {
        staffOptions = listStaffOptions();
        if (staffOptions.length === 0) {
            staffItems.set(["(No Staff)"]);
            staffIndex.set(0);
            pickedStaffId = undefined;
            return;
        }
        const labels: string[] = [];
        let selected = 0;
        for (let i = 0; i < staffOptions.length; i++) {
            labels.push(staffOptions[i].name);
            if (preferredId !== undefined && staffOptions[i].id === preferredId) {
                selected = i;
            }
        }
        staffItems.set(labels);
        staffIndex.set(selected);
        pickedStaffId = staffOptions[selected].id;
        hasPickedPeep.set(true);
    }

    function syncSelectorItems(slot: ContextSlot, kind?: ContextSelectorKind): void {
        selectorItems.set(selectorLabels(slot));
        selectorIndexStore.set(kind ? selectorIndex(slot, kind) : 0);
        syncFieldVisibility();
    }

    function shown(on: boolean): "visible" | "none" {
        return visibility.get() === "visible" && on ? "visible" : "none";
    }

    function syncFieldVisibility(): void {
        const slot = currentSlot();
        const selector = currentSelector();
        contextRideVisibility.set(shown(slot === "train" && selector === "allTrainsOfRide"));
        contextTileVisibility.set(shown((slot === "guest" || slot === "staff") && selector === "onTile"));
        rideVisibility.set(
            shown(
                slot === "ride" ||
                    (slot === "train" && selector === "pick") ||
                    (slot === "train" && selector === "allTrainsOfRide" && !useContextRide.get()) ||
                    (slot === "car" && (selector === "carsOfTrain" || selector === "pick"))
            )
        );
        trainVisibility.set(
            shown(
                (slot === "train" && selector === "pick") ||
                    (slot === "car" && (selector === "carsOfTrain" || selector === "pick"))
            )
        );
        carVisibility.set(shown(slot === "car" && selector === "pick"));
        peepVisibility.set(shown((slot === "guest" || slot === "staff") && selector === "pick"));
        staffDropdownVisibility.set(shown(slot === "staff" && selector === "pick"));
        tileVisibility.set(
            shown(
                slot === "tile" ||
                    ((slot === "guest" || slot === "staff") && selector === "onTile" && !useContextTiles.get())
            )
        );
    }

    function hide(): void {
        visibility.set("none");
        syncFieldVisibility();
    }

    function load(desc: ContextMutateStepDesc): void {
        operation = desc.operation;
        visibility.set("visible");
        let slot = 1;
        for (let i = 0; i < SLOTS.length; i++) {
            if (SLOTS[i] === desc.slot) {
                slot = i;
                break;
            }
        }
        slotIndex.set(slot);
        syncSelectorItems(desc.slot, desc.selector);
        useContextRide.set(desc.useContextRide !== false);
        useContextTiles.set(desc.useContextTiles !== false);
        refreshRideOptions(desc.rideId);
        refreshTrainOptions(selectedRideId(), desc.trainIndex);
        refreshCarOptions(selectedRideId(), trainIndex.get(), desc.carIndex);
        pickedGuestId = desc.guestId;
        pickedStaffId = desc.staffId;
        pickedTile = desc.tile ? {x: desc.tile.x, y: desc.tile.y} : undefined;
        hasPickedPeep.set(typeof desc.guestId === "number" || typeof desc.staffId === "number");
        if (desc.slot === "staff" && desc.selector === "pick") {
            refreshStaffOptions(desc.staffId);
        }
        peepLabel.set(
            desc.slot === "staff" ? entityName(desc.staffId, "staff") : entityName(desc.guestId, "guest")
        );
        tileLabel.set(
            pickedTile ? `Tile (${pickedTile.x}, ${pickedTile.y})` : "(No Tile)"
        );
        syncFieldVisibility();
    }

    function persist(): ContextMutateStepDesc {
        const slot = currentSlot();
        const selector = currentSelector();
        const data: ContextMutateStepDesc = {
            type: "contextMutate",
            operation: operation,
            slot: slot,
            selector: selector
        };
        if (selector === "allTrainsOfRide") {
            data.useContextRide = useContextRide.get();
        }
        if (selector === "onTile") {
            data.useContextTiles = useContextTiles.get();
        }
        const needsRide =
            slot === "ride" ||
            (slot === "train" && (selector === "pick" || (selector === "allTrainsOfRide" && !useContextRide.get()))) ||
            (slot === "car" && (selector === "pick" || selector === "carsOfTrain"));
        if (needsRide) {
            data.rideId = selectedRideId();
        }
        const needsTrain =
            (slot === "train" && selector === "pick") ||
            (slot === "car" && (selector === "pick" || selector === "carsOfTrain"));
        if (needsTrain) {
            data.trainIndex = trainIndex.get();
        }
        if (slot === "car" && selector === "pick") {
            data.carIndex = carIndex.get();
        }
        if (slot === "guest" && selector === "pick" && typeof pickedGuestId === "number") {
            data.guestId = pickedGuestId;
        }
        if (slot === "staff" && selector === "pick" && typeof pickedStaffId === "number") {
            data.staffId = pickedStaffId;
        }
        const needsTile =
            slot === "tile" ||
            ((slot === "guest" || slot === "staff") && selector === "onTile" && !useContextTiles.get());
        if (needsTile && pickedTile) {
            data.tile = {x: pickedTile.x, y: pickedTile.y};
        }
        return data;
    }

    const widgets = [
        groupbox({
            text: "Context",
            visibility,
            content: [
                label({text: "Slot", visibility}),
                dropdown({
                    items: SLOT_LABELS,
                    selectedIndex: twoway(slotIndex),
                    visibility,
                    onChange: (index) => {
                        slotIndex.set(index);
                        syncSelectorItems(SLOTS[index] || "train");
                        onPersist();
                    }
                }),
                label({text: "Selector", visibility}),
                dropdown({
                    items: selectorItems,
                    selectedIndex: twoway(selectorIndexStore),
                    visibility,
                    onChange: (index) => {
                        selectorIndexStore.set(index);
                        syncFieldVisibility();
                        onPersist();
                    }
                }),
                checkbox({
                    text: "Use Context Rides",
                    isChecked: twoway(useContextRide),
                    visibility: contextRideVisibility,
                    onChange: (checked) => {
                        useContextRide.set(checked);
                        if (!checked) {
                            refreshRideOptions();
                        }
                        syncFieldVisibility();
                        onPersist();
                    }
                }),
                checkbox({
                    text: "Use Context Tiles",
                    isChecked: twoway(useContextTiles),
                    visibility: contextTileVisibility,
                    onChange: (checked) => {
                        useContextTiles.set(checked);
                        syncFieldVisibility();
                        onPersist();
                    }
                }),
                horizontal({
                    content: [
                        dropdown({
                            items: rideItems,
                            selectedIndex: twoway(rideIndex),
                            visibility: rideVisibility,
                            onChange: (index) => {
                                rideIndex.set(index);
                                refreshTrainOptions(selectedRideId());
                                refreshCarOptions(selectedRideId(), trainIndex.get());
                                onPersist();
                            }
                        }),
                        pickIconButton({
                            tooltip: "Pick Ride",
                            visibility: rideVisibility,
                            onClick: () => {
                                pickRide((rideId) => {
                                    refreshRideOptions(rideId);
                                    refreshTrainOptions(rideId);
                                    refreshCarOptions(rideId, trainIndex.get());
                                    onPersist();
                                });
                            }
                        }),
                        goToRideButton({
                            visibility: rideVisibility,
                            getRideId: () => selectedRideId()
                        })
                    ]
                }),
                dropdown({
                    items: trainItems,
                    selectedIndex: twoway(trainIndex),
                    visibility: trainVisibility,
                    onChange: (index) => {
                        trainIndex.set(index);
                        refreshCarOptions(selectedRideId(), index);
                        onPersist();
                    }
                }),
                dropdown({
                    items: carItems,
                    selectedIndex: twoway(carIndex),
                    visibility: carVisibility,
                    onChange: (index) => {
                        carIndex.set(index);
                        onPersist();
                    }
                }),
                label({
                    text: peepLabel,
                    visibility: peepVisibility
                }),
                horizontal({
                    content: [
                        dropdown({
                            items: staffItems,
                            selectedIndex: twoway(staffIndex),
                            visibility: staffDropdownVisibility,
                            onChange: (index) => {
                                staffIndex.set(index);
                                if (index >= 0 && index < staffOptions.length) {
                                    pickedStaffId = staffOptions[index].id;
                                    hasPickedPeep.set(true);
                                    peepLabel.set(entityName(pickedStaffId, "staff"));
                                }
                                onPersist();
                            }
                        }),
                        pickIconButton({
                            tooltip: "Pick Guest Or Staff",
                            visibility: peepVisibility,
                            onClick: () => {
                                if (currentSlot() === "staff") {
                                    pickStaff((id) => {
                                        pickedStaffId = id;
                                        hasPickedPeep.set(true);
                                        refreshStaffOptions(id);
                                        peepLabel.set(entityName(id, "staff"));
                                        onPersist();
                                    });
                                    return;
                                }
                                pickGuest((id) => {
                                    pickedGuestId = id;
                                    hasPickedPeep.set(true);
                                    peepLabel.set(entityName(id, "guest"));
                                    onPersist();
                                });
                            }
                        }),
                        goToEntityButton({
                            tooltip: "Go To Guest Or Staff",
                            visibility: peepVisibility,
                            disabled: compute(hasPickedPeep, (picked) => !picked),
                            getEntityId: () =>
                                currentSlot() === "staff" ? pickedStaffId : pickedGuestId
                        })
                    ]
                }),
                horizontal({
                    content: [
                        label({
                            text: tileLabel,
                            visibility: tileVisibility
                        }),
                        pickIconButton({
                            tooltip: "Pick Tile",
                            visibility: tileVisibility,
                            onClick: () => {
                                pickTile((tile) => {
                                    pickedTile = {x: tile.x, y: tile.y};
                                    tileLabel.set(`Tile (${tile.x}, ${tile.y})`);
                                    onPersist();
                                });
                            }
                        }),
                        goToTileButton({
                            visibility: tileVisibility,
                            getTile: () => pickedTile
                        })
                    ]
                })
            ]
        })
    ];

    return {hide, load, persist, widgets};
}

export type ContextMutateFields = ReturnType<typeof createContextMutateFields>;
