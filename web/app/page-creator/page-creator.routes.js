(function () {

  angular.module('glyphMinerApp.pageCreator').config(config);

  function config($stateProvider, $urlRouterProvider) {
    // Static Route Configuration for Overview
    $stateProvider
      .state('page-creator', {
        url: "/page-creator",
        views: {
          '': {
            templateUrl: "app/page-creator/page-creator.html",
            abstract: true,
          }
        }
      })
      .state('page-creator.collection', {
        url: '/collection/:collectionId',
        views: {
          'templateColumn@page-creator': {
            templateUrl: "app/page-creator/template-column.html",
            controller: 'TemplateListController as templateColumn'
          },
          'typesettingColumn@page-creator.collection': {
            templateUrl: "app/page-creator/typesetting-column.html",
            controller: 'TypesettingController as typesettingColumn'
          },
          'pageColumn@page-creator.collection': {
            templateUrl: "app/page-creator/page-column.html",
            controller: 'PageController as pageColumn'
          }
        }
      })
      .state('page-creator.document', {
        url: '/document/:imageId',
        views: {
          'templateColumn@page-creator': {
            templateUrl: "app/page-creator/template-column.html",
            controller: 'TemplateListController as templateColumn'
          },
          'typesettingColumn@page-creator.document': {
            templateUrl: "app/page-creator/typesetting-column.html",
            controller: 'TypesettingController as typesettingColumn'
          },
          'pageColumn@page-creator.document': {
            templateUrl: "app/page-creator/page-column.html",
            controller: 'PageController as pageColumn'
          }
        }
      })      ;
  }

}());
