# gulp-kss

Gulp plugin for KSS ([Knyle Style Sheets](http://warpspire.com/kss/)) documentation generation.

This plugin is based on [kss-node](https://github.com/hughsk/kss-node) and generates a styleguide based on code documentation. It builds upon the original [gulp-kss](https://github.com/philj/gulp-kss) by PhilJ but integrates newer node-kss features including custom properties, handlebars helpers, and more.

## Install

```
git clone https://github.com/kedruff/gulp-kss.git
npm install
```

## Usage

Pipe all source files you want to document through `gulp-kss`, also the ones which are usually imported.

```javascript
gulp.src( ['array/*.scss', 'ofSource/*.scss', 'sass/files/*.scss'] )
    .pipe( gulpkss({
        template: './node_modules/kss/lib/template',
        multiline: true,
        typos: false
        custom: [],
        helpers: '',
        css: [],
        js: []
    }) )
    .pipe(gulp.dest('styleguide/'));

```
## Options

* **template**: A path relative to your `gulpfile.js` containing a custom template (Default: `./node_modules/kss/lib/template/`)
* **destination**: A path relative to your `gulpfile.js` where you would your compiled guide to live (Default: `./docs/styleguide/`)
* **multiline** : As far as the parser is concerned, all but the last two paragraphs (separated by two line breaks) in a block are considered to be part of the description. In the case you don't have any modifiers but a large description it'll try to pick up this scenario. This setting's enabled by default, but you can disable it by adding multiline: false to your options.
* **typos**: Thanks to [natural](https://github.com/NaturalNode/natural), `kss-node` can parse keywords phonetically rather then by their string value. In short: make a typo and the library will do its best to read it anyway. Enable this by setting typos to true in the options object.
* **custom**: A custom property name when parsing KSS comments
* **helpers**: Specify the location of custom [handlebars helpers](http://bit.ly/kss-helpers) (Default: `./lib/template/helpers`)
* **css**: Specify the URL of a CSS file to include in the style guide
* **js**: Specify the URL of a JavaScript file to include in the style guide

## LICENSE

(MIT License)

Copyright (c) 2015 Capital One Financial (Kevin Druff)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
