(function() {
  jasmine.SimpleConsoleReporter = function() {
    this.runnerStartTime;
    this.specStartTime;
  };

  jasmine.SimpleConsoleReporter.prototype = {
    reportRunnerStarting: function(runner) {
      this.runnerStartTime = new Date();
    },

    reportRunnerResults: function(runner) {
      var endTime = new Date();
      var elapsed = (endTime - this.runnerStartTime) / 1000;

      var failedCount = runner.results().failedCount;
      var specCount = runner.specs().length;

      var specText = specCount + " spec" + ((specCount == 1) ? "" : "s");
      var failedText = failedCount + " failure" + ((failedCount == 1) ? "" : "s");
      var elapsedText = "in " + elapsed + " seconds.";

      this.log("");
      this.log(specText + ", " +  failedText + " " + elapsedText);
    },

    reportSuiteResults: function(suite) {
    },

    reportSpecStarting: function(spec) {
      this.specStartTime = new Date();
    },

    reportSpecResults: function(spec) {
      var results = spec.results();
      if (!results.passed()) {
        var name = spec.suite.getFullName() + " " + spec.description;
        this.log("");
        this.log(name + " failed:");

        var items = results.getItems();

        for (var i = 0; i < items.length; i++) {
          var result = items[i];
          if (result.passed && !result.passed()) {
            this.log(result.toString());
          }
        }
      }
    },

    log: function(str) {
      var console = jasmine.getGlobal().console;
      if (console && console.log) {
        console.log(str);
      }
    }
  };
})();