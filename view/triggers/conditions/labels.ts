/// <reference path="./../../../openrct2.d.ts" />

import {
    BlockBrakeOp,
    DateField,
    EmptyOp,
    EntityScope,
    ExistsOp,
    GuestNeedField,
    HasOp,
    MatchOp,
    OccupancyOp,
    OnOff,
    RideBreakdownMode,
    VehicleLocationMode
} from "../../../model/animation/jsonTypes";

export function formatEnumLabel(value: string): string {
    const spaced = value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
    const words = spaced.split(" ");
    const titled: string[] = [];
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!word) {
            continue;
        }
        titled.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    return titled.join(" ");
}

export function labelsForValues(values: string[]): string[] {
    const labels: string[] = [];
    for (let i = 0; i < values.length; i++) {
        labels.push(formatEnumLabel(values[i]));
    }
    return labels;
}

export function indexOfValue<T extends string>(values: T[], value: T): number {
    for (let i = 0; i < values.length; i++) {
        if (values[i] === value) {
            return i;
        }
    }
    return 0;
}

export const MATCH_OPS: MatchOp[] = ["is", "isNot"];
export const MATCH_LABELS = ["Is", "Is Not"];

export const ON_OFF: OnOff[] = ["on", "off"];
export const ON_OFF_LABELS = ["On", "Off"];

export const EXISTS_OPS: ExistsOp[] = ["exists", "doesNotExist"];
export const EXISTS_LABELS = ["Exists", "Does Not Exist"];

export const OCCUPANCY_OPS: OccupancyOp[] = ["on", "notOn"];
export const OCCUPANCY_LABELS = ["On Tile", "Not On Tile"];

export const EMPTY_OPS: EmptyOp[] = ["empty", "notEmpty"];
export const EMPTY_LABELS = ["Empty", "Not Empty"];

export const HAS_OPS: HasOp[] = ["has", "doesNotHave"];
export const HAS_LABELS = ["Has", "Does Not Have"];

export const BLOCK_BRAKE_OPS: BlockBrakeOp[] = ["open", "closed"];
export const BLOCK_BRAKE_LABELS = ["Open", "Closed"];

export const DATE_FIELDS: DateField[] = ["day", "month", "year", "monthsElapsed"];
export const DATE_FIELD_LABELS = ["Day", "Month", "Year", "Months Elapsed"];

export const LOCATION_MODES: VehicleLocationMode[] = ["onTile", "atStation", "trackProgress"];
export const LOCATION_MODE_LABELS = ["On Tile", "At Station", "Track Progress"];

export const BREAKDOWN_MODES: RideBreakdownMode[] = ["broken", "notBroken", "typeIs", "typeIsNot"];
export const BREAKDOWN_MODE_LABELS = [
    "Is Broken Down",
    "Is Not Broken Down",
    "Type Is",
    "Type Is Not"
];

export const ENTITY_SCOPES: EntityScope[] = ["this", "any"];
export const GUEST_SCOPE_LABELS = ["This Guest", "Any Guest On Tile"];
export const STAFF_SCOPE_LABELS = ["This Staff", "Any Staff On Tile"];

export const GUEST_NEED_FIELDS: GuestNeedField[] = [
    "happiness",
    "happinessTarget",
    "hunger",
    "thirst",
    "toilet",
    "nausea",
    "nauseaTarget",
    "energy",
    "energyTarget"
];
export const GUEST_NEED_LABELS = [
    "Happiness",
    "Happiness Target",
    "Hunger",
    "Thirst",
    "Toilet",
    "Nausea",
    "Nausea Target",
    "Energy",
    "Energy Target"
];

export const WEATHER_VALUES: WeatherType[] = [
    "sunny",
    "partiallyCloudy",
    "cloudy",
    "rain",
    "heavyRain",
    "thunder",
    "snow",
    "heavySnow",
    "blizzard"
];

export const RIDE_STATUSES: RideStatus[] = ["closed", "open", "testing", "simulating"];

export const SCENARIO_STATUSES: ScenarioStatus[] = ["inProgress", "completed", "failed"];

export const BREAKDOWN_TYPES: BreakdownType[] = [
    "brakes_failure",
    "control_failure",
    "doors_stuck_closed",
    "doors_stuck_open",
    "restraints_stuck_closed",
    "restraints_stuck_open",
    "safety_cut_out",
    "vehicle_malfunction"
];

export const VEHICLE_STATUSES: VehicleStatus[] = [
    "arriving",
    "crashed",
    "crashing",
    "crooked_house_operating",
    "departing",
    "doing_circus_show",
    "ferris_wheel_rotating",
    "haunted_house_operating",
    "moving_to_end_of_station",
    "operating_1a",
    "rotating",
    "showing_film",
    "simulator_operating",
    "space_rings_operating",
    "starting",
    "stopped_by_block_brake",
    "stopping_1b",
    "stopping",
    "swinging",
    "top_spin_operating",
    "travelling_boat",
    "travelling_cable_lift",
    "travelling_dodgems",
    "travelling",
    "unloading_passengers_1c",
    "unloading_passengers",
    "waiting_for_cable_lift",
    "waiting_for_passengers_17",
    "waiting_for_passengers",
    "waiting_to_depart",
    "waiting_to_start"
];

export const PARK_FLAGS: ParkFlags[] = [
    "difficultGuestGeneration",
    "difficultParkRating",
    "forbidHighConstruction",
    "forbidLandscapeChanges",
    "forbidMarketingCampaigns",
    "forbidTreeRemoval",
    "freeParkEntry",
    "noMoney",
    "open",
    "preferLessIntenseRides",
    "preferMoreIntenseRides",
    "scenarioCompleteNameInput",
    "unlockAllPrices"
];

