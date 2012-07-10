/**
@fileOverview brook/model.js
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace*/

/**
@name brook.model
@namespace mvcにおけるmodelインタフェースを提供します。
*/
Namespace('brook.model')
.use('brook promise')
.use('brook.util *')
.use('brook.channel *')
.use('brook.lambda *')
.define(function(ns){
    /**
     * @class brook.model.createModelで生成されるインスタンスのインナークラス
     * @name _Model
     * @memberOf brook.model
     * @description
     * mvcにおけるmodelインタフェースをもったクラス
     */
    var Model = function(obj){
        this.methods = {};
        this.channels= {};
        for( var prop in obj ){
            if( !obj.hasOwnProperty(prop) )
                continue;
            this.addMethod( prop,obj[prop]);
        }
    };
    Model.prototype.addMethod = function(method,promise){
        if( this.methods[method] )
            throw('already '+ method +' defined');
        var channel = ns.createChannel();
        this.methods[method] = promise.bind( channel.send() );
        this.channels[method] = channel;
        return this;
    };
    Model.prototype.notify = function(method){
        return ns.promise().bind( this.methods[method] );
    };
    Model.prototype.method   = function(method){
        if( !this.channels[method] )
            throw('do not observe undefined method');
        return this.channels[method];
    };
    var createModel = function(obj){
        return new Model(obj);
    };
    ns.provide({
        createModel : createModel
    });
});

