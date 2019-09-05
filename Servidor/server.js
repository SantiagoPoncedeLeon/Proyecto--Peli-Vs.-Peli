//paquetes necesarios para el proyecto
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

//Controlador
var con = require('./controlador');

var app = express();

app.use(cors());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//Defino las funciones que reciben los pedidos HTTP

app.get('/competencias', con.competencias);                   //carga las competencias
app.get('/competencias/:id', con.datoCompetencia);            //carga los datos de una competencia
app.get('/competencias/:id/peliculas', con.opciones);         //devuelve dos peliculas para votar en la competencia
app.get('/competencias/:id/resultados', con.resultados);      //muestra los resultados de la competencia

app.post('/competencias', con.crear);                         //crea una nueva competencia
app.post('/competencias/:id/voto', con.voto);                 //agrega votos a una competencia

app.delete('/competencias/:id/votos', con.BorrarVoto);        //Reinicia los votos de una competencia
app.delete('/competencias/:id', con.BorrarCompetencia);       //Elimina una competencia

app.put('/competencias/:id', con.editar);                     //Edita una competencia

app.get('/generos', con.generos);                             //Devuelve los generos disponibles en la base de datos
app.get('/directores', con.directores);                       //Devuelve los directores disponibles en la base de datos
app.get('/actores', con.actores);                             //Devuelve los actores disponibles en la base de datos

//seteamos el puerto en el cual va a escuchar los pedidos la aplicación
var puerto = '8080';

app.listen(puerto, function () {
  console.log( "Escuchando en el puerto " + puerto );
});