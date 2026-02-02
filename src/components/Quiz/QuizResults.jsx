import { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../assets/quiz.css';

const QuizResults = ({ quizId, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    loadResults();
  }, [quizId]);

  const loadResults = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/results`);
      setResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load results:', error);
      setLoading(false);
    }
  };

  const handleGetCertificate = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/certificate`);
      window.open(response.data.certificateUrl, '_blank');
      setShowCertificate(true);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      alert(error.response?.data?.error || 'Failed to generate certificate');
    }
  };

  if (loading) return <div className="quiz-loading">Loading results...</div>;
  if (!results) return <div className="quiz-error">No results found</div>;

  const percentage = (results.score / results.totalQuestions) * 100;

  return (
    <div className="quiz-modal">
      <div className="quiz-content results-content">
        <div className="quiz-header">
          <h2>Quiz Results</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="results-summary">
          <h3>{results.quiz.title}</h3>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-value">{results.score}</span>
              <span className="score-total">/ {results.totalQuestions}</span>
            </div>
            <div className="score-percentage">{percentage.toFixed(1)}%</div>
          </div>

          {results.badges && results.badges.length > 0 && (
            <div className="badges-earned">
              <h4>Badges Earned</h4>
              <div className="badges-list">
                {results.badges.map((badge, index) => (
                  <div key={index} className="badge">
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-description">{badge.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleGetCertificate} className="btn-primary">
            📜 Download Certificate
          </button>
        </div>

        <div className="results-review">
          <h4>Question Review</h4>
          {results.review.map((item, index) => (
            <div key={index} className={`review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="review-header">
                <span className="question-number">Q{index + 1}</span>
                <span className={`result-icon ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  {item.isCorrect ? '✓' : '✗'}
                </span>
                <span className="points-earned">
                  {item.pointsEarned} / {item.points} points
                </span>
              </div>

              <p className="review-question">{item.question}</p>

              {item.type !== 'short-answer' && (
                <div className="review-options">
                  {item.options.map((option, oIndex) => {
                    const isUserAnswer = item.userAnswers.includes(oIndex);
                    const isCorrectAnswer = item.correctAnswers.includes(oIndex);
                    
                    return (
                      <div 
                        key={oIndex} 
                        className={`review-option ${isUserAnswer ? 'user-answer' : ''} ${isCorrectAnswer ? 'correct-answer' : ''}`}
                      >
                        {option}
                        {isUserAnswer && <span className="user-badge">Your answer</span>}
                        {isCorrectAnswer && <span className="correct-badge">Correct</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.type === 'short-answer' && (
                <div className="review-short-answer">
                  <p><strong>Your answer:</strong> {item.userAnswers[0] || 'No answer'}</p>
                  <p><strong>Correct answer(s):</strong> {item.correctAnswers.join(', ')}</p>
                </div>
              )}

              {item.explanation && (
                <div className="review-explanation">
                  <strong>Explanation:</strong> {item.explanation}
                </div>
              )}

              {item.timeTaken > 0 && (
                <div className="review-time">
                  Time taken: {item.timeTaken}s
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
