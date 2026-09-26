import {button, Colour, graphics, horizontal, label, window as flexWindow} from "openrct2-flexui";
import {error} from "../../logger";
import {CustomJavascriptStepDesc} from "../jsonTypes";
import {createAnimatorApi} from "./animatorApi";
import InstantStep from "./instantStep";
import {logMetaFromRun} from "./stepHelpers";
import StepRunContext from "./stepRunContext";

type FlexuiGlobal = {
    window: typeof flexWindow;
    label: typeof label;
    button: typeof button;
    horizontal: typeof horizontal;
    graphics: typeof graphics;
    Colour: typeof Colour;
};

/**
 * Custom scripts run via new Function, which only sees the plugin global object.
 * FlexUI is a library import, so publish the calls those scripts need.
 */
function flexuiGlobal(): FlexuiGlobal {
    const root = new Function("return this")() as {flexui?: FlexuiGlobal};
    root.flexui = {
        window: flexWindow,
        label: label,
        button: button,
        horizontal: horizontal,
        graphics: graphics,
        Colour: Colour
    };
    return root.flexui;
}

export default class CustomJavascriptStep extends InstantStep {
    code: string;

    constructor(obj: CustomJavascriptStepDesc) {
        super(obj);
        this.code = typeof obj.code === "string" ? obj.code : "";
    }

    protected apply(run: StepRunContext): void {
        if (!this.code) {
            return;
        }
        try {
            flexuiGlobal();
            const fn = new Function("animator", this.code);
            fn(createAnimatorApi(run));
        } catch (e) {
            error("step", "Custom Javascript failed", e, logMetaFromRun(run));
        }
    }

    getDataToPersist(): object {
        return {
            type: "customJavascript",
            code: this.code
        };
    }
}
