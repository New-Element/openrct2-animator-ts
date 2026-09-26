import {button, horizontal, label, store, textbox, twoway, window} from "openrct2-flexui";
import {WINDOW_COLOURS} from "./windowColours";

const titleText = store<string>("Name");
const descriptionText = store<string>("");
const nameText = store<string>("");

let onSubmitted: ((name: string) => void) | null = null;

const promptWindow = window({
    title: titleText,
    colours: WINDOW_COLOURS,
    width: 280,
    height: 130,
    position: "center",
    padding: 8,
    content: [
        label({
            text: descriptionText
        }),
        textbox({
            text: twoway(nameText)
        }),
        horizontal([
            button({
                text: "Cancel",
                width: 60,
                height: 14,
                onClick: () => {
                    promptWindow.close();
                }
            }),
            button({
                text: "OK",
                width: 40,
                height: 14,
                onClick: () => {
                    const name = nameText.get();
                    promptWindow.close();
                    if (onSubmitted) {
                        onSubmitted(name);
                    }
                }
            })
        ])
    ]
});

export function openNamePrompt(args: {
    title: string;
    description: string;
    initialValue?: string;
    onSubmit: (name: string) => void;
}): void {
    titleText.set(args.title);
    descriptionText.set(args.description);
    nameText.set(args.initialValue || "");
    onSubmitted = args.onSubmit;
    promptWindow.open();
}
