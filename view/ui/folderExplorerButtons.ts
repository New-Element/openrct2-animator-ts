import {Bindable, button} from "openrct2-flexui";

export function folderExplorerButtons(args: {
    onNewFolder: () => void;
    onAdd: () => void;
    addLabel: string;
    addWidth: number;
    onRename?: () => void;
    renameDisabled?: Bindable<boolean>;
    onEdit?: () => void;
    editLabel?: Bindable<string>;
    editDisabled?: Bindable<boolean>;
    editWidth?: number;
    onMove: () => void;
    onDelete: () => void;
}) {
    const buttons = [
        button({
            text: "Add Folder",
            width: 80,
            height: 14,
            onClick: args.onNewFolder
        }),
        button({
            text: args.addLabel,
            width: args.addWidth,
            height: 14,
            onClick: args.onAdd
        })
    ];
    if (args.onEdit) {
        buttons.push(button({
            text: args.editLabel || "Edit",
            width: args.editWidth || 60,
            height: 14,
            disabled: args.editDisabled,
            onClick: args.onEdit
        }));
    }
    if (args.onRename) {
        buttons.push(button({
            text: "Rename",
            width: 60,
            height: 14,
            disabled: args.renameDisabled,
            onClick: args.onRename
        }));
    }
    buttons.push(
        button({
            text: "Move",
            width: 50,
            height: 14,
            onClick: args.onMove
        }),
        button({
            text: "Delete",
            width: 55,
            height: 14,
            onClick: args.onDelete
        })
    );
    return buttons;
}
