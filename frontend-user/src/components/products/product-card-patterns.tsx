'use client';

import React from 'react';

/**
 * Visual Theme definition for Product Cards
 * Each product receives its own soft pastel background, matching thin border,
 * brand accent stroke color, and bespoke subtle SVG background pattern.
 */
export interface ProductVisualTheme {
  id: string;
  name: string;
  cardBg: string; // Tailwind gradient classes
  cardBorder: string; // Tailwind border classes
  cardShadow?: string; // Subtle brand-tinted soft shadow
  accentColor: string; // Hex color for SVG strokes & fills
  pattern: React.FC<{ accentColor: string }>;
}

// ---------------------------------------------------------------------------
// 1. BESPOKE SVG PATTERN COMPONENTS PER BRAND IDENTITY
// ---------------------------------------------------------------------------

/**
 * Netflix: Iconic Ribbon "N", curving film strip ribbon with sprocket perforations, cinematic widescreen frame
 */
export const NetflixPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Cinematic Widescreen Frame in upper right */}
    <rect
      x="172"
      y="18"
      width="98"
      height="56"
      rx="6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeDasharray="5 3"
      opacity="0.6"
    />
    <path d="M 166 28 L 172 28 M 166 64 L 172 64" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    <path d="M 276 28 L 270 28 M 276 64 L 270 64" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />

    {/* Iconic Netflix Ribbon 'N' in upper-right */}
    <g opacity="0.95">
      {/* Left Vertical Pillar */}
      <rect x="208" y="24" width="10" height="44" rx="1.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.2" />
      {/* Right Vertical Pillar */}
      <rect x="246" y="24" width="10" height="44" rx="1.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.2" />
      {/* Diagonal Slanted Ribbon with Shadow/Depth */}
      <polygon
        points="208,24 218,24 256,68 246,68"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>

    {/* Curving Film Strip Ribbon swooping across right */}
    <path
      d="M 150 -10 C 195 30 245 70 295 110"
      stroke="currentColor"
      strokeWidth="1.8"
      opacity="0.85"
    />
    <path
      d="M 125 15 C 170 55 220 95 270 135"
      stroke="currentColor"
      strokeWidth="1.8"
      opacity="0.85"
    />

    {/* Film Frame Divider Bars */}
    <line x1="162" y1="3" x2="137" y2="27" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    <line x1="188" y1="28" x2="163" y2="52" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    <line x1="214" y1="53" x2="189" y2="77" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    <line x1="240" y1="78" x2="215" y2="102" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    <line x1="266" y1="103" x2="241" y2="127" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />

    {/* Film Sprocket Perforation Holes */}
    <rect x="158" y="7" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="184" y="32" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="210" y="57" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="236" y="82" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="262" y="107" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />

    <rect x="135" y="24" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="161" y="49" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="187" y="74" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="213" y="99" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />
    <rect x="239" y="124" width="4.5" height="3" rx="0.8" fill="currentColor" opacity="0.85" />

    {/* Projector Light Beam Ray Lines */}
    <line x1="285" y1="0" x2="160" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.45" />
    <circle cx="275" cy="18" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
  </svg>
);

/**
 * YouTube: Prominent video frame, iconic play button triangle, timeline scrubber & viewfinder corners
 */
export const YouTubePattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Rounded Video Player Screen Frame in upper-right */}
    <rect
      x="184"
      y="18"
      width="90"
      height="60"
      rx="10"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="currentColor"
      fillOpacity="0.08"
      opacity="0.85"
    />

    {/* Prominent Play Triangle centered inside the video frame */}
    <polygon
      points="220,36 244,48 220,60"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.4"
      opacity="0.95"
    />

    {/* Viewfinder Camera Brackets */}
    <path d="M 176 12 L 186 12 L 186 22" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <path d="M 282 12 L 272 12 L 272 22" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <path d="M 282 84 L 272 84 L 272 74" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <path d="M 176 84 L 186 84 L 186 74" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />

    {/* Floating Secondary Play Triangle (center-right) */}
    <polygon
      points="248,96 272,109 248,122"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
      opacity="0.75"
    />

    {/* Video Progress Scrubber Track & Timeline */}
    <line x1="162" y1="164" x2="276" y2="164" stroke="currentColor" strokeWidth="2.2" opacity="0.45" strokeLinecap="round" />
    <line x1="162" y1="164" x2="228" y2="164" stroke="currentColor" strokeWidth="2.8" opacity="0.95" strokeLinecap="round" />
    <circle cx="228" cy="164" r="4.5" fill="currentColor" opacity="0.95" />

    {/* Micro Timeline Buffering Dots */}
    <circle cx="244" cy="164" r="1.8" fill="currentColor" opacity="0.6" />
    <circle cx="258" cy="164" r="1.8" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Apple Music: Elegant floating musical notes, sound wave pulses, audio frequency ripples
 */
export const AppleMusicPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Beamed Eighth Notes (upper-right) */}
    <g opacity="0.95">
      <ellipse cx="224" cy="54" rx="6" ry="4.5" transform="rotate(-25 224 54)" fill="currentColor" />
      <ellipse cx="258" cy="46" rx="6" ry="4.5" transform="rotate(-25 258 46)" fill="currentColor" />
      <line x1="228" y1="52" x2="228" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="262" y1="44" x2="262" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="227" y1="20" x2="263" y2="12" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
    </g>

    {/* Single Quaver / Floating Eighth Note (center-right) */}
    <g opacity="0.8">
      <ellipse cx="196" cy="100" rx="5" ry="3.8" transform="rotate(-25 196 100)" fill="currentColor" />
      <line x1="200" y1="98" x2="200" y2="70" stroke="currentColor" strokeWidth="1.8" />
      <path d="M 200 70 C 211 74 216 82 214 90" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>

    {/* Delicate Semiquaver / Accent Note (far right) */}
    <g opacity="0.7">
      <ellipse cx="266" cy="116" rx="4.2" ry="3" transform="rotate(-25 266 116)" fill="currentColor" />
      <line x1="269" y1="114" x2="269" y2="90" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 269 90 C 277 93 280 98 278 103" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M 269 96 C 277 99 280 104 278 109" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </g>

    {/* Layered Sinusoidal Waveforms across bottom */}
    <path
      d="M 110 178 Q 150 148 190 178 T 270 178 T 310 172"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      opacity="0.75"
    />
    <path
      d="M 130 188 Q 170 162 210 188 T 290 184"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      opacity="0.55"
    />

    {/* Acoustic Concentric Sound Ripples */}
    <path d="M 242 135 A 42 42 0 0 1 284 177" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.5" />
  </svg>
);

/**
 * Google Gemini: Iconic 4-pointed sparkle stars, cosmic orbital arcs, gemstone diamond facets
 */
