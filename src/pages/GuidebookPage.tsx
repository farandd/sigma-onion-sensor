import React from 'react';
import { BookOpen, BrainCircuit, Activity, Smartphone, MonitorSpeaker, Settings, Lock, HelpCircle, AlertCircle, RefreshCw, Camera, User, Bell, Shield } from 'lucide-react';

export default function GuidebookPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 px-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/5">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">Buku Panduan</h2>
          <p className="text-sm text-neutral-muted font-medium">Panduan lengkap penggunaan aplikasi SIGMA</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
        
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">1. Pengenalan Mode Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-accent-rosemary/10 border border-accent-rosemary/20">
              <div className="flex items-center gap-2 text-accent-straken mb-2">
                <Smartphone className="w-5 h-5" />
                <h4 className="font-bold text-sm">Portable Mode</h4>
              </div>
              <p className="text-xs text-gray-600">Digunakan untuk sensor yang berpindah-pindah. Anda cukup memilih lahan di aplikasi, dan alat otomatis menyesuaikan data ke lahan tersebut.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <MonitorSpeaker className="w-5 h-5" />
                <h4 className="font-bold text-sm">Panel Mode</h4>
              </div>
              <p className="text-xs text-gray-600">Digunakan untuk sensor stasioner yang terpasang permanen di lahan tertentu. Pemantauan otomatis dan real-time.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> 2. Akun & Keamanan
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 list-decimal pl-4">
            <li><strong>Login:</strong> Masukkan email dan kata sandi Anda.</li>
            <li><strong>Ubah Kata Sandi:</strong> Jika lupa atau ingin mengganti, buka menu <strong>Setelan</strong> &gt; <strong>Keamanan Akun</strong> &gt; <strong>Ubah Kata Sandi</strong>. Anda akan menerima link reset melalui email.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> 3. Analisis Penyakit (AI)
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 list-decimal pl-4">
            <li>Pilih mode (Portable/Panel) dan pilih lahan yang benar.</li>
            <li>Klik <strong>Analisis Foto</strong>.</li>
            <li>Ambil foto daun tanaman atau unggah dari galeri.</li>
            <li><strong>Catatan:</strong> Pengambilan foto harus di dalam area lahan agar sistem validasi lokasi bekerja dengan akurat.</li>
            <li>Sistem akan menampilkan hasil deteksi dan saran penanganan.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> 4. Monitoring Sensor
          </h3>
          <p className="text-sm text-gray-600 mb-2">Pahami kondisi tanah melalui warna:</p>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600 mb-3">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Optimal</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> Rendah</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Tinggi</div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" /> 5. Masalah & Solusi
          </h3>
          <div className="overflow-x-auto">
            <table className="text-xs text-gray-600 w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2 border">Masalah</th>
                  <th className="p-2 border">Solusi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border font-bold">Data sensor tidak masuk</td>
                  <td className="p-2 border">Cek WiFi/koneksi alat. Jika offline, coba nyalakan ulang.</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">Analisis AI error</td>
                  <td className="p-2 border">Pastikan foto jelas dan diambil di area lahan yang terdaftar.</td>
                </tr>
                <tr>
                  <td className="p-2 border font-bold">Lupa kata sandi</td>
                  <td className="p-2 border">Gunakan fitur "Ubah Kata Sandi" di menu Setelan.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> 6. Setelan Akun
          </h3>
          <p className="text-sm text-gray-600">
            Di menu <strong>Setelan</strong>, Anda dapat mengatur:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4 mt-2">
            <li><strong>Preferensi Monitoring:</strong> Atur notifikasi dan sinkronisasi otomatis.</li>
            <li><strong>Layanan Pengguna:</strong> Akses buku panduan ini kembali atau hubungi Support kami jika ada kendala yang tidak terselesaikan.</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
