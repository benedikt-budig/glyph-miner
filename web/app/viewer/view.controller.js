(function () {

  angular.module('glyphMinerApp.viewer').controller('ViewController', ViewController);

  ViewController.$inject = ['$scope', '$rootScope', '$state', '$stateParams', 'DocumentService'];

  function ViewController($scope, $rootScope, $state, $stateParams, DocumentService) {
    var vm = this;

    vm.document = { };
    vm.map = null;
    vm.layerControl = null;
    vm.drawControl = null;
    vm.maxNativeZoom = null;
    vm.matchLayers = { };
    vm.drawnItems = { };

    activate();

    ////////////////

    function activate() {
      // check if we have a single document or a collection (and in this case, if an image was selected)
      if ($state.is('viewer.document')) {
        DocumentService.getDocument($stateParams.imageId)
          .then(function(data) {
            vm.document = data;
            $rootScope.$broadcast('documentSelected', vm.document);
            configureLeaflet(vm.document);
          });
      } else if ($scope.$parent.collectionDocuments.selectedDocument.id === undefined) {
        DocumentService.getDocument($stateParams.imageId)
          .then(function(data) {
            vm.document = data;
            configureLeaflet(vm.document);
          });
      } else {
        vm.document = $scope.$parent.collectionDocuments.selectedDocument;
        configureLeaflet(vm.document);
      }
    }

    $scope.$on('startPicking', function(event) {
      for (var toolbarId in vm.drawControl._toolbars) {
        var toolbar = vm.drawControl._toolbars[toolbarId];
        if (toolbar instanceof L.DrawToolbar)
          toolbar._modes.rectangle.handler.enable();
      }
      vm.drawnItems.clearLayers();
    });

    $scope.$on('cancelPicking', function(event) {
      for (var toolbarId in vm.drawControl._toolbars) {
        var toolbar = vm.drawControl._toolbars[toolbarId];
        if (toolbar instanceof L.DrawToolbar)
          toolbar._modes.rectangle.handler.disable();
      }
    });

    $scope.$on('matchesLoaded', function(event, template, matches) {
      addMatchLayer(template, matches);
    });

    $scope.$on('matchesRemoved', function(event, templateId) {
      removeMatchLayer(templateId);
    });

    $scope.$on('panToMatch', function(event, match) {
      vm.map.panTo(vm.map.unproject([match.x,match.y], vm.maxNativeZoom), {animate: true});
      match.box.openPopup();
    });

    function configureLeaflet(document) {
      // initialize Leaflet if necessary
      if (vm.map == null) {
        vm.map = L.map('map', {crs: L.CRS.Simple}).setView([0, 0], 2);
      }

      // clear old layers and controls (if they exist)
      vm.map.eachLayer(function (layer){
        vm.map.removeLayer(layer);
      });
      if (vm.layerControl != null)
        vm.map.removeControl(vm.layerControl);
      if (vm.drawControl != null)
        vm.map.removeControl(vm.drawControl);

      // check dimensions of new document
      vm.maxNativeZoom = Math.max(Math.ceil(Math.log(Math.ceil(document.w/256.0)) / Math.LN2),
                                  Math.ceil(Math.log(Math.ceil(document.h/256.0)) / Math.LN2));
      var southWest = vm.map.unproject([0, document.h], vm.maxNativeZoom);
      var northEast = vm.map.unproject([document.w, 0], vm.maxNativeZoom);
      var bounds = new L.LatLngBounds(southWest, northEast);
      vm.map.setMaxBounds(bounds);

      // cut bounds by one pixel on each side to compensate bug in leaflet
      southWest = vm.map.unproject([1, document.h-1], vm.maxNativeZoom);
      northEast = vm.map.unproject([document.w-1, 1], vm.maxNativeZoom);
      var cut_bounds = new L.LatLngBounds(southWest, northEast);

      // add baselayers for new document
      var colorLayer = L.tileLayer('/tiles/' + document.web_path_color + '/{z}/{x}/{y}.png', {
                                tms: false,
                                continuousWorld: true,
                                noWrap: true,
                                bounds: cut_bounds,
                                minZoom: 0,
                                maxNativeZoom: vm.maxNativeZoom,
                                maxZoom: vm.maxNativeZoom + 2
                           }).addTo(vm.map);
      var binarizedLayer = L.tileLayer('/tiles/' + document.web_path + '/{z}/{x}/{y}.png', {
                                tms: false,
                                continuousWorld: true,
                                noWrap: true,
                                bounds: cut_bounds,
                                minZoom: 0,
                                maxNativeZoom: vm.maxNativeZoom,
                                maxZoom: vm.maxNativeZoom + 2
                           }).addTo(vm.map);
      var baseLayers = {"Original Document": colorLayer, "Binarized Document": binarizedLayer};
      vm.layerControl = L.control.layers(baseLayers).addTo(vm.map);

      // add drawing control
      vm.drawnItems = new L.FeatureGroup();
      vm.map.addLayer(vm.drawnItems);
      vm.drawControl = new L.Control.Draw({
                edit: { featureGroup: vm.drawnItems },
                draw: {
                    rectangle: {
                        shapeOptions: {color: 'green'},
                        showArea: false
                    },
                    polyline: false,
                    polygon: false,
                    circle: false,
                    marker: false
                }
        });
        vm.map.addControl(vm.drawControl);

        // register drawing event handling
        vm.map.on('draw:created', function (e) {
          calculateBoundingBox(e.layer);
          vm.drawnItems.addLayer(e.layer);
          vm.map.addLayer(e.layer);
        });

        vm.map.on('draw:edited', function (e) {
          e.layers.eachLayer(function (layer) {
            calculateBoundingBox(layer);
          });
        });

        vm.map.on('draw:drawstart', function (e) {
          vm.drawnItems.clearLayers();
        });

        vm.map.on('draw:deletestop', function (e) {
          $rootScope.$broadcast('templateCropped', {
            tl: {x: 0, y: 0},
            br: {x: 0, y: 0}
          });
        });

        //TODO vm.matchLayers = {};?
    }

    function calculateBoundingBox(layer) {
       var tl_x = Number.POSITIVE_INFINITY;
       var tl_y = Number.POSITIVE_INFINITY;
       var br_x = Number.NEGATIVE_INFINITY;
       var br_y = Number.NEGATIVE_INFINITY;

       for (var i = 0; i < layer._latlngs.length; i++) {
         var p = vm.map.project(layer._latlngs[i], vm.maxNativeZoom);
         if (p.x < tl_x)
           tl_x = p.x;
         if (p.y < tl_y)
           tl_y = p.y;
         if (p.x > br_x)
           br_x = p.x;
         if (p.y > br_y)
           br_y = p.y;
       }
       $rootScope.$broadcast('templateCropped', {
         tl: {x: Math.round(tl_x), y: Math.round(tl_y)},
         br: {x: Math.round(br_x), y: Math.round(br_y)}
       });
    }

    function addMatchLayer(templateId, matches) {
      // calculate min and max scores
      var minScore = Number.POSITIVE_INFINITY;
      var maxScore = Number.NEGATIVE_INFINITY;
      for (var i = 0; i < matches.length; i++) {
        if (matches[i].score > maxScore)
          maxScore = matches[i].score;
        if (matches[i].score < minScore)
          minScore = matches[i].score;
      }

      // create a box for each match
      var userPositiveBoxes = [];
      var userNegativeBoxes = [];
      var predictedPositiveBoxes = [];
      var predictedNegativeBoxes = [];

      for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        var box = constructMatchBox(match, getBoxColor(match.score, minScore, maxScore));
        box.bindPopup(getPopupText(match));
        match.box = box;
        if (match.label_value == 'user_positive')
          userPositiveBoxes.push(box);
        else if (match.label_value == 'user_negative')
          userNegativeBoxes.push(box);
        else if (match.label_value != null && match.label_value < 0.5)
          predictedPositiveBoxes.push(box);
        else
          predictedNegativeBoxes.push(box);
      }

      // group boxes into layers
      var userPositiveLayer = L.layerGroup(userPositiveBoxes);
      var userNegativeLayer = L.layerGroup(userNegativeBoxes);
      var predictedPositiveLayer = L.layerGroup(predictedPositiveBoxes);
      var predictedNegativeLayer = L.layerGroup(predictedNegativeBoxes);
      vm.layerControl.addOverlay(userPositiveLayer, 'Template ' + templateId + ' (user positive)');
      vm.layerControl.addOverlay(predictedPositiveLayer, 'Template ' + templateId + ' (predicted positive)');
      vm.layerControl.addOverlay(userNegativeLayer, 'Template ' + templateId + ' (user negative)');
      vm.layerControl.addOverlay(predictedNegativeLayer, 'Template ' + templateId + ' (predicted negative)');
      vm.matchLayers[templateId] = [userPositiveLayer, userNegativeLayer, predictedPositiveLayer, predictedNegativeLayer];

      //show layers on map (if we have a model, then only those with positive matches)
      if (typeof(matches[0].label_value) == "undefined" || matches[0].label_value === null) {
          predictedNegativeLayer.addTo(vm.map);
          userNegativeLayer.addTo(vm.map);
      }
      userPositiveLayer.addTo(vm.map);
      predictedPositiveLayer.addTo(vm.map);
    }

    function removeMatchLayer(templateId) {
      layers = vm.matchLayers[templateId];
      for (var i = 0; i < layers.length; i++) {
         vm.layerControl.removeLayer(layers[i]);
         vm.map.removeLayer(layers[i]);
      }
    }

    function constructMatchBox(match, color) {
      var topLeft = [match.x, match.y];
      var bottomRight = [match.x + match.w, match.y + match.h];
      var bounds = [vm.map.unproject(topLeft, vm.maxNativeZoom),
                    vm.map.unproject(bottomRight, vm.maxNativeZoom)];
      return L.rectangle(bounds, {color: color, weight: 2, opacity: 0.9});
      //return L.rectangle(bounds, {color: 'white', weight: 2, opacity: 0.9, fillOpacity: 0.9});
    }

    function getBoxColor(score, minValue, maxValue) {
      var red, green, blue = 0;
      score = (score - minValue) / (maxValue - minValue);
      if (score < 0.5)
        red = 255, green = 255 * score * 2.0;
      else
        green = 255, red = 255 * (1 - ((score - 0.5) * 2.0));
      return "#" + toHex(red) + toHex(green) + toHex(blue);
    }

    function getPopupText(match) {
       var text = "<table class=\"table table-condensed table-popup\">";
       text += "<tr><td>x</td><td>" + match.x + "</td></tr>";
       text += "<tr><td>y</td><td>" + match.y + "</td></tr>";
       text += "<tr><td>rank</td><td>" + match.rank + "</td></tr>";
       text += "<tr><td>score</td><td>" + match.score.toFixed(5) + "</td></tr>";
       if (typeof(match.label_value) == "number")
           text += "<tr><td>label</td><td>" + match.label_value.toFixed(5) + "</td></tr>";
       else
           text += "<tr><td>label</td><td>" + match.label_value + "</td></tr>";
       if (typeof(match.glyph) != "undefined" && match.glyph != "")
          text += "<tr><td>Template</td><td>" + match.template_id + ' &ndash; "' + match.glyph + '"</td></tr>';
       else
          text += "<tr><td>Template</td><td>" + match.template_id + "</td></tr>";
       text += "</table>";
       return text;
    }

    function toHex(c) {
      var hex = Math.floor(c).toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }
  }
}());
