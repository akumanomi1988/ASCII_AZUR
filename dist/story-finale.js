/** ASCII AZUR original trilogy finale. v1 save flags only, no hidden migrations. */
export const CROWN_RELIC_FLAGS = ['crown-relic-flame', 'crown-relic-archive'];
export const CROWN_WITNESS_FLAGS = ['roamer-spire-0', 'roamer-spire-1', 'roamer-spire-2'];
export const CROWN_BOSS_FLAG = 'crown-nullscribe-fallen';
export const CROWN_END_FLAG = 'crown-trilogy-complete';
export const CROWN_CHOICE_REWARDS = { remember: { echoes: 220, seals: 4, tonics: 0 }, renew: { echoes: 220, seals: 0, tonics: 4 } };
export function crownProgress(flags) {
    const s = new Set(flags), memories = CROWN_RELIC_FLAGS.filter(f => s.has(f)).length, witnesses = CROWN_WITNESS_FLAGS.filter(f => s.has(f)).length;
    const choice = s.has('crown-choice-remember') ? 'remember' : s.has('crown-choice-renew') ? 'renew' : null;
    const complete = s.has(CROWN_END_FLAG), boss = s.has(CROWN_BOSS_FLAG), met = s.has('crown-met-oriel');
    const unlocked = s.has('marsh-chapter-complete') && s.has('arken-vow-restored');
    const stage = complete ? 7 : !unlocked ? 0 : !s.has('zone-spire') ? 0 : !met ? 1 : memories < 2 ? 2 : witnesses < 3 ? 3 : !boss ? 4 : !choice ? 5 : 6;
    const beats = [
        ['El filo del atlas', 'Cruza la última puerta de las Marismas', 'Tras decidir cómo recordar, viaja a la Corona: Nullscribe pretende escribir el futuro de los vivos.'],
        ['El guardián del último nombre', 'Habla con Oriel en la Corona', 'Un escriba aguarda a los portadores en la senda occidental.'],
        ['La lumbre y el archivo', 'Recupera dos reliquias de la Corona', 'Las huellas del primer fuego y las páginas que nunca existieron esperan bajo el cielo roto.'],
        ['Los tres nombres prestados', 'Resuelve los tres encuentros de la Corona', 'Tres centinelas errantes guardan el camino hacia Nullscribe. Véncelos o vínculalos.'],
        ['El escriba que niega el mundo', 'Derrota a Nullscribe en la Corona', 'El Escriba sostiene el cielo vacío. Prepara tu equipo en la última Lumbre; el golpe cargado requiere GUARDIA.'],
        ['El telar del amanecer', 'Elige el destino de los nombres', 'Conserva los nombres sin mandar sobre sus vidas o retira al Telar su autoridad. Ambas rutas respetan la decisión de Nael.'],
        ['El último testigo', 'Regresa a Oriel para cerrar la trilogía', 'La decisión está tomada: escucha las consecuencias de Arken, la Marisma y la Corona.'],
        ['Un cielo escrito por muchos', 'Historia principal completada', 'El viaje principal tiene desenlace. El mundo permanece abierto para las criaturas y las expediciones.']
    ];
    const [title, objective, hint] = beats[stage];
    return { stage, title, objective, hint, unlocked, memories, witnesses, boss, choice, complete,
        bossReady: unlocked && met && memories === 2 && witnesses === 3 && !boss,
        choiceReady: unlocked && boss && !choice,
        endingReady: unlocked && boss && !!choice && !complete };
}
export function crownChoose(flags, choice) {
    if (!crownProgress(flags).choiceReady)
        return { flags: [...flags], newlyChosen: false };
    return { flags: [...flags, choice === 'remember' ? 'crown-choice-remember' : 'crown-choice-renew'], newlyChosen: true };
}
export function crownFinish(flags) {
    if (!crownProgress(flags).endingReady)
        return { flags: [...flags], newlyFinished: false };
    return { flags: [...flags, CROWN_END_FLAG], newlyFinished: true };
}
/** Existing Marsh decisions remain meaningful in all four uniquely voiced epilogues. */
export function crownEpilogue(flags) {
    const choice = crownProgress(flags).choice;
    if (!choice)
        return [];
    const marsh = flags.includes('marsh-choice-keep') ? 'preserved' : 'released';
    const memory = marsh === 'preserved'
        ? 'Nael contempla los nombres imposibles que decidiste conservar. Ahora tienen un lugar donde vivir sin convertirse en cadenas.'
        : 'Nael deja marchar las vidas que nunca llegaron a existir. Su recuerdo no se ha perdido: ha aprendido a descansar.';
    const future = choice === 'remember'
        ? 'El último Telar fija un límite al olvido. Arken guarda el nombre de cada viajero, incluso de quienes partieron.'
        : 'El Telar abandona su poder sobre los vivos. Cada criatura elige cómo llamarse, y ningún guardián vuelve a escribir su destino.';
    return [{ title: 'NAEL · LAS VIDAS POSIBLES', text: memory }, { title: 'ORIEL · EL ÚLTIMO TESTIGO', text: future },
        { title: 'FINAL DE ASCII AZUR · UN CIELO COMPARTIDO', text: 'La Primera Palabra, el Último Signo y las dos vidas del Espejo ya no pertenecen al silencio. Vuelves a Arken. El cielo ha dejado de borrar las historias; ahora las escriben sus habitantes. Iria vuelve a recordar a su hermano, incluso cuando él no está cerca. La historia principal ha terminado. Si lo deseas, sigue el portal oriental de la Corona hasta el Osario para emprender una Vigilia opcional; el viaje libre continúa.' }];
}
