/** Original, connected illustrated prologue. One familiar cast and geography across ten beats.
 * Entirely local SVG: no external images, fonts, video, scene randomness or gameplay writes.
 * The animation belongs to CSS, so reduced-motion/high-contrast can override it. */
export const OPENING_STORYBOARD_IDS=[
 'creation','world','bonds','silence','erasure','embers','companions','arken','choice','begin'
] as const;
export type OpeningStoryboardId=typeof OPENING_STORYBOARD_IDS[number];

const INTRO_DEFS=String.raw`
<defs>
 <linearGradient id="introSky" x2="0" y2="1"><stop stop-color="#122638"/><stop offset=".65" stop-color="#47626a"/><stop offset="1" stop-color="#a07a67"/></linearGradient>
 <linearGradient id="introGround" x2="0" y2="1"><stop stop-color="#3f6661"/><stop offset="1" stop-color="#152b32"/></linearGradient>
 <linearGradient id="introFire" x2=".3" y2="1"><stop stop-color="#fff4c2"/><stop offset=".37" stop-color="#f5be73"/><stop offset="1" stop-color="#dc6b53"/></linearGradient>
 <linearGradient id="introMist" x2="0" y2="1"><stop stop-color="#b9e7ed"/><stop offset=".7" stop-color="#69b6ce" stop-opacity=".9"/><stop offset="1" stop-color="#5bb7c8" stop-opacity=".12"/></linearGradient>
 <linearGradient id="introCloak" x2="0" y2="1"><stop stop-color="#7e8799"/><stop offset="1" stop-color="#263649"/></linearGradient>
 <radialGradient id="introLight"><stop stop-color="#fff6c4" stop-opacity=".9"/><stop offset=".32" stop-color="#ffc97c" stop-opacity=".35"/><stop offset="1" stop-color="#f5a25b" stop-opacity="0"/></radialGradient>
 <symbol id="intro-tree" viewBox="-70 -230 140 230">
  <path d="M-8 0Q-15-55-8-115L-43-159M0-117L34-168M-6-49L-43-74" fill="none" stroke="#283e39" stroke-width="14" stroke-linecap="round"/>
  <path d="M-62-149Q-91-190-51-205Q-23-248 10-211Q55-232 60-188Q83-155 44-135Q15-117-13-137Q-49-126-62-149Z" fill="#4a7063" stroke="#1a3638" stroke-width="5"/>
  <path d="M-50-174Q-28-205 3-186M12-205Q45-181 31-159" stroke="#90b19a" opacity=".4" stroke-width="4" fill="none"/>
 </symbol>
 <symbol id="intro-arken" viewBox="0 0 290 230">
  <path d="M10 208V103L56 76L107 104V208M117 208V88L166 56L215 89V208M227 208V107L255 88L280 106V208" fill="#415968" stroke="#20333d" stroke-width="6"/>
  <path d="M0 104L56 54L113 105M113 88L166 32L221 88M223 107L252 72L289 107" fill="#854c4d" stroke="#ca9380" stroke-width="5" stroke-linejoin="round"/>
  <path d="M153 56V10M137 29H170M145 10L151-4L158 10" stroke="#d6b78b" stroke-width="6" stroke-linecap="round"/>
  <path d="M144 208V162Q165 126 189 162V208" fill="#1a2a38" stroke="#c6a174" stroke-width="5"/>
  <path d="M45 134H67V160H45ZM244 142H261V160H244Z" fill="#f1c37e" stroke="#f4deab" stroke-width="3"/>
  <path d="M153 187H178" stroke="#c5aa83" stroke-width="3"/>
 </symbol>
 <symbol id="intro-traveler" viewBox="-85 -165 170 165">
  <path class="intro-cape" d="M-27-107Q-79-69-66-8L-17-2L16-23L49-7Q56-76 23-114Z" fill="url(#introCloak)" stroke="#a2aabc" stroke-width="5"/>
  <path d="M-24-35L-31-1M15-37L28-1" stroke="#202b39" stroke-width="15" stroke-linecap="round"/>
  <path d="M-45-8H-19M14-8H43" stroke="#b3a88c" stroke-width="9" stroke-linecap="round"/>
  <path d="M-40-92Q-61-141-11-153Q36-150 46-100L33-71L-32-70Z" fill="#31475b" stroke="#a9abb5" stroke-width="5"/>
  <path d="M-21-117Q0-136 23-117L24-95Q9-72-11-88Z" fill="#c89d89" stroke="#eacaba" stroke-width="2"/>
  <circle cx="-8" cy="-104" r="2.5" fill="#182733"/><circle cx="15" cy="-104" r="2.5" fill="#182733"/>
  <path d="M-5-91Q3-87 12-92" fill="none" stroke="#885d59" stroke-width="2"/>
  <path class="intro-traveler-arm" d="M27-91Q46-80 52-51" stroke="#b4abb0" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M52-55V-32" stroke="#d0af7a" stroke-width="4"/>
  <rect x="40" y="-34" width="24" height="29" rx="5" fill="#f0b86a" stroke="#f3dfb4" stroke-width="5"/>
  <rect x="44" y="-29" width="16" height="18" fill="#ffdf91"/>
  <path d="M45-39Q52-50 60-39" stroke="#e7ca88" stroke-width="4" fill="none"/>
 </symbol>
 <symbol id="intro-archivist" viewBox="-95 -180 190 180">
  <path d="M-50-101Q-70-58-76-2H77Q59-76 48-103Z" fill="#374b51" stroke="#9cb5ac" stroke-width="5"/>
  <path d="M-45-106Q-49-154-10-163Q38-165 51-112L35-86H-35Z" fill="#c6ccd0" stroke="#718a96" stroke-width="5"/>
  <path d="M-28-144Q-10-165 29-141V-108Q22-87 0-90Q-29-100-28-122Z" fill="#dab8a4"/>
  <path d="M-25-124H32" stroke="#5b6465" stroke-width="9" stroke-linecap="round"/>
  <circle cx="-11" cy="-121" r="9" fill="none" stroke="#d7c28c" stroke-width="3"/>
  <circle cx="17" cy="-121" r="9" fill="none" stroke="#d7c28c" stroke-width="3"/>
  <path d="M-2-121H8" stroke="#d7c28c" stroke-width="3"/>
  <path d="M-44-66Q-72-70-68-38M42-63Q78-65 69-37" stroke="#9aabab" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path class="intro-book" d="M-67-49Q-30-61-1-35Q31-61 69-49L68-8Q29-23-1-4Q-33-24-67-8Z" fill="#ded3af" stroke="#816e60" stroke-width="5"/>
  <path d="M-1-35V-4M-49-39L-19-30M18-30L46-39" fill="none" stroke="#9f8c70" stroke-width="2"/>
 </symbol>
 <symbol id="intro-cindrel" viewBox="-115 -135 230 135">
  <path class="intro-fox-tail" d="M-55-53Q-153-83-98-127Q-106-93-60-96Q-36-91-28-68Z" fill="#ed8c5b" stroke="#713f43" stroke-width="6"/>
  <path d="M-116-122Q-102-119-91-105Q-85-127-98-132Z" fill="#ffdf8e"/>
  <path d="M-63-59Q-65-89-17-90L35-85L59-56L25-37L-47-37Z" fill="#b85c4c" stroke="#733c43" stroke-width="6"/>
  <path d="M-45-37L-48-3M10-39L16-3" fill="none" stroke="#8c4744" stroke-width="18" stroke-linecap="round"/>
  <path d="M-60-3H-29M7-3H34" stroke="#f4ae7a" stroke-width="8" stroke-linecap="round"/>
  <path d="M8-89L22-130L51-108L79-135L96-96Q112-61 87-43L44-43Q13-54 8-89Z" fill="#d57a56" stroke="#723e43" stroke-width="6"/>
  <path d="M28-106L29-121L49-104M70-109L79-124L86-99" fill="#f5b981"/>
  <path d="M39-56L71-43L101-60Q99-36 70-25L41-36Z" fill="#f3d2a4"/>
  <path d="M50-77Q57-86 63-76M82-78Q90-85 96-75" stroke="#251f29" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="104" cy="-56" r="5" fill="#231f2d"/>
  <path class="intro-flame" d="M-13-89Q-26-115-14-130Q-6-113 0-128Q13-107-6-92Z" fill="url(#introFire)"/>
 </symbol>
 <symbol id="intro-velaria" viewBox="-100 -160 200 160">
  <path class="intro-spirit-cloak" d="M-46-113Q-80-100-68-42Q-105-7-52-9Q-31-35-9-10Q21-35 43-6Q95-15 61-47Q76-108 37-123Z" fill="url(#introMist)" stroke="#a6d9e4" stroke-width="5"/>
  <path d="M-35-115Q-48-150-12-153Q44-164 48-114L35-81Q-4-64-36-88Z" fill="#d3e8e6" stroke="#81b9c9" stroke-width="5"/>
  <path d="M-23-106Q-1-125 25-108" stroke="#78b8cb" stroke-width="5" fill="none"/>
  <ellipse cx="-11" cy="-99" rx="4" ry="7" fill="#336077"/><ellipse cx="19" cy="-99" rx="4" ry="7" fill="#336077"/>
  <path d="M-3-82Q5-76 12-83" stroke="#6a929f" stroke-width="3" fill="none"/>
  <path d="M-52-79Q-86-64-85-45M50-82Q88-70 84-49" stroke="#9cd7e2" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M-25-44Q0-28 24-45" stroke="#ebfffb" stroke-opacity=".45" stroke-width="5" fill="none"/>
 </symbol>
 <symbol id="intro-thorne" viewBox="-110 -155 220 155">
  <path d="M-62-52Q-83-105-34-110Q19-131 66-83Q79-57 51-37L-46-30Z" fill="#617b4f" stroke="#294a3f" stroke-width="7"/>
  <path d="M-52-40L-61-3M21-46L28-3" stroke="#425e47" stroke-width="23" stroke-linecap="round"/>
  <path d="M-73-3H-48M16-3H44" stroke="#a3ba7a" stroke-width="10" stroke-linecap="round"/>
  <path d="M18-100Q17-142 49-138L82-124Q99-92 71-63L30-62Z" fill="#8ba66b" stroke="#355a46" stroke-width="7"/>
  <path class="intro-leaf" d="M54-131Q31-177 4-145Q5-120 38-126Z" fill="#b6d084" stroke="#58744d" stroke-width="4"/>
  <path class="intro-leaf" d="M72-125Q89-170 118-141Q112-120 83-115Z" fill="#8fbf84" stroke="#58744d" stroke-width="4"/>
  <circle cx="62" cy="-99" r="6" fill="#f1d38c"/><circle cx="88" cy="-96" r="5" fill="#f1d38c"/>
  <path d="M72-75Q82-70 94-80" stroke="#355645" stroke-width="4" fill="none"/>
  <path d="M-36-111Q-66-139-78-112" stroke="#9fb66b" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M-51-118Q-58-157-17-146Q3-134-28-121Z" fill="#78a573"/>
 </symbol>
 <symbol id="intro-lumbre" viewBox="-86 -158 172 158">
  <ellipse cx="0" cy="-18" rx="79" ry="20" fill="#3b4b51" stroke="#bfa274" stroke-width="7"/>
  <path d="M-56-22Q-35-2 0-1Q40-1 56-22L40 6H-41Z" fill="#6c6360" stroke="#caa67e" stroke-width="5"/>
  <path class="intro-flame" d="M-14-27Q-72-66-21-130Q-30-89-5-117Q29-166 22-105Q74-70 28-28Z" fill="url(#introFire)" stroke="#f6c48c" stroke-width="5"/>
  <path d="M-9-29Q-29-60 6-91Q-4-57 23-50Q16-27-9-29Z" fill="#fff5c9"/>
 </symbol>
</defs>`;

