import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './pregunta.css';

function GestionPreguntas() {
  const [pregunta, setPregunta] = useState('');
  const [respuestas, setRespuestas] = useState([
    { texto: '', esCorrecta: false },
    { texto: '', esCorrecta: false }
  ]);
  const navigate = useNavigate();

  

  const handleAddRespuesta = () => {
    setRespuestas([...respuestas, { texto: '', esCorrecta: false }]);
  };

  const handleRespuestaChange = (index, event) => {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[index].texto = event.target.value;
    setRespuestas(nuevasRespuestas);
  };

  const handleEsCorrectaChange = (index) => {
    const nuevasRespuestas = respuestas.map((respuesta, i) => ({
      ...respuesta,
      esCorrecta: i === index
    }));
    setRespuestas(nuevasRespuestas);
  };

  const handleDeleteRespuesta = (index) => {
    const nuevasRespuestas = respuestas.filter((_, i) => i !== index);
    setRespuestas(nuevasRespuestas);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hayRespuestaCorrecta = respuestas.some(respuesta => respuesta.esCorrecta);
    if (!hayRespuestaCorrecta) {
      alert('Debes seleccionar al menos una respuesta como correcta.');
      return;
    }

    const datos = {
      pregunta,
      respuestas,
    };

    fetch('http://localhost:3001/pregunta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
      mode: 'cors',
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al guardar los datos');
      }
      return response.json();
    })
    .then(data => {
      alert('Pregunta y respuestas guardadas correctamente');
      
      setPregunta('');
      setRespuestas([{ texto: '', esCorrecta: false }, { texto: '', esCorrecta: false }]);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Hubo un error al guardar los datos');
    });
  };

  const handleButtonClick = () => {
    navigate('/');
  };

  const handleButtonClickEdicion = () => {
    navigate('/Edicion');
  };

  return (
    <div className="form-container border-5 rounded-4.5 color">
      <button className="btn btn-primary volver-button" onClick={handleButtonClick} >Volver</button> 
      <button className="btn btn-info editar" onClick={handleButtonClickEdicion}>Editar Preguntas</button>
      <h1 className="header">Gestión de las Preguntas</h1>
      <h2 className="subheader">Ingresar Pregunta</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            id="pregunta"
            className="inputq"
            placeholder="¿Cuál es el animal más pesado del mundo?"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            required
          />
        </div>
        <h3 className="subheader">Ingresar Respuestas</h3>
        {respuestas.map((respuesta, index) => (
          <div className="input-group" key={index}>
            <input
              type="text"
              className="inputq"
              placeholder="Respuesta"
              value={respuesta.texto}
              onChange={(e) => handleRespuestaChange(index, e)}
              required
            />
            <div className="respuesta-container">
              <label>
                <input
                  className='text-primary'
                  type="radio"
                  name="esCorrecta"
                  checked={respuesta.esCorrecta}
                  onChange={() => handleEsCorrectaChange(index)}
                />
                Es correcta
              </label>
              {respuestas.length > 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleDeleteRespuesta(index)}
                    className="btn btn-danger delete-button"
                  >
                    Eliminar
                  </button> 
                </>
              )}
            </div>
          </div>
        ))}
        <button className="btn btn-info button" type="button" onClick={handleAddRespuesta}>Agregar otra respuesta</button>
        <button className="btn btn-primary button" type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default GestionPreguntas;
