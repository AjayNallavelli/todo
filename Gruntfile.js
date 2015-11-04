/*

Default Gruntfile for AppGyver Steroids
http://www.appgyver.com
Licensed under the MIT license.

*/

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-steroids');
  grunt.registerTask('default', [
    'jshint',
    'jscs',
    'steroids-make-fresh'
  ]);

  grunt.initConfig({
    jscs: {
      options: {
        config: '.jscsrc',
        force: true,
        verbose: true
      },
      src: ['app/xlist/**/*.js']
    },
    jshint: {
      options: {
        force: true,
        jshintrc: '.jshintrc'
      },
      src: ['app/xlist/**/*.js']
    },
  });
}
