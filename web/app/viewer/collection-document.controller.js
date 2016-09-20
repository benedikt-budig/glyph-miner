(function () {

  angular.module('glyphMinerApp.viewer').controller('CollectionDocumentController', CollectionDocumentController);

  CollectionDocumentController.$inject = ['$scope', '$rootScope', '$state', '$stateParams', 'DocumentService'];

  function CollectionDocumentController($scope, $rootScope, $state, $stateParams, DocumentService) {
    var vm = this;

    vm.collection = {};
    vm.documents = [];
    vm.selectedDocument = {};
    vm.selectedMatches = {};

    vm.selectDocument = selectDocument;

    activate();

    ////////////////

    function activate() {
      getCollection($stateParams.collectionId);
      getCollectionDocuments($stateParams.collectionId)
        .then(function(data) {
          // select the first document, if no imageId is given.
          // TODO: $stateParams.imageId is never defined, since imageId belongs to the child state
          if (!$stateParams.imageId)
            selectDocument(data[0]);
          else
            for (var i = 0; i < data.length; i++)
              if (data[i].id == $stateParams.imageId)
                selectDocument(data[i]);
        });
    }

    $scope.$on('matchesLoaded', function(event, templateId, matches) {
      vm.selectedMatches[templateId] = matches;
    });

    $scope.$on('matchesRemoved', function(event, templateId) {
      delete vm.selectedMatches[templateId];
    });

    function getCollection(collectionId) {
      return DocumentService.getCollection(collectionId)
        .then(function(data) {
          vm.collection = data;
          return vm.collection;
        });
    }

    function getCollectionDocuments(collectionId) {
      return DocumentService.getCollectionDocuments(collectionId)
        .then(function(data) {
          vm.documents = data;
          return vm.documents;
        });
    }

    function selectDocument(document) {
      for (var i = 0; i < vm.documents.length; i++)
        vm.documents[i].selected = false;
      document.selected = true;
      vm.selectedDocument = document;
      //$state.go("viewer.collection.image", {collectionId: vm.collection.id, imageId: document.id}, {location: true, notify: false, reload: false});
      $rootScope.$broadcast('documentSelected', document);
      $state.go("viewer.collection.image", {collectionId: $stateParams.collectionId, imageId: document.id});
    }
  }
}());
