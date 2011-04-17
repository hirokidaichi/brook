/**
@fileOverview brook
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


/**
@name brook
@namespace details here
*/
Namespace('brook').define(function(ns){
    var VERSION = "0.01";
    /**
     * @class
     * @name Promise
     * @memberOf brook
     */
    var Promise = function(next){
        this.next = next ||  function(next,val){ return next(val); };
    };
    (function(proto){
    /**#@+
     * @methodOf brook.Promise.prototype
     */

    /**
     * @name concat
     * @param {Promise} promise
     */
    proto.concat = function(promise){
        var _before = this;
        var after  = promise;
        var next   = function(n,val){
            return _before.subscribe( promise.ready(n),val);
        };
        return new Promise(next);
    };
    /**
     * @name bind
     * @param {Promise} promise
     */
    proto.bind = function(){
        var r = this;
        for( var i = 0,l = arguments.length;i<l;i++){
            var s = arguments[i];
            s = ( s instanceof Promise) ? s : promise( s );
            r = r.concat( s );
        }
        return r;
    };
    /**
     * @name ready
     * @param {Promise} promise
     */
    proto.ready = function(n){
        var proc = this.next;
        return function(val){
            return proc(n,val);
        };
    };
    /**
     * @name run
     * @param {Promise} promise
     */
    proto.run = function(val){
        this.subscribe( undefined , val );
    };
    /**
     * @name subscribe
     * @param {Promise} promise
     */
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
    /**
     * @name forEach
     * @param {Promise} promise
     */
    proto.forEach = proto.subscribe;
    /**
     * @name setErrorHandler
     * @param {Promise} promise
     */
    proto.setErrorHandler = function(promise){
        this.errorHandler = promise;
    };
    /**
     * @name onError
     */
    proto.onError = function(e){
        (this.errorHandler||new Promise).subscribe(function(){},e);
    };
    /**#@-*/
    })(Promise.prototype);
    /**
     * @name promise
     * @function
     * @memberOf brook
     * @param{function} next
     * ディスクリプション  
     */
    var promise = function(next){return new Promise(next)};
    ns.provide({
        promise : promise,
        VERSION : VERSION
    });
});

