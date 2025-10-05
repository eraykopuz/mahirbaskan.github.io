import { useState } from 'react';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Kullanıcı mesajını göster
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          history: history  // Geçmişi gönder
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // AI cevabını göster
      setMessages(prev => [...prev, { role: 'model', text: data.answer }]);
      
      // Geçmişi güncelle
      setHistory(data.history);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Üzgünüm, bir hata oluştu.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHistory([]);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'Sen' : 'Mahir'}:</strong>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && <div className="loading">Mahir düşünüyor...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Bir soru sor..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Gönder
        </button>
        <button onClick={clearChat} disabled={loading}>
          Temizle
        </button>
      </div>
    </div>
  );
}

export default Chat;
