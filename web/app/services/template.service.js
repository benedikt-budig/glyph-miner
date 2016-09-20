(function () {

  angular.module('glyphMinerApp.core').factory('TemplateService', TemplateService);

  TemplateService.$inject = ['$http', 'apiBasePath', 'ErrorService'];

  function TemplateService($http, apiBasePath, ErrorService) {
    var service = {
      getTemplates                  : getTemplates,
      getTemplate                   : getTemplate,
      getCollectionTemplates        : getCollectionTemplates,
      getCollectionTemplate         : getCollectionTemplate,
      getUnlabeledMatches           : getUnlabeledMatches,
      getUnlabeledCollectionMatches : getUnlabeledCollectionMatches,
      postTemplate                  : postTemplate,
      deleteTemplate                : deleteTemplate,
      getMatches                    : getMatches,
      getCollectionMatches          : getCollectionMatches,
      putTypography                 : putTypography
    };

    return service;

    ////////////////

    function getTemplates(documentId) {
      return $http.get(apiBasePath + '/images/' + documentId + '/templates')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getTemplate(documentId, templateId) {
      return $http.get(apiBasePath + '/images/' + documentId + '/templates/' + templateId)
        .then(getComplete)
        .catch(errorHandler);
    }

    function getCollectionTemplates(collectionId) {
      return $http.get(apiBasePath + '/collections/' + collectionId + '/templates')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getCollectionTemplate(collectionId, templateId) {
      return $http.get(apiBasePath + '/collections/' + collectionId + '/templates/' + templateId)
        .then(getComplete)
        .catch(errorHandler);
    }

    function postTemplate(documentId, template) {
      return $http.post(apiBasePath + '/images/' + documentId + '/templates', template)
        .then(getComplete)
        .catch(errorHandler);
    }

    function deleteTemplate(documentId, templateId) {
      return $http.delete(apiBasePath + '/images/' + documentId + '/templates/' + templateId)
        .then(getComplete)
        .catch(errorHandler);
    }

    function getMatches(documentId, templateId) {
      return $http.get(apiBasePath + '/images/' + documentId + '/templates/' + templateId + '/matches?predict=true')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getCollectionMatches(collectionId, templateId) {
      return $http.get(apiBasePath + '/collections/' + collectionId + '/templates/' + templateId + '/matches?predict=true')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getUnlabeledMatches(documentId, templateId) {
      return $http.get(apiBasePath + '/images/' + documentId + '/templates/' + templateId + '/matches?predict=false')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getUnlabeledCollectionMatches(collectionId, templateId) {
      return $http.get(apiBasePath + '/collections/' + collectionId + '/templates/' + templateId + '/matches?predict=false')
        .then(getComplete)
        .catch(errorHandler);
    }

    function putTypography(imageId, templateId, typo) {
      return $http.put(apiBasePath + '/images/' + imageId + '/templates/' + templateId + '/typography', typo)
        .then(getComplete)
        .catch(errorHandler);
    }

    function getComplete(response) {
      return response.data;
    }

    function errorHandler(error) {
      ErrorService.alert("The Template Service encountered an error while trying to access the API (" + error.statusText + "). " +
                         "Make sure the server is running and accessible.", error.data);
    }
  }

}());
