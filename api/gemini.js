import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt gereklidir' });
  }

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API anahtarı yapılandırılmamış. Vercel Dashboard\'dan GEMINI_API_KEY ekleyin.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // veya 'gemini-1.5-flash'
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    // DÜZELTİLDİ: Backtick kullanımı
    const fullPrompt = `Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.

Öğrenci Sorusu: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return res.status(200).json({ 
      answer: text 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    let errorMessage = 'Yapay zeka servisine erişilemiyor.';
    
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'API anahtarı geçersiz. Vercel Dashboard\'dan kontrol edin.';
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'API kotası doldu. Lütfen daha sonra tekrar deneyin.';
    } else if (error.message?.includes('model')) {
      errorMessage = 'Model bulunamadı. Model adını kontrol edin.';
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = 'İçerik güvenlik filtresi tarafından engellendi.';
    }

    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
