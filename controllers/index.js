var _ = require('underscore');
var BeGlobal = require('node-beglobal');

//initialize the BeGlobal API
var beglobal = new BeGlobal.BeglobalAPI({
  api_token: '3zbqkhNwTlNJUohrcqX4uw%3D%3D'
});


var indexController = {
	index: function(req, res) {
		res.render('index');
	},

  translate: function(req,res){


    // Pull down a list of all languages
    beglobal.languages.all(function(err,result){
      if (err) console.error(err);


      // Pull all from languages that are unique
      var fromLangs = _.chain(result)
          .pluck('from')
          .pluck('name')
          .uniq()
          .sortBy(function(lang){ return lang;})
          .value();

      // Pull all to languages that are unique
      var toLangs = _.chain(result)
          .pluck('to')
          .pluck('name')
          .uniq()
          .sortBy(function(lang){ return lang;})
          .value();


      // Pass it to Jade
      res.render('translate', { fromLangs : fromLangs,
                                toLangs : toLangs } );
    });


  },

  getTranslation: function(req,res){

    var request = req.body;
    console.log("THE REQUEST BODY:", request);

    beglobal.languages.all(function(err,result){

      // Look up the code of the from language

      var fromLang = _.chain(result)
                      .pluck('from')
                      .find(function(lang){
                        // console.log(request.fromlanguage);
                        return lang.name === request.fromlanguage; })
                      // .pluck('code')
                      .value();

      console.log(fromLang.code);


      // Look up the code of the to language

      var toLang = _.chain(result)
                      .pluck('to')
                      .find(function(lang){
                        // console.log(request.fromlanguage);
                        return lang.name === request.targetlanguage; })
                      // .pluck('code')
                      .value();


      console.log(fromLang.code, toLang.code);

      beglobal.translations.translate(

        {text: request.word, from: fromLang.code, to: toLang.code},
        function(err, results) {
          if (err) {
            console.log(err);
            res.render('translate-result');
          }

          console.log(results);
          res.render('translate-result', {results: results});
        }
      );

    });






  }

};

module.exports = indexController;