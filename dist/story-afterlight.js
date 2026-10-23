export const AFTERLIGHT = {
    ossuary: {
        zone: 'ossuary', title: 'La marea de los nombres', keeper: 'Edda · Custodia de las Mareas',
        intro: ['En el fondo del mundo las tumbas no guardan muertos, sino decisiones que nunca se tomaron.',
            'La Concha y el Faro conservan dos voces. Escúchalas y responde a los tres errantes de sal antes de bajar al Pozo.'],
        memories: [
            { id: 'shell', title: 'Concha de los nombres', lines: ['Dentro de la concha murmuran generaciones que no llegaron a conocer el mar.',
                    'Edda escribía sus nombres en la arena. Cada marea se los devolvía cambiados.'] },
            { id: 'beacon', title: 'Faro de hueso', lines: ['Un faro guía a los barcos que nunca regresaron, aunque hace siglos que nadie lo enciende.',
                    'Bajo la luz descubres que recordar también es permitir que alguien parta.'] }
        ],
        verdict: 'Pozo de los Retornos',
        choices: [
            { id: 'anchor', title: 'ANCLAR LOS NOMBRES', description: 'Conservas sus voces. Recibes 4 Sellos y 100 Ecos.' },
            { id: 'release', title: 'DEVOLVERLOS AL MAR', description: 'Libera su peso. Recibes 4 Tónicos y 100 Ecos.' }
        ]
    },
    garden: {
        zone: 'garden', title: 'La semilla bajo el invierno', keeper: 'Silas · Jardinero del Invierno',
        intro: ['Este jardín fue plantado después de la última guerra contra los nombres. Nunca ha visto una primavera.',
            'La Semilla de Vidrio y el Árbol Invertido esperan una respuesta. Escucha también a los tres guardianes de escarcha.'],
        memories: [
            { id: 'seed', title: 'Semilla de vidrio', lines: ['Cada semilla contiene el reflejo de un bosque que no existe todavía.',
                    'El hielo no la protege del mundo: espera a que alguien se atreva a romperlo.'] },
            { id: 'tree', title: 'Árbol invertido', lines: ['Las raíces crecen hacia el cielo; las ramas se hunden en la tierra helada.',
                    'Silas comprendió que la memoria no obliga a repetir el pasado. Puede sostener un comienzo nuevo.'] }
        ],
        verdict: 'Voto de la Aurora',
        choices: [
            { id: 'bloom', title: 'ABRIR LA PRIMAVERA', description: 'El jardín florece. Recibes 5 Sellos, 2 Tónicos y 150 Ecos.' },
            { id: 'sleep', title: 'GUARDAR EL REPOSO', description: 'El jardín permanece en calma. Recibes 2 Sellos, 5 Tónicos y 150 Ecos.' }
        ]
    }
};
export const afterlightFlag = (zone, key) => `afterlight-${zone}-${key}`;
export function afterlightProgress(zone, flags) {
    const own = (key) => flags.includes(afterlightFlag(zone, key));
    const started = zone === 'ossuary' ? flags.includes('crown-trilogy-complete') : flags.includes(afterlightFlag('ossuary', 'complete'));
    const met = own('met');
    const memories = AFTERLIGHT[zone].memories.filter(m => own('memory-' + m.id)).length;
    const witnesses = [0, 1, 2].filter(i => flags.includes('roamer-' + zone + '-' + i)).length;
    const choice = AFTERLIGHT[zone].choices.find(c => own('choice-' + c.id))?.id;
    const complete = own('complete') && !!choice;
    const ready = started && met && memories === 2 && witnesses === 3 && !complete;
    const stage = !started ? 0 : !met ? 1 : memories < 2 ? 2 : witnesses < 3 ? 3 : !complete ? 4 : 5;
    const objective = !started ? (zone === 'ossuary' ? 'Termina la Corona de lo No Escrito.' : 'Cierra el Pozo de los Retornos.') :
        !met ? 'Habla con ' + AFTERLIGHT[zone].keeper + '.' :
            memories < 2 ? 'Recupera los dos recuerdos del lugar.' :
                witnesses < 3 ? 'Resuelve los tres encuentros errantes.' :
                    !complete ? 'Decide en ' + AFTERLIGHT[zone].verdict + '.' :
                        zone === 'ossuary' ? 'Cruza al Jardín de la Última Escarcha.' : 'La Vigilia está completa. Vuelve a hablar con Silas.';
    return { started, met, memories, witnesses, choice, complete, ready, stage, objective,
        title: AFTERLIGHT[zone].title, hint: `${memories}/2 recuerdos · ${witnesses}/3 testigos · ${complete ? 'DECISIÓN SELLADA' : 'DECISIÓN ABIERTA'}` };
}
export function afterlightResolution(zone, flags, choice) {
    const p = afterlightProgress(zone, flags), valid = AFTERLIGHT[zone].choices.some(c => c.id === choice);
    if (!valid || !p.ready)
        return null;
    const additions = [afterlightFlag(zone, 'choice-' + choice), afterlightFlag(zone, 'complete')];
    const reward = zone === 'ossuary' ? { seals: choice === 'anchor' ? 4 : 0, tonics: choice === 'release' ? 4 : 0, echoes: 100 } :
        { seals: choice === 'bloom' ? 5 : 2, tonics: choice === 'bloom' ? 2 : 5, echoes: 150 };
    return { additions, reward };
}
export function afterlightEpilogue(flags) {
    const sea = afterlightProgress('ossuary', flags).choice;
    const garden = afterlightProgress('garden', flags).choice;
    if (!garden)
        return [];
    return [
        sea === 'anchor' ? 'Las voces del Osario permanecen en la costa; nadie vuelve a borrarlas.' : 'El Osario deja partir sus voces. Sus nombres regresan cada vez que sube la marea.',
        garden === 'bloom' ? 'La primera flor abre una senda que nunca antes existió.' : 'El Jardín reposa sin miedo: el invierno ya no es una prisión.',
        'El mundo no ha sido conquistado ni salvado para siempre. Has dejado espacio para que sus criaturas elijan lo que viene.'
    ];
}
