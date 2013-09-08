/* global HTMLTemplate:false, Namespace:false, test:false, expect:false, ok:false, equal:false, stop:false, start:false */

var COMPLEX_TMPL =[
    '<h1>Test <TMPL_VAR NAME=name></h1>',
    '<p>',
    '<TMPL_LOOP NAME=loop>',
    '<TMPL_IF NAME=case1>',
    'Case-1<div>xx</div>',
    '<TMPL_ELSE>',
    '<TMPL_IF NAME=case2>',
    'Case-2<div>xx</div>',
    '<TMPL_ELSE>',
    '<TMPL_IF NAME=case3>',
    'Case-3<div>xx</div>',
    '<TMPL_ELSE>',
    'Other cases<div>xx</div>',
    '</TMPL_IF>',
    '</TMPL_IF>',
    '</TMPL_IF>',
    '</TMPL_LOOP>',
    '<img src="../../resources/test.jpg">',
    '</p>'
].join('\n');


Namespace('main')
.use('brook.view.htmltemplate HTMLTemplate')
.apply(function(ns){

test('var',function(){
    var x = ns.HTMLTemplate.get('<TMPL_VAR NAME=test1><TMPL_VAR NAME=test2><TMPL_VAR NAME=test3>');
    x.param({test1:1,test2:2,test3:3});
    equal(x.output(),'123');
    x = ns.HTMLTemplate.get(':<TMPL_VAR NAME=test1>:<TMPL_VAR NAME=test2>:<TMPL_VAR NAME=test3>:');
    x.param({test1:1,test2:2,test3:3});
    equal(x.output(),':1:2:3:');
    x = ns.HTMLTemplate.get('\n:<TMPL_VAR NAME=test1>:<TMPL_VAR NAME=test2>:<TMPL_VAR NAME=test3>:\n');
    x.param({test1:1,test2:2,test3:3});
    equal(x.output(),'\n:1:2:3:\n');

    x = ns.HTMLTemplate.get('<TMPL_VAR NAME=test>:');
    x.param({});
    equal(x.output(),':');
});

test('if',function(){
    var x = ns.HTMLTemplate.get('<TMPL_IF NAME=test>hogehoge</TMPL_IF>');
    x.param({test:1});
    equal(x.output(),'hogehoge');
    x.param({test:0});
    equal(x.output(),'');
    x.param({});
    equal(x.output(),'');
});


test('else',function(){
    var x = ns.HTMLTemplate.get('<TMPL_IF NAME=test>いいいい<TMPL_ELSE>ああああ</TMPL_IF>');
    x.param({test:1});
    equal(x.output(),'いいいい');
    x.param({test:0});
    equal(x.output(),'ああああ');

    x = ns.HTMLTemplate.get('<TMPL_IF NAME=test>いいいい<TMPL_ELSE><TMPL_IF NAME=test2>ぬぬぬ<TMPL_ELSE>おおお</TMPL_IF></TMPL_IF>');
    x.param({test:0,test2:true});
    equal(x.output(),'ぬぬぬ');
    x.param({test:0,test2:false});
    equal(x.output(),'おおお');
});

test('unless',function(){
    var x = ns.HTMLTemplate.get('<TMPL_UNLESS NAME=test>いいいい<TMPL_ELSE>ああああ</TMPL_UNLESS>');
    x.param({test:1});
    equal(x.output(),'ああああ');
    x.param({test:0});
    equal(x.output(),'いいいい');

    x = ns.HTMLTemplate.get('<TMPL_UNLESS NAME=test>いいい<TMPL_ELSE><TMPL_UNLESS NAME=test2>ぬぬぬ<TMPL_ELSE>おおお</TMPL_UNLESS></TMPL_UNLESS>');
    x.param({test:0,test2:true});
    equal(x.output(),'いいい');
    x.param({test:1,test2:false});
    equal(x.output(),'ぬぬぬ');
});

test('loop',function(){
    var x = ns.HTMLTemplate.get('<TMPL_LOOP NAME=test>あ</TMPL_LOOP>');
    x.param({test:[1,2,3,4,5]});
    equal(x.output(),'あああああ');
    var y = ns.HTMLTemplate.get('<TMPL_LOOP NAME=test>あ</TMPL_LOOP>');
    y.param({test1:[1,2,3,4,5]});
    equal(y.output(),'');
    
    var z = ns.HTMLTemplate.get('<TMPL_LOOP NAME=level1><TMPL_VAR NAME=var1><TMPL_LOOP NAME=level2><TMPL_VAR NAME=var2></TMPL_LOOP></TMPL_LOOP>');
    z.param({
        level1:[
            {var1:'hello',level2:[{var2:'world'}]},
            {var1:'hello2',level2:[{var2:'world1'},{var2:'world2'}]}
        ]
    });
    equal(z.output(),'helloworldhello2world1world2');
});

test('default',function(){
    var tmpl=ns.HTMLTemplate.get('<TMPL_VAR NAME="aaa" DEFAULT="a">');
    equal('a',tmpl.output());
    var tmplB=ns.HTMLTemplate.get('<TMPL_VAR  DEFAULT="a" NAME="aaa">');
    equal('a',tmplB.output());
});

test('escape',function(){
    var tmpl=ns.HTMLTemplate.get('<TMPL_VAR NAME="aaa" ESCAPE=HTML>');
    tmpl.param({
        aaa:"<div>hoge</div>"
    });
    equal('&lt;div&gt;hoge&lt;/div&gt;',tmpl.output());

    tmpl=ns.HTMLTemplate.get('<TMPL_VAR NAME="aaa" ESCAPE=JS>');
    tmpl.param({
        aaa:"aaa\n\n"
    });
    equal('"aaa\\n\\n"',tmpl.output());

    tmpl=ns.HTMLTemplate.get('<TMPL_VAR NAME="aaa" ESCAPE=URL>');
    tmpl.param({
        aaa:"http://www.js/ ほげ"
    });
    equal('http://www.js/%20%E3%81%BB%E3%81%92',tmpl.output());
});

test('expr',function(){
    var x = ns.HTMLTemplate.get('<TMPL_VAR EXPR="func(test)">');
    x.param({
        test:'hogehoge'
    });
    x.registerFunction('func',function(t){return t+'::::';});
    equal(x.output(),'hogehoge::::');

    ns.HTMLTemplate.registerFunction('moremore',function(){
        return 'HELP!';
    });

    x = ns.HTMLTemplate.get('<TMPL_VAR EXPR="moremore()">');

    equal(x.output(),'HELP!');

    x = ns.HTMLTemplate.get('<TMPL_LOOP EXPR="func(test)">i</TMPL_LOOP>');
    x.registerFunction('func',function(t){return [t,t,t,t,t,t,t,t,t,t];});
    x.param({
        test:10
    });
    equal(x.output(),'iiiiiiiiii');

    var y = ns.HTMLTemplate.get('<TMPL_IF EXPR="func(test)">i<TMPL_ELSIF EXPR="test">love</TMPL_IF>');
    y.registerFunction('func',function(t){return !t;});
    y.param({
        test:false
    });
    equal(y.output(),'i');

    y.param({
        test:true
    });
    equal(y.output(),'love');
    var z = ns.HTMLTemplate.get('<TMPL_UNLESS EXPR="func(test)">love</TMPL_UNLESS>');
    z.param({
        test:true
    });
    z.registerFunction('func',function(t){return !t;});
    equal(z.output(),'love');
});

test('ex-expr',function(){
     var test04 = ns.HTMLTemplate.get('<TMPL_LOOP NAME=aaa><TMPL_LOOP NAME=bbb><TMPL_LOOP NAME=ccc><TMPL_VAR EXPR="a"></TMPL_LOOP></TMPL_LOOP></TMPL_LOOP>');
    test04.param({
        aaa :[
            {bbb:[
                {ccc:[
                    {a:'hoge'}
                ]}
            ]}
        ]
    });
    equal('hoge',test04.output());
    var test05 = ns.HTMLTemplate.get('<TMPL_LOOP NAME=aaa><TMPL_LOOP NAME=bbb><TMPL_LOOP NAME=ccc><TMPL_VAR EXPR="{/a}"></TMPL_LOOP></TMPL_LOOP></TMPL_LOOP>');
    test05.param({
        aaa :[
            {bbb:[
                {ccc:[
                    {a:'hoge'}
                ]}
            ]}
        ],
        a :'huga'
    });
    equal('huga',test05.output());
    var test06 = ns.HTMLTemplate.get('<TMPL_LOOP NAME=aaa><TMPL_LOOP NAME=bbb><TMPL_LOOP NAME=ccc><TMPL_VAR EXPR="{../a}"></TMPL_LOOP></TMPL_LOOP></TMPL_LOOP>');
    test06.param({
        aaa :[
            {bbb:[
                {ccc:[
                    {a:'hoge'}
                ],a:'piyo'}
            ],a:'moga'}
        ],
        a :'huga'
    });
    equal('piyo',test06.output());
    var test07 = ns.HTMLTemplate.get('<TMPL_LOOP NAME=aaa><TMPL_LOOP NAME=bbb><TMPL_LOOP NAME=ccc><TMPL_VAR EXPR="{../../a}"></TMPL_LOOP></TMPL_LOOP></TMPL_LOOP>');
    test07.param({
        aaa :[
            {bbb:[
                {ccc:[
                    {a:'hoge'}
                ],a:'piyo'}
            ],a:'moga'}
        ],
        a :'huga'
    });
    equal('moga',test07.output());
});

test('include',function(){
    var tmpl = ns.HTMLTemplate.getByElementId('test02_tmpl');
    tmpl.param({
    outer:[
        {loop:[
            {test:1},
            {test:2},
            {test:3}
        ]},
        {loop:[
            {test:1},
            {test:2},
            {test:3}
        ]}
    ]
    });
    equal('hello123*123*hello',tmpl.output());
});


});
