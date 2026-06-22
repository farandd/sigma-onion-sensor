#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define RXD2 16
#define TXD2 17

// ======================== WIFI ========================
const char* ssid = "jawir";
const char* password = "qwerty123";

// ======================== SUPABASE ========================
const char* supabase_url =
"https://zstlyahhowekebbibkxs.supabase.co/rest/v1/sensor_readings_portable";

const char* supabase_anon_key =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdGx5YWhob3dla2ViYmlia3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzkxMTksImV4cCI6MjA5MTgxNTExOX0.0y1nQOxc1cZlNT11xBPFtLyrzGFKYZFu_p8ava9C5uo";

// ======================== DEVICE ========================
const char* device_id = "ESP32-001";

const char* system_type = "portable";

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ================= MODBUS =================
byte byteRequest[8] = {
  0x01, 0x03, 0x00, 0x00,
  0x00, 0x07, 0x04, 0x08
};

byte byteResponse[19];

// ================= SENSOR DATA =================
float soilHumidity = 0;
float soilTemperature = 0;
int soilEC = 0;
float soilPH = 0;
int nitrogen = 0;
int phosphorus = 0;
int potassium = 0;

// ================= TIMER =================
unsigned long lastReadTime = 0;
const unsigned long interval = 10000;

// ======================================================
// WIFI CONNECTION
// ======================================================
void setupWifi() {

  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  WiFi.mode(WIFI_STA);

  WiFi.setSleep(false);

  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - startAttemptTime < 20000
  ) {

    delay(500);

    Serial.print(".");

    lcd.setCursor(0, 1);
    lcd.print("Connecting...");
  }

  // ================= SUCCESS =================
  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("\nWiFi Connected!");

    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");

    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());

    lcd.setCursor(0, 2);
    lcd.print("Ready To Work");

    delay(3000);
  }

  // ================= FAILED =================
  else {

    Serial.println("\nWiFi Failed!");

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");

    lcd.setCursor(0, 1);
    lcd.print("Check Hotspot");

    delay(3000);
  }
}

// ======================================================
// SETUP
// ======================================================
void setup() {

  Serial.begin(115200);

  // ================= RS485 =================
  Serial2.begin(
    4800,
    SERIAL_8N1,
    RXD2,
    TXD2
  );

  // ================= LCD =================
  lcd.init();
  lcd.backlight();

  // ================= WELCOME =================
  lcd.setCursor(2, 0);
  lcd.print("WELCOME TO");

  lcd.setCursor(6, 1);
  lcd.print("SIGMA");

  lcd.setCursor(0, 2);
  lcd.print("Smart Farming");

  lcd.setCursor(0, 3);
  lcd.print("Keep Growing!");

  delay(3000);

  lcd.clear();

  // ================= WIFI =================
  setupWifi();
}

// ======================================================
// READ SENSOR
// ======================================================
bool readSensor() {

  // Bersihkan buffer
  while (Serial2.available()) {
    Serial2.read();
  }

  // Kirim request
  Serial2.write(
    byteRequest,
    sizeof(byteRequest)
  );

  delay(1000);

  // Jika ada response
  if (Serial2.available() >= sizeof(byteResponse)) {

    Serial2.readBytes(
      byteResponse,
      sizeof(byteResponse)
    );

    // ================= PARSING =================
    soilHumidity =
      ((byteResponse[3] << 8) |
       byteResponse[4]) / 10.0;

    soilTemperature =
      ((byteResponse[5] << 8) |
       byteResponse[6]) / 10.0;

    soilEC =
      ((byteResponse[7] << 8) |
       byteResponse[8]);

    soilPH =
      ((byteResponse[9] << 8) |
       byteResponse[10]) / 10.0;

    nitrogen =
      ((byteResponse[11] << 8) |
       byteResponse[12]);

    phosphorus =
      ((byteResponse[13] << 8) |
       byteResponse[14]);

    potassium =
      ((byteResponse[15] << 8) |
       byteResponse[16]);

    // ================= SERIAL =================
    Serial.println("===== SENSOR DATA =====");

    Serial.printf(
      "Moisture     : %.1f %%\n",
      soilHumidity
    );

    Serial.printf(
      "Temperature  : %.1f C\n",
      soilTemperature
    );

    Serial.printf(
      "Conductivity : %d uS/cm\n",
      soilEC
    );

    Serial.printf(
      "pH           : %.1f\n",
      soilPH
    );

    Serial.printf(
      "Nitrogen     : %d\n",
      nitrogen
    );

    Serial.printf(
      "Phosphorus   : %d\n",
      phosphorus
    );

    Serial.printf(
      "Potassium    : %d\n",
      potassium
    );

    Serial.println("=======================");

    return true;
  }

  // ================= FAILED =================
  else {

    Serial.println(
      "[ERROR] Sensor Failed!"
    );

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("Sensor Failed");

    lcd.setCursor(0, 1);
    lcd.print("Check RS485");

    delay(3000);

    return false;
  }
}

