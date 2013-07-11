#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs'),
    program = require('commander'),
    cheerio = require('cheerio'),
    rest = require('restler');

var HTMLFILE_DEFAULT = "index.html",
    CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();

  if (!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }

  return instr;
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFromFile = function(htmlfile, checksfile) {
  return checkHtml(fs.readFileSync(htmlfile), checksfile);
}

var checkHtmlFromUrl = function(url, checksfile) {
  rest.get(url).on('complete', function(result, response) {
    if (response.statusCode != 200) {
      console.log("Unable to reach %s.", url);
      process.exit(1);
    } else {
      checkJson = checkHtml(result, program.checks);
      outputJson(checkJson);
    }
  });
}

var outputJson = function(json) {
  var outJson = JSON.stringify(checkJson, null, 4);
  console.log(outJson);
}

var checkHtml = function(htmlContents, checksfile) {
  $ = cheerio.load(htmlContents);
  var checks = loadChecks(checksfile).sort();

  var out = {};
  for (var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }

  return out;
};

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

if (require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <html_url>', 'Url of the page to check')
    .parse(process.argv);

  if (program.url) {
    checkHtmlFromUrl(program.url, program.checks);
  }
  else {
    var checkJson = checkHtmlFromFile(program.file, program.checks);
    outputJson(checkJson);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}