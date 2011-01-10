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

    var Channel = function(){
        this.queue = [];
        this.promises = [];
    };
    (function(proto){

        var through = function(k){return k};
        proto.sendMessage = function(msg){
            this.queue.push(msg);
            while( this.queue.length ){
                var v = this.queue.shift();
                this.promises.forEach(function(p){ p.run( v );});
            }
        };
        proto.send = function(func){
            var func = ( func ) ? func : through;
            var _self = this;
            return ns.promise(function(next,val){
                _self.sendMessage(func(val));
                next(val);
            });
        };
        proto.observe = function(promise){
            this.promises.push(promise);
        };
    })(Channel.prototype);

    var NAMED_CHANNEL = {};
    var getNamedChannel = function(name){
        if( NAMED_CHANNEL[name] )
            return NAMED_CHANNEL[name];
        NAMED_CHANNEL[name] = new Channel;
        return NAMED_CHANNEL[name];
    };
    var observeChannel = function(name,promise){
        getNamedChannel( name ).observe( promise );
    };
    var sendChannel = function(name,func){
        var channel = getNamedChannel( name );
        return channel.send(func);
    };
    ns.provide({
        sendChannel    : sendChannel,
        observeChannel : observeChannel,
        createChannel  : function(){ return new Channel;}
    });
});

