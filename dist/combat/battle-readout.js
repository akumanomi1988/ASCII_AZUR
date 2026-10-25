export function battleReadout(state) {
    const pct = (hp, max) => Number.isFinite(hp) && Number.isFinite(max) && max > 0 ?
        Math.max(0, Math.min(1, hp / max)) : 0;
    const hp = pct(state.hp, state.maxHp);
    const hpWarn = hp <= .32;
    let severity = 'normal', title = 'TU TURNO', detail = 'Elige una técnica, protege a tu compañero o prepara otro vínculo.';
    let guardRecommended = false;
    if (state.pending === 'victory') {
        severity = 'resolution';
        title = 'VICTORIA EN CURSO';
        detail = 'La última reacción del enemigo está terminando. No necesitas actuar otra vez.';
    }
    else if (state.pending === 'defeat') {
        severity = 'resolution';
        title = 'DERROTA EN CURSO';
        detail = 'La resolución de la caída está pendiente. No se ha perdido el guardado anterior.';
    }
    else if (state.chargeStage === 2) {
        severity = 'critical';
        title = 'ECLIPSE INMINENTE';
        detail = state.guarding ? 'PROTECCIÓN ACTIVA · reduce el siguiente impacto directo un 55 %.' : 'GUARDIA RECOMENDADA · el próximo ECLIPSE de Éter golpea con fuerza. GUARDIA reduce su daño directo un 55 % y consume el turno.';
        guardRecommended = !state.guarding && !state.busy;
    }
    else if (state.chargeStage === 1) {
        severity = 'caution';
        title = 'EL JEFE ESTÁ CARGANDO';
        detail = 'El jefe prepara ECLIPSE. Tras el aviso tendrás oportunidad de usar GUARDIA; conserva salud y recursos.';
    }
    else if (state.boss && state.bossPhase === 2) {
        severity = hpWarn ? 'critical' : 'caution';
        title = hpWarn ? 'FASE II · SALUD CRÍTICA' : 'FASE II · EL JEFE SE INTENSIFICA';
        detail = hpWarn ? 'Riesgo de caída: revisa técnicas defensivas, Tónicos y cambio protegido.' : 'Los golpes del jefe son más fuertes. Observa la carga antes de decidir tu defensa.';
    }
    else if (hpWarn) {
        severity = 'caution';
        title = 'COMPAÑERO EN PELIGRO';
        detail = 'Salud baja. Evalúa un Tónico, una técnica curativa o un intercambio protegido.';
    }
    else if (state.guarding) {
        severity = 'normal';
        title = 'PROTECCIÓN PREPARADA';
        detail = 'El siguiente ataque directo recibido se reducirá un 55 %.';
    }
    else if (state.boss) {
        title = 'ENFRENTAMIENTO DECISIVO';
        detail = 'Prepara tus afinidades y conserva Tónicos para la segunda fase.';
    }
    const affect = [...state.statuses].slice(0, 3), enemy = [...state.enemyStatuses].slice(0, 3);
    const notes = [affect.length ? 'ALIADO · ' + affect.join(', ') : '', enemy.length ? 'ENEMIGO · ' + enemy.join(', ') : ''].filter(Boolean);
    if (notes.length)
        detail += ' · ' + notes.join(' · ');
    return { severity, title, detail, aria: title + '. ' + detail, guardRecommended };
}
/** Minimum battle-button target is the same for mouse, gamepad/keyboard focus, and touch. */
export const BATTLE_CONTROL_MIN_PX = 44;
