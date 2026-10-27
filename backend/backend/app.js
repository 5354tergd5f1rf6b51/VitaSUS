var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var pacienteRouter = require('./routes/paciente');
var profissionalRouter = require('./routes/profissional');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/pacientes', pacienteRouter);
app.use('/profissionais', profissionalRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);

  // A API responde em JSON; só as demais rotas renderizam a página de erro.
  if (/^\/(pacientes|profissionais)(\/|$)/.test(req.originalUrl)) {
    var invalido = err.type === 'entity.parse.failed';
    if (invalido) res.status(400);
    return res.json({ error: invalido ? 'Corpo da requisição inválido.' : (err.status === 404 ? 'Rota não encontrada.' : 'Erro interno.') });
  }

  // render the error page
  res.render('error');
});

module.exports = app;
