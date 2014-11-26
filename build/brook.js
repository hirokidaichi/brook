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


/**
@fileOverview brook.util
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace setTimeout console setInterval clearInterval*/

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
            if( num++ % (by) === 0){
                next(queue);
                queue = [];
            }
        });
    };
    var now = Date.now ? function() { return Date.now(); }
                       : function() { return +new Date(); };
    var _arrayWalk = function(list,func) {
        for (var i = 0, l = list.length; i < l; i++) {
            func(list[i]);
        }
    };
    var _arrayWalkWithLimit = function (list, func, limit) {
        var index = 0, length = list.length;
        (function() {
            var startTime = now();
            while (length > index && limit > (now() - startTime))
                func(list[index++]);

            if (length > index)
                setTimeout(arguments.callee, 10);
        })();
    };
    var _getArrayWalkWithLimit = function(limit) {
        return function (list, func) {
            _arrayWalkWithLimit(list, func, limit);
        };
    };
    /**
     * @name scatter
     */
    var scatter = function(limit){
        var func = limit ? _getArrayWalkWithLimit(limit) : _arrayWalk;
        return ns.promise(function(next,list){
            func(list,next);
        });
    };
    /**
     * @name wait
     */
    var wait = function(msec){
        var msecFunc
            = ( typeof msec == 'function' ) ?
                msec : function(){return msec;};
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
            setTimeout(function(){ p(next,val);},100);
        };
        return ns.promise(p);
    };
    var debug = function(sig){
        sig = sig ? sig : "debug";
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
    var match = function(dispatchTable, matcher){
        return ns.promise(function(next,val){
            var promise;
            if(matcher)
                promise = dispatchTable[matcher(val)];
            if(!promise)
                promise = dispatchTable[val] || dispatchTable.__default__ || ns.promise();
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
        if( value && value.observe ){
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
        var msecFunc
            = ( typeof msec == 'function' ) ?
                msec : function(){return msec;};

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




/**
@fileOverview brook.lambda
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace*/

/**
@name brook.lambda
@namespace 簡単に小さな関数を作る為のテンプレートを提供します。
*/

Namespace('brook.lambda')
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
            body   : hasArg(bodyExp) ? lambda( bodyExp ).toString() : bodyExp
        };
    };
    /**
     * @name lambda
     * @function
     * @memberOf brook.lambda
     * @param {string} expression
     * @return {function}
     * @description
     * 文字列表現を受け取り、シンプルな関数を生成します。
     * @example
     * var f = lambda('$ * $'); // 第一引数を二乗する関数
     * @example
     * var f = lambda('x,y-> x + y'); // xとyを受け取って、x+yを返す
     * @example
     * var f = lambda('x->y->z-> x+y+z'); // 部分適用できる関数を作る
     */
    var lambda = function(expression){
        if( cache[expression] )
            return cache[expression];
        var parsed = parseExpression(expression);
        /*jshint evil: true */
        var func = new Function( parsed.argumentNames,"return ("+ parsed.body + ");");
        cache[expression] = func;
        return func;
    };
    ns.provide({
        lambda : lambda
    });
});

/**
@fileOverview brook.channel
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace sendChannel*/

/**
@name brook.channel
@namespace promiseをベースとしたobserver patternのシンプルな実装を提供します。
*/
Namespace('brook.channel')
.use('brook promise')
.use('brook.util scatter')
.define(function(ns){
    var indexOf = function(list, value) {
        for (var i = 0, l = list.length; i < l; i++) 
            if (list[i] === value) return i;
        return -1;
    };
    /**
     * @class brook.channel.createChannelで生成されるインスタンスのインナークラス
     * @name _Channel
     * @memberOf brook.channel
     * @description
     * promiseを登録できるobserverクラス
     */
    var Channel = function(){
        this.queue = [];
        this.promises = [];
    };
    (function(proto){
    /**#@+
     * @methodOf brook.channel._Channel.prototype
     */
        var through = function(k){return k;};
        /**
         * @name send
         */
        proto.send = function(func){
            func = ( func ) ? func : through;
            var _self = this;
            return ns.promise(function(next,val){
                _self.sendMessage(func(val));
                next(val);
            });
        };
        /**
         * @name sendMessage
         */
        proto.sendMessage = function(msg){
            var scatter   = ns.scatter(1000);
            var sendError = sendChannel('error');

            this.queue.push(msg);
            var makeRunner = function(message) {
                return ns.promise(function(next, promise) {
                    promise.run(message);
                });
            };
            while( this.queue.length ){
                var message = this.queue.shift();
                var runner  = makeRunner(message);
                runner.setErrorHandler(sendError);
                scatter.bind(runner).run(this.promises);
            }
        };
        /**
         * @name observe
         */
        proto.observe = function(promise){
            //do not register same promise twice
            if (indexOf(this.promises, promise) > -1) return;
            this.promises.push(promise);
        };

        proto.stopObserving = function(promise){
            var index = indexOf(this.promises, promise);
            if (index > -1) this.promises.splice(index, 1);
        };
    /**#@-*/
    })(Channel.prototype);

    var channel = function(name){
        if( name ) {
            return getNamedChannel(name);
        }
        return new Channel();
    };

    var NAMED_CHANNEL = {};
    var getNamedChannel = function(name){
        if( NAMED_CHANNEL[name] ) {
            return NAMED_CHANNEL[name];
        }
        NAMED_CHANNEL[name] = new Channel();
        return NAMED_CHANNEL[name];
    };
    var observeChannel = function(name,promise){
        getNamedChannel( name ).observe( promise );
    };
    var stopObservingChannel = function(name,promise){
        getNamedChannel( name ).stopObserving( promise );
    };
    var sendChannel = function(name,func){
        var channel = getNamedChannel( name );
        return channel.send(func);
    };
    ns.provide({
        channel        : channel,
        sendChannel    : sendChannel,
        observeChannel : observeChannel,
        stopObservingChannel : stopObservingChannel,
        createChannel  : function(){ return new Channel();}
    });
});



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


Namespace("brook.view.htmltemplate.core")
.define(function(ns){
var module = { exports : {}};
//
/* 2008 Daichi Hiroki <hirokidaichi@gmail.com>
 * html-template-core.js is freely distributable under the terms of MIT-style license.
 * ( latest infomation :https://github.com/hirokidaichi/html-template )
 *-----------------------------------------------------------------------*/
 /*global module*/
var util = {};
util.defineClass = function(obj,superClass){
    var klass = function Klass(){
        this.initialize.apply(this,arguments);
    };
    
    if(superClass) klass.prototype = new superClass();
    for(var prop in obj ){
        if( !obj.hasOwnProperty(prop) )
            continue;
        klass.prototype[prop] = obj[prop];
    }
    if( !klass.prototype.initialize )
        klass.prototype.initalize = function(){};
    return klass;
};
util.merge = function(origin,target){
    for(var prop in target ){
        if( !target.hasOwnProperty(prop) )
            continue;
        origin[prop] = target[prop];
    }
};
util.k = function(k){return k;};
util.emptyFunction = function(){};
util.listToArray = function(list){
    return Array.prototype.slice.call(list);
};
util.curry = function() {
    var args = util.listToArray(arguments);
    var f    = args.shift();
    return function() {
      return f.apply(this, args.concat(util.listToArray(arguments)));
    };
};

util.merge(util,{
    isArray: function(object) {
        return object !== null && typeof object == "object" &&
          'splice' in object && 'join' in object;
    },
    isFunction: function(object) {
        return typeof object == "function";
    },
    isString: function(object) {
        return typeof object == "string";
    },
    isNumber: function(object) {
        return typeof object == "number";
    },
    isUndefined: function(object) {
        return typeof object == "undefined";
    }
});
util.createRegexMatcher = function(escapeChar,expArray){
    function _escape( regText){
        return (regText + '').replace(new RegExp(escapeChar,'g'), "\\");
    }
    var count = 0;
    var e;
    var regValues = { mapping : { 'fullText' : [0]},text:[]};
    for( var i =0,l= expArray.length;i<l;i++){
        e = expArray[i];
        if(util.isString(e)){
            regValues.text.push(e);
            continue;
        }
        if(!regValues.mapping[e.map]){
            regValues.mapping[e.map] = [];
        }
        regValues.mapping[e.map].push(++count);
        
    }
    var reg;
    regValues.text = _escape(regValues.text.join(''));
    return function matcher(matchingText){
        if(!reg){
            reg = new RegExp(regValues.text);
        }
        var results = (matchingText || '').match(reg);
        if(results){
            var ret = {};
            var prop = 0,i = 0,map = regValues.mapping;
            for(prop in map){
                var list   = map[prop];
                var length = list.length;
                for(i = 0 ;i<length ;i++){
                    if(results[list[i]]){
                        ret[prop] = results[list[i]];
                        break;
                    }
                }
            }
            return ret;

        }else{
            return undefined;
        }
    };

};


var CHUNK_REGEXP_ATTRIBUTE = util.createRegexMatcher('%',[
    "<",
    "(%/)?",{map:'close'},
    "TMPL_",
    "(VAR|LOOP|IF|ELSE|ELSIF|UNLESS|INCLUDE)",{map:'tag_name'},
    "%s*",
    "(?:",
        "(?:DEFAULT)=",
        "(?:",
            "'([^'>]*)'|",{map:'default'},
            '"([^">]*)"|',{map:'default'},
            "([^%s=>]*)" ,{map:'default'},
        ")",
    ")?",
    "%s*",
    "(?:",
        "(?:ESCAPE)=",
        "(?:",
            "(JS|URL|HTML|0|1|NONE)",{map:'escape'},
        ")",
    ")?",
    "%s*",
    "(?:",
        "(?:DEFAULT)=",
        "(?:",
            "'([^'>]*)'|",{map:'default'},
            '"([^">]*)"|',{map:'default'},
            "([^%s=>]*)" ,{map:'default'},
        ")",
    ")?",
    "%s*",
    /*
        NAME or EXPR
    */
    "(?:",
        "(NAME|EXPR)=",{map:'attribute_name'},
        "(?:",
            "'([^'>]*)'|",{map:'attribute_value'},
            '"([^">]*)"|',{map:'attribute_value'},
            "([^%s=>]*)" ,{map:'attribute_value'},
        ")",
    ")?",
    /*
        DEFAULT or ESCAPE
    */
    '%s*',
    "(?:",
        "(?:DEFAULT)=",
        "(?:",
            "'([^'>]*)'|",{map:'default'},
            '"([^">]*)"|',{map:'default'},
            "([^%s=>]*)" ,{map:'default'},
        ")",
    ")?",
    "%s*",
    "(?:",
        "(?:ESCAPE)=",
        "(?:",
            "(JS|URL|HTML|0|1|NONE)",{map:'escape'},
        ")",
    ")?",
    "%s*",
    "(?:",
        "(?:DEFAULT)=",
        "(?:",
            "'([^'>]*)'|",{map:'default'},
            '"([^">]*)"|',{map:'default'},
            "([^%s=>]*)" ,{map:'default'},
        ")",
    ")?",
    "%s*",
    ">"
]);

var element = {};
element.Base = util.defineClass({
    initialize: function(option) {
        this.mergeOption(option);
    },
    mergeOption : function(option){
        util.merge(this,option);
        this.isCloseTag = (this.isCloseTag) ? true: false;
    },
    isParent : util.emptyFunction,
    execute  : util.emptyFunction,
    getCode: function(e) {
        return "void(0);";
    },
    toString: function() {
        return [
            '<' ,
            ((this.isCloseTag) ? '/': '') ,
            this.type ,
            ((this.hasName) ? ' NAME=': '') ,
            ((this.name) ? this.name: '') ,
            '>'
        ].join('');
    },
    // HTML::Template::Pro shigeki morimoto's extension
    _pathLike: function(attribute , matched){
        var pos = (matched == '/')?'0':'$_C.length -'+(matched.split('..').length-1);
        return  [
            "(($_C["+pos+"]['"        ,
            attribute ,
            "']) ? $_C["+pos+"]['"    ,
            attribute ,
            "'] : undefined )"
        ].join('');

    },
    getParam: function() {
        var ret = "";
        if (this.attributes.name) {
            var matched = this.attributes.name.match(/^(\/|(?:\.\.\/)+)(\w+)/);
            if(matched){
                return this._pathLike(matched[2],matched[1]);
            }
            var _default = ( this.attributes['default'] )? "'"+this.attributes['default']+"'":"undefined";
            ret =  [
                "(($_T['"            ,
                    this.attributes.name ,
                "']) ? $_T['"        ,
                    this.attributes.name ,
                "'] : ",
                    _default,
                " )"
            ].join('');
        }
        if (this.attributes.expr) {
            var operators = {
                'gt' :'>',
                'lt' :'<',
                'eq' :'==',
                'ne' :'!=',
                'ge' :'>=',
                'le' :'<='
            };
            var replaced = this.attributes.expr.replace(/\{(\/|(?:\.\.\/)+)(\w+)\}/g,function(full,matched,param){
                return [
                     '$_C[',
                     (matched == '/')?'0':'$_C.length -'+(matched.split('..').length-1),
                     ']["',param,'"]'
                ].join('');
            }).replace(/\s+(gt|lt|eq|ne|ge|le|cmp)\s+/g,function(full,match){
                return " "+operators[match]+" ";
            });
            ret = [
                "(function(){",
                "    with($_F){",
                "        with($_T){",
                "            return (", replaced ,');',
                "}}})()"
            ].join('');
        }
        if(this.attributes.escape){
            var _escape = {
                NONE: 'NONE',
                0   : 'NONE',
                1   : 'HTML',
                HTML: 'HTML',
                JS  : 'JS',
                URL : 'URL'
            }[this.attributes.escape];
            ret = [
                '$_F.__escape'+_escape+'(',
                ret,
                ')'
            ].join('');
        }
        return ret;
    }
});

var cache = {
    STRING_FRAGMENT : []
};


util.merge( element , {
    ROOTElement: util.defineClass({
        type: 'root',
        getCode: function() {
            if (this.isCloseTag) {
                return 'return $_R.join("");';
            } else {
                return [
                    'var $_R  = [];',
                    'var $_C  = [param];',
                    'var $_F  = funcs||{};',
                    'var $_T  = param||{};',
                    'var $_S  = cache.STRING_FRAGMENT;'
                ].join('');
            }
        }
    },element.Base),

    LOOPElement: util.defineClass({
        type: 'loop',
        initialize:function(option){
            this.mergeOption(option);
        },
        getLoopId : function(){
            if( this._ID ) {
                return this._ID;
            }
            if( !element.LOOPElement.instanceId ){
                element.LOOPElement.instanceId = 0;
            }
            var id = element.LOOPElement.instanceId++;
            this._ID = '$'+id.toString(16);
            return this._ID;
        },
        getCode: function() {
            if (this.isCloseTag) {
                return ['}','$_T = $_C.pop();'].join('');
            } else {
                var id = this.getLoopId();
                return [
                'var $_L_'+id+' =' + this.getParam() + '|| [];',
                'var $_LL_'+id+' = $_L_'+id+'.length;',
                '$_C.push($_T);',
                'for(var i_'+id+'=0;i_'+id+'<$_LL_'+id+';i_'+id+'++){',
                '   $_T = (typeof $_L_'+id+'[i_'+id+'] == "object")?',
                '                $_L_'+id+'[i_'+id+'] : {};',
                "$_T['__first__'] = (i_"+id+" == 0) ? true: false;",
                "$_T['__counter__'] = i_"+id+"+1;",
                "$_T['__odd__']   = ((i_"+id+"+1)% 2) ? true: false;",
                "$_T['__last__']  = (i_"+id+" == ($_LL_"+id+" - 1)) ? true: false;",
                "$_T['__inner__'] = ($_T['__first__']||$_T['__last__'])?false:true;"
                ].join('');
            }
        }
    },element.Base),

    VARElement: util.defineClass({
        type: 'var',
        getCode: function() {
            if (this.isCloseTag) {
                throw(new Error('HTML.Template ParseError TMPL_VAR'));
            } else {
                return '$_R.push(' + this.getParam() + ');';
            }
        }
    },element.Base),

    IFElement: util.defineClass({
        type: 'if',
        getCondition: function(param) {
            return "!!" + this.getParam(param);
        },
        getCode: function() {
            if (this.isCloseTag) {
                return '}';
            } else {
                return 'if(' + this.getCondition() + '){';
            }
        }
    },element.Base),

    ELSEElement: util.defineClass( {
        type: 'else',
        getCode: function() {
            if (this.isCloseTag) {
                throw(new Error('HTML.Template ParseError No Close Tag for TMPL_ELSE'));
            } else {
                return '}else{';
            }
        }
    },element.Base),

    INCLUDEElement: util.defineClass({
        type: 'include',
        getCode: function() {
            if (this.isCloseTag) {
                throw(new Error('HTML.Template ParseError No Close Tag for TMPL_INCLUDE'));
            } else {
                var name = '"'+(this.attributes.name)+'"';
                return [
                    '$_R.push($_F.__include(',name,',$_T,$_F));'
                ].join('\n');
            }
        }
    },element.Base),

    TEXTElement: util.defineClass({
        type: 'text',
        isCloseTag: false,
        initialize : function(option){this.value = option;},
        getCode: function() {
            if (this.isCloseTag) {
                throw(new Error('HTML.Template ParseError No Close Tag for TEXT'));
            } else {
                cache.STRING_FRAGMENT.push(this.value);
                return '$_R.push($_S['+(cache.STRING_FRAGMENT.length-1)+']);';
            }
        }
    },element.Base)
});

element.ELSIFElement = util.defineClass({
    type: 'elsif',
    getCode: function() {
        if (this.isCloseTag) {
            throw(new Error('HTML.Template ParseError No Close Tag for TMPL_ELSIF'));
        } else {
            return '}else if(' + this.getCondition() + '){';
        }
    }
},element.IFElement);

element.UNLESSElement = util.defineClass({
    type: 'unless',
    getCondition: function(param) {
        return "!" + this.getParam(param);
    }
},element.IFElement);


element.createElement = function(type, option) {
    return new element[type + 'Element'](option);
};

var parseHTMLTemplate = function(source) {
    var chunks = [];
    var createElement = element.createElement;
    var root  = createElement('ROOT', {
        isCloseTag: false
    });
    var matcher = CHUNK_REGEXP_ATTRIBUTE;
    chunks.push(root);

    while (source.length > 0) {
        var results = matcher(source);
        if (!results) {
            chunks.push(createElement('TEXT', source));
            source = '';
            break;
        }
        var index = 0;
        var fullText = results.fullText;
        if ((index = source.indexOf(fullText)) > 0) {
            var text = source.slice(0, index);
            chunks.push(createElement('TEXT', text));
            source = source.slice(index);
        }
        var attr,name,value;
        if ( results.attribute_name ) {
            name  = results.attribute_name.toLowerCase();
            value = results.attribute_value;
            attr  = {};
            attr[name]      = value;
            attr['default'] = results['default'];
            attr.escape     = results.escape;
        } else {
            attr = undefined;
        }
        chunks.push(createElement(results.tag_name, {
            'attributes': attr,
            'isCloseTag'  : results.close,
            'parent'    : this
        }));
        source = source.slice(fullText.length);
    }
    chunks.push(createElement('ROOT', {
        isCloseTag: true
    }));
    return chunks;
};

module.exports.getFunctionText = function(chunksOrSource){
    var chunks = util.isString(chunksOrSource) ? parseHTMLTemplate( chunksOrSource ) : chunksOrSource;
    var codes = [];
    for(var i=0,l=chunks.length;i<l;i++){codes.push(chunks[i].getCode());}
    return codes.join('\n');
};

module.exports.compileFunctionText = function(functionText){
    /*jshint evil: true */
    return util.curry(new Function('cache','param','funcs',functionText),cache);
};


ns.provide(module.exports);
});

/**
@fileOverview brook/view/htmltemplate.js
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace window document Node*/

/**
@name brook.view.htmltemplate
@namespace 簡易なHTMLTemplate実装を提供します。
*/
Namespace('brook.view.htmltemplate')
.use('brook.view.htmltemplate.core *')
.define(function(ns){
    var merge =  function(origin,target){
        for(var prop in target ){
            if( !target.hasOwnProperty(prop) )
                continue;
            origin[prop] = target[prop];
        }
    };
    var meta = {   
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
    var _map = function(list,mapper){
        var result = [];
        for( var i=0,l= list.length;i<l;i++){
            result.push( mapper( list[i] ) );
        }
        return result;
    };
    var quote = function(str) {
        return '"' + _map(str.split(''),function(e){return meta[e] ? meta[e] : e ;}).join('') +'"';
    };
    var GLOBAL_FUNC = {
        __escapeHTML:function(str){
            return str
                .toString()
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/'/g, '&#039;')
                .replace(/"/g, '&quot;');
        },
        __escapeJS:function(str){
            return quote(str);
        },
        __escapeURL:function(str){
            return encodeURI(str);
        },
        __escapeNONE:function(str){
            return str;
        },
        __include : function(name,param,func){
            var tmpl = Klass.getByElementId(name);
            if( !tmpl ){
                return;
            }
            tmpl.param(param);
            tmpl.registerFunction(func);
            return tmpl.output();
        }
    };
    var Klass = function _HTMLTemplate(func){
        this._param  = {};
        this._funcs  = {};merge(this._funcs,GLOBAL_FUNC);
        this._output = func;
    };
    merge( Klass.prototype , {
        param : function(obj){
            merge( this._param , obj );
        },
        registerFunction :function(name,func){
            this._funcs[name] = func;
        },
        output : function(){
            return this._output( this._param , this._funcs );
        }
    } );
    var COMMENT_NODE = ( 'Node' in window )? Node.COMMENT_NODE : 8;
    var _getSourceFromElement = function(element){
        var children = element.childNodes || [] ;
        var result = [];
        for ( var i =0,l=children.length;i<l;i++){
            var e = children[i];
            if( e.nodeType != COMMENT_NODE ){
                continue;
            }
            result.push( e.data );
        }
        return result.join('');
    };
    var _getFunctionTextFromElement = function( element ) {
        return ns.getFunctionText(_getSourceFromElement( element ));
    };
    merge( Klass , {
        cache : {},
        get : function(source){
            var uniqId = 'autocache:' + Klass.hashFunction(source);
            var func = Klass.resolve( uniqId );
            if( func )
                return new Klass( func );
            var functionBody   = ns.getFunctionText(source);
            var outputFunction = ns.compileFunctionText(functionBody );
            return new Klass( Klass.reserve( uniqId , outputFunction ) );
        },
        resolve : function(name){
            return Klass.cache[name];
        },
        reserve : function(name,outputFunction){
            Klass.cache[name] = outputFunction;
            return Klass.cache[name];
        },
        getByElementId : function(elementId){
            var uniqId = 'dom:' + elementId;
            var func   = Klass.resolve( uniqId );
            if( func ){ return new Klass( func ); }
            var element = document.getElementById( elementId );
            if( !element ){ return undefined; }
            
            var functionBody = _getFunctionTextFromElement( element );
            var outputFunction = ns.compileFunctionText(functionBody );
            return new Klass( Klass.reserve( uniqId , outputFunction ) );
        },
        hashFunction  : function(string){
            var max = (1 << 31);
            var length = string.length;
            var ret    = 34351;
            var pos    = 'x';
            for (var i = 0; i < length; i++) {
                var c = string.charCodeAt(i);
                ret *= 37;
                pos ^= c;
                ret += c;
                ret %= max;
            }
            return ret.toString(16)+'-'+(pos & 0x00ff).toString(16) ;
        },
        registerFunction : function(name,func){
            GLOBAL_FUNC[name] = func;
        }
    });

    
    ns.provide({
        HTMLTemplate : Klass
    });
});

/**
@fileOverview brook/compat.js
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace window HTMLElement document*/

/**
@name brook.dom.compat
@namespace details here
*/
Namespace('brook.dom.compat')
.define(function(ns){
    /**
     * Returns HTMLElement.dataset by the specified HTMLElement.
     *
     * NOTE: This function is preceding upgraded to fix
     * https://github.com/hirokidaichi/brook/pull/22.
     *
     * NOTE: You should care an undefined attribute value to keep compatible
     * for Android default browser.
     *
     * In Android default broswer:
     *     dataset[somethingUnexistentAttr] === ''.
     *
     * But in other browsers:
     *     dataset[somethingUnexistentAttr] === undefined.
     *
     * @name brook.dom.compat.dataset
     * @function
     */
    var dataset = (function(){
        var camelize = function(string){
            return string.replace(/-+(.)?/g, function(match, chr) {
              return chr ? chr.toUpperCase() : '';
            });
        };
        var datasetNative = function(element){
            return element.dataset;
        };
        var datasetCompat = function(element){
            var sets = {};
            for(var i=0,a=element.attributes,l=a.length;i<l;i++){
                var attr = a[i];
                if( !attr.name.match(/^data-/) ) continue;
                sets[camelize(attr.name.replace(/^data-/,''))] = attr.value;
            }
            return sets;
        };

        // Graceful fallback for browsers do not support dataset yet.
        var isNativeDatasetAvailable = 'DOMStringMap' in window;
        return isNativeDatasetAvailable ? datasetNative : datasetCompat;
    })();

    var ClassList = function(element){
        this._element = element;
        this._refresh();
    };
    var classList = function(element){
        return new ClassList(element);
    };

    (function(proto){
        var check = function(token) {
            if (token === "") {
                throw "SYNTAX_ERR";
            }
            if (token.indexOf(/\s/) != -1) {
                throw "INVALID_CHARACTER_ERR";
            }
        };
        this._fake = true;
        this._refresh = function () {
            var classes = (this._element.className || '').split(/\s+/);
            if (classes.length && classes[0] === "") {
                classes.shift();
            }
            if (classes.length && classes[classes.length - 1] === "") {
                classes.pop();
            }
            this._classList = classes;
            this.length = classes.length;
            return this;
        };
        this.item = function (i) {
            return this._classList[i] || null;
        };
        this.contains = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this._classList[i] == token) {
                    return true;
                }
            }
            return false;
        };
        this.add = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this._classList[i] == token) {
                    return;
                }
            }
            this._classList.push(token);
            this.length = this._classList.length;
            this._element.className = this._classList.join(" ");
        };
        this.remove = function (token) {
            check(token);
            for (var i = 0; i < this._classList.length; ++i) {
                if (this._classList[i] == token) {
                    this._classList.splice(i, 1);
                    this._element.className =  this._classList.join(" ");
                }
            }
            this.length = this._classList.length;
        };
        this.toggle = function (token) {
            check(token);
            for (var i = 0; i < this.length; ++i) {
                if (this._classList[i] == token) {
                    this.remove(token);
                    return false;
                }
            }
            this.add(token);
            return true;
        };
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
            ret.push( allElements[i] );
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

/*global Namespace*/

Namespace('brook.dom.gateway')
.define(function(ns){

    ns.provide({});
});

/**
@fileOverview brook/widget.js
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace*/

/**
@name brook.widget
@namespace details here
*/
Namespace('brook.widget')
.use('brook promise')
.use('brook.channel *')
.use('brook.util *')
.use('brook.dom.compat *')
.define(function(ns){
    var TARGET_CLASS_NAME = 'widget';

    var classList = ns.classList;
    var dataset   = ns.dataset;
    var widgetChannel = ns.channel('widget');
    var errorChannel  = ns.channel('error');

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
            removeClassName((targetClassName||TARGET_CLASS_NAME),widget);
            var data            = dataset(widget);
            var widgetNamespace = data.widgetNamespace;
            if( !widgetNamespace ) continue;
            if( !map[widgetNamespace] ) map[widgetNamespace] = [];
            map[widgetNamespace].push( [widget, data] );
        }
        n(map);
    });
    var mapToPairs = ns.promise(function(n,map){
        var pairs = [];
        for( var namespace in map )
            if( map.hasOwnProperty( namespace ) )
                pairs.push([namespace, map[namespace]]);
        n(pairs);
    });
    var applyNamespace = ns.promise(function(n, pair) {
        Namespace.use([pair[0] , '*'].join(' ')).apply(function(ns){
            n([ns, pair[1]]);
        });
    });
    var registerElements = ns.promise(function(n, v) {
        var _ns       = v[0];
        var widgets   = v[1];
        var i,l;
        try {
            if (_ns.registerElement) {
                for( i=0,l=widgets.length;i<l;i++){
                    _ns.registerElement.apply(null, widgets[i]);
                }
            } else if (_ns.registerElements) {
                var elements = [];
                for( i=0,l=widgets.length;i<l;i++){
                    elements.push(widgets[i][0]);
                }
                _ns.registerElements(elements);
            } else {
                throw('registerElement or registerElements not defined in ' + _ns.CURRENT_NAMESPACE);
            }
        }
        catch (e) {
            errorChannel.sendMessage(e);
        }
    });

    var updater = ns.promise()
        .bind( 
            ns.lock('class-seek'),
            elementsByClassName,
            mapByNamespace,
            mapToPairs,
            ns.unlock('class-seek'),
            ns.scatter(),
            applyNamespace,
            registerElements
        );

    widgetChannel.observe(updater);

    ns.provide({
        bindAllWidget : widgetChannel.send()
    });
});

