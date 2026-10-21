import { arkenStoryIndex } from './story-campaign.js';
import { ZONES } from './world.js';
const MARKS = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
function arrow(dx, dy) {
    const a = Math.atan2(dy, dx);
    return MARKS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}
function landmark(zone, kind, right = true) {
    const matches = ZONES[zone].landmarks.filter(p => p.kind === kind);
    return right ? matches[matches.length - 1] : matches[0];
}
export function storyGuidance(story, position) {
    const step = arkenStoryIndex(story);
    const simple = (text, kind) => ({ text, direction: '✦', distance: null, target: null, kind });
    if (step === 6)
        return simple('ARKEN RESTAURADO', 'completed');
    if (position.inDungeon)
        return simple(step === 4 ? 'EXPLORA LA CRIPTA' : 'REGRESA A ARKEN', 'dungeon');
    if (step === 4)
        return simple('MENÚ → CRIPTA EXPLORABLE', 'menu');
    const destination = step === 0 || step === 5 ? 'village' : step === 1 ? 'forest' : 'sanctuary';
    let target;
    let title;
    if (position.zone === destination) {
        if (step === 0 || step === 5) {
            target = ZONES.village.landmarks.find(l => l.npcId === 'archivist');
            title = 'ARCHIVISTA';
        }
        else if (step === 3) {
            target = landmark('sanctuary', 'guardian');
            title = 'HOLLOWHART';
        }
        else
            return simple('ZONA ALCANZADA · AVANZA', 'interaction');
    }
    else {
        const goingWest = destination === 'village' || (destination === 'forest' && position.zone === 'sanctuary');
        target = landmark(position.zone, 'portal', !goingWest);
        title = goingWest ? 'PORTAL OESTE' : 'PORTAL ESTE';
    }
    if (!target)
        return simple('CONSULTA EL DIARIO', 'menu');
    const dx = target.x - position.x, dy = target.y - position.y;
    const distance = Math.round(Math.hypot(dx, dy));
    if (Math.hypot(dx, dy) <= 2.15)
        return { text: `✦ ${title} · ACCIÓN`, direction: '✦', distance: 0, target, kind: 'interaction' };
    const direction = arrow(dx, dy);
    return { text: `${direction} ${title} · ${distance} PASOS`, direction, distance, target, kind: 'target' };
}
