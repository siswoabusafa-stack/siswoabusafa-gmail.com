import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const generateCeramahStream = async (theme: string, duration: string, type: string, customOutline: string, onChunk: (chunk: string) => void) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `Anda adalah seorang ulama Ahlussunnah wal Jama'ah yang alim. 
Buatlah naskah ceramah lengkap dengan ketentuan berikut:
1. Tema: ${theme}
2. Estimasi Durasi: ${duration}
3. Jenis Ceramah: ${type}
4. Struktur Naskah:
   ${customOutline ? `- Kisi-kisi/Outline Khusus dari Pengguna: ${customOutline}. (Pastikan poin-poin ini dibahas dalam ceramah).` : '- Kisi-kisi/Outline Ceramah (Poin-poin utama dalam bentuk list yang disusun oleh AI).'}
   - Muqoddimah dalam bahasa Arab yang fasih (lengkap dengan harokat).
   - Pendahuluan (Bahasa Indonesia).
   - Isi Ceramah yang terbagi menjadi beberapa poin utama.
   - Setiap poin harus menyertakan dalil dari Al-Qur'an atau Hadits yang SHOHIH.
   - TULISAN ARAB DALIL WAJIB DISERTAI HAROKAT YANG LENGKAP DAN BENAR.
   - Terjemahan dalil dalam Bahasa Indonesia.
   - Penutup dan Doa (Doa dalam Bahasa Arab dengan harokat).

Gunakan bahasa yang santun, hikmah, dan sesuai dengan manhaj Salafush Sholeh. Pastikan rujukan hadits disebutkan sumbernya (misal: HR. Bukhari, Muslim, dll).`;

  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error generating ceramah stream:", error);
    throw error;
  }
};
