(function () {

  angular.module('glyphMinerApp.glyphs').controller('TemplateColumnController', TemplateColumnController);
  
  TemplateColumnController.$inject = ['$scope', '$rootScope', 'TemplateService', 'apiBasePath'];
  
  function TemplateColumnController($scope, $rootScope, TemplateService, apiBasePath) {
    var vm = this;
    
    vm.templates = [];
    vm.apiBasePath = apiBasePath;
    vm.toggleSelection = toggleSelection;
    
    ////////////////
    
    $scope.$on('documentSelected', function(event, args) {
      addDocumentTemplatesToList(args);
    });
    
    $scope.$on('documentDeselected', function(event, args) {
      removeDocumentTemplatesFromList(args);
    });
    
    $scope.$on('collectionSelected', function(event, args) {
      addCollectionTemplatesToList(args);
    });
    
    $scope.$on('collectionDeselected', function(event, args) {
      removeCollectionTemplatesFromList(args);
    });
    
    function addDocumentTemplatesToList(document) {
      return TemplateService.getTemplates(document.id)
        .then(function(data) {
          for (var i = 0; i < data.length; i++) {
            data[i].image_title = document.title;
            vm.templates.push(data[i]);
          }
          return vm.templates;
        });      
    }
    
    function removeDocumentTemplatesFromList(document) {
      var i = vm.templates.length;
      for (; i-- ;) {
        if (vm.templates[i].origin_collection_id == undefined 
                     && vm.templates[i].image_id == document.id) {
          $rootScope.$broadcast('templateDeselected', vm.templates[i]);
          vm.templates.splice(i, 1);
          }
      }
    }
    
    function addCollectionTemplatesToList(collection) {
      return TemplateService.getCollectionTemplates(collection.id)
        .then(function(data) {
          for (var i = 0; i < data.length; i++) {
            data[i].origin_collection_id = collection.id;
            data[i].origin_collection_title = collection.title;
            vm.templates.push(data[i]);
          }
          return vm.templates;
        });      
    }
    
    function removeCollectionTemplatesFromList(collection) {
      var i = vm.templates.length;
      for (; i-- ;) {
        if (vm.templates[i].origin_collection_id == collection.id) {
          $rootScope.$broadcast('templateDeselected', vm.templates[i]);
          vm.templates.splice(i, 1);
        }
      }    
    }
    
    function toggleSelection(element) {
      if (element.selected) {
        element.selected = false;
        $rootScope.$broadcast('templateDeselected', element);
      } else {
        element.selected = true;
        $rootScope.$broadcast('templateSelected', element);
      }
    }
  }

}());
