(function () {

  angular.module('glyphMinerApp.pageCreator').controller('PageController', PageController);

  PageController.$inject = ['$scope', '$rootScope', '$stateParams','DocumentService', 'apiBasePath'];

  function PageController($scope, $rootScope, $stateParams, DocumentService, apiBasePath) {
    var vm = this;

    vm.collectionDocuments = [];

    vm.page = null;
    vm.glyphLayer = null;
    vm.apiBasePath = apiBasePath;

    activate();

    ////////////////

    function activate() {
      // distinguish between collection and single document when getting the dimensions
      if ($stateParams.collectionId) {
        getCollectionDocuments($stateParams.collectionId)
          .then(function(data) {
            $rootScope.$broadcast('gotDimensions', [data[0].w, data[0].h]);
            configureLeaflet(data[0]);
          });
      } else {
        getDocument($stateParams.imageId)
          .then(function(data) {
            $rootScope.$broadcast('gotDimensions', [data[0].w, data[0].h]);
            configureLeaflet(data[0]);
          });
      }
    }

    $scope.$on('updateDrawing', function(event, data) {
      var templates = $scope.$parent.$parent.templateColumn.templates;
      var params = getParams();
      var text = $scope.$parent.typesettingColumn.text;

      // clear page from previous drawings
      if (vm.glyphLayer != null)
        vm.glyphLayer.clearLayers();
      else
        vm.glyphLayer = L.layerGroup();

      // obtain glyph inventory
      var inventory = getGlyphInventory(templates);

      // for each char in text, draw a glyph
      var cursor = {x: params.horizontalMargin, y: params.verticalMargin};
      for (var i = 0; i < text.length; i++) {
        var character = text.charAt(i);
        var imageUrl, width, height, baseline, paddingLeft, paddingRight;
        paddingLeft = paddingRight = 0;

        // check if we have the required glyph in our inventory
        if (character == " ") {
          cursor.x = cursor.x + params.wordSpacing;
          continue;
        } else if (character == "\n") {
          cursor.x = params.horizontalMargin;
          cursor.y = cursor.y + params.leading;
          continue;
        } else if (!inventory.hasOwnProperty(character)) {
          imageUrl = 'img/missing-glyph.png';
          width = 50;
          height = 50;
          baseline = 25;
        } else {
          // get next glyph match from shuffled list of matches
          var templ = inventory[character];
          var glyph = $scope.$parent.$parent.templateColumn.matches[templ.id][templ.matchCount];
          templ.matchCount = (templ.matchCount + 1) % $scope.$parent.$parent.templateColumn.matches[templ.id].length;

          var x = glyph.x;
          var y = glyph.y;
          width = templ.w;
          height = templ.h;
          baseline = (templ.hasOwnProperty('baseline') && templ.baseline !== null) ? templ.baseline : templ.h * 2/3;
          if (templ.hasOwnProperty('leftcrop'))
            if (templ.leftcrop < 0) {
              paddingLeft = -templ.leftcrop;
            } else {
              x = x + templ.leftcrop;
              width = width - templ.leftcrop;
            }
          if (templ.hasOwnProperty('rightcrop'))
            if (templ.rightcrop < 0) {
              paddingRight = -templ.rightcrop;
            } else {
              width = width - templ.rightcrop;
            }
          imageUrl = apiBasePath + '/images/' + glyph.image_id + '/crops?x1=' + x + '&y1=' + y + '&x2=' + (x + width) + '&y2=' + (y + height);
        }

        // draw glyph in the right location, move cursor
        cursor.x = cursor.x + paddingLeft;
        var northEast = vm.page.unproject([cursor.x, cursor.y - baseline], vm.maxNativeZoom);
        var southWest = vm.page.unproject([cursor.x + width, cursor.y + height - baseline], vm.maxNativeZoom);
        cursor.x = cursor.x + width + params.letterSpacing + paddingRight;
        var bounds = new L.LatLngBounds(southWest, northEast);
        vm.glyphLayer.addLayer(L.imageOverlay(imageUrl, bounds));
      }
      vm.page.addLayer(vm.glyphLayer);
    });

    function getParams() {
      return {horizontalMargin : $scope.$parent.typesettingColumn.horizontalMargin,
              verticalMargin   : $scope.$parent.typesettingColumn.verticalMargin,
              leading          : $scope.$parent.typesettingColumn.leading,
              letterSpacing    : $scope.$parent.typesettingColumn.letterSpacing,
              wordSpacing      : $scope.$parent.typesettingColumn.wordSpacing};
    }

    function getGlyphInventory(templates) {
      // check which glyphs are covered by the templates
      var inventory = {};
      for (var i = 0; i < templates.length; i++) {
        if (templates[i].hasOwnProperty('glyph')) {
          inventory[templates[i].glyph] = templates[i];
          templates[i].matchCount = 0;
        }
      }
      return inventory;
    }

    function getCollectionDocuments(collectionId) {
      return DocumentService.getCollectionDocuments(collectionId)
        .then(function(data) {
          vm.collectionDocuments = data;
          return vm.collectionDocuments;
        });
    }

    function getDocument(imageId) {
      return DocumentService.getDocument(imageId)
        .then(function(data) {
          vm.collectionDocuments = [data];
          return vm.collectionDocuments;
        });
    }

    function configureLeaflet(document) {
      // initialize Leaflet if necessary
      if (vm.page == null)
        vm.page = L.map('page', {crs: L.CRS.Simple}).setView([0, 0], 2);

      // check dimensions of new document
      vm.maxNativeZoom = Math.max(Math.ceil(Math.log(Math.ceil(document.w/256.0)) / Math.LN2),
                                  Math.ceil(Math.log(Math.ceil(document.h/256.0)) / Math.LN2));
      var southWest = vm.page.unproject([0, document.h], vm.maxNativeZoom);
      var northEast = vm.page.unproject([document.w, 0], vm.maxNativeZoom);
      var bounds = new L.LatLngBounds(southWest, northEast);
      vm.page.setMaxBounds(bounds);

      // cut bounds by one pixel on each side to compensate bug in leaflet
      southWest = vm.page.unproject([1, document.h-1], vm.maxNativeZoom);
      northEast = vm.page.unproject([document.w-1, 1], vm.maxNativeZoom);
      var cut_bounds = new L.LatLngBounds(southWest, northEast);

      var imageUrl = 'img/white.png';
      L.imageOverlay(imageUrl, cut_bounds).addTo(vm.page);
    }
  }

}());
