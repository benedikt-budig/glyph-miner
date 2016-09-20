(function () {

  angular.module('glyphMinerApp.core').factory('LabelService', LabelService);

  LabelService.$inject = ['$http', 'apiBasePath', 'ErrorService'];

  function LabelService($http, apiBasePath, ErrorService) {
    var service = {
      postLabel : postLabel,
      putModel  : putModel,
      putSelect : putSelect
    };

    return service;

    ////////////////

    function postLabel(match, label) {
      return $http.post(apiBasePath + '/images/' + match.image_id + '/templates/' + match.template_id + '/matches/' + match.id + '/label', label)
        .then(getComplete)
        .catch(errorHandler);
    }

    function putModel(imageId, templateId, model) {
      return $http.put(apiBasePath + '/images/' + imageId + '/templates/' + templateId + '/model', model)
        .then(getComplete)
        .catch(errorHandler);
    }

    function putSelect(match, select) {
      return $http.put(apiBasePath + '/images/' + match.image_id + '/templates/' + match.template_id + '/matches/' + match.id + '/select', select)
        .then(getComplete)
        .catch(errorHandler);
    }

    function getComplete(response) {
      return response.data;
    }

    function errorHandler(error) {
      ErrorService.alert("The Label Service encountered an error while trying to access the API (" + error.statusText + "). " +
                         "Make sure the server is running and accessible.", error.data);
    }
  }

}());
