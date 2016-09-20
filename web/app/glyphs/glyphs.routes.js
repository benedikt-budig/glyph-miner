(function () {

  angular.module('glyphMinerApp.glyphs').config(config);
  
  function config($stateProvider, $urlRouterProvider) {
    // Static Route Configuration for Overview
    $stateProvider
      .state('glyphs', {
        url: "/glyphs",
        views: {
          '': {
            templateUrl: "app/glyphs/glyphs.html"
          },
          'documentColumn@glyphs': {
            templateUrl: "app/glyphs/document-column.html",
            controller: 'DocumentColumnController as documentColumn'
          },
          'templateColumn@glyphs': {
            templateUrl: "app/glyphs/template-column.html",
            controller: 'TemplateColumnController as templateColumn'
          },
          'glyphList@glyphs': {
            templateUrl: "app/glyphs/glyph-list.html",
            controller: 'GlyphListController as glyphList'
          }
        }        
      })
  }

}());

