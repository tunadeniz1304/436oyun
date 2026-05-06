# OFFICE_SYSTEM.md

Claude Code için yazılmıştır. Başlamadan önce `CLAUDE.md`'yi oku ve tüm kurallara uy.
Bu dosyadaki her şey mevcut projeye **eklenti** olarak tasarlanmıştır — hiçbir mevcut dosya silinmez, sadece belirtilen satırlar değiştirilir.

---

## Genel Bakış

WorldMap'te bir binaya tıklanınca `/office/:zoneId` rotasına gidilir. Burada aydınlık, modern bir 2D top-down ofis açılır. Oyuncu CSS piksel sanat karakteriyle WASD ile hareket eder. Masalarda oturan çalışan NPC'ler konuşma baloncuğu gösterir. Ana NPC'ye (Verification Lead, Incident Manager vb.) yaklaşılınca [E] tuşuyla diyalog başlar, diyalog bittikten sonra "Zone'a Gir" butonuyla asıl zone sayfasına geçilir.

```
WorldMap (3D)
  bina tıkla → navigate(`/office/${zoneId}`)
OfficeInterior (2D, yeni sayfa)
  WASD ile hareket
  Ana NPC'ye yaklaş (mesafe ≤ 1 tile, Chebyshev)
  [E] tuşuna bas
NpcDialog (sayfanın altına sabitlenmiş kutu)
  "Devam →" ile satır satır ilerle
  Son satırda "Zone'a Gir →" butonu
Zone sayfası (mevcut: ErrorDistrict, VVHeadquarters vb.)
```

---

## Tasarım Kararları — Değiştirme

- **Atmosfer:** Açık/gündüz — beyaz/açık gri zemin, doğal ışık hissi, modern ofis
- **Karakter:** CSS div/span kombinasyonu ile piksel sanat hissi — emoji değil
- **Çalışan NPC'ler:** Masada oturur, üzerlerinde konuşma baloncuğu çıkar
- **Renk aksanları:** Her zone kendi CSS token rengiyle — HUD çizgisi, kapı, diyalog border
- **Three.js yok:** Tamamen DOM + CSS — Canvas kesinlikle kullanılmaz
- **Hardcode renk yok:** Renkler CSS custom property veya token olarak geçer

---

## Dosya Yapısı

Oluşturulacak yeni dosyalar:

```
src/data/office-layouts.js
src/hooks/usePlayerMovement.js
src/components/shared/PixelCharacter.jsx
src/components/shared/PixelCharacter.css
src/components/shared/NpcDialog.jsx
src/components/shared/NpcDialog.css
src/pages/OfficeInterior.jsx
src/pages/OfficeInterior.css
```

Değiştirilecek mevcut dosyalar (sadece belirtilen satırlar):

```
src/App.jsx          → 1 import + 1 route eklenir
src/pages/WorldMap.jsx → handleSelect güncellenir
```

---

## 1. src/data/office-layouts.js

### Tile Karakterleri

```
'#'  dış duvar — geçilemez, koyu gri
'W'  iç bölme duvarı — geçilemez, orta gri
'.'  açık zemin — geçilebilir, açık krem
'D'  masa yüzeyi — geçilemez, ahşap rengi
'C'  sandalye — geçilebilir, açık gri
'P'  bitki — geçilemez, yeşil daire
'B'  kitaplık/raf — geçilemez, koyu ahşap
'X'  çıkış kapısı — geçince navigate('/') çağrılır
```

### getPlayerStart yardımcı fonksiyonu

```js
export function getPlayerStart(map) {
  for (let row = 0; row < map.length; row++) {
    const col = map[row].indexOf('X');
    if (col !== -1) return { col, row: row - 2 };
  }
  return { col: 12, row: 14 };
}
```

### Her zone için tam harita ve NPC verisi

Harita boyutu: 24 sütun x 18 satır. Her zone farklı oda düzenine sahip.

