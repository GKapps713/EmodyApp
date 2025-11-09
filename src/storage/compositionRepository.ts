import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompositionRecord } from "./compositionTypes";

const KEY = "compositions_v1";

export async function loadCompositions(): Promise<CompositionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCompositions(list: CompositionRecord[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addComposition(rec: CompositionRecord) {
  const list = await loadCompositions();
  await saveCompositions([rec, ...list]); // 최신이 위로
}

export async function updateComposition(id: string, patch: Partial<CompositionRecord>) {
  const list = await loadCompositions();
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    await saveCompositions(list);
  }
}

export async function removeComposition(id: string) {
  const list = await loadCompositions();
  await saveCompositions(list.filter((x) => x.id !== id));
}

export async function clearCompositions() {
  await AsyncStorage.removeItem(KEY);
}
