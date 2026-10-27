/* AI 에이전트 연결 설정.
   endpoint 가 비어 있으면 "데모 모드"로 동작합니다:
   실제 AI 없이 data.js 에 등록된 자료만 검색해 보여 줍니다.

   Vercel에 배포하고 ANTHROPIC_API_KEY 를 설정했다면 아래처럼 바꾸세요.
     endpoint: "/api/chat"
   (API 키는 절대 이 파일에 넣지 마세요. 이 파일은 방문자에게 그대로 보입니다.) */
window.AGENT_CONFIG = {
  endpoint: "",
};
