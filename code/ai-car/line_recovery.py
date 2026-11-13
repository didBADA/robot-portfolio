# 과제: 5_3_7.py 기반 - 라인 이탈 감지 + 라인 복구
import mycamera
import cv2
import time
from gpiozero import DigitalOutputDevice
from gpiozero import PWMOutputDevice

# 모터 핀 번호 (9주차 3_5_4.py와 동일 확인)
PWMA = PWMOutputDevice(18)
AIN1 = DigitalOutputDevice(22)
AIN2 = DigitalOutputDevice(27)

PWMB = PWMOutputDevice(23)
BIN1 = DigitalOutputDevice(25)
BIN2 = DigitalOutputDevice(24)

# ===== 설정값 =====
SPEED = 0.5          # 평소 주행 속도
SEARCH_SPEED = 0.4   # 탐색할 때 회전 속도 (조금씩 회전)
HOLD_TIME = 0.25     # 이탈 후 직전 방향 유지 시간 (0.2~0.3초)
SEARCH_TIMEOUT = 3.0 # 이 시간(초) 동안 못 찾으면 정지 (무한 회전 방지)
MIN_AREA = 100       # 이보다 작은 윤곽선은 노이즈로 보고 무시 (0이면 무시 안 함)

def motor_go(speed):
    AIN1.value = 0
    AIN2.value = 1
    PWMA.value = speed
    BIN1.value = 0
    BIN2.value = 1
    PWMB.value = speed

def motor_left(speed):
    AIN1.value = 1
    AIN2.value = 0
    PWMA.value = 0.0
    BIN1.value = 0
    BIN2.value = 1
    PWMB.value = speed

def motor_right(speed):
    AIN1.value = 0
    AIN2.value = 1
    PWMA.value = speed
    BIN1.value = 1
    BIN2.value = 0
    PWMB.value = 0.0

def motor_stop():
    PWMA.value = 0.0
    PWMB.value = 0.0


# setting


def drive(direction, speed):

    if direction == "LEFT":
        motor_left(speed)

    elif direction == "RIGHT":
        motor_right(speed)

    else:
        motor_go(speed)

def main():
    camera = mycamera.MyPiCamera(320, 240)

    last_dir = "GO"
    last_turn = "LEFT"
    lost_start = None
    state = ""


    try:
        while( camera.isOpened() ):
            _, image = camera.read()
            image = cv2.flip(image, -1)
            cv2.imshow('normal', image)

            height, width, _ = image.shape
            crop_img = image[height //2 :, :]

            gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5,5), 0)
            ret, thresh1 = cv2.threshold(blur, 130, 255, cv2.THRESH_BINARY)
            mask = cv2.erode(thresh1, None, iterations=2)
            mask = cv2.dilate(mask, None, iterations=2)
            cv2.imshow('mask', mask)

            contours, hierarchy = cv2.findContours(mask.copy(), 1, cv2.CHAIN_APPROX_NONE)

            cx = None
            if len(contours) > 0:
                c = max(contours, key=cv2.contourArea)
                M = cv2.moments(c)

                if cv2.contourArea(c) >= MIN_AREA and M['m00'] != 0: # contour over white part-width is not None 120 Update cx
                    cx = int(M['m10']/M['m00']) #  Update cx

            if cx is not None: # cx is not None

                if lost_start is not None:
                    print("Line FOUND! -> 복귀")
                    lost_start = None # set

                if cx <= 130: # 160-30
                    last_dir = "LEFT"
                    last_turn = "LEFT"
                elif cx >= 190: # 160 +30
                    last_dir = "RIGHT"
                    last_turn = "RIGHT"
                else:
                    last_dir = "GO"

                drive(last_dir, SPEED)
                new_state = last_dir

            else: # not found contour

                if lost_start is None:

                    lost_start = time.time() # lost _start = now
                    print(last_dir)

                lost_time = time.time() - lost_start # check time

                if lost_time < HOLD_TIME: # time < 0.25

                    drive(last_dir, SPEED) # to last direction
                    print(last_dir)

                elif lost_time < SEARCH_TIMEOUT: # over 3 seconds

                    search_dir = last_dir if last_dir != "GO" else last_turn
                    drive(search_dir, SEARCH_SPEED)

                else:
                    motor_stop()

            if cv2.waitKey(1) == ord('q'):
                break

    finally:
        motor_stop()
        camera.release()
        cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
