/// <reference path="./../../openrct2.d.ts" />

import {
    tabwindow,
    tab,
    textbox,
    button,
    dropdown,
    label,
    listview,
    horizontal,
    groupbox,
    toggle,
    twoway,
    vertical
} from "openrct2-flexui";
import {animationsListModel} from "../animations/animationsListModel";
import {
    animationsTabHelp,
    logsTabHelp,
    lookInsideTabHelp,
    todosTabHelp,
    triggersTabHelp,
    variablesTabHelp
} from "./mainWindowTutorials";
import {createPluginInfoContent} from "../info/pluginInfoContent";
import {buildingsListModel} from "../lookInside/buildingsListModel";
import {
    CYCLE_ROOF_MODE_DEFAULT_LABEL,
    onTabRoofToggle,
    syncTabRoofModeUi,
    tabCursorHoverPressed,
    tabHideAllPressed,
    tabShowAllPressed
} from "../lookInside/tabRoofMode";
import {FILTER_EVENT_LABELS} from "../triggers/eventType";
import {logsListModel} from "../logs/logsListModel";
import {triggersListModel} from "../triggers/triggersListModel";
import {folderExplorerButtons} from "../ui/folderExplorerButtons";
import {TAB_WINDOW_COLOURS} from "../ui/windowColours";
import {
    clearRemainingHighlight,
    remainingHighlightPressed,
    setRemainingHighlight
} from "../todos/remainingHighlight";
import {todosListModel} from "../todos/todosListModel";
import {TODO_FILTER_LABELS} from "../todos/todosStore";
import {variablesListModel} from "../variables/variablesListModel";

const triggersTabIcon: ImageAnimation = {
    frameBase: 5229,
    frameCount: 8,
    frameDuration: 4,
};

const animationsTabIcon: ImageAnimation = {
    frameBase: 5205,
    frameCount: 16,
    frameDuration: 4,
};

const variablesTabIcon: ImageAnimation = {
    frameBase: 5375,
    frameCount: 16,
    frameDuration: 4,
};

const todosTabIcon: ImageAnimation = {
    frameBase: 5511,
    frameCount: 16,
    frameDuration: 4,
};

const infoTabIcon: ImageAnimation = {
    frameBase: 5367,
    frameCount: 8,
    frameDuration: 4,
};

