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
            for( var i = 0, l = val.length;i<l;i++){
                next(val[i]);
            }
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
        return ns.promise(function(next,val){
            console.log(sig + ":",val);
            return next( val );
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
        cond    : cond,
        match   : match,
        debug   : debug,
        lock    : lock,
        unlock  : unlock,
        from    : from,
        waitUntil : waitUntil,
        emitInterval: emitInterval
    });
});



Namespace('brook.lamda')
.define(function(ns){
    var cache = {};
    var hasArg = function(expression){
        return expression.indexOf('->') >= 0;
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
    var Channel = function(){
        this.queue = [];
        this.promises = [];
    };
    (function(proto){
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
        proto.send = function(func){
            var func = ( func ) ? func : through;
            var _self = this;
            return ns.promise(function(next,val){
                _self.sendMessage(func(val));
                next(val);
            });
        };
        proto.observe = function(promise){
            this.promises.push(promise);
        };
    })(Channel.prototype);
    
    var channel = function(name){
        if( name )
            return getNamedChannel(name);
        return new Channel;
    };

    var NAMED_CHANNEL = {};
    var getNamedChannel = function(name){
        if( NAMED_CHANNEL[name] )
            return NAMED_CHANNEL[name];
        NAMED_CHANNEL[name] = new Channel;
        return NAMED_CHANNEL[name];
    };
    var observeChannel = function(name,promise){
        getNamedChannel( name ).observe( promise );
    };
    var sendChannel = function(name,func){
        var channel = getNamedChannel( name );
        return channel.send(func);
    };
    ns.provide({
        channel        : channel,
        sendChannel    : sendChannel,
        observeChannel : observeChannel,
        createChannel  : function(){ return new Channel;}
    });
});


Namespace('brook.model')
.use('brook promise')
.use('brook.util *')
.use('brook.channel *')
.use('brook.lamda *')
.define(function(ns){
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
    var createModel = function(){
        return new Model;
    };
    ns.provide({
        createModel : createModel
    });
});


Namespace('brook.dom.compat')
.define(function(ns){
    var dataset = (function(){
        var wrapper = function(element){
            return element.dataset;
        };
        if( HTMLElement.prototype.__lookupGetter__('dataset') ) 
            return wrapper;
        if( HTMLElement.prototype.dataset ) 
            return wrapper;

        var camelize = function(string){
            return string.replace(/-+(.)?/g, function(match, chr) {
              return chr ? chr.toUpperCase() : '';
            });
        };
        return function(element){
            var sets = {};
            for(var i=0,a=element.attributes,l=a.length;i<l;i++){
                var attr = a[i];
                if( !attr.name.match(/^data-/) ) continue;
                sets[camelize(attr.name.replace(/^data-/,''))] = attr.value;
            }
            return sets;
        };
    })();
    
    var ClassList = function(element){
        this._element = element;
        this._refresh();
    };
    var classList = function(element){
        return new ClassList(element);
    };

    ClassList.prototype = new Array;
    (function(proto){
        var check = function(token) {
            if (token == "") {
                throw "SYNTAX_ERR";
            }
            if (token.indexOf(/\s/) != -1) {
                throw "INVALID_CHARACTER_ERR";
            }
        };
        this._fake = true;
        this._refresh = function () {
            var clss = this._element.getAttribute("class");
            if (!clss) {
                return this;
            }
            var classes = clss.split(/\s+/);
            if (classes.length && classes[0] == "") {
                classes.shift();
            }
            if (classes.length && classes[classes.length - 1] == "") {
                classes.pop();
            }
            this.length = classes.length;
            if (this.length == 0) {
                return this;
            }
            for (var i = 0; i < this.length; ++i) {
                this[i] = classes[i];
            }
            return this;
        };
        this.item = function (i) {
            return this[i] || null;
        }
        this.contains = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this[i] == token) {
                    return true;
                }
            }
            return false;
        }
        this.add = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this[i] == token) {
                    return;
                }
            }
            this.push(token);
            this._element.setAttribute("class", this.join(" "));
        }
        this.remove = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this[i] == token) {
                    this.splice(i, 1);
                    this._element.setAttribute("class", this.join(" "));
                }
            }
        }
        this.toggle = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this[i] == token) {
                    this.remove(token);
                    return false;
                }
            }
            this.add(token);
            return true;
        }
    }).apply(ClassList.prototype);

    var hasClassName = function(element,className){
        var classSyntax = element.className;
        if ( !(classSyntax && className) ) return false;
        return (new RegExp("(^|\\s)" + className + "(\\s|$)").test(classSyntax)); 
    };
    var getElementsByClassName = function(className){
        if( document.getElementsByClassName ) return document.getElementsByClassName( className );
        var allElements = document.getElementsByTagName('*');
        var ret = [];
        for(var i=0,l=allElements.length;i<l;i++){
            if( !hasClassName( allElements[i] , className ) )
                continue;
            ret.push( allElements[i] )
        }
        return ret;
    };

    ns.provide({
        getElementsByClassName : getElementsByClassName,
        hasClassName : hasClassName,
        dataset   : dataset,
        classList : classList
    });
});
Namespace('brook.widget')
.use('brook promise')
.use('brook.channel *')
.use('brook.util *')
.use('brook.dom.compat *')
.define(function(ns){
    var TARGET_CLASS_NAME = 'widget';
    var getElementsByClassName = ns.getElementsByTagName;
    var classList = ns.classList;
    var dataset   = ns.dataset;
    var channel   = ns.channel;

    var removeClassName = function(className,element){
        classList(element).remove(className);
    };
    var elementsByClassName = ns.promise(function(n,v){
        v = v || TARGET_CLASS_NAME;
        n([v,Array.prototype.slice.call(ns.getElementsByClassName(v))]);
    });

    var mapByNamespace = ns.promise(function(n,val){
        var targetClassName = val[0];
        var widgetElements  = val[1];
        var map = {};
        for( var i = 0,l = widgetElements.length;i<l;i++){
            var widget = widgetElements[i];
            removeClassName(TARGET_CLASS_NAME,widget);
            var dataset = ns.dataset(widget);
            if( !dataset.widgetNamespace ) continue;
            if( !map[dataset.widgetNamespace] ) map[dataset.widgetNamespace] = [];
            map[dataset.widgetNamespace].push( widget );
        }
        n(map);
    });
    var applyNamespace = ns.promise(function(n,map){
        for( var namespace in map ){
            if( !map.hasOwnProperty( namespace ) ) continue;
            var targets = map[namespace];
            Namespace.use([namespace , '*'].join(' ')).apply(function(_ns){
                if (_ns.registerElement) {
                    for( var i = 0,l=targets.length;i<l;i++){
                        _ns.registerElement(targets[i]);
                    }
                } else if (_ns.registerElements) {
                    _ns.registerElements( targets );
                } else {
                    throw('registerElement or registerElements not defined in ' + namespace);
                }
            });
        }
    });

    var bindAllWidget = ns.sendChannel('widget');

    var updater  = ns.from( channel('widget') )
        .bind( ns.lock('class-seek') )
        .bind( elementsByClassName )
        .bind( ns.unlock('class-seek') )
        .bind( mapByNamespace )
        .bind( applyNamespace );
  
    updater.subscribe();
    ns.provide({
        bindAllWidget : bindAllWidget
    });
});

