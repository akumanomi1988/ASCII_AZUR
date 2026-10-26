/** Pre-dvh Android Chrome reports 100vh larger than its visible content area. */
export function visibleViewportHeight(layoutHeight, visualHeight) {
    if (!Number.isFinite(layoutHeight) || layoutHeight <= 0)
        return 0;
    const visual = typeof visualHeight === 'number' && Number.isFinite(visualHeight) && visualHeight > 0 ? visualHeight : layoutHeight;
    return Math.floor(Math.min(layoutHeight, visual));
}
