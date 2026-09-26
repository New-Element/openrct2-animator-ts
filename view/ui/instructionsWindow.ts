/// <reference path="./../../openrct2.d.ts" />

import {button, listview, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "./windowColours";

function rctLiteral(text: string): string {
    return text.replace(/\{/g, "{{");
}

/**
 * Shared Instructions popup (title + scrollable lines + Close).
 * Used by formula help and custom Javascript help.
 */
export function createInstructionsOpener(
    title: string,
    lines: string[],
    height: number = 280
): () => void {
    const instructionsWindow = window({
        title: title,
        colours: WINDOW_COLOURS,
        width: 400,
        height: height,
        position: "center",
        padding: 8,
        content: [
            listview({
                items: lines.map(rctLiteral),
                scrollbars: "vertical",
                canSelect: false,
                height: "1w"
            }),
            button({
                text: "Close",
                width: 50,
                height: 14,
                onClick: () => {
                    instructionsWindow.close();
                }
            })
        ]
    });

    return () => {
        instructionsWindow.open();
    };
}
