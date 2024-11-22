const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'quiztest' 
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos exitosa');
});


// Endpoint para obtener las preguntas y respuestas del quiz
app.get('/quiz', (req, res) => {
    const sql = `
        SELECT p.idPregunta, p.textoPregunta, r.idRespuesta, r.textoRespuesta, r.esCorrecta
        FROM pregunta p
        JOIN respuesta r ON p.idPregunta = r.idPregunta
    `;
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener datos del quiz:', err);
            return res.status(500).send({ error: 'Error al obtener datos del quiz' });
        }
        
        res.status(200).json(results);
    });
});


// Endpoint para insertar preguntas y respuestas
app.post('/pregunta', (req, res) => {
    const { pregunta, respuestas } = req.body;

    if (!pregunta || !respuestas || !respuestas.length) {
        return res.status(400).send({ error: 'Faltan datos en la solicitud' });
    }

    // Insertar la pregunta en la tabla preguntas
    connection.query('INSERT INTO pregunta (textoPregunta) VALUES (?)', [pregunta], (err, results) => {
        if (err) {
            console.error('Error al insertar la pregunta:', err);
            return res.status(500).send({ error: 'Error al insertar la pregunta' });
        }

        const idPregunta = results.insertId;

        // Insertar todas las respuestas
        const respuestasQuery = 'INSERT INTO respuesta (idPregunta, textoRespuesta, esCorrecta) VALUES ?';
        const respuestasDatos = respuestas.map(respuesta => [
            idPregunta,
            respuesta.texto,
            respuesta.esCorrecta ? 1 : 0
        ]);

        connection.query(respuestasQuery, [respuestasDatos], (err) => {
            if (err) {
                console.error('Error al insertar las respuestas:', err);
                return res.status(500).send({ error: 'Error al insertar las respuestas' });
            }

            res.status(200).send({ message: 'Pregunta y respuestas insertadas correctamente' });
        });
    });
});

// Endpoint para poder actualizar los datos
app.put('/edicion/:id', (req, res) => {
    const idPregunta = req.params.id;
    const { textoPregunta, respuestas } = req.body;
  
    if (!textoPregunta || !respuestas || !respuestas.length) {
      return res.status(400).send({ error: 'Datos incompletos para actualizar' });
    }
  
    // Actualizar la pregunta
    const updatePreguntaQuery = 'UPDATE pregunta SET textoPregunta = ? WHERE idPregunta = ?';
    connection.query(updatePreguntaQuery, [textoPregunta, idPregunta], (err, results) => {
      if (err) {
        console.error('Error al actualizar la pregunta:', err);
        return res.status(500).send({ error: 'Error al actualizar la pregunta' });
      }
  
      // Actualizar las respuestas
      const updateRespuestaQuery = 'UPDATE respuesta SET textoRespuesta = ?, esCorrecta = ? WHERE idRespuesta = ?';
      
      respuestas.forEach((respuesta) => {
        const { idRespuesta, textoRespuesta, esCorrecta } = respuesta;
        connection.query(updateRespuestaQuery, [textoRespuesta, esCorrecta ? 1 : 0, idRespuesta], (err) => {
          if (err) {
            console.error('Error al actualizar la respuesta:', err);
          }
        });
      });
  
      res.status(200).send({ message: 'Pregunta y respuestas actualizadas correctamente' });
    });
});

//Endpoint para mostrar los datos a editar
app.get('/edicion', (req, res) => {
    const sql = `
        SELECT p.idPregunta, p.textoPregunta, r.idRespuesta, r.textoRespuesta, r.esCorrecta
        FROM pregunta p
        JOIN respuesta r ON p.idPregunta = r.idPregunta
    `;
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener preguntas y respuestas:', err);
            return res.status(500).send({ error: 'Error al obtener datos' });
        }
        
        const preguntas = results.reduce((acc, row) => {
            const { idPregunta, textoPregunta, idRespuesta, textoRespuesta, esCorrecta } = row;
            const preguntaIndex = acc.findIndex(p => p.idPregunta === idPregunta);
            
            const respuesta = { idRespuesta, textoRespuesta, esCorrecta };
            
            if (preguntaIndex >= 0) {
                acc[preguntaIndex].respuestas.push(respuesta);
            } else {
                acc.push({ idPregunta, textoPregunta, respuestas: [respuesta] });
            }
            return acc;
        }, []);
        
        res.json(preguntas);
    });
});

// Endpoint para eliminar solo una respuesta
app.delete('/edicion/respuesta/:idRespuesta', (req, res) => {
    const idRespuesta = req.params.idRespuesta;

    connection.query('DELETE FROM respuesta WHERE idRespuesta = ?', [idRespuesta], (err, results) => {
        if (err) {
            console.error('Error al eliminar la respuesta:', err);
            return res.status(500).send({ error: 'Error al eliminar la respuesta' });
        }

        res.status(200).send({ message: 'Respuesta eliminada correctamente' });
    });
});

// Endpoint para eliminar una pregunta y sus respuestas asociadas
app.delete('/pregunta/:id', (req, res) => {
    const idPregunta = req.params.id;

    // Primero, elimina las respuestas asociadas a la pregunta
    const deleteRespuestasQuery = 'DELETE FROM respuesta WHERE idPregunta = ?';
    
    connection.query(deleteRespuestasQuery, [idPregunta], (error) => {
        if (error) {
            console.error('Error al eliminar las respuestas:', error);
            return res.status(500).send('Error al eliminar las respuestas');
        }

        // Ahora elimina la pregunta
        const deletePreguntaQuery = 'DELETE FROM pregunta WHERE idPregunta = ?';
        connection.query(deletePreguntaQuery, [idPregunta], (error) => {
            if (error) {
                console.error('Error al eliminar la pregunta:', error);
                return res.status(500).send('Error al eliminar la pregunta');
            }

            res.status(200).send('Pregunta y respuestas eliminadas exitosamente');
        });
    });
});

// Endpoint para agregar una nueva respuesta a una pregunta
app.post('/edicion/respuesta', (req, res) => {
    const { idPregunta, textoRespuesta, esCorrecta } = req.body;

    if (!idPregunta || !textoRespuesta) {
        return res.status(400).send({ error: 'Faltan datos en la solicitud' });
    }

    const insertQuery = 'INSERT INTO respuesta (idPregunta, textoRespuesta, esCorrecta) VALUES (?, ?, ?)';
    connection.query(insertQuery, [idPregunta, textoRespuesta, esCorrecta ? 1 : 0], (err, results) => {
        if (err) {
            console.error('Error al insertar la respuesta:', err);
            return res.status(500).send({ error: 'Error al insertar la respuesta' });
        }

        res.status(200).send({ message: 'Respuesta agregada correctamente', idRespuesta: results.insertId });
    });
});

// Endpoint de prueba de conexión
app.get('/test-connection', (req, res) => {
    connection.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).send('Error en la conexión a la base de datos');
        }
        console.log('Resultado de la consulta:', results);
        res.status(200).send(`Conexión a la base de datos exitosa. Resultado: ${results[0].solution}`);
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});