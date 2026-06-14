# 🛡️ ContactGuard - Smart Caller ID & Spam Shield

**ContactGuard** adalah aplikasi mobile prototipe (klon GetContact) berbasis **React Native (Expo)** untuk sisi frontend, dan **Node.js (Express) + PostgreSQL** untuk backend. Aplikasi ini dirancang untuk mendeteksi panggilan spam, memverifikasi identitas penelpon asing, serta melihat nama kontak kita di ponsel orang lain melalui database crowdsourced secara *real-time*.

---

## ✨ Fitur Utama

1. **🔍 Lacak Nomor HP (Caller ID)**
   * Melacak identitas nomor telepon asing melalui basis data komunitas.
   * Menampilkan **Trust Score (Skor Kepercayaan)** interaktif berbasis bar indikator dinamis yang berubah warna (Aman/Kuning/Spam).
   * Melaporkan aktivitas spam langsung dari UI dengan alasan terperinci.

2. **🏷️ Halaman Profil & Tag Nama Saya**
   * Halaman profil premium lengkap dengan **Verified Checkmark (Centang Biru)**.
   * Inisial nama dinamis dengan efek *shadow design*.
   * Tiga kolom statistik interaktif: Jumlah Tag, Pengunjung Profil, dan Skor Keamanan.
   * Grid tag nama berwarna-warni pastel modern berdasarkan nama kontak yang didaftarkan orang lain.
   * Riwayat pengunjung profil secara real-time.

3. **🛡️ Proteksi Spam Otomatis**
   * Sakelar Switch untuk mengaktifkan/menonaktifkan proteksi panggilan spam.
   * Log panggilan terblokir secara real-time untuk nomor-nomor asing mencurigakan.

4. **📦 Sinkronisasi Buku Telepon**
   * Mengakses kontak lokal perangkat secara aman.
   * Pratinjau pratinjau daftar kontak horizontal.
   * Mengunggah relasi nama kontak ke server crowdsourcing untuk membangun sistem keamanan bersama.

5. **🔌 Zero-Configuration Auto-API Resolver**
   * Aplikasi mendeteksi IP komputer lokal yang menjalankan bundler Metro secara otomatis (`expo-constants`), menghilangkan keharusan mengganti URL API manual saat berganti jaringan Wi-Fi.

---

## 🛠️ Arsitektur & Teknologi

### **Frontend (Mobile)**
* **React Native & Expo (SDK 54):** Rangka pengembangan aplikasi lintas platform.
* **Ionicons:** Paket ikon modern berkualitas tinggi.
* **AsyncStorage:** Penyimpanan lokal untuk session data dan preferensi pengguna.
* **safe-area-context:** Penanganan takik (*notch*) layar secara dinamis.

### **Backend (Server)**
* **Node.js & Express:** API Endpoint server.
* **Supabase PostgreSQL:** Penyimpanan basis data cloud dengan driver `pg` (node-postgres).
* **Hybrid Database Architecture (Zero-Failure Fallback):** Server otomatis menggunakan database file JSON lokal (`database.json`) jika koneksi PostgreSQL Cloud tidak terkonfigurasi.

---

## 🚀 Panduan Memulai Cepat

### **1. Persiapan Backend**
1. Buka folder `backend/` pada terminal.
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. *(Opsional)* Duplikat file `.env.example` menjadi `.env` dan masukkan tautan koneksi PostgreSQL Anda:
   ```env
   DATABASE_URL="postgresql://username:password@hostname:6543/postgres?pgbouncer=true"
   ```
4. Jalankan backend server:
   ```bash
   npm start
   ```
   *Server akan otomatis berjalan di port `3000` dan mendeteksi/membuat tabel database secara otomatis (auto-migration).*

### **2. Persiapan Frontend (React Native)**
1. Buka root folder proyek (`getcontact-rn-prototype`) di terminal komputer Anda.
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan aplikasi Expo:
   ```bash
   npm start
   ```
4. Buka aplikasi **Expo Go** pada ponsel Android/iOS Anda dan pindai QR Code di terminal. Pastikan ponsel dan komputer terhubung pada jaringan Wi-Fi yang sama.

---

## 🔒 Konfigurasi Keamanan Basis Data

Aplikasi ini menggunakan tiga tabel utama pada Supabase PostgreSQL:
* **`tags`:** Menyimpan pemetaan nomor telepon dengan usulan nama panggilan dari kontributor.
* **`spam_reports`:** Menyimpan daftar laporan penipuan untuk diakumulasikan ke dalam skor keamanan (*trust score*).
* **`views_log`:** Mencatat log pengunjung nomor telepon secara real-time.

---

## 👨‍💻 Kontribusi
Dibuat untuk portofolio pengembangan aplikasi mobile full-stack. Silakan ajukan Issue atau Pull Request jika ingin berkontribusi menyempurnakan fitur ContactGuard.
