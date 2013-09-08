/* global HTMLTemplate:false, Namespace:false, test:false, expect:false, ok:false, equal:false, stop:false, start:false */

Namespace('test')
.use('brook.dom.compat classList,dataset')
.define(function(ns){
    var counter = 0;
    var isValidElement=  function(element,namespace){
        test('test'+counter++,function(){
            ok(element, 'element exists');
            ok(! ns.classList(element).contains('widget'),'element contains class-name "widget"');
            equal( ns.dataset(element).widgetNamespace , namespace );
        });
    };
    ns.provide({
        isValidElement : isValidElement
    });
});

Namespace('widget.testerror')
.use('brook *')
.use('test *')
.use('brook.channel *')
.define(function(ns){
    var errorHandler = ns.promise(function(n,v) {
        test('testerror',function(){
            equal(v, 'registerElement error');
        });
    });
    ns.observeChannel('error', errorHandler);
    ns.provide({
        registerElement:function(element, dataset){
            ns.isValidElement(element,'widget.testerror');
            throw('registerElement error');
        }
    });
});

Namespace('widget.test01')
.use('test *')
.use('brook.widget *')
.define(function(ns){
    ns.provide({
        registerElement : function(element){
            ns.isValidElement(element,'widget.test01');
            element.innerHTML = "<div class='widget' data-widget-namespace='widget.test03'>hello</div>";
            ns.bindAllWidget.run();
        }
    });
});
Namespace('widget.test02')
.use('test *')
.define(function(ns){
    ns.provide({
        registerElements : function(elements){
            for (var i=0,l= elements.length;i<l;i++){
                ns.isValidElement(elements[i],'widget.test02');
            }
        }
    });
});
Namespace('widget.test03')
.use('test *')
.define(function(ns){
    ns.provide({
        registerElement:function(element, dataset){
            ns.isValidElement(element,dataset.widgetNamespace);
        }
    });
});
