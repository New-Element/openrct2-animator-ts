import {CreateParticleStepDesc, StepDesc} from "../../../model/animation/jsonTypes";
import {CreateParticleFields} from "./fields/createParticleFields";
import {StepUiModule} from "./stepUiTypes";

const KIND_LABELS: {[kind in CreateParticleStepDesc["particle"]]: string} = {
    steam: "Steam",
    explosionCloud: "Explosion Cloud",
    explosionFlare: "Explosion Flare"
};

export function createCreateParticleStepUi(fields: CreateParticleFields): StepUiModule {
    return {
        type: "createParticle",
        addLabel: "Create Particle",
        rowLabel: (desc: StepDesc) => {
            if (desc.type !== "createParticle") {
                return "Create Particle";
            }
            return `Create Particle (${KIND_LABELS[desc.particle] || "Steam"})`;
        },
        createStub: () => ({
            type: "createParticle",
            particle: "steam",
            launch: "car",
            useTriggerTarget: false,
            rideId: 0,
            trainIndex: 0,
            carIndex: 0
        }),
        load: (desc: StepDesc) => {
            if (desc.type !== "createParticle") {
                return;
            }
            fields.load(desc);
        },
        persist: (current: StepDesc): StepDesc | null => {
            if (current.type !== "createParticle") {
                return null;
            }
            return fields.persist();
        }
    };
}
