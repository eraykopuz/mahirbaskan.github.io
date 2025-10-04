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

// Gemini 2.5 Pro - En güncel ve güçlü model
const model = genAI.getGenerativeModel({ 
model: 'gemini-2.5-flash',
generationConfig: {
temperature: 0.7,
maxOutputTokens: 1000,
}
});

// Sistem prompt'u ile kullanıcı sorusunu birleştir
    const fullPrompt = `Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı ve eğitici cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.
    const fullPrompt = `Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.

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
