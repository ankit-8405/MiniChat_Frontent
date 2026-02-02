import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import '../../assets/quiz.css';

const QuizTaker = ({ quizId, onClose, onComplete }) => {
  const { socket } = useSocket();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [usedHints, setUsedHints] = useState(new Set());
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!quiz || !started) return;

    // Overall timer
    if (quiz.timeLimit > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quiz, started]);

  useEffect(() => {
    if (!quiz || !started) return;

    const question = quiz.questions[currentQuestion];
    if (question?.timeLimit > 0) {
      setQuestionTimeRemaining(question.timeLimit);
      const timer = setInterval(() => {
        setQuestionTimeRemaining(prev => {
          if (prev <= 1) {
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuestion, quiz, started]);

  useEffect(() => {
    if (!socket) return;

    socket.on('quiz:nextQuestion', ({ questionIndex }) => {
      setCurrentQuestion(questionIndex);
    });

    socket.on('quiz:answerRevealed', ({ questionIndex, correctAnswers, explanation }) => {
      if (questionIndex === currentQuestion) {
        alert(`Correct answer(s): ${correctAnswers.join(', ')}\n${explanation}`);
      }
    });

    return () => {
      socket.off('quiz:nextQuestion');
      socket.off('quiz:answerRevealed');
    };
  }, [socket, currentQuestion]);

  const loadQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      setQuiz(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Failed to load quiz');
    }
  };

  const handleStart = async () => {
    try {
      await api.post(`/quizzes/${quizId}/start`);
      setStarted(true);
      if (quiz.timeLimit > 0) {
        setTimeRemaining(quiz.timeLimit);
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert(error.response?.data?.error || 'Failed to start quiz');
    }
  };

  const handleAnswer = (value) => {
    const question = quiz.questions[currentQuestion];
    
    if (question.type === 'mcq-multiple') {
      const current = answers[currentQuestion] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [currentQuestion]: updated });
    } else {
      setAnswers({ ...answers, [currentQuestion]: [value] });
    }
  };

  const handleGetHint = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/hint/${currentQuestion}`);
      setShowHint(true);
      setUsedHints(new Set([...usedHints, currentQuestion]));
      alert(`Hint (costs ${response.data.cost} points): ${response.data.hint}`);
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
  };

  const handleNextQuestion = async () => {
    const question = quiz.questions[currentQuestion];
    const selectedAnswers = answers[currentQuestion] || [];

    if (selectedAnswers.length === 0) {
      if (!confirm('No answer selected. Continue anyway?')) return;
    }

    try {
      const startTime = Date.now();
      const response = await api.post(`/quizzes/${quizId}/answer`, {
        questionIndex: currentQuestion,
        selectedAnswers,
        usedHint: usedHints.has(currentQuestion),
        timeTaken: quiz.questions[currentQuestion].timeLimit 
          ? quiz.questions[currentQuestion].timeLimit - questionTimeRemaining
          : 0
      });

      if (quiz.showAnswersAfterSubmit) {
        const message = response.data.isCorrect 
          ? `✓ Correct! +${response.data.pointsEarned} points`
          : `✗ Incorrect`;
        
        let details = `${message}\nScore: ${response.data.score}`;
        if (response.data.explanation) {
          details += `\n\nExplanation: ${response.data.explanation}`;
        }
        alert(details);
      }

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowHint(false);
      } else {
        handleSubmitQuiz();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert(error.response?.data?.error || 'Failed to submit answer');
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const response = await api.post(`/quizzes/${quizId}/submit`);
      alert(`Quiz completed!\nScore: ${response.data.score}/${quiz.questions.length}\nBadges earned: ${response.data.badges.map(b => b.name).join(', ') || 'None'}`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  if (loading) return <div className="quiz-loading">Loading quiz...</div>;
  if (!quiz) return null;

  if (!started) {
    return (
      <div className="quiz-modal">
        <div className="quiz-content">
          <div className="quiz-header">
            <h2>{quiz.title}</h2>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          <div className="quiz-intro">
            <p>{quiz.description}</p>
            <div className="quiz-info">
              <p><strong>Questions:</strong> {quiz.questions.length}</p>
              {quiz.timeLimit > 0 && <p><strong>Time Limit:</strong> {Math.floor(quiz.timeLimit / 60)}:{(quiz.timeLimit % 60).toString().padStart(2, '0')}</p>}
              {quiz.attemptsLimit > 0 && <p><strong>Attempts Allowed:</strong> {quiz.attemptsLimit}</p>}
            </div>
            <button onClick={handleStart} className="btn-primary">Start Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const selectedAnswers = answers[currentQuestion] || [];

  return (
    <div className="quiz-modal">
      <div className="quiz-content">
        <div className="quiz-header">
          <h2>{quiz.title}</h2>
          <div className="quiz-progress">
            Question {currentQuestion + 1} / {quiz.questions.length}
          </div>
          {timeRemaining !== null && (
            <div className="quiz-timer">
              Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="quiz-body">
          <div className="question-container">
            <h3>{question.question}</h3>
            {questionTimeRemaining !== null && (
              <div className="question-timer">
                {questionTimeRemaining}s remaining
              </div>
            )}

            {question.type === 'short-answer' ? (
              <input
                type="text"
                value={selectedAnswers[0] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer"
                className="short-answer-input"
              />
            ) : (
              <div className="options-container">
                {question.options.map((option, index) => (
                  <div key={index} className="option">
                    <label>
                      <input
                        type={question.type === 'mcq-multiple' ? 'checkbox' : 'radio'}
                        name={`question-${currentQuestion}`}
                        checked={selectedAnswers.includes(index)}
                        onChange={() => handleAnswer(index)}
                      />
                      <span>{option}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {question.hint && !usedHints.has(currentQuestion) && (
              <button onClick={handleGetHint} className="hint-btn">
                💡 Get Hint (-{question.hintCost} points)
              </button>
            )}

            {question.threadId && (
              <button 
                onClick={() => window.open(`/thread/${question.threadId}`, '_blank')}
                className="discussion-btn"
              >
                💬 Join Discussion
              </button>
            )}
          </div>
        </div>

        <div className="quiz-footer">
          {currentQuestion < quiz.questions.length - 1 ? (
            <button onClick={handleNextQuestion} className="btn-primary">
              Next Question
            </button>
          ) : (
            <button onClick={handleNextQuestion} className="btn-primary">
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;
