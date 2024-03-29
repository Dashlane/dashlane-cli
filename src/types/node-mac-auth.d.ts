declare module 'node-mac-auth' {
    export function promptTouchID(params: { reason: string; reuseDuration?: number }): Promise<void>;
    export function canPromptTouchID(): boolean;
}
