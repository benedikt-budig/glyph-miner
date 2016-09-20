(function () {

  angular.module('glyphMinerApp.viewer').controller('TemplateControlController', TemplateControlController);

  TemplateControlController.$inject = ['$scope', '$rootScope', '$stateParams', 'filterFilter', 'apiBasePath', 'TemplateService'];

  function TemplateControlController($scope, $rootScope, $stateParams, filterFilter, apiBasePath, TemplateService) {
    var vm = this;

    vm.apiBasePath = apiBasePath;
    vm.document = null;
    vm.templates = [];
    vm.templateCrop = {tl: {x: 0, y:0},
                       br: {x: 0, y:0}};
    vm.templateChar = '';

    vm.startPicking = startPicking;
    vm.cancelPicking = cancelPicking;
    vm.postTemplate = postTemplate;
    vm.nowPicking = false;
    vm.nowMatching = false;

    vm.matches = {};
    vm.getTemplateMatches = getTemplateMatches;
    vm.removeTemplateMatches = removeTemplateMatches;
    vm.activeTemplateId = null;

    vm.deleteTemplate = deleteTemplate;

    vm.panToMatch = panToMatch;

    ////////////////

    $scope.$on('documentSelected', function(event, document) {
      vm.document = document;
      vm.nowPicking = false;
      vm.templateCrop = {tl: {x: 0, y:0},
                         br: {x: 0, y:0}};
      getTemplates(document).then(function(data) {
        // check templates in query parameter (if any)
        if ($stateParams.templates) {
          var queryTemplateIds = $stateParams.templates.split(",");
          for (var i = 0; i < queryTemplateIds.length; i++) {
            var templateId = queryTemplateIds[i];
            if (!vm.matches.hasOwnProperty(templateId)) {
              var template = vm.templates.filter(function(template) { return template.id == templateId });
              if (typeof(template) != "undefined" && template.length > 0) {
                template = template[0];
                getTemplateMatches(template);
              }
            }
          }
        }

        // pass list of loaded matches to the viewer (if any)
        for (var templateId in vm.matches)
          if (vm.matches.hasOwnProperty(templateId)) {
            var filteredMatches = filterFilter(vm.matches[templateId], {image_id: vm.document.id});
            $rootScope.$broadcast('matchesLoaded', templateId, filteredMatches);
          }
      });
    });

    $scope.$on('templateCropped', function(event, crop) {
      vm.templateCrop = crop;
      vm.nowPicking = false;
      $scope.$apply();
    });

    function getTemplates(document) {
      if ($stateParams.collectionId)
        return TemplateService.getCollectionTemplates($stateParams.collectionId)
          .then(function(data) {
            vm.templates = data;
            return vm.templates;
          });
      else
        return TemplateService.getTemplates(document.id)
          .then(function(data) {
            vm.templates = data;
            return vm.templates;
          });
    }

    function startPicking() {
      vm.nowPicking = true;
      $rootScope.$broadcast('startPicking');
    }

    function cancelPicking() {
      vm.nowPicking = false;
      $rootScope.$broadcast('cancelPicking');
    }

    function postTemplate() {
      vm.nowMatching = true;
      var template = {};
      template.x = vm.templateCrop.tl.x;
      template.y = vm.templateCrop.tl.y;
      template.w = vm.templateCrop.br.x - vm.templateCrop.tl.x;
      template.h = vm.templateCrop.br.y - vm.templateCrop.tl.y;
      template.glyph = vm.templateChar;

      return TemplateService.postTemplate(vm.document.id, template)
        .then(function (data) {
          startTemplateMatching(data)
            .then(function (data) {
              vm.nowMatching = false;
              getTemplates(vm.document);
            });
        });
    }

    function deleteTemplate(template) {
      return TemplateService.deleteTemplate(template.image_id, template.id)
        .then(function (data) {
          // remove the deleted template from the local list
          var index = vm.templates.indexOf(template);
          if (index > -1)
            vm.templates.splice(index, 1);

          // remove the deleted template's matches, if loaded
          if (vm.matches.hasOwnProperty(template.id))
            removeTemplateMatches(template.id);
        });
    }

    function startTemplateMatching(template) {
      if ($stateParams.collectionId)
        return TemplateService.getUnlabeledCollectionMatches($stateParams.collectionId, template.id)
          .then(function (data) {
            addMatchesToList(template, data);
          });
      else
        return TemplateService.getUnlabeledMatches(vm.document.id, template.id)
          .then(function (data) {
            addMatchesToList(template, data);
          });
    }

    function getTemplateMatches(template) {
      if ($stateParams.collectionId)
        return TemplateService.getCollectionMatches($stateParams.collectionId, template.id)
          .then(function (data) {
            addMatchesToList(template, data);
          });
      else
        return TemplateService.getMatches(vm.document.id, template.id)
          .then(function (data) {
            addMatchesToList(template, data);
          });
    }

    function addMatchesToList(template, matches) {
      if (vm.matches.hasOwnProperty(template.id)) {
        vm.activeTemplateId = template.id;
        return;
      }
      vm.matches[template.id] = matches;
      vm.activeTemplateId = template.id;
      var filteredMatches = filterFilter(matches, {image_id: vm.document.id});
      $rootScope.$broadcast('matchesLoaded', template.id, filteredMatches);
    }

    function removeTemplateMatches(templateId) {
      delete vm.matches[templateId];
      $rootScope.$broadcast('matchesRemoved', templateId);

      vm.activeTemplateId = null;
      for (var templateId in vm.matches)
        if (vm.matches.hasOwnProperty(templateId))
          vm.activeTemplateId = templateId;
    }

    function panToMatch(match) {
      $rootScope.$broadcast('panToMatch', match);
    }
  }
}());
