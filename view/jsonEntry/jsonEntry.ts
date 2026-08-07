/// <reference path="./../../openrct2.d.ts" />

import {
    tabwindow,
    tab,
    textbox,
    button,
    dropdown,
    listview,
    horizontal,
    groupbox,
    Colour,
    twoway,
    vertical
} from "openrct2-flexui";
import getConductor from "../../model/getConductor";
import {animationsListModel} from "../animations/animationsListModel";
import {createPluginInfoContent} from "../info/pluginInfoContent";
import {FILTER_EVENT_LABELS} from "../triggers/eventType";
import {triggersListModel} from "../triggers/triggersListModel";
import {variablesListModel} from "../variables/variablesListModel";

let JsonEntry = tabwindow({
    title: "Animator",
    colours: [Colour.DarkOliveGreen, Colour.DarkOliveGreen, Colour.DarkOliveGreen],
    width: {value: 420, min: 280, max: 700},
    height: {value: 360, min: 260, max: 700},
    position: "center",
    tabs: [
        tab({
            image: "chain_lift",
            padding: 8,
            content: [
                groupbox({
                    text: "Search Triggers",
                    content: [
                        horizontal([
                            textbox({
                                text: twoway(triggersListModel.searchText),
                                onChange: (text) => {
                                    triggersListModel.searchText.set(text);
                                    triggersListModel.refresh();
                                }
                            }),
                            dropdown({
                                width: 120,
                                items: FILTER_EVENT_LABELS,
                                selectedIndex: twoway(triggersListModel.filterEventIndex),
                                onChange: (index) => {
                                    triggersListModel.filterEventIndex.set(index);
                                    triggersListModel.refresh();
                                }
                            })
                        ])
                    ]
                }),
                listview({
                    items: triggersListModel.listItems,
                    columns: [
                        { header: "Name", canSort: true },
                        { header: "Event", canSort: true, width: "100px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    onClick: (item) => {
                        triggersListModel.openTriggerAtListIndex(item);
                    }
                }),
                button({
                    text: "Add Trigger",
                    width: 85,
                    height: 14,
                    onClick: () => {
                        triggersListModel.addUntitledTrigger();
                    }
                })
            ]
        }),
        tab({
            image: "construction",
            padding: 8,
            content: [
                groupbox({
                    text: "Search Animations",
                    content: [
                        textbox({
                            text: twoway(animationsListModel.searchText),
                            onChange: (text) => {
                                animationsListModel.searchText.set(text);
                                animationsListModel.refresh();
                            }
                        })
                    ]
                }),
                listview({
                    items: animationsListModel.listItems,
                    columns: [
                        { header: "Name", canSort: true },
                        { header: "Steps", canSort: true, width: "60px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    onClick: (item) => {
                        animationsListModel.openAnimationAtListIndex(item);
                    }
                }),
                button({
                    text: "Add Animation",
                    width: 100,
                    height: 14,
                    onClick: () => {
                        animationsListModel.addUntitledAnimation();
                    }
                })
            ]
        }),
        tab({
            image: "finance",
            padding: 8,
            content: [
                groupbox({
                    text: "Search Variables",
                    content: [
                        textbox({
                            text: twoway(variablesListModel.searchText),
                            onChange: (text) => {
                                variablesListModel.searchText.set(text);
                                variablesListModel.refresh();
                            }
                        })
                    ]
                }),
                listview({
                    items: variablesListModel.listItems,
                    columns: [
                        { header: "Name", canSort: true },
                        { header: "Type", canSort: true, width: "60px" },
                        { header: "Value", canSort: true, width: "70px" },
                        { header: "Reset Value", canSort: true, width: "80px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    onClick: (item) => {
                        variablesListModel.openVariableAtListIndex(item);
                    }
                }),
                horizontal([
                    button({
                        text: "Add Variable",
                        width: 95,
                        height: 14,
                        onClick: () => {
                            variablesListModel.addUntitledVariable();
                        }
                    }),
                    button({
                        text: "Reset Variables",
                        width: 110,
                        height: 14,
                        onClick: () => {
                            variablesListModel.resetAllVariablesWithConfirm();
                        }
                    })
                ])
            ]
        }),
        tab({
            image: "question",
            padding: 8,
            content: [
                vertical({
                    spacing: 6,
                    content: createPluginInfoContent()
                })
            ]
        })
    ],
    onOpen: () => {
        getConductor().paused = true;
        triggersListModel.refresh();
        animationsListModel.refresh();
        variablesListModel.refresh();
    },
    onClose: () => {
        getConductor().paused = false;
    }
});

export default JsonEntry;
