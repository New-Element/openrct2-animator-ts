import {store} from "openrct2-flexui";
import Building from "../../model/lookInside/building";
import getConductor from "../../model/getConductor";
import uuidV4 from "../../model/util/uuid";
import {
    addBuilding,
    buildingDisplayName,
    getBuildings,
    saveBuildings
} from "./buildingsStore";
import {openBuildingEditor} from "./buildingEditor";
import {createFolderExplorer} from "../ui/folderExplorer";

const searchText = store<string>("");

function matchesSearch(building: Building, query: string): boolean {
    if (!query) {
        return true;
    }
    return building.name.toLowerCase().indexOf(query) !== -1 ||
        buildingDisplayName(building.name).toLowerCase().indexOf(query) !== -1;
}

const explorer = createFolderExplorer<Building>({
    collection: "buildings",
    itemNoun: "Building",
    extraColumnCount: 2,
    getItems: () => getBuildings(),
    extraColumns: (building) => [
        String(building.tiles.length),
        String(building.roofObjects.length)
    ],
    itemMatchesSearch: matchesSearch,
    displayName: (building) => buildingDisplayName(building.name),
    getSearchQuery: () => searchText.get(),
    clearSearch: () => searchText.set(""),
    onOpenItem: (building) => {
        openBuildingEditor(building.id, refreshBuildingsList);
    },
    onRenameItem: (building, name) => {
        building.name = name;
    },
    deleteItem: (building) => {
        getConductor().buildingsArray.removeById(building.id);
    },
    saveItems: () => {
        saveBuildings();
    }
});

export function refreshBuildingsList(): void {
    explorer.refresh();
}

function createUntitledBuilding(): Building {
    return new Building({
        id: uuidV4(),
        name: "Untitled Building",
        tiles: [],
        roofObjects: [],
        folder: explorer.currentFolderPath()
    });
}

export function addUntitledBuilding(): void {
    const building = createUntitledBuilding();
    addBuilding(building);
    refreshBuildingsList();
    openBuildingEditor(building.id, refreshBuildingsList);
}

export const buildingsListModel = {
    searchText,
    pathText: explorer.pathText,
    listItems: explorer.listItems,
    selectedCell: explorer.selectedCell,
    refresh: refreshBuildingsList,
    onRowClick: explorer.onRowClick,
    addUntitledBuilding,
    newFolder: explorer.newFolder,
    renameSelected: explorer.renameSelected,
    moveSelected: explorer.moveSelected,
    deleteSelected: explorer.deleteSelected
};
