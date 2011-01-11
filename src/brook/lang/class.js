Namespace('brook.lang.class')
.define(function(ns){
    ns.provide({
        defineClass: function() {
            var properties = $A(arguments);
            var klass = function() {
                this.initialize.apply(this, arguments);
            }
            for (var i = 0, l = properties.length; i < l; i++)
                for (var property in properties[i]) 
                    klass.prototype[property] = properties[i][property];

            if (!klass.prototype.initialize)
                klass.prototype.initialize = function(){};
            klass.prototype.constructor = klass;
            return klass;
        }
    })
});
