import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.API_KEY;

export const speakText = async (text: string) => {
  const playBrowserVoice = () => {
    console.log("Usando voz do navegador (fallback)...");
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Navegador não suporta síntese de fala.");
    }
  };

  // Verifica se a chave é válida (não undefined ou a string "undefined")
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
    console.warn("Gemini API Key não configurada. Usando fallback.");
    playBrowserVoice();
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
        const sampleRate = 24000; 
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass({ sampleRate });
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const pcmBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(pcmBytes, audioContext, sampleRate, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    } else {
        console.warn("API não retornou áudio. Usando fallback.");
        playBrowserVoice();
    }
  } catch (error) {
    console.error("Erro Gemini TTS:", error);
    playBrowserVoice();
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Gemini retorna PCM 16-bit Little Endian
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}