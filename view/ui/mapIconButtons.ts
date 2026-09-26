/// <reference path="./../../openrct2.d.ts" />

import {Bindable, button, ElementVisibility} from "openrct2-flexui";
import TileCoords from "../../game/tileCoords";

const TILE_SIZE = 32;
/** Advanced Track / Peep Editor locate sprite. */
const LOCATE_SPRITE = 5167;

function iconButton(options: {
    image: number | IconName;
    tooltip: string;
    onClick: () => void;
    visibility?: Bindable<ElementVisibility>;
    disabled?: Bindable<boolean>;
}) {
    return button({
        image: options.image,
        width: 24,
        height: 24,
        tooltip: options.tooltip,
        visibility: options.visibility,
        disabled: options.disabled,
        onClick: options.onClick
    });
}

function canScroll(): boolean {
    return typeof ui !== "undefined";
}

/** Eyedropper used by Peep Editor for map picking. */
export function pickIconButton(options: {
    tooltip: string;
    onClick: () => void;
    visibility?: Bindable<ElementVisibility>;
    disabled?: Bindable<boolean>;
}) {
    return iconButton({
        image: "eyedropper",
        tooltip: options.tooltip,
        onClick: options.onClick,
        visibility: options.visibility,
        disabled: options.disabled
    });
}

export function locateIconButton(options: {
    tooltip: string;
    onClick: () => void;
    visibility?: Bindable<ElementVisibility>;
    disabled?: Bindable<boolean>;
}) {
    return iconButton({
        image: LOCATE_SPRITE,
        tooltip: options.tooltip,
        onClick: options.onClick,
        visibility: options.visibility,
        disabled: options.disabled
    });
}

export function scrollViewportToTile(tile: TileCoords): void {
    if (!canScroll()) {
        return;
    }
    ui.mainViewport.scrollTo({
        x: tile.x * TILE_SIZE,
        y: tile.y * TILE_SIZE
    });
}

export function scrollViewportToEntity(entityId: number): void {
    if (!canScroll()) {
        return;
    }
    const entity = map.getEntity(entityId);
    if (!entity) {
        return;
    }
    ui.mainViewport.scrollTo({
        x: entity.x,
        y: entity.y
    });
}

/** First train, then a station start. */
export function scrollViewportToRide(rideId: number): void {
    if (!canScroll()) {
        return;
    }
    const ride = map.getRide(rideId);
    if (!ride) {
        return;
    }
    const vehicleIds = ride.vehicles;
    for (let i = 0; i < vehicleIds.length; i++) {
        const vehicleId = vehicleIds[i];
        if (vehicleId === null || vehicleId === undefined) {
            continue;
        }
        const entity = map.getEntity(vehicleId);
        if (!entity || entity.type !== "car") {
            continue;
        }
        ui.mainViewport.scrollTo((entity as Car).trackLocation);
        return;
    }
    const stations = ride.stations;
    for (let i = 0; i < stations.length; i++) {
        const start = stations[i].start;
        if (start && (start.x !== 0 || start.y !== 0)) {
            ui.mainViewport.scrollTo(start);
            return;
        }
    }
}

export function goToTileButton(options: {
    getTile: () => TileCoords | null | undefined;
    visibility?: Bindable<ElementVisibility>;
    disabled?: Bindable<boolean>;
    tooltip?: string;
}) {
    return locateIconButton({
        tooltip: options.tooltip || "Go To Tile",
        visibility: options.visibility,
        disabled: options.disabled,
        onClick: () => {
            const tile = options.getTile();
            if (!tile) {
                return;
            }
            scrollViewportToTile(tile);
        }
    });
}

export function goToRideButton(options: {
    getRideId: () => number | null | undefined;
    visibility?: Bindable<ElementVisibility>;
    disabled?: Bindable<boolean>;
}) {
    return locateIconButton({
        tooltip: "Go To Ride",
        visibility: options.visibility,
        disabled: options.disabled,
        onClick: () => {
            const rideId = options.getRideId();
            if (typeof rideId !== "number") {
                return;
            }
            scrollViewportToRide(rideId);
        }
    });
}

export function goToEntityButton(options: {
    getEntityId: () => number | null | undefined;
    tooltip: string;
    visibility?: Bindable<ElementVisibility>;
    disabled?: Bindable<boolean>;
}) {
    return locateIconButton({
        tooltip: options.tooltip,
        visibility: options.visibility,
        disabled: options.disabled,
        onClick: () => {
            const entityId = options.getEntityId();
            if (typeof entityId !== "number") {
                return;
            }
            scrollViewportToEntity(entityId);
        }
    });
}
