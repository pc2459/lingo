var mongoose = require('mongoose');


var quizSchema = new mongoose.Schema({
  wrongs: Number,
  rights: Number,
  questionNumber: Number,
  questions: [ {word: String, translation: String}]
});

var Quiz = new mongoose.model('Quiz', quizSchema);


var wordSchema = new mongoose.Schema({
  word: String,
  rights: {type: Number, default: 0},
  wrongs: {type: Number, default: 0}
});

var Word = new mongoose.model('Word', wordSchema);

var userSchema = new mongoose.Schema({
  quizzesPassed: Number,
  quizzesFailed: Number,
  currentQuiz : Quiz,
  vocabulary : [Word]
});

var User = new mongoose.model('User', userSchema);