export const GoogleGeminiPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Large Gemini 4-Point Sparkle Star (upper-right) */}
    <path
      d="M 235 12 C 235 26 247 38 261 38 C 247 38 235 50 235 64 C 235 50 223 38 209 38 C 223 38 235 26 235 12 Z"
      fill="currentColor"
      fillOpacity="0.4"
      stroke="currentColor"
      strokeWidth="1.4"
      opacity="0.95"
    />

    {/* Medium 4-Point Sparkle Star (center-right) */}
    <path
      d="M 264 76 C 264 85 271 92 280 92 C 271 92 264 99 264 108 C 264 99 257 92 248 92 C 257 92 264 85 264 76 Z"
      fill="currentColor"
      fillOpacity="0.35"
      stroke="currentColor"
      strokeWidth="1.2"
      opacity="0.85"
    />

    {/* Delicate Small Sparkle (mid-left in pattern zone) */}
    <path
      d="M 182 44 C 182 50 187 54 193 54 C 187 54 182 58 182 64 C 182 58 177 54 171 54 C 177 54 182 50 182 44 Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.75"
    />

    {/* Micro Sparkle Accent (lower-right) */}
    <path
      d="M 228 135 C 228 139 231 142 235 142 C 231 142 228 145 228 149 C 228 145 225 142 221 142 C 225 142 228 139 228 135 Z"
      fill="currentColor"
      fillOpacity="0.3"
      opacity="0.65"
    />

    {/* Sweeping Orbital Planetary Arc */}
    <path
      d="M 150 10 C 215 24 275 75 288 145"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeDasharray="4 3"
      opacity="0.7"
    />

    {/* Subtle Diamond Facet Lines */}
    <polygon
      points="218,92 234,80 250,92 234,104"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="currentColor"
      fillOpacity="0.1"
      opacity="0.6"
    />
  </svg>
);

/**
 * ChatGPT: AI neural network interlocking hexagonal nodes, circuit traces, synaptic loops
 */
export const ChatGPTPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Hexagon 1 (top-right) */}
    <polygon
      points="228,18 248,18 258,35 248,52 228,52 218,35"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.12"
      opacity="0.9"
    />

    {/* Hexagon 2 (interlocking offset right) */}
    <polygon
      points="254,39 274,39 284,56 274,73 254,73 244,56"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.1"
      opacity="0.85"
    />

    {/* Hexagon 3 (interlocking lower-mid) */}
    <polygon
      points="202,59 222,59 232,76 222,93 202,93 192,76"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.1"
      opacity="0.8"
    />

    {/* Connecting Synaptic Circuit Lines */}
    <line x1="248" y1="52" x2="254" y2="39" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
    <line x1="228" y1="52" x2="222" y2="59" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
    <line x1="202" y1="93" x2="190" y2="120" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.65" />
    <line x1="274" y1="73" x2="265" y2="110" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.65" />

    {/* Neural Connection Nodes */}
    <circle cx="228" cy="18" r="2.8" fill="currentColor" opacity="0.95" />
    <circle cx="248" cy="18" r="2.8" fill="currentColor" opacity="0.95" />
    <circle cx="258" cy="35" r="2.8" fill="currentColor" opacity="0.95" />
    <circle cx="248" cy="52" r="2.8" fill="currentColor" opacity="0.95" />
    <circle cx="218" cy="35" r="2.8" fill="currentColor" opacity="0.95" />
    <circle cx="228" cy="52" r="2.8" fill="currentColor" opacity="0.95" />
    <circle cx="274" cy="39" r="2.5" fill="currentColor" opacity="0.85" />
    <circle cx="284" cy="56" r="2.5" fill="currentColor" opacity="0.85" />
    <circle cx="202" cy="59" r="2.5" fill="currentColor" opacity="0.85" />

    {/* Modern Data Matrix Points */}
    <circle cx="234" cy="148" r="1.8" fill="currentColor" opacity="0.6" />
    <circle cx="248" cy="148" r="1.8" fill="currentColor" opacity="0.6" />
    <circle cx="262" cy="148" r="1.8" fill="currentColor" opacity="0.6" />
    <circle cx="234" cy="162" r="1.8" fill="currentColor" opacity="0.6" />
    <circle cx="248" cy="162" r="1.8" fill="currentColor" opacity="0.6" />
    <circle cx="262" cy="162" r="1.8" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Spotify: Concentric audio ripple arcs, dynamic graphic equalizer sound bars
 */
export const SpotifyPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Concentric Audio Wave Radiating Arcs (Thick, iconic Spotify soundwave curves) */}
    <path
      d="M 284 20 A 105 105 0 0 0 196 92"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      opacity="0.95"
    />
    <path
      d="M 288 38 A 80 80 0 0 0 220 96"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      opacity="0.95"
    />
    <path
      d="M 292 56 A 55 55 0 0 0 244 100"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      opacity="0.95"
    />

    {/* Graphic Equalizer Audio Bars in lower right */}
    <g opacity="0.85">
      <rect x="186" y="146" width="4" height="20" rx="2" fill="currentColor" />
      <rect x="194" y="130" width="4" height="36" rx="2" fill="currentColor" />
      <rect x="202" y="148" width="4" height="18" rx="2" fill="currentColor" />
      <rect x="210" y="124" width="4" height="42" rx="2" fill="currentColor" />
      <rect x="218" y="136" width="4" height="30" rx="2" fill="currentColor" />
      <rect x="226" y="142" width="4" height="24" rx="2" fill="currentColor" />
      <rect x="234" y="128" width="4" height="38" rx="2" fill="currentColor" />
      <rect x="242" y="146" width="4" height="20" rx="2" fill="currentColor" />
      <rect x="250" y="152" width="4" height="14" rx="2" fill="currentColor" />
      <rect x="258" y="138" width="4" height="28" rx="2" fill="currentColor" />
    </g>

    {/* Subtle Sound Pulse Rings */}
    <circle cx="280" cy="115" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
  </svg>
);

/**
 * Canva: Abstract paper-cut fluid contours, vector bezier pen handles, modern Bauhaus shapes
 */
export const CanvaPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Fluid Artboard Contour Silhouette */}
    <path
      d="M 175 -10 C 225 15 285 45 268 110 C 252 165 210 180 282 208 L 290 208 L 290 -10 Z"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M 175 -10 C 225 15 285 45 268 110 C 252 165 210 180 282 208"
      stroke="currentColor"
      strokeWidth="1.6"
      opacity="0.9"
    />

    {/* Secondary Inner Contour */}
    <path
      d="M 210 -10 C 250 20 285 70 280 120"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="4 3"
      opacity="0.6"
    />

    {/* Vector Pen Bezier Handle */}
    <g opacity="0.9">
      <line x1="200" y1="40" x2="254" y2="68" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
      <rect x="224" y="51" width="7" height="7" rx="1.5" fill="currentColor" />
      <circle cx="200" cy="40" r="3.2" stroke="currentColor" strokeWidth="1.5" fill="white" />
      <circle cx="254" cy="68" r="3.2" stroke="currentColor" strokeWidth="1.5" fill="white" />
    </g>

    {/* Graphic Design Frame Corners & Swatches */}
    <rect x="190" y="125" width="44" height="32" rx="3" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5" />
    <circle cx="248" cy="142" r="5.5" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <circle cx="264" cy="142" r="5.5" fill="currentColor" opacity="0.35" />
  </svg>
);

/**
 * CapCut: Video editing multi-track timeline bars, playhead indicator, cut slices, keyframe diamonds
 */
export const CapCutPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Multi-Track Timeline Lanes */}
    <g opacity="0.85">
      <rect x="165" y="24" width="112" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
      <rect x="185" y="40" width="92" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      <rect x="152" y="56" width="125" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
    </g>

    {/* Playhead Indicator with Triangle Marker */}
    <polygon points="224,14 230,22 218,22" fill="currentColor" opacity="0.95" />
    <line x1="224" y1="22" x2="224" y2="80" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 2" opacity="0.95" />

    {/* Animation Keyframe Diamonds */}
    <polygon points="204,30 208,34 204,38 200,34" fill="currentColor" opacity="0.95" />
    <polygon points="246,46 250,50 246,54 242,50" fill="currentColor" opacity="0.95" />
    <polygon points="180,62 184,66 180,70 176,66" fill="currentColor" opacity="0.95" />

    {/* Transition Cut / Razor Marks */}
    <line x1="250" y1="24" x2="250" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
    <line x1="210" y1="56" x2="210" y2="68" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />

    {/* Video Clip Frame Bounding Wireframe (lower-right) */}
    <rect x="195" y="128" width="76" height="42" rx="4" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.55" />
    <circle cx="233" cy="149" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
  </svg>
);

