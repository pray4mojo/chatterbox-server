var handler = require('../request-handler');
var expect = require('chai').expect;
var stubs = require('./Stubs');

// Conditional async testing, akin to Jasmine's waitsFor()
// Will wait for test to be truthy before executing callback
var waitForThen = function (test, cb) {
  setTimeout(function() {
    test() ? cb.apply(this) : waitForThen(test, cb);
  }, 5);
};

describe('Node Server Request Listener Function', function() {
  it('Should answer GET requests for /classes/messages with a 200 status code', function() {
    // This is a fake server request. Normally, the server would provide this,
    // but we want to test our function's behavior totally independent of the server code
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    expect(res._ended).to.equal(true);
  });

  it('Should send back parsable stringified JSON', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(JSON.parse.bind(this, res._data)).to.not.throw();
    expect(res._ended).to.equal(true);
  });

  it('Should send back an object', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.be.an('object');
    expect(res._ended).to.equal(true);
  });

  // it('Should accept more posts to /classes/room', function() {
  //   var moreMsg = {
  //     username: 'brokenCodyBot',
  //     message: 'i aM nOT bRokEn'
  //   }
  //   var req = new stubs.request('/classes/messages', 'POST', moreMsg);
  //   var res = new stubs.response();

  //   handler.requestHandler(req,res);

  //   expect(res._responseCode).to.equal(201);

  //   expect(res._ended).to.equal(true);

  // });

  it('Should send an object containing a `results` array', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.have.property('results');
    expect(parsedBody.results).to.be.an('array');
    expect(res._ended).to.equal(true);
  });

  it('Should accept posts to /classes/room', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Expect 201 Created response status
    expect(res._responseCode).to.equal(201);

    // Testing for a newline isn't a valid test
    // TODO: Replace with with a valid test
    // expect(res._data).to.equal(JSON.stringify('\n'));
    expect(res._ended).to.equal(true);
  });

  it('Should respond with messages that were previously posted', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(201);

    // Now if we request the log for that room the message we posted should be there:
    req = new stubs.request('/classes/messages', 'GET');
    res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    var messages = JSON.parse(res._data).results;
    expect(messages.length).to.be.above(0);
    expect(messages[0].username).to.equal('Jono');
    expect(messages[0].message).to.equal('Do my bidding!');
    expect(res._ended).to.equal(true);
  });


  it('Should 404 when asked for a nonexistent file', function() {
    var req = new stubs.request('/arglebargle', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Wait for response to return and then check status code
    waitForThen(
      function() { return res._ended; },
      function() {
        expect(res._responseCode).to.equal(404);
      });
  });

  it('should create unique message id numbers', function() {
    var message1 = {
      username: 'codybot',
      message: 'Im not broken'
    };
    var message2 = {
      username: 'brokenCodybot',
      message: 'iM nOT bRoKEn!'
    };
    var req1 = new stubs.request('classes/messages', 'POST', message1);
    res1 = new stubs.response();
    var req2 = new stubs.request('classes/messages', 'POST', message2);
    res2 = new stubs.response();

    handler.requestHandler(req1, res1);
    handler.requestHandler(req2, res2);
    var messages = JSON.parse(res1._data);
    var messages2 = JSON.parse(res2._data);
    expect(messages.objectId === messages2.objectId).to.equal(false);
  });

  it('should create messages in chronological order', function() {
    var message1 = {
      username: 'codybot',
      message: 'Im not broken'
    };
    var message2 = {
      username: 'brokenCodybot',
      message: 'iM nOT bRoKEn!'
    };

    var req1 = new stubs.request('classes/messages', 'POST', message1);
    res1 = new stubs.response();
    var req2 = new stubs.request('classes/messages', 'POST', message2);
    res2 = new stubs.response();

    handler.requestHandler(req1, res1);
    handler.requestHandler(req2, res2);

    req = new stubs.request('/classes/messages', 'GET');
    res = new stubs.response();

    handler.requestHandler(req, res);
    var messages = JSON.parse(res._data).results;
    expect(messages[0].createdAt <= messages[messages.length - 1].createdAt).to.equal(true);
  });

});
