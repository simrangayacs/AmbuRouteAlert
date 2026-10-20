#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===== CHANGE THESE FOR YOUR LAB/HACKATHON =====
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_HOST = "192.168.1.10"; // laptop IP, NOT localhost
const int MQTT_PORT = 1883;
const char* SPEAKER_ID = "speaker-001";
// ==============================================

const int BUZZER_PIN = 25;
const int LED_PIN = 2;
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String commandTopic = String("amburoute/speaker/") + SPEAKER_ID + "/command";
String statusTopic = String("amburoute/speaker/") + SPEAKER_ID + "/status";
bool alertActive = false;
unsigned long alertExpiresAt = 0;
unsigned long lastBlink = 0;
bool outputState = false;

void publishStatus(const char* state) {
  StaticJsonDocument<256> doc;
  doc["speakerId"] = SPEAKER_ID;
  doc["state"] = state;
  doc["millis"] = millis();
  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(statusTopic.c_str(), buffer, true);
}

void stopAlert() {
  alertActive = false;
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  outputState = false;
  publishStatus("STOPPED");
}

void startAlert(unsigned long ttlMs) {
  alertActive = true;
  alertExpiresAt = millis() + ttlMs;
  publishStatus("PLAYING");
}

void onMessage(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  Serial.print("[MQTT] "); Serial.println(message);

  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err) {
    publishStatus("INVALID_COMMAND");
    return;
  }

  const char* command = doc["command"] | "";
  unsigned long ttlMs = doc["ttlMs"] | 30000;

  if (strcmp(command, "PLAY_EMERGENCY_ALERT") == 0) {
    startAlert(ttlMs);
  } else if (strcmp(command, "STOP_EMERGENCY_ALERT") == 0) {
    stopAlert();
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP32 IP: "); Serial.println(WiFi.localIP());
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting MQTT...");
    String clientId = String("AmbuRoute-") + SPEAKER_ID + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
      mqttClient.subscribe(commandTopic.c_str(), 1);
      publishStatus("ONLINE");
    } else {
      Serial.print("failed rc="); Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  connectWiFi();
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMqtt();
  mqttClient.loop();

  // pulsed alert instead of constant noise
  if (alertActive) {
    if ((long)(millis() - alertExpiresAt) >= 0) {
      stopAlert(); // local fail-safe TTL
    } else if (millis() - lastBlink >= 350) {
      lastBlink = millis();
      outputState = !outputState;
      digitalWrite(LED_PIN, outputState ? HIGH : LOW);
      digitalWrite(BUZZER_PIN, outputState ? HIGH : LOW);
    }
  }
}
