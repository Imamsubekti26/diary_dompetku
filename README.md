# Diary Dompetku

Diary Dompetku adalah sebuah bot telegram yang berfungsi untuk menyimpan dan mencatat transaksi keuanganmu.

## Mudah dipakai
tidak perlu ribet, tulis dengan gaya bahasamu dan biarkan bot merangkumnya.
1. buka aplikasi telegrammu
2. cari `@diary_dompetku_bot` di kolom pencarian
3. mulai obrolan dengan bot: tulis transaksi harianmu dengan gaya bahasamu sendiri

## Cara instalasi (untuk developer)
```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
