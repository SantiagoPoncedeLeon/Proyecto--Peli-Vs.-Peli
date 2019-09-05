var con = require('./lib/conexionbd');

function competencias(req, res) {
    var sql = "select * from competencia"
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }
        res.send(resultado);
    });
}

function datoCompetencia(req,res, response){                       //Devuelve los datos de una competencia
    
    var sql = "select * from competencia where competencia.id="+ req.params.id; //El primer query devuelve todos los datos de la competencia 
    con.query(sql, function(error, resultado, fields) {
        if (error || (resultado[0] === undefined)) {
            if (error) {console.log("Hubo un error en la consulta", error.message);}
            return res.status(404).send("Hubo un error en la consulta");
        }
        var response ={
            nombre : resultado[0].nombre
        }
        //Si la competencia tiene definido un genero, actor o director, hay que buscar el nombre correspondiente a la id que posee la competencia
        //Se debe hacer un segundo query porque primero hay que saber con que tablas debo unir a la competencia, si no tiene un valor definido la base no devuelve nada cuando en realidad necesitamos todo
        //Se definen una serie de condicionales para armar el query necesario, considerando que la competencia puede tener cualquier combinacion de actor, director y genero
        if (resultado[0].genero_id != null || resultado[0].director_id != null || resultado[0].actor_id != null){

            var queryColumn = "";
            var queryJoin = "";
            if (resultado[0].genero_id != null){
                queryColumn += "genero.nombre as genero ";
                queryJoin += "join genero on genero.id = competencia.genero_id ";
            }
            if (resultado[0].director_id != null){
                if (resultado[0].genero_id != null){queryColumn += ",";}
                queryColumn += "director.nombre as director ";
                queryJoin += "join director on director.id = competencia.director_id ";
            }
            if (resultado[0].actor_id != null){
                if (resultado[0].genero_id != null || resultado[0].director_id != null){queryColumn += ",";}
                queryColumn += "actor.nombre as actor ";
                queryJoin += "join actor on actor.id = competencia.actor_id ";
            }

            var sql2 = "select " + queryColumn + "from competencia " + queryJoin + "where competencia.id="+ req.params.id;
            con.query(sql2, function(error, resultado, fields) {
                if (error) {
                    console.log("Hubo un error en la consulta", error.message);
                    return res.status(404).send("Hubo un error en la consulta");
                }
                response.genero_nombre = resultado[0].genero;
                response.actor_nombre = resultado[0].actor;
                response.director_nombre = resultado[0].director;
                res.send(response);
            });
        }
        //Si la competencia no tiene genero, actor o director asociado, devuelve solo el nombre
        else{
        res.send(response);
        }
    });
}

function opciones(req, res) {           //Devuelve dos peliculas para votar en una competencia

    var sql = "select pelicula.id as id,pelicula.titulo as titulo,pelicula.poster as poster from pelicula join competencia_pelicula on pelicula.id=competencia_pelicula.pelicula_id where competencia_pelicula.competencia_id=" +req.params.id+ " ORDER BY RAND() limit 2";

    con.query(sql, function(error, resultado, fields) {
        if (error || (resultado[0] === undefined)) {
            if (error) {console.log("Hubo un error en la consulta", error.message);}
            return res.status(404).send("Hubo un error en la consulta");
        }
        var response = {
            'peliculas': resultado
        };
        ObtenerNombreCompetencia(req, res, response);
    });
}

function ObtenerNombreCompetencia(req,res, response){                       //Devuelve el nombre de la competencia
    var sql = "select nombre from competencia where id="+ req.params.id;
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }
        response.competencia = resultado[0].nombre;
        res.send(response);
    });
}


function voto(req, res) {                           //Agrega un voto a la pelicula seleccionada en la competencia correspondiente
    var sql = "update competencia_pelicula set votos = votos + 1 where competencia_id=" + req.params.id + " AND pelicula_id=" + req.body.idPelicula;
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }

        res.send(resultado);
    });
}

function resultados(req, res) {                     //Devuelve las tres peliculas con mas votos para la competencia correspondiente
    var sql = "select competencia_pelicula.pelicula_id,pelicula.poster,pelicula.titulo,competencia_pelicula.votos from competencia_pelicula,pelicula where competencia_pelicula.pelicula_id = pelicula.id and competencia_pelicula.competencia_id ="+ req.params.id +  " order by votos desc limit 3";
    
    con.query(sql, function(error, resultado, fields) {
        if (error || (resultado[0] === undefined)) {
            if (error) {console.log("Hubo un error en la consulta", error.message);}
            return res.status(404).send("Hubo un error en la consulta");
        }
         var response = {
            'resultados': resultado
        };
        ObtenerNombreCompetencia(req, res, response);
    });
}

