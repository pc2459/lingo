var mongoose = require('mongoose');
var randomWords = require('random-words');
var _ = require('underscore');
var BeGlobal = require('node-beglobal');

//initialize the BeGlobal API
var beglobal = new BeGlobal.BeglobalAPI({
  api_token: '3zbqkhNwTlNJUohrcqX4uw%3D%3D'
});


var quizSchema = new mongoose.Schema({
  timestamp: {type: Date, default: Date.now},
  wrongs: {type: Number, default: 0},
  rights: {type: Number, default: 0},
  questionNumber: {type: Number, default: 0},
  questions: [ {word: String, translation: String} ],
  language : String
});

var Quiz = mongoose.model('Quiz', quizSchema);


var wordSchema = new mongoose.Schema({
  word: String,
  rights: {type: Number, default: 0},
  wrongs: {type: Number, default: 0}
});

var Word = mongoose.model('Word', wordSchema);


var generateVocabList = function(){
  return randomWords(10);
};

/////////////////////////////////////////////////////////////
// Generate a list of random words in the words collection //
// var vocabList = randomWords(500);                       //
// console.log(vocabList);                                 //
// _.each(vocabList,function(wordItem){                    //
//   var newWord = new Word({word: wordItem});             //
//   newWord.save(function(err){                           //
//     if(err){                                            //
//       console.error(err);                               //
//     }                                                   //
//   });                                                   //
// });                                                     //
//                                                         //
/////////////////////////////////////////////////////////////


var userSchema = new mongoose.Schema({
  name: String,
  quizzesPassed: {type: Number, default: 0},
  quizzesFailed: {type: Number, default: 0},
  quizzes : [quizSchema],
  vocabulary : [wordSchema]
});

var User = mongoose.model('User', userSchema);

// // Create a test user for testing
// var newUser = new User({name: 'Goddamnit'});
// newUser.save();

var getLangCodes = function(callback){
      // Pull down a list of all languages
    beglobal.languages.all(function(err,result){
      if (err) console.error(err);


      // Pull all from languages that are unique
      var languages = _.chain(result)
          .pluck('from')
          // .pluck('name')
          .uniq(function(language) { return language.name; })
          .sortBy(function(lang){ return lang.name;})
          .value();

      callback(languages);
    });
};

var getTranslation = function(word, fromLang, toLang, callback){

  beglobal.translations.translate(
    {text: word, from: fromLang, to: toLang},
    function(err, results){
      callback(err, results);
    }
  );
};



module.exports = {generateVocabList : generateVocabList,
                  Quiz : Quiz,
                  Word : Word,
                  User : User,
                  getLangCodes : getLangCodes,
                  getTranslation : getTranslation};







