/** Keyboard focus and mouse share one bond-colored, non-interactive light trail. */
const MENU_SCOPE = '#titleScreen,#starterScreen,#modal,#gameDrawer,#battleActions,#openingCinematic';
const FOCUS_SELECTOR = 'button:not(:disabled),[role="button"],a[href],select,input:not([type="hidden"]),textarea';
export class MenuFocusTrail {
    constructor() {
        this.points = [];
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.visible = false;
        this.animation = 0;
        this.last = 0;
        this.history = [];
        this.previous = null;
        this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        this.tick = (now) => {
            this.animation = 0;
            if (!this.visible)
                return;
            const dt = Math.min(.05, Math.max(.008, (now - this.last) / 1000 || .016));
            this.last = now;
            const easing = this.reduced ? 1 : 1 - Math.exp(-dt * 13);
            this.x += (this.targetX - this.x) * easing;
            this.y += (this.targetY - this.y) * easing;
            this.orb.style.transform = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
            if (!this.reduced) {
                const last = this.history[0];
                if (!last || Math.hypot(this.x - last.x, this.y - last.y) > 3)
                    this.history.unshift({ x: this.x, y: this.y, time: now });
                this.history = this.history.filter(point => now - point.time < 420).slice(0, 12);
            }
            else
                this.history = [];
            for (let i = 0; i < this.points.length; i++) {
                const dot = this.points[i], point = this.history[i];
                if (!point) {
                    dot.style.opacity = '0';
                    continue;
                }
                dot.style.transform = 'translate3d(' + point.x + 'px,' + point.y + 'px,0)';
                dot.style.opacity = String(Math.max(0, (1 - (now - point.time) / 420) * .52 * (1 - i / 15)));
            }
            if (Math.hypot(this.targetX - this.x, this.targetY - this.y) > .35 || this.history.length)
                this.animation = requestAnimationFrame(this.tick);
        };
        const layer = document.createElement('div');
        layer.className = 'azur-cursor-layer';
        layer.setAttribute('aria-hidden', 'true');
        this.orb = document.createElement('div');
        this.orb.className = 'azur-cursor-orb';
        layer.appendChild(this.orb);
        for (let i = 0; i < 12; i++) {
            const dot = document.createElement('span');
            dot.className = 'azur-cursor-particle';
            layer.appendChild(dot);
            this.points.push(dot);
        }
        document.body.appendChild(layer);
        document.documentElement.classList.add('azur-magic-cursor');
        document.addEventListener('focusin', e => this.focus(e.target), true);
        document.addEventListener('pointermove', e => this.pointer(e), { passive: true });
        document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch')
            this.hide(); }, { passive: true });
        window.addEventListener('blur', () => this.hide());
        document.addEventListener('visibilitychange', () => { if (document.hidden)
            this.hide(); });
    }
    setTone(color) { if (/^#[a-f0-9]{6}$/i.test(color))
        document.documentElement.style.setProperty('--azur-bond-glow', color); }
    valid(target) {
        const el = target instanceof HTMLElement ? target : null;
        if (!el || !el.closest(MENU_SCOPE) || el.closest('.hidden,[aria-hidden="true"]'))
            return null;
        const control = el.closest(FOCUS_SELECTOR);
        return control && !control.hasAttribute('disabled') && control.getClientRects().length > 0 ? control : null;
    }
    focus(target) {
        this.previous?.classList.remove('azur-nav-active');
        const control = this.valid(target);
        this.previous = control;
        if (!control)
            return;
        control.classList.add('azur-nav-active');
        const r = control.getBoundingClientRect();
        this.travel(r.left + r.width / 2, r.top + r.height / 2);
    }
    pointer(e) {
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen')
            return;
        const control = this.valid(e.target);
        if (!control) {
            this.hide();
            return;
        }
        this.travel(e.clientX, e.clientY);
    }
    travel(x, y) {
        if (!Number.isFinite(x + y))
            return;
        if (!this.visible) {
            this.x = x;
            this.y = y;
            this.history = [];
        }
        this.targetX = x;
        this.targetY = y;
        this.visible = true;
        this.orb.classList.add('visible');
        if (!this.animation)
            this.animation = requestAnimationFrame(this.tick);
    }
    hide() { this.visible = false; this.orb.classList.remove('visible'); this.history = []; for (const node of this.points)
        node.style.opacity = '0'; }
}
