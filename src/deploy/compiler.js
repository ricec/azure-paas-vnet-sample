const fs = require('fs-extra');
const handlebars = require('handlebars');
handlebars.Utils.escapeExpression = function(input) {
  if (input == null) return '';

  // Don't HTML-escape... JSON-escape!
  let json = JSON.stringify(input)
  if (typeof input == 'string') {
    json = json.slice(1, -1);
  }
  return json;
};
handlebars.registerHelper('json', function(input) {
  return JSON.stringify(input);
});

class Compiler {
  constructor(templateContext) {
    this._templateContext = templateContext;
  }

  compile(filePath) {
    return fs.readFile(filePath).then(data => {
      const template = handlebars.compile(data.toString());
      const output = template(this._templateContext);
      return fs.writeFile(filePath, output);
    });
  }
}

module.exports = Compiler;
