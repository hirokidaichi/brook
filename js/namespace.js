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
