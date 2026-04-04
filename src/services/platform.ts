export const isNativeApp = () => true;

export const triggerHaptic = (style: 'none' | 'light' | 'medium' | 'heavy' | 'tactical' | 'double' = 'light') => {
    // We use the direct Haptics from expo when needed in App, this stub satisfies types.ts if needed later.
};

export const GlobalEvents = {
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatch: () => { }
};
