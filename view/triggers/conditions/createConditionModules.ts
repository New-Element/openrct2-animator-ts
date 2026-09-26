import {
    CompareOp,
    ConditionDesc,
    VehicleTargetDesc
} from "../../../model/animation/jsonTypes";
import {compareOpLabel} from "../../../model/animation/trigger/condition/compare";
import {createCarEqualsConditionUi} from "./carEqualsConditionUi";
import {createCarModuloConditionUi} from "./carModuloConditionUi";
import {ConditionUiModule} from "./conditionUiTypes";
import {CompareFields} from "./fields/compareFields";
import {ConditionRideFields} from "./fields/conditionRideFields";
import {ConditionTileFields} from "./fields/conditionTileFields";
import {ConditionTrackFields} from "./fields/conditionTrackFields";
import {EnumFields, OptionalEnumFields} from "./fields/enumFields";
import {EqualsFields} from "./fields/equalsFields";
import {ModuloFields} from "./fields/moduloFields";
import {PeepTargetFields} from "./fields/peepTargetFields";
import {VariableValueFields} from "./fields/variableValueFields";
import {VehicleLocationFields} from "./fields/vehicleLocationFields";
import {BREAKDOWN_TYPES, formatEnumLabel, GUEST_NEED_FIELDS} from "./labels";
import {createRideOpenConditionUi} from "./rideOpenConditionUi";
import {createTrainModuloConditionUi} from "./trainModuloConditionUi";
import {VehicleTargetFields} from "../../animations/steps/fields/vehicleTargetFields";

function applyVehicle(desc: VehicleTargetDesc, target: VehicleTargetDesc): void {
    desc.useTriggerTarget = target.useTriggerTarget;
    desc.rideId = target.rideId;
    desc.trainIndex = target.trainIndex;
    desc.carIndex = target.carIndex;
}

function applyTile(
    desc: {relativeToTrigger?: boolean; tile?: {x: number; y: number}; offset?: {x: number; y: number}},
    tile: ReturnType<ConditionTileFields["read"]>
): void {
    desc.relativeToTrigger = tile.relativeToTrigger;
    desc.tile = tile.tile;
    desc.offset = tile.offset;
}

export type ConditionFieldBag = {
    modulo: ModuloFields;
    equals: EqualsFields;
    compare: CompareFields;
    ride: ConditionRideFields;
    vehicle: VehicleTargetFields;
    tile: ConditionTileFields;
    track: ConditionTrackFields;
    location: VehicleLocationFields;
    guest: PeepTargetFields;
    staff: PeepTargetFields;
    variableValue: VariableValueFields;
    match: EnumFields;
    onOff: EnumFields;
    exists: EnumFields;
    occupancy: EnumFields;
    empty: EnumFields;
    hasItem: EnumFields;
    blockBrake: EnumFields;
    dateField: EnumFields;
    weather: EnumFields;
    rideStatus: EnumFields;
    scenario: EnumFields;
    breakdownMode: EnumFields;
    breakdownType: EnumFields;
    carStatus: EnumFields;
    parkFlag: EnumFields;
    peepFlag: EnumFields;
    guestNeed: EnumFields;
    guestItem: EnumFields;
    guestScope: EnumFields;
    staffScope: EnumFields;
    staffType: OptionalEnumFields;
};

