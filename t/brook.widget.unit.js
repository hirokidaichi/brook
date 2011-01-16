
Namespace('test').use('brook.dom.compat *').define(function(ns){
    var counter = 0;
    var isValidElement=  function(element,namespace){
        test('test'+counter++,function(){
            ok(element);
            ok(! ns.classList(element).contains('widget') );
            equal( ns.dataset(element).widgetNamespace , namespace );
        })
    }
    ns.provide({
        isValidElement : isValidElement 
    });
});

Namespace('widget.test01')
.use('test *')
.use('brook.util *')
.use('brook.widget *')
.use('brook.channel *')
.use('brook.dom.compat *')
.define(function(ns){
    var classList = ns.classList;
    var dataset   = ns.dataset;
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
.use('brook.dom.compat *')
.define(function(ns){
    var classList = ns.classList;
    var dataset   = ns.dataset;
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
.use('brook.dom.compat *')
.define(function(ns){
    var classList = ns.classList;
    var dataset   = ns.dataset;
    var i = 0;
    ns.provide({
        registerElement:function(element){
            ns.isValidElement(element,'widget.test03')
        }
    });
});
