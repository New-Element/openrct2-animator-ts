import {StepDesc} from "../../../model/animation/jsonTypes";
import {error} from "../../../model/logger";
import {openHelpWindow} from "../../ui/tabTutorial";

type StepHelp = {
    title: string;
    paragraphs: string[];
};

const EDITOR =
    "Name is an optional label in the step list. Move Up, Move Down, Delete, and Clone change this step in the list.";
const NUMBER =
    "Hardcoded types a number. Variable reads that number from a variable.";
const STRING =
    "Hardcoded types text. Variable reads that text from a string variable.";
const COLOUR =
    "Hardcoded picks a colour. Variable reads a colour number from a variable.";
const VEHICLE_CAR =
    "Apply To Trigger Car uses the car that started this animation. Untick it to pick a Ride, Train, and Car. The eyedropper picks on the map. The locate button jumps the camera there.";
const VEHICLE_TRAIN =
    "Apply To Trigger Train uses the train that started this animation. Untick it to pick a Ride and Train. The eyedropper picks on the map. The locate button jumps the camera there.";
const RIDE =
    "Use Trigger Ride uses the ride from the trigger. Untick it to pick a Ride. The eyedropper picks on the map. The locate button jumps the camera there.";
const TILE =
    "Tile can be a Fixed Tile you pick, the Trigger Tile plus an offset, or a Tile Variable plus an offset. Pick Tile and Go To Tile appear for a fixed tile.";
const TRACK_PIECE =
    "Ride and Tile choose the track piece. Track Type is the piece kind on that tile. The eyedropper picks a track piece on the map.";
const GUEST =
    "Use Trigger Guest uses the guest from the trigger. Untick it to pick a guest on the map. The locate button jumps the camera there.";
const STAFF =
    "Use Trigger Staff uses the staff member from the trigger. Untick it to pick staff from the list or on the map. The locate button jumps the camera there.";
const COORDS =
    "Coords can be Hardcoded X, Y, and Z, or a Coords Variable.";
const MODE =
    "Mode is On, Off, or Toggle.";
const DEST_VAR =
    "Destination is the stored variable this step writes into. Formula variables are not listed.";
const DELTA =
    "ΔX, ΔY, and ΔZ are how far to move in world units. Duration is how many ticks the move takes. " + NUMBER;
const CAR_NUMBER =
    "Value is the new number for this car. " + NUMBER + " " + VEHICLE_CAR;
const CAR_TOGGLE =
    MODE + " " + VEHICLE_CAR;
const RIDE_NUMBER =
    "Value is the new setting for the ride. " + NUMBER + " " + RIDE;
const PATH_TOGGLE =
    "Tile chooses the path. " + TILE + " " + MODE;
const SURFACE =
    "Tile chooses the land square. " + TILE + " Value is the new height, slope, or style. " + NUMBER;
const CONTEXT =
    "Slot is Rides, Trains, Cars, Guests, Staff, or Tiles. Selector chooses how to find those items. Use Context Rides or Use Context Tiles reuses items already in this animation. Otherwise pick a ride, train, car, guest, staff member, or tile.";

function entry(title: string, inGame: string, controls: string): StepHelp {
    return {title, paragraphs: [inGame, controls, EDITOR]};
}

