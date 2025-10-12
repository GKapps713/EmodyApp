import AsyncStorage from "@react-native-async-storage/async-storage";
import { Echo } from "./echoTypes";

const ECHOES_KEY = "MY_ECHOES";

/**
 * 새로운 Echo 저장
 */
export async function saveEcho(echo: Echo) {
  try {
    const existing = await AsyncStorage.getItem(ECHOES_KEY);
    const echoes: Echo[] = existing ? JSON.parse(existing) : [];
    echoes.push(echo);
    await AsyncStorage.setItem(ECHOES_KEY, JSON.stringify(echoes));
  } catch (e) {
    console.error("❌ saveEcho error:", e);
  }
}

/**
 * Echo 목록 불러오기
 */
export async function loadEchoes(): Promise<Echo[]> {
  try {
    const existing = await AsyncStorage.getItem(ECHOES_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error("❌ loadEchoes error:", e);
    return [];
  }
}

/**
 * 특정 Echo 삭제
 */
export async function deleteEcho(id: string) {
  try {
    const existing = await AsyncStorage.getItem(ECHOES_KEY);
    const echoes: Echo[] = existing ? JSON.parse(existing) : [];
    const updated = echoes.filter((e) => e.id !== id);
    await AsyncStorage.setItem(ECHOES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("❌ deleteEcho error:", e);
  }
}

/**
 * 특정 Echo 업데이트 (예: playCount++, echoScore 업데이트 등)
 */
export async function updateEcho(updatedEcho: Echo) {
  try {
    const existing = await AsyncStorage.getItem(ECHOES_KEY);
    const echoes: Echo[] = existing ? JSON.parse(existing) : [];
    const updated = echoes.map((e) => (e.id === updatedEcho.id ? updatedEcho : e));
    await AsyncStorage.setItem(ECHOES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("❌ updateEcho error:", e);
  }
}

/**
 * 전체 Echo 덮어쓰기 (예: 서버 동기화)
 */
export async function setEchoes(echoes: Echo[]) {
  try {
    await AsyncStorage.setItem(ECHOES_KEY, JSON.stringify(echoes));
  } catch (e) {
    console.error("❌ setEchoes error:", e);
  }
}
