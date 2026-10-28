#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define SERVO_MIN 150
#define SERVO_MAX 500

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  pwm.begin();
  pwm.setPWMFreq(50);
  delay(1000);
  Serial.println("입력 형식: 채널,각도  (예: 0,90)");
}

void loop() {
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    int commaIndex = input.indexOf(',');
    if (commaIndex > 0) {
      int channel = input.substring(0, commaIndex).toInt();
      int angle = input.substring(commaIndex + 1).toInt();

      if (channel >= 0 && channel <= 15 && angle >= 0 && angle <= 180) {
        int pulse = map(angle, 0, 180, SERVO_MIN, SERVO_MAX);
        pwm.setPWM(channel, 0, pulse);

        Serial.print("채널 ");
        Serial.print(channel);
        Serial.print(" -> ");
        Serial.print(angle);
        Serial.println("도 이동");
      } else {
        Serial.println("범위 오류: 채널 0~15, 각도 0~180");
      }
    } else {
      Serial.println("형식 오류. 예: 0,90");
    }
  }
}