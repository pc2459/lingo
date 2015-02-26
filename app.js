var express = require('express');
var bodyParser = require('body-parser');
var indexController = require('./controllers/index.js');
var quizController = require('./controllers/quiz.js');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/lingo');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', indexController.index);
app.get('/translate', indexController.translate);
app.post('/get-translation', indexController.getTranslation);
app.get('/quiz', quizController.chooseQuizLang);
app.post('/quiz', quizController.startQuiz);
app.get('/play/:langcode', quizController.playQuiz);
app.post('/answerSubmit', quizController.answerQuiz);
app.get('/progress', quizController.progress);


var server = app.listen(6873, function() {
	console.log('Express server listening on port ' + server.address().port);
});
