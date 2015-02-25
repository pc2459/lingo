var _ = require('underscore');
var model = require('../models/hugemodel.js');
var async = require('async');


var indexController = {
	index: function(req, res) {
		res.render('index');
	},

  translate: function(req,res){

    model.getLangCodes(function(languages){
      res.render('translate', { languages : languages } );
    });

  },

  getTranslation: function(req,res){

    var request = req.body;

    model.getTranslation(request.word, request.fromlanguage, request.targetlanguage,
      function(err, results){
        if (err){ console.log(err); }
        res.render('translate-result', {results: results});
    });
  },

  chooseQuizLang: function(req, res){

    model.getLangCodes(function(languages){
      // console.log(languages);
      res.render('init-quiz', { languages : languages } );
    });

  },

  startQuiz: function(req, res){
    //get the language
    request = req.body;

    //pluck 10 words from a database of random words, saving their translations
    //in the form {word: string, translation: string}
    var randomWords = model.generateVocabList();

    var asyncFunctions = randomWords.map(function(word){
      return function(onComplete){
        model.getTranslation(word, 'eng', request.chosenLanguage, function(err, result){
          onComplete(null, {
            word: word,
            translation: result.translation
          });
        });
      };
    });

    async.parallel(asyncFunctions, function(err, results){
      // Everything DONE
      console.log(err, results);
      var newQuiz = new model.Quiz({
        questions : results,
        language : request.chosenLanguage
      });

      newQuiz.save(function(err, result){

        res.redirect('/play/' + request.chosenLanguage);

      });


    });



  },

  playQuiz: function(req, res){
    model.Quiz.find().sort({ _id : -1 }).limit(1).exec(function(err, result){
      console.log(result[0].questions[result[0].questionNumber]);
      res.render('play-quiz', {
                        word : result[0].questions[result[0].questionNumber],
                        questionNumber : result[0].questionNumber
        }
      );
    });

  },


  answerQuiz: function(req, res){
    //the user's answer here
    var answer = req.body.answer;

    model.Quiz.find().sort({ _id : -1 }).limit(1).exec(function(err, result){

      var quiz = result[0];
      var quizID = result[0]._id;

      console.log(quiz.questionNumber);

      // Check if this is the tenth question
      if(quiz.questionNumber === 9){

        res.send({complete: true});
        return;
      }


      var correctAnswer = quiz.questions[quiz.questionNumber].translation;

      var messageToUser;
      if (answer === correctAnswer){
        messageToUser = "GOOD JOB";
      }
      else {
        messageToUser = correctAnswer;
      }

      model.Quiz.update({_id : quizID}, {$inc: {questionNumber:1}}, function(err){

        model.Quiz.findOne({_id: quizID}, function(err, result){
          var newQuestion = quiz.questions[result.questionNumber].word;

          res.send({
            messageToUser : messageToUser,
            newQuestion : newQuestion,
            newQuestionNumber : result.questionNumber +1
          });

        });

      });

      // Increment the questionNumber

      // Send the needed information down to the client: whether they were
      // right or wrong; the new question number; the new question
    });


  },

  progress: function(req, res){
    res.redirect('/');
  }

};

module.exports = indexController;