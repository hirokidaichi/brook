/**
@fileOverview brook.lambda
@author daichi.hiroki<hirokidaichi@gmail.com>
*/


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
        var func = new Function( parsed.argumentNames,"return ("+ parsed.body + ");");
        cache[expression] = func;
        return func;
    };
    ns.provide({
        lambda : lambda
    });
});
