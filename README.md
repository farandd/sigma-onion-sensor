# SIGMA (Smart IoT for Growth Monitoring in Agriculture)
SIGMA (Smart IoT for Growth Monitoring in Agriculture) adalah platform ekosistem digital yang dirancang untuk membantu petani dalam pemantauan nutrisi tanah dan kesehatan tanaman secara presisi. Sistem ini menggabungkan teknologi Internet of Things (IoT) dengan Computer Vision (AI) untuk memberikan data yang akurat dan actionable.

## 1. Konsep Perangkat (Dual System)
Sistem ini mendukung dua jenis perangkat input yang dapat dipilih oleh pengguna melalui dashboard:

Mode Portable: Digunakan oleh petani untuk pengecekan manual di berbagai titik lahan secara fleksibel menggunakan perangkat genggam.

Mode Panel: Menggunakan perangkat stasioner (tetap) yang dipasang di titik tertentu lahan untuk pemantauan berkelanjutan secara otomatis.

## 2. Pemantauan Sensor Real-Time
Aplikasi menampilkan 7 parameter tanah krusial yang diupdate secara berkala (setiap 10 menit):

Makronutrien: Nitrogen (N), Phospor (P), dan Kalium (K) untuk menentukan kebutuhan pupuk.

Kondisi Lingkungan: Kelembapan tanah, Suhu tanah, tingkat keasaman (pH), dan Konduktivitas listrik tanah.

Visualisasi: Data disajikan dalam bentuk radial gauge agar pengguna dapat memahami kondisi tanah secara cepat tanpa harus membaca angka yang rumit.

## 3. Analisis Penyakit Berbasis AI
Salah satu fitur unggulan SIGMA adalah modul deteksi penyakit tanaman bawang merah:

Alur Kerja: Kamera pada alat (baik Portable maupun Panel) menangkap foto daun tanaman.

Pemrosesan: Foto dikirim ke model AI yang dilatih di platform Roboflow.

Output: Dashboard akan menampilkan foto tersebut dengan Bounding Box (kotak deteksi) yang menunjukkan area yang terserang penyakit, label nama penyakit (seperti Alternaria Porri), dan tingkat keyakinan AI (Confidence Score).

## 4. Mekanisme Autentikasi & Penyimpanan
Akses Terproteksi: Pengguna harus melakukan Login atau Register untuk mengakses data lahan mereka.

Sinkronisasi Data: Setiap akun akan menyimpan riwayat data sensor dan foto deteksi AI. Hal ini memungkinkan petani melihat tren kesehatan lahan dari waktu ke waktu (fitur History).

## 5. Desain Responsif (Web & Mobile)
Sistem dirancang agar bisa diakses di mana saja:

Web: Memberikan pandangan luas untuk analisis mendalam di kantor atau rumah.

Mobile: Dioptimalkan untuk penggunaan di lapangan dengan navigasi yang mudah diakses jempol dan fitur kamera langsung.
