# JelajahSabang - Sistem Informasi Pariwisata Pulau Weh

JelajahSabang adalah sistem informasi pariwisata berbasis web yang menyediakan informasi lengkap tentang destinasi wisata di Pulau Weh, Sabang, Indonesia. Aplikasi ini memungkinkan pengguna untuk menjelajahi berbagai destinasi, memesan layanan, dan melakukan pembayaran secara online.

## Fitur Utama

- Katalog destinasi wisata dengan kategori (pantai, tempat menyelam, situs sejarah, dll)
- Pemesanan layanan wisata, penginapan, dan tur
- Pembayaran online dengan Xendit
- Autentikasi pengguna (wisatawan, admin, pemilik layanan)
- Ulasan dan rating destinasi wisata
- Pencarian dan filter destinasi dan layanan
- Integrasi peta untuk menampilkan lokasi destinasi

## Teknologi

- React dengan TypeScript
- Tailwind CSS untuk styling
- Supabase untuk database dan autentikasi
- Xendit untuk integrasi pembayaran
- Vite sebagai build tool

## Setup Proyek

### Prasyarat

- Node.js versi terbaru
- Akun Supabase
- Akun Xendit (untuk memproses pembayaran)

### Langkah-langkah Setup

1. Clone repository ini

2. Install dependensi
   ```bash
   npm install
   ```

3. Setup Supabase
   - Buat project baru di Supabase
   - Klik "Connect to Supabase" di pojok kanan atas aplikasi
   - Ikuti petunjuk untuk menghubungkan proyek Anda ke Supabase
   - Atau setup manual dengan menyalin URL dan Anon Key dari Supabase dan menambahkannya ke file `.env`

4. Jalankan migrasi database
   - Migrasi akan secara otomatis membuat struktur tabel yang diperlukan
   - Seeding data awal juga akan dijalankan

5. Setup Xendit (untuk pembayaran)
   - Buat akun di Xendit
   - Dapatkan API Key dari dashboard Xendit
   - Tambahkan API Key ke variabel lingkungan `XENDIT_API_KEY` di Supabase Edge Functions

6. Setup Edge Functions
   - Edge Functions untuk pembayaran dan webhook sudah dibuat
   - Deploy edge functions ke Supabase

7. Jalankan aplikasi
   ```bash
   npm run dev
   ```

## Struktur Database

Database menggunakan Supabase (PostgreSQL) dengan struktur tabel berikut:

- `profiles` - Informasi profil pengguna
- `categories` - Kategori destinasi wisata
- `destinations` - Destinasi wisata
- `destination_images` - Gambar-gambar destinasi
- `service_providers` - Penyedia layanan (penginapan, tur, dll)
- `services` - Layanan yang ditawarkan
- `service_images` - Gambar-gambar layanan
- `bookings` - Pemesanan layanan
- `payments` - Informasi pembayaran
- `reviews` - Ulasan dari pengguna
- `favorites` - Favorit pengguna

## Edge Functions

Aplikasi menggunakan Supabase Edge Functions untuk memproses pembayaran:

- `create-payment` - Membuat invoice pembayaran baru di Xendit
- `webhook-xendit` - Menerima callback dari Xendit saat pembayaran selesai
- `check-payment-status` - Memeriksa status pembayaran

## Peran Pengguna

1. **Wisatawan (User)**
   - Menjelajahi destinasi wisata
   - Memesan layanan
   - Memberi ulasan dan rating
   - Mengelola favorit

2. **Penyedia Layanan (Service Provider)**
   - Mengelola profil bisnis
   - Mengelola layanan yang ditawarkan
   - Melihat pemesanan yang masuk

3. **Admin**
   - Mengelola semua konten
   - Memverifikasi penyedia layanan
   - Melihat statistik dan laporan

## Pengujian

Untuk menguji aplikasi, beberapa data dummy telah disediakan:

- Kategori wisata
- Destinasi populer di Sabang
- Penyedia layanan dan layanan contoh
- Gambar untuk semua item

Anda dapat login sebagai pengguna berbeda untuk menguji fitur yang berbeda.