export function createConditionModules(fields: ConditionFieldBag): ConditionUiModule[] {
    const f = fields;

    function numericRow(name: string, op: CompareOp, value: number): string {
        return `${name} ${compareOpLabel(op)} ${value}`;
    }

    return [
        createTrainModuloConditionUi(f.modulo),
        createCarEqualsConditionUi(f.equals),
        createCarModuloConditionUi(f.modulo),
        createRideOpenConditionUi(),
        {
            type: "weatherStatus",
            addLabel: "Weather Status",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "weatherStatus"
                    ? `Weather ${desc.op === "is" ? "Is" : "Is Not"} ${formatEnumLabel(desc.weather)}`
                    : "Weather Status",
            createStub: () => ({type: "weatherStatus", op: "is", weather: "sunny"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "weatherStatus") {
                    return;
                }
                f.match.load(desc.op);
                f.weather.load(desc.weather);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "weatherStatus") {
                    return;
                }
                desc.op = f.match.read() as "is" | "isNot";
                desc.weather = f.weather.read() as WeatherType;
            }
        },
        {
            type: "temperature",
            addLabel: "Temperature",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "temperature" ? numericRow("Temperature", desc.op, desc.value) : "Temperature",
            createStub: () => ({type: "temperature", op: "ge", value: 10}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type === "temperature") {
                    f.compare.load(desc.op, desc.value);
                }
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "temperature") {
                    return;
                }
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "dateStatus",
            addLabel: "Date Status",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "dateStatus"
                    ? `${formatEnumLabel(desc.field)} ${compareOpLabel(desc.op)} ${desc.value}`
                    : "Date Status",
            createStub: () => ({type: "dateStatus", field: "day", op: "eq", value: 1}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "dateStatus") {
                    return;
                }
                f.dateField.load(desc.field);
                f.compare.load(desc.op, desc.value);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "dateStatus") {
                    return;
                }
                desc.field = f.dateField.read() as DateStatusField;
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "parkRating",
            addLabel: "Park Rating",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "parkRating" ? numericRow("Park Rating", desc.op, desc.value) : "Park Rating",
            createStub: () => ({type: "parkRating", op: "ge", value: 600}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type === "parkRating") {
                    f.compare.load(desc.op, desc.value);
                }
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "parkRating") {
                    return;
                }
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "parkGuestCount",
            addLabel: "Park Guest Count",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "parkGuestCount"
                    ? numericRow("Park Guests", desc.op, desc.value)
                    : "Park Guest Count",
            createStub: () => ({type: "parkGuestCount", op: "ge", value: 0}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type === "parkGuestCount") {
                    f.compare.load(desc.op, desc.value);
                }
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "parkGuestCount") {
                    return;
                }
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "parkCash",
            addLabel: "Park Cash",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "parkCash" ? numericRow("Park Cash", desc.op, desc.value) : "Park Cash",
            createStub: () => ({type: "parkCash", op: "ge", value: 0}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type === "parkCash") {
                    f.compare.load(desc.op, desc.value);
                }
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "parkCash") {
                    return;
                }
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "parkFlag",
            addLabel: "Park Flag",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "parkFlag"
                    ? `Park Flag ${formatEnumLabel(desc.flag)} ${desc.expected === "on" ? "On" : "Off"}`
                    : "Park Flag",
            createStub: () => ({type: "parkFlag", flag: "open", expected: "on"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "parkFlag") {
                    return;
                }
                f.parkFlag.load(desc.flag);
                f.onOff.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "parkFlag") {
                    return;
                }
                desc.flag = f.parkFlag.read() as ParkFlags;
                desc.expected = f.onOff.read() as "on" | "off";
            }
        },
        {
            type: "scenarioStatus",
            addLabel: "Scenario Status",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "scenarioStatus"
                    ? `Scenario ${desc.op === "is" ? "Is" : "Is Not"} ${formatEnumLabel(desc.status)}`
                    : "Scenario Status",
            createStub: () => ({type: "scenarioStatus", op: "is", status: "inProgress"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "scenarioStatus") {
                    return;
                }
                f.match.load(desc.op);
                f.scenario.load(desc.status);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "scenarioStatus") {
                    return;
                }
                desc.op = f.match.read() as "is" | "isNot";
                desc.status = f.scenario.read() as ScenarioStatus;
            }
        },
        {
            type: "variableValue",
            addLabel: "Variable Value",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "variableValue"
                    ? `Variable ${compareOpLabel(desc.op)} ${
                          desc.rhsKind === "variable" ? "Variable" : String(desc.constant)
                      }`
                    : "Variable Value",
            createStub: () => ({type: "variableValue", variableId: "", op: "eq", rhsKind: "constant", constant: 0}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type === "variableValue") {
                    f.variableValue.load(desc);
                }
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "variableValue") {
                    return;
                }
                const values = f.variableValue.read();
                desc.variableId = values.variableId;
                desc.op = values.op;
                desc.rhsKind = values.rhsKind;
                desc.constant = values.constant;
                desc.otherVariableId = values.otherVariableId;
            }
        },
        {
            type: "rideStatus",
            addLabel: "Ride Status",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "rideStatus"
                    ? `Ride ${desc.op === "is" ? "Is" : "Is Not"} ${formatEnumLabel(desc.status)}`
                    : "Ride Status",
            createStub: () => ({type: "rideStatus", op: "is", status: "open"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "rideStatus") {
                    return;
                }
                f.ride.load(desc.rideId);
                f.match.load(desc.op);
                f.rideStatus.load(desc.status);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "rideStatus") {
                    return;
                }
                desc.rideId = f.ride.read();
                desc.op = f.match.read() as "is" | "isNot";
                desc.status = f.rideStatus.read() as RideStatus;
            }
        },
        {
            type: "rideBreakdownStatus",
            addLabel: "Ride Breakdown Status",
            rowLabel: (desc: ConditionDesc) => {
                if (desc.type !== "rideBreakdownStatus") {
                    return "Ride Breakdown Status";
                }
                if (desc.mode === "broken") {
                    return "Ride Is Broken Down";
                }
                if (desc.mode === "notBroken") {
                    return "Ride Is Not Broken Down";
                }
                return `Ride Breakdown ${desc.mode === "typeIs" ? "Is" : "Is Not"} ${
                    desc.breakdownType ? formatEnumLabel(desc.breakdownType) : "Type"
                }`;
            },
            createStub: () => ({type: "rideBreakdownStatus", mode: "broken"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "rideBreakdownStatus") {
                    return;
                }
                f.ride.load(desc.rideId);
                f.breakdownMode.load(desc.mode);
                if (desc.mode === "typeIs" || desc.mode === "typeIsNot") {
                    f.breakdownType.load(desc.breakdownType || BREAKDOWN_TYPES[0]);
                }
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "rideBreakdownStatus") {
                    return;
                }
                desc.rideId = f.ride.read();
                desc.mode = f.breakdownMode.read() as typeof desc.mode;
                if (desc.mode === "typeIs" || desc.mode === "typeIsNot") {
                    desc.breakdownType = f.breakdownType.read() as BreakdownType;
                }
            }
        },
        {
            type: "rideGuestCount",
            addLabel: "Ride Guest Count",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "rideGuestCount"
                    ? numericRow("Ride Guests", desc.op, desc.value)
                    : "Ride Guest Count",
            createStub: () => ({type: "rideGuestCount", op: "ge", value: 0}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "rideGuestCount") {
                    return;
                }
                f.ride.load(desc.rideId);
                f.compare.load(desc.op, desc.value);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "rideGuestCount") {
                    return;
                }
                desc.rideId = f.ride.read();
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "rideEmpty",
            addLabel: "Ride Empty",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "rideEmpty"
                    ? desc.expected === "empty" ? "Ride Empty" : "Ride Not Empty"
                    : "Ride Empty",
            createStub: () => ({type: "rideEmpty", expected: "empty"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "rideEmpty") {
                    return;
                }
                f.ride.load(desc.rideId);
                f.empty.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "rideEmpty") {
                    return;
                }
                desc.rideId = f.ride.read();
                desc.expected = f.empty.read() as "empty" | "notEmpty";
            }
        },
        {
            type: "carStatus",
            addLabel: "Car Status",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "carStatus"
                    ? `Car ${desc.op === "is" ? "Is" : "Is Not"} ${formatEnumLabel(desc.status)}`
                    : "Car Status",
            createStub: () => ({type: "carStatus", useTriggerTarget: true, op: "is", status: "travelling"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "carStatus") {
                    return;
                }
                f.vehicle.load(desc, true);
                f.match.load(desc.op);
                f.carStatus.load(desc.status);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "carStatus") {
                    return;
                }
                applyVehicle(desc, f.vehicle.readTarget());
                desc.op = f.match.read() as "is" | "isNot";
                desc.status = f.carStatus.read() as VehicleStatus;
            }
        },
        {
            type: "carSpeed",
            addLabel: "Car Speed",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "carSpeed" ? numericRow("Car Speed", desc.op, desc.value) : "Car Speed",
            createStub: () => ({type: "carSpeed", useTriggerTarget: true, op: "ge", value: 0}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "carSpeed") {
                    return;
                }
                f.vehicle.load(desc, true);
                f.compare.load(desc.op, desc.value);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "carSpeed") {
                    return;
                }
                applyVehicle(desc, f.vehicle.readTarget());
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "carLocation",
            addLabel: "Car Location",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "carLocation" ? `Car ${formatEnumLabel(desc.mode)}` : "Car Location",
            createStub: () => ({type: "carLocation", useTriggerTarget: true, mode: "onTile"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "carLocation") {
                    return;
                }
                f.vehicle.load(desc, true);
                f.location.load(desc);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "carLocation") {
                    return;
                }
                applyVehicle(desc, f.vehicle.readTarget());
                const loc = f.location.read();
                desc.mode = loc.mode;
                desc.stationIndex = loc.stationIndex;
                applyTile(desc, f.tile.read());
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "trainLocation",
            addLabel: "Train Location",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "trainLocation" ? `Train ${formatEnumLabel(desc.mode)}` : "Train Location",
            createStub: () => ({type: "trainLocation", useTriggerTarget: true, mode: "onTile"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "trainLocation") {
                    return;
                }
                f.vehicle.load(desc, false);
                f.location.load(desc);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "trainLocation") {
                    return;
                }
                applyVehicle(desc, f.vehicle.readTarget());
                const loc = f.location.read();
                desc.mode = loc.mode;
                desc.stationIndex = loc.stationIndex;
                applyTile(desc, f.tile.read());
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "trackChainLift",
            addLabel: "Track Chain Lift",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "trackChainLift"
                    ? `Chain Lift ${desc.expected === "on" ? "On" : "Off"}`
                    : "Track Chain Lift",
            createStub: () => ({type: "trackChainLift", rideId: 0, trackType: 0, expected: "on"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "trackChainLift") {
                    return;
                }
                f.track.load(desc);
                f.onOff.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "trackChainLift") {
                    return;
                }
                const track = f.track.read();
                applyTile(desc, track);
                desc.rideId = track.rideId;
                desc.trackType = track.trackType;
                desc.expected = f.onOff.read() as "on" | "off";
            }
        },
        {
            type: "trackBrakeSpeed",
            addLabel: "Track Brake / Booster Speed",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "trackBrakeSpeed"
                    ? numericRow("Brake / Booster Speed", desc.op, desc.value)
                    : "Track Brake / Booster Speed",
            createStub: () => ({type: "trackBrakeSpeed", rideId: 0, trackType: 0, op: "ge", value: 0}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "trackBrakeSpeed") {
                    return;
                }
                f.track.load(desc);
                f.compare.load(desc.op, desc.value);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "trackBrakeSpeed") {
                    return;
                }
                const track = f.track.read();
                applyTile(desc, track);
                desc.rideId = track.rideId;
                desc.trackType = track.trackType;
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "trackInverted",
            addLabel: "Track Inverted",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "trackInverted"
                    ? `Track Inverted ${desc.expected === "on" ? "On" : "Off"}`
                    : "Track Inverted",
            createStub: () => ({type: "trackInverted", rideId: 0, trackType: 0, expected: "off"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "trackInverted") {
                    return;
                }
                f.track.load(desc);
                f.onOff.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "trackInverted") {
                    return;
                }
                const track = f.track.read();
                applyTile(desc, track);
                desc.rideId = track.rideId;
                desc.trackType = track.trackType;
                desc.expected = f.onOff.read() as "on" | "off";
            }
        },
        {
            type: "blockBrakeStatus",
            addLabel: "Block Brake Status",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "blockBrakeStatus"
                    ? `Block Brake ${desc.expected === "open" ? "Open" : "Closed"}`
                    : "Block Brake Status",
            createStub: () => ({type: "blockBrakeStatus", rideId: 0, trackType: 0, expected: "open"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "blockBrakeStatus") {
                    return;
                }
                f.track.load(desc);
                f.blockBrake.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "blockBrakeStatus") {
                    return;
                }
                const track = f.track.read();
                applyTile(desc, track);
                desc.rideId = track.rideId;
                desc.trackType = track.trackType;
                desc.expected = f.blockBrake.read() as "open" | "closed";
            }
        },
        {
            type: "guestExists",
            addLabel: "Guest Exists",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "guestExists"
                    ? desc.expected === "exists" ? "Guest Exists" : "Guest Does Not Exist"
                    : "Guest Exists",
            createStub: () => ({type: "guestExists", useTriggerGuest: true, expected: "exists"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "guestExists") {
                    return;
                }
                f.guest.load(desc.useTriggerGuest !== false, desc.guestId);
                f.exists.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "guestExists") {
                    return;
                }
                const peep = f.guest.read();
                desc.useTriggerGuest = peep.useTrigger;
                desc.guestId = peep.id;
                desc.expected = f.exists.read() as "exists" | "doesNotExist";
            }
        },
        {
            type: "guestLocation",
            addLabel: "Guest Location",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "guestLocation"
                    ? `${desc.scope === "any" ? "Any Guest" : "Guest"} ${
                          desc.occupancy === "on" ? "On Tile" : "Not On Tile"
                      }`
                    : "Guest Location",
            createStub: () => ({type: "guestLocation", scope: "this", useTriggerGuest: true, occupancy: "on"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "guestLocation") {
                    return;
                }
                f.guestScope.load(desc.scope);
                if (desc.scope === "this") {
                    f.guest.load(desc.useTriggerGuest !== false, desc.guestId);
                }
                f.tile.load(desc);
                f.occupancy.load(desc.occupancy);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "guestLocation") {
                    return;
                }
                desc.scope = f.guestScope.read() as "any" | "this";
                const peep = f.guest.read();
                desc.useTriggerGuest = peep.useTrigger;
                desc.guestId = peep.id;
                applyTile(desc, f.tile.read());
                desc.occupancy = f.occupancy.read() as "on" | "notOn";
            }
        },
        {
            type: "guestNeed",
            addLabel: "Guest Need",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "guestNeed"
                    ? `${formatEnumLabel(desc.field)} ${compareOpLabel(desc.op)} ${desc.value}`
                    : "Guest Need",
            createStub: () => ({
                type: "guestNeed",
                useTriggerGuest: true,
                field: "happiness",
                op: "ge",
                value: 128
            }),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "guestNeed") {
                    return;
                }
                f.guest.load(desc.useTriggerGuest !== false, desc.guestId);
                f.guestNeed.load(desc.field);
                f.compare.load(desc.op, desc.value);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "guestNeed") {
                    return;
                }
                const peep = f.guest.read();
                desc.useTriggerGuest = peep.useTrigger;
                desc.guestId = peep.id;
                desc.field = f.guestNeed.read() as typeof GUEST_NEED_FIELDS[number];
                const values = f.compare.read();
                desc.op = values.op;
                desc.value = values.value;
            }
        },
        {
            type: "guestItem",
            addLabel: "Guest Item",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "guestItem"
                    ? `Guest ${desc.expected === "has" ? "Has" : "Does Not Have"} ${formatEnumLabel(desc.item)}`
                    : "Guest Item",
            createStub: () => ({
                type: "guestItem",
                useTriggerGuest: true,
                item: "balloon",
                expected: "has"
            }),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "guestItem") {
                    return;
                }
                f.guest.load(desc.useTriggerGuest !== false, desc.guestId);
                f.guestItem.load(desc.item);
                f.hasItem.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "guestItem") {
                    return;
                }
                const peep = f.guest.read();
                desc.useTriggerGuest = peep.useTrigger;
                desc.guestId = peep.id;
                desc.item = f.guestItem.read() as GuestItemType;
                desc.expected = f.hasItem.read() as "has" | "doesNotHave";
            }
        },
        {
            type: "guestFlag",
            addLabel: "Guest Flag",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "guestFlag"
                    ? `Guest Flag ${formatEnumLabel(desc.flag)} ${desc.expected === "on" ? "On" : "Off"}`
                    : "Guest Flag",
            createStub: () => ({
                type: "guestFlag",
                useTriggerGuest: true,
                flag: "leavingPark",
                expected: "on"
            }),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "guestFlag") {
                    return;
                }
                f.guest.load(desc.useTriggerGuest !== false, desc.guestId);
                f.peepFlag.load(desc.flag);
                f.onOff.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "guestFlag") {
                    return;
                }
                const peep = f.guest.read();
                desc.useTriggerGuest = peep.useTrigger;
                desc.guestId = peep.id;
                desc.flag = f.peepFlag.read() as PeepFlags;
                desc.expected = f.onOff.read() as "on" | "off";
            }
        },
        {
            type: "staffExists",
            addLabel: "Staff Exists",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "staffExists"
                    ? desc.expected === "exists" ? "Staff Exists" : "Staff Does Not Exist"
                    : "Staff Exists",
            createStub: () => ({type: "staffExists", useTriggerStaff: true, expected: "exists"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "staffExists") {
                    return;
                }
                f.staff.load(desc.useTriggerStaff !== false, desc.staffId);
                f.exists.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "staffExists") {
                    return;
                }
                const peep = f.staff.read();
                desc.useTriggerStaff = peep.useTrigger;
                desc.staffId = peep.id;
                desc.expected = f.exists.read() as "exists" | "doesNotExist";
            }
        },
        {
            type: "staffLocation",
            addLabel: "Staff Location",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "staffLocation"
                    ? `${desc.scope === "any" ? "Any Staff" : "Staff"} ${
                          desc.occupancy === "on" ? "On Tile" : "Not On Tile"
                      }`
                    : "Staff Location",
            createStub: () => ({type: "staffLocation", scope: "this", useTriggerStaff: true, occupancy: "on"}),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "staffLocation") {
                    return;
                }
                f.staffScope.load(desc.scope);
                if (desc.scope === "this") {
                    f.staff.load(desc.useTriggerStaff !== false, desc.staffId);
                }
                f.staffType.load(desc.staffType);
                f.tile.load(desc);
                f.occupancy.load(desc.occupancy);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "staffLocation") {
                    return;
                }
                desc.scope = f.staffScope.read() as "any" | "this";
                const peep = f.staff.read();
                desc.useTriggerStaff = peep.useTrigger;
                desc.staffId = peep.id;
                desc.staffType = f.staffType.read() as StaffType | undefined;
                applyTile(desc, f.tile.read());
                desc.occupancy = f.occupancy.read() as "on" | "notOn";
            }
        },
        {
            type: "staffFlag",
            addLabel: "Staff Flag",
            rowLabel: (desc: ConditionDesc) =>
                desc.type === "staffFlag"
                    ? `Staff Flag ${formatEnumLabel(desc.flag)} ${desc.expected === "on" ? "On" : "Off"}`
                    : "Staff Flag",
            createStub: () => ({
                type: "staffFlag",
                useTriggerStaff: true,
                flag: "leavingPark",
                expected: "on"
            }),
            hide: () => undefined,
            load: (desc: ConditionDesc) => {
                if (desc.type !== "staffFlag") {
                    return;
                }
                f.staff.load(desc.useTriggerStaff !== false, desc.staffId);
                f.peepFlag.load(desc.flag);
                f.onOff.load(desc.expected);
            },
            persist: (desc: ConditionDesc) => {
                if (desc.type !== "staffFlag") {
                    return;
                }
                const peep = f.staff.read();
                desc.useTriggerStaff = peep.useTrigger;
                desc.staffId = peep.id;
                desc.flag = f.peepFlag.read() as PeepFlags;
                desc.expected = f.onOff.read() as "on" | "off";
            }
        }
    ];
}

type DateStatusField = import("../../../model/animation/jsonTypes").DateField;
