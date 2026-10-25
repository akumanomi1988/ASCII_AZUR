import { arkenStoryIndex } from './story-campaign.js';
import { marshChapterProgress } from './story-marsh.js';
import { crownProgress, crownEpilogue } from './story-finale.js';
import { AFTERLIGHT, afterlightProgress, afterlightEpilogue } from './story-afterlight.js';
import { azurWorldConsequence } from './story-agency.js';
const AZUR_SCENE_ARRIVALS = {
    forest: { id: 'forest-arrival', zone: 'forest', eyebrow: 'UMBRAL I · EL BOSQUE', title: 'La ceniza aprende a hablar', subtitle: 'Cada árbol guarda una voz que Arken ya no recuerda.', tone: 'arrival' },
    sanctuary: { id: 'sanctuary-arrival', zone: 'sanctuary', eyebrow: 'UMBRAL I · EL SANTUARIO', title: 'Donde calla la Primera Palabra', subtitle: 'Una promesa aguarda detrás del silencio.', tone: 'memory' },
    marsh: { id: 'marsh-arrival', zone: 'marsh', eyebrow: 'CAPÍTULO II · EL ESPEJO', title: 'Dos vidas bajo el agua', subtitle: 'No toda ausencia pertenece al pasado.', tone: 'memory' },
    spire: { id: 'spire-arrival', zone: 'spire', eyebrow: 'CAPÍTULO III · LA CORONA', title: 'Nadie debe escribir tu destino', subtitle: 'La última página todavía está en blanco.', tone: 'reckoning' },
    ossuary: { id: 'ossuary-arrival', zone: 'ossuary', eyebrow: 'VIGILIA I · LAS MAREAS', title: 'Los nombres llegan al mar', subtitle: 'La memoria y la libertad se encuentran en la orilla.', tone: 'afterlight' },
    garden: { id: 'garden-arrival', zone: 'garden', eyebrow: 'VIGILIA II · EL INVIERNO', title: 'Una primavera aún sin nombre', subtitle: 'Recordar no obliga a repetir el pasado.', tone: 'afterlight' }
};
const AZUR_SCENE_REQUIRED = {
    marsh: 'arken-vow-restored', spire: 'marsh-chapter-complete',
    ossuary: 'crown-trilogy-complete', garden: 'afterlight-ossuary-complete'
};
export function arrivalMoment(zone, priorVisits, flags) {
    const scene = AZUR_SCENE_ARRIVALS[zone];
    if (!scene || priorVisits.includes('zone-' + zone))
        return null;
    const requirement = AZUR_SCENE_REQUIRED[zone];
    return requirement && !flags.includes(requirement) ? null : { ...scene };
}
const AZUR_SCENE_ENDINGS = {
    'arken-vow-restored': { eyebrow: 'FIN DEL CAPÍTULO I', title: 'Un juramento contra el olvido', subtitle: 'Arken vuelve a recordar. Más allá, el espejo espera.', tone: 'oath' },
    'marsh-chapter-complete': { eyebrow: 'FIN DEL CAPÍTULO II', title: 'El mapa de las vidas posibles', subtitle: 'Tu decisión ya forma parte de la Marisma.', tone: 'memory' },
    'crown-trilogy-complete': { eyebrow: 'FIN DE LA TRILOGÍA', title: 'El cielo vuelve a pertenecer a todos', subtitle: 'El final de una historia abre el viaje de otra.', tone: 'reckoning' },
    'afterlight-ossuary-complete': { eyebrow: 'LA MAREA RESPONDE', title: 'El mar recuerda tu elección', subtitle: 'La última semilla aguarda bajo el invierno.', tone: 'afterlight' },
    'afterlight-garden-complete': { eyebrow: 'FIN DE LA VIGILIA', title: 'El mundo puede elegir de nuevo', subtitle: 'La aventura continúa sin imponer otro juramento.', tone: 'afterlight' }
};
export function resolutionMoment(flag, flags) {
    if (!flags.includes(flag))
        return null;
    const scene = AZUR_SCENE_ENDINGS[flag];
    if (!scene)
        return null;
    const zone = flag === 'arken-vow-restored' ? 'village' : flag === 'marsh-chapter-complete' ? 'marsh' :
        flag === 'crown-trilogy-complete' ? 'spire' : flag === 'afterlight-ossuary-complete' ? 'ossuary' : 'garden';
    const subtitle = flag === 'marsh-chapter-complete' ? (flags.includes('marsh-choice-keep') ? 'Nael conservará las historias sin poseerlas.' : 'Nael permite que las historias descansen sin negarlas.') :
        flag === 'crown-trilogy-complete' ? (flags.includes('crown-choice-remember') ? 'Los nombres se guardan; sus destinos quedan libres.' : 'Ningún Telar volverá a escribir una vida de antemano.') : scene.subtitle;
    return { id: flag, zone, ...scene, subtitle };
}
export function storyChronicle(story) {
    const flags = story.flags, arken = arkenStoryIndex(story), marsh = marshChapterProgress(flags), crown = crownProgress(flags);
    const entries = [{
            id: 'arken', eyebrow: 'I · EL JURAMENTO', title: 'La Primera Palabra y el Último Signo',
            status: arken === 6 ? 'complete' : 'active',
            summary: arken === 6 ? 'La aldea vuelve a recordar sus nombres.' : 'Una voz sin nombre llama desde el bosque y la cripta.',
            passages: arken === 6 ? [
                'El Archivista reunió la Primera Palabra de Hollowhart y el Último Signo de la Cripta.',
                'Arken recobró su memoria. La promesa persiste en los vínculos que elegiste proteger.'
            ] : ['Los nombres desaparecen de Arken. Busca al Archivista, sigue el bosque y escucha a su Guardián.']
        }];
    if (arken !== 6)
        return entries;
    entries.push({
        id: 'marsh', eyebrow: 'II · EL ESPEJO', title: 'Las vidas que pudieron ser', status: marsh.complete ? 'complete' : 'active',
        summary: marsh.complete ? (marsh.choice === 'keep' ? 'Decidiste preservar los nombres imposibles.' : 'Permitiste que los nombres imposibles descansaran.') : 'Nael custodia dos recuerdos de vidas que nunca existieron.',
        passages: marsh.complete ? [
            marsh.choice === 'keep' ? 'Conservaste el mapa de las posibilidades perdidas, sin convertirlo en prisión.' : 'Liberaste las vidas imaginadas para que el recuerdo dejase de ser una cadena.',
            'La campana, el farol y los tres testigos revelaron que recordar también exige elegir.',
            marsh.choice === 'keep' ? 'Nael abre el Atlas a quien quiera escuchar las voces imposibles; cuidarlas no es poseerlas.' : 'Nael deja el Atlas junto al farol: recordar la ausencia no exige llenar una página.'
        ] : ['Nael necesita que escuches la campana, el farol y los testigos antes de dictar sentencia.']
    });
    if (!marsh.complete)
        return entries;
    entries.push({
        id: 'crown', eyebrow: 'III · LA CORONA', title: 'El último escriba', status: crown.complete ? 'complete' : 'active',
        summary: crown.complete ? (crown.choice === 'remember' ? 'Elegiste conservar los nombres sin encadenarlos.' : 'Elegiste liberar el futuro de cualquier escriba.') : 'Nullscribe quiere escribir el destino antes de que ocurra.',
        passages: crown.complete ? [...crownEpilogue(flags).map(beat => beat.text), azurWorldConsequence(flags)] : [
            'Oriel te espera en la Corona. Recupera el Archivo y la Lumbre antes de escuchar a sus tres testigos.'
        ]
    });
    if (!crown.complete)
        return entries;
    const ossuary = afterlightProgress('ossuary', flags);
    entries.push({
        id: 'ossuary', eyebrow: 'VIGILIA I · LAS MAREAS', title: AFTERLIGHT.ossuary.title, status: ossuary.complete ? 'complete' : 'active',
        summary: ossuary.complete ? (ossuary.choice === 'anchor' ? 'Anclaste las voces al litoral.' : 'Devolviste las voces al mar.') : 'Edda conserva memorias que ni la Corona pudo nombrar.',
        passages: ossuary.complete ? [
            ossuary.choice === 'anchor' ? 'Las voces del Osario siguen vivas junto al agua. Nadie volverá a borrarlas.' : 'Las voces regresaron a la marea, sin perder su dignidad ni su recuerdo.',
            'La Concha y el Faro mostraron que incluso las decisiones no tomadas merecen ser escuchadas.'
        ] : [...AFTERLIGHT.ossuary.intro]
    });
    if (!ossuary.complete)
        return entries;
    const garden = afterlightProgress('garden', flags);
    entries.push({
        id: 'garden', eyebrow: 'VIGILIA II · EL INVIERNO', title: AFTERLIGHT.garden.title, status: garden.complete ? 'complete' : 'active',
        summary: garden.complete ? (garden.choice === 'bloom' ? 'Permitiste que brotara la primera primavera.' : 'Elegiste que el jardín descansara en paz.') : 'Silas cuida un bosque que todavía no ha nacido.',
        passages: garden.complete ? afterlightEpilogue(flags) : [...AFTERLIGHT.garden.intro]
    });
    return entries;
}
