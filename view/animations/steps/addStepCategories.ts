import {error} from "../../../model/logger";
import {StepUiModule} from "./stepUiTypes";

export type AddStepCategory = {
    label: string;
    addLabels: readonly string[];
};

/** Add-step menu. Labels must match each module's addLabel. */
export const ADD_STEP_CATEGORIES: readonly AddStepCategory[] = [
    {
        label: "Flow",
        addLabels: ["Wait", "Branch", "Run Custom Javascript"]
    },
    {
        label: "Animation Context",
        addLabels: ["Set Context", "Add To Context", "Remove From Context", "Write Trigger Tile"]
    },
    {
        label: "Variables",
        addLabels: ["Set Variable", "Increment Variable", "Decrement Variable", "Random Integer"]
    },
    {
        label: "Cars",
        addLabels: [
            "Set Car Coords",
            "Car Coords Over Time",
            "Move Car To Track",
            "Recolour Car",
            "Car Velocity",
            "Car Acceleration",
            "Car Mass",
            "Car Bank Rotation",
            "Car Spin",
            "Car Powered Acceleration",
            "Car Powered Max Speed",
            "Car Travel By",
            "Car Reversed",
            "Car Crashed",
            "Car Status",
            "Write Car Coords",
            "Write Car Track Direction"
        ]
    },
    {
        label: "Trains",
        addLabels: ["Recolour Train", "Train Coords Over Time", "Track Position Over Time"]
    },
    {
        label: "Track",
        addLabels: [
            "Set Track Height",
            "Switch TI Track Order",
            "Chain Lift",
            "Lift/Drop Track",
            "Track Colour Scheme",
            "Seat Rotation",
            "Track Inverted",
            "Brake / Booster Speed",
            "Track Highlighted",
            "Block Brake"
        ]
    },
    {
        label: "Rides",
        addLabels: [
            "Ride Status",
            "Ride Vehicle Colours",
            "Ride Track Colours",
            "Ride Station Style",
            "Ride Music",
            "Ride Station Start",
            "Ride Mode",
            "Ride Depart Flags",
            "Ride Min Wait",
            "Ride Max Wait",
            "Ride Lift Hill Speed",
            "Ride Breakdown",
            "Fix Breakdown"
        ]
    },
    {
        label: "Guests",
        addLabels: [
            "Spawn Guest",
            "Guest Move",
            "Guest Need",
            "Guest Clothes",
            "Guest Favourite Ride",
            "Give Guest Item",
            "Remove Guest Item",
            "Guest Animation",
            "Guest Flag",
            "Write Guest Coords",
            "Write Guest Direction"
        ]
    },
    {
        label: "Staff",
        addLabels: [
            "Set Staff Coords",
            "Staff Costume",
            "Staff Orders",
            "Staff Patrol",
            "Staff Animation",
            "Staff Flag",
            "Write Staff Coords",
            "Write Staff Direction"
        ]
    },
    {
        label: "Scenery",
        addLabels: [
            "Scenery Visibility",
            "Recolour Scenery",
            "Rotate Scenery",
            "Banner Text",
            "Banner Colours",
            "Banner No Entry"
        ]
    },
    {
        label: "Land",
        addLabels: ["Land Height", "Water Height", "Land Slope", "Surface Style", "Edge Style", "Grass Length"]
    },
    {
        label: "Path Additions",
        addLabels: ["Path Addition Vandalised", "Bin Full", "Path Litter"]
    },
    {
        label: "Particles",
        addLabels: ["Create Particle", "Shoot Particles"]
    },
    {
        label: "Park",
        addLabels: [
            "Park Message",
            "Freeze Weather",
            "Park Cash",
            "Park Rating",
            "Grant Award",
            "Clear Awards",
            "Park Date"
        ]
    },
    {
        label: "View",
        addLabels: ["Viewport Camera", "Write Camera Rotation", "Game Pause", "Game Speed"]
    }
];

/**
 * Puts each step module into its add-menu category, in category order.
 * Logs an error if a listed label has no module, or a module is left out.
 */
export function groupAddStepModules(modules: StepUiModule[]): StepUiModule[][] {
    const byLabel: {[label: string]: StepUiModule} = {};
    for (let i = 0; i < modules.length; i++) {
        byLabel[modules[i].addLabel] = modules[i];
    }

    const seen: {[label: string]: boolean} = {};
    const groups: StepUiModule[][] = [];
    for (let c = 0; c < ADD_STEP_CATEGORIES.length; c++) {
        const category = ADD_STEP_CATEGORIES[c];
        const group: StepUiModule[] = [];
        for (let i = 0; i < category.addLabels.length; i++) {
            const label = category.addLabels[i];
            const module = byLabel[label];
            if (!module) {
                error("step", `Add step menu lists unknown step "${label}" in ${category.label}`);
                continue;
            }
            seen[label] = true;
            group.push(module);
        }
        groups.push(group);
    }

    for (let i = 0; i < modules.length; i++) {
        if (!seen[modules[i].addLabel]) {
            error("step", `Step "${modules[i].addLabel}" is not in the add step menu`);
        }
    }

    return groups;
}
