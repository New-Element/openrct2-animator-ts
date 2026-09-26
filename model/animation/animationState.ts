export type AnimationEndReason = "complete" | "aborted" | "empty" | "error";

export default interface AnimationState {
    stepIndex: number;
    stepElapsedTicks: number;
    stepStarted: boolean;
    running: boolean;
    paused: boolean;
    hasRun: boolean;
    /** Ticks left to wait after a completed step before starting the next. */
    betweenStepsRemaining: number;
    /**
     * Set by a Branch step when it finishes.
     * "end" finishes the run. A number is the next step index (0-based).
     */
    jumpTo?: number | "end";
    /** Set when the run stops; used for conclude logging. */
    endReason?: AnimationEndReason;
    /** Optional detail for the end reason (e.g. abort cause). */
    endDetail?: string;
}
