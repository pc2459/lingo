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
      //Get the quiz object out of the returned array
      var quiz = result[0];
      //Get the quiz ID
      var quizID = result[0]._id;
      //Get the question number we're on
      var questionNumber = quiz.questionNumber;
      //Keep track of whether the quiz is finished
      var complete = false;

      // Check to see if user has correct answer
      var correctAnswer = quiz.questions[quiz.questionNumber].translation;
      var messageToUser;
      if (answer === correctAnswer){
        messageToUser = "GOOD JOB";

        model.User.findOne({name: 'Goddamnit'}, function(err, user){

          console.log(user);

          // user.save();
        });

      }
      //if the answer was wrong, do something
      else {

        model.User.findOne({name: 'Goddamnit'}, function(err, user){

          console.log("Vocabulary:", user.vocabulary);
          //See if the word is in the vocabulary
          var hasWord = _.contains(user.vocabulary, function(wordObj){
              return wordObj.word === quiz.questions[quiz.questionNumber].word;
          });
          // If the user has the word..
          if (hasWord){

            user.vocabulary = _.map(user.vocabulary, function(wordObj){
              if(wordObj.word === quiz.questions[quiz.questionNumber].word){
                wordObj.wrongs++;
              }
              return wordObj;
            });

            console.log("Update a word in the vocab:", user.vocabulary);

          }
          // If this a new word...
          else {

            console.log('User:',user);
            var newWord = new model.Word({word: quiz.questions[quiz.questionNumber].word, wrongs : 1});
            console.log('New word:', newWord);
            user.vocabulary.push(newWord);

            console.log("Added a new word to the vocab:", user.vocabulary);

          }

          // user.save();
        });


        messageToUser = correctAnswer;
      }

      // Check if this is the tenth question and render the appropriate information
      if(questionNumber === 9){
          res.send({complete: true,
                    messageToUser : messageToUser});
          return;
      }

      // Update the question number
      model.Quiz.update({_id : quizID}, {$inc: {questionNumber:1}}, function(err){
        if(err) console.log(err);
      });
      questionNumber++;

      // Get the next question
      var newQuestion = quiz.questions[questionNumber].word;

      // Render
      res.send({
        messageToUser : messageToUser,
        newQuestion : newQuestion,
        newQuestionNumber : questionNumber +1
      });




    });

  },

  progress: function(req, res){
    res.redirect('/');
  }

};

module.exports = indexController;