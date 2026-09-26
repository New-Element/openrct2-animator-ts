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
    GuestAnimationStepDesc,
    GuestClothesStepDesc,
    GuestFavouriteRideStepDesc,
    GuestFlagStepDesc,
    GuestItemStepDesc,
    GuestMoveStepDesc,
    GuestNeedStepDesc,
    NumberSourceOrigin
} from "../../../../model/animation/jsonTypes";
import {createPeepTargetFields} from "../../../triggers/conditions/fields/peepTargetFields";
import {createColourSourceFields} from "./colourSourceFields";
import {createCoordsSourceFields} from "./coordsSourceFields";
import {createNumberSourceFields} from "./numberSourceFields";
import {createOptionalRidePickFields} from "./rideTargetFields";
import {
    GUEST_ANIMATIONS,
    GUEST_ITEMS,
    GUEST_NEED_FIELDS,
    GUEST_NEED_LABELS,
    indexOfValue,
    labelsForValues,
    ON_OFF_TOGGLE,
    ON_OFF_TOGGLE_LABELS,
    PEEP_FLAGS
} from "../../../triggers/conditions/labels";

const ANIMATION_LABELS = labelsForValues(GUEST_ANIMATIONS);
const ITEM_LABELS = labelsForValues(GUEST_ITEMS);
const FLAG_LABELS = labelsForValues(PEEP_FLAGS);

