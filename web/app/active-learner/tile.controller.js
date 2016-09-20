(function () {

  angular.module('glyphMinerApp.activeLearner').controller('TileController', TileController);

  TileController.$inject = ['$scope', '$state', '$stateParams', 'apiBasePath', 'LabelService'];

  function TileController($scope, $state, $stateParams, apiBasePath, LabelService) {
    var vm = this;

    vm.currentBatch = [];
    vm.currentIteration = 0;
    vm.currentTime = {};

    vm.showEndScreen = false;

    vm.updateBatch = updateBatch;
    vm.submitCurrentBatch = submitCurrentBatch;
    vm.finishClassification = finishClassification;
    vm.fixGridHeight= fixGridHeight;

    ////////////////

    $scope.$on('matchesLoaded', function(event) {
      // add the correct tile URL
      for (var i = 0; i < $scope.learnCtrl.matches.length; i++)
        $scope.learnCtrl.matches[i].path = getTileURL($scope.learnCtrl.matches[i]);

      // load the first batch
      updateBatch();

      // start time measurement
      vm.currentTime = Date.now();
    });

    $scope.$on('$stateChangeStart', function(event) {
      if (!vm.showEndScreen) {
        event.preventDefault();
      }
    });


    function updateBatch() {
      var batch = $scope.learnCtrl.getUncertainSamples();
      vm.currentBatch = [batch.slice(0, 3), batch.slice(3, 6), batch.slice(6, 9)];
    }

    function submitCurrentBatch() {
      // read time measurement
      var time = Date.now() - vm.currentTime;

      // flatten currentBatch array
      var batch = Array.prototype.concat.apply([], vm.currentBatch);

      // post user labels to server
      for (var i = 0; i < batch.length; i++) {
        var match = batch[i]
        var label = {};
        label.label = match.good ? 'user_positive' : 'user_negative';
        label.label_time = time;
        label.label_iteration = vm.currentIteration;
        LabelService.postLabel(match, label);
      }

      // update model with new labels
      for (var i = 0; i < batch.length; i++) {
        var match = batch[i]
        var label = match.good ? true : false;
        $scope.learnCtrl.addDataPoint(match, label);
      }

      // get the next batch (or stop if we have enough iterations)
      vm.currentIteration++;
      vm.currentTime = Date.now();
      if (vm.currentIteration != 10)
        updateBatch();
      else
        vm.showEndScreen = true;
    }

    function finishClassification() {
      // Post final model parameters and threshold before leaving
      $scope.learnCtrl.saveModel();
      if ($stateParams.collectionId)
        $state.go('viewer.collection', {collectionId: $stateParams.collectionId, templates: $stateParams.templateId});
      else
        $state.go('viewer.document', {imageId: $stateParams.imageId, templates: $stateParams.templateId});
    }

    function getTileURL(match) {
      var marginX = Math.ceil((120.0 - match.w) / 2.0);
      var marginY = Math.ceil((120.0 - match.h) / 2.0);
      // TODO: use HATEOAS to ship this URL with matches?
      var url = apiBasePath + '/images/' + match.image_id + "/templates/" + match.template_id + "/matches/" + match.id + '/crops?';
      url += 'margin_left=' + marginX + "&";
      url += 'margin_top=' + marginY + "&";
      url += 'margin_bottom=' +  marginY + "&";
      url += 'margin_right=' + marginX + "&";
      url += 'box=true';
      return url;
    }

    // HACK: fix grid height once it has been rendered; prevents flickering
    function fixGridHeight() {
        var container = document.getElementById("image-grid-container");
        container.style.height = container.offsetHeight + "px";
    }
  }
}());
