// api/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is not set!');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, conversationHistory = [] } = req.body;

  if (!prompt || prompt.trim() === '') {
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
      model: 'gemini-2.0-flash-exp',
      systemInstruction: `Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.`,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    // Chat başlat - önceki konuşma geçmişi ile
    const chat = model.startChat({
      history: conversationHistory,
    });

    // Yeni mesajı gönder
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    // Güncellenmiş konuşma geçmişini oluştur
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
