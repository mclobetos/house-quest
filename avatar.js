// Avatar + pet SVG renderer. All original designs.

export const AV = {
  skin: ['#ffe3cc', '#f6cfa9', '#e8b48a', '#c98e62', '#a26a45', '#6e4630'],
  hairColor: ['#1d1a24', '#3b2a20', '#6b4226', '#a8673a', '#d9b26b', '#e9e4da', '#c0392b', '#7a4fd1', '#2e86de', '#1f9e74', '#ff7eb6'],
  eyeColor: ['#3b2a20', '#5a7d2a', '#2e86de', '#7a4fd1', '#c0392b', '#d4a017', '#1f9e74'],
  outfitColor: ['#24243a', '#e8e4dc', '#c0392b', '#ff8c42', '#ffcf4a', '#1f9e74', '#2e86de', '#7a4fd1', '#ff7eb6', '#6d7786'],
  auraColor: ['#ffcf4a', '#ff6b5b', '#3fd0c9', '#7a4fd1', '#59d36b', '#ff7eb6', '#ffffff'],
  hairFront: [
    { id: 'swept', label: 'Swept' }, { id: 'spiky', label: 'Spiky' }, { id: 'messy', label: 'Messy' },
    { id: 'crop', label: 'Short crop' }, { id: 'curly', label: 'Curly' }, { id: 'bangs', label: 'Bangs' },
    { id: 'sidepart', label: 'Side part' }, { id: 'buzz', label: 'Buzz' },
  ],
  hairBack: [
    { id: 'none', label: 'Short' }, { id: 'long', label: 'Long' }, { id: 'ponytail', label: 'Ponytail' },
    { id: 'bun', label: 'Bun' }, { id: 'bob', label: 'Bob' }, { id: 'curly', label: 'Big curls' },
  ],
  facialHair: [
    { id: 'none', label: 'None' }, { id: 'stubble', label: 'Stubble' }, { id: 'short', label: 'Short beard' },
    { id: 'full', label: 'Full beard' }, { id: 'mustache', label: 'Mustache' },
  ],
  expression: [
    { id: 'smile', label: 'Smile' }, { id: 'grin', label: 'Grin' }, { id: 'determined', label: 'Locked in' },
    { id: 'smug', label: 'Smug' }, { id: 'brainfart', label: 'Brain fart' },
  ],
  outfit: [
    { id: 'hoodie', label: 'Hoodie' }, { id: 'jacket', label: 'Jacket' }, { id: 'gi', label: 'Training gi' },
    { id: 'tank', label: 'Gym tank' }, { id: 'cloak', label: 'Cloak', lv: 4 },
  ],
  pattern: [
    { id: 'solid', label: 'Solid' }, { id: 'stripes', label: 'Stripes' }, { id: 'dots', label: 'Dots' },
    { id: 'zigzag', label: 'Zigzag', lv: 3 }, { id: 'stars', label: 'Stars', lv: 6 },
  ],
  accessory: [
    { id: 'none', label: 'None' }, { id: 'headband', label: 'Headband' }, { id: 'glasses', label: 'Glasses' },
    { id: 'earrings', label: 'Earrings' }, { id: 'bandage', label: 'Cheek bandage' }, { id: 'flower', label: 'Flower clip' },
  ],
  prop: [
    { id: 'none', label: 'None' }, { id: 'guitar', label: 'Guitar' }, { id: 'dumbbell', label: 'Dumbbell' },
    { id: 'controller', label: 'Controller' }, { id: 'brush', label: 'Paintbrush' }, { id: 'egg', label: 'Plaster egg' },
    { id: 'goldenEgg', label: 'Golden egg', lv: 5 },
  ],
  aura: [
    { id: 'soft', label: 'Soft' }, { id: 'blaze', label: 'Blaze', lv: 2 }, { id: 'rainbow', label: 'Prismatic', lv: 10 },
  ],
};

