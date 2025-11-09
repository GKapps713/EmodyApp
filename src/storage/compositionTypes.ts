export type CompositionAnalysis = {
  emotion: string;
  comfort?: string;
  quote?: string;
  searchQueries?: string[];
  // 추후 확장 필드 자유롭게 추가
  [k: string]: any;
};

export type CompositionTrack = {
  trackId: string;
  title: string;
  url: string;          // 서버 공개 URL
  duration: number;     // seconds
  promptText: string;   // 사용한 프롬프트 원문
  localAudioPath?: string; // 다운로드 시 로컬 경로 (선택)
};

export type CompositionRecord = {
  id: string;              // 기록 ID
  createdAt: string;       // ISO
  seconds: number;         // 요청 seconds
  steps: number;           // 요청 steps
  videoId?: string | null;
  videoUrl?: string | null;
  mergedUrl?: string | null;

  analysis: CompositionAnalysis; // 프롬프트에 사용한 분석 데이터
  track: CompositionTrack;       // 생성된 음악
};