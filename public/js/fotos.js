/* Torq Rent — ilustração SVG de fallback para registros sem fotoUri.
   Os veículos do catálogo usam fotografias reais definidas em db.json. */
const SHAPES = {
  hatch: { body: 'M84 196 L84 150 Q86 136 100 118 L116 100 Q122 94 138 94 L292 94 Q324 96 340 124 L346 134 L394 142 Q410 146 410 164 L410 196 Z', win: ['M126 106 Q130 102 142 102 L222 102 L222 134 L114 134 Z', 'M232 102 L290 102 Q316 104 328 134 L232 134 Z'], wheels: [140, 348], r: 27, front: [396, 156], rear: [84, 150] },
  sedan: { body: 'M62 196 L62 164 Q62 150 84 146 L150 138 Q172 104 214 100 L292 100 Q330 102 348 134 L408 142 Q424 148 424 168 L424 196 Z', win: ['M176 136 Q190 112 216 110 L250 110 L250 136 Z', 'M262 110 L292 110 Q314 112 330 136 L262 136 Z'], wheels: [132, 360], r: 26, front: [410, 160], rear: [62, 160] },
  suv: { body: 'M68 196 L68 128 Q68 112 84 106 L104 98 Q112 76 136 74 L320 74 Q352 76 366 108 L398 124 Q420 132 420 152 L420 196 Z', win: ['M128 108 Q134 86 146 84 L238 84 L238 110 Z', 'M250 84 L318 84 Q338 86 350 110 L250 110 Z'], wheels: [134, 356], r: 31, front: [404, 132], rear: [68, 124] },
  picape: { body: 'M54 196 L54 142 Q54 134 62 134 L204 134 L204 106 Q210 88 232 84 L290 84 Q314 86 328 110 L340 132 L408 140 Q424 142 424 156 L424 196 Z', win: ['M216 108 Q220 94 236 92 L278 92 L278 124 L216 124 Z', 'M288 92 L296 92 Q312 96 322 124 L288 124 Z'], wheels: [118, 362], r: 29, front: [410, 148], rear: [54, 140] },
  esportivo: { body: 'M56 196 L56 176 Q56 166 76 162 L170 154 Q206 126 252 122 L282 122 Q316 126 340 150 L408 158 Q432 162 432 178 L432 196 Z', win: ['M206 150 Q222 132 252 130 L274 130 L274 150 Z', 'M284 130 Q308 134 324 150 L284 150 Z'], wheels: [128, 362], r: 27, front: [416, 168], rear: [56, 168] }
};

function carSvg({ categoria = 'hatch', corHex = '#1B998B' } = {}) {
  const s = SHAPES[categoria] || SHAPES.hatch;
  const hex = /^#[0-9a-fA-F]{6}$/.test(corHex) ? corHex : '#1B998B';
  const wheel = x => `<circle cx="${x}" cy="198" r="${s.r}" fill="#1C1A1F"/><circle cx="${x}" cy="198" r="${Math.round(s.r * .55)}" fill="#BFC3C8"/><circle cx="${x}" cy="198" r="4" fill="#1C1A1F"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 30 440 264">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E8E8"/><stop offset="1" stop-color="#C5CDCD"/></linearGradient>
<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
<rect x="-40" y="0" width="560" height="320" fill="url(#bg)"/>
<rect x="-20" y="62" width="190" height="7" rx="3" fill="#1B998B" opacity=".55"/><rect x="300" y="38" width="210" height="7" rx="3" fill="#DF2935" opacity=".4"/><rect x="40" y="244" width="140" height="6" rx="3" fill="#2A2630" opacity=".12"/>
<rect x="-40" y="222" width="560" height="100" fill="#2A2630" opacity=".1"/>
<ellipse cx="240" cy="226" rx="190" ry="11" fill="#000" opacity=".22"/>
<path d="${s.body}" fill="${hex}" stroke="#000" stroke-opacity=".28" stroke-width="2" stroke-linejoin="round"/>
<path d="${s.body}" fill="url(#sh)"/>
${s.win.map(w => `<path d="${w}" fill="#223038" opacity=".92"/>`).join('')}
<rect x="${s.front[0]}" y="${s.front[1]}" width="14" height="8" rx="3" fill="#FFF3B0"/><rect x="${s.rear[0]}" y="${s.rear[1]}" width="10" height="8" rx="3" fill="#DF2935"/>
${s.wheels.map(wheel).join('')}
</svg>`;
}


const fotoUri = c => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(carSvg({ categoria: c.categoria, corHex: c.corHex }));
