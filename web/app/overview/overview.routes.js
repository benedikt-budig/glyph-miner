(function () {

  angular.module('glyphMinerApp.overview').config(config);

  function config($stateProvider, $urlRouterProvider) {
    // Static Route Configuration for Overview
    $stateProvider
      .state('overview', {
        url: "/overview",
        views: {
          '': {
            templateUrl: "app/overview/document-list.html",
            controller: 'DocumentListController as documentList'
          },
          'documentCRUD@overview': {
            templateUrl: "app/overview/document-crud.html",
            controller: 'DocumentCRUDController as documentCRUD'
          }
        }
      });
  }

}());
