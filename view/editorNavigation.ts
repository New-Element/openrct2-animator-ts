type OpenEditor = (id: string, onClosed?: () => void) => void;

let openAnimationEditorImpl: OpenEditor | null = null;
let openTriggerEditorImpl: OpenEditor | null = null;

export function bindAnimationEditorOpener(fn: OpenEditor): void {
    openAnimationEditorImpl = fn;
}

export function bindTriggerEditorOpener(fn: OpenEditor): void {
    openTriggerEditorImpl = fn;
}

export function goToAnimationEditor(id: string, onClosed?: () => void): void {
    if (openAnimationEditorImpl) {
        openAnimationEditorImpl(id, onClosed);
    }
}

export function goToTriggerEditor(id: string, onClosed?: () => void): void {
    if (openTriggerEditorImpl) {
        openTriggerEditorImpl(id, onClosed);
    }
}
