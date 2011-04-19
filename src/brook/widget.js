/**
@fileOverview brook/widget.js
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


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
            removeClassName((targetClassName||TARGET_CLASS_NAME),widget);
            var dataset = ns.dataset(widget);
            if( !dataset.widgetNamespace ) continue;
            if( !map[dataset.widgetNamespace] ) map[dataset.widgetNamespace] = [];
            map[dataset.widgetNamespace].push( widget );
        }
        n(map);
    });
    var registerElements = ns.promise(function(n,map){
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
        .bind( mapByNamespace )
        .bind( ns.unlock('class-seek') )
        .bind( registerElements );
  
    updater.subscribe();
    ns.provide({
        bindAllWidget : bindAllWidget
    });
});

