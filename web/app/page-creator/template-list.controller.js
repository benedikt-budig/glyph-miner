(function () {

  angular.module('glyphMinerApp.pageCreator').controller('TemplateListController', TemplateListController);

  TemplateListController.$inject = ['$scope', '$rootScope', '$stateParams', 'filterFilter', 'DocumentService', 'TemplateService', 'apiBasePath'];

  function TemplateListController($scope, $rootScope, $stateParams, filterFilter, DocumentService, TemplateService, apiBasePath) {
    var vm = this;

    vm.collection = {};
    vm.document = {};
    vm.title = "";
    vm.templates = [];
    vm.matches = {};
    vm.selectedTemplate = {};
    vm.apiBasePath = apiBasePath;

    vm.selectTemplate = selectTemplate;

    activate();

    ////////////////

    function activate() {
      // distinguish between collection and single document
      if ($stateParams.collectionId){
        // get collection
        getCollection($stateParams.collectionId);

        // get templates and all matches
        getCollectionTemplates($stateParams.collectionId).then(function(templates) {
          getCollectionMatches($stateParams.collectionId, templates);
        });
      } else {
        // get document
        getDocument($stateParams.imageId);

        // get templates and all matches
        getDocumentTemplates($stateParams.imageId).then(function(templates) {
          getDocumentMatches($stateParams.imageId, templates);
        });
      }
    }

    function getCollection(collectionId) {
      return DocumentService.getCollection(collectionId)
        .then(function(data) {
          vm.collection = data;
          vm.title = vm.collection.title;
          return vm.collection;
        });
    }

    function getDocument(imageId) {
      return DocumentService.getDocument(imageId)
        .then(function(data) {
          vm.document = data;
          vm.title = vm.document.title;
          return vm.document;
        });
    }

    function getDocumentTemplates(imageId) {
      return TemplateService.getTemplates(imageId)
        .then(function(data) {
          vm.templates = data;
          return vm.templates;
        });
    }

    function getCollectionTemplates(collectionId) {
      return TemplateService.getCollectionTemplates(collectionId)
        .then(function(data) {
          vm.templates = data;
          return vm.templates;
        });
    }

    function getCollectionMatches(collectionId, templates) {
      for (var i = 0; i < templates.length; i++)
        TemplateService.getCollectionMatches(collectionId, templates[i].id)
          .then(function (matches) {filterAndShuffleMatches(matches);});
    }

    function getDocumentMatches(imageId, templates) {
      for (var i = 0; i < templates.length; i++)
        TemplateService.getMatches(imageId, templates[i].id)
          .then(function (matches) {filterAndShuffleMatches(matches);});
    }

    function filterAndShuffleMatches(matches) {
      // filter the matches according to model and "disabled" state
      var filteredMatches = filterFilter(matches, filterGlyph);

      // make sure we have any matches left
      if (filteredMatches.length > 0) {
        // and shuffle them
        shuffle(filteredMatches);
        vm.matches[matches[0].template_id] = filteredMatches;
      }
    }

    function filterGlyph(value, index, array) {
      var score = value.score;
      var label = value.label_value;
      var disabled = value.disabled;
      if (disabled)
        return false;
      if (score == 1.0)
        return true;
      if (label == "user_positive")
        return true;
      if (label < 0.5)
        return true;
      return false;
    }

    function shuffle(array) {
      var m = array.length, t, i;
      while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }
      return array;
    }

    function selectTemplate(templ) {
      vm.selectedTemplate = templ;
      $rootScope.$broadcast('templateSelected', templ);
    }
  }
}());
