#include <ESP32Servo.h>

// ================= 상태 정의 =================
enum FingerState { OPEN, CLOSE };

// ================= 손가락 구조체 =================
struct Finger {
  Servo servo;
  int pin;
  int closeTorque;
  int openTorque;
  unsigned long closeTime;
  unsigned long openTime;
  FingerState state;
  unsigned long startTime;
};

// ================= 핀 설정 (ESP32 GPIO) =================
// ESP32에서 PWM 가능한 핀: 2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33
Finger fingers[5] = {
  {Servo(), 18, 100, 85, 2000, 1500, OPEN, 0}, // 약지
  {Servo(), 19, 95,  85, 1200, 1000, OPEN, 0}, // 소지
  {Servo(), 21, 100, 85, 1500, 1300, OPEN, 0}, // 중지
  {Servo(), 22, 110, 85, 2000, 1500, OPEN, 0}, // 검지
  {Servo(), 23, 95,  85, 2000, 1300, OPEN, 0}  // 엄지
};

// ================= 초기화 =================
void setup() {
  Serial.begin(115200); // ESP32는 보통 115200 사용

  // ESP32Servo: 타이머 채널 할당 (서보 5개 → 채널 0~4)
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  for (int i = 0; i < 5; i++) {
    fingers[i].servo.setPeriodHertz(50);            // 서보 표준 50Hz
    fingers[i].servo.attach(fingers[i].pin, 500, 2400); // min/max 펄스폭(us)
    fingers[i].servo.write(90);                     // 정지
  }
}

// ================= 손가락 제어 함수 =================
void handleFinger(int idx, bool closeCmd) {
  if (closeCmd && fingers[idx].state == OPEN) {
    fingers[idx].state = CLOSE;
    fingers[idx].startTime = millis();
    fingers[idx].servo.write(fingers[idx].closeTorque);
  }
  if (!closeCmd && fingers[idx].state == CLOSE) {
    fingers[idx].state = OPEN;
    fingers[idx].startTime = millis();
    fingers[idx].servo.write(fingers[idx].openTorque);
  }
}

// ================= 메인 루프 =================
void loop() {
  // -------- 시리얼 명령 처리 --------
  if (Serial.available()) {
    char cmd = Serial.read();
    switch (cmd) {
      case 'R': handleFinger(0, true);  break; // 약지 접기
      case 'r': handleFinger(0, false); break;
      case 'P': handleFinger(1, true);  break; // 소지 접기
      case 'p': handleFinger(1, false); break;
      case 'M': handleFinger(2, true);  break; // 중지 접기
      case 'm': handleFinger(2, false); break;
      case 'I': handleFinger(3, true);  break; // 검지 접기
      case 'i': handleFinger(3, false); break;
      case 'T': handleFinger(4, true);  break; // 엄지 접기
      case 't': handleFinger(4, false); break;
    }
  }

  // -------- 시간 초과 시 자동 정지 --------
  for (int i = 0; i < 5; i++) {
    if (fingers[i].state == CLOSE &&
        millis() - fingers[i].startTime >= fingers[i].closeTime) {
      fingers[i].servo.write(90);
    }
    if (fingers[i].state == OPEN &&
        millis() - fingers[i].startTime >= fingers[i].openTime) {
      fingers[i].servo.write(90);
    }
  }
}