/**
 * Telegram: Elegant paper plane vector, aerodynamic flight wind trails, communication ripples
 */
export const TelegramPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Origami Paper Airplane soaring diagonally */}
    <g opacity="0.85">
      <polygon
        points="205,72 268,26 242,82 226,65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Paper Fold Lines */}
      <line x1="205" y1="72" x2="242" y2="82" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="226,65 242,82 234,80" fill="currentColor" opacity="0.3" />
    </g>

    {/* Dynamic Flight Dashed Wind Trails */}
    <path
      d="M 135 115 Q 175 100 205 72"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeDasharray="4 3"
      opacity="0.65"
    />
    <path
      d="M 155 130 Q 195 115 220 78"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeDasharray="3 3"
      opacity="0.5"
    />

    {/* Communication Signal Waves / Ripple Arcs */}
    <path d="M 240 140 A 35 35 0 0 1 275 175" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
    <path d="M 225 140 A 50 50 0 0 1 275 190" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.35" />
  </svg>
);

/**
 * Zoom: Multi-participant conference window grid, camera aperture iris, connection bubbles
 */
export const ZoomPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* 4-Participant Video Window Grid */}
    <g opacity="0.75">
      <rect x="175" y="20" width="46" height="30" rx="3.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
      <rect x="226" y="20" width="46" height="30" rx="3.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
      <rect x="175" y="55" width="46" height="30" rx="3.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
      <rect x="226" y="55" width="46" height="30" rx="3.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
    </g>

    {/* Video Active Speaker Indicator on Tile 1 */}
    <circle cx="182" cy="27" r="2.2" fill="currentColor" opacity="0.8" />

    {/* Camera Lens Aperture Ring (lower right) */}
    <circle cx="242" cy="148" r="24" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
    <circle cx="242" cy="148" r="10" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    {/* Aperture Iris Blades */}
    <line x1="228" y1="135" x2="248" y2="140" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    <line x1="255" y1="138" x2="246" y2="158" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    <line x1="248" y1="160" x2="228" y2="155" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

/**
 * Microsoft 365: Fluent isometric perspective window quadrants, layered document facets
 */
export const Microsoft365Pattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Perspective Fluent Four-Quadrant Window Panes */}
    <g opacity="0.85">
      <path d="M 214 26 L 244 20 L 244 48 L 214 53 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      <path d="M 249 19 L 278 14 L 278 42 L 249 47 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
      <path d="M 214 57 L 244 52 L 244 80 L 214 84 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
      <path d="M 249 51 L 278 46 L 278 74 L 249 78 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
    </g>

    {/* Layered Document Sheets (lower-right) */}
    <rect x="210" y="125" width="48" height="34" rx="2" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.05" opacity="0.5" />
    <rect x="224" y="135" width="48" height="34" rx="2" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.08" opacity="0.6" />

    {/* Subtle Grid Guidelines */}
    <line x1="180" y1="178" x2="275" y2="178" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
  </svg>
);

/**
 * Google One: Cloud silhouette contour curves, concentric storage ring segments
 */
export const GoogleOnePattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Cloud Silhouette Contour Curves */}
    <path
      d="M 188 68 C 188 56 199 46 215 46 C 225 34 246 34 258 46 C 270 46 280 56 278 70 C 286 76 284 88 274 94 C 263 96 196 96 188 83 Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="currentColor"
      fillOpacity="0.08"
      opacity="0.85"
    />

    {/* Concentric Storage Breakdown Ring Segments */}
    <path
      d="M 240 120 A 38 38 0 0 1 278 158"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.75"
    />
    <path
      d="M 278 158 A 38 38 0 0 1 240 196"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeDasharray="4 3"
      strokeLinecap="round"
      opacity="0.5"
    />

    {/* Rainbow Multi-arc Swooshes */}
    <path
      d="M 155 18 C 215 32 265 75 285 125"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="3 3"
      opacity="0.4"
    />
  </svg>
);

/**
 * iQIYI: VIP cinema ticket ribbon, widescreen curved cinema glow, oriental diamond stars
 */
export const IQIYIPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* VIP Cinema Ticket Stub with Perforated Notch */}
    <g opacity="0.8">
      <rect x="180" y="24" width="88" height="46" rx="4" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.06" />
      <circle cx="180" cy="47" r="4.5" fill="currentColor" />
      <circle cx="268" cy="47" r="4.5" fill="currentColor" />
      <line x1="212" y1="24" x2="212" y2="70" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
    </g>

    {/* Widescreen Cinema Screen Arc */}
    <path d="M 160 145 C 205 130 250 130 285 145" stroke="currentColor" strokeWidth="1.6" opacity="0.65" />
    <path d="M 160 170 C 205 155 250 155 285 170" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />

    {/* Sparkling Oriental Diamond Stars */}
    <polygon points="248,32 251,37 256,37 252,40 254,45 248,42 242,45 244,40 240,37 245,37" fill="currentColor" opacity="0.75" />
    <polygon points="196,88 198,92 202,92 199,94 200,98 196,96 192,98 193,94 190,92 194,92" fill="currentColor" opacity="0.5" />
  </svg>
);

/**
 * Vidio: Athletic pitch curves, stadium boundary lines, live sports broadcast chevrons
 */
export const VidioPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Sports Stadium Pitch Center Circle & Touchline */}
    <path d="M 210 10 A 65 65 0 0 0 210 145" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    <line x1="210" y1="10" x2="210" y2="145" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <circle cx="210" cy="78" r="26" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <circle cx="210" cy="78" r="2" fill="currentColor" opacity="0.8" />

    {/* Forward Energy Chevrons (Live Sports Streaming) */}
    <g opacity="0.8">
      <path d="M 240 40 L 248 48 L 240 56" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 252 40 L 260 48 L 252 56" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 264 40 L 272 48 L 264 56" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Broadcast Signal Arc */}
    <path d="M 230 140 Q 255 125 280 145" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.45" />
  </svg>
);

/**
 * Viu: Film director clapperboard diagonal stripes, romance drama twinkle sparkles
 */
export const ViuPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Clapperboard Slanted Top Bar */}
    <g opacity="0.85">
      <polygon points="185,20 270,14 270,32 185,38" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      {/* Hazard Stripes */}
      <line x1="200" y1="19" x2="192" y2="37" stroke="currentColor" strokeWidth="1.5" />
      <line x1="218" y1="18" x2="210" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <line x1="236" y1="16" x2="228" y2="34" stroke="currentColor" strokeWidth="1.5" />
      <line x1="254" y1="15" x2="246" y2="33" stroke="currentColor" strokeWidth="1.5" />
    </g>

    {/* Romance K-Drama Sparkle Twinkles */}
    <path d="M 245 65 C 245 71 249 75 255 75 C 249 75 245 79 245 85 C 245 79 241 75 235 75 C 241 75 245 71 245 65 Z" fill="currentColor" opacity="0.75" />
    <path d="M 215 95 C 215 99 218 102 222 102 C 218 102 215 105 215 109 C 215 105 212 102 208 102 C 212 102 215 99 215 95 Z" fill="currentColor" opacity="0.6" />

    {/* Cinema Reel Ribbon curve */}
    <path d="M 170 160 C 210 140 250 150 280 180" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />
  </svg>
);

