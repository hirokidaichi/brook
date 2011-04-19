
Namespace()
.use('brook *')
.use('brook.util *')
.use('brook.lambda *')
.use('brook.channel *')
.use('brook.model *')
.apply(function(ns){

test('exports',function(){
    var exports = "promise wait mapper debug cond match filter lambda VERSION".split(/ /g);

    expect( exports.length);
    for( var i = 0,l=exports.length;i<l;i++){
        var e = exports[i];
        ok(ns[e],e);
    }
});

test('promise',function(){
    expect(3);
    var p = ns.promise(function(n,val){
        ok(true,'pass');
        n(val)
    }).bind(ns.mapper(ns.lambda("$*$")));
    
    p.bind(p).subscribe(function(val){
        ok( val == 10000 ,'val');
    },10);
});

test('lambda',function(){
    expect(4);
    with(ns){
        equal( lambda('$*$')(2),4);
        equal( lambda('$*$')(2),4);
        equal( lambda('x,y->x*y')(2,3),6);
        equal( lambda('x,y->z->x*y*z')(2,3)(2),12);
    }
});

test('promise defer',function(){
    expect(3);
    stop();
    var p = ns.promise(function(n,val){
        ok(true,'pass');
        n(val);
    }).bind(ns.mapper(ns.lambda("$*$"))).bind(ns.wait(100));

    ns.from(10).bind(p).bind(p).subscribe(function(val){;
        equal( val, 10000 ,'val');
        start();
    });
});

test('cond',function(){with(ns){
    expect(6);
    var p = promise().bind(
        cond(lambda('$ == 10'),promise(function(n,v){
            ok(true);
            equal( v,10);
            n(v)
        })),
        cond(lambda('$ % 2 ==0'),promise(function(n,v){
            ok( v%2 == 0);
            n(v)
        })),
        cond(lambda('$ == 11'),promise(function(n,v){
            ok(true);
            equal(v,11);
            n(v)
        }))
    );
    scatter().bind(p).run([10,11,12]);
}});

test('match',function(){with(ns){
    expect(4);
    var p = promise().bind(
        match({
            10 : ns.promise(function(n,v){ equal(v,10);n(v)}),
            11 : ns.promise(function(n,v){ equal(v,11);}),
            12 : ns.promise(function(n,v){ equal(v,12);})
        }).bind(function(n,v){
            equal(v,10);
        })
    );
    scatter().bind(p).run([10,11,12]);
}});

test('named channel',function(){
    expect(12);
    var test = ns.promise(function(n,v){
        ok(n);
        equals( v.length , 3);
    });
    
    ns.from(ns.channel('test-channel'))
        .bind(test).subscribe();
    ns.from(ns.channel('test-channel'))
        .bind(test).subscribe();
    var l = ns.scatter()
    .bind( ns.mapper( ns.lambda('$*$')))
    .bind( ns.takeBy(3) )
    .bind( ns.sendChannel('test-channel'))

    l.run([1,2,3,4,5,6,7,8,9]);

});

test('channel',function(){
    expect(12);
    var channel = ns.channel();
    var test = ns.promise(function(n,v){
        ok(n);
        equals( v.length , 3);
    });
    ns.from( channel ).bind( test ).subscribe();

    ns.from( channel ).bind( test ).subscribe();

    var l = ns.scatter()
    .bind( ns.mapper( ns.lambda('$*$')))
    .bind( ns.takeBy(3) )
    .bind( channel.send())

    l.run([1,2,3,4,5,6,7,8,9]);
});


test('model',function(){
    expect(4);
    stop();
    var network = ns.wait(100).bind(function(n,v){
        n({ result : 'helloworld' ,args : v});
    });
    var view1 = ns.promise(function(n,v){
        equal( v.result , 'helloworld' );
        equal( v.args   , 20 );
    });
    var view2 = ns.promise(function(n,v){
        equal( v.result , 'helloworld' );
        equal( v.args   , 20 );
        start();
    });
    var model = ns.createModel();
    model.addMethod('create',ns.mapper(ns.lambda('$*2')).bind(network));

    ns.from( model.method('create') ).bind( view1 ).subscribe();
    ns.from( model.method('create') ).bind( view2 ).subscribe();
    ns.promise().bind(model.notify('create')).run(10);
});



test('lock',function(){
    stop();
    var counter = 0;
    var inc = function(next,val){
        counter++;
        next(val);
    };
    var sync = ns.lock('test')
        .bind(ns.wait(10))
        .bind(inc,inc,inc)
        .bind(ns.wait(10))
        .bind(inc,inc,inc)
        .bind(function(n,v){ ok(counter%6==0);n(v)})
        .bind(ns.unlock('test'));

    var randWait = ns.scatter().bind( ns.wait( ns.lambda('Math.random()*400')));

    randWait.bind(sync).bind(ns.takeBy(6),function(n,v){
        start();
        n(v);
    }).run([1,2,3,4,5,6])

});


});



