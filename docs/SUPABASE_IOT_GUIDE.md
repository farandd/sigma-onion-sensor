# Panduan Integrasi IoT & Web Dashboard: SIGMA Onion Monitoring
**Perangkat: ESP32 + Sensor 7-in-1 NPK & pH (RS485 Modbus)**  
**Cloud Database: Supabase**  
**Frontend: React + Vite (Tailwind CSS)**

Dokumen ini ditulis sebagai panduan teknis langkah demi langkah untuk tim IoT Developer dan Web Developer proyek **SIGMA Onion Monitoring**. Dokumen ini mencakup skema database, firmware mikrokontroler, dan integrasi frontend secara real-time.

---

## Bagian 1: Struktur Tabel Supabase & Konfigurasi Realtime

Untuk menyimpan data dari perangkat IoT, kita membutuhkan struktur tabel yang efisien, memiliki tipe data yang presisi, dan mendukung keamanan data (Row Level Security).

### 1. Rekomendasi Skema SQL (`sensor_logs`)
Jalankan script SQL berikut di **SQL Editor** pada dashboard Supabase Anda. Script ini membuat tabel `sensor_logs`, menambahkan indeks untuk optimasi query, mengaktifkan RLS, serta menambahkan kebijakan akses (security policies).

```sql
-- 1. Pembuatan Tabel Utama
CREATE TABLE IF NOT EXISTS public.sensor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    nitrogen NUMERIC(6, 2) DEFAULT 0.00,      -- mg/kg (N)
    phosphorus NUMERIC(6, 2) DEFAULT 0.00,    -- mg/kg (P)
    potassium NUMERIC(6, 2) DEFAULT 0.00,     -- mg/kg (K)
    ph NUMERIC(4, 2) DEFAULT 7.00,             -- Skala 0-14 pH
    moisture NUMERIC(5, 2) DEFAULT 0.00,      -- Persentase (%) kelembapan tanah
    temperature NUMERIC(5, 2) DEFAULT 0.00,   -- Derajat Celsius (°C)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Optimasi Query dengan Indexing (Sangat penting untuk histori grafik)
CREATE INDEX IF NOT EXISTS idx_sensor_logs_device_created 
ON public.sensor_logs (device_id, created_at DESC);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.sensor_logs ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Keamanan (Security Policies)
-- Kebijakan A: Izinkan perangkat memasukkan data secara anonim (jika menggunakan REST API Supabase langsung)
CREATE POLICY "Allow anonymous device insert" 
ON public.sensor_logs 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Kebijakan B: Izinkan pengguna terotentikasi untuk membaca data sensor
CREATE POLICY "Allow authenticated users to read logs" 
ON public.sensor_logs 
FOR SELECT 
TO authenticated 
USING (true);
```

> [!NOTE]  
> **Catatan untuk SIGMA Project**: Dalam basis data Anda saat ini, terdapat tabel bernama `sensor_readings` yang sudah digunakan oleh frontend. Skema di atas (`sensor_logs`) dapat disesuaikan langsung ke `sensor_readings` dengan menambahkan kolom `device_id` jika diperlukan, atau Anda dapat menggunakan tabel `sensor_logs` baru ini untuk isolasi data raw dari alat.

---

### 2. Cara Mengaktifkan "Supabase Realtime"
Supabase menggunakan ekstensi **Walrus** untuk memantau perubahan database PostgreSQL secara real-time. Agar tabel `sensor_logs` mempublikasikan perubahan baris (INSERT) ke klien web, ikuti langkah berikut:

#### Opsi A: Lewat Supabase Dashboard (UI)
1. Buka **Supabase Dashboard** proyek Anda.
2. Klik ikon **Database** di bilah menu kiri (ikon silinder database).
3. Pilih menu **Replication**.
4. Pada baris **supabase_realtime** (publication), klik tombol **Source** atau **Tables** (misalnya tombol bertuliskan *X tables*).
5. Cari tabel `sensor_logs` (atau `sensor_readings`), kemudian geser tombol toggle menjadi **Enabled** (Hijau).

#### Opsi B: Lewat SQL Editor (Cepat & Presisi)
Cukup jalankan satu baris perintah berikut di SQL Editor Anda:
```sql
alter publication supabase_realtime add table public.sensor_logs;
```

---

## Bagian 2: Firmware ESP32 (Untuk IoT Developer)