```js
export const OFFICE_LAYOUTS = {

  'error-district': {
    zoneRoute: '/zone/error-district',
    color: 'var(--zone1-color)',
    label: 'Error District HQ',
    map: [
      '########################',
      '#B....................B.#',
      '#....DD.........DD....#',
      '#....DC.........DC....#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#....DDDDDDDDDDDD.....#',
      '#....CCCCCCCCCCCC.....#',
      '#....CCCCCCCCCCCC.....#',
      '#....P...........P....#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'alex',
        name: 'Alex Chen',
        role: 'Incident Manager',
        type: 'main',
        col: 12, row: 8,
        facing: 'down',
        lines: [
          'Production incident #047 hâlâ aktif. Her saniye kayıp.',
          'Bu departmanda üç kavramı birbirinden ayırt etmek zorundasın.',
          'Error: geliştiricinin yaptığı insan hatası — kodda değil, kafada.',
          'Fault: o hatanın koda yansımış hali — kodun içindeki kusur.',
          'Failure: program çalışırken o kusur tetiklenince gözlemlenen yanlış davranış.',
          'Nedensellik zinciri kesin: Error → Fault → Failure. Sıra değişmez.',
          'Hazırsan incident kartlarını sınıflandır. Zone\'a gir.',
        ],
      },
      { id: 'w1', name: 'Dev #1', role: 'Developer', type: 'worker',
        col: 5, row: 3, facing: 'down', bubble: 'Kodu inceliyorum...' },
      { id: 'w2', name: 'Dev #2', role: 'Developer', type: 'worker',
        col: 5, row: 6, facing: 'down', bubble: 'Log analizi...' },
      { id: 'w3', name: 'QA #1', role: 'QA Engineer', type: 'worker',
        col: 18, row: 3, facing: 'down', bubble: 'Test yazıyorum...' },
      { id: 'w4', name: 'QA #2', role: 'QA Engineer', type: 'worker',
        col: 18, row: 6, facing: 'down', bubble: 'Hata raporluyorum...' },
    ],
  },

  'vv-headquarters': {
    zoneRoute: '/zone/vv-headquarters',
    color: 'var(--zone2-color)',
    label: 'V&V Tower — Kat 12',
    map: [
      '########################',
      '#B..........W.........B#',
      '#.DD........W........DD#',
      '#.DC........W........DC#',
      '#...........W..........#',
      '#.DD........W........DD#',
      '#.DC........W........DC#',
      '#...........W..........#',
      '#.DD........W........DD#',
      '#.DC.......WWW.......DC#',
      '#......................#',
      '#......................#',
      '#....P....CC.....P....#',
      '#.................CC...#',
      '#......................#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'morgan',
        name: 'Morgan Lee',
        role: 'Verification Lead',
        type: 'main',
        col: 12, row: 11,
        facing: 'down',
        lines: [
          'V&V Tower\'a hoş geldin. 12. kattasın.',
          'Sol kanat Verification ekibi, sağ kanat Validation ekibi.',
          'Verification sorusu: "Spesifikasyona uygun mu inşa ettik?"',
          'Validation sorusu: "Doğru şeyi mi inşa ettik? Kullanıcı ihtiyacını karşılıyor mu?"',
          'Kritik nokta: rol değil, soru önemli. Her iki taraf da her iki soruyu sorabilir.',
          '8 görev, 30 saniye her biri. Saati göreceksin.',
          'Hazır mısın? Zone\'a gir.',
        ],
      },
      { id: 'v1', name: 'Selin', role: 'Verification Eng.', type: 'worker',
        col: 4, row: 3, facing: 'down', bubble: 'Spec review...' },
      { id: 'v2', name: 'Kerem', role: 'Verification Eng.', type: 'worker',
        col: 4, row: 6, facing: 'down', bubble: 'Conformance check...' },
      { id: 'v3', name: 'Ayşe', role: 'Verification Eng.', type: 'worker',
        col: 4, row: 9, facing: 'down', bubble: 'Walkthrough yapıyorum...' },
      { id: 'val1', name: 'Bora', role: 'Validation Eng.', type: 'worker',
        col: 19, row: 3, facing: 'down', bubble: 'UAT planlıyorum...' },
      { id: 'val2', name: 'Ceren', role: 'Validation Eng.', type: 'worker',
        col: 19, row: 6, facing: 'down', bubble: 'User feedback...' },
      { id: 'val3', name: 'Ozan', role: 'Validation Eng.', type: 'worker',
        col: 19, row: 9, facing: 'down', bubble: 'Prototype test...' },
    ],
  },

  'matrix-tower': {
    zoneRoute: '/zone/matrix-tower',
    color: 'var(--zone3-color)',
    label: 'Matrix Research Hub',
    map: [
      '########################',
      '#B....................B#',
      '#...WWWWWWWWWWWWWW....#',
      '#...W..............W..#',
      '#...W..............W..#',
      '#...W..............W..#',
      '#...W..............W..#',
      '#...WWWWWWWWWWWWWW....#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#....P.............P..#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'sam',
        name: 'Sam Rivera',
        role: 'Test Architect',
        type: 'main',
        col: 19, row: 5,
        facing: 'left',
        lines: [
          'Matrix Research Hub\'a hoş geldin.',
          'Soldaki tablo iki boyutu gösteriyor: Test Level ve Test Type.',
          'Test Level: Unit, Integration, System, Acceptance.',
          'Test Type: Functional, Non-functional, Structural, Change-related.',
          'Bu iki boyut birbirinden bağımsızdır. Unit test sadece Functional değildir.',
          'Her level, her type\'ı barındırabilir. Sabit eşleşme yoktur.',
          '4x4 matrisin her hücresini seç ve gerekçeni yaz. Zone\'a gir.',
        ],
      },
      { id: 'm1', name: 'Tuna', role: 'Test Researcher', type: 'worker',
        col: 4, row: 10, facing: 'down', bubble: 'Matrisi dolduruyorum...' },
      { id: 'm2', name: 'Göktuğ', role: 'Test Researcher', type: 'worker',
        col: 18, row: 10, facing: 'down', bubble: 'Level analizi...' },
      { id: 'm3', name: 'Oğuzhan', role: 'Test Researcher', type: 'worker',
        col: 4, row: 13, facing: 'down', bubble: 'Type mapping...' },
      { id: 'm4', name: 'Buğra', role: 'Test Researcher', type: 'worker',
        col: 18, row: 13, facing: 'down', bubble: 'Orthogonality...' },
    ],
  },

  'artefact-archive': {
    zoneRoute: '/zone/artefact-archive',
    color: 'var(--zone4-color)',
    label: 'Artefact Archive',
    map: [
      '########################',
      '#B..B..B..B..B..B..B..#',
      '#......................#',
      '#......................#',
      '#.DDDDDDDDDDDDDDDDDD..#',
      '#.CCCCCCCCCCCCCCCCCC..#',
      '#......................#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#....P.............P..#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'jordan',
        name: 'Jordan Park',
        role: 'Documentation Chief',
        type: 'main',
        col: 12, row: 6,
        facing: 'down',
        lines: [
          'Artefact Archive\'a hoş geldin. Dikkatli ol.',
          'Test Basis: testin temel aldığı bilgi. Belge olmak zorunda değil.',
          'Test Item ya da Test Object: test edilen nesne. Her iki terim de ISO\'ya göre geçerli.',
          'Static Testing: kodu çalıştırmadan yapılan analiz — review, walkthrough.',
          'Dynamic Testing: kodu çalıştırarak yapılan test.',
          'Bir tuzak artefakt var. Yasal görünüyor ama ISO tanımına aykırı.',
          '6 artefaktı etiketle. Yanılma. Zone\'a gir.',
        ],
      },
      { id: 'a1', name: 'Deniz', role: 'Archivist', type: 'worker',
        col: 4, row: 9, facing: 'down', bubble: 'Arşivliyorum...' },
      { id: 'a2', name: 'Yıldız', role: 'Doc Reviewer', type: 'worker',
        col: 18, row: 9, facing: 'down', bubble: 'Belge inceliyorum...' },
      { id: 'a3', name: 'Emre', role: 'Static Tester', type: 'worker',
        col: 4, row: 12, facing: 'down', bubble: 'Code review...' },
      { id: 'a4', name: 'Naz', role: 'Doc Writer', type: 'worker',
        col: 18, row: 12, facing: 'down', bubble: 'Yazıyorum...' },
    ],
  },

  'final-inspection': {
    zoneRoute: '/final-inspection',
    color: 'var(--final-color)',
    label: 'Final Inspection HQ',
    map: [
      '########################',
      '#B....................B#',
      '#B....................B#',
      '#......................#',
      '#..DDDDDDDDDDDDDDDD...#',
      '#..CCCCCCCCCCCCCCCC...#',
      '#..CCCCCCCCCCCCCCCC...#',
      '#..DDDDDDDDDDDDDDDD...#',
      '#......................#',
      '#......................#',
      '#B....................B#',
      '#B....................B#',
      '#......................#',
      '#....P.............P..#',
      '#......................#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'taylor',
        name: 'Taylor Brooks',
        role: 'Senior Auditor',
        type: 'main',
        col: 12, row: 4,
        facing: 'down',
        lines: [
          'Son aşamaya ulaştın. Final Inspection başlamak üzere.',
          'Önceki dört zone\'daki kararların burada bir araya geliyor.',
          'Test Oracle: bir testin geçip geçmediğine karar veren mekanizma. §3.115.',
          'Hatalı bir kararın zincirleme etkisi olabilir — bunu Final raporda göreceksin.',
          'Beş entegre karar. ISO Incident Report\'u kazanmak için dikkatli ol.',
          'Bu son şansın. Zone\'a gir.',
        ],
      },
      { id: 'f1', name: 'Bahar', role: 'Inspector', type: 'worker',
        col: 5, row: 5, facing: 'right', bubble: 'Rapor hazırlıyorum...' },
      { id: 'f2', name: 'Cem', role: 'Inspector', type: 'worker',
        col: 18, row: 5, facing: 'left', bubble: 'Skor hesaplıyorum...' },
      { id: 'f3', name: 'Lale', role: 'Inspector', type: 'worker',
        col: 5, row: 6, facing: 'right', bubble: 'Analiz ediyorum...' },
      { id: 'f4', name: 'Mert', role: 'Inspector', type: 'worker',
        col: 18, row: 6, facing: 'left', bubble: 'Review bitmek üzere...' },
    ],
  },

};
```

