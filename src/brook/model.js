Namespace('brook.model')
.use('brook promise')
.use('brook.util *')
.use('brook.channel *')
.use('brook.lamda *')
.define(function(ns){
    var Model = function(obj){
        this.methods = {};
        this.channels= {};
        for( var prop in obj ){
            if( !obj.hasOwnProperty(prop) )
                continue;
            this.addMethod( prop,obj[prop]);
        }
    };
    Model.prototype.addMethod = function(method,promise){
        if( this.methods[method] )
            throw('already '+ method +' defined');
        var channel = ns.createChannel();
        this.methods[method] = promise.bind( channel.send() );
        this.channels[method] = channel;
        return this;
    };
    Model.prototype.notify = function(method){
        return ns.promise().bind( this.methods[method] );
    };
    Model.prototype.observe   = function(method,observer){
        if( !this.channels[method] )
            throw('do not observe undefined method');

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

