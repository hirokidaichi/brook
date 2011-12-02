/**
@fileOverview brook.util
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


/**
@name brook.util
@namespace details here
*/
Namespace('brook.util')
.use('brook promise')
.define(function(ns){
    /**#@+
     * @methodOf brook.util
     */
    /**
     * @name mapper
     * @param {Promise} promise
     */
    var mapper = function(f){
        return ns.promise(function(next,val){
            return next(f(val));
        });
    };
    /**
     * @name through
     * @param {Promise} promise
     */
    var through = function(f){
        return ns.promise(function(next,val){
            f(val);
            return next(val);
        });
    };
    /**
     * @name filter
     * @param {Promise} promise
     */
    var filter = function(f){
        return ns.promise(function(next,val){
            if( f(val) ) return next(val);
        });
    };
    /**
     * @name takeBy
     */
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
    var _arrayWalk = function(list,func,limit) {
        var index = 0, length = list.length;
        (function() {
            var startTime = Date.now();
            while (length > index && limit > (Date.now() - startTime))
                func(list[index++]);

            if (length > index) 
                setTimeout(arguments.callee, 10);
        })();
    };
    /**
     * @name scatter
     */
    var scatter = function(limit){
        return ns.promise(function(next,list){
            _arrayWalk(list,next,(limit || 400));
        });
    };
    /**
     * @name wait
     */
    var wait = function(msec){
        var msecFunc = ( typeof msec == 'function' )
            ? msec : function(){return msec};
        return ns.promise(function(next,val){
            setTimeout(function(){
                next(val);
            },msecFunc());
        });
    };
    var waitUntil = function(f){
        var p = function(next,val){
            if( f() ){
                return next(val);
            }
            setTimeout(function(){ p(next,val)},100);
        };
        return ns.promise(p);
    };
    var debug = function(sig){
        var sig = sig ? sig : "debug";
        return through(function(val) {
            console.log(sig + ":",val);
        });
    };
    var cond = function(f,promise){
        return ns.promise(function(next,val){
            if( !f(val) )
                return next( val );
            promise.subscribe(function(val){
                return next( val );
            },val);
        });
    };
    var match = function(dispatchTable){
        return ns.promise(function(next,val){
            var promise = dispatchTable[val] || dispatchTable['__default__'] || ns.promise();
            promise.subscribe(function(v){
                next(v);
            },val);
        });
    };
    var LOCK_MAP = {};
    var unlock = function(name){
        return ns.promise(function(next,val){
            LOCK_MAP[name] = false;
            next(val);
        });
    };
    var lock = function(name){
        var tryLock = (function(next,val){
            if( !LOCK_MAP[name] ){
                LOCK_MAP[name] = true;
                return next(val);
            }
            setTimeout(function(){
                tryLock(next,val);
            },100);
        });
        return ns.promise(tryLock);
    };
    var from = function(value){
        if( value.observe ){
            return ns.promise(function(next,val){
                value.observe(ns.promise(function(n,v){
                    next(v);
                }));
            });
        }
        return ns.promise(function(next,val){
            next(value);
        });
    };
    var EMIT_INTERVAL_MAP = {};
    var emitInterval = function(msec, name){
        var msecFunc = ( typeof msec == 'function' )
            ? msec : function(){return msec};

        return ns.promise(function(next,val){
            var id = setInterval(function(){
                next(val);
            },msecFunc());
            if (name) {
                EMIT_INTERVAL_MAP[name] = id;
            }
        });
    };
    var stopEmitInterval = function(name) {
        return ns.promise(function(next, value) {
            clearInterval(EMIT_INTERVAL_MAP[name]);
            next(value);
        });
    };
    /**#@-*/
    ns.provide({
        mapper  : mapper,
        through : through,
        filter  : filter,
        scatter : scatter,
        takeBy  : takeBy,
        wait    : wait,
        cond    : cond,
        match   : match,
        debug   : debug,
        lock    : lock,
        unlock  : unlock,
        from    : from,
        waitUntil : waitUntil,
        emitInterval: emitInterval,
        stopEmitInterval: stopEmitInterval
    });
});



