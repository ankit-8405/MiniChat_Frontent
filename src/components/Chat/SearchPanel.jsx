import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/search-panel.css';

const SearchPanel = ({ channelId, onMessageClick, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null // 'today', 'week', 'month'
  });

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        searchMessages();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query, filters]);

  const searchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let startDate = null;
      if (filters.dateRange === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (filters.dateRange === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (filters.dateRange === 'month') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const params = {
        channelId,
        query,
        ...(startDate && { startDate: startDate.toISOString() })
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/search/messages`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResults(response.data.messages);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i}>{part}</mark> : part
    );
  };

  return (
    <div className="search-panel">
      <div className="search-header">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="search-input"
            autoFocus
          />
          <button onClick={onClose} className="btn-close-thread">✕</button>
        </div>
        
        <div className="search-filters">
          <button
            className={`search-filter-btn ${!filters.dateRange ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, dateRange: null })}
          >
            All Time
          </button>
          <button
            className={`search-filter-btn ${filters.dateRange === 'today' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, dateRange: 'today' })}
          >
            Today
          </button>
          <button
            className={`search-filter-btn ${filters.dateRange === 'week' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, dateRange: 'week' })}
          >
            This Week
          </button>
          <button
            className={`search-filter-btn ${filters.dateRange === 'month' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, dateRange: 'month' })}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="search-results">
        {loading ? (
          <div className="search-loading">Searching...</div>
        ) : results.length === 0 ? (
          <div className="search-empty">
            {query.length < 2 ? 'Type at least 2 characters to search' : 'No messages found'}
          </div>
        ) : (
          results.map(message => (
            <div
              key={message._id}
              className="search-result-item"
              onClick={() => {
                onMessageClick(message);
                onClose();
              }}
            >
              <div className="search-result-header">
                <span className="search-result-sender">{message.sender?.username}</span>
                <span className="search-result-time">
                  {new Date(message.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="search-result-text">
                {highlightText(message.text, query)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
