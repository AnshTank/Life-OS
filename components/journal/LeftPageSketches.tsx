"use client";
import React from 'react';

const S = '#7a6a4a'; // pencil stroke
const SL = '#9a8a6a'; // lighter pencil
const F = 'rgba(122,106,74,0.05)'; // very light fill
const FD = 'rgba(122,106,74,0.12)'; // darker fill for shading

/* ════════════════════════════════════════════════════
   JOURNAL — 5 scenes
   ════════════════════════════════════════════════════ */
const journalSketches = [
  // 1: Writing desk with candle, open journal, quill, window with moonlight
  <svg key="j1" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Desk surface */}
    <path d="M10 185 L190 185 L195 190 L5 190Z" stroke={S} strokeWidth="0.8" fill={F} opacity="0.5" />
    <path d="M5 190 L5 210 L195 210 L195 190" stroke={S} strokeWidth="0.6" fill={F} opacity="0.3" />
    <line x1="5" y1="195" x2="195" y2="195" stroke={SL} strokeWidth="0.3" opacity="0.15" />
    {/* Desk legs */}
    <line x1="15" y1="210" x2="12" y2="250" stroke={S} strokeWidth="0.8" opacity="0.35" />
    <line x1="185" y1="210" x2="188" y2="250" stroke={S} strokeWidth="0.8" opacity="0.35" />
    {/* Open journal on desk */}
    <path d="M45 155 L45 183 Q90 178 90 183 L90 155 Q90 148 45 155Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.45" />
    <path d="M135 155 L135 183 Q90 178 90 183 L90 155 Q90 148 135 155Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <line x1="90" y1="148" x2="90" y2="183" stroke={S} strokeWidth="0.6" opacity="0.4" />
    {/* Handwriting lines on left page */}
    <line x1="52" y1="160" x2="83" y2="158" stroke={SL} strokeWidth="0.25" opacity="0.2" />
    <line x1="52" y1="164" x2="80" y2="162" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="52" y1="168" x2="85" y2="166" stroke={SL} strokeWidth="0.25" opacity="0.2" />
    <line x1="52" y1="172" x2="78" y2="170" stroke={SL} strokeWidth="0.25" opacity="0.17" />
    <line x1="52" y1="176" x2="82" y2="174" stroke={SL} strokeWidth="0.25" opacity="0.19" />
    {/* Handwriting lines on right page */}
    <line x1="97" y1="158" x2="128" y2="160" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="97" y1="162" x2="125" y2="164" stroke={SL} strokeWidth="0.25" opacity="0.2" />
    <line x1="97" y1="166" x2="130" y2="168" stroke={SL} strokeWidth="0.25" opacity="0.17" />
    {/* Quill & inkwell */}
    <ellipse cx="160" cy="180" rx="10" ry="4" stroke={S} strokeWidth="0.6" fill={FD} opacity="0.4" />
    <path d="M150 180 Q150 170 153 168 L167 168 Q170 170 170 180" stroke={S} strokeWidth="0.6" fill={F} opacity="0.35" />
    <path d="M162 168 Q158 140 148 100 Q144 80 150 60" stroke={S} strokeWidth="0.9" fill="none" opacity="0.45" />
    <path d="M150 60 Q146 72 143 85 Q142 92 148 100 Q145 78 150 60Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <path d="M150 60 Q154 72 155 85 Q156 92 148 100 Q153 78 150 60Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    {/* Feather barbs */}
    <path d="M145 78 Q140 75 136 78" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.2" />
    <path d="M147 88 Q142 85 138 88" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.2" />
    <path d="M153 72 Q158 69 162 72" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.2" />
    {/* Candle */}
    <rect x="28" y="135" width="8" height="48" rx="2" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <path d="M32 135 Q30 125 32 118 Q34 125 32 135Z" stroke={S} strokeWidth="0.5" fill={FD} opacity="0.4" />
    <line x1="32" y1="118" x2="32" y2="112" stroke={SL} strokeWidth="0.3" opacity="0.2" />
    {/* Candle glow */}
    <circle cx="32" cy="120" r="12" fill="rgba(122,106,74,0.03)" opacity="0.3" />
    <circle cx="32" cy="120" r="6" fill="rgba(122,106,74,0.04)" opacity="0.25" />
    {/* Window in background */}
    <rect x="55" y="20" width="50" height="65" rx="2" stroke={S} strokeWidth="0.7" fill="none" opacity="0.3" />
    <line x1="80" y1="20" x2="80" y2="85" stroke={S} strokeWidth="0.5" opacity="0.25" />
    <line x1="55" y1="52" x2="105" y2="52" stroke={S} strokeWidth="0.5" opacity="0.25" />
    {/* Moon through window */}
    <circle cx="72" cy="38" r="7" stroke={SL} strokeWidth="0.5" fill={F} opacity="0.3" />
    <path d="M72 31 Q78 38 72 45 Q74 38 72 31Z" fill="rgba(122,106,74,0.03)" opacity="0.2" />
    {/* Stars through window */}
    <circle cx="62" cy="32" r="0.8" fill={SL} opacity="0.2" />
    <circle cx="95" cy="35" r="0.6" fill={SL} opacity="0.15" />
    <circle cx="88" cy="28" r="0.7" fill={SL} opacity="0.18" />
    {/* Curtain drapes */}
    <path d="M55 20 Q48 40 52 85" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.2" />
    <path d="M105 20 Q112 40 108 85" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.2" />
    {/* Ink drops on desk */}
    <circle cx="145" cy="183" r="1.2" fill={S} opacity="0.15" />
    <circle cx="150" cy="184" r="0.8" fill={S} opacity="0.12" />
    {/* Cross-hatch shading under desk */}
    <line x1="20" y1="215" x2="30" y2="245" stroke={SL} strokeWidth="0.2" opacity="0.08" />
    <line x1="40" y1="215" x2="50" y2="245" stroke={SL} strokeWidth="0.2" opacity="0.08" />
    <line x1="150" y1="215" x2="160" y2="245" stroke={SL} strokeWidth="0.2" opacity="0.08" />
    <line x1="170" y1="215" x2="180" y2="245" stroke={SL} strokeWidth="0.2" opacity="0.08" />
  </svg>,

  // 2: Cozy reading nook — armchair, lamp, stack of books, cat
  <svg key="j2" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Floor */}
    <line x1="0" y1="220" x2="200" y2="220" stroke={SL} strokeWidth="0.4" opacity="0.2" />
    {/* Armchair */}
    <path d="M40 140 Q35 140 30 150 L30 210 L40 215 L40 140Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <path d="M130 140 Q135 140 140 150 L140 210 L130 215 L130 140Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <path d="M40 140 Q50 130 85 128 Q120 130 130 140" stroke={S} strokeWidth="0.8" fill="none" opacity="0.45" />
    <path d="M40 215 L130 215 L130 195 Q85 200 40 195Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.35" />
    <path d="M40 195 Q85 200 130 195 L130 155 Q85 160 40 155Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    {/* Cushion */}
    <path d="M55 155 Q85 150 115 155 Q115 165 85 162 Q55 165 55 155Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    {/* Armchair legs */}
    <line x1="35" y1="215" x2="33" y2="225" stroke={S} strokeWidth="0.6" opacity="0.3" />
    <line x1="135" y1="215" x2="137" y2="225" stroke={S} strokeWidth="0.6" opacity="0.3" />
    {/* Floor lamp */}
    <line x1="165" y1="220" x2="165" y2="80" stroke={S} strokeWidth="0.7" opacity="0.4" />
    <path d="M150 80 Q157 55 165 52 Q173 55 180 80Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <ellipse cx="165" cy="80" rx="15" ry="3" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    {/* Light glow */}
    <circle cx="165" cy="70" r="20" fill="rgba(122,106,74,0.02)" opacity="0.3" />
    {/* Lamp base */}
    <ellipse cx="165" cy="222" rx="10" ry="3" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    {/* Stack of books on floor */}
    <rect x="10" y="205" width="22" height="4" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <rect x="8" y="200" width="24" height="4" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <rect x="11" y="195" width="20" height="4" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    {/* Sleeping cat on chair */}
    <ellipse cx="85" cy="175" rx="18" ry="10" stroke={S} strokeWidth="0.6" fill={F} opacity="0.35" />
    <path d="M70 170 Q65 165 68 160 L72 168Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <path d="M74 168 Q71 163 75 158 L78 166Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <path d="M100 178 Q110 180 115 175 Q112 182 100 180Z" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.25" />
    {/* Cat face details */}
    <circle cx="78" cy="172" r="0.8" fill={S} opacity="0.2" />
    <circle cx="83" cy="171" r="0.8" fill={S} opacity="0.2" />
    {/* Cross-hatching on chair shadow */}
    <line x1="45" y1="200" x2="55" y2="210" stroke={SL} strokeWidth="0.15" opacity="0.08" />
    <line x1="55" y1="200" x2="65" y2="210" stroke={SL} strokeWidth="0.15" opacity="0.08" />
    <line x1="65" y1="200" x2="75" y2="210" stroke={SL} strokeWidth="0.15" opacity="0.08" />
    <line x1="95" y1="200" x2="105" y2="210" stroke={SL} strokeWidth="0.15" opacity="0.08" />
    <line x1="105" y1="200" x2="115" y2="210" stroke={SL} strokeWidth="0.15" opacity="0.08" />
  </svg>,

  // 3: Vintage typewriter with paper and coffee
  <svg key="j3" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Table surface */}
    <path d="M5 195 L195 195" stroke={S} strokeWidth="0.7" opacity="0.35" />
    {/* Typewriter body */}
    <path d="M45 140 L50 110 L150 110 L155 140Z" stroke={S} strokeWidth="0.8" fill={F} opacity="0.4" />
    <rect x="42" y="140" width="116" height="50" rx="3" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    {/* Typewriter roller */}
    <rect x="55" y="100" width="90" height="12" rx="6" stroke={S} strokeWidth="0.6" fill={F} opacity="0.35" />
    {/* Paper coming out */}
    <path d="M65 100 L65 35 Q66 30 70 30 L130 30 Q134 30 135 35 L135 100" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    {/* Text on paper */}
    <line x1="75" y1="42" x2="125" y2="42" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="75" y1="48" x2="120" y2="48" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="75" y1="54" x2="128" y2="54" stroke={SL} strokeWidth="0.25" opacity="0.17" />
    <line x1="75" y1="60" x2="115" y2="60" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="75" y1="66" x2="122" y2="66" stroke={SL} strokeWidth="0.25" opacity="0.16" />
    <line x1="75" y1="72" x2="118" y2="72" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="75" y1="78" x2="125" y2="78" stroke={SL} strokeWidth="0.25" opacity="0.15" />
    {/* Typewriter keys */}
    {[0,1,2,3,4,5,6,7].map(i => <circle key={i} cx={60+i*12} cy="160" r="4" stroke={S} strokeWidth="0.4" fill={F} opacity="0.3" />)}
    {[0,1,2,3,4,5,6].map(i => <circle key={i} cx={66+i*12} cy="172" r="4" stroke={S} strokeWidth="0.4" fill={F} opacity="0.25" />)}
    {/* Space bar */}
    <rect x="70" y="180" width="60" height="6" rx="3" stroke={S} strokeWidth="0.4" fill={F} opacity="0.25" />
    {/* Coffee cup */}
    <path d="M15 165 Q13 185 20 190 L38 190 Q45 185 43 165Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.35" />
    <ellipse cx="29" cy="165" rx="14" ry="5" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <path d="M43 170 Q52 172 52 178 Q52 184 43 186" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    {/* Steam */}
    <path d="M25 158 Q22 148 26 140" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.15" />
    <path d="M32 156 Q29 146 33 138" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.15" />
    {/* Saucer */}
    <ellipse cx="29" cy="192" rx="18" ry="4" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
  </svg>,

  // 4: Window sill with rain, journal, tea, and plant
  <svg key="j4" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Window frame */}
    <rect x="15" y="15" width="170" height="150" rx="2" stroke={S} strokeWidth="0.8" fill="none" opacity="0.4" />
    <line x1="100" y1="15" x2="100" y2="165" stroke={S} strokeWidth="0.6" opacity="0.3" />
    <line x1="15" y1="90" x2="185" y2="90" stroke={S} strokeWidth="0.6" opacity="0.3" />
    {/* Rain streaks on window */}
    <line x1="30" y1="20" x2="28" y2="55" stroke={SL} strokeWidth="0.2" opacity="0.1" />
    <line x1="50" y1="22" x2="48" y2="65" stroke={SL} strokeWidth="0.2" opacity="0.1" />
    <line x1="70" y1="18" x2="68" y2="58" stroke={SL} strokeWidth="0.2" opacity="0.12" />
    <line x1="120" y1="20" x2="118" y2="60" stroke={SL} strokeWidth="0.2" opacity="0.1" />
    <line x1="140" y1="22" x2="138" y2="55" stroke={SL} strokeWidth="0.2" opacity="0.1" />
    <line x1="165" y1="19" x2="163" y2="50" stroke={SL} strokeWidth="0.2" opacity="0.11" />
    {/* Raindrops */}
    <circle cx="45" cy="45" r="1" fill={SL} opacity="0.1" />
    <circle cx="85" cy="35" r="0.8" fill={SL} opacity="0.1" />
    <circle cx="155" cy="42" r="1" fill={SL} opacity="0.1" />
    {/* Window sill */}
    <rect x="10" y="165" width="180" height="10" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    {/* Journal on sill */}
    <rect x="60" y="155" width="35" height="12" rx="1" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <line x1="77" y1="155" x2="77" y2="167" stroke={SL} strokeWidth="0.3" opacity="0.25" />
    {/* Pencil on journal */}
    <line x1="58" y1="160" x2="100" y2="156" stroke={S} strokeWidth="0.5" opacity="0.35" />
    <path d="M58 160 L56 161 L55 159Z" stroke={S} strokeWidth="0.3" fill={FD} opacity="0.3" />
    {/* Tea cup */}
    <path d="M120 152 Q118 165 124 168 L140 168 Q146 165 144 152Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <ellipse cx="132" cy="152" rx="12" ry="4" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <path d="M144 155 Q150 157 150 162 Q150 167 144 165" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    {/* Steam */}
    <path d="M128 146 Q126 138 130 132" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.15" />
    <path d="M135 145 Q133 137 137 130" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.15" />
    {/* Small potted plant */}
    <path d="M25 148 L30 165 L42 165 L47 148Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <path d="M36 148 Q30 130 25 120 Q20 128 30 140Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <path d="M36 148 Q42 130 48 125 Q50 133 40 142Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <path d="M36 148 Q36 128 36 115" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    <path d="M36 115 Q30 108 32 100 Q35 108 36 115Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    <path d="M36 115 Q42 108 40 100 Q37 108 36 115Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    {/* Wall below sill */}
    <rect x="10" y="175" width="180" height="80" stroke="none" fill={F} opacity="0.15" />
    {/* Cross-hatch shadow below sill */}
    <line x1="15" y1="178" x2="185" y2="178" stroke={SL} strokeWidth="0.15" opacity="0.06" />
    <line x1="15" y1="182" x2="185" y2="182" stroke={SL} strokeWidth="0.15" opacity="0.05" />
  </svg>,

  // 5: Vintage desk with letter, wax seal, pocket watch
  <svg key="j5" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Desk surface */}
    <path d="M5 175 L195 175 L200 180 L0 180Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.45" />
    {/* Unfolded letter */}
    <path d="M35 110 L35 172 L120 172 L120 110Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <path d="M35 110 L77 140 L120 110Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.2" />
    {/* Handwriting on letter */}
    <line x1="45" y1="130" x2="110" y2="130" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="45" y1="137" x2="105" y2="137" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="45" y1="144" x2="108" y2="144" stroke={SL} strokeWidth="0.2" opacity="0.14" />
    <line x1="45" y1="151" x2="100" y2="151" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="45" y1="158" x2="95" y2="158" stroke={SL} strokeWidth="0.2" opacity="0.13" />
    {/* Wax seal */}
    <circle cx="105" cy="167" r="6" stroke={S} strokeWidth="0.6" fill={FD} opacity="0.4" />
    <circle cx="105" cy="167" r="3.5" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.25" />
    {/* Pocket watch */}
    <circle cx="160" cy="145" r="18" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <circle cx="160" cy="145" r="15" stroke={S} strokeWidth="0.4" fill="none" opacity="0.3" />
    <line x1="160" y1="132" x2="160" y2="145" stroke={S} strokeWidth="0.5" opacity="0.35" />
    <line x1="160" y1="145" x2="168" y2="150" stroke={S} strokeWidth="0.4" opacity="0.3" />
    <circle cx="160" cy="145" r="1.2" fill={S} opacity="0.3" />
    {/* Watch chain */}
    <path d="M160 127 Q155 120 160 115 Q165 120 160 127" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    <path d="M160 115 Q170 105 175 110 Q180 120 185 125" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.2" />
    {/* Hour markers */}
    <circle cx="160" cy="132" r="0.6" fill={S} opacity="0.2" />
    <circle cx="175" cy="145" r="0.6" fill={S} opacity="0.2" />
    <circle cx="160" cy="158" r="0.6" fill={S} opacity="0.2" />
    <circle cx="145" cy="145" r="0.6" fill={S} opacity="0.2" />
    {/* Envelope */}
    <path d="M130 160 L130 175 L180 175 L180 160Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <path d="M130 160 L155 172 L180 160" stroke={SL} strokeWidth="0.3" opacity="0.2" />
    {/* Dried flower bookmark */}
    <path d="M25 100 Q27 130 26 170" stroke={S} strokeWidth="0.4" fill="none" opacity="0.3" />
    <path d="M26 100 Q20 92 22 85 Q26 90 26 100Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    <path d="M26 100 Q32 92 30 85 Q26 90 26 100Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    <circle cx="26" cy="95" r="3" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.2" />
  </svg>,
];