---

## 2. src/hooks/usePlayerMovement.js

Arayüz:

```js
/**
 * @param {Object} params
 * @param {string[]} params.map
 * @param {Array}   params.npcs
 * @param {boolean} params.isDialogOpen
 * @param {()=>void} params.onExitDoor
 * @param {(npcId:string)=>void} params.onInteract
 * @param {{col:number,row:number}} params.initialPos
 *
 * @returns {{
 *   playerCol: number,
 *   playerRow: number,
 *   playerFacing: 'down'|'up'|'left'|'right',
 *   nearMainNpc: boolean,
 *   nearMainNpcId: string|null,
 * }}
 */
```

Davranış kuralları:

1. `useEffect` içinde `keydown` event listener ekle, cleanup'ta kaldır
2. Yön tuşları: `w/ArrowUp`, `a/ArrowLeft`, `s/ArrowDown`, `d/ArrowRight`
3. Geçilemez tile'lar: `#`, `W`, `D`, `P`, `B` — bu tile'lara hareket etme
4. Geçilebilir tile'lar: `.`, `C`, `X` — hareket et
5. Hedef tile `X` ise `onExitDoor()` çağır, hareketi yapma
6. Her hareketten sonra `playerFacing` güncelle
7. Her hareketten sonra `main` type NPC'lerle Chebyshev mesafesi kontrol et:
   `Math.max(Math.abs(pCol - npc.col), Math.abs(pRow - npc.row)) <= 1`
