(function () {

  angular.module('glyphMinerApp.glyphs').controller('GlyphListController', GlyphListController);

  GlyphListController.$inject = ['$scope', 'TemplateService', 'LabelService', 'apiBasePath'];

  function GlyphListController($scope, TemplateService, LabelService, apiBasePath) {
    var vm = this;

    vm.glyphs = [];

    vm.filter = {};
    vm.filter.showTemplate = true;
    vm.filter.showPositive = true;
    vm.filter.showPredicted = true;
    vm.filter.showRemaining = false;
    vm.filter.groupGlyphs = true;
    vm.filterGlyph = filterGlyph;
    vm.toggleGlyph = toggleGlyph;

    vm.apiBasePath = apiBasePath;

    ////////////////

    $scope.$on('templateSelected', function(event, template) {
      if (template.origin_collection_id !== undefined)
        addCollectionMatches(template);
      else
        addMatches(template);
    });

    $scope.$on('templateDeselected', function(event, template) {
      if (template.origin_collection_id !== undefined)
        removeCollectionMatches(template);
      else
        removeMatches(template);
    });

    function addCollectionMatches(template) {
      return TemplateService.getCollectionMatches(template.origin_collection_id, template.id)
        .then(function(data) {
          for (var i = 0; i < data.length; i++) {
            data[i].template_origin_collection_id = template.origin_collection_id;
            vm.glyphs.push(data[i]);
          }
          return vm.glyphs;
        });
    }

    function addMatches(template) {
      return TemplateService.getMatches(template.image_id, template.id)
        .then(function(data) {
          for (var i = 0; i < data.length; i++)
            vm.glyphs.push(data[i]);
          return vm.glyphs;
        });
    }

    function removeCollectionMatches(template) {
      var i = vm.glyphs.length;
      for (; i-- ;) {
        if (vm.glyphs[i].template_origin_collection_id == template.origin_collection_id
                           && vm.glyphs[i].template_id == template.id)
          vm.glyphs.splice(i, 1);
      }
    }

    function removeMatches(template) {
      var i = vm.glyphs.length;
      for (; i-- ;) {
        if (vm.glyphs[i].template_origin_collection_id == undefined
                           && vm.glyphs[i].template_id == template.id)
          vm.glyphs.splice(i, 1);
      }
    }

    function filterGlyph(value, index, array) {
      var score = value.score;
      var label = value.label_value;
      if (score == 1.0)
        return vm.filter.showTemplate;
      if (label == "user_positive")
        return vm.filter.showPositive;
      if (label < 0.5) {
        return vm.filter.showPredicted;
      }
      return vm.filter.showRemaining;
    }

    function toggleGlyph(glyph) {
      if (glyph.disabled == true) {
        glyph.disabled = false;
        LabelService.putSelect(glyph, {disable: false});
      } else {
        glyph.disabled = true;
        LabelService.putSelect(glyph, {disable: true});
      }
    }

  }

}());
