/**
@fileOverview brook.channel
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace sendChannel*/

/**
@name brook.channel
@namespace promiseをベースとしたobserver patternのシンプルな実装を提供します。
*/
Namespace('brook.channel')
.use('brook promise')
.use('brook.util scatter')
.define(function(ns){
    var indexOf = function(list, value) {
        for (var i = 0, l = list.length; i < l; i++) 
            if (list[i] === value) return i;
        return -1;
    };
    /**
     * @class brook.channel.createChannelで生成されるインスタンスのインナークラス
     * @name _Channel
     * @memberOf brook.channel
     * @description
     * promiseを登録できるobserverクラス
     */
    var Channel = function(){
        this.queue = [];
        this.promises = [];
    };
    (function(proto){
    /**#@+
     * @methodOf brook.channel._Channel.prototype
     */
        var through = function(k){return k;};
        /**
         * @name send
         */
        proto.send = function(func){
            func = ( func ) ? func : through;
            var _self = this;
            return ns.promise(function(next,val){
                _self.sendMessage(func(val));
                next(val);
            });
        };
        /**
         * @name sendMessage
         */
        proto.sendMessage = function(msg){
            var scatter   = ns.scatter(1000);
            var sendError = sendChannel('error');

            this.queue.push(msg);
            var makeRunner = function(message) {
                return ns.promise(function(next, promise) {
                    promise.run(message);
                });
            };
            while( this.queue.length ){
                var message = this.queue.shift();
                var runner  = makeRunner(message);
                runner.setErrorHandler(sendError);
                scatter.bind(runner).run(this.promises);
            }
        };
        /**
         * @name observe
         */
        proto.observe = function(promise){
            //do not register same promise twice
            if (indexOf(this.promises, promise) > -1) return;
            this.promises.push(promise);
        };

        proto.stopObserving = function(promise){
            var index = indexOf(this.promises, promise);
            if (index > -1) this.promises.splice(index, 1);
        };
    /**#@-*/
    })(Channel.prototype);

    var channel = function(name){
        if( name ) {
            return getNamedChannel(name);
        }
        return new Channel();
    };

    var NAMED_CHANNEL = {};
    var getNamedChannel = function(name){
        if( NAMED_CHANNEL[name] ) {
            return NAMED_CHANNEL[name];
        }
        NAMED_CHANNEL[name] = new Channel();
        return NAMED_CHANNEL[name];
    };
    var observeChannel = function(name,promise){
        getNamedChannel( name ).observe( promise );
    };
    var stopObservingChannel = function(name,promise){
        getNamedChannel( name ).stopObserving( promise );
    };
    var sendChannel = function(name,func){
        var channel = getNamedChannel( name );
        return channel.send(func);
    };
    ns.provide({
        channel        : channel,
        sendChannel    : sendChannel,
        observeChannel : observeChannel,
        stopObservingChannel : stopObservingChannel,
        createChannel  : function(){ return new Channel();}
    });
});


