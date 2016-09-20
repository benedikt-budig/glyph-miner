(function () {

  angular.module('glyphMinerApp.viewer').config(config);

  function config($stateProvider) {
    // Static Route Configuration for Viewer
    $stateProvider
      .state('viewer', {
        abstract: true,
        url: '/viewer',
        templateUrl: 'app/viewer/viewer.html'
      })
      .state('viewer.collection', {
        url: '/collection/:collectionId?templates',
        views: {
          '': {
            templateUrl: 'app/viewer/document-column.html',
            controller: 'CollectionDocumentController as collectionDocuments'
          },
          'templateControl@viewer.collection': {
            templateUrl: 'app/viewer/template-control.html',
            controller: 'TemplateControlController as tCtrl'
          }
        }
      })
      .state('viewer.collection.image', {
        url: '/image/:imageId',
        views: {
          'viewPanel@viewer.collection': {
            templateUrl: 'app/viewer/view-panel.html',
            controller: 'ViewController as view'
          }
        }
      })
      .state('viewer.document', {
        url: '/image/:imageId?templates',
        views: {
          '': {
            templateUrl: 'app/viewer/viewer-document.html'
          },
          'viewPanel@viewer.document': {
            templateUrl: 'app/viewer/view-panel.html',
            controller: 'ViewController as view'
          },
          'templateControl@viewer.document': {
            templateUrl: 'app/viewer/template-control.html',
            controller: 'TemplateControlController as tCtrl'
          }
        }
      })
      ;
  }
}());
