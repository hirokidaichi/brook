Namespace('brook').define(function(ns){
    var VERSION = "0.01";
    var Promise = function(next){
        this.next = next ||  function(next,val){ return next(val); };
    };
    (function(proto){
    proto.concat = function(promise){
        var _before = this;
        var after  = promise;
        var next   = function(n,val){
            return _before.subscribe( promise.ready(n),val);
        };
        return new Promise(next);
    };
    proto.bind = function(){
        var r = this;
        for( var i = 0,l = arguments.length;i<l;i++){
            var s = arguments[i];
            s = ( s instanceof Promise) ? s : promise( s );
                
            r = r.concat( s );
        }
        return r;
    };
    proto.ready = function(n){
        var proc = this.next;
        return function(val){
            return proc(n,val);
        };
    };
    proto.run = function(val){
        this.subscribe( undefined , val );
    };
    proto.subscribe = function(next,val){
        var next = next ? next : function(){};
        if( !this.errorHandler )
            return this.next(next,val);
        
        try {
            this.next(next,val);
        }
        catch(e){
            this.onError(e);
        }
    };
    
    proto.setErrorHandler = function(promise){
        this.errorHandler = promise;
    };
    proto.onError = function(e){
        (this.errorHandler||new Promise).subscribe(function(){},e);
    };
    })(Promise.prototype);

    var promise = function(next){return new Promise(next)};
    ns.provide({
        promise : promise,
        VERSION : VERSION
    });
});

Namespace('brook.util')
.use('brook promise')
.define(function(ns){
    var mapper = function(f){
        return ns.promise(function(next,val){
            return next(f(val));
        });
    };
    var filter = function(f){
        return ns.promise(function(next,val){
            if( f(val) ) return next(val);
        });
    };
    var takeBy = function(by){
        var num = 1;
        var queue = [];
        return ns.promise(function(next,val){
            queue.push( val );
            if( num++ % (by) ==0){
                next(queue);
                queue = [];
            }
        });
    };

    var scatter = function(){
        return ns.promise(function(next,val){
            val.forEach(function(e){
                next(e);
            });
        });
    };
    var wait = function(msec){
        var msecFunc = ( typeof msec == 'function' )
            ? msec : function(){return msec};
        return ns.promise(function(next,val){
            setTimeout(function(){
                next(val);
            },msecFunc());
        });
    };
    var debug = function(sig){
        var sig = sig ? sig : "debug";
        return ns.promise(function(next,val){
            console.log(sig + ":",val);
            return next( val );
        });
    };
    var emitInterval = function(msec){
        var msecFunc = ( typeof msec == 'function' )
            ? msec : function(){return msec};

        return ns.promise(function(next,val){
            var id = setInterval(function(){
                next(val);
            },msecFunc());
        });
    };
    ns.provide({
        mapper  : mapper,
        filter  : filter,
        scatter : scatter,
        takeBy  : takeBy,
        wait    : wait,
        debug   : debug,
        emitInterval: emitInterval
    });
});



Namespace('brook.lamda')
.define(function(ns){
    var cache = {};
    var hasArg = function(expression){
        return /->/.test(expression);
    };
    var parseExpression = function(expression){
        var fixed = hasArg( expression ) ? expression : "$->"+expression;
        var splitted = fixed.split("->");
        var argsExp = splitted.shift();
        var bodyExp = splitted.join('->');
        return {
            argumentNames : argsExp.split(','),
            body   : hasArg(bodyExp) ? lamda( bodyExp ).toString() : bodyExp
        };
    };
    var lamda = function(expression){
        if( cache[expression] )
            return cache[expression];
        var parsed = parseExpression(expression);
        var func = new Function( parsed.argumentNames,"return ("+ parsed.body + ");");
        cache[expression] = func;
        return func;
    };
    ns.provide({
        lamda : lamda
    });
});
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


