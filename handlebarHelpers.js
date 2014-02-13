var kss = require('kss')

module.exports = function (handlebars, styleguide) {
    /**
     * Equivalent to the {#if} block helper with multiple arguments.
     */
    handlebars.registerHelper('ifAny', function() {
        var argLength = arguments.length - 2,
            content = arguments[argLength + 1],
            success = true;

        for (var i = 0; i < argLength; i += 1) {
            if (!arguments[i]) {
                success = false;
                break;
            }
        }

        return success ? content.fn(this) : content.inverse(this);
    });

    /**
     * Returns a single section, found by its reference number
     * @param  {String|Number} reference The reference number to search for.
     */
    handlebars.registerHelper('section', function(reference) {
        var section = styleguide.section(reference);
        if (!section) return false;

        return arguments[arguments.length-1](section.data);
    });

    /**
     * Loop over a section query. If a number is supplied, will convert into
     * a query for all children and descendants of that reference.
     * @param  {Mixed} query The section query
     */
    handlebars.registerHelper('eachSection', function(query) {
        var sections,
            i, l, buffer = "";
        query = (typeof query === 'string') ? query : query.toString();

        if (!query.match(/x|\*/g)) {
            query = new RegExp('^' + query + '$|^' + query + "\\..*");
        }
        sections = styleguide.section(query);

        if (!sections) return '';

        l = sections.length;
        for (i = 0; i < l; i += 1) {
            buffer += arguments[arguments.length-1].fn(sections[i].data);
        }

        return buffer;
    });

    /**
     * Loop over each section root, i.e. each section only one level deep.
     */
    handlebars.registerHelper('eachRoot', function() {
        var sections,
            i, l, buffer = "";

        sections = styleguide.section('x');
        if (!sections) return '';

        l = sections.length;
        for (i = 0; i < l; i += 1) {
            buffer += arguments[arguments.length-1].fn(sections[i].data);
        }

        return buffer;
    });

    /**
     * Equivalent to "if the current section is X levels deep". e.g:
     *
     * {{#refDepth 1}}
     *   ROOT ELEMENTS ONLY
     *  {{else}}
     *   ANYTHING ELSE
     * {{/refDepth}}
     */
    handlebars.registerHelper('whenDepth', function(depth, context) {
        if (!(context && this.refDepth)) {
            return '';
        }
        if (depth == this.refDepth) {
            return context.fn(this);
        }
        if (context.inverse) {
            return context.inverse(this);
        }
    });

    /**
     * Similar to the {#eachSection} helper, however will loop over each modifier
     * @param  {Object} section Supply a section object to loop over it's modifiers. Defaults to the current section.
     */
    handlebars.registerHelper('eachModifier', function(section) {
        var modifiers, i, l, buffer = '';

        // Default to current modifiers, but allow supplying a custom section
        if (section.data) modifiers = section.data.modifiers;
        modifiers = modifiers || this.modifiers || false;

        if (!modifiers) return {};

        l = modifiers.length;
        for (i = 0; i < l; i++) {
            buffer += arguments[arguments.length-1].fn(modifiers[i].data || '');
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
        return new handlebars.SafeString(arg || '');
    });

    return handlebars;
};