/**
 * WeTV: Flowing entertainment ribbons, dramatic starbursts, curved screen frames
 */
export const WeTVPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Flowing Entertainment Ribbon Curves */}
    <path
      d="M 160 25 C 210 15 250 65 235 110 C 220 155 260 170 285 190"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.8"
    />
    <path
      d="M 180 20 C 230 10 270 60 255 105 C 240 150 280 165 295 185"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="4 3"
      opacity="0.5"
    />

    {/* Starburst Sparks */}
    <polygon points="252,38 255,44 261,44 256,48 258,54 252,50 246,54 248,48 243,44 249,44" fill="currentColor" opacity="0.75" />
    <circle cx="218" cy="80" r="2" fill="currentColor" opacity="0.6" />
    <circle cx="270" cy="120" r="2" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Bstation (Bilibili): Retro TV monitor frame, antennae, horizontal danmaku bullet-chat streams
 */
export const BstationPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Retro TV Antennae Angles */}
    <path d="M 235 34 L 218 14 M 245 34 L 262 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    <circle cx="218" cy="14" r="2" fill="currentColor" opacity="0.8" />
    <circle cx="262" cy="14" r="2" fill="currentColor" opacity="0.8" />

    {/* Horizontal Danmaku Bullet-Comment Stream Trails */}
    <line x1="160" y1="52" x2="235" y2="52" stroke="currentColor" strokeWidth="1.6" strokeDasharray="7 4" opacity="0.7" />
    <line x1="195" y1="68" x2="275" y2="68" stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 3" opacity="0.75" />
    <line x1="175" y1="84" x2="250" y2="84" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />

    {/* Playful Anime Sparkles */}
    <polygon points="256,42 258,46 262,46 259,49 260,53 256,50 252,53 253,49 250,46 254,46" fill="currentColor" opacity="0.8" />
    <polygon points="220,135 222,138 225,138 223,140 224,143 220,141 216,143 217,140 215,138 218,138" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Alight Motion: Bezier curve with tangent handles, motion interpolation graph, keyframe diamonds
 */
export const AlightMotionPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Motion Interpolation Ease Curve */}
    <path
      d="M 160 160 C 205 160 215 36 270 36"
      stroke="currentColor"
      strokeWidth="1.8"
      opacity="0.85"
    />

    {/* Bezier Tangent Control Handles */}
    <g opacity="0.75">
      <line x1="205" y1="160" x2="215" y2="36" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="205" cy="160" r="3.2" fill="currentColor" />
      <circle cx="215" cy="36" r="3.2" fill="currentColor" />
    </g>

    {/* Motion Keyframe Diamonds */}
    <polygon points="240,65 244,69 240,73 236,69" fill="currentColor" opacity="0.85" />
    <polygon points="185,130 189,134 185,138 181,134" fill="currentColor" opacity="0.75" />

    {/* Speed Lines */}
    <line x1="240" y1="120" x2="275" y2="120" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.5" />
    <line x1="225" y1="130" x2="265" y2="130" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
  </svg>
);

/**
 * Mobile Legends: Diamond crystal gem polygons, shield crest angles, victory stars
 */
export const MobileLegendsPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Diamond Gem Polygon */}
    <g opacity="0.85">
      <polygon points="240,18 268,34 240,76 212,34" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.08" />
      <line x1="240" y1="18" x2="240" y2="76" stroke="currentColor" strokeWidth="1.1" />
      <line x1="212" y1="34" x2="268" y2="34" stroke="currentColor" strokeWidth="1.1" />
      <line x1="226" y1="18" x2="240" y2="34" stroke="currentColor" strokeWidth="1" />
      <line x1="254" y1="18" x2="240" y2="34" stroke="currentColor" strokeWidth="1" />
    </g>

    {/* Legendary Shield Crest Lines */}
    <path d="M 180 60 L 205 50 L 230 60 L 205 95 Z" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" />

    {/* Celestial Victory Star */}
    <polygon points="262,95 264,100 270,100 265,103 267,108 262,105 257,108 259,103 254,100 260,100" fill="currentColor" opacity="0.7" />
  </svg>
);

/**
 * PUBG Mobile: Tactical reticle crosshair, airdrop crate corners, radar sweep
 */
export const PUBGMobilePattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Tactical Reticle Concentric Rings & Crosshairs */}
    <g opacity="0.85">
      <circle cx="236" cy="52" r="28" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 3" />
      <circle cx="236" cy="52" r="14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="236" cy="52" r="2" fill="currentColor" />
      <line x1="236" y1="16" x2="236" y2="88" stroke="currentColor" strokeWidth="1" />
      <line x1="200" y1="52" x2="272" y2="52" stroke="currentColor" strokeWidth="1" />
    </g>

    {/* Range Distance Ticks */}
    <line x1="232" y1="34" x2="240" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.7" />
    <line x1="232" y1="70" x2="240" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.7" />

    {/* Radar Sweep Arc */}
    <path d="M 200 130 A 55 55 0 0 1 270 170" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.45" />
  </svg>
);

/**
 * Disney+: Iconic enchanted arc swoosh, fairy tale sparkle cluster
 */
export const DisneyPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Parabolic Magic Shooting Star Swoosh */}
    <path
      d="M 140 135 Q 225 110 262 25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.85"
    />
    <path
      d="M 160 145 Q 235 125 272 40"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeDasharray="4 3"
      opacity="0.55"
    />

    {/* Enchanted Fairy Sparkle Cluster at apex */}
    <path d="M 262 16 C 262 21 265 24 270 24 C 265 24 262 27 262 32 C 262 27 259 24 254 24 C 259 24 262 21 262 16 Z" fill="currentColor" opacity="0.9" />
    <path d="M 245 42 C 245 46 247 48 251 48 C 247 48 245 50 245 54 C 245 50 243 48 239 48 C 243 48 245 46 245 42 Z" fill="currentColor" opacity="0.7" />
    <path d="M 275 52 C 275 55 277 57 280 57 C 277 57 275 59 275 62 C 275 59 273 57 270 57 C 273 57 275 55 275 52 Z" fill="currentColor" opacity="0.65" />
  </svg>
);

/**
 * Claude / Anthropic: Harmonic conversational thought petals, typographic asterisk nodes
 */
export const ClaudePattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Geometric Multi-Petal Thought Asterisk (upper right) */}
    <g opacity="0.85">
      <circle cx="236" cy="46" r="3" fill="currentColor" />
      <line x1="236" y1="24" x2="236" y2="68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="217" y1="35" x2="255" y2="57" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="217" y1="57" x2="255" y2="35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="236" cy="24" rx="2.5" ry="1.5" fill="currentColor" />
      <ellipse cx="236" cy="68" rx="2.5" ry="1.5" fill="currentColor" />
    </g>

    {/* Concentric Philosophical Harmonic Rings */}
    <circle cx="236" cy="46" r="36" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
    <circle cx="236" cy="46" r="52" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />
  </svg>
);

/**
 * Midjourney: Golden ratio logarithmic spiral, perspective generative prompt canvas
 */
