// api/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS headers ekleyin (gerekirse)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, conversationHistory = [] } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt gereklidir' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY bulunamadı!');
    return res.status(500).json({ 
      error: 'API anahtarı yapılandırılmamış. Vercel Dashboard\'dan GEMINI_API_KEY ekleyin.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model adını düzeltin - gemini-2.5-flash mevcut değil
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // veya 'gemini-2.0-flash-exp'
      systemInstruction: "Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    // Chat başlat - history formatını düzeltin
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts?.[0]?.text || msg.text || '' }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    // Yeni mesajı gönder
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    // Güncellenmiş konuşma geçmişini döndür
    const updatedHistory = [
      ...conversationHistory,
      {
        role: "user",
        parts: [{ text: prompt }],
      },
      {
        role: "model",
        parts: [{ text: text }],
      }
    ];

    return res.status(200).json({ 
      answer: text,
      conversationHistory: updatedHistory
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    console.error('Error details:', error.message);
    
    let errorMessage = 'Yapay zeka servisine erişilemiyor.';
    
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'API anahtarı geçersiz. Vercel Dashboard\'dan kontrol edin.';
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'API kotası doldu. Lütfen daha sonra tekrar deneyin.';
    } else if (error.message?.includes('model') || error.message?.includes('not found')) {
      errorMessage = 'Model bulunamadı. Model adını kontrol edin: gemini-1.5-flash kullanın';
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = 'İçerik güvenlik filtresi tarafından engellendi.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
