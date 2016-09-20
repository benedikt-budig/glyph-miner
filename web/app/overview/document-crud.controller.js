(function () {

  angular.module('glyphMinerApp.overview').controller('DocumentCRUDController', DocumentCRUDController);

  DocumentCRUDController.$inject = ['DocumentService', '$scope'];

  function DocumentCRUDController(DocumentService, $scope) {
    var vm = this;

    vm.document = {};
    vm.document.title = "";
    vm.document.subtitle = "";
    vm.document.author = "";
    vm.document.year = "";
    vm.document.signature = "";

    vm.docForm = {};
    vm.docForm.collection = 0;
    vm.docForm.imageColor = [];
    vm.docForm.imageBinarized = [];

    vm.collection = {};
    vm.collection.title = "";
    vm.collection.subtitle = "";
    vm.collection.author = "";
    vm.collection.year = "";
    vm.collection.signature = "";

    vm.newDocument = newDocument;
    vm.newCollection = newCollection;
    vm.processingUpload = false;

    vm.collections = [];

    activate();

    ////////////////

    function activate() {
      getCollections();
    }

    function getCollections() {
      return DocumentService.getCollections()
        .then(function(data) {
          vm.collections = data;
          return vm.collections;
        });
    }

    function newDocument() {
      vm.processingUpload = true;
      return DocumentService.postDocument(vm.document)
        .then(function(document) {
          return DocumentService.uploadImage(document.id, vm.docForm.imageColor, false);
        })
        .then(function(document) {
          return DocumentService.uploadImage(document.id, vm.docForm.imageBinarized, true);
        })
        .then(function(document){
          if (vm.docForm.collection !== 0)
            return DocumentService.relate(vm.docForm.collection, document.id);
        })
        .finally(function(){
          vm.processingUpload = false;
          resetDocument();
          // tell document list to reload
          $scope.$parent.documentList.reload();
        });
    }

    function newCollection() {
      return DocumentService.postCollection(vm.collection)
        .then(function() {
          // update list of collections for document CRUD dropdown
          getCollections();
          // reset collection form
          resetCollection();
          // tell document list to reload
          $scope.$parent.documentList.reload();
        });
    }

    function resetDocument() {
      vm.document = {};
      vm.document.title = "";
      vm.document.subtitle = "";
      vm.document.author = "";
      vm.document.year = "";
      vm.document.signature = "";

      vm.docForm = {};
      vm.docForm.collection = 0;
      vm.docForm.imageColor = [];
      vm.docForm.imageBinarized = [];

      vm.docFormElement.$setPristine();
      vm.docFormElement.$setUntouched();
    }

    function resetCollection() {
      vm.collection = {};
      vm.collection.title = "";
      vm.collection.subtitle = "";
      vm.collection.author = "";
      vm.collection.year = "";
      vm.collection.signature = "";
      
      vm.colFormElement.$setPristine();
      vm.colFormElement.$setUntouched();
    }
  }

}());
