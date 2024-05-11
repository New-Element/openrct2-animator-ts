import {window, label, textbox, Colour, store, twoway} from "openrct2-flexui";
import getConductor from "../../model/getConductor";

const model =
    {
        animationsJsonText: store<string>("")
    };

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

        getConductor().paused = true;

        // pause the conductor

        // set the text to be the current animationsArray JSON records
        //model.animationsJsonText.set();
    },
    onClose: () => {

        let conductor = getConductor();
        let data = JSON.parse(model.animationsJsonText.get());
        conductor.animationsArray.load(data);
        conductor.animationsArray.save();
        conductor.reset();
        conductor.paused = false;


        // write the animations to park storage

        // have the conductor reload its animationsArray

        // resume the conductor

    }
});

export default JsonEntry;