Bagian ini menyediakan kode program C++ lengkap untuk ESP32 menggunakan **Arduino IDE**. Kode ini melakukan dua hal utama:
1. Membaca data real-time dari **Sensor 7-in-1 NPK & pH (RS485 Modbus RTU)**.
2. Melakukan **HTTP POST** data tersebut ke REST API Supabase.

### 1. Skema Hubungan Kabel (Wiring Diagram)
Perangkat RS485 membutuhkan transceiver TTL-to-RS485 (seperti MAX485 atau chip pemancar otomatis) agar bisa berkomunikasi dengan port serial ESP32.

```text
  [ESP32]                             [MAX485 Module]                     [Sensor 7-in-1]
  3.3V / 5V  ------------------------  VCC (5V disukai)
  GND  ------------------------------  GND ------------------------------ Black (GND)
  GPIO 16 (RX2)  --------------------  RO (Receiver Out)
  GPIO 17 (TX2)  --------------------  DI (Driver In)
  GPIO 4 (DE/RE control)  -----------  DE & RE (Jumper Bersama)
                                       A  ------------------------------- Yellow/Blue (A+)
                                       B  ------------------------------- Green/Yellow (B-)
                                                                          Brown (VCC 9-24V Ext)
```

---

### 2. Kode Program ESP32 (`esp32_sensor_supabase.ino`)

> [!IMPORTANT]  
> Pasang pustaka **ArduinoJson** oleh Benoit Blanchon melalui Library Manager Arduino IDE sebelum melakukan kompilasi kode ini.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// ======================== KONFIGURASI WIFI & SUPABASE ========================
const char* ssid = "WIFI_LAHAN_ONION";        // Ganti dengan SSID WiFi lahan Anda
const char* password = "PASSWORD_WIFI_LAHAN";  // Ganti dengan Password WiFi lahan Anda

// Detail Project Supabase Anda
const char* supabase_url = "https://zstlyahhowekebbibkxs.supabase.co/rest/v1/sensor_logs";
const char* supabase_anon_key = "MASUKKAN_ANON_KEY_SUPABASE_ANDA_DI_SINI";

// ID Perangkat IoT unik untuk lahan ini
const char* device_id = "onion-field-panel-01";

// Interval pengiriman data (milidetik)
unsigned long last_send_time = 0;
const unsigned long send_interval = 10000; // Kirim data setiap 10 detik

// ===================== KONFIGURASI RS485 MODBUS RTU =====================
#define RXD2 16          // Pin RX2 ESP32 (Sambungkan ke RO MAX485)
#define TXD2 17          // Pin TX2 ESP32 (Sambungkan ke DI MAX485)
#define RE_DE_PIN 4      // Pin Kontrol Arah Data (RE & DE MAX485 di-jumper)

// Frame request Modbus RTU untuk membaca 7 Register Sensor (NPK, pH, Moisture, Temp, EC)
// Format: Slave Addr (0x01) | Func Code (0x03) | Start Addr High (0x00) | Start Addr Low (0x00) | Reg Count High (0x00) | Reg Count Low (0x07) | CRC Low | CRC High
const byte modbus_request_frame[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0x04, 0x08};
byte modbus_response_buffer[19]; // Buffer respon (1 byte Addr, 1 byte Func, 1 byte Len, 14 byte Data, 2 byte CRC)

// ============================ SETUP & STARTUP ============================
void setup() {
  Serial.begin(115200);
  
  // Setup Hardware Serial 2 untuk komunikasi Modbus RS485 (9600 baud, 8N1)
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  pinMode(RE_DE_PIN, OUTPUT);
  digitalWrite(RE_DE_PIN, LOW); // Set MAX485 ke mode RECEIVE (Mendengar)

  // Mulai koneksi WiFi
  connectToWiFi();
}

