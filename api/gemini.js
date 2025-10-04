// api/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel environment variable'dan API anahtarını al
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.error('GEMINI_API_KEY environment variable is not set!');

// Basit in-memory hafıza (stateless serverlerde kalıcı olmaz, sadece demo)
const conversationMemory = {};

// Helper: conversation id ile hafızayı al
function getMemory(sessionId) {
  if (!conversationMemory[sessionId]) conversationMemory[sessionId] = [];
  return conversationMemory[sessionId];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, sessionId } = req.body;
  if (!prompt || prompt.trim() === '') return res.status(400).json({ error: 'Prompt gereklidir' });
  if (!sessionId) return res.status(400).json({ error: 'Session ID gereklidir' });

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API anahtarı yapılandırılmamış. Vercel Dashboard\'dan GEMINI_API_KEY ekleyin.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    // Hafızadan önceki konuşmaları al
    const memory = getMemory(sessionId);
    let memoryText = memory.map((msg, i) => `${msg.role === 'user' ? 'Öğrenci' : 'Mahir'}: ${msg.text}`).join('\n');

    // Sistem prompt ve hafıza ile birleştirme
    const fullPrompt = `
Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.

Önceki konuşmalar:
${memoryText}

Yeni öğrenci sorusu: ${prompt}
`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Hafızaya ekle
    memory.push({ role: 'user', text: prompt });
    memory.push({ role: 'assistant', text });

    return res.status(200).json({ answer: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    let errorMessage = 'Yapay zeka servisine erişilemiyor.';
    
    if (error.message?.includes('API_KEY')) errorMessage = 'API anahtarı geçersiz. Vercel Dashboard\'dan kontrol edin.';
    else if (error.message?.includes('quota')) errorMessage = 'API kotası doldu. Lütfen daha sonra tekrar deneyin.';
    else if (error.message?.includes('model')) errorMessage = 'Model bulunamadı. Model adını kontrol edin.';
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

