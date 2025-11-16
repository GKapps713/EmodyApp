// src/features/compose/hooks/useVideoPicker.ts
import { Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRef } from "react";
import { useLogs } from "../../../context/LogsContext"; // LogsContext에서 addLog 가져오기

export function useVideoPicker() {
  const probeRef = useRef<Video>(null);
  const { addLog } = useLogs();  // LogsContext에서 addLog 함수 가져오기

  // 비디오 길이 계산 함수
  const probeDuration = async (uri: string) => {
    if (!probeRef.current) return null;
    await probeRef.current.loadAsync({ uri }, { shouldPlay: false }, false);
    const status: any = await probeRef.current.getStatusAsync();
    const secs = status?.durationMillis
      ? Math.round(status.durationMillis / 1000)
      : null;
    await probeRef.current.unloadAsync().catch(() => {});
    return secs;
  };

  // 비디오 선택 함수
  const pickVideo = async () => {
    addLog("Starting video pick process...");  // 비디오 선택 시작 로그 추가
    
    const doc = await DocumentPicker.getDocumentAsync({
      type: ["video/*"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    let localUri = doc.assets?.[0]?.uri;
    let pickerDuration: number | null = null;

    if (localUri) {
      addLog(`Video selected from DocumentPicker: ${localUri}`);
    } else {
      addLog("No video selected by DocumentPicker. Trying ImagePicker...");  // DocumentPicker에서 비디오 선택 실패 시 로그 추가
      const lib = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // 비디오만 선택하도록 설정
      });
      if (!lib.canceled && lib.assets.length) {
        localUri = lib.assets[0].uri;
        const d = lib.assets[0].duration;
        pickerDuration =
          typeof d === "number" && isFinite(d) ? Math.round(d) : null;
        addLog(`Video selected from ImagePicker: ${localUri}`);
      }
    }

    // 비디오 길이를 가져오지 못한 경우 probeDuration을 사용해 비디오 길이를 계산
    let durationSec = pickerDuration;
    if (localUri && !durationSec) {
      addLog("Video duration not found, calculating duration...");  // 비디오 길이를 계산하는 로그 추가
      durationSec = await probeDuration(localUri);
    }

    addLog(`Final video duration: ${durationSec} seconds`);  // 최종 비디오 길이 로그 추가
    addLog(`Final video URI: ${localUri}`);  // 최종 비디오 URI 로그 추가

    return { localUri: localUri ?? null, durationSec: durationSec ?? null, probeRef };
  };

  return { pickVideo, probeRef };
}
