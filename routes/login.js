var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

var { OAuth2Client } = require('google-auth-library');

var GOOGLE_CLIENT_ID = require('../config/config').GOOGLE_CLIENT_ID;
var GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;

// =======================================
//  Autenticación de Google
// =======================================
app.post('/google', (req, res, next) => {
  var token = req.body.token || 'XXX';

  var client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_SECRET);

  client.verifyIdToken({ idToken: token }, function(e, login) {
    if (e) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Toke no valido',
        errors: e
      });
    }

    var payload = login.getPayload();
    var userid = payload['sub'];

    Usuario.findOne({ email: payload.email }, (err, usuario) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar usuario - login',
          errors: err
        });
      }
      if (usuario) {
        if (!usuario.google) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Debe usar su autenticación normal'
          });
        } else {
          // Crear un token!!!
          usuario.password = ':)';
          var token = jwt.sign({ usuario: usuario }, SEED, {
            expiresIn: 14400 // 4 horas
          });

          res.status(200).json({
            ok: true,
            usuario: usuario,
            token: token,
            id: usuario._id
          });
        }
      } else {
        // Si el usuario no existe por correo
        var usuario = new Usuario();
        usuario.nombre = payload.name;
        usuario.email = payload.email;
        usuario.password = ':)';
        usuario.img = payload.picture;
        usuario.google = true;

        usuario.save((err, usuarioDB) => {
          if (err) {
            return res.status(500).json({
              ok: false,
              mensaje: 'Error al crear usuario - google',
              errors: err
            });
          }

          var token = jwt.sign({ usuario: usuarioDB }, SEED, {
            expiresIn: 14400 // 4 horas
          });

          res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
          });
        });
      }
    });
  });
});

// =======================================
//  Autenticación normal
// =======================================
app.post('/', (req, res, next) => {
  var body = req.body;

  Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }

    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - email',
        errors: { message: 'Credenciales incorrectas - email' }
      });
    }

    if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - password',
        errors: { message: 'Credenciales incorrectas - password' }
      });
    }

    // Crear un token!!!
    usuarioDB.password = ':)';
    var token = jwt.sign({ usuario: usuarioDB }, SEED, {
      expiresIn: 14400 // 4 horas
    });

    res.status(200).json({
      ok: true,
      usuario: usuarioDB,
      token: token,
      id: usuarioDB._id
    });
  });
});

module.exports = app;
