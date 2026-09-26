import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {createRideSelectFields} from "../../animations/steps/fields/rideSelectFields";
import {createVehicleTargetFields} from "../../animations/steps/fields/vehicleTargetFields";
import {ConditionFieldBag, createConditionModules} from "./createConditionModules";
import {ConditionUiModule} from "./conditionUiTypes";
import {createCompareFields} from "./fields/compareFields";
import {createConditionRideFields} from "./fields/conditionRideFields";
import {createConditionTileFields} from "./fields/conditionTileFields";
import {createConditionTrackFields} from "./fields/conditionTrackFields";
import {createEnumFields, createOptionalEnumFields} from "./fields/enumFields";
import {createEqualsFields} from "./fields/equalsFields";
import {createModuloFields} from "./fields/moduloFields";
import {createPeepTargetFields} from "./fields/peepTargetFields";
import {createVariableValueFields} from "./fields/variableValueFields";
import {createVehicleLocationFields} from "./fields/vehicleLocationFields";
import {
    BLOCK_BRAKE_LABELS,
    BLOCK_BRAKE_OPS,
    BREAKDOWN_MODE_LABELS,
    BREAKDOWN_MODES,
    BREAKDOWN_TYPES,
    DATE_FIELD_LABELS,
    DATE_FIELDS,
    EMPTY_LABELS,
    EMPTY_OPS,
    EXISTS_LABELS,
    EXISTS_OPS,
    GUEST_ITEMS,
    GUEST_NEED_FIELDS,
    GUEST_NEED_LABELS,
    GUEST_SCOPE_LABELS,
    ENTITY_SCOPES,
    HAS_LABELS,
    HAS_OPS,
    labelsForValues,
    MATCH_LABELS,
    MATCH_OPS,
    OCCUPANCY_LABELS,
    OCCUPANCY_OPS,
    ON_OFF,
    ON_OFF_LABELS,
    PARK_FLAGS,
    PEEP_FLAGS,
    RIDE_STATUSES,
    SCENARIO_STATUSES,
    STAFF_SCOPE_LABELS,
    STAFF_TYPES,
    VEHICLE_STATUSES,
    WEATHER_VALUES
} from "./labels";

export type {ConditionUiModule} from "./conditionUiTypes";

export type ConditionEditorUi = {
    ADD_CONDITION_LABELS: string[];
    getConditionUi(type: string): ConditionUiModule | undefined;
    createConditionStub(addIndex: number): ConditionDesc;
    conditionRowLabel(desc: ConditionDesc): string;
    hideAllConditionSections(): void;
    loadCondition(desc: ConditionDesc): void;
    persistCondition(desc: ConditionDesc): void;
    widgets: unknown[];
};

const ADD_ORDER = [
    "weatherStatus",
    "temperature",
    "dateStatus",
    "parkRating",
    "parkGuestCount",
    "parkCash",
    "parkFlag",
    "scenarioStatus",
    "variableValue",
    "rideStatus",
    "rideBreakdownStatus",
    "rideGuestCount",
    "rideEmpty",
    "trainModulo",
    "carEquals",
    "carModulo",
    "carStatus",
    "carSpeed",
    "carLocation",
    "trainLocation",
    "trackChainLift",
    "trackBrakeSpeed",
    "trackInverted",
    "blockBrakeStatus",
    "guestExists",
    "guestLocation",
    "guestNeed",
    "guestItem",
    "guestFlag",
    "staffExists",
    "staffLocation",
    "staffFlag"
];

