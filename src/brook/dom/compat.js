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
