import { drawHero } from '../render.js';
import { DUNGEON_W, DUNGEON_H, tileDungeon } from './labyrinth.js';
import { chamberAt, chamberGrain } from './room-art.js';
/** Spatial dungeon. Materials are an intermediate pass; final world is ASCII glyphs. */
export function drawDungeon(ctx, run, hero, t, reduced = false) {
    const S = 46, W = 960, H = 540;
    const cameraX = Math.max(0, Math.min(DUNGEON_W * S - W, (run.x + .5) * S - W / 2));
    const cameraY = Math.max(0, Math.min(DUNGEON_H * S - H, (run.y + .5) * S - H / 2));
    ctx.fillStyle = '#070c14';
    ctx.fillRect(0, 0, W, H);
    const x0 = Math.max(0, Math.floor(cameraX / S) - 1), x1 = Math.min(DUNGEON_W - 1, Math.ceil((cameraX + W) / S) + 1);
    const y0 = Math.max(0, Math.floor(cameraY / S) - 1), y1 = Math.min(DUNGEON_H - 1, Math.ceil((cameraY + H) / S) + 1);
    for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
            const known = run.visited[y * DUNGEON_W + x] === '1', tx = x * S - cameraX, ty = y * S - cameraY;
            if (!known) {
                ctx.fillStyle = '#070b12';
                ctx.fillRect(tx, ty, S + 1, S + 1);
                continue;
            }
            const wall = tileDungeon(run, x, y) === '#';
            const corridor = tileDungeon(run, x, y) === '+';
            const grain = chamberGrain(run.seed, x, y), style = chamberAt(run, x, y);
            const alt = (grain & 7) < 2;
            if (wall) {
                // Heavy stone courses and cracks communicate physical, impassable boundaries.
                ctx.fillStyle = alt ? style.wall : style.wallShadow;
                ctx.fillRect(tx, ty, S + 1, S + 1);
                ctx.fillStyle = style.rim;
                ctx.globalAlpha = .66;
                ctx.fillRect(tx, ty, S, 3);
                ctx.fillRect(tx + 2, ty + 23, S - 4, 2);
                ctx.globalAlpha = 1;
                ctx.fillStyle = style.wall;
                ctx.fillRect(tx + ((grain & 1) ? 22 : 13), ty + 3, 3, 20);
                ctx.fillRect(tx + ((grain & 2) ? 9 : 30), ty + 25, 2, 19);
                if ((grain % 17) === 0) {
                    ctx.strokeStyle = style.detail;
                    ctx.globalAlpha = .28;
                    ctx.beginPath();
                    ctx.moveTo(tx + 7, ty + 14);
                    ctx.lineTo(tx + 17, ty + 22);
                    ctx.lineTo(tx + 12, ty + 38);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            else {
                ctx.fillStyle = corridor ? style.floorShade : style.floor;
                ctx.fillRect(tx, ty, S + 1, S + 1);
                // Floor joints and glyph-surviving inlays: world detail, never false obstacles.
                ctx.fillStyle = style.detail;
                ctx.globalAlpha = corridor ? .24 : .18;
                ctx.fillRect(tx + 3, ty + 3, S - 6, 1);
                ctx.fillRect(tx + 3, ty + S - 4, S - 6, 1);
                if (grain % 5 === 0) {
                    ctx.fillRect(tx + (grain % 21) + 7, ty + 15, 2, 16);
                }
                if ((grain % 13) < 3) {
                    ctx.fillRect(tx + 5 + (grain % 17), ty + 9 + (grain % 14), 3, 2);
                }
                ctx.globalAlpha = 1;
                if (corridor) {
                    ctx.fillStyle = style.rim;
                    ctx.globalAlpha = .45;
                    ctx.fillRect(tx + S / 2 - 1, ty + 5, 2, S - 10);
                    ctx.globalAlpha = 1;
                }
                if ((grain % 23) === 0) {
                    // Abstract carved floor inscription; purely decorative.
                    ctx.strokeStyle = style.detail;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = .5;
                    ctx.beginPath();
                    ctx.moveTo(tx + 12, ty + 18);
                    ctx.lineTo(tx + 22, ty + 10);
                    ctx.lineTo(tx + 31, ty + 18);
                    ctx.lineTo(tx + 22, ty + 26);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }
    // Each chamber has a different architectural identity, without altering collision.
    for (const e of run.events) {
        if (run.visited[e.y * DUNGEON_W + e.x] !== '1')
            continue;
        const style = chamberAt(run, e.x, e.y);
        const cx = (e.x + .5) * S - cameraX, cy = (e.y + .5) * S - cameraY;
        if (cx < -180 || cx > W + 180 || cy < -180 || cy > H + 180)
            continue;
        ctx.save();
        ctx.strokeStyle = style.detail;
        ctx.lineWidth = 2;
        ctx.globalAlpha = .30;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 39, 27, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        if (style.sigil === 'diamond' || style.sigil === 'cross') {
            ctx.moveTo(cx, cy - 27);
            ctx.lineTo(cx + 27, cy);
            ctx.lineTo(cx, cy + 27);
            ctx.lineTo(cx - 27, cy);
            ctx.closePath();
        }
        else if (style.sigil === 'fracture' || style.sigil === 'roots') {
            ctx.moveTo(cx - 28, cy - 25);
            ctx.lineTo(cx - 11, cy - 8);
            ctx.lineTo(cx + 5, cy + 2);
            ctx.lineTo(cx + 25, cy + 23);
            ctx.moveTo(cx + 29, cy - 24);
            ctx.lineTo(cx + 7, cy - 7);
            ctx.lineTo(cx - 20, cy + 25);
        }
        else {
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
        // Lit wall sconces: the pass renders through the same GPU/CPU ASCII compositor.
        for (const side of [-1, 1]) {
            const sx = (e.x + side * 2 + .5) * S - cameraX, sy = (e.y - 1 + .5) * S - cameraY;
            if (tileDungeon(run, e.x + side * 2, e.y - 1) === '#')
                continue;
            const pulse = reduced ? 1 : 1 + Math.sin(t * 3.1 + e.id + side) * .12;
            ctx.fillStyle = style.rim;
            ctx.fillRect(sx - 6, sy - 18, 12, 18);
            ctx.fillStyle = style.light;
            ctx.fillRect(sx - 2, sy - 27, 4, 12 * pulse);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = .13;
            const g = ctx.createRadialGradient(sx, sy - 22, 1, sx, sy - 22, 64);
            g.addColorStop(0, style.light);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(sx - 64, sy - 86, 128, 128);
            ctx.restore();
        }
    }
    for (const e of run.events) {
        if (run.visited[e.y * DUNGEON_W + e.x] !== '1')
            continue;
        if (run.cleared.includes(e.id) && e.kind !== 'entrance' && e.kind !== 'exit')
            continue;
        const x = (e.x + .5) * S - cameraX, y = (e.y + .64) * S - cameraY;
        if (x < -40 || x > W + 40 || y < -40 || y > H + 40)
            continue;
        const palette = { entrance: '#7ac0cc', exit: '#d9b98c', enemy: '#e58c9b', cache: '#d2b076', altar: '#9de0c7', rune: '#b7a5ed' };
        const color = palette[e.kind];
        const pulse = reduced ? 0 : Math.sin(t * 2 + e.id) * 3;
        ctx.save();
        ctx.fillStyle = '#111b28';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        if (e.kind === 'enemy') {
            ctx.beginPath();
            ctx.ellipse(x, y - 18, 13 + pulse / 4, 17 + pulse / 4, 0, 0, 7);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillRect(x - 7, y - 21, 4, 3);
            ctx.fillRect(x + 4, y - 21, 4, 3);
        }
        else if (e.kind === 'cache') {
            ctx.fillStyle = '#71533d';
            ctx.fillRect(x - 16, y - 15, 32, 18);
            ctx.strokeRect(x - 16, y - 15, 32, 18);
            ctx.fillStyle = color;
            ctx.fillRect(x - 2, y - 15, 4, 18);
        }
        else if (e.kind === 'altar' || e.kind === 'rune') {
            ctx.fillStyle = '#364354';
            ctx.fillRect(x - 13, y - 27, 26, 29);
            ctx.strokeRect(x - 13, y - 27, 26, 29);
            ctx.fillStyle = color;
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(e.kind === 'rune' ? '✣' : '✦', x, y - 6);
        }
        else {
            ctx.strokeRect(x - 17, y - 39, 34, 39);
            ctx.fillStyle = color;
            ctx.fillRect(x - 3, y - 30, 6, 22);
        }
        ctx.restore();
    }
    drawHero(ctx, (hero.x + .5) * S - cameraX, (hero.y + .55) * S - cameraY, t, hero.walking, hero.facing);
    // Subtle light from the player; darkness never masks the immediate interaction radius.
    const px = (hero.x + .5) * S - cameraX, py = (hero.y + .5) * S - cameraY;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .1;
    const light = ctx.createRadialGradient(px, py, 4, px, py, 205);
    light.addColorStop(0, '#90b9c4');
    light.addColorStop(1, 'transparent');
    ctx.fillStyle = light;
    ctx.fillRect(px - 205, py - 205, 410, 410);
    ctx.restore();
    if (!reduced) {
        ctx.fillStyle = '#d2c6ff';
        for (let i = 0; i < 22; i++) {
            const xx = (i * 137.51 + Math.sin(t * .4 + i) * 6) % W, yy = (i * 79.31 + t * (3 + i % 3)) % H;
            ctx.globalAlpha = .15 + (i % 4) * .045;
            ctx.fillRect(xx, yy, 2, 2);
        }
        ctx.globalAlpha = 1;
    }
}
