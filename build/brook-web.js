if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}

if (!Array.prototype.reduce)
{
  Array.prototype.reduce = function(fun /*, initialValue */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var k = 0;
    var accumulator;
    if (arguments.length >= 2)
    {
      accumulator = arguments[1];
    }
    else
    {
      do
      {
        if (k in t)
        {
          accumulator = t[k++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++k >= len)
          throw new TypeError();
      }
      while (true);
    }

    while (k < len)
    {
      if (k in t)
        accumulator = fun.call(undefined, accumulator, t[k], k, t);
      k++;
    }

    return accumulator;
  };
}

if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
        res[i] = fun.call(thisp, t[i], i, t);
    }

    return res;
  };
}

if (!Array.prototype.every)
{
  Array.prototype.every = function(fun /*, thisp */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t && !fun.call(thisp, t[i], i, t))
        return false;
    }

    return true;
  };
}

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Array.prototype.some)
{
  Array.prototype.some = function(fun /*, thisp */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t && fun.call(thisp, t[i], i, t))
        return true;
    }

    return false;
  };
}

if (!Array.prototype.reduceRight)
{
  Array.prototype.reduceRight = function(callbackfn /*, initialValue */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof callbackfn !== "function")
      throw new TypeError();

    // no value to return if no initial value, empty array
    if (len === 0 && arguments.length === 1)
      throw new TypeError();

    var k = len - 1;
    var accumulator;
    if (arguments.length >= 2)
    {
      accumulator = arguments[1];
    }
    else
    {
      do
      {
        if (k in this)
        {
          accumulator = this[k--];
          break;
        }

        // if array contains no values, no initial value to return
        if (--k < 0)
          throw new TypeError();
      }
      while (true);
    }

    while (k >= 0)
    {
      if (k in t)
        accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
      k--;
    }

    return accumulator;
  };
}

