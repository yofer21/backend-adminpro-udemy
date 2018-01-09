var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs');

var app = express();

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// default options
app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {
  var tipo = req.params.tipo;
  var id = req.params.id;

  // Tipos de coleccion
  var tiposValidos = ['hospitales', 'medicos', 'usuarios'];

  if (tiposValidos.indexOf(tipo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Tipo de coleccion no es válida',
      errors: { message: 'Tipo de coleccion no es válida' }
    });
  }

  if (!req.files) {
    return res.status(400).json({
      ok: false,
      mensaje: 'No seleccionó nada',
      errors: { message: 'Debe seleccionar una imagen' }
    });
  }

  // Obtener nombre del archivo
  var archivo = req.files.imagen;
  var nombreCortado = archivo.name.split('.');
  var extensionArchivo = nombreCortado[nombreCortado.length - 1];

  // Solo estas extensiones aceptamos
  var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

  if (extensionesValidas.indexOf(extensionArchivo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Extensión no válida',
      errors: {
        message: 'Las extensiones válidas son ' + extensionesValidas.join(', ')
      }
    });
  }

  // Nombre de archivo personalizado
  var nombreArchivo = `${id}-${new Date().getMilliseconds()}.${extensionArchivo}`;

  // Mover el archivo del temporal a un path
  var path = `./uploads/${tipo}/${nombreArchivo}`;

  archivo.mv(path, err => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al mover archivo',
        errors: err
      });
    }
  });

  subirPorTipo(tipo, id, nombreArchivo, res);

  /*   res.status(200).json({
    ok: true,
    mensaje: 'Archivo movido',
    extensionArchivo
  }); */
});

function subirPorTipo(tipo, id, nombreArchivo, res) {
  if (tipo === 'usuarios') {
    Usuario.findById(id, (err, usuario) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar usuario',
          errors: err
        });
      }
      if (!usuario) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Usuario no encontrado',
          errors: { message: 'Usuario no encontrado' }
        });
      }

      var pathViejo = './uploads/usuarios/' + usuario.img;

      // Si existe, elimina la imagen anterior
      if (fs.existsSync(pathViejo)) {
        fs.unlink(pathViejo);
      }

      usuario.img = nombreArchivo;

      usuario.save((err, usuarioActualizado) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar usuario',
            errors: err
          });
        }
        if (!usuarioActualizado) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Usuario no encontrado',
            errors: { message: 'Usuario no encontrado' }
          });
        }

        usuarioActualizado.password = ':)';

        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de usuario actualizada',
          usuario: usuarioActualizado
        });
      });
    });
  }
  if (tipo === 'medicos') {
    Medico.findById(id, (err, medico) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar medico',
          errors: err
        });
      }
      if (!medico) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Medico no encontrado',
          errors: { message: 'Medico no encontrado' }
        });
      }

      var pathViejo = './uploads/medicos/' + medico.img;

      // Si existe, elimina la imagen anterior
      if (fs.existsSync(pathViejo)) {
        fs.unlink(pathViejo);
      }

      medico.img = nombreArchivo;

      medico.save((err, medicoActualizado) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar medico',
            errors: err
          });
        }
        if (!medicoActualizado) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Medico no encontrado',
            errors: { message: 'Medico no encontrado' }
          });
        }

        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de medico actualizada',
          medico: medicoActualizado
        });
      });
    });
  }
  if (tipo === 'hospitales') {
    Hospital.findById(id, (err, hospital) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar hospital',
          errors: err
        });
      }
      if (!hospital) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Hospital no encontrado',
          errors: { message: 'Hospital no encontrado' }
        });
      }

      var pathViejo = './uploads/hospitales/' + hospital.img;

      // Si existe, elimina la imagen anterior
      if (fs.existsSync(pathViejo)) {
        fs.unlink(pathViejo);
      }

      hospital.img = nombreArchivo;

      hospital.save((err, hospitalActualizado) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar hospital',
            errors: err
          });
        }
        if (!hospitalActualizado) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Hospital no encontrado',
            errors: { message: 'Hospital no encontrado' }
          });
        }

        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de hospital actualizada',
          hospital: hospitalActualizado
        });
      });
    });
  }
}

module.exports = app;
