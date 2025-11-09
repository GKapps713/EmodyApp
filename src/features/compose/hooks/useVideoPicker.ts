// src/features/compose/hooks/useVideoPicker.ts
import { Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRef } from "react";

export function useVideoPicker() {
  const probeRef = useRef<Video>(null);

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

  const pickVideo = async () => {
    const doc = await DocumentPicker.getDocumentAsync({
      type: ["video/*"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    let localUri = doc.assets?.[0]?.uri;
    let pickerDuration: number | null = null;

    if (!localUri) {
      const lib = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "videos" as any, // expo-image-picker는 소문자 "videos"
      });
      if (!lib.canceled && lib.assets.length) {
        localUri = lib.assets[0].uri;
        const d = lib.assets[0].duration;
        pickerDuration =
          typeof d === "number" && isFinite(d) ? Math.round(d) : null;
      }
    }

    let durationSec = pickerDuration;
    if (localUri && !durationSec) durationSec = await probeDuration(localUri);

    return { localUri: localUri ?? null, durationSec: durationSec ?? null, probeRef };
  };

  return { pickVideo, probeRef };
}
