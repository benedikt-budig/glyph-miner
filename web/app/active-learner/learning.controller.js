(function () {

  angular.module('glyphMinerApp.activeLearner').controller('LearningController', LearningController);

  LearningController.$inject = ['$scope', '$stateParams', 'apiBasePath', 'TemplateService', 'LabelService'];

  function LearningController($scope, $stateParams, apiBasePath, TemplateService, LabelService) {
    var vm = this;

    vm.template = {};
    vm.matches = [];
    vm.usedSamples = [];

    vm.X = [];             // feature vector (for logistic regression)
    vm.y = [];             // label vector (for logistic regression)
    vm.theta = [[0],[0]];  // theta are the parameters to be trained

    vm.alpha = 0.1;        // learning rate for gradient descent
    vm.lambda = 0.0;       // regularization parameter
    vm.runs = 10000;       // number of runs in gradient descent

    vm.addDataPoint = addDataPoint;
    vm.getUncertainSamples = getUncertainSamples;
    vm.saveModel = saveModel;

    activate();

    ////////////////

    function activate() {
      getTemplate();
      getTemplateMatches()
        .then(function (data) {
          // sort matches by score
          vm.matches.sort(function (a, b) {return b.score - a.score; });

          // kick start the logistic regression model
          kickStartModel();

          // notify TileController
          $scope.$broadcast('matchesLoaded');
      });
    }

    function getTemplate() {
      if ($stateParams.collectionId)
        return TemplateService.getCollectionTemplate($stateParams.collectionId, $stateParams.templateId)
          .then(function (data) {
            vm.template = data;
            return vm.template;
          });
      else
        return TemplateService.getTemplate($stateParams.imageId, $stateParams.templateId)
          .then(function (data) {
            vm.template = data;
            return vm.template;
          });
    }

    function getTemplateMatches() {
      if ($stateParams.collectionId)
        return TemplateService.getUnlabeledCollectionMatches($stateParams.collectionId, $stateParams.templateId)
          .then(function (data) {
            vm.matches = data;
            return vm.matches;
          });
      else
        return TemplateService.getUnlabeledMatches($stateParams.imageId, $stateParams.templateId)
          .then(function (data) {
            vm.matches = data;
            return vm.matches;
          });
    }

    function kickStartModel() {
      // add ten data points at the start and ten at the end (to kick start the logistic regression model)
      for (i = 0; i < 10; i++) {
        vm.X.push(kernel(0.000 + (i / vm.matches.length)));
        vm.y.push([1]);
      }

      for (i = 0; i < 10; i++) {
        vm.X.push(kernel(0.999 - (i / vm.matches.length)));
        vm.y.push([0]);
      }

      trainClassifier();
    }

    function getUncertainSamples() {
      // compute the nine most uncertain samples
      var samples = [];
      var stepSize = 1.0 / vm.matches.length;
      while (samples.length < 9) {
        var uncertainSampleIndex = 0;
        var uncertainSampleValue = 1.0;
        for (var i = 0; i <= 1; i += stepSize) {
          var currentIndex = Math.floor(i * vm.matches.length);
          var currentValue = Math.abs(predict(i) - 0.5);
          if (currentValue < uncertainSampleValue) {
            if (vm.usedSamples.indexOf(currentIndex) == -1) {
              uncertainSampleIndex = currentIndex;
              uncertainSampleValue = currentValue;
            }
          }
        }
        samples.push(vm.matches[uncertainSampleIndex]);
        vm.usedSamples.push(uncertainSampleIndex);
      }
      return samples;
    }

    function addDataPoint(match, label) {
      var index = vm.matches.indexOf(match);
      vm.X.push(kernel(index / vm.matches.length));
      if (label == true)
        vm.y.push([1]);
      else
        vm.y.push([0]);
      trainClassifier();
    }

    function saveModel() {
      // calculate threshold
      var threshold_score = 0;
      var stepSize = 1.0 / vm.matches.length;
      for (var i = 0; i <= 1; i += stepSize)
        if (predict(i) < 0.5) {
          threshold_score = vm.matches[Math.floor(i * vm.matches.length)].score;
          break;
        }

      // save model data
      var model          = {};
      model.beta_zero    = vm.theta[0][0];
      model.beta_one     = vm.theta[1][0];
      model.thresh_score = threshold_score;
      LabelService.putModel(vm.matches[0].image_id, vm.matches[0].template_id, model);
    }

    //////////////// Here goes the logistic regression logic ////////////////

    function kernel(a) {
      /* Kernel for adding 1-feature */
      return [1, a];
    }

    function sigmoid(x) {
      /* Logistic sigmoid function */
      return 1.0 / (1.0 + Math.exp(-x));
    }

    function gradientDescent(theta, gradient, alpha) {
      /* Gradient descent with learning rate alpha */
      return numeric.sub(theta, numeric.mul(gradient(theta), alpha));
    }

    function gradient(theta) {
      /* Returns the gradient of regularized Theta */
      /* 1/m * Sum_i( (h_Theta(x_i) - y_i) * x_i,j ) - lambda / m Theta_j */
      var H = numeric.dot(vm.X, theta);
      for (var i = 0; i < H.length; i++)
        for (var j = 0; j < H[i].length; j++)
          H[i][j] = sigmoid(H[i][j]);

      var regularization = numeric.mul(theta, vm.lambda / vm.X.length);
      regularization[0][0] = 0.0;
      var grad = numeric.dot(numeric.transpose(vm.X), numeric.sub(H, vm.y));
      grad = numeric.div(grad, vm.X.length);
      return numeric.add(grad, regularization);
    }

    function trainClassifier() {
      // Initialize theta to zero-vector, theta are the parameters
      var theta = numeric.rep([kernel(0).length, 1], 0);
      for (var i = 0; i < vm.runs; i++)
        theta = gradientDescent(theta, gradient, vm.alpha);
      vm.theta = theta;
    }

    function predict(a) {
      var thetaT = numeric.transpose(vm.theta);
      var x = numeric.transpose([kernel(a)]);
      return sigmoid(numeric.dot(thetaT, x)[0][0]);
    }
  }
}());
