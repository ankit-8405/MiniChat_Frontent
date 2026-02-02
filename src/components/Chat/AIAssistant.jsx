import { useState } from 'react';
import axios from 'axios';
import '../../assets/ai-assistant.css';

const AIAssistant = ({ channelId, onClose }) => {
  const [activeTab, setActiveTab] = useState('summarize');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [messageToTranslate, setMessageToTranslate] = useState('');

  const handleSummarize = async () => {
    try {
      setLoading(true);
      setResult(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/summarize`,
        { channelId, messageCount: 50 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Summarize error:', error);
      setResult({ error: 'Failed to generate summary' });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!messageToTranslate.trim()) return;
    
    try {
      setLoading(true);
      setResult(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/translate`,
        { text: messageToTranslate, targetLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Translate error:', error);
      setResult({ error: 'Failed to translate' });
    } finally {
      setLoading(false);
    }
  };

  const handleSmartReplies = async () => {
    try {
      setLoading(true);
      setResult(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/smart-replies`,
        { channelId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Smart replies error:', error);
      setResult({ error: 'Failed to generate suggestions' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-panel">
      <div className="ai-assistant-header">
        <h3>🤖 AI Assistant</h3>
        <button className="btn-close-ai" onClick={onClose}>✕</button>
      </div>

      <div className="ai-assistant-tabs">
        <button
          className={`ai-tab ${activeTab === 'summarize' ? 'active' : ''}`}
          onClick={() => { setActiveTab('summarize'); setResult(null); }}
        >
          📝 Summarize
        </button>
        <button
          className={`ai-tab ${activeTab === 'translate' ? 'active' : ''}`}
          onClick={() => { setActiveTab('translate'); setResult(null); }}
        >
          🌐 Translate
        </button>
        <button
          className={`ai-tab ${activeTab === 'replies' ? 'active' : ''}`}
          onClick={() => { setActiveTab('replies'); setResult(null); }}
        >
          💡 Smart Replies
        </button>
      </div>

      <div className="ai-assistant-content">
        {/* Summarize Tab */}
        {activeTab === 'summarize' && (
          <div className="ai-tab-content">
            <p className="ai-description">
              Get a concise summary of the last 50 messages in this channel.
            </p>
            <button 
              onClick={handleSummarize} 
              disabled={loading}
              className="btn-ai-action"
            >
              {loading ? 'Generating...' : '✨ Generate Summary'}
            </button>
            
            {result && !result.error && (
              <div className="ai-result">
                <h4>Summary:</h4>
                <p>{result.summary}</p>
                <div className="ai-result-meta">
                  <span>📊 {result.messageCount} messages analyzed</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Translate Tab */}
        {activeTab === 'translate' && (
          <div className="ai-tab-content">
            <p className="ai-description">
              Translate text to another language.
            </p>
            
            <textarea
              value={messageToTranslate}
              onChange={(e) => setMessageToTranslate(e.target.value)}
              placeholder="Enter text to translate..."
              className="ai-textarea"
              rows="4"
            />

            <select 
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="ai-select"
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
            </select>

            <button 
              onClick={handleTranslate} 
              disabled={loading || !messageToTranslate.trim()}
              className="btn-ai-action"
            >
              {loading ? 'Translating...' : '🌐 Translate'}
            </button>

            {result && !result.error && (
              <div className="ai-result">
                <h4>Translation:</h4>
                <div className="translation-box">
                  <div className="translation-original">
                    <strong>Original:</strong>
                    <p>{result.original}</p>
                  </div>
                  <div className="translation-arrow">→</div>
                  <div className="translation-result">
                    <strong>Translated ({result.targetLanguage}):</strong>
                    <p>{result.translated}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Smart Replies Tab */}
        {activeTab === 'replies' && (
          <div className="ai-tab-content">
            <p className="ai-description">
              Get AI-powered reply suggestions based on recent conversation.
            </p>
            <button 
              onClick={handleSmartReplies} 
              disabled={loading}
              className="btn-ai-action"
            >
              {loading ? 'Generating...' : '💡 Get Suggestions'}
            </button>

            {result && !result.error && (
              <div className="ai-result">
                <h4>Suggested Replies:</h4>
                <div className="smart-replies-list">
                  {result.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="smart-reply-item"
                      onClick={() => {
                        navigator.clipboard.writeText(suggestion);
                        alert('Copied to clipboard!');
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {result?.error && (
          <div className="ai-error">
            ⚠️ {result.error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="ai-loading">
            <div className="ai-loading-spinner"></div>
            <p>AI is thinking...</p>
          </div>
        )}
      </div>

      <div className="ai-assistant-footer">
        <p className="ai-disclaimer">
          ⚠️ AI responses are experimental and may not always be accurate.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