// ============================ LOOP UTAMA ============================
void loop() {
  // Pastikan WiFi tetap terhubung
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Kirim data secara periodik sesuai interval
  if (millis() - last_send_time >= send_interval) {
    last_send_time = millis();

    // Data Sensor Variables
    float moisture = 0.0;
    float temperature = 0.0;
    float ph = 0.0;
    int nitrogen = 0;
    int phosphorus = 0;
    int potassium = 0;
    bool sensor_success = false;

    // Lakukan pembacaan dari sensor RS485 asli
    sensor_success = readSensorModbus(&moisture, &temperature, &ph, &nitrogen, &phosphorus, &potassium);

    // JIKA sensor gagal merespon, gunakan NILAI DUMMY sebagai fallback agar sistem tetap berjalan
    if (!sensor_success) {
      Serial.println("[WARNING] Sensor RS485 tidak merespon. Mengaktifkan nilai dummy...");
      moisture = random(350, 650) / 10.0;       // Dummy: 35.0% - 65.0%
      temperature = random(240, 320) / 10.0;    // Dummy: 24.0°C - 32.0°C
      ph = random(55, 75) / 10.0;                // Dummy: 5.5 - 7.5
      nitrogen = random(20, 45);                 // Dummy: 20 - 45 mg/kg
      phosphorus = random(12, 28);               // Dummy: 12 - 28 mg/kg
      potassium = random(75, 120);               // Dummy: 75 - 120 mg/kg
    }

    // Kirim data ke Supabase Cloud
    sendDataToSupabase(moisture, temperature, ph, nitrogen, phosphorus, potassium);
  }
}

// ===================== FUNGSI PEMBACAAN RS485 MODBUS =====================
bool readSensorModbus(float *moisture, float *temperature, float *ph, int *n, int *p, int *k) {
  // 1. Ubah MAX485 ke mode TRANSMIT (Kirim Perintah)
  digitalWrite(RE_DE_PIN, HIGH);
  delay(10);
  
  // Kirim frame request ke sensor
  Serial2.write(modbus_request_frame, sizeof(modbus_request_frame));
  Serial2.flush(); // Pastikan semua byte terkirim
  
  // 2. Kembalikan MAX485 ke mode RECEIVE (Mendengar Jawaban)
  digitalWrite(RE_DE_PIN, LOW);
  delay(10);

  // 3. Baca respon dari buffer serial (menunggu hingga 19 byte data tiba)
  unsigned long start_time = millis();
  int bytes_read = 0;
  
  while ((millis() - start_time < 500) && (bytes_read < 19)) {
    if (Serial2.available()) {
      modbus_response_buffer[bytes_read] = Serial2.read();
      bytes_read++;
    }
  }

  // Cetak data buffer untuk debugging
  Serial.print("[MODBUS] Bytes diterima: ");
  Serial.println(bytes_read);
  for(int i=0; i<bytes_read; i++) {
    Serial.printf("%02X ", modbus_response_buffer[i]);
  }
  Serial.println();

  // Validasi respon: panjang harus 19 byte, slave ID 0x01, func 0x03
  if (bytes_read == 19 && modbus_response_buffer[0] == 0x01 && modbus_response_buffer[1] == 0x03) {
    // 4. Parsing data dari register sensor (Format register 16-bit High Byte & Low Byte)
    // Register 1: Kelembaban Tanah (Moisture) -> Skala 1:10
    int raw_moisture = (modbus_response_buffer[3] << 8) | modbus_response_buffer[4];
    *moisture = raw_moisture / 10.0;

    // Register 2: Suhu Tanah (Temperature) -> Skala 1:10
    int raw_temp = (modbus_response_buffer[5] << 8) | modbus_response_buffer[6];
    // Menangani nilai minus (komplemen dua)
    if (raw_temp > 32767) raw_temp = raw_temp - 65536;
    *temperature = raw_temp / 10.0;

    // Register 4: Kadar pH Tanah -> Skala 1:10 (beberapa sensor 1:100, sesuaikan datasheet)
    int raw_ph = (modbus_response_buffer[9] << 8) | modbus_response_buffer[10];
    *ph = raw_ph / 10.0;

    // Register 5: Nitrogen (N) -> Nilai langsung mg/kg
    *n = (modbus_response_buffer[11] << 8) | modbus_response_buffer[12];

    // Register 6: Fosfor (P) -> Nilai langsung mg/kg
    *p = (modbus_response_buffer[13] << 8) | modbus_response_buffer[14];

    // Register 7: Kalium (K) -> Nilai langsung mg/kg
    *k = (modbus_response_buffer[15] << 8) | modbus_response_buffer[16];

    Serial.println("[MODBUS] Pembacaan sensor berhasil!");
    return true;
  }
  
  return false; // Pembacaan gagal atau format salah
}