export const DEFAULT_AVATARS = {
  josh: {
    name: 'Josh', className: 'Riff Knight',
    skin: '#e8b48a', hairColor: '#1d1a24', eyeColor: '#3b2a20', hairFront: 'crop', hairBack: 'none', facialHair: 'full',
    expression: 'determined', outfit: 'tank', outfitColor: '#24243a', pattern: 'solid',
    accessory: 'headband', prop: 'guitar', aura: 'soft', auraColor: '#ff6b5b',
  },
  nat: {
    name: 'Nat', className: 'Plaster Mage',
    skin: '#f6cfa9', hairColor: '#3b2a20', eyeColor: '#5a7d2a', hairFront: 'curly', hairBack: 'curly', facialHair: 'none',
    expression: 'smile', outfit: 'jacket', outfitColor: '#ff7eb6', pattern: 'dots',
    accessory: 'flower', prop: 'egg', aura: 'soft', auraColor: '#3fd0c9',
  },
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) > 170;
}

let uid = 0;

export function avatarSVG(c, opts = {}) {
  const id = 'a' + (++uid);
  const ink = '#1b1530';
  const hair = c.hairColor, hairD = shade(hair, -30), hairL = shade(hair, 45);
  const skin = c.skin, skinD = shade(skin, -28);
  const oc = c.outfitColor, ocD = shade(oc, -35), ocL = shade(oc, 30);
  const patInk = isLight(oc) ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.22)';
  const s = [];
  const anim = opts.animate !== false;

  s.push(`<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">`);
  s.push(`<defs>
    <radialGradient id="${id}aura" cx="50%" cy="55%" r="50%">
      <stop offset="0%" stop-color="${c.auraColor}" stop-opacity=".75"/>
      <stop offset="60%" stop-color="${c.auraColor}" stop-opacity=".25"/>
      <stop offset="100%" stop-color="${c.auraColor}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}rb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff6b5b"/><stop offset="25%" stop-color="#ffcf4a"/>
      <stop offset="50%" stop-color="#59d36b"/><stop offset="75%" stop-color="#3fd0c9"/><stop offset="100%" stop-color="#7a4fd1"/>
    </linearGradient>
    <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff2a8"/><stop offset="50%" stop-color="#ffcf4a"/><stop offset="100%" stop-color="#c58a12"/>
    </linearGradient>
    <pattern id="${id}stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="5" height="12" fill="${patInk}"/></pattern>
    <pattern id="${id}dots" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="2.4" fill="${patInk}"/></pattern>
    <pattern id="${id}zigzag" width="16" height="10" patternUnits="userSpaceOnUse">
      <path d="M0 8 L4 2 L8 8 L12 2 L16 8" fill="none" stroke="${patInk}" stroke-width="2.4"/></pattern>
    <pattern id="${id}stars" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M10 3 L12 8 L17 8 L13 11 L15 16 L10 13 L5 16 L7 11 L3 8 L8 8 Z" fill="${patInk}"/></pattern>
  </defs>`);

  // Aura
  if (c.aura === 'blaze') {
    s.push(`<g class="${anim ? 'aura-pulse' : ''}" opacity=".85">
      <path d="M100 236 Q20 220 30 140 Q36 170 50 160 Q34 110 62 70 Q64 104 78 100 Q70 50 100 18 Q130 50 122 100 Q136 104 138 70 Q166 110 150 160 Q164 170 170 140 Q180 220 100 236Z" fill="${c.auraColor}" opacity=".55"/>
      <path d="M100 236 Q44 224 50 160 Q60 176 70 170 Q62 130 82 100 Q86 126 100 124 Q114 126 118 100 Q138 130 130 170 Q140 176 150 160 Q156 224 100 236Z" fill="${shade(c.auraColor, 40)}" opacity=".5"/>
    </g>`);
  } else if (c.aura === 'rainbow') {
    s.push(`<circle cx="100" cy="130" r="98" fill="url(#${id}rb)" opacity=".35" class="${anim ? 'aura-spin' : ''}"/>
      <circle cx="100" cy="130" r="80" fill="url(#${id}aura)"/>`);
  } else {
    s.push(`<circle cx="100" cy="130" r="98" fill="url(#${id}aura)" class="${anim ? 'aura-pulse' : ''}"/>`);
  }

  // Back hair
  const hb = {
    long: `<path d="M44 100 Q36 46 100 42 Q164 46 156 100 L162 196 Q146 206 132 186 L68 186 Q54 206 38 196 Z" fill="${hairD}"/>`,
    ponytail: `<path d="M138 56 Q190 64 180 150 Q176 122 150 104 Q156 80 138 56Z" fill="${hairD}"/><circle cx="146" cy="60" r="7" fill="${c.auraColor}"/>`,
    bun: `<circle cx="100" cy="36" r="22" fill="${hairD}"/><path d="M84 30 Q100 22 116 30" stroke="${hairL}" stroke-width="3" fill="none" opacity=".5"/>`,
    bob: `<path d="M44 100 Q38 46 100 42 Q162 46 156 100 L160 146 Q150 156 138 146 L62 146 Q50 156 40 146 Z" fill="${hairD}"/>`,
    curly: (() => {
      const pts = [];
      for (let a = -40; a <= 220; a += 20) {
        const t = a * Math.PI / 180;
        pts.push([100 + 62 * Math.cos(t), 104 - 64 * Math.sin(t)]);
      }
      pts.push([38, 150], [162, 150], [42, 176], [158, 176], [54, 196], [146, 196]);
      return `<g fill="${hairD}" stroke="${ink}" stroke-width="2.2">${pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19"/>`).join('')}</g>`
        + `<g fill="none" stroke="${hair}" stroke-width="3" opacity=".7">${pts.map(([x, y]) => `<path d="M${(x - 7).toFixed(1)} ${y.toFixed(1)} a7 7 0 1 1 7 7"/>`).join('')}</g>`;
    })(),
    none: '',
  };
  s.push(hb[c.hairBack] || '');

  // Cloak behind body
  if (c.outfit === 'cloak') {
    s.push(`<path d="M34 240 Q40 168 100 158 Q160 168 166 240 Z" fill="${ocD}" stroke="${ink}" stroke-width="2.5"/>`);
  }

  // Arms
  const armFill = c.outfit === 'tank' ? skin : oc;
  s.push(`<path d="M60 174 Q38 184 40 226 L56 228 Q56 202 68 188 Z" fill="${armFill}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M140 174 Q162 184 160 226 L144 228 Q144 202 132 188 Z" fill="${armFill}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`);
  if (c.outfit === 'tank') {
    s.push(`<path d="M47 196 Q52 188 58 194" stroke="${skinD}" stroke-width="2" fill="none"/>
      <path d="M153 196 Q148 188 142 194" stroke="${skinD}" stroke-width="2" fill="none"/>`);
  }

  // Neck
  s.push(`<rect x="88" y="138" width="24" height="28" rx="6" fill="${skinD}"/>`);

  // Torso
  const torso = c.outfit === 'tank'
    ? 'M60 240 L62 186 Q64 166 80 160 Q100 176 120 160 Q136 166 138 186 L140 240 Z'
    : 'M52 240 L56 190 Q60 162 100 158 Q140 162 144 190 L148 240 Z';
  s.push(`<path d="${torso}" fill="${oc}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`);
  if (c.pattern && c.pattern !== 'solid') s.push(`<path d="${torso}" fill="url(#${id}${c.pattern})"/>`);

  // Outfit details
  const od = {
    hoodie: `<path d="M68 162 Q100 182 132 162 Q122 150 100 150 Q78 150 68 162Z" fill="${ocD}" stroke="${ink}" stroke-width="2"/>
      <path d="M93 168 L91 190 M107 168 L109 190" stroke="${ocL}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M74 212 L126 212 L120 236 L80 236 Z" fill="${ocD}" opacity=".6"/>`,
    jacket: `<path d="M86 159 L100 198 L114 159 Z" fill="#f5f2ea" stroke="${ink}" stroke-width="2"/>
      <path d="M86 159 L76 178 L96 192 M114 159 L124 178 L104 192" stroke="${ink}" stroke-width="2" fill="${ocL}"/>
      <path d="M100 198 L100 240" stroke="${ink}" stroke-width="2"/>`,
    gi: `<path d="M80 160 L114 210 M122 161 L96 196" stroke="${ocL}" stroke-width="7" stroke-linecap="round"/>
      <path d="M80 160 L114 210 M122 161 L96 196" stroke="${ink}" stroke-width="1.5" fill="none"/>
      <rect x="56" y="218" width="88" height="10" rx="3" fill="${ink}"/>`,
    tank: `<path d="M84 162 Q100 186 116 162" stroke="${ocL}" stroke-width="3" fill="none"/>`,
    cloak: `<path d="M86 160 L100 186 L114 160 Z" fill="${ocL}" stroke="${ink}" stroke-width="2"/>
      <circle cx="100" cy="166" r="6" fill="url(#${id}gold)" stroke="${ink}" stroke-width="1.5"/>`,
  };
  s.push(od[c.outfit] || '');

  // Hands
  s.push(`<circle cx="48" cy="228" r="9" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>
    <circle cx="152" cy="228" r="9" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>`);

  // Ears + face
  s.push(`<ellipse cx="50" cy="108" rx="8" ry="11" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>
    <ellipse cx="150" cy="108" rx="8" ry="11" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>
    <path d="M50 96 Q48 150 100 154 Q152 150 150 96 Q150 46 100 46 Q50 46 50 96Z" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>`);
  s.push(`<ellipse cx="72" cy="126" rx="9" ry="5" fill="#ff7e8a" opacity=".35"/>
    <ellipse cx="128" cy="126" rx="9" ry="5" fill="#ff7e8a" opacity=".35"/>`);

  // Eyes
  const eye = (x) => {
    if (c.expression === 'brainfart') {
      return `<g fill="none" stroke="${ink}" stroke-width="2.4"><path d="M${x} 108 m-9 0 a9 9 0 1 0 18 0 a7 7 0 1 0 -14 0 a5 5 0 1 0 10 0 a3 3 0 1 0 -6 0"/></g>`;
    }
    const lid = c.expression === 'smug' ? `<path d="M${x - 12} 104 L${x + 12} 104 L${x + 12} 96 L${x - 12} 96Z" fill="${skin}"/>` : '';
    const iy = c.expression === 'determined' ? 110 : 109;
    return `<ellipse cx="${x}" cy="109" rx="11" ry="13" fill="#fff" stroke="${ink}" stroke-width="2"/>
      <ellipse cx="${x}" cy="${iy}" rx="8" ry="10" fill="${c.eyeColor}"/>
      <ellipse cx="${x}" cy="${iy + 1}" rx="4" ry="5.5" fill="${ink}"/>
      <circle cx="${x - 3}" cy="${iy - 4}" r="3" fill="#fff"/><circle cx="${x + 3}" cy="${iy + 4}" r="1.4" fill="#fff"/>
      ${lid}
      <path d="M${x - 13} 101 Q${x} 92 ${x + 13} 101" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  };
  s.push(eye(78), eye(122));

  // Brows
  const br = {
    determined: `<path d="M64 86 L90 94 M136 86 L110 94" stroke="${hairD}" stroke-width="4.5" stroke-linecap="round"/>`,
    smug: `<path d="M66 90 Q78 86 90 90 M110 86 Q122 78 134 84" stroke="${hairD}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    brainfart: `<path d="M66 86 Q78 80 90 86 M110 90 Q122 84 134 90" stroke="${hairD}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  };
  s.push(br[c.expression] || `<path d="M66 90 Q78 84 90 89 M110 89 Q122 84 134 90" stroke="${hairD}" stroke-width="4" fill="none" stroke-linecap="round"/>`);

  // Facial hair (drawn under the mouth)
  const beardJaw = 'M50 100 L50 112 Q54 152 100 160 Q146 152 150 112 L150 100 Q148 124 136 132 Q120 142 100 142 Q80 142 64 132 Q52 124 50 100Z';
  const stache = `<path d="M84 127 Q92 119 100 124 Q108 119 116 127 Q108 126 100 129 Q92 126 84 127Z" fill="${hair}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const fhm = {
    stubble: `<path d="${beardJaw}" fill="${hair}" opacity=".28"/><path d="M84 126 Q100 121 116 126" stroke="${hair}" stroke-width="4" opacity=".3" fill="none" stroke-linecap="round"/>`,
    short: `<path d="M60 124 Q68 152 100 158 Q132 152 140 124 Q126 140 100 141 Q74 140 60 124Z" fill="${hair}" stroke="${ink}" stroke-width="2"/>${stache}`,
    full: `<path d="${beardJaw}" fill="${hair}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M86 150 Q100 156 114 150" stroke="${hairL}" stroke-width="2.5" fill="none" opacity=".5"/>${stache}`,
    mustache: stache,
  };
  s.push(fhm[c.facialHair] || '');

  // Mouth
  const mo = {
    grin: `<path d="M86 128 Q100 146 114 128 Z" fill="#7a2230" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M88 129 L112 129 L110 133 L90 133Z" fill="#fff"/>`,
    smile: `<path d="M89 130 Q100 140 111 130" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    determined: `<path d="M90 134 Q100 130 110 134" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    smug: `<path d="M90 133 Q104 138 113 127" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    brainfart: `<ellipse cx="100" cy="134" rx="5" ry="6" fill="#7a2230" stroke="${ink}" stroke-width="2"/>
      <path d="M150 66 Q156 76 150 80 Q144 76 150 66Z" fill="#8fd3ff" stroke="${ink}" stroke-width="1.5"/>
      <text x="160" y="58" font-family="Dela Gothic One, sans-serif" font-size="20" fill="${c.auraColor}" stroke="${ink}" stroke-width="1">?</text>`,
  };
  s.push(mo[c.expression] || mo.smile);

  // Front hair
  const hf = {
    swept: `<path d="M46 110 Q36 40 100 38 Q164 40 154 110 Q150 80 134 70 Q110 96 68 88 Q56 92 46 110Z"/>`,
    spiky: `<path d="M52 72 L34 40 L64 54 L66 18 L88 44 L100 10 L112 44 L134 18 L136 54 L166 40 L150 72Z"/>
      <path d="M46 106 Q40 46 100 42 Q160 46 154 106 L148 86 L140 96 L132 78 L120 90 L110 74 L100 88 L90 74 L80 90 L68 78 L60 96 L52 86Z"/>`,
    messy: `<path d="M46 108 Q38 42 100 38 Q162 42 154 108 Q148 86 138 82 Q132 98 120 84 Q110 100 100 84 Q90 100 80 84 Q68 98 62 82 Q52 86 46 108Z"/>
      <path d="M70 46 Q74 26 90 40 Q96 22 110 38 Q124 24 130 46Z"/>`,
    crop: `<path d="M50 98 Q44 42 100 40 Q156 42 150 98 Q146 76 134 72 L128 80 L120 70 L110 78 L100 68 L90 78 L80 70 L72 80 L66 72 Q54 76 50 98Z"/>`,
    curly: `<path d="M48 104 Q40 40 100 38 Q160 40 152 104 Q148 84 140 82 Q100 74 60 82 Q52 84 48 104Z"/>`
      + [[58, 82], [72, 72], [88, 66], [104, 64], [120, 68], [134, 74], [146, 86], [52, 98], [148, 100], [64, 54], [84, 46], [104, 42], [124, 46], [140, 58]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join(''),
    bangs: `<path d="M46 116 Q38 38 100 38 Q162 38 154 116 L150 90 Q100 82 50 90Z"/>`,
    sidepart: `<path d="M46 114 Q38 40 100 38 Q162 40 154 114 Q150 78 122 62 Q102 92 60 92 Q50 98 46 114Z"/>`,
    buzz: `<path d="M50 92 Q48 44 100 42 Q152 44 150 92 Q140 64 100 62 Q60 64 50 92Z"/>`,
  };
  s.push(`<g fill="${hair}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round">${hf[c.hairFront] || hf.swept}</g>`);
  if (c.hairFront === 'curly') {
    s.push(`<g fill="none" stroke="${hairL}" stroke-width="2.4" opacity=".75">${[[58, 82], [88, 66], [120, 68], [146, 86], [84, 46], [124, 46]].map(([x, y]) => `<path d="M${x - 4} ${y} a4 4 0 1 1 4 4"/>`).join('')}</g>`);
  } else if (c.hairFront !== 'buzz') s.push(`<path d="M70 56 Q88 46 106 50" stroke="${hairL}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`);

  // Accessory
  const ac = {
    headband: `<path d="M48 80 Q100 64 152 80 L152 90 Q100 76 48 90Z" fill="${c.auraColor}" stroke="${ink}" stroke-width="2"/>
      <path d="M150 82 L174 94 L168 104 L150 90Z" fill="${c.auraColor}" stroke="${ink}" stroke-width="2"/>`,
    glasses: `<g fill="none" stroke="${ink}" stroke-width="3"><circle cx="78" cy="109" r="15"/><circle cx="122" cy="109" r="15"/><path d="M93 108 Q100 103 107 108"/></g>`,
    earrings: `<circle cx="50" cy="123" r="4" fill="url(#${id}gold)" stroke="${ink}" stroke-width="1.5"/><circle cx="150" cy="123" r="4" fill="url(#${id}gold)" stroke="${ink}" stroke-width="1.5"/>`,
    bandage: `<g transform="translate(130 126) rotate(-20)"><rect x="-11" y="-4.5" width="22" height="9" rx="3" fill="#f3d3a8" stroke="${ink}" stroke-width="1.5"/><path d="M-3 -4 L-3 4 M3 -4 L3 4" stroke="#c9a77a" stroke-width="1.2"/></g>`,
    flower: `<g transform="translate(138 62)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-8" rx="5" ry="8" transform="rotate(${a})" fill="#ffb3d1" stroke="${ink}" stroke-width="1.2"/>`).join('')}<circle r="4.5" fill="#ffcf4a" stroke="${ink}" stroke-width="1.2"/></g>`,
  };
  s.push(ac[c.accessory] || '');

  // Prop
  const pr = {
    guitar: `<g transform="translate(140 206) rotate(-38)">
      <rect x="-4" y="-86" width="8" height="66" fill="#6b4226" stroke="${ink}" stroke-width="2"/>
      <rect x="-7" y="-100" width="14" height="16" rx="3" fill="#3b2a20" stroke="${ink}" stroke-width="2"/>
      <path d="M0 -24 C-26 -24 -22 -4 -14 0 C-28 8 -26 34 0 34 C26 34 28 8 14 0 C22 -4 26 -24 0 -24Z" fill="#d9822b" stroke="${ink}" stroke-width="2.5"/>
      <circle cx="0" cy="2" r="6" fill="${ink}"/><rect x="-8" y="18" width="16" height="4" rx="1" fill="${ink}"/>
      <path d="M-2 -84 L-2 20 M2 -84 L2 20" stroke="#f5f2ea" stroke-width=".8"/></g>`,
    dumbbell: `<g><rect x="126" y="224" width="52" height="7" rx="3" fill="#8a8fa3" stroke="${ink}" stroke-width="2"/>
      <rect x="122" y="212" width="10" height="30" rx="3" fill="#33364a" stroke="${ink}" stroke-width="2"/>
      <rect x="172" y="212" width="10" height="30" rx="3" fill="#33364a" stroke="${ink}" stroke-width="2"/></g>`,
    controller: `<g><path d="M66 214 Q100 206 134 214 Q146 238 130 240 Q120 240 114 232 L86 232 Q80 240 70 240 Q54 238 66 214Z" fill="#2b2d42" stroke="${ink}" stroke-width="2.5"/>
      <path d="M76 222 h10 M81 217 v10" stroke="#e8e4dc" stroke-width="3"/>
      <circle cx="118" cy="220" r="2.6" fill="#59d36b"/><circle cx="124" cy="225" r="2.6" fill="#ff6b5b"/><circle cx="112" cy="225" r="2.6" fill="#3fd0c9"/></g>`,
    brush: `<g transform="translate(152 226) rotate(25)"><rect x="-3" y="-52" width="6" height="44" rx="2" fill="#d9822b" stroke="${ink}" stroke-width="2"/>
      <rect x="-4" y="-60" width="8" height="10" fill="#b7bccb" stroke="${ink}" stroke-width="2"/>
      <path d="M-5 -60 Q0 -84 5 -60Z" fill="${c.auraColor}" stroke="${ink}" stroke-width="2"/></g>`,
    egg: `<g><path d="M152 192 C140 192 136 212 138 220 C140 232 164 232 166 220 C168 212 164 192 152 192Z" fill="#f4ede1" stroke="${ink}" stroke-width="2.5"/>
      <path d="M140 210 Q152 204 164 210" stroke="${c.auraColor}" stroke-width="3" fill="none"/>
      <circle cx="146" cy="218" r="1.8" fill="#ff7eb6"/><circle cx="156" cy="222" r="1.8" fill="#3fd0c9"/><circle cx="152" cy="200" r="1.6" fill="#ffcf4a"/></g>`,
    goldenEgg: `<g><path d="M152 188 C138 188 134 210 136 220 C138 234 166 234 168 220 C170 210 166 188 152 188Z" fill="url(#${id}gold)" stroke="${ink}" stroke-width="2.5"/>
      <path d="M144 200 Q148 196 152 198" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M176 186 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" fill="#fff2a8" class="${anim ? 'twinkle' : ''}"/></g>`,
  };
  s.push(pr[c.prop] || '');
  if (c.prop === 'dumbbell' || c.prop === 'guitar' || c.prop === 'controller' || c.prop === 'egg' || c.prop === 'goldenEgg') {
    // re-draw the hand in front of the prop
    if (c.prop === 'controller') s.push(`<circle cx="70" cy="230" r="8" fill="${skin}" stroke="${ink}" stroke-width="2.2"/><circle cx="130" cy="230" r="8" fill="${skin}" stroke="${ink}" stroke-width="2.2"/>`);
    else s.push(`<circle cx="152" cy="228" r="9" fill="${skin}" stroke="${ink}" stroke-width="2.5"/>`);
  }

  s.push(`</svg>`);
  return s.join('');
}