const INTRO_LAND=String.raw`
<g class="intro-parallax intro-land">
 <path d="M0 304Q122 241 236 290Q344 190 479 266Q597 206 728 274Q830 216 960 263V540H0Z" fill="#304858"/>
 <path d="M0 355Q144 288 260 336Q403 258 537 340Q727 289 960 327V540H0Z" fill="#416965" opacity=".95"/>
 <path d="M0 409Q157 368 330 403Q492 335 645 400Q813 345 960 388V540H0Z" fill="url(#introGround)"/>
 <path d="M365 545Q470 394 590 356L642 359Q514 430 530 545" fill="#907d66" opacity=".82"/>
 <path d="M391 545Q485 408 606 358" stroke="#e3c59a" opacity=".38" stroke-width="6" stroke-dasharray="13 35" fill="none"/>
</g>
<g class="intro-woodland intro-parallax" opacity=".92">
 <use href="#intro-tree" x="98" y="325" width="128" height="235"/>
 <use href="#intro-tree" x="730" y="320" width="124" height="218"/>
 <use href="#intro-tree" x="850" y="350" width="112" height="180"/>
</g>`;

const INTRO_SCENES:Record<OpeningStoryboardId,string>={
 creation: String.raw`<g class="intro-scene-objects">
 <g class="intro-reveal intro-panorama"><use href="#intro-arken" x="354" y="168" width="240" height="190"/></g>
 <path class="intro-light-thread" d="M460 355Q463 264 483 201T505 81" fill="none" stroke="#ffe6a7" stroke-width="5" stroke-dasharray="7 16"/>
 <g class="intro-light intro-glow" transform="translate(505 85)"><circle r="98" fill="url(#introLight)"/><circle r="13" fill="#fff0b2"/></g>
 <g class="intro-walk" transform="translate(312 425) scale(.48)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 </g>`,
 world: String.raw`<g class="intro-scene-objects">
 <g class="intro-panorama"><use href="#intro-arken" x="625" y="210" width="204" height="162"/></g>
 <path d="M48 342Q188 300 298 351Q386 322 480 362" stroke="#8cad8a" stroke-width="11" fill="none"/>
 <g class="intro-walk" transform="translate(399 432) scale(.78)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-breathe" transform="translate(569 430) scale(.57)"><use href="#intro-cindrel" x="-115" y="-135" width="230" height="135"/></g>
 <g class="intro-cloud" opacity=".45"><ellipse cx="245" cy="116" rx="125" ry="20" fill="#d0dfd4"/><ellipse cx="680" cy="162" rx="105" ry="13" fill="#d0dfd4"/></g>
 </g>`,
 bonds: String.raw`<g class="intro-scene-objects">
 <g class="intro-breathe" transform="translate(277 423) scale(.83)"><use href="#intro-cindrel" x="-115" y="-135" width="230" height="135"/></g>
 <g class="intro-float" transform="translate(494 420) scale(.85)"><use href="#intro-velaria" x="-100" y="-160" width="200" height="160"/></g>
 <g class="intro-breathe" transform="translate(699 424) scale(.82)"><use href="#intro-thorne" x="-110" y="-155" width="220" height="155"/></g>
 <g class="intro-nameplates">
  <text x="277" y="458">CINDREL</text><text x="494" y="458">VELARIA</text><text x="699" y="458">THORNE</text>
 </g>
 <g class="intro-light intro-glow" transform="translate(492 270)"><circle r="112" fill="url(#introLight)"/></g>
 </g>`,
 silence: String.raw`<g class="intro-scene-objects">
 <use href="#intro-arken" x="515" y="204" width="210" height="171" opacity=".7"/>
 <g class="intro-shadow" transform="translate(590 0)">
   <path d="M108-10Q-114 170 27 270Q-85 377 68 540H420V-10Z" fill="#11162d" opacity=".83"/>
   <path d="M280 0Q15 193 165 320" stroke="#bcb1d7" stroke-opacity=".38" stroke-width="8" stroke-dasharray="5 29" fill="none"/>
 </g>
 <g class="intro-walk" transform="translate(367 430) scale(.78)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-breathe" transform="translate(481 431) scale(.67)"><use href="#intro-cindrel" x="-115" y="-135" width="230" height="135"/></g>
 <path class="intro-light-thread" d="M387 370Q435 306 477 365" stroke="#f5c886" stroke-width="5" fill="none" stroke-dasharray="10 14"/>
 </g>`,
 erasure: String.raw`<g class="intro-scene-objects">
 <g class="intro-archivist-figure intro-breathe" transform="translate(480 407) scale(1.08)"><use href="#intro-archivist" x="-95" y="-180" width="190" height="180"/></g>
 <g class="intro-missing-pages">
   <path d="M252 148L347 124L361 217L270 239Z" fill="#e6d9bd" opacity=".8"/>
   <path d="M706 180L760 119L801 213L726 241Z" fill="#e6d9bd" opacity=".65"/>
   <path d="M286 184L332 171M732 197L773 163" stroke="#927e83" stroke-width="3" stroke-dasharray="4 13"/>
 </g>
 <g class="intro-shadow" opacity=".6"><path d="M958 0Q793 111 828 265T788 545" fill="none" stroke="#0a0b1c" stroke-width="205"/></g>
 <g class="intro-light intro-glow" transform="translate(478 334)"><circle r="112" fill="url(#introLight)" opacity=".6"/></g>
 </g>`,
 embers: String.raw`<g class="intro-scene-objects">
 <path d="M265 420L296 338L380 300L582 300L662 350L692 420" stroke="#69716e" stroke-width="13" fill="none"/>
 <g class="intro-lumbre-figure intro-pulse" transform="translate(485 399) scale(1.25)"><use href="#intro-lumbre" x="-86" y="-158" width="172" height="158"/></g>
 <g class="intro-glow intro-light" transform="translate(485 257)"><circle r="179" fill="url(#introLight)"/></g>
 <g class="intro-walk" transform="translate(304 435) scale(.59)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-breathe" transform="translate(670 432) scale(.56)"><use href="#intro-thorne" x="-110" y="-155" width="220" height="155"/></g>
 </g>`,
 companions: String.raw`<g class="intro-scene-objects">
 <g class="intro-walk" transform="translate(359 434) scale(.91)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-breathe" transform="translate(570 431) scale(.94)"><use href="#intro-cindrel" x="-115" y="-135" width="230" height="135"/></g>
 <g class="intro-float" transform="translate(680 362) scale(.5)"><use href="#intro-velaria" x="-100" y="-160" width="200" height="160"/></g>
 <g class="intro-breathe" transform="translate(773 432) scale(.53)"><use href="#intro-thorne" x="-110" y="-155" width="220" height="155"/></g>
 <path class="intro-light-thread intro-strong-thread" d="M397 342Q480 260 569 329Q661 267 694 315" stroke="#f9d48e" stroke-width="7" stroke-linecap="round" stroke-dasharray="13 11" fill="none"/>
 <g class="intro-light intro-glow" transform="translate(491 290)"><circle r="153" fill="url(#introLight)"/></g>
 </g>`,
 arken: String.raw`<g class="intro-scene-objects">
 <g class="intro-panorama"><use href="#intro-arken" x="346" y="131" width="298" height="240"/></g>
 <path d="M337 409H658" stroke="#e3bf87" stroke-width="9" opacity=".5"/>
 <g class="intro-archivist-figure intro-breathe" transform="translate(532 435) scale(.77)"><use href="#intro-archivist" x="-95" y="-180" width="190" height="180"/></g>
 <g class="intro-walk" transform="translate(339 438) scale(.65)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-light intro-glow" transform="translate(474 239)"><circle r="135" fill="url(#introLight)"/></g>
 </g>`,
 choice: String.raw`<g class="intro-scene-objects">
 <path d="M490 441Q410 363 260 342M490 441Q603 344 788 334" stroke="#d6c398" stroke-width="18" fill="none" opacity=".65"/>
 <path d="M490 441Q410 363 260 342M490 441Q603 344 788 334" stroke="#f6dfb1" stroke-width="4" stroke-dasharray="15 18" fill="none" opacity=".7"/>
 <g class="intro-walk" transform="translate(492 451) scale(.79)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-breathe" transform="translate(315 350) scale(.51)"><use href="#intro-thorne" x="-110" y="-155" width="220" height="155"/></g>
 <g class="intro-float" transform="translate(707 356) scale(.48)"><use href="#intro-velaria" x="-100" y="-160" width="200" height="160"/></g>
 <g class="intro-breathe" transform="translate(572 414) scale(.52)"><use href="#intro-cindrel" x="-115" y="-135" width="230" height="135"/></g>
 </g>`,
 begin: String.raw`<g class="intro-scene-objects">
 <g class="intro-panorama" opacity=".92"><use href="#intro-arken" x="590" y="210" width="228" height="190"/></g>
 <g class="intro-glow intro-light" transform="translate(485 111)"><circle r="200" fill="url(#introLight)"/></g>
 <g class="intro-walk" transform="translate(405 435) scale(.85)"><use href="#intro-traveler" x="-85" y="-165" width="170" height="165"/></g>
 <g class="intro-breathe" transform="translate(568 433) scale(.63)"><use href="#intro-cindrel" x="-115" y="-135" width="230" height="135"/></g>
 <g class="intro-float" transform="translate(292 396) scale(.55)"><use href="#intro-velaria" x="-100" y="-160" width="200" height="160"/></g>
 <g class="intro-breathe" transform="translate(713 436) scale(.60)"><use href="#intro-thorne" x="-110" y="-155" width="220" height="155"/></g>
 <path class="intro-light-thread" d="M433 341Q482 290 556 362" stroke="#f8d391" stroke-width="5" stroke-dasharray="10 12" fill="none"/>
 </g>`
};

/** Fixed authored SVG. Scene id controls only which static composition is inserted. */
export function renderOpeningStoryboard(id:OpeningStoryboardId):string{
 if(!Object.prototype.hasOwnProperty.call(INTRO_SCENES,id))throw Error('Unknown opening storyboard scene');
 return '<svg class="cinematic-storyboard" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
 +INTRO_DEFS
 +'<rect width="960" height="540" fill="url(#introSky)"/>'
 +'<circle class="intro-sun intro-glow" cx="484" cy="121" r="66" fill="#e9bd87" opacity=".42"/>'
 +INTRO_LAND
 +INTRO_SCENES[id]
 +'</svg>';
}
