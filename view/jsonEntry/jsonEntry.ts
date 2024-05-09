import {window, box, label, textbox, Colour, store, twoway} from "openrct2-flexui";

const model =
    {
        animationsJsonText: store<string>("a value")
    };

model.animationsJsonText.subscribe((text: string) => {
    console.log('UPDATE!');
    console.log(text);
});

let JsonEntry = window({
    title: "Animator",
    colours: [Colour.DarkOliveGreen, Colour.DarkOliveGreen],
    width: {value: 350, min: 220, max: 500},
    height: {value: 300, min: 220, max: 400},
    position: "center",
    padding: 8,
    content: [
        label({
            text: "This is a label"
        }),
        textbox({
            maxLength: 10000,
            text: twoway(model.animationsJsonText)
        })
    ],
    onOpen: () => {

        console.log('open window');

        // pause the conductor

        // set the text to be the current animationsArray JSON records
        //model.animationsJsonText.set();
    },
    onClose: () => {

        // write the animations to park storage

        // have the conductor reload its animationsArray

        // resume the conductor

    }
});

export default JsonEntry;