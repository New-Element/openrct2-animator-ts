import {button, Colour, horizontal, label, store, window} from "openrct2-flexui";

const messageText = store<string>("");
let onConfirmed: (() => void) | null = null;

const confirmWindow = window({
    title: "Delete Trigger",
    colours: [Colour.DarkOliveGreen, Colour.DarkOliveGreen],
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
export function confirmDeleteTrigger(
    triggerId: string,
    triggerName: string,
    onConfirm: () => void
): void {
    messageText.set(`Delete "${triggerName}"? This cannot be undone.`);
    onConfirmed = onConfirm;
    confirmWindow.open();
}
