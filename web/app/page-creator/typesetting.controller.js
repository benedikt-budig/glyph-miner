(function () {

  angular.module('glyphMinerApp.pageCreator').controller('TypesettingController', TypesettingController);

  TypesettingController.$inject = ['$scope', '$rootScope', '$stateParams', '$window', 'TemplateService', 'PageService', 'apiBasePath'];

  function TypesettingController($scope, $rootScope, $stateParams, $window, TemplateService, PageService, apiBasePath) {
    var vm = this;

    vm.template = {};
    vm.templateCanvas = new fabric.Canvas('templateCanvas', { imageSmoothingEnabled: false });
    vm.apiBasePath = apiBasePath;

    vm.horizontalMargin = 200;
    vm.verticalMargin = 275;
    vm.leading = 100;
    vm.letterSpacing = 1;
    vm.wordSpacing = 18;
    vm.text = "";
    vm.dimensions = [];
    vm.textFile = null;

    vm.obtainingPages = false;
    vm.obtainingPages = false;

    vm.baselineChange = baselineChange;
    vm.leftcropChange = leftcropChange;
    vm.rightcropChange = rightcropChange;
    vm.updateDrawing = updateDrawing;
    vm.saveParams = saveParams;
    vm.requestSyntheticPages = requestSyntheticPages;

    ////////////////

    $scope.$on('templateSelected', function(event, templ) {
      vm.template = templ;
      var canvas = vm.templateCanvas;
      canvas.clear();

      // draw baseline and left/right borders
      var baseline    = new fabric.Line([-3, 180, 200, 180], {stroke: '#337AB7', strokeWidth: 3, padding: 10, hasBorders: false, hasControls: false, lockMovementX: true});
      var leftborder  = new fabric.Rect({left: 10,  top: 0, height: 200, width: 1000, opacity: 0.2, padding: 10, hasBorders: false, hasControls: false, lockMovementY: true, originX: 'right'});
      var rightborder = new fabric.Rect({left: 190, top: 0, height: 200, width: 1000, opacity: 0.2, padding: 10, hasBorders: false, hasControls: false, lockMovementY: true});
      canvas.add(baseline, leftborder, rightborder);

      // draw template image
      var url = apiBasePath + '/images/' + templ.image_id + '/crops?x1=' + templ.x + '&y1=' + templ.y + '&x2=' + (templ.x + templ.w) + '&y2=' + (templ.y + templ.h);
      var image;
      fabric.Image.fromURL(url, function(oImg) {
        oImg.selectable = false;
        if (templ.h > templ.w)
          oImg.scaleToHeight(canvas.height);
        else
          oImg.scaleToWidth(canvas.width);
        canvas.add(oImg);
        canvas.centerObject(oImg);
        vm.templateImage = image = oImg;
        canvas.bringToFront(leftborder);
        canvas.bringToFront(rightborder);
        canvas.bringToFront(baseline);

        vm.baseline = baseline;
        vm.leftborder = leftborder;
        vm.rightborder = rightborder;

        templ.hasOwnProperty('baseline')  && templ.baseline  !== null ? baselineChange(templ.baseline)   : baselineChange(Math.round(templ.h * 2/3));
        templ.hasOwnProperty('leftcrop')  && templ.leftcrop  !== null ? leftcropChange(templ.leftcrop)   : leftcropChange(0);
        templ.hasOwnProperty('rightcrop') && templ.rightcrop !== null ? rightcropChange(templ.rightcrop) : rightcropChange(0);
      });

      // register event handling
      canvas.on('object:moving', function(e) {
        var activeObject = e.target;
        if (activeObject == baseline)
          $scope.$apply(function(){
            vm.template.baseline = Math.round((activeObject.get('top') - image.get('top')) / image.getScaleX());
            updateDrawing();
          });
        else if (activeObject == leftborder)
          $scope.$apply(function(){
            vm.template.leftcrop = Math.round((activeObject.get('left') - image.get('left')) / image.getScaleX());
            updateDrawing();
          });
        else if (activeObject == rightborder)
          $scope.$apply(function(){
            vm.template.rightcrop = - Math.round((activeObject.get('left') - (image.get('left') + image.getBoundingRectWidth())) / image.getScaleX());
            updateDrawing();
          });
      });
    });

    function baselineChange(baseline) {
      if (vm.template.baseline !== baseline)
        $scope.$apply(function(){
          vm.template.baseline = baseline;
        });
      var scaledBaseline = Math.round(baseline * vm.templateImage.getScaleX() + vm.templateImage.get('top'));
      vm.baseline.set({ top: scaledBaseline });
      vm.templateCanvas.renderAll();
      vm.baseline.setCoords();
      updateDrawing();
    }

    function leftcropChange(leftcrop) {
      if (vm.template.leftcrop !== leftcrop)
        $scope.$apply(function(){
          vm.template.leftcrop = leftcrop;
        });
      var scaledLeftborder = Math.round(leftcrop * vm.templateImage.getScaleX() + vm.templateImage.get('left'));
      vm.leftborder.set({ left: scaledLeftborder });
      vm.templateCanvas.renderAll();
      vm.leftborder.setCoords();
      updateDrawing();
    }

    function rightcropChange(rightcrop) {
      if (vm.template.rightcrop !== rightcrop)
        $scope.$apply(function(){
          vm.template.rightcrop = rightcrop;
        });
      var scaledRightborder = Math.round(-1 * rightcrop * vm.templateImage.getScaleX() + (vm.templateImage.get('left') + vm.templateImage.getBoundingRectWidth()));
      vm.rightborder.set({ left: scaledRightborder });
      vm.templateCanvas.renderAll();
      vm.rightborder.setCoords();
      updateDrawing();
    }

    function saveParams() {
      var typo = {
        baseline  : vm.template.baseline,
        leftcrop  : vm.template.leftcrop,
        rightcrop : vm.template.rightcrop
      };
      TemplateService.putTypography(vm.template.image_id, vm.template.id, typo);
    }

    $scope.$on('gotDimensions', function(event, data) {
      vm.dimensions = data;
    });

    function requestSyntheticPages(lines_only) {
      var paramsAndText = {
        "text"           : vm.textFile,
        "dimensions"     : vm.dimensions,
        "margin"         : [vm.horizontalMargin, vm.verticalMargin],
        "letter_spacing" : vm.letterSpacing,
        "word_spacing"   : vm.wordSpacing,
        "baseline_skip"  : vm.leading
      };
      if (lines_only) {
        vm.obtainingLines = true;
        if ($stateParams.collectionId) {
          PageService.requestSyntheticLinesCollection($stateParams.collectionId, paramsAndText)
            .then(function(location) {
              vm.obtainingLines = false;
              $window.location.href = location;
            });
        } else {
          PageService.requestSyntheticLines($stateParams.imageId, paramsAndText)
            .then(function(location) {
              vm.obtainingLines = false;
              $window.location.href = location;
            });
        }
      } else {
        vm.obtainingPages = true;
        if ($stateParams.collectionId) {
          PageService.requestSyntheticPagesCollection($stateParams.collectionId, paramsAndText)
            .then(function(location) {
              vm.obtainingPages = false;
              $window.location.href = location;
            });
        } else {
          PageService.requestSyntheticPages($stateParams.imageId, paramsAndText)
            .then(function(location) {
              vm.obtainingPages = false;
              $window.location.href = location;
            });
        }
      }
    }

    function updateDrawing() {
      $rootScope.$broadcast('updateDrawing');
    }
  }

}());
