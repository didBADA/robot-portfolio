#include <ESP32Servo.h>

Servo servo;

const int SERVO_PIN = 13;   // 🔥 13 말고 18로 변경

void setup() {
  Serial.begin(9600);

  servo.setPeriodHertz(50);          // 50Hz (서보 표준)
  servo.attach(SERVO_PIN, 500, 2400);

  Serial.println("CW");
  servo.write(120);   // 한 방향
  delay(3000);

  Serial.println("CCW");
  servo.write(60);    // 반대 방향
  delay(3000);

  Serial.println("STOP");
  servo.write(90);    // 정지
}

void loop() {}
