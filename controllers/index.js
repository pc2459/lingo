var _ = require('underscore');
var model = require('../models/hugemodel.js');


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
    var randomWords = [];

    _.each(_.range(10), function(){

      var rand = Math.floor(Math.random() * 500);
      model.Word.findOne().skip(rand).exec(function(err, result){
        if(err) console.err(err);

        randomWords.push(result.word);
        console.log(result);
        console.log("PLEASE PLEASE WORK:",randomWords);
      });

    });



    //initialise a new Quiz
    // var newQuiz = new Quiz({
    //   questions : questionsArray

    // });

    // newQuiz.save();

    res.redirect('quiz');
  }

};

module.exports = indexController;