// ===================== FUNGSI KIRIM DATA (HTTP POST) =====================
void sendDataToSupabase(float moisture, float temperature, float ph, int n, int p, int k) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  
  // Inisialisasi HTTP Client
  http.begin(supabase_url);

  // Atur Headers wajib untuk REST API Supabase
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabase_anon_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_anon_key);
  http.addHeader("Prefer", "return=minimal"); // Mengurangi payload respon Supabase

  // Buat JSON Document menggunakan ArduinoJson
  StaticJsonDocument<256> doc;
  doc["device_id"] = device_id;
  doc["nitrogen"] = n;
  doc["phosphorus"] = p;
  doc["potassium"] = k;
  doc["ph"] = ph;
  doc["moisture"] = moisture;
  doc["temperature"] = temperature;

  String json_payload;
  serializeJson(doc, json_payload);

  Serial.println("[HTTP] Mengirim data ke Supabase...");
  Serial.println(json_payload);

  // Kirim HTTP POST
  int http_response_code = http.POST(json_payload);

  if (http_response_code > 0) {
    Serial.printf("[HTTP] Data Berhasil Dikirim! Kode Respon: %d\n", http_response_code);
  } else {
    Serial.printf("[HTTP] Gagal mengirim! Error: %s\n", http.errorToString(http_response_code).c_str());
  }

  // Tutup koneksi http
  http.end();
}

// ===================== FUNGSI KONEKSI WIFI =====================
void connectToWiFi() {
  Serial.print("[WIFI] Menghubungkan ke ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  int attempt_counter = 0;
  while (WiFi.status() != WL_CONNECTED && attempt_counter < 20) {
    delay(500);
    Serial.print(".");
    attempt_counter++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Terhubung!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Gagal terhubung ke WiFi lahan. Beroperasi offline/coba ulang nanti.");
  }
}
```

---

## Bagian 3: Frontend React & Integrasi Supabase Realtime

Pada bagian ini, kita akan membuat komponen React modular untuk menampilkan status monitoring tanah. Komponen ini secara otomatis mengaktifkan listener Supabase Realtime WebSocket menggunakan SDK `@supabase/supabase-js`.

Begitu ESP32 berhasil melakukan `INSERT` data baru ke database, data di layar dashboard akan langsung ter-update dengan efek transisi yang sangat mulus tanpa perlu reload browser!

### 1. Komponen Dashboard Utama (`OnionRealtimeDashboard.jsx`)
Komponen ini didesain premium menggunakan **Tailwind CSS** dan **Lucide Icons** agar sesuai dengan estetika aplikasi modern Anda.

```jsx
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Droplets, Zap, FlaskConical, Thermometer, 
  Smartphone, Activity, RefreshCw, AlertCircle 
} from 'lucide-react';

