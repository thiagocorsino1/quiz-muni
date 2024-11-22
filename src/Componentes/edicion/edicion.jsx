import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './edicion.css';

const EdicionComponent = () => {
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hayCambios, setHayCambios] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/edicion')
      .then((response) => response.json())
      .then((data) => {
        const preguntasConEstado = data.map(pregunta => ({
          ...pregunta,
          respuestas: pregunta.respuestas.map(respuesta => ({
            ...respuesta,
            eliminada: false
          }))
        }));
        setPreguntas(preguntasConEstado);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al cargar las preguntas:', error);
        setLoading(false);
      });
  }, []);

  const handleRespuestaChange = (preguntaIndex, respuestaIndex, nuevoTexto) => {
    const updatedPreguntas = [...preguntas];
    updatedPreguntas[preguntaIndex].respuestas[respuestaIndex].textoRespuesta = nuevoTexto; 
    setPreguntas(updatedPreguntas);
    setHayCambios(true); 
  };

  const handlePreguntaChange = (preguntaIndex, nuevoTexto) => {
    const updatedPreguntas = [...preguntas];
    updatedPreguntas[preguntaIndex].textoPregunta = nuevoTexto;
    setPreguntas(updatedPreguntas);
    setHayCambios(true); 
  };

  const handleCorrectaChange = (preguntaIndex, respuestaIndex) => {
    const updatedPreguntas = [...preguntas];
    updatedPreguntas[preguntaIndex].respuestas.forEach((respuesta, index) => {
      respuesta.esCorrecta = index === respuestaIndex;
    });

    setPreguntas(updatedPreguntas);
    setHayCambios(true);
  };

  const handleEliminarRespuesta = (preguntaIndex, respuestaIndex) => {
    const respuesta = preguntas[preguntaIndex].respuestas[respuestaIndex];
    
    if (respuesta.esCorrecta) {
      alert("No puede eliminar una respuesta marcada como correcta.");
      return;
    }
    const updatedPreguntas = [...preguntas];
    updatedPreguntas[preguntaIndex].respuestas[respuestaIndex].eliminada = true;
    setPreguntas(updatedPreguntas);
    setHayCambios(true);
  };
  

  const handleAgregarRespuesta = (preguntaIndex) => {
    const updatedPreguntas = [...preguntas];
    const nuevaRespuesta = { textoRespuesta: '', esCorrecta: false, eliminada: false };
    updatedPreguntas[preguntaIndex].respuestas.push(nuevaRespuesta);
    setPreguntas(updatedPreguntas);
    setHayCambios(true);
  };

  const handleGuardarCambios = (idPregunta) => {
    if (!hayCambios) {
      alert('No se modificó nada');
      return; 
    }

    if (window.confirm('¿Estás seguro de que deseas guardar los cambios?')) {
      const pregunta = preguntas.find((p) => p.idPregunta === idPregunta);

      fetch(`http://localhost:3001/edicion/${idPregunta}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pregunta),
      })
      .then((response) => response.json())
      .then(() => {
        const updatedPreguntas = [...preguntas];

        pregunta.respuestas.forEach((respuesta) => {
          if (respuesta.eliminada) {
            fetch(`http://localhost:3001/edicion/respuesta/${respuesta.idRespuesta}`, {
              method: 'DELETE',
            })
            .catch(error => {
              console.error('Error al eliminar la respuesta:', error);
            });
          } else if (!respuesta.idRespuesta) {
            // Nueva respuesta
            fetch('http://localhost:3001/edicion/respuesta', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                idPregunta: idPregunta, 
                textoRespuesta: respuesta.textoRespuesta,
                esCorrecta: respuesta.esCorrecta,
              }),
            })
            .then(response => response.json())
            .then((newRespuesta) => {
              const respuestaIndex = updatedPreguntas.findIndex(p => p.idPregunta === idPregunta);
              updatedPreguntas[respuestaIndex].respuestas.forEach((res, index) => {
                if (!res.idRespuesta && index === respuestaIndex) {
                  res.idRespuesta = newRespuesta.idRespuesta; 
                }
              });
              setPreguntas(updatedPreguntas); 
            })
            .catch(error => {
              console.error('Error al guardar la nueva respuesta:', error);
            });
          }
        });

        alert('Cambios guardados');
        setHayCambios(false); 
      })
      .catch((error) => {
        console.error('Error al guardar los cambios:', error);
      });
    }
  };

  const handleEliminarPregunta = (idPregunta) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
      fetch(`http://localhost:3001/pregunta/${idPregunta}`, {
        method: 'DELETE',
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al eliminar la pregunta');
        }
        setPreguntas((prevPreguntas) =>
          prevPreguntas.filter((pregunta) => pregunta.idPregunta !== idPregunta)
        );
        alert('Pregunta eliminada correctamente');
      })
      .catch((error) => {
        console.error('Error al eliminar la pregunta:', error);
      });
    }
  };

  const handleButtonClickVolver = () => {
    navigate('/GestionPreguntas');
  }; 

  if (loading) return <p className="loading">Cargando preguntas...</p>;

  return (
    <div className="edicion-container">
      <button onClick={handleButtonClickVolver} className="btn btn-primary volver-button">Volver</button>
      <h1 className="titulo">Editar Preguntas</h1>
      {preguntas.map((pregunta, preguntaIndex) => (
        <div key={pregunta.idPregunta} className="pregunta-card border-5 color">
  <label className="texto">Pregunta</label>
  <input
    type="text"
    value={pregunta.textoPregunta}
    onChange={(e) => handlePreguntaChange(preguntaIndex, e.target.value)}
    className="pregunta-input"
  />
  <button onClick={() => handleEliminarPregunta(pregunta.idPregunta)} className="btn btn-outline-danger eliminarP-button">
    Eliminar
  </button>
  
  <label className="texto">Respuestas</label>
  {pregunta.respuestas.map((respuesta, respuestaIndex) => (
    !respuesta.eliminada && ( 
      <div key={respuesta.idRespuesta || respuestaIndex} className="respuesta-group">
        <input
          type="text"
          value={respuesta.textoRespuesta}
          onChange={(e) => handleRespuestaChange(preguntaIndex, respuestaIndex, e.target.value)}
          className="respuesta-input"
        />
        <div className="botones-group">
          <label>
            <input className='posicion'
              type="radio"
              name={`correcta-${pregunta.idPregunta}`}
              checked={respuesta.esCorrecta}
              onChange={() => handleCorrectaChange(preguntaIndex, respuestaIndex)}
            />
            Es correcta
          </label>
          {pregunta.respuestas.filter(res => !res.eliminada).length > 2 && (
            <button onClick={() => handleEliminarRespuesta(preguntaIndex, respuestaIndex)} className="btn btn-outline-danger eliminar-button">
              Eliminar
            </button>
          )}
        </div>
      </div>
    )
  ))}
          <div className="button-container">
            <button onClick={() => handleAgregarRespuesta(preguntaIndex)} className="btn btn-outline-info agregar-button">
              Agregar Respuesta
            </button>
            <button onClick={() => handleGuardarCambios(pregunta.idPregunta)} className="btn btn-outline-primary guardar-button">
              Guardar Cambios
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EdicionComponent;