8. `isDialogOpen === true` iken hiçbir tuşa tepki verme
9. `e` tuşu: `nearMainNpc && !isDialogOpen` ise `onInteract(nearMainNpcId)` çağır

---

## 3. src/components/shared/PixelCharacter.jsx + .css

Props:

```jsx
<PixelCharacter
  type="player"           // 'player' | 'npc-main' | 'npc-worker'
  facing="down"           // 'down' | 'up' | 'left' | 'right'
  color="#993C1D"         // zone rengi, CSS custom property olarak geçer
  label="Sen"             // altında isim etiketi
  isNear={false}          // sadece npc-main: true iken [E] hint göster
  bubble="Çalışıyorum..."  // sadece npc-worker: konuşma baloncuğu metni
/>
```

HTML yapısı:

```html
<div class="px-char px-char--{type} px-char--{facing}" style="--char-accent: {color}">
  <!-- Sadece npc-main + isNear: -->
  <div class="px-char__hint">[E]</div>

  <!-- Sadece npc-worker: -->
  <div class="px-char__bubble">{bubble}</div>

  <div class="px-char__figure">
    <div class="px-char__head"></div>
    <div class="px-char__eyes">
      <span class="px-char__eye"></span>
      <span class="px-char__eye"></span>
    </div>
    <div class="px-char__torso"></div>
    <div class="px-char__legs">
      <span class="px-char__leg"></span>
      <span class="px-char__leg"></span>
    </div>
    <div class="px-char__feet">
      <span class="px-char__foot"></span>
      <span class="px-char__foot"></span>
    </div>
  </div>

  <div class="px-char__label">{label}</div>
</div>
```

