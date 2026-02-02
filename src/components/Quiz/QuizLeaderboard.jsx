import { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../assets/quiz.css';

const QuizLeaderboard = ({ quizId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [quizId]);

  const loadLeaderboard = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/leaderboard`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/analytics`);
      setAnalytics(response.data);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      alert('Analytics only available to quiz creator');
    }
  };

  if (loading) return <div className="quiz-loading">Loading leaderboard...</div>;
  if (!data) return <div className="quiz-error">No data found</div>;

  return (
    <div className="quiz-modal">
      <div className="quiz-content leaderboard-content">
        <div className="quiz-header">
          <h2>Leaderboard</h2>
          <button onClick={loadAnalytics} className="analytics-btn">
            📊 Analytics
          </button>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="leaderboard-info">
          <h3>{data.quiz.title}</h3>
          <p>Total Questions: {data.quiz.totalQuestions}</p>
          {data.analytics && (
            <p>Average Score: {data.analytics.averageScore.toFixed(1)}</p>
          )}
        </div>

        {!showAnalytics ? (
          <div className="leaderboard-list">
            {data.leaderboard.length === 0 ? (
              <p className="no-data">No participants yet</p>
            ) : (
              data.leaderboard.map((entry, index) => (
                <div key={index} className={`leaderboard-entry rank-${index + 1}`}>
                  <div className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  
                  <div className="user-info">
                    {entry.user.avatar && (
                      <img src={entry.user.avatar} alt={entry.user.username} className="avatar" />
                    )}
                    <span className="username">{entry.user.username}</span>
                  </div>

                  <div className="score-info">
                    <span className="score">{entry.score} / {entry.totalQuestions}</span>
                    <span className="percentage">
                      {((entry.score / entry.totalQuestions) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="time-info">
                    ⏱️ {Math.floor(entry.timeTaken / 60)}:{(Math.floor(entry.timeTaken % 60)).toString().padStart(2, '0')}
                  </div>

                  {entry.badges && entry.badges.length > 0 && (
                    <div className="badges-mini">
                      {entry.badges.map((badge, i) => (
                        <span key={i} className="badge-mini" title={badge}>
                          {badge === 'Perfect Score' && '🏆'}
                          {badge === 'Speed Demon' && '⚡'}
                          {badge === 'First Place' && '🥇'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="analytics-view">
            <button onClick={() => setShowAnalytics(false)} className="back-btn">
              ← Back to Leaderboard
            </button>

            {analytics && (
              <>
                <div className="analytics-summary">
                  <div className="stat-card">
                    <h4>Total Attempts</h4>
                    <p className="stat-value">{analytics.totalAttempts}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Average Score</h4>
                    <p className="stat-value">{analytics.averageScore.toFixed(1)}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Completion Rate</h4>
                    <p className="stat-value">{analytics.completionRate}%</p>
                  </div>
                </div>

                <div className="question-analytics">
                  <h4>Question Performance</h4>
                  {analytics.questionStats.map((stat, index) => (
                    <div key={index} className="question-stat">
                      <div className="question-stat-header">
                        <span className="question-num">Q{index + 1}</span>
                        <span className="question-text">{stat.question}</span>
                      </div>
                      <div className="question-stat-bars">
                        <div className="stat-bar">
                          <span className="stat-label">Correct: {stat.correctCount}</span>
                          <div className="bar-container">
                            <div 
                              className="bar correct" 
                              style={{ width: `${stat.accuracy}%` }}
                            />
                          </div>
                        </div>
                        <div className="stat-bar">
                          <span className="stat-label">Incorrect: {stat.incorrectCount}</span>
                          <div className="bar-container">
                            <div 
                              className="bar incorrect" 
                              style={{ width: `${100 - stat.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="question-stat-footer">
                        <span>Accuracy: {stat.accuracy}%</span>
                        <span>Avg Time: {stat.averageTime}s</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="difficult-questions">
                  <h4>Most Difficult Questions</h4>
                  {analytics.difficultQuestions.map((q, index) => (
                    <div key={index} className="difficult-question">
                      <span className="question-num">Q{q.index + 1}</span>
                      <span className="question-text">{q.question}</span>
                      <span className="accuracy">{q.accuracy.toFixed(1)}% correct</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizLeaderboard;
