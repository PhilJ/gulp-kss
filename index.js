var fs          = require('fs'),
    gulp        = require('gulp'),
    kss         = require('kss'),
    path        = require('path'),
    gutil       = require('gulp-util'),
    util        = require('util'),
    assign      = require('object-assign'),
    handlebars  = require('handlebars'),
    gulpless    = require('gulp-less'),
    sass        = require('gulp-sass'),
    File        = require('vinyl'),
    marked      = require('marked'),
    through     = require('through'),
    custom      = [],
    styleguide,
    handlebarHelpers  = require('./handlebarHelpers');

module.exports = function(opt) {
    'use strict';
    var styleguide,
        firstFile = null,
        buffer = [],
        defaults = {
            template: './node_modules/kss/lib/template',
            mask: {},
            markdown: true,
            multiline: true,
            typos: false,
            custom: [],
            helpers: '',
            css: [],
            js: []
        },
        cache = {partial: {}};

    opt = assign(defaults, opt);
    var templatePath = path.resolve(process.cwd() + '/' + opt.template),
        template     = fs.readFileSync(templatePath + '/index.html', 'utf8');
        template = handlebars.compile(template);



    /* Is called for each file and writes all files to buffer */
    function bufferContents(file){
        if (file.isNull()) return; // ignore
        if (file.isStream()) return this.emit('error', new PluginError('gulp-kss',  'Streaming not supported'));

        if (!firstFile) firstFile = file;
        buffer.push(file.contents.toString('utf8'));
    }

    function processKss() {
        var self = this;

        kss.parse(buffer, opt, function(err, guide) {
            if (err) {
                console.log('Error', error);
                throw err;
            }

            styleguide = guide;
            // Compile the Handlebars template

            var i,
                rootCount,
                currentRoot,
                sections = styleguide.section(),
                sectionCount = sections.length,
                sectionRoots = [],
                childSections = [],
                partial,
                files = [];


            // Throw an error if no KSS sections are found in the source files.
            if (sectionCount === 0) {
                throw 'No KSS documentation discovered in source files.';
            }
            for (i = 0; i < sectionCount; i += 1) {
                // Register all the markup blocks as Handlebars partials.
                if (sections[i].markup()) {
                    partial = {
                        name: sections[i].reference(),
                        reference: sections[i].reference(),
                        file: '',
                        markup: sections[i].markup(),
                        data: {}
                    };
                    // If the markup is a file path, attempt to load the file.
                    if (partial.markup.match(/^[^\n]+\.(html|hbs)$/)) {
                        partial.file = partial.markup;
                        partial.name = path.basename(partial.file, path.extname(partial.file));
                        files = [];
                        for (var key in argv.source) {
                            if (!files.length) {
                                files = glob.sync(argv.source[key] + '/**/' + partial.file);
                            }
                        }
                        // If the markup file is not found, note that in the style guide.
                        if (!files.length) {
                            partial.markup += ' NOT FOUND!';
                        }
                        console.log(' - ' + partial.reference + ': ' + partial.markup);
                        if (files.length) {
                            // Load the partial's markup from file.
                            partial.file = files[0];
                            partial.markup = fs.readFileSync(partial.file, 'utf8');
                            // Load sample data for the partial from the sample .json file.
                            if (fs.existsSync(path.dirname(partial.file) + '/' + partial.name + '.json')) {
                                try {
                                    partial.data = require(path.dirname(partial.file) + '/' + partial.name + '.json');
                                } catch (e) {
                                    partial.data = {};
                                }
                            }
                        }
                    }
                    else {
                        console.log(' - ' + partial.reference + ': inline markup');
                    }

                    // Register the partial using the filename (without extension) or using
                    // the style guide reference.
                    handlebars.registerPartial(partial.name, partial.markup);

                    // Save the name of the partial and its data for retrieval in the markup
                    // helper, where we only know the reference.
                    cache.partial[partial.reference] = {
                        name: partial.name,
                        data: partial.data
                    };

                }

                // Accumulate all of the sections' first indexes
                // in case they don't have a root element.
                currentRoot = sections[i].reference().split(/(?:\.|\s+\-\s+)/)[0];
                if (sectionRoots.indexOf(currentRoot) === -1) {
                    sectionRoots.push(currentRoot);
                }

                console.log('...Generating style guide sections:');
            }


            handlebarHelpers(handlebars, styleguide, cache);
            if (fs.existsSync(opt.helpers)) {
                var helperFiles = fs.readdirSync(opt.helpers);
                helperFiles.forEach(function(fileName) {
                    if (path.extname(fileName) !== '.js') {
                        return;
                    }
                    opt.helpers = path.normalize(opt.helpers);
                    opt.helpers = path.resolve(process.cwd(), opt.helpers);
                    var helper = require(opt.helpers + '/' + fileName);
                    if (typeof helper.register === 'function') {
                        helper.register(handlebars, styleguide);
                    }
                });
            }

            // Now, group all of the sections by their root
            // reference, and make a page for each.
            rootCount = sectionRoots.length;

            for (i = 0; i < rootCount; i += 1) {
                childSections = styleguide.section(sectionRoots[i]+'.*');
                self.emit('data', generatePage(styleguide, childSections, sectionRoots[i], sectionRoots, template));
            }

            // Generate the homepage.
            childSections = [];
            self.emit('data', generatePage(styleguide, childSections, 'styleguide.homepage', sectionRoots, template));

            gulp.src(templatePath + '/**/*.{sass, scss, less}')
                .pipe(gulpless())
                .pipe(sass())
                .pipe(through(function(file) {

                    self.emit('data', file);
                }).on('end', function() {
                    emitEnd(self);
                }));

            gulp.src(path.join(templatePath, '/**/*.js'))
                .pipe(through(function(file) {

                    self.emit('data', file);
                }).on('end', function() {
                    emitEnd(self);
                }));

        });
    }

    // function jsonSections(sections) {
    //     return sections.map(function(section) {
    //         return {
    //             header: section.header(),
    //             description: section.description(),
    //             reference: section.reference(),
    //             depth: section.data.refDepth,
    //             deprecated: section.deprecated(),
    //             experimental: section.experimental(),
    //             modifiers: jsonModifiers(section.modifiers())
    //         };
    //     });
    // }

    // function jsonModifiers (modifiers) {
    //     return modifiers.map(function(modifier) {
    //         return {
    //             name: modifier.name(),
    //             description: modifier.description(),
    //             className: modifier.className()
    //         };
    //     });
    // }

    function generatePage(styleguide, sections, root, sectionRoots, template) {
        var files,
            filename = '',
            homepageText = false,
            styles = opt.css,
            scripts = opt.js;

        // Create the HTML to load the optional CSS and JS.
        for (var key in opt.css) {
            styles = styles + '<link rel="stylesheet" href="' + opt.css[key] + '">\n';
        }
        for (var key in opt.js) {
            scripts = scripts + '<script src="' + opt.js[key] + '"></script>\n';
        }


        if (root == 'styleguide.homepage') {
            filename = 'index.html';
            console.log(' - homepage');
            // Ensure homepageText is a non-false value.
            if (fs.existsSync(opt.template + '/styleguide.md') ) {
                homepageText = ' ' + marked(fs.readFileSync(opt.template + '/styleguide.md', 'utf8'));
            }
            if (!homepageText) {
                homepageText = ' ';
                console.log('   ...no homepage content found in styleguide.md.');
            }
        }
        else {
            filename = 'section-' + kss.KssSection.prototype.encodeReferenceURI(root) + '.html';
            console.log(
                ' - section '+root+' [',
                styleguide.section(root) ? styleguide.section(root).header() : 'Unnamed',
                ']'
            );
        }
        // console.log(opt.custom);
        // console.log(
        //     sections.map(function(section) {
        //         console.log(section);
        //             return section.JSON(opt.custom);
        //     })
        // );
        var content = template({
                styleguide: styleguide,
                sections: sections.map(function(section) {
                    return section.JSON(opt.custom);
                }),
                sectionRoots: sectionRoots,
                rootName: root,
                homepage: homepageText,
                overview: false,
                styles: styles,
                scripts: scripts
            }),
            filename = path.join(firstFile.base, filename),
            file = new File({
                cwd: firstFile.cwd,
                base: firstFile.base,
                path: filename,
                contents: new Buffer(content)
            });

        return file;
    };

    var underscoreAfter = function underscoreAfter(times, func) {
      return function() {
        if (--times < 1) {
          return func.apply(this, arguments);
        }
      };
    };

    var emitEnd = underscoreAfter(2, function emitEnd(self) {
      self.emit('end');
    });

    return through(bufferContents, processKss);
};

