// Jasmine reporter to format results in NUnit XML format for CI processing.
//
// Usage:
// jasmine.getEnv().addReporter(new jasmine.NUnitReporter())
// - outputs TestResult.xml file into the current directory
//
// jasmine.getEnv().addReporter(new jasmine.NUnitReporter("output/path"))
// - outputs TestResult.xml file into the specified output path

(function() {
  jasmine.NUnitReporter = function(outputPath) {
    this.outputPath = outputPath || "";

    this.testSuites = {};
    this.testSpecs = {};
    this.testRun = {
      suites: []
    };
  };

  jasmine.NUnitReporter.prototype = {
    reportRunnerStarting: function(runner) {
      var suites = runner.suites();

      for (var i = 0; i < suites.length; i++) {
        var currentSuite = suites[i];

        var suite = {
          elapsed: 0,
          executed: false,
          id: currentSuite.id,
          name: currentSuite.description,
          specs: [],
          success: false,
          suites: []
        };

        this.testSuites[currentSuite.id] = suite;

        var parent = this.testRun.suites;
        if (currentSuite.parentSuite) {
          parent = this.testSuites[currentSuite.parentSuite.id].suites;
        }

        parent.push(suite);
      }
    },

    reportRunnerResults: function(runner) {
      var output = printTestResults(runner, this.testRun);
      writeToFile(this.outputPath, output);
    },

    reportSuiteResults: function(suite) {
      var id = suite.id;

      var results = suite.results();

      var testSuite = this.testSuites[id];
      testSuite.executed = true;
      testSuite.success = results.passed();
    },

    reportSpecStarting: function(spec) {
      var suite = spec.suite;

      var testSuite = this.testSuites[suite.id];
      var testSpec = {
        elapsed: null,
        executed: false,
        failures: [],
        id: spec.id,
        name: spec.description,
        success: false,
        startTime: new Date()
      };

      this.testSpecs[spec.id] = testSpec;

      testSuite.specs.push(testSpec);
    },

    reportSpecResults: function(spec) {
      var endTime = new Date();

      var id = spec.id;
      var results = spec.results();

      var testSpec = this.testSpecs[id];
      testSpec.executed = true;

      var success = results.passed();
      testSpec.success = success;
      if (!success) {
        var items = results.getItems();

        for (var i = 0; i < items.length; i++) {
          var result = items[i];
          if (result.passed && !result.passed()) {
            var failure = {
              message: result.toString(),
              stack: result.trace.stack ? result.trace.stack : ""
            };

            testSpec.failures.push(failure);
          }
        }
      }

      var elapsed = (endTime - testSpec.startTime) / 1000;
      testSpec.elapsed = elapsed;

      for (var suite = spec.suite; suite; suite = suite.parentSuite) {
        var testSuite = this.testSuites[suite.id];
        testSuite.elapsed = testSuite.elapsed ? (testSuite.elapsed + elapsed) : elapsed;
      }
    }
  };

  function dateString(date) {
    return new java.text.SimpleDateFormat("yyyy-MM-dd").format(date);
  }

  function timeString(date) {
    return new java.text.SimpleDateFormat("HH:mm:ss").format(date);
  }

  function printTestResults(runner, testRun) {
    var output = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>";

    var specCount = runner.specs().length;
    var results = runner.results();

    var date = new Date();

    output += "<test-results name=\"Javascript Specs\" ";
    output += "total=\"" + specCount + "\" ";
    output += "failures=\"" + results.failedCount + "\" ";
    output += "not-run=\"0\" ";
    output += "date=\"" + dateString(date) + "\" ";
    output += "time=\"" + timeString(date) + "\">";

    output += printSuites(testRun.suites);

    output += "</test-results>";

    return output;
  }

  function printSuites(suites) {
    var output = "";

    for (var i = 0; i < suites.length; i++) {
      output += "<test-suite ";
      output += "name=\"" + suites[i].name + "\" ";
      output += "executed=\"" + suites[i].executed + "\" ";
      output += "success=\"" + suites[i].success + "\" ";
      output += "time=\"" + suites[i].elapsed + "\">";
      output += "<results>";

      output += printSuites(suites[i].suites);

      if (suites[i].specs.length > 0) {
        output += printSpecs(suites[i].specs);
      }

      output += "</results>";
      output += "</test-suite>";
    }

    return output;
  }

  function printSpecs(specs) {
    var output = "";

    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];

      output += "<test-case ";
      output += "name=\"" + spec.name + "\" ";
      output += "executed=\"" + spec.executed + "\" ";
      output += "success=\"" + spec.success + "\" ";
      output += "time=\"" + spec.elapsed + "\">";

      for (var j = 0; j < spec.failures.length; j++) {
        var failure = spec.failures[j];

        output += "<failure>";
        output += "<message><![CDATA[" + failure.message + "]]></message>";
        output += "<stack-trace><![CDATA[" + failure.stack + "]]></stack-trace>";
        output += "</failure>";
      }

      output += "</test-case>";
    }

    return output;
  }

  function writeToFile(outputPath, text) {
    if (outputPath.length > 0) {
      var path = new java.io.File(outputPath);
      if (!path.exists()) {
        path.mkdirs();
      }

      if (!/\/$/.test(outputPath)) {
        outputPath += "/";
      }
    }

    var name = "TestResult.xml";

    var file = new java.io.BufferedWriter(new java.io.FileWriter(outputPath + name));
    file.write(text);
    file.close();
  }
})();
