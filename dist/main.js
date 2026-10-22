import { AsciiRenderer, drawWorld, drawBattle, drawEvolution } from './render.js';
import { DEFAULT_GRAPHICS, glyphCell, canvasGlyphCell, glyphCount } from './render/graphics-profile.js';
import { visibleEncounters, nearbyEncounter } from './world/encounters.js';
import { drawDungeon } from './dungeons/draw-dungeon.js';
import { chamberAt, chamberProgress } from './dungeons/room-art.js';
import { generateDungeon, nearbyDungeonEvent, completeDungeonEvent, dungeonGateOpen, revealDungeon, dungeonSweep } from './dungeons/labyrinth.js';
import { SPECIES, MOVES, createCreature, gainExp, maxHp, validateSave } from './domain.js';
import { ZONES, sweepMove, isWild, nearbyLandmark, configureWorld, captureWorldSnapshot, freshWorldSeed, seedFromText, terrain, WORLD_W, WORLD_H } from './world.js';
import { SHOP, QUESTS, buy, claimQuests, normalizeEconomy, newEconomy } from './rpg.js';
import { Sound, themeForZone } from './audio.js';
import { FrameMetrics } from './core/frame-metrics.js';
import { AdaptiveGlyphs } from './core/adaptive-glyphs.js';
import { storyGuidance } from './story-navigation.js';
import { ARKEN_STORY, ARKEN_FINALE_REWARD, arkenStoryBeat, arkenStoryIndex, concludeArken, canConcludeArken } from './story-campaign.js';
import { readSave, writeSave } from './core/save-store.js';
import { transferStoredCreature, reserveCreature } from './party.js';
import { createCombatCue, sampleCombatCue, guardDamage } from './actors/combat-fx.js';
import { MOVE_EFFECTS, STATUS_INFO, applyEffect, attackWithStatuses, chooseEnemyMove, endTurnEffects, statusLabel, skillUtility } from './combat/tactics.js';
import { previewMove } from './combat/move-preview.js';
import { reveal, isDiscovered, discoveredPercent } from './world/discovery.js';
import { RUNE_PUZZLES, RUNE_SYMBOLS, submitRune, claimRune } from './puzzles/runes.js';
import { unlockedMoves, equipMove } from './creatures/loadout.js';
import { BIOMES, createExpedition, chooseRoom, completeBattle, availableRooms, expeditionComplete, settleExpedition, roomById } from './expeditions/expedition.js';
const byId = (id) => { const el = document.getElementById(id); if (!el)
    throw Error('Falta elemento UI: ' + id); return el; };
