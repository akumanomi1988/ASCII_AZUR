import {OpeningCinematic} from './ui/opening-cinematic.js';
import {azurOpening,azurNarrativeBeat,azurNpcReflection,azurMarshChoiceMeaning,azurCrownChoiceMeaning,azurBondLegacy,azurAfterlightIntroduction} from './story-agency.js';
import {LEGACY_WITNESS_FLAG,legacyBranch,legacyClaimed,legacyReceipt,planLegacyClaim} from './story-legacy.js';
import {regionFieldGuide,nextKnownFieldLead,wildPacing,witnessFieldAftermath} from './world/exploration-flow.js';
import {fieldHuntBoard,fieldHuntPermission} from './creatures/field-hunts.js';
import {fieldTrail,fieldTrailRewardName,planFieldTrailClaim,trailClaimRefusal} from './world/pilgrim-trails.js';
import {battleReadout} from './combat/battle-readout.js';
import {tacticalProfile,teamGuide,loadoutUpgrade,relicUpgrade,recruitmentValue,storyThreat,creatureRole} from './creatures/tactical-identity.js';
import {regionalSurvey,regionalObjectives,regionKnown,regionUnlocked,resolveFieldTarget,planFieldTarget,planSurveyClaim,planLumbreTravel,travelRefusal,nextFieldPortal,afterlightOverview,type FieldTarget} from './world/field-journal.js';
import {individualRange,ATTRIBUTE_KEYS} from './creatures/attributes.js';
import {establishPrimary,loseCryptCompanion} from './creatures/crypt-mortality.js';
import {RELICS,RELIC_IDS,CACHE_RELICS,RELIC_COPY_LIMIT,freeRelicCopies,setCreatureRelic,buyRelic,grantRelic,type RelicId} from './creatures/equipment.js';
import {newJourneyMetrics,recordJourney,journeyReport} from './core/journey-metrics.js';
import {suggestBattleAction} from './combat/planning.js';
import {AsciiRenderer,drawWorld,drawBattle,drawEvolution} from './render.js';
import {navigateMenuKey,navigateBattleMenuKey,focusMenuFirst,isTypingTarget,menuButtons} from './ui/menu-navigation.js';
import {MenuFocusTrail} from './ui/focus-trail.js';
import {BattleHealthPresentation} from './ui/battle-health.js';
import {readGraphics,DEFAULT_GRAPHICS,glyphCell,canvasGlyphCell,glyphCount,type GraphicsProfile} from './render/graphics-profile.js';
import {visibleEncounters,nearbyEncounter,firstRoamerVictoryBonus,recoverTrailParty,BIOME_DUEL_SPECIES,activeWildBiome,drawBiomeWild,biomeDuelLevel,biomeWildLevel,VILLAGE_TRAINING_XP,VILLAGE_TRAINING_SPECIES,VILLAGE_TRAINING_REWARD_FLAG,villageTrainingBonus,villageTrainingProgress,type RoamingEncounter} from './world/encounters.js';
import {drawDungeon} from './dungeons/draw-dungeon.js';
import {chamberAt,chamberProgress} from './dungeons/room-art.js';
import {generateDungeon,nearbyDungeonEvent,completeDungeonEvent,dungeonGateOpen,revealDungeon,dungeonSweep} from './dungeons/labyrinth.js';
import {SPECIES,MOVES,createCreature,damage,maxHp,attackValue,defenseValue,speedValue,escapeChance,validateSave,type Creature,type SaveGame,type BattleCheckpoint} from './domain.js';
import {ZONES,sweepMove,isBlocked,isWild,nearbyLandmark,configureWorld,captureWorldSnapshot,freshWorldSeed,seedFromText,terrain,WORLD_W,WORLD_H,ZONE_IDS,type ZoneId,type Landmark} from './world.js';
import {SHOP,NPCS,QUESTS,buy,claimQuests,normalizeEconomy,newEconomy,type ShopItem,type NpcId} from './rpg.js';
import {Sound,themeForZone} from './audio.js';
import {combatMusicIntensity,explorationMusicIntensity} from './audio-direction.js';
import {FrameMetrics} from './core/frame-metrics.js';
import {EnduranceLab,type EndurancePhase} from './core/endurance-lab.js';
import {AdaptiveGlyphs} from './core/adaptive-glyphs.js';
import {adaptiveDefault,initialAdaptiveScale} from './core/presentation-budget.js';
import {visibleViewportHeight} from './core/mobile-viewport.js';
import {storyGuidance,guidanceToTarget,walkableRouteToTarget} from './story-navigation.js';
import {ARKEN_STORY, ARKEN_FINALE_REWARD, arkenStoryBeat, arkenStoryIndex, concludeArken, canConcludeArken, guardianPreparation, guardianRecommendedLead, sanctuaryRoutePlan, sanctuaryOathProgress, SANCTUARY_OATHS_FLAG, SANCTUARY_OATHS_REWARD, type ArkenStoryState} from './story-campaign.js';
import {marshChapterProgress,marshDecision,marshFinish,MARSH_REWARDS,type MarshChoice} from './story-marsh.js';
import {AFTERLIGHT,afterlightFlag,afterlightProgress,afterlightResolution,afterlightEpilogue,type AfterlightZone,type AfterlightChoice} from './story-afterlight.js';
import {crownProgress,crownChoose,crownFinish,crownEpilogue,CROWN_BOSS_FLAG,CROWN_END_FLAG,CROWN_CHOICE_REWARDS,type CrownEnding} from './story-finale.js';
import {campaignRoadbook} from './story-roadbook.js';
import {arrivalMoment,resolutionMoment,storyChronicle,type StoryMoment} from './story-presentation.js';
import {readSave,writeSave,SaveConflictError,saveKeyForSlot,ACTIVE_SAVE_SLOT_KEY,type SaveSlot} from './core/save-store.js';
import {transferStoredCreature,reserveCreature,grantPartyExperience} from './party.js';
import {BOND_ARCS,bondAtZone,bondProgress,bondFlag,bondChoice,bondAttackDamage,bondIncomingDamage,type BondArc,type BondPath} from './creatures/bond-quests.js';
import {createCombatCue,sampleCombatCue,guardDamage,type CombatCue,type FxKind,type CombatSide} from './actors/combat-fx.js';
import {MOVE_EFFECTS,STATUS_INFO,applyEffect,attackWithStatuses,chooseEnemyMove,chooseGuardianMove,endTurnEffects,statusLabel,skillUtility,effectiveHealing,drainHealing,recoveryCastsLeft,type StatusEffect} from './combat/tactics.js';
import {previewMove} from './combat/move-preview.js';
import {capturePreview} from './combat/capture-odds.js';
import {RESEARCH_TIERS,RESEARCH_REWARD_PREFIX,recordSpeciesResearch,researchCatalogue,nextResearchLead,claimResearchTier} from './creatures/field-research.js';
import {reveal,isDiscovered,discoveredPercent} from './world/discovery.js';
import {RUNE_PUZZLES,RUNE_SYMBOLS,submitRune,claimRune,type RuneLocation} from './puzzles/runes.js';
import {unlockedMoves,equipMove} from './creatures/loadout.js';
import {BIOMES,createExpedition,chooseRoom,completeBattle,availableRooms,expeditionComplete,settleExpedition,roomById,type Biome,type Reward} from './expeditions/expedition.js';
const byId=<T extends HTMLElement>(id:string)=>{const el=document.getElementById(id);if(!el)throw Error('Falta elemento UI: '+id);return el as T;};
const htmlEscape=(v:string)=>v.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
type Battle={recoveryUses:Record<string,number>;encounterId?:string;enemy:Creature;type:'wild'|'boss'|'expedition';pending?:BattleCheckpoint['pending'];busy:boolean;ally:number;log:string;guarding:boolean;selecting:boolean;bossPhase:1|2;chargeStage:0|1|2;effects:Record<string,StatusEffect[]>;};
class AzurGame {
  private renderer=new AsciiRenderer(byId<HTMLCanvasElement>('game'));
  private frameMetrics=new FrameMetrics();private endurance=new EnduranceLab();private adaptiveGlyphs=new AdaptiveGlyphs();private lastAdaptiveUpdate=0;private debugPerformance=false;private lastDebugUpdate=0;private lastSoundDirectionUpdate=0;private lastCompassUpdate=0;
  private sound=new Sound();private soundEnabled=true;private reducedMotion=false;private combatCue:CombatCue|null=null;
  private readonly battleHealth=new BattleHealthPresentation();private readonly focusTrail:MenuFocusTrail|null=(document.body?new MenuFocusTrail():null);private combatInputLock=false;
  private saveBaseline:string|null|undefined;
  private activeSlot:SaveSlot=1;
  private atlasTarget:{zone:ZoneId;x:number;y:number;label:string}|null=null;
  private lastAccessibleMessage='';
  private save:SaveGame={version:1,zone:'village',x:4,y:16,team:[],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:0,rpg:newEconomy()};
  private expeditionMessage='';private roamingCache=new Map<string,RoamingEncounter[]>();
  private cinematic:OpeningCinematic;
  private started=false;private keys=new Set<string>();private battle:Battle|null=null;private dialogQueue:{title:string;text:string}[]=[];
  private modalInvoking:HTMLElement|null=null;private modalBack:(()=>void)|null=null;private drawerInvoking:HTMLElement|null=null;
  private battleKeyboardFocus=false;private battleMenu:'commands'|'moves'|'items'='commands';
  private dialogOpen=false;private modalOpen=false;private flash=0;private last=0;private seconds=0;private stepCounter=0;
  private notifyTimer:number|undefined;private momentTimer:number|undefined;private encounterCooldown=3;private timeSinceSave=0;
  private stick={x:0,y:0,pointerId:-1};private padStick={x:0,y:0};private padButtons=new Set<number>();private selectedBattleAction=0;private facing=2;private moving=false;
  private lastDungeonChamber=-1;private lastReveal=-1;private camera={x:4,y:16};private cameraZone='village';private evolution:{from:string;to:string;startedAt:number;duration:number}|null=null;
  constructor(){this.cinematic=new OpeningCinematic(byId('openingCinematic'));this.restoreAudioSettings();this.restoreMotionSettings();this.restoreGraphicSettings();this.restoreAdaptiveGraphics();this.restoreAccessibility();this.restoreActiveSlot();this.mountDrawer();this.wire();this.loadState();const fit=()=>{const height=visibleViewportHeight(window.innerHeight,window.visualViewport?.height);if(height>0)document.documentElement.style.setProperty('--azur-visible-height',height+'px');this.renderer.resize();};fit();requestAnimationFrame(this.loop);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});}
  private wire(){
    byId('newGame').addEventListener('click',()=>this.startNew());
    byId('watchIntro').addEventListener('click',()=>{this.sound.unlock();this.beginOpening(false);});
    byId('continue').addEventListener('click',()=>this.continueGame());
    byId<HTMLSelectElement>('saveSlotSelect').addEventListener('change',e=>this.selectSaveSlot(Number((e.target as HTMLSelectElement).value)));

    byId('settings').addEventListener('click',()=>this.settings());
    byId('mute').addEventListener('click',()=>{this.soundEnabled=!this.soundEnabled;this.sound.setEnabled(this.soundEnabled);this.updateMuteUi();this.storeAudioSettings();});
    byId('fullscreen').addEventListener('click',()=>this.toggleFullscreen());
    byId('quickFullscreen').addEventListener('click',()=>this.toggleFullscreen());
    byId('quickSettings').addEventListener('click',()=>this.settings());
    document.addEventListener('fullscreenchange',()=>{byId('fullscreen').textContent=document.fullscreenElement?'⤢':'⛶';requestAnimationFrame(()=>this.renderer.resize());});
    byId('drawerToggle').addEventListener('click',()=>this.toggleDrawer());
    byId('resumeBtn').addEventListener('click',()=>this.toggleDrawer(false));
    byId('drawerClose').addEventListener('click',()=>this.toggleDrawer(false));
    byId('drawerScrim').addEventListener('click',()=>this.toggleDrawer(false));
    this.wireJoystick();
    byId('saveBtn').addEventListener('click',()=>this.saveNow(true));
    byId('teamBtn').addEventListener('click',()=>this.openTeam());
    byId('bagBtn').addEventListener('click',()=>this.openBag());
    byId('closeModal').addEventListener('click',()=>this.closeModalOrBack());
    byId('modal').addEventListener('click',e=>{if(e.target===byId('modal'))this.hideModal();});
    byId('closeDialogue').addEventListener('click',()=>this.nextDialog());
    byId('touchInteract').addEventListener('click',()=>this.interact());
    document.addEventListener('keydown',e=>this.handleKeyDown(e));
    document.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>{this.keys.clear();this.resetJoystick();this.padStick={x:0,y:0};this.padButtons.clear();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.keys.clear();this.padStick={x:0,y:0};this.padButtons.clear();this.frameMetrics.reset();this.resetJoystick();this.sound.pause();if(this.started)this.saveNow(false);}else this.sound.resume();});
    window.addEventListener('pagehide',()=>this.sound.pause());
    window.addEventListener('pageshow',()=>{if(!document.hidden)this.sound.resume();});
    window.addEventListener('storage',event=>{
      if(event.key!==saveKeyForSlot(this.activeSlot))return;
      if(!this.started){this.loadState();return;}
      if(this.saveBaseline!==undefined&&event.newValue!==this.saveBaseline){
        byId('saveStatus').textContent='CONFLICTO ENTRE PESTAÑAS · EXPORTA TU PARTIDA';
        this.toast('OTRA PESTAÑA MODIFICÓ EL GUARDADO · EXPORTA TU PROGRESO');
      }
    });
  }

  /** Only the active interaction layer owns keyboard input. Native form editing is never intercepted. */
  private handleKeyDown(e:KeyboardEvent){
    if(this.cinematic.active){this.cinematic.handleKey(e);return;}
    if(e.key==='F3'&&!e.repeat){e.preventDefault();this.debugPerformance=!this.debugPerformance;return;}
    const key=e.key.toLowerCase(),drawerOpen=byId('gameDrawer').classList.contains('open');
    if(isTypingTarget(e.target)){
      if(e.key==='Escape'&&this.modalOpen){e.preventDefault();this.closeModalOrBack();}
      return;
    }
    if(e.key==='Escape'){
      if(this.modalOpen)this.closeModalOrBack();
      else if(this.dialogOpen)this.nextDialog();
      else if(drawerOpen)this.toggleDrawer(false);
      else if(this.battle&&(this.battle.selecting||this.battleMenu!=='commands'))this.openBattleMenu('commands');
      else if(this.started&&!this.battle&&!this.evolution)this.toggleDrawer(true);
      else return;
      this.keys.clear();e.preventDefault();return;
    }
    if(this.modalOpen){
      if(this.trapModalTab(e))return;
      if(navigateMenuKey(byId('modal'),e.key))e.preventDefault();
      return;
    }
    if(!byId('starterScreen').classList.contains('hidden')){
      if(navigateMenuKey(byId('starterScreen'),e.key))e.preventDefault();
      return;
    }
    if(!byId('titleScreen').classList.contains('hidden')){
      if(navigateMenuKey(byId('titleScreen'),e.key))e.preventDefault();
      return;
    }
    if(this.dialogOpen){
      if(['Enter',' ','e','E'].includes(e.key)&&!e.repeat){this.nextDialog();e.preventDefault();}
      return;
    }
    if(drawerOpen){
      if(navigateMenuKey(byId('gameDrawer'),e.key))e.preventDefault();
      return;
    }
    if(this.battle){
      if(e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();return;}
      if(!this.battle.busy&&!this.combatInputLock&&navigateBattleMenuKey(byId('battleActions'),e.key))e.preventDefault();
      return;
    }
    if(e.repeat&&['e','t','b',' ','enter'].includes(key))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))this.keys.add(key);
    if(key==='e'||e.key===' '||e.key==='Enter')this.interact();
    if(key==='t')this.openTeam();
    if(key==='b')this.openBag();
    if(key==='h'&&!e.repeat){e.preventDefault();this.describeCurrentRoute();}
  }
  /** Trapping Tab in a real modal prevents focus escaping behind an overlay. */
  private trapModalTab(e:KeyboardEvent):boolean{
    if(e.key!=='Tab')return false;
    const nodes=menuButtons(byId('modal'));if(!nodes.length)return false;
    const index=nodes.indexOf(document.activeElement as HTMLElement);
    if((e.shiftKey&&index<=0)||(!e.shiftKey&&index===nodes.length-1)){
      e.preventDefault();(e.shiftKey?nodes[nodes.length-1]:nodes[0])?.focus();return true;
    }
    return false;
  }
  /** Standard Gamepad API: USB/Bluetooth controllers work without changing mobile controls. */
  private pollGamepad(){
    const pad=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).find(Boolean):null;
    if(!pad){this.padStick={x:0,y:0};this.padButtons.clear();return;}
    const axis=(value:number|undefined)=>{const v=Number.isFinite(value)?value!:0;return Math.abs(v)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82;};
    this.padStick={x:axis(pad.axes[0]),y:axis(pad.axes[1])};
    const now=new Set<number>();pad.buttons.forEach((button,index)=>{if(button?.pressed)now.add(index);});
    const pressed=(index:number)=>now.has(index)&&!this.padButtons.has(index);
    if(pressed(9)&&this.started&&!this.battle&&!this.evolution)this.toggleDrawer();
    if(pressed(1)){if(this.modalOpen)this.closeModalOrBack();else if(this.dialogOpen)this.nextDialog();else if(this.battle&&(this.battle.selecting||this.battleMenu!=='commands'))this.openBattleMenu('commands');}
    if((pressed(12)||pressed(14)||pressed(13)||pressed(15))&&(this.modalOpen||byId('gameDrawer').classList.contains('open'))){
      const root=this.modalOpen?byId('modal'):byId('gameDrawer');
      navigateMenuKey(root,pressed(12)||pressed(14)?'ArrowUp':'ArrowDown');
    }
    if(pressed(12)||pressed(14)||pressed(13)||pressed(15)){
      if(this.battle&&!this.battle.busy&&!this.combatInputLock)navigateBattleMenuKey(byId('battleActions'),pressed(12)?'ArrowUp':pressed(13)?'ArrowDown':pressed(14)?'ArrowLeft':'ArrowRight');
    }
    if(pressed(0)){
      if(this.battle&&!this.battle.busy)navigateBattleMenuKey(byId('battleActions'),'Enter');
      else if(this.modalOpen||byId('gameDrawer').classList.contains('open')){const root=this.modalOpen?byId('modal'):byId('gameDrawer');const buttons=menuButtons(root);const active=document.activeElement as HTMLElement|null;(buttons.includes(active!)?active:buttons[0])?.click?.();}
      else this.interact();
    }
    this.padButtons=now;
  }
  private toggleFullscreen(){const el=byId('viewport');if(document.fullscreenElement)void document.exitFullscreen();else void el.requestFullscreen?.().catch(()=>this.toast('PANTALLA COMPLETA NO DISPONIBLE'));}
  private updateMuteUi(){byId('mute').textContent=this.soundEnabled?'♫':'♪';byId('mute').setAttribute('aria-label',this.soundEnabled?'Silenciar audio':'Activar audio');byId('mute').setAttribute('aria-pressed',String(!this.soundEnabled));}
  private restoreAudioSettings(){try{const v=JSON.parse(localStorage.getItem('ascii-azur-audio')||'null');if(v&&typeof v==='object'){this.soundEnabled=v.enabled!==false;if(Number.isFinite(v.music))this.sound.setMusicVolume(v.music);if(Number.isFinite(v.effects))this.sound.setEffectsVolume(v.effects);this.sound.setMixProfile(v.profile);}}catch{/* preserve defaults */}if(!this.soundEnabled)this.sound.setEnabled(false);this.updateMuteUi();}
  private restoreGraphicSettings(){try{this.renderer.setGraphics(JSON.parse(localStorage.getItem('ascii-azur-graphics-v2')||'null'));}catch{this.renderer.setGraphics(DEFAULT_GRAPHICS);}this.updateGraphicsTheme();}
  private updateGraphicsTheme(){if(document.documentElement)document.documentElement.dataset.renderMode=this.renderer.renderMode;}
  private storeGraphicSettings(){try{localStorage.setItem('ascii-azur-graphics-v2',JSON.stringify(this.renderer.getGraphics()));}catch{/* storage unavailable */}}
  private restoreAdaptiveGraphics(){
    const touches=Number(navigator.maxTouchPoints)||0,graphics=this.renderer.getGraphics();
    try{const saved=localStorage.getItem('ascii-azur-adaptive-fps-v1');
      const enabled=saved===null?adaptiveDefault(touches,this.renderer.mode,graphics):saved==='true';
      this.adaptiveGlyphs.configure(enabled,enabled?initialAdaptiveScale(touches,this.renderer.mode,graphics):1);
    }catch{/* preserve manual mode */}
    this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale);
  }
  private setAdaptiveGraphics(enabled:boolean){this.adaptiveGlyphs.configure(enabled);this.frameMetrics.reset();this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale);try{localStorage.setItem('ascii-azur-adaptive-fps-v1',String(this.adaptiveGlyphs.active));}catch{/* storage disabled */}}
  private restoreMotionSettings(){try{const v=localStorage.getItem('ascii-azur-reduced-motion');this.reducedMotion=v===null?!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches:v==='true';}catch{this.reducedMotion=false;}}
  private restoreAccessibility(){
    try{const settings=JSON.parse(localStorage.getItem('ascii-azur-accessibility')||'null');
      document.documentElement.classList.toggle('azur-large-text',settings?.largeText===true);
      document.documentElement.classList.toggle('azur-left-handed',settings?.leftHanded===true);
      document.documentElement.classList.toggle('azur-high-contrast',settings?.highContrast===true);
    }catch{/* use defaults */}
  }
  private persistAccessibility(){
    try{localStorage.setItem('ascii-azur-accessibility',JSON.stringify({largeText:document.documentElement.classList.contains('azur-large-text'),leftHanded:document.documentElement.classList.contains('azur-left-handed'),highContrast:document.documentElement.classList.contains('azur-high-contrast')}));}catch{/* storage unavailable */}
  }
  private storeAudioSettings(){try{localStorage.setItem('ascii-azur-audio',JSON.stringify({enabled:this.soundEnabled,music:this.sound.getMusicVolume(),effects:this.sound.getEffectsVolume(),profile:this.sound.getMixProfile()}));}catch{/* private mode */}}
  private mountDrawer(){
    // Reparent existing controls; same DOM nodes and event listeners, including in fullscreen.
    byId('drawerActions').append(byId('teamBtn'),byId('bagBtn'),byId('saveBtn'));
    const extra=document.createElement('div');extra.className='drawer-actions extended';extra.innerHTML='<button id="questsBtn">✧ MISIONES</button><button id="codexBtn">❖ BESTIARIO</button><button id="mapBtn">◇ MAPA</button><button id="fieldJournalBtn">✧ DIARIO DE CAMPO</button><button id="routeBtn">♧ RUTA ELEMENTAL</button><button id="expeditionsBtn">✦ EXPEDICIONES</button><button id="dungeonBtn">♜ CRIPTA EXPLORABLE</button><button id="duelBtn">⚔ COMBATE DIRECTO</button><button id="graphicsBtn">⚙ OPCIONES GRÁFICAS</button>';
    byId('drawerActions').after(extra);
    extra.querySelector('#questsBtn')?.addEventListener('click',()=>this.openQuests());
    extra.querySelector('#codexBtn')?.addEventListener('click',()=>this.openCodex());
    extra.querySelector('#fieldJournalBtn')?.addEventListener('click',()=>this.openFieldJournal());
    extra.querySelector('#mapBtn')?.addEventListener('click',()=>this.openMap());
    extra.querySelector('#routeBtn')?.addEventListener('click',()=>this.openRoutePlan());
    extra.querySelector('#expeditionsBtn')?.addEventListener('click',()=>this.openExpedition());
    extra.querySelector('#dungeonBtn')?.addEventListener('click',()=>this.openDungeonMenu());
    extra.querySelector('#duelBtn')?.addEventListener('click',()=>this.openDuel());
    extra.querySelector('#graphicsBtn')?.addEventListener('click',()=>this.settings());
    const backup=document.createElement('div');backup.className='drawer-actions extended';backup.innerHTML='<button id="exportBtn">⇩ EXPORTAR PARTIDA</button><button id="importBtn">⇧ IMPORTAR PARTIDA</button><input type="file" id="restoreFile" accept="application/json,.json" hidden>';
    extra.after(backup);
    backup.querySelector('#exportBtn')?.addEventListener('click',()=>this.exportGame());
    backup.querySelector('#importBtn')?.addEventListener('click',()=>backup.querySelector<HTMLInputElement>('#restoreFile')?.click());
    backup.querySelector<HTMLInputElement>('#restoreFile')?.addEventListener('change',async e=>{
      const input=e.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;
      try{if(file.size>1000000)throw Error('Archivo demasiado grande');const json=JSON.parse(await file.text()) as unknown;
        if(!validateSave(json))throw Error('Partida inválida');
        if(!window.confirm('Se sustituirá la partida actual por la importada. ¿Continuar?'))return;
        // Commit the validated import before replacing the live session. A failed
        // quota write or stale-tab conflict leaves both the player and save intact.
        this.saveBaseline=writeSave(localStorage,json,this.saveBaseline,this.activeSlot);
        this.atlasTarget=null;this.save=json;establishPrimary(this.save);configureWorld(this.save.worldSeed??0,this.save.worldSnapshot);this.save.worldSnapshot=captureWorldSnapshot()??this.save.worldSnapshot;this.roamingCache.clear();this.save.rpg=normalizeEconomy(json.rpg);this.started=true;this.battle=null;this.cameraZone='';this.lastReveal=-1;this.revealPosition();
        this.sound.unlock();this.sound.setScene(this.save.dungeon?.active?'sanctuary':themeForZone(this.save.zone as ZoneId));
        byId('battle').classList.add('hidden');byId('viewport').classList.remove('in-battle');byId('titleScreen').classList.add('hidden');byId('starterScreen').classList.add('hidden');
        this.toggleDrawer(false);this.hideModal();this.updateUI();this.restoreBattle();this.saveNow(false);this.toast('PARTIDA IMPORTADA');
      }catch(error){this.toast(error instanceof SaveConflictError?'CONFLICTO DE PARTIDAS · EXPORTA TU PROGRESO':'IMPORTACIÓN FALLIDA · ARCHIVO O ALMACENAMIENTO');}finally{input.value='';}
    });
    byId('drawerSidebar').append(byId('quest').closest('.sidebar')!);
    byId('viewport').append(byId('modal')); // modal must be a descendant of fullscreen element
  }
  private toggleDrawer(force?:boolean){
    const drawer=byId('gameDrawer');const open=force??!drawer.classList.contains('open');
    if(open)this.drawerInvoking=document.activeElement as HTMLElement|null;
    drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));
    byId('drawerScrim').classList.toggle('hidden',!open);
    byId('drawerToggle').setAttribute('aria-expanded',String(open));
    if(open){this.resetJoystick();this.keys.clear();focusMenuFirst(drawer);}
    else if(!this.modalOpen)this.drawerInvoking?.focus?.();
  }
  private resetJoystick(){this.stick.x=0;this.stick.y=0;this.stick.pointerId=-1;byId('joystickKnob').style.transform='translate(-50%, -50%)';}
  private wireJoystick(){
    const pad=byId('joystick'),knob=byId('joystickKnob');
    const update=(e:PointerEvent)=>{
      const rect=pad.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      const radius=Math.max(20,Math.min(rect.width,rect.height)*.31);
      const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy),clamped=Math.min(dist,radius);
      const unit=dist?clamped/dist:0;
      const x=dx*unit/radius,y=dy*unit/radius;
      const m=Math.hypot(x,y),effective=m<.12?0:(m-.12)/.88;
      this.stick.x=m?x/m*effective:0;this.stick.y=m?y/m*effective:0;
      knob.style.transform=`translate(calc(-50% + ${dx*unit}px),calc(-50% + ${dy*unit}px))`;
    };
    pad.addEventListener('pointerdown',e=>{if(this.stick.pointerId!==-1)return;e.preventDefault();this.stick.pointerId=e.pointerId;pad.setPointerCapture(e.pointerId);update(e);});
    pad.addEventListener('pointermove',e=>{if(this.stick.pointerId!==e.pointerId)return;e.preventDefault();update(e);});
    const release=(e:PointerEvent)=>{if(this.stick.pointerId!==e.pointerId)return;this.resetJoystick();};
    pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);pad.addEventListener('lostpointercapture',release);
  }
  private restoreActiveSlot(){
    try{const value=localStorage.getItem(ACTIVE_SAVE_SLOT_KEY);if(value==='2'||value==='3')this.activeSlot=Number(value) as SaveSlot;}catch{/* storage unavailable */}
    byId<HTMLSelectElement>('saveSlotSelect').value=String(this.activeSlot);
  }
  private selectSaveSlot(value:number){
    if(this.started||![1,2,3].includes(value))return;
    this.activeSlot=value as SaveSlot;
    try{localStorage.setItem(ACTIVE_SAVE_SLOT_KEY,String(this.activeSlot));}catch{/* storage unavailable */}
    this.loadState();
  }
  private loadState(){
    byId<HTMLSelectElement>('saveSlotSelect').value=String(this.activeSlot);
    try{
      this.saveBaseline=localStorage.getItem(saveKeyForSlot(this.activeSlot));
      const saved=readSave(localStorage,this.activeSlot);
      byId<HTMLButtonElement>('continue').hidden=!saved;
      if(saved){
        const state=saved.state,region=ZONES[state.zone as ZoneId]?.name??state.zone;
        byId('saveSlotSummary').textContent=`VIAJE ${this.activeSlot} · ${region.toUpperCase()} · ${Math.floor(state.playSeconds/60)} MIN · ${state.team.length} VÍNCULOS${saved.source==='backup'?' · RESPALDO RECUPERABLE':''}`;
        byId('saveStatus').textContent=saved.source==='backup'?'RESPALDO DE PARTIDA DISPONIBLE':`PARTIDA ${this.activeSlot} DETECTADA`;
      }else{
        byId('saveSlotSummary').textContent=`VIAJE ${this.activeSlot} VACÍO · CREA UN MUNDO NUEVO`;
        byId('saveStatus').textContent=`VIAJE ${this.activeSlot} SIN GUARDAR`;
      }
    }catch{
      byId<HTMLButtonElement>('continue').hidden=true;
      byId('saveSlotSummary').textContent='ALMACENAMIENTO LOCAL NO DISPONIBLE';
    }
  }
  private reset(){this.endurance.reset();this.atlasTarget=null;this.resetJoystick();this.toggleDrawer(false);this.roamingCache.clear();this.save={version:1,zone:'village',x:4,y:16,team:[],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:0,rpg:newEconomy(),worldSeed:freshWorldSeed()};configureWorld(this.save.worldSeed!);this.save.worldSnapshot=captureWorldSnapshot()!;this.battle=null;this.evolution=null;this.combatCue=null;this.keys.clear();this.encounterCooldown=4;this.camera={x:4,y:16};this.cameraZone='village';this.lastReveal=-1;}
  private startNew(){try{if(readSave(localStorage,this.activeSlot)&&!window.confirm(`Crear un viaje nuevo sustituirá la partida del espacio ${this.activeSlot}. Los otros viajes se conservarán. ¿Continuar?`))return;this.saveBaseline=localStorage.getItem(saveKeyForSlot(this.activeSlot));}catch{/* storage may be disabled */}this.sound.unlock();this.sound.setScene('title');const requested=(byId<HTMLInputElement>('worldSeedInput').value||'').trim();this.reset();if(requested){this.save.worldSeed=/^\d{1,10}$/.test(requested)&&Number(requested)<=4294967295?Number(requested)||1:seedFromText(requested);configureWorld(this.save.worldSeed);this.save.worldSnapshot=captureWorldSnapshot()!;} this.beginOpening(true);this.sound.select();}
  /** A new journey is only saved after the player chooses a partner. Replays do not touch save state. */
  private beginOpening(newJourney:boolean){
    this.keys.clear();this.resetJoystick();this.toggleDrawer(false);
    byId('titleScreen').classList.add('hidden');byId('starterScreen').classList.add('hidden');
    this.sound.setScene('title');
    const returnToTitle=()=>{
      byId('titleScreen').classList.remove('hidden');
      if(newJourney)this.loadState();
      focusMenuFirst(byId('titleScreen'));
    };
    this.cinematic.start(()=>{
      if(!newJourney){returnToTitle();return;}
      byId('starterScreen').classList.remove('hidden');
      this.renderStarters();
      this.sound.select();
    },returnToTitle);
  }
  private continueGame(){try{const result=readSave(localStorage,this.activeSlot);if(!result)throw Error('Guardado inválido');this.saveBaseline=localStorage.getItem(saveKeyForSlot(this.activeSlot));const raw=result.state;this.atlasTarget=null;this.save=raw;this.battle=null;this.combatCue=null;this.battleHealth.reset();this.combatInputLock=false;this.battleMenu='commands';byId('battle').classList.add('hidden');byId('viewport').classList.remove('in-battle');const primaryEstablished=establishPrimary(this.save);const storedSnapshot=this.save.worldSnapshot;configureWorld(this.save.worldSeed??0,storedSnapshot);const expandSnapshot=!!this.save.worldSeed&&(!storedSnapshot||ZONE_IDS.some(id=>!storedSnapshot.tiles[id]||!storedSnapshot.poi[id]));if(expandSnapshot)this.save.worldSnapshot=captureWorldSnapshot()??storedSnapshot;this.roamingCache.clear();this.save.rpg=normalizeEconomy(raw.rpg);this.camera={x:this.save.x,y:this.save.y};this.cameraZone=this.save.zone;this.lastReveal=-1;this.revealPosition();this.started=true;if(expandSnapshot||primaryEstablished)this.saveNow(false);this.sound.unlock();this.sound.setScene(this.save.dungeon?.active?'sanctuary':themeForZone(this.save.zone as ZoneId));this.encounterCooldown=4;byId('titleScreen').classList.add('hidden');this.sound.portal();this.toast(result.source==='backup'?'PARTIDA RECUPERADA DESDE RESPALDO':'PARTIDA RECUPERADA');this.updateUI();this.restoreBattle();}catch{this.toast('EL GUARDADO NO SE PUDO RECUPERAR');}}
  private renderStarters(){const chars:{id:string;glyph:string;title:string}[]=[{id:'cindrel',glyph:'♨',title:'EL FUEGO'},{id:'velaria',glyph:'≋',title:'LA BRUMA'},{id:'thorne',glyph:'✣',title:'LA RAÍZ'}];byId('starters').innerHTML=chars.map(c=>`<button class="starter" data-starter="${c.id}"><span class="starter-symbol" style="color:${SPECIES[c.id]!.color}">${c.glyph}</span><strong>${SPECIES[c.id]!.name}</strong><small>${c.title}</small></button>`).join('');for(const el of byId('starters').querySelectorAll<HTMLButtonElement>('[data-starter]'))el.addEventListener('click',()=>this.pickStarter(el.dataset.starter!));focusMenuFirst(byId('starterScreen'));}
  private pickStarter(id:string){if(this.cinematic.active)this.cinematic.finish();this.sound.setScene('village');this.save.team=[createCreature(id,5)];this.save.journey=newJourneyMetrics(id);this.save.primaryUid=this.save.team[0]!.uid;this.revealPosition();this.started=true;byId('starterScreen').classList.add('hidden');this.sound.pick();this.toast('NUEVO MUNDO · SEMILLA '+this.save.worldSeed);this.dialog(azurOpening());this.updateUI();this.saveNow(false);}
  private flag(id:string){return this.save.flags.includes(id);}
  private get storyState():ArkenStoryState{return{flags:this.save.flags,defeatedBoss:this.save.defeatedBoss,dungeonFinished:!!this.save.dungeon?.finished};}
  private storyBeat(){return arkenStoryBeat(this.storyState);}
  private concludeStory(){
    const result=concludeArken(this.storyState);if(!result.newlyCompleted)return false;
    this.save.flags=result.flags;this.economy.echoes=Math.min(999999,this.economy.echoes+ARKEN_FINALE_REWARD.echoes);
    this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+ARKEN_FINALE_REWARD.seals);
    this.sound.pick();this.processQuests();this.saveNow(false);this.updateUI();this.presentMoment(resolutionMoment('arken-vow-restored',this.save.flags));return true;
  }
  private get economy(){if(!this.save.rpg)this.save.rpg=newEconomy();return this.save.rpg;}
  private addFlag(id:string){const fresh=!this.flag(id);if(fresh)this.save.flags.push(id);this.processQuests();this.updateUI();if(fresh)this.presentMoment(resolutionMoment(id,this.save.flags));}
  private processQuests(){const result=claimQuests(this.economy,this.save.flags,this.save.defeatedBoss);for(const q of result)this.toast(`MISIÓN COMPLETADA: ${q.name.toUpperCase()} · +${q.reward} ECOS`);}
  /** Nonblocking, skippable-by-ignoring title direction; never pauses player input or save state. */
  private presentMoment(moment:StoryMoment|null){
    if(!moment||!this.started)return;
    const panel=byId('chapterCard');
    byId('chapterEyebrow').textContent=moment.eyebrow;
    byId('chapterHeading').textContent=moment.title;
    byId('chapterSubtitle').textContent=moment.subtitle;
    panel.dataset.tone=moment.tone;
    panel.classList.toggle('quiet',this.reducedMotion);
    panel.classList.remove('hidden');
    if(this.momentTimer!==undefined)clearTimeout(this.momentTimer);
    this.sound.storySting(moment.tone);
    this.momentTimer=window.setTimeout(()=>{panel.classList.add('hidden');this.momentTimer=undefined;},4800);
  }
  private toast(text:string){const el=byId('toast');el.textContent=text;el.classList.remove('hidden');if(this.notifyTimer)clearTimeout(this.notifyTimer);this.notifyTimer=window.setTimeout(()=>el.classList.add('hidden'),2800);}
  private dialog(items:{title:string;text:string}[]){this.dialogQueue=items.slice();this.dialogOpen=true;byId('dialogue').classList.remove('hidden');this.renderDialog();byId('dialogue').focus();}
  private renderDialog(){const item=this.dialogQueue[0];if(!item){this.dialogOpen=false;byId('dialogue').classList.add('hidden');byId('viewport').focus();return;}byId('diaTitle').textContent=item.title;byId('diaText').textContent=item.text;}
  private nextDialog(){if(!this.dialogOpen)return;this.dialogQueue.shift();this.sound.select();this.renderDialog();if(!this.dialogOpen&&this.openShopAfterDialog){this.openShopAfterDialog=false;this.openShop();}}
  private interact(){if(this.evolution)return;if(byId('titleScreen').classList.contains('hidden')===false)return;if(!byId('starterScreen').classList.contains('hidden'))return;if(this.modalOpen)return;if(this.dialogOpen){this.nextDialog();return;}if(this.battle)return;if(!this.started)return;if(this.save.dungeon?.active){this.dungeonInteract();return;}const roamer=this.nearRoamer();if(roamer){this.startBattle(roamer.speciesId,roamer.level,'wild',roamer.id);return;}const l=nearbyLandmark(this.save.zone as ZoneId,this.save.x,this.save.y,2.15);if(!l){this.toast('NO HAY NADA CON LO QUE INTERACTUAR');return;}this.interactLandmark(l);if(this.atlasTarget&&this.atlasTarget.zone===this.save.zone&&this.atlasTarget.x===l.x&&this.atlasTarget.y===l.y){this.atlasTarget=null;this.updateStoryCompass();}}
  private roamers():RoamingEncounter[]{const key=this.save.zone+':'+(this.save.worldSeed??0);let list=this.roamingCache.get(key);if(!list){list=visibleEncounters(this.save.zone as ZoneId,this.save.worldSeed??0);this.roamingCache.set(key,list);}return list.filter(e=>!this.flag('roamer-'+e.id));}
  private nearRoamer(){return nearbyEncounter(this.roamers(),this.save.flags,this.save.x,this.save.y,1.8);}
  private interactLandmark(l:Landmark){switch(l.kind){case 'npc':if(this.save.zone==='ossuary'||this.save.zone==='garden')this.interactAfterlightNpc(this.save.zone);else this.interactNpc(l.npcId as NpcId||'archivist');break;
    case 'rune':this.openRune(this.save.zone as RuneLocation);break;
    case 'altar':{recordJourney(this.save,'rests');const firstVisit=!this.flag('altar-'+this.save.zone);const awarded=firstVisit&&this.save.inventory.seals<9;this.save.team.forEach(c=>c.hp=maxHp(c));if(awarded)this.save.inventory.seals++;this.encounterCooldown=4;this.addFlag('altar-'+this.save.zone);this.sound.pick();this.toast((awarded?'VÍNCULOS SANADOS · +1 SELLO POR DESCUBRIR LA LUMBRE':'VÍNCULOS SANADOS · SIN NUEVO SELLO')+' · VIAJES EN DIARIO DE CAMPO');this.saveNow(false);this.offerBondTrial();break;}
    case 'chest':{const relicId=CACHE_RELICS[this.save.zone];const relicFound=relicId&&grantRelic(this.save,relicId,'relic-cache-'+this.save.zone);if(relicFound){this.toast('RELIQUIA · '+RELICS[relicId].name.toUpperCase());this.saveNow(false);}const id=`chest-${this.save.zone}-${l.x}`;if(this.flag(id)){if(!relicFound)this.toast('EL COFRE ESTÁ VACÍO');break;}this.addFlag(id);this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+3);this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+2);this.economy.echoes=Math.min(999999,this.economy.echoes+25);this.sound.pick();this.dialog([{title:'Un juramento olvidado',text:`${relicFound?'También encuentras '+RELICS[relicId!].name+'. ':''}Encuentras 3 Sellos de Vínculo, 2 Tónicos y 25 Ecos. El metal conserva una inscripción: «Nadie desaparece mientras alguien lo recuerde».`} ]);break;}
    case 'memory':{
      if(this.save.zone==='ossuary'||this.save.zone==='garden'){this.interactAfterlightMemory(this.save.zone,l);break;}
      if(this.save.zone==='spire'){
        if(!this.flag('crown-met-oriel')){this.dialog([{title:'ESCRITURA SELLADA',text:'Oriel debe abrirte el camino de las dos reliquias.'}]);break;}
        const name=l.npcId==='flame'?'flame':'archive',flag='crown-relic-'+name;
        if(this.flag(flag)){this.toast('RELIQUIA YA RECORDADA');break;}
        this.addFlag(flag);this.sound.pick();this.saveNow(false);
        this.dialog(name==='flame'?[{title:'LUMBRE DE LOS NOMBRES',text:'La primera criatura encendió una luz para que otra pudiera encontrar el camino. No escribió una ley: ofreció compañía.'},{title:'UN FUEGO QUE NO ORDENA',text:'La brasa revela un nombre sin dueño. El último escriba desea convertirlo en un decreto.'}]:[{title:'ARCHIVO DE LAS AUSENCIAS',text:'Entre páginas blancas aparecen los nombres de quienes desaparecieron y de quienes podrían existir.'},{title:'LA ÚLTIMA PÁGINA',text:'El futuro no es un recuerdo que deba obedecerse. Busca a los tres testigos antes de desafiar a Nullscribe.'}]);break;
      }
      if(this.save.zone!=='marsh'||!this.flag('marsh-met-nael')){this.dialog([{title:'EL RECUERDO CERRADO',text:'Habla primero con Nael, la cartógrafa de las Marismas.'}]);break;}
      const id=l.npcId==='bell'?'bell':'lantern',flag='marsh-memory-'+id;
      if(this.flag(flag)){this.toast('ESTE RECUERDO YA ESTÁ RESTAURADO');break;}
      this.addFlag(flag);this.sound.pick();this.saveNow(false);
      this.dialog(id==='bell'
        ?[{title:'LA CAMPANA SUMERGIDA',text:'Escuchas el nombre de una niña que nunca nació. En el reflejo, una madre anciana todavía la recuerda.'},{title:'PRIMERA VIDA',text:'Has salvado la memoria de una posibilidad. Busca el Farol de las Orillas.'}]
        :[{title:'EL FAROL DE LAS ORILLAS',text:'Un navegante contempla los dos puertos de su vida: el que abandonó y el que nunca existió.'},{title:'SEGUNDA VIDA',text:'El farol revela el camino al Tribunal del Reflejo. Los tres testigos errantes aún reclaman ser escuchados.'}]);break;
    }
    case 'verdict':if(this.save.zone==='ossuary'||this.save.zone==='garden')this.openAfterlightVerdict(this.save.zone);else if(this.save.zone==='spire')this.openCrownVerdict();else this.openMarshVerdict();break;
    case 'portal':{
      let next:ZoneId;
      if(this.save.zone==='village')next='forest';
      else if(this.save.zone==='forest')next=l.x<10?'village':'sanctuary';
      else if(this.save.zone==='garden')next='ossuary';
      else if(this.save.zone==='ossuary'){
       if(l.x>20){if(!afterlightProgress('ossuary',this.save.flags).complete){this.dialog([{title:'EL JARDÍN CERRADO',text:'Edda debe sellar primero el Pozo de los Retornos.'}]);break;}next='garden';}
       else next='spire';
      }
      else if(this.save.zone==='spire'){
       if(l.x>20){if(!this.flag('crown-trilogy-complete')){this.dialog([{title:'EL OSARIO SELLADO',text:'Solo quien haya elegido el destino de la Corona puede escuchar el mar de los ausentes.'}]);break;}next='ossuary';}
       else next='marsh';
      }
      else if(this.save.zone==='marsh'){
       if(l.x>20){if(!crownProgress(this.save.flags).unlocked){this.dialog([{title:'LA PUERTA DEL ÚLTIMO NOMBRE',text:'Nael debe cerrar las vidas del espejo antes de que la Corona te reciba.'}]);break;}next='spire';}
       else next='sanctuary';
      }
      else if(l.x>20){if(!this.flag('arken-vow-restored')){this.dialog([{title:'LA PUERTA DEL SEGUNDO ECO',text:'Antes de cruzar debes unir la Primera Palabra y el Último Signo con el Archivista de Arken.'}]);break;}next='marsh';}
      else next='forest';
      const arrival=arrivalMoment(next,this.save.flags,this.save.flags);this.atlasTarget=null;this.save.zone=next;this.cameraZone='';this.sound.setScene(themeForZone(next));this.save.x=l.x>20?4:40;this.save.y=16;this.encounterCooldown=5;this.lastReveal=-1;this.revealPosition();this.addFlag('zone-'+next);this.sound.portal();this.toast('ENTRAS EN '+ZONES[next].name.toUpperCase());this.saveNow(false);this.updateUI();this.presentMoment(arrival);break;
    }
    case 'guardian':if(this.save.zone==='spire'){
      if(this.flag(CROWN_BOSS_FLAG)){this.toast('NULLSCRIBE YA NO ESCRIBE EL CIELO');break;}
      if(!crownProgress(this.save.flags).bossReady){const p=crownProgress(this.save.flags);this.dialog([{title:'EL ESCRIBA SELLADO',text:`Oriel, las dos reliquias (${p.memories}/2) y los tres testigos (${p.witnesses}/3) deben abrir el nombre de Nullscribe.`}]);break;}
      this.prepareCrownBattle();break;}
      if(this.save.defeatedBoss){this.toast('EL GUARDIÁN DESCANSA');return;}this.prepareGuardianBattle();break;}}
  /** The Afterlight pilgrimage begins only after the authored main ending. */
  private interactAfterlightNpc(zone:AfterlightZone){
    const chapter=AFTERLIGHT[zone],progress=afterlightProgress(zone,this.save.flags);
    if(!progress.started){this.dialog([{title:chapter.keeper,text:'Este sendero aún duerme. Las decisiones de la Corona deben cerrarse primero.'}]);return;}
    if(!progress.met){
      this.addFlag(afterlightFlag(zone,'met'));this.saveNow(false);
      this.dialog([{title:chapter.keeper,text:azurAfterlightIntroduction(zone,this.save.flags)},{title:chapter.title.toUpperCase(),text:chapter.intro[0]!},{title:'TU ELECCIÓN ES LIBRE',text:chapter.intro[1]!}]);return;
    }
    if(progress.complete){
      const epilogue=afterlightFlag(zone,'epilogue');if(!this.flag(epilogue)&&this.save.flags.length<200){this.addFlag(epilogue);this.saveNow(false);}
      const lines=zone==='garden'?afterlightEpilogue(this.save.flags):['Los nombres han elegido su lugar en la marea. El Jardín de la Última Escarcha ya puede abrirse.'];
      this.dialog(lines.map((text,i)=>({title:i===0?chapter.keeper:'LA VIGILIA CONTINÚA',text})));return;
    }
    this.dialog([{title:chapter.keeper,text:progress.objective+' '+progress.hint}]);
  }
  private interactAfterlightMemory(zone:AfterlightZone,landmark:Landmark){
    const progress=afterlightProgress(zone,this.save.flags),chapter=AFTERLIGHT[zone];
    if(!progress.met){this.dialog([{title:'MEMORIA SELLADA',text:'Habla primero con '+chapter.keeper+'.'}]);return;}
    const memory=chapter.memories.find(m=>m.id===landmark.npcId);
    if(!memory)return;
    const flag=afterlightFlag(zone,'memory-'+memory.id);
    if(this.flag(flag)){this.toast('MEMORIA YA RESTAURADA');return;}
    this.addFlag(flag);this.sound.pick();this.saveNow(false);
    this.dialog(memory.lines.map((text,i)=>({title:i===0?memory.title.toUpperCase():'EL ECO REVELADO',text})));
  }
  private openAfterlightVerdict(zone:AfterlightZone){
    const chapter=AFTERLIGHT[zone],progress=afterlightProgress(zone,this.save.flags);
    if(progress.complete){this.dialog([{title:chapter.verdict,text:'El voto permanece. No existe una segunda sentencia.'}]);return;}
    if(!progress.ready){this.dialog([{title:chapter.verdict,text:'Necesitas hablar con '+chapter.keeper+', escuchar las dos memorias y resolver los tres testigos. '+progress.hint}]);return;}
    this.showModal(chapter.verdict.toUpperCase(),
      `<div class="modal-content-block"><strong>${htmlEscape(chapter.title)}</strong><p>Tu decisión será irreversible en esta partida. Ambas opciones permiten continuar y ninguna destruye vínculos adquiridos.</p></div>`+
      chapter.choices.map(c=>`<div class="modal-option"><div><strong>${htmlEscape(c.title)}</strong><small>${htmlEscape(c.description)}</small></div><button data-afterlight-choice="${c.id}" aria-label="Elegir ${htmlEscape(c.title)}">ELEGIR</button></div>`).join('')+
      '<div class="modal-option"><div><strong>VOLVER</strong><small>Puedes seguir explorando antes de decidir.</small></div><button id="afterlightRetreat">VOLVER</button></div>');
    byId('afterlightRetreat').onclick=()=>this.hideModal();
    byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-afterlight-choice]').forEach(button=>{
      button.onclick=()=>this.chooseAfterlightVerdict(zone,button.dataset.afterlightChoice as AfterlightChoice);
    });
  }
  private chooseAfterlightVerdict(zone:AfterlightZone,choice:AfterlightChoice){
    const result=afterlightResolution(zone,this.save.flags,choice);
    if(!result){this.hideModal();this.toast('EL VOTO NO ESTÁ DISPONIBLE');return;}
    result.additions.forEach(flag=>this.addFlag(flag));
    this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+result.reward.seals);
    this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+result.reward.tonics);
    this.economy.echoes=Math.min(999999,this.economy.echoes+result.reward.echoes);
    this.sound.pick();this.saveNow(false);this.hideModal();this.updateUI();
    const chapter=AFTERLIGHT[zone],chosen=chapter.choices.find(c=>c.id===choice)!;
    const next=zone==='ossuary'?'Se abre el camino al Jardín de la Última Escarcha.':'La Vigilia de las Dos Ausencias ha terminado. Regresa con Silas para escuchar el epílogo.';
    this.dialog([{title:chosen.title,text:chosen.description},
      {title:'UN VOTO QUE PERMANECE',text:next}]);
  }
  /** Altars offer real optional evolution/collection arcs once the world clues are solved. */
  private offerBondTrial(){
    const arc=bondAtZone(this.save.zone as ZoneId);if(!arc)return;
    const progress=bondProgress(arc,this.save.flags,[...this.save.team,...this.save.storage]);
    if(progress.stage!=='ready')return;
    this.showModal('JURAMENTO · '+arc.title.toUpperCase(),
      `<div class="modal-content-block"><strong>${htmlEscape(arc.memory)}</strong><p>Elige el destino del vínculo. La decisión es permanente en esta partida y solo afecta a ${htmlEscape(SPECIES[arc.speciesId]!.name)}.</p></div>`+
      `<div class="modal-option"><div><strong>FILO DEL RECUERDO</strong><small>+4 de daño con los ataques del compañero vinculado.</small></div><button id="bondFang" aria-label="Elegir Filo del Recuerdo">ELEGIR FILO</button></div>`+
      `<div class="modal-option"><div><strong>VELO PROTECTOR</strong><small>Recibe un 15% menos de daño directo con el compañero vinculado.</small></div><button id="bondWard" aria-label="Elegir Velo Protector">ELEGIR VELO</button></div>`);
    byId<HTMLButtonElement>('bondFang').onclick=()=>this.chooseBondTrial(arc,'fang');
    byId<HTMLButtonElement>('bondWard').onclick=()=>this.chooseBondTrial(arc,'ward');
  }
  private chooseBondTrial(arc:BondArc,path:BondPath){
    if(this.save.zone!==arc.zone||bondProgress(arc,this.save.flags,[...this.save.team,...this.save.storage]).stage!=='ready')return;
    this.addFlag(bondFlag(arc.id,path));this.economy.echoes=Math.min(999999,this.economy.echoes+45);
    this.sound.pick();this.saveNow(false);this.hideModal();this.updateUI();
    this.dialog([{title:arc.title.toUpperCase(),text:arc.memory},
      {title:path==='fang'?'FILO DEL RECUERDO':'VELO PROTECTOR',
       text:path==='fang'?'El vínculo ha aprendido a herir al olvido. Sus ataques infligirán 4 puntos de daño adicionales.':
         'El vínculo ha aprendido a resistir el olvido. Recibirá un 15% menos de daño directo.'},
      {title:'EL VÍNCULO ELIGE',text:azurBondLegacy(arc.id,path,this.save.flags)},
      {title:'EL JURAMENTO PERMANECE',text:'Recibes 45 Ecos. La elección queda guardada en esta partida y aparecerá en el Diario y el Códice.'}]);
  }
  private checkpointBattle(){
    const b=this.battle;if(!b||!this.started)return;
    const record:BattleCheckpoint={recoveryUses:{...b.recoveryUses},enemy:{...b.enemy,moves:[...b.enemy.moves]},type:b.type,ally:b.ally,guarding:b.guarding,bossPhase:b.bossPhase,chargeStage:b.chargeStage,encounterId:b.encounterId,pending:b.pending,effects:Object.fromEntries(Object.entries(b.effects).map(([uid,arr])=>[uid,arr.map(a=>({...a}))]))};
    this.save.activeBattle=record;this.saveNow(false);
  }
  private restoreBattle(){
    const b=this.save.activeBattle;if(!b||!this.started)return;
    this.battleMenu='commands';this.battleKeyboardFocus=true;this.battle={recoveryUses:{...b.recoveryUses},enemy:{...b.enemy,moves:[...b.enemy.moves]},type:b.type,ally:b.ally,guarding:b.guarding,bossPhase:b.bossPhase,chargeStage:b.chargeStage,encounterId:b.encounterId,pending:b.pending,effects:Object.fromEntries(Object.entries(b.effects).map(([id,arr])=>[id,arr.map(s=>({...s}))])),busy:!!b.pending,selecting:false,log:b.pending?'La acción anterior sigue resolviéndose. El turno no puede repetirse.':'El combate continúa donde lo dejaste. El silencio no ha ganado.'};
    const available=this.save.team.findIndex(c=>c.hp>0);if(available<0){this.defeat();return;}if(!this.save.team[this.battle.ally]?.hp)this.battle.ally=available;
    recordSpeciesResearch(this.save.flags,b.enemy.speciesId,'seen');this.sound.setScene(b.type==='boss'?'boss':'battle');this.toggleDrawer(false);byId('battle').classList.remove('hidden');byId('viewport').classList.add('in-battle');this.refreshBattle();
    if(b.pending==='enemy')window.setTimeout(()=>this.enemyTurn(),250);
    else if(b.pending==='capture')window.setTimeout(()=>this.resolveCapture(),250);
    else if(b.pending==='victory'||(b.pending===undefined&&b.enemy.hp<=0)){this.battle!.busy=true;window.setTimeout(()=>this.winBattle(),250);}
    else if(b.pending==='defeat'){this.battle!.busy=true;window.setTimeout(()=>this.defeat(),250);}
  }
  private startBattle(id:string,level:number,type:'wild'|'boss'|'expedition',encounterId?:string,leadIndex?:number){if(this.battle)return;this.toggleDrawer(false);this.resetJoystick();let ally=this.save.team.findIndex(c=>c.hp>0);if(Number.isInteger(leadIndex)&&(this.save.team[leadIndex!]?.hp??0)>0)ally=leadIndex!;if(ally<0){this.defeat();return;}recordJourney(this.save,'battles');recordSpeciesResearch(this.save.flags,id,'seen');this.sound.setScene(type==='boss'?'boss':'battle');this.battleMenu='commands';this.battleKeyboardFocus=true;this.battle={recoveryUses:{},enemy:createCreature(id,level),type,encounterId,busy:false,ally,guarding:false,selecting:false,bossPhase:1,chargeStage:0,effects:{},log:type==='boss'?`${SPECIES[id]!.name.toUpperCase()}, EL ESCRIBA DEL SILENCIO, DESPIERTA.`:type==='expedition'?`LA GRIETA SE ABRE: ${SPECIES[id]!.name.toUpperCase()} TE DESAFÍA.`:`¡UN ${SPECIES[id]!.name.toUpperCase()} SALVAJE APARECE!`};this.combatCue=null;this.battleHealth.reset();this.combatInputLock=false;this.encounterCooldown=9;byId('battle').classList.remove('hidden');byId('viewport').classList.add('in-battle');byId('prompt').classList.add('hidden');this.sound.portal();this.refreshBattle();}
  /** Explicit warning and tactical plan before the point-of-no-return boss encounter.
   * Players may still challenge the boss underlevelled; this never gates progression. */
  private prepareGuardianBattle(){
    if(!this.started||this.battle||this.dialogOpen)return;
    const result=guardianPreparation(this.save.team);
    const scouting=teamGuide(this.save.team,createCreature('hollowhart',12,()=>.5),this.save.flags);
    const scoutingHtml='<div class="modal-content-block"><strong>EXPLORACIÓN DEL EQUIPO</strong><p>'+htmlEscape(scouting.notice)+'</p>'+scouting.members.map(m=>'<p>'+htmlEscape(m.name)+' · '+htmlEscape(m.summary)+'</p>').join('')+'</div>';
    const intro=result.ready?'Equipo preparado. Hollowhart conserva un ataque cargado peligroso.':
      'Hollowhart puede derrotarte. Puedes combatir o prepararte.';
    const advice=result.advice.map(line=>`<p>${htmlEscape(line)}</p>`).join('');
    const suggested=guardianRecommendedLead(this.save.team);
    const options=this.save.team.map((c,i)=>c.hp<=0?'':`<option value="${i}" ${i===suggested?'selected':''}>${htmlEscape(SPECIES[c.speciesId]!.name)} · NV ${c.level} · ${c.hp}/${maxHp(c)} HP${i===suggested?' · RECOMENDADO':''}</option>`).join('');
    this.showModal('HOLLOWHART · EL DESAFÍO',`<div class="guardian-prep">${scoutingHtml}<p>${htmlEscape(intro)}</p>${advice}<p>Hollowhart combate con Raíz. Solo libera su poderoso ECLIPSE de Éter después de acumular el silencio: usa GUARDIA durante el aviso, incluso con un aliado de Ceniza. Conserva tónicos.</p><label for="guardianLeadSelect">CRIATURA QUE ABRE EL COMBATE</label><select id="guardianLeadSelect" aria-label="Elegir criatura inicial contra Hollowhart">${options}</select><div class="guardian-options"><button id="guardianProceed" aria-label="Iniciar combate contra Hollowhart con la criatura elegida">COMBATIR</button><button id="guardianRetreat">PREPARARSE</button></div></div>`);
    if(!this.modalOpen)return;
    byId<HTMLButtonElement>('guardianProceed').onclick=()=>{const raw=Number(byId<HTMLSelectElement>('guardianLeadSelect').value);const selected=Number.isSafeInteger(raw)&&(this.save.team[raw]?.hp??0)>0?raw:suggested;this.hideModal();this.startBattle('hollowhart',12,'boss',undefined,selected);};
    byId<HTMLButtonElement>('guardianRetreat').onclick=()=>this.hideModal();
  }
  private getAlly(){return this.battle?this.save.team[this.battle.ally]:null;}
  private statuses(c:Creature):StatusEffect[]{return this.battle?.effects[c.uid]??[];}
  private setStatuses(c:Creature,list:StatusEffect[]){if(this.battle)this.battle.effects[c.uid]=list;}
  private tickBurn(c:Creature):number{const out=endTurnEffects(c,this.statuses(c));this.setStatuses(c,out.statuses);c.hp=Math.max(0,c.hp-out.damage);return out.damage;}
  private applyCombatStatus(target:Creature,id:string):string{const effect=MOVE_EFFECTS[id];if(!effect||target.hp<=0)return '';const applied=applyEffect(this.statuses(target),effect,Math.random());this.setStatuses(target,applied.statuses);return applied.applied?` · ${STATUS_INFO[effect.kind].name}!`:'';}

  private recordCryptLoss(victim:Creature){
    if(!loseCryptCompanion(this.save,victim))return;
    if(this.battle){delete this.battle.effects[victim.uid];delete this.battle.recoveryUses[victim.uid];this.battle.ally=Math.max(0,this.save.team.findIndex(c=>c.hp>0));}
    const text=SPECIES[victim.speciesId]!.name+' HA MUERTO EN LA CRIPTA · VÍNCULO PERDIDO';
    if(this.battle)this.battle.log+=' '+text;this.toast(text);this.announceAccessibility(text);
  }
  private openBattleMenu(menu:'commands'|'moves'|'items'){
    if(!this.battle||this.battle.busy)return;
    this.battle.selecting=false;this.battleMenu=menu;this.selectedBattleAction=0;this.battleKeyboardFocus=true;this.refreshBattle();
  }
  private setCombatCue(kind:FxKind,actor:CombatSide,element:string,damageValue=0,effective=false){
    this.combatCue=createCombatCue(kind,actor,element,this.seconds,damageValue,effective);
    if(actor==='enemy'&&(kind==='attack'||kind==='heal')){
      const battle=this.battle,cue=this.combatCue;
      this.combatInputLock=true;
      window.setTimeout(()=>{if(this.battle===battle&&this.combatCue===cue){this.combatInputLock=false;this.refreshBattle();}},this.reducedMotion?260:Math.ceil((cue.duration+.16)*1000));
    }
  }
  private combatPause(milliseconds:number){return this.reducedMotion?Math.min(350,milliseconds):milliseconds;}
  private paintBattleHealth(now:number){
    for(const side of ['enemy','ally'] as const){
      const reading=this.battleHealth.sample(side,now,this.reducedMotion);if(!reading)continue;
      const id=side==='enemy'?'enemy':'ally';
      const bar=byId(id+'Health');const width=(Math.max(0,reading.hp/reading.max)*100).toFixed(2)+'%';
      if(bar.style.width!==width)bar.style.width=width;
      const value=byId(id+'HpText'),label=reading.hp+'/'+reading.max;
      if(value.textContent!==label)value.textContent=label;
      const track=byId(id+'HealthTrack');
      track.dataset.critical=String(reading.critical);track.dataset.warning=String(reading.warning);
    }
  }
  /** Resolve a completed battle with a visible final reaction, without granting a second turn. */
  private cueFaint(side:CombatSide,complete:()=>void){
    const b=this.battle;if(!b)return;
    const target=side==='enemy'?b.enemy:this.getAlly();if(!target){complete();return;}
    this.setCombatCue('faint',side,SPECIES[target.speciesId]!.element);
    this.refreshBattle();window.setTimeout(complete,Math.ceil((this.combatCue?.duration??1.12)*1000)+80);
  }
  private refreshBattle(){const b=this.battle;if(!b)return;const ally=this.getAlly();if(!ally)return;this.checkpointBattle();const es=SPECIES[b.enemy.speciesId]!,as=SPECIES[ally.speciesId]!;
    byId('enemyName').textContent=es.name;byId('enemyLv').textContent='NV. '+b.enemy.level+(b.type==='boss'&&b.bossPhase===2?' · II':'')+(this.statuses(b.enemy).length?' · '+statusLabel(this.statuses(b.enemy)):'');this.battleHealth.retarget('enemy',b.enemy.uid,b.enemy.hp,maxHp(b.enemy),this.seconds,this.combatCue);this.updateHealthMeter('enemyHealthTrack',es.name,b.enemy.hp,maxHp(b.enemy));
    byId('allyName').textContent=as.name+(ally.equipment?' · '+RELICS[ally.equipment].name:'');byId('allyLv').textContent='NV. '+ally.level+(this.statuses(ally).length?' · '+statusLabel(this.statuses(ally)):'');this.battleHealth.retarget('ally',ally.uid,ally.hp,maxHp(ally),this.seconds,this.combatCue);this.updateHealthMeter('allyHealthTrack',as.name,ally.hp,maxHp(ally));this.paintBattleHealth(this.seconds);byId('battleLog').textContent=b.log;
    const threat=battleReadout({boss:b.type==='boss',bossPhase:b.bossPhase,chargeStage:b.chargeStage,guarding:b.guarding,hp:ally.hp,maxHp:maxHp(ally),enemyHp:b.enemy.hp,enemyMaxHp:maxHp(b.enemy),busy:b.busy,pending:b.pending,statuses:this.statuses(ally).map(s=>statusLabel([s])),enemyStatuses:this.statuses(b.enemy).map(s=>statusLabel([s]))});
    const threatNode=byId('battleThreat');threatNode.dataset.severity=threat.severity;threatNode.textContent=threat.title+' · '+threat.detail;
    const suggestion=suggestBattleAction(ally,b.enemy,this.statuses(ally),this.statuses(b.enemy),this.save.inventory.tonics,b.chargeStage,b.bossPhase,recoveryCastsLeft(b.recoveryUses,ally.uid),{
      type:b.type,party:this.save.team,allyIndex:b.ally,seals:this.save.inventory.seals,
      hasRoom:this.save.team.length<6||this.save.storage.length<500,
      ownedSpecies:[...this.save.team,...this.save.storage].map(c=>c.speciesId),flags:this.save.flags
    });
    const advised=suggestion.kind==='move'?MOVES[suggestion.moveId]?.name:
      suggestion.kind==='guard'?'GUARDIA':suggestion.kind==='tonic'?'TÓNICO':
      suggestion.kind==='capture'?'VINCULAR':suggestion.kind==='switch'?'CAMBIAR A '+SPECIES[this.save.team[suggestion.targetIndex]!.speciesId]!.name:'GUARDIA';
    byId('battleAdvice').textContent=b.busy?'':'SUGERENCIA · '+advised+' · '+suggestion.reason;
    this.sound.setIntensity(combatMusicIntensity({allyHp:ally.hp,allyMaxHp:maxHp(ally),enemyHp:b.enemy.hp,enemyMaxHp:maxHp(b.enemy),boss:b.type==='boss',bossPhase:b.bossPhase,chargeStage:b.chargeStage,allyStatusCount:this.statuses(ally).length}));
    this.announceAccessibility(`Combate contra ${es.name}. Enemigo ${b.enemy.hp} de ${maxHp(b.enemy)} puntos de vida. ${as.name} ${ally.hp} de ${maxHp(ally)} puntos de vida. ${threat.aria} ${b.log}`);
    const actions=byId('battleActions');const mode=b.selecting?'party':this.battleMenu;const previousAction=actions.dataset.menu===mode?Array.from(actions.querySelectorAll('button')).indexOf(document.activeElement as HTMLButtonElement):-1;actions.dataset.menu=mode;if(previousAction>=0){this.selectedBattleAction=previousAction;this.battleKeyboardFocus=true;}actions.replaceChildren();const restoreActionFocus=()=>{if(b.busy||!this.battleKeyboardFocus)return;const buttons=Array.from(actions.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));buttons[Math.min(this.selectedBattleAction,buttons.length-1)]?.focus();this.battleKeyboardFocus=false;};const add=(name:string,func:()=>void,special=false,disabled=false,detail='',preview?:{summary:string;extra:string;accessible:string})=>{const button=document.createElement('button');button.dataset.battleCell=String(actions.children.length);button.textContent=name;button.disabled=b.busy||this.combatInputLock||disabled;if(special)button.classList.add('special');if(threat.guardRecommended&&name.includes('GUARDIA'))button.classList.add('recommended-defense');
      const advisedButton=(
        suggestion.kind==='guard'&&name.includes('GUARDIA')||
        suggestion.kind==='tonic'&&name.includes('TÓNICO')||
        suggestion.kind==='capture'&&name.includes('VINCULAR')||
        suggestion.kind==='move'&&name===MOVES[suggestion.moveId]?.name||
        suggestion.kind==='switch'&&((name.includes('VÍNCULOS')&&mode==='commands')||
          (mode==='party'&&name.startsWith('↻ '+SPECIES[this.save.team[suggestion.targetIndex]!.speciesId]!.name+' ·')))
      );
      if(!b.busy&&!disabled&&advisedButton){button.classList.add('recommended-choice');button.setAttribute('data-recommended','true');}if(detail){button.title=detail;if(!preview)button.setAttribute('aria-label',`${name}. ${detail}`);}if(preview){button.classList.add('battle-move');button.textContent='';const label=document.createElement('span');label.className='battle-move-name';label.textContent=name;const metrics=document.createElement('span');metrics.className='battle-move-estimate';metrics.textContent=preview.summary;const effects=document.createElement('span');effects.className='battle-move-extra';effects.textContent=preview.extra;button.append(label,metrics,effects);button.setAttribute('aria-label',preview.accessible);}button.onclick=func;actions.appendChild(button);};
    if(b.selecting){this.selectedBattleAction=0;
      for(const {c,i} of this.save.team.map((c,i)=>({c,i}))){if(i===b.ally)continue;const sp=SPECIES[c.speciesId]!;
        const scout=tacticalProfile(c,b.enemy,this.save.flags);
        add(`↻ ${sp.name} · NV ${c.level} · ${c.hp}/${maxHp(c)}`,()=>this.switchTo(i),false,c.hp<=0,scout.summary+' · AL CAMBIAR: 55 % protección ante el próximo ataque. El enemigo actúa primero.',{summary:scout.minDamage+'–'+scout.maxDamage+' DAÑO',extra:(scout.effective?'EFICAZ · ':'')+'PROTECCIÓN 55 % · '+scout.utility.slice(0,2).join(' / '),accessible:sp.name+'. '+scout.summary+'. Intercambiar consume el turno; protege el 55 % del siguiente impacto.'});
      }
      add('← COMANDOS',()=>this.openBattleMenu('commands'));restoreActionFocus();return;
    }
    if(this.battleMenu==='commands'){
      actions.setAttribute('aria-label','Comandos de combate');
      add('✦ TÉCNICAS',()=>this.openBattleMenu('moves'));add('▣ OBJETOS',()=>this.openBattleMenu('items'));
      add('↻ VÍNCULOS',()=>this.switchCreature(),false,!this.save.team.some((c,i)=>c.hp>0&&i!==b.ally), 'Cambiar consume el turno. El aliado entrante bloquea un 55 % del siguiente ataque enemigo.');add('⛨ GUARDIA',()=>this.defend(),false,false,'Reduce el próximo ataque un 55 %. Consume el turno.');
    }else if(this.battleMenu==='moves'){
      actions.setAttribute('aria-label','Cuatro técnicas activas');
      for(let slot=0;slot<4;slot++){
        const id=ally.moves[slot],m=id?MOVES[id]:undefined;
        if(!m){add('— RANURA VACÍA',()=>{},false,true,'Activa técnicas desde Vínculos, fuera de combate.');continue;}
        const left=recoveryCastsLeft(b.recoveryUses,ally.uid),forecast=previewMove(ally,b.enemy,m,this.statuses(ally),this.statuses(b.enemy));
        if(m.role==='heal'){forecast.extra+=' · '+left+'/3 USOS';forecast.accessible+='; '+left+' de 3 curaciones disponibles';}
        add(m.name,()=>this.useMove(id!),false,m.role==='heal'&&(ally.hp===maxHp(ally)||left===0),'',forecast);
      }
      add('← COMANDOS',()=>this.openBattleMenu('commands'));
    }else{
      actions.setAttribute('aria-label','Objetos y retirada');
      const captureChance=capturePreview(ally,b.enemy,this.statuses(b.enemy));
      add(`◇ VINCULAR ${captureChance.percent}% (${this.save.inventory.seals})`,()=>this.capture(),true,b.type!=='wild'||this.save.inventory.seals===0||(this.save.team.length>=6&&this.save.storage.length>=500),b.type==='wild'?captureChance.accessible+' · '+recruitmentValue(b.enemy,[...this.save.team,...this.save.storage]):'Los guardianes no se pueden capturar.');
      add(`✚ TÓNICO +${effectiveHealing(ally,28)} (${this.save.inventory.tonics})`,()=>this.tonic(),false,this.save.inventory.tonics===0||ally.hp===maxHp(ally),'Consume el turno y limpia ARDOR.');
      add(`↗ HUIR · ${Math.round(escapeChance(ally,b.enemy)*100)}%`,()=>this.escape(),false,b.type!=='wild','La velocidad influye en la retirada. Si falla, el enemigo actúa.');
      add('← COMANDOS',()=>this.openBattleMenu('commands'));
    }
    restoreActionFocus();
  }

  private useMove(id:string){const b=this.battle,ally=this.getAlly(),m=MOVES[id];if(!b||!ally||!m||b.busy||!ally.moves.includes(id)||(m.role==='heal'&&(ally.hp===maxHp(ally)||recoveryCastsLeft(b.recoveryUses,ally.uid)===0)))return;
    if(m.role==='heal')b.recoveryUses[ally.uid]=(b.recoveryUses[ally.uid]??0)+1;
    this.battleMenu='commands';this.selectedBattleAction=0;recordJourney(this.save,'actions');b.busy=true;b.guarding=false;
    const utility=skillUtility(ally,m,this.statuses(ally));
    const result=attackWithStatuses(ally,b.enemy,m,this.statuses(ally),this.statuses(b.enemy),.90+Math.random()*.19);
    this.setStatuses(ally,result.attackerStatuses);this.setStatuses(b.enemy,result.defenderStatuses);
    const dealt=m.role==='heal'?0:bondAttackDamage(result.value,this.save.flags,ally.speciesId);
    const actualDealt=Math.min(b.enemy.hp,dealt);b.enemy.hp=Math.max(0,b.enemy.hp-dealt);
    let restored=0;if(m.role==='heal')restored=utility.healing;else if(m.role==='drain')restored=drainHealing(ally,actualDealt);
    ally.hp=Math.min(maxHp(ally),ally.hp+restored);
    if(utility.cleanse)this.setStatuses(ally,[]);
    const statusText=m.role==='heal'?'':this.applyCombatStatus(b.enemy,id);
    this.setCombatCue(m.role==='heal'?'heal':'attack','ally',m.element,m.role==='heal'?restored:dealt,result.effective);
    this.flash=.28;this.sound.hitElement(m.element);b.log=`${SPECIES[ally.speciesId]!.name} usa ${m.name}. ${dealt?dealt+' de daño':''}${restored?' · +'+restored+' HP':''}${utility.cleanse?' · ESTADOS LIMPIADOS':''}${result.effective&&dealt?' · ¡EFICAZ!':''}${statusText}.`;
    const selfBurn=this.tickBurn(ally);if(selfBurn)b.log+=` ${SPECIES[ally.speciesId]!.name} sufre ${selfBurn} por ARDOR.`;
    if((b.type==='boss'||(b.type==='expedition'&&this.save.expedition?.pending&&roomById(this.save.expedition,this.save.expedition.pending)?.kind==='boss'))&&b.bossPhase===1&&b.enemy.hp>0&&b.enemy.hp<=maxHp(b.enemy)*.5){b.bossPhase=2;b.chargeStage=1;b.log+=` ¡${SPECIES[b.enemy.speciesId]!.name.toUpperCase()} DESATA SU SEGUNDO NOMBRE!`;this.flash=.72;}
    if(ally.hp<=0){this.recordCryptLoss(ally);const next=this.save.team.findIndex(c=>c.hp>0);if(next>=0)b.ally=next;}
    // Commit the action before a delayed response so reload cannot grant an extra turn.
    b.pending=b.enemy.hp<=0?'victory':!this.save.team.some(c=>c.hp>0)?'defeat':'enemy';
    this.refreshBattle();if(b.pending==='victory'){window.setTimeout(()=>this.cueFaint('enemy',()=>this.winBattle()),this.combatPause(1700));return;}if(b.pending==='defeat'){window.setTimeout(()=>this.cueFaint('ally',()=>this.defeat()),this.combatPause(1700));return;}window.setTimeout(()=>this.enemyTurn(),this.combatPause(1900));
  }
  private defend(){const b=this.battle,ally=this.getAlly();if(!b||!ally||b.busy)return;
    this.battleMenu='commands';this.selectedBattleAction=0;recordJourney(this.save,'actions');b.busy=true;b.guarding=true;b.log=`${SPECIES[ally.speciesId]!.name} protege sus recuerdos. El próximo ataque hará un 55% menos de daño.`;
    this.setCombatCue('guard','ally',SPECIES[ally.speciesId]!.element);this.sound.select();const burn=this.tickBurn(ally);if(burn)b.log+=` ${burn} de daño por ARDOR.`;if(ally.hp<=0){this.recordCryptLoss(ally);const next=this.save.team.findIndex(c=>c.hp>0);if(next>=0)b.ally=next;else{this.defeat();return;}}b.pending='enemy';this.refreshBattle();
    window.setTimeout(()=>this.enemyTurn(),this.combatPause(1050));
  }
  private enemyTurn(){const b=this.battle,ally=this.getAlly();if(!b||!ally)return;
    b.pending=undefined; // A checkpoint after this turn records the next player decision.
    if(b.chargeStage===1){b.chargeStage=2;b.busy=false;b.log=`¡${SPECIES[b.enemy.speciesId]!.name.toUpperCase()} ACUMULA EL SILENCIO! Su próximo ECLIPSE de Éter será devastador. Usa GUARDIA.`;
      this.sound.warning();this.setCombatCue('guard','enemy','Éter');this.refreshBattle();return;}
    const charged=b.chargeStage===2;b.chargeStage=0;
    const enemyOptions={...b.enemy,moves:b.enemy.moves.filter(id=>MOVES[id]?.role!=='heal'||recoveryCastsLeft(b.recoveryUses,b.enemy.uid)>0)};
    const moveId=b.type==='boss'&&(b.enemy.speciesId==='hollowhart'||b.enemy.speciesId==='nullscribe')
      ?chooseGuardianMove(enemyOptions,ally,this.statuses(b.enemy),this.statuses(ally),charged?2:0,Math.random())
      :chooseEnemyMove(enemyOptions,ally,this.statuses(b.enemy),this.statuses(ally),Math.random());const m=MOVES[moveId]||MOVES.pulse!;
    if(m.role==='heal')b.recoveryUses[b.enemy.uid]=(b.recoveryUses[b.enemy.uid]??0)+1;
    const enemyUtility=skillUtility(b.enemy,m,this.statuses(b.enemy));
    const result=attackWithStatuses(b.enemy,ally,m,this.statuses(b.enemy),this.statuses(ally),.86+Math.random()*.21);
    this.setStatuses(b.enemy,result.attackerStatuses);this.setStatuses(ally,result.defenderStatuses);
    const raw=m.role==='heal'?0:Math.ceil(result.value*(charged?1.65:b.bossPhase===2?1.15:1));const actual=raw?bondIncomingDamage(guardDamage(raw,b.guarding),this.save.flags,ally.speciesId):0;
    const recovered=m.role==='heal'?enemyUtility.healing:m.role==='drain'?drainHealing(b.enemy,Math.min(ally.hp,actual)):0;
    b.enemy.hp=Math.min(maxHp(b.enemy),b.enemy.hp+recovered);
    if(enemyUtility.cleanse)this.setStatuses(b.enemy,[]);
    ally.hp=Math.max(0,ally.hp-actual);
    const affliction=m.role==='heal'?'':this.applyCombatStatus(ally,moveId);
    b.log=`${SPECIES[b.enemy.speciesId]!.name} usa ${charged?'RUPTURA DEL SILENCIO':m.name}. ${actual?'Recibes '+actual+' de daño':''}${recovered?' · Recupera '+recovered+' HP':''}${enemyUtility.cleanse?' · Purifica sus estados':''}${b.guarding&&actual?' (guardia)':''}${affliction}.`;
    const burn=this.tickBurn(b.enemy);if(burn)b.log+=` ${SPECIES[b.enemy.speciesId]!.name} sufre ${burn} por ARDOR.`;
    b.guarding=false;this.setCombatCue(m.role==='heal'?'heal':'attack','enemy',charged?'Éter':m.element,m.role==='heal'?recovered:actual,result.effective);this.sound.hitElement(charged?'Éter':m.element);this.flash=charged?.4:.18;
    if(ally.hp<=0){this.recordCryptLoss(ally);const next=this.save.team.findIndex(c=>c.hp>0);if(next<0){b.pending='defeat';this.refreshBattle();window.setTimeout(()=>this.cueFaint('ally',()=>this.defeat()),this.combatPause(1720));return;}
      b.ally=next;b.log+=` ${SPECIES[this.save.team[next]!.speciesId]!.name} acude a tu llamada.`;}
    if(b.enemy.hp<=0){b.pending='victory';this.refreshBattle();window.setTimeout(()=>this.cueFaint('enemy',()=>this.winBattle()),this.combatPause(1720));return;}
    b.busy=false;this.refreshBattle();
  }
  private winBattle(){const perfStart=performance.now();const b=this.battle,ally=this.getAlly();if(!b||!ally)return;recordJourney(this.save,'wins');const bonus=firstRoamerVictoryBonus(b.type,b.encounterId,this.save.flags);const mastery=villageTrainingBonus(b.type,this.save.zone,b.enemy.speciesId,this.save.flags,b.encounterId);const amount=(b.type==='boss'?95:11+b.enemy.level*3)+bonus+mastery;const awards=grantPartyExperience(this.save.team,b.ally,amount);for(const growth of awards)if(growth.evolved){recordSpeciesResearch(this.save.flags,growth.from,'bonded');recordSpeciesResearch(this.save.flags,growth.to,'bonded');}if(bonus>0)this.save.team=recoverTrailParty(this.save.team);const gain=awards.find(a=>a.active)!;const evolution=awards.find(a=>a.evolved);const supporters=awards.filter(a=>!a.active);const originalName=SPECIES[b.enemy.speciesId]!.name;this.finishBattle();if(b.type==='boss')this.sound.victory();if(b.encounterId)this.addFlag('roamer-'+b.encounterId);const trailReport=b.encounterId?witnessFieldAftermath(this.save.zone as ZoneId,b.encounterId,this.save.flags):null;if(mastery>0)this.addFlag('training-'+b.enemy.speciesId);this.sound.pick();if(b.type==='wild'&&this.save.dungeon?.active&&this.save.dungeon.pending!==null)this.finishDungeonEnemy();if(b.type==='expedition'){this.expeditionBattleWon();if(evolution)this.beginEvolution(evolution.from,evolution.to);this.saveNow(false);this.updateUI();this.endurance.noteTransition('victory',performance.now()-perfStart);window.setTimeout(()=>this.openExpedition(),evolution?3500:620);return;}if(b.type==='boss'&&b.enemy.speciesId==='nullscribe'){
    if(!this.flag(CROWN_BOSS_FLAG))this.addFlag(CROWN_BOSS_FLAG);
    this.dialog([{title:'EL ÚLTIMO ESCRIBA CAE',text:'Nullscribe se deshace en miles de signos. Ningún rey ha ordenado el fin del mundo: solo el miedo a que otros lo escriban.'},{title:'EL TELAR TE ESPERA',text:'El cielo ya no está sujeto a una pluma. En el Telar del Amanecer deberás decidir qué lugar ocupa la memoria en su futuro.'}]);
   }else if(b.type==='boss'){this.save.defeatedBoss=true;this.addFlag('first-word');this.dialog([{title:'El lenguaje se quiebra',text:'Hollowhart cae de rodillas. Entre sus astas aparece una palabra que no puede pronunciarse.'},{title:'LA PRIMERA PALABRA',text:'La primera sílaba del mundo es tuya. El bosque vuelve a respirar. Pero más allá del santuario alguien ha comenzado a borrar el cielo.'},{title:'FIN DEL CAPÍTULO I',text:'La Primera Palabra ha vuelto, pero Arken aún no puede recordarlo todo. Regresa a la aldea, desciende a la Cripta de los Ecos y busca el Último Signo.'}]);}else{if(!evolution)this.toast(`${originalName.toUpperCase()} VENCIDO · +${amount} EXP${bonus?' · RASTRO +'+bonus+' EXP · REPOSO +25% PS':''}${mastery?' · LECCIÓN +'+mastery+' EXP':''}${gain.levelUp?' · ¡NIVEL! · REVISA HABILIDADES':''}${supporters.length?' · '+supporters.length+' ALIADOS +'+supporters[0]!.amount+' EXP':''}${trailReport?' · '+trailReport:''}`);if(Math.random()<.25)this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+1);this.economy.echoes=Math.min(999999,this.economy.echoes+4+Math.floor(b.enemy.level*.9));}if(evolution)this.beginEvolution(evolution.from,evolution.to);this.saveNow(false);this.updateUI();this.endurance.noteTransition('victory',performance.now()-perfStart);}
  private beginEvolution(from:string,to:string){
    this.evolution={from,to,startedAt:this.seconds,duration:this.reducedMotion?.65:3.2};this.resetJoystick();this.toggleDrawer(false);byId('viewport').classList.add('in-evolution');byId('toast').classList.add('hidden');
    const banner=byId('evolutionBanner');banner.innerHTML=`<small>REESCRITURA DEL NOMBRE</small><strong>${htmlEscape(SPECIES[from]!.name)} <span>→</span> ${htmlEscape(SPECIES[to]!.name)}</strong>`;
    banner.classList.remove('hidden');this.sound.evolve();this.sound.setScene('sanctuary');
  }
  private capture(){const b=this.battle;if(!b||b.busy||b.type!=='wild'||this.save.inventory.seals<1||(this.save.team.length>=6&&this.save.storage.length>=500))return;
    // Debit and save a single attempt before rolling asynchronously.
    this.battleMenu='commands';this.selectedBattleAction=0;recordJourney(this.save,'actions');this.save.inventory.seals--;b.busy=true;b.pending='capture';
    this.setCombatCue('capture','ally',SPECIES[b.enemy.speciesId]!.element);this.sound.select();
    b.log='El sello cruza la bruma...';this.refreshBattle();window.setTimeout(()=>this.resolveCapture(),this.combatPause(1450));
  }
  private resolveCapture(){const perfStart=performance.now();const b=this.battle;if(!b||b.pending!=='capture')return;
    const ally=this.getAlly();if(!ally)return;
    const chance=capturePreview(ally,b.enemy,this.statuses(b.enemy)).chance;
    if(Math.random()<chance){
      recordJourney(this.save,'captures');const captured=b.enemy;const discovery=recruitmentValue(captured,[...this.save.team,...this.save.storage]);let stored=false;
      if(this.save.team.length<6)this.save.team.push(captured);else{this.save.storage.push(captured);stored=true;}
      recordSpeciesResearch(this.save.flags,captured.speciesId,'bonded');
      this.finishBattle();if(b.encounterId)this.addFlag('roamer-'+b.encounterId);const trailReport=b.encounterId?witnessFieldAftermath(this.save.zone as ZoneId,b.encounterId,this.save.flags):null;this.sound.pick();
      if(this.save.dungeon?.active&&this.save.dungeon.pending!==null)this.finishDungeonEnemy();
      this.toast(`VÍNCULO ESTABLECIDO: ${SPECIES[captured.speciesId]!.name.toUpperCase()}${stored?' (RESERVA)':''} · ${discovery}${trailReport?' · '+trailReport:''}`);
      this.addFlag('first-capture');this.saveNow(false);this.updateUI();this.endurance.noteTransition('capture',performance.now()-perfStart);
    }else{
      b.pending='enemy';b.log='¡EL SELLO SE ROMPE! LA CRIATURA RESISTE.';
      this.refreshBattle();this.enemyTurn();
    }
  }
  private tonic(){const b=this.battle,ally=this.getAlly();if(!b||!ally||b.busy||this.save.inventory.tonics<1||ally.hp===maxHp(ally))return;
    this.battleMenu='commands';this.selectedBattleAction=0;recordJourney(this.save,'actions');recordJourney(this.save,'tonics');this.save.inventory.tonics--;
    const restored=effectiveHealing(ally,28);ally.hp+=restored;this.setStatuses(ally,this.statuses(ally).filter(s=>s.kind!=='scorch'));
    b.busy=true;b.pending='enemy';this.setCombatCue('heal','ally',SPECIES[ally.speciesId]!.element,restored);b.log=`${SPECIES[ally.speciesId]!.name} recupera ${restored} puntos de salud y limpia el ARDOR.`;this.sound.pick();this.refreshBattle();window.setTimeout(()=>this.enemyTurn(),this.combatPause(1350));
  }
  private switchCreature(){const b=this.battle;if(!b||b.busy)return;
    if(!this.save.team.some((c,i)=>c.hp>0&&i!==b.ally)){this.toast('NO TIENES OTRA CRIATURA DISPONIBLE');return;}
    b.selecting=true;this.refreshBattle();
  }
  private switchTo(index:number){const b=this.battle;if(!b||b.busy||!b.selecting||index===b.ally)return;
    const selected=this.save.team[index];if(!selected||selected.hp<=0)return;
    recordJourney(this.save,'actions');b.ally=index;b.selecting=false;b.guarding=true;b.busy=true;b.pending='enemy';b.log=`¡${SPECIES[selected.speciesId]!.name} entra en combate con protección! El siguiente ataque enemigo hará un 55 % menos de daño. El cambio consume el turno.`;
    this.setCombatCue('switch','ally',SPECIES[selected.speciesId]!.element);this.sound.select();this.refreshBattle();
    window.setTimeout(()=>this.enemyTurn(),this.combatPause(1200));
  }
  private escape(){if(!this.battle||this.battle.busy||this.battle.type==='boss')return;recordJourney(this.save,'actions');if(Math.random()<escapeChance(this.getAlly()!,this.battle.enemy)){recordJourney(this.save,'escapes');this.finishBattle();this.saveNow(false);this.toast('ESCAPAS ENTRE LA NIEBLA');}else{this.battle.busy=true;this.battle.pending='enemy';this.battle.log='¡NO PUEDES ESCAPAR!';this.refreshBattle();window.setTimeout(()=>this.enemyTurn(),this.combatPause(950));}}
  private defeat(){const perfStart=performance.now();if(this.battle)recordJourney(this.save,'losses');if(this.save.dungeon?.active){this.save.dungeon.active=false;this.save.dungeon.pending=null;}if(this.save.expedition?.pending){const consolation=settleExpedition(this.save.expedition,false);this.addExpeditionReward(consolation);this.expeditionMessage=`La expedición terminó en derrota. Recuperaste ${consolation.echoes} Ecos.`;delete this.save.expedition;}this.finishBattle();this.save.zone='village';this.cameraZone='';this.sound.setScene('village');this.save.x=15;this.save.y=14;this.lastReveal=-1;this.revealPosition();this.save.team.forEach(c=>c.hp=maxHp(c));this.encounterCooldown=6;this.sound.portal();this.dialog([{title:'Regresas a la Lumbre',text:'La oscuridad te ha vencido, pero tus vínculos no se han roto. Descansas y recuperas fuerzas en Velo de Arken.'}]);this.saveNow(false);this.updateUI();this.endurance.noteTransition('defeat',performance.now()-perfStart);}
  private finishBattle(){this.battleMenu='commands';this.sound.setScene(themeForZone(this.save.zone as ZoneId));delete this.save.activeBattle;this.battle=null;this.combatCue=null;this.battleHealth.reset();this.combatInputLock=false;byId('battleThreat').textContent='';byId('battleThreat').dataset.severity='normal';byId('battle').classList.add('hidden');byId('viewport').classList.remove('in-battle');this.encounterCooldown=7;}
  private interactNpc(id:NpcId){
    const e=this.economy;if(!e.visitedNpcs.includes(id))e.visitedNpcs.push(id);
    if(id==='archivist'){
      this.addFlag('archivist');
      if(canConcludeArken(this.storyState)&&this.concludeStory()){
        this.dialog([{title:'EL JURAMENTO DE ARKEN',text:'El Archivista une la Primera Palabra y el Último Signo. Las voces de los desaparecidos vuelven a llenar la plaza.'},
          {title:'LO QUE NO SE BORRA',text:'Tus criaturas pronuncian los nombres que el silencio robó. Arken recupera su memoria; la primera región vuelve a tener un mañana.'},
          {title:'FIN DEL ARCO DE ARKEN',text:`Has cerrado la primera historia completa. Recibes ${ARKEN_FINALE_REWARD.echoes} Ecos y ${ARKEN_FINALE_REWARD.seals} Sellos. El mundo continúa abierto para nuevas aventuras.`}]);
      }else if(legacyBranch(this.save.flags))this.openLegacyWitness();
      else if(this.flag('arken-vow-restored'))this.dialog([azurNpcReflection(this.save.flags,'archivist')!]);
      else if(this.save.defeatedBoss&&!this.save.dungeon?.finished)this.dialog([{title:'El Archivista',text:'La Primera Palabra no basta para proteger Arken. Entra en la Cripta de los Ecos desde el menú, recupera el Último Signo y regresa a contarme lo que has visto.'}]);
      else this.dialog([{title:'EL ARCHIVISTA · LA SILLA VACÍA',text:'Iria recuerda que alguien debía volver del bosque, pero hoy no recuerda ni su rostro. Si el olvido alcanza a tu compañero, perderemos también al último Portador.'},{title:'PRIMERA PALABRA · ÚLTIMO SIGNO',text:'Recupera la Primera Palabra del Santuario y el Último Signo de la Cripta. Solo juntos devolverán sus nombres a Arken. El Bosque de Ceniza comienza al este.'}]);
    }
    else if(id==='merchant'){this.dialog([{title:'Mara, la Buhonera',text:'Los Ecos aún valen algo en este mundo roto. Vuelve a hablarme para ver mis mercancías.'}]);this.addFlag('merchant-met');}
    else if(id==='scout'){
      const lessons=villageTrainingProgress(this.save.flags);
      if(lessons.ready){
        this.addFlag(VILLAGE_TRAINING_REWARD_FLAG);
        this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+2);
        this.sound.pick();this.saveNow(false);
        this.dialog([{title:'IRIA · TRES LECCIONES',text:'Has dominado los tres desafíos elementales de Arken. Recibes dos Tónicos de Lumbre para cuando las Lumbres queden atrás. La preparación debe servir para algo más que ganar batallas repetidas.'}]);
      }else if(this.flag('pilgrim-met')){this.addFlag('pilgrim-rescued');this.dialog([{title:'IRIA · UN NOMBRE RECUPERADO',text:'Mi hermano está vivo. Esta mañana no podía recordar su voz, ahora puedo decir su nombre. Gracias por escuchar a quien Arken había olvidado. Has ganado Ecos para el viaje.'}]);}
      else this.dialog([{title:'IRIA · LA AUSENCIA',text:`Mi hermano partió hacia el bosque y ahora hasta su voz se me escapa. Busca al peregrino. Antes, prueba los tres adversarios de COMBATE DIRECTO en Arken: Ceniza, Raíz y Bruma. Lecciones: ${lessons.completed}/3.${lessons.claimed?' Ya recibiste los Tónicos.':''}`}]);
    }else if(id==='nael'){
      const p=marshChapterProgress(this.save.flags);
      if(p.endingReady){
        if(marshFinish(this.save.flags).newlyFinished){this.addFlag('marsh-chapter-complete');this.economy.echoes=Math.min(999999,this.economy.echoes+80);this.sound.pick();this.saveNow(false);}
        this.dialog(p.choice==='keep'?[{title:'NAEL · ATLAS DE LAS VIDAS',text:'Preservaste los nombres que nunca existieron. Sus historias perduran, aunque recordar duela.'},{title:'FIN DEL CAPÍTULO II',text:'Nael abre el Atlas ante quien quiera escuchar esas vidas, sin poseerlas. Recibes 80 Ecos. La Corona deberá aprender a proteger sin escribir destinos.'}]
          :[{title:'NAEL · ATLAS DE LAS VIDAS',text:'Liberaste los nombres imposibles. Su recuerdo no seguirá encadenando a los vivos.'},{title:'FIN DEL CAPÍTULO II',text:'Nael deja una página en blanco junto al farol. Recordar ya no exige retener. Recibes 80 Ecos. Oriel deberá decidir si el futuro necesita libertad.'}]);
      }else if(p.complete)this.dialog([azurNpcReflection(this.save.flags,'nael')!]);
      else {this.addFlag('marsh-met-nael');this.dialog([{title:'NAEL · CARTÓGRAFA DEL OLVIDO',text:'Arken devolvió nombres a personas olvidadas. Yo no puedo devolver a quienes jamás nacieron; llevo años sin atreverme a cerrar su Atlas. Tú puedes escuchar lo que yo no consigo decidir.'},{title:'LA CAMPANA Y EL FAROL',text:'Recupera dos recuerdos, vence o vincula a los tres testigos del pantano y acude al Tribunal del Reflejo. Allí deberás elegir qué significa recordar.'}]);}
    }else if(id==='oriel'){
      const p=crownProgress(this.save.flags);
      if(p.endingReady){
        if(crownFinish(this.save.flags).newlyFinished){this.addFlag(CROWN_END_FLAG);this.economy.echoes=Math.min(999999,this.economy.echoes+150);this.sound.pick();this.saveNow(false);}
        this.dialog(crownEpilogue(this.save.flags));
      }else if(p.complete)this.dialog([azurNpcReflection(this.save.flags,'oriel')!]);
      else if(!p.unlocked)this.dialog([{title:'ORIEL · CARTA CERRADA',text:'Arken y Nael deben terminar sus historias antes del último nombre.'}]);
      else {this.addFlag('crown-met-oriel');this.dialog([{title:'ORIEL · GUARDIÁN DEL ÚLTIMO NOMBRE',text:'Nael eligió qué hacer con vidas imposibles. Nullscribe pretende borrar incluso esa decisión: escribe tu porvenir antes de que lo vivas. Proteger un nombre no puede significar encerrar a quien lo lleva.'},{title:'LA CORONA SIN REY',text:'Devuelve la Lumbre y el Archivo, escucha a los tres testigos y desafía al Escriba. Solo entonces podrás elegir qué historia merece sobrevivir.'}]);}
    }else if(id==='pilgrim'){this.addFlag('pilgrim-met');this.dialog([{title:'El Peregrino',text:'El bosque casi me robó el nombre. Dile a mi hermana Iria que su hermano ha vuelto y que aún puede reconocerme. El sendero no borró lo que ambos recordamos.'}]);}
    else if(id==='keeper'){
      const vows=sanctuaryOathProgress(this.save.flags);
      if(vows.ready){
        this.addFlag(SANCTUARY_OATHS_FLAG);
        this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+SANCTUARY_OATHS_REWARD.seals);
        this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+SANCTUARY_OATHS_REWARD.tonics);
        e.echoes=Math.min(999999,e.echoes+SANCTUARY_OATHS_REWARD.echoes);
        this.sound.pick();this.saveNow(false);
        this.dialog([{title:'LOS TRES JURAMENTOS',text:'Has escuchado la Raíz, la Bruma y el Éter sin huir de sus recuerdos. Ninguna voz puede devolver lo que la oscuridad devoró, pero tus vínculos conservan su historia.'},
          {title:'OFRENDA DEL UMBRAL',text:'Recibes 2 Sellos de Vínculo, 2 Tónicos y 40 Ecos. Esta ofrenda solo se concede una vez por partida. Hollowhart te espera tras el sendero.'}]);
      }else if(vows.claimed)this.dialog([{title:'Custodia del Umbral',text:'Los tres juramentos perduran en ti. No hay otra ofrenda, pero las Lumbres seguirán ardiendo.'}]);
      else this.dialog([{title:'Custodia del Umbral',text:`Tres voces guardan la senda: Raíz, Bruma y Éter. Enfréntalas o forma vínculos con ellas y vuelve. Juramentos escuchados: ${vows.resolved}/3. La ofrenda te ayudará a resistir al Guardián.`}]);
    }
    if(id==='merchant'&&this.flag('merchant-met')&&e.visitedNpcs.includes('merchant')){
      // First conversation introduces the merchant; subsequent interactions open her shop.
      const encounters=this.save.flags.filter(x=>x==='merchant-introduced').length;
      if(encounters)this.openShopAfterDialog=true;
      else this.addFlag('merchant-introduced');
    }
    this.updateUI();
  }
  private openRune(where:RuneLocation,index=0){
    if(this.battle||!this.started)return;
    const puzzle=RUNE_PUZZLES[where];if(!puzzle)return;
    const solved=this.flag('rune-'+where);
    this.showModal(puzzle.name.toUpperCase(),
      `<div class="modal-content-block">${htmlEscape(puzzle.lore)}</div>`+
      `<div class="modal-content-block">${solved?'INSCRIPCIÓN RESTAURADA':`ELIGE LOS TRES SIGNOS EN ORDEN · ${index}/3`}</div>`+
      `<div class="modal-content-block">PISTA: ${htmlEscape(puzzle.hint)}</div>`+
      (solved?'<div class="modal-content-block">La piedra conserva su nombre. Ya has recibido su recompensa.</div>':
        `<div class="rune-choices">${RUNE_SYMBOLS.map(g=>`<button class="rune-choice" data-rune="${g}" aria-label="Símbolo ${g}">${g}</button>`).join('')}</div>`));
    if(solved)return;
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-rune]'))button.onclick=()=>{
      const result=submitRune(puzzle,index,button.dataset.rune||'');this.sound.select();
      if(result.completed){
        const reward=claimRune(this.save.flags,this.economy.echoes,where);
        this.economy.echoes=reward.echoes;this.addFlag(reward.flag);this.sound.pick();this.saveNow(false);
        this.openRune(where,0);this.toast(`INSCRIPCIÓN REPARADA · +${reward.earned} ECOS`);
      }else{
        this.openRune(where,result.index);
        if(!result.correct)this.toast('LA PIEDRA RECHAZA LA SECUENCIA');
      }
    };
  }
  private openShopAfterDialog=false;
  private openShop(){if(!this.started||this.battle||this.dialogOpen)return;
    const e=this.economy;
    this.showModal('MARA · MERCADO DE ECOS',this.relicShopMarkup()+`<div class="shop-balance">✦ ${e.echoes} ECOS DISPONIBLES</div>`+ (Object.entries(SHOP) as [ShopItem,typeof SHOP[ShopItem]][]).map(([id,item])=>`<div class="modal-option"><div><strong>${htmlEscape(item.name)}</strong><small>${htmlEscape(item.description)}</small><small>EN MOCHILA · ${this.save.inventory[id]}</small></div><button data-buy="${id}" ${e.echoes<item.cost?'disabled':''}>${item.cost} ECOS</button></div>`).join('')+`<div class="modal-content-block">Los Ecos se consiguen venciendo criaturas y completando misiones.</div>`);
    const gift=byId('modalContent').querySelector<HTMLButtonElement>('#relicGift');if(gift)gift.onclick=()=>this.claimRelicGift();
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-buy-relic]'))button.onclick=()=>this.purchaseRelic(button.dataset.buyRelic as RelicId);
    for(const btn of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-buy]'))btn.onclick=()=>{this.purchaseItem(btn.dataset.buy as ShopItem);};
  }
  private purchaseItem(id:ShopItem){if(!buy(this.economy,this.save.inventory,id)){this.toast('ECOS INSUFICIENTES');return false;}recordJourney(this.save,'echoesSpent',SHOP[id].cost);this.sound.pick();this.saveNow(false);this.updateUI();this.openShop();return true;}
  private addExpeditionReward(reward:Reward){
    this.economy.echoes=Math.min(999999,this.economy.echoes+reward.echoes);
    this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+reward.seals);
    this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+reward.tonics);
  }
  private beginExpedition(biome:Biome){
    if(this.save.zone!=='village'||!this.started||this.save.expedition){this.toast('REGRESA A ARKEN PARA COMENZAR');return;}
    this.save.expedition=createExpedition(freshWorldSeed(),biome);this.expeditionMessage='';this.sound.portal();this.saveNow(false);this.openExpedition();
  }
  private expeditionBattleWon(){
    const run=this.save.expedition;if(!run?.pending)return;
    this.save.expedition=completeBattle(run);
    if(expeditionComplete(this.save.expedition))this.completeExpeditionRun();
    else this.expeditionMessage='Victoria en la grieta. Elige el siguiente sendero.';
    this.saveNow(false);
  }
  private completeExpeditionRun(){
    const run=this.save.expedition;if(!run||!expeditionComplete(run))return;
    const reward=settleExpedition(run,true);this.addExpeditionReward(reward);
    this.expeditionMessage=`Grieta sellada: +${reward.echoes} Ecos, +${reward.seals} Sellos, +${reward.tonics} Tónicos.`;
    this.addFlag('expedition-'+run.biome);delete this.save.expedition;this.sound.pick();this.saveNow(false);
  }
  private abandonExpedition(){
    const run=this.save.expedition;if(!run||run.pending||!window.confirm('Abandonar la expedición implica perder las recompensas sin asegurar. ¿Abandonar?'))return;
    const reward=settleExpedition(run,false);this.addExpeditionReward(reward);
    this.expeditionMessage=`Grieta abandonada. Recuperas ${reward.echoes} Ecos.`;delete this.save.expedition;
    this.saveNow(false);this.openExpedition();this.updateUI();
  }
  private enterExpeditionRoom(id:string){
    const run=this.save.expedition;if(!run)return;
    try{
      const {next,room,requiresBattle}=chooseRoom(run,id);
      this.save.expedition=next;this.saveNow(false);
      if(requiresBattle){this.hideModal();this.startBattle(room.speciesId!,room.level!,'expedition');return;}
      if(room.kind==='camp')for(const creature of this.save.team)creature.hp=Math.min(maxHp(creature),creature.hp+Math.max(10,Math.ceil(maxHp(creature)*.30)));
      this.sound.pick();this.expeditionMessage=`${room.name}: ${room.kind==='camp'?'El equipo descansa junto a la llama.':'Recompensa asegurada en la bolsa de expedición.'}`;
      if(expeditionComplete(next))this.completeExpeditionRun();
      this.saveNow(false);this.openExpedition();this.updateUI();
    }catch{this.toast('LA SALA YA NO ESTÁ DISPONIBLE');}
  }
  private openExpedition(){
    if(!this.started||this.battle||this.evolution||this.dialogOpen)return;
    const run=this.save.expedition;
    if(!run){
      this.showModal('LAS GRIETAS · EXPEDICIONES',`<div class="expedition-intro"><span class="eyebrow">RUTAS PROCEDURALES · PERSISTENCIA POR PARTIDA</span><p>Explora cinco etapas de riesgo y recompensa. Cada expedición tiene un trazado fijo, generado con una semilla propia. Las recompensas se ingresan al regresar. En una derrota solo conservas una cuarta parte de los Ecos acumulados.</p>${this.expeditionMessage?`<div class="expedition-message">${htmlEscape(this.expeditionMessage)}</div>`:''}</div><div class="expedition-grid">${(Object.entries(BIOMES) as [Biome,typeof BIOMES[Biome]][]).map(([key,biome])=>`<button class="expedition-card" style="--biome:${biome.accent}" data-new-expedition="${key}" ${this.save.zone!=='village'?'disabled':''}><span>✧</span><strong>${htmlEscape(biome.name)}</strong><small>${htmlEscape(biome.subtitle)}</small><em>${this.flag('expedition-'+key)?'✓ GRIETA DOMINADA · REPETIBLE':'5 ETAPAS · RECOMPENSAS ÚNICAS'}</em></button>`).join('')}</div><div class="modal-content-block">${this.save.zone==='village'?'La expedición empieza al elegir un destino.':'Regresa a Velo de Arken para comenzar una nueva expedición.'}</div>`);
      for(const btn of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-new-expedition]'))btn.onclick=()=>this.beginExpedition(btn.dataset.newExpedition as Biome);
      return;
    }
    if(run.pending){const room=roomById(run,run.pending);if(room){this.hideModal();this.startBattle(room.speciesId!,room.level!,'expedition');}return;}
    const biome=BIOMES[run.biome];const cards=availableRooms(run);
    const icon={skirmish:'⚔',elite:'♜',cache:'▣',camp:'♨',omen:'✧',boss:'◆'};
    this.showModal(`${biome.name.toUpperCase()} · ${run.floor+1}/5`,`<div class="expedition-intro"><span class="eyebrow">GIRO DE LA REALIDAD · SEMILLA ${run.seed}</span><p>${htmlEscape(biome.subtitle)}. Las rutas que no elijas desaparecerán. Esta distribución permanecerá idéntica al cargar la partida.</p><div class="expedition-track">${Array.from({length:5},(_,i)=>`<span class="${i<run.floor?'done':i===run.floor?'active':''}">${i+1}</span>`).join('')}</div><div class="expedition-treasure">BOLSA TEMPORAL · ✦ ${run.treasure.echoes} ECOS · ◇ ${run.treasure.seals} SELLOS · ✚ ${run.treasure.tonics} TÓNICOS</div>${this.expeditionMessage?`<div class="expedition-message">${htmlEscape(this.expeditionMessage)}</div>`:''}</div><div class="expedition-grid">${cards.map(room=>`<button class="expedition-card ${room.kind}" data-expedition-room="${room.id}" style="--biome:${biome.accent}"><span>${icon[room.kind]}</span><strong>${htmlEscape(room.name)}</strong><small>${htmlEscape(room.description)}</small><em>${room.kind==='camp'?'SANAR EQUIPO':`✦ ${room.reward.echoes} · ◇ ${room.reward.seals} · ✚ ${room.reward.tonics}`}</em></button>`).join('')}</div><div class="modal-content-block"><button id="abandonExpedition" class="expedition-abandon">ABANDONAR EXPEDICIÓN</button></div>`);
    for(const btn of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-expedition-room]'))btn.onclick=()=>this.enterExpeditionRoom(btn.dataset.expeditionRoom!);
    const exit=byId<HTMLButtonElement>('abandonExpedition');exit.onclick=()=>this.abandonExpedition();
  }
  /** Spatial roguelite prototype: a real maze, not a route-selection overlay. */
  /** Intentional capture preparation, with the same combat and economy as roaming wilds. */
  private openDuel(){
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return;
    const board=fieldHuntBoard(this.save);
    if(!board)return;
    const lessons=villageTrainingProgress(this.save.flags);
    const notice=board.transition
      ?'<p>FAUNA EN TRÁNSITO · Antes de cerrar este capítulo, los desafíos usan especies conocidas del Santuario. Los habitantes propios de esta región aparecerán después. Los testigos narrativos siguen disponibles.</p>'
      :'<p>FAUNA REGIONAL · Tres desafíos voluntarios. Los encuentros reales continúan también en caminos y rutas narrativas.</p>';
    const entries=board.entries.map(entry=>`<div class="modal-option"><div><strong>${htmlEscape(entry.name)} · NIVEL ${entry.level}</strong><small>${htmlEscape(entry.element)} · ${htmlEscape(entry.role)}</small><small>${entry.status==='bonded'?'✓ VINCULADA':entry.status==='seen'?'AVISTADA':'NUEVA ESPECIE'} · ${htmlEscape(entry.recruitment)}</small><small>CONTRAATAQUE: ${htmlEscape(entry.counterElement)} · ${entry.bestLeadName?'EQUIPO: '+htmlEscape(entry.bestLeadName):'SIN ALIADO DISPONIBLE'}</small>${board.zone==='village'?`<small>${this.flag('training-'+entry.id)?'✓ LECCIÓN APRENDIDA':'PRIMERA VICTORIA +'+VILLAGE_TRAINING_XP+' EXP'}</small>`:''}</div><button data-hunt="${entry.id}" ${board.available?'':'disabled'}>PREPARAR</button></div>`).join('');
    this.showModal('RASTREO DE VÍNCULOS',
      `<div class="modal-content-block"><strong>CAMINO DEL CAZADOR · ${board.bonded}/${board.total} ESPECIES</strong>${notice}<p>${board.nextTier?'PRÓXIMA INVESTIGACIÓN · '+htmlEscape(board.nextTier):'INVESTIGACIÓN COMPLETA O RECOMPENSAS ENTREGADAS'}</p><p>Sellos: ${board.seals} · ${board.captureRoom?'CAPACIDAD PARA NUEVOS VÍNCULOS':'EQUIPO Y RESERVA COMPLETOS'} · Combatir y huir usan las reglas habituales. Debilita al objetivo para capturarlo.</p>${board.zone==='village'?' <p>LECCIONES DE IRIA · '+lessons.completed+'/3 · La primera victoria por especie concede EXP adicional y las tres lecciones dos Tónicos.</p>':''}<button id="huntCodex">ABRIR CÓDICE DE INVESTIGACIÓN</button></div>`+entries);
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-hunt]'))
      button.onclick=()=>this.prepareFieldDuel(button.dataset.hunt!);
    const codex=byId('modalContent').querySelector<HTMLButtonElement>('#huntCodex');
    if(codex)codex.onclick=()=>this.openCodex();
  }
  /** The player explicitly chooses a viable front-line creature before a wild hunt. */
  private prepareFieldDuel(speciesId:string):boolean{
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    const board=fieldHuntBoard(this.save),entry=board?.entries.find(e=>e.id===speciesId);
    if(!entry||!board?.available)return false;
    const enemy=createCreature(entry.id,entry.level,()=>0.5);
    const squad=teamGuide(this.save.team,enemy,this.save.flags);
    const options=this.save.team.map(c=>c.hp>0?
      `<option value="${htmlEscape(c.uid)}" ${c.uid===entry.bestLeadUid?'selected':''}>${htmlEscape(SPECIES[c.speciesId]!.name)} · NV ${c.level} · ${c.hp}/${maxHp(c)} PS</option>`:'').join('');
    this.showModal('DESAFÍO · '+entry.name.toUpperCase(),
      `<div class="modal-content-block"><strong>PREPARACIÓN TÁCTICA · ${htmlEscape(entry.name)}</strong><p>${htmlEscape(entry.role)} · NV ${entry.level} · ${htmlEscape(entry.element)}. Afinidad eficaz: ${htmlEscape(entry.counterElement)}.</p><p>${htmlEscape(entry.recruitment)}</p><p>${htmlEscape(squad.notice)}</p>${squad.members.map(m=>`<p>${htmlEscape(m.name)} · ${htmlEscape(m.summary)}</p>`).join('')}<p>Capturar requiere un Sello y espacio en Equipo o Reserva. Te quedan ${board.seals} Sellos. Los enemigos heridos son más fáciles de capturar. Puedes retirarte sin gastar recursos.</p><label for="huntLeadSelect">CRIATURA QUE ABRE EL DESAFÍO</label><select id="huntLeadSelect" aria-label="Elegir criatura inicial para el desafío">${options}</select><div class="guardian-options"><button id="huntProceed">ENFRENTARSE</button><button id="huntRetreat">SEGUIR EXPLORANDO</button></div></div>`);
    if(!this.modalOpen)return false;
    byId('huntProceed').onclick=()=>this.launchFieldDuel(speciesId,byId<HTMLSelectElement>('huntLeadSelect').value);
    byId('huntRetreat').onclick=()=>this.openDuel();
    this.modalBack=()=>this.openDuel();
    return true;
  }
  private launchFieldDuel(speciesId:string,leaderUid:string):boolean{
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    const challenge=fieldHuntPermission(this.save,speciesId,leaderUid);
    if(!challenge)return false;
    const index=this.save.team.findIndex(c=>c.uid===leaderUid&&c.hp>0);
    if(index<0)return false;
    this.hideModal();this.startBattle(speciesId,challenge.level,'wild',undefined,index);return !!this.battle;
  }
  private openDungeonMenu(){
    if(!this.started||this.battle||this.evolution||this.dialogOpen)return;
    const d=this.save.dungeon;
    if(d?.active){
      this.showModal('CRIPTA DE LOS ECOS',`<div class="modal-content-block">Las piedras recuerdan tu posición. Descubre las salas, libera las dos sombras y descifra la inscripción para abrir la última puerta.</div><div class="modal-option"><button id="leaveDungeon">RETIRARSE AL PUEBLO · GUARDAR PROGRESO</button></div>`);
      byId('leaveDungeon').onclick=()=>{if(this.save.dungeon)this.save.dungeon.active=false;this.hideModal();this.sound.setScene('village');this.updateUI();this.saveNow(false);this.toast('REGRESAS AL PUEBLO · CRIPTA CONSERVADA');};return;
    }
    if(this.save.zone!=='village'){this.toast('REGRESA A ARKEN PARA ENTRAR EN LA CRIPTA');this.toggleDrawer(false);return;}
    const intro=d?.finished?'Ya descubriste el Último Signo. Puedes volver a explorar la cripta o iniciar otra con un nuevo trazado.':d?'Tu cripta anterior sigue exactamente como la dejaste.':'Ocho salas conectadas, dos enemigos, tesoros, una inscripción y una puerta sellada. El recorrido es distinto en cada partida y permanece fijo al guardar.';
    this.showModal('CRIPTA DE LOS ECOS',`<div class="modal-content-block crypt-warning"><strong>MUERTE PERMANENTE</strong><p>Todo compañero que caiga en la cripta se pierde definitivamente. Solo tu compañero principal está protegido, aunque cambies de líder. Las reliquias regresan a la mochila. Las bajas se guardan al resolver cada turno.</p></div><div class="modal-content-block">${intro}</div><div class="modal-option"><button id="enterDungeon">${d?'CONTINUAR CRIPTA':'GENERAR Y ENTRAR'}</button></div>${d?.finished?'<div class="modal-option"><button id="regenerateDungeon">NUEVA CRIPTA · REINICIAR RECORRIDO</button></div>':''}`);
    byId('enterDungeon').onclick=()=>this.enterDungeon(false);
    if(d?.finished)byId('regenerateDungeon').onclick=()=>this.enterDungeon(true);
  }
  private enterDungeon(newRun:boolean){
    if(this.save.zone!=='village'||this.battle)return;
    if(!this.save.dungeon||newRun)this.save.dungeon=generateDungeon(freshWorldSeed());
    establishPrimary(this.save);this.save.dungeon.active=true;this.hideModal();this.toggleDrawer(false);
    this.sound.setScene('sanctuary');this.sound.portal();this.lastDungeonChamber=-1;this.updateUI();this.saveNow(false);
    this.toast('CRIPTA · LOS COMPAÑEROS CAÍDOS MUEREN PARA SIEMPRE; TU PRINCIPAL ESTÁ PROTEGIDO');
  }
  private dungeonInteract(){
    const d=this.save.dungeon;if(!d||!d.active)return;
    const e=nearbyDungeonEvent(d);
    if(!e){this.toast('NO HAY INSCRIPCIONES CERCA');return;}
    if(e.kind==='entrance'){d.active=false;this.sound.setScene('village');this.sound.portal();this.updateUI();this.saveNow(false);this.toast('REGRESAS A ARKEN');return;}
    if(e.kind==='exit'){
      if(!dungeonGateOpen(d)){this.dialog([{title:'PUERTA DEL ÚLTIMO SIGNO',text:'Dos vigilantes y una inscripción mantienen el sello cerrado. Explora las habitaciones y recupera sus nombres.'}]);return;}
      if(!d.finished){d.finished=true;this.economy.echoes=Math.min(999999,this.economy.echoes+150);this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+3);this.addFlag('dungeon-first-clear');this.dialog([{title:'EL SIGNO RECUPERADO',text:'La cripta cede. Recuperas 150 Ecos y 3 Sellos. Sal por el umbral y lleva el Último Signo al Archivista de Arken.'}]);}
      else this.toast('EL ÚLTIMO SIGNO YA ES TUYO');this.saveNow(false);return;
    }
    if(e.kind==='enemy'){
      if(d.pending!==null&&d.pending!==e.id)return;d.pending=e.id;this.saveNow(false);this.startBattle(e.species||'gravemoth',e.id===2?7:9,'wild');return;
    }
    if(e.kind==='cache'){
      this.save.dungeon=completeDungeonEvent(d,e.id);this.economy.echoes=Math.min(999999,this.economy.echoes+40);this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+1);this.sound.pick();this.dialog([{title:'ARCA DEL SILENCIO',text:'Encuentras 40 Ecos y un Tónico. El arca queda vacía para siempre en esta cripta.'}]);
    }else if(e.kind==='altar'){
      this.save.dungeon=completeDungeonEvent(d,e.id);this.save.team.forEach(c=>c.hp=maxHp(c));this.sound.pick();this.toast('LA LUMBRE RESTAURA TODOS TUS VÍNCULOS');
    }else if(e.kind==='rune'){
      this.save.dungeon=completeDungeonEvent(d,e.id);this.addFlag('dungeon-rune');this.sound.pick();this.dialog([{title:'INSCRIPCIÓN PARTIDA',text:'«Las puertas no se abren con fuerza. Solo quien recuerda los dos nombres borrados puede pronunciarlas».'}]);
    }
    this.saveNow(false);this.updateUI();
  }
  private finishDungeonEnemy(){
    const d=this.save.dungeon;if(!d?.active||d.pending===null)return;
    this.save.dungeon=completeDungeonEvent(d,d.pending);
    this.economy.echoes=Math.min(999999,this.economy.echoes+25);
    this.toast('CENTINELA VENCIDO · +25 ECOS');
    this.saveNow(false);this.updateUI();
  }
  private exportGame(){if(!this.started){this.toast('NO HAY PARTIDA PARA EXPORTAR');return;}
    const blob=new Blob([JSON.stringify(this.save,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ascii-azur-viaje-${this.activeSlot}.json`;
    document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),3000);
    this.toast('COPIA DE LA PARTIDA PREPARADA');
  }
  /** Optional, inspectable Sanctuary scout report; visible on mobile/keyboard menus. */
  private openRoutePlan(){
    if(!this.started||this.battle||this.evolution||this.dialogOpen)return;
    const route=visibleEncounters('sanctuary',this.save.worldSeed??0);
    const plan=sanctuaryRoutePlan(this.save.team,route,this.save.flags);const guide=teamGuide(this.save.team,createCreature('hollowhart',12,()=>.5),this.save.flags);
    const finished=plan.filter(entry=>entry.cleared).length;
    const vows=sanctuaryOathProgress(this.save.flags);
    const entries=plan.map((entry,i)=>{
      const tip=entry.counter
        ?'CONTRAATAQUE: '+entry.counter
        :'SIN CONTRAATAQUE EN EL EQUIPO ACTIVO: busca afinidad favorable o cambia las técnicas';
      return `<div class="modal-option"><div><strong>${i+1}. ${htmlEscape(entry.name)} · NV ${entry.level}</strong><small>${htmlEscape(entry.element)} · ${htmlEscape(tip)}</small></div><span class="quest-state ${entry.cleared?'done':''}">${entry.cleared?'✓ SUPERADO':'PENDIENTE'}</span></div>`;
    }).join('');
    this.showModal('SANTUARIO · PLAN DE RUTA',
      `<div class="modal-content-block">RUTA ELEMENTAL · ${finished}/${plan.length} RETOS. Los encuentros y sus posiciones son persistentes según la semilla de tu partida. Vencerlos da experiencia única y reposo; capturarlos añade un vínculo. Supera o vincula los tres retos y habla con la Custodia del Umbral para recibir una sola vez 2 Sellos, 2 Tónicos y 40 Ecos.</div>`+
      entries+
      `<div class="modal-content-block">PREPARACIÓN DEL GUARDIÁN · ${htmlEscape(guide.notice)}</div>`+
      `<div class="modal-content-block">TRES JURAMENTOS · ${vows.claimed?'RECOMPENSA RECLAMADA':vows.ready?'REGRESA A LA CUSTODIA PARA RECLAMAR':vows.resolved+'/3 RETOS RESUELTOS'}</div>`+
      `<div class="modal-content-block">Equipo consciente: ${this.save.team.filter(c=>c.hp>0).length}/${this.save.team.length} · Tónicos: ${this.save.inventory.tonics} · Sellos: ${this.save.inventory.seals}. Cura en las Lumbres y prepara ataques de Ceniza para Hollowhart (Raíz). Este mapa táctico no inicia combates ni altera tu partida.</div>`);
  }
  /** Authored moral fork: only unlocked by two recovered memories and three resolved testifiers. */
  private openMarshVerdict(){
    if(this.save.zone!=='marsh'||!this.started||this.battle)return;
    const p=marshChapterProgress(this.save.flags);
    if(p.choice){this.dialog([{title:'TRIBUNAL DEL REFLEJO',text:'La sentencia está grabada para siempre. Habla con Nael para escuchar su consecuencia.'}]);return;}
    if(!p.verdictReady){this.dialog([{title:'TRIBUNAL SELLADO',text:`El Tribunal exige dos recuerdos (${p.memories}/2), tres testigos (${p.encounters}/3) y la voz de Nael.`}]);return;}
    this.showModal('TRIBUNAL DEL REFLEJO',`<div class="modal-content-block"><strong>CAPÍTULO II · DECISIÓN IRREVERSIBLE</strong><p>Dos vidas que nunca fueron reales piden destinos opuestos. Conserva sus nombres y acepta el dolor, o libéralos para que los vivos puedan avanzar.</p></div><div class="modal-option"><div><strong>PRESERVAR</strong><small>180 Ecos + 4 Sellos. ${htmlEscape(azurMarshChoiceMeaning('keep'))}</small></div><button data-marsh-choice="keep">PRESERVAR</button></div><div class="modal-option"><div><strong>LIBERAR</strong><small>180 Ecos + 4 Tónicos. ${htmlEscape(azurMarshChoiceMeaning('release'))}</small></div><button data-marsh-choice="release">LIBERAR</button></div>`);
    for(const b of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-marsh-choice]'))b.onclick=()=>this.chooseMarsh(b.dataset.marshChoice==='keep'?'keep':'release');
  }
  private chooseMarsh(choice:MarshChoice){
    if(!marshDecision(this.save.flags,choice).newlyDecided)return;
    const r=MARSH_REWARDS[choice];
    this.addFlag(choice==='keep'?'marsh-choice-keep':'marsh-choice-release');
    this.economy.echoes=Math.min(999999,this.economy.echoes+r.echoes);
    this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+r.seals);
    this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+r.tonics);
    this.hideModal();this.sound.pick();this.saveNow(false);
    this.dialog([{title:'EL ESPEJO SE QUIEBRA',text:azurMarshChoiceMeaning(choice)},{title:'EL CAMINO CONTINÚA',text:'Regresa a Nael para cerrar el Atlas y escuchar tu epílogo.'}]);
  }
  private prepareCrownBattle(){
    if(this.battle||this.dialogOpen||!crownProgress(this.save.flags).bossReady)return;
    const recommended=guardianRecommendedLead(this.save.team,'nullscribe');const scouting=teamGuide(this.save.team,createCreature('nullscribe',16,()=>.5),this.save.flags);const scoutingHtml='<div class="modal-content-block"><strong>EXPLORACIÓN DEL EQUIPO</strong><p>'+htmlEscape(scouting.notice)+'</p>'+scouting.members.map(m=>'<p>'+htmlEscape(m.name)+' · '+htmlEscape(m.summary)+'</p>').join('')+'</div>';
    const options=this.save.team.map((c,i)=>c.hp<=0?'':`<option value="${i}" ${i===recommended?'selected':''}>${htmlEscape(SPECIES[c.speciesId]!.name)} · NV ${c.level} · ${c.hp}/${maxHp(c)} HP</option>`).join('');
    this.showModal('NULLSCRIBE · LA ÚLTIMA BATALLA',`<div class="guardian-prep">${scoutingHtml}<p>La criatura de Éter se resiste a ceder el porvenir. Prepara un equipo consciente, cura en la Lumbre y conserva tónicos.</p><p>El Escriba carga ECLIPSE antes de liberarlo. Cuando se anuncie, responde con GUARDIA o cambia de estrategia.</p><label for="crownLeadSelect">CRIATURA QUE ABRE EL FINAL</label><select id="crownLeadSelect" aria-label="Elegir líder del combate final">${options}</select><div class="guardian-options"><button id="crownProceed">DESAFIAR A NULLSCRIBE</button><button id="crownRetreat">PREPARARSE</button></div></div>`);
    if(!this.modalOpen)return;
    byId<HTMLButtonElement>('crownProceed').onclick=()=>{const chosen=Number(byId<HTMLSelectElement>('crownLeadSelect').value);this.hideModal();this.startBattle('nullscribe',16,'boss',undefined,Number.isSafeInteger(chosen)?chosen:recommended);};
    byId<HTMLButtonElement>('crownRetreat').onclick=()=>this.hideModal();
  }
  private openCrownVerdict(){
    if(this.save.zone!=='spire'||!this.started||this.battle)return;
    const p=crownProgress(this.save.flags);
    if(p.choice){this.dialog([{title:'EL TELAR ESTÁ SELLADO',text:'La decisión es definitiva. Regresa a Oriel y contempla su consecuencia.'}]);return;}
    if(!p.choiceReady){this.dialog([{title:'EL TELAR ESPERA',text:'Primero debes vencer a Nullscribe. Ninguna decisión puede tomarse bajo su pluma.'}]);return;}
    this.showModal('TELAR DEL AMANECER · DECISIÓN FINAL',`<div class="modal-content-block"><strong>CAPÍTULO III · FINAL IRREVERSIBLE</strong><p>La Primera Palabra ha regresado. Nael ha resuelto las vidas imposibles. Ahora el cielo exige tu respuesta: ¿cuidar sus nombres para siempre o devolver a todos la libertad de escribirlos?</p></div><div class="modal-option"><div><strong>RECORDAR</strong><small>Conserva los nombres · +220 Ecos, +4 Sellos. ${htmlEscape(azurCrownChoiceMeaning('remember',this.save.flags))}</small></div><button data-crown-choice="remember">RECORDAR</button></div><div class="modal-option"><div><strong>RENOVAR</strong><small>Deja el futuro libre · +220 Ecos, +4 Tónicos. ${htmlEscape(azurCrownChoiceMeaning('renew',this.save.flags))}</small></div><button data-crown-choice="renew">RENOVAR</button></div>`);
    for(const btn of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-crown-choice]'))btn.onclick=()=>this.chooseCrown(btn.dataset.crownChoice==='remember'?'remember':'renew');
  }
  private chooseCrown(choice:CrownEnding){
    if(!crownChoose(this.save.flags,choice).newlyChosen)return;
    const reward=CROWN_CHOICE_REWARDS[choice];this.addFlag('crown-choice-'+choice);
    this.economy.echoes=Math.min(999999,this.economy.echoes+reward.echoes);
    this.save.inventory.seals=Math.min(9999,this.save.inventory.seals+reward.seals);
    this.save.inventory.tonics=Math.min(9999,this.save.inventory.tonics+reward.tonics);
    this.hideModal();this.sound.pick();this.saveNow(false);
    this.dialog([{title:'EL CIELO ABIERTO',text:azurCrownChoiceMeaning(choice,this.save.flags)},{title:'EL ÚLTIMO TESTIGO',text:'Busca a Oriel para comprobar qué ha cambiado en Arken y Nael. Después puedes continuar la Vigilia opcional o terminar aquí.'}]);
  }
  /** Optional final world consequence; inspection cannot alter game state. */
  private openLegacyWitness(){
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return;
    const outcome=legacyBranch(this.save.flags);if(!outcome)return;
    const archivist=ZONES.village.landmarks.find(l=>l.npcId==='archivist')!;
    const near=this.save.zone==='village'&&Math.hypot(this.save.x-archivist.x,this.save.y-archivist.y)<=2.15;
    const claimed=legacyClaimed(this.save.flags);
    const content='<div class="modal-content-block"><strong>'+htmlEscape(outcome.title)+'</strong>'+
      '<p>'+htmlEscape(outcome.opening)+'</p><p>'+htmlEscape(outcome.nael)+'</p>'+
      '<p>'+htmlEscape(outcome.oriel)+'</p><p>'+htmlEscape(outcome.resolution)+'</p></div>'+
      '<div class="modal-content-block"><strong>LA HUELLA DE TUS DECISIONES</strong><p>'+
      htmlEscape(outcome.reason)+'</p><p>'+htmlEscape(legacyReceipt(this.save))+'</p>'+
      (claimed?'<p>TESTIMONIO CONSERVADO · LA CRÓNICA RECUERDA TU ELECCIÓN.</p>':
        near?'<button id="claimLegacyWitness">CONFIRMAR TESTIMONIO EN ARKEN</button>':
        '<p>REGRESA AL ARCHIVISTA DE ARKEN PARA CONSERVAR EL TESTIMONIO Y RECIBIR SU RELIQUIA.</p>')+
      '</div><div class="modal-option"><button id="legacyBack">← DIARIO</button></div>';
    this.showModal('TESTIMONIO DE ARKEN',content);
    const confirm=byId('modalContent').querySelector<HTMLButtonElement>('#claimLegacyWitness');
    if(confirm)confirm.onclick=()=>this.claimLegacyWitness();
    byId('legacyBack').onclick=()=>this.openQuests();
    this.modalBack=()=>this.openQuests();
  }
  /** Atomic cross-tab-safe grant; a failed write leaves live ownership untouched. */
  private claimLegacyWitness():boolean{
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    const archivist=ZONES.village.landmarks.find(l=>l.npcId==='archivist')!;
    if(this.save.zone!=='village'||Math.hypot(this.save.x-archivist.x,this.save.y-archivist.y)>2.15)return false;
    const next=planLegacyClaim(this.save);
    if(!next)return false;
    if(!this.commitFieldState(next))return false;
    this.sound.pick();this.openLegacyWitness();this.toast('EL TESTIMONIO DE ARKEN SE HA CONSERVADO');
    return true;
  }
  private openQuests(){if(!this.started)return;
    const step=arkenStoryIndex(this.storyState),beat=this.storyBeat();
    const meaning=azurNarrativeBeat(this.storyState);
    const meaningPanel=`<div class="modal-content-block"><strong>MOTIVACIÓN DE LA HISTORIA · ${htmlEscape(meaning.chapter)}</strong><p>${htmlEscape(meaning.stake)}</p><p>CONSECUENCIA · ${htmlEscape(meaning.consequence)}</p><p>SIGUIENTE PASO · ${htmlEscape(meaning.next)}</p>${meaning.optional?'<p>Este contenido posterior al final es opcional.</p>':''}</div>`;
    const mainQuest=`<div class="modal-content-block"><strong>ARCO PRINCIPAL · ${Math.min(step,6)}/6 ETAPAS</strong><p>${htmlEscape(beat.objective)}</p>${htmlEscape(beat.hint)}</div>`+
      ARKEN_STORY.slice(0,6).map((chapter,i)=>`<div class="modal-option"><div><strong>${htmlEscape(chapter.title)}</strong><small>${htmlEscape(chapter.objective)}</small></div><span class="quest-state ${i<step?'done':''}">${i<step?'✓ HECHA':i===step?'ACTUAL':'PENDIENTE'}</span></div>`).join('');
    const marsh=marshChapterProgress(this.save.flags);
    const chapter=this.flag('arken-vow-restored')?`<div class="modal-content-block"><strong>CAPÍTULO II · ${htmlEscape(marsh.title.toUpperCase())} · ${marsh.stage}/6</strong><p>${htmlEscape(marsh.objective)}</p>${htmlEscape(marsh.hint)}</div><div class="modal-option"><div><strong>ESPEJOS DE LA MARISMA</strong><small>${marsh.memories}/2 recuerdos · ${marsh.encounters}/3 testigos · ${marsh.choice?marsh.choice==='keep'?'PRESERVAR':'LIBERAR':'DECISIÓN PENDIENTE'}</small></div><span class="quest-state ${marsh.complete?'done':''}">${marsh.complete?'✓ CERRADO':'EN CURSO'}</span></div>`:'';
    const crown=crownProgress(this.save.flags);
    const finale=this.flag('marsh-chapter-complete')?`<div class="modal-content-block"><strong>CAPÍTULO III · ${htmlEscape(crown.title.toUpperCase())} · ${crown.stage}/7</strong><p>${htmlEscape(crown.objective)}</p>${htmlEscape(crown.hint)}</div><div class="modal-option"><div><strong>CORONA DE LO NO ESCRITO</strong><small>${crown.memories}/2 reliquias · ${crown.witnesses}/3 testigos · ${crown.boss?'ESCRIBA CAÍDO':'NULLSCRIBE VIVO'} · ${crown.choice||'DECISIÓN PENDIENTE'}</small></div><span class="quest-state ${crown.complete?'done':''}">${crown.complete?'✓ FINAL':'EN CURSO'}</span></div>`:'';
    const afterlight=this.flag('crown-trilogy-complete')?(['ossuary','garden'] as AfterlightZone[]).map(zone=>{
      const p=afterlightProgress(zone,this.save.flags),chapter=AFTERLIGHT[zone];
      return `<div class="modal-option"><div><strong>EPÍLOGO · ${htmlEscape(chapter.title.toUpperCase())}</strong><small>${htmlEscape(p.objective)}</small><small>${htmlEscape(p.hint)}</small></div><span class="quest-state ${p.complete?'done':''}">${p.complete?'✓ COMPLETO':p.started?'EN CURSO':'BLOQUEADO'}</span></div>`;
    }).join(''):'';
    const bonds=BOND_ARCS.map(arc=>{
      const p=bondProgress(arc,this.save.flags,[...this.save.team,...this.save.storage]);
      const state=p.stage==='claimed'?'✓ '+(p.path==='fang'?'FILO':'VELO'):p.stage==='ready'?'DISPONIBLE':p.creatureReady?'BUSCA RECUERDOS':'DESPIERTA';
      return `<div class="modal-option"><div><strong>${htmlEscape(arc.title)}</strong><small>${htmlEscape(arc.hint)}</small><small>${p.memories}/${arc.prerequisiteFlags.length} recuerdos · ${p.creatureReady?'CRIATURA LISTA':'CRIATURA PENDIENTE'}</small></div><span class="quest-state ${p.stage==='claimed'?'done':''}">${state}</span></div>`;
    }).join('');
    const legacy=legacyBranch(this.save.flags);
    const legacyPanel=legacy?'<div class="modal-content-block"><strong>TESTIMONIO DE ARKEN · '+(legacyClaimed(this.save.flags)?'CONSERVADO':'DISPONIBLE')+'</strong><p>'+htmlEscape(legacy.resolution)+'</p><p>Después de la Corona, vuelve al Archivista en Arken para dejar constancia de tus dos decisiones. Esta historia y su reliquia son opcionales.</p><button id="openLegacyWitness">VER TESTIMONIO</button></div>':'';
    const pilgrimage=afterlightOverview(this.save);
    const pilgrimagePanel=this.flag('crown-trilogy-complete')?`<div class="modal-content-block"><strong>VIGILIA DE LAS DOS AUSENCIAS · ${pilgrimage.done}/${pilgrimage.total}</strong><p>La historia principal está cerrada. Quedan dos capítulos completos de exploración, decisiones y epílogos.</p><button id="followPilgrimage">CONTINUAR LA VIGILIA</button></div>`:'';
    const chronicle=storyChronicle(this.storyState);
    const chroniclePanel=`<div class="modal-content-block"><strong>CRÓNICA · ${chronicle.filter(entry=>entry.status==='complete').length}/${chronicle.length} RECUERDOS CERRADOS</strong><p>Revive escenas descubiertas. Las decisiones ya tomadas se recuerdan sin alterar el mundo, las recompensas ni los guardados.</p></div>`+
      chronicle.map(entry=>`<div class="modal-option chronicle-item"><div><strong>${htmlEscape(entry.eyebrow)} · ${htmlEscape(entry.title)}</strong><small>${htmlEscape(entry.summary)}</small></div><button data-chronicle="${entry.id}" aria-label="Leer ${htmlEscape(entry.title)}">LEER</button></div>`).join('');
    const travel=campaignRoadbook(this.storyState,this.save.team,this.save.inventory);
    const progressPanel=`<div class="modal-content-block"><strong>ATLAS DEL VIAJE · ${travel.completed}/${travel.total} HITOS · ${travel.percentage}%</strong><p>${travel.chapters.map(c=>`${htmlEscape(c.name)}: ${c.done}/${c.total} ${c.status==='done'?'✓':c.status==='active'?'◆':'○'}`).join(' · ')}</p><p>OBJETIVO · ${htmlEscape(travel.objective)}</p><p>Equipo: ${this.save.team.filter(c=>c.hp>0).length}/${this.save.team.length} conscientes · ${this.save.inventory.tonics} Tónicos · ${this.save.inventory.seals} Sellos${travel.counter?' · Contraataque: '+htmlEscape(travel.counter):''}.</p>${travel.advice.map(t=>`<p>✦ ${htmlEscape(t)}</p>`).join('')}<p>Este atlas no cambia el guardado ni concede recursos.</p></div>`;
    this.showModal('DIARIO · MISIONES',`<div class="modal-content-block"><strong>REGISTRO DEL VIAJE</strong><p>${this.save.journey?.counters.wins??0} victorias · ${this.save.journey?.counters.losses??0} derrotas · ${this.save.journey?.counters.tonics??0} tónicos usados. Datos locales desde ${this.save.journey?.starter==='unknown'||!this.save.journey?'esta actualización':'el inicio de este viaje'}.</p><button id="exportPlaytest">EXPORTAR REGISTRO DE PRUEBAS</button></div>`+`<div class="modal-content-block"><button id="openFieldFromQuests">DIARIO DE CAMPO · OBJETIVOS Y RECOMPENSAS</button></div>`+meaningPanel+chroniclePanel+progressPanel+mainQuest+chapter+finale +pilgrimagePanel+legacyPanel+afterlight+`<div class="modal-content-block"><strong>JURAMENTOS DE VÍNCULO · ${BOND_ARCS.filter(a=>bondProgress(a,this.save.flags,[...this.save.team,...this.save.storage]).stage==='claimed').length}/${BOND_ARCS.length}</strong><p>Despierta a tus criaturas, descubre memorias y regresa a cada Lumbre para elegir un don permanente.</p></div>`+bonds+`<div class="shop-balance">${this.economy.echoes} ECOS · ${this.economy.completed.length}/${QUESTS.length} ENCARGOS SECUNDARIOS</div>`+QUESTS.map(q=>`<div class="modal-option"><div><strong>${htmlEscape(q.name)}</strong><small>${htmlEscape(q.description)}</small><small>RECOMPENSA · ${q.reward} ECOS</small></div><span class="quest-state ${this.economy.completed.includes(q.id)?'done':''}">${this.economy.completed.includes(q.id)?'✓ HECHA':'PENDIENTE'}</span></div>`).join(''));
    byId('exportPlaytest').onclick=()=>this.exportPlaytest();byId('openFieldFromQuests').onclick=()=>this.openFieldJournal();
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-chronicle]'))button.onclick=()=>{
      const entry=chronicle.find(e=>e.id===button.dataset.chronicle);if(!entry)return;
      this.showModal('CRÓNICA · '+entry.title.toUpperCase(),`<div class="modal-content-block"><strong>${htmlEscape(entry.eyebrow)}</strong><p>${htmlEscape(entry.summary)}</p>${entry.passages.map(line=>`<p>${htmlEscape(line)}</p>`).join('')}<p>Relato guardado en este viaje. No modifica progreso ni recursos.</p></div>`);
      this.modalBack=()=>this.openQuests();
    };
    const witness=byId('modalContent').querySelector<HTMLButtonElement>('#openLegacyWitness');if(witness)witness.onclick=()=>this.openLegacyWitness();
    const follow=byId('modalContent').querySelector<HTMLButtonElement>('#followPilgrimage');if(follow)follow.onclick=()=>{this.hideModal();this.atlasTarget=null;this.clearFieldTarget();this.updateStoryCompass();};
  }
  private exportPlaytest(){const blob=new Blob([JSON.stringify({...journeyReport(this.save),exploration:ZONE_IDS.filter(z=>regionKnown(this.save,z)).map(zone=>{const r=regionalSurvey(this.save,zone);return{zone,done:r.done,total:r.total,claimed:r.claimed};}),pilgrimage:afterlightOverview(this.save)},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='ascii-azur-playtest.json';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  private openCodex(){
    if(!this.started)return;
    const research=researchCatalogue(this.save.team,this.save.storage,this.save.flags);
    const enemy=storyThreat(this.save.flags);
    const knownZones=ZONE_IDS.filter(zone=>regionKnown(this.save,zone)&&regionUnlocked(this.save,zone));
    const lead=nextResearchLead(research,this.save.flags,knownZones,this.save.zone as ZoneId,
      enemy?SPECIES[enemy.speciesId]!.element:undefined);
    const leadPanel=lead
      ?'<div class="modal-content-block"><strong>PRÓXIMO VÍNCULO · '+htmlEscape(lead.name.toUpperCase())+'</strong><p>HÁBITAT · '+htmlEscape(ZONES[lead.zone].name)+' · '+htmlEscape(lead.reason)+'</p><p>Combate en la región conocida y debilita a esta especie salvaje antes de intentar vincularla. Lleva Sellos y prepara un lugar en Vínculos o la reserva.</p><button id="researchRoute">ABRIR DIARIO DE CAMPO</button>'+ (lead.zone===this.save.zone&&fieldHuntBoard(this.save)?.entries.some(e=>e.id===lead.id)?'<button id="researchHunt">PREPARAR CAPTURA DIRECTA</button>':'')+'</div>'
      :'<div class="modal-content-block"><strong>SIGUIENTE INVESTIGACIÓN</strong><p>Encuentra criaturas salvajes para registrar avistamientos. Solo se recomienda una especie que ya conozcas y cuyo hábitat esté desbloqueado.</p></div>';
    const stages=RESEARCH_TIERS.map(tier=>{
      const completed=this.save.flags.includes(RESEARCH_REWARD_PREFIX+tier.id);
      const ready=!completed&&research.bonded>=tier.count;
      const button=completed?'<span class="quest-state done">✓ RECLAMADO</span>':ready
        ?'<button data-research-claim="'+tier.id+'">RECLAMAR</button>'
        :'<span class="quest-state">'+research.bonded+'/'+tier.count+'</span>';
      return '<div class="modal-option"><div><strong>'+htmlEscape(tier.title)+'</strong><small>'+tier.count+' especies distintas · +'+tier.echoes+' Ecos · +'+tier.seals+' Sellos · +'+tier.tonics+' Tónicos</small><small>RELIQUIA TÁCTICA · '+htmlEscape(RELICS[tier.relic].name)+' · '+htmlEscape(RELICS[tier.relic].description)+'</small></div>'+button+'</div>';
    }).join('');
    const entries=research.entries.map(entry=>{
      const species=SPECIES[entry.id]!;
      const identified=entry.status!=='unknown';
      const habitat=entry.habitats.length?entry.habitats.map(zone=>ZONES[zone].name).join(' / '):'SIN HÁBITAT SALVAJE';
      const status=entry.status==='bonded'?'✓ VINCULADA':entry.status==='seen'?'AVISTADA':'POR DESCUBRIR';
      const detail=entry.status==='bonded'?species.title+' · '+species.element+' · '+species.desc
        :entry.status==='seen'?species.title+' · '+species.element
        :'Investiga su hábitat y establece un vínculo para descubrir su historia.';
      const extra=entry.status==='bonded'&&species.role?'<small>ROL TÁCTICO · '+htmlEscape(species.role)+'</small>':'';
      const oath=bondChoice(this.save.flags,entry.id);
      return '<div class="modal-option"><div><strong style="color:'+(identified?species.color:'#a0adb7')+'">'+(identified?htmlEscape(entry.name):'??????')+'</strong><small>'+htmlEscape(detail)+'</small><small>RASTRO · '+htmlEscape(habitat)+'</small>'+extra+(oath?'<small>JURAMENTO · '+(oath==='fang'?'FILO':'VELO')+'</small>':'')+'</div><span class="quest-state '+(entry.status==='bonded'?'done':'')+'">'+status+'</span></div>';
    }).join('');
    this.showModal('CÓDICE · INVESTIGACIÓN',
      '<div class="modal-content-block"><strong>'+research.bonded+'/'+research.total+' VÍNCULOS · '+research.seen+'/'+research.total+' AVISTAMIENTOS</strong><p>Los encuentros dejan un rastro permanente. Investiga las regiones indicadas y vincula especies diferentes para restaurar los cuatro fragmentos del códice.</p><p>Las recompensas son únicas por partida y se reclaman voluntariamente. Los guardianes no son capturables; evolucionar conserva los vínculos anteriores.</p></div>'+
      leadPanel+'<div class="modal-content-block"><strong>HITOS DE INVESTIGACIÓN</strong></div>'+stages+
      '<div class="modal-content-block"><strong>CRIATURAS Y HÁBITATS</strong></div>'+entries);
    for(const btn of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-research-claim]'))
      btn.onclick=()=>this.claimResearch(btn.dataset.researchClaim!);
    const route=byId('modalContent').querySelector<HTMLButtonElement>('#researchRoute');
    if(route&&lead)route.onclick=()=>this.openFieldJournal(lead.zone);
    const hunt=byId('modalContent').querySelector<HTMLButtonElement>('#researchHunt');
    if(hunt&&lead)hunt.onclick=()=>this.prepareFieldDuel(lead.id);
  }
  private claimResearch(id:string){
    const previous={flags:[...this.save.flags],inventory:{...this.save.inventory},echoes:this.economy.echoes,relics:this.save.relics?{...this.save.relics}:undefined};
    const claimState={flags:this.save.flags,team:this.save.team,storage:this.save.storage,inventory:this.save.inventory,rpg:this.economy,relics:this.save.relics};
    const outcome=claimResearchTier(claimState,id);
    if(outcome==='claimed')this.save.relics=claimState.relics;
    if(outcome!=='claimed'){
      this.toast(outcome==='full'?'INVENTARIO O REGISTRO COMPLETO · LIBERA ESPACIO':outcome==='locked'?'INVESTIGACIÓN INCOMPLETA':'RECOMPENSA NO DISPONIBLE');return;
    }
    if(!this.saveNow(false)){
      this.save.flags=previous.flags;this.save.inventory=previous.inventory;this.economy.echoes=previous.echoes;this.save.relics=previous.relics;
      this.toast('NO SE PUDO CONSERVAR LA RECOMPENSA');return;
    }
    this.sound.pick();this.updateUI();this.openCodex();this.toast('INVESTIGACIÓN RECOMPENSADA · RELIQUIAS DISPONIBLES EN VÍNCULOS');
  }
  private revealPosition(){if(!this.save.worldSeed)return;const x=Math.floor(this.save.x),y=Math.floor(this.save.y);const mark=x+y*WORLD_W+(ZONE_IDS.indexOf(this.save.zone as ZoneId)*WORLD_W*WORLD_H);if(this.lastReveal===mark)return;this.lastReveal=mark;this.save.discovered=reveal(this.save.discovered,this.save.zone as ZoneId,x,y,4.8);}
  private openDungeonAtlas(){
    const d=this.save.dungeon;if(!d?.active)return;
    const cells:string[]=[];const step=9;
    for(let y=0;y<29;y++)for(let x=0;x<43;x++){
      const index=y*43+x;if(d.visited[index]!=='1')continue;
      const wall=d.tiles[index]==='#';cells.push(`<rect x="${x*step}" y="${y*step}" width="${step}" height="${step}" fill="${wall?'#5a7180':'#2f414e'}" stroke="#101a25" stroke-width=".8"/>`);
    }
    const pins=d.events.filter(e=>d.visited[e.y*43+e.x]==='1')
      .map(e=>`<circle cx="${(e.x+.5)*step}" cy="${(e.y+.5)*step}" r="${e.kind==='exit'?4.2:3.1}" fill="${d.cleared.includes(e.id)?'#52656b':e.kind==='enemy'?'#e9919c':e.kind==='exit'?'#e1bd88':'#a6dacd'}"/>`).join('');
    const cursor=`<circle cx="${(d.x+.5)*step}" cy="${(d.y+.5)*step}" r="5" fill="#fff4d2" stroke="#142c35" stroke-width="1.5"/>`;
    this.showModal('MAPA · CRIPTA DE LOS ECOS',`<div class="modal-content-block">${d.cleared.length}/6 hallazgos resueltos · ${dungeonGateOpen(d)?'La puerta está abierta.':'Encuentra los dos vigilantes y la inscripción.'}</div><svg class="azur-dungeon-map" viewBox="0 0 387 261" role="img" aria-label="Mapa de la cripta explorada, con la posición del jugador"><rect width="387" height="261" fill="#080e16"/>${cells.join('')}${pins}${cursor}</svg><div class="azur-map-legend"><span>● PORTADOR</span><span>◆ HALLAZGOS</span><span>░ ZONAS DESCONOCIDAS</span></div><div class="modal-content-block">SEMILLA: ${d.seed}. El mapa y los objetos conservan su posición mientras sigas jugando esta partida.</div>`);
  }
  /** Fog-respecting Atlas: select any discovered landmark as a temporary
   * walking objective. The shortest route uses player-footprint collisions,
   * never teleports and never persists synthetic map information to saves. */
  /** These world actions commit a validated snapshot before replacing the live session. */
  private commitFieldState(next:SaveGame):boolean{
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    try{const raw=writeSave(localStorage,next,this.saveBaseline,this.activeSlot);this.saveBaseline=raw;this.save=next;this.updateUI();return true;}
    catch(error){byId('saveStatus').textContent=error instanceof SaveConflictError?'CONFLICTO ENTRE PESTAÑAS · EXPORTA TU PARTIDA':'GUARDADO FALLIDO · EXPORTA TU PARTIDA';this.toast('NO SE PUDO CONFIRMAR EL CAMBIO · PARTIDA CONSERVADA');return false;}
  }
  private setFieldTarget(target:FieldTarget):boolean{
    const next=planFieldTarget(this.save,target);if(!next||!this.commitFieldState(next))return false;
    this.atlasTarget=null;this.hideModal();this.updateStoryCompass();this.toast('OBJETIVO GUARDADO EN EL DIARIO');return true;
  }
  private clearFieldTarget():boolean{
    const next=planFieldTarget(this.save,null);if(!next||!this.commitFieldState(next))return false;
    this.updateStoryCompass();return true;
  }
  private claimSurvey(zone:ZoneId):boolean{
    const next=planSurveyClaim(this.save,zone);if(!next||!this.commitFieldState(next)){this.toast('RECONOCIMIENTO NO DISPONIBLE · REVISA OBJETIVOS Y CAPACIDAD');return false;}
    this.sound.pick();this.toast('REGIÓN DOCUMENTADA · RECOMPENSA ÚNICA');this.openFieldJournal(zone);return true;
  }
  private claimFieldTrail(zone:ZoneId):boolean{
    const next=planFieldTrailClaim(this.save,zone);
    if(!next||!this.commitFieldState(next)){this.toast('RUTA NO DISPONIBLE · REGRESA A LA LUMBRE CON LAS TRES HUELLAS');return false;}
    this.sound.pick();this.toast('RUTA COMPLETADA · RECOMPENSA DISPONIBLE EN EQUIPO');this.openFieldJournal(zone);return true;
  }
  private openFieldJournal(requested:ZoneId=this.save.zone as ZoneId){
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return;
    const zone=ZONE_IDS.includes(requested)&&regionKnown(this.save,requested)?requested:this.save.zone as ZoneId;
    const survey=regionalSurvey(this.save,zone),trail=fieldTrail(this.save,zone),knownRegions=ZONE_IDS.filter(z=>regionKnown(this.save,z));
    const meaning=regionFieldGuide(zone,this.save.flags),lead=nextKnownFieldLead(survey.entries,zone,zone===this.save.zone?this.save.x:4,zone===this.save.zone?this.save.y:16);
    const leadPanel=`<div class="modal-content-block"><strong>BRÚJULA DE EXPLORACIÓN · ${htmlEscape(meaning.title)}</strong><p>POR QUÉ EXPLORAR · ${htmlEscape(meaning.purpose)}</p><p>QUÉ DESCUBRIRÁS · ${htmlEscape(meaning.payoff)}</p>${meaning.optional?'<p>EPÍLOGO OPCIONAL · La campaña principal ya tiene un final independiente.</p>':''}<p>PRÓXIMA PISTA CONOCIDA · ${lead?htmlEscape(lead.label)+' — '+htmlEscape(lead.hint):'Sigue los caminos y descubre otros lugares; el diario no revela destinos ocultos.'}</p>${lead?'<button id="fieldLead">SEGUIR PRÓXIMA PISTA</button>':''}</div>`;
    const trailPanel=trail?`<div class="modal-content-block"><strong>RUTA DEL PEREGRINO · ${htmlEscape(trail.title)} · ${trail.done}/3 HUELLAS</strong><p>${htmlEscape(trail.opening)}</p>${trail.acts.map((a,i)=>`<div class="modal-option"><div><strong>${a.done?'✓':a.known?'◇':'?'} ${i+1}. ${htmlEscape(a.title)}</strong><small>${a.done?htmlEscape(a.meaning):a.known?htmlEscape(a.objective?.hint??''): 'Busca esta huella explorando; su posición sigue oculta.'}</small></div>${a.objective?.trackable&&!a.done?`<button data-trail-target="${a.objective.id}">SEGUIR</button>`:`<span class="quest-state ${a.done?'done':''}">${a.done?'RESUELTO':a.known?'POR RESOLVER':'POR DESCUBRIR'}</span>`}</div>`).join('')}<p>${trail.claimed?'RUTA COMPLETADA · '+htmlEscape(trail.resolution):trail.done===3?htmlEscape(trail.resolution):'Recoge tres huellas reales de la región. El reconocimiento no exige combates ni lugares nuevos.'}</p><p>${trail.claimed?'RECONOCIMIENTO YA RECLAMADO · Consulta tus reliquias en Equipo.':'RECONOCIMIENTO ÚNICO · +'+trail.echoes+' Ecos · '+htmlEscape(fieldTrailRewardName(this.save,zone))+'. Equipa la reliquia desde Equipo.'}</p><p>${trailClaimRefusal(this.save,zone)??'Ya puedes reclamar en esta Lumbre.'}</p><button id="claimFieldTrail" ${trail.ready&&!trailClaimRefusal(this.save,zone)?'':'disabled'}>${trail.claimed?'✓ RUTA COMPLETADA':'RECLAMAR RUTA EN LUMBRE'}</button></div>`:'';
    const rows=survey.entries.map(o=>`<div class="modal-option"><div><strong>${o.done?'✓ ':o.known?'◇ ':'? '}${htmlEscape(o.label)}</strong><small>${htmlEscape(o.hint)}</small></div>${o.trackable?`<button data-field-target="${o.id}" ${this.save.fieldTarget?.zone===zone&&this.save.fieldTarget.id===o.id?'aria-pressed="true"':''}>SEGUIR</button>`:`<span class="quest-state ${o.done?'done':''}">${o.done?'RESUELTO':o.known?'REQUISITOS PENDIENTES':'POR DESCUBRIR'}</span>`}</div>`).join('');
    this.showModal('DIARIO DE CAMPO · '+ZONES[zone].name.toUpperCase(),
      `<div class="field-regions">${knownRegions.map(z=>`<button data-field-region="${z}" aria-pressed="${z===zone}">${htmlEscape(ZONES[z].name)}</button>`).join('')}</div>`+
      leadPanel+trailPanel+`<div class="modal-content-block"><strong>${survey.done}/${survey.total} OBJETIVOS RESUELTOS</strong><p>Los lugares sin descubrir ocultan su identidad y su posición. Seguir un objetivo conserva la selección al recargar y guía por portales transitables.</p>${this.save.fieldTarget?'<button id="clearFieldTarget">CANCELAR OBJETIVO GUARDADO</button>':''}</div>`+rows+
      `<div class="modal-content-block"><strong>RECONOCIMIENTO DE ${htmlEscape(ZONES[zone].name.toUpperCase())}</strong><p>Completa los objetivos de esta región: +${survey.reward.echoes} Ecos, +${survey.reward.seals} Sello y +${survey.reward.tonics} Tónico. Una vez por viaje.</p><button id="claimRegionSurvey" ${survey.ready?'':'disabled'}>${survey.claimed?'✓ RECOMPENSA RECLAMADA':'RECLAMAR RECONOCIMIENTO'}</button></div>`+
      `<div class="modal-option"><button id="fieldMap">VER MAPA ACTUAL</button><button id="fieldLumbres">RED DE LUMBRES</button></div>`);
    for(const b of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-field-region]'))b.onclick=()=>this.openFieldJournal(b.dataset.fieldRegion as ZoneId);
    for(const b of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-field-target]'))b.onclick=()=>this.setFieldTarget({zone,id:b.dataset.fieldTarget!});
    for(const b of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-trail-target]'))b.onclick=()=>this.setFieldTarget({zone,id:b.dataset.trailTarget!});
    if(trail)byId('claimFieldTrail').onclick=()=>this.claimFieldTrail(zone);
    const suggest=byId('modalContent').querySelector<HTMLButtonElement>('#fieldLead');if(suggest&&lead)suggest.onclick=()=>this.setFieldTarget({zone,id:lead.id});
    const clear=byId('modalContent').querySelector<HTMLButtonElement>('#clearFieldTarget');if(clear)clear.onclick=()=>{if(this.clearFieldTarget())this.openFieldJournal(zone);};
    byId('claimRegionSurvey').onclick=()=>this.claimSurvey(zone);byId('fieldMap').onclick=()=>this.openMap();byId('fieldLumbres').onclick=()=>this.openLumbreNetwork();
    this.modalBack=()=>this.openQuests();
  }
  private openLumbreNetwork(){
    if(!this.started||this.battle||this.dialogOpen||this.evolution||this.save.dungeon?.active)return;
    const known=ZONE_IDS.filter(z=>this.flag('altar-'+z)&&regionUnlocked(this.save,z));
    this.showModal('RED DE LUMBRES',`<div class="modal-content-block"><strong>VIAJE ENTRE LUMBRES VISITADAS</strong><p>Viaja gratis desde una Lumbre en la que hayas descansado. Primero debes alcanzar cada destino caminando y superar sus puertas narrativas. Viajar no cura, concede suministros ni permite escapar de una expedición o cripta.</p></div>`+
      known.map(zone=>{const reason=travelRefusal(this.save,zone);return `<div class="modal-option"><div><strong>${htmlEscape(ZONES[zone].name)}</strong><small>${reason??'LUMBRE VISITADA · VIAJE DISPONIBLE'}</small></div><button data-lumbre-travel="${zone}" ${reason?'disabled':''}>VIAJAR</button></div>`;}).join('')+
      '<div class="modal-option"><button id="lumbreJournal">← DIARIO DE CAMPO</button></div>');
    for(const b of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-lumbre-travel]'))b.onclick=()=>this.travelLumbre(b.dataset.lumbreTravel as ZoneId);
    byId('lumbreJournal').onclick=()=>this.openFieldJournal();this.modalBack=()=>this.openFieldJournal();
  }
  private travelLumbre(destination:ZoneId):boolean{
    const next=planLumbreTravel(this.save,destination);if(!next||!this.commitFieldState(next))return false;
    this.atlasTarget=null;this.cameraZone='';this.lastReveal=-1;this.encounterCooldown=5;this.resetJoystick();this.keys.clear();this.hideModal();
    this.sound.setScene(themeForZone(destination));this.sound.portal();this.updateUI();this.toast('LUMBRE · '+ZONES[destination].name.toUpperCase());return true;
  }
  private openMap(){if(!this.started)return;if(this.save.dungeon?.active){this.openDungeonAtlas();return;}
    const zone=this.save.zone as ZoneId;
    const known=(x:number,y:number)=>isDiscovered(this.save.discovered,zone,x,y,!this.save.worldSeed);
    const rects:string[]=[];
    const colors:Record<string,string>={unknown:'#0d1820',path:'#98806a',ground:'#2d4145',grass:'#5b7763',tree:'#203b33',stone:'#59626c',water:'#235461',wall:'#161f30'};
    for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){
      const tile=known(x,y)?terrain(zone,x,y):'unknown';
      rects.push('<rect x="'+(x*8)+'" y="'+(y*8)+'" width="8" height="8" fill="'+(colors[tile]||'#17212a')+'"/>');
    }
    const visibleSites=ZONES[zone].landmarks.filter(l=>known(l.x,l.y));
    const landmarkIcons:Record<string,string>={npc:'◆',altar:'✦',portal:'⇨',chest:'▣',rune:'✧',guardian:'♜',memory:'◇',verdict:'⚖'};
    const completedSites=new Set(regionalObjectives(this.save,zone).filter(o=>o.done&&o.x!==undefined).map(o=>o.x+':'+o.y));
    const pins=visibleSites.map(l=>'<text x="'+((l.x+.5)*8)+'" y="'+((l.y+.5)*8+3)+'" text-anchor="middle" font-size="13" font-weight="bold" fill="#f2d9ac" stroke="#101820" stroke-width=".8" paint-order="stroke">'+(completedSites.has(l.x+':'+l.y)?'✓':landmarkIcons[l.kind]||'•')+'</text>').join('');
    const tracked=resolveFieldTarget(this.save);
    const selected=this.atlasTarget?.zone===zone?this.atlasTarget:tracked?.zone===zone&&tracked.x!==undefined?{x:tracked.x,y:tracked.y!,label:tracked.label}:null;
    const route=selected?walkableRouteToTarget({zone,x:this.save.x,y:this.save.y,inDungeon:false},selected):null;
    const routeInk=(route??[]).slice(1).map((p,i)=>{
      const prior=route![i]!;
      if(!known(prior.x,prior.y)||!known(p.x,p.y))return '';
      return '<line x1="'+((prior.x+.5)*8)+'" y1="'+((prior.y+.5)*8)+'" x2="'+((p.x+.5)*8)+'" y2="'+((p.y+.5)*8)+'" stroke="#f6d292" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 3"/>';
    }).join('');
    const targetPin=selected&&known(selected.x,selected.y)?'<circle cx="'+((selected.x+.5)*8)+'" cy="'+((selected.y+.5)*8)+'" r="8" fill="none" stroke="#f6d292" stroke-width="2"/>':'';
    const avatar='<circle cx="'+((this.save.x+.5)*8)+'" cy="'+((this.save.y+.5)*8)+'" r="5" fill="#f8f0d2" stroke="#233d48" stroke-width="2"/>';
    const seed=String(this.save.worldSeed??0);
    const routeState=selected?'<div class="modal-content-block">DESTINO: '+htmlEscape(selected.label)+' · '+(route?(Math.max(0,route.length-1)+' pasos estimados'):'sin ruta transitable')+'. La línea ámbar solo muestra terreno que ya has descubierto. La brújula te guiará mientras caminas.</div>':'<div class="modal-content-block">Elige un lugar descubierto para fijar una ruta temporal. Puedes cambiarla o cancelarla sin modificar tu partida.</div>';
    const choices=visibleSites.map((site,i)=>'<div class="modal-option"><div><strong>'+htmlEscape(site.label)+'</strong><small>'+site.kind.toUpperCase()+' · '+Math.round(Math.hypot(site.x-this.save.x,site.y-this.save.y))+' casillas en línea recta</small></div><button data-atlas-target="'+i+'" '+(selected?.x===site.x&&selected?.y===site.y?'aria-pressed="true"':'')+'>GUIAR</button></div>').join('');
    const clear=selected?'<div class="modal-option"><button data-atlas-clear="1">CANCELAR RUTA PERSONALIZADA</button></div>':'';
    this.showModal('ATLAS · '+ZONES[zone].name.toUpperCase(),
      '<div class="azur-map-intro">Terreno descubierto: '+(this.save.worldSeed?discoveredPercent(this.save.discovered,zone):100)+' %. Los senderos aparecen conforme exploras. Ámbar = transitable; bosque oscuro = barrera.</div>'+
      '<svg class="azur-cartography" viewBox="0 0 '+(WORLD_W*8)+' '+(WORLD_H*8)+'" role="img" aria-label="Mapa de caminos, obstáculos, lugares, ruta y posición del jugador">'+rects.join('')+routeInk+pins+targetPin+avatar+'</svg>'+
      '<div class="azur-map-legend"><span>● TU POSICIÓN</span><span>━ SENDERO</span><span>◆ PERSONAJES</span><span>✦ PUNTOS DE INTERÉS</span></div>'+
      routeState+choices+clear+
      '<div class="modal-option"><button id="atlasFieldJournal">DIARIO REGIONAL · OBJETIVOS Y RECOMPENSAS</button></div>'+
      '<div class="azur-map-seed">SEMILLA DEL MUNDO: <strong>'+seed+'</strong><br><small>El mapa permanece idéntico al continuar o importar esta partida.</small></div>');
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-atlas-target]'))button.onclick=()=>{
      const index=Number(button.dataset.atlasTarget),site=visibleSites[index];if(!site)return;
      this.atlasTarget={zone,x:site.x,y:site.y,label:site.label};
      this.hideModal();this.updateStoryCompass();this.toast('RUTA PERSONALIZADA ACTIVADA');
    };
    byId('atlasFieldJournal').onclick=()=>this.openFieldJournal(zone);
    const cancel=byId('modalContent').querySelector<HTMLButtonElement>('[data-atlas-clear]');
    if(cancel)cancel.onclick=()=>{if(!this.atlasTarget&&this.save.fieldTarget&&!this.clearFieldTarget())return;this.atlasTarget=null;this.hideModal();this.updateStoryCompass();this.toast('GUÍA DE HISTORIA RESTAURADA');};
  }
  private chooseLeader(uid:string):boolean{
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    const at=this.save.team.findIndex(c=>c.uid===uid);if(at<0||this.save.team[at]!.hp<=0)return false;
    const next={...this.save,team:[this.save.team[at]!,...this.save.team.filter((_,i)=>i!==at)]};
    return this.commitFieldState(next);
  }
  private openTeam(){
    if(!this.started||this.evolution||this.battle||this.dialogOpen||!byId('starterScreen').classList.contains('hidden'))return;
    const threat=storyThreat(this.save.flags);
    const display=(c:Creature)=>{const sp=SPECIES[c.speciesId]!,bond=bondChoice(this.save.flags,c.speciesId);const scout=threat?tacticalProfile(c,threat,this.save.flags):null;return `<strong style="color:${sp.color}">${htmlEscape(sp.name)}</strong> · NV ${c.level}<small>${htmlEscape(sp.element)} · HP ${c.hp}/${maxHp(c)} · ${htmlEscape(sp.title)}</small><small>${c.uid===this.save.primaryUid?"COMPAÑERO PRINCIPAL · PROTEGIDO EN LA CRIPTA":"COMPAÑERO · MUERTE PERMANENTE EN LA CRIPTA"}</small>${this.creatureStatsMarkup(c)}<small>IDENTIDAD TÁCTICA · ${htmlEscape(creatureRole(c))}</small>${scout?`<small>CONTRA ${htmlEscape(SPECIES[threat!.speciesId]!.name.toUpperCase())} · ${htmlEscape(scout.summary)}</small>`:''}<small>RELIQUIA · ${c.equipment?htmlEscape(RELICS[c.equipment].name):'SIN EQUIPAR'}</small>${bond?`<small>✦ JURAMENTO · ${bond==='fang'?'FILO +4 DAÑO':'VELO −15% DAÑO'}</small>`:''}`;};
    this.showModal('VÍNCULOS Y RESERVA',
      `<div class="modal-content-block">Selecciona un líder, devuelve criaturas a la reserva o intercámbialas. ${this.save.team.length}/6 en equipo · ${this.save.storage.length} en reserva.</div>`+
      this.save.team.map((c,i)=>`<div class="modal-option"><div>${display(c)}</div><div class="roster-buttons">${`<button data-skills="${htmlEscape(c.uid)}">HABILIDADES</button><button data-relics="${htmlEscape(c.uid)}">RELIQUIA</button>`}${i?`<button data-lead="${htmlEscape(c.uid)}">LÍDER</button>`:'<span class="eyebrow">LÍDER</span>'}${this.save.team.length>1&&c.uid!==this.save.primaryUid?`<button data-deposit="${htmlEscape(c.uid)}">RESERVAR</button>`:''}</div></div>`).join('')+
      `<div class="modal-content-block">RESERVA · ${this.save.storage.length} VÍNCULOS</div>`+
      (this.save.storage.length?this.save.storage.map(c=>`<div class="modal-option"><div>${display(c)}</div><button data-withdraw="${htmlEscape(c.uid)}">${this.save.team.length<6?'INCORPORAR':'INTERCAMBIAR'}</button></div>`).join(''):'<div class="modal-content-block">No hay criaturas en reserva.</div>')+this.fallenMarkup());
    const content=byId('modalContent');
    for(const button of content.querySelectorAll<HTMLButtonElement>('[data-relics]'))button.onclick=()=>this.openRelics(button.dataset.relics!);
    for(const button of content.querySelectorAll<HTMLButtonElement>('[data-skills]'))button.onclick=()=>this.openSkills(button.dataset.skills!);
    for(const button of content.querySelectorAll<HTMLButtonElement>('[data-lead]'))button.onclick=()=>{
      if(!this.chooseLeader(button.dataset.lead!))return;this.hideModal();this.openTeam();this.updateUI();
    };
    for(const button of content.querySelectorAll<HTMLButtonElement>('[data-deposit]'))button.onclick=()=>{
      try{const result=reserveCreature(this.save,button.dataset.deposit!);this.save.team=result.team;this.save.storage=result.storage;
        this.sound.select();this.saveNow(false);this.hideModal();this.openTeam();this.updateUI();}catch{this.toast('NO SE PUEDE RESERVAR');}
    };
    for(const button of content.querySelectorAll<HTMLButtonElement>('[data-withdraw]'))button.onclick=()=>{
      const uid=button.dataset.withdraw!;
      if(this.save.team.length>=6){this.openRosterSwap(uid);return;}
      try{const result=transferStoredCreature(this.save,uid);this.save.team=result.team;this.save.storage=result.storage;
        this.sound.pick();this.saveNow(false);this.hideModal();this.openTeam();this.updateUI();}catch{this.toast('NO SE PUEDE INCORPORAR');}
    };
  }
  private creatureStatsMarkup(c:Creature){
    const species=SPECIES[c.speciesId]!,values={hp:maxHp(c),attack:attackValue(c),defense:defenseValue(c),speed:speedValue(c)};
    const bases={hp:species.stats.hp+(c.level-1)*4,attack:species.stats.attack+Math.floor(c.level*1.6),defense:species.stats.defense+Math.floor(c.level*1.2),speed:species.stats.speed+c.level};
    const names={hp:'VIDA',attack:'ATAQUE',defense:'DEFENSA',speed:'VELOCIDAD'};
    return '<small>ATRIBUTOS · POTENCIAL INDIVIDUAL FIJO 0–31</small>'+ATTRIBUTE_KEYS.map(k=>{const range=individualRange(bases[k]);return `<small>${names[k]} ${values[k]} · RANGO ${range.min}–${range.max} · POTENCIAL ${c.potential?.[k]??16}/31</small>`;}).join('');
  }
  private fallenMarkup(){return this.save.fallen?.length?'<div class="modal-content-block"><strong>MEMORIAL · VÍNCULOS PERDIDOS EN LA CRIPTA</strong>'+this.save.fallen.map(c=>`<p>${htmlEscape(SPECIES[c.speciesId]!.name)} · NV ${c.level} · PÉRDIDA DEFINITIVA</p>`).join('')+'</div>':'';}
  private relicShopMarkup(){
    return `<div class="modal-content-block"><strong>RELIQUIAS · UNA POR CRIATURA</strong><p>Equipa en Vínculos → Reliquia. Las copias equipadas también cuentan como propiedad; no se consumen ni se acumulan sus efectos.</p>${!this.flag('relic-mara-gift')?'<button id="relicGift">REGALO DE MARA · AMPARO DEL PEREGRINO</button>':''}</div>`+
      RELIC_IDS.map(id=>`<div class="modal-option"><div><strong>${RELICS[id].name}</strong><small>${RELICS[id].description}</small><small>${this.save.relics?.[id]??0} EN PROPIEDAD · ${freeRelicCopies(this.save,id)} LIBRES</small></div><button data-buy-relic="${id}" ${this.economy.echoes<RELICS[id].cost||(this.save.relics?.[id]??0)>=RELIC_COPY_LIMIT?'disabled':''}>${RELICS[id].cost} ECOS</button></div>`).join('');
  }
  private claimRelicGift(){
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    if(!grantRelic(this.save,'pilgrim-ward','relic-mara-gift'))return false;
    this.sound.pick();this.saveNow(false);this.openShop();this.updateUI();return true;
  }
  private purchaseRelic(id:RelicId){
    if(!this.started||this.battle||this.dialogOpen||this.evolution||!buyRelic(this.save,id))return false;
    recordJourney(this.save,'echoesSpent',RELICS[id].cost);this.sound.pick();this.saveNow(false);this.openShop();this.updateUI();return true;
  }
  private equipRelic(uid:string,id:RelicId|null){
    if(!this.started||this.battle||this.dialogOpen||this.evolution||!setCreatureRelic(this.save,uid,id))return false;
    this.sound.select();this.saveNow(false);this.openRelics(uid);this.updateUI();return true;
  }
  private openRelics(uid:string){
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return;
    const creature=this.save.team.find(c=>c.uid===uid);if(!creature)return;
    const threat=storyThreat(this.save.flags),recommendation=threat?relicUpgrade(creature,threat,this.save.flags,this.save):null;
    this.showModal('RELIQUIA · '+SPECIES[creature.speciesId]!.name.toUpperCase(),
      `<div class="modal-content-block">Una ranura; cambios gratuitos fuera de combate. Las reliquias se encuentran en cofres o se compran a Mara. Actual: <strong>${creature.equipment?RELICS[creature.equipment].name:'NINGUNA'}</strong>.</div><div class="modal-content-block">ELECCIÓN TÁCTICA · ${threat?'CONTRA '+htmlEscape(SPECIES[threat.speciesId]!.name):'SIN JEFE INMEDIATO'} · ${recommendation?htmlEscape(recommendation.reason):'No hay una reliquia libre con mejora numérica contra el próximo jefe.'}</div>`+
      RELIC_IDS.map(id=>`<div class="modal-option"><div><strong>${RELICS[id].name}</strong><small>${RELICS[id].description}</small><small>${freeRelicCopies(this.save,id)} COPIAS LIBRES</small></div><button data-equip-relic="${id}" ${creature.equipment!==id&&freeRelicCopies(this.save,id)<1?'disabled':''}>${creature.equipment===id?'EQUIPADA':'EQUIPAR'}</button></div>`).join('')+
      `<div class="modal-option"><button id="unequipRelic" ${creature.equipment?'':'disabled'}>RETIRAR RELIQUIA</button><button id="relicBack">← EQUIPO</button></div>`);
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-equip-relic]'))button.onclick=()=>this.equipRelic(uid,button.dataset.equipRelic as RelicId);
    byId('unequipRelic').onclick=()=>this.equipRelic(uid,null);byId('relicBack').onclick=()=>this.openTeam();this.modalBack=()=>this.openTeam();
  }
  private openSkills(uid:string){
    const creature=this.save.team.find(c=>c.uid===uid);if(!creature)return;
    const sp=SPECIES[creature.speciesId]!;const unlocked=unlockedMoves(creature);const threat=storyThreat(this.save.flags);const advice=threat?loadoutUpgrade(creature,threat,this.save.flags):null;
    this.showModal(`HABILIDADES · ${sp.name.toUpperCase()}`,`<div class="modal-content-block">NV ${creature.level} · ${sp.element} · Elige cuatro técnicas como máximo. Cambiar tu repertorio fuera de combate no consume Ecos.</div><div class="modal-content-block">PREPARACIÓN CONTRA ${threat?htmlEscape(SPECIES[threat.speciesId]!.name.toUpperCase()):'DESAFÍOS ABIERTOS'} · ${advice?htmlEscape(advice.reason):'No hay una mejora ofensiva desbloqueada y superior para el próximo jefe.'}</div>`+
      Array.from({length:4},(_,index)=>{const id=creature.moves[index];return `<div class="modal-option"><div><strong>${id?htmlEscape(MOVES[id]!.name):"RANURA VACÍA"}</strong><small>${id?htmlEscape(MOVES[id]!.description):"Activa una técnica del repertorio."}</small></div><button data-skill-slot="${index}" ${index>creature.moves.length?'disabled':''}>CAMBIAR</button></div>`;}).join('')+
      `<div class="modal-content-block">Técnicas conocidas: ${unlocked.length}. Las técnicas aprendidas no se olvidan. Elige hasta cuatro activas; puedes cambiarlas gratis fuera de combate.</div><div class="modal-option"><button id="skillBack">← EQUIPO</button></div>`);
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-skill-slot]'))button.onclick=()=>this.openSkillChoices(uid,Number(button.dataset.skillSlot));
    byId('skillBack').onclick=()=>{this.hideModal();this.openTeam();};
    this.modalBack=()=>this.openTeam();
  }
  private activateTechnique(uid:string,index:number,id:string):boolean{
    if(!this.started||this.battle||this.dialogOpen||this.evolution)return false;
    const at=this.save.team.findIndex(c=>c.uid===uid);if(at<0)return false;
    try{this.save.team[at]=equipMove(this.save.team[at]!,index,id);this.saveNow(false);return true;}catch{return false;}
  }
  private openSkillChoices(uid:string,index:number){
    const creature=this.save.team.find(c=>c.uid===uid);if(!creature||!Number.isInteger(index)||index<0||index>creature.moves.length||index>=4)return;
    const known=unlockedMoves(creature),threat=storyThreat(this.save.flags);
    this.showModal('CAMBIAR TÉCNICA',`<div class="modal-content-block">Ranura ${index+1} · Técnica actual: ${(creature.moves[index]?htmlEscape(MOVES[creature.moves[index]!]!.name):'VACÍA')}. Algunas técnicas curan, drenan salud o limpian alteraciones.</div>`+
      known.map(id=>`<div class="modal-option"><div><strong>${htmlEscape(MOVES[id]!.name)}</strong><small>${htmlEscape(MOVES[id]!.description)} · ${MOVES[id]!.role||'ATAQUE'} · PODER ${MOVES[id]!.power}</small>${threat&&MOVES[id]!.power>0?`<small>VS ${htmlEscape(SPECIES[threat.speciesId]!.name)} · ${htmlEscape(tacticalProfile({...creature,moves:[id]},threat,this.save.flags).summary)}</small>`:''}</div><button data-equip-move="${id}" ${creature.moves.includes(id)&&creature.moves[index]!==id?'disabled':''}>${creature.moves[index]===id?'EQUIPADA':'EQUIPAR'}</button></div>`).join('')+
      '<div class="modal-option"><button id="skillChoicesBack">← VOLVER</button></div>');
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-equip-move]'))button.onclick=()=>{
      const at=this.save.team.findIndex(c=>c.uid===uid);if(at<0)return;
      if(this.activateTechnique(uid,index,button.dataset.equipMove!)){this.sound.select();this.openSkills(uid);this.updateUI();}else this.toast('HABILIDAD NO DISPONIBLE');
    };
    byId('skillChoicesBack').onclick=()=>this.openSkills(uid);
    this.modalBack=()=>this.openSkills(uid);
  }
  private openRosterSwap(storedUid:string){
    const stored=this.save.storage.find(c=>c.uid===storedUid);if(!stored)return;
    this.showModal('INTERCAMBIAR VÍNCULO',`<div class="modal-content-block">El equipo está completo. Elige quién regresará a la reserva para incorporar a ${htmlEscape(SPECIES[stored.speciesId]!.name)}.</div>`+
      this.save.team.map(c=>`<div class="modal-option"><div><strong>${htmlEscape(SPECIES[c.speciesId]!.name)}</strong><small>NV ${c.level} · ${c.hp}/${maxHp(c)} HP</small></div><button data-swap-for="${htmlEscape(c.uid)}" ${c.uid===this.save.primaryUid?'disabled':''}>${c.uid===this.save.primaryUid?'PRINCIPAL':'CAMBIAR'}</button></div>`).join('')+'<div class="modal-option"><button id="rosterBack">← VOLVER</button></div>',true);
    for(const button of byId('modalContent').querySelectorAll<HTMLButtonElement>('[data-swap-for]'))button.onclick=()=>{
      try{const result=transferStoredCreature(this.save,storedUid,button.dataset.swapFor);this.save.team=result.team;this.save.storage=result.storage;
        this.sound.pick();this.saveNow(false);this.hideModal();this.openTeam();this.updateUI();}catch{this.toast('INTERCAMBIO NO DISPONIBLE');}
    };
    byId('rosterBack').onclick=()=>{this.hideModal();this.openTeam();};
    this.modalBack=()=>this.openTeam();
  }
  private openBag(){if(!this.started||this.evolution||this.battle||this.dialogOpen||!byId('starterScreen').classList.contains('hidden'))return;this.showModal('MOCHILA DEL PORTADOR',`<div class="modal-content-block">Objetos recuperados entre las ruinas de Azur. · ✦ ${this.economy.echoes} ECOS</div><div class="modal-option"><div><strong>◇ Sellos de Vínculo</strong> × ${this.save.inventory.seals}<small>Permiten capturar criaturas debilitadas durante el combate.</small></div></div><div class="modal-option"><div><strong>✚ Tónicos</strong> × ${this.save.inventory.tonics}<small>Recuperan 28 HP en combate, o 33 con Cuenta de Lumbre.</small></div></div><div class="modal-content-block">Descansa en las Lumbres para curar al equipo. Cada región entrega un sello solo en la primera visita. Los cofres contienen suministros y reliquias finitos.</div>`+RELIC_IDS.map(id=>`<div class="modal-option"><div><strong>${RELICS[id].name} × ${this.save.relics?.[id]??0}</strong><small>${RELICS[id].description}</small><small>${freeRelicCopies(this.save,id)} LIBRES · EQUIPAR EN VÍNCULOS</small></div></div>`).join(''));}
  /** Measurement begins only after explicit player consent and stays in memory. */
  private openEnduranceLab(){
    const report=this.endurance.report();
    const rows=(Object.entries(report.phases) as [EndurancePhase,typeof report.phases.explore][])
      .map(([phase,data])=>`<div class="modal-option"><div><strong>${htmlEscape(phase.toUpperCase())}</strong><small>${data.frames} frames · ${data.sampledSeconds}s medidos · ${data.averageFps} FPS promedio · p95 ≤${data.p95UpperBoundMs}ms (histograma) · ${data.slowPercent}% lentos</small></div></div>`).join('');
    this.showModal('LABORATORIO DE ESTABILIDAD',`
      <div class="modal-content-block"><strong>MEDICIÓN LOCAL Y VOLUNTARIA</strong><p>Prueba una partida durante varios minutos recorriendo regiones, abriendo menús, entrando en combate y usando la cripta. El registro mide intervalos de fotogramas visibles (hilo principal), no tiempos GPU, temperatura, consumo de batería ni rendimiento Android certificado. No se envía ningún dato.</p><p>Estado: ${report.status==='recording'?'REGISTRANDO':'DETENIDO'} · ${report.totalFrames} frames · ${report.sampledSeconds}s de intervalos observados · ${report.orientationChanges} cambios de orientación · ${report.ignoredFrames} intervalos descartados.</p></div>
      ${rows}
      <div class="modal-content-block"><strong>CIERRE DE COMBATE</strong> · Vict.: ${report.transitions.victory.events} / Capt.: ${report.transitions.capture.events} / Der.: ${report.transitions.defeat.events} · Coste máximo ${Math.max(...Object.values(report.transitions).map(s=>s.maxWorkMs))} ms · Fotogramas lentos posteriores ${Object.values(report.transitions).reduce((sum,s)=>sum+s.slowFrames,0)}.</div>
      <div class="modal-content-block">La medición permanece solo en memoria durante esta sesión. Puedes reiniciarla o exportar el resultado manualmente. No cambia el guardado ni necesita permisos adicionales.</div>
      <div class="settings-row"><button id="labStart">${report.status==='recording'?'REINICIAR MEDICIÓN':'INICIAR MEDICIÓN'}</button><button id="labStop" ${report.status!=='recording'?'disabled':''}>DETENER</button><button id="labExport" ${report.totalFrames===0?'disabled':''}>EXPORTAR JSON LOCAL</button></div>
      <div class="settings-row"><button id="labBack">← VOLVER A OPCIONES</button></div>`,true,true);
    byId('labStart').onclick=()=>{this.endurance.start();this.openEnduranceLab();};
    byId('labStop').onclick=()=>{this.endurance.stop();this.openEnduranceLab();};
    byId('labExport').onclick=()=>this.exportEndurance();
    byId('labBack').onclick=()=>this.settings();
    this.modalBack=()=>this.settings();
  }
  private exportEndurance(){
    const r=this.endurance.report();
    if(!r.totalFrames){this.toast('INICIA UNA MEDICIÓN PRIMERO');return;}
    const payload={...r,presentation:this.renderer.presentationMetrics(),graphics:this.renderer.getGraphics().renderMode,renderer:this.renderer.mode,
      adaptiveGlyphs:this.adaptiveGlyphs.active,reducedMotion:this.reducedMotion,
      touchPoints:Math.min(20,Math.max(0,Number(navigator.maxTouchPoints)||0)),
      recordedAt:new Date().toISOString(),
      disclaimer:'Local voluntary performance evidence. No device identity, game seed, save data, battery or temperature collected. Hardware and human verification required.'};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download='ascii-azur-endurance.json';anchor.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    this.toast('REGISTRO EXPORTADO · SIN TELEMETRÍA REMOTA');
  }
  private settings(){
    if(this.dialogOpen||this.evolution||!byId('starterScreen').classList.contains('hidden'))return;
    this.sound.unlock();
    this.showModal('OPCIONES · GRÁFICOS Y ACCESIBILIDAD',`<div class="modal-content-block">Representación de glifos en tiempo real. La densidad y el tamaño del glifo son independientes. Los ajustes se aplican en tiempo real al renderizador ${this.renderer.mode==='gpu'?'WebGL2':'Canvas2D'} y permanecen guardados.</div>
      <div class="settings-row"><label for="renderModeSelect">Modo de representación</label><select id="renderModeSelect"><option value="ascii">ASCII ATMOSFÉRICO</option><option value="glyph-pixel">GLYPH PIXEL ART</option></select></div>
      <div class="settings-row" data-render-mode="glyph-pixel"><label for="pixelDetailSelect">Detalle Glyph Pixel Art</label><select id="pixelDetailSelect"><option value="fine">Fino</option><option value="balanced">Equilibrado</option><option value="chunky">Chunky</option></select></div>
      <div class="settings-row" data-render-mode="ascii"><label for="densitySelect">Densidad de caracteres</label><select id="densitySelect"><option value="0.18">Microscópica · máxima</option><option value="0.24">Ultra fina</option><option value="0.32">Muy alta · recomendada</option><option value="0.42">Alta</option><option value="0.56">Equilibrada</option><option value="0.85">Rendimiento</option><option value="1.2">Muy rápida</option></select></div>
      <div class="settings-row" data-render-mode="ascii"><label for="glyphScale">Tamaño de caracteres <output id="glyphScaleValue"></output></label><input id="glyphScale" type="range" min=".5" max="1.85" step=".05"></div>
      <div class="settings-row"><label for="glyphContrast">Contraste <output id="glyphContrastValue"></output></label><input id="glyphContrast" type="range" min=".65" max="1.8" step=".05"></div>
      <div class="settings-row" data-render-mode="ascii"><label for="glyphEdges">Definición de contornos <output id="glyphEdgesValue"></output></label><input id="glyphEdges" type="range" min=".5" max="2.4" step=".1"></div>
      <div class="settings-row"><label for="glyphBrightness">Luminosidad <output id="glyphBrightnessValue"></output></label><input id="glyphBrightness" type="range" min="-.25" max=".25" step=".05"></div>
      <div class="settings-row" data-render-mode="ascii"><label for="qualitySelect">Paleta cromática</label><select id="qualitySelect"><option value="1">Color atmosférico</option><option value="0.4">Color limitado</option></select></div>
      <div class="modal-content-block" id="glyphStats" aria-live="polite"></div>
      <div class="settings-row"><label for="adaptiveFps">FPS estables · ajustar detalle automáticamente</label><input id="adaptiveFps" type="checkbox"></div>
      <div class="modal-content-block" id="adaptiveFpsStats" aria-live="polite"></div>
      <div class="settings-row"><button id="resetGraphics" class="settings-reset">Restablecer gráficos</button></div>
      <div class="settings-row"><button id="openEnduranceLab">LABORATORIO DE ESTABILIDAD · FPS Y ORIENTACIÓN</button></div>
      <div class="modal-content-block">En GLYPH PIXEL ART cada celda pinta un fondo continuo y un glifo con color propio. El modo atmosférico reduce trazos direccionales repetitivos. WebGL2 ofrece la trama más fina; Canvas2D limita el trabajo para mantener la partida fluida.</div>
      <div class="settings-row"><label for="audioEnabled">Audio activado</label><input id="audioEnabled" type="checkbox"></div>
       <div class="settings-row"><label for="musicVolume">Música</label><input id="musicVolume" type="range" min="0" max="100" step="1"></div>
      <div class="settings-row"><label for="effectsVolume">Efectos</label><input id="effectsVolume" type="range" min="0" max="100" step="1"></div>
      <div class="settings-row"><label for="audioMixProfile">Mezcla de audio</label><select id="audioMixProfile" aria-describedby="audioMixDescription"><option value="balanced">Equilibrada · banda sonora original</option><option value="clarity">Señales claras · menos ambiente</option><option value="night">Nocturna · transitorios suaves</option></select></div>
      <div class="modal-content-block" id="audioMixDescription">Cambia el balance y el brillo del sonido, sin modificar las opciones de volumen ni el progreso de la partida.</div>
      <div class="settings-row"><label for="motionReduced">Reducir movimiento</label><input id="motionReduced" type="checkbox"></div>
      <div class="settings-row"><label for="largeText">Texto ampliado</label><input id="largeText" type="checkbox"></div>
      <div class="settings-row"><label for="highContrast">Alto contraste · interfaz y texto</label><input id="highContrast" type="checkbox"></div>
      <div class="settings-row"><label for="leftHanded">Joystick a la derecha</label><input id="leftHanded" type="checkbox"></div>
      <div class="settings-row"><button id="returnTitle" class="settings-reset">GUARDAR Y VOLVER A SELECCIONAR VIAJE</button></div>`,true,true);
    const mus=byId<HTMLInputElement>('musicVolume'),fx=byId<HTMLInputElement>('effectsVolume');
    const audio=byId<HTMLInputElement>('audioEnabled');audio.checked=this.soundEnabled;
    audio.onchange=()=>{this.soundEnabled=audio.checked;this.sound.setEnabled(this.soundEnabled);this.updateMuteUi();this.storeAudioSettings();};
    mus.value=String(Math.round(this.sound.getMusicVolume()*100));fx.value=String(Math.round(this.sound.getEffectsVolume()*100));
    mus.oninput=()=>{this.sound.setMusicVolume(Number(mus.value)/100);this.storeAudioSettings();};
    fx.oninput=()=>{this.sound.setEffectsVolume(Number(fx.value)/100);this.storeAudioSettings();};
    const mix=byId<HTMLSelectElement>('audioMixProfile');mix.value=this.sound.getMixProfile();
    mix.onchange=()=>{this.sound.setMixProfile(mix.value);this.storeAudioSettings();};
    const den=byId<HTMLSelectElement>('densitySelect'),qual=byId<HTMLSelectElement>('qualitySelect');
    const renderMode=byId<HTMLSelectElement>('renderModeSelect'),pixelDetail=byId<HTMLSelectElement>('pixelDetailSelect');
    const sliders=[['glyphScale','glyphScale'],['glyphContrast','contrast'],['glyphEdges','edgeStrength'],['glyphBrightness','brightness']] as const;
    const sync=()=>{const g=this.renderer.getGraphics();den.value=String(g.density);qual.value=String(g.quality);renderMode.value=g.renderMode;pixelDetail.value=g.pixelDetail;
      for(const el of byId('modalContent').querySelectorAll<HTMLElement>('[data-render-mode]'))el.hidden=el.dataset.renderMode!==g.renderMode;
      this.updateGraphicsTheme();for(const [id,key] of sliders){byId<HTMLInputElement>(id).value=String(g[key]);byId(id+'Value').textContent=key==='brightness'?g[key].toFixed(2):g[key].toFixed(2)+'×';}
      const canvas=this.renderer.canvas,rect=canvas.getBoundingClientRect(),dpr=canvas.width/(rect.width||960);
      const base=Math.max(5,Math.min(10,(rect.width||960)/130))*dpr;
      const requested=glyphCell(base,g),actual=this.renderer.mode==='gpu'?requested:canvasGlyphCell(base,g,canvas.width,canvas.height);
      const target=glyphCount(canvas.width,canvas.height,requested),rendered=glyphCount(canvas.width,canvas.height,{width:Math.ceil(actual.width*this.renderer.performanceScale),height:Math.ceil(actual.height*this.renderer.performanceScale)});
      byId('glyphStats').textContent=`Trama ~${Math.round(rendered).toLocaleString('es-ES')} caracteres · glifo ${(actual.width*this.renderer.performanceScale).toFixed(1)} px · ${this.renderer.mode==='gpu'?'WebGL2':'Canvas2D'}${rendered<target?' · límite de rendimiento aplicado':''}`;
      byId('adaptiveFpsStats').textContent=this.adaptiveGlyphs.active?`Objetivo 30 FPS · escala temporal ×${this.renderer.performanceScale.toFixed(2)} · ajustes artísticos originales conservados`:'Máxima fidelidad manual. Activa FPS estables solo si el dispositivo pierde fluidez.';};
    const change=(patch:Partial<GraphicsProfile>)=>{
      this.renderer.setGraphics({...this.renderer.getGraphics(),...patch});this.storeGraphicSettings();
      // A player may select microscopic mode after launch. Re-evaluate the
      // protective first-run default but never override a stored manual choice.
      try{if(localStorage.getItem('ascii-azur-adaptive-fps-v1')===null){
        const profile=this.renderer.getGraphics(),touches=Number(navigator.maxTouchPoints)||0;
        const enabled=adaptiveDefault(touches,this.renderer.mode,profile);
        if(this.adaptiveGlyphs.active!==enabled){
          this.adaptiveGlyphs.configure(enabled,enabled?initialAdaptiveScale(touches,this.renderer.mode,profile):1);
          this.frameMetrics.reset();this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale);
        }
      }}catch{/* no storage: preserve present preference */}
      adaptive.checked=this.adaptiveGlyphs.active;sync();
    };
    renderMode.onchange=()=>change({renderMode:renderMode.value==='glyph-pixel'?'glyph-pixel':'ascii'});
    pixelDetail.onchange=()=>change({pixelDetail:pixelDetail.value==='fine'?'fine':pixelDetail.value==='chunky'?'chunky':'balanced'});
    den.onchange=()=>change({density:Number(den.value)});qual.onchange=()=>change({quality:Number(qual.value)});
    for(const [id,key] of sliders)byId<HTMLInputElement>(id).oninput=()=>change({[key]:Number(byId<HTMLInputElement>(id).value)});
    byId('resetGraphics').onclick=()=>change({...DEFAULT_GRAPHICS});
    byId('openEnduranceLab').onclick=()=>this.openEnduranceLab();
    const adaptive=byId<HTMLInputElement>('adaptiveFps');adaptive.checked=this.adaptiveGlyphs.active;adaptive.onchange=()=>{this.setAdaptiveGraphics(adaptive.checked);sync();};sync();
    const motion=byId<HTMLInputElement>('motionReduced');motion.checked=this.reducedMotion;
    motion.onchange=()=>{this.reducedMotion=motion.checked;try{localStorage.setItem('ascii-azur-reduced-motion',String(this.reducedMotion));}catch{/* storage blocked */}};
    const textSize=byId<HTMLInputElement>('largeText'),handed=byId<HTMLInputElement>('leftHanded'),contrast=byId<HTMLInputElement>('highContrast');
    textSize.checked=document.documentElement.classList.contains('azur-large-text');handed.checked=document.documentElement.classList.contains('azur-left-handed');contrast.checked=document.documentElement.classList.contains('azur-high-contrast');
    textSize.onchange=()=>{document.documentElement.classList.toggle('azur-large-text',textSize.checked);this.persistAccessibility();};
    handed.onchange=()=>{document.documentElement.classList.toggle('azur-left-handed',handed.checked);this.persistAccessibility();};
    contrast.onchange=()=>{document.documentElement.classList.toggle('azur-high-contrast',contrast.checked);this.persistAccessibility();};
    byId('returnTitle').onclick=()=>this.returnToTitle();
  }

  private showModal(title:string,body:string,allowIntro=false,allowBattle=false){
    if(this.evolution||(this.battle&&!allowBattle)||this.dialogOpen||(!allowIntro&&!byId('titleScreen').classList.contains('hidden'))||!byId('starterScreen').classList.contains('hidden'))return;
    const fromDrawer=byId('gameDrawer').classList.contains('open');
    if(!this.modalOpen)this.modalInvoking=fromDrawer?byId('drawerToggle'):document.activeElement as HTMLElement|null;
    this.modalBack=null;
    this.toggleDrawer(false);this.keys.clear();this.resetJoystick();this.modalOpen=true;
    byId('modalTitle').textContent=title;byId('modalContent').innerHTML=body;byId('modal').classList.remove('hidden');
    focusMenuFirst(byId('modal'));
  }
  /** Escape and gamepad Back return to the parent panel before dismissing the overlay. */
  private closeModalOrBack(){const back=this.modalBack;this.modalBack=null;if(back)back();else this.hideModal();}
  private hideModal(){this.modalOpen=false;this.modalBack=null;byId('modal').classList.add('hidden');this.keys.clear();this.modalInvoking?.focus?.();this.modalInvoking=null;}
  private updateHealthMeter(id:string,name:string,current:number,maximum:number){
    const node=byId(id);node.setAttribute('aria-label',`Vida de ${name}`);node.setAttribute('aria-valuemax',String(maximum));node.setAttribute('aria-valuenow',String(Math.max(0,current)));node.setAttribute('aria-valuetext',`${current} de ${maximum} puntos de vida`);
  }
  /** Explicit nonvisual world scan: no continual announcements while walking. */
  private describeCurrentRoute(){
    if(!this.started||this.battle||this.dialogOpen||this.modalOpen)return;
    this.updateStoryCompass();
    const direction=['norte','este','sur','oeste'][this.facing]??'sur';
    const objective=byId('storyCompass').textContent?.trim()||'Consulta el diario';
    const where=this.save.dungeon?.active?'Cripta de los Ecos':ZONES[this.save.zone as ZoneId].name;
    let passages='Consulta el mapa de la cripta';
    if(!this.save.dungeon?.active){
      const x=this.save.x,y=this.save.y,zone=this.save.zone as ZoneId;
      const open=[['norte',0,-1],['este',1,0],['sur',0,1],['oeste',-1,0]]
        .filter(([,dx,dy])=>!isBlocked(zone,x+(dx as number)*.85,y+(dy as number)*.85))
        .map(([name])=>name);
      passages=open.length?'Salidas cercanas: '+open.join(', '):'No hay salidas inmediatas';
    }
    this.announceAccessibility(`Orientación. ${where}. Mirando al ${direction}. ${passages}. Guía: ${objective}. Pulsa H para repetir la orientación.`);
  }
  private announceAccessibility(message:string){
    if(this.lastAccessibleMessage===message)return;
    this.lastAccessibleMessage=message;
    byId('accessibilityStatus').textContent=message;
  }
  private saveNow(notify:boolean):boolean{
    if(!this.started)return false;
    try{
      if(this.save.fieldTarget&&!resolveFieldTarget(this.save))delete this.save.fieldTarget;
      this.saveBaseline=writeSave(localStorage,this.save,this.saveBaseline,this.activeSlot);
      byId('saveStatus').textContent=`VIAJE ${this.activeSlot} GUARDADO · `+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
      if(notify)this.toast('EL RECUERDO HA SIDO CONSERVADO');
      return true;
    }catch(error){
      const conflict=error instanceof SaveConflictError;
      byId('saveStatus').textContent=conflict?'CONFLICTO ENTRE PESTAÑAS · EXPORTA TU PARTIDA':'GUARDADO FALLIDO · EXPORTA TU PARTIDA';
      if(notify)this.toast(conflict?'OTRA PESTAÑA MODIFICÓ LA PARTIDA · EXPORTA TU PROGRESO':'NO SE PUDO GUARDAR · EXPORTA TU PROGRESO');
      return false;
    }
  }
  /** Leave only after a durable save; another journey can then be selected safely. */
  private returnToTitle(){
    if(!this.started||!this.saveNow(true))return;
    this.atlasTarget=null;
    this.hideModal();this.toggleDrawer(false);this.keys.clear();this.resetJoystick();
    this.started=false;this.battle=null;this.evolution=null;this.combatCue=null;
    this.dialogOpen=false;this.dialogQueue=[];this.lastAccessibleMessage='';
    byId('battle').classList.add('hidden');byId('dialogue').classList.add('hidden');byId('starterScreen').classList.add('hidden');
    byId('viewport').classList.remove('in-battle','in-evolution','in-dungeon');
    byId('titleScreen').classList.remove('hidden');
    this.sound.setScene('title');this.loadState();focusMenuFirst(byId('titleScreen'));
  }
  private updateStoryCompass(){
    const node=byId('storyCompass');
    if(!this.started){node.classList.add('hidden');return;}
    if(this.atlasTarget){
      if(this.atlasTarget.zone!==this.save.zone)this.atlasTarget=null;
      else if(!this.save.dungeon?.active){
        const cue=guidanceToTarget({zone:this.atlasTarget.zone,x:this.save.x,y:this.save.y,inDungeon:false},this.atlasTarget,this.atlasTarget.label.toUpperCase());
        const content='ATLAS · '+cue.text;
        if(node.textContent!==content)node.textContent=content;
        node.classList.remove('hidden');node.classList.toggle('is-near',cue.kind==='interaction');return;
      }
    }
    const field=resolveFieldTarget(this.save);
    if(field&&!this.save.dungeon?.active){
      const portal=nextFieldPortal(this.save,field.zone),target=this.save.zone===field.zone?field:portal;
      const cue=target&&target.x!==undefined?guidanceToTarget({zone:this.save.zone as ZoneId,x:this.save.x,y:this.save.y,inDungeon:false},{x:target.x,y:target.y!,label:this.save.zone===field.zone?field.label:'HACIA '+ZONES[field.zone].name}):null;
      const text='DIARIO · '+(cue?.text??(field.kind==='crypt'?'MENÚ → CRIPTA EXPLORABLE':'CONSULTA EL DIARIO REGIONAL'));
      if(node.textContent!==text)node.textContent=text;node.classList.remove('hidden');node.classList.toggle('is-near',cue?.kind==='interaction');return;
    }
    if(this.flag('crown-trilogy-complete')&&!this.save.dungeon?.active){
      const overview=afterlightOverview(this.save),destination=overview.chapters.find(c=>c.done<c.total)?.zone;
      if(destination&&this.save.zone!==destination){const portal=nextFieldPortal(this.save,destination);const cue=portal?guidanceToTarget({zone:this.save.zone as ZoneId,x:this.save.x,y:this.save.y,inDungeon:false},portal,'VIGILIA · '+ZONES[destination].name.toUpperCase()):null;
        node.textContent=cue?.text??'VIGILIA · CONSULTA EL DIARIO';node.classList.remove('hidden');node.classList.toggle('is-near',cue?.kind==='interaction');return;}
    }
    if(this.save.zone==='ossuary'||this.save.zone==='garden'){
      const zone=this.save.zone,progress=afterlightProgress(zone,this.save.flags),chapter=AFTERLIGHT[zone];
      let target: {x:number;y:number;label:string}|undefined;
      if(!progress.met)target=ZONES[zone].landmarks.find(l=>l.kind==='npc');
      else if(progress.memories<2)target=ZONES[zone].landmarks.find(l=>l.kind==='memory'&&!this.flag(afterlightFlag(zone,'memory-'+l.npcId)));
      else if(progress.witnesses<3){const e=this.roamers().find(e=>!this.flag('roamer-'+e.id));if(e)target={x:e.x,y:e.y,label:SPECIES[e.speciesId]?.name||'TESTIGO ERRANTE'};}
      else if(!progress.complete)target=ZONES[zone].landmarks.find(l=>l.kind==='verdict');
      else target=ZONES[zone].landmarks.find(l=>l.kind=== (zone==='ossuary'?'portal':'npc')&&(zone!=='ossuary'||l.x>20));
      const label=target?.label||chapter.verdict;
      const cue=target?guidanceToTarget({zone,x:this.save.x,y:this.save.y,inDungeon:false},target,label.toUpperCase()):null;
      const content=progress.complete&&zone==='garden'?'✦ VIGILIA COMPLETA':cue?.text??'CONSULTA EL DIARIO';
      if(node.textContent!==content)node.textContent=content;
      node.classList.remove('hidden');node.classList.toggle('is-near',cue?.kind==='interaction');return;
    }
    const cue=storyGuidance(this.storyState,{zone:this.save.zone as ZoneId,x:this.save.x,y:this.save.y,inDungeon:!!this.save.dungeon?.active});
    if(node.textContent!==cue.text)node.textContent=cue.text;
    node.classList.remove('hidden');
    node.classList.toggle('is-near',cue.kind==='interaction'||cue.kind==='completed');
  }
  private updateUI(){if(this.save.team.length)this.focusTrail?.setTone(SPECIES[this.save.team[0]!.speciesId]?.color??'#d5ad79');this.updateStoryCompass();const z=ZONES[this.save.zone as ZoneId];byId('zoneName').textContent=this.save.dungeon?.active?'Cripta de los Ecos':z.name;byId('zoneSubtitle').textContent=this.save.dungeon?.active?`${chamberAt(this.save.dungeon,this.save.dungeon.x,this.save.dungeon.y).name} · SELLOS ${chamberProgress(this.save.dungeon).completed}/3`:z.subtitle;byId('locationChip').textContent=this.save.dungeon?.active?'CRIPTA DE LOS ECOS':z.name.toUpperCase();byId('teamCount').textContent=String(this.save.team.length);byId('echoCount').textContent=String(this.economy.echoes);byId('rosterNum').textContent=`${this.save.team.length}/6`;byId('roster').innerHTML=this.save.team.length?this.save.team.map(c=>{const s=SPECIES[c.speciesId]!;return `<div class="creature-row"><div class="creature-icon" style="color:${s.color}">${s.shape===0||s.shape===5?'♨':s.shape===2?'✣':s.shape===4?'✶':s.shape===6?'♜':'◈'}</div><div><strong>${htmlEscape(s.name)} <span style="color:#839da1;font:9px monospace">LV ${c.level}</span></strong><small>${s.element.toUpperCase()} · ${c.hp}/${maxHp(c)} HP</small><div class="mini-health"><div style="width:${c.hp/maxHp(c)*100}%"></div></div></div></div>`;}).join(''):'<div class="roster-empty">Aún no tienes vínculos.</div>';
  const step=arkenStoryIndex(this.storyState),beat=this.storyBeat();
  if(this.save.zone==='ossuary'||this.save.zone==='garden'){
    const p=afterlightProgress(this.save.zone,this.save.flags);
    byId('fragBar').style.width=(p.stage/5*100)+'%';
    byId('fragments').textContent=`${p.stage} / 5 HITOS DE LA VIGILIA`;
    byId('missionChip').textContent=p.complete?'VIGILIA REGISTRADA':p.objective.toUpperCase();
    byId('journalText').textContent=p.hint;
    byId('quest').innerHTML=`<div class="quest-icon">${p.complete?'✦':'◇'}</div><div><small>EPÍLOGO · ${p.stage}/5</small><strong>${htmlEscape(p.title)}</strong><span>${htmlEscape(p.objective)}</span></div>`;
  }else if(step===6&&this.flag('marsh-chapter-complete')){
    const end=crownProgress(this.save.flags);
    byId('fragBar').style.width=(end.stage/7*100)+'%';byId('fragments').textContent=`${end.stage} / 7 HITOS DE LA CORONA`;
    byId('missionChip').textContent=end.complete?'HISTORIA PRINCIPAL COMPLETADA':end.objective.toUpperCase();byId('journalText').textContent=end.hint;
    byId('quest').innerHTML=`<div class="quest-icon">${end.complete?'✦':'◇'}</div><div><small>${end.complete?'FINAL PRINCIPAL':'CAPÍTULO III · MISIÓN '+(end.stage+1)+'/7'}</small><strong>${htmlEscape(end.title)}</strong><span>${htmlEscape(end.objective)}</span></div>`;
  }else if(step===6){const marsh=marshChapterProgress(this.save.flags);
    byId('fragBar').style.width=(marsh.stage/6*100)+'%';
    byId('fragments').textContent=`${marsh.stage} / 6 HITOS DEL ESPEJO`;
    byId('missionChip').textContent=marsh.complete?'CAPÍTULO II COMPLETADO':marsh.objective.toUpperCase();
    byId('journalText').textContent=marsh.hint;
    byId('quest').innerHTML=`<div class="quest-icon">${marsh.complete?'✦':'◇'}</div><div><small>${marsh.complete?'CAPÍTULO II COMPLETADO':`CAPÍTULO II · MISIÓN ${marsh.stage+1}/6`}</small><strong>${htmlEscape(marsh.title)}</strong><span>${htmlEscape(marsh.objective)}</span></div>`;
  }else{
  byId('fragBar').style.width=(Math.min(step,6)/6*100)+'%';
  byId('fragments').textContent=`${Math.min(step,6)} / 6 HITOS DE ARKEN`;
  byId('missionChip').textContent=step===6?'ARCO DE ARKEN COMPLETADO':beat.objective.toUpperCase();
  byId('journalText').textContent=beat.hint;
  byId('quest').innerHTML=`<div class="quest-icon">${step===6?'✦':'◇'}</div><div><small>${step===6?'HISTORIA COMPLETADA':`MISIÓN PRINCIPAL · ${step+1}/6`}</small><strong>${htmlEscape(beat.title)}</strong><span>${htmlEscape(beat.objective)}</span></div>`;
  }
    if(this.started&&!this.battle){
      const where=this.save.dungeon?.active?'Cripta de los Ecos':z.name;
      const goal=byId('missionChip').textContent||'Consulta el diario';
      this.announceAccessibility(`Región: ${where}. Objetivo: ${goal}. Equipo: ${this.save.team.length} criaturas. Pulsa E para interactuar cerca de un punto de interés.`);
    }
  }

  /** One bounded direction update per second; never allocate Web Audio nodes per frame. */
  private directSoundscape(){
    this.sound.setFocus(this.dialogOpen?'narration':this.modalOpen||!this.started||byId('gameDrawer').classList.contains('open')?'menu':'game');
    if(!this.started||this.battle||this.evolution)return;
    const living=this.save.team.filter(c=>c.hp>0);
    const health=living.length?living.reduce((total,c)=>total+c.hp,0)/
      Math.max(1,living.reduce((total,c)=>total+maxHp(c),0)):0;
    const nearby=!this.save.dungeon?.active&&!!this.nearRoamer();
    this.sound.setIntensity(explorationMusicIntensity({zone:this.save.zone as ZoneId,
      crypt:!!this.save.dungeon?.active,healthRatio:health,visibleWitness:nearby,moving:this.moving}));
  }

  private loop=(now:number)=>{this.pollGamepad();if(this.last>0){
      const frame=now-this.last;this.frameMetrics.add(frame);
      const phase:EndurancePhase=this.modalOpen||!this.started||this.dialogOpen?'menu':this.battle?'battle':this.save.dungeon?.active?'crypt':'explore';
      this.endurance.sample(frame,phase,!document.hidden,window.innerWidth||960,window.innerHeight||540);
    }const dt=Math.min(.055,(now-this.last)/1000||0);this.last=now;this.seconds+=dt;this.flash=Math.max(0,this.flash-dt*1.7);if(this.started&&!this.dialogOpen&&!this.modalOpen&&!this.battle&&!this.evolution&&!byId('gameDrawer').classList.contains('open')){this.move(dt);this.save.playSeconds+=dt;this.timeSinceSave+=dt;if(this.timeSinceSave>90){this.timeSinceSave=0;this.saveNow(false);}}
    if(this.evolution&&this.seconds-this.evolution.startedAt>=this.evolution.duration){const newSpecies=this.evolution.to;this.evolution=null;byId('viewport').classList.remove('in-evolution');byId('evolutionBanner').classList.add('hidden');this.sound.setScene(themeForZone(this.save.zone as ZoneId));this.toast(`${SPECIES[newSpecies]!.name.toUpperCase()} HA DESPERTADO`);}
    if(now-this.lastSoundDirectionUpdate>950){this.lastSoundDirectionUpdate=now;this.directSoundscape();}
    byId('viewport').classList.toggle('in-dungeon',!!this.save.dungeon?.active&&!this.battle);const ctx=this.renderer.ctx;ctx.clearRect(0,0,960,540);if(this.evolution){drawEvolution(ctx,this.evolution.from,this.evolution.to,this.seconds-this.evolution.startedAt,this.reducedMotion);}else if(this.battle&&this.save.team.length){drawBattle(ctx,this.battle.enemy,this.getAlly()!,this.seconds,this.flash,sampleCombatCue(this.combatCue,this.seconds,this.reducedMotion),this.reducedMotion,{enemy:this.statuses(this.battle.enemy).map(e=>e.kind),ally:this.statuses(this.getAlly()!).map(e=>e.kind)});}else if(this.save.dungeon?.active){const d=this.save.dungeon;drawDungeon(ctx,d,{x:d.x,y:d.y,facing:this.facing,walking:this.moving&&!this.dialogOpen},this.seconds,this.reducedMotion);}else{if(this.cameraZone!==this.save.zone){this.camera={x:this.save.x,y:this.save.y};this.cameraZone=this.save.zone;}const follow=1-Math.exp(-dt*9);this.camera.x+=(this.save.x-this.camera.x)*follow;this.camera.y+=(this.save.y-this.camera.y)*follow;drawWorld(ctx,this.save.zone as ZoneId,{x:this.save.x,y:this.save.y,facing:this.facing,walking:this.moving&&!this.dialogOpen},this.seconds,this.flash,this.save.defeatedBoss,this.camera,this.reducedMotion,this.roamers(),this.flag(CROWN_BOSS_FLAG));}this.renderer.present(now);if(this.battle)this.paintBattleHealth(this.seconds);if(now-this.lastAdaptiveUpdate>1900){this.lastAdaptiveUpdate=now;if(this.adaptiveGlyphs.observe(this.frameMetrics.report(),now,this.started&&!document.hidden&&!this.modalOpen)){this.renderer.setPerformanceScale(this.adaptiveGlyphs.scale);this.frameMetrics.reset();}const d=document.getElementById('adaptiveFpsStats');if(d&&this.modalOpen)d.textContent=this.adaptiveGlyphs.active?`Objetivo 30 FPS · escala temporal ×${this.renderer.performanceScale.toFixed(2)} · ajustes artísticos originales conservados`:'Máxima fidelidad manual. Activa FPS estables solo si el dispositivo pierde fluidez.';}if(this.started&&now-this.lastCompassUpdate>180){this.lastCompassUpdate=now;this.updateStoryCompass();}if(now-this.lastDebugUpdate>750){this.lastDebugUpdate=now;const perf=this.frameMetrics.report();byId('fps').textContent=this.debugPerformance?`${this.renderer.mode.toUpperCase()} · ${this.renderer.fps} FPS · MAIN p95 ${perf.p95Ms.toFixed(1)}ms · ${perf.overBudget}/${perf.samples} >33ms`:`${this.renderer.mode.toUpperCase()} · ${this.renderer.fps} FPS${this.adaptiveGlyphs.active?' · AUTO ×'+this.renderer.performanceScale.toFixed(2):''}`;}requestAnimationFrame(this.loop);};
  private move(dt:number){
    if(!byId('titleScreen').classList.contains('hidden')||!byId('starterScreen').classList.contains('hidden')){this.moving=false;return;}
    let dx=this.stick.x,dy=this.stick.y;
    if(Math.hypot(this.padStick.x,this.padStick.y)>.12){dx=this.padStick.x;dy=this.padStick.y;}
    for(const k of this.keys){if(k==='arrowleft'||k==='a')dx-=1;if(k==='arrowright'||k==='d')dx+=1;if(k==='arrowup'||k==='w')dy-=1;if(k==='arrowdown'||k==='s')dy+=1;}
    this.moving=Math.hypot(dx,dy)>.12;
    if(this.moving){
      const len=Math.hypot(dx,dy),speedFactor=Math.min(1,len);dx/=len;dy/=len;
      this.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
      const speed=4.35*speedFactor;
      if(this.save.dungeon?.active){
        const d=this.save.dungeon;const next=dungeonSweep(d,d.x,d.y,dx*speed*dt,dy*speed*dt);
        if(Math.hypot(next.x-d.x,next.y-d.y)>.001){d.x=next.x;d.y=next.y;this.save.dungeon=revealDungeon(d);
          const chamber=chamberAt(d,next.x,next.y);if(chamber.id!==this.lastDungeonChamber){this.lastDungeonChamber=chamber.id;
            const progress=chamberProgress(d);byId('zoneSubtitle').textContent=`${chamber.name} · SELLOS ${progress.completed}/${progress.required}`;
          }
        }
      }else{
        const ox=this.save.x,oy=this.save.y;
        const next=sweepMove(this.save.zone as ZoneId,ox,oy,dx*speed*dt,dy*speed*dt);
        this.save.x=next.x;this.save.y=next.y;this.revealPosition();
        const steps=Math.hypot(this.save.x-ox,this.save.y-oy);this.stepCounter+=steps;this.encounterCooldown-=steps;
        if(this.stepCounter>.95){this.stepCounter=0;
          if(this.encounterCooldown<=0&&isWild(this.save.zone as ZoneId,Math.floor(this.save.x),Math.floor(this.save.y))){
            const pacing=wildPacing(this.save.zone as ZoneId,this.save.flags);
            // Reset even on a miss. Previously a failed roll retried at every step indefinitely.
            this.encounterCooldown=pacing.distance;
            if(Math.random()<pacing.chance){const zone=activeWildBiome(this.save.zone as ZoneId,this.save.flags);const id=drawBiomeWild(zone,Math.random());
              const level=biomeWildLevel(zone,Math.random());
              if(id)this.startBattle(id,level,'wild');
            }
          }
        }
      }
    }
    const encounter=!this.save.dungeon?.active?this.nearRoamer():undefined;const label=this.save.dungeon?.active?nearbyDungeonEvent(this.save.dungeon,1.85)?.label:encounter?`⚔ DESAFIAR A ${SPECIES[encounter.speciesId]!.name.toUpperCase()}`:nearbyLandmark(this.save.zone as ZoneId,this.save.x,this.save.y,2)?.label;
    const el=byId('prompt');if(label&&!this.battle&&!this.dialogOpen&&!this.modalOpen){el.classList.remove('hidden');byId('promptText').textContent=label;}else el.classList.add('hidden');
  }

}
new AzurGame();