export const MidjourneyPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Logarithmic Golden Ratio Spiral */}
    <path
      d="M 235 55 A 10 10 0 0 1 245 65 A 20 20 0 0 1 225 85 A 35 35 0 0 1 190 50 A 55 55 0 0 1 245 -5"
      stroke="currentColor"
      strokeWidth="1.4"
      opacity="0.8"
    />

    {/* Perspective Prompt Canvas Grid */}
    <line x1="160" y1="170" x2="280" y2="170" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <line x1="190" y1="182" x2="285" y2="182" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="200" y1="194" x2="290" y2="194" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    <line x1="180" y1="160" x2="210" y2="205" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    <line x1="230" y1="160" x2="245" y2="205" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    <line x1="270" y1="160" x2="275" y2="205" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

/**
 * Grammarly: Proofreading loop, typographic baseline waves, validation checkmark arc
 */
export const GrammarlyPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Proofreading Ring Loop */}
    <circle cx="236" cy="48" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
    <circle cx="236" cy="48" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.45" />

    {/* Active Validation Checkmark Arc */}
    <path
      d="M 227 48 L 234 55 L 247 42"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />

    {/* Typographic Baseline Correction Wave */}
    <path
      d="M 150 152 Q 165 144 180 152 T 210 152 T 240 152 T 270 152"
      stroke="currentColor"
      strokeWidth="1.3"
      opacity="0.6"
    />
  </svg>
);

/**
 * Duolingo: Iconic owl eyes & face silhouette, feather plumage curves, daily learning streak flame
 */
export const DuolingoPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Duo Owl Eyes Silhouette */}
    <g opacity="0.95">
      {/* Outer Eye Rings */}
      <circle cx="218" cy="45" r="16" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.12" />
      <circle cx="254" cy="45" r="16" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.12" />
      {/* Friendly Curious Pupils */}
      <circle cx="221" cy="43" r="7.5" fill="currentColor" fillOpacity="0.45" />
      <circle cx="251" cy="43" r="7.5" fill="currentColor" fillOpacity="0.45" />
      {/* Eye Shine Sparkles */}
      <circle cx="223" cy="40" r="2.2" fill="white" />
      <circle cx="253" cy="40" r="2.2" fill="white" />
      {/* Cute Orange/Green Triangular Beak */}
      <polygon points="233,52 239,52 236,61" fill="currentColor" fillOpacity="0.75" />
    </g>

    {/* Feather Wing Plumage Curves */}
    <path
      d="M 185 88 C 215 78 250 82 278 112"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.85"
    />
    <path
      d="M 205 98 C 230 92 258 100 274 128"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.65"
    />
    <path
      d="M 222 108 C 242 105 264 114 272 138"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.5"
    />

    {/* Duolingo Daily Streak Flame (lower right) */}
    <path
      d="M 252 145 C 252 135 258 130 258 122 C 265 128 270 136 270 145 C 270 155 262 162 252 162 C 242 162 238 155 238 147 C 238 138 245 132 248 126 C 248 135 252 140 252 145 Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.2"
      opacity="0.85"
    />

    {/* Achievement Star Sparkles */}
    <polygon points="200,32 202,36 206,36 203,39 204,43 200,41 196,43 197,39 194,36 198,36" fill="currentColor" opacity="0.65" />
    <circle cx="272" cy="30" r="2" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Meitu: Beauty photo retouching, camera lens aperture iris, portrait glow sparkles
 */
export const MeituPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Camera Lens Aperture Ring */}
    <g opacity="0.85">
      <circle cx="238" cy="50" r="26" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="238" cy="50" r="12" stroke="currentColor" strokeWidth="1.2" />
      {/* Aperture Iris Blades */}
      <line x1="224" y1="36" x2="244" y2="42" stroke="currentColor" strokeWidth="1" />
      <line x1="252" y1="40" x2="242" y2="60" stroke="currentColor" strokeWidth="1" />
      <line x1="244" y1="62" x2="224" y2="56" stroke="currentColor" strokeWidth="1" />
    </g>

    {/* Beauty Glow Sparkles */}
    <path
      d="M 195 28 C 195 34 199 38 205 38 C 199 38 195 42 195 48 C 195 42 191 38 185 38 C 191 38 195 34 195 28 Z"
      fill="currentColor"
      opacity="0.85"
    />
    <path
      d="M 268 94 C 268 98 271 101 275 101 C 271 101 268 104 268 108 C 268 104 265 101 261 101 C 265 101 268 98 268 94 Z"
      fill="currentColor"
      opacity="0.75"
    />

    {/* Portrait Focus Crop Frame */}
    <path d="M 180 80 L 172 80 L 172 88" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <path d="M 276 80 L 284 80 L 284 88" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <path d="M 180 148 L 172 148 L 172 140" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <path d="M 276 148 L 284 148 L 284 140" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

/**
 * Wink: 4K HD video enhancement sparkles, video playback frame, AI retouching curves
 */
export const WinkPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Video Retouch Frame */}
    <rect
      x="185"
      y="22"
      width="88"
      height="54"
      rx="8"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="currentColor"
      fillOpacity="0.08"
      opacity="0.85"
    />

    {/* 4K AI Quality Sparkles across screen */}
    <path
      d="M 228 35 C 228 41 232 45 238 45 C 232 45 228 49 228 55 C 228 49 224 45 218 45 C 224 45 228 41 228 35 Z"
      fill="currentColor"
      opacity="0.9"
    />
    <circle cx="254" cy="38" r="2.5" fill="currentColor" opacity="0.7" />

    {/* Video Enhancement Dynamic Swoosh */}
    <path
      d="M 160 145 C 210 120 250 135 285 175"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.75"
    />
    <circle cx="240" cy="140" r="18" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
  </svg>
);

/**
 * Getcontact: Caller ID security shield, verified checkmark, telephone ring signal waves
 */
export const GetcontactPattern: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    {/* Caller ID Trust Shield */}
    <g opacity="0.9">
      <path
        d="M 238 20 L 268 32 L 268 62 C 268 82 238 98 238 98 C 238 98 208 82 208 62 L 208 32 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Verified Trust Checkmark inside shield */}
      <path
        d="M 226 55 L 235 64 L 250 46"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>

    {/* Concentric Incoming Call Ring Waves */}
    <path d="M 194 36 A 48 48 0 0 0 194 84" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.75" />
    <path d="M 182 26 A 65 65 0 0 0 182 94" stroke="currentColor" strokeWidth="1.3" strokeDasharray="4 3" opacity="0.55" />

    {/* Verified Trust Line Grid */}
    <line x1="170" y1="160" x2="275" y2="160" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.45" />
    <circle cx="245" cy="140" r="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

/**
 * Procedural Universal Fallback 1: Modern geometric isometric grid & floating facets
 */
export const FallbackPatternGrid: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    <g opacity="0.75">
      <polygon points="230,25 255,10 280,25 255,40" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      <polygon points="230,25 255,40 255,70 230,55" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.05" />
      <polygon points="255,40 280,25 280,55 255,70" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
    </g>
    <line x1="160" y1="160" x2="280" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
    <circle cx="215" cy="95" r="3" fill="currentColor" opacity="0.6" />
    <circle cx="265" cy="115" r="2" fill="currentColor" opacity="0.6" />
  </svg>
);

/**
 * Procedural Universal Fallback 2: Ambient curved ripples & floating micro stars
 */
