
import { GoogleGenAI } from "@google/genai";

// Utilizando a variável de ambiente conforme diretrizes.
// Certifique-se de que a chave API está configurada no ambiente.
const GEMINI_API_KEY = process.env.API_KEY;

export const speakText = async (text: string) => {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API Key não encontrada. Usando fallback do navegador.");
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
    }
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
        // Definir sampleRate compatível com o modelo (24kHz é comum para Gemini TTS)
        const sampleRate = 24000; 
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        
        const pcmBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(pcmBytes, audioContext, sampleRate, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
  } catch (error) {
    console.error("Erro ao gerar áudio com Gemini:", error);
    // Fallback para a voz do navegador em caso de erro
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
    }
  }
};

// Converte Base64 para Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodifica PCM raw (Int16) para AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // O Gemini retorna PCM 16-bit Little Endian.
  // Criamos um Int16Array a partir do buffer de bytes.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normaliza de Int16 (-32768 a 32767) para Float32 (-1.0 a 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
