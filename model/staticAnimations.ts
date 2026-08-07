import {AnimationDesc, TriggerDesc} from "./animation/jsonTypes";

/**
 * Static triggers/animations for development/testing
 *
 * Set USE_STATIC_ANIMATIONS = true in conductor.ts to use these instead of park storage
 */

export const STATIC_TRIGGERS: TriggerDesc[] = [
    {
        id: "a1000000-0000-4000-8000-000000000001",
        name: "Library: Train Enters Demo Tile",
        event: {
            type: "carEnters",
            rideId: 6,
            tile: { x: 91, y: 135 }
        },
        conditions: [],
        animationIds: ["library-demo-sequence"]
    }
];

export const STATIC_ANIMATIONS: AnimationDesc[] = [
    {
        id: "library-demo-sequence",
        name: "Demo: Wait Then Recolour Car",
        steps: [
            {
                type: "wait",
                ticks: 40
            },
            {
                type: "carEditColour",
                value: { body: 2, trim: 2, tertiary: 2 }
            }
        ]
    }
];
