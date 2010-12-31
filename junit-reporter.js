// Jasmine reporter to format results in JUnit XML format for CI processing.
// An XML file is generated per suite and is only generated if that suite
// contains specs (i.e. a suite that contains only nested suites won't get
// a seperate XML file generated).
//
// Usage:
// jasmine.getEnv().addReporter(new jasmine.JUnitReporter())
// - outputs XML results into the current directory
//
// jasmine.getEnv().addReporter(new jasmine.JUnitReporter("output/path"))
// - outputs XML results into the specified output path

(function() {
  jasmine.JUnitReporter = function(outputPath) {
    this.outputPath = outputPath || "";
    this.testcase = "";
  };

  jasmine.JUnitReporter.prototype = {
    reportRunnerStarting: function(runner) {
    },

    reportRunnerResults: function(runner) {
    },

    reportSuiteResults: function(suite) {
      var specCount = suite.specs().length;
      if (specCount == 0) {
        return;
      }

      var testsuite = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>";

      var name = suite.getFullName();
      var results = suite.results();

      testsuite += "<testsuite name=\"" + name + "\" ";
      testsuite += "tests=\"" + specCount + "\" ";
      testsuite += "failures=\"" + results.failedCount + "\" ";
      testsuite += "errors=\"0\" ";
      testsuite += "time=\"" + suite.elapsed + "\" ";
      testsuite += "timestamp=\"" + isoDateString(new Date()) + "\">";

      testsuite += this.testcase;

      testsuite += "</testsuite>";

      this.testcase = "";

      writeToFile(this.outputPath, name, testsuite);
    },

    reportSpecStarting: function(spec) {
      this.testcase += "<testcase classname=\"" + spec.suite.getFullName() + "\" name=\"" + spec.description + "\" ";
      spec.startTime = new Date();
    },

    reportSpecResults: function(spec) {
      var endTime = new Date();
      var elapsed = (endTime - spec.startTime) / 1000;

      this.testcase += "time=\"" + elapsed + "\">";

      var results = spec.results();
      if (!results.passed()) {
        var items = results.getItems();

        for (var i = 0; i < items.length; i++) {
          this.testcase += "<failure>" + items[i] + "</failure>";
        }
      }

      for (var suite = spec.suite; suite; suite = suite.parentSuite) {
        suite.elapsed = suite.elapsed ? (suite.elapsed + elapsed) : elapsed;
      }

      this.testcase += "</testcase>";
    }
  };

  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference:Global_Objects:Date
  function isoDateString(d) {
    function pad(n) {
      return n < 10 ? "0" + n : n;
    }

    return d.getUTCFullYear() + "-" +
           pad(d.getUTCMonth() + 1) + "-" +
           pad(d.getUTCDate()) + "T" +
           pad(d.getUTCHours()) + ":" +
           pad(d.getUTCMinutes()) + ":" +
           pad(d.getUTCSeconds()) + "Z";
  }

  function writeToFile(outputPath, name, text) {
    if (outputPath.length > 0) {
      var path = new java.io.File(outputPath);
      if (!path.exists()) {
        path.mkdirs();
      }

      if (!/\/$/.test(outputPath)) {
        outputPath += "/";
      }
    }

    name = "TEST-" + name.toLowerCase().replace(/\s/g, "-") + ".xml";

    var file = new java.io.BufferedWriter(new java.io.FileWriter(outputPath + name));
    file.write(text);
    file.close();
  }
})();