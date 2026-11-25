# E-Cash

Aplikasi kasir (POS) dan manajemen toko dalam satu layar: catat penjualan, kelola stok secara real-time, pantau laporan keuangan, dan kirim struk digital. Dibuat dengan React + Vite + Tailwind CSS, dengan autentikasi Firebase dan database Cloud Firestore.

> E-Cash juga dapat dijalankan **tanpa konfigurasi Firebase** dalam Mode Demo (data tersimpan di `localStorage`), sehingga Anda bisa langsung mencoba seluruh alur aplikasi.

---

## Fitur utama

- **Kasir (POS)** — pencarian produk, filter kategori, keranjang, diskon, pajak, pembayaran tunai/QRIS/transfer/kartu, uang kembalian, dan validasi stok.
- **Stok real-time** — stok berkurang otomatis saat transaksi, peringatan stok menipis, penyesuaian stok (restock/koreksi), dan riwayat pergerakan stok.
- **Dashboard informatif** — KPI omzet, laba, transaksi, item terjual, grafik tren, produk terlaris, transaksi terakhir, dan daftar stok kritis.
- **Laporan keuangan** — rentang tanggal fleksibel, omzet bersih, laba kotor, margin, HPP, pajak, diskon, rincian metode bayar, kontribusi kategori, dan ekspor CSV.
- **Riwayat transaksi** — filter tanggal/metode/status, pencarian invoice, detail transaksi, cetak ulang, bagikan WhatsApp, dan pembatalan (void) dengan pengembalian stok otomatis.
- **Struk digital** — tampilan struk thermal 80 mm, cetak browser, teks WhatsApp, dan tautan publik `/r/:saleId`.
- **Pengaturan toko** — profil, logo, pajak, ambang stok minimum, footer struk, pratinjau struk, dan alat bantu data demo.
- **Responsif penuh** — sidebar di desktop, bottom navigation di ponsel, tabel berubah menjadi kartu pada layar kecil.

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), Plus Jakarta Sans |
| Grafik | Recharts |
| Ikon & notifikasi | Lucide React, Sonner |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore (real-time listeners) |
| API opsional | Node.js + Express + Firebase Admin |
| Tanggal & format | date-fns, `Intl.NumberFormat` (IDR) |

## Mulai cepat (Mode Demo)

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`, lalu masuk dengan akun demo:

- **Email:** `demo@ecash.app`
- **Password:** `demo1234`

Mode Demo otomatis membuat ±20 produk dan transaksi contoh beberapa minggu terakhir di `localStorage` (kunci `ecash:demo:v1`). Data demo dapat direset dari **Pengaturan → Data & integrasi → Reset data demo**.

## Menghubungkan Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Authentication → Sign-in method → Email/Password**.
3. Buat **Cloud Firestore** (mode produksi).
4. Tambahkan Web App, lalu salin konfigurasi ke `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Opsional, untuk Firebase Analytics pada build produksi
VITE_FIREBASE_MEASUREMENT_ID=...
```

5. Daftarkan pengguna pertama melalui **Authentication → Users → Add user** (email + password), atau gunakan tab **Daftar** di halaman login. Aplikasi ini single-tenant: semua pengguna yang login berbagi satu toko.
6. Publikasikan aturan keamanan dan indeks:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

7. Restart `npm run dev`. Badge di halaman Pengaturan akan berubah menjadi **Terhubung Firebase**.

> Tanpa variabel `VITE_*` di atas, aplikasi tetap berjalan dalam Mode Demo. Build produksi tidak membutuhkan kredensial Firebase.

### Aturan keamanan

`firestore.rules` mengizinkan:

- **Baca publik** untuk `products`, `sales`, dan `settings/store` — diperlukan agar tautan struk `/r/:saleId` dapat dibuka tanpa login.
- **Tulis hanya untuk pengguna terautentikasi** pada seluruh koleksi, termasuk `stockMoves`, `counters/sales`, dan `users/{uid}`.

Tinjau kembali aturan ini sebelum produksi, terutama jika data harga modal (HPP) tidak boleh dibaca publik.

## API server opsional

Server Express menyajikan hasil build dan beberapa endpoint baca berbasis Firebase Admin.

```bash
npm run build
npm run server
```

Tambahkan ke `.env`:

```env
PORT=8787
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
```

`FIREBASE_SERVICE_ACCOUNT` menerima path file JSON **atau** JSON mentah. Jangan commit file service account.

| Endpoint | Keterangan |
| --- | --- |
| `GET /api/health` | Status server dan koneksi Firestore |
| `GET /api/receipt/:id` | Data struk berdasarkan ID transaksi |
| `GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Ringkasan omzet, laba, pajak, metode bayar, produk terlaris |

