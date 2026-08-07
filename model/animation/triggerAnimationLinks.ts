import getConductor from "../getConductor";
import Trigger from "./trigger/trigger";

export interface LinkPeer {
    id: string;
    name: string;
}

function displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed : "(Unnamed)";
}

function containsId(ids: string[], id: string): boolean {
    for (let i = 0; i < ids.length; i++) {
        if (ids[i] === id) {
            return true;
        }
    }
    return false;
}

function linkedAnimationIds(trigger: Trigger): string[] {
    return trigger.animationIds;
}

export function linkedAnimations(triggerId: string): LinkPeer[] {
    const conductor = getConductor();
    const trigger = conductor.triggersArray.findById(triggerId);
    if (!trigger) {
        return [];
    }
    const peers: LinkPeer[] = [];
    const ids = linkedAnimationIds(trigger);
    for (let i = 0; i < ids.length; i++) {
        const animation = conductor.animationsArray.findById(ids[i]);
        if (!animation) {
            continue;
        }
        peers.push({ id: animation.id, name: displayName(animation.name) });
    }
    return peers;
}

export function linkedTriggers(animationId: string): LinkPeer[] {
    const triggers = getConductor().triggersArray.items;
    const peers: LinkPeer[] = [];
    for (let i = 0; i < triggers.length; i++) {
        if (containsId(triggers[i].animationIds, animationId)) {
            peers.push({
                id: triggers[i].id,
                name: displayName(triggers[i].name)
            });
        }
    }
    return peers;
}

export function availableAnimationsFor(triggerId: string): LinkPeer[] {
    const conductor = getConductor();
    const trigger = conductor.triggersArray.findById(triggerId);
    if (!trigger) {
        return [];
    }
    const linked = linkedAnimationIds(trigger);
    const animations = conductor.animationsArray.items;
    const peers: LinkPeer[] = [];
    for (let i = 0; i < animations.length; i++) {
        if (!containsId(linked, animations[i].id)) {
            peers.push({
                id: animations[i].id,
                name: displayName(animations[i].name)
            });
        }
    }
    return peers;
}

export function availableTriggersFor(animationId: string): LinkPeer[] {
    const triggers = getConductor().triggersArray.items;
    const peers: LinkPeer[] = [];
    for (let i = 0; i < triggers.length; i++) {
        if (!containsId(triggers[i].animationIds, animationId)) {
            peers.push({
                id: triggers[i].id,
                name: displayName(triggers[i].name)
            });
        }
    }
    return peers;
}

export function addLink(triggerId: string, animationId: string): boolean {
    const conductor = getConductor();
    const trigger = conductor.triggersArray.findById(triggerId);
    if (!trigger) {
        return false;
    }
    if (!conductor.animationsArray.findById(animationId)) {
        return false;
    }
    if (containsId(trigger.animationIds, animationId)) {
        return false;
    }
    trigger.animationIds.push(animationId);
    conductor.triggersArray.save();
    return true;
}

export function removeLink(triggerId: string, animationId: string): boolean {
    const conductor = getConductor();
    const trigger = conductor.triggersArray.findById(triggerId);
    if (!trigger) {
        return false;
    }
    const next: string[] = [];
    let removed = false;
    for (let i = 0; i < trigger.animationIds.length; i++) {
        if (trigger.animationIds[i] === animationId) {
            removed = true;
        } else {
            next.push(trigger.animationIds[i]);
        }
    }
    if (!removed) {
        return false;
    }
    trigger.animationIds = next;
    conductor.triggersArray.save();
    return true;
}

export function unlinkAnimationFromAllTriggers(animationId: string): void {
    const conductor = getConductor();
    const triggers = conductor.triggersArray.items;
    let changed = false;
    for (let i = 0; i < triggers.length; i++) {
        const trigger = triggers[i];
        if (!containsId(trigger.animationIds, animationId)) {
            continue;
        }
        const next: string[] = [];
        for (let j = 0; j < trigger.animationIds.length; j++) {
            if (trigger.animationIds[j] !== animationId) {
                next.push(trigger.animationIds[j]);
            }
        }
        trigger.animationIds = next;
        changed = true;
    }
    if (changed) {
        conductor.triggersArray.save();
    }
}
