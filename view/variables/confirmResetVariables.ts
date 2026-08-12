import {button, horizontal, label, store, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "../ui/windowColours";

const messageText = store<string>("");
let onConfirmed: (() => void) | null = null;

const confirmWindow = window({
    title: "Reset Variables",
    colours: WINDOW_COLOURS,
    width: 300,
    height: 120,
    position: "center",
    padding: 8,
    content: [
        label({
            text: messageText
        }),
        horizontal([
            button({
                text: "Cancel",
                height: 14,
                onClick: () => {
                    confirmWindow.close();
                }
            }),
            button({
                text: "Reset",
                height: 14,
                onClick: () => {
                    confirmWindow.close();
                    if (onConfirmed) {
                        onConfirmed();
                    }
                }
            })
        ])
    ]
});

/**
 * Open a reset confirmation dialog. Calls onConfirm only if the user chooses Reset.
 */
export function confirmResetVariables(onConfirm: () => void): void {
    messageText.set("Reset All Variables To Their Defaults?");
    onConfirmed = onConfirm;
    confirmWindow.open();
}