Tanpa kredensial Admin, endpoint data mengembalikan `503` dan frontend statis tetap dilayani dari `dist/`.

> Endpoint server tidak memakai verifikasi token. Sebelum produksi, lindungi `/api/reports/*` di balik autentikasi (reverse proxy, Firebase App Check, atau verifikasi ID token) karena ringkasan laporan bersifat internal.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite dev server |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Pratinjau hasil build |
| `npm run server` | Menjalankan API Express + menyajikan `dist/` |

## Definisi laporan

- **Omzet bersih** = `subtotal − diskon` (tidak termasuk pajak).
- **Laba kotor** = omzet bersih − HPP (`cost × qty`).
- **Total bruto** = omzet bersih + pajak (nominal yang dibayar pelanggan).
- Transaksi **void** tidak dihitung dalam omzet/laba, tetapi tetap tampil di riwayat dengan stok yang sudah dikembalikan.

## Struktur proyek

```text
e-cash/
├─ docs/PRD.md              # Product Requirements Document
├─ server/index.js          # API Express opsional (Firebase Admin)
├─ src/
│  ├─ components/           # Layout, struk, dialog pembayaran, UI kit
│  ├─ context/              # AuthContext, StoreContext (listener real-time)
│  ├─ lib/                  # api, firebaseApi, demoApi, analytics, csv, receipt
│  ├─ pages/                # Login, Dashboard, POS, Products, Transactions,
│  │                        # Reports, Settings, PublicReceipt, NotFound
│  ├─ App.jsx               # Routing + guard
│  └─ index.css             # Tema, animasi, gaya cetak 80 mm
├─ firebase.json
├─ firestore.rules
├─ firestore.indexes.json
└─ .env.example
```

## Model data Firestore

| Path | Isi |
| --- | --- |
| `products/{id}` | Nama, SKU, kategori, harga jual, modal, stok, stok minimum, emoji |
| `sales/{id}` | Invoice, item, subtotal, diskon, pajak, total, metode bayar, kasir, status, `dateKey`, waktu |
| `stockMoves/{id}` | Riwayat keluar/masuk stok beserta stok sebelum & sesudah |
| `settings/store` | Profil toko, logo, pajak, footer struk, ambang stok |
| `counters/sales` | Nomor urut invoice harian |
| `users/{uid}` | Profil pengguna |

Transaksi penjualan dijalankan dalam Firestore transaction: memvalidasi stok, mengurangi stok, menaikkan counter invoice, dan mencatat pergerakan stok secara atomik. Void juga berjalan atomik dan mengembalikan stok seluruh item.

## Deployment

1. `npm run build`
2. Deploy folder `dist/` ke hosting statis (Firebase Hosting, Vercel, Netlify), atau jalankan `npm run server` di VPS/Render/Railway.
3. Untuk SPA di hosting statis, arahkan semua rute ke `index.html`.
4. Set variabel `VITE_*` pada environment build hosting.

Contoh `firebase hosting` sudah tersedia di `firebase.json` (folder publik `dist`, rewrite SPA).

## Batasan

- Single-tenant: satu toko per deployment; belum ada multi-outlet atau manajemen peran granular.
- Mode Demo tidak sinkron antar perangkat dan tautan struk hanya berlaku di perangkat yang sama.
- Pembayaran bersifat pencatatan; belum terintegrasi dengan payment gateway.
- Cetak struk memakai dialog cetak browser (thermal 80 mm atau PDF).

## Lisensi

Proyek contoh untuk keperluan pembelajaran dan pengembangan internal.
