(function () {

  angular.module('glyphMinerApp.core').factory('PageService', PageService);

  PageService.$inject = ['$http', 'apiBasePath', 'ErrorService'];

  function PageService($http, apiBasePath, ErrorService) {
    var service = {
      requestSyntheticPages : requestSyntheticPages,
      requestSyntheticLines : requestSyntheticLines,
      requestSyntheticPagesCollection : requestSyntheticPagesCollection,
      requestSyntheticLinesCollection : requestSyntheticLinesCollection
    };

    return service;

    ////////////////

    function requestSyntheticPages(imageId, paramsAndText) {
      return $http.post(apiBasePath + '/images/' + imageId + '/synthetic_pages', paramsAndText)
      .then(getComplete)
      .catch(errorHandler);
    }

    function requestSyntheticLines(imageId, paramsAndText) {
      return $http.post(apiBasePath + '/images/' + imageId + '/synthetic_pages?lines_only=true', paramsAndText)
      .then(getComplete)
      .catch(errorHandler);
    }

    function requestSyntheticPagesCollection(collectionId, paramsAndText) {
      return $http.post(apiBasePath + '/collections/' + collectionId + '/synthetic_pages', paramsAndText)
      .then(getComplete)
      .catch(errorHandler);
    }

    function requestSyntheticLinesCollection(collectionId, paramsAndText) {
      return $http.post(apiBasePath + '/collections/' + collectionId + '/synthetic_pages?lines_only=true', paramsAndText)
      .then(getComplete)
      .catch(errorHandler);
    }

    function getComplete(response) {
      return response.headers('Location');
    }

    function errorHandler(error) {
      ErrorService.alert("The Page Service encountered an error while trying to access the API (" + error.statusText + "). " +
                         "Make sure the server is running and accessible.", error.data);
    }
  }

}());