CSS kuralları:

- Tüm boyutlar px cinsinden — piksel sanat hissi için keskin köşeler, `border-radius` minimal
- `px-char__figure` genişlik: 20px, yükseklik: 36px
- `px-char__head`: 12x12px, border-radius: 2px, arka plan ten rengi (`#f5c8a0`)
- `px-char__torso`: 14x10px
  - `player`: `var(--char-accent)` tonu (biraz açık)
  - `npc-main`: `var(--char-accent)`
  - `npc-worker`: `#8899aa`
- `px-char__legs`: her biri 5x8px, `#444`
- `px-char__feet`: her biri 6x4px, `#222`
- `px-char__eyes`: her göz 2x2px, `#222`, head içinde konumlandırılmış
- Facing `left` iken: `px-char__figure` → `transform: scaleX(-1)`
- Facing `up` iken: saç rengini öne getir (isteğe bağlı, sadece torso rengi yeterli)

Animasyonlar (CSS `@keyframes`):

```css
/* player: idle bob */
@keyframes px-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.px-char--player .px-char__figure {
  animation: px-idle 1.6s ease-in-out infinite;
}

/* npc-worker: gentle sway */
@keyframes px-sway {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1deg); }
}
.px-char--npc-worker .px-char__figure {
  animation: px-sway 2.2s ease-in-out infinite;
  transform-origin: bottom center;
}

/* npc-main: pulse */
@keyframes px-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
.px-char--npc-main .px-char__figure {
  animation: px-pulse 2s ease-in-out infinite;
}

/* [E] hint: bounce */
@keyframes px-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}
.px-char__hint {
  animation: px-bounce 1s ease-in-out infinite;
}

/* bubble: fade-in */
.px-char__bubble {
  animation: px-fadein 0.3s ease;
}
@keyframes px-fadein {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Konuşma baloncuğu CSS (speech bubble):

```css
.px-char__bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 3px 7px;
  font-size: 9px;
  white-space: nowrap;
  color: #333;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  margin-bottom: 4px;
}
/* baloncuk kuyruğu */
.px-char__bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #ddd;
}
```

[E] hint CSS:

```css
.px-char__hint {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--char-accent);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
  white-space: nowrap;
}
```

---

## 4. src/components/shared/NpcDialog.jsx + .css

Props:

```jsx
// Parent şöyle kullanır — isOpen prop'u yok:
{ dialogOpen && <NpcDialog npc={npc} zoneColor={color} onClose={fn} onEnterZone={fn} /> }
```

```jsx
<NpcDialog
  npc={{ name, role, lines }}
  zoneColor="var(--zone1-color)"
  onClose={() => void}
  onEnterZone={() => void}
