/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      files: ['grunt.js', 'src/**/*.js']
    },
    qunit: {
      files: ['t/**/*.html']
    },
    jshint: {
      options: {
      },
      globals: {}
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit');

};