const htmlEscape = (v) => v.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
class AzurGame {
    renderer = new AsciiRenderer(byId('game'));
    frameMetrics = new FrameMetrics();
    adaptiveGlyphs = new AdaptiveGlyphs();
    lastAdaptiveUpdate = 0;
    debugPerformance = false;
    lastDebugUpdate = 0;
    lastCompassUpdate = 0;
    sound = new Sound();
    soundEnabled = true;
    reducedMotion = false;
    combatCue = null;
    save = { version: 1, zone: 'village', x: 4, y: 16, team: [], storage: [], inventory: { seals: 5, tonics: 3 }, defeatedBoss: false, flags: [], playSeconds: 0, rpg: newEconomy() };
    expeditionMessage = '';
    roamingCache = new Map();
    started = false;
    keys = new Set();
    battle = null;
    dialogQueue = [];
    dialogOpen = false;
    modalOpen = false;
    flash = 0;
    last = 0;
    seconds = 0;
    stepCounter = 0;
    notifyTimer;
    encounterCooldown = 3;
    timeSinceSave = 0;
    stick = { x: 0, y: 0, pointerId: -1 };
    padStick = { x: 0, y: 0 };
    padButtons = new Set();
    selectedBattleAction = 0;
    facing = 2;
    moving = false;
    lastDungeonChamber = -1;
    lastReveal = -1;
    camera = { x: 4, y: 16 };
    cameraZone = 'village';
    evolution = null;
    constructor() { this.restoreAudioSettings(); this.restoreMotionSettings(); this.restoreGraphicSettings(); this.restoreAdaptiveGraphics(); this.restoreAccessibility(); this.mountDrawer(); this.wire(); this.loadState(); requestAnimationFrame(this.loop); window.addEventListener('resize', () => this.renderer.resize()); if ('serviceWorker' in navigator && location.protocol.startsWith('http'))
        navigator.serviceWorker.register('./sw.js').catch(() => { }); }
    wire() {
        byId('newGame').addEventListener('click', () => this.startNew());
        byId('continue').addEventListener('click', () => this.continueGame());
        byId('settings').addEventListener('click', () => this.settings());
        byId('mute').addEventListener('click', () => { this.soundEnabled = !this.soundEnabled; this.sound.setEnabled(this.soundEnabled); this.updateMuteUi(); this.storeAudioSettings(); });
        byId('fullscreen').addEventListener('click', () => this.toggleFullscreen());
        byId('quickFullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.addEventListener('fullscreenchange', () => { byId('fullscreen').textContent = document.fullscreenElement ? '⤢' : '⛶'; requestAnimationFrame(() => this.renderer.resize()); });
        byId('drawerToggle').addEventListener('click', () => this.toggleDrawer());
        byId('drawerClose').addEventListener('click', () => this.toggleDrawer(false));
        byId('drawerScrim').addEventListener('click', () => this.toggleDrawer(false));
        this.wireJoystick();
        byId('saveBtn').addEventListener('click', () => this.saveNow(true));
        byId('teamBtn').addEventListener('click', () => this.openTeam());
        byId('bagBtn').addEventListener('click', () => this.openBag());
        byId('closeModal').addEventListener('click', () => this.hideModal());
        byId('modal').addEventListener('click', e => { if (e.target === byId('modal'))
            this.hideModal(); });
        byId('closeDialogue').addEventListener('click', () => this.nextDialog());
        byId('touchInteract').addEventListener('click', () => this.interact());
        document.addEventListener('keydown', e => { if (e.key === 'F3' && !e.repeat) {
            e.preventDefault();
            this.debugPerformance = !this.debugPerformance;
        } if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key))
            e.preventDefault(); if (e.repeat && ['e', 'E', 't', 'T', 'b', 'B', ' ', 'Enter'].includes(e.key))
            return; this.keys.add(e.key.toLowerCase()); if (e.key.toLowerCase() === 'e' || e.key === ' ' || e.key === 'Enter')
            this.interact(); if (e.key === 'Escape') {
            if (this.modalOpen)
                this.hideModal();
            else
                this.toggleDrawer(false);
        } if (e.key.toLowerCase() === 't')
            this.openTeam(); if (e.key.toLowerCase() === 'b')
            this.openBag(); if (e.key === 'Escape') {
            if (this.modalOpen)
                this.hideModal();
            else if (this.dialogOpen)
                this.nextDialog();
        } });
        document.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
        window.addEventListener('blur', () => { this.keys.clear(); this.resetJoystick(); this.padStick = { x: 0, y: 0 }; this.padButtons.clear(); });
        document.addEventListener('visibilitychange', () => { if (document.hidden) {
            this.frameMetrics.reset();
            this.resetJoystick();
            this.sound.pause();
            if (this.started)
                this.saveNow(false);
        }
        else
            this.sound.resume(); });
    }
    /** Standard Gamepad API: USB/Bluetooth controllers work without changing mobile controls. */
    pollGamepad() {
        const pad = typeof navigator.getGamepads === 'function' ? Array.from(navigator.getGamepads()).find(Boolean) : null;
        if (!pad) {
            this.padStick = { x: 0, y: 0 };
            this.padButtons.clear();
            return;
        }
        const axis = (value) => { const v = Number.isFinite(value) ? value : 0; return Math.abs(v) < .18 ? 0 : Math.sign(v) * (Math.abs(v) - .18) / .82; };
        this.padStick = { x: axis(pad.axes[0]), y: axis(pad.axes[1]) };
        const now = new Set();
        pad.buttons.forEach((button, index) => { if (button?.pressed)
            now.add(index); });
        const pressed = (index) => now.has(index) && !this.padButtons.has(index);
        if (pressed(9) && this.started && !this.battle && !this.evolution)
            this.toggleDrawer();
        if (pressed(1)) {
            if (this.modalOpen)
                this.hideModal();
            else if (this.dialogOpen)
                this.nextDialog();
            else if (this.battle?.selecting) {
                this.battle.selecting = false;
                this.refreshBattle();
            }
        }
        if (pressed(12) || pressed(14) || pressed(13) || pressed(15)) {
            if (this.battle && !this.battle.busy) {
                const buttons = Array.from(byId('battleActions').querySelectorAll('button')).filter(b => !b.disabled);
                if (buttons.length) {
                    const delta = pressed(14) || pressed(12) ? -1 : 1;
                    this.selectedBattleAction = (this.selectedBattleAction + buttons.length + delta) % buttons.length;
                    buttons[this.selectedBattleAction]?.focus();
                }
            }
        }
        if (pressed(0)) {
            if (this.battle && !this.battle.busy) {
                const buttons = Array.from(byId('battleActions').querySelectorAll('button')).filter(b => !b.disabled);
                buttons[Math.min(this.selectedBattleAction, buttons.length - 1)]?.click();
            }
            else if (!this.modalOpen)
                this.interact();
        }
        this.padButtons = now;
    }
    toggleFullscreen() { const el = byId('viewport'); if (document.fullscreenElement)
        void document.exitFullscreen();
    else
        void el.requestFullscreen?.().catch(() => this.toast('PANTALLA COMPLETA NO DISPONIBLE')); }
    updateMuteUi() { byId('mute').textContent = this.soundEnabled ? '♫' : '♪'; byId('mute').setAttribute('aria-label', this.soundEnabled ? 'Silenciar audio' : 'Activar audio'); }
    restoreAudioSettings() { try {
        const v = JSON.parse(localStorage.getItem('ascii-azur-audio') || 'null');
        if (v && typeof v === 'object') {
            this.soundEnabled = v.enabled !== false;
            if (Number.isFinite(v.music))
                this.sound.setMusicVolume(v.music);
            if (Number.isFinite(v.effects))
                this.sound.setEffectsVolume(v.effects);
        }
    }
    catch { /* preserve defaults */ } if (!this.soundEnabled)
        this.sound.setEnabled(false); this.updateMuteUi(); }
    restoreGraphicSettings() { try {
        this.renderer.setGraphics(JSON.parse(localStorage.getItem('ascii-azur-graphics-v2') || 'null'));
    }
    catch {
        this.renderer.setGraphics(DEFAULT_GRAPHICS);
    } }
    storeGraphicSettings() { try {
        localStorage.setItem('ascii-azur-graphics-v2', JSON.stringify(this.renderer.getGraphics()));
    }
    catch { /* storage unavailable */ } }
    restoreAdaptiveGraphics() { try {
        this.adaptiveGlyphs.configure(localStorage.getItem('ascii-azur-adaptive-fps-v1') === 'true');
    }
    catch { /* preserve manual mode */ } this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale); }
    setAdaptiveGraphics(enabled) { this.adaptiveGlyphs.configure(enabled); this.frameMetrics.reset(); this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale); try {
        localStorage.setItem('ascii-azur-adaptive-fps-v1', String(this.adaptiveGlyphs.active));
    }
    catch { /* storage disabled */ } }
    restoreMotionSettings() { try {
        const v = localStorage.getItem('ascii-azur-reduced-motion');
        this.reducedMotion = v === null ? !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches : v === 'true';
    }
    catch {
        this.reducedMotion = false;
    } }
    restoreAccessibility() {
        try {
            const settings = JSON.parse(localStorage.getItem('ascii-azur-accessibility') || 'null');
            document.documentElement.classList.toggle('azur-large-text', settings?.largeText === true);
            document.documentElement.classList.toggle('azur-left-handed', settings?.leftHanded === true);
        }
        catch { /* use defaults */ }
    }
    persistAccessibility() {
        try {
            localStorage.setItem('ascii-azur-accessibility', JSON.stringify({ largeText: document.documentElement.classList.contains('azur-large-text'), leftHanded: document.documentElement.classList.contains('azur-left-handed') }));
        }
        catch { /* storage unavailable */ }
    }
    storeAudioSettings() { try {
        localStorage.setItem('ascii-azur-audio', JSON.stringify({ enabled: this.soundEnabled, music: this.sound.getMusicVolume(), effects: this.sound.getEffectsVolume() }));
    }
    catch { /* private mode */ } }
    mountDrawer() {
        // Reparent existing controls; same DOM nodes and event listeners, including in fullscreen.
        byId('drawerActions').append(byId('teamBtn'), byId('bagBtn'), byId('saveBtn'));
        const extra = document.createElement('div');
        extra.className = 'drawer-actions extended';
        extra.innerHTML = '<button id="questsBtn">✧ MISIONES</button><button id="codexBtn">❖ BESTIARIO</button><button id="mapBtn">◇ MAPA</button><button id="expeditionsBtn">✦ EXPEDICIONES</button><button id="dungeonBtn">♜ CRIPTA EXPLORABLE</button><button id="duelBtn">⚔ COMBATE DIRECTO</button><button id="graphicsBtn">⚙ OPCIONES GRÁFICAS</button>';
        byId('drawerActions').after(extra);
        extra.querySelector('#questsBtn')?.addEventListener('click', () => this.openQuests());
        extra.querySelector('#codexBtn')?.addEventListener('click', () => this.openCodex());
        extra.querySelector('#mapBtn')?.addEventListener('click', () => this.openMap());
        extra.querySelector('#expeditionsBtn')?.addEventListener('click', () => this.openExpedition());
        extra.querySelector('#dungeonBtn')?.addEventListener('click', () => this.openDungeonMenu());
        extra.querySelector('#duelBtn')?.addEventListener('click', () => this.openDuel());
        extra.querySelector('#graphicsBtn')?.addEventListener('click', () => this.settings());
        const backup = document.createElement('div');
        backup.className = 'drawer-actions extended';
        backup.innerHTML = '<button id="exportBtn">⇩ EXPORTAR PARTIDA</button><button id="importBtn">⇧ IMPORTAR PARTIDA</button><input type="file" id="restoreFile" accept="application/json,.json" hidden>';
        extra.after(backup);
        backup.querySelector('#exportBtn')?.addEventListener('click', () => this.exportGame());
        backup.querySelector('#importBtn')?.addEventListener('click', () => backup.querySelector('#restoreFile')?.click());
        backup.querySelector('#restoreFile')?.addEventListener('change', async (e) => {
            const input = e.target;
            const file = input.files?.[0];
            if (!file)
                return;
            try {
                if (file.size > 1000000)
                    throw Error('Archivo demasiado grande');
                const json = JSON.parse(await file.text());
                if (!validateSave(json))
                    throw Error('Partida inválida');
                if (!window.confirm('Se sustituirá la partida actual por la importada. ¿Continuar?'))
                    return;
                this.save = json;
                configureWorld(this.save.worldSeed ?? 0, this.save.worldSnapshot);
                this.roamingCache.clear();
                this.save.rpg = normalizeEconomy(json.rpg);
                this.started = true;
                this.battle = null;
                this.cameraZone = '';
                this.lastReveal = -1;
                this.revealPosition();
                this.sound.unlock();
                this.sound.setScene(this.save.dungeon?.active ? 'sanctuary' : themeForZone(this.save.zone));
                byId('battle').classList.add('hidden');
                byId('viewport').classList.remove('in-battle');
                byId('titleScreen').classList.add('hidden');
                byId('starterScreen').classList.add('hidden');
                this.toggleDrawer(false);
                this.hideModal();
                this.updateUI();
                this.restoreBattle();
                this.saveNow(false);
                this.toast('PARTIDA IMPORTADA');
            }
            catch {
                this.toast('ARCHIVO DE PARTIDA NO VÁLIDO');
            }
            finally {
                input.value = '';
            }
        });
        byId('drawerSidebar').append(byId('quest').closest('.sidebar'));
        byId('viewport').append(byId('modal')); // modal must be a descendant of fullscreen element
    }
    toggleDrawer(force) {
        const drawer = byId('gameDrawer');
        const open = force ?? !drawer.classList.contains('open');
        drawer.classList.toggle('open', open);
        drawer.setAttribute('aria-hidden', String(!open));
        byId('drawerScrim').classList.toggle('hidden', !open);
        byId('drawerToggle').setAttribute('aria-expanded', String(open));
        if (open)
            this.resetJoystick();
    }
    resetJoystick() { this.stick.x = 0; this.stick.y = 0; this.stick.pointerId = -1; byId('joystickKnob').style.transform = 'translate(-50%, -50%)'; }
    wireJoystick() {
        const pad = byId('joystick'), knob = byId('joystickKnob');
        const update = (e) => {
            const rect = pad.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
            const radius = Math.max(20, Math.min(rect.width, rect.height) * .31);
            const dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy), clamped = Math.min(dist, radius);
            const unit = dist ? clamped / dist : 0;
            const x = dx * unit / radius, y = dy * unit / radius;
            const m = Math.hypot(x, y), effective = m < .12 ? 0 : (m - .12) / .88;
            this.stick.x = m ? x / m * effective : 0;
            this.stick.y = m ? y / m * effective : 0;
            knob.style.transform = `translate(calc(-50% + ${dx * unit}px),calc(-50% + ${dy * unit}px))`;
        };
        pad.addEventListener('pointerdown', e => { if (this.stick.pointerId !== -1)
            return; e.preventDefault(); this.stick.pointerId = e.pointerId; pad.setPointerCapture(e.pointerId); update(e); });
        pad.addEventListener('pointermove', e => { if (this.stick.pointerId !== e.pointerId)
            return; e.preventDefault(); update(e); });
        const release = (e) => { if (this.stick.pointerId !== e.pointerId)
            return; this.resetJoystick(); };
        pad.addEventListener('pointerup', release);
        pad.addEventListener('pointercancel', release);
        pad.addEventListener('lostpointercapture', release);
    }
    loadState() { try {
        const saved = readSave(localStorage);
        if (saved) {
            byId('continue').hidden = false;
            byId('saveStatus').textContent = saved.source === 'backup' ? 'RESPALDO DE PARTIDA DISPONIBLE' : 'PARTIDA LOCAL DETECTADA';
        }
    }
    catch { /* blocked storage */ } }
    reset() { this.resetJoystick(); this.toggleDrawer(false); this.roamingCache.clear(); this.save = { version: 1, zone: 'village', x: 4, y: 16, team: [], storage: [], inventory: { seals: 5, tonics: 3 }, defeatedBoss: false, flags: [], playSeconds: 0, rpg: newEconomy(), worldSeed: freshWorldSeed() }; configureWorld(this.save.worldSeed); this.save.worldSnapshot = captureWorldSnapshot(); this.battle = null; this.evolution = null; this.combatCue = null; this.keys.clear(); this.encounterCooldown = 4; this.camera = { x: 4, y: 16 }; this.cameraZone = 'village'; this.lastReveal = -1; }
    startNew() { try {
        if (readSave(localStorage) && !window.confirm('Crear un viaje nuevo sustituirá tu partida actual. Puedes continuarla y exportarla antes de empezar. ¿Crear nuevo mundo?'))
            return;
    }
    catch { /* storage may be disabled */ } this.sound.unlock(); this.sound.setScene('title'); const requested = (byId('worldSeedInput').value || '').trim(); this.reset(); if (requested) {
        this.save.worldSeed = /^\d{1,10}$/.test(requested) && Number(requested) <= 4294967295 ? Number(requested) || 1 : seedFromText(requested);
        configureWorld(this.save.worldSeed);
        this.save.worldSnapshot = captureWorldSnapshot();
    } byId('titleScreen').classList.add('hidden'); byId('starterScreen').classList.remove('hidden'); this.renderStarters(); this.sound.select(); }
    continueGame() { try {
        const result = readSave(localStorage);
        if (!result)
            throw Error('Guardado inválido');
        const raw = result.state;
        this.save = raw;
        configureWorld(this.save.worldSeed ?? 0, this.save.worldSnapshot);
        this.roamingCache.clear();
        this.save.rpg = normalizeEconomy(raw.rpg);
        this.camera = { x: this.save.x, y: this.save.y };
        this.cameraZone = this.save.zone;
        this.lastReveal = -1;
        this.revealPosition();
        this.started = true;
        this.sound.unlock();
        this.sound.setScene(this.save.dungeon?.active ? 'sanctuary' : themeForZone(this.save.zone));
        this.encounterCooldown = 4;
        byId('titleScreen').classList.add('hidden');
        this.sound.portal();
        this.toast(result.source === 'backup' ? 'PARTIDA RECUPERADA DESDE RESPALDO' : 'PARTIDA RECUPERADA');
        this.updateUI();
        this.restoreBattle();
    }
    catch {
        this.toast('EL GUARDADO NO SE PUDO RECUPERAR');
    } }
    renderStarters() { const chars = [{ id: 'cindrel', glyph: '♨', title: 'EL FUEGO' }, { id: 'velaria', glyph: '≋', title: 'LA BRUMA' }, { id: 'thorne', glyph: '✣', title: 'LA RAÍZ' }]; byId('starters').innerHTML = chars.map(c => `<button class="starter" data-starter="${c.id}"><span class="starter-symbol" style="color:${SPECIES[c.id].color}">${c.glyph}</span><strong>${SPECIES[c.id].name}</strong><small>${c.title}</small></button>`).join(''); for (const el of byId('starters').querySelectorAll('[data-starter]'))
        el.addEventListener('click', () => this.pickStarter(el.dataset.starter)); }
    pickStarter(id) { this.sound.setScene('village'); this.save.team = [createCreature(id, 5)]; this.revealPosition(); this.started = true; byId('starterScreen').classList.add('hidden'); this.sound.pick(); this.toast('NUEVO MUNDO · SEMILLA ' + this.save.worldSeed); this.dialog([{ title: 'El último Portador', text: 'Los nombres se están desvaneciendo. El tuyo permanece porque alguien lo recuerda.' }, { title: 'El último Portador', text: 'Al este se extiende el Bosque de Ceniza. Encuentra el Santuario sin Voz y recupera la Primera Palabra.' }, { title: 'Comienza el viaje', text: 'Muévete con WASD o las flechas. Pulsa E para interactuar. Busca las hogueras para recuperar la fuerza.' }]); this.updateUI(); this.saveNow(false); }
    flag(id) { return this.save.flags.includes(id); }
    get storyState() { return { flags: this.save.flags, defeatedBoss: this.save.defeatedBoss, dungeonFinished: !!this.save.dungeon?.finished }; }
    storyBeat() { return arkenStoryBeat(this.storyState); }
    concludeStory() {
        const result = concludeArken(this.storyState);
        if (!result.newlyCompleted)
            return false;
        this.save.flags = result.flags;
        this.economy.echoes = Math.min(999999, this.economy.echoes + ARKEN_FINALE_REWARD.echoes);
        this.save.inventory.seals = Math.min(9999, this.save.inventory.seals + ARKEN_FINALE_REWARD.seals);
        this.sound.pick();
        this.processQuests();
        this.saveNow(false);
        this.updateUI();
        return true;
    }
    get economy() { if (!this.save.rpg)
        this.save.rpg = newEconomy(); return this.save.rpg; }
    addFlag(id) { if (!this.flag(id))
        this.save.flags.push(id); this.processQuests(); this.updateUI(); }
    processQuests() { const result = claimQuests(this.economy, this.save.flags, this.save.defeatedBoss); for (const q of result)
        this.toast(`MISIÓN COMPLETADA: ${q.name.toUpperCase()} · +${q.reward} ECOS`); }
    toast(text) { const el = byId('toast'); el.textContent = text; el.classList.remove('hidden'); if (this.notifyTimer)
        clearTimeout(this.notifyTimer); this.notifyTimer = window.setTimeout(() => el.classList.add('hidden'), 2800); }
    dialog(items) { this.dialogQueue = items.slice(); this.dialogOpen = true; byId('dialogue').classList.remove('hidden'); this.renderDialog(); }
    renderDialog() { const item = this.dialogQueue[0]; if (!item) {
        this.dialogOpen = false;
        byId('dialogue').classList.add('hidden');
        return;
    } byId('diaTitle').textContent = item.title; byId('diaText').textContent = item.text; }
    nextDialog() { if (!this.dialogOpen)
        return; this.dialogQueue.shift(); this.sound.select(); this.renderDialog(); if (!this.dialogOpen && this.openShopAfterDialog) {
        this.openShopAfterDialog = false;
        this.openShop();
    } }
    interact() { if (this.evolution)
        return; if (byId('titleScreen').classList.contains('hidden') === false)
        return; if (!byId('starterScreen').classList.contains('hidden'))
        return; if (this.modalOpen)
        return; if (this.dialogOpen) {
        this.nextDialog();
        return;
    } if (this.battle)
        return; if (!this.started)
        return; if (this.save.dungeon?.active) {
        this.dungeonInteract();
        return;
    } const roamer = this.nearRoamer(); if (roamer) {
        this.startBattle(roamer.speciesId, roamer.level, 'wild', roamer.id);
        return;
    } const l = nearbyLandmark(this.save.zone, this.save.x, this.save.y, 2.15); if (!l) {
        this.toast('NO HAY NADA CON LO QUE INTERACTUAR');
        return;
    } this.interactLandmark(l); }
    roamers() { const key = this.save.zone + ':' + (this.save.worldSeed ?? 0); let list = this.roamingCache.get(key); if (!list) {
        list = visibleEncounters(this.save.zone, this.save.worldSeed ?? 0);
        this.roamingCache.set(key, list);
    } return list.filter(e => !this.flag('roamer-' + e.id)); }
    nearRoamer() { return nearbyEncounter(this.roamers(), this.save.flags, this.save.x, this.save.y, 1.8); }
    interactLandmark(l) {
        switch (l.kind) {
            case 'npc':
                this.interactNpc(l.npcId || 'archivist');
                break;
            case 'rune':
                this.openRune(this.save.zone);
                break;
            case 'altar':
                this.save.team.forEach(c => c.hp = maxHp(c));
                this.save.inventory.seals = Math.min(9, this.save.inventory.seals + 1);
                this.encounterCooldown = 4;
                this.addFlag('altar-' + this.save.zone);
                this.sound.pick();
                this.toast('VÍNCULOS SANADOS · +1 SELLO');
                this.saveNow(false);
                break;
            case 'chest': {
                const id = `chest-${this.save.zone}-${l.x}`;
                if (this.flag(id)) {
                    this.toast('EL COFRE ESTÁ VACÍO');
                    break;
                }
                this.addFlag(id);
                this.save.inventory.seals += 3;
                this.save.inventory.tonics += 2;
                this.economy.echoes += 25;
                this.sound.pick();
                this.dialog([{ title: 'Un juramento olvidado', text: 'Encuentras 3 Sellos de Vínculo, 2 Tónicos y 25 Ecos. El metal conserva una inscripción: «Nadie desaparece mientras alguien lo recuerde».' }]);
                break;
            }
            case 'portal': {
                let next;
                if (this.save.zone === 'village')
                    next = 'forest';
                else if (this.save.zone === 'forest')
                    next = l.x < 10 ? 'village' : 'sanctuary';
                else
                    next = 'forest';
                this.save.zone = next;
                this.cameraZone = '';
                this.sound.setScene(themeForZone(next));
                this.save.x = l.x > 20 ? 4 : 40;
                this.save.y = 16;
                this.encounterCooldown = 5;
                this.lastReveal = -1;
                this.revealPosition();
                this.addFlag('zone-' + next);
                this.sound.portal();
                this.toast('ENTRAS EN ' + ZONES[next].name.toUpperCase());
                this.saveNow(false);
                this.updateUI();
                break;
            }
            case 'guardian':
                if (this.save.defeatedBoss) {
                    this.toast('EL GUARDIÁN DESCANSA');
                    return;
                }
                this.startBattle('hollowhart', 12, 'boss');
                break;
        }
    }
    checkpointBattle() {
        const b = this.battle;
        if (!b || !this.started)
            return;
        const record = { enemy: { ...b.enemy, moves: [...b.enemy.moves] }, type: b.type, ally: b.ally, guarding: b.guarding, bossPhase: b.bossPhase, chargeStage: b.chargeStage, encounterId: b.encounterId, effects: Object.fromEntries(Object.entries(b.effects).map(([uid, arr]) => [uid, arr.map(a => ({ ...a }))])) };
        this.save.activeBattle = record;
        this.saveNow(false);
    }
    restoreBattle() {
        const b = this.save.activeBattle;
        if (!b || !this.started)
            return;
        this.battle = { enemy: { ...b.enemy, moves: [...b.enemy.moves] }, type: b.type, ally: b.ally, guarding: b.guarding, bossPhase: b.bossPhase, chargeStage: b.chargeStage, encounterId: b.encounterId, effects: Object.fromEntries(Object.entries(b.effects).map(([id, arr]) => [id, arr.map(s => ({ ...s }))])), busy: false, selecting: false, log: 'El combate continúa donde lo dejaste. El silencio no ha ganado.' };
        const available = this.save.team.findIndex(c => c.hp > 0);
        if (available < 0) {
            this.defeat();
            return;
        }
        if (!this.save.team[this.battle.ally]?.hp)
            this.battle.ally = available;
        this.sound.setScene(b.type === 'boss' ? 'boss' : 'battle');
        this.toggleDrawer(false);
        byId('battle').classList.remove('hidden');
        byId('viewport').classList.add('in-battle');
        this.refreshBattle();
        if (b.enemy.hp <= 0) {
            this.battle.busy = true;
            window.setTimeout(() => this.winBattle(), 250);
        }
    }
    startBattle(id, level, type, encounterId) { if (this.battle)
        return; this.toggleDrawer(false); this.resetJoystick(); let ally = this.save.team.findIndex(c => c.hp > 0); if (ally < 0) {
        this.defeat();
        return;
    } this.sound.setScene(type === 'boss' ? 'boss' : 'battle'); this.battle = { enemy: createCreature(id, level), type, encounterId, busy: false, ally, guarding: false, selecting: false, bossPhase: 1, chargeStage: 0, effects: {}, log: type === 'boss' ? 'HOLLOWHART, EL ÚLTIMO GUARDIÁN, DESPIERTA.' : type === 'expedition' ? `LA GRIETA SE ABRE: ${SPECIES[id].name.toUpperCase()} TE DESAFÍA.` : `¡UN ${SPECIES[id].name.toUpperCase()} SALVAJE APARECE!` }; this.combatCue = null; this.encounterCooldown = 9; byId('battle').classList.remove('hidden'); byId('viewport').classList.add('in-battle'); byId('prompt').classList.add('hidden'); this.sound.portal(); this.refreshBattle(); }
    getAlly() { return this.battle ? this.save.team[this.battle.ally] : null; }
    statuses(c) { return this.battle?.effects[c.uid] ?? []; }
    setStatuses(c, list) { if (this.battle)
        this.battle.effects[c.uid] = list; }
    tickBurn(c) { const out = endTurnEffects(c, this.statuses(c)); this.setStatuses(c, out.statuses); c.hp = Math.max(0, c.hp - out.damage); return out.damage; }
    applyCombatStatus(target, id) { const effect = MOVE_EFFECTS[id]; if (!effect || target.hp <= 0)
        return ''; const applied = applyEffect(this.statuses(target), effect, Math.random()); this.setStatuses(target, applied.statuses); return applied.applied ? ` · ${STATUS_INFO[effect.kind].name}!` : ''; }
    setCombatCue(kind, actor, element, damageValue = 0, effective = false) {
        this.combatCue = createCombatCue(kind, actor, element, this.seconds, damageValue, effective);
    }
    refreshBattle() {
        const b = this.battle;
        if (!b)
            return;
        const ally = this.getAlly();
        if (!ally)
            return;
        this.checkpointBattle();
        const es = SPECIES[b.enemy.speciesId], as = SPECIES[ally.speciesId];
        byId('enemyName').textContent = es.name;
        byId('enemyLv').textContent = 'NV. ' + b.enemy.level + (b.type === 'boss' && b.bossPhase === 2 ? ' · II' : '') + (this.statuses(b.enemy).length ? ' · ' + statusLabel(this.statuses(b.enemy)) : '');
        byId('enemyHpText').textContent = `${b.enemy.hp}/${maxHp(b.enemy)}`;
        byId('enemyHealth').style.width = Math.max(0, b.enemy.hp / maxHp(b.enemy) * 100) + '%';
        byId('allyName').textContent = as.name;
        byId('allyLv').textContent = 'NV. ' + ally.level + (this.statuses(ally).length ? ' · ' + statusLabel(this.statuses(ally)) : '');
        byId('allyHpText').textContent = `${ally.hp}/${maxHp(ally)}`;
        byId('allyHealth').style.width = Math.max(0, ally.hp / maxHp(ally) * 100) + '%';
        byId('battleLog').textContent = b.log;
        const actions = byId('battleActions');
        actions.replaceChildren();
        const add = (name, func, special = false, disabled = false, detail = '', preview) => { const button = document.createElement('button'); button.textContent = name; button.disabled = b.busy || disabled; if (special)
            button.classList.add('special'); if (detail)
            button.title = detail; if (preview) {
            button.classList.add('battle-move');
            button.textContent = '';
            const label = document.createElement('span');
            label.className = 'battle-move-name';
            label.textContent = name;
            const metrics = document.createElement('span');
            metrics.className = 'battle-move-estimate';
            metrics.textContent = preview.summary;
            const effects = document.createElement('span');
            effects.className = 'battle-move-extra';
            effects.textContent = preview.extra;
            button.append(label, metrics, effects);
            button.setAttribute('aria-label', preview.accessible);
        } button.onclick = func; actions.appendChild(button); };
        if (b.selecting) {
            this.selectedBattleAction = 0;
            for (const { c, i } of this.save.team.map((c, i) => ({ c, i }))) {
                if (i === b.ally)
                    continue;
                const sp = SPECIES[c.speciesId];
                add(`↻ ${sp.name} · NV ${c.level} · ${c.hp}/${maxHp(c)}`, () => this.switchTo(i), false, c.hp <= 0, sp.desc);
            }
            add('← VOLVER', () => { b.selecting = false; this.refreshBattle(); });
            return;
        }
        this.selectedBattleAction = Math.min(this.selectedBattleAction, Math.max(0, ally.moves.length + 3));
        for (const id of ally.moves) {
            const m = MOVES[id];
            if (m)
                add(`✦ ${m.name} · ${m.element}`, () => this.useMove(id), false, (m.role === 'heal' && ally.hp === maxHp(ally)) || (m.role === 'cleanse' && !this.statuses(ally).length), `${m.description} · Potencia ${m.power}${MOVE_EFFECTS[id] ? ' · ' + STATUS_INFO[MOVE_EFFECTS[id].kind].description : ''}`, previewMove(ally, b.enemy, m, this.statuses(ally), this.statuses(b.enemy)));
        }
        add('⛨ GUARDIA · -55% DAÑO', () => this.defend());
        add(`◇ VINCULAR (${this.save.inventory.seals})`, () => this.capture(), true, b.type !== 'wild' || this.save.inventory.seals === 0);
        add(`✚ TÓNICO (${this.save.inventory.tonics})`, () => this.tonic(), false, this.save.inventory.tonics === 0 || ally.hp === maxHp(ally));
        add('↻ CAMBIAR', () => this.switchCreature(), false, !this.save.team.some((c, i) => c.hp > 0 && i !== b.ally));
        if (b.type === 'wild')
            add('↗ HUIR', () => this.escape());
    }
    useMove(id) {
        const b = this.battle, ally = this.getAlly(), m = MOVES[id];
        if (!b || !ally || !m || b.busy)
            return;
        b.busy = true;
        b.guarding = false;
        const utility = skillUtility(ally, m, this.statuses(ally));
        const result = attackWithStatuses(ally, b.enemy, m, this.statuses(ally), this.statuses(b.enemy), .90 + Math.random() * .19);
        this.setStatuses(ally, result.attackerStatuses);
        this.setStatuses(b.enemy, result.defenderStatuses);
        const dealt = m.role === 'heal' ? 0 : result.value;
        b.enemy.hp = Math.max(0, b.enemy.hp - dealt);
        let restored = 0;
        if (m.role === 'heal')
            restored = utility.healing;
        else if (m.role === 'drain')
            restored = Math.min(maxHp(ally) - ally.hp, Math.ceil(dealt * .35));
        ally.hp = Math.min(maxHp(ally), ally.hp + restored);
        if (utility.cleanse)
            this.setStatuses(ally, []);
        const statusText = m.role === 'heal' ? '' : this.applyCombatStatus(b.enemy, id);
        this.setCombatCue(m.role === 'heal' ? 'heal' : 'attack', 'ally', m.element, dealt, result.effective);
        this.flash = .28;
        this.sound.hitElement(m.element);
        b.log = `${SPECIES[ally.speciesId].name} usa ${m.name}. ${dealt ? dealt + ' de daño' : ''}${restored ? ' · +' + restored + ' HP' : ''}${utility.cleanse ? ' · ESTADOS LIMPIADOS' : ''}${result.effective && dealt ? ' · ¡EFICAZ!' : ''}${statusText}.`;
        const selfBurn = this.tickBurn(ally);
        if (selfBurn)
            b.log += ` ${SPECIES[ally.speciesId].name} sufre ${selfBurn} por ARDOR.`;
        if ((b.type === 'boss' || (b.type === 'expedition' && this.save.expedition?.pending && roomById(this.save.expedition, this.save.expedition.pending)?.kind === 'boss')) && b.bossPhase === 1 && b.enemy.hp > 0 && b.enemy.hp <= maxHp(b.enemy) * .5) {
            b.bossPhase = 2;
            b.chargeStage = 1;
            b.log += ` ¡${SPECIES[b.enemy.speciesId].name.toUpperCase()} DESATA SU SEGUNDO NOMBRE!`;
            this.flash = .72;
        }
        if (ally.hp <= 0) {
            const next = this.save.team.findIndex(c => c.hp > 0);
            if (next >= 0)
                b.ally = next;
        }
        this.refreshBattle();
        if (b.enemy.hp <= 0) {
            window.setTimeout(() => this.winBattle(), 960);
            return;
        }
        if (!this.save.team.some(c => c.hp > 0)) {
            window.setTimeout(() => this.defeat(), 960);
            return;
        }
        window.setTimeout(() => this.enemyTurn(), 1000);
    }
    defend() {
        const b = this.battle, ally = this.getAlly();
        if (!b || !ally || b.busy)
            return;
        b.busy = true;
        b.guarding = true;
        b.log = `${SPECIES[ally.speciesId].name} protege sus recuerdos. El próximo ataque hará un 55% menos de daño.`;
        this.setCombatCue('guard', 'ally', SPECIES[ally.speciesId].element);
        this.sound.select();
        const burn = this.tickBurn(ally);
        if (burn)
            b.log += ` ${burn} de daño por ARDOR.`;
        if (ally.hp <= 0) {
            const next = this.save.team.findIndex(c => c.hp > 0);
            if (next >= 0)
                b.ally = next;
            else {
                this.defeat();
                return;
            }
        }
        this.refreshBattle();
        window.setTimeout(() => this.enemyTurn(), 680);
    }
    enemyTurn() {
        const b = this.battle, ally = this.getAlly();
        if (!b || !ally)
            return;
        if (b.chargeStage === 1) {
            b.chargeStage = 2;
            b.guarding = false;
            b.busy = false;
            b.log = `¡${SPECIES[b.enemy.speciesId].name.toUpperCase()} ACUMULA EL SILENCIO! Su próximo ataque será devastador. Usa GUARDIA.`;
            this.setCombatCue('guard', 'enemy', 'Éter');
            this.refreshBattle();
            return;
        }
        const charged = b.chargeStage === 2;
        b.chargeStage = 0;
        const moveId = chooseEnemyMove(b.enemy, ally, this.statuses(b.enemy), this.statuses(ally), Math.random());
        const m = MOVES[moveId] || MOVES.pulse;
        const enemyUtility = skillUtility(b.enemy, m, this.statuses(b.enemy));
        const result = attackWithStatuses(b.enemy, ally, m, this.statuses(b.enemy), this.statuses(ally), .86 + Math.random() * .21);
        this.setStatuses(b.enemy, result.attackerStatuses);
        this.setStatuses(ally, result.defenderStatuses);
        const raw = m.role === 'heal' ? 0 : Math.ceil(result.value * (charged ? 1.65 : b.bossPhase === 2 ? 1.15 : 1));
        const actual = raw ? guardDamage(raw, b.guarding) : 0;
        const recovered = m.role === 'heal' ? enemyUtility.healing : m.role === 'drain' ? Math.min(maxHp(b.enemy) - b.enemy.hp, Math.ceil(actual * .35)) : 0;
        b.enemy.hp = Math.min(maxHp(b.enemy), b.enemy.hp + recovered);
        if (enemyUtility.cleanse)
            this.setStatuses(b.enemy, []);
        ally.hp = Math.max(0, ally.hp - actual);
        const affliction = m.role === 'heal' ? '' : this.applyCombatStatus(ally, moveId);
        b.log = `${SPECIES[b.enemy.speciesId].name} usa ${charged ? 'RUPTURA DEL SILENCIO' : m.name}. ${actual ? 'Recibes ' + actual + ' de daño' : ''}${recovered ? ' · Recupera ' + recovered + ' HP' : ''}${enemyUtility.cleanse ? ' · Purifica sus estados' : ''}${b.guarding && actual ? ' (guardia)' : ''}${affliction}.`;
        const burn = this.tickBurn(b.enemy);
        if (burn)
            b.log += ` ${SPECIES[b.enemy.speciesId].name} sufre ${burn} por ARDOR.`;
        b.guarding = false;
        this.setCombatCue(m.role === 'heal' ? 'heal' : 'attack', 'enemy', charged ? 'Éter' : m.element, actual, result.effective);
        this.sound.hitElement(charged ? 'Éter' : m.element);
        this.flash = charged ? .4 : .18;
        if (ally.hp <= 0) {
            const next = this.save.team.findIndex(c => c.hp > 0);
            if (next < 0) {
                this.refreshBattle();
                window.setTimeout(() => this.defeat(), 1050);
                return;
            }
            b.ally = next;
            b.log += ` ${SPECIES[this.save.team[next].speciesId].name} acude a tu llamada.`;
        }
        if (b.enemy.hp <= 0) {
            this.refreshBattle();
            window.setTimeout(() => this.winBattle(), 760);
            return;
        }
        b.busy = false;
        this.refreshBattle();
    }
    winBattle() { const b = this.battle, ally = this.getAlly(); if (!b || !ally)
        return; const amount = b.type === 'boss' ? 95 : 11 + b.enemy.level * 3; const beforeSpecies = ally.speciesId; const gain = gainExp(ally, amount); const originalName = SPECIES[b.enemy.speciesId].name; this.finishBattle(); if (b.encounterId)
        this.addFlag('roamer-' + b.encounterId); this.sound.pick(); if (b.type === 'wild' && this.save.dungeon?.active && this.save.dungeon.pending !== null)
        this.finishDungeonEnemy(); if (b.type === 'expedition') {
        this.expeditionBattleWon();
        if (gain.evolved)
            this.beginEvolution(beforeSpecies, ally.speciesId);
        this.saveNow(false);
        this.updateUI();
        window.setTimeout(() => this.openExpedition(), gain.evolved ? 3500 : 620);
        return;
    } if (b.type === 'boss') {
        this.save.defeatedBoss = true;
        this.addFlag('first-word');
        this.dialog([{ title: 'El lenguaje se quiebra', text: 'Hollowhart cae de rodillas. Entre sus astas aparece una palabra que no puede pronunciarse.' }, { title: 'LA PRIMERA PALABRA', text: 'La primera sílaba del mundo es tuya. El bosque vuelve a respirar. Pero más allá del santuario alguien ha comenzado a borrar el cielo.' }, { title: 'FIN DEL CAPÍTULO I', text: 'La Primera Palabra ha vuelto, pero Arken aún no puede recordarlo todo. Regresa a la aldea, desciende a la Cripta de los Ecos y busca el Último Signo.' }]);
    }
    else {
        if (!gain.evolved)
            this.toast(`${originalName.toUpperCase()} VENCIDO · +${amount} EXP${gain.levelUp ? ' · ¡NIVEL!' : ''}`);
        if (Math.random() < .25)
            this.save.inventory.seals++;
        this.economy.echoes = Math.min(999999, this.economy.echoes + 4 + Math.floor(b.enemy.level * .9));
    } if (gain.evolved)
        this.beginEvolution(beforeSpecies, ally.speciesId); this.saveNow(false); this.updateUI(); }
    beginEvolution(from, to) {
        this.evolution = { from, to, startedAt: this.seconds, duration: this.reducedMotion ? .65 : 3.2 };
        this.resetJoystick();
        this.toggleDrawer(false);
        byId('viewport').classList.add('in-evolution');
        byId('toast').classList.add('hidden');
        const banner = byId('evolutionBanner');
        banner.innerHTML = `<small>REESCRITURA DEL NOMBRE</small><strong>${htmlEscape(SPECIES[from].name)} <span>→</span> ${htmlEscape(SPECIES[to].name)}</strong>`;
        banner.classList.remove('hidden');
        this.sound.evolve();
        this.sound.setScene('sanctuary');
    }
    capture() { const b = this.battle; if (!b || b.busy || b.type !== 'wild' || this.save.inventory.seals < 1)
        return; this.save.inventory.seals--; b.busy = true; this.setCombatCue('capture', 'ally', SPECIES[b.enemy.speciesId].element); const chance = Math.min(.94, .26 + (1 - b.enemy.hp / maxHp(b.enemy)) * .65 + Math.max(0, this.getAlly().level - b.enemy.level) * .02); this.sound.select(); b.log = 'El sello cruza la bruma...'; this.refreshBattle(); window.setTimeout(() => { if (!this.battle)
        return; if (Math.random() < chance) {
        const captured = b.enemy;
        let stored = false;
        if (this.save.team.length < 6)
            this.save.team.push(captured);
        else {
            this.save.storage.push(captured);
            stored = true;
        }
        this.finishBattle();
        if (b.encounterId)
            this.addFlag('roamer-' + b.encounterId);
        this.sound.pick();
        if (this.save.dungeon?.active && this.save.dungeon.pending !== null)
            this.finishDungeonEnemy();
        this.toast(`VÍNCULO ESTABLECIDO: ${SPECIES[captured.speciesId].name.toUpperCase()}${stored ? ' (RESERVA)' : ''}`);
        this.addFlag('first-capture');
        this.saveNow(false);
        this.updateUI();
    }
    else {
        b.log = '¡EL SELLO SE ROMPE! LA CRIATURA RESISTE.';
        this.enemyTurn();
    } }, 750); }
    tonic() { const b = this.battle, ally = this.getAlly(); if (!b || !ally || b.busy || this.save.inventory.tonics < 1)
        return; this.save.inventory.tonics--; ally.hp = Math.min(maxHp(ally), ally.hp + 28); this.setStatuses(ally, this.statuses(ally).filter(s => s.kind !== 'scorch')); b.busy = true; this.setCombatCue('heal', 'ally', SPECIES[ally.speciesId].element); b.log = `${SPECIES[ally.speciesId].name} recupera 28 puntos de salud y limpia el ARDOR.`; this.sound.pick(); this.refreshBattle(); window.setTimeout(() => this.enemyTurn(), 550); }
    switchCreature() {
        const b = this.battle;
        if (!b || b.busy)
            return;
        if (!this.save.team.some((c, i) => c.hp > 0 && i !== b.ally)) {
            this.toast('NO TIENES OTRA CRIATURA DISPONIBLE');
            return;
        }
        b.selecting = true;
        this.refreshBattle();
    }
    switchTo(index) {
        const b = this.battle;
        if (!b || b.busy || !b.selecting || index === b.ally)
            return;
        const selected = this.save.team[index];
        if (!selected || selected.hp <= 0)
            return;
        b.ally = index;
        b.selecting = false;
        b.guarding = false;
        b.busy = true;
        b.log = `¡${SPECIES[selected.speciesId].name} entra en combate!`;
        this.setCombatCue('switch', 'ally', SPECIES[selected.speciesId].element);
        this.sound.select();
        this.refreshBattle();
        window.setTimeout(() => this.enemyTurn(), 700);
    }
    escape() { if (!this.battle || this.battle.busy || this.battle.type === 'boss')
        return; if (Math.random() < .86) {
        this.finishBattle();
        this.toast('ESCAPAS ENTRE LA NIEBLA');
    }
    else {
        this.battle.busy = true;
        this.battle.log = '¡NO PUEDES ESCAPAR!';
        this.refreshBattle();
        window.setTimeout(() => this.enemyTurn(), 400);
    } }
    defeat() { if (this.save.dungeon?.active) {
        this.save.dungeon.active = false;
        this.save.dungeon.pending = null;
    } if (this.save.expedition?.pending) {
        const consolation = settleExpedition(this.save.expedition, false);
        this.addExpeditionReward(consolation);
        this.expeditionMessage = `La expedición terminó en derrota. Recuperaste ${consolation.echoes} Ecos.`;
        delete this.save.expedition;
    } this.finishBattle(); this.save.zone = 'village'; this.cameraZone = ''; this.sound.setScene('village'); this.save.x = 15; this.save.y = 14; this.lastReveal = -1; this.revealPosition(); this.save.team.forEach(c => c.hp = maxHp(c)); this.encounterCooldown = 6; this.sound.portal(); this.dialog([{ title: 'Regresas a la Lumbre', text: 'La oscuridad te ha vencido, pero tus vínculos no se han roto. Descansas y recuperas fuerzas en Velo de Arken.' }]); this.saveNow(false); this.updateUI(); }
    finishBattle() { this.sound.setScene(themeForZone(this.save.zone)); delete this.save.activeBattle; this.battle = null; this.combatCue = null; byId('battle').classList.add('hidden'); byId('viewport').classList.remove('in-battle'); this.encounterCooldown = 7; }
    interactNpc(id) {
        const e = this.economy;
        if (!e.visitedNpcs.includes(id))
            e.visitedNpcs.push(id);
        if (id === 'archivist') {
            this.addFlag('archivist');
            if (canConcludeArken(this.storyState) && this.concludeStory()) {
                this.dialog([{ title: 'EL JURAMENTO DE ARKEN', text: 'El Archivista une la Primera Palabra y el Último Signo. Las voces de los desaparecidos vuelven a llenar la plaza.' },
                    { title: 'LO QUE NO SE BORRA', text: 'Tus criaturas pronuncian los nombres que el silencio robó. Arken recupera su memoria; la primera región vuelve a tener un mañana.' },
                    { title: 'FIN DEL ARCO DE ARKEN', text: `Has cerrado la primera historia completa. Recibes ${ARKEN_FINALE_REWARD.echoes} Ecos y ${ARKEN_FINALE_REWARD.seals} Sellos. El mundo continúa abierto para nuevas aventuras.` }]);
            }
            else if (this.flag('arken-vow-restored'))
                this.dialog([{ title: 'El Archivista', text: 'La Palabra y el Signo siguen vivos gracias a tus vínculos. El juramento de Arken ya no puede borrarse.' }]);
            else if (this.save.defeatedBoss && !this.save.dungeon?.finished)
                this.dialog([{ title: 'El Archivista', text: 'La Primera Palabra no basta para proteger Arken. Entra en la Cripta de los Ecos desde el menú, recupera el Último Signo y regresa a contarme lo que has visto.' }]);
            else
                this.dialog([{ title: 'El Archivista', text: 'Hubo un tiempo en que el cielo estaba lleno de palabras. Ahora llueven sus cenizas.' }, { title: 'El Archivista', text: 'Busca las Lumbres, hazte acompañar de criaturas y desciende al Santuario sin Voz.' }]);
        }
        else if (id === 'merchant') {
            this.dialog([{ title: 'Mara, la Buhonera', text: 'Los Ecos aún valen algo en este mundo roto. Vuelve a hablarme para ver mis mercancías.' }]);
            this.addFlag('merchant-met');
        }
        else if (id === 'scout') {
            if (this.flag('pilgrim-met')) {
                this.addFlag('pilgrim-rescued');
                this.dialog([{ title: 'Iria, la Vigía', text: '¿Has encontrado al peregrino? El consejo de Arken te lo agradece. Has ganado Ecos para el viaje.' }]);
            }
            else
                this.dialog([{ title: 'Iria, la Vigía', text: 'Un peregrino no ha vuelto del bosque. Lo vieron cerca del viejo sendero al este. ¿Podrías encontrarlo?' }]);
        }
        else if (id === 'pilgrim') {
            this.addFlag('pilgrim-met');
            this.dialog([{ title: 'El Peregrino', text: 'El bosque me robó el camino, pero sigo recordando mi nombre. Di a Iria que sigo vivo. Gracias, Portador.' }]);
        }
        else
            this.dialog([{ title: 'Custodia del Umbral', text: this.save.defeatedBoss ? 'Has devuelto una sílaba a la realidad. Quedan otras por recuperar.' : 'La bestia del silencio no puede ser atrapada. Observa su ritmo y combate con tus vínculos más fuertes.' }]);
        if (id === 'merchant' && this.flag('merchant-met') && e.visitedNpcs.includes('merchant')) {
            // First conversation introduces the merchant; subsequent interactions open her shop.
            const encounters = this.save.flags.filter(x => x === 'merchant-introduced').length;
            if (encounters)
                this.openShopAfterDialog = true;
            else
                this.addFlag('merchant-introduced');
        }
        this.updateUI();
    }
    openRune(where, index = 0) {
        if (this.battle || !this.started)
            return;
        const puzzle = RUNE_PUZZLES[where];
        if (!puzzle)
            return;
        const solved = this.flag('rune-' + where);
        this.showModal(puzzle.name.toUpperCase(), `<div class="modal-content-block">${htmlEscape(puzzle.lore)}</div>` +
            `<div class="modal-content-block">${solved ? 'INSCRIPCIÓN RESTAURADA' : `ELIGE LOS TRES SIGNOS EN ORDEN · ${index}/3`}</div>` +
            `<div class="modal-content-block">PISTA: ${htmlEscape(puzzle.hint)}</div>` +
            (solved ? '<div class="modal-content-block">La piedra conserva su nombre. Ya has recibido su recompensa.</div>' :
                `<div class="rune-choices">${RUNE_SYMBOLS.map(g => `<button class="rune-choice" data-rune="${g}" aria-label="Símbolo ${g}">${g}</button>`).join('')}</div>`));
        if (solved)
            return;
        for (const button of byId('modalContent').querySelectorAll('[data-rune]'))
            button.onclick = () => {
                const result = submitRune(puzzle, index, button.dataset.rune || '');
                this.sound.select();
                if (result.completed) {
                    const reward = claimRune(this.save.flags, this.economy.echoes, where);
                    this.economy.echoes = reward.echoes;
                    this.addFlag(reward.flag);
                    this.sound.pick();
                    this.saveNow(false);
                    this.openRune(where, 0);
                    this.toast(`INSCRIPCIÓN REPARADA · +${reward.earned} ECOS`);
                }
                else {
                    this.openRune(where, result.index);
                    if (!result.correct)
                        this.toast('LA PIEDRA RECHAZA LA SECUENCIA');
                }
            };
    }
    openShopAfterDialog = false;
    openShop() {
        if (!this.started || this.battle || this.dialogOpen)
            return;
        const e = this.economy;
        this.showModal('MARA · MERCADO DE ECOS', `<div class="shop-balance">✦ ${e.echoes} ECOS DISPONIBLES</div>` + Object.entries(SHOP).map(([id, item]) => `<div class="modal-option"><div><strong>${htmlEscape(item.name)}</strong><small>${htmlEscape(item.description)}</small><small>EN MOCHILA · ${this.save.inventory[id]}</small></div><button data-buy="${id}" ${e.echoes < item.cost ? 'disabled' : ''}>${item.cost} ECOS</button></div>`).join('') + `<div class="modal-content-block">Los Ecos se consiguen venciendo criaturas y completando misiones.</div>`);
        for (const btn of byId('modalContent').querySelectorAll('[data-buy]'))
            btn.onclick = () => { this.purchaseItem(btn.dataset.buy); };
    }
    purchaseItem(id) { if (!buy(this.economy, this.save.inventory, id)) {
        this.toast('ECOS INSUFICIENTES');
        return false;
    } this.sound.pick(); this.saveNow(false); this.updateUI(); this.openShop(); return true; }
    addExpeditionReward(reward) {
        this.economy.echoes = Math.min(999999, this.economy.echoes + reward.echoes);
        this.save.inventory.seals = Math.min(9999, this.save.inventory.seals + reward.seals);
        this.save.inventory.tonics = Math.min(9999, this.save.inventory.tonics + reward.tonics);
    }
    beginExpedition(biome) {
        if (this.save.zone !== 'village' || !this.started || this.save.expedition) {
            this.toast('REGRESA A ARKEN PARA COMENZAR');
            return;
        }
        this.save.expedition = createExpedition(freshWorldSeed(), biome);
        this.expeditionMessage = '';
        this.sound.portal();
        this.saveNow(false);
        this.openExpedition();
    }
    expeditionBattleWon() {
        const run = this.save.expedition;
        if (!run?.pending)
            return;
        this.save.expedition = completeBattle(run);
        if (expeditionComplete(this.save.expedition))
            this.completeExpeditionRun();
        else
            this.expeditionMessage = 'Victoria en la grieta. Elige el siguiente sendero.';
        this.saveNow(false);
    }
    completeExpeditionRun() {
        const run = this.save.expedition;
        if (!run || !expeditionComplete(run))
            return;
        const reward = settleExpedition(run, true);
        this.addExpeditionReward(reward);
        this.expeditionMessage = `Grieta sellada: +${reward.echoes} Ecos, +${reward.seals} Sellos, +${reward.tonics} Tónicos.`;
        this.addFlag('expedition-' + run.biome);
        delete this.save.expedition;
        this.sound.pick();
        this.saveNow(false);
    }
    abandonExpedition() {
        const run = this.save.expedition;
        if (!run || run.pending || !window.confirm('Abandonar la expedición implica perder las recompensas sin asegurar. ¿Abandonar?'))
            return;
        const reward = settleExpedition(run, false);
        this.addExpeditionReward(reward);
        this.expeditionMessage = `Grieta abandonada. Recuperas ${reward.echoes} Ecos.`;
        delete this.save.expedition;
        this.saveNow(false);
        this.openExpedition();
        this.updateUI();
    }
    enterExpeditionRoom(id) {
        const run = this.save.expedition;
        if (!run)
            return;
        try {
            const { next, room, requiresBattle } = chooseRoom(run, id);
            this.save.expedition = next;
            this.saveNow(false);
            if (requiresBattle) {
                this.hideModal();
                this.startBattle(room.speciesId, room.level, 'expedition');
                return;
            }
            if (room.kind === 'camp')
                for (const creature of this.save.team)
                    creature.hp = Math.min(maxHp(creature), creature.hp + Math.max(10, Math.ceil(maxHp(creature) * .30)));
            this.sound.pick();
            this.expeditionMessage = `${room.name}: ${room.kind === 'camp' ? 'El equipo descansa junto a la llama.' : 'Recompensa asegurada en la bolsa de expedición.'}`;
            if (expeditionComplete(next))
                this.completeExpeditionRun();
            this.saveNow(false);
            this.openExpedition();
            this.updateUI();
        }
        catch {
            this.toast('LA SALA YA NO ESTÁ DISPONIBLE');
        }
    }
    openExpedition() {
        if (!this.started || this.battle || this.evolution || this.dialogOpen)
            return;
        const run = this.save.expedition;
        if (!run) {
            this.showModal('LAS GRIETAS · EXPEDICIONES', `<div class="expedition-intro"><span class="eyebrow">RUTAS PROCEDURALES · PERSISTENCIA POR PARTIDA</span><p>Explora cinco etapas de riesgo y recompensa. Cada expedición tiene un trazado fijo, generado con una semilla propia. Las recompensas se ingresan al regresar. En una derrota solo conservas una cuarta parte de los Ecos acumulados.</p>${this.expeditionMessage ? `<div class="expedition-message">${htmlEscape(this.expeditionMessage)}</div>` : ''}</div><div class="expedition-grid">${Object.entries(BIOMES).map(([key, biome]) => `<button class="expedition-card" style="--biome:${biome.accent}" data-new-expedition="${key}" ${this.save.zone !== 'village' ? 'disabled' : ''}><span>✧</span><strong>${htmlEscape(biome.name)}</strong><small>${htmlEscape(biome.subtitle)}</small><em>${this.flag('expedition-' + key) ? '✓ GRIETA DOMINADA · REPETIBLE' : '5 ETAPAS · RECOMPENSAS ÚNICAS'}</em></button>`).join('')}</div><div class="modal-content-block">${this.save.zone === 'village' ? 'La expedición empieza al elegir un destino.' : 'Regresa a Velo de Arken para comenzar una nueva expedición.'}</div>`);
            for (const btn of byId('modalContent').querySelectorAll('[data-new-expedition]'))
                btn.onclick = () => this.beginExpedition(btn.dataset.newExpedition);
            return;
        }
        if (run.pending) {
            const room = roomById(run, run.pending);
            if (room) {
                this.hideModal();
                this.startBattle(room.speciesId, room.level, 'expedition');
            }
            return;
        }
        const biome = BIOMES[run.biome];
        const cards = availableRooms(run);
        const icon = { skirmish: '⚔', elite: '♜', cache: '▣', camp: '♨', omen: '✧', boss: '◆' };
        this.showModal(`${biome.name.toUpperCase()} · ${run.floor + 1}/5`, `<div class="expedition-intro"><span class="eyebrow">GIRO DE LA REALIDAD · SEMILLA ${run.seed}</span><p>${htmlEscape(biome.subtitle)}. Las rutas que no elijas desaparecerán. Esta distribución permanecerá idéntica al cargar la partida.</p><div class="expedition-track">${Array.from({ length: 5 }, (_, i) => `<span class="${i < run.floor ? 'done' : i === run.floor ? 'active' : ''}">${i + 1}</span>`).join('')}</div><div class="expedition-treasure">BOLSA TEMPORAL · ✦ ${run.treasure.echoes} ECOS · ◇ ${run.treasure.seals} SELLOS · ✚ ${run.treasure.tonics} TÓNICOS</div>${this.expeditionMessage ? `<div class="expedition-message">${htmlEscape(this.expeditionMessage)}</div>` : ''}</div><div class="expedition-grid">${cards.map(room => `<button class="expedition-card ${room.kind}" data-expedition-room="${room.id}" style="--biome:${biome.accent}"><span>${icon[room.kind]}</span><strong>${htmlEscape(room.name)}</strong><small>${htmlEscape(room.description)}</small><em>${room.kind === 'camp' ? 'SANAR EQUIPO' : `✦ ${room.reward.echoes} · ◇ ${room.reward.seals} · ✚ ${room.reward.tonics}`}</em></button>`).join('')}</div><div class="modal-content-block"><button id="abandonExpedition" class="expedition-abandon">ABANDONAR EXPEDICIÓN</button></div>`);
        for (const btn of byId('modalContent').querySelectorAll('[data-expedition-room]'))
            btn.onclick = () => this.enterExpeditionRoom(btn.dataset.expeditionRoom);
        const exit = byId('abandonExpedition');
        exit.onclick = () => this.abandonExpedition();
    }
    /** Spatial roguelite prototype: a real maze, not a route-selection overlay. */
    openDuel() {
        if (!this.started || this.battle || this.dialogOpen || this.save.dungeon?.active)
            return;
        const region = this.save.zone;
        const group = region === 'village' ? ['cindrel', 'briarling', 'mireling'] : region === 'forest' ? ['cindrel', 'thorne', 'mireling'] : ['runeowl', 'wispawn', 'gravemoth'];
        this.showModal('COMBATE DIRECTO', `<div class="modal-content-block">Desafía a una criatura salvaje. Puedes combatir, capturarla o huir. Los retos directos no alteran los guardianes ni la historia.</div>${group.map((speciesId, i) => `<div class="modal-option"><div><strong>${htmlEscape(SPECIES[speciesId].name)}</strong><small>NIVEL ${region === 'village' ? 3 + i : region === 'forest' ? 5 + i : 8 + i} · ${htmlEscape(SPECIES[speciesId].element)}</small></div><button data-duel="${speciesId}">COMBATIR</button></div>`).join('')}`);
        for (const button of byId('modalContent').querySelectorAll('[data-duel]'))
            button.onclick = () => { const id = button.dataset.duel; const level = (region === 'village' ? 3 : region === 'forest' ? 5 : 8) + group.indexOf(id); this.hideModal(); this.startBattle(id, level, 'wild'); };
    }
    openDungeonMenu() {
        if (!this.started || this.battle || this.evolution || this.dialogOpen)
            return;
        const d = this.save.dungeon;
        if (d?.active) {
            this.showModal('CRIPTA DE LOS ECOS', `<div class="modal-content-block">Las piedras recuerdan tu posición. Descubre las salas, libera las dos sombras y descifra la inscripción para abrir la última puerta.</div><div class="modal-option"><button id="leaveDungeon">RETIRARSE AL PUEBLO · GUARDAR PROGRESO</button></div>`);
            byId('leaveDungeon').onclick = () => { if (this.save.dungeon)
                this.save.dungeon.active = false; this.hideModal(); this.sound.setScene('village'); this.updateUI(); this.saveNow(false); this.toast('REGRESAS AL PUEBLO · CRIPTA CONSERVADA'); };
            return;
        }
        if (this.save.zone !== 'village') {
            this.toast('REGRESA A ARKEN PARA ENTRAR EN LA CRIPTA');
            this.toggleDrawer(false);
            return;
        }
        const intro = d?.finished ? 'Ya descubriste el Último Signo. Puedes volver a explorar la cripta o iniciar otra con un nuevo trazado.' : d ? 'Tu cripta anterior sigue exactamente como la dejaste.' : 'Ocho salas conectadas, dos enemigos, tesoros, una inscripción y una puerta sellada. El recorrido es distinto en cada partida y permanece fijo al guardar.';
        this.showModal('CRIPTA DE LOS ECOS', `<div class="modal-content-block">${intro}</div><div class="modal-option"><button id="enterDungeon">${d ? 'CONTINUAR CRIPTA' : 'GENERAR Y ENTRAR'}</button></div>${d?.finished ? '<div class="modal-option"><button id="regenerateDungeon">NUEVA CRIPTA · REINICIAR RECORRIDO</button></div>' : ''}`);
        byId('enterDungeon').onclick = () => this.enterDungeon(false);
        if (d?.finished)
            byId('regenerateDungeon').onclick = () => this.enterDungeon(true);
    }
    enterDungeon(newRun) {
        if (this.save.zone !== 'village' || this.battle)
            return;
        if (!this.save.dungeon || newRun)
            this.save.dungeon = generateDungeon(freshWorldSeed());
        this.save.dungeon.active = true;
        this.hideModal();
        this.toggleDrawer(false);
        this.sound.setScene('sanctuary');
        this.sound.portal();
        this.lastDungeonChamber = -1;
        this.updateUI();
        this.saveNow(false);
        this.toast('ENTRAS EN LA CRIPTA · EL PLANO PERSISTE');
    }
    dungeonInteract() {
        const d = this.save.dungeon;
        if (!d || !d.active)
            return;
        const e = nearbyDungeonEvent(d);
        if (!e) {
            this.toast('NO HAY INSCRIPCIONES CERCA');
            return;
        }
        if (e.kind === 'entrance') {
            d.active = false;
            this.sound.setScene('village');
            this.sound.portal();
            this.updateUI();
            this.saveNow(false);
            this.toast('REGRESAS A ARKEN');
            return;
        }
        if (e.kind === 'exit') {
            if (!dungeonGateOpen(d)) {
                this.dialog([{ title: 'PUERTA DEL ÚLTIMO SIGNO', text: 'Dos vigilantes y una inscripción mantienen el sello cerrado. Explora las habitaciones y recupera sus nombres.' }]);
                return;
            }
            if (!d.finished) {
                d.finished = true;
                this.economy.echoes = Math.min(999999, this.economy.echoes + 150);
                this.save.inventory.seals = Math.min(9999, this.save.inventory.seals + 3);
                this.addFlag('dungeon-first-clear');
                this.dialog([{ title: 'EL SIGNO RECUPERADO', text: 'La cripta cede. Recuperas 150 Ecos y 3 Sellos. Sal por el umbral y lleva el Último Signo al Archivista de Arken.' }]);
            }
            else
                this.toast('EL ÚLTIMO SIGNO YA ES TUYO');
            this.saveNow(false);
            return;
        }
        if (e.kind === 'enemy') {
            if (d.pending !== null && d.pending !== e.id)
                return;
            d.pending = e.id;
            this.saveNow(false);
            this.startBattle(e.species || 'gravemoth', e.id === 2 ? 7 : 9, 'wild');
            return;
        }
        if (e.kind === 'cache') {
            this.save.dungeon = completeDungeonEvent(d, e.id);
            this.economy.echoes = Math.min(999999, this.economy.echoes + 40);
            this.save.inventory.tonics = Math.min(9999, this.save.inventory.tonics + 1);
            this.sound.pick();
            this.dialog([{ title: 'ARCA DEL SILENCIO', text: 'Encuentras 40 Ecos y un Tónico. El arca queda vacía para siempre en esta cripta.' }]);
        }
        else if (e.kind === 'altar') {
            this.save.dungeon = completeDungeonEvent(d, e.id);
            this.save.team.forEach(c => c.hp = maxHp(c));
            this.sound.pick();
            this.toast('LA LUMBRE RESTAURA TODOS TUS VÍNCULOS');
        }
        else if (e.kind === 'rune') {
            this.save.dungeon = completeDungeonEvent(d, e.id);
            this.addFlag('dungeon-rune');
            this.sound.pick();
            this.dialog([{ title: 'INSCRIPCIÓN PARTIDA', text: '«Las puertas no se abren con fuerza. Solo quien recuerda los dos nombres borrados puede pronunciarlas».' }]);
        }
        this.saveNow(false);
        this.updateUI();
    }
    finishDungeonEnemy() {
        const d = this.save.dungeon;
        if (!d?.active || d.pending === null)
            return;
        this.save.dungeon = completeDungeonEvent(d, d.pending);
        this.economy.echoes = Math.min(999999, this.economy.echoes + 25);
        this.toast('CENTINELA VENCIDO · +25 ECOS');
        this.saveNow(false);
        this.updateUI();
    }
    exportGame() {
        if (!this.started) {
            this.toast('NO HAY PARTIDA PARA EXPORTAR');
            return;
        }
        const blob = new Blob([JSON.stringify(this.save, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ascii-azur-partida.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);
        this.toast('COPIA DE LA PARTIDA PREPARADA');
    }
    openQuests() {
        if (!this.started)
            return;
        const step = arkenStoryIndex(this.storyState), beat = this.storyBeat();
        const mainQuest = `<div class="modal-content-block"><strong>ARCO PRINCIPAL · ${Math.min(step, 6)}/6 ETAPAS</strong><p>${htmlEscape(beat.objective)}</p>${htmlEscape(beat.hint)}</div>` +
            ARKEN_STORY.slice(0, 6).map((chapter, i) => `<div class="modal-option"><div><strong>${htmlEscape(chapter.title)}</strong><small>${htmlEscape(chapter.objective)}</small></div><span class="quest-state ${i < step ? 'done' : ''}">${i < step ? '✓ HECHA' : i === step ? 'ACTUAL' : 'PENDIENTE'}</span></div>`).join('');
        this.showModal('DIARIO · MISIONES', mainQuest + `<div class="shop-balance">${this.economy.echoes} ECOS · ${this.economy.completed.length}/${QUESTS.length} ENCARGOS SECUNDARIOS</div>` + QUESTS.map(q => `<div class="modal-option"><div><strong>${htmlEscape(q.name)}</strong><small>${htmlEscape(q.description)}</small><small>RECOMPENSA · ${q.reward} ECOS</small></div><span class="quest-state ${this.economy.completed.includes(q.id) ? 'done' : ''}">${this.economy.completed.includes(q.id) ? '✓ HECHA' : 'PENDIENTE'}</span></div>`).join(''));
    }
    openCodex() { if (!this.started)
        return; const known = new Set([...this.save.team, ...this.save.storage].map(c => c.speciesId)); this.showModal('CÓDICE · VÍNCULOS', `<div class="modal-content-block">${known.size} / ${Object.keys(SPECIES).length} especies vinculadas.</div>` + Object.values(SPECIES).map(sp => `<div class="modal-option"><div><strong style="color:${sp.color}">${known.has(sp.id) ? htmlEscape(sp.name) : '??????'}</strong><small>${known.has(sp.id) ? htmlEscape(sp.title + ' · ' + sp.element + ' · ' + sp.desc) : 'Esta criatura aún no ha compartido su nombre.'}</small></div></div>`).join('')); }
    revealPosition() { if (!this.save.worldSeed)
        return; const x = Math.floor(this.save.x), y = Math.floor(this.save.y); const mark = x + y * WORLD_W + (['village', 'forest', 'sanctuary'].indexOf(this.save.zone) * WORLD_W * WORLD_H); if (this.lastReveal === mark)
        return; this.lastReveal = mark; this.save.discovered = reveal(this.save.discovered, this.save.zone, x, y, 4.8); }
    openDungeonAtlas() {
        const d = this.save.dungeon;
        if (!d?.active)
            return;
        const cells = [];
        const step = 9;
        for (let y = 0; y < 29; y++)
            for (let x = 0; x < 43; x++) {
                const index = y * 43 + x;
                if (d.visited[index] !== '1')
                    continue;
                const wall = d.tiles[index] === '#';
                cells.push(`<rect x="${x * step}" y="${y * step}" width="${step}" height="${step}" fill="${wall ? '#5a7180' : '#2f414e'}" stroke="#101a25" stroke-width=".8"/>`);
            }
        const pins = d.events.filter(e => d.visited[e.y * 43 + e.x] === '1')
            .map(e => `<circle cx="${(e.x + .5) * step}" cy="${(e.y + .5) * step}" r="${e.kind === 'exit' ? 4.2 : 3.1}" fill="${d.cleared.includes(e.id) ? '#52656b' : e.kind === 'enemy' ? '#e9919c' : e.kind === 'exit' ? '#e1bd88' : '#a6dacd'}"/>`).join('');
        const cursor = `<circle cx="${(d.x + .5) * step}" cy="${(d.y + .5) * step}" r="5" fill="#fff4d2" stroke="#142c35" stroke-width="1.5"/>`;
        this.showModal('MAPA · CRIPTA DE LOS ECOS', `<div class="modal-content-block">${d.cleared.length}/6 hallazgos resueltos · ${dungeonGateOpen(d) ? 'La puerta está abierta.' : 'Encuentra los dos vigilantes y la inscripción.'}</div><svg class="azur-dungeon-map" viewBox="0 0 387 261" role="img" aria-label="Mapa de la cripta explorada, con la posición del jugador"><rect width="387" height="261" fill="#080e16"/>${cells.join('')}${pins}${cursor}</svg><div class="azur-map-legend"><span>● PORTADOR</span><span>◆ HALLAZGOS</span><span>░ ZONAS DESCONOCIDAS</span></div><div class="modal-content-block">SEMILLA: ${d.seed}. El mapa y los objetos conservan su posición mientras sigas jugando esta partida.</div>`);
    }
    openMap() {
        if (!this.started)
            return;
        if (this.save.dungeon?.active) {
            this.openDungeonAtlas();
            return;
        }
        const zone = this.save.zone;
        const rects = [];
        const colors = { unknown: '#0d1820', path: '#98806a', ground: '#2d4145', grass: '#5b7763', tree: '#203b33', stone: '#59626c', water: '#235461', wall: '#161f30' };
        for (let y = 0; y < WORLD_H; y++)
            for (let x = 0; x < WORLD_W; x++) {
                const tile = isDiscovered(this.save.discovered, zone, x, y, !this.save.worldSeed) ? terrain(zone, x, y) : 'unknown';
                rects.push(`<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="${colors[tile] || '#17212a'}"/>`);
            }
        const landmarkIcons = { npc: '◆', altar: '✦', portal: '⇨', chest: '▣', rune: '✧', guardian: '♜' };
        const pins = ZONES[zone].landmarks.filter(l => isDiscovered(this.save.discovered, zone, l.x, l.y, !this.save.worldSeed)).map(l => `<text x="${(l.x + .5) * 8}" y="${(l.y + .5) * 8 + 3}" text-anchor="middle" font-size="13" font-weight="bold" fill="#f2d9ac" stroke="#101820" stroke-width=".8" paint-order="stroke" >${landmarkIcons[l.kind] || '•'}</text>`).join('');
        const avatar = `<circle cx="${(this.save.x + .5) * 8}" cy="${(this.save.y + .5) * 8}" r="5" fill="#f8f0d2" stroke="#233d48" stroke-width="2"/>`;
        const seed = String(this.save.worldSeed ?? 0);
        this.showModal('ATLAS · ' + ZONES[zone].name.toUpperCase(), `<div class="azur-map-intro">Terreno descubierto: ${this.save.worldSeed ? discoveredPercent(this.save.discovered, zone) : 100} %. Los senderos aparecen conforme exploras. Ámbar = transitable; bosque oscuro = barrera.</div><svg class="azur-cartography" viewBox="0 0 ${WORLD_W * 8} ${WORLD_H * 8}" role="img" aria-label="Mapa de caminos, obstáculos, lugares y posición del jugador">${rects.join('')}${pins}${avatar}</svg><div class="azur-map-legend"><span>● TU POSICIÓN</span><span>━ SENDERO</span><span>◆ PERSONAJES</span><span>✦ PUNTOS DE INTERÉS</span></div><div class="azur-map-seed">SEMILLA DEL MUNDO: <strong>${seed}</strong><br><small>El mapa permanece idéntico al continuar o importar esta partida.</small></div>`);
    }
    openTeam() {
        if (!this.started || this.evolution || this.battle || this.dialogOpen || !byId('starterScreen').classList.contains('hidden'))
            return;
        const display = (c) => { const sp = SPECIES[c.speciesId]; return `<strong style="color:${sp.color}">${htmlEscape(sp.name)}</strong> · NV ${c.level}<small>${htmlEscape(sp.element)} · HP ${c.hp}/${maxHp(c)} · ${htmlEscape(sp.title)}</small>`; };
        this.showModal('VÍNCULOS Y RESERVA', `<div class="modal-content-block">Selecciona un líder, devuelve criaturas a la reserva o intercámbialas. ${this.save.team.length}/6 en equipo · ${this.save.storage.length} en reserva.</div>` +
            this.save.team.map((c, i) => `<div class="modal-option"><div>${display(c)}</div><div class="roster-buttons">${`<button data-skills="${htmlEscape(c.uid)}">HABILIDADES</button>`}${i ? `<button data-lead="${htmlEscape(c.uid)}">LÍDER</button>` : '<span class="eyebrow">LÍDER</span>'}${this.save.team.length > 1 ? `<button data-deposit="${htmlEscape(c.uid)}">RESERVAR</button>` : ''}</div></div>`).join('') +
            `<div class="modal-content-block">RESERVA · ${this.save.storage.length} VÍNCULOS</div>` +
            (this.save.storage.length ? this.save.storage.map(c => `<div class="modal-option"><div>${display(c)}</div><button data-withdraw="${htmlEscape(c.uid)}">${this.save.team.length < 6 ? 'INCORPORAR' : 'INTERCAMBIAR'}</button></div>`).join('') : '<div class="modal-content-block">No hay criaturas en reserva.</div>'));
        const content = byId('modalContent');
        for (const button of content.querySelectorAll('[data-skills]'))
            button.onclick = () => this.openSkills(button.dataset.skills);
        for (const button of content.querySelectorAll('[data-lead]'))
            button.onclick = () => {
                const at = this.save.team.findIndex(c => c.uid === button.dataset.lead);
                if (at <= 0)
                    return;
                const [c] = this.save.team.splice(at, 1);
                if (c)
                    this.save.team.unshift(c);
                this.saveNow(false);
                this.hideModal();
                this.openTeam();
                this.updateUI();
            };
        for (const button of content.querySelectorAll('[data-deposit]'))
            button.onclick = () => {
                try {
                    const result = reserveCreature(this.save, button.dataset.deposit);
                    this.save.team = result.team;
                    this.save.storage = result.storage;
                    this.sound.select();
                    this.saveNow(false);
                    this.hideModal();
                    this.openTeam();
                    this.updateUI();
                }
                catch {
                    this.toast('NO SE PUEDE RESERVAR');
                }
            };
        for (const button of content.querySelectorAll('[data-withdraw]'))
            button.onclick = () => {
                const uid = button.dataset.withdraw;
                if (this.save.team.length >= 6) {
                    this.openRosterSwap(uid);
                    return;
                }
                try {
                    const result = transferStoredCreature(this.save, uid);
                    this.save.team = result.team;
                    this.save.storage = result.storage;
                    this.sound.pick();
                    this.saveNow(false);
                    this.hideModal();
                    this.openTeam();
                    this.updateUI();
                }
                catch {
                    this.toast('NO SE PUEDE INCORPORAR');
                }
            };
    }
    openSkills(uid) {
        const creature = this.save.team.find(c => c.uid === uid);
        if (!creature)
            return;
        const sp = SPECIES[creature.speciesId];
        const unlocked = unlockedMoves(creature);
        this.showModal(`HABILIDADES · ${sp.name.toUpperCase()}`, `<div class="modal-content-block">NV ${creature.level} · ${sp.element} · Elige cuatro técnicas como máximo. Cambiar tu repertorio fuera de combate no consume Ecos.</div>` +
            creature.moves.map((id, index) => `<div class="modal-option"><div><strong>${htmlEscape(MOVES[id].name)}</strong><small>${htmlEscape(MOVES[id].description)}</small></div><button data-skill-slot="${index}">CAMBIAR</button></div>`).join('') +
            `<div class="modal-content-block">Técnicas conocidas: ${unlocked.length}. Nuevas habilidades se desbloquean al ganar niveles.</div><div class="modal-option"><button id="skillBack">← EQUIPO</button></div>`);
        for (const button of byId('modalContent').querySelectorAll('[data-skill-slot]'))
            button.onclick = () => this.openSkillChoices(uid, Number(button.dataset.skillSlot));
        byId('skillBack').onclick = () => { this.hideModal(); this.openTeam(); };
    }
    openSkillChoices(uid, index) {
        const creature = this.save.team.find(c => c.uid === uid);
        if (!creature || !Number.isInteger(index) || index < 0 || index >= creature.moves.length)
            return;
        const known = unlockedMoves(creature);
        this.showModal('CAMBIAR TÉCNICA', `<div class="modal-content-block">Ranura ${index + 1} · Técnica actual: ${htmlEscape(MOVES[creature.moves[index]].name)}. Algunas técnicas curan, drenan salud o limpian alteraciones.</div>` +
            known.map(id => `<div class="modal-option"><div><strong>${htmlEscape(MOVES[id].name)}</strong><small>${htmlEscape(MOVES[id].description)} · ${MOVES[id].role || 'ATAQUE'} · PODER ${MOVES[id].power}</small></div><button data-equip-move="${id}" ${creature.moves.includes(id) && creature.moves[index] !== id ? 'disabled' : ''}>${creature.moves[index] === id ? 'EQUIPADA' : 'EQUIPAR'}</button></div>`).join('') +
            '<div class="modal-option"><button id="skillChoicesBack">← VOLVER</button></div>');
        for (const button of byId('modalContent').querySelectorAll('[data-equip-move]'))
            button.onclick = () => {
                const at = this.save.team.findIndex(c => c.uid === uid);
                if (at < 0)
                    return;
                try {
                    this.save.team[at] = equipMove(this.save.team[at], index, button.dataset.equipMove);
                    this.sound.select();
                    this.saveNow(false);
                    this.openSkills(uid);
                    this.updateUI();
                }
                catch {
                    this.toast('HABILIDAD NO DISPONIBLE');
                }
            };
        byId('skillChoicesBack').onclick = () => this.openSkills(uid);
    }
    openRosterSwap(storedUid) {
        const stored = this.save.storage.find(c => c.uid === storedUid);
        if (!stored)
            return;
        this.showModal('INTERCAMBIAR VÍNCULO', `<div class="modal-content-block">El equipo está completo. Elige quién regresará a la reserva para incorporar a ${htmlEscape(SPECIES[stored.speciesId].name)}.</div>` +
            this.save.team.map(c => `<div class="modal-option"><div><strong>${htmlEscape(SPECIES[c.speciesId].name)}</strong><small>NV ${c.level} · ${c.hp}/${maxHp(c)} HP</small></div><button data-swap-for="${htmlEscape(c.uid)}">CAMBIAR</button></div>`).join('') + '<div class="modal-option"><button id="rosterBack">← VOLVER</button></div>', true);
        for (const button of byId('modalContent').querySelectorAll('[data-swap-for]'))
            button.onclick = () => {
                try {
                    const result = transferStoredCreature(this.save, storedUid, button.dataset.swapFor);
                    this.save.team = result.team;
                    this.save.storage = result.storage;
                    this.sound.pick();
                    this.saveNow(false);
                    this.hideModal();
                    this.openTeam();
                    this.updateUI();
                }
                catch {
                    this.toast('INTERCAMBIO NO DISPONIBLE');
                }
            };
        byId('rosterBack').onclick = () => { this.hideModal(); this.openTeam(); };
    }
    openBag() { if (!this.started || this.evolution || this.battle || this.dialogOpen || !byId('starterScreen').classList.contains('hidden'))
        return; this.showModal('MOCHILA DEL PORTADOR', `<div class="modal-content-block">Objetos recuperados entre las ruinas de Azur. · ✦ ${this.economy.echoes} ECOS</div><div class="modal-option"><div><strong>◇ Sellos de Vínculo</strong> × ${this.save.inventory.seals}<small>Permiten capturar criaturas debilitadas durante el combate.</small></div></div><div class="modal-option"><div><strong>✚ Tónicos</strong> × ${this.save.inventory.tonics}<small>Recuperan 28 HP de una criatura durante el combate.</small></div></div><div class="modal-content-block">Descansa en las Lumbres para curar al equipo y recuperar un sello. Los cofres contienen suministros limitados.</div>`); }
    settings() {
        this.toggleDrawer(false);
        this.sound.unlock();
        this.showModal('AJUSTES · ARTE ASCII', `<div class="modal-content-block">Mundo de caracteres diminutos y muy densos. La densidad y el tamaño del glifo son independientes. Los ajustes se aplican en tiempo real al renderizador ${this.renderer.mode === 'gpu' ? 'WebGL2' : 'Canvas2D'} y permanecen guardados.</div>
      <div class="settings-row"><label for="densitySelect">Densidad de caracteres</label><select id="densitySelect"><option value="0.18">Microscópica · máxima</option><option value="0.24">Ultra fina</option><option value="0.32">Muy alta · recomendada</option><option value="0.42">Alta</option><option value="0.56">Equilibrada</option><option value="0.85">Rendimiento</option><option value="1.2">Muy rápida</option></select></div>
      <div class="settings-row"><label for="glyphScale">Tamaño de caracteres <output id="glyphScaleValue"></output></label><input id="glyphScale" type="range" min=".5" max="1.85" step=".05"></div>
      <div class="settings-row"><label for="glyphContrast">Contraste <output id="glyphContrastValue"></output></label><input id="glyphContrast" type="range" min=".65" max="1.8" step=".05"></div>
      <div class="settings-row"><label for="glyphEdges">Definición de contornos <output id="glyphEdgesValue"></output></label><input id="glyphEdges" type="range" min=".5" max="2.4" step=".1"></div>
      <div class="settings-row"><label for="glyphBrightness">Luminosidad <output id="glyphBrightnessValue"></output></label><input id="glyphBrightness" type="range" min="-.25" max=".25" step=".05"></div>
      <div class="settings-row"><label for="qualitySelect">Paleta cromática</label><select id="qualitySelect"><option value="1">Color atmosférico</option><option value="0.4">Color limitado</option></select></div>
      <div class="modal-content-block" id="glyphStats" aria-live="polite"></div>
      <div class="settings-row"><label for="adaptiveFps">FPS estables · ajustar detalle automáticamente</label><input id="adaptiveFps" type="checkbox"></div>
      <div class="modal-content-block" id="adaptiveFpsStats" aria-live="polite"></div>
      <div class="settings-row"><button id="resetGraphics" class="settings-reset">Restablecer gráficos</button></div>
      <div class="modal-content-block">Los tonos oscuros también se dibujan con caracteres, sin huecos artificiales. WebGL2 ofrece la trama más fina; Canvas2D limita el trabajo para mantener la partida fluida.</div>
      <div class="settings-row"><label for="musicVolume">Música</label><input id="musicVolume" type="range" min="0" max="100" step="1"></div>
      <div class="settings-row"><label for="effectsVolume">Efectos</label><input id="effectsVolume" type="range" min="0" max="100" step="1"></div>
      <div class="settings-row"><label for="motionReduced">Reducir movimiento</label><input id="motionReduced" type="checkbox"></div>
      <div class="settings-row"><label for="largeText">Texto ampliado</label><input id="largeText" type="checkbox"></div>
      <div class="settings-row"><label for="leftHanded">Joystick a la derecha</label><input id="leftHanded" type="checkbox"></div>`, true);
        const mus = byId('musicVolume'), fx = byId('effectsVolume');
        mus.value = String(Math.round(this.sound.getMusicVolume() * 100));
        fx.value = String(Math.round(this.sound.getEffectsVolume() * 100));
        mus.oninput = () => { this.sound.setMusicVolume(Number(mus.value) / 100); this.storeAudioSettings(); };
        fx.oninput = () => { this.sound.setEffectsVolume(Number(fx.value) / 100); this.storeAudioSettings(); };
        const den = byId('densitySelect'), qual = byId('qualitySelect');
        const sliders = [['glyphScale', 'glyphScale'], ['glyphContrast', 'contrast'], ['glyphEdges', 'edgeStrength'], ['glyphBrightness', 'brightness']];
        const sync = () => {
            const g = this.renderer.getGraphics();
            den.value = String(g.density);
            qual.value = String(g.quality);
            for (const [id, key] of sliders) {
                byId(id).value = String(g[key]);
                byId(id + 'Value').textContent = key === 'brightness' ? g[key].toFixed(2) : g[key].toFixed(2) + '×';
            }
            const canvas = this.renderer.canvas, rect = canvas.getBoundingClientRect(), dpr = canvas.width / (rect.width || 960);
            const base = Math.max(5, Math.min(10, (rect.width || 960) / 130)) * dpr;
            const requested = glyphCell(base, g), actual = this.renderer.mode === 'gpu' ? requested : canvasGlyphCell(base, g, canvas.width, canvas.height);
            const target = glyphCount(canvas.width, canvas.height, requested), rendered = glyphCount(canvas.width, canvas.height, { width: Math.ceil(actual.width * this.renderer.performanceScale), height: Math.ceil(actual.height * this.renderer.performanceScale) });
            byId('glyphStats').textContent = `Trama ~${Math.round(rendered).toLocaleString('es-ES')} caracteres · glifo ${(actual.width * this.renderer.performanceScale).toFixed(1)} px · ${this.renderer.mode === 'gpu' ? 'WebGL2' : 'Canvas2D'}${rendered < target ? ' · límite de rendimiento aplicado' : ''}`;
            byId('adaptiveFpsStats').textContent = this.adaptiveGlyphs.active ? `Objetivo 30 FPS · escala temporal ×${this.renderer.performanceScale.toFixed(2)} · ajustes artísticos originales conservados` : 'Máxima fidelidad manual. Activa FPS estables solo si el dispositivo pierde fluidez.';
        };
        const change = (patch) => { this.renderer.setGraphics({ ...this.renderer.getGraphics(), ...patch }); this.storeGraphicSettings(); sync(); };
        den.onchange = () => change({ density: Number(den.value) });
        qual.onchange = () => change({ quality: Number(qual.value) });
        for (const [id, key] of sliders)
            byId(id).oninput = () => change({ [key]: Number(byId(id).value) });
        byId('resetGraphics').onclick = () => change({ ...DEFAULT_GRAPHICS });
        const adaptive = byId('adaptiveFps');
        adaptive.checked = this.adaptiveGlyphs.active;
        adaptive.onchange = () => { this.setAdaptiveGraphics(adaptive.checked); sync(); };
        sync();
        const motion = byId('motionReduced');
        motion.checked = this.reducedMotion;
        motion.onchange = () => { this.reducedMotion = motion.checked; try {
            localStorage.setItem('ascii-azur-reduced-motion', String(this.reducedMotion));
        }
        catch { /* storage blocked */ } };
        const textSize = byId('largeText'), handed = byId('leftHanded');
        textSize.checked = document.documentElement.classList.contains('azur-large-text');
        handed.checked = document.documentElement.classList.contains('azur-left-handed');
        textSize.onchange = () => { document.documentElement.classList.toggle('azur-large-text', textSize.checked); this.persistAccessibility(); };
        handed.onchange = () => { document.documentElement.classList.toggle('azur-left-handed', handed.checked); this.persistAccessibility(); };
    }
    showModal(title, body, allowIntro = false) { if (this.evolution || this.battle || this.dialogOpen || (!allowIntro && !byId('titleScreen').classList.contains('hidden')) || !byId('starterScreen').classList.contains('hidden'))
        return; this.toggleDrawer(false); this.modalOpen = true; byId('modalTitle').textContent = title; byId('modalContent').innerHTML = body; byId('modal').classList.remove('hidden'); }
    hideModal() { this.modalOpen = false; byId('modal').classList.add('hidden'); }
    saveNow(notify) { if (!this.started)
        return; try {
        writeSave(localStorage, this.save);
        byId('saveStatus').textContent = 'GUARDADO LOCAL · ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        if (notify)
            this.toast('EL RECUERDO HA SIDO CONSERVADO');
    }
    catch {
        if (notify)
            this.toast('NO SE PUDO GUARDAR · ALMACENAMIENTO LLENO');
    } }
    updateStoryCompass() {
        const node = byId('storyCompass');
        if (!this.started) {
            node.classList.add('hidden');
            return;
        }
        const cue = storyGuidance(this.storyState, { zone: this.save.zone, x: this.save.x, y: this.save.y, inDungeon: !!this.save.dungeon?.active });
        if (node.textContent !== cue.text)
            node.textContent = cue.text;
        node.classList.remove('hidden');
        node.classList.toggle('is-near', cue.kind === 'interaction' || cue.kind === 'completed');
    }
    updateUI() {
        this.updateStoryCompass();
        const z = ZONES[this.save.zone];
        byId('zoneName').textContent = this.save.dungeon?.active ? 'Cripta de los Ecos' : z.name;
        byId('zoneSubtitle').textContent = this.save.dungeon?.active ? `${chamberAt(this.save.dungeon, this.save.dungeon.x, this.save.dungeon.y).name} · SELLOS ${chamberProgress(this.save.dungeon).completed}/3` : z.subtitle;
        byId('locationChip').textContent = this.save.dungeon?.active ? 'CRIPTA DE LOS ECOS' : z.name.toUpperCase();
        byId('teamCount').textContent = String(this.save.team.length);
        byId('echoCount').textContent = String(this.economy.echoes);
        byId('rosterNum').textContent = `${this.save.team.length}/6`;
        byId('roster').innerHTML = this.save.team.length ? this.save.team.map(c => { const s = SPECIES[c.speciesId]; return `<div class="creature-row"><div class="creature-icon" style="color:${s.color}">${s.shape === 0 || s.shape === 5 ? '♨' : s.shape === 2 ? '✣' : s.shape === 4 ? '✶' : s.shape === 6 ? '♜' : '◈'}</div><div><strong>${htmlEscape(s.name)} <span style="color:#839da1;font:9px monospace">LV ${c.level}</span></strong><small>${s.element.toUpperCase()} · ${c.hp}/${maxHp(c)} HP</small><div class="mini-health"><div style="width:${c.hp / maxHp(c) * 100}%"></div></div></div></div>`; }).join('') : '<div class="roster-empty">Aún no tienes vínculos.</div>';
        const step = arkenStoryIndex(this.storyState), beat = this.storyBeat();
        byId('fragBar').style.width = (Math.min(step, 6) / 6 * 100) + '%';
        byId('fragments').textContent = `${Math.min(step, 6)} / 6 HITOS DE ARKEN`;
        byId('missionChip').textContent = step === 6 ? 'ARCO DE ARKEN COMPLETADO' : beat.objective.toUpperCase();
        byId('journalText').textContent = beat.hint;
        byId('quest').innerHTML = `<div class="quest-icon">${step === 6 ? '✦' : '◇'}</div><div><small>${step === 6 ? 'HISTORIA COMPLETADA' : `MISIÓN PRINCIPAL · ${step + 1}/6`}</small><strong>${htmlEscape(beat.title)}</strong><span>${htmlEscape(beat.objective)}</span></div>`;
    }
    loop = (now) => {
        this.pollGamepad();
        if (this.last > 0)
            this.frameMetrics.add(now - this.last);
        const dt = Math.min(.055, (now - this.last) / 1000 || 0);
        this.last = now;
        this.seconds += dt;
        this.flash = Math.max(0, this.flash - dt * 1.7);
        if (this.started && !this.dialogOpen && !this.modalOpen && !this.battle && !this.evolution && !byId('gameDrawer').classList.contains('open')) {
            this.move(dt);
            this.save.playSeconds += dt;
            this.timeSinceSave += dt;
            if (this.timeSinceSave > 90) {
                this.timeSinceSave = 0;
                this.saveNow(false);
            }
        }
        if (this.evolution && this.seconds - this.evolution.startedAt >= this.evolution.duration) {
            const newSpecies = this.evolution.to;
            this.evolution = null;
            byId('viewport').classList.remove('in-evolution');
            byId('evolutionBanner').classList.add('hidden');
            this.sound.setScene(themeForZone(this.save.zone));
            this.toast(`${SPECIES[newSpecies].name.toUpperCase()} HA DESPERTADO`);
        }
        byId('viewport').classList.toggle('in-dungeon', !!this.save.dungeon?.active && !this.battle);
        const ctx = this.renderer.ctx;
        ctx.clearRect(0, 0, 960, 540);
        if (this.evolution) {
            drawEvolution(ctx, this.evolution.from, this.evolution.to, this.seconds - this.evolution.startedAt, this.reducedMotion);
        }
        else if (this.battle && this.save.team.length) {
            drawBattle(ctx, this.battle.enemy, this.getAlly(), this.seconds, this.flash, sampleCombatCue(this.combatCue, this.seconds, this.reducedMotion), this.reducedMotion, { enemy: this.statuses(this.battle.enemy).map(e => e.kind), ally: this.statuses(this.getAlly()).map(e => e.kind) });
        }
        else if (this.save.dungeon?.active) {
            const d = this.save.dungeon;
            drawDungeon(ctx, d, { x: d.x, y: d.y, facing: this.facing, walking: this.moving && !this.dialogOpen }, this.seconds, this.reducedMotion);
        }
        else {
            if (this.cameraZone !== this.save.zone) {
                this.camera = { x: this.save.x, y: this.save.y };
                this.cameraZone = this.save.zone;
            }
            const follow = 1 - Math.exp(-dt * 9);
            this.camera.x += (this.save.x - this.camera.x) * follow;
            this.camera.y += (this.save.y - this.camera.y) * follow;
            drawWorld(ctx, this.save.zone, { x: this.save.x, y: this.save.y, facing: this.facing, walking: this.moving && !this.dialogOpen }, this.seconds, this.flash, this.save.defeatedBoss, this.camera, this.reducedMotion, this.roamers());
        }
        this.renderer.present(now);
        if (now - this.lastAdaptiveUpdate > 1900) {
            this.lastAdaptiveUpdate = now;
            if (this.adaptiveGlyphs.observe(this.frameMetrics.report(), now, this.started && !document.hidden && !this.modalOpen)) {
                this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale);
                this.frameMetrics.reset();
            }
            const d = document.getElementById('adaptiveFpsStats');
            if (d && this.modalOpen)
                d.textContent = this.adaptiveGlyphs.active ? `Objetivo 30 FPS · escala temporal ×${this.renderer.performanceScale.toFixed(2)} · ajustes artísticos originales conservados` : 'Máxima fidelidad manual. Activa FPS estables solo si el dispositivo pierde fluidez.';
        }
        if (this.started && now - this.lastCompassUpdate > 180) {
            this.lastCompassUpdate = now;
            this.updateStoryCompass();
        }
        if (now - this.lastDebugUpdate > 750) {
            this.lastDebugUpdate = now;
            const perf = this.frameMetrics.report();
            byId('fps').textContent = this.debugPerformance ? `${this.renderer.mode.toUpperCase()} · ${this.renderer.fps} FPS · MAIN p95 ${perf.p95Ms.toFixed(1)}ms · ${perf.overBudget}/${perf.samples} >33ms` : `${this.renderer.mode.toUpperCase()} · ${this.renderer.fps} FPS${this.adaptiveGlyphs.active ? ' · AUTO ×' + this.renderer.performanceScale.toFixed(2) : ''}`;
        }
        requestAnimationFrame(this.loop);
    };
    move(dt) {
        if (!byId('titleScreen').classList.contains('hidden') || !byId('starterScreen').classList.contains('hidden')) {
            this.moving = false;
            return;
        }
        let dx = this.stick.x, dy = this.stick.y;
        if (Math.hypot(this.padStick.x, this.padStick.y) > .12) {
            dx = this.padStick.x;
            dy = this.padStick.y;
        }
        for (const k of this.keys) {
            if (k === 'arrowleft' || k === 'a')
                dx -= 1;
            if (k === 'arrowright' || k === 'd')
                dx += 1;
            if (k === 'arrowup' || k === 'w')
                dy -= 1;
            if (k === 'arrowdown' || k === 's')
                dy += 1;
        }
        this.moving = Math.hypot(dx, dy) > .12;
        if (this.moving) {
            const len = Math.hypot(dx, dy), speedFactor = Math.min(1, len);
            dx /= len;
            dy /= len;
            this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
            const speed = 4.35 * speedFactor;
            if (this.save.dungeon?.active) {
                const d = this.save.dungeon;
                const next = dungeonSweep(d, d.x, d.y, dx * speed * dt, dy * speed * dt);
                if (Math.hypot(next.x - d.x, next.y - d.y) > .001) {
                    d.x = next.x;
                    d.y = next.y;
                    this.save.dungeon = revealDungeon(d);
                    const chamber = chamberAt(d, next.x, next.y);
                    if (chamber.id !== this.lastDungeonChamber) {
                        this.lastDungeonChamber = chamber.id;
                        const progress = chamberProgress(d);
                        byId('zoneSubtitle').textContent = `${chamber.name} · SELLOS ${progress.completed}/${progress.required}`;
                    }
                }
            }
            else {
                const ox = this.save.x, oy = this.save.y;
                const next = sweepMove(this.save.zone, ox, oy, dx * speed * dt, dy * speed * dt);
                this.save.x = next.x;
                this.save.y = next.y;
                this.revealPosition();
                const steps = Math.hypot(this.save.x - ox, this.save.y - oy);
                this.stepCounter += steps;
                this.encounterCooldown -= steps;
                if (this.stepCounter > .95) {
                    this.stepCounter = 0;
                    if (this.encounterCooldown <= 0 && isWild(this.save.zone, Math.floor(this.save.x), Math.floor(this.save.y))) {
                        const chance = this.save.zone === 'forest' ? .22 : .12;
                        if (Math.random() < chance) {
                            const wild = this.save.zone === 'forest' ? ['velaria', 'thorne', 'wispawn', 'mireling', 'gravemoth', 'cindrel', 'runeowl', 'ashboar', 'briarling', 'rillfin'] : ['gravemoth', 'wispawn', 'mireling', 'thorne', 'runeowl', 'rillfin'];
                            const id = wild[Math.floor(Math.random() * wild.length)];
                            const level = this.save.zone === 'forest' ? 4 + Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 4);
                            this.startBattle(id, level, 'wild');
                        }
                    }
                }
            }
        }
        const encounter = !this.save.dungeon?.active ? this.nearRoamer() : undefined;
        const label = this.save.dungeon?.active ? nearbyDungeonEvent(this.save.dungeon, 1.85)?.label : encounter ? `⚔ DESAFIAR A ${SPECIES[encounter.speciesId].name.toUpperCase()}` : nearbyLandmark(this.save.zone, this.save.x, this.save.y, 2)?.label;
        const el = byId('prompt');
        if (label && !this.battle && !this.dialogOpen && !this.modalOpen) {
            el.classList.remove('hidden');
            byId('promptText').textContent = label;
        }
        else
            el.classList.add('hidden');
    }
}
new AzurGame();