export const FallbackPatternRipples: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    <path d="M 160 30 Q 220 15 270 60 T 290 140" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <path d="M 180 50 Q 235 35 280 80" stroke="currentColor" strokeWidth="1.1" strokeDasharray="4 3" opacity="0.5" />
    <polygon points="240,85 242,90 247,90 243,93 245,98 240,95 235,98 237,93 233,90 238,90" fill="currentColor" opacity="0.7" />
    <circle cx="205" cy="140" r="18" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
  </svg>
);

/**
 * Procedural Universal Fallback 3: Digital matrix arcs & diamond nodes
 */
export const FallbackPatternMatrix: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    <polygon points="245,24 260,39 245,54 230,39" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.08" opacity="0.8" />
    <polygon points="215,64 225,74 215,84 205,74" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.06" opacity="0.7" />
    <line x1="245" y1="54" x2="225" y2="74" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    <path d="M 170 170 C 210 155 250 165 280 185" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
  </svg>
);

/**
 * Procedural Universal Fallback 4: Smooth organic swooshes with accent beads
 */
export const FallbackPatternOrganic: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <svg
    viewBox="0 0 290 205"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    style={{ color: accentColor }}
  >
    <path
      d="M 180 -10 C 220 30 260 70 245 125 C 235 160 270 185 290 205"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.8"
    />
    <circle cx="245" cy="45" r="4.5" fill="currentColor" opacity="0.3" />
    <circle cx="265" cy="75" r="3" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <circle cx="225" cy="115" r="2.5" fill="currentColor" opacity="0.5" />
    <line x1="160" y1="165" x2="270" y2="165" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.35" />
  </svg>
);

// ---------------------------------------------------------------------------
// 2. PRODUCT IDENTITY TO VISUAL THEME REGISTRY
// ---------------------------------------------------------------------------

