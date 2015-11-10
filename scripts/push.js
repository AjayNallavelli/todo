var Parse = require('parse/node').Parse;

Parse.initialize(
    'VDhhLoxsxxX6XIxMfTr66guz1bzzZ3kr9p40wxbI',
    'ytT40Ghe8DFaUQ5Ni7fx7Az90VxNGXFFdjjdl2eF');

var options = {
  to: process.argv[2],
  data: {
    title: 'ToDo',
    message: 'Hello World!'
  }
};

Parse.Cloud.run('sendPN', options).then(function(response) {
  console.log('success', response);
}, function(response) {
  console.log('failure', response);
});
