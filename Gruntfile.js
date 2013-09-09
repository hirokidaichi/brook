/**
 * Usage
 *
 * $ npm install
 * $ grunt (jshint|qunit|concat|uglify)
 *
**/

module.exports = function(grunt) {
    var core = [
        'src/brook.js',
        'src/brook/util.js',
        'src/brook/lambda.js',
        'src/brook/channel.js',
        'src/brook/model.js'
    ];
    var htp = [
        'build/brook-view-htmltemplate-core.js'
    ];
    var compat = [].concat(
        core,
        htp,
        [
            'src/brook/view/htmltemplate.js',
            'src/brook/dom/compat.js',
            'src/brook/dom/gateway.js',
            'src/brook/widget.js'
        ]
    );
    var mobile = [].concat(
        compat,
        'src/brook/mobile/dom/event.js'
    );

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /* jshint */
        jshint: {
            all: ['src/**/*.js','t/**/*.js', '!t/tlib/**/*.js']
        },

        /* qunit */
        qunit: {
            all: ['t/**/*.html']
        },

        /* concat */
        concat : {
            core: {
                src: core,
                dest: 'build/brook-core.js'
            },
            htp: {
                options : {
                    banner: 'Namespace("brook.view.htmltemplate.core")\n\
.define(function(ns){\n\
var module = { exports : {}};\n\
',
                    footer: 'ns.provide(module.exports);\n\
});\n\
'
                },
                src: ['lib/html-template-core.js'],
                dest: 'build/brook-view-htmltemplate-core.js'
            },
            compat: {
                src: compat,
                dest: 'build/brook.js'
            },
            mobile: {
                src: mobile,
                dest: 'build/brook-mobile.js'
            }
        },

        /* uglify min */
        uglify: {
            mobile: {
                src: ['build/brook-mobile.js'],
                dest: 'build/brook.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};
