/**
@fileOverview brook
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace*/


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
     * Promiseインスタンスはbind関数で結合する事ができます。連続した非同期/同期の処理をデータの流れとして抽象化します。
     * subscribe/forEach/runなどの処理を実行するまでは、結合した処理が実行される事はありません。
     * また、コンストラクタは公開されていません。brook.promiseがファクトリとなっています。
     */
    var k       = function(next,val){ next(val); };
    var lift    = function(f){ return ( f instanceof Promise ) ? f : new Promise( f ); };
    var Promise = function(next,errorHandler){
        this.next = next || k;
        if (errorHandler)
            this.setErrorHandler(errorHandler);
    };
    (function(proto){
    /**#@+
     * @methodOf brook._Promise.prototype
     */

    /**
     * @name concat
     * @param {Promise} promise
     */
    proto.concat = function(after){
        var before = this;
        var next   = function(n,val){
            before.subscribe(after.ready(n),val);
        };
        return new Promise(next);
    };
    /**
     * @name bind
     * @param {Promise} promise
     */
    proto.bind = function(){
        var r = this;
        for( var i = 0,l = arguments.length;i<l;i++ ){
            r = r.concat( lift(arguments[i]) );
        }
        return r;
    };
    /**
     * @name ready
     * @param {Promise} promise
     */
    proto.ready = function(n){
        var promise = this;
        return function(val){
            promise.subscribe(n,val);
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
    var empty = function(){};
    proto.subscribe = function(_next,val){
        var next = _next || empty;
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
    proto.setErrorHandler = function(f){
        this.errorHandler = lift(f);
    };
    /**
     * @name onError
     */
    proto.onError = function(e){
        (this.errorHandler||new Promise()).run(e);
    };
    /**#@-*/
    })(Promise.prototype);
    /**
     * @name promise
     * @function
     * @memberOf brook
     * @param {function} next
     * @param {function} errorHandler
     * @return {Promise}
     * @description
     * プロミスを生成するファクトリメソッドです。nextは、さらに次の処理を第一引数に受け取り、第二引数に前回の処理の結果を受け取ります。
     * errorHandlerはnextで例外が発生した場合に呼ばれるpromiseか関数を受け付けます。
     * 引数が無い場合は、データをそのまま次の処理に送るpromiseを生成します。
     * @example
     * var p = ns.promise(function(next,value){ next(value+1)});
     * @example
     * var p = ns.promise();
     */
    var promise = function(next,errorHandler){return new Promise(next,errorHandler);};
    ns.provide({
        promise : promise,
        VERSION : VERSION
    });
});

