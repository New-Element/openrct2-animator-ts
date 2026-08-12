import Animation from "./animation";
import PersistentArray from "../data/persistentArray";
import {AnimationDesc, LiftDropTrackStepDesc, StepDesc} from "./jsonTypes";
import {normalizeLiftDropStepDesc} from "./liftDropHeights";
import createStep from "./step/createStep";

export default class AnimationsArray extends PersistentArray {
    items: Animation[] = [];

    constructor() {
        super("animationsv2", "animator");
    }

    getItem(data: object): Animation {
        return new Animation(data as AnimationDesc);
    }

    /**
     * Normalize lift/drop steps from raw park JSON (before Animation construction)
     * so pixel-valued heights and legacy startZ/endZ are fixed on first load.
     */
    load(dataIn: object[] | false): void {
        const data = dataIn !== false ? dataIn : this.getDataFromStorage();
        let migrated = false;
        const normalized: object[] = [];
        for (let i = 0; i < data.length; i++) {
            const anim = data[i] as AnimationDesc;
            if (!anim || !Array.isArray(anim.steps)) {
                normalized.push(data[i]);
                continue;
            }
            const steps: StepDesc[] = [];
            for (let s = 0; s < anim.steps.length; s++) {
                const step = anim.steps[s];
                if (step && step.type === "liftDropTrack") {
                    const result = normalizeLiftDropStepDesc(
                        step as LiftDropTrackStepDesc
                    );
                    if (result.migrated) {
                        migrated = true;
                    }
                    steps.push(result.desc);
                } else {
                    steps.push(step);
                }
            }
            normalized.push({...anim, steps: steps});
        }
        super.load(normalized);
        if (migrated && dataIn === false) {
            this.save();
            console.log(
                "[Animator] Migrated Lift/Drop Track steps to land-unit heights in park storage"
            );
        }
    }

    /**
     * Recreate in-memory lift/drop steps from normalized persist data.
     * Returns true if any step needed migration (caller may save).
     */
    migrateLiftDropSteps(): boolean {
        let changed = false;
        for (let a = 0; a < this.items.length; a++) {
            const animation = this.items[a];
            for (let s = 0; s < animation.steps.length; s++) {
                const raw = animation.steps[s].getDataToPersist() as StepDesc;
                if (raw.type !== "liftDropTrack") {
                    continue;
                }
                const {desc, migrated} = normalizeLiftDropStepDesc(
                    raw as LiftDropTrackStepDesc
                );
                if (migrated) {
                    changed = true;
                }
                animation.steps[s] = createStep(desc);
            }
        }
        return changed;
    }

    findById(id: string): Animation | undefined {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return undefined;
    }

    removeById(id: string): boolean {
        const next: Animation[] = [];
        let removed = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                removed = true;
            } else {
                next.push(this.items[i]);
            }
        }
        this.items = next;
        return removed;
    }
}
