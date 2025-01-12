import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './quiz.css';

export const QuizComponent = () => {
  const navigate = useNavigate();
  const quizContainerRef = useRef(null);
  const [quizData, setQuizData] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showResultBox, setShowResultBox] = useState(false); 
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/quiz", {
      method: "GET"
    })
      .then(response => response.json())
      .then(data => {
        const preguntasAgrupadas = data.reduce((acc, current) => {
          const existingPregunta = acc.find(item => item.idPregunta === current.idPregunta);
          if (existingPregunta) {
            existingPregunta.respuestas.push({
              idRespuesta: current.idRespuesta,
              textoRespuesta: current.textoRespuesta,
              esCorrecta: current.esCorrecta
            });
          } else {
            acc.push({
              idPregunta: current.idPregunta,
              textoPregunta: current.textoPregunta,
              respuestas: [{
                idRespuesta: current.idRespuesta,
                textoRespuesta: current.textoRespuesta,
                esCorrecta: current.esCorrecta
              }]
            });
          }
          return acc;
        }, []);
        setQuizData(preguntasAgrupadas);
      })
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  const handleButtonClick = () => {
    navigate('/');
  };

  const handleAnswerChange = (idPregunta, textoRespuesta) => {
    if (!showResults) {
      setSelectedAnswer({
        ...selectedAnswer,
        [idPregunta]: textoRespuesta
      });
    }
  };

  const fireConfetti = () => {
    var count = 300;
    var defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    let correctCount = 0;
    const newCorrectAnswers = {};

    quizData.forEach((pregunta) => {
      const answer = selectedAnswer[pregunta.idPregunta];
      const respuestaCorrecta = pregunta.respuestas.find(respuesta => respuesta.esCorrecta);
      
      if (respuestaCorrecta && respuestaCorrecta.textoRespuesta === answer) {
        correctCount++;
        newCorrectAnswers[pregunta.idPregunta] = true; 
      } else {
        newCorrectAnswers[pregunta.idPregunta] = false;
      }
    });

    setCorrectCount(correctCount);
    setCorrectAnswers(newCorrectAnswers);
    setShowResults(true);
    setShowResultBox(true);  

    if (correctCount === quizData.length) {
      fireConfetti();
    }
  };

  const handleRestartQuiz = () => {
    const isMobile = window.innerWidth <= 768; // Verifica si es móvil
    if (isMobile) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        setSelectedAnswer({});
        setCorrectCount(0);
        setCorrectAnswers({});
        setShowResults(false);
        setShowResultBox(false);
        setTimeout(() => {
          setIsAnimating(false);
          document.body.style.overflow = 'auto';
        }, 50);
      }, 800);
    } else {
      // Reinicio sin animación para pantallas más grandes
      setSelectedAnswer({});
      setCorrectCount(0);
      setCorrectAnswers({});
      setShowResults(false);
      setShowResultBox(false);
    }
  };

  const allQuestionsAnswered = Object.keys(selectedAnswer).length === quizData.length;

  return (
    <div className='quiz-body'>
      <div className='header-quiz'></div>
      <div className="quiz-container" ref={quizContainerRef}>
        <button onClick={handleButtonClick} className="btn btn-primary volver-button">Volver</button>
        <h1 className='title'>Quiz</h1>
        {quizData.length > 0 ? (
          <>
            {quizData.map((item, index) => {
              const respuestaCorrecta = item.respuestas.find(respuesta => respuesta.esCorrecta);
              const respuestaCorrectaTexto = respuestaCorrecta ? respuestaCorrecta.textoRespuesta : "";

              return (
                <div 
                  key={index} 
                  className={`question-wrapper border-5 color bg 
                    ${showResults && correctAnswers[item.idPregunta] === true ? 'correct-answer' : ''} 
                    ${showResults && correctAnswers[item.idPregunta] === false ? 'incorrect-answer' : ''}
                    ${isAnimating ? 'sliding-out' : 'sliding-in'}`}
                  style={{
                    animationDelay: isAnimating ? `${index * 0.1}s` : `${index * 0.2}s`
                  }}
                >
                  <p className="question-text">{`Pregunta ${index + 1} ${item.textoPregunta}`}</p>
                  <div className="centrar">
                    {item.respuestas && item.respuestas.length > 0 ? (
                      item.respuestas.map((answerItem, answerIndex) => (
                        <div 
                          key={answerIndex} 
                          className={`option ${selectedAnswer[item.idPregunta] === answerItem.textoRespuesta ? 'selected' : ''} ${showResults && respuestaCorrectaTexto === answerItem.textoRespuesta ? 'correct-highlight' : ''} ${showResults ? 'disabled' : ''}`}
                          onClick={() => handleAnswerChange(item.idPregunta, answerItem.textoRespuesta)}
                        >
                          <input
                            type="radio"
                            id={`option${item.idPregunta}-${answerIndex}`}
                            name={`answer${item.idPregunta}`}
                            value={answerItem.textoRespuesta}
                            checked={selectedAnswer[item.idPregunta] === answerItem.textoRespuesta}
                            readOnly
                          />
                          <label htmlFor={`option${item.idPregunta}-${answerIndex}`}>
                            <span className='text-primary'>{answerItem.textoRespuesta}</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p>No hay respuestas disponibles.</p>
                    )}
                  </div>
                </div>
              );
            })}

            {showResultBox && (
              <div className={`result-box ${correctCount === quizData.length ? 'festejo' : ''}`}>
                <p>Respondiste Correctamente</p>
                <button className="close-button" onClick={() => setShowResultBox(false)}>
                  &times;
                </button>
                <p>{correctCount}/{quizData.length} preguntas.</p>
              </div>
            )}

            <div className="buttons-container">
              <button 
                className="btn btn-danger restart" 
                onClick={handleRestartQuiz}
              >
                Reiniciar <span className='ocultarTexto'>Quiz</span>
              </button>

              <button
                className="btn btn-success final"
                onClick={handleFinalSubmit}
                disabled={!allQuestionsAnswered}
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <p>Cargando preguntas...</p>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;