export const PEEP_FLAGS: PeepFlags[] = [
    "leavingPark",
    "slowWalk",
    "tracking",
    "waving",
    "hasPaidForParkEntry",
    "photo",
    "painting",
    "wow",
    "litter",
    "lost",
    "hunger",
    "toilet",
    "crowded",
    "happiness",
    "nausea",
    "purple",
    "pizza",
    "explode",
    "rideShouldBeMarkedAsFavourite",
    "parkEntranceChosen",
    "contagious",
    "joy",
    "angry",
    "iceCream",
    "hereWeAre",
    "positionFrozen",
    "animationFrozen"
];

export const GUEST_ITEMS: GuestItemType[] = [
    "balloon",
    "hat",
    "map",
    "sunglasses",
    "toy",
    "tshirt",
    "umbrella",
    "photo1",
    "photo2",
    "photo3",
    "photo4",
    "voucher",
    "beef_noodles",
    "burger",
    "candyfloss",
    "chicken",
    "chips",
    "chocolate",
    "cookie",
    "doughnut",
    "hot_dog",
    "fried_rice_noodles",
    "funnel_cake",
    "ice_cream",
    "meatball_soup",
    "pizza",
    "popcorn",
    "pretzel",
    "roast_sausage",
    "sub_sandwich",
    "tentacle",
    "toffee_apple",
    "wonton_soup",
    "coffee",
    "drink",
    "fruit_juice",
    "iced_tea",
    "lemonade",
    "soybean_milk",
    "sujeonggwa",
    "empty_bottle",
    "empty_bowl_blue",
    "empty_bowl_red",
    "empty_box",
    "empty_burger_box",
    "empty_can",
    "empty_cup",
    "empty_drink_carton",
    "empty_juice_cup",
    "rubbish"
];

export const STAFF_TYPES: StaffType[] = ["handyman", "mechanic", "security", "entertainer"];

export const ON_OFF_TOGGLE: Array<"on" | "off" | "toggle"> = ["on", "off", "toggle"];
export const ON_OFF_TOGGLE_LABELS = ["On", "Off", "Toggle"];

export const PAUSE_MODES: Array<"pause" | "unpause" | "toggle"> = ["pause", "unpause", "toggle"];
export const PAUSE_MODE_LABELS = ["Pause", "Unpause", "Toggle"];

export const PATROL_MODES: Array<"set" | "add" | "remove" | "clear"> = ["set", "add", "remove", "clear"];
export const PATROL_MODE_LABELS = ["Set", "Add", "Remove", "Clear"];

export const CAMERA_MODES: Array<"move" | "scroll"> = ["move", "scroll"];
export const CAMERA_MODE_LABELS = ["Move", "Scroll"];

export const GRASS_LENGTHS = [0, 1, 2, 3];
export const GRASS_LENGTH_LABELS = ["Mown", "Short", "Long", "Clumps"];

export const LITTER_TYPES: LitterType[] = [
    "rubbish",
    "empty_can",
    "burger_box",
    "empty_cup",
    "empty_box",
    "empty_bottle",
    "empty_bowl_red",
    "empty_bowl_blue",
    "empty_drink_carton",
    "empty_juice_cup",
    "vomit",
    "vomit_alt"
];
export const LITTER_TYPE_LABELS = labelsForValues(LITTER_TYPES);

export const MONTH_LABELS = [
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October"
];

export const PARK_MESSAGE_TYPES: ParkMessageType[] = [
    "attraction",
    "peep_on_attraction",
    "peep",
    "money",
    "blank",
    "research",
    "guests",
    "award",
    "chart",
    "campaign"
];

export const AWARD_TYPES: AwardType[] = [
    "mostUntidy",
    "mostTidy",
    "bestRollerCoasters",
    "bestValue",
    "mostBeautiful",
    "worstValue",
    "safest",
    "bestStaff",
    "bestFood",
    "worstFood",
    "bestToilets",
    "mostDisappointing",
    "bestWaterRides",
    "bestCustomDesignedRides",
    "mostDazzlingRideColours",
    "mostConfusingLayout",
    "bestGentleRides"
];

export const GUEST_ANIMATIONS: GuestAnimation[] = [
    "walking",
    "checkTime",
    "watchRide",
    "eatFood",
    "shakeHead",
    "emptyPockets",
    "holdMat",
    "sittingIdle",
    "sittingEatFood",
    "sittingLookAroundLeft",
    "sittingLookAroundRight",
    "hanging",
    "wow",
    "throwUp",
    "jump",
    "drowning",
    "joy",
    "readMap",
    "wave",
    "wave2",
    "takePhoto",
    "clap",
    "disgust",
    "drawPicture",
    "beingWatched",
    "withdrawMoney"
];

export const STAFF_COSTUMES: StaffCostume[] = [
    "none",
    "handyman",
    "mechanic",
    "security1",
    "security2",
    "panda",
    "tiger",
    "elephant",
    "roman",
    "gorilla",
    "snowman",
    "knight",
    "astronaut",
    "bandit",
    "sheriff",
    "pirate"
];

export const STAFF_ANIMATIONS: StaffAnimation[] = [
    "walking",
    "watchRide",
    "wave",
    "hanging",
    "staffMower",
    "staffSweep",
    "drowning",
    "staffAnswerCall",
    "staffAnswerCall2",
    "staffCheckBoard",
    "staffFix",
    "staffFix2",
    "staffFixGround",
    "staffFix3",
    "staffWatering",
    "joy",
    "staffEmptyBin",
    "wave2"
];
