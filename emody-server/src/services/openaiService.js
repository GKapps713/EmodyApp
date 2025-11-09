// emody-server/src/services/openaiService.js

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

// ✅ OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// 🔐 키 로드 확인 (앞 10자리만 로그)
console.log("✅ OPENAI_API_KEY:", process.env.OPENAI_API_KEY?.slice(0, 10));

// 📌 기본 시스템 프롬프트 (한국어)
const baseSystemPromptKo = `당신은 감정 분석 전문가이자 음악 치료사입니다. 
사용자의 텍스트(혹은 감정 단어)를 분석하여 다음 9가지 감정 중 하나로 분류하고, 
위로의 말(comfortMessage), 위인의 명언(inspirationalQuote), 음악 추천(musicRecommendation),
감정 종류: sadness, joy, anxiety, anger, tired, emptiness, touched, confident, shy`;

// 📌 언어별 프롬프트
const emotionPrompts = {
  ko: {
    system: () => `
${baseSystemPromptKo}

반드시 아래 JSON 구조를 지켜주세요:

{
  "emotionType": "sadness | joy | anxiety | anger | tired | emptiness | touched | confident | shy",
  "comfortMessage": "string",
  "inspirationalQuote": "string",
  "musicRecommendation": {
    "searchQueries": ["string", "string", "string", "string", "string"],
    "genre": "string",
    "mood": "string"
  }
}
`,
    user: (text) =>
      `다음 텍스트(혹은 감정)를 분석하고 JSON으로 작성해주세요: "${text}"`,
  },

  en: {
    system: (useAiMusic = false) => `
You are an emotion analysis expert and music therapist.
Analyze the user's input and classify it into one of 9 emotions.
Return a JSON object with the following structure:

{
  "emotionType": "sadness | joy | anxiety | anger | tired | emptiness | touched | confident | shy",
  "comfortMessage": "string",
  "inspirationalQuote": "string",
  "musicRecommendation": {
    "searchQueries": ["string", "string", "string", "string", "string"],
    "genre": "string",
    "mood": "string"
  }
}
`,
    user: (text) =>
      `Please analyze the following input (text or emotion) and return JSON: "${text}"`,
  },
};

// 📌 감정 분석
export async function analyzeEmotion({ text, language = "ko" }) {
  try {
    const prompts = emotionPrompts[language] || emotionPrompts["en"];
    const systemPrompt = prompts.system();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompts.user(text) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      emotionType: result.emotionType,
      comfortMessage: result.comfortMessage,
      inspirationalQuote: result.inspirationalQuote,
      musicRecommendation: result.musicRecommendation,
    };
  } catch (error) {
    console.error("❌ OpenAI analyzeEmotion error:", error);
    throw new Error("Failed to analyze emotion: " + (error.message || error));
  }
}

// 📌 상담형 채팅
export async function chatWithGpt(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "";
  } catch (error) {
    console.error("❌ OpenAI chatWithGpt error:", error);
    throw new Error("Failed to chat with GPT: " + (error.message || error));
  }
}

// export async function generateStableAudioPrompt({ emotion, mood, instruments, style }) {
//   try {
//     const instrumentText = instruments?.length ? instruments.join(", ") : "various instruments";

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: "You are an expert at writing rich, vivid, and concise prompts for AI music generation (Stable Audio). Always focus on atmosphere, instrumentation, and style.",
//         },
//         {
//           role: "user",
//           content: `
// Generate a Stable Audio music prompt based on these details:
// - Emotion: ${emotion}
// - Mood: ${mood}
// - Instruments: ${instrumentText}
// - Style: ${style}

// Write a vivid and descriptive prompt (1–2 sentences max) that clearly conveys:
// - The overall atmosphere and emotion
// - The instrumentation and how they should sound
// - The style or genre of the piece

// Avoid generic phrases, be specific and creative, but do not exceed two sentences.`,
//         },
//       ],
//     });

//     return response.choices[0].message.content?.trim() || "";
//   } catch (err) {
//     console.error("❌ generateStableAudioPrompt error:", err);
//     throw err;
//   }
// }

export async function analyzeVideoWithThumbnails({ thumbnails, durationSec, options }) {
  try {
    // 시스템 메시지 설정
    const sysPrompt = `
    당신은 영상편집/음악 큐레이션 전문가입니다.
    아래와 같은 정보를 기반으로 영상의 분위기, 감정, 추천 장르, 스타일을 분석해주세요.
    - [썸네일 이미지 URL 리스트]
    - [영상 전체 길이(초)]
    반환 형태는 다음과 같은 JSON object로 해주세요:
    {
      "emotion": "기쁨 | 슬픔 | 평온 | ...",
      "genre": "ambient | pop | ...",
      "style": "neoclassical | lo-fi | ...",
      "mood": "따뜻함 | 몽환적 | 어둡고 진지한 | ...",
      "description": "영상에서 느껴지는 전체적 분위기와 해설"
    }
    `;
    
    const thumbnailsListMd = thumbnails.map((url, i) => `썸네일 #${i + 1}: ${url}`).join('\n');
    const userMsg = `
    아래 영상을 분석해주세요. 
    (썸네일: ${thumbnails.length}개, 전체 길이: ${durationSec}초)
    ${thumbnailsListMd}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userMsg },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;

  } catch (error) {
    console.error("Error analyzing video thumbnails:", error);
    throw new Error("Failed to analyze video thumbnails");
  }
}

export async function generateMusicPrompt(emotion, genre, style, mood, description) {
  try {
    // instruments를 기본값으로 설정 (이 값은 필요에 따라 변경 가능)
    const instruments = ["piano", "strings"];
    
    // 기본적으로 genre와 mood가 제공되지 않으면 빈 문자열로 처리
    const genreText = genre || "ambient";
    const moodText = mood || "dreamy";
    const descriptionText = description || "A tranquil and peaceful video with scenic views.";

    // 프롬프트 생성
    const prompt = `
    Generate a Stable Audio music prompt based on these details:
    - Emotion: ${emotion}
    - Genre: ${genreText}
    - Mood: ${moodText}
    - Style: ${style || "neoclassical"}
    - Description: ${descriptionText}
    - Instruments: ${instruments.join(", ")}

Write a vivid and descriptive prompt (1–2 sentences max) that clearly conveys:
- The overall atmosphere and emotion
- The instrumentation and how they should sound
- The style or genre of the piece

Avoid generic phrases, be specific and creative, but do not exceed two sentences.
`;

    // OpenAI API를 사용하여 프롬프트 생성
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // 모델 변경 가능
      messages: [
        { role: "system", content: "You are an expert at writing rich, vivid, and concise prompts for AI music generation (Stable Audio). Focus on atmosphere, instrumentation, and style." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    // 결과 반환
    return response.choices[0].message.content?.trim() || "";
  } catch (err) {
    console.error("❌ generateMusicPrompt error:", err);
    throw new Error("Failed to generate music prompt");
  }
}