function crear(req, res) {                  //Se realiza el query para crear una nueva competencia

    if(req.body.nombre.length<4){
        return res.status(422).json("El nombre de la competencia debe tener, al menos, 4 caracteres")
    }
    
    var datos = '"' + req.body.nombre + '"';
    var columns = "nombre";
    if (req.body.actor!=='0'){
        datos = datos + "," + req.body.actor;
        columns = columns + ",actor_id";
    }
    if (req.body.director!=='0'){
        datos = datos + "," + req.body.director;
        columns = columns + ",director_id";
    }
    if (req.body.genero !=='0'){
        datos = datos + "," + req.body.genero;
        columns = columns + ",genero_id";
    }

    var sql = 'INSERT INTO competencia (' + columns + ') values (' + datos + ')';
    
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        CargarPelisACompetencia(req,res,resultado);
    });
}

function CargarPelisACompetencia(req,res,resultado){            //Se realiza un segundo query donde se cargan a la tabla competencia_pelicula todas las peliculas que cumplen las condiciones seleccionadas
    var whereQuery = "";
    var join = "";
    var competenciaId = resultado.insertId;
    if (req.body.actor !=='0'){
        whereQuery = " WHERE actor_pelicula.actor_id = " + req.body.actor;
        join = "join actor_pelicula on actor_pelicula.pelicula_id=pelicula.id "; 
    }
    if (req.body.director !=='0'){
        join = join + "join director_pelicula on director_pelicula.pelicula_id=pelicula.id ";
        if (whereQuery === ""){
            whereQuery = " WHERE director_pelicula.director_id = " + req.body.director; 
        }
        else{
            whereQuery = whereQuery + " AND director_pelicula.director_id = " + req.body.director; 
        }
    }
    if (req.body.genero !=='0'){
        if (whereQuery === ""){
            whereQuery = " WHERE pelicula.genero_id = " + req.body.genero; 
        }
        else{
            whereQuery = whereQuery + " AND pelicula.genero_id = " + req.body.genero; 
        }
    }
    var sql = 'INSERT INTO competencia_pelicula (competencia_id,pelicula_id,votos) SELECT competencia.id,pelicula.id,0 from competencia,pelicula '+ join + whereQuery +' AND competencia.id = ' + competenciaId;
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        if (resultado.affectedRows === 0)           //Si no hay peliculas que cumplan las condiciones, hay que elimininar la competencia, pues no tiene sentido que exista
        {
            var sql = "DELETE FROM competencia WHERE id="+competenciaId;
            con.query(sql, function(error, resultado, fields) {
                if (error) {
                    console.log("Hubo un error en la consulta", error.message);
                    return res.status(500).send("Hubo un error en la consulta");
                }
                res.status(422).json("No hay peliculas que cumplan las condiciones");
            });
        }
        else{
        res.send(resultado);
        }
    });
}

function BorrarVoto(req, res) {                     //Se realiza un query para reiniciar los votos de una competencia
    var sql = 'UPDATE competencia_pelicula SET votos=0 WHERE competencia_id='+req.params.id;
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        res.send(resultado);
    });
}

//funciones que devuelven las listas de datos cargados en la base de datos (generos, directores y actores)
function generos(req, res) {
    var sql = "select * from genero";
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }
        res.send(resultado);
    });
}

function directores(req, res) {
    var sql = "select * from director";
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }
        res.send(resultado);
    });
}

function actores(req, res) {
    var sql = "select * from actor";
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }
        res.send(resultado);
    });
}

function BorrarCompetencia(req, res) {                          //Se realiza el query para eliminar la competencia de la base de datos, antes se debe limpiar la tabla competencia_pelicula
    var sql = "DELETE FROM competencia_pelicula WHERE competencia_id="+req.params.id;
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        var sql = "DELETE FROM competencia WHERE id="+req.params.id;
        con.query(sql, function(error, resultado, fields) {
            if (error) {
                console.log("Hubo un error en la consulta", error.message);
                return res.status(500).send("Hubo un error en la consulta");
            }
            res.send(resultado);
        });
    });
    
}

function editar(req, res) {                             //Cambia el nombre de una competencia
    var sql = 'UPDATE competencia SET nombre=("'+req.body.nombre+'") WHERE id='+req.params.id;
    con.query(sql, function(error, resultado, fields) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        res.send(resultado);
    });
}

module.exports = { 
    competencias: competencias,
    datoCompetencia: datoCompetencia,
    opciones: opciones,
    voto: voto,
    resultados: resultados,
    crear: crear,
    BorrarVoto: BorrarVoto,
    generos: generos,
    directores: directores,
    actores: actores,
    BorrarCompetencia: BorrarCompetencia,
    editar: editar
}