export const PRODUCT_VISUAL_THEMES: Record<string, ProductVisualTheme> = {
  // 1. Netflix: Cinematic film strip, frame film, cinema screen
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    cardBg: 'from-[#FFF5F5] via-[#FFF8F8] to-[#FCE7F3]/45',
    cardBorder: 'border-rose-200/70 hover:border-rose-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(225,29,72,0.04)]',
    accentColor: '#E11D48',
    pattern: NetflixPattern,
  },

  // 2. YouTube: Play button, triangles, video scrubber & viewfinder
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    cardBg: 'from-[#FFF7F5] via-[#FFFBF9] to-[#FEE2E2]/50',
    cardBorder: 'border-red-200/70 hover:border-red-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(239,68,68,0.04)]',
    accentColor: '#EF4444',
    pattern: YouTubePattern,
  },

  // 3. Apple Music: Music notes, audio waveform, sound waves
  'apple-music': {
    id: 'apple-music',
    name: 'Apple Music',
    cardBg: 'from-[#FCF7FD] via-[#FAF5FC] to-[#F3E8FF]/50',
    cardBorder: 'border-purple-200/70 hover:border-pink-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(168,85,247,0.04)]',
    accentColor: '#EC4899',
    pattern: AppleMusicPattern,
  },

  // 4. Google Gemini: Sparkles, 4-pointed stars, orbital arcs
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    cardBg: 'from-[#FFFDF5] via-[#FFFBF0] to-[#FEF3C7]/45',
    cardBorder: 'border-amber-200/80 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(245,158,11,0.04)]',
    accentColor: '#D97706',
    pattern: GoogleGeminiPattern,
  },
  'google-gemini': {
    id: 'google-gemini',
    name: 'Google Gemini',
    cardBg: 'from-[#FFFDF5] via-[#FFFBF0] to-[#FEF3C7]/45',
    cardBorder: 'border-amber-200/80 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(245,158,11,0.04)]',
    accentColor: '#D97706',
    pattern: GoogleGeminiPattern,
  },

  // 5. ChatGPT: Neural network interlocking geometry, circuit traces
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    cardBg: 'from-[#F4FBF7] via-[#F8FCFA] to-[#DCFCE7]/45',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(16,185,129,0.04)]',
    accentColor: '#059669',
    pattern: ChatGPTPattern,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    cardBg: 'from-[#F4FBF7] via-[#F8FCFA] to-[#DCFCE7]/45',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(16,185,129,0.04)]',
    accentColor: '#059669',
    pattern: ChatGPTPattern,
  },

  // 6. Spotify: Sound waves, equalizer bars, concentric circular audio ripples
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    cardBg: 'from-[#F0FDF4] via-[#F6FCF7] to-[#DCFCE7]/50',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(16,185,129,0.04)]',
    accentColor: '#10B981',
    pattern: SpotifyPattern,
  },

  // 7. Canva: Abstract paper cut shapes, pen tool handles, design elements
  canva: {
    id: 'canva',
    name: 'Canva',
    cardBg: 'from-[#F0F9FF] via-[#F5FAFF] to-[#E0F2FE]/50',
    cardBorder: 'border-sky-200/70 hover:border-sky-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(2,132,199,0.04)]',
    accentColor: '#0284C7',
    pattern: CanvaPattern,
  },

  // 8. CapCut: Editing timeline tracks, playhead slice, keyframe diamonds
  capcut: {
    id: 'capcut',
    name: 'CapCut',
    cardBg: 'from-[#F8FAFC] via-[#F8F7FC] to-[#EDE9FE]/45',
    cardBorder: 'border-indigo-200/70 hover:border-indigo-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(99,102,241,0.04)]',
    accentColor: '#6366F1',
    pattern: CapCutPattern,
  },

  // 9. Telegram: Paper plane, movement dashed lines, communication ripples
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    cardBg: 'from-[#F0F9FF] via-[#F4F9FF] to-[#E0F2FE]/50',
    cardBorder: 'border-sky-200/70 hover:border-sky-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(14,165,233,0.04)]',
    accentColor: '#0284C7',
    pattern: TelegramPattern,
  },

  // 10. Zoom: Video frame grid, camera lens aperture, communication bubbles
  zoom: {
    id: 'zoom',
    name: 'Zoom',
    cardBg: 'from-[#F1F7FF] via-[#F6F9FF] to-[#DBEAFE]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(37,99,235,0.04)]',
    accentColor: '#2563EB',
    pattern: ZoomPattern,
  },

  // 11. Microsoft 365: Fluent perspective window, layered squares & document facets
  'microsoft-365': {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    cardBg: 'from-[#F0F7FF] via-[#F7FAFD] to-[#E0E7FF]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(2,132,199,0.04)]',
    accentColor: '#0284C7',
    pattern: Microsoft365Pattern,
  },
  'office-365': {
    id: 'office-365',
    name: 'Microsoft 365',
    cardBg: 'from-[#F0F7FF] via-[#F7FAFD] to-[#E0E7FF]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(2,132,199,0.04)]',
    accentColor: '#0284C7',
    pattern: Microsoft365Pattern,
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft 365',
    cardBg: 'from-[#F0F7FF] via-[#F7FAFD] to-[#E0E7FF]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(2,132,199,0.04)]',
    accentColor: '#0284C7',
    pattern: Microsoft365Pattern,
  },

  // 12. Google One: Cloud silhouette pattern, storage concentric rings
  'google-one': {
    id: 'google-one',
    name: 'Google One',
    cardBg: 'from-[#F0F9FF] via-[#F7FCFF] to-[#E0F2FE]/45',
    cardBorder: 'border-cyan-200/70 hover:border-cyan-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(6,182,212,0.04)]',
    accentColor: '#0284C7',
    pattern: GoogleOnePattern,
  },

  // 13. iQIYI: Asian cinema VIP ticket, widescreen curved frame
  iqiyi: {
    id: 'iqiyi',
    name: 'iQIYI',
    cardBg: 'from-[#F2FBF5] via-[#F8FCF9] to-[#D1FAE5]/45',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(16,185,129,0.04)]',
    accentColor: '#059669',
    pattern: IQIYIPattern,
  },

  // 14. Vidio: Stadium boundary lines, sports broadcast chevrons
  vidio: {
    id: 'vidio',
    name: 'Vidio',
    cardBg: 'from-[#FFF5F5] via-[#FFF9F9] to-[#FEE2E2]/45',
    cardBorder: 'border-rose-200/70 hover:border-rose-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(225,29,72,0.04)]',
    accentColor: '#E11D48',
    pattern: VidioPattern,
  },

  // 15. Viu: Film clapperboard diagonal stripes, drama romance sparkles
  viu: {
    id: 'viu',
    name: 'Viu',
    cardBg: 'from-[#FFFDF2] via-[#FFFDEB] to-[#FEF08A]/40',
    cardBorder: 'border-amber-200/70 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(245,158,11,0.04)]',
    accentColor: '#D97706',
    pattern: ViuPattern,
  },

  // 16. WeTV: Entertainment ribbon curves, drama starbursts
  wetv: {
    id: 'wetv',
    name: 'WeTV',
    cardBg: 'from-[#FFF8F5] via-[#FFFBF9] to-[#FFEDD5]/45',
    cardBorder: 'border-orange-200/70 hover:border-orange-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(234,88,12,0.04)]',
    accentColor: '#EA580C',
    pattern: WeTVPattern,
  },

  // 17. Bstation (Bilibili): Retro TV monitor frame, antennae, danmaku stream
  bstation: {
    id: 'bstation',
    name: 'Bstation',
    cardBg: 'from-[#FDF6FB] via-[#FBF7FC] to-[#EDE9FE]/45',
    cardBorder: 'border-pink-200/70 hover:border-pink-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(236,72,153,0.04)]',
    accentColor: '#EC4899',
    pattern: BstationPattern,
  },
  bilibili: {
    id: 'bilibili',
    name: 'Bstation',
    cardBg: 'from-[#FDF6FB] via-[#FBF7FC] to-[#EDE9FE]/45',
    cardBorder: 'border-pink-200/70 hover:border-pink-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(236,72,153,0.04)]',
    accentColor: '#EC4899',
    pattern: BstationPattern,
  },

  // 18. Alight Motion: Motion bezier handle, speed graph, keyframe diamonds
  'alight-motion': {
    id: 'alight-motion',
    name: 'Alight Motion',
    cardBg: 'from-[#F8F7FF] via-[#FBFAFF] to-[#EDE9FE]/50',
    cardBorder: 'border-purple-200/70 hover:border-purple-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(124,58,237,0.04)]',
    accentColor: '#7C3AED',
    pattern: AlightMotionPattern,
  },
  alight: {
    id: 'alight',
    name: 'Alight Motion',
    cardBg: 'from-[#F8F7FF] via-[#FBFAFF] to-[#EDE9FE]/50',
    cardBorder: 'border-purple-200/70 hover:border-purple-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(124,58,237,0.04)]',
    accentColor: '#7C3AED',
    pattern: AlightMotionPattern,
  },

  // 19. Mobile Legends: Mythic diamond crystal facets, crest shield lines
  'mobile-legends': {
    id: 'mobile-legends',
    name: 'Mobile Legends',
    cardBg: 'from-[#F5F8FF] via-[#F9FBFF] to-[#E0E7FF]/45',
    cardBorder: 'border-indigo-200/70 hover:border-indigo-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(99,102,241,0.04)]',
    accentColor: '#3B82F6',
    pattern: MobileLegendsPattern,
  },
  mlbb: {
    id: 'mlbb',
    name: 'Mobile Legends',
    cardBg: 'from-[#F5F8FF] via-[#F9FBFF] to-[#E0E7FF]/45',
    cardBorder: 'border-indigo-200/70 hover:border-indigo-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(99,102,241,0.04)]',
    accentColor: '#3B82F6',
    pattern: MobileLegendsPattern,
  },

  // 20. PUBG Mobile: Tactical reticle crosshair, airdrop crate corners
  'pubg-mobile': {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    cardBg: 'from-[#FEFAF4] via-[#FFFDF9] to-[#FEF3C7]/40',
    cardBorder: 'border-amber-200/70 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(217,119,6,0.04)]',
    accentColor: '#D97706',
    pattern: PUBGMobilePattern,
  },
  pubg: {
    id: 'pubg',
    name: 'PUBG Mobile',
    cardBg: 'from-[#FEFAF4] via-[#FFFDF9] to-[#FEF3C7]/40',
    cardBorder: 'border-amber-200/70 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(217,119,6,0.04)]',
    accentColor: '#D97706',
    pattern: PUBGMobilePattern,
  },

  // 21. Disney+: Shooting star magic arc swoosh, fairy sparkle cluster
  disney: {
    id: 'disney',
    name: 'Disney+',
    cardBg: 'from-[#F0F5FF] via-[#F6F9FF] to-[#DBEAFE]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(37,99,235,0.04)]',
    accentColor: '#2563EB',
    pattern: DisneyPattern,
  },

  // 22. Claude: Conversational thought petals, harmonic asterisk geometry
  claude: {
    id: 'claude',
    name: 'Claude',
    cardBg: 'from-[#FDF8F5] via-[#FFFBF9] to-[#FED7AA]/40',
    cardBorder: 'border-amber-200/70 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(194,65,12,0.04)]',
    accentColor: '#C2410C',
    pattern: ClaudePattern,
  },

  // 23. Midjourney: Golden ratio generative spiral, perspective grid
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney',
    cardBg: 'from-[#F8F7FD] via-[#FAF9FE] to-[#EDE9FE]/45',
    cardBorder: 'border-indigo-200/70 hover:border-indigo-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(99,102,241,0.04)]',
    accentColor: '#6366F1',
    pattern: MidjourneyPattern,
  },

  // 24. Grammarly: Proofreading loop, typographic baseline waves
  grammarly: {
    id: 'grammarly',
    name: 'Grammarly',
    cardBg: 'from-[#F0FDF4] via-[#F7FCF9] to-[#DCFCE7]/45',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(16,185,129,0.04)]',
    accentColor: '#059669',
    pattern: GrammarlyPattern,
  },

  // 25. Additional Aliases & Fallbacks
  'apple music': {
    id: 'apple-music',
    name: 'Apple Music',
    cardBg: 'from-[#FCF7FD] via-[#FAF5FC] to-[#F3E8FF]/50',
    cardBorder: 'border-purple-200/70 hover:border-pink-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(168,85,247,0.04)]',
    accentColor: '#EC4899',
    pattern: AppleMusicPattern,
  },
  'google gemini': {
    id: 'google-gemini',
    name: 'Google Gemini',
    cardBg: 'from-[#FFFDF5] via-[#FFFBF0] to-[#FEF3C7]/45',
    cardBorder: 'border-amber-200/80 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(245,158,11,0.04)]',
    accentColor: '#D97706',
    pattern: GoogleGeminiPattern,
  },
  'google one': {
    id: 'google-one',
    name: 'Google One',
    cardBg: 'from-[#F0F9FF] via-[#F7FCFF] to-[#E0F2FE]/45',
    cardBorder: 'border-cyan-200/70 hover:border-cyan-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(6,182,212,0.04)]',
    accentColor: '#0284C7',
    pattern: GoogleOnePattern,
  },
  'microsoft 365': {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    cardBg: 'from-[#F0F7FF] via-[#F7FAFD] to-[#E0E7FF]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(2,132,199,0.04)]',
    accentColor: '#0284C7',
    pattern: Microsoft365Pattern,
  },
  'office 365': {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    cardBg: 'from-[#F0F7FF] via-[#F7FAFD] to-[#E0E7FF]/45',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(2,132,199,0.04)]',
    accentColor: '#0284C7',
    pattern: Microsoft365Pattern,
  },
  'mobile legends': {
    id: 'mobile-legends',
    name: 'Mobile Legends',
    cardBg: 'from-[#F5F8FF] via-[#F9FBFF] to-[#E0E7FF]/45',
    cardBorder: 'border-indigo-200/70 hover:border-indigo-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(99,102,241,0.04)]',
    accentColor: '#3B82F6',
    pattern: MobileLegendsPattern,
  },
  'pubg mobile': {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    cardBg: 'from-[#FEFAF4] via-[#FFFDF9] to-[#FEF3C7]/40',
    cardBorder: 'border-amber-200/70 hover:border-amber-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(217,119,6,0.04)]',
    accentColor: '#D97706',
    pattern: PUBGMobilePattern,
  },
  'alight motion': {
    id: 'alight-motion',
    name: 'Alight Motion',
    cardBg: 'from-[#F8F7FF] via-[#FBFAFF] to-[#EDE9FE]/50',
    cardBorder: 'border-purple-200/70 hover:border-purple-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(124,58,237,0.04)]',
    accentColor: '#7C3AED',
    pattern: AlightMotionPattern,
  },

  // 26. Duolingo: Owl silhouette, plumage curves, streak flame
  duolingo: {
    id: 'duolingo',
    name: 'Duolingo',
    cardBg: 'from-[#F0FDF4] via-[#F7FCF9] to-[#DCFCE7]/55',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(22,163,74,0.04)]',
    accentColor: '#16A34A',
    pattern: DuolingoPattern,
  },

  // 27. Meitu: Beauty photo filter, camera lens aperture iris, portrait glow
  meitu: {
    id: 'meitu',
    name: 'Meitu',
    cardBg: 'from-[#FFF5F7] via-[#FFF9FA] to-[#FCE7F3]/50',
    cardBorder: 'border-pink-200/70 hover:border-pink-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(244,63,94,0.04)]',
    accentColor: '#F43F5E',
    pattern: MeituPattern,
  },

  // 28. Wink: 4K HD video enhancement sparkles, video playback frame
  wink: {
    id: 'wink',
    name: 'Wink',
    cardBg: 'from-[#F8F7FF] via-[#FAF9FF] to-[#EDE9FE]/50',
    cardBorder: 'border-purple-200/70 hover:border-purple-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(139,92,246,0.04)]',
    accentColor: '#8B5CF6',
    pattern: WinkPattern,
  },

  // 29. Getcontact: Caller ID security shield, verified check, phone ring waves
  getcontact: {
    id: 'getcontact',
    name: 'Getcontact',
    cardBg: 'from-[#F0F6FF] via-[#F6FAFF] to-[#DBEAFE]/50',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(37,99,235,0.04)]',
    accentColor: '#2563EB',
    pattern: GetcontactPattern,
  },
  'get-contact': {
    id: 'getcontact',
    name: 'Getcontact',
    cardBg: 'from-[#F0F6FF] via-[#F6FAFF] to-[#DBEAFE]/50',
    cardBorder: 'border-blue-200/70 hover:border-blue-400',
    cardShadow: 'shadow-[0_2px_12px_rgba(37,99,235,0.04)]',
    accentColor: '#2563EB',
    pattern: GetcontactPattern,
  },
};

