(function () {

  angular.module('glyphMinerApp.activeLearner').config(config);

  function config($stateProvider, $urlRouterProvider) {
    // Static Route Configuration for ActiveLearner
    $stateProvider
      .state('active-learner', {
        abstract: true,
        url: '/learn',
        templateUrl: 'app/active-learner/active-learner.html',
      })
      .state('active-learner.collection', {
        abstract: true,
        url: "/collection/:collectionId/template/:templateId",
        templateUrl: 'app/active-learner/frame.html',
        controller: 'LearningController as learnCtrl'
      })
      .state('active-learner.collection.learn', {
        url: '',
        views: {
          'tiles': {
            templateUrl: "app/active-learner/tiles.html",
            controller: 'TileController as tileCtrl'
          }
        }
      })
      .state('active-learner.document', {
        abstract: true,
        url: "/image/:imageId/template/:templateId",
        templateUrl: 'app/active-learner/frame.html',
        controller: 'LearningController as learnCtrl'
      })
      .state('active-learner.document.learn', {
        url: '',
        views: {
          'tiles': {
            templateUrl: "app/active-learner/tiles.html",
            controller: 'TileController as tileCtrl'
          }
        }
      });
  }

}());
