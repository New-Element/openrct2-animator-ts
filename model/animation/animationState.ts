export default interface AnimationState {
    stepIndex: number;
    stepElapsedTicks: number;
    stepStarted: boolean;
    running: boolean;
    paused: boolean;
    hasRun: boolean;
}
