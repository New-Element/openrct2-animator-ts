import {StepDesc} from "../../../model/animation/jsonTypes";
import {ADD_STEP_CATEGORIES, groupAddStepModules} from "./addStepCategories";
import {createContextMutateStepModules} from "./contextMutateStepUi";
import {createCarCoordsOverTimeStepUi} from "./carCoordsOverTimeStepUi";
import {createCarEditColourStepUi} from "./carEditColourStepUi";
import {createInstantStepModules} from "./createInstantStepModules";
import {createSetCarCoordsStepUi, createSetStaffCoordsStepUi} from "./applyCoordsStepUi";
import {createBannerFields} from "./fields/bannerFields";
import {createApplyCoordsFields} from "./fields/applyCoordsFields";
import {
    createCarMoveToTrackFields,
    createCarNumberFields,
    createCarStatusFields,
    createCarToggleFields
} from "./fields/carPropertyFields";
import {createContextMutateFields} from "./fields/contextMutateFields";
import {createColourFields} from "./fields/colourFields";
import {createCoordsFields} from "./fields/coordsFields";
import {createCustomJavascriptFields} from "./fields/customJavascriptFields";
import {createParticleFields} from "./fields/createParticleFields";
import {createShootParticlesFields} from "./fields/shootParticlesFields";
import {createGuestStepFields} from "./fields/guestStepFields";
import {createLiftDropTrackFields} from "./fields/liftDropTrackFields";
import {createParkStepFields} from "./fields/parkStepFields";
import {createPathFields} from "./fields/pathFields";
import {createRideSelectFields} from "./fields/rideSelectFields";
import {createRideExtraFields} from "./fields/rideStepFields";
import {createRideTargetFields} from "./fields/rideTargetFields";
import {createSceneryRecolourFields} from "./fields/sceneryRecolourFields";
import {createSceneryRotationFields} from "./fields/sceneryRotationFields";
import {createSceneryVisibilityFields} from "./fields/sceneryVisibilityFields";
import {createStaffStepFields} from "./fields/staffStepFields";
import {createSurfaceFields} from "./fields/surfaceFields";
import {createSwitchTiTrackOrderFields} from "./fields/switchTiTrackOrderFields";
import {createTrackChainLiftFields} from "./fields/trackChainLiftFields";
import {createTrackPositionOverTimeFields} from "./fields/trackPositionOverTimeFields";
import {createTrackFields} from "./fields/trackFields";
import {createTrackPropertyFields} from "./fields/trackPropertyFields";
import {createVariableRandomIntFields} from "./fields/variableRandomIntFields";
import {createVariableStepFields} from "./fields/variableStepFields";
import {createVehicleTargetFields} from "./fields/vehicleTargetFields";
import {createWriteMapValueFields} from "./fields/writeMapValueFields";
import {createWaitFields} from "./fields/waitFields";
import {createCustomJavascriptStepUi} from "./customJavascriptStepUi";
import {createCreateParticleStepUi} from "./createParticleStepUi";
import {createShootParticlesStepUi} from "./shootParticlesStepUi";
import {createLiftDropTrackStepUi} from "./liftDropTrackStepUi";
import {createSceneryVisibilityStepUi} from "./sceneryVisibilityStepUi";
import {StepUiModule} from "./stepUiTypes";
import {createSwitchTiTrackOrderStepUi} from "./switchTiTrackOrderStepUi";
import {createTrackChainLiftStepUi} from "./trackChainLiftStepUi";
import {createTrackSetHeightStepUi} from "./trackSetHeightStepUi";
import {createTrackPositionOverTimeStepUi} from "./trackPositionOverTimeStepUi";
import {createTrainCoordsOverTimeStepUi} from "./trainCoordsOverTimeStepUi";
import {createTrainEditColourStepUi} from "./trainEditColourStepUi";
import {createVariableDecrementStepUi} from "./variableDecrementStepUi";
import {createVariableIncrementStepUi} from "./variableIncrementStepUi";
import {createVariableRandomIntStepUi} from "./variableRandomIntStepUi";
import {createVariableSetStepUi} from "./variableSetStepUi";
import {
    createWriteCameraRotationStepUi,
    createWriteCarCoordsStepUi,
    createWriteCarTrackDirectionStepUi,
    createWriteGuestCoordsStepUi,
    createWriteGuestDirectionStepUi,
    createWriteStaffCoordsStepUi,
    createWriteStaffDirectionStepUi,
    createWriteTriggerTileStepUi
} from "./writeMapValueStepUi";
import {createWaitStepUi} from "./waitStepUi";
import {createBranchStepUi} from "./branchStepUi";

export type {StepUiModule} from "./stepUiTypes";

