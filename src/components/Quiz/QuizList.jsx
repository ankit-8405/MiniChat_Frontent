import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import QuizCreator from './QuizCreator';
import QuizTaker from './QuizTaker';
import QuizResults from './QuizResults';
import QuizLeaderboard from './QuizLeaderboard';
import '../../assets/quiz.css';

const QuizList = ({ channelId }) => {
  const { socket } = useSocket();
  const [quizzes, setQuizzes] = useState([]);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'take', 'results', 'leaderboard'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, [channelId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('quiz:created', (quiz) => {
      if (quiz.channelId === channelId) {
        setQuizzes(prev => [quiz, ...prev]);
      }
    });

    socket.on('quiz:statusChanged', ({ quizId, isActive }) => {
      setQuizzes(prev => prev.map(q => 
        q._id === quizId ? { ...q, isActive } : q
      ));
    });

    return () => {
      socket.off('quiz:created');
      socket.off('quiz:statusChanged');
    };
  }, [socket, channelId]);

  const loadQuizzes = async () => {
    try {
      const response = await api.get(`/quizzes/channel/${channelId}`);
      setQuizzes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (quizId) => {
    try {
      await api.patch(`/quizzes/${quizId}/toggle`);
    } catch (error) {
      console.error('Failed to toggle quiz status:', error);
    }
  };

  const handleTakeQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setViewMode('take');
  };

  const handleViewResults = (quiz) => {
    setSelectedQuiz(quiz);
    setViewMode('results');
  };

  const handleViewLeaderboard = (quiz) => {
    setSelectedQuiz(quiz);
    setViewMode('leaderboard');
  };

  const closeModal = () => {
    setSelectedQuiz(null);
    setViewMode(null);
    loadQuizzes();
  };

  if (loading) return <div className="quiz-loading">Loading quizzes...</div>;

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <h2>Quizzes</h2>
        <button onClick={() => setShowCreator(true)} className="btn-primary">
          + Create Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="no-quizzes">
          <p>No quizzes yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="quiz-list">
          {quizzes.map(quiz => (
            <div key={quiz._id} className="quiz-card">
              <div className="quiz-card-header">
                <h3>{quiz.title}</h3>
                <span className={`quiz-status ${quiz.isActive ? 'active' : 'inactive'}`}>
                  {quiz.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              
              <p className="quiz-description">{quiz.description}</p>
              
              <div className="quiz-meta">
                <span>📝 {quiz.questions?.length || 0} questions</span>
                {quiz.timeLimit > 0 && (
                  <span>⏱️ {Math.floor(quiz.timeLimit / 60)}min</span>
                )}
                <span>👥 {quiz.participants?.length || 0} participants</span>
              </div>

              <div className="quiz-card-actions">
                {quiz.isActive && (
                  <button onClick={() => handleTakeQuiz(quiz)} className="btn-primary">
                    Take Quiz
                  </button>
                )}
                <button onClick={() => handleViewResults(quiz)} className="btn-secondary">
                  My Results
                </button>
                <button onClick={() => handleViewLeaderboard(quiz)} className="btn-secondary">
                  Leaderboard
                </button>
                {quiz.createdBy._id === localStorage.getItem('userId') && (
                  <button 
                    onClick={() => handleToggleStatus(quiz._id)} 
                    className="btn-secondary"
                  >
                    {quiz.isActive ? 'Stop' : 'Start'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreator && (
        <QuizCreator
          channelId={channelId}
          onClose={() => setShowCreator(false)}
          onQuizCreated={(quiz) => {
            setQuizzes([quiz, ...quizzes]);
            setShowCreator(false);
          }}
        />
      )}

      {selectedQuiz && viewMode === 'take' && (
        <QuizTaker
          quizId={selectedQuiz._id}
          onClose={closeModal}
          onComplete={loadQuizzes}
        />
      )}

      {selectedQuiz && viewMode === 'results' && (
        <QuizResults
          quizId={selectedQuiz._id}
          onClose={closeModal}
        />
      )}

      {selectedQuiz && viewMode === 'leaderboard' && (
        <QuizLeaderboard
          quizId={selectedQuiz._id}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default QuizList;
