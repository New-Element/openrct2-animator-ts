import {
    CarNumberStepDesc,
    CarToggleStepDesc,
    OnOffToggle,
    RideNumberStepDesc,
    StepDesc
} from "../../../model/animation/jsonTypes";
import {BannerFields} from "./fields/bannerFields";
import {
    CarMoveToTrackFields,
    CarNumberFields,
    CarStatusFields,
    CarToggleFields
} from "./fields/carPropertyFields";
import {GuestStepFields} from "./fields/guestStepFields";
import {ParkStepFields} from "./fields/parkStepFields";
import {RideExtraFields} from "./fields/rideStepFields";
import {RideTargetFields} from "./fields/rideTargetFields";
import {SceneryRecolourFields} from "./fields/sceneryRecolourFields";
import {SceneryRotationFields} from "./fields/sceneryRotationFields";
import {StaffStepFields} from "./fields/staffStepFields";
import {PathFields} from "./fields/pathFields";
import {SurfaceFields} from "./fields/surfaceFields";
import {TrackPropertyFields} from "./fields/trackPropertyFields";
import {VehicleTargetFields} from "./fields/vehicleTargetFields";
import {StepUiModule} from "./stepUiTypes";

function emptyModule(type: StepDesc["type"], addLabel: string): StepUiModule {
    return {
        type: type,
        addLabel: addLabel,
        rowLabel: () => addLabel,
        createStub: () => ({type: type} as StepDesc),
        load: () => {
            // No fields.
        },
        persist: (current: StepDesc) => (current.type === type ? ({type: type} as StepDesc) : null)
    };
}

function vehicleFrom(target: ReturnType<VehicleTargetFields["readTarget"]>) {
    return {
        useTriggerTarget: target.useTriggerTarget,
        rideId: target.rideId,
        trainIndex: target.trainIndex,
        carIndex: target.carIndex
    };
}

export type InstantStepFieldBag = {
    sceneryRecolour: SceneryRecolourFields;
    sceneryRotation: SceneryRotationFields;
    trackProperty: TrackPropertyFields;
    surface: SurfaceFields;
    path: PathFields;
    banner: BannerFields;
    vehicleTarget: VehicleTargetFields;
    carNumber: CarNumberFields;
    carToggle: CarToggleFields;
    carStatus: CarStatusFields;
    carMoveToTrack: CarMoveToTrackFields;
    rideTarget: RideTargetFields;
    rideExtra: RideExtraFields;
    guest: GuestStepFields;
    staff: StaffStepFields;
    park: ParkStepFields;
};