/>
```

Davranış:

1. İç state: `const [idx, setIdx] = useState(0)`
2. "Devam →": `setIdx(i => i + 1)`
3. Son satırda (idx === lines.length - 1): buton "Zone'a Gir →" olur
4. "Zone'a Gir →": `onEnterZone()` çağır
5. X veya ESC: `onClose()` çağır
6. Satır değişiminde Framer Motion: `key={idx}` ile `initial={{ opacity:0, y:8 }}` `animate={{ opacity:1, y:0 }}` `transition={{ duration:0.15 }}`
7. ESC handler: `useEffect` içinde `keydown` dinle, `Escape` ise `onClose()`

HTML yapısı:

```html
<div class="npc-dialog" style="--dialog-color: {zoneColor}">
  <div class="npc-dialog__inner">
    <div class="npc-dialog__card">

      <div class="npc-dialog__header">
        <div class="npc-dialog__avatar">
          <!-- küçük PixelCharacter type=npc-main, boyut override ile 24px -->
        </div>
        <div class="npc-dialog__meta">
          <div class="npc-dialog__name">{npc.name}</div>
          <div class="npc-dialog__role">{npc.role}</div>
        </div>
        <button class="npc-dialog__close" onClick={onClose}>✕</button>
      </div>

      <!-- Framer Motion ile animate -->
      <div class="npc-dialog__text">
        {npc.lines[idx]}
      </div>

      <div class="npc-dialog__footer">
        <div class="npc-dialog__progress">{idx + 1} / {npc.lines.length}</div>
        <button class="npc-dialog__btn">
          {isLast ? "Zone'a Gir →" : "Devam →"}
        </button>
      </div>

    </div>
  </div>
</div>
```

CSS kritik kurallar:

```css
.npc-dialog {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 0 16px 0;
}

.npc-dialog__inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 16px;
}

.npc-dialog__card {
  background: #ffffff;
  border-radius: 12px 12px 0 0;
  border-top: 4px solid var(--dialog-color);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.npc-dialog__name {
  font-weight: 700;
  font-size: 13px;
  color: var(--dialog-color);
}

.npc-dialog__role {
  font-size: 11px;
  color: var(--ink-muted);
}

.npc-dialog__text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  min-height: 48px;
}

.npc-dialog__progress {
  font-size: 11px;
  color: var(--ink-muted);
  font-family: var(--font-mono);
}

