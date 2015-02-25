var _ = require('underscore');
var model = require('../models/hugemodel.js');
var async = require('async');
var staticVocab = require('../models/wordList.js');


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
    // var randomWords = model.generateVocabList();
    var randomWords = staticVocab;

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
    var answer = req.body.clientAnswer;

    model.Quiz.find().sort({ _id : -1 }).limit(1).exec(function(err, result){
      //Get the quiz object out of the returned array
      var quiz = result[0];
      //Get the quiz ID
      var quizID = result[0]._id;
      //Get the question number we're on
      var questionNumber = quiz.questionNumber;
      //Keep track of whether the quiz is finished
      var complete = false;

      var messageToUser;

      // Check to see if user has correct answer
      var correctAnswer = quiz.questions[quiz.questionNumber].translation;

      console.log("User Answer:", answer);
      console.log("Correct Answer:", correctAnswer);

      // if answer is correct...
      if (answer === correctAnswer){
        messageToUser = "GOOD JOB";

        // Update the quiz with an additional right
        quiz.rights++;
        quiz.save();

        // Update the user's vocabulary list
        model.User.findOne({name: 'Goddamnit'}, function(err, user){
          var hasWord = _.contains(user.vocabulary, function(wordObj){
              return wordObj.word === quiz.questions[quiz.questionNumber].word;
          });
          // If the user has the word..
          if (hasWord){
            user.vocabulary = _.map(user.vocabulary, function(wordObj){
              if(wordObj.word === quiz.questions[quiz.questionNumber].word){
                wordObj.rights++;
              }
              return wordObj;
            });

          }
          // If this a new word...
          else {
            var newWord = new model.Word({word: quiz.questions[quiz.questionNumber].word, rights : 1});
            user.vocabulary.push(newWord);
          }

          user.save();
        });

      }
      //if the answer was wrong, do something
      else {

        // Update the quiz with an additional right
        quiz.wrongs++;
        quiz.save();

        model.User.findOne({name: 'Goddamnit'}, function(err, user){
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

          }
          // If this a new word...
          else {
            var newWord = new model.Word({word: quiz.questions[quiz.questionNumber].word, wrongs : 1});
            user.vocabulary.push(newWord);
          }
          user.save();
        });


        messageToUser = correctAnswer;
      }

      //Check if they've failed
      if(quiz.wrongs >= 3){
        model.User.findOneAndUpdate({name: 'Goddamnit'}, {$inc: {quizzesFailed : 1}}, function(err){
          if(err) console.log(err);
        });

        res.send({complete: true,
                  messageToUser : "YOU FAILED HA HA HA"});
        return;
      }

      // Check if this is the tenth question and render the appropriate information
      if(questionNumber === 9){

        model.User.findOneAndUpdate({name: 'Goddamnit'}, {$inc: {quizzesPassed : 1}}, function(err){
          if(err) console.log(err);
        });

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

    model.User.findOne({name: 'Goddamnit'}, function(err, user){

      var quizzesPassed = user.quizzesPassed;
      var quizzesFailed = user.quizzesFailed;
      var totalQuizzes = quizzesPassed + quizzesFailed;
      var percentPassed = quizzesPassed/(quizzesFailed+quizzesPassed) * 100;


      var correctWords = _.filter(user.vocabulary, function(word){ return word.rights >= 1; }).length;
      var wrongWords = _.filter(user.vocabulary, function(word){ return word.rights === 0; }).length;
      var totalWords = user.vocabulary.length;
      var percentWordsCorrect = correctWords/totalWords * 100;

      var best10 = _.sortBy(user.vocabulary, function(word){
        return -word.rights;
      }).slice(0,10);

      var worst10 = _.sortBy(user.vocabulary, function(word){
        return word.wrongs;
      }).slice(0,10);

      console.log(worst10);


      // Total number of quizzes
      // Number of quizzes passed
      // Number of quizzes failed
      // % of quizzes passed
      // Total number of words translated
      // Number of words correctly translated
      // Number of words incorrectly translated
      // % of words translated correctly
      // Best 10
      // Worst 10

      res.render('progress');



    });

  }

};

module.exports = indexController;