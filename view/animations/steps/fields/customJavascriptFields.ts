/// <reference path="./../../../../openrct2.d.ts" />

import {button, groupbox, store, textbox, twoway} from "openrct2-flexui";
import {CustomJavascriptStepDesc} from "../../../../model/animation/jsonTypes";
import {openCustomJavascriptInstructions} from "../customJavascriptInstructions";

export type CustomJavascriptFields = ReturnType<typeof createCustomJavascriptFields>;

export function createCustomJavascriptFields(onPersist: () => void) {
    const visibility = store<"visible" | "none">("none");
    const code = store<string>("");

    function hide(): void {
        visibility.set("none");
    }

    function load(desc: CustomJavascriptStepDesc): void {
        visibility.set("visible");
        code.set(desc.code);
    }

    function persist(): CustomJavascriptStepDesc {
        return {
            type: "customJavascript",
            code: code.get()
        };
    }

    const widgets = [
        groupbox({
            text: "Custom Javascript",
            visibility,
            content: [
                textbox({
                    text: twoway(code),
                    maxLength: 4096,
                    visibility,
                    onChange: (value) => {
                        code.set(value);
                        onPersist();
                    }
                }),
                button({
                    text: "Instructions",
                    width: 90,
                    height: 14,
                    visibility,
                    onClick: () => openCustomJavascriptInstructions()
                })
            ]
        })
    ];

    return {
        hide,
        load,
        persist,
        widgets
    };
}