export function createConditionEditorUi(onPersist: () => void): ConditionEditorUi {
    const modulo = createModuloFields(onPersist);
    const equals = createEqualsFields(onPersist);
    const compare = createCompareFields(onPersist);
    const ride = createConditionRideFields(onPersist);
    const rideSelect = createRideSelectFields();
    const vehicle = createVehicleTargetFields(rideSelect, onPersist, {
        carTrigger: "Use Trigger Car",
        trainTrigger: "Use Trigger Train",
        carTitle: "Car",
        trainTitle: "Train"
    });
    const tile = createConditionTileFields(onPersist);
    const track = createConditionTrackFields(tile, onPersist);
    const location = createVehicleLocationFields(onPersist, tile, compare);
    const guest = createPeepTargetFields(onPersist, "guest");
    const staff = createPeepTargetFields(onPersist, "staff");
    const variableValue = createVariableValueFields(onPersist);
    const match = createEnumFields(onPersist, "Match", MATCH_OPS, MATCH_LABELS);
    const onOff = createEnumFields(onPersist, "State", ON_OFF, ON_OFF_LABELS);
    const exists = createEnumFields(onPersist, "Check", EXISTS_OPS, EXISTS_LABELS);
    const occupancy = createEnumFields(onPersist, "Tile", OCCUPANCY_OPS, OCCUPANCY_LABELS);
    const empty = createEnumFields(onPersist, "Empty", EMPTY_OPS, EMPTY_LABELS);
    const hasItem = createEnumFields(onPersist, "Item", HAS_OPS, HAS_LABELS);
    const blockBrake = createEnumFields(onPersist, "Brake", BLOCK_BRAKE_OPS, BLOCK_BRAKE_LABELS);
    const dateField = createEnumFields(onPersist, "Field", DATE_FIELDS, DATE_FIELD_LABELS);
    const weather = createEnumFields(onPersist, "Weather", WEATHER_VALUES, labelsForValues(WEATHER_VALUES));
    const rideStatus = createEnumFields(onPersist, "Status", RIDE_STATUSES, labelsForValues(RIDE_STATUSES));
    const scenario = createEnumFields(
        onPersist,
        "Status",
        SCENARIO_STATUSES,
        labelsForValues(SCENARIO_STATUSES)
    );
    const breakdownMode = createEnumFields(onPersist, "Check", BREAKDOWN_MODES, BREAKDOWN_MODE_LABELS);
    const breakdownType = createEnumFields(
        onPersist,
        "Type",
        BREAKDOWN_TYPES,
        labelsForValues(BREAKDOWN_TYPES)
    );
    const carStatus = createEnumFields(
        onPersist,
        "Status",
        VEHICLE_STATUSES,
        labelsForValues(VEHICLE_STATUSES)
    );
    const parkFlag = createEnumFields(onPersist, "Flag", PARK_FLAGS, labelsForValues(PARK_FLAGS));
    const peepFlag = createEnumFields(onPersist, "Flag", PEEP_FLAGS, labelsForValues(PEEP_FLAGS));
    const guestNeed = createEnumFields(onPersist, "Need", GUEST_NEED_FIELDS, GUEST_NEED_LABELS);
    const guestItem = createEnumFields(onPersist, "Item", GUEST_ITEMS, labelsForValues(GUEST_ITEMS));
    const guestScope = createEnumFields(onPersist, "Guest", ENTITY_SCOPES, GUEST_SCOPE_LABELS);
    const staffScope = createEnumFields(onPersist, "Staff", ENTITY_SCOPES, STAFF_SCOPE_LABELS);
    const staffType = createOptionalEnumFields(
        onPersist,
        "Type",
        STAFF_TYPES,
        labelsForValues(STAFF_TYPES),
        "(Any Type)"
    );

    const fieldBag: ConditionFieldBag = {
        modulo,
        equals,
        compare,
        ride,
        vehicle,
        tile,
        track,
        location,
        guest,
        staff,
        variableValue,
        match,
        onOff,
        exists,
        occupancy,
        empty,
        hasItem,
        blockBrake,
        dateField,
        weather,
        rideStatus,
        scenario,
        breakdownMode,
        breakdownType,
        carStatus,
        parkFlag,
        peepFlag,
        guestNeed,
        guestItem,
        guestScope,
        staffScope,
        staffType
    };

    const hiders = [
        modulo,
        equals,
        compare,
        ride,
        vehicle,
        tile,
        track,
        location,
        guest,
        staff,
        variableValue,
        match,
        onOff,
        exists,
        occupancy,
        empty,
        hasItem,
        blockBrake,
        dateField,
        weather,
        rideStatus,
        scenario,
        breakdownMode,
        breakdownType,
        carStatus,
        parkFlag,
        peepFlag,
        guestNeed,
        guestItem,
        guestScope,
        staffScope,
        staffType
    ];

    const modules = createConditionModules(fieldBag);
    const byType: {[type: string]: ConditionUiModule} = {};
    for (let i = 0; i < modules.length; i++) {
        byType[modules[i].type] = modules[i];
    }

    const addable: ConditionUiModule[] = [];
    const ADD_CONDITION_LABELS: string[] = [];
    for (let i = 0; i < ADD_ORDER.length; i++) {
        const module = byType[ADD_ORDER[i]];
        if (module && module.addLabel !== null) {
            addable.push(module);
            ADD_CONDITION_LABELS.push(module.addLabel);
        }
    }

    function getConditionUi(type: string): ConditionUiModule | undefined {
        return byType[type];
    }

    function createConditionStub(addIndex: number): ConditionDesc {
        const module = addable[addIndex] || addable[0];
        return module.createStub();
    }

    function conditionRowLabel(desc: ConditionDesc): string {
        const module = byType[desc.type];
        return module ? module.rowLabel(desc) : `Unknown: ${desc.type}`;
    }

    function hideAllConditionSections(): void {
        for (let i = 0; i < hiders.length; i++) {
            hiders[i].hide();
        }
    }

    function loadCondition(desc: ConditionDesc): void {
        hideAllConditionSections();
        const module = byType[desc.type];
        if (module) {
            module.load(desc);
        }
    }

    function persistCondition(desc: ConditionDesc): void {
        const module = byType[desc.type];
        if (module) {
            module.persist(desc);
        }
    }

    return {
        ADD_CONDITION_LABELS,
        getConditionUi,
        createConditionStub,
        conditionRowLabel,
        hideAllConditionSections,
        loadCondition,
        persistCondition,
        widgets: [
            ...ride.widgets,
            ...vehicle.widgets,
            ...guest.widgets,
            ...staff.widgets,
            ...tile.widgets,
            ...track.widgets,
            ...location.widgets,
            ...guestScope.widgets,
            ...staffScope.widgets,
            ...staffType.widgets,
            ...match.widgets,
            ...exists.widgets,
            ...onOff.widgets,
            ...occupancy.widgets,
            ...empty.widgets,
            ...hasItem.widgets,
            ...blockBrake.widgets,
            ...dateField.widgets,
            ...weather.widgets,
            ...rideStatus.widgets,
            ...scenario.widgets,
            ...breakdownMode.widgets,
            ...breakdownType.widgets,
            ...carStatus.widgets,
            ...parkFlag.widgets,
            ...peepFlag.widgets,
            ...guestNeed.widgets,
            ...guestItem.widgets,
            ...compare.widgets,
            ...variableValue.widgets,
            ...modulo.widgets,
            ...equals.widgets
        ]
    };
}