function createJsonEntry() {
    return tabwindow({
    title: "Animator",
    colours: TAB_WINDOW_COLOURS,
    width: {value: 420, min: 360, max: 700},
    height: {value: 360, min: 260, max: 700},
    position: "center",
    tabs: [
        tab({
            image: triggersTabIcon,
            padding: 8,
            content: [
                triggersTabHelp(),
                label({
                    text: triggersListModel.pathText
                }),
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
                        { header: "Event", canSort: true, width: "100px" },
                        { header: "Enabled", canSort: true, width: "70px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    selectedCell: twoway(triggersListModel.selectedCell),
                    onClick: (item) => {
                        triggersListModel.onRowClick(item);
                    }
                }),
                horizontal(folderExplorerButtons({
                    onNewFolder: () => triggersListModel.newFolder(),
                    onAdd: () => triggersListModel.addUntitledTrigger(),
                    addLabel: "Add Trigger",
                    addWidth: 85,
                    onRename: () => triggersListModel.renameSelected(),
                    onMove: () => triggersListModel.moveSelected(),
                    onDelete: () => triggersListModel.deleteSelected()
                }))
            ]
        }),
        tab({
            image: animationsTabIcon,
            padding: 8,
            content: [
                animationsTabHelp(),
                label({
                    text: animationsListModel.pathText
                }),
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
                    selectedCell: twoway(animationsListModel.selectedCell),
                    onClick: (item) => {
                        animationsListModel.onRowClick(item);
                    }
                }),
                horizontal(folderExplorerButtons({
                    onNewFolder: () => animationsListModel.newFolder(),
                    onAdd: () => animationsListModel.addUntitledAnimation(),
                    addLabel: "Add Animation",
                    addWidth: 100,
                    onRename: () => animationsListModel.renameSelected(),
                    onMove: () => animationsListModel.moveSelected(),
                    onDelete: () => animationsListModel.deleteSelected()
                }))
            ]
        }),
        tab({
            image: variablesTabIcon,
            padding: 8,
            content: [
                variablesTabHelp(),
                label({
                    text: variablesListModel.pathText
                }),
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
                        { header: "Type", canSort: true, width: "80px" },
                        { header: "Value", canSort: true, width: "100px" },
                        { header: "Reset Value", canSort: true, width: "110px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    selectedCell: twoway(variablesListModel.selectedCell),
                    onClick: (item) => {
                        variablesListModel.onRowClick(item);
                    }
                }),
                horizontal(folderExplorerButtons({
                    onNewFolder: () => variablesListModel.newFolder(),
                    onAdd: () => variablesListModel.addUntitledVariable(),
                    addLabel: "Add Variable",
                    addWidth: 95,
                    onRename: () => variablesListModel.renameSelected(),
                    onMove: () => variablesListModel.moveSelected(),
                    onDelete: () => variablesListModel.deleteSelected()
                })),
                button({
                    text: "Reset Variables",
                    width: 110,
                    height: 14,
                    onClick: () => {
                        variablesListModel.resetAllVariablesWithConfirm();
                    }
                })
            ]
        }),
        tab({
            // No gear/cog in IconName; news_messages is a static scroll/list-style tab.
            image: "news_messages",
            padding: 8,
            content: [
                logsTabHelp(),
                groupbox({
                    text: "Filters",
                    content: [
                        horizontal([
                            dropdown({
                                width: 160,
                                items: logsListModel.triggerFilterLabels,
                                selectedIndex: twoway(logsListModel.filterTriggerIndex),
                                onChange: (index) => {
                                    logsListModel.filterTriggerIndex.set(index);
                                    logsListModel.refresh();
                                }
                            }),
                            dropdown({
                                width: 160,
                                items: logsListModel.animationFilterLabels,
                                selectedIndex: twoway(logsListModel.filterAnimationIndex),
                                onChange: (index) => {
                                    logsListModel.filterAnimationIndex.set(index);
                                    logsListModel.refresh();
                                }
                            })
                        ])
                    ]
                }),
                listview({
                    items: logsListModel.listItems,
                    columns: [
                        { header: "Tick", width: "70px", canSort: true },
                        { header: "Level", width: "55px", canSort: true },
                        { header: "Area", width: "80px", canSort: true },
                        { header: "Message", canSort: true }
                    ],
                    scrollbars: "vertical",
                    isStriped: true,
                    height: "1w"
                }),
                button({
                    text: "Clear Logs",
                    width: 80,
                    height: 14,
                    onClick: () => {
                        logsListModel.clear();
                    }
                })
            ]
        }),
        tab({
            image: "scenery",
            padding: 8,
            content: [
                lookInsideTabHelp(),
                groupbox({
                    text: "Roofs",
                    content: [
                        horizontal([
                            toggle({
                                text: "Show All",
                                width: 70,
                                height: 14,
                                isPressed: tabShowAllPressed,
                                onChange: (pressed) => onTabRoofToggle("showAll", pressed)
                            }),
                            toggle({
                                text: "Hide All",
                                width: 70,
                                height: 14,
                                isPressed: tabHideAllPressed,
                                onChange: (pressed) => onTabRoofToggle("hideAll", pressed)
                            }),
                            toggle({
                                text: "Cursor",
                                width: 70,
                                height: 14,
                                isPressed: tabCursorHoverPressed,
                                onChange: (pressed) => onTabRoofToggle("cursorHover", pressed)
                            })
                        ]),
                        label({
                            text: CYCLE_ROOF_MODE_DEFAULT_LABEL
                        })
                    ]
                }),
                label({
                    text: buildingsListModel.pathText
                }),
                groupbox({
                    text: "Search Buildings",
                    content: [
                        textbox({
                            text: twoway(buildingsListModel.searchText),
                            onChange: (text) => {
                                buildingsListModel.searchText.set(text);
                                buildingsListModel.refresh();
                            }
                        })
                    ]
                }),
                listview({
                    items: buildingsListModel.listItems,
                    columns: [
                        { header: "Name", canSort: true },
                        { header: "Tiles", canSort: true, width: "60px" },
                        { header: "Roof Objects", canSort: true, width: "90px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    selectedCell: twoway(buildingsListModel.selectedCell),
                    onClick: (item) => {
                        buildingsListModel.onRowClick(item);
                    }
                }),
                horizontal(folderExplorerButtons({
                    onNewFolder: () => buildingsListModel.newFolder(),
                    onAdd: () => buildingsListModel.addUntitledBuilding(),
                    addLabel: "Add Building",
                    addWidth: 100,
                    onRename: () => buildingsListModel.renameSelected(),
                    onMove: () => buildingsListModel.moveSelected(),
                    onDelete: () => buildingsListModel.deleteSelected()
                }))
            ]
        }),
        tab({
            image: todosTabIcon,
            padding: 8,
            content: [
                todosTabHelp(),
                label({
                    text: todosListModel.pathText
                }),
                groupbox({
                    text: "Search To-Dos",
                    content: [
                        horizontal([
                            textbox({
                                text: twoway(todosListModel.searchText),
                                onChange: (text) => {
                                    todosListModel.searchText.set(text);
                                    todosListModel.refresh();
                                }
                            }),
                            dropdown({
                                width: 110,
                                items: TODO_FILTER_LABELS,
                                selectedIndex: twoway(todosListModel.filterIndex),
                                onChange: (index) => {
                                    todosListModel.filterIndex.set(index);
                                    todosListModel.refresh();
                                }
                            })
                        ])
                    ]
                }),
                listview({
                    items: todosListModel.listItems,
                    columns: [
                        { header: "Name", canSort: true },
                        { header: "Priority", canSort: true, width: "70px" },
                        { header: "Tile", canSort: true, width: "70px" },
                        { header: "Done", canSort: true, width: "55px" }
                    ],
                    scrollbars: "vertical",
                    canSelect: true,
                    isStriped: true,
                    height: "1w",
                    selectedCell: twoway(todosListModel.selectedCell),
                    onClick: (item) => {
                        todosListModel.onRowClick(item);
                    }
                }),
                label({
                    text: todosListModel.emptyLabel,
                    visibility: todosListModel.emptyVisibility
                }),
                horizontal(folderExplorerButtons({
                    onNewFolder: () => todosListModel.newFolder(),
                    onAdd: () => todosListModel.addUntitledTodo(),
                    addLabel: "Add To-Do",
                    addWidth: 85,
                    onEdit: () => todosListModel.editSelected(),
                    editLabel: todosListModel.editLabel,
                    editDisabled: todosListModel.editDisabled,
                    onMove: () => todosListModel.moveSelected(),
                    onDelete: () => todosListModel.deleteSelected()
                })),
                horizontal([
                    button({
                        text: todosListModel.markLabel,
                        width: 110,
                        height: 14,
                        visibility: todosListModel.markVisibility,
                        onClick: () => todosListModel.toggleSelectedDone()
                    }),
                    toggle({
                        text: "Show Remaining On Map",
                        width: 170,
                        height: 14,
                        isPressed: remainingHighlightPressed,
                        onChange: (pressed) => setRemainingHighlight(pressed)
                    })
                ])
            ]
        }),
        tab({
            image: infoTabIcon,
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
        triggersListModel.refresh();
        animationsListModel.refresh();
        buildingsListModel.refresh();
        todosListModel.refresh();
        variablesListModel.refresh();
        logsListModel.ensureSubscription();
        logsListModel.refreshFilterOptions();
        logsListModel.resetFilters();
        logsListModel.refresh();
        syncTabRoofModeUi();
    },
    onClose: () => {
        logsListModel.releaseSubscription();
        clearRemainingHighlight();
    }
    });
}

let JsonEntry: ReturnType<typeof createJsonEntry> | undefined;

function getJsonEntry() {
    if (!JsonEntry) {
        JsonEntry = createJsonEntry();
    }
    return JsonEntry;
}

export default {
    open: () => getJsonEntry().open(),
};
