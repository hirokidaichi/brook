/*
  SUPPORTED TASKS
    * default ( concat > min > lint > qunit )
    * lint
    * qunit
    * concat
      * concat:core
      * concat:htp
      * concat:compat
      * concat:mobile
    * min
*/


/*global module:false*/
module.exports = function(grunt) {

  // CONFIG
  grunt.initConfig({
    // lint task config
    lint: {
      files: ['grunt.js', 'src/**/*.js', 'build/brook-core.js', 'build/brook-mobile.js', 'build/brook-view-htmltemplate-core.js', 'build/brook.js']
    },

    // qunit task config
    qunit: {
      files: ['t/**/*.html']
    },

    // jshint config
    jshint: {
      options: {
      },
      globals: {}
    },

    // concat task config
    concat: {
      core: {
        src: ['src/brook.js','src/brook/util.js','src/brook/lambda.js','src/brook/channel.js','src/brook/model.js'],
        dest: 'build/brook-core.js'
      },
      htp: {
        src: ['<file_enclose_with_namespace:brook.view.htmltemplate.core:lib/html-template-core.js>'],
        dest: 'build/brook-view-htmltemplate-core.js'
      },
      compat: {
        src: ['<concat_nest:core>','<concat_nest:htp>','src/brook/view/htmltemplate.js','src/brook/dom/compat.js','src/brook/dom/gateway.js','src/brook/widget.js'],
        dest: 'build/brook.js'
      },
      mobile: {
        src: ['<concat_nest:compat>','src/brook/mobile/dom/event.js'],
        dest: 'build/brook-mobile.js'
      }
    },

    // minify task config
    min: {
      mobile: {
        src: ['build/brook-mobile.js'],
        dest: 'build/brook.min.js'
      }
    }
  });

  // ALIASES
  // default
  grunt.registerTask('default', 'concat min lint qunit');


  // HELPERS
  // file_enclose_with_namespace
  grunt.registerHelper('file_enclose_with_namespace', function(namespace, filepath) {
    /*jshint multistr:true */
    var src = grunt.file.read(filepath);

    var before = 'Namespace("' + namespace + '")\n\
.define(function(ns){\n\
var module = { exports : {}};\n\
';
    var after  = 'ns.provide(module.exports);\n\
});\n\
';

    return before + src + after;
  });

  // concat_nest
  grunt.registerHelper('concat_nest', function(name) {
    return grunt.helper('concat', grunt.file.expandFiles(grunt.config.get('concat.'+name+'.src')));
  });
};
