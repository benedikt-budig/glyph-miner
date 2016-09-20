(function () {

  angular.module('glyphMinerApp.overview').controller('DocumentListController', DocumentListController);

  DocumentListController.$inject = ['DocumentService'];

  function DocumentListController(DocumentService) {
    var vm = this;

    vm.documents = [];
    vm.collections = [];
    vm.reload = activate;

    activate();

    ////////////////

    function activate() {
      getDocuments();
      getCollections();
    }

    function getDocuments() {
      return DocumentService.getDocuments()
        .then(function(data) {
          vm.documents = data;
          return vm.documents;
        });
    }

    function getCollections() {
      return DocumentService.getCollections()
        .then(function(data) {
          vm.collections = data;
          return vm.collections;
        })
        .then(function(collections){
          angular.forEach(collections, function(collection) {
            DocumentService.getCollectionDocuments(collection.id)
              .then(function(data) {
                collection.images = data;
              });
          });
        });
    }


  }

}());
