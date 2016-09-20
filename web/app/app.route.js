(function () {

  angular.module('glyphMinerApp').config(config);

  function config($urlRouterProvider, $stateProvider) {
    // For any unmatched url, send to /overview
    $urlRouterProvider.otherwise("/overview");

    $stateProvider
      .state('about', {
        url: '/about',
        templateUrl: 'app/about.html'
      });
  }

}());
