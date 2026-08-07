/// <reference path="./../../../../openrct2.d.ts" />

/**
 * OpenRCT2 Colour.Invisible — empty colour-picker look.
 * Means "leave this channel unchanged" when applying a recolour step.
 */
export const UNSELECTED_COLOUR = 54;

export function isColourSelected(colour: number): boolean {
    return colour !== UNSELECTED_COLOUR;
}

export function unselectedVehicleColour(): VehicleColour {
    return {
        body: UNSELECTED_COLOUR,
        trim: UNSELECTED_COLOUR,
        tertiary: UNSELECTED_COLOUR
    };
}

/** Apply only selected channels; unselected (Invisible) keeps the car's current colour. */
export function mergeVehicleColours(
    current: VehicleColour,
    value: VehicleColour
): VehicleColour {
    return {
        body: isColourSelected(value.body) ? value.body : current.body,
        trim: isColourSelected(value.trim) ? value.trim : current.trim,
        tertiary: isColourSelected(value.tertiary) ? value.tertiary : current.tertiary
    };
}
