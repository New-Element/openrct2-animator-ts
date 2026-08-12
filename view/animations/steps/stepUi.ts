import {StepDesc} from "../../../model/animation/jsonTypes";
import {createCarCoordsOverTimeStepUi} from "./carCoordsOverTimeStepUi";
import {createCarEditColourStepUi} from "./carEditColourStepUi";
import {createColourFields} from "./fields/colourFields";
import {createCoordsFields} from "./fields/coordsFields";
import {createLiftDropTrackFields} from "./fields/liftDropTrackFields";
import {createRideSelectFields} from "./fields/rideSelectFields";
import {createSwitchTiTrackOrderFields} from "./fields/switchTiTrackOrderFields";
import {createTrackFields} from "./fields/trackFields";
import {createVariableStepFields} from "./fields/variableStepFields";
import {createVehicleTargetFields} from "./fields/vehicleTargetFields";
import {createWaitFields} from "./fields/waitFields";
import {createLiftDropTrackStepUi} from "./liftDropTrackStepUi";
import {StepUiModule} from "./stepUiTypes";
import {createSwitchTiTrackOrderStepUi} from "./switchTiTrackOrderStepUi";
import {createTrackSetHeightStepUi} from "./trackSetHeightStepUi";
import {createTrainCoordsOverTimeStepUi} from "./trainCoordsOverTimeStepUi";
import {createTrainEditColourStepUi} from "./trainEditColourStepUi";
import {createVariableDecrementStepUi} from "./variableDecrementStepUi";
import {createVariableIncrementStepUi} from "./variableIncrementStepUi";
import {createVariableSetStepUi} from "./variableSetStepUi";
import {createWaitStepUi} from "./waitStepUi";

export type {StepUiModule} from "./stepUiTypes";

export type StepEditorUi = {
    ADD_STEP_LABELS: string[];
    getStepUi(type: string): StepUiModule | undefined;
    isKnownStepDesc(desc: {type: string}): desc is StepDesc;
    createStepStub(addIndex: number): StepDesc;
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
export function createStepEditorUi(onPersist: () => void): StepEditorUi {
    const rideSelect = createRideSelectFields();
    const wait = createWaitFields(onPersist);
    const colour = createColourFields(onPersist);
    const vehicleTarget = createVehicleTargetFields(rideSelect, onPersist);
    const variable = createVariableStepFields(onPersist);
    const track = createTrackFields(rideSelect, onPersist);
    const switchTiTrackOrder = createSwitchTiTrackOrderFields(rideSelect, onPersist);
    const liftDropTrack = createLiftDropTrackFields(onPersist);
    const coords = createCoordsFields(onPersist);

    const modules: StepUiModule[] = [
        createWaitStepUi(wait),
        createCarEditColourStepUi(colour, vehicleTarget),
        createTrainEditColourStepUi(colour, vehicleTarget),
        createVariableSetStepUi(variable),
        createVariableIncrementStepUi(variable),
        createVariableDecrementStepUi(variable),
        createTrackSetHeightStepUi(track),
        createSwitchTiTrackOrderStepUi(switchTiTrackOrder),
        createLiftDropTrackStepUi(liftDropTrack, vehicleTarget),
        createCarCoordsOverTimeStepUi(coords),
        createTrainCoordsOverTimeStepUi(coords)
    ];

    const byType: {[type: string]: StepUiModule} = {};
    for (let i = 0; i < modules.length; i++) {
        byType[modules[i].type] = modules[i];
    }

    const ADD_STEP_LABELS: string[] = [];
    for (let i = 0; i < modules.length; i++) {
        ADD_STEP_LABELS.push(modules[i].addLabel);
    }

    function getStepUi(type: string): StepUiModule | undefined {
        return byType[type];
    }

    function isKnownStepDesc(desc: {type: string}): desc is StepDesc {
        return !!byType[desc.type];
    }

    function createStepStub(addIndex: number): StepDesc {
        const module = modules[addIndex] || modules[0];
        return module.createStub();
    }

    function stepRowLabel(desc: StepDesc): string {
        const module = byType[desc.type];
        return module ? module.rowLabel(desc) : `Unknown: ${desc.type}`;
    }

    function hideAllStepSections(): void {
        wait.hide();
        colour.hide();
        vehicleTarget.hide();
        variable.hide();
        track.hide();
        switchTiTrackOrder.hide();
        liftDropTrack.hide();
        coords.hide();
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
        return module ? module.persist(current) : null;
    }

    return {
        ADD_STEP_LABELS,
        getStepUi,
        isKnownStepDesc,
        createStepStub,
        stepRowLabel,
        hideAllStepSections,
        loadStep,
        persistStep,
        refreshVariableOptions: () => variable.refreshVariableOptions(),
        refreshRideOptions: () => rideSelect.refreshRideOptions(),
        widgets: [
            ...wait.widgets,
            ...colour.widgets,
            ...vehicleTarget.widgets,
            ...variable.widgets,
            ...track.widgets,
            ...switchTiTrackOrder.widgets,
            ...liftDropTrack.widgets,
            ...coords.widgets
        ]
    };
}