const HELP: {[key: string]: StepHelp} = {
    wait: entry(
        "Wait",
        "This step pauses the animation. Later steps do not run until the wait finishes.",
        "Ticks is how long to wait. " + NUMBER
    ),
    branch: entry(
        "Branch",
        "This step tests conditions, then jumps to another step or ends the animation. It does not change the park by itself.",
        "If Pass is where to go when every condition is true. If Fail is where to go when a condition is false. End stops the animation. Add conditions in the list below."
    ),
    customJavascript: entry(
        "Custom Javascript",
        "This step runs Javascript you type. Use it only when no other step can do the job. A mistake here can break the animation.",
        "The text box is the code. Instructions opens a longer guide for the functions you can call."
    ),
    "contextMutate:set": entry(
        "Set Context",
        "This step replaces one context list for the rest of this animation. Later steps that use context rides, trains, cars, guests, staff, or tiles use this new list.",
        CONTEXT
    ),
    "contextMutate:add": entry(
        "Add To Context",
        "This step adds items to a context list for the rest of this animation. Existing items in that list stay there.",
        CONTEXT
    ),
    "contextMutate:remove": entry(
        "Remove From Context",
        "This step removes items from a context list for the rest of this animation.",
        CONTEXT
    ),
    writeTriggerTile: entry(
        "Write Trigger Tile",
        "This step copies the tile the trigger fired on into a tile variable. It does not move anything in the park.",
        DEST_VAR
    ),
    variableSet: entry(
        "Set Variable",
        "This step writes a new stored value into a variable. Formula variables cannot be set this way.",
        "Variable chooses which variable. Value matches that variable's type: a number, text, a tile, coords, or a direction."
    ),
    variableIncrement: entry(
        "Increment Variable",
        "This step adds an amount to an int or float variable. Formula variables cannot be changed this way.",
        "Variable chooses which variable. Amount is how much to add. " + NUMBER
    ),
    variableDecrement: entry(
        "Decrement Variable",
        "This step subtracts an amount from an int or float variable. Formula variables cannot be changed this way.",
        "Variable chooses which variable. Amount is how much to subtract. " + NUMBER
    ),
    variableRandomInt: entry(
        "Random Integer",
        "This step writes a random whole number into an int variable. Formula variables cannot be changed this way.",
        "Variable chooses which variable. Min and Max are the inclusive range. " + NUMBER
    ),
    setCarCoords: entry(
        "Set Car Coords",
        "This step snaps a car to world coordinates immediately. The car does not travel along track to get there.",
        COORDS + " " + VEHICLE_CAR
    ),
    carCoordsOverTime: entry(
        "Car Coords Over Time",
        "This step slides a car through the air over time, by a delta from where it is now.",
        DELTA + " " + VEHICLE_CAR
    ),
    carMoveToTrack: entry(
        "Move Car To Track",
        "This step puts a car onto a track piece. Use this to place a car on track, not to slide it through the air.",
        "Tile and Track Type choose the piece. " + TILE + " " + VEHICLE_CAR
    ),
    carEditColour: entry(
        "Recolour Car",
        "This step changes one car's body, trim, and tertiary colours.",
        "Body, Trim, and Tertiary each use " + COLOUR + " " + VEHICLE_CAR
    ),
    carVelocity: entry(
        "Car Velocity",
        "This step sets how fast a car is moving along the track right now.",
        CAR_NUMBER
    ),
    carAcceleration: entry(
        "Car Acceleration",
        "This step sets how quickly a car speeds up or slows down along the track.",
        CAR_NUMBER
    ),
    carMass: entry(
        "Car Mass",
        "This step sets a car's mass. Heavier cars behave differently on hills and brakes.",
        CAR_NUMBER
    ),
    carBankRotation: entry(
        "Car Bank Rotation",
        "This step sets how far a car is rolled left or right, like banking.",
        CAR_NUMBER
    ),
    carSpin: entry(
        "Car Spin",
        "This step sets a car's spin, such as a spinning car on a ride.",
        CAR_NUMBER
    ),
    carPoweredAcceleration: entry(
        "Car Powered Acceleration",
        "This step sets how hard a powered car pushes itself along the track.",
        CAR_NUMBER
    ),
    carPoweredMaxSpeed: entry(
        "Car Powered Max Speed",
        "This step sets the top speed a powered car will try to reach.",
        CAR_NUMBER
    ),
    carTravelBy: entry(
        "Car Travel By",
        "This step moves a car along its current track by a distance, without picking a destination tile.",
        CAR_NUMBER
    ),
    carReversed: entry(
        "Car Reversed",
        "This step turns a car around on the track, or turns that off.",
        CAR_TOGGLE
    ),
    carCrashed: entry(
        "Car Crashed",
        "This step marks a car as crashed, or clears that. A crashed car looks wrecked and stops normally.",
        CAR_TOGGLE
    ),
    carStatus: entry(
        "Car Status",
        "This step sets a car's ride status, such as waiting to depart or travelling.",
        "Status is the new state. " + VEHICLE_CAR
    ),
    writeCarCoords: entry(
        "Write Car Coords",
        "This step copies a car's current world position into a coords variable. It does not move the car.",
        DEST_VAR + " " + VEHICLE_CAR
    ),
    writeCarTrackDirection: entry(
        "Write Car Track Direction",
        "This step copies the direction of the track under a car into a direction variable. It does not turn the car.",
        DEST_VAR + " " + VEHICLE_CAR
    ),
    trainEditColour: entry(
        "Recolour Train",
        "This step changes every car in a train to the same body, trim, and tertiary colours.",
        "Body, Trim, and Tertiary each use " + COLOUR + " " + VEHICLE_TRAIN
    ),
    trainCoordsOverTime: entry(
        "Train Coords Over Time",
        "This step slides every car in a train through the air over time, by a delta from where they are now.",
        DELTA + " There is no train picker: this uses the trigger train."
    ),
    trackSetHeight: entry(
        "Set Track Height",
        "This step moves a track piece up or down to a height. Cars on that piece move with it.",
        TRACK_PIECE + " Height is the new height. " + NUMBER
    ),
    switchTiTrackOrder: entry(
        "Switch TI Track Order",
        "This step swaps the order of overlapping track pieces on a tile in the tile inspector. That can change which piece a car follows.",
        "Ride and Tile choose the tile. The eyedropper picks on the map."
    ),
    trackChainLift: entry(
        "Chain Lift",
        "This step turns the chain lift on or off for a track piece.",
        TRACK_PIECE + " " + MODE
    ),
    liftDropTrack: entry(
        "Lift/Drop Track",
        "This step raises or lowers a lift/drop track section, waits, then can restore it. Use it for a moving track that a train rides onto.",
        "Start and End are heights in land units. Speed is a percent. Wait Before Move and Wait After Move are ticks. Reverse Exit Direction flips how the train leaves. Stage triggers can fire other animations at points in the move. " + NUMBER + " " + VEHICLE_TRAIN
    ),
    trackColourScheme: entry(
        "Track Colour Scheme",
        "This step sets which colour scheme a track piece uses.",
        TRACK_PIECE + " Scheme is 0 to 3. " + NUMBER
    ),
    trackSeatRotation: entry(
        "Seat Rotation",
        "This step sets the seat rotation on a track piece, such as a spinning or tilting car.",
        TRACK_PIECE + " Rotation is the new seat angle. " + NUMBER
    ),
    trackInverted: entry(
        "Track Inverted",
        "This step flips a track piece inverted, or turns that off.",
        TRACK_PIECE + " " + MODE
    ),
    trackBrakeSpeed: entry(
        "Brake / Booster Speed",
        "This step sets the brake or booster speed on a track piece.",
        TRACK_PIECE + " Speed is the new value. " + NUMBER
    ),
    trackHighlighted: entry(
        "Track Highlighted",
        "This step highlights a track piece, or turns the highlight off.",
        TRACK_PIECE + " " + MODE
    ),
    blockBrake: entry(
        "Block Brake",
        "This step turns a block brake on or off on a track piece.",
        TRACK_PIECE + " " + MODE
    ),
    rideStatus: entry(
        "Ride Status",
        "This step opens, closes, or tests a ride.",
        "Status is Open, Closed, or Testing. " + RIDE
    ),
    rideVehicleColours: entry(
        "Ride Vehicle Colours",
        "This step changes a ride's saved vehicle colour set. New trains use these colours.",
        "Index chooses which colour set. Body, Trim, and Tertiary use " + COLOUR + " " + RIDE
    ),
    rideTrackColours: entry(
        "Ride Track Colours",
        "This step changes a ride's saved track colour scheme.",
        "Scheme is 0 to 3. Main, Additional, and Supports use " + COLOUR + " " + RIDE
    ),
    rideStationStyle: entry(
        "Ride Station Style",
        "This step changes the station building style on a ride.",
        RIDE_NUMBER
    ),
    rideMusic: entry(
        "Ride Music",
        "This step chooses the music object for a ride and whether it plays.",
        "Music is the track. Play Music turns it on or off. " + RIDE
    ),
    rideStationStart: entry(
        "Ride Station Start",
        "This step moves a ride's station start to a location taken from the trigger or a fixed tile.",
        "Location is Trigger Train, Trigger Car, Trigger Guest, Trigger Staff, or Fixed Tile. Fixed Tile shows X, Y, Pick Tile, and Go To Tile. " + RIDE
    ),
    rideMode: entry(
        "Ride Mode",
        "This step changes a ride's operating mode number, such as continuous circuit versus shuttle.",
        RIDE_NUMBER
    ),
    rideDepartFlags: entry(
        "Ride Depart Flags",
        "This step sets the departure flags on a ride, such as wait for a full load.",
        RIDE_NUMBER
    ),
    rideMinWait: entry(
        "Ride Min Wait",
        "This step sets the minimum wait time at the station before a train can leave.",
        RIDE_NUMBER
    ),
    rideMaxWait: entry(
        "Ride Max Wait",
        "This step sets the maximum wait time at the station before a train must leave.",
        RIDE_NUMBER
    ),
    rideLiftHillSpeed: entry(
        "Ride Lift Hill Speed",
        "This step sets how fast the ride's lift hill chain runs.",
        RIDE_NUMBER
    ),
    rideBreakdown: entry(
        "Ride Breakdown",
        "This step forces a ride to break down with a chosen fault.",
        "Type is the breakdown. " + RIDE
    ),
    rideFixBreakdown: entry(
        "Fix Breakdown",
        "This step clears a ride breakdown so the ride can run again.",
        RIDE
    ),
    spawnGuest: entry(
        "Spawn Guest",
        "This step creates a new guest in the park. There are no extra settings on this step.",
        "The guest appears using the game's normal spawn. Use later guest steps if you need to move or change them."
    ),
    guestMove: entry(
        "Guest Move",
        "This step places a guest at world coordinates immediately.",
        COORDS + " " + GUEST
    ),
    guestNeed: entry(
        "Guest Need",
        "This step sets one guest need, such as happiness, hunger, or energy.",
        "Need chooses which stat. Value is the new amount. " + NUMBER + " " + GUEST
    ),
    guestClothes: entry(
        "Guest Clothes",
        "This step changes a guest's clothing and accessory colours. Unticked colours are left alone.",
        "Tick Set next to T-Shirt, Trousers, Hat, Balloon, or Umbrella, then pick that colour. " + COLOUR + " " + GUEST
    ),
    guestFavouriteRide: entry(
        "Guest Favourite Ride",
        "This step sets a guest's favourite ride, or clears it.",
        "Ride can be none or a park ride. Pick Ride and Go To Ride help you choose. " + GUEST
    ),
    guestGiveItem: entry(
        "Give Guest Item",
        "This step puts an item in a guest's hands, such as a balloon or umbrella.",
        "Item is what they receive. " + GUEST
    ),
    guestRemoveItem: entry(
        "Remove Guest Item",
        "This step takes an item away from a guest.",
        "Item is what to remove. " + GUEST
    ),
    guestAnimation: entry(
        "Guest Animation",
        "This step plays a guest animation, such as walking or sitting.",
        "Animation is the pose. " + GUEST
    ),
    guestFlag: entry(
        "Guest Flag",
        "This step turns a guest flag on or off, such as tracking.",
        "Flag is which flag. " + MODE + " " + GUEST
    ),
    writeGuestCoords: entry(
        "Write Guest Coords",
        "This step copies a guest's current world position into a coords variable. It does not move the guest.",
        DEST_VAR + " " + GUEST
    ),
    writeGuestDirection: entry(
        "Write Guest Direction",
        "This step copies the direction a guest is facing into a direction variable. It does not turn the guest.",
        DEST_VAR + " " + GUEST
    ),
    setStaffCoords: entry(
        "Set Staff Coords",
        "This step snaps a staff member to world coordinates immediately.",
        COORDS + " " + STAFF
    ),
    staffCostume: entry(
        "Staff Costume",
        "This step changes a staff member's costume, such as handyman or entertainer.",
        "Costume is the new outfit. " + STAFF
    ),
    staffOrders: entry(
        "Staff Orders",
        "This step sets a staff member's orders number, which controls which jobs they will do.",
        "Orders is the new value. " + NUMBER + " " + STAFF
    ),
    staffPatrol: entry(
        "Staff Patrol",
        "This step changes a staff member's patrol tiles.",
        "Mode is Set, Add, or Remove. The eyedropper picks the tiles on the map. " + STAFF
    ),
    staffAnimation: entry(
        "Staff Animation",
        "This step plays a staff animation, such as walking or waving.",
        "Animation is the pose. " + STAFF
    ),
    staffFlag: entry(
        "Staff Flag",
        "This step turns a staff flag on or off, such as tracking.",
        "Flag is which flag. " + MODE + " " + STAFF
    ),
    writeStaffCoords: entry(
        "Write Staff Coords",
        "This step copies a staff member's current world position into a coords variable. It does not move them.",
        DEST_VAR + " " + STAFF
    ),
    writeStaffDirection: entry(
        "Write Staff Direction",
        "This step copies the direction a staff member is facing into a direction variable. It does not turn them.",
        DEST_VAR + " " + STAFF
    ),
    sceneryVisibility: entry(
        "Scenery Visibility",
        "This step shows or hides scenery that matches the filters on a tile.",
        TILE + " Type, Object, Height, Location, and the colour filters narrow which pieces change. Any means that filter is ignored. Mode is Show, Hide, or Toggle."
    ),
    sceneryRecolour: entry(
        "Recolour Scenery",
        "This step recolours scenery that matches the filters on a tile.",
        TILE + " Type, Object, Height, and Location narrow which pieces change. Tick Set next to Primary, Secondary, or Tertiary, then pick that colour. Unticked colours stay as they are."
    ),
    sceneryRotation: entry(
        "Rotate Scenery",
        "This step turns scenery on a tile to a direction.",
        TILE + " Type, Object, Height, and Location narrow which pieces turn. Rotation is the new direction (0 to 3). Hardcoded types a number. Variable reads a direction variable."
    ),
    bannerText: entry(
        "Banner Text",
        "This step changes the words on a banner.",
        TILE + " Text is the new wording. " + STRING
    ),
    bannerColours: entry(
        "Banner Colours",
        "This step changes a banner's colours. Unticked colours are left alone.",
        TILE + " Tick Set next to Primary, Secondary, or Tertiary, then pick that colour. " + COLOUR
    ),
    bannerNoEntry: entry(
        "Banner No Entry",
        "This step turns a banner's no-entry state on or off.",
        TILE + " " + MODE
    ),
    landHeight: entry(
        "Land Height",
        "This step sets the land height on a tile.",
        SURFACE
    ),
    waterHeight: entry(
        "Water Height",
        "This step sets the water height on a tile.",
        SURFACE
    ),
    landSlope: entry(
        "Land Slope",
        "This step sets the land slope on a tile.",
        SURFACE
    ),
    surfaceStyle: entry(
        "Surface Style",
        "This step sets the ground surface style on a tile.",
        SURFACE
    ),
    edgeStyle: entry(
        "Edge Style",
        "This step sets the land edge style on a tile.",
        SURFACE
    ),
    grassLength: entry(
        "Grass Length",
        "This step sets how long the grass is on a tile.",
        "Tile chooses the land square. " + TILE + " Length is the grass length."
    ),
    pathAdditionVandalised: entry(
        "Path Addition Vandalised",
        "This step vandalises a path addition, or repairs it.",
        PATH_TOGGLE
    ),
    pathBinFull: entry(
        "Bin Full",
        "This step fills a path bin, or empties it.",
        PATH_TOGGLE
    ),
    pathLitter: entry(
        "Path Litter",
        "This step adds or removes litter on a path tile.",
        "Tile chooses the path. " + TILE + " " + MODE + " Litter is the litter type."
    ),
    parkMessage: entry(
        "Park Message",
        "This step posts a message in the park news. Guests and the player can see it.",
        "Type is the message kind. Text is the wording. " + STRING + " Tick Set next to Subject to attach a ride or other subject number."
    ),
    freezeWeather: entry(
        "Freeze Weather",
        "This step freezes the weather in place, or lets it change again.",
        MODE
    ),
    parkCash: entry(
        "Park Cash",
        "This step sets the park's cash.",
        "Cash is the new amount. " + NUMBER
    ),
    parkRating: entry(
        "Park Rating",
        "This step sets the park rating.",
        "Rating is the new score. " + NUMBER
    ),
    grantAward: entry(
        "Grant Award",
        "This step gives the park an award.",
        "Award is which award to grant."
    ),
    clearAwards: entry(
        "Clear Awards",
        "This step removes every park award. There are no extra settings on this step.",
        "Run this when you want a clean awards list."
    ),
    parkDate: entry(
        "Park Date",
        "This step sets the park's in-game month and year.",
        "Month is the month. Year is the year. " + NUMBER
    ),
    viewportCamera: entry(
        "Viewport Camera",
        "This step moves or scrolls the main view to a tile.",
        "Mode is Move or Scroll. X and Y are the tile, or a tile variable. Tick Z, Zoom, or Rotation to set those as well."
    ),
    writeCameraRotation: entry(
        "Write Camera Rotation",
        "This step copies the main view's rotation into a direction variable. It does not turn the camera.",
        DEST_VAR
    ),
    gamePause: entry(
        "Game Pause",
        "This step pauses or unpauses the game.",
        "Mode is Pause, Unpause, or Toggle."
    ),
    gameSpeed: entry(
        "Game Speed",
        "This step sets the game speed.",
        "Speed is the new speed. " + NUMBER
    )
};

function helpKey(desc: StepDesc): string {
    if (desc.type === "contextMutate") {
        return `contextMutate:${desc.operation}`;
    }
    return desc.type;
}

export function openStepHelp(desc: StepDesc): void {
    const key = helpKey(desc);
    const found = HELP[key];
    if (!found) {
        error("step", `No help text for step "${key}"`);
        openHelpWindow("Step", [
            "This step has no help text yet.",
            EDITOR
        ]);
        return;
    }
    openHelpWindow(found.title, found.paragraphs);
}
