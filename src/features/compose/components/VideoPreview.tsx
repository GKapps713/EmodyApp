// src/features/compose/components/VideoPreview.tsx
import { ResizeMode, Video } from "expo-av"; // Video와 ResizeMode를 함께 가져오기
import React, { forwardRef } from "react";
import { View } from "react-native";

type Props = {
  uri?: string | null;
  height?: number;
};

// forwardRef로 감싸서 ref를 전달할 수 있도록 수정
const VideoPreview = forwardRef<Video, Props>(({ uri, height = 180 }: Props, ref) => {
  if (!uri) return null;
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* Video 컴포넌트를 JSX로 사용 */}
      <Video
        ref={ref}  // ref 전달
        key={uri}
        source={{ uri }}
        style={{
          width: "100%",
          height,
          backgroundColor: "black",
          borderRadius: 10,
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN} // Video.ResizeMode 대신 ResizeMode 사용
      />
    </View>
  );
});

export default VideoPreview;
