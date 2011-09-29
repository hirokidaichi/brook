/**
@fileOverview brook
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


/**
@name brook
@namespace brookライブラリ群のルートとなる名前空間です。promiseの生成処理を持っています。
*/
Namespace('brook').define(function(ns){
    var VERSION = "0.01";
    /**
     * @class brook.promiseで生成されるインスタンスのインナークラス
     * @name _Promise
     * @memberOf brook
     * @description
     * 実行する前の次の処理をもつオブジェクトです。
     * Promiseインスタンスはbind関数で結合する事が出来ます。連続した非同期/同期の処理をデータの流れとして抽象化して結合する事が出来ます。
     * subscribe/forEach/runなどの処理を実行するまでは、結合した処理は実行される事はありません。
     * また、コンストラクタは公開されていません。brook.promiseがファクトリとなっています。
     */
    var Promise = function(next){
        this.next = next ||  function(next,val){ return next(val); };
    };
    (function(proto){
    /**#@+
     * @methodOf brook._Promise.prototype
     */

    /**
     * @name concat
     * @param {Promise} promise
     */
    proto.concat = function(promise){
        var _before = this;
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
     * @param {function} next
     * @return {Promise}
     * @description
     * プロミスを生成するファクトリメソッドです。nextは、さらに次の処理を第一引数に受け取り、第二引数に前回の処理の結果を受け取ります。
     * 引数が無い場合は、データをそのまま次の処理に送るpromiseを生成します。
     * @example
     * var p = ns.promise(function(next,value){ next(value+1)});
     * @example
     * var p = ns.promise();
     */
    var promise = function(next){return new Promise(next)};
    ns.provide({
        promise : promise,
        VERSION : VERSION
    });
});

