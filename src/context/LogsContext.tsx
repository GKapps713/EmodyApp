// src/context/LogsContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

// 로그를 전역적으로 관리하는 Context
interface LogsContextType {
  logs: string[];
  addLog: (message: string) => void;
  clearLogs: () => void; // 로그 클리어 함수 추가
}

// LogsProvider의 props 타입 정의
interface LogsProviderProps {
  children: ReactNode;  // children 타입 정의
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

// LogsContext Provider
export const LogsProvider: React.FC<LogsProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // 로그를 클리어하는 함수
  const clearLogs = () => {
    setLogs([]); // 로그 상태를 빈 배열로 초기화
  };

  return (
    <LogsContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogsContext.Provider>
  );
};

// 로그를 추가할 수 있는 훅
export const useLogs = (): LogsContextType => {
  const context = useContext(LogsContext);
  if (!context) {
    throw new Error("useLogs must be used within a LogsProvider");
  }
  return context;
};
