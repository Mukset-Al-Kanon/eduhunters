import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, RefreshCw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ExamEngine({ exam, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmitExam = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    exam.questions.forEach(q => {
      const selected = selectedAnswers[q.id];
      if (selected === undefined) {
        skippedCount++;
      } else if (selected === q.correctIndex) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const negPenalty = wrongCount * (exam.negativeMarking || 0.25);
    const rawScore = correctCount - negPenalty;
    const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
    const percentage = Math.round((finalScore / exam.questions.length) * 100);

    setResult({
      totalQuestions: exam.questions.length,
      correctCount,
      wrongCount,
      skippedCount,
      finalScore,
      percentage,
      isPassed: finalScore >= (exam.passMarks || 1)
    });

    // Celebrate with confetti if passed
    if (finalScore >= (exam.passMarks || 1)) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const currentQ = exam.questions[currentIdx];

  return (
    <div className="exam-modal-overlay">
      <div className="exam-container">
        {/* Exam Header */}
        <div className="exam-header">
          <button className="btn-icon" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          
          <div className="exam-title-box">
            <h2 className="exam-title">{exam.title}</h2>
            <span className="exam-subject-tag">{exam.subject}</span>
          </div>

          {!isSubmitted && (
            <div className={`exam-timer-badge ${timeLeft < 180 ? 'timer-urgent' : ''}`}>
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Exam Content */}
        {!isSubmitted ? (
          <div className="exam-body no-select">
            {/* Question Progress Tracker */}
            <div className="question-tracker">
              <span className="tracker-text">
                প্রশ্ন {currentIdx + 1} / {exam.questions.length}
              </span>
              <div className="tracker-dots">
                {exam.questions.map((_, i) => {
                  const isAns = selectedAnswers[exam.questions[i].id] !== undefined;
                  return (
                    <button
                      key={i}
                      className={`tracker-dot ${i === currentIdx ? 'current' : ''} ${isAns ? 'answered' : ''}`}
                      onClick={() => setCurrentIdx(i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            <div className="question-card">
              <h3 className="question-text">
                <span className="q-number">{currentIdx + 1}.</span> {currentQ.question}
              </h3>

              <div className="options-list">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === oIdx;
                  const bengaliLetters = ['ক', 'খ', 'গ', 'ঘ'];
                  return (
                    <button
                      key={oIdx}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentQ.id, oIdx)}
                    >
                      <span className="option-indicator">{bengaliLetters[oIdx] || oIdx + 1}</span>
                      <span className="option-label">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation & Submit Footer */}
            <div className="exam-footer">
              <button
                className="btn btn-ghost"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              >
                পূর্ববর্তী
              </button>

              <div className="exam-footer-right">
                {currentIdx < exam.questions.length - 1 ? (
                  <button
                    className="btn btn-outline"
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                  >
                    পরবর্তী প্রশ্ন
                  </button>
                ) : (
                  <button
                    className="btn btn-accent"
                    onClick={handleSubmitExam}
                  >
                    <CheckCircle size={16} /> সাবমিট করুন
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results View with Medilogy Style OMR and Explanations */
          <div className="exam-result-view animate-fade-in">
            <div className="result-score-card">
              <div className="result-trophy">
                <Award size={48} className="text-warning" />
              </div>
              <h3 className="result-title">পরীক্ষা সম্পন্ন হয়েছে!</h3>
              <p className="result-sub">আপনার স্কোর ও পারফরম্যান্স বিশ্লেষণ</p>

              <div className="score-summary-grid">
                <div className="score-item">
                  <span className="score-val">{result.finalScore} / {result.totalQuestions}</span>
                  <span className="score-lbl">প্রাপ্ত নম্বর</span>
                </div>
                <div className="score-item text-emerald">
                  <span className="score-val">{result.correctCount}</span>
                  <span className="score-lbl">সঠিক</span>
                </div>
                <div className="score-item text-danger">
                  <span className="score-val">{result.wrongCount}</span>
                  <span className="score-lbl">ভুল</span>
                </div>
                <div className="score-item text-muted">
                  <span className="score-val">{result.skippedCount}</span>
                  <span className="score-lbl">অনুত্তর</span>
                </div>
              </div>
            </div>

            {/* Question Review with Explanations */}
            <div className="exam-solution-section">
              <h4 className="solution-heading">প্রশ্ন ও বিস্তারিত সমাধান</h4>
              {exam.questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;
                const isSkipped = userAns === undefined;

                return (
                  <div key={q.id} className="solution-card">
                    <div className="solution-q-header">
                      <span className="font-semibold">{idx + 1}. {q.question}</span>
                      <span className={`solution-status ${isCorrect ? 'correct' : isSkipped ? 'skipped' : 'wrong'}`}>
                        {isCorrect ? '✓ সঠিক' : isSkipped ? 'মাইনাস হয়নি (স্কিপড)' : '✗ ভুল'}
                      </span>
                    </div>

                    <div className="solution-options-list">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectOpt = oIdx === q.correctIndex;
                        const isUserOpt = oIdx === userAns;
                        let optClass = '';
                        if (isCorrectOpt) optClass = 'correct-opt';
                        else if (isUserOpt && !isCorrect) optClass = 'wrong-opt';

                        return (
                          <div key={oIdx} className={`solution-opt ${optClass}`}>
                            <span>{['ক', 'খ', 'গ', 'ঘ'][oIdx]}. {opt}</span>
                            {isCorrectOpt && <span className="text-emerald text-xs"> (সঠিক উত্তর)</span>}
                            {isUserOpt && !isCorrect && <span className="text-danger text-xs"> (আপনার উত্তর)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="explanation-box">
                        <strong>ব্যাখ্যা:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="result-actions">
              <button className="btn btn-primary" onClick={onClose}>
                ফলাফল বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
