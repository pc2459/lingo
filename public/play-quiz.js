// CLIENT SIDE CODE

$(document).on('ready', function(){


  // Handling a form submission
  $('#answerForm').on('submit', function(e){
    // Prevent form from actually submitting itself
    e.preventDefault();

    // Get our actual typed message from input
    var answer = $('#answer').val();

    // Build an object using that message to send
    // to the server
    var answerFromClient = {
      clientAnswer: answer
    };

    // Send the data to the server via a POST request
    // and attach the data object.
    $.post('/answerSubmit', answerFromClient, function(serverAnswer){
      console.log('Server:', serverAnswer);
      if(serverAnswer.complete) {
        // window.location.href = '/progress'
        // $('#response').hide();
        $('#word').hide();
        $('#questionNumber').hide();
        $('#answerForm').hide();
        $('#results').removeClass('invisible');
        $('#response').text(serverAnswer.messageToUser);
      }
      else {

        // Update the DOM
        $('#response').text(serverAnswer.messageToUser);
        $('#word').text(serverAnswer.newQuestion);
        $('#questionNumber').text('Question Number ' + serverAnswer.newQuestionNumber);
      }
    });
  });
});