Namespace('brook.model')
.use('brook promise')
.use('brook.util *')
.use('brook.channel *')
.use('brook.lamda *')
.define(function(ns){
    var Model = function(){
        this.methods = {};
        this.channels= {};
    };
    Model.prototype.addMethod = function(method,promise){
        var channel = ns.createChannel();
        this.methods[method] = promise.bind( channel.send() );
        this.channels[method] = channel;
        return this;
    };
    Model.prototype.notify = function(method){
        return ns.promise().bind( this.methods[method] );
    };
    Model.prototype.observe   = function(method,observer){
        this.channels[method].observe( observer );
        return this;
    
    };
    var createModel = function(){
        return new Model;
    };
    ns.provide({
        createModel : createModel
    });
});
/*

