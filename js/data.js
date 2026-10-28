/* =====================================================================
   포트폴리오 데이터 — 사이트의 모든 내용은 이 파일 하나에서 나옵니다.
   아래 빈 배열 [ ] 안에 항목을 추가하면 화면에 바로 나타납니다.
   각 항목 아래에 주석으로 "예시"를 넣어 두었습니다.
   예시를 복사해 주석 밖으로 꺼내고 내용을 바꿔 쓰면 됩니다.
   항목과 항목 사이에는 쉼표(,)를 꼭 넣어 주세요.
   ===================================================================== */

window.PORTFOLIO = {
  /* ---------- 기본 정보 ---------- */
  profile: {
    name: "BADA", // 로고와 제목에 표시되는 이름
    initials: "BA", // 로고 네모 안의 글자 (2글자 권장)
    role: "로봇 엔지니어",
    github: "https://github.com/didBADA",
    email: "", // 공개할 이메일 (비우면 표시 안 함)
    resume: "", // 이력서 파일 경로, 예: "assets/resume.pdf" (비우면 '준비 중')
    goal: "", // 소개 페이지 맨 위 문장 — 로봇 엔지니어로서의 목표
    interests: [], // 예: ["비주얼 서보잉", "임베디드 로봇"]
  },

  /* ---------- 기술 ---------- */
  skills: {
    // 프로젝트에서 실제로 써 본 기술만 넣으세요
    using: [
      { group: "프로그래밍", items: ["Python", "Arduino (C/C++)"] },
      { group: "비전", items: ["OpenCV", "MediaPipe Hands"] },
      { group: "하드웨어", items: ["Arduino Uno", "ESP32", "연속회전 서보", "시리얼 통신"] },
      { group: "설계 · 제작", items: ["FreeCAD", "3D 프린팅"] },
      /* 예시
      { group: "프로그래밍", items: ["Python", "C++"] },
      { group: "하드웨어", items: ["ESP32", "서보모터"] },
      */
    ],
    // 공부 중인 기술
    learning: [
      /* 예시
      "ROS 2",
      */
    ],
  },

  /* ---------- 프로젝트 ----------
     status   : "active" 진행 중 | "prototype" 프로토타입 | "hardware" 하드웨어 완료
                | "experiment" 실험 중 | "done" 완료 | "draft" 자료 준비 중
     evidence : "sim" 시뮬레이션 결과 | "real" 실물 결과 | "none" 결과 미공개
     image    : 사진 경로 (예: "assets/img/arm.jpg"). 비우면 아래 illustration 그림이 표시됨
     illustration : "rail" 로봇팔 | "hand" 로봇손 | "humanoid" 휴머노이드 | "agents" AI 에이전트 | "line" 주행 로봇
     비워 둔 항목은 상세 페이지에 "자료 준비 중"으로 표시됩니다. */
  projects: [
    {
      id: "robot-hand",
      featured: true,
      title: "손동작을 따라 하는 로봇손",
      subtitle: "카메라로 손을 인식해 다섯 손가락을 각각 제어하는 텐던 구동 로봇손",
      summary:
        "웹캠으로 내 손가락이 접혔는지 펴졌는지 판정하고, 연속회전 서보 5개가 줄(텐던)을 감고 풀어 3D 프린팅 로봇손의 손가락을 하나씩 따라 움직입니다.",
      category: "비전 · 임베디드",
      tags: ["Python", "MediaPipe", "OpenCV", "Arduino Uno", "연속회전 서보", "FreeCAD", "3D 프린팅"],
      status: "prototype",
      evidence: "real",
      period: "2023.12 – 2026.04",
      illustration: "hand",
      image: "assets/img/robot-hand/v2-01.jpg",
      gallery: [
        { src: "assets/img/robot-hand/v2-01.jpg", caption: "최종 버전 정면 — 손가락 4개 + 엄지" },
        { src: "assets/img/robot-hand/v2-04.jpg", caption: "손바닥 쪽 서보 5개와 줄 감는 풀리" },
        { src: "assets/img/robot-hand/v2-02.jpg", caption: "옆에서 본 손가락 마디 구조" },
        { src: "assets/img/robot-hand/v2-08.jpg", caption: "배선과 브레드보드 연결" },
        { src: "assets/img/robot-hand/v1-01.jpg", caption: "1차 버전에서 쓴 ESP32 보드" },
        { src: "assets/img/robot-hand/overview.jpg", caption: "프로젝트 요약 인포그래픽" },
      ],
      goal:
        "카메라 하나만으로 사람 손의 다섯 손가락 상태를 읽고, 로봇손이 손가락 하나하나를 독립적으로 따라 움직이게 하는 것.",
      problem:
        "손가락 관절마다 모터를 달면 손이 커지고 무거워집니다. 그래서 손가락 하나를 줄 하나로 당겨 접는 텐던 구조를 택했습니다. 이때 각도 센서가 없는 연속회전 서보로 '줄을 얼마나 감았는지'를 정해야 하고, 카메라 영상에서 손가락이 접혔는지 안정적으로 판정해야 합니다.",
      hardware: [
        "Arduino Uno — 메인 제어 (USB 시리얼 9600bps)",
        "연속회전 서보모터 × 5 — 손가락마다 하나씩, 줄을 감고 풀어 구동",
        "손가락별 핀: 엄지 D6 · 검지 D10 · 중지 D9 · 약지 D7 · 소지 D8",
        "웹캠 — 사람 손 영상 입력",
        "3D 프린팅 손가락·손바닥·받침 케이스 — FreeCAD로 직접 설계 (손가락, 손바닥, 모터 마운트, 케이스, 조립 모델)",
        "텐던(줄) — 서보 풀리에서 손가락 끝까지 연결",
      ],
      software: [
        "PC (Python): OpenCV로 웹캠 영상 입력 → MediaPipe Hands로 손 랜드마크 21개 추출",
        "손가락별 curl ratio = (손목↔손가락 끝 거리) ÷ (손목↔손가락 뿌리 거리) 계산",
        "비율이 '접힘 기준' 이하이면 접힘, '펴짐 기준' 이상이면 펴짐 — 두 기준 사이에서는 상태를 바꾸지 않아 떨림 방지",
        "상태가 바뀔 때만 한 글자 명령 전송: 대문자 = 접기(T·I·M·R·P), 소문자 = 펴기(t·i·m·r·p)",
        "Arduino: 명령을 받으면 해당 서보를 감기/풀기 방향으로 돌리고, millis()로 정해진 시간이 지나면 정지(90) — delay 없이 5개 손가락을 동시에 처리",
      ],
      control:
        "개루프 시간 제어. 연속회전 서보는 현재 각도를 알 수 없으므로, 손가락마다 '감는 세기와 시간', '푸는 세기와 시간'을 따로 정해 두고 그 시간만큼만 돌린 뒤 멈춥니다. 최종 버전은 손가락마다 감기 값 100~160, 풀기 값 40~55, 동작 시간 1.0~2.5초로 개별 보정했습니다. 손가락은 접힘/펴짐 두 상태만 다룹니다.",
      process: [
        "MediaPipe로 손 인식과 손가락 각도 계산부터 시작",
        "ESP32 + 연속회전 서보로 회전 방향 테스트 (120 = 한 방향, 60 = 반대 방향, 90 = 정지)",
        "ESP32 버전: 손가락 관절 각도를 서보 값으로 연속 변환하고 스무딩해서 보내는 방식 시도",
        "키보드 입력으로 손가락 하나를 감기/풀기 하는 시리얼 테스트",
        "연속 각도 대신 접힘/펴짐 두 상태 + 한 글자 명령 방식으로 단순화",
        "Arduino Uno 최종 버전: 손가락별 서보 세기·시간과 판정 기준값을 따로 보정",
      ],
      lessons: [
        "PC가 보내는 형식과 보드가 받는 형식이 달라 손이 움직이지 않던 문제 → 한 글자 명령으로 통일 (개발 기록 참고)",
        "다섯 손가락에 같은 서보 값을 쓰던 방식 → 손가락마다 세기·시간·회전 방향을 따로 보정 (개발 기록 참고)",
        "접힘/펴짐 기준을 하나로 두지 않고 두 개로 나눠, 경계에서 명령이 계속 바뀌는 떨림을 막음",
      ],
      results: [
        "다섯 손가락 개별 제어 성공 — 내 손가락을 접고 펴면 로봇손의 같은 손가락이 따라 움직임",
        "MediaPipe 손 인식과 curl ratio 기반 접힘/펴짐 판정 구현",
        "Python ↔ Arduino 시리얼 통신 연동",
        "3D 프린팅 기구부 직접 설계 및 제작",
        "한계: 중간 각도 제어가 어려움 (연속회전 서보) · 위치 피드백이 없어 반복 동작 시 위치 오차 · 배터리·마찰이 바뀌면 시간값 재조정 필요 · 손을 정면으로 보일 때 판정 불안정",
        "다음 단계: 위치 피드백이 있는 서보나 엔코더로 바꿔 중간 각도까지 제어",
      ],
      code: [
        { label: "최종 · PC (Python)", path: "code/robot-hand/v2-arduino-uno/hand_control.py" },
        { label: "최종 · Arduino", path: "code/robot-hand/v2-arduino-uno/finger_servo.ino" },
        { label: "1차 · PC (Python)", path: "code/robot-hand/v1-esp32/hand_angle_esp32.py" },
        { label: "1차 · ESP32", path: "code/robot-hand/v1-esp32/finger_servo_esp32.ino" },
        { label: "1차 · 서보 방향 테스트", path: "code/robot-hand/v1-esp32/servo_direction_test.ino" },
      ],
      links: [{ label: "GitHub에서 코드 보기", url: "https://github.com/didBADA/robot-portfolio/tree/main/code/robot-hand" }],
    },
    {
      id: "humanoid",
      featured: true,
      title: "16관절 소형 휴머노이드",
      subtitle: "ESP32와 서보 16개로 직접 만든 이족 보행 휴머노이드 — 하드웨어 구성 단계",
      summary:
        "머리·양팔·허리·양다리에 서보 16개를 단 소형 휴머노이드를 직접 설계하고 조립했습니다. ESP32가 서보 드라이버(PCA9685)로 관절을 움직이고, IMU와 거리 센서를 달아 자세와 장애물을 읽을 수 있게 했습니다.",
      category: "임베디드 · 보행 로봇",
      tags: ["ESP32", "PCA9685", "MG90S", "MPU6050", "VL53L0X", "I2C", "Arduino"],
      status: "hardware",
      evidence: "real",
      period: "2026.07 – 진행 중",
      illustration: "humanoid",
      image: "assets/img/humanoid/front.jpg",
      gallery: [
        { src: "assets/img/humanoid/front.jpg", caption: "완성된 몸체 정면" },
        { src: "assets/img/humanoid/side.jpg", caption: "옆에서 본 관절과 서보 배선" },
        { src: "assets/img/humanoid/front-tof.jpg", caption: "가슴에 단 VL53L0X 거리 센서" },
        { src: "assets/img/humanoid/power.jpg", caption: "배터리와 강압 컨버터를 넣은 전원부" },
        { src: "assets/img/humanoid/servo-map.jpg", caption: "서보 16채널 배치 설계 메모" },
        { src: "assets/img/humanoid/rotation-sketch.jpg", caption: "관절별 회전 방향 정리 메모" },
      ],
      goal:
        "직접 만든 소형 휴머노이드가 스스로 균형을 잡으며 걷게 하는 것. 이번 단계의 목표는 그 바탕이 되는 몸체·전원·센서·서보 제어 하드웨어를 완성하는 것입니다.",
      problem:
        "서보 16개가 한 몸에 붙어 있어 관절마다 움직일 수 있는 범위가 다르고, 범위를 넘으면 부품끼리 부딪힙니다. 또 좌우 다리의 서보 방향이 거울처럼 대칭이 아니어서, 한쪽 값을 반대쪽에 그대로 쓸 수 없습니다. 서보 여러 개가 동시에 움직일 때 필요한 전류를 배터리 하나로 안정적으로 공급하는 것도 과제였습니다.",
      hardware: [
        "ESP32 — 메인 제어 보드",
        "PCA9685 16채널 서보 드라이버 (I2C 0x40) — 서보 16개를 한 보드로 구동",
        "MG90S 서보모터 × 16 — 목 1 · 오른팔 3 (1·2·3) · 왼팔 3 (4·5·6) · 허리/골반 3 (7·8·9) · 오른다리 3 (10·11·12) · 왼다리 3 (13·14·15)",
        "MPU6050 IMU (I2C 0x68) — 몸의 기울기 측정",
        "VL53L0X 거리 센서 (I2C 0x29, 3.3V 전용) — 앞쪽 장애물 거리 측정",
        "I2C 버스 하나(SDA GPIO21 · SCL GPIO22)에 센서 2개와 서보 드라이버를 함께 연결",
        "전원: 2S 리튬이온 배터리 → 전원 스위치 → 강압 컨버터(약 5V) → 서보·보드",
        "배선: 납땜 없이 레버 커넥터로 연결",
        "몸체: 포맥스판을 직접 잘라 만든 머리·몸통·팔·다리 프레임",
      ],
      software: [
        "ESP32 서보 테스트 펌웨어: 시리얼로 '채널,각도'(예: 0,90)를 받아 해당 서보만 움직임",
        "각도 0~180도를 PCA9685 펄스 150~500으로 변환 (직접 측정한 캘리브레이션 값)",
        "채널 번호와 각도 범위를 확인해 잘못된 입력은 거부",
      ],
      control:
        "아직 보행 제어 전 단계입니다. 지금은 서보를 채널별로 하나씩 움직여 가동 범위와 회전 방향을 확인했고, 이 값을 이후 보행 제어의 안전 범위로 씁니다. 예를 들어 허리 중앙(7번)의 중립은 90도가 아니라 100도이고, 오른다리 10번은 90~160도, 왼다리 15번은 70~180도만 쓸 수 있습니다.",
      process: [
        "관절 배치와 서보 16채널 번호를 종이에 먼저 설계",
        "포맥스판으로 머리·몸통·팔·다리 프레임을 만들고 서보 16개 장착",
        "ESP32 + PCA9685 연결, 서보 펄스 범위(150~500) 측정",
        "시리얼 명령으로 채널마다 가동 범위와 부딪히는 구간 확인",
        "다리 6채널의 회전 방향을 손그림으로 정리하고 하나씩 확인",
        "전원 스위치 배선, MPU6050·VL53L0X를 같은 I2C 버스에 연결",
      ],
      lessons: [
        "PCA9685는 전원 입력이 두 곳(서보용 V+ 단자, 로직용 VCC 핀)이라 둘 다 따로 연결해야 서보가 움직임",
        "VL53L0X는 3.3V 전용 — 5V에 연결하면 센서가 손상될 수 있어 전원 핀을 따로 확인",
        "전원 스위치를 컨버터 뒤에 두면 꺼 둔 동안에도 컨버터가 배터리를 소모 → 배터리와 컨버터 사이로 옮김",
        "좌우 다리 서보의 회전 방향이 대칭이 아니어서, 채널마다 '각도가 늘 때 어느 쪽으로 움직이는지' 표로 따로 정리",
      ],
      results: [
        "서보 16개를 단 몸체 조립 완료, 16채널 모두 개별 구동 확인",
        "채널별 가동 범위와 중립 각도 측정 완료 (부딪히는 구간 기록)",
        "IMU·거리 센서·서보 드라이버를 하나의 I2C 버스로 연결 완료",
        "다음 단계: MuJoCo 시뮬레이션에서 강화학습으로 보행을 먼저 학습한 뒤 실물에 옮기고, 블루투스로 PC와 ESP32를 연결",
      ],
      code: [{ label: "서보 채널 테스트 (ESP32)", path: "code/humanoid/servo_test.ino" }],
      links: [{ label: "GitHub에서 코드 보기", url: "https://github.com/didBADA/robot-portfolio/tree/main/code/humanoid" }],
    },
    /* 예시
    {
      id: "my-robot-arm",                 // 영문·숫자·하이픈만, 다른 항목과 겹치면 안 됨
      featured: true,                     // true면 홈 화면에 노출
      title: "프로젝트 이름",
      subtitle: "부제목 (선택)",
      summary: "카드에 보일 한두 문장 설명",
      category: "비전 · 제어",            // 프로젝트 목록 필터에 쓰임
      tags: ["Python", "ESP32"],
      status: "active",
      evidence: "none",
      period: "2026.01 – 진행 중",
      illustration: "rail",
      image: "",
      goal: "프로젝트 목표",
      problem: "해결하려는 문제",
      hardware: ["부품 1", "부품 2"],
      software: ["구성 1", "구성 2"],
      control: "제어 알고리즘 설명",
      process: ["1단계", "2단계"],
      lessons: ["시행착오와 개선 1"],
      results: ["실험 결과 1"],
      code: [{ label: "제어 코드", path: "code/my-robot-arm/main.py" }], // 페이지 안에서 바로 보여 줄 코드 파일
      links: [{ label: "GitHub", url: "https://github.com/..." }, { label: "영상", url: "https://youtube.com/..." }],
    },
    */
  ],

  /* ---------- 연구 ---------- */
  research: [
    /* 예시
    {
      id: "my-research",
      title: "연구 주제",
      subtitle: "부제목 (선택)",
      status: "진행 중",
      background: "연구 배경과 문제 정의",
      approach: ["적용 기술 1", "적용 기술 2"],
      environment: ["실험 환경 1"],
      results: ["검증된 결과 1"],
      limits: ["한계 1"],
      next: ["향후 개선 방향 1"],
    },
    */
  ],

  /* ---------- 개발 기록 (문제 → 원인 → 시도 → 실패 → 개선 → 배운 점) ---------- */
  logs: [
    {
      id: "robot-hand-protocol-mismatch",
      date: "로봇손 1차",
      title: "PC도 보드도 정상인데 로봇손이 안 움직이던 이유",
      tags: ["로봇손", "시리얼 통신"],
      problem: "PC 프로그램은 손 인식 결과를 보내고, ESP32 펌웨어도 오류 없이 돌아가는데 로봇손이 반응하지 않았습니다.",
      cause:
        "PC 쪽(ESP32.py)은 \"S,엄지,검지,중지,약지,소지\\n\"처럼 다섯 손가락의 서보 값을 한 줄에 묶어 보냈고, 보드 쪽은 R/r, P/p 같은 한 글자 명령만 알아듣도록 짜여 있었습니다. 보드는 모르는 글자를 그냥 무시했습니다.",
      tried: "서보 회전 방향 테스트와 키보드 입력 시리얼 테스트로 하드웨어와 통신 자체를 따로 확인했습니다.",
      observed: "서보와 통신은 각각 정상이었고, 문제는 양쪽이 약속한 메시지 형식이 달랐다는 것이었습니다.",
      improved: "연속 각도를 보내는 방식을 접고, 접힘/펴짐 상태가 바뀔 때만 한 글자를 보내는 방식으로 PC와 보드를 통일했습니다. 최종 Arduino Uno 버전도 이 방식을 씁니다.",
      learned: "통신 형식은 양쪽 코드보다 먼저 한 곳에 정해 둔다. 보드는 모르는 명령을 조용히 버리지 말고 알려 주게 만든다.",
    },
    {
      id: "robot-hand-servo-calibration",
      date: "로봇손 최종",
      title: "다섯 손가락에 같은 서보 값을 쓸 수 없었던 이유",
      tags: ["로봇손", "연속회전 서보"],
      problem: "연속회전 서보는 각도를 모르기 때문에, 줄을 감는 양을 '얼마나 세게, 몇 초 동안 돌리는지'로만 정할 수 있습니다.",
      cause: "손가락마다 길이, 줄이 지나가는 경로, 마찰이 다르고, 서보를 다는 방향에 따라 회전 방향도 반대가 됩니다.",
      tried: "처음에는 다섯 손가락 모두 같은 값(감기 130, 풀기 60, 2~2.5초)을 썼습니다.",
      observed: "손가락마다 구조와 회전 방향이 달라 같은 값으로는 다섯 손가락의 동작을 맞출 수 없었습니다.",
      improved: "손가락마다 감기 값(100~160), 풀기 값(40~55), 감는 시간·푸는 시간(1.0~2.5초)을 따로 정했습니다. 카메라 쪽 접힘 판정 기준도 손가락별로 다시 맞췄습니다.",
      learned: "개루프 제어는 손가락마다 보정이 필요하고, 배터리나 마찰이 바뀌면 다시 맞춰야 한다. 다음 버전에서는 위치 피드백을 넣는다.",
    },
    /* 예시
    {
      id: "my-log",
      date: "2026-10",
      title: "기록 제목",
      tags: ["하드웨어"],
      problem: "문제 상황",
      cause: "원인 분석",
      tried: "시도한 해결 방법",
      observed: "실패와 관찰 결과",
      improved: "개선 과정",
      learned: "최종 결과 및 배운 점",
    },
    */
  ],
};
