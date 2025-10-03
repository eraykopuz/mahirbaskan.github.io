// Gerekli Google AI SDK'sını içeri aktar
// Hata Çözümü: Paket adı "@google/genai" yerine "@google/generative-ai" olmalı.
import { GoogleGenAI } from '@google/generative-ai';

// Vercel'den güvenli bir şekilde GEMINI_API_KEY'i alır.
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Vercel'in "/api/gemini" adresinden gelen istekleri işleyecek ana fonksiyon
export default async function (req, res) {
  // Yalnızca POST metodu ile gelen istekleri kabul et
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Kullanıcının sorusunu isteğin gövdesinden (body) al
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  try {
    // Gemini modelini çağırın
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Hızlı ve ekonomik model
      // AI'ya rol veriyoruz:
      contents: [{ role: "user", parts: [{ text: "Sen öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı ve eğitici cevaplar ver. Soru: " + prompt }] }],
    });

    // Gelen metni kullanıcıya JSON olarak gönder
    res.status(200).json({
      answer: response.text,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    // API anahtarı yanlışsa bu hata döner.
    res.status(500).json({ error: "Yapay zeka servisine erişilemiyor. (API anahtarını veya Vercel değişkenlerini kontrol edin.)" });
  }
}
