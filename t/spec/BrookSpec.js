var brook = require('../../build/node-brook');

var brook_exported_modules = [
  "promise"
];

var brook_util_exported_modules = [
  "mapper",
  "through",
  "filter",
  "scatter",
  "takeBy",
  "wait",
  "cond",
  "match",
  "debug",
  "lock",
  "unlock",
  "from",
  "waitUntil",
  "emitInterval",
  "stopEmitInterval"
];

var brook_lambda_exported_modules = [
  "lambda"
];

var brook_channel_exported_modules = [
  "channel",
  "sendChannel",
  "observeChannel",
  "stopObservingChannel",
  "createChannel"
];

var brook_model_exported_modules = [
  "createModel"
];

describe("A Suite is export module", function() {

  brook_exported_modules.forEach(function(moduleName){
    it("[brook] defeined export " + moduleName, function(){
      expect(brook[moduleName]).toBeDefined();
    });
  });
  brook_util_exported_modules.forEach(function(moduleName){
    it("[brook.util] defeined export " + moduleName, function(){
      expect(brook.util[moduleName]).toBeDefined();
    });
  });
  brook_lambda_exported_modules.forEach(function(moduleName){
    it("[brook.lambda] defeined export " + moduleName, function(){
      expect(brook.lambda[moduleName]).toBeDefined();
    });
  });
  brook_channel_exported_modules.forEach(function(moduleName){
    it("[brook.channel] defeined export " + moduleName, function(){
      expect(brook.channel[moduleName]).toBeDefined();
    });
  });
  brook_model_exported_modules.forEach(function(moduleName){
    it("[brook.model] defeined export " + moduleName, function(){
      expect(brook.model[moduleName]).toBeDefined();
    });
  });

});

describe("A Suite is checked promise action", function() {

  it("create promise", function(){
    var promise = brook.promise(function(value, next){})
    expect(promise).toBeDefined();
    expect(promise.run).toBeDefined();
    expect(promise.subscribe).toBeDefined();
  });

  it("chain promise", function(){
    var promise1 = brook.promise(function(value, next){});
    var promise2 = brook.promise(function(value, next){});
    var cheinedPromise = promise1.bind(promise2);
    expect(cheinedPromise).toBeDefined();
  });

  it("run promise", function(){
    var promise1 = brook.promise(function(next, value){
      value = value * 2;
      next(value);
    });
    var promise2 = brook.promise(function(next, value){
      value = value + 1;
      next(value);
    });

    var defaultNumber = 5;
    var resultNumber = 11;
    promise1.bind(promise2).subscribe(function(value){
      expect(value).toEqual(resultNumber);
    }, defaultNumber);
  });

});
