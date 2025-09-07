import { createContext, useContext, useState } from "react";

// 감정 분석 결과 타입 정의
type ResultData = {
  emotion?: string;
  comfort?: string;
  quote?: string;
  youtubeResults?: { title: string; artist: string; videoId: string }[];
  aiMusic?: { title: string; url: string };
};

// Context 타입 정의
type ResultContextType = {
  result: ResultData;
  setResult: (r: ResultData) => void;
};

// Context 생성 (기본값은 빈 객체)
const ResultContext = createContext<ResultContextType>({
  result: {},
  setResult: () => {},
});

// Provider 컴포넌트
export function ResultProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<ResultData>({});
  return (
    <ResultContext.Provider value={{ result, setResult }}>
      {children}
    </ResultContext.Provider>
  );
}

// Context 사용을 위한 커스텀 훅
export function useResult() {
  return useContext(ResultContext);
}
