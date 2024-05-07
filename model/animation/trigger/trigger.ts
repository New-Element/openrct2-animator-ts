export interface Trigger {
    test: () => boolean;
    type: string;
};