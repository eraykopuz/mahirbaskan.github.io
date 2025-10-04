return res.status(405).json({ error: 'Method Not Allowed' });
}

  // Request body'den prompt'u al
  const { prompt } = req.body;
  // Request body'den prompt VE HISTORY'i al
  const { prompt, history } = req.body;

if (!prompt || prompt.trim() === '') {
return res.status(400).json({ error: 'Prompt gereklidir' });
@@ -35,24 +35,34 @@ export default async function handler(req, res) {
// GoogleGenerativeAI instance oluştur
const genAI = new GoogleGenerativeAI(apiKey);

    // Gemini 2.5 Pro - En güncel ve güçlü model
    const model = genAI.getGenerativeModel({ 
    // Model konfigürasyonu
    const modelInstance = genAI.getGenerativeModel({ 
model: 'gemini-2.5-flash',
generationConfig: {
temperature: 0.7,
maxOutputTokens: 1000,
}
});

    // Sistem prompt'u ile kullanıcı sorusunu birleştir
    const fullPrompt = `Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.
    // Sistem Prompt'u (Burası modelin nasıl davranacağını belirleyen kısımdır)
    const systemInstruction = `Sen ismi Mahir olan ve öğrencilere okul ödevlerinde, ders konularında ve bilimsel sorularda yardımcı olan bir asistansın. Her zaman Türkçe cevap ver. Kısa, açıklayıcı, eğitici ve sohbet eder gibi cevaplar ver. Cevabın maksimum 3-4 paragraf olsun.`;

Öğrenci Sorusu: ${prompt}`;
    // Yeni bir sohbet oturumu başlat (history'yi ve systemInstruction'ı dahil et)
    const chat = modelInstance.startChat({
      history: history || [], // Gelen geçmişi kullan, yoksa boş array kullan
      config: {
        systemInstruction: systemInstruction, // Sistem talimatını buraya taşıdık
      }
    });


    // API'ye YENİ MESAJI gönder
    const result = await chat.sendMessage({
      message: prompt
    });

    // API'ye istek gönder
    const result = await model.generateContent(fullPrompt);
const response = result.response;
    const text = response.text();
    const text = response.text;

// Başarılı cevabı döndür
return res.status(200).json({ 
