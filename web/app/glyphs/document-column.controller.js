(function () {

  angular.module('glyphMinerApp.glyphs').controller('DocumentColumnController', DocumentColumnController);
  
  DocumentColumnController.$inject = ['$rootScope', 'DocumentService'];
  
  function DocumentColumnController($rootScope, DocumentService) {
    var vm = this;
    
    vm.collections = [];
    vm.documents = [];
    vm.toggleCollectionSelection = toggleCollectionSelection;
    vm.toggleDocumentSelection = toggleDocumentSelection
    
    activate();
    
    ////////////////
    
    function activate() {
      getCollections();
      getDocuments();
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

    function toggleCollectionSelection(element) {
      if (element.selected) {
        element.selected = false;
        $rootScope.$broadcast('collectionDeselected', element);
      } else {
        element.selected = true;
        $rootScope.$broadcast('collectionSelected', element);
      }
    }
    
    function toggleDocumentSelection(element) {
      if (element.selected) {
        element.selected = false;
        $rootScope.$broadcast('documentDeselected', element);
      } else {
        element.selected = true;
        $rootScope.$broadcast('documentSelected', element);
      }
    }
  }

}());
