// Gerekli Google AI SDK'sını içeri aktar
import { GoogleGenAI } from '@google/genai';

// Vercel'den güvenli bir şekilde GEMINI_API_KEY'i alır.
// API Anahtarınız asla tarayıcıda (frontend'de) görünmez.
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Vercel'in "/api/gemini" adresinden gelen istekleri işleyecek ana fonksiyon
export default async function (req, res) {
  // Sadece POST metodu ile gelen istekleri kabul et (güvenlik)
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // index.html'den gönderilen kullanıcının sorusunu al
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  try {
    // Gemini API'sine içerik oluşturma isteğini gönder
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Hızlı ve ekonomik model
      // Yapay Zekaya özel rolünü veriyoruz:
      contents: [{ role: "user", parts: [{ text: "Sen öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı ve eğitici cevaplar ver. Soru: " + prompt }] }],
    });

    // Yapay zeka cevabını JSON formatında tarayıcıya geri gönder
    res.status(200).json({
      answer: response.text,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Hata oluşursa detaylı hata mesajı döndür (debugging için)
    res.status(500).json({ error: "Yapay zeka servisine erişilemiyor. (API anahtarınızı kontrol edin.)" });
  }
}
