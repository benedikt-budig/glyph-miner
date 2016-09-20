(function () {

  angular.module('glyphMinerApp.core').factory('DocumentService', DocumentService);

  DocumentService.$inject = ['$http', 'apiBasePath', 'Upload', 'ErrorService'];

  function DocumentService($http, apiBasePath, Upload, ErrorService) {
    var service = {
      getDocuments           : getDocuments,
      getDocument            : getDocument,
      postDocument           : postDocument,
      getCollections         : getCollections,
      getCollection          : getCollection,
      postCollection         : postCollection,
      getCollectionDocuments : getCollectionDocuments,
      relate                 : relate,
      uploadImage            : uploadImage
    };

    return service;

    ////////////////

    function getDocuments() {
      return $http.get(apiBasePath + '/images')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getDocument(id) {
      return $http.get(apiBasePath + '/images/' + id)
        .then(getComplete)
        .catch(errorHandler);
    }

    function postDocument(document) {
      jsonData = angular.toJson(document);
      return $http.post(apiBasePath + '/images', jsonData)
        .then(getComplete)
        .catch(errorHandler);
    }

    function getCollections() {
      return $http.get(apiBasePath + '/collections')
        .then(getComplete)
        .catch(errorHandler);
    }

    function getCollection(id) {
      return $http.get(apiBasePath + '/collections/' + id)
        .then(getComplete)
        .catch(errorHandler);
    }

    function postCollection(collection) {
      jsonData = angular.toJson(collection);
      return $http.post(apiBasePath + '/collections', jsonData)
        .then(getComplete)
        .catch(errorHandler);
    }

    function getCollectionDocuments(id) {
      return $http.get(apiBasePath + '/collections/' + id + '/images')
        .then(getComplete)
        .catch(errorHandler);
    }

    function relate(collectionId, documentId) {
      var relation = {image_id: documentId, collection_id: collectionId};
      return $http.post(apiBasePath + '/memberships', angular.toJson(relation))
        .then(getComplete)
        .catch(errorHandler);
    }

    function uploadImage(documentId, file, isBinarized) {
      return Upload.upload({
        url: apiBasePath + '/images/' + documentId + (isBinarized ? "/binarized" : "/color"),
        headers: {'Content-Type': "multipart/form-data"},
        file: file
      })
      .then(getComplete)
      .catch(errorHandler);
    }

    function getComplete(response) {
      return response.data;
    }

    function errorHandler(error) {
      console.log(error);
      ErrorService.alert("The Document Service encountered an error while trying to access the API (" + error.statusText + "). " +
                         "Make sure the server is running and accessible.", error.data);
    }
  }

}());
