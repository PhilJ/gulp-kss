var kss = require('kss')

module.exports = function (handlebars, styleguide) {
    /**
     * Returns a single section, found by its reference number
     * @param  {String|Number} reference The reference number to search for.
     */
    handlebars.registerHelper('section', function(reference, options) {
        var section = styleguide.section(reference);

        return section ? options.fn(section.data) : false;
    });

    /**
     * Loop over a section query. If a number is supplied, will convert into
     * a query for all children and descendants of that reference.
     * @param  {Mixed} query The section query
     */
    handlebars.registerHelper('eachSection', function(query, options) {
        var buffer = '',
            sections,
            i, l;

        if (!query.match(/x|\*/g)) {
            query = new RegExp('^' + query + '$|^' + query + "\\..*");
        }
        sections = styleguide.section(query);
        if (!sections) return '';

        l = sections.length;
        for (i = 0; i < l; i += 1) {
            buffer += options.fn(sections[i].data);
        }

        return buffer;
    });

    /**
     * Loop over each section root, i.e. each section only one level deep.
     */
    handlebars.registerHelper('eachRoot', function(options) {
        var buffer = '',
            sections,
            i, l;

        sections = styleguide.section('x');
        if (!sections) return '';

        l = sections.length;
        for (i = 0; i < l; i += 1) {
            buffer += options.fn(sections[i].data);
        }

        return buffer;
    });

    /**
     * Equivalent to "if the current section is X levels deep". e.g:
     *
     * {{#ifDepth 1}}
     *   ROOT ELEMENTS ONLY
     *  {{else}}
     *   ANYTHING ELSE
     * {{/ifDepth}}
     */
    handlebars.registerHelper('ifDepth', function(depth, options) {
        if (!this.refDepth) {
            return '';
        }
        return (depth == this.refDepth) ? options.fn(this) : options.inverse(this);
    });

    /**
     * Equivalent to "unless the current section is X levels deep". e.g:
     *
     * {{#unlessDepth 1}}
     *   ANYTHING ELSE
     *  {{else}}
     *   ROOT ELEMENTS ONLY
     * {{/unlessDepth}}
     */
    handlebars.registerHelper('unlessDepth', function(depth, options) {
        if (!this.refDepth) {
            return '';
        }
        return (depth == this.refDepth) ? options.inverse(this) : options.fn(this);
    });

    /**
     * Similar to the {#eachSection} helper, however will loop over each modifier
     * @param  {Object} section Supply a section object to loop over it's modifiers. Defaults to the current section.
     */
    handlebars.registerHelper('eachModifier', function() {
        var modifiers,
            options = arguments[arguments.length - 1],
            buffer = '',
            i, l;

        // Default to current modifiers, but allow supplying a custom section.
        modifiers = (arguments.length > 1 && arguments[0].data) ? arguments[0].data.modifiers : this.modifiers;

        if (!modifiers) return {};

        l = modifiers.length;
        for (i = 0; i < l; i++) {
            buffer += options.fn(modifiers[i].data || '');
        }
        return buffer;
    });

    /**
     * Outputs a modifier's markup, if possible.
     * @param  {Object} modifier Specify a particular modifier object. Defaults to the current modifier.
     */
    handlebars.registerHelper('modifierMarkup', function(modifier) {
        modifier = arguments.length < 2 ? this : modifier || this || false;

        if (!modifier) {
            return false;
        }

        // Maybe it's actually a section?
        if (modifier.modifiers) {
            return new handlebars.SafeString(
                modifier.markup
            );
        }

        // Otherwise return the modifier markup
        return new handlebars.SafeString(
            new kss.KssModifier(modifier).markup()
        );
    });

    /**
     * Quickly avoid escaping strings
     * @param  {String} arg The unescaped HTML
     */
    handlebars.registerHelper('html', function(arg) {
        // Warn the user that html is deprecated.
        console.log('{{html expression}} is deprecated; use HandleBars’ triple-stash instead: {{{expression}}}.');

        return new handlebars.SafeString(arg || '');
    });

    /**
     * Equivalent to the {#if} block helper with multiple arguments.
     */
    handlebars.registerHelper('ifAny', function() {
        var numItems = arguments.length - 1,
            options = arguments[numItems],
            success = true,
            i;

        // Warn the user that IfAny is deprecated. The only usage in kss-node was
        // {{#ifAny markup modifiers}} and, since modifiers is an object and, always
        // evals to true (even when empty), #ifAny was effectively a dupe of #If.
        console.log('IfAny is deprecated; if your template has {{#ifAny markup modifiers}}...{{/ifAny}}, replace it with {{#if markup}}...{{/if}}.');

        for (i = 0; i < numItems; i += 1) {
            if (!arguments[i]) {
                success = false;
                break;
            }
        }

        return success ? options.fn(this) : options.inverse(this);
    });

    /**
     * Equivalent to "if the current section is X levels deep".
     */
    handlebars.registerHelper('whenDepth', function(depth, options) {
        // Warn the user that whenDepth is deprecated.
        console.log('{{whenDepth expression}} is deprecated; use {{ifDepth expression}} instead.');
        return handlebars.helpers.ifDepth.call(this, depth, options);
    });

    return handlebars;
};
