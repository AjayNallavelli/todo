Parse.Cloud.define('sendPN', function(request, response) {
  var data = request.params;
  Parse.Cloud.httpRequest({
    url: 'https://gcm-http.googleapis.com/gcm/send',
    body: data,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'key=' + 'INSERT ANDROID GCM KEY HERE'
    }
  }).then(response.success, response.error);
});