.npc-dialog__btn {
  /* Son satırda: background = var(--dialog-color), color = #fff */
  /* Devam butonunda: background = var(--ink), color = #fff */
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
```

---

## 5. src/pages/OfficeInterior.jsx + .css

Gerekli importlar:

```js
import { useParams, useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { OFFICE_LAYOUTS, getPlayerStart } from '../data/office-layouts.js';
import { usePlayerMovement } from '../hooks/usePlayerMovement.js';
import PixelCharacter from '../components/shared/PixelCharacter.jsx';
import NpcDialog from '../components/shared/NpcDialog.jsx';
import './OfficeInterior.css';
```

Guard:

```js
const { zoneId } = useParams();
const layout = OFFICE_LAYOUTS[zoneId];
if (!layout) return <Navigate to="/" replace />;
```

State ve hook:

```js
const [dialogOpen, setDialogOpen] = useState(false);
const [activeNpcId, setActiveNpcId] = useState(null);

const { playerCol, playerRow, playerFacing, nearMainNpc, nearMainNpcId } =
  usePlayerMovement({
    map: layout.map,
    npcs: layout.npcs,
    isDialogOpen: dialogOpen,
    onExitDoor: () => navigate('/'),
    onInteract: (npcId) => { setActiveNpcId(npcId); setDialogOpen(true); },
    initialPos: getPlayerStart(layout.map),
  });
```

Render:

```jsx
<div className="office" style={{ '--office-accent': layout.color }}>

  <div className="office__hud">
    <button className="office__back" onClick={() => navigate('/')}>← Haritaya Dön</button>
    <span className="office__hud-title">{layout.label}</span>
    <span className="office__hud-hint">WASD hareket · E konuş</span>
  </div>

  <div className="office__scene">
    <div
      className="office__grid"
      style={{
        gridTemplateColumns: `repeat(${layout.map[0].length}, 1fr)`,
        gridTemplateRows: `repeat(${layout.map.length}, 1fr)`,
      }}
    >
      {layout.map.flatMap((row, rIdx) =>
        [...row].map((tile, cIdx) => (
          <div
            key={`${rIdx}-${cIdx}`}
            className={`office__tile office__tile--${getTileClass(tile)}`}
          />
        ))
      )}

      {/* Oyuncu */}
      <div
        className="office__entity"
        style={{ gridColumn: playerCol + 1, gridRow: playerRow + 1 }}
      >
        <PixelCharacter type="player" facing={playerFacing} label="Sen" color={layout.color} />
      </div>

      {/* NPC'ler */}
      {layout.npcs.map(npc => (
        <div
          key={npc.id}
          className="office__entity"
          style={{ gridColumn: npc.col + 1, gridRow: npc.row + 1 }}
        >
          <PixelCharacter
            type={npc.type === 'main' ? 'npc-main' : 'npc-worker'}
            facing={npc.facing}
            label={npc.name}
            color={layout.color}
            isNear={nearMainNpcId === npc.id && nearMainNpc}
            bubble={npc.bubble}
          />
        </div>
      ))}
    </div>
  </div>

  {dialogOpen && activeNpcId && (() => {
    const npc = layout.npcs.find(n => n.id === activeNpcId);
    return (
      <NpcDialog
        npc={npc}
        zoneColor={layout.color}
        onClose={() => { setDialogOpen(false); setActiveNpcId(null); }}
        onEnterZone={() => navigate(layout.zoneRoute)}
      />
    );
  })()}

</div>
```

getTileClass fonksiyonu (aynı dosyada):

```js
function getTileClass(tile) {
  const MAP = {
    '#': 'wall', 'W': 'inner-wall', '.': 'floor',
    'D': 'desk', 'C': 'chair', 'P': 'plant',
    'B': 'shelf', 'X': 'door',
  };
  return MAP[tile] ?? 'floor';
}
```

OfficeInterior.css kritik kurallar:

```css
.office {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f0efe8;
}

/* HUD */
.office__hud {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 3px solid var(--office-accent);
  flex-shrink: 0;
}
.office__back {
  font-size: 12px; font-weight: 600; color: var(--ink-soft);
  background: none; border: none; cursor: pointer;
}
.office__hud-title {
  font-size: 13px; font-weight: 700; letter-spacing: .06em;
  color: var(--office-accent);
}
.office__hud-hint { font-size: 11px; color: var(--ink-muted); font-family: var(--font-mono); }

/* Sahne */
.office__scene {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
}

/* Grid */
.office__grid {
  display: grid;
  aspect-ratio: 24 / 18;
  max-height: 100%;
  max-width: 100%;
  position: relative;
}

/* Entity overlay — grid child olarak konumlanır */
.office__entity {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

/* Tile görünümleri */
.office__tile { width: 100%; height: 100%; }

.office__tile--wall       { background: #b8b8b8; }
.office__tile--inner-wall { background: #d0d0cc; border: 0.5px solid #c0c0bc; }
.office__tile--floor      {
  background: #f7f6f0;
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 100% 100%;
}
.office__tile--desk       { background: #c8a060; border: 1px solid #a07840; }
.office__tile--chair      { background: #e8e8e8; border: 0.5px solid #ccc; border-radius: 2px; }
.office__tile--plant      { background: #6ab06a; border-radius: 50%; border: 1px solid #4a8a4a; }
.office__tile--shelf      { background: #8b6030; border: 1px solid #6a4818; }
.office__tile--door       {
  background: color-mix(in srgb, var(--office-accent) 30%, #fff);
  border: 2px solid var(--office-accent);
}
```

---

## 6. src/App.jsx — Değişiklik

```jsx
// Import ekle:
import OfficeInterior from './pages/OfficeInterior.jsx';

// Routes içine WorldMap'in hemen altına ekle:
<Route
  path="/office/:zoneId"
  element={<PageTransition><OfficeInterior /></PageTransition>}
/>
```

---

## 7. src/pages/WorldMap.jsx — Değişiklik

`handleSelect` fonksiyonunu bul, şöyle değiştir:

```js
// ÖNCE:
const handleSelect = (zoneId) => {
  const def = ZONE_DEFS.find((z) => z.id === zoneId);
  if (def) navigate(def.route);
};

// SONRA:
const handleSelect = (zoneId) => {
  navigate(`/office/${zoneId}`);
};
```

Başka hiçbir şey değişmez.

---

## Uygulama Sırası

1. `src/data/office-layouts.js`
2. `src/hooks/usePlayerMovement.js`
3. `src/components/shared/PixelCharacter.jsx` + `.css`
4. `src/components/shared/NpcDialog.jsx` + `.css`
5. `src/pages/OfficeInterior.jsx` + `.css`
6. `src/App.jsx`
7. `src/pages/WorldMap.jsx`

---

## Tamamlandı Sayılma Kriterleri

- [ ] WorldMap'te her binaya tıklayınca `/office/:zoneId` açılıyor
- [ ] Açık/aydınlık modern ofis görünümü — beyaz zemin, grid deseni, açık gri duvarlar
- [ ] Masalar ahşap rengi, bitkiler yeşil daire, raflar koyu ahşap görünüyor
- [ ] CSS piksel karakter (emoji değil) sahnede görünüyor, idle animasyonu var
- [ ] Worker NPC'lerin üstünde konuşma baloncuğu var
- [ ] WASD ile hareket çalışıyor, duvarlara ve mobilyalara çarpılmıyor
- [ ] Ana NPC'ye yaklaşınca [E] hint'i bouncing animasyonla görünüyor
- [ ] [E] ile diyalog kutusu sayfanın altında açılıyor
- [ ] Satırlar sırayla ilerliyor, ilerleme sayacı görünüyor (örn. "3 / 7")
- [ ] Son satırda "Zone'a Gir →" butonu çıkıyor, tıklayınca doğru zone'a gidiyor
- [ ] X veya ESC ile diyalog kapanıyor, tekrar [E] ile açılabiliyor
- [ ] X tile'ına (kapı) girilince WorldMap'e dönülüyor
- [ ] Diyalog açıkken WASD çalışmıyor
- [ ] `npm run build` hatasız geçiyor
- [ ] Hardcode renk yok — tüm renkler CSS custom property veya token