/* namespace-js Copyright (c) 2010 @hiroki_daichi */
var Namespace = (function(){
    /* utility */
    var merge = function(aObj,bObj){
        for( var p in bObj ){
            if( bObj.hasOwnProperty( p ) ){
                aObj[p] = bObj[p];
            }
        }
        return aObj;
    };
    var _assertValidFQN = function(fqn){
        if(!(/^[a-z0-9_.]+/).test(fqn))
            throw('invalid namespace');
    };

    var Proc = (function(){
        /* Namespace Class */
        var Proc = (function(){
            /* constructor*/
            var Klass = function _Private_Class_Of_Proc(){
                this.state = {};
                this._status = 'init';
                this.steps = [];
            };
            (function(){
                this.next = function(state){
                    if(state) this.enqueue(state);
                    return this;
                };
                this.isRunning = function(){
                    return (this._status === 'running');
                };
                this.enqueue = function(state){
                    this.steps.push(state);
                };
                this.dequeue = function(){
                    return this.steps.shift();
                };
                this.call = function(initialState,callback){
                    if( this.isRunning() ) {
                        throw("do not run twice");
                    }
                    this.state = initialState || {};
                    this.enqueue(function($c){
                        $c();
                        if(callback)callback(this);
                    });
                    this._status = 'running';
                    this._invoke();
                };
                this._invoke = function(){
                    var _self = this;
                    var step = _self.dequeue();
                    if( !step ){
                        this._status = 'finished';
                        return;
                    }
                    if( step.call ) {
                        return step.call( _self.state,function _cont(state){
                            if( state ){
                                _self.state = state;
                            }
                            _self._invoke();
                        });
                    }
                    var finishedProcess = 0;
                    if( step.length === 0 ){
                        _self._invoke();
                    }
                    for(var i =0,l=step.length;i<l;i++){
                        step[i].call(_self.state,function _joinWait(){
                            finishedProcess++;
                            if( finishedProcess == l ){
                                _self._invoke();
                            }
                        });
                    }
                };
            }).apply(Klass.prototype);
            return Klass;
        })();
        return function next(state){
            var proc = new Proc;
            return proc.next(state);
        };
    })();

    var NamespaceObject = (function(){
        var nsCache = {};
        var Klass = function _Private_Class_Of_NamespaceObject(fqn){
            this.stash   = {
                CURRENT_NAMESPACE : fqn
            };
            this.name = fqn;
            this.proc = Proc();
        };
        (function(){
            this.enqueue = function(context){
                this.proc.next(context);
            };
            this.call = function(state,callback){
                this.proc.call({},callback);
            };
            this.valueOf = function(){
                return "#NamespaceObject<" + this.name + ">";
            };
            this.merge = function(obj){
                merge(this.stash,obj);
                return this;
            };
            this.getExport = function(importNames){
               var retStash = {};
                for(var i = 0,l=importNames.length;i<l;i++){
                    var importSyntax = importNames[i];
                    if( importSyntax === '*' ) return this.stash;
                    retStash[importSyntax] = this.stash[importSyntax];
                }
                return retStash;
            };
            this.getStash = function(){
                return this.stash;
            };
         }).apply(Klass.prototype);
         
         return {
            create :function(fqn){
                _assertValidFQN(fqn);
                if( nsCache[fqn] )
                    return nsCache[fqn];
                var ns = nsCache[fqn] = new Klass(fqn);
                return ns;
            }
        };
    })();

    var NamespaceDefinition = (function(){
        var Klass = function _Private_Class_Of_NamespaceDefinition(namespaceObject){
            this.namespaceObject = namespaceObject;

            this.requires       = [];
            this.useList        = [];
            this.stash          = {};
            this.defineFunc ;

            var _self = this;
            this.namespaceObject.enqueue( function($c){ 
                _self.apply($c);
            });

        };
        (function(){
            this.use = function(syntax){
                this.useList.push(syntax);
                var splittedUseSyntax = syntax.split(/\s/);
                var fqn = splittedUseSyntax[0];
                var imp = splittedUseSyntax[1];
                var importNames = (imp) ? imp.split(/,/): null;
                _assertValidFQN(fqn);
                this.requires.push(function($c){
                    var context = this;
                    var require = NamespaceObject.create(fqn);
                    require.call(this,function(state){
                        context.loadImport(require,importNames);
                        $c();
                    });
                });
                return this;
            };
            this._mergeStash = function(obj){
                merge( this.stash,obj );
            };
            this._mergeStashWithNS = function(nsObj){
                var ns     = nsObj.name;
                var nsList = ns.split(/\./);
                var current = this.getStash();

                for(var i = 0,l=nsList.length;i<l-1;i++){
                    if( !current[nsList[i]] ) current[nsList[i]] = {};
                    current = current[nsList[i]];
                }

                var lastLeaf = nsList[nsList.length-1];
                if( current[lastLeaf] )
                    return merge( current[lastLeaf] , nsObj.getStash() );

                return current[lastLeaf] = nsObj.getStash();
            };
            this.loadImport = function(nsObj,importNames){
                if( importNames ){
                    this._mergeStash( nsObj.getExport(importNames) );
                }else{
                    this._mergeStashWithNS( nsObj );
                }
            };
            this.define = function(callback){
                var nsObj = this.namespaceObject;
                var nsDef = this;
                this.defineFunc = function($c){
                    var ns = {
                        provide : function(obj){
                            nsObj.merge(obj);
                            $c();
                        }
                    };
                    merge( ns, nsDef.getStash() );
                    merge( ns, nsObj.getStash() );
                    callback(ns);
                };
            };
            this.getStash = function(){
                return this.stash;
            };
            this.valueOf = function(){
                return "#NamespaceDefinition<"+this.namespaceObject+"> uses :" + this.useList.join(',');
            };
            this.apply = function(callback){
                var nsDef = this;
                var nsObj = this.namespaceObject;
                Proc(this.requires).next(this.defineFunc).call(this,function(){
                    callback( nsDef.getStash() );
                });
            };
         }).apply(Klass.prototype);
         return Klass;
    })();


    var namespaceFactory = function(nsString){
        return new NamespaceDefinition(NamespaceObject.create(nsString || 'main'));
    };
    namespaceFactory.Object     = NamespaceObject;
    namespaceFactory.Definition = NamespaceDefinition;
    namespaceFactory.Proc       = Proc;

    namespaceFactory('namespace').define(function(ns){
        ns.provide({
            Proc : Proc
        });
    });
    return namespaceFactory;
})();


