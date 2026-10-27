#include <Servo.h>

// ================= 상태 정의 =================
enum FingerState { OPEN, CLOSE };

// ================= 손가락 구조체 =================
struct Finger {
  Servo servo;
  int pin;

  int closeTorque;      // 감을 때 서보 값 (90보다 크면 정방향, 작으면 역방향)
  int openTorque;       // 풀 때 서보 값
  
  unsigned long closeTime;    // 감는 시간(ms)
  unsigned long openTime;     // 푸는 시간(ms)

  FingerState state;          // 현재 상태
  unsigned long startTime;    // 동작 시작 시간
};

// ================= 우노 핀 번호 반영 (D6, D10, D9, D8, D7) =================
// 순서: 약지(0), 소지(1), 중지(2), 검지(3), 엄지(4)
Finger fingers[5] = {
  {Servo(), 7,  150, 45, 2000, 1500, OPEN, 0}, // 약지 (D7)
  {Servo(), 8,  100, 45, 1000, 1700, OPEN, 0}, // 소지 (D8)
  {Servo(), 9,  150, 40, 1500, 1500, OPEN, 0}, // 중지 (D9) 반시계 방향
  {Servo(), 10, 160, 40, 2000, 2000, OPEN, 0}, // 검지 (D10) 반시계 방향
  {Servo(), 6,  115, 55, 2500, 1500, OPEN, 0}  // 엄지 (D6) 반시계 방향
};

// ================= 초기화 =================
void setup() {
  Serial.begin(9600);

  for (int i = 0; i < 5; i++) {
    fingers[i].servo.attach(fingers[i].pin);
    fingers[i].servo.write(90); // 정지 (연속 회전 서보의 정지점)
  }
}

// ================= 손가락 제어 함수 =================
void handleFinger(int idx, bool closeCmd) {
  // 감기 명령 (OPEN 상태일 때만 동작)
  if (closeCmd && fingers[idx].state == OPEN) {
    fingers[idx].state = CLOSE;
    fingers[idx].startTime = millis();
    fingers[idx].servo.write(fingers[idx].closeTorque);
  }

  // 풀기 명령 (CLOSE 상태일 때만 동작)
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
      case 'R': handleFinger(0, true);  break;  // 약지 접기
      case 'r': handleFinger(0, false); break;

      case 'P': handleFinger(1, true);  break;  // 소지 접기
      case 'p': handleFinger(1, false); break;

      case 'M': handleFinger(2, true);  break;  // 중지 접기
      case 'm': handleFinger(2, false); break;

      case 'I': handleFinger(3, true);  break;  // 검지 접기
      case 'i': handleFinger(3, false); break;

      case 'T': handleFinger(4, true);  break;  // 엄지 접기
      case 't': handleFinger(4, false); break;
    }
  }

  // -------- 시간 초과 시 자동 정지 (비폐쇄형 제어) --------
  for (int i = 0; i < 5; i++) {
    // 접는 동작 중 설정된 시간이 지나면 정지
    if (fingers[i].state == CLOSE && 
        millis() - fingers[i].startTime >= fingers[i].closeTime) {
      fingers[i].servo.write(90); 
    }

    // 펴는 동작 중 설정된 시간이 지나면 정지
    if (fingers[i].state == OPEN && 
        millis() - fingers[i].startTime >= fingers[i].openTime) {
      fingers[i].servo.write(90);
    }
  }
}
