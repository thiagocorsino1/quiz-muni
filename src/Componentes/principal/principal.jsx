import './principal.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrincipalComponent = () => {
    const navigate = useNavigate();
    const handleButtonClick = () => {
        navigate('/Quiz');
    };
    const handleButton1Click = () => {
        navigate('/GestionPreguntas');
    };

    return (
        <div className='Principal bg-primary' style={{ color: 'white' }}>
            <header className='Principal-header'>
                <h1 className='Principal-titulo'>
                    Quiz Municipalidad
                </h1>
                <button onClick={handleButtonClick} className="btn btn-primary">Empezar Quiz</button>
            <button onClick={handleButton1Click} className='btn btn-info'>Gestionar preguntas</button>
            </header>
        </div>
    ); 
}
