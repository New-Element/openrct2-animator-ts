import {Bindable, button, horizontal, textbox} from "openrct2-flexui";

/**
 * Name textbox with a Clear button on the right. onChange also runs for Clear (empty string).
 */
export function nameTextField(args: {
    text: Bindable<string>;
    onChange: (text: string) => void;
}) {
    return horizontal([
        textbox({
            text: args.text,
            onChange: args.onChange
        }),
        button({
            text: "Clear",
            width: 50,
            height: 14,
            onClick: () => args.onChange("")
        })
    ]);
}