export type StepEditorUi = {
    ADD_STEP_CATEGORY_LABELS: string[];
    getStepUi(type: string): StepUiModule | undefined;
    isKnownStepDesc(desc: {type: string}): desc is StepDesc;
    stepLabelsForCategory(categoryIndex: number): string[];
    createStepStub(categoryIndex: number, stepIndex: number): StepDesc;
    stepRowLabel(desc: StepDesc): string;
    hideAllStepSections(): void;
    loadStep(desc: StepDesc): void;
    persistStep(current: StepDesc): StepDesc | null;
    refreshVariableOptions(): void;
    refreshRideOptions(): void;
    widgets: unknown[];
};

/**
 * Builds step field groups, per-type UI modules, and the fixed-tree widgets for the animation editor.
 */
export function createStepEditorUi(onPersist: () => void, getStepCount: () => number): StepEditorUi {
    const rideSelect = createRideSelectFields();
    const wait = createWaitFields(onPersist);
    const colour = createColourFields(onPersist);
    const vehicleTarget = createVehicleTargetFields(rideSelect, onPersist);
    const variable = createVariableStepFields(onPersist);
    const randomInt = createVariableRandomIntFields(onPersist);
    const writeMap = createWriteMapValueFields(onPersist);
    const applyCoords = createApplyCoordsFields(onPersist);
    const track = createTrackFields(rideSelect, onPersist);
    const switchTiTrackOrder = createSwitchTiTrackOrderFields(rideSelect, onPersist);
    const trackChainLift = createTrackChainLiftFields(rideSelect, onPersist);
    const liftDropTrack = createLiftDropTrackFields(onPersist);
    const coords = createCoordsFields(onPersist);
    const trackPosition = createTrackPositionOverTimeFields(onPersist);
    const sceneryVisibility = createSceneryVisibilityFields(onPersist);
    const sceneryRecolour = createSceneryRecolourFields(onPersist);
    const sceneryRotation = createSceneryRotationFields(onPersist);
    const trackProperty = createTrackPropertyFields(rideSelect, onPersist);
    const surface = createSurfaceFields(onPersist);
    const path = createPathFields(onPersist);
    const banner = createBannerFields(onPersist);
    const carNumber = createCarNumberFields(onPersist);
    const carToggle = createCarToggleFields(onPersist);
    const carStatus = createCarStatusFields(onPersist);
    const carMoveToTrack = createCarMoveToTrackFields(onPersist);
    const rideTarget = createRideTargetFields(onPersist);
    const rideExtra = createRideExtraFields(onPersist);
    const guest = createGuestStepFields(onPersist);
    const staff = createStaffStepFields(onPersist);
    const park = createParkStepFields(onPersist);
    const customJavascript = createCustomJavascriptFields(onPersist);
    const createParticle = createParticleFields(onPersist, rideSelect);
    const shootParticles = createShootParticlesFields(onPersist, rideSelect);
    const contextMutate = createContextMutateFields(onPersist);
    const branch = createBranchStepUi(onPersist, getStepCount);

    const modules: StepUiModule[] = [
        createWaitStepUi(wait),
        ...createContextMutateStepModules(contextMutate),
        createCarEditColourStepUi(colour, vehicleTarget),
        createTrainEditColourStepUi(colour, vehicleTarget),
        createVariableSetStepUi(variable),
        createVariableIncrementStepUi(variable),
        createVariableDecrementStepUi(variable),
        createVariableRandomIntStepUi(randomInt),
        createWriteTriggerTileStepUi(writeMap),
        createWriteCarCoordsStepUi(writeMap, vehicleTarget),
        createWriteGuestCoordsStepUi(writeMap),
        createWriteStaffCoordsStepUi(writeMap),
        createWriteCameraRotationStepUi(writeMap),
        createWriteGuestDirectionStepUi(writeMap),
        createWriteStaffDirectionStepUi(writeMap),
        createWriteCarTrackDirectionStepUi(writeMap, vehicleTarget),
        createSetCarCoordsStepUi(applyCoords, vehicleTarget),
        createSetStaffCoordsStepUi(applyCoords),
        createTrackSetHeightStepUi(track),
        createSwitchTiTrackOrderStepUi(switchTiTrackOrder),
        createTrackChainLiftStepUi(trackChainLift),
        createLiftDropTrackStepUi(liftDropTrack, vehicleTarget),
        createCarCoordsOverTimeStepUi(coords, vehicleTarget),
        createTrainCoordsOverTimeStepUi(coords),
        createTrackPositionOverTimeStepUi(trackPosition, vehicleTarget),
        createSceneryVisibilityStepUi(sceneryVisibility),
        ...createInstantStepModules({
            sceneryRecolour,
            sceneryRotation,
            trackProperty,
            surface,
            path,
            banner,
            vehicleTarget,
            carNumber,
            carToggle,
            carStatus,
            carMoveToTrack,
            rideTarget,
            rideExtra,
            guest,
            staff,
            park
        }),
        createCustomJavascriptStepUi(customJavascript),
        createCreateParticleStepUi(createParticle),
        createShootParticlesStepUi(shootParticles),
        branch.module
    ];

    const byType: {[type: string]: StepUiModule} = {};
    for (let i = 0; i < modules.length; i++) {
        byType[modules[i].type] = modules[i];
    }

    const addStepGroups = groupAddStepModules(modules);
    const ADD_STEP_CATEGORY_LABELS: string[] = [];
    for (let i = 0; i < ADD_STEP_CATEGORIES.length; i++) {
        ADD_STEP_CATEGORY_LABELS.push(ADD_STEP_CATEGORIES[i].label);
    }

    function getStepUi(type: string): StepUiModule | undefined {
        return byType[type];
    }

    function isKnownStepDesc(desc: {type: string}): desc is StepDesc {
        return !!byType[desc.type];
    }

    function stepLabelsForCategory(categoryIndex: number): string[] {
        const group = addStepGroups[categoryIndex] || [];
        const labels: string[] = [];
        for (let i = 0; i < group.length; i++) {
            labels.push(group[i].addLabel);
        }
        return labels;
    }

    function createStepStub(categoryIndex: number, stepIndex: number): StepDesc {
        const group = addStepGroups[categoryIndex] || addStepGroups[0] || [];
        const module = group[stepIndex] || group[0] || modules[0];
        return module.createStub();
    }

    function stepRowLabel(desc: StepDesc): string {
        const custom = typeof desc.name === "string" ? desc.name.trim() : "";
        if (custom) {
            return custom;
        }
        const module = byType[desc.type];
        return module ? module.rowLabel(desc) : `Unknown: ${desc.type}`;
    }

    function hideAllStepSections(): void {
        wait.hide();
        colour.hide();
        vehicleTarget.hide();
        variable.hide();
        randomInt.hide();
        writeMap.hide();
        applyCoords.hide();
        track.hide();
        switchTiTrackOrder.hide();
        trackChainLift.hide();
        liftDropTrack.hide();
        coords.hide();
        trackPosition.hide();
        sceneryVisibility.hide();
        sceneryRecolour.hide();
        sceneryRotation.hide();
        trackProperty.hide();
        surface.hide();
        path.hide();
        banner.hide();
        carNumber.hide();
        carToggle.hide();
        carStatus.hide();
        carMoveToTrack.hide();
        rideTarget.hide();
        rideExtra.hide();
        guest.hide();
        staff.hide();
        park.hide();
        customJavascript.hide();
        createParticle.hide();
        shootParticles.hide();
        contextMutate.hide();
        branch.hide();
    }

    function loadStep(desc: StepDesc): void {
        hideAllStepSections();
        const module = byType[desc.type];
        if (module) {
            module.load(desc);
        }
    }

    function persistStep(current: StepDesc): StepDesc | null {
        const module = byType[current.type];
        const next = module ? module.persist(current) : null;
        if (next) {
            const n = typeof current.name === "string" ? current.name.trim() : "";
            if (n) {
                next.name = n;
            }
        }
        return next;
    }

    return {
        ADD_STEP_CATEGORY_LABELS,
        getStepUi,
        isKnownStepDesc,
        stepLabelsForCategory,
        createStepStub,
        stepRowLabel,
        hideAllStepSections,
        loadStep,
        persistStep,
        refreshVariableOptions: () => {
            variable.refreshVariableOptions();
            randomInt.refresh();
        },
        refreshRideOptions: () => rideSelect.refreshRideOptions(),
        widgets: [
            ...wait.widgets,
            ...vehicleTarget.widgets,
            ...colour.widgets,
            ...variable.widgets,
            ...randomInt.widgets,
            ...writeMap.widgets,
            ...applyCoords.widgets,
            ...track.widgets,
            ...switchTiTrackOrder.widgets,
            ...trackChainLift.widgets,
            ...liftDropTrack.widgets,
            ...coords.widgets,
            ...trackPosition.widgets,
            ...sceneryVisibility.widgets,
            ...sceneryRecolour.widgets,
            ...sceneryRotation.widgets,
            ...trackProperty.widgets,
            ...surface.widgets,
            ...path.widgets,
            ...banner.widgets,
            ...carNumber.widgets,
            ...carToggle.widgets,
            ...carStatus.widgets,
            ...carMoveToTrack.widgets,
            ...rideTarget.widgets,
            ...rideExtra.widgets,
            ...guest.widgets,
            ...staff.widgets,
            ...park.widgets,
            ...customJavascript.widgets,
            ...createParticle.widgets,
            ...shootParticles.widgets,
            ...contextMutate.widgets,
            ...branch.widgets
        ]
    };
}
