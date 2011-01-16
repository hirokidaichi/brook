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
    proto.forEach = proto.subscribe;
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