/* ════════════════════════════════════════════════════
   DAILY LOG — 5 scenes
   ════════════════════════════════════════════════════ */
const dailyLogSketches = [
  // 1: Morning coffee & newspaper scene
  <svg key="d1" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Table */}
    <ellipse cx="100" cy="210" rx="85" ry="25" stroke={S} strokeWidth="0.7" fill={F} opacity="0.35" />
    {/* Newspaper */}
    <rect x="30" y="155" width="80" height="50" rx="1" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <line x1="30" y1="163" x2="110" y2="163" stroke={SL} strokeWidth="0.3" opacity="0.2" />
    <line x1="30" y1="167" x2="70" y2="167" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="30" y1="171" x2="65" y2="171" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="75" y1="167" x2="110" y2="167" stroke={SL} strokeWidth="0.2" opacity="0.12" />
    <line x1="75" y1="171" x2="105" y2="171" stroke={SL} strokeWidth="0.2" opacity="0.12" />
    <rect x="75" y="175" width="32" height="25" stroke={SL} strokeWidth="0.2" fill={F} opacity="0.15" />
    <line x1="30" y1="178" x2="70" y2="178" stroke={SL} strokeWidth="0.2" opacity="0.12" />
    <line x1="30" y1="182" x2="68" y2="182" stroke={SL} strokeWidth="0.2" opacity="0.12" />
    <line x1="30" y1="186" x2="65" y2="186" stroke={SL} strokeWidth="0.2" opacity="0.1" />
    {/* Coffee cup */}
    <path d="M125 140 Q122 175 130 182 L158 182 Q166 175 163 140Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <ellipse cx="144" cy="140" rx="19" ry="7" stroke={S} strokeWidth="0.6" fill={F} opacity="0.35" />
    <path d="M163 148 Q175 152 175 162 Q175 172 163 174" stroke={S} strokeWidth="0.6" fill="none" opacity="0.35" />
    {/* Coffee surface */}
    <ellipse cx="144" cy="145" rx="15" ry="4" stroke={SL} strokeWidth="0.3" fill={FD} opacity="0.15" />
    {/* Steam */}
    <path d="M136 128 Q133 115 137 105 Q141 95 136 85" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.15" />
    <path d="M144 126 Q141 112 145 102 Q149 92 144 82" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.18" />
    <path d="M152 128 Q149 115 153 105 Q157 95 152 85" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.15" />
    {/* Saucer */}
    <ellipse cx="144" cy="185" rx="24" ry="6" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    {/* Croissant */}
    <path d="M50 130 Q60 118 75 120 Q85 122 80 132 Q75 138 60 140 Q45 140 50 130Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <path d="M55 128 Q62 122 70 124" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.2" />
    <path d="M53 133 Q60 128 68 130" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.18" />
    {/* Small plate under croissant */}
    <ellipse cx="65" cy="142" rx="20" ry="5" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.2" />
  </svg>,

  // 2: Sunrise through blinds, alarm clock, notebook
  <svg key="d2" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Window blinds */}
    {[0,1,2,3,4,5,6,7,8,9].map(i => <line key={i} x1="20" y1={25+i*14} x2="180" y2={25+i*14} stroke={SL} strokeWidth="0.4" opacity="0.15" />)}
    {/* Sun rays through blinds */}
    <path d="M100 0 L90 25" stroke={SL} strokeWidth="0.3" opacity="0.1" />
    <path d="M110 5 L105 30" stroke={SL} strokeWidth="0.3" opacity="0.12" />
    <path d="M120 2 L118 28" stroke={SL} strokeWidth="0.3" opacity="0.1" />
    <path d="M80 3 L75 30" stroke={SL} strokeWidth="0.3" opacity="0.1" />
    {/* Half sun at top */}
    <path d="M70 20 Q100 -5 130 20" stroke={S} strokeWidth="0.6" fill={F} opacity="0.3" />
    {/* Nightstand */}
    <rect x="55" y="165" width="90" height="55" rx="2" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <line x1="55" y1="175" x2="145" y2="175" stroke={SL} strokeWidth="0.3" opacity="0.2" />
    <rect x="70" y="180" width="25" height="10" rx="1" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.2" />
    {/* Alarm clock */}
    <circle cx="90" cy="150" r="18" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <circle cx="90" cy="150" r="14" stroke={SL} strokeWidth="0.4" fill="none" opacity="0.3" />
    <line x1="90" y1="138" x2="90" y2="150" stroke={S} strokeWidth="0.5" opacity="0.35" />
    <line x1="90" y1="150" x2="97" y2="154" stroke={S} strokeWidth="0.4" opacity="0.3" />
    <circle cx="90" cy="150" r="1" fill={S} opacity="0.3" />
    {/* Clock bells */}
    <circle cx="80" cy="130" r="5" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <circle cx="100" cy="130" r="5" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    <line x1="85" y1="127" x2="95" y2="127" stroke={S} strokeWidth="0.4" opacity="0.3" />
    {/* Clock legs */}
    <line x1="78" y1="168" x2="75" y2="172" stroke={S} strokeWidth="0.4" opacity="0.3" />
    <line x1="102" y1="168" x2="105" y2="172" stroke={S} strokeWidth="0.4" opacity="0.3" />
    {/* Small notebook */}
    <rect x="125" y="148" width="20" height="28" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <line x1="128" y1="148" x2="128" y2="176" stroke={SL} strokeWidth="0.3" opacity="0.2" />
    {/* Pencil */}
    <line x1="148" y1="155" x2="155" y2="175" stroke={S} strokeWidth="0.5" opacity="0.3" />
    <path d="M155 175 L156 178 L153 177Z" stroke={S} strokeWidth="0.3" fill={S} opacity="0.2" />
  </svg>,

  // 3: Park bench with book and autumn leaves
  <svg key="d3" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Ground */}
    <path d="M0 220 Q50 215 100 218 Q150 221 200 216" stroke={SL} strokeWidth="0.4" opacity="0.2" />
    {/* Park bench - seat */}
    <path d="M30 180 L170 180 L170 175 L30 175Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <line x1="35" y1="177" x2="165" y2="177" stroke={SL} strokeWidth="0.3" opacity="0.2" />
    {/* Bench back */}
    <path d="M35 130 L35 175" stroke={S} strokeWidth="0.7" opacity="0.4" />
    <path d="M165 130 L165 175" stroke={S} strokeWidth="0.7" opacity="0.4" />
    <rect x="35" y="135" width="130" height="8" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <rect x="35" y="148" width="130" height="8" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    <rect x="35" y="161" width="130" height="8" rx="1" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    {/* Bench legs */}
    <path d="M40 180 L35 220 L50 220 L45 180" stroke={S} strokeWidth="0.6" fill="none" opacity="0.35" />
    <path d="M155 180 L150 220 L165 220 L160 180" stroke={S} strokeWidth="0.6" fill="none" opacity="0.35" />
    {/* Open book on bench */}
    <path d="M70 165 L70 178 Q90 175 90 178 L90 165 Q90 162 70 165Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.4" />
    <path d="M110 165 L110 178 Q90 175 90 178 L90 165 Q90 162 110 165Z" stroke={S} strokeWidth="0.5" fill={F} opacity="0.35" />
    {/* Tree */}
    <path d="M175 220 L175 80" stroke={S} strokeWidth="1" opacity="0.4" />
    <path d="M175 120 Q195 105 200 90" stroke={S} strokeWidth="0.6" opacity="0.3" />
    <path d="M175 100 Q160 85 150 75" stroke={S} strokeWidth="0.6" opacity="0.3" />
    <path d="M175 85 Q185 70 195 60" stroke={S} strokeWidth="0.5" opacity="0.25" />
    {/* Tree canopy */}
    <ellipse cx="175" cy="65" rx="35" ry="40" stroke={S} strokeWidth="0.6" fill={F} opacity="0.25" />
    {/* Falling leaves */}
    <path d="M140 100 Q143 105 140 110 Q137 105 140 100Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.3" />
    <path d="M155 130 Q158 135 155 140 Q152 135 155 130Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    <path d="M120 145 Q123 150 120 155 Q117 150 120 145Z" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.25" />
    <path d="M190 110 Q193 115 190 120 Q187 115 190 110Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.2" />
    {/* Fallen leaves on ground */}
    <path d="M50 218 Q53 215 56 218 Q53 221 50 218Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.2" />
    <path d="M80 220 Q83 217 86 220 Q83 223 80 220Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.18" />
    <path d="M130 219 Q133 216 136 219 Q133 222 130 219Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.18" />
  </svg>,

  // 4: Kitchen counter with recipe book, herbs, timer
  <svg key="d4" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Counter */}
    <rect x="0" y="170" width="200" height="12" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    {/* Cabinet below */}
    <rect x="0" y="182" width="200" height="70" stroke={SL} strokeWidth="0.4" fill={F} opacity="0.15" />
    <line x1="100" y1="182" x2="100" y2="252" stroke={SL} strokeWidth="0.3" opacity="0.12" />
    <circle cx="90" cy="215" r="2" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.15" />
    <circle cx="110" cy="215" r="2" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.15" />
    {/* Recipe book stand */}
    <path d="M45 100 L45 168 L100 168 L100 100Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <path d="M45 100 L72 85 L100 100" stroke={S} strokeWidth="0.5" fill={F} opacity="0.15" />
    {/* Recipe text */}
    <line x1="52" y1="112" x2="93" y2="112" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="52" y1="118" x2="90" y2="118" stroke={SL} strokeWidth="0.25" opacity="0.16" />
    <line x1="52" y1="124" x2="88" y2="124" stroke={SL} strokeWidth="0.25" opacity="0.18" />
    <line x1="52" y1="130" x2="92" y2="130" stroke={SL} strokeWidth="0.25" opacity="0.15" />
    {/* Herb pot 1 */}
    <path d="M130 145 L135 168 L150 168 L155 145Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <path d="M142 145 Q138 120 130 105" stroke={S} strokeWidth="0.4" fill="none" opacity="0.3" />
    <path d="M142 145 Q140 125 135 110" stroke={S} strokeWidth="0.4" fill="none" opacity="0.3" />
    <path d="M142 145 Q146 120 152 108" stroke={S} strokeWidth="0.4" fill="none" opacity="0.3" />
    <path d="M130 105 Q125 98 128 92 Q132 98 130 105Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.25" />
    <path d="M135 110 Q131 102 134 96 Q138 102 135 110Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.25" />
    <path d="M152 108 Q156 100 153 94 Q149 100 152 108Z" stroke={SL} strokeWidth="0.3" fill={F} opacity="0.25" />
    {/* Kitchen timer */}
    <circle cx="25" cy="150" r="12" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <circle cx="25" cy="150" r="9" stroke={SL} strokeWidth="0.3" fill="none" opacity="0.25" />
    <line x1="25" y1="143" x2="25" y2="150" stroke={S} strokeWidth="0.4" opacity="0.3" />
    <line x1="25" y1="150" x2="30" y2="153" stroke={S} strokeWidth="0.3" opacity="0.25" />
    <path d="M22 137 L25 133 L28 137" stroke={S} strokeWidth="0.4" fill="none" opacity="0.3" />
    {/* Wooden spoon */}
    <line x1="170" y1="95" x2="176" y2="168" stroke={S} strokeWidth="0.6" opacity="0.35" />
    <ellipse cx="169" cy="92" rx="6" ry="10" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
  </svg>,

  // 5: Study desk with calendar, pen holder, small clock
  <svg key="d5" viewBox="0 0 200 260" className="left-page-sketch">
    {/* Desk */}
    <path d="M5 185 L195 185 L200 190 L0 190Z" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <line x1="10" y1="190" x2="10" y2="250" stroke={S} strokeWidth="0.6" opacity="0.3" />
    <line x1="190" y1="190" x2="190" y2="250" stroke={S} strokeWidth="0.6" opacity="0.3" />
    {/* Calendar */}
    <rect x="20" y="100" width="55" height="60" rx="2" stroke={S} strokeWidth="0.7" fill={F} opacity="0.4" />
    <rect x="20" y="100" width="55" height="12" rx="2" stroke={S} strokeWidth="0.5" fill={FD} opacity="0.3" />
    {/* Calendar grid */}
    {[0,1,2,3].map(r => [0,1,2,3,4,5,6].map(c => <rect key={`${r}-${c}`} x={24+c*7} y={118+r*10} width="5" height="5" stroke={SL} strokeWidth="0.2" fill="none" opacity="0.15" />))}
    {/* Today marker */}
    <rect x={24+3*7} y={118+1*10} width="5" height="5" fill={FD} opacity="0.3" />
    {/* Pen holder */}
    <path d="M140 130 L143 183 L168 183 L171 130Z" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <ellipse cx="155" cy="130" rx="15" ry="5" stroke={S} strokeWidth="0.5" fill={F} opacity="0.3" />
    {/* Pens */}
    <line x1="148" y1="130" x2="146" y2="80" stroke={S} strokeWidth="0.5" opacity="0.35" />
    <line x1="155" y1="130" x2="155" y2="75" stroke={S} strokeWidth="0.5" opacity="0.35" />
    <line x1="162" y1="130" x2="164" y2="85" stroke={S} strokeWidth="0.5" opacity="0.35" />
    <circle cx="146" cy="78" r="1.5" fill={S} opacity="0.2" />
    {/* Small notebook */}
    <rect x="85" y="155" width="40" height="28" rx="1" stroke={S} strokeWidth="0.6" fill={F} opacity="0.4" />
    <line x1="90" y1="162" x2="118" y2="162" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="90" y1="168" x2="115" y2="168" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    <line x1="90" y1="174" x2="112" y2="174" stroke={SL} strokeWidth="0.2" opacity="0.15" />
    {/* Reading glasses */}
    <ellipse cx="95" cy="145" rx="8" ry="6" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    <ellipse cx="115" cy="145" rx="8" ry="6" stroke={S} strokeWidth="0.5" fill="none" opacity="0.3" />
    <path d="M103 145 Q105 142 107 145" stroke={S} strokeWidth="0.4" fill="none" opacity="0.25" />
    <line x1="87" y1="145" x2="80" y2="143" stroke={S} strokeWidth="0.4" opacity="0.25" />
    <line x1="123" y1="145" x2="130" y2="143" stroke={S} strokeWidth="0.4" opacity="0.25" />
  </svg>,
];

