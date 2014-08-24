# gulp-kss

Gulp plugin for KSS ([Knyle Style Sheets](http://warpspire.com/kss/)) documentation generation.

This plugin is based on [kss-node](https://github.com/hughsk/kss-node) and generates a styleguide based on code documentation. The plugin is mainly a fork of `kss-nodes`'s bin script, not how a beautiful gulp plugin should look like, but it works. 

This plugin currently lacks tests.

## Install

```
npm install gulp-kss
```

## Usage

Pipe all source files you want to document through `gulp-kss`, also the ones which are usually imported.

In addition to that you need to create a concated and compiled version of your styles at `public/style.css`. 

```javascript
var gulp = require('gulp');
var gulpless = require('gulp-less');
var gulpkss = require('gulp-kss');
var gulpconcat = require('gulp-concat');

gulp.src(['styles/**/*.less'])
    .pipe(gulpkss({
        overview: __dirname + '/styles/styleguide.md'
    }))
    .pipe(gulp.dest('styleguide/'));

// Concat and compile all your styles for correct rendering of the styleguide.
gulp.src('styles/main.less')
    .pipe(gulpless())
    .pipe(gulpconcat('public/style.css'))
    .pipe(gulp.dest('styleguide/'));
```

## Options

* `overview`: Absolute path to markdown file which is used for styleguide home page
* `templateDirectory`: Absolute path to template directory, by default `kss-node` default template is used.
* `kss`: Options supported by [`kss-node`](https://github.com/hughsk/kss-node/wiki/Module-API#wiki-options)

## LICENSE

(MIT License)

Copyright (c) 2014 DigitalWerft philipp@digitalwerft.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

