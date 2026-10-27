import cv2
import mediapipe as mp
import serial
import time
import math

# ===== Serial =====
arduino = serial.Serial('COM21', 9600, timeout=1)
time.sleep(2)

# ===== MediaPipe =====
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

# 손가락 상태 저장
prev_state = {
    "thumb": None,
    "index": None,
    "middle": None,
    "ring": None,
    "pinky": None
}

# ===== 거리 함수 =====
def dist(a, b):
    return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

# ===== curl ratio =====
def curl_ratio(hand, tip, base):
    wrist = hand.landmark[0]
    return dist(hand.landmark[tip], wrist) / dist(hand.landmark[base], wrist)

# ===== 손가락 정보 =====
fingers = {
    "thumb":  {"tip": 4,  "base": 2,  "C": "T", "O": "t", "close": 1.4, "open": 1.5},
    "index":  {"tip": 8,  "base": 5,  "C": "I", "O": "i", "close": 1.0, "open": 1.7},
    "middle": {"tip": 12, "base": 9,  "C": "M", "O": "m", "close": 1.0, "open": 1.6},
    "ring":   {"tip": 16, "base": 13, "C": "R", "O": "r", "close": 0.9, "open": 1.7},
    "pinky":  {"tip": 20, "base": 17, "C": "P", "O": "p", "close": 0.9, "open": 1.55},
}

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        hand = result.multi_hand_landmarks[0]

        y = 40
        for name, f in fingers.items():
            ratio = curl_ratio(hand, f["tip"], f["base"])

            # 화면 출력
            cv2.putText(frame, f"{name}: {ratio:.2f}",
                        (20, y), cv2.FONT_HERSHEY_SIMPLEX,
                        0.6, (0, 255, 0), 2)
            y += 30

            state = None
            if ratio <= f["close"]:
                state = "C"
            elif ratio >= f["open"]:
                state = "O"

            # 상태 변경 시만 전송
            if state and prev_state[name] != state:
                arduino.write((f[state]).encode())
                prev_state[name] = state

        mp_draw.draw_landmarks(frame, hand, mp_hands.HAND_CONNECTIONS)

    cv2.imshow("Finger Individual Control", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break


cap.release()
cv2.destroyAllWindows()
arduino.close()