export function createGuestStepFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const guest = createPeepTargetFields(onPersist, "guest");
    const favouriteRide = createOptionalRidePickFields(onPersist);

    const needVisibility = store<"visible" | "none">("none");
    const clothesVisibility = store<"visible" | "none">("none");
    const favouriteVisibility = store<"visible" | "none">("none");
    const itemVisibility = store<"visible" | "none">("none");
    const animationVisibility = store<"visible" | "none">("none");
    const flagVisibility = store<"visible" | "none">("none");
    const moveVisibility = store<"visible" | "none">("none");

    const needIndex = store<number>(0);
    const setTshirt = store<boolean>(false);
    const setTrousers = store<boolean>(false);
    const setHat = store<boolean>(false);
    const setBalloon = store<boolean>(false);
    const setUmbrella = store<boolean>(false);
    const tshirtVisibility = compute(clothesVisibility, setTshirt, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const trousersVisibility = compute(clothesVisibility, setTrousers, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const hatVisibility = compute(clothesVisibility, setHat, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const balloonVisibility = compute(clothesVisibility, setBalloon, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const umbrellaVisibility = compute(clothesVisibility, setUmbrella, (shown, set) => (
        shown === "visible" && set ? "visible" : "none" as const
    ));
    const needValueFields = createNumberSourceFields({
        valueType: "int",
        label: "Value",
        minimum: 0,
        maximum: 255,
        onPersist: onPersist,
        visibility: needVisibility
    });
    const tshirtFields = createColourSourceFields({label: "T-Shirt", onPersist: onPersist, visibility: tshirtVisibility});
    const trousersFields = createColourSourceFields({label: "Trousers", onPersist: onPersist, visibility: trousersVisibility});
    const hatFields = createColourSourceFields({label: "Hat", onPersist: onPersist, visibility: hatVisibility});
    const balloonFields = createColourSourceFields({label: "Balloon", onPersist: onPersist, visibility: balloonVisibility});
    const umbrellaFields = createColourSourceFields({label: "Umbrella", onPersist: onPersist, visibility: umbrellaVisibility});

    function applyColour(
        desc: GuestClothesStepDesc,
        field: "tshirtColour" | "trousersColour" | "hatColour" | "balloonColour" | "umbrellaColour",
        source: {value: number; origin?: NumberSourceOrigin; variableId?: string}
    ): void {
        desc[field] = source.value;
        if (source.origin === "variable") {
            desc[`${field}Origin`] = "variable";
            desc[`${field}VariableId`] = source.variableId || "";
        }
    }
    const itemIndex = store<number>(0);
    const animationIndex = store<number>(0);
    const flagIndex = store<number>(0);
    const modeIndex = store<number>(0);
    const coordsSource = createCoordsSourceFields(onPersist, moveVisibility);

    function hideExtras(): void {
        needVisibility.set("none");
        clothesVisibility.set("none");
        favouriteVisibility.set("none");
        favouriteRide.hide();
        itemVisibility.set("none");
        animationVisibility.set("none");
        flagVisibility.set("none");
        moveVisibility.set("none");
    }

    function hide(): void {
        visibility.set("none");
        guest.hide();
        hideExtras();
    }

    function showBase(): void {
        visibility.set("visible");
        hideExtras();
    }

    function loadNeed(desc: GuestNeedStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        needIndex.set(indexOfValue(GUEST_NEED_FIELDS, desc.field));
        needValueFields.load(desc.value, desc.valueOrigin, desc.valueVariableId);
        needVisibility.set("visible");
    }

    function loadClothes(desc: GuestClothesStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        setTshirt.set(desc.tshirtColour !== undefined || desc.tshirtColourOrigin === "variable");
        tshirtFields.load(desc.tshirtColour || 0, desc.tshirtColourOrigin, desc.tshirtColourVariableId);
        setTrousers.set(desc.trousersColour !== undefined || desc.trousersColourOrigin === "variable");
        trousersFields.load(desc.trousersColour || 0, desc.trousersColourOrigin, desc.trousersColourVariableId);
        setHat.set(desc.hatColour !== undefined || desc.hatColourOrigin === "variable");
        hatFields.load(desc.hatColour || 0, desc.hatColourOrigin, desc.hatColourVariableId);
        setBalloon.set(desc.balloonColour !== undefined || desc.balloonColourOrigin === "variable");
        balloonFields.load(desc.balloonColour || 0, desc.balloonColourOrigin, desc.balloonColourVariableId);
        setUmbrella.set(desc.umbrellaColour !== undefined || desc.umbrellaColourOrigin === "variable");
        umbrellaFields.load(desc.umbrellaColour || 0, desc.umbrellaColourOrigin, desc.umbrellaColourVariableId);
        clothesVisibility.set("visible");
    }

    function loadFavourite(desc: GuestFavouriteRideStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        favouriteRide.load(desc.rideId);
        favouriteVisibility.set("visible");
    }

    function loadItem(desc: GuestItemStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        itemIndex.set(indexOfValue(GUEST_ITEMS, desc.item));
        itemVisibility.set("visible");
    }

    function loadAnimation(desc: GuestAnimationStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        animationIndex.set(indexOfValue(GUEST_ANIMATIONS, desc.animation));
        animationVisibility.set("visible");
    }

    function loadFlag(desc: GuestFlagStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        flagIndex.set(indexOfValue(PEEP_FLAGS, desc.flag));
        modeIndex.set(indexOfValue(ON_OFF_TOGGLE, desc.mode));
        flagVisibility.set("visible");
    }

    function loadMove(desc: GuestMoveStepDesc): void {
        showBase();
        guest.load(desc.useTriggerGuest !== false, desc.guestId);
        moveVisibility.set("visible");
        coordsSource.load(desc);
    }

    function guestTarget(): {useTriggerGuest: boolean; guestId?: number} {
        const read = guest.read();
        if (read.useTrigger) {
            return {useTriggerGuest: true};
        }
        const data: {useTriggerGuest: boolean; guestId?: number} = {useTriggerGuest: false};
        if (typeof read.id === "number") {
            data.guestId = read.id;
        }
        return data;
    }

    function persistNeedValue(): {value: number; valueOrigin?: NumberSourceOrigin; valueVariableId?: string} {
        const source = needValueFields.read();
        return {
            value: source.value,
            ...(source.origin === "variable" ? {valueOrigin: "variable" as const, valueVariableId: source.variableId || ""} : {})
        };
    }

    function persistNeed(): GuestNeedStepDesc {
        return {
            type: "guestNeed",
            ...guestTarget(),
            field: GUEST_NEED_FIELDS[needIndex.get()] || "happiness",
            ...persistNeedValue()
        };
    }

    function persistClothes(): GuestClothesStepDesc {
        const desc: GuestClothesStepDesc = {type: "guestClothes", ...guestTarget()};
        if (setTshirt.get()) {
            applyColour(desc, "tshirtColour", tshirtFields.read());
        }
        if (setTrousers.get()) {
            applyColour(desc, "trousersColour", trousersFields.read());
        }
        if (setHat.get()) {
            applyColour(desc, "hatColour", hatFields.read());
        }
        if (setBalloon.get()) {
            applyColour(desc, "balloonColour", balloonFields.read());
        }
        if (setUmbrella.get()) {
            applyColour(desc, "umbrellaColour", umbrellaFields.read());
        }
        return desc;
    }

    function persistFavourite(): GuestFavouriteRideStepDesc {
        const desc: GuestFavouriteRideStepDesc = {type: "guestFavouriteRide", ...guestTarget()};
        const rideId = favouriteRide.read();
        if (typeof rideId === "number") {
            desc.rideId = rideId;
        }
        return desc;
    }

    function persistItem(type: "guestGiveItem" | "guestRemoveItem"): GuestItemStepDesc {
        return {
            type: type,
            ...guestTarget(),
            item: GUEST_ITEMS[itemIndex.get()] || GUEST_ITEMS[0]
        };
    }

    function persistAnimation(): GuestAnimationStepDesc {
        return {
            type: "guestAnimation",
            ...guestTarget(),
            animation: GUEST_ANIMATIONS[animationIndex.get()] || GUEST_ANIMATIONS[0]
        };
    }

    function persistFlag(): GuestFlagStepDesc {
        return {
            type: "guestFlag",
            ...guestTarget(),
            flag: PEEP_FLAGS[flagIndex.get()] || PEEP_FLAGS[0],
            mode: ON_OFF_TOGGLE[modeIndex.get()] || "on"
        };
    }

    function persistMove(): GuestMoveStepDesc {
        return {
            type: "guestMove",
            ...guestTarget(),
            ...coordsSource.read()
        };
    }

    const widgets = [
        groupbox({
            text: "Guest",
            visibility,
            content: [
                ...guest.widgets,
                horizontal([
                    label({text: "Need", width: 70, visibility: needVisibility}),
                    dropdown({
                        items: GUEST_NEED_LABELS,
                        selectedIndex: twoway(needIndex),
                        visibility: needVisibility,
                        onChange: (index) => {
                            needIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...needValueFields.widgets,
                horizontal([
                    label({text: "T-Shirt", width: 70, visibility: clothesVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setTshirt),
                        visibility: clothesVisibility,
                        onChange: (checked) => {
                            setTshirt.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...tshirtFields.widgets,
                horizontal([
                    label({text: "Trousers", width: 70, visibility: clothesVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setTrousers),
                        visibility: clothesVisibility,
                        onChange: (checked) => {
                            setTrousers.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...trousersFields.widgets,
                horizontal([
                    label({text: "Hat", width: 70, visibility: clothesVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setHat),
                        visibility: clothesVisibility,
                        onChange: (checked) => {
                            setHat.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...hatFields.widgets,
                horizontal([
                    label({text: "Balloon", width: 70, visibility: clothesVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setBalloon),
                        visibility: clothesVisibility,
                        onChange: (checked) => {
                            setBalloon.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...balloonFields.widgets,
                horizontal([
                    label({text: "Umbrella", width: 70, visibility: clothesVisibility}),
                    checkbox({
                        text: "Set",
                        isChecked: twoway(setUmbrella),
                        visibility: clothesVisibility,
                        onChange: (checked) => {
                            setUmbrella.set(checked);
                            onPersist();
                        }
                    })
                ]),
                ...umbrellaFields.widgets,
                ...favouriteRide.widgets,
                horizontal([
                    label({text: "Item", width: 70, visibility: itemVisibility}),
                    dropdown({
                        items: ITEM_LABELS,
                        selectedIndex: twoway(itemIndex),
                        visibility: itemVisibility,
                        onChange: (index) => {
                            itemIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Animation", width: 70, visibility: animationVisibility}),
                    dropdown({
                        items: ANIMATION_LABELS,
                        selectedIndex: twoway(animationIndex),
                        visibility: animationVisibility,
                        onChange: (index) => {
                            animationIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                horizontal([
                    label({text: "Flag", width: 70, visibility: flagVisibility}),
                    dropdown({
                        items: FLAG_LABELS,
                        selectedIndex: twoway(flagIndex),
                        visibility: flagVisibility,
                        onChange: (index) => {
                            flagIndex.set(index);
                            onPersist();
                        }
                    }),
                    dropdown({
                        items: ON_OFF_TOGGLE_LABELS,
                        selectedIndex: twoway(modeIndex),
                        visibility: flagVisibility,
                        onChange: (index) => {
                            modeIndex.set(index);
                            onPersist();
                        }
                    })
                ]),
                ...coordsSource.widgets
            ]
        })
    ];

    return {
        hide,
        loadNeed,
        loadClothes,
        loadFavourite,
        loadItem,
        loadAnimation,
        loadFlag,
        loadMove,
        persistNeed,
        persistClothes,
        persistFavourite,
        persistItem,
        persistAnimation,
        persistFlag,
        persistMove,
        widgets
    };
}

export type GuestStepFields = ReturnType<typeof createGuestStepFields>;