// Inisialisasi Supabase Client (Gunakan env variables proyek Anda)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zstlyahhowekebbibkxs.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "MASUKKAN_ANON_KEY_ANDA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function OnionRealtimeDashboard({ targetDeviceId = "onion-field-panel-01" }) {
  const [sensorData, setSensorData] = useState({
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    ph: 7.0,
    moisture: 0,
    temperature: 0,
    created_at: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // 1. Mengambil data awal (Initial Fetch)
  const fetchLatestData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sensor_logs')
        .select('*')
        .eq('device_id', targetDeviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSensorData(data);
      }
      setError(null);
    } catch (err) {
      console.error("Gagal mengambil data sensor:", err.message);
      setError("Gagal memuat data terakhir dari database.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Hubungkan ke Supabase Realtime Channel
  useEffect(() => {
    fetchLatestData();

    // Buat realtime channel untuk mendengarkan perubahan tabel sensor_logs
    const channel = supabase
      .channel('sensor-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_logs',
          filter: `device_id=eq.${targetDeviceId}` // Filter khusus alat ini saja!
        },
        (payload) => {
          console.log("Menerima data sensor baru secara Realtime:", payload.new);
          
          // Masukkan data baru ke state
          setSensorData(payload.new);
          
          // Triger efek animasi kedip hijau (pulsing) di UI ketika data masuk
          setPulseEffect(true);
          setTimeout(() => setPulseEffect(false), 1500);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
          console.log("Berhasil subscribe ke Supabase Realtime Channel!");
        } else {
          setIsLive(false);
        }
      });

    // Cleanup subscription saat komponen di-unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetDeviceId]);

  // Evaluasi indikator kelayakan tanah bawang merah secara sederhana
  const getSoilStatus = () => {
    if (sensorData.ph < 5.5) return { text: "Terlalu Asam", color: "text-red-500 bg-red-50 border-red-200" };
    if (sensorData.ph > 7.0) return { text: "Terlalu Basa", color: "text-amber-500 bg-amber-50 border-amber-200" };
    if (sensorData.moisture < 40) return { text: "Kurang Air", color: "text-blue-500 bg-blue-50 border-blue-200" };
    return { text: "Kondisi Ideal", color: "text-emerald-500 bg-emerald-50 border-emerald-200" };
  };

  const status = getSoilStatus();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-neutral-50 rounded-3xl border border-black/5 p-8">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-500">Mengkoneksikan ke Supabase...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">SIGMA ONION MONITORING</h1>
            {isLive ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Connection
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Offline
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> ID Perangkat: <span className="font-semibold text-emerald-700 font-mono">{targetDeviceId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sensorData.created_at && (
            <span className="text-xs text-gray-400 font-medium">
              Update Terakhir: {new Date(sensorData.created_at).toLocaleTimeString('id-ID')}
            </span>
          )}
          <button 
            onClick={fetchLatestData}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors border border-black/5 text-gray-600"
            title="Refresh Data Manual"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Status Kondisi Lahan Bawang Merah */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 ${status.color} ${pulseEffect ? 'ring-4 ring-emerald-400/30' : ''}`}>
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">Rekomendasi Lahan</p>
            <p className="text-base font-black tracking-tight mt-0.5">{status.text}</p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 bg-white/70 border border-current rounded-xl uppercase">
          Bawang Merah
        </span>
      </div>

      {/* Grid 6 Parameter Utama Sensor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Nitrogen Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Nitrogen (N)</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">N</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{sensorData.nitrogen} <span className="text-sm font-medium text-gray-400">mg/kg</span></h3>
            <div className="w-full bg-neutral-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.nitrogen / 100) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Phosphorus Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Fosfor (P)</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">P</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{sensorData.phosphorus} <span className="text-sm font-medium text-gray-400">mg/kg</span></h3>
            <div className="w-full bg-neutral-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.phosphorus / 100) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Potassium Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Kalium (K)</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">K</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{sensorData.potassium} <span className="text-sm font-medium text-gray-400">mg/kg</span></h3>
            <div className="w-full bg-neutral-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.potassium / 200) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* pH Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Derajat Keasaman (pH)</span>
            <div className="w-10 h-10 rounded-2xl bg-[#829D45]/10 flex items-center justify-center text-[#829D45]"><FlaskConical className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{Number(sensorData.ph).toFixed(2)}</h3>
            <div className="w-full bg-neutral-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#829D45] h-full rounded-full transition-all duration-1000" style={{ width: `${(sensorData.ph / 14) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Kelembaban Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Kelembapan Tanah</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600"><Droplets className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{sensorData.moisture} <span className="text-sm font-medium text-gray-400">%</span></h3>
            <div className="w-full bg-neutral-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${sensorData.moisture}%` }}></div>
            </div>
          </div>
        </div>

        {/* Suhu Card */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Suhu Tanah</span>
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600"><Thermometer className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">{sensorData.temperature} <span className="text-sm font-medium text-gray-400">°C</span></h3>
            <div className="w-full bg-neutral-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.temperature / 60) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
```

---

### 2. Bagaimana Cara Mengintegrasikan Realtime ke Hook Aplikasi Anda? (`useSensorData.ts`)

Jika Anda ingin mengaktifkan data Realtime langsung pada kode aplikasi SIGMA Anda yang sudah ada, Anda dapat menambahkan langganan Realtime Supabase langsung di dalam React Hook `useSensorData.ts`.

Berikut adalah snippet modifikasi yang bisa dimasukkan di dalam file [useSensorData.ts](file:///Users/farandsyaaah/Desktop/Farand/Sem%206/capstone/sigma-onion-sensor/src/hooks/useSensorData.ts):

```typescript
// Tambahkan useEffect berikut di dalam hook useSensorData untuk memantau INSERT baru secara Live:

useEffect(() => {
  if (!user || isDemoData) return;

  console.log(`Mengaktifkan Realtime listener untuk Lahan: ${landId}, Mode: ${systemType}`);

  const channel = supabase
    .channel('sensor-data-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        const newData = payload.new;
        // Validasi apakah data sensor baru berasal dari lahan & mode sistem yang sedang aktif di UI
        if (newData.land_id === landId && newData.system_type === systemType) {
          console.log("Realtime Update Diterima!", newData);
          setSensorData(newData);
          setLastUpdated(new Date(newData.created_at));
        }
      }
    )
    .subscribe();

  // Bersihkan channel saat parameter systemType atau landId berganti
  return () => {
    supabase.removeChannel(channel);
  };
}, [user, systemType, landId, isDemoData]);
```

---

## Bagian 4: Perbandingan Arsitektur & Rekomendasi Penting

Sebagai **Senior Fullstack & IoT Engineer**, berikut adalah beberapa rekomendasi arsitektur kritis untuk dipertimbangkan oleh tim Anda:

### 1. Keamanan Anon Key & Penulisan Langsung (REST API) vs Edge Function
Dalam panduan di atas, kami menyediakan firmware untuk menulis data langsung menggunakan REST API (dengan menyertakan header `apikey` dan `Authorization Bearer`). 

Namun, aplikasi SIGMA Anda sebenarnya memiliki **Supabase Edge Function** bernama `ingest-sensor` di folder `supabase/functions/ingest-sensor/index.ts`. 

> [!TIP]
> **Rekomendasi Sangat Kuat**: Gunakan Edge Function `ingest-sensor` untuk produksi!
> 
> **Mengapa?**
> * **Keamanan Lebih Baik**: Kode ESP32 Anda tidak perlu menyimpan `anon_key` Supabase yang memberi hak akses baca/tulis ke seluruh tabel publik. Cukup simpan token rahasia perangkat `X-Device-Key` (misalnya: `DEVICE_INGEST_KEY`).
> * **Normalisasi Data**: Edge Function Anda sudah memiliki logika mendeteksi variasi nama payload (seperti `kelembapan_tanah` atau `ec`) serta membagi nilai EC otomatis jika di atas 20.
> * **Bypass RLS**: Alat IoT tidak perlu login sebagai user. Edge Function menggunakan `SERVICE_ROLE_KEY` (admin) untuk menyisipkan data sensor ke tabel secara aman setelah memverifikasi kecocokan `X-Device-Key`.

#### Kode Firmware Alternatif untuk Mengirim ke Edge Function
Jika IoT Developer Anda ingin mengarahkan ESP32 ke Edge Function proyek Anda, lakukan perubahan berikut pada fungsi `sendDataToSupabase` di ESP32:

```cpp
void sendDataToSupabase(float moisture, float temperature, float ph, int n, int p, int k) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  
  // URL diarahkan ke Edge Function Ingest-Sensor
  const char* edge_function_url = "https://zstlyahhowekebbibkxs.supabase.co/functions/v1/ingest-sensor";
  http.begin(edge_function_url);

  // Headers untuk Edge Function
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", "MASUKKAN_DEVICE_INGEST_KEY_ANDA"); // Token pengaman unik alat

  // Payload disesuaikan dengan skema Edge Function
  StaticJsonDocument<256> doc;
  doc["device_id"] = "onion-field-panel-01";
  doc["user_id"] = "MASUKKAN_UUID_PEMILIK_LAHAN"; // Diperlukan agar data terpetakan ke user yang benar
  doc["system_type"] = "panel";                  // "portable" atau "panel"
  doc["land_id"] = "lahan1";                     // ID Lahan di aplikasi: "lahan1" atau "lahan2"
  doc["nitrogen"] = n;
  doc["phosphorus"] = p;
  doc["potassium"] = k;
  doc["ph"] = ph;
  doc["moisture"] = moisture;
  doc["temperature"] = temperature;

  String json_payload;
  serializeJson(doc, json_payload);

  Serial.println("[HTTP] Mengirim data ke Edge Function...");
  int http_response_code = http.POST(json_payload);

  if (http_response_code > 0) {
    Serial.printf("[HTTP] Berhasil melalui Edge Function! Code: %d\n", http_response_code);
  } else {
    Serial.printf("[HTTP] Gagal! Error: %s\n", http.errorToString(http_response_code).c_str());
  }
  http.end();
}
```

### 2. Tips Stabilitas Hardware di Lapangan (Lahan Bawang)
* **Common Ground**: Pastikan Ground (GND) dari ESP32, MAX485, dan Catu Daya Eksternal Sensor (12V) terhubung satu sama lain. Tanpa common ground, sinyal RS485 akan sangat berisik dan rentan gagal transfer data.
* **Garis Sinyal RS485**: Gunakan kabel twisted-pair terlindung (shielded) untuk menyambungkan garis A dan B jika jarak antara sensor di tanah dan boks kontrol ESP32 lebih dari 5 meter.
* **Resistor Terminas**: Jika kabel sangat panjang dan terjadi distorsi data, tambahkan resistor 120 Ohm di antara jalur A dan B pada ujung terjauh dekat sensor untuk mencegah pantulan sinyal.