// ======================================================
// LCD PAGE 1
// ======================================================
void page1() {

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Moisture:");
  lcd.print(soilHumidity, 1);
  lcd.print("%");

  lcd.setCursor(0, 1);
  lcd.print("Temp:");
  lcd.print(soilTemperature, 1);
  lcd.print("C");

  lcd.setCursor(0, 2);
  lcd.print("pH:");
  lcd.print(soilPH, 1);

  lcd.setCursor(0, 3);

  if (WiFi.status() == WL_CONNECTED) {
    lcd.print("WiFi Connected");
  }
  else {
    lcd.print("WiFi Failed");
  }
}

// ======================================================
// LCD PAGE 2
// ======================================================
void page2() {

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Nitrogen:");
  lcd.print(nitrogen);

  lcd.setCursor(0, 1);
  lcd.print("Phosphor:");
  lcd.print(phosphorus);

  lcd.setCursor(0, 2);
  lcd.print("Kalium:");
  lcd.print(potassium);

  lcd.setCursor(0, 3);
  lcd.print(device_id);
}

// ======================================================
// SEND DATA
// ======================================================
void sendData() {

  // ================= WIFI CHECK =================
  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
      "[HTTP] WiFi disconnected!"
    );

    return;
  }

  HTTPClient http;

  http.begin(supabase_url);

  // ================= HEADERS =================
  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.addHeader(
    "apikey",
    supabase_anon_key
  );

  http.addHeader(
    "Authorization",
    String("Bearer ") + supabase_anon_key
  );

  http.addHeader(
    "Prefer",
    "return=representation"
  );

  // ================= JSON =================
  StaticJsonDocument<512> doc;

  doc["device_id"] = device_id;

  doc["system_type"] = system_type;

  doc["moisture"] = soilHumidity;

  doc["temperature"] = soilTemperature;

  doc["ph"] = soilPH;

  doc["conductivity"] =
    soilEC / 1000.0;

  doc["nitrogen"] = nitrogen;

  doc["phosphorus"] = phosphorus;

  doc["potassium"] = potassium;
;

  String requestBody;

  serializeJson(doc, requestBody);

  // ================= DEBUG =================
  Serial.println(
    "========== JSON =========="
  );

  Serial.println(requestBody);

  Serial.println(
    "=========================="
  );

  // ================= LCD =================
  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Sending Data");

  lcd.setCursor(0, 1);
  lcd.print("To Supabase");

  // ================= POST =================
  int httpCode =
    http.POST(requestBody);

  String response =
    http.getString();

  // ================= RESPONSE =================
  Serial.println(
    "========== RESPONSE =========="
  );

  Serial.println(response);

  Serial.println(
    "=============================="
  );

  Serial.print("HTTP Code: ");
  Serial.println(httpCode);

  // ================= SUCCESS =================
  if (
    httpCode == 200 ||
    httpCode == 201
  ) {

    Serial.println(
      "[SUCCESS] Data Sent!"
    );

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("Data Sent");

    lcd.setCursor(0, 1);
    lcd.print("Successfully");

    delay(2000);
  }

  // ================= FAILED =================
  else {

    Serial.println(
      "[ERROR] Failed Send!"
    );

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("Send Failed");

    lcd.setCursor(0, 1);
    lcd.print("HTTP:");

    lcd.print(httpCode);

    delay(3000);
  }

  http.end();
}

// ======================================================
// LOOP
// ======================================================
void loop() {

  unsigned long now = millis();

  if (now - lastReadTime >= interval) {

    lastReadTime = now;

    // ================= WIFI RECONNECT =================
    if (WiFi.status() != WL_CONNECTED) {
      setupWifi();
    }

    // ================= READ SENSOR =================
    bool sensorOk = readSensor();

    if (!sensorOk) {
      return;
    }

    // ================= PAGE 1 =================
    page1();
    delay(3000);

    // ================= PAGE 2 =================
    page2();
    delay(3000);

    // ================= SEND =================
    sendData();
  }
}