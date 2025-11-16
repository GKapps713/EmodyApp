import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import {
  AccessibilityRole,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

/** ===========================
 * Types
 * =========================== */
export type ShareTargetKey =
  | "tiktok"
  | "youtube"
  | "instagram_reels"
  | "instagram_story"
  | "facebook_reels"
  | "x_twitter"
  | "snapchat"
  | "whatsapp_status"
  | "kakaotalk";

// 아이콘 사양: 벡터 or 이미지(로컬/원격)
type IconSpec =
  | {
      kind: "vector";
      lib: "FontAwesome" | "FontAwesome5" | "MaterialCommunityIcons";
      name: string;
    }
  | {
      kind: "image";
      source: ImageSourcePropType; // require(...) or { uri }
    };

export type ShareTarget = {
  key: ShareTargetKey;
  label: string;
  note?: string;
  icon: IconSpec;
  tint?: string; // 벡터 아이콘 색상
};

/** ===========================
 * (선택) 로컬 이미지가 있다면 아래처럼 사용
 *  - 예시: const ICON_TIKTOK = require("../../assets/icons/tiktok.png");
 *  - 예시: const ICON_KAKAO  = require("../../assets/icons/kakaotalk.png");
 *
 * 현재는 로컬 이미지가 없으므로 벡터 아이콘으로 대체합니다.
 * PNG/SVG를 구하면 각 항목의 icon을 { kind: "image", source: ICON_* } 로 바꾸세요.
 * =========================== */
// const ICON_TIKTOK = require("../../assets/icons/tiktok.png");
// const ICON_KAKAO  = require("../../assets/icons/kakaotalk.png");

/** ===========================
 * Data (브랜드별 추천 아이콘/색)
 * =========================== */
const TARGETS: ShareTarget[] = [
  // 벡터로 대체 (로고 파일 생기면 image로 변경)
  {
    key: "tiktok",
    label: "TikTok",
    note: "Draft/Direct Post 예정",
    icon: { kind: "vector", lib: "MaterialCommunityIcons", name: "music" },
    tint: "#ffffff",
    // 로고 파일 추가 시:
    // icon: { kind: "image", source: ICON_TIKTOK },
  },
  {
    key: "youtube",
    label: "YouTube",
    note: "Shorts 예정",
    icon: { kind: "vector", lib: "FontAwesome", name: "youtube-play" },
    tint: "#FF0000",
  },
  {
    key: "instagram_reels",
    label: "Instagram Reels",
    icon: { kind: "vector", lib: "FontAwesome", name: "instagram" },
    tint: "#E1306C",
  },
  {
    key: "instagram_story",
    label: "Instagram Story",
    icon: { kind: "vector", lib: "FontAwesome", name: "instagram" },
    tint: "#E1306C",
  },
  {
    key: "facebook_reels",
    label: "Facebook Reels",
    icon: { kind: "vector", lib: "FontAwesome", name: "facebook" },
    tint: "#1877F2",
  },
  {
    key: "x_twitter",
    label: "X (Twitter)",
    // X 공식 로고 폰트 아이콘은 없어서 임시로 트위터 새 아이콘 사용
    icon: { kind: "vector", lib: "MaterialCommunityIcons", name: "twitter" },
    tint: "#FFFFFF",
  },
  {
    key: "snapchat",
    label: "Snapchat",
    icon: { kind: "vector", lib: "FontAwesome5", name: "snapchat-ghost" },
    tint: "#FFFC00",
  },
  {
    key: "whatsapp_status",
    label: "WhatsApp Status",
    icon: { kind: "vector", lib: "FontAwesome", name: "whatsapp" },
    tint: "#25D366",
  },
  {
    key: "kakaotalk",
    label: "KakaoTalk",
    note: "한국",
    icon: { kind: "vector", lib: "MaterialCommunityIcons", name: "chat" },
    tint: "#FEE500",
    // 로고 파일 추가 시:
    // icon: { kind: "image", source: ICON_KAKAO },
  },
];

/** ===========================
 * Icon Renderer
 * =========================== */
function TargetIcon({ icon, tint }: { icon: IconSpec; tint?: string }) {
  const size = 22;
  if (icon.kind === "vector") {
    const color = tint ?? "#fff";
    switch (icon.lib) {
      case "FontAwesome":
        return (
          <FontAwesome name={icon.name as any} size={size} color={color} />
        );
      case "FontAwesome5":
        return (
          <FontAwesome5 name={icon.name as any} size={size} color={color} solid />
        );
      case "MaterialCommunityIcons":
        return (
          <MaterialCommunityIcons
            name={icon.name as any}
            size={size}
            color={color}
          />
        );
      default:
        return null;
    }
  }
  // 이미지 아이콘 (PNG/SVG 로고 사용 시)
  return (
    <Image
      source={icon.source}
      style={{ width: 22, height: 22, resizeMode: "contain" }}
    />
  );
}

/** ===========================
 * Component
 * =========================== */
export function SocialShareSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (target: ShareTarget) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* 배경 탭 닫기 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet} accessibilityRole={"menu" as AccessibilityRole}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Share to…</Text>

          <FlatList
            data={TARGETS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole={"menuitem" as AccessibilityRole}
                accessibilityLabel={`Share to ${item.label}`}
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.997 }] },
                ]}
              >
                <View style={styles.iconWrap}>
                  <TargetIcon icon={item.icon} tint={item.tint} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{item.label}</Text>
                  {item.note ? (
                    <Text style={styles.note}>{item.note}</Text>
                  ) : null}
                </View>
              </Pressable>
            )}
          />

          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** ===========================
 * Styles
 * =========================== */
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgba(17,24,39,0.98)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: 8,
  },
  title: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 8,
  },
  iconWrap: { width: 28, alignItems: "center" },
  label: { color: "#fff", fontSize: 16, fontWeight: "600" },
  note: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cancelTxt: { color: "#fff", fontWeight: "700" },
});

export default SocialShareSheet;
