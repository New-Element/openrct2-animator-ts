import {button, horizontal, label, store, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "../ui/windowColours";

const messageText = store<string>("");
let onConfirmed: (() => void) | null = null;

const confirmWindow = window({
    title: "Delete Animation",
    colours: WINDOW_COLOURS,
    width: 280,
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
                text: "Delete",
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
 * Open a delete confirmation dialog. Calls onConfirm only if the user chooses Delete.
 */
export function confirmDeleteAnimation(
    animationId: string,
    animationName: string,
    onConfirm: () => void
): void {
    messageText.set(`Delete "${animationName}"? This cannot be undone.`);
    onConfirmed = onConfirm;
    confirmWindow.open();
}