// ---------------------------------------------------------------------------
// 3. RESOLVER & UNIVERSAL DETERMINISTIC FALLBACK
// ---------------------------------------------------------------------------

/**
 * Resolves the visual theme for a given product slug or name.
 * If not explicitly registered, generates a deterministic procedural fallback.
 */
export function resolveProductVisualTheme(slug: string = '', name: string = ''): ProductVisualTheme {
  const normalizedSlug = (slug || '').toLowerCase().trim();
  const normalizedName = (name || '').toLowerCase().trim();
  const searchKey = `${normalizedSlug} ${normalizedName}`;

  // 1. Direct registry lookup by exact slug
  if (PRODUCT_VISUAL_THEMES[normalizedSlug]) {
    return PRODUCT_VISUAL_THEMES[normalizedSlug];
  }

  // 2. Keyword substring matching (sorted by key length descending for specificity)
  const sortedKeys = Object.keys(PRODUCT_VISUAL_THEMES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (searchKey.includes(key)) {
      return PRODUCT_VISUAL_THEMES[key];
    }
  }

  // 3. Fallback: Deterministic procedure based on string hash
  const seedString = `${normalizedSlug}-${normalizedName}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const fallbackVariants = [
    {
      cardBg: 'from-[#F8FAFC] via-[#F8FAFC] to-[#E2E8F0]/45',
      cardBorder: 'border-slate-200/70 hover:border-slate-400',
      accentColor: '#475569',
      pattern: FallbackPatternGrid,
    },
    {
      cardBg: 'from-[#F0F9FF] via-[#F8FAFC] to-[#E0F2FE]/45',
      cardBorder: 'border-sky-200/70 hover:border-sky-400',
      accentColor: '#0284C7',
      pattern: FallbackPatternRipples,
    },
    {
      cardBg: 'from-[#F5F8FF] via-[#FAF5FF] to-[#EDE9FE]/45',
      cardBorder: 'border-indigo-200/70 hover:border-indigo-400',
      accentColor: '#6366F1',
      pattern: FallbackPatternMatrix,
    },
    {
      cardBg: 'from-[#FFFDF5] via-[#FFFBF0] to-[#FEF3C7]/40',
      cardBorder: 'border-amber-200/70 hover:border-amber-400',
      accentColor: '#D97706',
      pattern: FallbackPatternOrganic,
    },
  ];

  const variant = fallbackVariants[positiveHash % fallbackVariants.length];

  return {
    id: normalizedSlug || 'custom',
    name: name || 'Digital Product',
    cardBg: variant.cardBg,
    cardBorder: variant.cardBorder,
    cardShadow: 'shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
    accentColor: variant.accentColor,
    pattern: variant.pattern,
  };
}

/**
 * Visual Background Pattern Renderer Component
 * Renders the product's tailored pattern at 20-26% opacity for clear recognition while keeping text contrast high.
 * Completely zero layout shift, pointer-events-none, safe behind interactive content.
 */
export function ProductCardBackgroundPattern({
  slug,
  name,
  className = '',
}: {
  slug?: string;
  name?: string;
  className?: string;
}) {
  const theme = resolveProductVisualTheme(slug, name);
  const PatternComponent = theme.pattern;

  return (
    <div
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Brand Vector Pattern with tuned 20-26% opacity for clear visual identity */}
      <div className="absolute inset-0 w-full h-full opacity-[0.20] group-hover:opacity-[0.26] transition-opacity duration-300">
        <PatternComponent accentColor={theme.accentColor} />
      </div>
    </div>
  );
}