/* ════════════════════════════════════════════════════
   NOTEBOOK — 5 scenes  
   ════════════════════════════════════════════════════ */
const notebookSketches = [journalSketches[2], journalSketches[0], dailyLogSketches[2], journalSketches[3], dailyLogSketches[4]];

/* ════════════════════════════════════════════════════
   PROJECT — 5 scenes (reuse fitting ones + unique)
   ════════════════════════════════════════════════════ */
const projectSketches = [journalSketches[4], dailyLogSketches[3], journalSketches[0], dailyLogSketches[1], journalSketches[2]];

/* ════════════════════════════════════════════════════
   CUSTOM — 5 scenes (mix of all)
   ════════════════════════════════════════════════════ */
const customSketches = [journalSketches[1], dailyLogSketches[0], journalSketches[3], dailyLogSketches[2], journalSketches[4]];

const allSketches: Record<string, React.ReactNode[]> = {
  'journal': journalSketches,
  'daily-log': dailyLogSketches,
  'notebook': notebookSketches,
  'project': projectSketches,
  'custom': customSketches,
};

export function LeftPageSketch({ bookType }: { bookType: string }) {
  const [index] = React.useState(() => Math.floor(Math.random() * 5));
  const scenes = allSketches[bookType] || allSketches['journal'];
  return <>{scenes[index % scenes.length]}</>;
}
