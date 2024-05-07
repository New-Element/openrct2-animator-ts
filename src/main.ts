/// <reference path="./../openrct2.d.ts" />

import Conductor from "../model/conductor";

registerPlugin({
    name: "animator",
    version: "0.0.1",
    authors: ["deanosrs"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 56,
    targetApiVersion: 56,
    main: () => {

        new Conductor();

        /*Updater.update(() => {
            Configuration.load();
            ui.registerMenuItem("Scenery Manager", () => MainWindow.open());
            Shortcuts.register();
            Events.startup.trigger();
            MainWindow.invalidate();
        });*/
    },
});