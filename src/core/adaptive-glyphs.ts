import type {FrameReport} from './frame-metrics.js';

/** Conservative frame-pacing controller. Canvas2D may opt in by default; saved art settings are untouched. */
export class AdaptiveGlyphs {
  readonly targetFps = 30;
  readonly maxScale = 2.4;
  private enabled = false;
  private factor = 1;
  private lastCheck = -Infinity;
  private slowWindows = 0;
  private fastWindows = 0;

  get active(): boolean { return this.enabled; }
  get scale(): number { return this.factor; }

  configure(enabled: boolean,initialScale=1): boolean {
    const next = enabled === true;
    if (next === this.enabled) return false;
    this.enabled = next;
    this.reset();
    if(next&&Number.isFinite(initialScale))this.factor=Math.max(1,Math.min(this.maxScale,initialScale));
    return true;
  }
  reset(): void {
    this.factor = 1;
    this.slowWindows = 0;
    this.fastWindows = 0;
    this.lastCheck = -Infinity;
  }
  /** Accept samples from rAF (not GPU timings). Returns true only when the glyph-cell scale changes. */
  observe(report: FrameReport, nowMs: number, playing: boolean): boolean {
    if (!this.enabled || !playing || !Number.isFinite(nowMs) || report.samples < 20 ||
        nowMs - this.lastCheck < 1800) return false;
    this.lastCheck = nowMs;
    // Low thresholds for recovery prevent oscillation around the 30 FPS budget.
    const slow = report.p95Ms > 39 || report.averageMs > 34;
    const fast = report.p95Ms < 27 && report.averageMs < 23;
    this.slowWindows = slow ? this.slowWindows + 1 : 0;
    this.fastWindows = fast ? this.fastWindows + 1 : 0;
    if (this.slowWindows >= 2 && this.factor < this.maxScale) {
      this.factor = Math.min(this.maxScale, Math.round(this.factor * 1.2 * 100) / 100);
      this.slowWindows = 0;
      this.fastWindows = 0;
      return true;
    }
    if (this.fastWindows >= 3 && this.factor > 1) {
      this.factor = Math.max(1, Math.round(this.factor / 1.2 * 100) / 100);
      this.fastWindows = 0;
      this.slowWindows = 0;
      return true;
    }
    return false;
  }
}
