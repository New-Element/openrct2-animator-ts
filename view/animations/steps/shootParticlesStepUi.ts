import {ShootParticlesStepDesc, StepDesc} from "../../../model/animation/jsonTypes";
import {ShootParticlesFields} from "./fields/shootParticlesFields";
import {StepUiModule} from "./stepUiTypes";

export function createShootParticlesStepUi(fields: ShootParticlesFields): StepUiModule {
    return {
        type: "shootParticles",
        addLabel: "Shoot Particles",
        rowLabel: () => "Shoot Particles",
        createStub: (): ShootParticlesStepDesc => ({
            type: "shootParticles",
            launch: "car",
            useTriggerTarget: false,
            rideId: 0,
            trainIndex: 0,
            carIndex: 0,
            count: 24,
            direction: 0,
            tilt: 0,
            spread: 12,
            distance: 3,
            lifetime: 40,
            body: 17,
            trim: 20,
            body2: 28,
            trim2: 21
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "shootParticles") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "shootParticles") {
                return null;
            }
            return fields.persist();
        }
    };
}
