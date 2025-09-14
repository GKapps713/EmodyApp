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
