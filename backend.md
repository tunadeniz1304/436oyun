# Backend Yol Haritasi

Bu dokuman, ISO Testing World projesinde frontend tamamen bitmeden backend'e
baslamak icin izlenecek pratik yolu tarif eder.

## Mevcut Durum

Proje su anda bilincli olarak backend olmadan calisiyor. Oyun durumu React
tarafinda `GameContext.jsx` icinde tutuluyor:

- `completedZones`
- `zoneScores`
- `totalScore`
- `wrongAnswers`
- `sessionStarted`
- `primersSeen`
- `hintsUsed`

Bu yuzden ilk backend adimi, oyun mekanigini bastan yazmak degil; bu state'i
kalici hale getirecek kucuk bir session/progress katmani kurmak olmali.

## Ilk Hedef

Ilk backend hedefi:

> Oyuncunun oyun ilerlemesini, skorlarini ve yanlis cevaplarini kaydetmek.

Bu sayede:

- Sayfa yenilense bile progress kaybolmaz.
- Final Inspection raporu backend verisine dayanabilir.
- Demo sonrasi oyuncu performansi incelenebilir.
- Daha sonra leaderboard, analytics veya login sistemi eklemek kolaylasir.

## Su Anda Yapilmamasi Gerekenler

Ilk asamada sunlara girilmemeli:

- Full auth/login sistemi
- Admin panel
- Multiplayer
- Leaderboard
- Komple oyun kurallarini backend'e tasima
- Fazla detayli user profile sistemi
- Frontend revizeleri bitmeden buyuk API tasarimi

Bunlar backend'i gereksiz buyutur. Su an amac, oyunun progress ve rapor
mekanigine backend baglamak.

## Onerilen MVP Kapsami

Backend MVP su ozellikleri icermeli:

1. Yeni oyun session'i olusturma
2. Session progress kaydetme
3. Mevcut session progress okuma
4. Yanlis cevaplari kaydetme
5. Zone tamamlama ve skor kaydetme
6. Final rapor icin session sonucunu dondurme

Bu kapsam, frontend bitmese bile uygulanabilir cunku mevcut state yapisi zaten
backend'e baglanabilecek kadar net.

## Veri Modeli

Baslangic icin su tablolar yeterli olur.

### `game_sessions`

Oyuncunun bir oyun denemesini temsil eder.

Alanlar:

- `id`
- `player_name` veya `anonymous_id`
- `started_at`
- `completed_at`
- `total_score`
- `status`

Ornek `status` degerleri:

- `active`
- `completed`
- `abandoned`

### `session_progress`

Session'in anlik oyun durumunu tutar.

Alanlar:

- `id`
- `session_id`
- `completed_zones`
- `zone_scores`
- `primers_seen`
- `hints_used`
- `updated_at`

Not: Ilk MVP'de `completed_zones`, `zone_scores`, `primers_seen` ve
`hints_used` JSON olarak tutulabilir. Proje buyurse normalize edilebilir.

### `wrong_answers`

Oyuncunun yaptigi hatalari saklar.

Alanlar:

- `id`
- `session_id`
- `zone_id`
- `item_id`
- `player_answer`
- `correct_answer`
- `iso_ref`
- `created_at`

Bu tablo pedagojik olarak onemli, cunku Final Inspection icindeki kisisel
geri bildirimler ve cascading note mantigi buradan beslenebilir.

### `zone_attempts`

Her zone icin sonuc kaydi tutar.

Alanlar:

- `id`
- `session_id`
- `zone_id`
- `score`
- `completed_at`
- `wrong_count`
- `hints_used_count`

## API Taslagi

Ilk backend API'si cok kucuk tutulmali.

### `POST /api/sessions`

Yeni oyun session'i baslatir.

Request:

```json
{
  "playerName": "optional"
}
```

Response:

```json
{
  "sessionId": "session_123"
}
```

### `GET /api/sessions/:sessionId`

Session progress bilgisini dondurur.

Response:

```json
{
  "sessionId": "session_123",
  "completedZones": ["error-district"],
  "zoneScores": {
    "error-district": 180,
    "vv-headquarters": 0,
    "matrix-tower": 0,
    "artefact-archive": 0,
    "final-inspection": 0,
    "oracle": 0
  },
  "totalScore": 180,
  "wrongAnswers": []
}
```

### `PATCH /api/sessions/:sessionId/progress`

Frontend'deki `GameContext` state'inin backend'e kaydedilmesini saglar.

Request:

```json
{
  "completedZones": ["error-district"],
  "zoneScores": {
    "error-district": 180
  },
  "totalScore": 180,
  "primersSeen": ["error-district"],
  "hintsUsed": {
    "error-district": ["z1-s2"]
  }
}
```

### `POST /api/sessions/:sessionId/wrong-answers`

Yanlis cevap kaydeder.

Request:

```json
{
  "zoneId": "vv-headquarters",
  "itemId": "z2-m1",
  "playerAnswer": "validation",
  "correctAnswer": "verification",
  "isoRef": "§4.1.3"
}
```

### `POST /api/sessions/:sessionId/complete-zone`

Bir zone tamamlandiginda skor kaydeder.

Request:

```json
{
  "zoneId": "matrix-tower",
  "score": 160
}
```

### `GET /api/sessions/:sessionId/report`

Final rapor icin session sonucunu dondurur.

Response:

```json
{
  "totalScore": 820,
  "zoneScores": {},
  "wrongAnswers": [],
  "completedZones": []
}
```

## Frontend ile Baglanacak Noktalar

Backend entegrasyonu icin ana dosya `src/context/GameContext.jsx` olur.

Baglanacak aksiyonlar:

- `START_SESSION`
- `COMPLETE_ZONE`
- `RECORD_WRONG`
- `ADD_ORACLE_POINTS`
- `SET_ORACLE_POINTS`
- `RESET_ZONE`
- `RESET`
- `MARK_PRIMER_SEEN`
- `USE_HINT`

Ilk entegrasyonda reducer aynen kalabilir. Backend sadece bu aksiyonlardan
sonra progress kaydeden bir servis gibi calisir.

Onerilen frontend katmani:

```text
src/services/gameSessionApi.js
```

Bu dosya sunlari icerebilir:

- `createSession()`
- `loadSession(sessionId)`
- `saveProgress(sessionId, state)`
- `recordWrongAnswer(sessionId, payload)`
- `completeZone(sessionId, zoneId, score)`
- `getReport(sessionId)`

Boylece sayfa componentleri direkt `fetch` kullanmaz; backend baglantisi tek
bir dosyada toplanir.

## En Mantikli Gelistirme Sirasi

1. Backend klasoru ve minimal server kurulumu
2. `POST /api/sessions` endpoint'i
3. Progress kaydetme/okuma endpoint'leri
4. `wrong_answers` kaydi
5. Zone completion kaydi
6. Frontend'de `gameSessionApi.js`
7. `GameContext.jsx` icinde session save/load entegrasyonu
8. Final raporun backend verisinden beslenmesi

## Teknoloji Secimi

Backend icin secilen stack:

- Node.js
- Express
- PostgreSQL
- Docker Compose
- `pg` database driver
- `node:test` + `supertest`

Backend, frontend klasorunun icine gomulmedi. Repo kokunde ayri `backend/`
klasoru olarak kuruldu. Bu sayede frontend `iso-testing-world/` icinde kalir,
API ve database katmani ise ayrik gelisir.

Yerel PostgreSQL icin repo kokundeki `docker-compose.yml` kullanilir.

## Backend Dosya Yapisi

```text
backend/
  src/
    app.js
    server.js
    db/
      pool.js
      migrate.js
      migrations/
        001_create_session_tables.sql
    repositories/
      sessionRepository.js
    routes/
      sessionRoutes.js
    services/
      sessionService.js
  tests/
    sessionRoutes.test.js
  .env.example
  package.json
```

## Calistirma Komutlari

PostgreSQL'i baslat:

```bash
docker compose up -d postgres
```

Backend bagimliliklarini kur:

```bash
cd backend
npm install
```

Database tablolarini olustur:

```bash
npm run migrate
```

Backend'i development modunda baslat:

```bash
npm run dev
```

Testleri calistir:

```bash
npm test
```

## Tavsiye Edilen Ilk Yaklasim

Benim onerim:

> Once auth olmadan session tabanli backend kurulsun.

Akis:

1. Oyuncu oyuna girince backend bir `sessionId` uretir.
2. Frontend bu `sessionId` ile progress kaydeder.
3. Her zone bitince skor backend'e yazilir.
4. Her yanlis cevap backend'e yazilir.
5. Final Inspection raporu bu session verilerinden uretilir.

Bu yaklasim backend'i oyuna baglar ama frontend revizeleri devam ederken
projeyi kilitlemez.

## Sonraki Fazlar

MVP bittikten sonra eklenebilecekler:

- Login/register
- Oyuncu profili
- Leaderboard
- Ogretmen paneli
- Sinif bazli performans analizi
- En cok yanlis yapilan ISO kavramlari
- Session replay
- CSV export

Bu ozellikler ilk backend kapsamindan sonra dusunulmeli.

## Kisa Ozet

Su anda yapilmasi gereken backend:

- Kucuk olmali.
- Session/progress odakli olmali.
- Mevcut `GameContext` state'ini kaydetmeli.
- Yanlis cevaplari saklamali.
- Final raporu desteklemeli.
- Auth ve admin gibi buyuk konulari sonraya birakmali.

Bu sekilde backend, oyun mekanigine erken baglanir ama frontend revizelerini
yavaslatmaz.
