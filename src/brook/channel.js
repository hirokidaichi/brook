Namespace('brook.channel')
.use('brook promise')
.define(function(ns){
    
    var channels = {};
    var queues   = {};
    var register = function(hash,name,val){
        if(!hash[name])
            hash[name] = [];
        hash[name].push(val);
    };
    var through = function(k){return k};
    var receiveChannel = function(name,promise){
        register( channels,name, promise );
    };
    var sendChannel = function(name,func){
        var func = ( func ) ? func : through;
        return ns.promise(function(next,val){
            register( queues,name,val);
            if( channels[name] ){ 
                while( queues[name].length ){
                    var v = queues[name].shift();
                    channels[name].forEach(function(p){ p.run( v );});
                }
            }
            next(val);
        });
    };
    ns.provide({
        sendChannel    : sendChannel,
        observeChannel : receiveChannel
    });
});


