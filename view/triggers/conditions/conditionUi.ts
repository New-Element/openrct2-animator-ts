import {ConditionDesc} from "../../../model/animation/jsonTypes";
import {createCarEqualsConditionUi} from "./carEqualsConditionUi";
import {createCarModuloConditionUi} from "./carModuloConditionUi";
import {ConditionUiModule} from "./conditionUiTypes";
import {createEqualsFields} from "./fields/equalsFields";
import {createModuloFields} from "./fields/moduloFields";
import {createRideOpenConditionUi} from "./rideOpenConditionUi";
import {createTrainModuloConditionUi} from "./trainModuloConditionUi";

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

export function createConditionEditorUi(onPersist: () => void): ConditionEditorUi {
    const modulo = createModuloFields(onPersist);
    const equals = createEqualsFields(onPersist);

    const modules: ConditionUiModule[] = [
        createTrainModuloConditionUi(modulo),
        createCarEqualsConditionUi(equals),
        createCarModuloConditionUi(modulo),
        createRideOpenConditionUi()
    ];

    const byType: {[type: string]: ConditionUiModule} = {};
    for (let i = 0; i < modules.length; i++) {
        byType[modules[i].type] = modules[i];
    }

    const addable: ConditionUiModule[] = [];
    const ADD_CONDITION_LABELS: string[] = [];
    // Preserve previous add order: Train Modulo, Car Equals, Car Modulo
    const addOrder = ["trainModulo", "carEquals", "carModulo"];
    for (let i = 0; i < addOrder.length; i++) {
        const module = byType[addOrder[i]];
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
        modulo.hide();
        equals.hide();
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
        widgets: [...modulo.widgets, ...equals.widgets]
    };
}
