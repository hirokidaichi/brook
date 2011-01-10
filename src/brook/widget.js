Namespace('brook.widget')
.use('brook promise')
.use('brook.dom.compat *')
.define(function(ns){
    var callByClassName = function(className){
        var widgetElements = ns.getElementsByClassName(className || 'widget');
        var map = {};
        for( var i = 0,l=widgetElements.length;i<l;i++){
            var widget = widgetElements[i];
            var dataset = ns.dataset(widget);
            if( !dataset.widgetNamespace ) continue;
            if( !map[dataset.widgetNamespace] ) map[dataset.widgetNamespace] = [];
            map[dataset.widgetNamespace].push( widget );
        }
        for( var namespace in map ){
            if( !map.hasOwnProperty( namespace ) ) continue;
            var targets = map[namespace];
            Namespace.use([namespace , '*'].join(' ')).apply(function(_ns){
                if (_ns.registerElement) {
                    targets.forEach(function(target) {
                        _ns.registerElement(target);
                    });
                } else if (_ns.registerElements) {
                    _ns.registerElements( targets );
                } else {
                    throw('registerElement or registerElements not defined in ' + namespace);
                }
            });
        }
    };
    ns.provide({
        callByClassName : callByClassName
    });
});

