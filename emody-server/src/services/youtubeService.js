// emody-server/src/services/openaiService.js

export async function searchYouTubeMusic(query, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}+music&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  console.log("▶ YouTube API response:", data); // 🔍 디버깅용 출력

  if (!data.items) {
    throw new Error(JSON.stringify(data)); // 에러 메시지 확인
  }

  return data.items.map((item) => ({
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    videoId: item.id.videoId,
  }));
}
