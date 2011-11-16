/**
@fileOverview brook.channel
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


/**
@name brook.channel
@namespace promiseをベースとしたobserver patternのシンプルな実装を提供します。
*/
Namespace('brook.channel')
.use('brook promise')
.define(function(ns){
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
        var through = function(k){return k};
        proto.sendMessage = function(msg){
            this.queue.push(msg);
            while( this.queue.length ){
                var v = this.queue.shift();
                for( var i = 0,l= this.promises.length;i<l;i++){
                    this.promises[i].run(v);
                }
            }
        };
        /**
         * @name send
         */
        proto.send = function(func){
            var func = ( func ) ? func : through;
            var _self = this;
            return ns.promise(function(next,val){
                _self.sendMessage(func(val));
                next(val);
            });
        };
        /**
         * @name observe
         */
        proto.observe = function(promise){
            //do not register same promise twice
            for (var i = 0; i < this.promises.length; i++) {
                if (this.promises[i] === promise) {
                    return;
                }
            }
            this.promises.push(promise);
        };

        proto.stopObserving = function(promise){
            for (var i = 0; i < this.promises.length; i++) {
                if (this.promises[i] === promise) {
                    this.promises.splice(i, 1);
                    i--;
                }
            }
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


