/**
 * Narrative agency is entirely derived from existing v1 saved flags.
 * No telemetry, new reward, extra flag, future-branch spoilers or mutation.
 */
import { arkenStoryIndex } from './story-campaign.js';
import { marshChapterProgress } from './story-marsh.js';
import { crownProgress } from './story-finale.js';
import { afterlightProgress } from './story-afterlight.js';
import { BOND_ARCS } from './creatures/bond-quests.js';
import { legacyBranch, legacyClaimed } from './story-legacy.js';
const AZUR_NARRATIVE_OPENING = [
    { title: 'ARKEN · EL PRIMER OLVIDO', text: 'Iria buscaba a su hermano esta mañana. Ahora nadie en la plaza recuerda que existió. Si el olvido continúa, mañana tampoco quedará nadie que recuerde tu nombre.' },
    { title: 'EL ARCHIVISTA AÚN RECUERDA', text: 'Una persona conserva los nombres que se están borrando: el Archivista, junto a la plaza. Escúchalo antes de entrar en el Bosque de Ceniza. Tu compañero es el primer vínculo que el silencio no ha podido romper.' },
    { title: 'TU PRIMERA DECISIÓN', text: 'Habla con el Archivista. Después sigue el camino oriental, busca otros vínculos y descansa en las Lumbres. No necesitas capturar a nadie para terminar la historia: cada compañía puede cambiar cómo la vives.' }
];
export function azurOpening() { return AZUR_NARRATIVE_OPENING.map(v => ({ ...v })); }
export function azurWorldConsequence(flags) {
    if (!flags.includes('crown-trilogy-complete'))
        return 'El destino del Telar sigue sin decidirse.';
    const kept = flags.includes('marsh-choice-keep'), remember = flags.includes('crown-choice-remember');
    if (kept && remember)
        return 'Nael mantiene su Atlas abierto para los que no nacieron. Oriel custodia los nombres, pero ya no decide por nadie.';
    if (kept && !remember)
        return 'Nael conserva el Atlas por decisión propia. Oriel ha roto el derecho del Telar a dictar el futuro.';
    if (!kept && remember)
        return 'Nael dejó descansar las vidas imposibles. Oriel protege los nombres de quienes permanecen, sin retener a los que parten.';
    return 'Nael abrió el Atlas para que las voces partieran. Oriel dejó el Telar vacío: nadie debe seguir una historia escrita.';
}
export function azurNarrativeBeat(story) {
    const flags = story.flags, arken = arkenStoryIndex(story);
    if (arken < 6) {
        const next = ['Habla con el Archivista en la plaza.', 'Sigue el portal oriental al Bosque de Ceniza.',
            'Alcanza el Santuario y escucha a su Custodia.', 'Prepara vínculos contra Hollowhart.',
            'Recupera el Último Signo en la Cripta desde el menú.', 'Lleva la Palabra y el Signo al Archivista.'][arken];
        return { chapter: 'I · EL JURAMENTO',
            stake: 'Arken está olvidando a sus habitantes. Un nombre no basta: debes unir dos recuerdos para que la aldea vuelva a reconocerse.',
            consequence: arken >= 4 ? 'La Primera Palabra ha sobrevivido, pero falta el Último Signo.' : 'Tus vínculos conservan lo que el silencio intenta borrar.', next, optional: false };
    }
    const marsh = marshChapterProgress(flags);
    if (!marsh.complete)
        return { chapter: 'II · LAS VIDAS POSIBLES',
            stake: 'Nael recuerda personas que jamás nacieron. Deberás decidir si cuidar sus historias o dejarlas descansar, sin poder deshacerlo.',
            consequence: marsh.choice === 'keep' ? 'Has elegido conservar las voces imposibles en el Atlas.' : marsh.choice === 'release' ? 'Has elegido permitirles descansar.' : 'La campana, el farol y los tres testigos aún tienen algo que decir.',
            next: marsh.objective, optional: false };
    const crown = crownProgress(flags);
    if (!crown.complete)
        return { chapter: 'III · EL CIELO LIBRE',
            stake: 'Nullscribe escribe el futuro antes de que ocurra. Oriel teme que proteger un nombre se convierta en gobernar otra vida.',
            consequence: flags.includes('marsh-choice-keep') ? 'Nael conservó el Atlas, pero eso no le da poder sobre los nombres.' : 'Nael dejó marchar las vidas imposibles; recordar no debe ser poseer.',
            next: crown.objective, optional: false };
    const sea = afterlightProgress('ossuary', flags), garden = afterlightProgress('garden', flags);
    const legacy = legacyBranch(flags);
    const legacyLead = legacy && !legacyClaimed(flags) ? ' También puedes volver al Archivista de Arken y conservar el testimonio de tus dos decisiones.' : '';
    return { chapter: 'VIGILIA OPCIONAL · DESPUÉS DEL FINAL',
        stake: 'La historia principal terminó. El cielo es libre, pero sus habitantes aún deben aprender a vivir sin destinos impuestos.',
        consequence: azurWorldConsequence(flags),
        next: (!sea.complete ? 'Viaja desde el portal oriental de la Corona al Osario y habla con Edda. Este viaje es opcional.' : !garden.complete ? 'Viaja al Jardín de la Última Escarcha y habla con Silas. Esta continuación es opcional.' : 'La Vigilia terminó. Puedes explorar libremente y releer tus elecciones.') + legacyLead,
        optional: true };
}
export function azurNpcReflection(flags, npc) {
    if (npc === 'archivist') {
        if (flags.includes('crown-trilogy-complete'))
            return { title: 'EL ARCHIVISTA · LA PLAZA RECUERDA', text: 'Cuando Arken recuperó su nombre creí que salvábamos un libro. Ahora veo a niños inventando nombres nuevos: el futuro está en quienes lo viven.' };
        if (flags.includes('arken-vow-restored'))
            return { title: 'EL ARCHIVISTA · UNA PUERTA ABIERTA', text: 'Nuestra aldea vuelve a recordar. Más allá del Santuario, Nael cuida los nombres de quienes jamás pudieron nacer. Ve a escucharla.' };
        return null;
    }
    if (npc === 'nael') {
        if (!flags.includes('marsh-chapter-complete'))
            return null;
        if (flags.includes('crown-trilogy-complete'))
            return { title: 'NAEL · EL ATLAS RESPONDE', text: azurWorldConsequence(flags) };
        return { title: 'NAEL · UNA ELECCIÓN QUE CAMBIÓ ALGUIEN', text: flags.includes('marsh-choice-keep') ?
                'Cada día copio un nombre nuevo en el Atlas. A veces pesa, pero ahora puedo abrirlo ante quien desea escuchar. Oriel debe aprender a cuidar sin encerrar.' :
                'Hoy dejé una página en blanco por primera vez. Los habitantes aún visitan el farol sin sentirse atrapados. Oriel debe aprender que un nombre no es una sentencia.' };
    }
    if (!flags.includes('crown-trilogy-complete'))
        return null;
    return { title: 'ORIEL · TESTIGO, NO DUEÑO', text: azurWorldConsequence(flags) + ' El portal oriental lleva a una Vigilia opcional: Edda necesita escuchar lo que el Telar no pudo escribir.' };
}
export function azurMarshChoiceMeaning(choice) {
    return choice === 'keep' ? 'Nael seguirá escribiendo los nombres imposibles. El Atlas se abrirá a quienes deseen escuchar, sin reclamar poder sobre esas vidas.' :
        'Nael dejará descansar las voces. La campana y el farol permanecerán como testigos: liberarlas no significa negar que existieron.';
}
export function azurCrownChoiceMeaning(choice, flags) {
    return (choice === 'remember' ? 'El Telar conservará los nombres para que nadie sea borrado, pero no volverá a decidir ninguna vida. ' :
        'El Telar renunciará a escribir destinos: cada criatura podrá elegir su nombre. ') +
        (flags.includes('marsh-choice-keep') ? 'Nael eligió cuidar los nombres imposibles.' : 'Nael eligió dejarlos descansar.');
}
export function azurBondLegacy(id, path, flags) {
    const arc = BOND_ARCS.find(a => a.id === id);
    if (!arc)
        return 'JURAMENTO DESCONOCIDO';
    const choice = path === 'fang' ? 'Ha elegido luchar contra el olvido, aunque conservar un recuerdo exija herir.' : 'Ha elegido proteger a quien duda, incluso cuando defender es más difícil que vencer.';
    const echo = id === 'ember' ? 'La historia del Peregrino continúa en su promesa.' :
        id === 'root' ? 'La Primera Palabra también puede ser pronunciada por esta criatura.' :
            id === 'mist' ? 'La campana y el farol laten en el vínculo, sin imponer una sentencia.' :
                'La Lumbre y el Archivo dejan huella, pero no dictan su destino.';
    return arc.title + '. ' + choice + ' ' + echo + (flags.includes('marsh-choice-keep') ? ' Nael puede guardar esta historia sin poseerla.' : flags.includes('marsh-choice-release') ? ' Nael sabe que prometer también significa despedirse.' : '');
}
export function azurAfterlightIntroduction(zone, flags) {
    if (!flags.includes('crown-trilogy-complete'))
        return 'La última elección de la Corona todavía no ha ocurrido.';
    if (zone === 'ossuary')
        return 'La Corona acabó con los destinos impuestos, pero Edda escucha a quienes nunca pudieron elegir. ' + azurWorldConsequence(flags);
    const sea = afterlightProgress('ossuary', flags);
    if (!sea.complete)
        return 'El Jardín espera a que el Osario resuelva su Vigilia.';
    return sea.choice === 'anchor' ? 'Los nombres anclados al litoral son testimonio, no una orden. Silas pregunta qué futuro puede florecer junto a ellos.' :
        'La marea liberó sus voces. Silas pregunta si una vida nueva necesita borrar el invierno que vino antes.';
}
