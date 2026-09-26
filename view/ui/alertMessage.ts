import {button, label, store, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "./windowColours";

const titleText = store<string>("Error");
const messageText = store<string>("");

const alertWindow = window({
    title: titleText,
    colours: WINDOW_COLOURS,
    width: 280,
    height: 110,
    position: "center",
    padding: 8,
    content: [
        label({
            text: messageText
        }),
        button({
            text: "OK",
            width: 40,
            height: 14,
            onClick: () => {
                alertWindow.close();
            }
        })
    ]
});

export function showAlert(title: string, message: string): void {
    titleText.set(title);
    messageText.set(message);
    alertWindow.open();
}
