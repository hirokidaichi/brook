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



