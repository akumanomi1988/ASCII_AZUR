export class FrameMetrics {
    constructor(capacity = 240, budgetMs = 1000 / 30) {
        this.capacity = capacity;
        this.budgetMs = budgetMs;
        this.times = [];
        this.next = 0;
        if (!Number.isInteger(capacity) || capacity < 2 || !Number.isFinite(budgetMs) || budgetMs <= 0)
            throw Error('Invalid frame metrics configuration');
    }
    add(ms) {
        // Ignore invalid values and long application suspension deltas; explicit reset on resume.
        if (!Number.isFinite(ms) || ms <= 0 || ms > 2000)
            return;
        if (this.times.length < this.capacity)
            this.times.push(ms);
        else {
            this.times[this.next] = ms;
            this.next = (this.next + 1) % this.capacity;
        }
    }
    reset() { this.times = []; this.next = 0; }
    report() {
        if (!this.times.length)
            return { samples: 0, averageMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0, overBudget: 0, budgetMs: this.budgetMs };
        const sorted = [...this.times].sort((a, b) => a - b);
        const quantile = (q) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
        return {
            samples: sorted.length,
            averageMs: this.times.reduce((a, b) => a + b, 0) / sorted.length,
            p50Ms: quantile(.5), p95Ms: quantile(.95), p99Ms: quantile(.99),
            maxMs: sorted[sorted.length - 1], overBudget: this.times.filter(t => t > this.budgetMs).length,
            budgetMs: this.budgetMs
        };
    }
}
