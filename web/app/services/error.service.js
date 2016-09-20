(function () {

  angular.module('glyphMinerApp.core').factory('ErrorService', ErrorService);

  ErrorService.$inject = ['$rootScope'];

  function ErrorService($rootScope) {
    $rootScope.alerts = [];
    var service = {
      alert : alert
    };

    return service;

    ////////////////

    function alert(msg, error) {
      $rootScope.alerts.push({
        msg: msg,
        discard: function() { removeAlert(this); }
      });
      console.log(error);
    }

    function removeAlert(alert) {
      var i = $rootScope.alerts.indexOf(alert);
      $rootScope.alerts.splice(i, 1);
    }
  }

}());
