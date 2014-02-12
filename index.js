var path = require('path');
var fs = require('fs');

var through = require('through');
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpless = require('gulp-less');
var kss = require('kss');
var marked = require('marked');
var handlebars = require('handlebars');
var PluginError = gutil.PluginError;
var File = gutil.File;

var handlebarHelpers = require('./handlebarHelpers');

/*
    This script is based and recycles a lot of code of the bin script of kss-node
    https://github.com/hughsk/kss-node/blob/master/bin/kss-node
 */

module.exports = function(opt) {
    'use strict';
    if (!opt) opt = {};
    if (!opt.templateDirectory) opt.templateDirectory = __dirname + '/node_modules/kss/lib/template';
    if (!opt.kssOpts) opt.kssOpts = {};

    var buffer = [];
    var firstFile = null;

    /* Is called for each file and writes all files to buffer */
    function bufferContents(file){
        if (file.isNull()) return; // ignore
        if (file.isStream()) return this.emit('error', new PluginError('gulp-kss',  'Streaming not supported'));

        if (!firstFile) firstFile = file;

        buffer.push(file.contents.toString('utf8'));
    }

    /* Is called when all files were added to buffer */
    function endStream(){
        var template = fs.readFileSync(path.join(opt.templateDirectory, 'index.html'), 'utf8');
        template = handlebars.compile(template);

        var self = this;

        kss.parse(buffer, opt.kssOpts, function (err, styleguide) {
            if (err) console.log('Error', error);

                var sections = styleguide.section('*.'),
                    i, sectionCount = sections.length,
                    sectionRoots = [], currentRoot,
                    rootCount, childSections = [];


            // Accumulate all of the sections' first indexes
            // in case they don't have a root element.
            for (i = 0; i < sectionCount; i += 1) {
                currentRoot = sections[i].reference().match(/[0-9]*\.?/)[0].replace('.', '');

                if (!~sectionRoots.indexOf(currentRoot)) {
                    sectionRoots.push(currentRoot);
                }
            }

            sectionRoots.sort();
            rootCount = sectionRoots.length;

            handlebarHelpers(handlebars, styleguide);

            // Now, group all of the sections by their root
            // reference, and make a page for each.
            for (i = 0; i < rootCount; i += 1) {
                childSections = styleguide.section(sectionRoots[i]+'.*');

                var content = template({
                    styleguide: styleguide,
                    sections: jsonSections(childSections),
                    rootNumber: sectionRoots[i],
                    sectionRoots: sectionRoots,
                    overview: false,
                    argv: {}
                });

                var joinedPath = path.join(firstFile.base, 'section-' + sectionRoots[i] + '.html');

                var file = new File({
                  cwd: firstFile.cwd,
                  base: firstFile.base,
                  path: joinedPath,
                  contents: new Buffer(content)
                });

                self.emit('data', file);
            }

            // Generate Overview File
            if (opt.overview) {
                gulp.src(opt.overview)
                    .pipe(through(function (file) {

                        var content = template({
                            styleguide: styleguide,
                            sectionRoots: sectionRoots,
                            sections: jsonSections(childSections),
                            rootNumber: 0,
                            argv: {},
                            overview: marked(file.contents.toString('utf8'), 'utf8')
                        });

                        var joinedPath = path.join(firstFile.base, 'index.html');

                        var file = new File({
                            cwd: firstFile.cwd,
                            base: firstFile.base,
                            path: joinedPath,
                            contents: new Buffer(content)
                        });

                        self.emit('data', file);
                    }));
            }
            // Copy template assets, less compilation added because default template uses it
            gulp.src(path.join(opt.templateDirectory, '/**/*.less'))
                .pipe(gulpless())
                .pipe(through(function (file) {

                self.emit('data', file);
            }));

            gulp.src(path.join(opt.templateDirectory, '/**/*.js'))
                .pipe(through(function (file) {

                self.emit('data', file);
            }));

        });

    }

    function jsonSections(sections) {
        return sections.map(function(section) {
            return {
                header: section.header(),
                description: section.description(),
                reference: section.reference(),
                depth: section.data.refDepth,
                deprecated: section.deprecated(),
                experimental: section.experimental(),
                modifiers: jsonModifiers(section.modifiers())
            };
        });
    }

    // Convert an array of `KssModifier` instances to a JSON object.
    function jsonModifiers (modifiers) {
        return modifiers.map(function(modifier) {
            return {
                name: modifier.name(),
                description: modifier.description(),
                className: modifier.className()
            };
        });
    }

    return through(bufferContents, endStream);
};