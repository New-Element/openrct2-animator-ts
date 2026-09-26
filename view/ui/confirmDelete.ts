import {button, horizontal, label, store, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "./windowColours";

const titleText = store<string>("Delete");
const messageText = store<string>("");

let onConfirmed: (() => void) | null = null;

const confirmWindow = window({
    title: titleText,
    colours: WINDOW_COLOURS,
    width: 300,
    height: 130,
    position: "center",
    padding: 8,
    content: [
        label({
            text: messageText
        }),
        horizontal([
            button({
                text: "Cancel",
                width: 60,
                height: 14,
                onClick: () => {
                    confirmWindow.close();
                }
            }),
            button({
                text: "Delete",
                width: 55,
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

export function confirmDelete(args: {
    title: string;
    message: string;
    onConfirm: () => void;
}): void {
    titleText.set(args.title);
    messageText.set(args.message);
    onConfirmed = args.onConfirm;
    confirmWindow.open();
}
