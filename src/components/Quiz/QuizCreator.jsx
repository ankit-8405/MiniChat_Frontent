import { useState } from 'react';
import api from '../../services/api';
import '../../assets/quiz.css';

const QuizCreator = ({ channelId, onClose, onQuizCreated }) => {
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    attemptsLimit: 0,
    isResumable: true,
    isLiveMode: false,
    showAnswersAfterSubmit: true,
    certificate: { enabled: false, passingScore: 70 }
  });

  const [questions, setQuestions] = useState([{
    question: '',
    type: 'mcq-single',
    options: ['', '', '', ''],
    correctAnswers: [],
    points: 1,
    timeLimit: 0,
    hint: '',
    hintCost: 0,
    explanation: '',
    enableDiscussion: false
  }]);

  const [currentStep, setCurrentStep] = useState(1);

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      type: 'mcq-single',
      options: ['', '', '', ''],
      correctAnswers: [],
      points: 1,
      timeLimit: 0,
      hint: '',
      hintCost: 0,
      explanation: '',
      enableDiscussion: false
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const toggleCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...questions];
    const q = updated[qIndex];
    
    if (q.type === 'mcq-single' || q.type === 'true-false') {
      q.correctAnswers = [oIndex];
    } else if (q.type === 'mcq-multiple') {
      const idx = q.correctAnswers.indexOf(oIndex);
      if (idx > -1) {
        q.correctAnswers.splice(idx, 1);
      } else {
        q.correctAnswers.push(oIndex);
      }
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/quizzes', {
        ...quiz,
        channelId,
        questions
      });
      onQuizCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create quiz');
    }
  };

  return (
    <div className="quiz-creator-modal">
      <div className="quiz-creator-content">
        <div className="quiz-creator-header">
          <h2>Create Quiz</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="quiz-creator-steps">
          <div className={`step ${currentStep === 1 ? 'active' : ''}`}>1. Basic Info</div>
          <div className={`step ${currentStep === 2 ? 'active' : ''}`}>2. Questions</div>
          <div className={`step ${currentStep === 3 ? 'active' : ''}`}>3. Settings</div>
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="quiz-step">
              <div className="form-group">
                <label>Quiz Title *</label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={quiz.description}
                  onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Time Limit (seconds, 0 = no limit)</label>
                <input
                  type="number"
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="quiz-step questions-step">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="question-card">
                  <div className="question-header">
                    <h3>Question {qIndex + 1}</h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Question Type</label>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        updateQuestion(qIndex, 'type', e.target.value);
                        if (e.target.value === 'true-false') {
                          updateQuestion(qIndex, 'options', ['True', 'False']);
                        } else if (e.target.value === 'short-answer') {
                          updateQuestion(qIndex, 'options', []);
                        }
                      }}
                    >
                      <option value="mcq-single">Multiple Choice (Single)</option>
                      <option value="mcq-multiple">Multiple Choice (Multiple)</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Question Text *</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      required
                      rows="2"
                    />
                  </div>

                  {q.type !== 'short-answer' && (
                    <div className="form-group">
                      <label>Options</label>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="option-row">
                          <input
                            type="checkbox"
                            checked={q.correctAnswers.includes(oIndex)}
                            onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                            disabled={q.type === 'true-false'}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            required
                            disabled={q.type === 'true-false'}
                          />
                          {q.type !== 'true-false' && q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="remove-option-btn"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {q.type !== 'true-false' && (
                        <button type="button" onClick={() => addOption(qIndex)} className="add-option-btn">
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {q.type === 'short-answer' && (
                    <div className="form-group">
                      <label>Correct Answer(s) (comma-separated)</label>
                      <input
                        type="text"
                        value={q.correctAnswers.join(', ')}
                        onChange={(e) => updateQuestion(qIndex, 'correctAnswers', e.target.value.split(',').map(s => s.trim()))}
                        placeholder="answer1, answer2"
                      />
                    </div>
                  )}

                  <div className="question-extras">
                    <div className="form-group">
                      <label>Points</label>
                      <input
                        type="number"
                        value={q.points}
                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Time Limit (sec)</label>
                      <input
                        type="number"
                        value={q.timeLimit}
                        onChange={(e) => updateQuestion(qIndex, 'timeLimit', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Hint (optional)</label>
                    <input
                      type="text"
                      value={q.hint}
                      onChange={(e) => updateQuestion(qIndex, 'hint', e.target.value)}
                      placeholder="Provide a hint"
                    />
                    {q.hint && (
                      <input
                        type="number"
                        value={q.hintCost}
                        onChange={(e) => updateQuestion(qIndex, 'hintCost', parseInt(e.target.value))}
                        placeholder="Points cost"
                        min="0"
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Explanation (shown after answer)</label>
                    <textarea
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                      rows="2"
                      placeholder="Explain the correct answer"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={q.enableDiscussion}
                        onChange={(e) => updateQuestion(qIndex, 'enableDiscussion', e.target.checked)}
                      />
                      Enable discussion thread for this question
                    </label>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addQuestion} className="add-question-btn">
                + Add Question
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="quiz-step settings-step">
              <h3>Quiz Settings</h3>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quiz.shuffleQuestions}
                    onChange={(e) => setQuiz({ ...quiz, shuffleQuestions: e.target.checked })}
                  />
                  Shuffle questions
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quiz.shuffleOptions}
                    onChange={(e) => setQuiz({ ...quiz, shuffleOptions: e.target.checked })}
                  />
                  Shuffle answer options
                </label>
              </div>

              <div className="form-group">
                <label>Attempts Limit (0 = unlimited)</label>
                <input
                  type="number"
                  value={quiz.attemptsLimit}
                  onChange={(e) => setQuiz({ ...quiz, attemptsLimit: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quiz.isResumable}
                    onChange={(e) => setQuiz({ ...quiz, isResumable: e.target.checked })}
                  />
                  Allow resuming incomplete attempts
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quiz.isLiveMode}
                    onChange={(e) => setQuiz({ ...quiz, isLiveMode: e.target.checked })}
                  />
                  Live mode (host controls question progression)
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quiz.showAnswersAfterSubmit}
                    onChange={(e) => setQuiz({ ...quiz, showAnswersAfterSubmit: e.target.checked })}
                  />
                  Show correct answers after submission
                </label>
              </div>

              <h3>Certificate Settings</h3>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={quiz.certificate.enabled}
                    onChange={(e) => setQuiz({ 
                      ...quiz, 
                      certificate: { ...quiz.certificate, enabled: e.target.checked }
                    })}
                  />
                  Enable certificates
                </label>
              </div>

              {quiz.certificate.enabled && (
                <div className="form-group">
                  <label>Passing Score (%)</label>
                  <input
                    type="number"
                    value={quiz.certificate.passingScore}
                    onChange={(e) => setQuiz({ 
                      ...quiz, 
                      certificate: { ...quiz.certificate, passingScore: parseInt(e.target.value) }
                    })}
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          )}

          <div className="quiz-creator-footer">
            {currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="btn-secondary">
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                Create Quiz
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizCreator;