Namespace('brook.dom.event')
.use('brook promise')
.define(function(ns){

});
Namespace('brook.net.httprequester').define(function(ns){
    var merge = function(aObj,bObj){
        for( var p in bObj ){
            if( bObj.hasOwnProperty( p ) ){
                aObj[p] = bObj[p];
            }
        }
        return aObj;
    };

    /**
     * onreadystatechange State Constants
     */
    if (XMLHttpRequest.UNSENT === undefined) XMLHttpRequest.UNSENT = 0;
    if (XMLHttpRequest.OPENED === undefined) XMLHttpRequest.OPENED = 1;
    if (XMLHttpRequest.HEADERS_RECEIVED === undefined) XMLHttpRequest.HEADERS_RECEIVED = 2;
    if (XMLHttpRequest.LOADING === undefined) XMLHttpRequest.LOADING = 3;
    if (XMLHttpRequest.DONE === undefined) XMLHttpRequest.DONE = 4;


    /**
     * Class HTTPRequester
     */
    function HTTPRequester() {
        this.__xhr = null;
        this.__lastRequestUrl = null;
        this.__options = {};
        this.__response = null;
    }

    HTTPRequester.POST = 'POST';
    HTTPRequester.GET  = 'GET';
    HTTPRequester.requesters = {};

    HTTPRequester.AJAX_DEFAULT_REQUEST_HEADERS = {"X-Requested-With": "XmlHttpRequest"};

    /**
     * Static getRequester
     * @param {String} key
     */
    HTTPRequester.getRequester = function(key){
        var requester;
        if (HTTPRequester.requesters[key] === undefined) {
            requester = new HTTPRequester();
            HTTPRequester.requesters[key] = requester;
        }
        else {
            throw new Error('this key exist.');
        }
        return requester;
    };

    /**
     * Static abortAll
     * abort all running request
     */
    HTTPRequester.abortAll = function() {
        Object.keys(HTTPRequester.requesters).forEach(function(key){
            HTTPRequester.requesters[key].abort();
        },this);
    };

    /**
     * Public abort
     */
    HTTPRequester.prototype.abort = function() {
        this.__xhr.onreadystatechange = null;
        this.__xhr.abort();
    };

    /**
     * Public request
     */
    HTTPRequester.prototype.request = function(options, callback) {
        var deferred;
        if ( Deferred ) {
            deferred = new Deferred();
        }

        /**
         * マルチブラウザ対応する場合、
         * ここで例のtry/catchを実装してください。
         *
         * 本来、 __xhr は同名 HTTPRequester で再利用可能なはずですが、
         * readystatechange イベントを remove できないというバグなのか仕様があり、
         * request の度に初期化しています。
         *
         * onreadystatechagne = function(){...} ではなく、 __xhr.(add|remove)EventListener('readystatechange') も試しましたが、
         * Firefox/Chrome ともに正常に remove できず諦めました。
         */
        this.__xhr = new XMLHttpRequest();

        this.__setOptions(options);
        this.__setHandler(callback, deferred);
        this.__open();
        this.__setHeaders();
        this.__send();

        return deferred ? deferred : this;
    };

    /**
     * Public getResponse
     * @param {HTTPResponse}
     */
    HTTPRequester.prototype.getResponse = function() {
        return this.__response;
    };

    /**
     * Private __setOptions
     */
    HTTPRequester.prototype.__setOptions = function(options) {
        if (!options) {
            throw new Error('illegal options.')
        }

        // method(default == "POST")
        this.__options.method = options.method ? options.method : HTTPRequester.POST;

        // url(default null, throw error)
        if (!options.url) {
            throw new Error('HTTPRequester.request() needs "url" option.');
        }
        this.__options.url = options.url;

        // asynchronous(default == true)
        this.__options.asynchronous = ( typeof options.asynchronous == 'boolean' ) ? options.asynchronous : true;

        // requestContentType(default == 'application/x-www-form-urlencoded; charset=UTF-8')
        this.__options.requestContentType = options.requestContentType ? options.requestContentType : 'application/x-www-form-urlencoded; charset=UTF-8';

        // noCache(default == true)
        this.__options.noCache = ( typeof options.noCache == 'boolean' ) ? options.noCache : true;

        // expectedResponseContentType(default == null)
        this.__options.expectedResponseContentType = options.expectedResponseContentType ? options.expectedResponseContentType : null;

        // paramGET(default == null)
        this.__options.paramGET = options.paramGET ? options.paramGET : null;

        // paramPOST(default == null)
        this.__options.paramPOST = options.paramPOST ? options.paramPOST : null;

        // otherRequestHeaders(default == null)
        var otherRequestHeaders = HTTPRequester.AJAX_DEFAULT_REQUEST_HEADERS;
        this.__options.otherRequestHeaders = options.otherRequestHeaders ? merge(otherRequestHeaders, options.otherRequestHeaders) : otherRequestHeaders;
    };

    /**
     * Private __setHandler
     * @param {Function} callback
     */
    HTTPRequester.prototype.__setHandler = function(callback, deferred) {
        this.__xhr.onabort = function(evt) {
            // 特に実装無し。
            // 必要になったら実装してください。
        };
        this.__xhr.onreadystatechange = function(evt) {
            if ( this.__xhr.readyState == XMLHttpRequest.DONE ) {
                this.__response = new HTTPResponse(this.__xhr);
                this.__xhr.onreadystatechange = null;

                callback(this.__response, deferred);
            }
        }.bind(this);
    };

    /**
     * Private __open
     */
    HTTPRequester.prototype.__open = function() {
        var query = this.__options.paramGET ? this.__options.paramGET.toQueryString() : '';
        var requestUrl
            = this.__options.url
            + ((this.__options.url.indexOf('?') == -1) ? '?' : '&')
            + (this.__options.paramGET ? this.__options.paramGET.toQueryString() : '')
            + (this.__options.noCache ? '&'+Date.now() : '');
        this.__lastRequestUrl = requestUrl;
        this.__xhr.open(this.__options.method, requestUrl, this.__options.asynchronous);
    };

    /**
     * Private __setHeaders
     */
    HTTPRequester.prototype.__setHeaders = function() {
        // nocache
        if (this.__options.noCache) {
            this.__xhr.setRequestHeader("Cache-Control", "no-cache");
        }

        // requestContentType
        if (this.__options.method == HTTPRequester.POST) {
            this.__xhr.setRequestHeader('Content-Type', this.__options.requestContentType);
        }

        // other headers if any
        if (this.__options.otherRequestHeaders) {
            Object.keys(this.__options.otherRequestHeaders).forEach(function(key){
                this.__xhr.setRequestHeader(key, this.__options.otherRequestHeaders[key]);
            }, this);
        }

        // overrideMimeType
        if (this.__options.expectedResponseContentType) {
            this.__xhr.overrideMimeType(this.__options.expectedResponseContentType);
        }
    };

    /**
     * Private __send
     */
    HTTPRequester.prototype.__send = function() {
        var postBody = null;
        if ( this.__options.paramPOST != null && this.__options.method == HTTPRequester.POST ) {
            postBody = (typeof(this.__options.paramPOST) == "string" || this.__options.paramPOST instanceof String) ? this.__options.paramPOST : this.__options.paramPOST.toQueryString();
        }
        this.__xhr.send(postBody);
    };


    /**
     * HTTPResponse
     * @param {XMLHttpRequest} xhr
     */
    function HTTPResponse(xhr) {
        // status
        // レスポンスが304の場合、Firefox 200
        // Chrome 304
        // prototype.js はサーバから 304 が返ってくる（Chrome）と onSuccess しない仕様。
        // あまり XHR.status に頼らない方が良さそうです。
        this.__status20x = ( xhr.status >= 200 && xhr.status < 300 );
        this.statusCode = xhr.status;

        // rawResponseText
        this.__rawString = xhr.responseText;

        // jsonize
        this.__object = null;
        if ( /javascript/.test(xhr.getResponseHeader('Content-Type'))  || /json/.test(xhr.getResponseHeader('Content-Type')) ) {
            try {
                this.__object = JSON.parse(this.__rawString.replace(/^\/\*-secure-([\s\S]*)\*\/\s*$/, '$1'));
            }
            catch(err) {}
        }
    }

    /**
     * Public is20x
     * is 20x status code?
     * @return {Boolean}
     */
    HTTPResponse.prototype.is20x = function() {
        return (this.__status20x);
    };

    /**
     * Public getObject
     * get response parsed JSON Object
     * @return {Object}
     */
    HTTPResponse.prototype.getObject = function() {
        return this.__object;
    };

    /**
     * Public getRawString
     * get raw responseText
     * @return {String}
     */
    HTTPResponse.prototype.getRawString = function() {
        return this.__rawString;
    };

    ns.provide({
        HTTPRequester : HTTPRequester,
        HTTPResponse  : HTTPResponse
    });
});
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