export function createInstantStepModules(fields: InstantStepFieldBag): StepUiModule[] {
    const f = fields;

    function trackModule(
        type: "trackColourScheme" | "trackSeatRotation" | "trackInverted" | "trackBrakeSpeed" | "trackHighlighted" | "blockBrake",
        addLabel: string,
        stubExtra: object
    ): StepUiModule {
        return {
            type: type,
            addLabel: addLabel,
            rowLabel: () => addLabel,
            createStub: () => ({
                type: type,
                tile: {x: 0, y: 0},
                rideId: 0,
                trackType: 0,
                ...stubExtra
            } as StepDesc),
            load: (desc: StepDesc) => {
                if (desc.type !== type) {
                    return;
                }
                f.trackProperty.load(desc as Parameters<TrackPropertyFields["load"]>[0]);
            },
            persist: (current: StepDesc) => (current.type === type ? f.trackProperty.persist() : null)
        };
    }

    function surfaceModule(
        type: "landHeight" | "waterHeight" | "landSlope" | "surfaceStyle" | "edgeStyle" | "grassLength",
        addLabel: string,
        value: number
    ): StepUiModule {
        return {
            type: type,
            addLabel: addLabel,
            rowLabel: () => addLabel,
            createStub: () => ({type: type, tile: {x: 0, y: 0}, value: value} as StepDesc),
            load: (desc: StepDesc) => {
                if (desc.type !== type) {
                    return;
                }
                f.surface.load(desc as Parameters<SurfaceFields["load"]>[0]);
            },
            persist: (current: StepDesc) => (current.type === type ? f.surface.persist() : null)
        };
    }

    function pathModule(
        type: "pathAdditionVandalised" | "pathBinFull" | "pathLitter",
        addLabel: string
    ): StepUiModule {
        return {
            type: type,
            addLabel: addLabel,
            rowLabel: (desc) => {
                if (desc.type !== type) {
                    return addLabel;
                }
                const mode = desc.mode as OnOffToggle;
                if (mode === "off") {
                    return `${addLabel} (Off)`;
                }
                if (mode === "toggle") {
                    return `${addLabel} (Toggle)`;
                }
                return `${addLabel} (On)`;
            },
            createStub: () => {
                if (type === "pathLitter") {
                    return {type: type, tile: {x: 0, y: 0}, mode: "on", litterType: "rubbish"};
                }
                return {type: type, tile: {x: 0, y: 0}, mode: "on"};
            },
            load: (desc: StepDesc) => {
                if (desc.type !== type) {
                    return;
                }
                f.path.load(desc as Parameters<PathFields["load"]>[0]);
            },
            persist: (current: StepDesc) => (current.type === type ? f.path.persist() : null)
        };
    }

    function carNumberModule(type: CarNumberStepDesc["type"], addLabel: string): StepUiModule {
        return {
            type: type,
            addLabel: addLabel,
            rowLabel: () => addLabel,
            createStub: () => ({type: type, value: 0, useTriggerTarget: true}),
            load: (desc: StepDesc) => {
                if (desc.type !== type) {
                    return;
                }
                f.carNumber.load(desc);
                f.vehicleTarget.load(desc, true);
            },
            persist: (current: StepDesc) => {
                if (current.type !== type) {
                    return null;
                }
                const source = f.carNumber.read();
                return {
                    type: type,
                    value: source.value,
                    ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {}),
                    ...vehicleFrom(f.vehicleTarget.readTarget())
                };
            }
        };
    }

    function carToggleModule(type: CarToggleStepDesc["type"], addLabel: string): StepUiModule {
        return {
            type: type,
            addLabel: addLabel,
            rowLabel: (desc) => {
                if (desc.type !== type) {
                    return addLabel;
                }
                const mode = desc.mode as OnOffToggle;
                if (mode === "off") {
                    return `${addLabel} (Off)`;
                }
                if (mode === "toggle") {
                    return `${addLabel} (Toggle)`;
                }
                return `${addLabel} (On)`;
            },
            createStub: () => ({type: type, mode: "on", useTriggerTarget: true}),
            load: (desc: StepDesc) => {
                if (desc.type !== type) {
                    return;
                }
                f.carToggle.load(desc);
                f.vehicleTarget.load(desc, true);
            },
            persist: (current: StepDesc) => {
                if (current.type !== type) {
                    return null;
                }
                return {
                    type: type,
                    mode: f.carToggle.readMode(),
                    ...vehicleFrom(f.vehicleTarget.readTarget())
                };
            }
        };
    }

    function rideNumberModule(type: RideNumberStepDesc["type"], addLabel: string): StepUiModule {
        return {
            type: type,
            addLabel: addLabel,
            rowLabel: () => addLabel,
            createStub: () => ({type: type, value: 0, useTriggerRide: true}),
            load: (desc: StepDesc) => {
                if (desc.type !== type) {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadNumber(desc);
            },
            persist: (current: StepDesc) => {
                if (current.type !== type) {
                    return null;
                }
                const source = f.rideExtra.readValue();
                return {
                    type: type,
                    value: source.value,
                    ...(source.origin === "variable" ? {valueOrigin: "variable", valueVariableId: source.variableId || ""} : {}),
                    ...f.rideTarget.read()
                };
            }
        };
    }

    return [
        {
            type: "sceneryRecolour",
            addLabel: "Recolour Scenery",
            rowLabel: () => "Recolour Scenery",
            createStub: () => ({type: "sceneryRecolour", tile: {x: 0, y: 0}}),
            load: (desc) => {
                if (desc.type === "sceneryRecolour") {
                    f.sceneryRecolour.load(desc);
                }
            },
            persist: (current) => (current.type === "sceneryRecolour" ? f.sceneryRecolour.persist() : null)
        },
        {
            type: "sceneryRotation",
            addLabel: "Rotate Scenery",
            rowLabel: () => "Rotate Scenery",
            createStub: () => ({type: "sceneryRotation", tile: {x: 0, y: 0}, direction: 0}),
            load: (desc) => {
                if (desc.type === "sceneryRotation") {
                    f.sceneryRotation.load(desc);
                }
            },
            persist: (current) => (current.type === "sceneryRotation" ? f.sceneryRotation.persist() : null)
        },
        trackModule("trackColourScheme", "Track Colour Scheme", {colourScheme: 0}),
        trackModule("trackSeatRotation", "Seat Rotation", {seatRotation: 0}),
        trackModule("trackInverted", "Track Inverted", {mode: "on"}),
        trackModule("trackBrakeSpeed", "Brake / Booster Speed", {value: 0}),
        trackModule("trackHighlighted", "Track Highlighted", {mode: "on"}),
        trackModule("blockBrake", "Block Brake", {mode: "on"}),
        surfaceModule("landHeight", "Land Height", 0),
        surfaceModule("waterHeight", "Water Height", 0),
        surfaceModule("landSlope", "Land Slope", 0),
        surfaceModule("surfaceStyle", "Surface Style", 0),
        surfaceModule("edgeStyle", "Edge Style", 0),
        surfaceModule("grassLength", "Grass Length", 0),
        pathModule("pathAdditionVandalised", "Path Addition Vandalised"),
        pathModule("pathBinFull", "Bin Full"),
        pathModule("pathLitter", "Path Litter"),
        {
            type: "bannerText",
            addLabel: "Banner Text",
            rowLabel: () => "Banner Text",
            createStub: () => ({type: "bannerText", tile: {x: 0, y: 0}, text: ""}),
            load: (desc) => {
                if (desc.type === "bannerText") {
                    f.banner.load(desc);
                }
            },
            persist: (current) => (current.type === "bannerText" ? f.banner.persist() : null)
        },
        {
            type: "bannerColours",
            addLabel: "Banner Colours",
            rowLabel: () => "Banner Colours",
            createStub: () => ({type: "bannerColours", tile: {x: 0, y: 0}}),
            load: (desc) => {
                if (desc.type === "bannerColours") {
                    f.banner.load(desc);
                }
            },
            persist: (current) => (current.type === "bannerColours" ? f.banner.persist() : null)
        },
        {
            type: "bannerNoEntry",
            addLabel: "Banner No Entry",
            rowLabel: () => "Banner No Entry",
            createStub: () => ({type: "bannerNoEntry", tile: {x: 0, y: 0}, mode: "on"}),
            load: (desc) => {
                if (desc.type === "bannerNoEntry") {
                    f.banner.load(desc);
                }
            },
            persist: (current) => (current.type === "bannerNoEntry" ? f.banner.persist() : null)
        },
        carNumberModule("carVelocity", "Car Velocity"),
        carNumberModule("carAcceleration", "Car Acceleration"),
        carNumberModule("carMass", "Car Mass"),
        carNumberModule("carBankRotation", "Car Bank Rotation"),
        carNumberModule("carSpin", "Car Spin"),
        carNumberModule("carPoweredAcceleration", "Car Powered Acceleration"),
        carNumberModule("carPoweredMaxSpeed", "Car Powered Max Speed"),
        carNumberModule("carTravelBy", "Car Travel By"),
        carToggleModule("carReversed", "Car Reversed"),
        carToggleModule("carCrashed", "Car Crashed"),
        {
            type: "carStatus",
            addLabel: "Car Status",
            rowLabel: () => "Car Status",
            createStub: () => ({type: "carStatus", status: "waiting_to_depart", useTriggerTarget: true}),
            load: (desc) => {
                if (desc.type !== "carStatus") {
                    return;
                }
                f.carStatus.load(desc);
                f.vehicleTarget.load(desc, true);
            },
            persist: (current) => {
                if (current.type !== "carStatus") {
                    return null;
                }
                return {
                    type: "carStatus",
                    status: f.carStatus.readStatus(),
                    ...vehicleFrom(f.vehicleTarget.readTarget())
                };
            }
        },
        {
            type: "carMoveToTrack",
            addLabel: "Move Car To Track",
            rowLabel: () => "Move Car To Track",
            createStub: () => ({
                type: "carMoveToTrack",
                useTriggerTarget: true,
                tile: {x: 0, y: 0},
                trackType: 0
            }),
            load: (desc) => {
                if (desc.type !== "carMoveToTrack") {
                    return;
                }
                f.vehicleTarget.load(desc, true);
                f.carMoveToTrack.load(desc);
            },
            persist: (current) => {
                if (current.type !== "carMoveToTrack") {
                    return null;
                }
                return f.carMoveToTrack.persist(f.vehicleTarget.readTarget());
            }
        },
        {
            type: "rideStatus",
            addLabel: "Ride Status",
            rowLabel: () => "Ride Status",
            createStub: () => ({type: "rideStatus", status: "open", useTriggerRide: true}),
            load: (desc) => {
                if (desc.type !== "rideStatus") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadStatus(desc);
            },
            persist: (current) => {
                if (current.type !== "rideStatus") {
                    return null;
                }
                return {type: "rideStatus", status: f.rideExtra.readStatus(), ...f.rideTarget.read()};
            }
        },
        {
            type: "rideVehicleColours",
            addLabel: "Ride Vehicle Colours",
            rowLabel: () => "Ride Vehicle Colours",
            createStub: () => ({
                type: "rideVehicleColours",
                colourIndex: 0,
                value: {body: 0, trim: 0, tertiary: 0},
                useTriggerRide: true
            }),
            load: (desc) => {
                if (desc.type !== "rideVehicleColours") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadVehicleColours(desc);
            },
            persist: (current) => {
                if (current.type !== "rideVehicleColours") {
                    return null;
                }
                return {type: "rideVehicleColours", ...f.rideExtra.readVehicleColours(), ...f.rideTarget.read()};
            }
        },
        {
            type: "rideTrackColours",
            addLabel: "Ride Track Colours",
            rowLabel: () => "Ride Track Colours",
            createStub: () => ({
                type: "rideTrackColours",
                schemeIndex: 0,
                main: 0,
                additional: 0,
                supports: 0,
                useTriggerRide: true
            }),
            load: (desc) => {
                if (desc.type !== "rideTrackColours") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadTrackColours(desc);
            },
            persist: (current) => {
                if (current.type !== "rideTrackColours") {
                    return null;
                }
                return {type: "rideTrackColours", ...f.rideExtra.readTrackColours(), ...f.rideTarget.read()};
            }
        },
        rideNumberModule("rideStationStyle", "Ride Station Style"),
        {
            type: "rideMusic",
            addLabel: "Ride Music",
            rowLabel: () => "Ride Music",
            createStub: () => ({type: "rideMusic", useTriggerRide: true, playMusic: true}),
            load: (desc: StepDesc) => {
                if (desc.type !== "rideMusic") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadMusic(desc);
            },
            persist: (current: StepDesc) => {
                if (current.type !== "rideMusic") {
                    return null;
                }
                return {type: "rideMusic", ...f.rideExtra.readMusic(), ...f.rideTarget.read()};
            }
        },
        {
            type: "rideStationStart",
            addLabel: "Ride Station Start",
            rowLabel: () => "Ride Station Start",
            createStub: () => ({type: "rideStationStart", source: "train", useTriggerRide: true}),
            load: (desc: StepDesc) => {
                if (desc.type !== "rideStationStart") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadStationStart(desc);
            },
            persist: (current: StepDesc) => {
                if (current.type !== "rideStationStart") {
                    return null;
                }
                return {
                    type: "rideStationStart",
                    ...f.rideExtra.readStationStart(),
                    ...f.rideTarget.read()
                };
            }
        },
        rideNumberModule("rideMode", "Ride Mode"),
        rideNumberModule("rideDepartFlags", "Ride Depart Flags"),
        rideNumberModule("rideMinWait", "Ride Min Wait"),
        rideNumberModule("rideMaxWait", "Ride Max Wait"),
        rideNumberModule("rideLiftHillSpeed", "Ride Lift Hill Speed"),
        {
            type: "rideBreakdown",
            addLabel: "Ride Breakdown",
            rowLabel: () => "Ride Breakdown",
            createStub: () => ({type: "rideBreakdown", breakdownType: "safety_cut_out", useTriggerRide: true}),
            load: (desc) => {
                if (desc.type !== "rideBreakdown") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
                f.rideExtra.loadBreakdown(desc);
            },
            persist: (current) => {
                if (current.type !== "rideBreakdown") {
                    return null;
                }
                return {
                    type: "rideBreakdown",
                    breakdownType: f.rideExtra.readBreakdown(),
                    ...f.rideTarget.read()
                };
            }
        },
        {
            type: "rideFixBreakdown",
            addLabel: "Fix Breakdown",
            rowLabel: () => "Fix Breakdown",
            createStub: () => ({type: "rideFixBreakdown", useTriggerRide: true}),
            load: (desc) => {
                if (desc.type !== "rideFixBreakdown") {
                    return;
                }
                f.rideTarget.load(desc.useTriggerRide, desc.rideId);
            },
            persist: (current) => {
                if (current.type !== "rideFixBreakdown") {
                    return null;
                }
                return {type: "rideFixBreakdown", ...f.rideTarget.read()};
            }
        },
        {
            type: "guestNeed",
            addLabel: "Guest Need",
            rowLabel: () => "Guest Need",
            createStub: () => ({type: "guestNeed", field: "happiness", value: 128, useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestNeed") {
                    f.guest.loadNeed(desc);
                }
            },
            persist: (current) => (current.type === "guestNeed" ? f.guest.persistNeed() : null)
        },
        {
            type: "guestClothes",
            addLabel: "Guest Clothes",
            rowLabel: () => "Guest Clothes",
            createStub: () => ({type: "guestClothes", useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestClothes") {
                    f.guest.loadClothes(desc);
                }
            },
            persist: (current) => (current.type === "guestClothes" ? f.guest.persistClothes() : null)
        },
        {
            type: "guestFavouriteRide",
            addLabel: "Guest Favourite Ride",
            rowLabel: () => "Guest Favourite Ride",
            createStub: () => ({type: "guestFavouriteRide", useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestFavouriteRide") {
                    f.guest.loadFavourite(desc);
                }
            },
            persist: (current) => (current.type === "guestFavouriteRide" ? f.guest.persistFavourite() : null)
        },
        {
            type: "guestGiveItem",
            addLabel: "Give Guest Item",
            rowLabel: () => "Give Guest Item",
            createStub: () => ({type: "guestGiveItem", item: "balloon", useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestGiveItem") {
                    f.guest.loadItem(desc);
                }
            },
            persist: (current) => (current.type === "guestGiveItem" ? f.guest.persistItem("guestGiveItem") : null)
        },
        {
            type: "guestRemoveItem",
            addLabel: "Remove Guest Item",
            rowLabel: () => "Remove Guest Item",
            createStub: () => ({type: "guestRemoveItem", item: "balloon", useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestRemoveItem") {
                    f.guest.loadItem(desc);
                }
            },
            persist: (current) => (current.type === "guestRemoveItem" ? f.guest.persistItem("guestRemoveItem") : null)
        },
        {
            type: "guestAnimation",
            addLabel: "Guest Animation",
            rowLabel: () => "Guest Animation",
            createStub: () => ({type: "guestAnimation", animation: "walking", useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestAnimation") {
                    f.guest.loadAnimation(desc);
                }
            },
            persist: (current) => (current.type === "guestAnimation" ? f.guest.persistAnimation() : null)
        },
        {
            type: "guestFlag",
            addLabel: "Guest Flag",
            rowLabel: () => "Guest Flag",
            createStub: () => ({type: "guestFlag", flag: "tracking", mode: "on", useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestFlag") {
                    f.guest.loadFlag(desc);
                }
            },
            persist: (current) => (current.type === "guestFlag" ? f.guest.persistFlag() : null)
        },
        {
            type: "guestMove",
            addLabel: "Guest Move",
            rowLabel: () => "Guest Move",
            createStub: () => ({type: "guestMove", x: 0, y: 0, z: 0, useTriggerGuest: true}),
            load: (desc) => {
                if (desc.type === "guestMove") {
                    f.guest.loadMove(desc);
                }
            },
            persist: (current) => (current.type === "guestMove" ? f.guest.persistMove() : null)
        },
        {
            type: "staffCostume",
            addLabel: "Staff Costume",
            rowLabel: () => "Staff Costume",
            createStub: () => ({type: "staffCostume", costume: "handyman", useTriggerStaff: true}),
            load: (desc) => {
                if (desc.type === "staffCostume") {
                    f.staff.loadCostume(desc);
                }
            },
            persist: (current) => (current.type === "staffCostume" ? f.staff.persistCostume() : null)
        },
        {
            type: "staffOrders",
            addLabel: "Staff Orders",
            rowLabel: () => "Staff Orders",
            createStub: () => ({type: "staffOrders", orders: 0, useTriggerStaff: true}),
            load: (desc) => {
                if (desc.type === "staffOrders") {
                    f.staff.loadOrders(desc);
                }
            },
            persist: (current) => (current.type === "staffOrders" ? f.staff.persistOrders() : null)
        },
        {
            type: "staffPatrol",
            addLabel: "Staff Patrol",
            rowLabel: () => "Staff Patrol",
            createStub: () => ({type: "staffPatrol", mode: "set", tiles: [], useTriggerStaff: true}),
            load: (desc) => {
                if (desc.type === "staffPatrol") {
                    f.staff.loadPatrol(desc);
                }
            },
            persist: (current) => (current.type === "staffPatrol" ? f.staff.persistPatrol() : null)
        },
        {
            type: "staffAnimation",
            addLabel: "Staff Animation",
            rowLabel: () => "Staff Animation",
            createStub: () => ({type: "staffAnimation", animation: "walking", useTriggerStaff: true}),
            load: (desc) => {
                if (desc.type === "staffAnimation") {
                    f.staff.loadAnimation(desc);
                }
            },
            persist: (current) => (current.type === "staffAnimation" ? f.staff.persistAnimation() : null)
        },
        {
            type: "staffFlag",
            addLabel: "Staff Flag",
            rowLabel: () => "Staff Flag",
            createStub: () => ({type: "staffFlag", flag: "tracking", mode: "on", useTriggerStaff: true}),
            load: (desc) => {
                if (desc.type === "staffFlag") {
                    f.staff.loadFlag(desc);
                }
            },
            persist: (current) => (current.type === "staffFlag" ? f.staff.persistFlag() : null)
        },
        emptyModule("spawnGuest", "Spawn Guest"),
        {
            type: "parkMessage",
            addLabel: "Park Message",
            rowLabel: () => "Park Message",
            createStub: () => ({type: "parkMessage", text: "", messageType: "blank"}),
            load: (desc) => {
                if (desc.type === "parkMessage") {
                    f.park.loadMessage(desc);
                }
            },
            persist: (current) => (current.type === "parkMessage" ? f.park.persistMessage() : null)
        },
        {
            type: "freezeWeather",
            addLabel: "Freeze Weather",
            rowLabel: () => "Freeze Weather",
            createStub: () => ({type: "freezeWeather", mode: "on"}),
            load: (desc) => {
                if (desc.type === "freezeWeather") {
                    f.park.loadFreeze(desc);
                }
            },
            persist: (current) => (current.type === "freezeWeather" ? f.park.persistFreeze() : null)
        },
        {
            type: "parkCash",
            addLabel: "Park Cash",
            rowLabel: () => "Park Cash",
            createStub: () => ({type: "parkCash", value: 0}),
            load: (desc) => {
                if (desc.type === "parkCash") {
                    f.park.loadCash(desc);
                }
            },
            persist: (current) => (current.type === "parkCash" ? f.park.persistCash() : null)
        },
        {
            type: "parkRating",
            addLabel: "Park Rating",
            rowLabel: () => "Park Rating",
            createStub: () => ({type: "parkRating", value: 600}),
            load: (desc) => {
                if (desc.type === "parkRating") {
                    f.park.loadRating(desc);
                }
            },
            persist: (current) => (current.type === "parkRating" ? f.park.persistRating() : null)
        },
        {
            type: "grantAward",
            addLabel: "Grant Award",
            rowLabel: () => "Grant Award",
            createStub: () => ({type: "grantAward", award: "mostTidy"}),
            load: (desc) => {
                if (desc.type === "grantAward") {
                    f.park.loadAward(desc);
                }
            },
            persist: (current) => (current.type === "grantAward" ? f.park.persistAward() : null)
        },
        emptyModule("clearAwards", "Clear Awards"),
        {
            type: "gamePause",
            addLabel: "Game Pause",
            rowLabel: () => "Game Pause",
            createStub: () => ({type: "gamePause", mode: "pause"}),
            load: (desc) => {
                if (desc.type === "gamePause") {
                    f.park.loadPause(desc);
                }
            },
            persist: (current) => (current.type === "gamePause" ? f.park.persistPause() : null)
        },
        {
            type: "gameSpeed",
            addLabel: "Game Speed",
            rowLabel: () => "Game Speed",
            createStub: () => ({type: "gameSpeed", speed: 0}),
            load: (desc) => {
                if (desc.type === "gameSpeed") {
                    f.park.loadSpeed(desc);
                }
            },
            persist: (current) => (current.type === "gameSpeed" ? f.park.persistSpeed() : null)
        },
        {
            type: "parkDate",
            addLabel: "Park Date",
            rowLabel: () => "Park Date",
            createStub: () => ({type: "parkDate", year: 1, month: 0}),
            load: (desc) => {
                if (desc.type === "parkDate") {
                    f.park.loadDate(desc);
                }
            },
            persist: (current) => (current.type === "parkDate" ? f.park.persistDate() : null)
        },
        {
            type: "viewportCamera",
            addLabel: "Viewport Camera",
            rowLabel: () => "Viewport Camera",
            createStub: () => ({type: "viewportCamera", x: 0, y: 0, mode: "move"}),
            load: (desc) => {
                if (desc.type === "viewportCamera") {
                    f.park.loadCamera(desc);
                }
            },
            persist: (current) => (current.type === "viewportCamera" ? f.park.persistCamera() : null)
        }
    ];
}
