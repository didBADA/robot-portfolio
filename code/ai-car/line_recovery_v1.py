import mycamera
import cv2
import time
from gpiozero import DigitalOutputDevice
from gpiozero import PWMOutputDevice

PWMA = PWMOutputDevice(18)
AIN1 = DigitalOutputDevice(22)
AIN2 = DigitalOutputDevice(27)

PWMB = PWMOutputDevice(23)
BIN1 = DigitalOutputDevice(25)
BIN2 = DigitalOutputDevice(24)

SPEED = 0.3          
HOLD_TIME = 0.25    
MIN_AREA = 120      
count=0
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

def motor_back(speed):
    AIN1.value = 1
    AIN2.value = 0
    PWMA.value = speed
    BIN1.value = 1
    BIN2.value = 0
    PWMB.value = speed

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
    lost_start = None     
    
    
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
                    print("Line")
                    lost_start = None # set

                if cx <= 130: # 160-30
                    last_dir = "LEFT"
                elif cx >= 190: # 160 +30
                    last_dir = "RIGHT"
                else:
                    last_dir = "GO"
                    
                drive(last_dir, SPEED)

            else: # not found contour
              
                if lost_start is None:
                    print("Lost Lost")
                    print(last_dir)
                    lost_start = time.time() # lost _start = now

                lost_time = time.time() - lost_start # check time

                if lost_time < HOLD_TIME: # time < 0.25
                    print(last_dir)
                    drive(last_dir, SPEED) # to last direction
                    
                elif lost_time >2.0: # emergency mode
                    print("emergency")
                    global count
                    motor_stop() # stop
                    count=+1 # cnt up
                    print(count)
                    if(count>=1):
                        motor_back(0.1)
                        

            if cv2.waitKey(1) == ord('q'):
                break

    finally:
        motor_stop()
        cv2.destroyAllWindows()

if __name__ == '__main__':
    main()

