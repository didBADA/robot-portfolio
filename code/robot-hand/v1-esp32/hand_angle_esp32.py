import cv2
import mediapipe as mp
import serial
import time
import numpy as np

# ================= 설정 =================
SERIAL_PORT = 'COM18'   # ESP32 포트로 변경
BAUD_RATE = 115200      # ESP32 기본 통신속도

SEND_INTERVAL = 0.03
CHANGE_THRESH = 3
SMOOTH_ALPHA = 0.35

STOP  = 90
CLOSE = 40
OPEN  = 140

FINGER_RANGE = [20, 160]
THUMB_RANGE  = [10, 90]

# ================= 시리얼 연결 =================
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)

# ================= MediaPipe =================
mp_hands = mp.solutions.hands
mp_draw  = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.6
)

# ================= 유틸 함수 =================
def calc_angle(a, b, c):
    v1 = np.array([b.x-a.x, b.y-a.y, b.z-a.z])
    v2 = np.array([c.x-b.x, c.y-b.y, c.z-b.z])
    cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    return np.degrees(np.arccos(np.clip(cos, -1, 1)))

def finger_servo(angle):
    servo = int(np.interp(angle, FINGER_RANGE, [OPEN, CLOSE]))
    return STOP if abs(servo - STOP) < 5 else servo

class Smoother:
    def __init__(self):
        self.state = [90] * 5

    def update(self, data):
        for i in range(5):
            self.state[i] = SMOOTH_ALPHA * data[i] + (1 - SMOOTH_ALPHA) * self.state[i]
        return [int(x) for x in self.state]

# ================= 메인 =================
smooth = Smoother()
cap    = cv2.VideoCapture(0)
prev   = [90] * 5
last   = 0

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res   = hands.process(rgb)

    if res.multi_hand_landmarks:
        for hand in res.multi_hand_landmarks:
            lm = hand.landmark

            # 각도 계산
            angles = [calc_angle(lm[2], lm[3], lm[4])]  # 엄지
            for a, b, c in [(5,6,8),(9,10,12),(13,14,16),(17,18,20)]:
                angles.append(calc_angle(lm[a], lm[b], lm[c]))

            # 서보값 변환 (순서: 엄지,검지,중지,약지,소지)
            servos = [int(np.interp(angles[0], THUMB_RANGE, [OPEN, CLOSE]))]
            for i in range(1, 5):
                servos.append(finger_servo(angles[i]))

            servos = smooth.update(servos)

            now = time.time()
            changed = any(abs(servos[i] - prev[i]) > CHANGE_THRESH for i in range(5))

            if changed and (now - last > SEND_INTERVAL):
                # ESP32로 전송: "S,엄지,검지,중지,약지,소지\n"
                cmd = "S," + ','.join(map(str, servos)) + "\n"
                ser.write(cmd.encode())
                print(f"[SEND] {cmd.strip()}")
                prev = servos[:]
                last = now

            mp_draw.draw_landmarks(frame, hand, mp_hands.HAND_CONNECTIONS)

    cv2.imshow("Hand Tracking", frame)
    if cv2.waitKey(1) == ord('q'):
        break

cap.release()
ser.close()
cv2.destroyAllWindows()