Namespace.use = function(useSyntax){ return Namespace().use(useSyntax); }
Namespace.fromInternal = (function(){
    var get = (function(){
        var createRequester = function() {
            var xhr;
            try { xhr = new XMLHttpRequest() } catch(e) {
                try { xhr = new ActiveXObject("Msxml2.XMLHTTP.6.0") } catch(e) {
                    try { xhr = new ActiveXObject("Msxml2.XMLHTTP.3.0") } catch(e) {
                        try { xhr = new ActiveXObject("Msxml2.XMLHTTP") } catch(e) {
                            try { xhr = new ActiveXObject("Microsoft.XMLHTTP") } catch(e) {
                                throw new Error( "This browser does not support XMLHttpRequest." )
                            }
                        }
                    }
                }
            }
            return xhr;
        };
        var isSuccessStatus = function(status) {
            return (status >= 200 && status < 300) || 
                    status == 304 || 
                    status == 1223 ||
                    (!status && (location.protocol == "file:" || location.protocol == "chrome:") );
        };
        
        return function(url,callback){
            var xhr = createRequester();
            xhr.open('GET',url,true);
            xhr.onreadystatechange = function(){
                if(xhr.readyState === 4){
                    if( isSuccessStatus( xhr.status || 0 )){
                        callback(true,xhr.responseText);
                    }else{
                        callback(false);
                    }
                }
            };
            xhr.send('')
        };
    })();

    return function(url,isManualProvide){
        return function(ns){
            get(url,function(isSuccess,responseText){
                if( isSuccess ){
                    if( isManualProvide )
                        return eval(responseText);
                    else
                        return ns.provide( eval( responseText ) );
                }else{
                    var pub = {};
                    pub[url] = 'loading error';
                    ns.provide(pub);
                }
            });
        };
    };
})();

Namespace.GET = Namespace.fromInternal;
Namespace.fromExternal = (function(){
    var callbacks = {};
    var createScriptElement = function(url,callback){
        var scriptElement = document.createElement('script');

        scriptElement.loaded = false;
        
        scriptElement.onload = function(){
            this.loaded = true;
            callback();
        };
        scriptElement.onreadystatechange = function(){
            if( !/^(loaded|complete)$/.test( this.readyState )) return;
            if( this.loaded ) return;
            scriptElement.loaded = true;
            callback();
        };
        scriptElement.src = url;
        document.body.appendChild( scriptElement );
        return scriptElement.src;
    };
    var domSrc = function(url){
        return function(ns){
            var src = createScriptElement(url,function(){
                var name = ns.CURRENT_NAMESPACE;
                var cb = callbacks[name];
                delete callbacks[name];
                cb( ns );
            });
        }
    };
    domSrc.registerCallback = function(namespace,callback) {
        callbacks[namespace] = callback;
    };
    return domSrc;
})();

try{
    if( module ){
        module.exports = Namespace;
    }
}catch(e){}
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
        waitUntil : waitUntil,
        emitInterval: emitInterval
    });
});



Namespace('brook.lamda')
.define(function(ns){
    var cache = {};
    var hasArg = function(expression){
        return /->/.test(expression);
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
                this.promises.forEach(function(p){ p.run( v );});
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
    var Model = function(){
        this.methods = {};
        this.channels= {};
    };
    Model.prototype.addMethod = function(method,promise){
        var channel = ns.createChannel();
        this.methods[method] = promise.bind( channel.send() );
        this.channels[method] = channel;
        return this;
    };
    Model.prototype.notify = function(method){
        return ns.promise().bind( this.methods[method] );
    };
    Model.prototype.observe   = function(method,observer){
        this.channels[method].observe( observer );
        return this;
    
    };
    var createModel = function(){
        return new Model;
    };
    ns.provide({
        createModel : createModel
    });
});
/*
    var m = createModel;
    m.addMethod('create',ns.promise().bind());
    m.addMethod('delete',ns.promise().bind());

    m.observe('create',view);
*/

Namespace('brook.dom.compat')
.use(function(){});
Namespace('brook.dom.gateway')
.define(function(ns){
    ns.provide({});
});
