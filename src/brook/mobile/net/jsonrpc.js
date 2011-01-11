Namespace('brook.net.jsonrpc')
.use('brook.net HTTPRequester')
.define( function(ns){
    var HTTPRequester = ns.HTTPRequester;
    var VERSION = "2.0";
    var REQUEST_CONTENT_TYPE = "application/json-rpc";
    var ERROR_CODE = {
        PARSE_ERROR      : -32700,
        METHOD_NOT_FOUND : -32600,
        INVALID_REQUEST  : -32601,
        INVALID_PARAMS   : -32602,
        INTERNAL_ERROR   : -32603
    };
    var K             = function(x){return x };
    var emptyFunction = function(){};
    var isErrorCode   = function(code){
         return ( this.isFailure() && this.error.code == code );
    };
    var curry1st = function(proc,mock){
        return function(){
            var args = $A( arguments );
            args.unshift( mock );
            return proc.apply(this,args );
        }
    };

    var Response = function _jsonrpcResponse ( value ){
        this.id      = value.id;
        this.result  = value.result;
        this.error   = value.error;
        this.jsonrpc = value.jsonrpc;
        return this;
    };
    (function(){
        this.isSuccess = function(){
            return ( this.result && !this.error );
        };
        this.isFailure = function(){
            return !this.isSuccess();
        };
        this.isMethodNotFound     =  curry1st(isErrorCode, ERROR_CODE.METHOD_NOT_FOUND ),
        this.isParseError         =  curry1st(isErrorCode, ERROR_CODE.PARSE_ERROR ),
        this.isInvalidRequest     =  curry1st(this.isErrorCode, ERROR_CODE.INVALID_REQUEST ),
        this.isInvalidParams      =  curry1st(this.isErrorCode, ERROR_CODE.INVALID_PARAMS ),
        this.isInternalError      =  curry1st(this.isErrorCode, ERROR_CODE.INTERNAL_ERROR ),
        this.isNotification = function(){
            return ( !this.id );
        };
        this.getErrorCode      =  function(){
            if(this.isSuccess()){
                throw("not error");
            }
            return this.error.code;
        };
        this.isSingleResponse  =  curry1st( K, true );
        this.isBatchResponse   =  curry1st( K, false );
    }).apply(Response.prototype);

    var ResponseAggregator = function _jsonrpcResponseAggregator (arrayOfResponse ){
        this.responseList = arrayOfResponse;
        this.mapById      = arrayOfResponse.filter(function(e){
            return (e.id) ? true : false;
        }).reduce({},function(ret,e){
            ret[e.id] = e;
            return ret;
        });
        return this;
    };
    (function(){
        this.isSuccess = function(){
            return this.responseList.all(function(e){ return e.isSuccess();});
        };
        this.get = function(id){
            return this.mapById[id];
        };
        this.isSingleResponse = curry1st(K,false);
        this.isBatchResponse  = curry1st(K,true);
    }).apply(ResponseAggregator.prototype);


    var _composeResponse = function(obj){
        if( obj instanceof Array ){
            return new ResponseAggregator(obj.map(_composeResponse));
        }else{
            return new Response(obj);
        }
    };

    var Client = function _jsonrpcClient(serviceEndPoint){
        this.endPoint = serviceEndPoint;
        this.requests = [];
        this.addedId  = {};
    };
    (function(){
        this._onSuccess = function(callback,responseObject){
            callback( _composeResponse( responseObject ));
        };
        this._onFailure = function(){
            throw('request failure');
        };
        this._onNotification = emptyFunction;
        this.add =function(methodName,params,id){
            var requestId = id || ( this.requests.length )
            if( this.addedId[requestId] ){
                throw('same request id used');
            }
            this.addedId[requestId] = true;
            this.requests.push({
               jsonrpc : VERSION,
               method  : methodName,
               params  : params,
               id      : requestId
            });
            return this;
        };
        this.notify = function(methodName,params){
            this.requests.push({
                jsonrpc : VERSION,
                method  : methodName,
                params  : params,
                id      : null
            });
            return this;
        };
        this.execute = function (callback){
            var requestJSON = JSON.stringify(
                (this.requests.length > 1) 
                 ? this.requests  
                 : this.requests[0] );

            var _self = this;
            this.requests = [];
            this.addedId  = {};
            (new HTTPRequester).request({
                method: HTTPRequester.POST,
                url: this.endPoint,
                asynchronous: true,
                paramPOST: requestJSON,
                otherRequestHeaders: null
            }, function(response){
                if (response.is20x()) {
                    var responseJSON = JSON.parse(response.getRawString());
                    this._onSuccess(callback,responseJSON);
                }
                else {
                    this._onFailure(responseJSON);
                }
            }.bind(this));
        };
        this.call = function(methodName,params,callback){
            return this
                .add(methodName, params, false)
                .execute(callback);
        };
    }).apply(Client.prototype);
    Client.createService = function(serviceEndPoint, params){
        return new Client(serviceEndPoint + ((params) ? '?'+params.toQueryString():''));
    };
    ns.provide( {
        JSONRPC  : Client
    });
});
