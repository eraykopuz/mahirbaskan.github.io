// api/gemini.js
// Vercel Serverless Function için Gemini API entegrasyonu

import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel environment variable'dan API anahtarını al
const apiKey = process.env.GEMINI_API_KEY;

// API anahtarı kontrolü
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is not set!');
}

export default async function handler(req, res) {
  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Request body'den prompt'u al
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt gereklidir' });
  }

  // API anahtarı yoksa hata dön
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API anahtarı yapılandırılmamış. Vercel Dashboard\'dan GEMINI_API_KEY ekleyin.' 
    });
  }

  try {
    // GoogleGenerativeAI instance oluştur
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model seç (gemini-1.5-flash hızlı ve ücretsiz)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    // Sistem prompt'u ile kullanıcı sorusunu birleştir
    const fullPrompt = `Sen öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı ve eğitici cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.

Öğrenci Sorusu: ${prompt}`;

    // API'ye istek gönder
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Başarılı cevabı döndür
    return res.status(200).json({ 
      answer: text 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Detaylı hata mesajı (production'da kaldırılabilir)
    let errorMessage = 'Yapay zeka servisine erişilemiyor.';
    
    if (error.message?.includes('API_KEY')) {
      errorMessage = 'API anahtarı geçersiz. Vercel Dashboard\'dan kontrol edin.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API kotası doldu. Lütfen daha sonra tekrar deneyin.';
    } else if (error.message?.includes('model')) {
      errorMessage = 'Model bulunamadı. Model adını kontrol edin.';
    }

    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