export function petSVG(kind) {
  const ink = '#1b1530';
  if (kind === 'elliott') {
    return `<svg viewBox="0 0 60 60" class="pet-svg"><g stroke="${ink}" stroke-width="2" stroke-linejoin="round">
      <path d="M10 26 L14 6 L27 18Z M33 18 L46 6 L50 26Z" fill="#f0913a"/>
      <path d="M14 12 L16 20 L22 18Z M38 18 L44 12 L46 20Z" fill="#ffb3c1" stroke="none"/>
      <ellipse cx="30" cy="34" rx="22" ry="19" fill="#f0913a"/>
      <path d="M24 16 L25 23 M30 15 L30 22 M36 16 L35 23 M9 30 L15 31 M51 30 L45 31 M9 36 L14 36 M51 36 L46 36" stroke="#b85f17" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="30" cy="44" rx="9" ry="6" fill="#fff1df" stroke="none"/>
      <ellipse cx="22" cy="33" rx="4.5" ry="5.5" fill="#b6e36a"/><ellipse cx="38" cy="33" rx="4.5" ry="5.5" fill="#b6e36a"/>
      <ellipse cx="22" cy="33" rx="1.4" ry="4.5" fill="${ink}" stroke="none"/><ellipse cx="38" cy="33" rx="1.4" ry="4.5" fill="${ink}" stroke="none"/>
      <path d="M28 40 L32 40 L30 43Z" fill="#ff8fa3"/>
      <path d="M30 43 Q27 47 24 45 M30 43 Q33 47 36 45" fill="none" stroke-width="1.5"/>
      <path d="M8 38 L18 40 M8 44 L18 42 M52 38 L42 40 M52 44 L42 42" stroke-width="1.2"/></g></svg>`;
  }
  if (kind === 'ocean') {
    return `<svg viewBox="0 0 60 60" class="pet-svg"><g stroke="${ink}" stroke-width="2" stroke-linejoin="round">
      <path d="M8 28 L13 2 L28 16Z M32 16 L47 2 L52 28Z" fill="#5f6a7d"/>
      <path d="M13 9 L16 20 L22 16Z M38 16 L44 20 L47 9Z" fill="#e8e4dc" stroke="none"/>
      <ellipse cx="30" cy="34" rx="23" ry="21" fill="#5f6a7d"/>
      <path d="M30 18 Q17 28 15 42 Q22 54 30 54 Q38 54 45 42 Q43 28 30 18Z" fill="#f4f1ea"/>
      <path d="M17 28 Q22 24 27 28 M33 28 Q38 24 43 28" fill="none" stroke="#f4f1ea" stroke-width="3"/>
      <ellipse cx="22" cy="33" rx="4" ry="4.5" fill="#6ec6ff"/><ellipse cx="38" cy="33" rx="4" ry="4.5" fill="#6ec6ff"/>
      <circle cx="22" cy="33" r="1.8" fill="${ink}" stroke="none"/><circle cx="38" cy="33" r="1.8" fill="${ink}" stroke="none"/>
      <ellipse cx="30" cy="42" rx="4" ry="3" fill="${ink}"/>
      <path d="M27 48 Q30 56 33 48" fill="#ff8fa3"/></g></svg>`;
  }
  // hiccup
  return `<svg viewBox="0 0 60 60" class="pet-svg"><g stroke="${ink}" stroke-width="2" stroke-linejoin="round">
    <ellipse cx="21" cy="14" rx="6" ry="15" fill="#22202c" transform="rotate(-12 21 14)"/>
    <ellipse cx="39" cy="14" rx="6" ry="15" fill="#22202c" transform="rotate(14 39 14)"/>
    <ellipse cx="21" cy="14" rx="2.5" ry="10" fill="#4a4558" stroke="none" transform="rotate(-12 21 14)"/>
    <ellipse cx="39" cy="14" rx="2.5" ry="10" fill="#4a4558" stroke="none" transform="rotate(14 39 14)"/>
    <ellipse cx="30" cy="38" rx="20" ry="18" fill="#f7f5f0"/>
    <path d="M12 34 Q14 22 26 22 Q28 30 26 38 Q20 44 12 40Z M48 34 Q46 22 34 22 Q32 30 34 38 Q40 44 48 40Z" fill="#22202c" stroke="none"/>
    <path d="M30 22 L30 38" stroke="#e0dcd2" stroke-width="3"/>
    <circle cx="22" cy="33" r="3.5" fill="#000" stroke="#f7f5f0" stroke-width="1"/><circle cx="38" cy="33" r="3.5" fill="#000" stroke="#f7f5f0" stroke-width="1"/>
    <circle cx="21" cy="32" r="1.1" fill="#fff" stroke="none"/><circle cx="37" cy="32" r="1.1" fill="#fff" stroke="none"/>
    <path d="M28 42 L32 42 L30 44.5Z" fill="#ff8fa3"/>
    <path d="M30 44.5 L30 47 M30 47 Q27 49 26 47 M30 47 Q33 49 34 47" fill="none" stroke-width="1.4"/></g></svg>`;
}
