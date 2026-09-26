/**
 * Per-event countdown for Car Enters / Train Enters location checks.
 * Conductor advances once per tick before snapshot prep; events read isDue().
 */

export function normalizeCheckEveryTicks(value?: number): number {
    if (typeof value !== "number" || value < 1) {
        return 1;
    }
    return Math.floor(value);
}

export class TileEventPollClock {
    checkEveryTicks: number;
    /** Ticks seen since the last due check (or since load). Not persisted. */
    private count: number = 0;
    private due: boolean = false;

    constructor(checkEveryTicks?: number) {
        this.checkEveryTicks = normalizeCheckEveryTicks(checkEveryTicks);
    }

    advance(): void {
        this.count += 1;
        if (this.count < this.checkEveryTicks) {
            this.due = false;
            return;
        }
        this.count = 0;
        this.due = true;
    }

    isDue(): boolean {
        return this.due;
    }

    setCheckEveryTicks(ticks: number): void {
        const next = normalizeCheckEveryTicks(ticks);
        if (next === this.checkEveryTicks) {
            return;
        }
        this.checkEveryTicks = next;
        this.count = 0;
        this.due = false;
    }
}

export function advanceTileEventPollClocks(triggers: {event: unknown}[]): void {
    for (let i = 0; i < triggers.length; i++) {
        const event = triggers[i].event;
        if (!event || typeof event !== "object") {
            continue;
        }
        const pollable = event as {advancePollClock?: () => void};
        if (typeof pollable.advancePollClock === "function") {
            pollable.advancePollClock();
        }
    }
}
