
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
  'use strict';

  /**
   * Template7 1.4.2
   * Mobile-first HTML template engine
   * 
   * http://www.idangero.us/template7/
   * 
   * Copyright 2019, Vladimir Kharlampidi
   * The iDangero.us
   * http://www.idangero.us/
   * 
   * Licensed under MIT
   * 
   * Released on: June 14, 2019
   */

  let t7ctx;
  if (typeof window !== 'undefined') {
    t7ctx = window;
  } else if (typeof global !== 'undefined') {
    t7ctx = global;
  } else {
    t7ctx = undefined;
  }

  const Template7Context = t7ctx;

  const Template7Utils = {
    quoteSingleRexExp: new RegExp('\'', 'g'),
    quoteDoubleRexExp: new RegExp('"', 'g'),
    isFunction(func) {
      return typeof func === 'function';
    },
    escape(string = '') {
      return string
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    helperToSlices(string) {
      const { quoteDoubleRexExp, quoteSingleRexExp } = Template7Utils;
      const helperParts = string.replace(/[{}#}]/g, '').trim().split(' ');
      const slices = [];
      let shiftIndex;
      let i;
      let j;
      for (i = 0; i < helperParts.length; i += 1) {
        let part = helperParts[i];
        let blockQuoteRegExp;
        let openingQuote;
        if (i === 0) slices.push(part);
        else if (part.indexOf('"') === 0 || part.indexOf('\'') === 0) {
          blockQuoteRegExp = part.indexOf('"') === 0 ? quoteDoubleRexExp : quoteSingleRexExp;
          openingQuote = part.indexOf('"') === 0 ? '"' : '\'';
          // Plain String
          if (part.match(blockQuoteRegExp).length === 2) {
            // One word string
            slices.push(part);
          } else {
            // Find closed Index
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j += 1) {
              part += ` ${helperParts[j]}`;
              if (helperParts[j].indexOf(openingQuote) >= 0) {
                shiftIndex = j;
                slices.push(part);
                break;
              }
            }
            if (shiftIndex) i = shiftIndex;
          }
        } else if (part.indexOf('=') > 0) {
          // Hash
          const hashParts = part.split('=');
          const hashName = hashParts[0];
          let hashContent = hashParts[1];
          if (!blockQuoteRegExp) {
            blockQuoteRegExp = hashContent.indexOf('"') === 0 ? quoteDoubleRexExp : quoteSingleRexExp;
            openingQuote = hashContent.indexOf('"') === 0 ? '"' : '\'';
          }
          if (hashContent.match(blockQuoteRegExp).length !== 2) {
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j += 1) {
              hashContent += ` ${helperParts[j]}`;
              if (helperParts[j].indexOf(openingQuote) >= 0) {
                shiftIndex = j;
                break;
              }
            }
            if (shiftIndex) i = shiftIndex;
          }
          const hash = [hashName, hashContent.replace(blockQuoteRegExp, '')];
          slices.push(hash);
        } else {
          // Plain variable
          slices.push(part);
        }
      }
      return slices;
    },
    stringToBlocks(string) {
      const blocks = [];
      let i;
      let j;
      if (!string) return [];
      const stringBlocks = string.split(/({{[^{^}]*}})/);
      for (i = 0; i < stringBlocks.length; i += 1) {
        let block = stringBlocks[i];
        if (block === '') continue;
        if (block.indexOf('{{') < 0) {
          blocks.push({
            type: 'plain',
            content: block,
          });
        } else {
          if (block.indexOf('{/') >= 0) {
            continue;
          }
          block = block
            .replace(/{{([#/])*([ ])*/, '{{$1')
            .replace(/([ ])*}}/, '}}');
          if (block.indexOf('{#') < 0 && block.indexOf(' ') < 0 && block.indexOf('else') < 0) {
            // Simple variable
            blocks.push({
              type: 'variable',
              contextName: block.replace(/[{}]/g, ''),
            });
            continue;
          }
          // Helpers
          const helperSlices = Template7Utils.helperToSlices(block);
          let helperName = helperSlices[0];
          const isPartial = helperName === '>';
          const helperContext = [];
          const helperHash = {};
          for (j = 1; j < helperSlices.length; j += 1) {
            const slice = helperSlices[j];
            if (Array.isArray(slice)) {
              // Hash
              helperHash[slice[0]] = slice[1] === 'false' ? false : slice[1];
            } else {
              helperContext.push(slice);
            }
          }

          if (block.indexOf('{#') >= 0) {
            // Condition/Helper
            let helperContent = '';
            let elseContent = '';
            let toSkip = 0;
            let shiftIndex;
            let foundClosed = false;
            let foundElse = false;
            let depth = 0;
            for (j = i + 1; j < stringBlocks.length; j += 1) {
              if (stringBlocks[j].indexOf('{{#') >= 0) {
                depth += 1;
              }
              if (stringBlocks[j].indexOf('{{/') >= 0) {
                depth -= 1;
              }
              if (stringBlocks[j].indexOf(`{{#${helperName}`) >= 0) {
                helperContent += stringBlocks[j];
                if (foundElse) elseContent += stringBlocks[j];
                toSkip += 1;
              } else if (stringBlocks[j].indexOf(`{{/${helperName}`) >= 0) {
                if (toSkip > 0) {
                  toSkip -= 1;
                  helperContent += stringBlocks[j];
                  if (foundElse) elseContent += stringBlocks[j];
                } else {
                  shiftIndex = j;
                  foundClosed = true;
                  break;
                }
              } else if (stringBlocks[j].indexOf('else') >= 0 && depth === 0) {
                foundElse = true;
              } else {
                if (!foundElse) helperContent += stringBlocks[j];
                if (foundElse) elseContent += stringBlocks[j];
              }
            }
            if (foundClosed) {
              if (shiftIndex) i = shiftIndex;
              if (helperName === 'raw') {
                blocks.push({
                  type: 'plain',
                  content: helperContent,
                });
              } else {
                blocks.push({
                  type: 'helper',
                  helperName,
                  contextName: helperContext,
                  content: helperContent,
                  inverseContent: elseContent,
                  hash: helperHash,
                });
              }
            }
          } else if (block.indexOf(' ') > 0) {
            if (isPartial) {
              helperName = '_partial';
              if (helperContext[0]) {
                if (helperContext[0].indexOf('[') === 0) helperContext[0] = helperContext[0].replace(/[[\]]/g, '');
                else helperContext[0] = `"${helperContext[0].replace(/"|'/g, '')}"`;
              }
            }
            blocks.push({
              type: 'helper',
              helperName,
              contextName: helperContext,
              hash: helperHash,
            });
          }
        }
      }
      return blocks;
    },
    parseJsVariable(expression, replace, object) {
      return expression.split(/([+ \-*/^()&=|<>!%:?])/g).reduce((arr, part) => {
        if (!part) {
          return arr;
        }
        if (part.indexOf(replace) < 0) {
          arr.push(part);
          return arr;
        }
        if (!object) {
          arr.push(JSON.stringify(''));
          return arr;
        }

        let variable = object;
        if (part.indexOf(`${replace}.`) >= 0) {
          part.split(`${replace}.`)[1].split('.').forEach((partName) => {
            if (partName in variable) variable = variable[partName];
            else variable = undefined;
          });
        }
        if (
          (typeof variable === 'string')
          || Array.isArray(variable)
          || (variable.constructor && variable.constructor === Object)
        ) {
          variable = JSON.stringify(variable);
        }
        if (variable === undefined) variable = 'undefined';

        arr.push(variable);
        return arr;
      }, []).join('');

    },
    parseJsParents(expression, parents) {
      return expression.split(/([+ \-*^()&=|<>!%:?])/g).reduce((arr, part) => {
        if (!part) {
          return arr;
        }

        if (part.indexOf('../') < 0) {
          arr.push(part);
          return arr;
        }

        if (!parents || parents.length === 0) {
          arr.push(JSON.stringify(''));
          return arr;
        }

        const levelsUp = part.split('../').length - 1;
        const parentData = levelsUp > parents.length ? parents[parents.length - 1] : parents[levelsUp - 1];

        let variable = parentData;
        const parentPart = part.replace(/..\//g, '');
        parentPart.split('.').forEach((partName) => {
          if (typeof variable[partName] !== 'undefined') variable = variable[partName];
          else variable = 'undefined';
        });
        if (variable === false || variable === true) {
          arr.push(JSON.stringify(variable));
          return arr;
        }
        if (variable === null || variable === 'undefined') {
          arr.push(JSON.stringify(''));
          return arr;
        }
        arr.push(JSON.stringify(variable));
        return arr;
      }, []).join('');
    },
    getCompileVar(name, ctx, data = 'data_1') {
      let variable = ctx;
      let parts;
      let levelsUp = 0;
      let newDepth;
      if (name.indexOf('../') === 0) {
        levelsUp = name.split('../').length - 1;
        newDepth = variable.split('_')[1] - levelsUp;
        variable = `ctx_${newDepth >= 1 ? newDepth : 1}`;
        parts = name.split('../')[levelsUp].split('.');
      } else if (name.indexOf('@global') === 0) {
        variable = 'Template7.global';
        parts = name.split('@global.')[1].split('.');
      } else if (name.indexOf('@root') === 0) {
        variable = 'root';
        parts = name.split('@root.')[1].split('.');
      } else {
        parts = name.split('.');
      }
      for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        if (part.indexOf('@') === 0) {
          let dataLevel = data.split('_')[1];
          if (levelsUp > 0) {
            dataLevel = newDepth;
          }
          if (i > 0) {
            variable += `[(data_${dataLevel} && data_${dataLevel}.${part.replace('@', '')})]`;
          } else {
            variable = `(data_${dataLevel} && data_${dataLevel}.${part.replace('@', '')})`;
          }
        } else if (Number.isFinite ? Number.isFinite(part) : Template7Context.isFinite(part)) {
          variable += `[${part}]`;
        } else if (part === 'this' || part.indexOf('this.') >= 0 || part.indexOf('this[') >= 0 || part.indexOf('this(') >= 0) {
          variable = part.replace('this', ctx);
        } else {
          variable += `.${part}`;
        }
      }
      return variable;
    },
    getCompiledArguments(contextArray, ctx, data) {
      const arr = [];
      for (let i = 0; i < contextArray.length; i += 1) {
        if (/^['"]/.test(contextArray[i])) arr.push(contextArray[i]);
        else if (/^(true|false|\d+)$/.test(contextArray[i])) arr.push(contextArray[i]);
        else {
          arr.push(Template7Utils.getCompileVar(contextArray[i], ctx, data));
        }
      }

      return arr.join(', ');
    },
  };

  /* eslint no-eval: "off" */

  const Template7Helpers = {
    _partial(partialName, options) {
      const ctx = this;
      const p = Template7Class.partials[partialName];
      if (!p || (p && !p.template)) return '';
      if (!p.compiled) {
        p.compiled = new Template7Class(p.template).compile();
      }
      Object.keys(options.hash).forEach((hashName) => {
        ctx[hashName] = options.hash[hashName];
      });
      return p.compiled(ctx, options.data, options.root);
    },
    escape(context) {
      if (typeof context === 'undefined' || context === null) return '';
      if (typeof context !== 'string') {
        throw new Error('Template7: Passed context to "escape" helper should be a string');
      }
      return Template7Utils.escape(context);
    },
    if(context, options) {
      let ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (ctx) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
    unless(context, options) {
      let ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (!ctx) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
    each(context, options) {
      let ctx = context;
      let ret = '';
      let i = 0;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (Array.isArray(ctx)) {
        if (options.hash.reverse) {
          ctx = ctx.reverse();
        }
        for (i = 0; i < ctx.length; i += 1) {
          ret += options.fn(ctx[i], { first: i === 0, last: i === ctx.length - 1, index: i });
        }
        if (options.hash.reverse) {
          ctx = ctx.reverse();
        }
      } else {
        // eslint-disable-next-line
        for (const key in ctx) {
          i += 1;
          ret += options.fn(ctx[key], { key });
        }
      }
      if (i > 0) return ret;
      return options.inverse(this);
    },
    with(context, options) {
      let ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = context.call(this); }
      return options.fn(ctx);
    },
    join(context, options) {
      let ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      return ctx.join(options.hash.delimiter || options.hash.delimeter);
    },
    js(expression, options) {
      const data = options.data;
      let func;
      let execute = expression;
      ('index first last key').split(' ').forEach((prop) => {
        if (typeof data[prop] !== 'undefined') {
          const re1 = new RegExp(`this.@${prop}`, 'g');
          const re2 = new RegExp(`@${prop}`, 'g');
          execute = execute
            .replace(re1, JSON.stringify(data[prop]))
            .replace(re2, JSON.stringify(data[prop]));
        }
      });
      if (options.root && execute.indexOf('@root') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@root', options.root);
      }
      if (execute.indexOf('@global') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@global', Template7Context.Template7.global);
      }
      if (execute.indexOf('../') >= 0) {
        execute = Template7Utils.parseJsParents(execute, options.parents);
      }
      if (execute.indexOf('return') >= 0) {
        func = `(function(){${execute}})`;
      } else {
        func = `(function(){return (${execute})})`;
      }
      return eval(func).call(this);
    },
    js_if(expression, options) {
      const data = options.data;
      let func;
      let execute = expression;
      ('index first last key').split(' ').forEach((prop) => {
        if (typeof data[prop] !== 'undefined') {
          const re1 = new RegExp(`this.@${prop}`, 'g');
          const re2 = new RegExp(`@${prop}`, 'g');
          execute = execute
            .replace(re1, JSON.stringify(data[prop]))
            .replace(re2, JSON.stringify(data[prop]));
        }
      });
      if (options.root && execute.indexOf('@root') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@root', options.root);
      }
      if (execute.indexOf('@global') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@global', Template7Context.Template7.global);
      }
      if (execute.indexOf('../') >= 0) {
        execute = Template7Utils.parseJsParents(execute, options.parents);
      }
      if (execute.indexOf('return') >= 0) {
        func = `(function(){${execute}})`;
      } else {
        func = `(function(){return (${execute})})`;
      }
      const condition = eval(func).call(this);
      if (condition) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
  };
  Template7Helpers.js_compare = Template7Helpers.js_if;

  const Template7Options = {};
  const Template7Partials = {};

  class Template7Class {
    constructor(template) {
      const t = this;
      t.template = template;
    }
    compile(template = this.template, depth = 1) {
      const t = this;
      if (t.compiled) return t.compiled;

      if (typeof template !== 'string') {
        throw new Error('Template7: Template must be a string');
      }
      const { stringToBlocks, getCompileVar, getCompiledArguments } = Template7Utils;

      const blocks = stringToBlocks(template);
      const ctx = `ctx_${depth}`;
      const data = `data_${depth}`;
      if (blocks.length === 0) {
        return function empty() { return ''; };
      }

      function getCompileFn(block, newDepth) {
        if (block.content) return t.compile(block.content, newDepth);
        return function empty() { return ''; };
      }
      function getCompileInverse(block, newDepth) {
        if (block.inverseContent) return t.compile(block.inverseContent, newDepth);
        return function empty() { return ''; };
      }

      let resultString = '';
      if (depth === 1) {
        resultString += `(function (${ctx}, ${data}, root) {\n`;
      } else {
        resultString += `(function (${ctx}, ${data}) {\n`;
      }
      if (depth === 1) {
        resultString += 'function isArray(arr){return Array.isArray(arr);}\n';
        resultString += 'function isFunction(func){return (typeof func === \'function\');}\n';
        resultString += 'function c(val, ctx) {if (typeof val !== "undefined" && val !== null) {if (isFunction(val)) {return val.call(ctx);} else return val;} else return "";}\n';
        resultString += 'root = root || ctx_1 || {};\n';
      }
      resultString += 'var r = \'\';\n';
      let i;
      for (i = 0; i < blocks.length; i += 1) {
        const block = blocks[i];
        // Plain block
        if (block.type === 'plain') {
          // eslint-disable-next-line
          resultString += `r +='${(block.content).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, '\\' + '\'')}';`;
          continue;
        }
        let variable;
        let compiledArguments;
        // Variable block
        if (block.type === 'variable') {
          variable = getCompileVar(block.contextName, ctx, data);
          resultString += `r += c(${variable}, ${ctx});`;
        }
        // Helpers block
        if (block.type === 'helper') {
          let parents;
          if (ctx !== 'ctx_1') {
            const level = ctx.split('_')[1];
            let parentsString = `ctx_${level - 1}`;
            for (let j = level - 2; j >= 1; j -= 1) {
              parentsString += `, ctx_${j}`;
            }
            parents = `[${parentsString}]`;
          } else {
            parents = `[${ctx}]`;
          }
          let dynamicHelper;
          if (block.helperName.indexOf('[') === 0) {
            block.helperName = getCompileVar(block.helperName.replace(/[[\]]/g, ''), ctx, data);
            dynamicHelper = true;
          }
          if (dynamicHelper || block.helperName in Template7Helpers) {
            compiledArguments = getCompiledArguments(block.contextName, ctx, data);
            resultString += `r += (Template7Helpers${dynamicHelper ? `[${block.helperName}]` : `.${block.helperName}`}).call(${ctx}, ${compiledArguments && (`${compiledArguments}, `)}{hash:${JSON.stringify(block.hash)}, data: ${data} || {}, fn: ${getCompileFn(block, depth + 1)}, inverse: ${getCompileInverse(block, depth + 1)}, root: root, parents: ${parents}});`;
          } else if (block.contextName.length > 0) {
            throw new Error(`Template7: Missing helper: "${block.helperName}"`);
          } else {
            variable = getCompileVar(block.helperName, ctx, data);
            resultString += `if (${variable}) {`;
            resultString += `if (isArray(${variable})) {`;
            resultString += `r += (Template7Helpers.each).call(${ctx}, ${variable}, {hash:${JSON.stringify(block.hash)}, data: ${data} || {}, fn: ${getCompileFn(block, depth + 1)}, inverse: ${getCompileInverse(block, depth + 1)}, root: root, parents: ${parents}});`;
            resultString += '}else {';
            resultString += `r += (Template7Helpers.with).call(${ctx}, ${variable}, {hash:${JSON.stringify(block.hash)}, data: ${data} || {}, fn: ${getCompileFn(block, depth + 1)}, inverse: ${getCompileInverse(block, depth + 1)}, root: root, parents: ${parents}});`;
            resultString += '}}';
          }
        }
      }
      resultString += '\nreturn r;})';

      if (depth === 1) {
        // eslint-disable-next-line
        t.compiled = eval(resultString);
        return t.compiled;
      }
      return resultString;
    }
    static get options() {
      return Template7Options;
    }
    static get partials() {
      return Template7Partials;
    }
    static get helpers() {
      return Template7Helpers;
    }
  }

  function Template7(...args) {
    const [template, data] = args;
    if (args.length === 2) {
      let instance = new Template7Class(template);
      const rendered = instance.compile()(data);
      instance = null;
      return (rendered);
    }
    return new Template7Class(template);
  }
  Template7.registerHelper = function registerHelper(name, fn) {
    Template7Class.helpers[name] = fn;
  };
  Template7.unregisterHelper = function unregisterHelper(name) {
    Template7Class.helpers[name] = undefined;
    delete Template7Class.helpers[name];
  };
  Template7.registerPartial = function registerPartial(name, template) {
    Template7Class.partials[name] = { template };
  };
  Template7.unregisterPartial = function unregisterPartial(name) {
    if (Template7Class.partials[name]) {
      Template7Class.partials[name] = undefined;
      delete Template7Class.partials[name];
    }
  };
  Template7.compile = function compile(template, options) {
    const instance = new Template7Class(template, options);
    return instance.compile();
  };

  Template7.options = Template7Class.options;
  Template7.helpers = Template7Class.helpers;
  Template7.partials = Template7Class.partials;

  /**
   * SSR Window 2.0.0
   * Better handling for window object in SSR environment
   * https://github.com/nolimits4web/ssr-window
   *
   * Copyright 2020, Vladimir Kharlampidi
   *
   * Licensed under MIT
   *
   * Released on: May 12, 2020
   */
  /* eslint-disable no-param-reassign */
  function isObject(obj) {
      return (obj !== null &&
          typeof obj === 'object' &&
          'constructor' in obj &&
          obj.constructor === Object);
  }
  function extend(target, src) {
      if (target === void 0) { target = {}; }
      if (src === void 0) { src = {}; }
      Object.keys(src).forEach(function (key) {
          if (typeof target[key] === 'undefined')
              target[key] = src[key];
          else if (isObject(src[key]) &&
              isObject(target[key]) &&
              Object.keys(src[key]).length > 0) {
              extend(target[key], src[key]);
          }
      });
  }

  var doc = typeof document !== 'undefined' ? document : {};
  var ssrDocument = {
      body: {},
      addEventListener: function () { },
      removeEventListener: function () { },
      activeElement: {
          blur: function () { },
          nodeName: '',
      },
      querySelector: function () {
          return null;
      },
      querySelectorAll: function () {
          return [];
      },
      getElementById: function () {
          return null;
      },
      createEvent: function () {
          return {
              initEvent: function () { },
          };
      },
      createElement: function () {
          return {
              children: [],
              childNodes: [],
              style: {},
              setAttribute: function () { },
              getElementsByTagName: function () {
                  return [];
              },
          };
      },
      createElementNS: function () {
          return {};
      },
      importNode: function () {
          return null;
      },
      location: {
          hash: '',
          host: '',
          hostname: '',
          href: '',
          origin: '',
          pathname: '',
          protocol: '',
          search: '',
      },
  };
  extend(doc, ssrDocument);

  var win = typeof window !== 'undefined' ? window : {};
  var ssrWindow = {
      document: ssrDocument,
      navigator: {
          userAgent: '',
      },
      location: {
          hash: '',
          host: '',
          hostname: '',
          href: '',
          origin: '',
          pathname: '',
          protocol: '',
          search: '',
      },
      history: {
          replaceState: function () { },
          pushState: function () { },
          go: function () { },
          back: function () { },
      },
      CustomEvent: function CustomEvent() {
          return this;
      },
      addEventListener: function () { },
      removeEventListener: function () { },
      getComputedStyle: function () {
          return {
              getPropertyValue: function () {
                  return '';
              },
          };
      },
      Image: function () { },
      Date: function () { },
      screen: {},
      setTimeout: function () { },
      clearTimeout: function () { },
      matchMedia: function () {
          return {};
      },
  };
  extend(win, ssrWindow);

  /**
   * Dom7 2.1.5
   * Minimalistic JavaScript library for DOM manipulation, with a jQuery-compatible API
   * http://framework7.io/docs/dom.html
   *
   * Copyright 2020, Vladimir Kharlampidi
   * The iDangero.us
   * http://www.idangero.us/
   *
   * Licensed under MIT
   *
   * Released on: May 15, 2020
   */

  class Dom7 {
    constructor(arr) {
      const self = this;
      // Create array-like object
      for (let i = 0; i < arr.length; i += 1) {
        self[i] = arr[i];
      }
      self.length = arr.length;
      // Return collection with methods
      return this;
    }
  }

  function $(selector, context) {
    const arr = [];
    let i = 0;
    if (selector && !context) {
      if (selector instanceof Dom7) {
        return selector;
      }
    }
    if (selector) {
        // String
      if (typeof selector === 'string') {
        let els;
        let tempParent;
        const html = selector.trim();
        if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
          let toCreate = 'div';
          if (html.indexOf('<li') === 0) toCreate = 'ul';
          if (html.indexOf('<tr') === 0) toCreate = 'tbody';
          if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) toCreate = 'tr';
          if (html.indexOf('<tbody') === 0) toCreate = 'table';
          if (html.indexOf('<option') === 0) toCreate = 'select';
          tempParent = doc.createElement(toCreate);
          tempParent.innerHTML = html;
          for (i = 0; i < tempParent.childNodes.length; i += 1) {
            arr.push(tempParent.childNodes[i]);
          }
        } else {
          if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
            // Pure ID selector
            els = [doc.getElementById(selector.trim().split('#')[1])];
          } else {
            // Other selectors
            els = (context || doc).querySelectorAll(selector.trim());
          }
          for (i = 0; i < els.length; i += 1) {
            if (els[i]) arr.push(els[i]);
          }
        }
      } else if (selector.nodeType || selector === win || selector === doc) {
        // Node/element
        arr.push(selector);
      } else if (selector.length > 0 && selector[0].nodeType) {
        // Array of elements or instance of Dom
        for (i = 0; i < selector.length; i += 1) {
          arr.push(selector[i]);
        }
      }
    }
    return new Dom7(arr);
  }

  $.fn = Dom7.prototype;
  $.Class = Dom7;
  $.Dom7 = Dom7;

  function unique(arr) {
    const uniqueArray = [];
    for (let i = 0; i < arr.length; i += 1) {
      if (uniqueArray.indexOf(arr[i]) === -1) uniqueArray.push(arr[i]);
    }
    return uniqueArray;
  }
  function toCamelCase(string) {
    return string.toLowerCase().replace(/-(.)/g, (match, group1) => group1.toUpperCase());
  }

  function requestAnimationFrame(callback) {
    if (win.requestAnimationFrame) return win.requestAnimationFrame(callback);
    else if (win.webkitRequestAnimationFrame) return win.webkitRequestAnimationFrame(callback);
    return win.setTimeout(callback, 1000 / 60);
  }
  function cancelAnimationFrame(id) {
    if (win.cancelAnimationFrame) return win.cancelAnimationFrame(id);
    else if (win.webkitCancelAnimationFrame) return win.webkitCancelAnimationFrame(id);
    return win.clearTimeout(id);
  }

  // Classes and attributes
  function addClass(className) {
    if (typeof className === 'undefined') {
      return this;
    }
    const classes = className.split(' ');
    for (let i = 0; i < classes.length; i += 1) {
      for (let j = 0; j < this.length; j += 1) {
        if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') this[j].classList.add(classes[i]);
      }
    }
    return this;
  }
  function removeClass(className) {
    const classes = className.split(' ');
    for (let i = 0; i < classes.length; i += 1) {
      for (let j = 0; j < this.length; j += 1) {
        if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') this[j].classList.remove(classes[i]);
      }
    }
    return this;
  }
  function hasClass(className) {
    if (!this[0]) return false;
    return this[0].classList.contains(className);
  }
  function toggleClass(className) {
    const classes = className.split(' ');
    for (let i = 0; i < classes.length; i += 1) {
      for (let j = 0; j < this.length; j += 1) {
        if (typeof this[j] !== 'undefined' && typeof this[j].classList !== 'undefined') this[j].classList.toggle(classes[i]);
      }
    }
    return this;
  }
  function attr(attrs, value) {
    if (arguments.length === 1 && typeof attrs === 'string') {
      // Get attr
      if (this[0]) return this[0].getAttribute(attrs);
      return undefined;
    }

    // Set attrs
    for (let i = 0; i < this.length; i += 1) {
      if (arguments.length === 2) {
        // String
        this[i].setAttribute(attrs, value);
      } else {
        // Object
        // eslint-disable-next-line
        for (const attrName in attrs) {
          this[i][attrName] = attrs[attrName];
          this[i].setAttribute(attrName, attrs[attrName]);
        }
      }
    }
    return this;
  }
  // eslint-disable-next-line
  function removeAttr(attr) {
    for (let i = 0; i < this.length; i += 1) {
      this[i].removeAttribute(attr);
    }
    return this;
  }
  // eslint-disable-next-line
  function prop(props, value) {
    if (arguments.length === 1 && typeof props === 'string') {
      // Get prop
      if (this[0]) return this[0][props];
    } else {
      // Set props
      for (let i = 0; i < this.length; i += 1) {
        if (arguments.length === 2) {
          // String
          this[i][props] = value;
        } else {
          // Object
          // eslint-disable-next-line
          for (const propName in props) {
            this[i][propName] = props[propName];
          }
        }
      }
      return this;
    }
  }
  function data(key, value) {
    let el;
    if (typeof value === 'undefined') {
      el = this[0];
      // Get value
      if (el) {
        if (el.dom7ElementDataStorage && (key in el.dom7ElementDataStorage)) {
          return el.dom7ElementDataStorage[key];
        }

        const dataKey = el.getAttribute(`data-${key}`);
        if (dataKey) {
          return dataKey;
        }
        return undefined;
      }
      return undefined;
    }

    // Set value
    for (let i = 0; i < this.length; i += 1) {
      el = this[i];
      if (!el.dom7ElementDataStorage) el.dom7ElementDataStorage = {};
      el.dom7ElementDataStorage[key] = value;
    }
    return this;
  }
  function removeData(key) {
    for (let i = 0; i < this.length; i += 1) {
      const el = this[i];
      if (el.dom7ElementDataStorage && el.dom7ElementDataStorage[key]) {
        el.dom7ElementDataStorage[key] = null;
        delete el.dom7ElementDataStorage[key];
      }
    }
  }
  function dataset() {
    const el = this[0];
    if (!el) return undefined;
    const dataset = {}; // eslint-disable-line
    if (el.dataset) {
      // eslint-disable-next-line
      for (const dataKey in el.dataset) {
        dataset[dataKey] = el.dataset[dataKey];
      }
    } else {
      for (let i = 0; i < el.attributes.length; i += 1) {
        // eslint-disable-next-line
        const attr = el.attributes[i];
        if (attr.name.indexOf('data-') >= 0) {
          dataset[toCamelCase(attr.name.split('data-')[1])] = attr.value;
        }
      }
    }
    // eslint-disable-next-line
    for (const key in dataset) {
      if (dataset[key] === 'false') dataset[key] = false;
      else if (dataset[key] === 'true') dataset[key] = true;
      else if (parseFloat(dataset[key]) === dataset[key] * 1) dataset[key] *= 1;
    }
    return dataset;
  }
  function val(value) {
    const dom = this;
    if (typeof value === 'undefined') {
      if (dom[0]) {
        if (dom[0].multiple && dom[0].nodeName.toLowerCase() === 'select') {
          const values = [];
          for (let i = 0; i < dom[0].selectedOptions.length; i += 1) {
            values.push(dom[0].selectedOptions[i].value);
          }
          return values;
        }
        return dom[0].value;
      }
      return undefined;
    }

    for (let i = 0; i < dom.length; i += 1) {
      const el = dom[i];
      if (Array.isArray(value) && el.multiple && el.nodeName.toLowerCase() === 'select') {
        for (let j = 0; j < el.options.length; j += 1) {
          el.options[j].selected = value.indexOf(el.options[j].value) >= 0;
        }
      } else {
        el.value = value;
      }
    }
    return dom;
  }
  // Transforms
  // eslint-disable-next-line
  function transform(transform) {
    for (let i = 0; i < this.length; i += 1) {
      const elStyle = this[i].style;
      elStyle.webkitTransform = transform;
      elStyle.transform = transform;
    }
    return this;
  }
  function transition(duration) {
    if (typeof duration !== 'string') {
      duration = `${duration}ms`; // eslint-disable-line
    }
    for (let i = 0; i < this.length; i += 1) {
      const elStyle = this[i].style;
      elStyle.webkitTransitionDuration = duration;
      elStyle.transitionDuration = duration;
    }
    return this;
  }
  // Events
  function on(...args) {
    let [eventType, targetSelector, listener, capture] = args;
    if (typeof args[1] === 'function') {
      [eventType, listener, capture] = args;
      targetSelector = undefined;
    }
    if (!capture) capture = false;

    function handleLiveEvent(e) {
      const target = e.target;
      if (!target) return;
      const eventData = e.target.dom7EventData || [];
      if (eventData.indexOf(e) < 0) {
        eventData.unshift(e);
      }
      if ($(target).is(targetSelector)) listener.apply(target, eventData);
      else {
        const parents = $(target).parents(); // eslint-disable-line
        for (let k = 0; k < parents.length; k += 1) {
          if ($(parents[k]).is(targetSelector)) listener.apply(parents[k], eventData);
        }
      }
    }
    function handleEvent(e) {
      const eventData = e && e.target ? e.target.dom7EventData || [] : [];
      if (eventData.indexOf(e) < 0) {
        eventData.unshift(e);
      }
      listener.apply(this, eventData);
    }
    const events = eventType.split(' ');
    let j;
    for (let i = 0; i < this.length; i += 1) {
      const el = this[i];
      if (!targetSelector) {
        for (j = 0; j < events.length; j += 1) {
          const event = events[j];
          if (!el.dom7Listeners) el.dom7Listeners = {};
          if (!el.dom7Listeners[event]) el.dom7Listeners[event] = [];
          el.dom7Listeners[event].push({
            listener,
            proxyListener: handleEvent,
          });
          el.addEventListener(event, handleEvent, capture);
        }
      } else {
        // Live events
        for (j = 0; j < events.length; j += 1) {
          const event = events[j];
          if (!el.dom7LiveListeners) el.dom7LiveListeners = {};
          if (!el.dom7LiveListeners[event]) el.dom7LiveListeners[event] = [];
          el.dom7LiveListeners[event].push({
            listener,
            proxyListener: handleLiveEvent,
          });
          el.addEventListener(event, handleLiveEvent, capture);
        }
      }
    }
    return this;
  }
  function off(...args) {
    let [eventType, targetSelector, listener, capture] = args;
    if (typeof args[1] === 'function') {
      [eventType, listener, capture] = args;
      targetSelector = undefined;
    }
    if (!capture) capture = false;

    const events = eventType.split(' ');
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      for (let j = 0; j < this.length; j += 1) {
        const el = this[j];
        let handlers;
        if (!targetSelector && el.dom7Listeners) {
          handlers = el.dom7Listeners[event];
        } else if (targetSelector && el.dom7LiveListeners) {
          handlers = el.dom7LiveListeners[event];
        }
        if (handlers && handlers.length) {
          for (let k = handlers.length - 1; k >= 0; k -= 1) {
            const handler = handlers[k];
            if (listener && handler.listener === listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            } else if (listener && handler.listener && handler.listener.dom7proxy && handler.listener.dom7proxy === listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            } else if (!listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            }
          }
        }
      }
    }
    return this;
  }
  function once(...args) {
    const dom = this;
    let [eventName, targetSelector, listener, capture] = args;
    if (typeof args[1] === 'function') {
      [eventName, listener, capture] = args;
      targetSelector = undefined;
    }
    function onceHandler(...eventArgs) {
      listener.apply(this, eventArgs);
      dom.off(eventName, targetSelector, onceHandler, capture);
      if (onceHandler.dom7proxy) {
        delete onceHandler.dom7proxy;
      }
    }
    onceHandler.dom7proxy = listener;
    return dom.on(eventName, targetSelector, onceHandler, capture);
  }
  function trigger(...args) {
    const events = args[0].split(' ');
    const eventData = args[1];
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      for (let j = 0; j < this.length; j += 1) {
        const el = this[j];
        let evt;
        try {
          evt = new win.CustomEvent(event, {
            detail: eventData,
            bubbles: true,
            cancelable: true,
          });
        } catch (e) {
          evt = doc.createEvent('Event');
          evt.initEvent(event, true, true);
          evt.detail = eventData;
        }
        // eslint-disable-next-line
        el.dom7EventData = args.filter((data, dataIndex) => dataIndex > 0);
        el.dispatchEvent(evt);
        el.dom7EventData = [];
        delete el.dom7EventData;
      }
    }
    return this;
  }
  function transitionEnd(callback) {
    const events = ['webkitTransitionEnd', 'transitionend'];
    const dom = this;
    let i;
    function fireCallBack(e) {
      /* jshint validthis:true */
      if (e.target !== this) return;
      callback.call(this, e);
      for (i = 0; i < events.length; i += 1) {
        dom.off(events[i], fireCallBack);
      }
    }
    if (callback) {
      for (i = 0; i < events.length; i += 1) {
        dom.on(events[i], fireCallBack);
      }
    }
    return this;
  }
  function animationEnd(callback) {
    const events = ['webkitAnimationEnd', 'animationend'];
    const dom = this;
    let i;
    function fireCallBack(e) {
      if (e.target !== this) return;
      callback.call(this, e);
      for (i = 0; i < events.length; i += 1) {
        dom.off(events[i], fireCallBack);
      }
    }
    if (callback) {
      for (i = 0; i < events.length; i += 1) {
        dom.on(events[i], fireCallBack);
      }
    }
    return this;
  }
  // Sizing/Styles
  function width() {
    if (this[0] === win) {
      return win.innerWidth;
    }

    if (this.length > 0) {
      return parseFloat(this.css('width'));
    }

    return null;
  }
  function outerWidth(includeMargins) {
    if (this.length > 0) {
      if (includeMargins) {
        // eslint-disable-next-line
        const styles = this.styles();
        return this[0].offsetWidth + parseFloat(styles.getPropertyValue('margin-right')) + parseFloat(styles.getPropertyValue('margin-left'));
      }
      return this[0].offsetWidth;
    }
    return null;
  }
  function height() {
    if (this[0] === win) {
      return win.innerHeight;
    }

    if (this.length > 0) {
      return parseFloat(this.css('height'));
    }

    return null;
  }
  function outerHeight(includeMargins) {
    if (this.length > 0) {
      if (includeMargins) {
        // eslint-disable-next-line
        const styles = this.styles();
        return this[0].offsetHeight + parseFloat(styles.getPropertyValue('margin-top')) + parseFloat(styles.getPropertyValue('margin-bottom'));
      }
      return this[0].offsetHeight;
    }
    return null;
  }
  function offset() {
    if (this.length > 0) {
      const el = this[0];
      const box = el.getBoundingClientRect();
      const body = doc.body;
      const clientTop = el.clientTop || body.clientTop || 0;
      const clientLeft = el.clientLeft || body.clientLeft || 0;
      const scrollTop = el === win ? win.scrollY : el.scrollTop;
      const scrollLeft = el === win ? win.scrollX : el.scrollLeft;
      return {
        top: (box.top + scrollTop) - clientTop,
        left: (box.left + scrollLeft) - clientLeft,
      };
    }

    return null;
  }
  function hide() {
    for (let i = 0; i < this.length; i += 1) {
      this[i].style.display = 'none';
    }
    return this;
  }
  function show() {
    for (let i = 0; i < this.length; i += 1) {
      const el = this[i];
      if (el.style.display === 'none') {
        el.style.display = '';
      }
      if (win.getComputedStyle(el, null).getPropertyValue('display') === 'none') {
        // Still not visible
        el.style.display = 'block';
      }
    }
    return this;
  }
  function styles() {
    if (this[0]) return win.getComputedStyle(this[0], null);
    return {};
  }
  function css(props, value) {
    let i;
    if (arguments.length === 1) {
      if (typeof props === 'string') {
        if (this[0]) return win.getComputedStyle(this[0], null).getPropertyValue(props);
      } else {
        for (i = 0; i < this.length; i += 1) {
          // eslint-disable-next-line
          for (let prop in props) {
            this[i].style[prop] = props[prop];
          }
        }
        return this;
      }
    }
    if (arguments.length === 2 && typeof props === 'string') {
      for (i = 0; i < this.length; i += 1) {
        this[i].style[props] = value;
      }
      return this;
    }
    return this;
  }

  // Dom manipulation
  function toArray() {
    const arr = [];
    for (let i = 0; i < this.length; i += 1) {
      arr.push(this[i]);
    }
    return arr;
  }
  // Iterate over the collection passing elements to `callback`
  function each(callback) {
    // Don't bother continuing without a callback
    if (!callback) return this;
    // Iterate over the current collection
    for (let i = 0; i < this.length; i += 1) {
      // If the callback returns false
      if (callback.call(this[i], i, this[i]) === false) {
        // End the loop early
        return this;
      }
    }
    // Return `this` to allow chained DOM operations
    return this;
  }
  function forEach(callback) {
    // Don't bother continuing without a callback
    if (!callback) return this;
    // Iterate over the current collection
    for (let i = 0; i < this.length; i += 1) {
      // If the callback returns false
      if (callback.call(this[i], this[i], i) === false) {
        // End the loop early
        return this;
      }
    }
    // Return `this` to allow chained DOM operations
    return this;
  }
  function filter(callback) {
    const matchedItems = [];
    const dom = this;
    for (let i = 0; i < dom.length; i += 1) {
      if (callback.call(dom[i], i, dom[i])) matchedItems.push(dom[i]);
    }
    return new Dom7(matchedItems);
  }
  function map(callback) {
    const modifiedItems = [];
    const dom = this;
    for (let i = 0; i < dom.length; i += 1) {
      modifiedItems.push(callback.call(dom[i], i, dom[i]));
    }
    return new Dom7(modifiedItems);
  }
  // eslint-disable-next-line
  function html(html) {
    if (typeof html === 'undefined') {
      return this[0] ? this[0].innerHTML : undefined;
    }

    for (let i = 0; i < this.length; i += 1) {
      this[i].innerHTML = html;
    }
    return this;
  }
  // eslint-disable-next-line
  function text(text) {
    if (typeof text === 'undefined') {
      if (this[0]) {
        return this[0].textContent.trim();
      }
      return null;
    }

    for (let i = 0; i < this.length; i += 1) {
      this[i].textContent = text;
    }
    return this;
  }
  function is(selector) {
    const el = this[0];
    let compareWith;
    let i;
    if (!el || typeof selector === 'undefined') return false;
    if (typeof selector === 'string') {
      if (el.matches) return el.matches(selector);
      else if (el.webkitMatchesSelector) return el.webkitMatchesSelector(selector);
      else if (el.msMatchesSelector) return el.msMatchesSelector(selector);

      compareWith = $(selector);
      for (i = 0; i < compareWith.length; i += 1) {
        if (compareWith[i] === el) return true;
      }
      return false;
    } else if (selector === doc) return el === doc;
    else if (selector === win) return el === win;

    if (selector.nodeType || selector instanceof Dom7) {
      compareWith = selector.nodeType ? [selector] : selector;
      for (i = 0; i < compareWith.length; i += 1) {
        if (compareWith[i] === el) return true;
      }
      return false;
    }
    return false;
  }
  function indexOf(el) {
    for (let i = 0; i < this.length; i += 1) {
      if (this[i] === el) return i;
    }
    return -1;
  }
  function index() {
    let child = this[0];
    let i;
    if (child) {
      i = 0;
      // eslint-disable-next-line
      while ((child = child.previousSibling) !== null) {
        if (child.nodeType === 1) i += 1;
      }
      return i;
    }
    return undefined;
  }
  // eslint-disable-next-line
  function eq(index) {
    if (typeof index === 'undefined') return this;
    const length = this.length;
    let returnIndex;
    if (index > length - 1) {
      return new Dom7([]);
    }
    if (index < 0) {
      returnIndex = length + index;
      if (returnIndex < 0) return new Dom7([]);
      return new Dom7([this[returnIndex]]);
    }
    return new Dom7([this[index]]);
  }
  function append(...args) {
    let newChild;

    for (let k = 0; k < args.length; k += 1) {
      newChild = args[k];
      for (let i = 0; i < this.length; i += 1) {
        if (typeof newChild === 'string') {
          const tempDiv = doc.createElement('div');
          tempDiv.innerHTML = newChild;
          while (tempDiv.firstChild) {
            this[i].appendChild(tempDiv.firstChild);
          }
        } else if (newChild instanceof Dom7) {
          for (let j = 0; j < newChild.length; j += 1) {
            this[i].appendChild(newChild[j]);
          }
        } else {
          this[i].appendChild(newChild);
        }
      }
    }

    return this;
  }
  // eslint-disable-next-line
  function appendTo(parent) {
    $(parent).append(this);
    return this;
  }
  function prepend(newChild) {
    let i;
    let j;
    for (i = 0; i < this.length; i += 1) {
      if (typeof newChild === 'string') {
        const tempDiv = doc.createElement('div');
        tempDiv.innerHTML = newChild;
        for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
          this[i].insertBefore(tempDiv.childNodes[j], this[i].childNodes[0]);
        }
      } else if (newChild instanceof Dom7) {
        for (j = 0; j < newChild.length; j += 1) {
          this[i].insertBefore(newChild[j], this[i].childNodes[0]);
        }
      } else {
        this[i].insertBefore(newChild, this[i].childNodes[0]);
      }
    }
    return this;
  }
  // eslint-disable-next-line
  function prependTo(parent) {
    $(parent).prepend(this);
    return this;
  }
  function insertBefore(selector) {
    const before = $(selector);
    for (let i = 0; i < this.length; i += 1) {
      if (before.length === 1) {
        before[0].parentNode.insertBefore(this[i], before[0]);
      } else if (before.length > 1) {
        for (let j = 0; j < before.length; j += 1) {
          before[j].parentNode.insertBefore(this[i].cloneNode(true), before[j]);
        }
      }
    }
  }
  function insertAfter(selector) {
    const after = $(selector);
    for (let i = 0; i < this.length; i += 1) {
      if (after.length === 1) {
        after[0].parentNode.insertBefore(this[i], after[0].nextSibling);
      } else if (after.length > 1) {
        for (let j = 0; j < after.length; j += 1) {
          after[j].parentNode.insertBefore(this[i].cloneNode(true), after[j].nextSibling);
        }
      }
    }
  }
  function next(selector) {
    if (this.length > 0) {
      if (selector) {
        if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) {
          return new Dom7([this[0].nextElementSibling]);
        }
        return new Dom7([]);
      }

      if (this[0].nextElementSibling) return new Dom7([this[0].nextElementSibling]);
      return new Dom7([]);
    }
    return new Dom7([]);
  }
  function nextAll(selector) {
    const nextEls = [];
    let el = this[0];
    if (!el) return new Dom7([]);
    while (el.nextElementSibling) {
      const next = el.nextElementSibling; // eslint-disable-line
      if (selector) {
        if ($(next).is(selector)) nextEls.push(next);
      } else nextEls.push(next);
      el = next;
    }
    return new Dom7(nextEls);
  }
  function prev(selector) {
    if (this.length > 0) {
      const el = this[0];
      if (selector) {
        if (el.previousElementSibling && $(el.previousElementSibling).is(selector)) {
          return new Dom7([el.previousElementSibling]);
        }
        return new Dom7([]);
      }

      if (el.previousElementSibling) return new Dom7([el.previousElementSibling]);
      return new Dom7([]);
    }
    return new Dom7([]);
  }
  function prevAll(selector) {
    const prevEls = [];
    let el = this[0];
    if (!el) return new Dom7([]);
    while (el.previousElementSibling) {
      const prev = el.previousElementSibling; // eslint-disable-line
      if (selector) {
        if ($(prev).is(selector)) prevEls.push(prev);
      } else prevEls.push(prev);
      el = prev;
    }
    return new Dom7(prevEls);
  }
  function siblings(selector) {
    return this.nextAll(selector).add(this.prevAll(selector));
  }
  function parent(selector) {
    const parents = []; // eslint-disable-line
    for (let i = 0; i < this.length; i += 1) {
      if (this[i].parentNode !== null) {
        if (selector) {
          if ($(this[i].parentNode).is(selector)) parents.push(this[i].parentNode);
        } else {
          parents.push(this[i].parentNode);
        }
      }
    }
    return $(unique(parents));
  }
  function parents(selector) {
    const parents = []; // eslint-disable-line
    for (let i = 0; i < this.length; i += 1) {
      let parent = this[i].parentNode; // eslint-disable-line
      while (parent) {
        if (selector) {
          if ($(parent).is(selector)) parents.push(parent);
        } else {
          parents.push(parent);
        }
        parent = parent.parentNode;
      }
    }
    return $(unique(parents));
  }
  function closest(selector) {
    let closest = this; // eslint-disable-line
    if (typeof selector === 'undefined') {
      return new Dom7([]);
    }
    if (!closest.is(selector)) {
      closest = closest.parents(selector).eq(0);
    }
    return closest;
  }
  function find(selector) {
    const foundElements = [];
    for (let i = 0; i < this.length; i += 1) {
      const found = this[i].querySelectorAll(selector);
      for (let j = 0; j < found.length; j += 1) {
        foundElements.push(found[j]);
      }
    }
    return new Dom7(foundElements);
  }
  function children(selector) {
    const children = []; // eslint-disable-line
    for (let i = 0; i < this.length; i += 1) {
      const childNodes = this[i].childNodes;

      for (let j = 0; j < childNodes.length; j += 1) {
        if (!selector) {
          if (childNodes[j].nodeType === 1) children.push(childNodes[j]);
        } else if (childNodes[j].nodeType === 1 && $(childNodes[j]).is(selector)) {
          children.push(childNodes[j]);
        }
      }
    }
    return new Dom7(unique(children));
  }
  function remove() {
    for (let i = 0; i < this.length; i += 1) {
      if (this[i].parentNode) this[i].parentNode.removeChild(this[i]);
    }
    return this;
  }
  function detach() {
    return this.remove();
  }
  function add(...args) {
    const dom = this;
    let i;
    let j;
    for (i = 0; i < args.length; i += 1) {
      const toAdd = $(args[i]);
      for (j = 0; j < toAdd.length; j += 1) {
        dom[dom.length] = toAdd[j];
        dom.length += 1;
      }
    }
    return dom;
  }
  function empty() {
    for (let i = 0; i < this.length; i += 1) {
      const el = this[i];
      if (el.nodeType === 1) {
        for (let j = 0; j < el.childNodes.length; j += 1) {
          if (el.childNodes[j].parentNode) {
            el.childNodes[j].parentNode.removeChild(el.childNodes[j]);
          }
        }
        el.textContent = '';
      }
    }
    return this;
  }

  var Methods = /*#__PURE__*/Object.freeze({
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,
    toggleClass: toggleClass,
    attr: attr,
    removeAttr: removeAttr,
    prop: prop,
    data: data,
    removeData: removeData,
    dataset: dataset,
    val: val,
    transform: transform,
    transition: transition,
    on: on,
    off: off,
    once: once,
    trigger: trigger,
    transitionEnd: transitionEnd,
    animationEnd: animationEnd,
    width: width,
    outerWidth: outerWidth,
    height: height,
    outerHeight: outerHeight,
    offset: offset,
    hide: hide,
    show: show,
    styles: styles,
    css: css,
    toArray: toArray,
    each: each,
    forEach: forEach,
    filter: filter,
    map: map,
    html: html,
    text: text,
    is: is,
    indexOf: indexOf,
    index: index,
    eq: eq,
    append: append,
    appendTo: appendTo,
    prepend: prepend,
    prependTo: prependTo,
    insertBefore: insertBefore,
    insertAfter: insertAfter,
    next: next,
    nextAll: nextAll,
    prev: prev,
    prevAll: prevAll,
    siblings: siblings,
    parent: parent,
    parents: parents,
    closest: closest,
    find: find,
    children: children,
    remove: remove,
    detach: detach,
    add: add,
    empty: empty
  });

  function scrollTo(...args) {
    let [left, top, duration, easing, callback] = args;
    if (args.length === 4 && typeof easing === 'function') {
      callback = easing;
      [left, top, duration, callback, easing] = args;
    }
    if (typeof easing === 'undefined') easing = 'swing';

    return this.each(function animate() {
      const el = this;
      let currentTop;
      let currentLeft;
      let maxTop;
      let maxLeft;
      let newTop;
      let newLeft;
      let scrollTop; // eslint-disable-line
      let scrollLeft; // eslint-disable-line
      let animateTop = top > 0 || top === 0;
      let animateLeft = left > 0 || left === 0;
      if (typeof easing === 'undefined') {
        easing = 'swing';
      }
      if (animateTop) {
        currentTop = el.scrollTop;
        if (!duration) {
          el.scrollTop = top;
        }
      }
      if (animateLeft) {
        currentLeft = el.scrollLeft;
        if (!duration) {
          el.scrollLeft = left;
        }
      }
      if (!duration) return;
      if (animateTop) {
        maxTop = el.scrollHeight - el.offsetHeight;
        newTop = Math.max(Math.min(top, maxTop), 0);
      }
      if (animateLeft) {
        maxLeft = el.scrollWidth - el.offsetWidth;
        newLeft = Math.max(Math.min(left, maxLeft), 0);
      }
      let startTime = null;
      if (animateTop && newTop === currentTop) animateTop = false;
      if (animateLeft && newLeft === currentLeft) animateLeft = false;
      function render(time = new Date().getTime()) {
        if (startTime === null) {
          startTime = time;
        }
        const progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
        const easeProgress = easing === 'linear' ? progress : (0.5 - (Math.cos(progress * Math.PI) / 2));
        let done;
        if (animateTop) scrollTop = currentTop + (easeProgress * (newTop - currentTop));
        if (animateLeft) scrollLeft = currentLeft + (easeProgress * (newLeft - currentLeft));
        if (animateTop && newTop > currentTop && scrollTop >= newTop) {
          el.scrollTop = newTop;
          done = true;
        }
        if (animateTop && newTop < currentTop && scrollTop <= newTop) {
          el.scrollTop = newTop;
          done = true;
        }
        if (animateLeft && newLeft > currentLeft && scrollLeft >= newLeft) {
          el.scrollLeft = newLeft;
          done = true;
        }
        if (animateLeft && newLeft < currentLeft && scrollLeft <= newLeft) {
          el.scrollLeft = newLeft;
          done = true;
        }

        if (done) {
          if (callback) callback();
          return;
        }
        if (animateTop) el.scrollTop = scrollTop;
        if (animateLeft) el.scrollLeft = scrollLeft;
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    });
  }
  // scrollTop(top, duration, easing, callback) {
  function scrollTop(...args) {
    let [top, duration, easing, callback] = args;
    if (args.length === 3 && typeof easing === 'function') {
      [top, duration, callback, easing] = args;
    }
    const dom = this;
    if (typeof top === 'undefined') {
      if (dom.length > 0) return dom[0].scrollTop;
      return null;
    }
    return dom.scrollTo(undefined, top, duration, easing, callback);
  }
  function scrollLeft(...args) {
    let [left, duration, easing, callback] = args;
    if (args.length === 3 && typeof easing === 'function') {
      [left, duration, callback, easing] = args;
    }
    const dom = this;
    if (typeof left === 'undefined') {
      if (dom.length > 0) return dom[0].scrollLeft;
      return null;
    }
    return dom.scrollTo(left, undefined, duration, easing, callback);
  }

  var Scroll = /*#__PURE__*/Object.freeze({
    scrollTo: scrollTo,
    scrollTop: scrollTop,
    scrollLeft: scrollLeft
  });

  function animate(initialProps, initialParams) {
    const els = this;
    const a = {
      props: Object.assign({}, initialProps),
      params: Object.assign({
        duration: 300,
        easing: 'swing', // or 'linear'
        /* Callbacks
        begin(elements)
        complete(elements)
        progress(elements, complete, remaining, start, tweenValue)
        */
      }, initialParams),

      elements: els,
      animating: false,
      que: [],

      easingProgress(easing, progress) {
        if (easing === 'swing') {
          return 0.5 - (Math.cos(progress * Math.PI) / 2);
        }
        if (typeof easing === 'function') {
          return easing(progress);
        }
        return progress;
      },
      stop() {
        if (a.frameId) {
          cancelAnimationFrame(a.frameId);
        }
        a.animating = false;
        a.elements.each((index, el) => {
          const element = el;
          delete element.dom7AnimateInstance;
        });
        a.que = [];
      },
      done(complete) {
        a.animating = false;
        a.elements.each((index, el) => {
          const element = el;
          delete element.dom7AnimateInstance;
        });
        if (complete) complete(els);
        if (a.que.length > 0) {
          const que = a.que.shift();
          a.animate(que[0], que[1]);
        }
      },
      animate(props, params) {
        if (a.animating) {
          a.que.push([props, params]);
          return a;
        }
        const elements = [];

        // Define & Cache Initials & Units
        a.elements.each((index, el) => {
          let initialFullValue;
          let initialValue;
          let unit;
          let finalValue;
          let finalFullValue;

          if (!el.dom7AnimateInstance) a.elements[index].dom7AnimateInstance = a;

          elements[index] = {
            container: el,
          };
          Object.keys(props).forEach((prop) => {
            initialFullValue = win.getComputedStyle(el, null).getPropertyValue(prop).replace(',', '.');
            initialValue = parseFloat(initialFullValue);
            unit = initialFullValue.replace(initialValue, '');
            finalValue = parseFloat(props[prop]);
            finalFullValue = props[prop] + unit;
            elements[index][prop] = {
              initialFullValue,
              initialValue,
              unit,
              finalValue,
              finalFullValue,
              currentValue: initialValue,
            };
          });
        });

        let startTime = null;
        let time;
        let elementsDone = 0;
        let propsDone = 0;
        let done;
        let began = false;

        a.animating = true;

        function render() {
          time = new Date().getTime();
          let progress;
          let easeProgress;
          // let el;
          if (!began) {
            began = true;
            if (params.begin) params.begin(els);
          }
          if (startTime === null) {
            startTime = time;
          }
          if (params.progress) {
            // eslint-disable-next-line
            params.progress(els, Math.max(Math.min((time - startTime) / params.duration, 1), 0), ((startTime + params.duration) - time < 0 ? 0 : (startTime + params.duration) - time), startTime);
          }

          elements.forEach((element) => {
            const el = element;
            if (done || el.done) return;
            Object.keys(props).forEach((prop) => {
              if (done || el.done) return;
              progress = Math.max(Math.min((time - startTime) / params.duration, 1), 0);
              easeProgress = a.easingProgress(params.easing, progress);
              const { initialValue, finalValue, unit } = el[prop];
              el[prop].currentValue = initialValue + (easeProgress * (finalValue - initialValue));
              const currentValue = el[prop].currentValue;

              if (
                (finalValue > initialValue && currentValue >= finalValue) ||
                (finalValue < initialValue && currentValue <= finalValue)) {
                el.container.style[prop] = finalValue + unit;
                propsDone += 1;
                if (propsDone === Object.keys(props).length) {
                  el.done = true;
                  elementsDone += 1;
                }
                if (elementsDone === elements.length) {
                  done = true;
                }
              }
              if (done) {
                a.done(params.complete);
                return;
              }
              el.container.style[prop] = currentValue + unit;
            });
          });
          if (done) return;
          // Then call
          a.frameId = requestAnimationFrame(render);
        }
        a.frameId = requestAnimationFrame(render);
        return a;
      },
    };

    if (a.elements.length === 0) {
      return els;
    }

    let animateInstance;
    for (let i = 0; i < a.elements.length; i += 1) {
      if (a.elements[i].dom7AnimateInstance) {
        animateInstance = a.elements[i].dom7AnimateInstance;
      } else a.elements[i].dom7AnimateInstance = a;
    }
    if (!animateInstance) {
      animateInstance = a;
    }

    if (initialProps === 'stop') {
      animateInstance.stop();
    } else {
      animateInstance.animate(a.props, a.params);
    }

    return els;
  }

  function stop() {
    const els = this;
    for (let i = 0; i < els.length; i += 1) {
      if (els[i].dom7AnimateInstance) {
        els[i].dom7AnimateInstance.stop();
      }
    }
  }

  var Animate = /*#__PURE__*/Object.freeze({
    animate: animate,
    stop: stop
  });

  const noTrigger = ('resize scroll').split(' ');
  function eventShortcut(name, ...args) {
    if (typeof args[0] === 'undefined') {
      for (let i = 0; i < this.length; i += 1) {
        if (noTrigger.indexOf(name) < 0) {
          if (name in this[i]) this[i][name]();
          else {
            $(this[i]).trigger(name);
          }
        }
      }
      return this;
    }
    return this.on(name, ...args);
  }

  function click(...args) {
    return eventShortcut.bind(this)('click', ...args);
  }
  function blur(...args) {
    return eventShortcut.bind(this)('blur', ...args);
  }
  function focus(...args) {
    return eventShortcut.bind(this)('focus', ...args);
  }
  function focusin(...args) {
    return eventShortcut.bind(this)('focusin', ...args);
  }
  function focusout(...args) {
    return eventShortcut.bind(this)('focusout', ...args);
  }
  function keyup(...args) {
    return eventShortcut.bind(this)('keyup', ...args);
  }
  function keydown(...args) {
    return eventShortcut.bind(this)('keydown', ...args);
  }
  function keypress(...args) {
    return eventShortcut.bind(this)('keypress', ...args);
  }
  function submit(...args) {
    return eventShortcut.bind(this)('submit', ...args);
  }
  function change(...args) {
    return eventShortcut.bind(this)('change', ...args);
  }
  function mousedown(...args) {
    return eventShortcut.bind(this)('mousedown', ...args);
  }
  function mousemove(...args) {
    return eventShortcut.bind(this)('mousemove', ...args);
  }
  function mouseup(...args) {
    return eventShortcut.bind(this)('mouseup', ...args);
  }
  function mouseenter(...args) {
    return eventShortcut.bind(this)('mouseenter', ...args);
  }
  function mouseleave(...args) {
    return eventShortcut.bind(this)('mouseleave', ...args);
  }
  function mouseout(...args) {
    return eventShortcut.bind(this)('mouseout', ...args);
  }
  function mouseover(...args) {
    return eventShortcut.bind(this)('mouseover', ...args);
  }
  function touchstart(...args) {
    return eventShortcut.bind(this)('touchstart', ...args);
  }
  function touchend(...args) {
    return eventShortcut.bind(this)('touchend', ...args);
  }
  function touchmove(...args) {
    return eventShortcut.bind(this)('touchmove', ...args);
  }
  function resize(...args) {
    return eventShortcut.bind(this)('resize', ...args);
  }
  function scroll(...args) {
    return eventShortcut.bind(this)('scroll', ...args);
  }

  var eventShortcuts = /*#__PURE__*/Object.freeze({
    click: click,
    blur: blur,
    focus: focus,
    focusin: focusin,
    focusout: focusout,
    keyup: keyup,
    keydown: keydown,
    keypress: keypress,
    submit: submit,
    change: change,
    mousedown: mousedown,
    mousemove: mousemove,
    mouseup: mouseup,
    mouseenter: mouseenter,
    mouseleave: mouseleave,
    mouseout: mouseout,
    mouseover: mouseover,
    touchstart: touchstart,
    touchend: touchend,
    touchmove: touchmove,
    resize: resize,
    scroll: scroll
  });

  [Methods, Scroll, Animate, eventShortcuts].forEach((group) => {
    Object.keys(group).forEach((methodName) => {
      $.fn[methodName] = group[methodName];
    });
  });

  /* eslint no-control-regex: "off" */

  // Remove Diacritics
  const defaultDiacriticsRemovalap = [
    { base: 'A', letters: '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F' },
    { base: 'AA', letters: '\uA732' },
    { base: 'AE', letters: '\u00C6\u01FC\u01E2' },
    { base: 'AO', letters: '\uA734' },
    { base: 'AU', letters: '\uA736' },
    { base: 'AV', letters: '\uA738\uA73A' },
    { base: 'AY', letters: '\uA73C' },
    { base: 'B', letters: '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181' },
    { base: 'C', letters: '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E' },
    { base: 'D', letters: '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779' },
    { base: 'DZ', letters: '\u01F1\u01C4' },
    { base: 'Dz', letters: '\u01F2\u01C5' },
    { base: 'E', letters: '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E' },
    { base: 'F', letters: '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B' },
    { base: 'G', letters: '\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E' },
    { base: 'H', letters: '\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D' },
    { base: 'I', letters: '\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197' },
    { base: 'J', letters: '\u004A\u24BF\uFF2A\u0134\u0248' },
    { base: 'K', letters: '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2' },
    { base: 'L', letters: '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780' },
    { base: 'LJ', letters: '\u01C7' },
    { base: 'Lj', letters: '\u01C8' },
    { base: 'M', letters: '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C' },
    { base: 'N', letters: '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4' },
    { base: 'NJ', letters: '\u01CA' },
    { base: 'Nj', letters: '\u01CB' },
    { base: 'O', letters: '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C' },
    { base: 'OI', letters: '\u01A2' },
    { base: 'OO', letters: '\uA74E' },
    { base: 'OU', letters: '\u0222' },
    { base: 'OE', letters: '\u008C\u0152' },
    { base: 'oe', letters: '\u009C\u0153' },
    { base: 'P', letters: '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754' },
    { base: 'Q', letters: '\u0051\u24C6\uFF31\uA756\uA758\u024A' },
    { base: 'R', letters: '\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782' },
    { base: 'S', letters: '\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784' },
    { base: 'T', letters: '\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786' },
    { base: 'TZ', letters: '\uA728' },
    { base: 'U', letters: '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244' },
    { base: 'V', letters: '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245' },
    { base: 'VY', letters: '\uA760' },
    { base: 'W', letters: '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72' },
    { base: 'X', letters: '\u0058\u24CD\uFF38\u1E8A\u1E8C' },
    { base: 'Y', letters: '\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE' },
    { base: 'Z', letters: '\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762' },
    { base: 'a', letters: '\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250' },
    { base: 'aa', letters: '\uA733' },
    { base: 'ae', letters: '\u00E6\u01FD\u01E3' },
    { base: 'ao', letters: '\uA735' },
    { base: 'au', letters: '\uA737' },
    { base: 'av', letters: '\uA739\uA73B' },
    { base: 'ay', letters: '\uA73D' },
    { base: 'b', letters: '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253' },
    { base: 'c', letters: '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184' },
    { base: 'd', letters: '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A' },
    { base: 'dz', letters: '\u01F3\u01C6' },
    { base: 'e', letters: '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD' },
    { base: 'f', letters: '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C' },
    { base: 'g', letters: '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F' },
    { base: 'h', letters: '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265' },
    { base: 'hv', letters: '\u0195' },
    { base: 'i', letters: '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131' },
    { base: 'j', letters: '\u006A\u24D9\uFF4A\u0135\u01F0\u0249' },
    { base: 'k', letters: '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3' },
    { base: 'l', letters: '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747' },
    { base: 'lj', letters: '\u01C9' },
    { base: 'm', letters: '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F' },
    { base: 'n', letters: '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5' },
    { base: 'nj', letters: '\u01CC' },
    { base: 'o', letters: '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275' },
    { base: 'oi', letters: '\u01A3' },
    { base: 'ou', letters: '\u0223' },
    { base: 'oo', letters: '\uA74F' },
    { base: 'p', letters: '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755' },
    { base: 'q', letters: '\u0071\u24E0\uFF51\u024B\uA757\uA759' },
    { base: 'r', letters: '\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783' },
    { base: 's', letters: '\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B' },
    { base: 't', letters: '\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787' },
    { base: 'tz', letters: '\uA729' },
    { base: 'u', letters: '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289' },
    { base: 'v', letters: '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C' },
    { base: 'vy', letters: '\uA761' },
    { base: 'w', letters: '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73' },
    { base: 'x', letters: '\u0078\u24E7\uFF58\u1E8B\u1E8D' },
    { base: 'y', letters: '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF' },
    { base: 'z', letters: '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763' },
  ];

  const diacriticsMap = {};
  for (let i = 0; i < defaultDiacriticsRemovalap.length; i += 1) {
    const letters = defaultDiacriticsRemovalap[i].letters;
    for (let j = 0; j < letters.length; j += 1) {
      diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
    }
  }

  let uniqueNumber = 1;

  const Utils = {
    uniqueNumber() {
      uniqueNumber += 1;
      return uniqueNumber;
    },
    id(mask = 'xxxxxxxxxx', map = '0123456789abcdef') {
      const length = map.length;
      return mask.replace(/x/g, () => map[Math.floor((Math.random() * length))]);
    },
    mdPreloaderContent: `
    <span class="preloader-inner">
      <span class="preloader-inner-gap"></span>
      <span class="preloader-inner-left">
          <span class="preloader-inner-half-circle"></span>
      </span>
      <span class="preloader-inner-right">
          <span class="preloader-inner-half-circle"></span>
      </span>
    </span>
  `.trim(),
    iosPreloaderContent: `
    <span class="preloader-inner">
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(() => '<span class="preloader-inner-line"></span>').join('')}
    </span>
  `.trim(),
    auroraPreloaderContent: `
    <span class="preloader-inner">
      <span class="preloader-inner-circle"></span>
    </span>
  `,
    eventNameToColonCase(eventName) {
      let hasColon;
      return eventName.split('').map((char, index) => {
        if (char.match(/[A-Z]/) && index !== 0 && !hasColon) {
          hasColon = true;
          return `:${char.toLowerCase()}`;
        }
        return char.toLowerCase();
      }).join('');
    },
    deleteProps(obj) {
      const object = obj;
      Object.keys(object).forEach((key) => {
        try {
          object[key] = null;
        } catch (e) {
          // no setter for object
        }
        try {
          delete object[key];
        } catch (e) {
          // something got wrong
        }
      });
    },
    nextTick(callback, delay = 0) {
      return setTimeout(callback, delay);
    },
    nextFrame(callback) {
      return Utils.requestAnimationFrame(() => {
        Utils.requestAnimationFrame(callback);
      });
    },
    now() {
      return Date.now();
    },
    requestAnimationFrame(callback) {
      return win.requestAnimationFrame(callback);
    },
    cancelAnimationFrame(id) {
      return win.cancelAnimationFrame(id);
    },
    removeDiacritics(str) {
      return str.replace(/[^\u0000-\u007E]/g, a => diacriticsMap[a] || a);
    },
    parseUrlQuery(url) {
      const query = {};
      let urlToParse = url || win.location.href;
      let i;
      let params;
      let param;
      let length;
      if (typeof urlToParse === 'string' && urlToParse.length) {
        urlToParse = urlToParse.indexOf('?') > -1 ? urlToParse.replace(/\S*\?/, '') : '';
        params = urlToParse.split('&').filter(paramsPart => paramsPart !== '');
        length = params.length;

        for (i = 0; i < length; i += 1) {
          param = params[i].replace(/#\S+/g, '').split('=');
          query[decodeURIComponent(param[0])] = typeof param[1] === 'undefined' ? undefined : decodeURIComponent(param.slice(1).join('=')) || '';
        }
      }
      return query;
    },
    getTranslate(el, axis = 'x') {
      let matrix;
      let curTransform;
      let transformMatrix;

      const curStyle = win.getComputedStyle(el, null);

      if (win.WebKitCSSMatrix) {
        curTransform = curStyle.transform || curStyle.webkitTransform;
        if (curTransform.split(',').length > 6) {
          curTransform = curTransform.split(', ').map(a => a.replace(',', '.')).join(', ');
        }
        // Some old versions of Webkit choke when 'none' is passed; pass
        // empty string instead in this case
        transformMatrix = new win.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
      } else {
        transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
        matrix = transformMatrix.toString().split(',');
      }

      if (axis === 'x') {
        // Latest Chrome and webkits Fix
        if (win.WebKitCSSMatrix) curTransform = transformMatrix.m41;
        // Crazy IE10 Matrix
        else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
        // Normal Browsers
        else curTransform = parseFloat(matrix[4]);
      }
      if (axis === 'y') {
        // Latest Chrome and webkits Fix
        if (win.WebKitCSSMatrix) curTransform = transformMatrix.m42;
        // Crazy IE10 Matrix
        else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
        // Normal Browsers
        else curTransform = parseFloat(matrix[5]);
      }
      return curTransform || 0;
    },
    serializeObject(obj, parents = []) {
      if (typeof obj === 'string') return obj;
      const resultArray = [];
      const separator = '&';
      let newParents;
      function varName(name) {
        if (parents.length > 0) {
          let parentParts = '';
          for (let j = 0; j < parents.length; j += 1) {
            if (j === 0) parentParts += parents[j];
            else parentParts += `[${encodeURIComponent(parents[j])}]`;
          }
          return `${parentParts}[${encodeURIComponent(name)}]`;
        }
        return encodeURIComponent(name);
      }
      function varValue(value) {
        return encodeURIComponent(value);
      }
      Object.keys(obj).forEach((prop) => {
        let toPush;
        if (Array.isArray(obj[prop])) {
          toPush = [];
          for (let i = 0; i < obj[prop].length; i += 1) {
            if (!Array.isArray(obj[prop][i]) && typeof obj[prop][i] === 'object') {
              newParents = parents.slice();
              newParents.push(prop);
              newParents.push(String(i));
              toPush.push(Utils.serializeObject(obj[prop][i], newParents));
            } else {
              toPush.push(`${varName(prop)}[]=${varValue(obj[prop][i])}`);
            }
          }
          if (toPush.length > 0) resultArray.push(toPush.join(separator));
        } else if (obj[prop] === null || obj[prop] === '') {
          resultArray.push(`${varName(prop)}=`);
        } else if (typeof obj[prop] === 'object') {
          // Object, convert to named array
          newParents = parents.slice();
          newParents.push(prop);
          toPush = Utils.serializeObject(obj[prop], newParents);
          if (toPush !== '') resultArray.push(toPush);
        } else if (typeof obj[prop] !== 'undefined' && obj[prop] !== '') {
          // Should be string or plain value
          resultArray.push(`${varName(prop)}=${varValue(obj[prop])}`);
        } else if (obj[prop] === '') resultArray.push(varName(prop));
      });
      return resultArray.join(separator);
    },
    isObject(o) {
      return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
    },
    merge(...args) {
      const to = args[0];
      args.splice(0, 1);
      const from = args;

      for (let i = 0; i < from.length; i += 1) {
        const nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          const keysArray = Object.keys(Object(nextSource));
          for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            const nextKey = keysArray[nextIndex];
            const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    extend(...args) {
      let deep = true;
      let to;
      let from;
      if (typeof args[0] === 'boolean') {
        deep = args[0];
        to = args[1];
        args.splice(0, 2);
        from = args;
      } else {
        to = args[0];
        args.splice(0, 1);
        from = args;
      }
      for (let i = 0; i < from.length; i += 1) {
        const nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          const keysArray = Object.keys(Object(nextSource));
          for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            const nextKey = keysArray[nextIndex];
            const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              if (!deep) {
                to[nextKey] = nextSource[nextKey];
              } else if (Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                Utils.extend(to[nextKey], nextSource[nextKey]);
              } else if (!Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                to[nextKey] = {};
                Utils.extend(to[nextKey], nextSource[nextKey]);
              } else {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
      }
      return to;
    },
    colorHexToRgb(hex) {
      const h = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
      return result
        ? result.slice(1).map(n => parseInt(n, 16))
        : null;
    },
    colorRgbToHex(r, g, b) {
      const result = [r, g, b].map((n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      }).join('');
      return `#${result}`;
    },
    colorRgbToHsl(r, g, b) {
      r /= 255; // eslint-disable-line
      g /= 255; // eslint-disable-line
      b /= 255; // eslint-disable-line
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      let h;
      if (d === 0) h = 0;
      else if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else if (max === b) h = (r - g) / d + 4;
      const l = (min + max) / 2;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      if (h < 0) h = 360 / 60 + h;
      return [h * 60, s, l];
    },
    colorHslToRgb(h, s, l) {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hp = h / 60;
      const x = c * (1 - Math.abs((hp % 2) - 1));
      let rgb1;
      if (Number.isNaN(h) || typeof h === 'undefined') {
        rgb1 = [0, 0, 0];
      } else if (hp <= 1) rgb1 = [c, x, 0];
      else if (hp <= 2) rgb1 = [x, c, 0];
      else if (hp <= 3) rgb1 = [0, c, x];
      else if (hp <= 4) rgb1 = [0, x, c];
      else if (hp <= 5) rgb1 = [x, 0, c];
      else if (hp <= 6) rgb1 = [c, 0, x];
      const m = l - (c / 2);
      return rgb1.map(n => Math.max(0, Math.min(255, Math.round(255 * (n + m)))));
    },
    colorHsbToHsl(h, s, b) {
      const HSL = {
        h,
        s: 0,
        l: 0,
      };
      const HSB = { h, s, b };

      HSL.l = (2 - HSB.s) * HSB.b / 2;
      HSL.s = HSL.l && HSL.l < 1 ? HSB.s * HSB.b / (HSL.l < 0.5 ? HSL.l * 2 : 2 - HSL.l * 2) : HSL.s;

      return [HSL.h, HSL.s, HSL.l];
    },
    colorHslToHsb(h, s, l) {
      const HSB = {
        h,
        s: 0,
        b: 0,
      };
      const HSL = { h, s, l };

      const t = HSL.s * (HSL.l < 0.5 ? HSL.l : 1 - HSL.l);
      HSB.b = HSL.l + t;
      HSB.s = HSL.l > 0 ? 2 * t / HSB.b : HSB.s;

      return [HSB.h, HSB.s, HSB.b];
    },
    colorThemeCSSProperties(...args) {
      let hex;
      let rgb;
      if (args.length === 1) {
        hex = args[0];
        rgb = Utils.colorHexToRgb(hex);
      } else if (args.length === 3) {
        rgb = args;
        hex = Utils.colorRgbToHex(...rgb);
      }
      if (!rgb) return {};
      const hsl = Utils.colorRgbToHsl(...rgb);
      const hslShade = [hsl[0], hsl[1], Math.max(0, (hsl[2] - 0.08))];
      const hslTint = [hsl[0], hsl[1], Math.max(0, (hsl[2] + 0.08))];
      const shade = Utils.colorRgbToHex(...Utils.colorHslToRgb(...hslShade));
      const tint = Utils.colorRgbToHex(...Utils.colorHslToRgb(...hslTint));
      return {
        '--f7-theme-color': hex,
        '--f7-theme-color-rgb': rgb.join(', '),
        '--f7-theme-color-shade': shade,
        '--f7-theme-color-tint': tint,
      };
    },
  };

  const Support = (function Support() {
    return {
      touch: !!(('ontouchstart' in win) || (win.DocumentTouch && doc instanceof win.DocumentTouch)),

      pointerEvents: !!win.PointerEvent && ('maxTouchPoints' in win.navigator) && win.navigator.maxTouchPoints >= 0,

      observer: (function checkObserver() {
        return ('MutationObserver' in win || 'WebkitMutationObserver' in win);
      }()),

      passiveListener: (function checkPassiveListener() {
        let supportsPassive = false;
        try {
          const opts = Object.defineProperty({}, 'passive', {
            // eslint-disable-next-line
            get() {
              supportsPassive = true;
            },
          });
          win.addEventListener('testPassiveListener', null, opts);
        } catch (e) {
          // No support
        }
        return supportsPassive;
      }()),

      gestures: (function checkGestures() {
        return 'ongesturestart' in win;
      }()),

      intersectionObserver: (function checkObserver() {
        return ('IntersectionObserver' in win);
      }()),
    };
  }());

  const Device = (function Device() {
    const platform = win.navigator.platform;
    const ua = win.navigator.userAgent;

    const device = {
      ios: false,
      android: false,
      androidChrome: false,
      desktop: false,
      iphone: false,
      ipod: false,
      ipad: false,
      edge: false,
      ie: false,
      firefox: false,
      macos: false,
      windows: false,
      cordova: !!(win.cordova || win.phonegap),
      phonegap: !!(win.cordova || win.phonegap),
      electron: false,
      nwjs: false,
    };

    const screenWidth = win.screen.width;
    const screenHeight = win.screen.height;

    const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
    let ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
    const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
    const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
    const ie = ua.indexOf('MSIE ') >= 0 || ua.indexOf('Trident/') >= 0;
    const edge = ua.indexOf('Edge/') >= 0;
    const firefox = ua.indexOf('Gecko/') >= 0 && ua.indexOf('Firefox/') >= 0;
    const windows = platform === 'Win32';
    const electron = ua.toLowerCase().indexOf('electron') >= 0;
    const nwjs = typeof nw !== 'undefined' && typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.nw !== 'undefined';
    let macos = platform === 'MacIntel';

    // iPadOs 13 fix
    const iPadScreens = [
      '1024x1366',
      '1366x1024',
      '834x1194',
      '1194x834',
      '834x1112',
      '1112x834',
      '768x1024',
      '1024x768',
    ];
    if (!ipad
      && macos
      && Support.touch
      && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0
    ) {
      ipad = ua.match(/(Version)\/([\d.]+)/);
      if (!ipad) ipad = [0, 1, '13_0_0'];
      macos = false;
    }

    device.ie = ie;
    device.edge = edge;
    device.firefox = firefox;

    // Android
    if (android && !windows) {
      device.os = 'android';
      device.osVersion = android[2];
      device.android = true;
      device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
    }
    if (ipad || iphone || ipod) {
      device.os = 'ios';
      device.ios = true;
    }
    // iOS
    if (iphone && !ipod) {
      device.osVersion = iphone[2].replace(/_/g, '.');
      device.iphone = true;
    }
    if (ipad) {
      device.osVersion = ipad[2].replace(/_/g, '.');
      device.ipad = true;
    }
    if (ipod) {
      device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
      device.ipod = true;
    }
    // iOS 8+ changed UA
    if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
      if (device.osVersion.split('.')[0] === '10') {
        device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
      }
    }

    // Webview
    device.webView = !!((iphone || ipad || ipod) && (ua.match(/.*AppleWebKit(?!.*Safari)/i) || win.navigator.standalone))
      || (win.matchMedia && win.matchMedia('(display-mode: standalone)').matches);
    device.webview = device.webView;
    device.standalone = device.webView;

    // Desktop
    device.desktop = !(device.ios || device.android) || electron || nwjs;
    if (device.desktop) {
      device.electron = electron;
      device.nwjs = nwjs;
      device.macos = macos;
      device.windows = windows;
      if (device.macos) {
        device.os = 'macos';
      }
      if (device.windows) {
        device.os = 'windows';
      }
    }

    // Pixel Ratio
    device.pixelRatio = win.devicePixelRatio || 1;

    // Color Scheme
    const DARK = '(prefers-color-scheme: dark)';
    const LIGHT = '(prefers-color-scheme: light)';
    device.prefersColorScheme = function prefersColorTheme() {
      let theme;
      if (win.matchMedia && win.matchMedia(LIGHT).matches) {
        theme = 'light';
      }
      if (win.matchMedia && win.matchMedia(DARK).matches) {
        theme = 'dark';
      }
      return theme;
    };

    // Export object
    return device;
  }());

  class EventsClass {
    constructor(parents = []) {
      const self = this;
      self.eventsParents = parents;
      self.eventsListeners = {};
    }

    on(events, handler, priority) {
      const self = this;
      if (typeof handler !== 'function') return self;
      const method = priority ? 'unshift' : 'push';
      events.split(' ').forEach((event) => {
        if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
        self.eventsListeners[event][method](handler);
      });
      return self;
    }

    once(events, handler, priority) {
      const self = this;
      if (typeof handler !== 'function') return self;
      function onceHandler(...args) {
        self.off(events, onceHandler);
        if (onceHandler.f7proxy) {
          delete onceHandler.f7proxy;
        }
        handler.apply(self, args);
      }
      onceHandler.f7proxy = handler;
      return self.on(events, onceHandler, priority);
    }

    off(events, handler) {
      const self = this;
      if (!self.eventsListeners) return self;
      events.split(' ').forEach((event) => {
        if (typeof handler === 'undefined') {
          self.eventsListeners[event] = [];
        } else if (self.eventsListeners[event]) {
          self.eventsListeners[event].forEach((eventHandler, index) => {
            if (eventHandler === handler || (eventHandler.f7proxy && eventHandler.f7proxy === handler)) {
              self.eventsListeners[event].splice(index, 1);
            }
          });
        }
      });
      return self;
    }

    emit(...args) {
      const self = this;
      if (!self.eventsListeners) return self;
      let events;
      let data;
      let context;
      let eventsParents;
      if (typeof args[0] === 'string' || Array.isArray(args[0])) {
        events = args[0];
        data = args.slice(1, args.length);
        context = self;
        eventsParents = self.eventsParents;
      } else {
        events = args[0].events;
        data = args[0].data;
        context = args[0].context || self;
        eventsParents = args[0].local ? [] : args[0].parents || self.eventsParents;
      }
      const eventsArray = Array.isArray(events) ? events : events.split(' ');
      const localEvents = eventsArray.map(eventName => eventName.replace('local::', ''));
      const parentEvents = eventsArray.filter(eventName => eventName.indexOf('local::') < 0);

      localEvents.forEach((event) => {
        if (self.eventsListeners && self.eventsListeners[event]) {
          const handlers = [];
          self.eventsListeners[event].forEach((eventHandler) => {
            handlers.push(eventHandler);
          });
          handlers.forEach((eventHandler) => {
            eventHandler.apply(context, data);
          });
        }
      });
      if (eventsParents && eventsParents.length > 0) {
        eventsParents.forEach((eventsParent) => {
          eventsParent.emit(parentEvents, ...data);
        });
      }
      return self;
    }
  }

  class Framework7Class extends EventsClass {
    constructor(params = {}, parents = []) {
      super(parents);
      const self = this;
      self.params = params;

      if (self.params && self.params.on) {
        Object.keys(self.params.on).forEach((eventName) => {
          self.on(eventName, self.params.on[eventName]);
        });
      }
    }

    // eslint-disable-next-line
    useModuleParams(module, instanceParams) {
      if (module.params) {
        const originalParams = {};
        Object.keys(module.params).forEach((paramKey) => {
          if (typeof instanceParams[paramKey] === 'undefined') return;
          originalParams[paramKey] = Utils.extend({}, instanceParams[paramKey]);
        });
        Utils.extend(instanceParams, module.params);
        Object.keys(originalParams).forEach((paramKey) => {
          Utils.extend(instanceParams[paramKey], originalParams[paramKey]);
        });
      }
    }

    useModulesParams(instanceParams) {
      const instance = this;
      if (!instance.modules) return;
      Object.keys(instance.modules).forEach((moduleName) => {
        const module = instance.modules[moduleName];
        // Extend params
        if (module.params) {
          Utils.extend(instanceParams, module.params);
        }
      });
    }

    useModule(moduleName = '', moduleParams = {}) {
      const instance = this;
      if (!instance.modules) return;
      const module = typeof moduleName === 'string' ? instance.modules[moduleName] : moduleName;
      if (!module) return;

      // Extend instance methods and props
      if (module.instance) {
        Object.keys(module.instance).forEach((modulePropName) => {
          const moduleProp = module.instance[modulePropName];
          if (typeof moduleProp === 'function') {
            instance[modulePropName] = moduleProp.bind(instance);
          } else {
            instance[modulePropName] = moduleProp;
          }
        });
      }
      // Add event listeners
      if (module.on && instance.on) {
        Object.keys(module.on).forEach((moduleEventName) => {
          instance.on(moduleEventName, module.on[moduleEventName]);
        });
      }
      // Add vnode hooks
      if (module.vnode) {
        if (!instance.vnodeHooks) instance.vnodeHooks = {};
        Object.keys(module.vnode).forEach((vnodeId) => {
          Object.keys(module.vnode[vnodeId]).forEach((hookName) => {
            const handler = module.vnode[vnodeId][hookName];
            if (!instance.vnodeHooks[hookName]) instance.vnodeHooks[hookName] = {};
            if (!instance.vnodeHooks[hookName][vnodeId]) instance.vnodeHooks[hookName][vnodeId] = [];
            instance.vnodeHooks[hookName][vnodeId].push(handler.bind(instance));
          });
        });
      }
      // Module create callback
      if (module.create) {
        module.create.bind(instance)(moduleParams);
      }
    }

    useModules(modulesParams = {}) {
      const instance = this;
      if (!instance.modules) return;
      Object.keys(instance.modules).forEach((moduleName) => {
        const moduleParams = modulesParams[moduleName] || {};
        instance.useModule(moduleName, moduleParams);
      });
    }

    static set components(components) {
      const Class = this;
      if (!Class.use) return;
      Class.use(components);
    }

    static installModule(module, ...params) {
      const Class = this;
      if (!Class.prototype.modules) Class.prototype.modules = {};
      const name = module.name || (`${Object.keys(Class.prototype.modules).length}_${Utils.now()}`);
      Class.prototype.modules[name] = module;
      // Prototype
      if (module.proto) {
        Object.keys(module.proto).forEach((key) => {
          Class.prototype[key] = module.proto[key];
        });
      }
      // Class
      if (module.static) {
        Object.keys(module.static).forEach((key) => {
          Class[key] = module.static[key];
        });
      }
      // Callback
      if (module.install) {
        module.install.apply(Class, params);
      }
      return Class;
    }

    static use(module, ...params) {
      const Class = this;
      if (Array.isArray(module)) {
        module.forEach(m => Class.installModule(m));
        return Class;
      }
      return Class.installModule(module, ...params);
    }
  }

  function ConstructorMethods (parameters = {}) {
    const {
      defaultSelector,
      constructor: Constructor,
      domProp,
      app,
      addMethods,
    } = parameters;
    const methods = {
      create(...args) {
        if (app) return new Constructor(app, ...args);
        return new Constructor(...args);
      },
      get(el = defaultSelector) {
        if (el instanceof Constructor) return el;
        const $el = $(el);
        if ($el.length === 0) return undefined;
        return $el[0][domProp];
      },
      destroy(el) {
        const instance = methods.get(el);
        if (instance && instance.destroy) return instance.destroy();
        return undefined;
      },
    };
    if (addMethods && Array.isArray(addMethods)) {
      addMethods.forEach((methodName) => {
        methods[methodName] = (el = defaultSelector, ...args) => {
          const instance = methods.get(el);
          if (instance && instance[methodName]) return instance[methodName](...args);
          return undefined;
        };
      });
    }
    return methods;
  }

  function ModalMethods (parameters = {}) {
    const { defaultSelector, constructor: Constructor, app } = parameters;
    const methods = Utils.extend(
      ConstructorMethods({
        defaultSelector,
        constructor: Constructor,
        app,
        domProp: 'f7Modal',
      }),
      {
        open(el, animate, targetEl) {
          let $el = $(el);
          if ($el.length > 1 && targetEl) {
            // check if same modal in other page
            const $targetPage = $(targetEl).parents('.page');
            if ($targetPage.length) {
              $el.each((index, modalEl) => {
                const $modalEl = $(modalEl);
                if ($modalEl.parents($targetPage)[0] === $targetPage[0]) {
                  $el = $modalEl;
                }
              });
            }
          }
          if ($el.length > 1) {
            $el = $el.eq($el.length - 1);
          }
          if (!$el.length) return undefined;
          let instance = $el[0].f7Modal;
          if (!instance) {
            const params = $el.dataset();
            instance = new Constructor(app, { el: $el, ...params });
          }
          return instance.open(animate);
        },
        close(el = defaultSelector, animate, targetEl) {
          let $el = $(el);
          if (!$el.length) return undefined;
          if ($el.length > 1) {
            // check if close link (targetEl) in this modal
            let $parentEl;
            if (targetEl) {
              const $targetEl = $(targetEl);
              if ($targetEl.length) {
                $parentEl = $targetEl.parents($el);
              }
            }
            if ($parentEl && $parentEl.length > 0) {
              $el = $parentEl;
            } else {
              $el = $el.eq($el.length - 1);
            }
          }
          let instance = $el[0].f7Modal;
          if (!instance) {
            const params = $el.dataset();
            instance = new Constructor(app, { el: $el, ...params });
          }
          return instance.close(animate);
        },
      }
    );
    return methods;
  }

  const fetchedModules = [];
  function loadModule(moduleToLoad) {
    const Framework7 = this;
    return new Promise((resolve, reject) => {
      const app = Framework7.instance;
      let modulePath;
      let moduleObj;
      let moduleFunc;
      if (!moduleToLoad) {
        reject(new Error('Framework7: Lazy module must be specified'));
        return;
      }

      function install(module) {
        Framework7.use(module);

        if (app) {
          app.useModuleParams(module, app.params);
          app.useModule(module);
        }
      }

      if (typeof moduleToLoad === 'string') {
        const matchNamePattern = moduleToLoad.match(/([a-z0-9-]*)/i);
        if (moduleToLoad.indexOf('.') < 0 && matchNamePattern && matchNamePattern[0].length === moduleToLoad.length) {
          if (!app || (app && !app.params.lazyModulesPath)) {
            reject(new Error('Framework7: "lazyModulesPath" app parameter must be specified to fetch module by name'));
            return;
          }
          modulePath = `${app.params.lazyModulesPath}/${moduleToLoad}.js`;
        } else {
          modulePath = moduleToLoad;
        }
      } else if (typeof moduleToLoad === 'function') {
        moduleFunc = moduleToLoad;
      } else {
        // considering F7-Plugin object
        moduleObj = moduleToLoad;
      }

      if (moduleFunc) {
        const module = moduleFunc(Framework7, false);
        if (!module) {
          reject(new Error('Framework7: Can\'t find Framework7 component in specified component function'));
          return;
        }
        // Check if it was added
        if (Framework7.prototype.modules && Framework7.prototype.modules[module.name]) {
          resolve();
          return;
        }
        // Install It
        install(module);

        resolve();
      }
      if (moduleObj) {
        const module = moduleObj;
        if (!module) {
          reject(new Error('Framework7: Can\'t find Framework7 component in specified component'));
          return;
        }
        // Check if it was added
        if (Framework7.prototype.modules && Framework7.prototype.modules[module.name]) {
          resolve();
          return;
        }
        // Install It
        install(module);

        resolve();
      }
      if (modulePath) {
        if (fetchedModules.indexOf(modulePath) >= 0) {
          resolve();
          return;
        }
        fetchedModules.push(modulePath);
        const scriptLoad = new Promise((resolveScript, rejectScript) => {
          Framework7.request.get(
            modulePath,
            (scriptContent) => {
              const id = Utils.id();
              const callbackLoadName = `f7_component_loader_callback_${id}`;

              const scriptEl = doc.createElement('script');
              scriptEl.innerHTML = `window.${callbackLoadName} = function (Framework7, Framework7AutoInstallComponent) {return ${scriptContent.trim()}}`;
              $('head').append(scriptEl);

              const componentLoader = win[callbackLoadName];
              delete win[callbackLoadName];
              $(scriptEl).remove();

              const module = componentLoader(Framework7, false);

              if (!module) {
                rejectScript(new Error(`Framework7: Can't find Framework7 component in ${modulePath} file`));
                return;
              }

              // Check if it was added
              if (Framework7.prototype.modules && Framework7.prototype.modules[module.name]) {
                resolveScript();
                return;
              }

              // Install It
              install(module);

              resolveScript();
            },
            (xhr, status) => {
              rejectScript(xhr, status);
            }
          );
        });
        const styleLoad = new Promise((resolveStyle) => {
          Framework7.request.get(
            modulePath.replace('.js', app.rtl ? '.rtl.css' : '.css'),
            (styleContent) => {
              const styleEl = doc.createElement('style');
              styleEl.innerHTML = styleContent;
              $('head').append(styleEl);

              resolveStyle();
            },
            () => {
              resolveStyle();
            }
          );
        });

        Promise.all([scriptLoad, styleLoad]).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      }
    });
  }

  class Framework7 extends Framework7Class {
    constructor(params) {
      super(params);
      if (Framework7.instance) {
        throw new Error('Framework7 is already initialized and can\'t be initialized more than once');
      }

      const passedParams = Utils.extend({}, params);

      // App Instance
      const app = this;

      Framework7.instance = app;

      // Default
      const defaults = {
        version: '1.0.0',
        id: 'io.framework7.testapp',
        root: 'body',
        theme: 'auto',
        language: win.navigator.language,
        routes: [],
        name: 'Framework7',
        lazyModulesPath: null,
        initOnDeviceReady: true,
        init: true,
        autoDarkTheme: false,
        iosTranslucentBars: true,
        iosTranslucentModals: true,
        component: undefined,
        componentUrl: undefined,
      };

      // Extend defaults with modules params
      app.useModulesParams(defaults);

      // Extend defaults with passed params
      app.params = Utils.extend(defaults, params);

      const $rootEl = $(app.params.root);

      Utils.extend(app, {
        // App Id
        id: app.params.id,
        // App Name
        name: app.params.name,
        // App version
        version: app.params.version,
        // Routes
        routes: app.params.routes,
        // Lang
        language: app.params.language,
        // Root
        root: $rootEl,
        // RTL
        rtl: $rootEl.css('direction') === 'rtl',
        // Theme
        theme: (function getTheme() {
          if (app.params.theme === 'auto') {
            if (Device.ios) return 'ios';
            if (Device.desktop && Device.electron) return 'aurora';
            return 'md';
          }
          return app.params.theme;
        }()),
        // Initially passed parameters
        passedParams,
        online: win.navigator.onLine,
      });

      // Save Root
      if (app.root && app.root[0]) {
        app.root[0].f7 = app;
      }

      // Install Modules
      app.useModules();

      // Init Data & Methods
      app.initData();

      // Auto Dark Theme
      const DARK = '(prefers-color-scheme: dark)';
      const LIGHT = '(prefers-color-scheme: light)';
      app.mq = {};
      if (win.matchMedia) {
        app.mq.dark = win.matchMedia(DARK);
        app.mq.light = win.matchMedia(LIGHT);
      }
      app.colorSchemeListener = function colorSchemeListener({ matches, media }) {
        if (!matches) {
          return;
        }
        const html = doc.querySelector('html');
        if (media === DARK) {
          html.classList.add('theme-dark');
          app.darkTheme = true;
          app.emit('darkThemeChange', true);
        } else if (media === LIGHT) {
          html.classList.remove('theme-dark');
          app.darkTheme = false;
          app.emit('darkThemeChange', false);
        }
      };

      // Init
      if (app.params.init) {
        if (Device.cordova && app.params.initOnDeviceReady) {
          $(doc).on('deviceready', () => {
            app.init();
          });
        } else {
          app.init();
        }
      }

      // Return app instance
      return app;
    }

    initData() {
      const app = this;

      // Data
      app.data = {};
      if (app.params.data && typeof app.params.data === 'function') {
        Utils.extend(app.data, app.params.data.bind(app)());
      } else if (app.params.data) {
        Utils.extend(app.data, app.params.data);
      }
      // Methods
      app.methods = {};
      if (app.params.methods) {
        Object.keys(app.params.methods).forEach((methodName) => {
          if (typeof app.params.methods[methodName] === 'function') {
            app.methods[methodName] = app.params.methods[methodName].bind(app);
          } else {
            app.methods[methodName] = app.params.methods[methodName];
          }
        });
      }
    }

    enableAutoDarkTheme() {
      if (!win.matchMedia) return;
      const app = this;
      const html = doc.querySelector('html');
      if (app.mq.dark && app.mq.light) {
        app.mq.dark.addListener(app.colorSchemeListener);
        app.mq.light.addListener(app.colorSchemeListener);
      }
      if (app.mq.dark && app.mq.dark.matches) {
        html.classList.add('theme-dark');
        app.darkTheme = true;
        app.emit('darkThemeChange', true);
      } else if (app.mq.light && app.mq.light.matches) {
        html.classList.remove('theme-dark');
        app.darkTheme = false;
        app.emit('darkThemeChange', false);
      }
    }

    disableAutoDarkTheme() {
      if (!win.matchMedia) return;
      const app = this;
      if (app.mq.dark) app.mq.dark.removeListener(app.colorSchemeListener);
      if (app.mq.light) app.mq.light.removeListener(app.colorSchemeListener);
    }

    initAppComponent(callback) {
      const app = this;
      app.router.componentLoader(
        app.params.component,
        app.params.componentUrl,
        { componentOptions: { el: app.root[0], root: true } },
        (el) => {
          app.root = $(el);
          app.root[0].f7 = app;
          app.rootComponent = el.f7Component;
          if (callback) callback();
        },
        () => {}
      );
    }

    // eslint-disable-next-line
    _init() {
      const app = this;
      if (app.initialized) return app;

      app.root.addClass('framework7-initializing');

      // RTL attr
      if (app.rtl) {
        $('html').attr('dir', 'rtl');
      }

      // Auto Dark Theme
      if (app.params.autoDarkTheme) {
        app.enableAutoDarkTheme();
      }

      // Watch for online/offline state
      win.addEventListener('offline', () => {
        app.online = false;
        app.emit('offline');
        app.emit('connection', false);
      });
      win.addEventListener('online', () => {
        app.online = true;
        app.emit('online');
        app.emit('connection', true);
      });

      // Root class
      app.root.addClass('framework7-root');

      // Theme class
      $('html').removeClass('ios md aurora').addClass(app.theme);

      // iOS Translucent
      if (app.params.iosTranslucentBars && app.theme === 'ios' && Device.ios) {
        $('html').addClass('ios-translucent-bars');
      }
      if (app.params.iosTranslucentModals && app.theme === 'ios' && Device.ios) {
        $('html').addClass('ios-translucent-modals');
      }

      // Init class
      Utils.nextFrame(() => {
        app.root.removeClass('framework7-initializing');
      });
      // Emit, init other modules
      app.initialized = true;
      app.emit('init');

      return app;
    }

    init() {
      const app = this;
      if (app.params.component || app.params.componentUrl) {
        app.initAppComponent(() => {
          app._init(); // eslint-disable-line
        });
      } else {
        app._init(); // eslint-disable-line
      }
    }

    // eslint-disable-next-line
    loadModule(...args) {
      return Framework7.loadModule(...args);
    }

    // eslint-disable-next-line
    loadModules(...args) {
      return Framework7.loadModules(...args);
    }

    getVnodeHooks(hook, id) {
      const app = this;
      if (!app.vnodeHooks || !app.vnodeHooks[hook]) return [];
      return app.vnodeHooks[hook][id] || [];
    }

    // eslint-disable-next-line
    get $() {
      return $;
    }
    // eslint-disable-next-line
    get t7() {
      return Template7;
    }

    static get Dom7() {
      return $;
    }

    static get $() {
      return $;
    }

    static get Template7() {
      return Template7;
    }

    static get Class() {
      return Framework7Class;
    }

    static get Events() {
      return EventsClass;
    }
  }

  Framework7.ModalMethods = ModalMethods;
  Framework7.ConstructorMethods = ConstructorMethods;

  Framework7.loadModule = loadModule;
  Framework7.loadModules = function loadModules(modules) {
    return Promise.all(modules.map(module => Framework7.loadModule(module)));
  };

  const globals = {};
  let jsonpRequests = 0;

  function Request(requestOptions) {
    const globalsNoCallbacks = Utils.extend({}, globals);
    ('beforeCreate beforeOpen beforeSend error complete success statusCode').split(' ').forEach((callbackName) => {
      delete globalsNoCallbacks[callbackName];
    });
    const defaults = Utils.extend({
      url: win.location.toString(),
      method: 'GET',
      data: false,
      async: true,
      cache: true,
      user: '',
      password: '',
      headers: {},
      xhrFields: {},
      statusCode: {},
      processData: true,
      dataType: 'text',
      contentType: 'application/x-www-form-urlencoded',
      timeout: 0,
    }, globalsNoCallbacks);

    const options = Utils.extend({}, defaults, requestOptions);
    let proceedRequest;

    // Function to run XHR callbacks and events
    function fireCallback(callbackName, ...data) {
      /*
        Callbacks:
        beforeCreate (options),
        beforeOpen (xhr, options),
        beforeSend (xhr, options),
        error (xhr, status, message),
        complete (xhr, stautus),
        success (response, status, xhr),
        statusCode ()
      */
      let globalCallbackValue;
      let optionCallbackValue;
      if (globals[callbackName]) {
        globalCallbackValue = globals[callbackName](...data);
      }
      if (options[callbackName]) {
        optionCallbackValue = options[callbackName](...data);
      }
      if (typeof globalCallbackValue !== 'boolean') globalCallbackValue = true;
      if (typeof optionCallbackValue !== 'boolean') optionCallbackValue = true;
      return (globalCallbackValue && optionCallbackValue);
    }

    // Before create callback
    proceedRequest = fireCallback('beforeCreate', options);
    if (proceedRequest === false) return undefined;

    // For jQuery guys
    if (options.type) options.method = options.type;

    // Parameters Prefix
    let paramsPrefix = options.url.indexOf('?') >= 0 ? '&' : '?';

    // UC method
    const method = options.method.toUpperCase();

    // Data to modify GET URL
    if ((method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') && options.data) {
      let stringData;
      if (typeof options.data === 'string') {
        // Should be key=value string
        if (options.data.indexOf('?') >= 0) stringData = options.data.split('?')[1];
        else stringData = options.data;
      } else {
        // Should be key=value object
        stringData = Utils.serializeObject(options.data);
      }
      if (stringData.length) {
        options.url += paramsPrefix + stringData;
        if (paramsPrefix === '?') paramsPrefix = '&';
      }
    }

    // JSONP
    if (options.dataType === 'json' && options.url.indexOf('callback=') >= 0) {
      const callbackName = `f7jsonp_${Date.now() + ((jsonpRequests += 1))}`;
      let abortTimeout;
      const callbackSplit = options.url.split('callback=');
      let requestUrl = `${callbackSplit[0]}callback=${callbackName}`;
      if (callbackSplit[1].indexOf('&') >= 0) {
        const addVars = callbackSplit[1].split('&').filter(el => el.indexOf('=') > 0).join('&');
        if (addVars.length > 0) requestUrl += `&${addVars}`;
      }

      // Create script
      let script = doc.createElement('script');
      script.type = 'text/javascript';
      script.onerror = function onerror() {
        clearTimeout(abortTimeout);
        fireCallback('error', null, 'scripterror', 'scripterror');
        fireCallback('complete', null, 'scripterror');
      };
      script.src = requestUrl;

      // Handler
      win[callbackName] = function jsonpCallback(data) {
        clearTimeout(abortTimeout);
        fireCallback('success', data);
        script.parentNode.removeChild(script);
        script = null;
        delete win[callbackName];
      };
      doc.querySelector('head').appendChild(script);

      if (options.timeout > 0) {
        abortTimeout = setTimeout(() => {
          script.parentNode.removeChild(script);
          script = null;
          fireCallback('error', null, 'timeout', 'timeout');
        }, options.timeout);
      }

      return undefined;
    }

    // Cache for GET/HEAD requests
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') {
      if (options.cache === false) {
        options.url += `${paramsPrefix}_nocache${Date.now()}`;
      }
    }

    // Create XHR
    const xhr = new XMLHttpRequest();

    // Save Request URL
    xhr.requestUrl = options.url;
    xhr.requestParameters = options;

    // Before open callback
    proceedRequest = fireCallback('beforeOpen', xhr, options);
    if (proceedRequest === false) return xhr;

    // Open XHR
    xhr.open(method, options.url, options.async, options.user, options.password);

    // Create POST Data
    let postData = null;

    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && options.data) {
      if (options.processData) {
        const postDataInstances = [ArrayBuffer, Blob, Document, FormData];
        // Post Data
        if (postDataInstances.indexOf(options.data.constructor) >= 0) {
          postData = options.data;
        } else {
          // POST Headers
          const boundary = `---------------------------${Date.now().toString(16)}`;

          if (options.contentType === 'multipart/form-data') {
            xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
          } else {
            xhr.setRequestHeader('Content-Type', options.contentType);
          }
          postData = '';
          let data = Utils.serializeObject(options.data);
          if (options.contentType === 'multipart/form-data') {
            data = data.split('&');
            const newData = [];
            for (let i = 0; i < data.length; i += 1) {
              newData.push(`Content-Disposition: form-data; name="${data[i].split('=')[0]}"\r\n\r\n${data[i].split('=')[1]}\r\n`);
            }
            postData = `--${boundary}\r\n${newData.join(`--${boundary}\r\n`)}--${boundary}--\r\n`;
          } else if (options.contentType === 'application/json') {
            postData = JSON.stringify(options.data);
          } else {
            postData = data;
          }
        }
      } else {
        postData = options.data;
        xhr.setRequestHeader('Content-Type', options.contentType);
      }
    }
    if (options.dataType === 'json' && (!options.headers || !options.headers.Accept)) {
      xhr.setRequestHeader('Accept', 'application/json');
    }

    // Additional headers
    if (options.headers) {
      Object.keys(options.headers).forEach((headerName) => {
        if (typeof options.headers[headerName] === 'undefined') return;
        xhr.setRequestHeader(headerName, options.headers[headerName]);
      });
    }

    // Check for crossDomain
    if (typeof options.crossDomain === 'undefined') {
      // eslint-disable-next-line
      options.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(options.url) && RegExp.$2 !== win.location.host;
    }

    if (!options.crossDomain) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    if (options.xhrFields) {
      Utils.extend(xhr, options.xhrFields);
    }


    // Handle XHR
    xhr.onload = function onload() {
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
        let responseData;
        if (options.dataType === 'json') {
          let parseError;
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch (err) {
            parseError = true;
          }
          if (!parseError) {
            fireCallback('success', responseData, xhr.status, xhr);
          } else {
            fireCallback('error', xhr, 'parseerror', 'parseerror');
          }
        } else {
          responseData = xhr.responseType === 'text' || xhr.responseType === '' ? xhr.responseText : xhr.response;
          fireCallback('success', responseData, xhr.status, xhr);
        }
      } else {
        fireCallback('error', xhr, xhr.status, xhr.statusText);
      }
      if (options.statusCode) {
        if (globals.statusCode && globals.statusCode[xhr.status]) globals.statusCode[xhr.status](xhr);
        if (options.statusCode[xhr.status]) options.statusCode[xhr.status](xhr);
      }
      fireCallback('complete', xhr, xhr.status);
    };

    xhr.onerror = function onerror() {
      fireCallback('error', xhr, xhr.status, xhr.status);
      fireCallback('complete', xhr, 'error');
    };

    // Timeout
    if (options.timeout > 0) {
      xhr.timeout = options.timeout;
      xhr.ontimeout = () => {
        fireCallback('error', xhr, 'timeout', 'timeout');
        fireCallback('complete', xhr, 'timeout');
      };
    }

    // Ajax start callback
    proceedRequest = fireCallback('beforeSend', xhr, options);
    if (proceedRequest === false) return xhr;

    // Send XHR
    xhr.send(postData);

    // Return XHR object
    return xhr;
  }
  function RequestShortcut(method, ...args) {
    let [url, data, success, error, dataType] = [];
    if (typeof args[1] === 'function') {
      [url, success, error, dataType] = args;
    } else {
      [url, data, success, error, dataType] = args;
    }
    [success, error].forEach((callback) => {
      if (typeof callback === 'string') {
        dataType = callback;
        if (callback === success) success = undefined;
        else error = undefined;
      }
    });
    dataType = dataType || (method === 'json' || method === 'postJSON' ? 'json' : undefined);
    const requestOptions = {
      url,
      method: method === 'post' || method === 'postJSON' ? 'POST' : 'GET',
      data,
      success,
      error,
      dataType,
    };
    if (method === 'postJSON') {
      Utils.extend(requestOptions, {
        contentType: 'application/json',
        processData: false,
        crossDomain: true,
        data: typeof data === 'string' ? data : JSON.stringify(data),
      });
    }
    return Request(requestOptions);
  }
  function RequestShortcutPromise(method, ...args) {
    const [url, data, dataType] = args;
    return new Promise((resolve, reject) => {
      RequestShortcut(
        method,
        url,
        data,
        (responseData, status, xhr) => {
          resolve({ data: responseData, status, xhr });
        },
        (xhr, status, message) => {
          // eslint-disable-next-line
          reject({ xhr, status, message });
        },
        dataType
      );
    });
  }
  Object.assign(Request, {
    get: (...args) => RequestShortcut('get', ...args),
    post: (...args) => RequestShortcut('post', ...args),
    json: (...args) => RequestShortcut('json', ...args),
    getJSON: (...args) => RequestShortcut('json', ...args),
    postJSON: (...args) => RequestShortcut('postJSON', ...args),
  });

  Request.promise = function requestPromise(requestOptions) {
    return new Promise((resolve, reject) => {
      Request(Object.assign(requestOptions, {
        success(data, status, xhr) {
          resolve({ data, status, xhr });
        },
        error(xhr, status, message) {
          // eslint-disable-next-line
          reject({ xhr, status, message });
        },
      }));
    });
  };
  Object.assign(Request.promise, {
    get: (...args) => RequestShortcutPromise('get', ...args),
    post: (...args) => RequestShortcutPromise('post', ...args),
    json: (...args) => RequestShortcutPromise('json', ...args),
    getJSON: (...args) => RequestShortcutPromise('json', ...args),
    postJSON: (...args) => RequestShortcutPromise('postJSON', ...args),
  });

  Request.setup = function setup(options) {
    if (options.type && !options.method) {
      Utils.extend(options, { method: options.type });
    }
    Utils.extend(globals, options);
  };

  var DeviceModule = {
    name: 'device',
    proto: {
      device: Device,
    },
    static: {
      device: Device,
    },
    on: {
      init() {
        const classNames = [];
        const html = doc.querySelector('html');
        const metaStatusbar = doc.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!html) return;
        if (Device.standalone && Device.ios && metaStatusbar && metaStatusbar.content === 'black-translucent') {
          classNames.push('device-full-viewport');
        }

        // Pixel Ratio
        classNames.push(`device-pixel-ratio-${Math.floor(Device.pixelRatio)}`);
        // OS classes
        if (Device.os && !Device.desktop) {
          classNames.push(
            `device-${Device.os}`,
          );
        } else if (Device.desktop) {
          classNames.push('device-desktop');
          if (Device.os) {
            classNames.push(`device-${Device.os}`);
          }
        }
        if (Device.cordova || Device.phonegap) {
          classNames.push('device-cordova');
        }

        // Add html classes
        classNames.forEach((className) => {
          html.classList.add(className);
        });
      },
    },
  };

  var SupportModule = {
    name: 'support',
    proto: {
      support: Support,
    },
    static: {
      support: Support,
    },
  };

  var UtilsModule = {
    name: 'utils',
    proto: {
      utils: Utils,
    },
    static: {
      utils: Utils,
    },
  };

  var ResizeModule = {
    name: 'resize',
    instance: {
      getSize() {
        const app = this;
        if (!app.root[0]) return { width: 0, height: 0, left: 0, top: 0 };
        const offset = app.root.offset();
        const [width, height, left, top] = [app.root[0].offsetWidth, app.root[0].offsetHeight, offset.left, offset.top];
        app.width = width;
        app.height = height;
        app.left = left;
        app.top = top;
        return { width, height, left, top };
      },
    },
    on: {
      init() {
        const app = this;

        // Get Size
        app.getSize();

        // Emit resize
        win.addEventListener('resize', () => {
          app.emit('resize');
        }, false);

        // Emit orientationchange
        win.addEventListener('orientationchange', () => {
          app.emit('orientationchange');
        });
      },
      orientationchange() {
        const app = this;
        // Fix iPad weird body scroll
        if (app.device.ipad) {
          doc.body.scrollLeft = 0;
          setTimeout(() => {
            doc.body.scrollLeft = 0;
          }, 0);
        }
      },
      resize() {
        const app = this;
        app.getSize();
      },
    },
  };

  /* eslint no-param-reassign: "off" */

  var RequestModule = {
    name: 'request',
    proto: {
      request: Request,
    },
    static: {
      request: Request,
    },
  };

  /* eslint-disable no-nested-ternary */

  function initTouch() {
    const app = this;
    const params = app.params.touch;
    const useRipple = params[`${app.theme}TouchRipple`];

    if (Device.ios && Device.webView) {
      // Strange hack required for iOS 8 webview to work on inputs
      win.addEventListener('touchstart', () => {});
    }

    let touchStartX;
    let touchStartY;
    let targetElement;
    let isMoved;
    let tapHoldFired;
    let tapHoldTimeout;
    let preventClick;

    let activableElement;
    let activeTimeout;

    let rippleWave;
    let rippleTarget;
    let rippleTimeout;

    function findActivableElement(el) {
      const target = $(el);
      const parents = target.parents(params.activeStateElements);
      if (target.closest('.no-active-state').length) {
        return null;
      }
      let activable;
      if (target.is(params.activeStateElements)) {
        activable = target;
      }
      if (parents.length > 0) {
        activable = activable ? activable.add(parents) : parents;
      }
      if (activable && activable.length > 1) {
        const newActivable = [];
        let preventPropagation;
        for (let i = 0; i < activable.length; i += 1) {
          if (!preventPropagation) {
            newActivable.push(activable[i]);
            if (activable.eq(i).hasClass('prevent-active-state-propagation')
              || activable.eq(i).hasClass('no-active-state-propagation')
            ) {
              preventPropagation = true;
            }
          }
        }
        activable = $(newActivable);
      }
      return activable || target;
    }

    function isInsideScrollableView(el) {
      const pageContent = el.parents('.page-content');
      return pageContent.length > 0;
    }

    function addActive() {
      if (!activableElement) return;
      activableElement.addClass('active-state');
    }
    function removeActive() {
      if (!activableElement) return;
      activableElement.removeClass('active-state');
      activableElement = null;
    }

    // Ripple handlers
    function findRippleElement(el) {
      const rippleElements = params.touchRippleElements;
      const $el = $(el);
      if ($el.is(rippleElements)) {
        if ($el.hasClass('no-ripple')) {
          return false;
        }
        return $el;
      }
      if ($el.parents(rippleElements).length > 0) {
        const rippleParent = $el.parents(rippleElements).eq(0);
        if (rippleParent.hasClass('no-ripple')) {
          return false;
        }
        return rippleParent;
      }
      return false;
    }
    function createRipple($el, x, y) {
      if (!$el) return;
      rippleWave = app.touchRipple.create($el, x, y);
    }

    function removeRipple() {
      if (!rippleWave) return;
      rippleWave.remove();
      rippleWave = undefined;
      rippleTarget = undefined;
    }
    function rippleTouchStart(el) {
      rippleTarget = findRippleElement(el);
      if (!rippleTarget || rippleTarget.length === 0) {
        rippleTarget = undefined;
        return;
      }
      const inScrollable = isInsideScrollableView(rippleTarget);

      if (!inScrollable) {
        removeRipple();
        createRipple(rippleTarget, touchStartX, touchStartY);
      } else {
        clearTimeout(rippleTimeout);
        rippleTimeout = setTimeout(() => {
          removeRipple();
          createRipple(rippleTarget, touchStartX, touchStartY);
        }, 80);
      }
    }
    function rippleTouchMove() {
      clearTimeout(rippleTimeout);
      removeRipple();
    }
    function rippleTouchEnd() {
      if (!rippleWave && rippleTarget && !isMoved) {
        clearTimeout(rippleTimeout);
        createRipple(rippleTarget, touchStartX, touchStartY);
        setTimeout(removeRipple, 0);
      } else {
        removeRipple();
      }
    }

    // Mouse Handlers
    function handleMouseDown(e) {
      const $activableEl = findActivableElement(e.target);
      if ($activableEl) {
        $activableEl.addClass('active-state');
        if ('which' in e && e.which === 3) {
          setTimeout(() => {
            $('.active-state').removeClass('active-state');
          }, 0);
        }
      }

      if (useRipple) {
        touchStartX = e.pageX;
        touchStartY = e.pageY;
        rippleTouchStart(e.target, e.pageX, e.pageY);
      }
    }
    function handleMouseMove() {
      if (!params.activeStateOnMouseMove) {
        $('.active-state').removeClass('active-state');
      }
      if (useRipple) {
        rippleTouchMove();
      }
    }
    function handleMouseUp() {
      $('.active-state').removeClass('active-state');
      if (useRipple) {
        rippleTouchEnd();
      }
    }

    function handleTouchCancel() {
      targetElement = null;

      // Remove Active State
      clearTimeout(activeTimeout);
      clearTimeout(tapHoldTimeout);
      if (params.activeState) {
        removeActive();
      }

      // Remove Ripple
      if (useRipple) {
        rippleTouchEnd();
      }
    }

    function handleTouchStart(e) {
      isMoved = false;
      tapHoldFired = false;
      preventClick = false;
      if (e.targetTouches.length > 1) {
        if (activableElement) removeActive();
        return true;
      }
      if (e.touches.length > 1 && activableElement) {
        removeActive();
      }
      if (params.tapHold) {
        if (tapHoldTimeout) clearTimeout(tapHoldTimeout);
        tapHoldTimeout = setTimeout(() => {
          if (e && e.touches && e.touches.length > 1) return;
          tapHoldFired = true;
          e.preventDefault();
          preventClick = true;
          $(e.target).trigger('taphold', e);
          app.emit('taphold', e);
        }, params.tapHoldDelay);
      }
      targetElement = e.target;
      touchStartX = e.targetTouches[0].pageX;
      touchStartY = e.targetTouches[0].pageY;

      if (params.activeState) {
        activableElement = findActivableElement(targetElement);
        if (activableElement && !isInsideScrollableView(activableElement)) {
          addActive();
        } else if (activableElement) {
          activeTimeout = setTimeout(addActive, 80);
        }
      }
      if (useRipple) {
        rippleTouchStart(targetElement);
      }
      return true;
    }
    function handleTouchMove(e) {
      let touch;
      let distance;
      if (e.type === 'touchmove') {
        touch = e.targetTouches[0];
        distance = params.touchClicksDistanceThreshold;
      }

      if (distance && touch) {
        const pageX = touch.pageX;
        const pageY = touch.pageY;
        if (Math.abs(pageX - touchStartX) > distance || Math.abs(pageY - touchStartY) > distance) {
          isMoved = true;
        }
      } else {
        isMoved = true;
      }
      if (isMoved) {
        preventClick = true;
        if (params.tapHold) {
          clearTimeout(tapHoldTimeout);
        }
        if (params.activeState) {
          clearTimeout(activeTimeout);
          removeActive();
        }
        if (useRipple) {
          rippleTouchMove();
        }
      }
    }
    function handleTouchEnd(e) {
      clearTimeout(activeTimeout);
      clearTimeout(tapHoldTimeout);
      if (doc.activeElement === e.target) {
        if (params.activeState) removeActive();
        if (useRipple) {
          rippleTouchEnd();
        }
        return true;
      }
      if (params.activeState) {
        addActive();
        setTimeout(removeActive, 0);
      }
      if (useRipple) {
        rippleTouchEnd();
      }
      if ((params.tapHoldPreventClicks && tapHoldFired) || preventClick) {
        if (e.cancelable) e.preventDefault();
        preventClick = true;
        return false;
      }
      return true;
    }
    function handleClick(e) {
      const isOverswipe = e && e.detail && e.detail === 'f7Overswipe';
      let localPreventClick = preventClick;
      if (targetElement && e.target !== targetElement) {
        if (isOverswipe) {
          localPreventClick = false;
        } else {
          localPreventClick = true;
        }
      }
      if (params.tapHold && params.tapHoldPreventClicks && tapHoldFired) {
        localPreventClick = true;
      }
      if (localPreventClick) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      }

      if (params.tapHold) {
        tapHoldTimeout = setTimeout(
          () => {
            tapHoldFired = false;
          },
          (Device.ios || Device.androidChrome ? 100 : 400)
        );
      }
      preventClick = false;
      targetElement = null;

      return !localPreventClick;
    }

    function emitAppTouchEvent(name, e) {
      app.emit({
        events: name,
        data: [e],
      });
    }
    function appClick(e) {
      emitAppTouchEvent('click', e);
    }
    function appTouchStartActive(e) {
      emitAppTouchEvent('touchstart touchstart:active', e);
    }
    function appTouchMoveActive(e) {
      emitAppTouchEvent('touchmove touchmove:active', e);
    }
    function appTouchEndActive(e) {
      emitAppTouchEvent('touchend touchend:active', e);
    }
    function appTouchStartPassive(e) {
      emitAppTouchEvent('touchstart:passive', e);
    }
    function appTouchMovePassive(e) {
      emitAppTouchEvent('touchmove:passive', e);
    }
    function appTouchEndPassive(e) {
      emitAppTouchEvent('touchend:passive', e);
    }
    function appGestureActive(e) {
      emitAppTouchEvent(`${e.type} ${e.type}:active`, e);
    }
    function appGesturePassive(e) {
      emitAppTouchEvent(`${e.type}:passive`, e);
    }


    const passiveListener = Support.passiveListener ? { passive: true } : false;
    const passiveListenerCapture = Support.passiveListener ? { passive: true, capture: true } : true;
    const activeListener = Support.passiveListener ? { passive: false } : false;
    const activeListenerCapture = Support.passiveListener ? { passive: false, capture: true } : true;

    doc.addEventListener('click', appClick, true);

    if (Support.passiveListener) {
      doc.addEventListener(app.touchEvents.start, appTouchStartActive, activeListenerCapture);
      doc.addEventListener(app.touchEvents.move, appTouchMoveActive, activeListener);
      doc.addEventListener(app.touchEvents.end, appTouchEndActive, activeListener);

      doc.addEventListener(app.touchEvents.start, appTouchStartPassive, passiveListenerCapture);
      doc.addEventListener(app.touchEvents.move, appTouchMovePassive, passiveListener);
      doc.addEventListener(app.touchEvents.end, appTouchEndPassive, passiveListener);
      if (Support.touch && Support.gestures) {
        doc.addEventListener('gesturestart', appGestureActive, activeListener);
        doc.addEventListener('gesturechange', appGestureActive, activeListener);
        doc.addEventListener('gestureend', appGestureActive, activeListener);

        doc.addEventListener('gesturestart', appGesturePassive, passiveListener);
        doc.addEventListener('gesturechange', appGesturePassive, passiveListener);
        doc.addEventListener('gestureend', appGesturePassive, passiveListener);
      }
    } else {
      doc.addEventListener(app.touchEvents.start, (e) => {
        appTouchStartActive(e);
        appTouchStartPassive(e);
      }, true);
      doc.addEventListener(app.touchEvents.move, (e) => {
        appTouchMoveActive(e);
        appTouchMovePassive(e);
      }, false);
      doc.addEventListener(app.touchEvents.end, (e) => {
        appTouchEndActive(e);
        appTouchEndPassive(e);
      }, false);
      if (Support.touch && Support.gestures) {
        doc.addEventListener('gesturestart', (e) => {
          appGestureActive(e);
          appGesturePassive(e);
        }, false);
        doc.addEventListener('gesturechange', (e) => {
          appGestureActive(e);
          appGesturePassive(e);
        }, false);
        doc.addEventListener('gestureend', (e) => {
          appGestureActive(e);
          appGesturePassive(e);
        }, false);
      }
    }

    if (Support.touch) {
      app.on('click', handleClick);
      app.on('touchstart', handleTouchStart);
      app.on('touchmove', handleTouchMove);
      app.on('touchend', handleTouchEnd);
      doc.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    } else if (params.activeState) {
      app.on('touchstart', handleMouseDown);
      app.on('touchmove', handleMouseMove);
      app.on('touchend', handleMouseUp);
      doc.addEventListener('pointercancel', handleMouseUp, { passive: true });
    }
    doc.addEventListener('contextmenu', (e) => {
      if (params.disableContextMenu && (Device.ios || Device.android || Device.cordova)) {
        e.preventDefault();
      }
      if (useRipple) {
        if (activableElement) removeActive();
        rippleTouchEnd();
      }
    });
  }

  var TouchModule = {
    name: 'touch',
    params: {
      touch: {
        // Clicks
        touchClicksDistanceThreshold: 5,
        // ContextMenu
        disableContextMenu: false,
        // Tap Hold
        tapHold: false,
        tapHoldDelay: 750,
        tapHoldPreventClicks: true,
        // Active State
        activeState: true,
        activeStateElements: 'a, button, label, span, .actions-button, .stepper-button, .stepper-button-plus, .stepper-button-minus, .card-expandable, .menu-item, .link, .item-link, .accordion-item-toggle',
        activeStateOnMouseMove: false,
        mdTouchRipple: true,
        iosTouchRipple: false,
        auroraTouchRipple: false,
        touchRippleElements: '.ripple, .link, .item-link, .list-button, .links-list a, .button, button, .input-clear-button, .dialog-button, .tab-link, .item-radio, .item-checkbox, .actions-button, .searchbar-disable-button, .fab a, .checkbox, .radio, .data-table .sortable-cell:not(.input-cell), .notification-close-button, .stepper-button, .stepper-button-minus, .stepper-button-plus, .menu-item-content, .list.accordion-list .accordion-item-toggle',
      },
    },
    instance: {
      touchEvents: {
        start: Support.touch ? 'touchstart' : (Support.pointerEvents ? 'pointerdown' : 'mousedown'),
        move: Support.touch ? 'touchmove' : (Support.pointerEvents ? 'pointermove' : 'mousemove'),
        end: Support.touch ? 'touchend' : (Support.pointerEvents ? 'pointerup' : 'mouseup'),
      },
    },
    on: {
      init: initTouch,
    },
  };

  /**
   * Tokenize input string.
   */
  function lexer(str) {
      var tokens = [];
      var i = 0;
      while (i < str.length) {
          var char = str[i];
          if (char === "*" || char === "+" || char === "?") {
              tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
              continue;
          }
          if (char === "\\") {
              tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
              continue;
          }
          if (char === "{") {
              tokens.push({ type: "OPEN", index: i, value: str[i++] });
              continue;
          }
          if (char === "}") {
              tokens.push({ type: "CLOSE", index: i, value: str[i++] });
              continue;
          }
          if (char === ":") {
              var name = "";
              var j = i + 1;
              while (j < str.length) {
                  var code = str.charCodeAt(j);
                  if (
                  // `0-9`
                  (code >= 48 && code <= 57) ||
                      // `A-Z`
                      (code >= 65 && code <= 90) ||
                      // `a-z`
                      (code >= 97 && code <= 122) ||
                      // `_`
                      code === 95) {
                      name += str[j++];
                      continue;
                  }
                  break;
              }
              if (!name)
                  throw new TypeError("Missing parameter name at " + i);
              tokens.push({ type: "NAME", index: i, value: name });
              i = j;
              continue;
          }
          if (char === "(") {
              var count = 1;
              var pattern = "";
              var j = i + 1;
              if (str[j] === "?") {
                  throw new TypeError("Pattern cannot start with \"?\" at " + j);
              }
              while (j < str.length) {
                  if (str[j] === "\\") {
                      pattern += str[j++] + str[j++];
                      continue;
                  }
                  if (str[j] === ")") {
                      count--;
                      if (count === 0) {
                          j++;
                          break;
                      }
                  }
                  else if (str[j] === "(") {
                      count++;
                      if (str[j + 1] !== "?") {
                          throw new TypeError("Capturing groups are not allowed at " + j);
                      }
                  }
                  pattern += str[j++];
              }
              if (count)
                  throw new TypeError("Unbalanced pattern at " + i);
              if (!pattern)
                  throw new TypeError("Missing pattern at " + i);
              tokens.push({ type: "PATTERN", index: i, value: pattern });
              i = j;
              continue;
          }
          tokens.push({ type: "CHAR", index: i, value: str[i++] });
      }
      tokens.push({ type: "END", index: i, value: "" });
      return tokens;
  }
  /**
   * Parse a string for the raw tokens.
   */
  function parse(str, options) {
      if (options === void 0) { options = {}; }
      var tokens = lexer(str);
      var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
      var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
      var result = [];
      var key = 0;
      var i = 0;
      var path = "";
      var tryConsume = function (type) {
          if (i < tokens.length && tokens[i].type === type)
              return tokens[i++].value;
      };
      var mustConsume = function (type) {
          var value = tryConsume(type);
          if (value !== undefined)
              return value;
          var _a = tokens[i], nextType = _a.type, index = _a.index;
          throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
      };
      var consumeText = function () {
          var result = "";
          var value;
          // tslint:disable-next-line
          while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
              result += value;
          }
          return result;
      };
      while (i < tokens.length) {
          var char = tryConsume("CHAR");
          var name = tryConsume("NAME");
          var pattern = tryConsume("PATTERN");
          if (name || pattern) {
              var prefix = char || "";
              if (prefixes.indexOf(prefix) === -1) {
                  path += prefix;
                  prefix = "";
              }
              if (path) {
                  result.push(path);
                  path = "";
              }
              result.push({
                  name: name || key++,
                  prefix: prefix,
                  suffix: "",
                  pattern: pattern || defaultPattern,
                  modifier: tryConsume("MODIFIER") || ""
              });
              continue;
          }
          var value = char || tryConsume("ESCAPED_CHAR");
          if (value) {
              path += value;
              continue;
          }
          if (path) {
              result.push(path);
              path = "";
          }
          var open = tryConsume("OPEN");
          if (open) {
              var prefix = consumeText();
              var name_1 = tryConsume("NAME") || "";
              var pattern_1 = tryConsume("PATTERN") || "";
              var suffix = consumeText();
              mustConsume("CLOSE");
              result.push({
                  name: name_1 || (pattern_1 ? key++ : ""),
                  pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                  prefix: prefix,
                  suffix: suffix,
                  modifier: tryConsume("MODIFIER") || ""
              });
              continue;
          }
          mustConsume("END");
      }
      return result;
  }
  /**
   * Compile a string to a template function for the path.
   */
  function compile(str, options) {
      return tokensToFunction(parse(str, options), options);
  }
  /**
   * Expose a method for transforming tokens into the path function.
   */
  function tokensToFunction(tokens, options) {
      if (options === void 0) { options = {}; }
      var reFlags = flags(options);
      var _a = options.encode, encode = _a === void 0 ? function (x) { return x; } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
      // Compile all the tokens into regexps.
      var matches = tokens.map(function (token) {
          if (typeof token === "object") {
              return new RegExp("^(?:" + token.pattern + ")$", reFlags);
          }
      });
      return function (data) {
          var path = "";
          for (var i = 0; i < tokens.length; i++) {
              var token = tokens[i];
              if (typeof token === "string") {
                  path += token;
                  continue;
              }
              var value = data ? data[token.name] : undefined;
              var optional = token.modifier === "?" || token.modifier === "*";
              var repeat = token.modifier === "*" || token.modifier === "+";
              if (Array.isArray(value)) {
                  if (!repeat) {
                      throw new TypeError("Expected \"" + token.name + "\" to not repeat, but got an array");
                  }
                  if (value.length === 0) {
                      if (optional)
                          continue;
                      throw new TypeError("Expected \"" + token.name + "\" to not be empty");
                  }
                  for (var j = 0; j < value.length; j++) {
                      var segment = encode(value[j], token);
                      if (validate && !matches[i].test(segment)) {
                          throw new TypeError("Expected all \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
                      }
                      path += token.prefix + segment + token.suffix;
                  }
                  continue;
              }
              if (typeof value === "string" || typeof value === "number") {
                  var segment = encode(String(value), token);
                  if (validate && !matches[i].test(segment)) {
                      throw new TypeError("Expected \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
                  }
                  path += token.prefix + segment + token.suffix;
                  continue;
              }
              if (optional)
                  continue;
              var typeOfMessage = repeat ? "an array" : "a string";
              throw new TypeError("Expected \"" + token.name + "\" to be " + typeOfMessage);
          }
          return path;
      };
  }
  /**
   * Escape a regular expression string.
   */
  function escapeString(str) {
      return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
  }
  /**
   * Get the flags for a regexp from the options.
   */
  function flags(options) {
      return options && options.sensitive ? "" : "i";
  }
  /**
   * Pull out keys from a regexp.
   */
  function regexpToRegexp(path, keys) {
      if (!keys)
          return path;
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);
      if (groups) {
          for (var i = 0; i < groups.length; i++) {
              keys.push({
                  name: i,
                  prefix: "",
                  suffix: "",
                  modifier: "",
                  pattern: ""
              });
          }
      }
      return path;
  }
  /**
   * Transform an array into a regexp.
   */
  function arrayToRegexp(paths, keys, options) {
      var parts = paths.map(function (path) { return pathToRegexp(path, keys, options).source; });
      return new RegExp("(?:" + parts.join("|") + ")", flags(options));
  }
  /**
   * Create a path regexp from string input.
   */
  function stringToRegexp(path, keys, options) {
      return tokensToRegexp(parse(path, options), keys, options);
  }
  /**
   * Expose a function for taking tokens and returning a RegExp.
   */
  function tokensToRegexp(tokens, keys, options) {
      if (options === void 0) { options = {}; }
      var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function (x) { return x; } : _d;
      var endsWith = "[" + escapeString(options.endsWith || "") + "]|$";
      var delimiter = "[" + escapeString(options.delimiter || "/#?") + "]";
      var route = start ? "^" : "";
      // Iterate over the tokens and create our regexp string.
      for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
          var token = tokens_1[_i];
          if (typeof token === "string") {
              route += escapeString(encode(token));
          }
          else {
              var prefix = escapeString(encode(token.prefix));
              var suffix = escapeString(encode(token.suffix));
              if (token.pattern) {
                  if (keys)
                      keys.push(token);
                  if (prefix || suffix) {
                      if (token.modifier === "+" || token.modifier === "*") {
                          var mod = token.modifier === "*" ? "?" : "";
                          route += "(?:" + prefix + "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + suffix + ")" + mod;
                      }
                      else {
                          route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
                      }
                  }
                  else {
                      route += "(" + token.pattern + ")" + token.modifier;
                  }
              }
              else {
                  route += "(?:" + prefix + suffix + ")" + token.modifier;
              }
          }
      }
      if (end) {
          if (!strict)
              route += delimiter + "?";
          route += !options.endsWith ? "$" : "(?=" + endsWith + ")";
      }
      else {
          var endToken = tokens[tokens.length - 1];
          var isEndDelimited = typeof endToken === "string"
              ? delimiter.indexOf(endToken[endToken.length - 1]) > -1
              : // tslint:disable-next-line
                  endToken === undefined;
          if (!strict) {
              route += "(?:" + delimiter + "(?=" + endsWith + "))?";
          }
          if (!isEndDelimited) {
              route += "(?=" + delimiter + "|" + endsWith + ")";
          }
      }
      return new RegExp(route, flags(options));
  }
  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   */
  function pathToRegexp(path, keys, options) {
      if (path instanceof RegExp)
          return regexpToRegexp(path, keys);
      if (Array.isArray(path))
          return arrayToRegexp(path, keys, options);
      return stringToRegexp(path, keys, options);
  }

  const History = {
    queue: [],
    clearQueue() {
      if (History.queue.length === 0) return;
      const currentQueue = History.queue.shift();
      currentQueue();
    },
    routerQueue: [],
    clearRouterQueue() {
      if (History.routerQueue.length === 0) return;
      const currentQueue = History.routerQueue.pop();
      const { router, stateUrl, action } = currentQueue;

      let animate = router.params.animate;
      if (router.params.pushStateAnimate === false) animate = false;

      if (action === 'back') {
        router.back({ animate, pushState: false });
      }
      if (action === 'load') {
        router.navigate(stateUrl, { animate, pushState: false });
      }
    },
    handle(e) {
      if (History.blockPopstate) return;
      const app = this;
      // const mainView = app.views.main;
      let state = e.state;
      History.previousState = History.state;
      History.state = state;

      History.allowChange = true;
      History.clearQueue();

      state = History.state;
      if (!state) state = {};

      app.views.forEach((view) => {
        const router = view.router;
        let viewState = state[view.id];
        if (!viewState && view.params.pushState) {
          viewState = {
            url: view.router.history[0],
          };
        }
        if (!viewState) return;
        const stateUrl = viewState.url || undefined;

        let animate = router.params.animate;
        if (router.params.pushStateAnimate === false) animate = false;

        if (stateUrl !== router.url) {
          if (router.history.indexOf(stateUrl) >= 0) {
            // Go Back
            if (router.allowPageChange) {
              router.back({ animate, pushState: false });
            } else {
              History.routerQueue.push({
                action: 'back',
                router,
              });
            }
          } else if (router.allowPageChange) {
            // Load page
            router.navigate(stateUrl, { animate, pushState: false });
          } else {
            History.routerQueue.unshift({
              action: 'load',
              stateUrl,
              router,
            });
          }
        }
      });
    },
    initViewState(viewId, viewState) {
      const newState = Utils.extend({}, (History.state || {}), {
        [viewId]: viewState,
      });
      History.state = newState;
      win.history.replaceState(newState, '');
    },
    push(viewId, viewState, url) {
      if (!History.allowChange) {
        History.queue.push(() => {
          History.push(viewId, viewState, url);
        });
        return;
      }
      History.previousState = History.state;
      const newState = Utils.extend({}, (History.previousState || {}), {
        [viewId]: viewState,
      });
      History.state = newState;
      win.history.pushState(newState, '', url);
    },
    replace(viewId, viewState, url) {
      if (!History.allowChange) {
        History.queue.push(() => {
          History.replace(viewId, viewState, url);
        });
        return;
      }
      History.previousState = History.state;
      const newState = Utils.extend({}, (History.previousState || {}), {
        [viewId]: viewState,
      });
      History.state = newState;
      win.history.replaceState(newState, '', url);
    },
    go(index) {
      History.allowChange = false;
      win.history.go(index);
    },
    back() {
      History.allowChange = false;
      win.history.back();
    },
    allowChange: true,
    previousState: {},
    state: win.history.state,
    blockPopstate: true,
    init(app) {
      $(win).on('load', () => {
        setTimeout(() => {
          History.blockPopstate = false;
        }, 0);
      });

      if (doc.readyState && doc.readyState === 'complete') {
        History.blockPopstate = false;
      }

      $(win).on('popstate', History.handle.bind(app));
    },
  };

  function SwipeBack(r) {
    const router = r;
    const { $el, $navbarsEl, app, params } = router;
    let isTouched = false;
    let isMoved = false;
    const touchesStart = {};
    let isScrolling;
    let $currentPageEl = [];
    let $previousPageEl = [];
    let viewContainerWidth;
    let touchesDiff;
    let allowViewTouchMove = true;
    let touchStartTime;
    let $currentNavbarEl = [];
    let $previousNavbarEl = [];
    let dynamicNavbar;
    let $pageShadowEl;
    let $pageOpacityEl;

    let animatableNavEls;

    const paramsSwipeBackAnimateShadow = params[`${app.theme}SwipeBackAnimateShadow`];
    const paramsSwipeBackAnimateOpacity = params[`${app.theme}SwipeBackAnimateOpacity`];
    const paramsSwipeBackActiveArea = params[`${app.theme}SwipeBackActiveArea`];
    const paramsSwipeBackThreshold = params[`${app.theme}SwipeBackThreshold`];

    const transformOrigin = app.rtl ? 'right center' : 'left center';
    const transformOriginTitleLarge = app.rtl
      ? 'calc(100% - var(--f7-navbar-large-title-padding-left) - var(--f7-safe-area-left)) center'
      : 'calc(var(--f7-navbar-large-title-padding-left) + var(--f7-safe-area-left)) center';


    function animatableNavElements() {
      const els = [];
      const inverter = app.rtl ? -1 : 1;
      const currentNavIsTransparent = $currentNavbarEl.hasClass('navbar-transparent') && !$currentNavbarEl.hasClass('navbar-large') && !$currentNavbarEl.hasClass('navbar-transparent-visible');
      const currentNavIsLarge = $currentNavbarEl.hasClass('navbar-large');
      const currentNavIsCollapsed = $currentNavbarEl.hasClass('navbar-large-collapsed');
      const currentNavIsLargeTransparent = $currentNavbarEl.hasClass('navbar-large-transparent')
        || (
          $currentNavbarEl.hasClass('navbar-large')
          && $currentNavbarEl.hasClass('navbar-transparent')
        );
      const previousNavIsTransparent = $previousNavbarEl.hasClass('navbar-transparent') && !$previousNavbarEl.hasClass('navbar-large') && !$previousNavbarEl.hasClass('navbar-transparent-visible');
      const previousNavIsLarge = $previousNavbarEl.hasClass('navbar-large');
      const previousNavIsCollapsed = $previousNavbarEl.hasClass('navbar-large-collapsed');
      const previousNavIsLargeTransparent = $previousNavbarEl.hasClass('navbar-large-transparent')
        || (
          $previousNavbarEl.hasClass('navbar-large')
          && $previousNavbarEl.hasClass('navbar-transparent')
        );
      const fromLarge = currentNavIsLarge && !currentNavIsCollapsed;
      const toLarge = previousNavIsLarge && !previousNavIsCollapsed;
      const $currentNavElements = $currentNavbarEl.find('.left, .title, .right, .subnavbar, .fading, .title-large, .navbar-bg');
      const $previousNavElements = $previousNavbarEl.find('.left, .title, .right, .subnavbar, .fading, .title-large, .navbar-bg');
      let activeNavBackIconText;
      let previousNavBackIconText;

      if (params.iosAnimateNavbarBackIcon) {
        if ($currentNavbarEl.hasClass('sliding') || $currentNavbarEl.find('.navbar-inner.sliding').length) {
          activeNavBackIconText = $currentNavbarEl.find('.left').find('.back .icon + span').eq(0);
        } else {
          activeNavBackIconText = $currentNavbarEl.find('.left.sliding').find('.back .icon + span').eq(0);
        }
        if ($previousNavbarEl.hasClass('sliding') || $previousNavbarEl.find('.navbar-inner.sliding').length) {
          previousNavBackIconText = $previousNavbarEl.find('.left').find('.back .icon + span').eq(0);
        } else {
          previousNavBackIconText = $previousNavbarEl.find('.left.sliding').find('.back .icon + span').eq(0);
        }
        if (activeNavBackIconText.length) {
          $previousNavElements.each((index, el) => {
            if (!$(el).hasClass('title')) return;
            el.f7NavbarLeftOffset += activeNavBackIconText.prev('.icon')[0].offsetWidth;
          });
        }
      }
      $currentNavElements
        .each((index, navEl) => {
          const $navEl = $(navEl);
          const isSubnavbar = $navEl.hasClass('subnavbar');
          const isLeft = $navEl.hasClass('left');
          const isTitle = $navEl.hasClass('title');
          const isBg = $navEl.hasClass('navbar-bg');
          if ((isTitle || isBg) && currentNavIsTransparent) return;
          if (!fromLarge && $navEl.hasClass('.title-large')) return;
          const el = {
            el: navEl,
          };
          if (fromLarge) {
            if (isTitle) return;
            if ($navEl.hasClass('title-large')) {
              if (els.indexOf(el) < 0) els.push(el);
              el.overflow = 'visible';
              $navEl.find('.title-large-text').each((subIndex, subNavEl) => {
                els.push({
                  el: subNavEl,
                  transform: progress => `translateX(${progress * 100 * inverter}%)`,
                });
              });
              return;
            }
          }
          if (toLarge) {
            if (!fromLarge) {
              if ($navEl.hasClass('title-large')) {
                if (els.indexOf(el) < 0) els.push(el);
                el.opacity = 0;
              }
            }
            if (isLeft) {
              if (els.indexOf(el) < 0) els.push(el);
              el.opacity = progress => (1 - (progress ** 0.33));
              $navEl.find('.back span').each((subIndex, subNavEl) => {
                els.push({
                  el: subNavEl,
                  'transform-origin': transformOrigin,
                  transform: progress => `translateX(calc(${progress} * (var(--f7-navbarTitleLargeOffset) - var(--f7-navbarLeftTextOffset)))) translateY(calc(${progress} * (var(--f7-navbar-large-title-height) - var(--f7-navbar-large-title-padding-vertical) / 2))) scale(${1 + (1 * progress)})`,
                });
              });
              return;
            }
          }
          if (isBg) {
            if (els.indexOf(el) < 0) els.push(el);
            if (!fromLarge && !toLarge) {
              if (currentNavIsCollapsed) {
                if (currentNavIsLargeTransparent) {
                  el.className = 'ios-swipeback-navbar-bg-large';
                }
                el.transform = progress => `translateX(${100 * progress * inverter}%) translateY(calc(-1 * var(--f7-navbar-large-title-height)))`;
              } else {
                el.transform = progress => `translateX(${100 * progress * inverter}%)`;
              }
            }
            if (!fromLarge && toLarge) {
              el.className = 'ios-swipeback-navbar-bg-large';
              el.transform = progress => `translateX(${100 * progress * inverter}%) translateY(calc(-1 * ${1 - progress} * var(--f7-navbar-large-title-height)))`;
            }
            if (fromLarge && toLarge) {
              el.transform = progress => `translateX(${100 * progress * inverter}%)`;
            }
            if (fromLarge && !toLarge) {
              el.transform = progress => `translateX(${100 * progress * inverter}%) translateY(calc(-${progress} * var(--f7-navbar-large-title-height)))`;
            }
            return;
          }
          if ($navEl.hasClass('title-large')) return;
          const isSliding = $navEl.hasClass('sliding') || $navEl.parents('.navbar-inner.sliding').length;
          if (els.indexOf(el) < 0) els.push(el);
          if (!isSubnavbar || (isSubnavbar && !isSliding)) {
            el.opacity = progress => (1 - (progress ** 0.33));
          }
          if (isSliding) {
            let transformTarget = el;
            if (isLeft && activeNavBackIconText.length && params.iosAnimateNavbarBackIcon) {
              const textEl = { el: activeNavBackIconText[0] };
              transformTarget = textEl;
              els.push(textEl);
            }
            transformTarget.transform = (progress) => {
              let activeNavTranslate = progress * transformTarget.el.f7NavbarRightOffset;
              if (Device.pixelRatio === 1) activeNavTranslate = Math.round(activeNavTranslate);
              if (isSubnavbar && currentNavIsLarge) {
                return `translate3d(${activeNavTranslate}px, calc(-1 * var(--f7-navbar-large-collapse-progress) * var(--f7-navbar-large-title-height)), 0)`;
              }
              return `translate3d(${activeNavTranslate}px,0,0)`;
            };
          }
        });
      $previousNavElements
        .each((index, navEl) => {
          const $navEl = $(navEl);
          const isSubnavbar = $navEl.hasClass('subnavbar');
          const isLeft = $navEl.hasClass('left');
          const isTitle = $navEl.hasClass('title');
          const isBg = $navEl.hasClass('navbar-bg');
          if ((isTitle || isBg) && previousNavIsTransparent) return;
          const el = {
            el: navEl,
          };
          if (toLarge) {
            if (isTitle) return;
            if (els.indexOf(el) < 0) els.push(el);

            if ($navEl.hasClass('title-large')) {
              el.opacity = 1;
              el.overflow = 'visible';
              $navEl.find('.title-large-text').each((subIndex, subNavEl) => {
                els.push({
                  el: subNavEl,
                  'transform-origin': transformOriginTitleLarge,
                  opacity: progress => (progress ** 3),
                  transform: progress => `translateX(calc(${1 - progress} * (var(--f7-navbarLeftTextOffset) - var(--f7-navbarTitleLargeOffset)))) translateY(calc(${progress - 1} * var(--f7-navbar-large-title-height) + ${1 - progress} * var(--f7-navbar-large-title-padding-vertical))) scale(${0.5 + progress * 0.5})`,
                });
              });
              return;
            }
          }
          if (isBg) {
            if (els.indexOf(el) < 0) els.push(el);
            if (!fromLarge && !toLarge) {
              if (previousNavIsCollapsed) {
                if (previousNavIsLargeTransparent) {
                  el.className = 'ios-swipeback-navbar-bg-large';
                }
                el.transform = progress => `translateX(${(-100 + 100 * progress) * inverter}%) translateY(calc(-1 * var(--f7-navbar-large-title-height)))`;
              } else {
                el.transform = progress => `translateX(${(-100 + 100 * progress) * inverter}%)`;
              }
            }
            if (!fromLarge && toLarge) {
              el.transform = progress => `translateX(${(-100 + 100 * progress) * inverter}%) translateY(calc(-1 * ${1 - progress} * var(--f7-navbar-large-title-height)))`;
            }
            if (fromLarge && !toLarge) {
              el.className = 'ios-swipeback-navbar-bg-large';
              el.transform = progress => `translateX(${(-100 + 100 * progress) * inverter}%) translateY(calc(-${progress} * var(--f7-navbar-large-title-height)))`;
            }
            if (fromLarge && toLarge) {
              el.transform = progress => `translateX(${(-100 + 100 * progress) * inverter}%)`;
            }

            return;
          }
          if ($navEl.hasClass('title-large')) return;
          const isSliding = $navEl.hasClass('sliding') || $previousNavbarEl.children('.navbar-inner.sliding').length;
          if (els.indexOf(el) < 0) els.push(el);
          if (!isSubnavbar || (isSubnavbar && !isSliding)) {
            el.opacity = progress => (progress ** 3);
          }
          if (isSliding) {
            let transformTarget = el;
            if (isLeft && previousNavBackIconText.length && params.iosAnimateNavbarBackIcon) {
              const textEl = { el: previousNavBackIconText[0] };
              transformTarget = textEl;
              els.push(textEl);
            }
            transformTarget.transform = (progress) => {
              let previousNavTranslate = transformTarget.el.f7NavbarLeftOffset * (1 - progress);
              if (Device.pixelRatio === 1) previousNavTranslate = Math.round(previousNavTranslate);
              if (isSubnavbar && previousNavIsLarge) {
                return `translate3d(${previousNavTranslate}px, calc(-1 * var(--f7-navbar-large-collapse-progress) * var(--f7-navbar-large-title-height)), 0)`;
              }
              return `translate3d(${previousNavTranslate}px,0,0)`;
            };
          }
        });
      return els;
    }

    function setAnimatableNavElements({ progress, reset, transition } = {}) {
      const styles = ['overflow', 'transform', 'transform-origin', 'opacity'];
      for (let i = 0; i < animatableNavEls.length; i += 1) {
        const el = animatableNavEls[i];
        if (el && el.el) {
          if (transition === true) el.el.classList.add('navbar-page-transitioning');
          if (transition === false) el.el.classList.remove('navbar-page-transitioning');
          if (el.className && !el.classNameSet && !reset) {
            el.el.classList.add(el.className);
            el.classNameSet = true;
          }
          if (el.className && reset) {
            el.el.classList.remove(el.className);
          }
          for (let j = 0; j < styles.length; j += 1) {
            const styleProp = styles[j];
            if (el[styleProp]) {
              if (reset) {
                el.el.style[styleProp] = '';
              } else if (typeof el[styleProp] === 'function') {
                el.el.style[styleProp] = el[styleProp](progress);
              } else {
                el.el.style[styleProp] = el[styleProp];
              }
            }
          }
        }
      }
    }

    function handleTouchStart(e) {
      const swipeBackEnabled = params[`${app.theme}SwipeBack`];
      if (!allowViewTouchMove || !swipeBackEnabled || isTouched || (app.swipeout && app.swipeout.el) || !router.allowPageChange) return;
      if ($(e.target).closest('.range-slider, .calendar-months').length > 0) return;
      if ($(e.target).closest('.page-master, .page-master-detail').length > 0 && params.masterDetailBreakpoint > 0 && app.width >= params.masterDetailBreakpoint) return;
      isMoved = false;
      isTouched = true;
      isScrolling = undefined;
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchStartTime = Utils.now();
      dynamicNavbar = router.dynamicNavbar;
    }
    function handleTouchMove(e) {
      if (!isTouched) return;
      const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      const pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x)) || (pageX < touchesStart.x && !app.rtl) || (pageX > touchesStart.x && app.rtl);
      }
      if (isScrolling || e.f7PreventSwipeBack || app.preventSwipeBack) {
        isTouched = false;
        return;
      }
      if (!isMoved) {
        // Calc values during first move fired
        let cancel = false;
        const target = $(e.target);

        const swipeout = target.closest('.swipeout');
        if (swipeout.length > 0) {
          if (!app.rtl && swipeout.find('.swipeout-actions-left').length > 0) cancel = true;
          if (app.rtl && swipeout.find('.swipeout-actions-right').length > 0) cancel = true;
        }

        $currentPageEl = target.closest('.page');
        if ($currentPageEl.hasClass('no-swipeback') || target.closest('.no-swipeback, .card-opened').length > 0) cancel = true;
        $previousPageEl = $el.find('.page-previous:not(.stacked)');
        if ($previousPageEl.length > 1) {
          $previousPageEl = $previousPageEl.eq($previousPageEl.length - 1);
        }
        let notFromBorder = touchesStart.x - $el.offset().left > paramsSwipeBackActiveArea;
        viewContainerWidth = $el.width();
        if (app.rtl) {
          notFromBorder = touchesStart.x < ($el.offset().left - $el[0].scrollLeft) + (viewContainerWidth - paramsSwipeBackActiveArea);
        } else {
          notFromBorder = touchesStart.x - $el.offset().left > paramsSwipeBackActiveArea;
        }
        if (notFromBorder) cancel = true;
        if ($previousPageEl.length === 0 || $currentPageEl.length === 0) cancel = true;
        if (cancel) {
          isTouched = false;
          return;
        }

        if (paramsSwipeBackAnimateShadow) {
          $pageShadowEl = $currentPageEl.find('.page-shadow-effect');
          if ($pageShadowEl.length === 0) {
            $pageShadowEl = $('<div class="page-shadow-effect"></div>');
            $currentPageEl.append($pageShadowEl);
          }
        }
        if (paramsSwipeBackAnimateOpacity) {
          $pageOpacityEl = $previousPageEl.find('.page-opacity-effect');
          if ($pageOpacityEl.length === 0) {
            $pageOpacityEl = $('<div class="page-opacity-effect"></div>');
            $previousPageEl.append($pageOpacityEl);
          }
        }

        if (dynamicNavbar) {
          $currentNavbarEl = $navbarsEl.find('.navbar-current:not(.stacked)');
          $previousNavbarEl = $navbarsEl.find('.navbar-previous:not(.stacked)');
          if ($previousNavbarEl.length > 1) {
            $previousNavbarEl = $previousNavbarEl.eq($previousNavbarEl.length - 1);
          }

          animatableNavEls = animatableNavElements();
        }

        // Close/Hide Any Picker
        if ($('.sheet.modal-in').length > 0 && app.sheet) {
          app.sheet.close($('.sheet.modal-in'));
        }
      }
      e.f7PreventSwipePanel = true;
      isMoved = true;
      app.preventSwipePanelBySwipeBack = true;
      e.preventDefault();

      // RTL inverter
      const inverter = app.rtl ? -1 : 1;

      // Touches diff
      touchesDiff = (pageX - touchesStart.x - paramsSwipeBackThreshold) * inverter;
      if (touchesDiff < 0) touchesDiff = 0;
      const percentage = Math.min(Math.max(touchesDiff / viewContainerWidth, 0), 1);

      // Swipe Back Callback
      const callbackData = {
        percentage,
        progress: percentage,
        currentPageEl: $currentPageEl[0],
        previousPageEl: $previousPageEl[0],
        currentNavbarEl: $currentNavbarEl[0],
        previousNavbarEl: $previousNavbarEl[0],
      };
      $el.trigger('swipeback:move', callbackData);
      router.emit('swipebackMove', callbackData);

      // Transform pages
      let currentPageTranslate = touchesDiff * inverter;
      let previousPageTranslate = ((touchesDiff / 5) - (viewContainerWidth / 5)) * inverter;
      if (!app.rtl) {
        currentPageTranslate = Math.min(currentPageTranslate, viewContainerWidth);
        previousPageTranslate = Math.min(previousPageTranslate, 0);
      } else {
        currentPageTranslate = Math.max(currentPageTranslate, -viewContainerWidth);
        previousPageTranslate = Math.max(previousPageTranslate, 0);
      }
      if (Device.pixelRatio === 1) {
        currentPageTranslate = Math.round(currentPageTranslate);
        previousPageTranslate = Math.round(previousPageTranslate);
      }

      router.swipeBackActive = true;
      $([$currentPageEl[0], $previousPageEl[0]]).addClass('page-swipeback-active');

      $currentPageEl.transform(`translate3d(${currentPageTranslate}px,0,0)`);
      if (paramsSwipeBackAnimateShadow) $pageShadowEl[0].style.opacity = 1 - (1 * percentage);

      if (app.theme === 'ios') {
        $previousPageEl.transform(`translate3d(${previousPageTranslate}px,0,0)`);
      }
      if (paramsSwipeBackAnimateOpacity) $pageOpacityEl[0].style.opacity = 1 - (1 * percentage);

      // Dynamic Navbars Animation
      if (!dynamicNavbar) return;

      setAnimatableNavElements({ progress: percentage });
    }
    function handleTouchEnd() {
      app.preventSwipePanelBySwipeBack = false;
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;
      router.swipeBackActive = false;
      $([$currentPageEl[0], $previousPageEl[0]]).removeClass('page-swipeback-active');
      if (touchesDiff === 0) {
        $([$currentPageEl[0], $previousPageEl[0]]).transform('');
        if ($pageShadowEl && $pageShadowEl.length > 0) $pageShadowEl.remove();
        if ($pageOpacityEl && $pageOpacityEl.length > 0) $pageOpacityEl.remove();
        if (dynamicNavbar) {
          setAnimatableNavElements({ reset: true });
        }
        return;
      }
      const timeDiff = Utils.now() - touchStartTime;
      let pageChanged = false;
      // Swipe back to previous page
      if (
        (timeDiff < 300 && touchesDiff > 10)
        || (timeDiff >= 300 && touchesDiff > viewContainerWidth / 2)
      ) {
        $currentPageEl.removeClass('page-current').addClass(`page-next${app.theme !== 'ios' ? ' page-next-on-right' : ''}`);
        $previousPageEl.removeClass('page-previous').addClass('page-current').removeAttr('aria-hidden');
        if ($pageShadowEl) $pageShadowEl[0].style.opacity = '';
        if ($pageOpacityEl) $pageOpacityEl[0].style.opacity = '';
        if (dynamicNavbar) {
          router.setNavbarPosition($currentNavbarEl, 'next');
          router.setNavbarPosition($previousNavbarEl, 'current', false);
        }
        pageChanged = true;
      }
      // Reset custom styles
      // Add transitioning class for transition-duration
      $([$currentPageEl[0], $previousPageEl[0]]).addClass('page-transitioning page-transitioning-swipeback').transform('');

      if (dynamicNavbar) {
        setAnimatableNavElements({ progress: pageChanged ? 1 : 0, transition: true });
      }
      allowViewTouchMove = false;
      router.allowPageChange = false;

      // Swipe Back Callback
      const callbackData = {
        currentPageEl: $currentPageEl[0],
        previousPageEl: $previousPageEl[0],
        currentNavbarEl: $currentNavbarEl[0],
        previousNavbarEl: $previousNavbarEl[0],
      };

      if (pageChanged) {
        // Update Route
        router.currentRoute = $previousPageEl[0].f7Page.route;
        router.currentPage = $previousPageEl[0];

        // Page before animation callback
        router.pageCallback('beforeOut', $currentPageEl, $currentNavbarEl, 'current', 'next', { route: $currentPageEl[0].f7Page.route, swipeBack: true });
        router.pageCallback('beforeIn', $previousPageEl, $previousNavbarEl, 'previous', 'current', { route: $previousPageEl[0].f7Page.route, swipeBack: true }, $currentPageEl[0]);

        $el.trigger('swipeback:beforechange', callbackData);
        router.emit('swipebackBeforeChange', callbackData);
      } else {
        $el.trigger('swipeback:beforereset', callbackData);
        router.emit('swipebackBeforeReset', callbackData);
      }

      $currentPageEl.transitionEnd(() => {
        $([$currentPageEl[0], $previousPageEl[0]]).removeClass('page-transitioning page-transitioning-swipeback');
        if (dynamicNavbar) {
          setAnimatableNavElements({ reset: true, transition: false });
        }
        allowViewTouchMove = true;
        router.allowPageChange = true;
        if (pageChanged) {
          // Update History
          if (router.history.length === 1) {
            router.history.unshift(router.url);
          }
          router.history.pop();
          router.saveHistory();

          // Update push state
          if (params.pushState) {
            History.back();
          }

          // Page after animation callback
          router.pageCallback('afterOut', $currentPageEl, $currentNavbarEl, 'current', 'next', { route: $currentPageEl[0].f7Page.route, swipeBack: true });
          router.pageCallback('afterIn', $previousPageEl, $previousNavbarEl, 'previous', 'current', { route: $previousPageEl[0].f7Page.route, swipeBack: true });

          // Remove Old Page
          if (params.stackPages && router.initialPages.indexOf($currentPageEl[0]) >= 0) {
            $currentPageEl.addClass('stacked');
            if (dynamicNavbar) {
              $currentNavbarEl.addClass('stacked');
            }
          } else {
            router.pageCallback('beforeRemove', $currentPageEl, $currentNavbarEl, 'next', { swipeBack: true });
            router.removePage($currentPageEl);
            if (dynamicNavbar) {
              router.removeNavbar($currentNavbarEl);
            }
          }

          $el.trigger('swipeback:afterchange', callbackData);
          router.emit('swipebackAfterChange', callbackData);

          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

          if (params.preloadPreviousPage) {
            router.back(router.history[router.history.length - 2], { preload: true });
          }
        } else {
          $el.trigger('swipeback:afterreset', callbackData);
          router.emit('swipebackAfterReset', callbackData);
        }
        if ($pageShadowEl && $pageShadowEl.length > 0) $pageShadowEl.remove();
        if ($pageOpacityEl && $pageOpacityEl.length > 0) $pageOpacityEl.remove();
      });
    }

    function attachEvents() {
      const passiveListener = (app.touchEvents.start === 'touchstart' && Support.passiveListener) ? { passive: true, capture: false } : false;
      $el.on(app.touchEvents.start, handleTouchStart, passiveListener);
      app.on('touchmove:active', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
    }
    function detachEvents() {
      const passiveListener = (app.touchEvents.start === 'touchstart' && Support.passiveListener) ? { passive: true, capture: false } : false;
      $el.off(app.touchEvents.start, handleTouchStart, passiveListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
    }

    attachEvents();

    router.on('routerDestroy', detachEvents);
  }

  function redirect (direction, route, options) {
    const router = this;
    const redirect = route.route.redirect;
    if (options.initial && router.params.pushState) {
      options.replaceState = true; // eslint-disable-line
      options.history = true; // eslint-disable-line
    }
    function redirectResolve(redirectUrl, redirectOptions = {}) {
      router.allowPageChange = true;
      router[direction](redirectUrl, Utils.extend({}, options, redirectOptions));
    }
    function redirectReject() {
      router.allowPageChange = true;
    }
    if (typeof redirect === 'function') {
      router.allowPageChange = false;
      const redirectUrl = redirect.call(router, route, redirectResolve, redirectReject);
      if (redirectUrl && typeof redirectUrl === 'string') {
        router.allowPageChange = true;
        return router[direction](redirectUrl, options);
      }
      return router;
    }
    return router[direction](redirect, options);
  }

  function processQueue(router, routerQueue, routeQueue, to, from, resolve, reject) {
    const queue = [];

    if (Array.isArray(routeQueue)) {
      queue.push(...routeQueue);
    } else if (routeQueue && typeof routeQueue === 'function') {
      queue.push(routeQueue);
    }
    if (routerQueue) {
      if (Array.isArray(routerQueue)) {
        queue.push(...routerQueue);
      } else {
        queue.push(routerQueue);
      }
    }

    function next() {
      if (queue.length === 0) {
        resolve();
        return;
      }
      const queueItem = queue.shift();

      queueItem.call(
        router,
        to,
        from,
        () => {
          next();
        },
        () => {
          reject();
        }
      );
    }
    next();
  }

  function processRouteQueue (to, from, resolve, reject) {
    const router = this;
    function enterNextRoute() {
      if (to && to.route && (router.params.routesBeforeEnter || to.route.beforeEnter)) {
        router.allowPageChange = false;
        processQueue(
          router,
          router.params.routesBeforeEnter,
          to.route.beforeEnter,
          to,
          from,
          () => {
            router.allowPageChange = true;
            resolve();
          },
          () => {
            reject();
          },
        );
      } else {
        resolve();
      }
    }
    function leaveCurrentRoute() {
      if (from && from.route && (router.params.routesBeforeLeave || from.route.beforeLeave)) {
        router.allowPageChange = false;
        processQueue(
          router,
          router.params.routesBeforeLeave,
          from.route.beforeLeave,
          to,
          from,
          () => {
            router.allowPageChange = true;
            enterNextRoute();
          },
          () => {
            reject();
          },
        );
      } else {
        enterNextRoute();
      }
    }
    leaveCurrentRoute();
  }

  function appRouterCheck (router, method) {
    if (!router.view) {
      throw new Error(`Framework7: it is not allowed to use router methods on global app router. Use router methods only on related View, e.g. app.views.main.router.${method}(...)`);
    }
  }

  function asyncComponent (router, asyncComponent, resolve, reject) {
    function resolvePromise(componentPromise) {
      componentPromise
        .then((c) => {
          // eslint-disable-next-line
          resolve({ component: c.default || c._default || c });
        })
        .catch((err) => {
          reject();
          throw new Error(err);
        });
    }
    if (asyncComponent instanceof Promise) {
      resolvePromise(asyncComponent);
      return;
    }
    const asyncComponentResult = asyncComponent.call(router);
    if (asyncComponentResult instanceof Promise) {
      resolvePromise(asyncComponentResult);
    } else {
      resolve({ component: asyncComponentResult });
    }
  }

  function refreshPage() {
    const router = this;
    appRouterCheck(router, 'refreshPage');
    return router.navigate(router.currentRoute.url, {
      ignoreCache: true,
      reloadCurrent: true,
    });
  }

  function forward(el, forwardOptions = {}) {
    const router = this;
    const $el = $(el);
    const app = router.app;
    const view = router.view;
    const options = Utils.extend(false, {
      animate: router.params.animate,
      pushState: true,
      replaceState: false,
      history: true,
      reloadCurrent: router.params.reloadPages,
      reloadPrevious: false,
      reloadAll: false,
      clearPreviousHistory: false,
      reloadDetail: router.params.reloadDetail,
      on: {},
    }, forwardOptions);

    const masterDetailEnabled = router.params.masterDetailBreakpoint > 0;
    const isMaster = masterDetailEnabled && options.route && options.route.route && options.route.route.master === true;
    let masterPageEl;
    let otherDetailPageEl;

    let currentRouteIsModal = router.currentRoute.modal;
    let modalType;
    if (!currentRouteIsModal) {
      ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach((modalLoadProp) => {
        if (router.currentRoute && router.currentRoute.route && router.currentRoute.route[modalLoadProp]) {
          currentRouteIsModal = true;
          modalType = modalLoadProp;
        }
      });
    }

    if (currentRouteIsModal) {
      const modalToClose = router.currentRoute.modal
                           || router.currentRoute.route.modalInstance
                           || app[modalType].get();
      const previousUrl = router.history[router.history.length - 2];
      let previousRoute = router.findMatchingRoute(previousUrl);
      if (!previousRoute && previousUrl) {
        previousRoute = {
          url: previousUrl,
          path: previousUrl.split('?')[0],
          query: Utils.parseUrlQuery(previousUrl),
          route: {
            path: previousUrl.split('?')[0],
            url: previousUrl,
          },
        };
      }

      router.modalRemove(modalToClose);
    }

    const dynamicNavbar = router.dynamicNavbar;

    const $viewEl = router.$el;
    const $newPage = $el;
    const reload = options.reloadPrevious || options.reloadCurrent || options.reloadAll;
    let $oldPage;

    let $navbarsEl;
    let $newNavbarEl;
    let $oldNavbarEl;

    router.allowPageChange = false;
    if ($newPage.length === 0) {
      router.allowPageChange = true;
      return router;
    }

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    if (dynamicNavbar) {
      $newNavbarEl = $newPage.children('.navbar');
      $navbarsEl = router.$navbarsEl;
      if ($newNavbarEl.length === 0 && $newPage[0] && $newPage[0].f7Page) {
        // Try from pageData
        $newNavbarEl = $newPage[0].f7Page.$navbarEl;
      }
    }

    // Save Keep Alive Cache
    if (options.route && options.route.route && options.route.route.keepAlive && !options.route.route.keepAliveData) {
      options.route.route.keepAliveData = {
        pageEl: $el[0],
      };
    }

    // Pages In View
    const $pagesInView = $viewEl
      .children('.page:not(.stacked)')
      .filter((index, pageInView) => pageInView !== $newPage[0]);

    // Navbars In View
    let $navbarsInView;
    if (dynamicNavbar) {
      $navbarsInView = $navbarsEl
        .children('.navbar:not(.stacked)')
        .filter((index, navbarInView) => navbarInView !== $newNavbarEl[0]);
    }

    // Exit when reload previous and only 1 page in view so nothing ro reload
    if (options.reloadPrevious && $pagesInView.length < 2) {
      router.allowPageChange = true;
      return router;
    }

    // Find Detail' master page
    let isDetail;
    let reloadDetail;
    let isDetailRoot;
    if (masterDetailEnabled && !options.reloadAll) {
      for (let i = 0; i < $pagesInView.length; i += 1) {
        if (!masterPageEl
          && $pagesInView[i].classList.contains('page-master')
        ) {
          masterPageEl = $pagesInView[i];
          continue; // eslint-disable-line
        }
      }
      isDetail = !isMaster && masterPageEl;

      if (isDetail) {
        // Find Other Detail
        if (masterPageEl) {
          for (let i = 0; i < $pagesInView.length; i += 1) {
            if ($pagesInView[i].classList.contains('page-master-detail')
            ) {
              otherDetailPageEl = $pagesInView[i];
              continue; // eslint-disable-line
            }
          }
        }
      }
      reloadDetail = isDetail && options.reloadDetail && app.width >= router.params.masterDetailBreakpoint && masterPageEl;
    }
    if (isDetail) {
      isDetailRoot = !otherDetailPageEl || reloadDetail || options.reloadAll || options.reloadCurrent;
    }

    // New Page
    let newPagePosition = 'next';
    if (options.reloadCurrent || options.reloadAll || reloadDetail) {
      newPagePosition = 'current';
    } else if (options.reloadPrevious) {
      newPagePosition = 'previous';
    }
    $newPage
      .removeClass('page-previous page-current page-next')
      .addClass(`page-${newPagePosition}${isMaster ? ' page-master' : ''}${isDetail ? ' page-master-detail' : ''}${isDetailRoot ? ' page-master-detail-root' : ''}`)
      .removeClass('stacked')
      .trigger('page:unstack')
      .trigger('page:position', { position: newPagePosition });
    router.emit('pageUnstack', $newPage[0]);
    router.emit('pagePosition', $newPage[0], newPagePosition);

    if (isMaster || isDetail) {
      $newPage.trigger('page:role', { role: isMaster ? 'master' : 'detail', root: !!isDetailRoot });
      router.emit('pageRole', $newPage[0], { role: isMaster ? 'master' : 'detail', detailRoot: !!isDetailRoot });
    }

    if (dynamicNavbar && $newNavbarEl.length) {
      $newNavbarEl
        .removeClass('navbar-previous navbar-current navbar-next')
        .addClass(`navbar-${newPagePosition}${isMaster ? ' navbar-master' : ''}${isDetail ? ' navbar-master-detail' : ''}${isDetailRoot ? ' navbar-master-detail-root' : ''}`)
        .removeClass('stacked');
      $newNavbarEl.trigger('navbar:position', { position: newPagePosition });
      router.emit('navbarPosition', $newNavbarEl[0], newPagePosition);
      if (isMaster || isDetail) {
        router.emit('navbarRole', $newNavbarEl[0], { role: isMaster ? 'master' : 'detail', detailRoot: !!isDetailRoot });
      }
    }

    // Find Old Page
    if (options.reloadCurrent || reloadDetail) {
      $oldPage = $pagesInView.eq($pagesInView.length - 1);
      if (dynamicNavbar) {
        // $oldNavbarEl = $navbarsInView.eq($pagesInView.length - 1);
        $oldNavbarEl = $(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadPrevious) {
      $oldPage = $pagesInView.eq($pagesInView.length - 2);
      if (dynamicNavbar) {
        // $oldNavbarEl = $navbarsInView.eq($pagesInView.length - 2);
        $oldNavbarEl = $(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadAll) {
      $oldPage = $pagesInView.filter((index, pageEl) => pageEl !== $newPage[0]);
      if (dynamicNavbar) {
        $oldNavbarEl = $navbarsInView.filter((index, navbarEl) => navbarEl !== $newNavbarEl[0]);
      }
    } else {
      let removedPageEls = [];
      let removedNavbarEls = [];
      if ($pagesInView.length > 1) {
        let i = 0;
        for (i = 0; i < $pagesInView.length - 1; i += 1) {
          if (masterPageEl
            && $pagesInView[i] === masterPageEl
          ) {
            $pagesInView.eq(i).addClass('page-master-stacked');
            $pagesInView.eq(i).trigger('page:masterstack');
            router.emit('pageMasterStack', $pagesInView[i]);
            if (dynamicNavbar) {
              $(app.navbar.getElByPage(masterPageEl)).addClass('navbar-master-stacked');
              router.emit('navbarMasterStack', app.navbar.getElByPage(masterPageEl));
            }
            continue; // eslint-disable-line
          }
          const oldNavbarEl = app.navbar.getElByPage($pagesInView.eq(i));
          if (router.params.stackPages) {
            $pagesInView.eq(i).addClass('stacked');
            $pagesInView.eq(i).trigger('page:stack');
            router.emit('pageStack', $pagesInView[i]);
            if (dynamicNavbar) {
              $(oldNavbarEl).addClass('stacked');
            }
          } else {
            // Page remove event
            removedPageEls.push($pagesInView[i]);
            router.pageCallback('beforeRemove', $pagesInView[i], $navbarsInView && $navbarsInView[i], 'previous', undefined, options);
            router.removePage($pagesInView[i]);
            if (dynamicNavbar && oldNavbarEl) {
              removedNavbarEls.push(oldNavbarEl);
              router.removeNavbar(oldNavbarEl);
            }
          }
        }
      }
      $oldPage = $viewEl
        .children('.page:not(.stacked)')
        .filter((index, pageEl) => pageEl !== $newPage[0] && removedPageEls.indexOf(pageEl) < 0);
      if (dynamicNavbar) {
        $oldNavbarEl = $navbarsEl
          .children('.navbar:not(.stacked)')
          .filter((index, navbarEl) => navbarEl !== $newNavbarEl[0] && removedNavbarEls.indexOf(removedNavbarEls) < 0);
      }
      removedPageEls = [];
      removedNavbarEls = [];
    }

    if (isDetail && !options.reloadAll) {
      if ($oldPage.length > 1 || reloadDetail) {
        $oldPage = $oldPage.filter((pageIndex, pageEl) => !pageEl.classList.contains('page-master'));
      }
      if ($oldNavbarEl && ($oldNavbarEl.length > 1 || reloadDetail)) {
        $oldNavbarEl = $oldNavbarEl.filter((navbarIndex, navbarEl) => !navbarEl.classList.contains('navbar-master'));
      }
    }

    // Push State
    if (router.params.pushState && (options.pushState || options.replaceState) && !options.reloadPrevious) {
      const pushStateRoot = router.params.pushStateRoot || '';
      History[options.reloadCurrent || (reloadDetail && otherDetailPageEl) || options.reloadAll || options.replaceState ? 'replace' : 'push'](
        view.id,
        {
          url: options.route.url,
        },
        pushStateRoot + router.params.pushStateSeparator + options.route.url
      );
    }

    if (!options.reloadPrevious) {
      // Current Page & Navbar
      router.currentPageEl = $newPage[0];
      if (dynamicNavbar && $newNavbarEl.length) {
        router.currentNavbarEl = $newNavbarEl[0];
      } else {
        delete router.currentNavbarEl;
      }

      // Current Route
      router.currentRoute = options.route;
    }

    // Update router history
    const url = options.route.url;

    if (options.history) {
      if (((options.reloadCurrent || (reloadDetail && otherDetailPageEl)) && router.history.length) > 0 || options.replaceState) {
        router.history[router.history.length - (options.reloadPrevious ? 2 : 1)] = url;
      } else if (options.reloadPrevious) {
        router.history[router.history.length - 2] = url;
      } else if (options.reloadAll) {
        router.history = [url];
      } else {
        router.history.push(url);
      }
    }
    router.saveHistory();

    // Insert new page and navbar
    const newPageInDom = $newPage.parents(doc).length > 0;
    const f7Component = $newPage[0].f7Component;
    if (options.reloadPrevious) {
      if (f7Component && !newPageInDom) {
        f7Component.$mount((componentEl) => {
          $(componentEl).insertBefore($oldPage);
        });
      } else {
        $newPage.insertBefore($oldPage);
      }
      if (dynamicNavbar && $newNavbarEl.length) {
        if ($newNavbarEl.find('.title-large').length) {
          $newNavbarEl.addClass('navbar-large');
        }
        if ($oldNavbarEl.length) {
          $newNavbarEl.insertBefore($oldNavbarEl);
        } else {
          if (!router.$navbarsEl.parents(doc).length) {
            router.$el.prepend(router.$navbarsEl);
          }
          $navbarsEl.append($newNavbarEl);
        }
      }
    } else {
      if ($oldPage.next('.page')[0] !== $newPage[0]) {
        if (f7Component && !newPageInDom) {
          f7Component.$mount((componentEl) => {
            $viewEl.append(componentEl);
          });
        } else {
          $viewEl.append($newPage[0]);
        }
      }
      if (dynamicNavbar && $newNavbarEl.length) {
        if ($newNavbarEl.find('.title-large').length) {
          $newNavbarEl.addClass('navbar-large');
        }
        if (!router.$navbarsEl.parents(doc).length) {
          router.$el.prepend(router.$navbarsEl);
        }
        $navbarsEl.append($newNavbarEl[0]);
      }
    }
    if (!newPageInDom) {
      router.pageCallback('mounted', $newPage, $newNavbarEl, newPagePosition, (reload ? newPagePosition : 'current'), options, $oldPage);
    } else if (options.route && options.route.route && options.route.route.keepAlive && !$newPage[0].f7PageMounted) {
      $newPage[0].f7PageMounted = true;
      router.pageCallback('mounted', $newPage, $newNavbarEl, newPagePosition, (reload ? newPagePosition : 'current'), options, $oldPage);
    }

    // Remove old page
    if ((options.reloadCurrent || reloadDetail) && $oldPage.length > 0) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        $oldPage.trigger('page:stack');
        router.emit('pageStack', $oldPage[0]);
        if (dynamicNavbar) {
          $oldNavbarEl.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeOut', $oldPage, $oldNavbarEl, 'current', undefined, options);
        router.pageCallback('afterOut', $oldPage, $oldNavbarEl, 'current', undefined, options);
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarEl, 'current', undefined, options);
        router.removePage($oldPage);
        if (dynamicNavbar && $oldNavbarEl && $oldNavbarEl.length) {
          router.removeNavbar($oldNavbarEl);
        }
      }
    } else if (options.reloadAll) {
      $oldPage.each((index, pageEl) => {
        const $oldPageEl = $(pageEl);
        const $oldNavbarElEl = $(app.navbar.getElByPage($oldPageEl));
        if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
          $oldPageEl.addClass('stacked');
          $oldPageEl.trigger('page:stack');
          router.emit('pageStack', $oldPageEl[0]);
          if (dynamicNavbar) {
            $oldNavbarElEl.addClass('stacked');
          }
        } else {
          // Page remove event
          if ($oldPageEl.hasClass('page-current')) {
            router.pageCallback('beforeOut', $oldPage, $oldNavbarEl, 'current', undefined, options);
            router.pageCallback('afterOut', $oldPage, $oldNavbarEl, 'current', undefined, options);
          }
          router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarEl && $oldNavbarEl.eq(index), 'previous', undefined, options);
          router.removePage($oldPageEl);
          if (dynamicNavbar && $oldNavbarElEl.length) {
            router.removeNavbar($oldNavbarElEl);
          }
        }
      });
    } else if (options.reloadPrevious) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        $oldPage.trigger('page:stack');
        router.emit('pageStack', $oldPage[0]);
        if (dynamicNavbar) {
          $oldNavbarEl.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarEl, 'previous', undefined, options);
        router.removePage($oldPage);
        if (dynamicNavbar && $oldNavbarEl && $oldNavbarEl.length) {
          router.removeNavbar($oldNavbarEl);
        }
      }
    }

    // Load Tab
    if (options.route.route.tab) {
      router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
        history: false,
        pushState: false,
      }));
    }

    // Check master detail
    if (masterDetailEnabled) {
      view.checkMasterDetailBreakpoint();
    }

    // Page init and before init events
    router.pageCallback('init', $newPage, $newNavbarEl, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);

    if (options.reloadCurrent || options.reloadAll || reloadDetail) {
      router.allowPageChange = true;
      router.pageCallback('beforeIn', $newPage, $newNavbarEl, newPagePosition, 'current', options);
      $newPage.removeAttr('aria-hidden');
      if (dynamicNavbar && $newNavbarEl) {
        $newNavbarEl.removeAttr('aria-hidden');
      }
      router.pageCallback('afterIn', $newPage, $newNavbarEl, newPagePosition, 'current', options);
      if (options.reloadCurrent && options.clearPreviousHistory) router.clearPreviousHistory();
      if (reloadDetail) {
        router.setPagePosition($(masterPageEl), 'previous');
        if (masterPageEl.f7Page && masterPageEl.f7Page.navbarEl) {
          router.setNavbarPosition($(masterPageEl.f7Page.navbarEl), 'previous');
        }
      }
      return router;
    }
    if (options.reloadPrevious) {
      router.allowPageChange = true;
      return router;
    }

    // Before animation event
    router.pageCallback('beforeOut', $oldPage, $oldNavbarEl, 'current', 'previous', options);
    router.pageCallback('beforeIn', $newPage, $newNavbarEl, 'next', 'current', options);

    // Animation
    function afterAnimation() {
      router.setPagePosition($newPage, 'current', false);
      router.setPagePosition($oldPage, 'previous', !$oldPage.hasClass('page-master'));
      if (dynamicNavbar) {
        router.setNavbarPosition($newNavbarEl, 'current', false);
        router.setNavbarPosition($oldNavbarEl, 'previous', !$oldNavbarEl.hasClass('navbar-master'));
      }
      // After animation event
      router.allowPageChange = true;
      router.pageCallback('afterOut', $oldPage, $oldNavbarEl, 'current', 'previous', options);
      router.pageCallback('afterIn', $newPage, $newNavbarEl, 'next', 'current', options);

      let keepOldPage = (router.params.preloadPreviousPage || router.params[`${app.theme}SwipeBack`]) && !isMaster;
      if (!keepOldPage) {
        if ($newPage.hasClass('smart-select-page') || $newPage.hasClass('photo-browser-page') || $newPage.hasClass('autocomplete-page') || $newPage.hasClass('color-picker-page')) {
          keepOldPage = true;
        }
      }
      if (!keepOldPage) {
        if (router.params.stackPages) {
          $oldPage.addClass('stacked');
          $oldPage.trigger('page:stack');
          router.emit('pageStack', $oldPage[0]);
          if (dynamicNavbar) {
            $oldNavbarEl.addClass('stacked');
          }
        } else if (!($newPage.attr('data-name') && $newPage.attr('data-name') === 'smart-select-page')) {
          // Remove event
          router.pageCallback('beforeRemove', $oldPage, $oldNavbarEl, 'previous', undefined, options);
          router.removePage($oldPage);
          if (dynamicNavbar && $oldNavbarEl.length) {
            router.removeNavbar($oldNavbarEl);
          }
        }
      }
      if (options.clearPreviousHistory) router.clearPreviousHistory();
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      if (router.params.pushState) {
        History.clearRouterQueue();
      }
    }
    function setPositionClasses() {
      router.setPagePosition($oldPage, 'current', false);
      router.setPagePosition($newPage, 'next', false);
      if (dynamicNavbar) {
        router.setNavbarPosition($oldNavbarEl, 'current', false);
        router.setNavbarPosition($newNavbarEl, 'next', false);
      }
    }
    if (options.animate && !(isMaster && app.width >= router.params.masterDetailBreakpoint)) {
      const delay = router.params[`${router.app.theme}PageLoadDelay`];
      let transition = router.params.transition;
      if (options.transition) transition = options.transition;
      if (!transition && router.currentRoute && router.currentRoute.route) {
        transition = router.currentRoute.route.transition;
      }
      if (!transition && router.currentRoute && router.currentRoute.route.options) {
        transition = router.currentRoute.route.options.transition;
      }
      if (transition) {
        $newPage[0].f7PageTransition = transition;
      }

      if (delay) {
        setTimeout(() => {
          setPositionClasses();
          router.animate($oldPage, $newPage, $oldNavbarEl, $newNavbarEl, 'forward', transition, () => {
            afterAnimation();
          });
        }, delay);
      } else {
        setPositionClasses();
        router.animate($oldPage, $newPage, $oldNavbarEl, $newNavbarEl, 'forward', transition, () => {
          afterAnimation();
        });
      }
    } else {
      afterAnimation();
    }
    return router;
  }
  function load(loadParams = {}, loadOptions = {}, ignorePageChange) {
    const router = this;
    if (!router.allowPageChange && !ignorePageChange) return router;
    const params = loadParams;
    const options = loadOptions;
    const { url, content, el, pageName, template, templateUrl, component, componentUrl } = params;

    if (!options.reloadCurrent
      && options.route
      && options.route.route
      && options.route.route.parentPath
      && router.currentRoute.route
      && router.currentRoute.route.parentPath === options.route.route.parentPath) {
      // Do something nested
      if (options.route.url === router.url) {
        router.allowPageChange = true;
        return false;
      }
      // Check for same params
      let sameParams = Object.keys(options.route.params).length === Object.keys(router.currentRoute.params).length;
      if (sameParams) {
        // Check for equal params name
        Object.keys(options.route.params).forEach((paramName) => {
          if (
            !(paramName in router.currentRoute.params)
            || (router.currentRoute.params[paramName] !== options.route.params[paramName])
          ) {
            sameParams = false;
          }
        });
      }
      if (sameParams) {
        if (options.route.route.tab) {
          return router.tabLoad(options.route.route.tab, options);
        }
        return false;
      }
      if (!sameParams
        && options.route.route.tab
        && router.currentRoute.route.tab
        && router.currentRoute.parentPath === options.route.parentPath
      ) {
        return router.tabLoad(options.route.route.tab, options);
      }
    }

    if (
      options.route
      && options.route.url
      && router.url === options.route.url
      && !(options.reloadCurrent || options.reloadPrevious)
      && !router.params.allowDuplicateUrls
    ) {
      router.allowPageChange = true;
      return false;
    }

    if (!options.route && url) {
      options.route = router.parseRouteUrl(url);
      Utils.extend(options.route, { route: { url, path: url } });
    }

    // Component Callbacks
    function resolve(pageEl, newOptions) {
      return router.forward(pageEl, Utils.extend(options, newOptions));
    }
    function reject() {
      router.allowPageChange = true;
      return router;
    }

    if (url || templateUrl || componentUrl || component) {
      router.allowPageChange = false;
    }

    // Proceed
    if (content) {
      router.forward(router.getPageEl(content), options);
    } else if (template || templateUrl) {
      // Parse template and send page element
      try {
        router.pageTemplateLoader(template, templateUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (el) {
      // Load page from specified HTMLElement or by page name in pages container
      router.forward(router.getPageEl(el), options);
    } else if (pageName) {
      // Load page by page name in pages container
      router.forward(router.$el.children(`.page[data-name="${pageName}"]`).eq(0), options);
    } else if (component || componentUrl) {
      // Load from component (F7/Vue/React/...)
      try {
        router.pageComponentLoader(router.el, component, componentUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (url) {
      // Load using XHR
      if (router.xhr) {
        router.xhr.abort();
        router.xhr = false;
      }
      router.xhrRequest(url, options)
        .then((pageContent) => {
          router.forward(router.getPageEl(pageContent), options);
        })
        .catch(() => {
          router.allowPageChange = true;
        });
    }
    return router;
  }
  function navigate(navigateParams, navigateOptions = {}) {
    const router = this;
    if (router.swipeBackActive) return router;
    let url;
    let createRoute;
    let name;
    let path;
    let query;
    let params;
    let route;
    if (typeof navigateParams === 'string') {
      url = navigateParams;
    } else {
      url = navigateParams.url;
      createRoute = navigateParams.route;
      name = navigateParams.name;
      path = navigateParams.path;
      query = navigateParams.query;
      params = navigateParams.params;
    }
    if (name || path) {
      url = router.generateUrl({ path, name, params, query });
      if (url) {
        return router.navigate(url, navigateOptions);
      }
      return router;
    }
    const app = router.app;
    appRouterCheck(router, 'navigate');
    if (url === '#' || url === '') {
      return router;
    }

    let navigateUrl = url.replace('./', '');
    if (navigateUrl[0] !== '/' && navigateUrl.indexOf('#') !== 0) {
      const currentPath = router.currentRoute.parentPath || router.currentRoute.path;
      navigateUrl = ((currentPath ? `${currentPath}/` : '/') + navigateUrl)
        .replace('///', '/')
        .replace('//', '/');
    }
    if (createRoute) {
      route = Utils.extend(router.parseRouteUrl(navigateUrl), {
        route: Utils.extend({}, createRoute),
      });
    } else {
      route = router.findMatchingRoute(navigateUrl);
    }

    if (!route) {
      return router;
    }
    if (route.route && route.route.viewName) {
      const anotherViewName = route.route.viewName;
      const anotherView = app.views[anotherViewName];
      if (!anotherView) {
        throw new Error(`Framework7: There is no View with "${anotherViewName}" name that was specified in this route`);
      }
      if (anotherView !== router.view) {
        return anotherView.router.navigate(navigateParams, navigateOptions);
      }
    }

    if (route.route.redirect) {
      return redirect.call(router, 'navigate', route, navigateOptions);
    }


    const options = {};
    if (route.route.options) {
      Utils.extend(options, route.route.options, navigateOptions);
    } else {
      Utils.extend(options, navigateOptions);
    }
    options.route = route;

    if (options && options.context) {
      route.context = options.context;
      options.route.context = options.context;
    }

    function resolve() {
      let routerLoaded = false;
      ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach((modalLoadProp) => {
        if (route.route[modalLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.modalLoad(modalLoadProp, route, options);
        }
      });
      if (route.route.keepAlive && route.route.keepAliveData) {
        router.load({ el: route.route.keepAliveData.pageEl }, options, false);
        routerLoaded = true;
      }
      ('url content component pageName el componentUrl template templateUrl').split(' ').forEach((pageLoadProp) => {
        if (route.route[pageLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.load({ [pageLoadProp]: route.route[pageLoadProp] }, options, false);
        }
      });
      if (routerLoaded) return;
      // Async
      function asyncResolve(resolveParams, resolveOptions) {
        router.allowPageChange = false;
        let resolvedAsModal = false;
        if (resolveOptions && resolveOptions.context) {
          if (!route.context) route.context = resolveOptions.context;
          else route.context = Utils.extend({}, route.context, resolveOptions.context);
          options.route.context = route.context;
        }
        ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach((modalLoadProp) => {
          if (resolveParams[modalLoadProp]) {
            resolvedAsModal = true;
            const modalRoute = Utils.extend({}, route, { route: resolveParams });
            router.allowPageChange = true;
            router.modalLoad(modalLoadProp, modalRoute, Utils.extend(options, resolveOptions));
          }
        });
        if (resolvedAsModal) return;
        router.load(resolveParams, Utils.extend(options, resolveOptions), true);
      }
      function asyncReject() {
        router.allowPageChange = true;
      }
      if (route.route.async) {
        router.allowPageChange = false;
        route.route.async.call(router, options.route, router.currentRoute, asyncResolve, asyncReject);
      }
      if (route.route.asyncComponent) {
        asyncComponent(router, route.route.asyncComponent, asyncResolve, asyncReject);
      }
    }
    function reject() {
      router.allowPageChange = true;
    }

    if (router.params.masterDetailBreakpoint > 0 && route.route.masterRoute) {
      // load detail route
      let preloadMaster = true;
      let masterLoaded = false;
      if (router.currentRoute && router.currentRoute.route) {
        if (
          router.currentRoute.route.master
          && (
            router.currentRoute.route === route.route.masterRoute
            || router.currentRoute.route.path === route.route.masterRoute.path
          )
        ) {
          preloadMaster = false;
        }
        if (
          router.currentRoute.route.masterRoute
          && (router.currentRoute.route.masterRoute === route.route.masterRoute
            || router.currentRoute.route.masterRoute.path === route.route.masterRoute.path
          )
        ) {
          preloadMaster = false;
          masterLoaded = true;
        }
      }
      if (preloadMaster || (masterLoaded && navigateOptions.reloadAll)) {
        router.navigate({ path: route.route.masterRoute.path, params: route.params || {} }, {
          animate: false,
          reloadAll: navigateOptions.reloadAll,
          reloadCurrent: navigateOptions.reloadCurrent,
          reloadPrevious: navigateOptions.reloadPrevious,
          pushState: !navigateOptions.initial,
          history: !navigateOptions.initial,
          once: {
            pageAfterIn() {
              router.navigate(navigateParams, Utils.extend({}, navigateOptions, {
                animate: false,
                reloadAll: false,
                reloadCurrent: false,
                reloadPrevious: false,
                history: !navigateOptions.initial,
                pushState: !navigateOptions.initial,
              }));
            },
          },
        });
        return router;
      }
    }

    processRouteQueue.call(
      router,
      route,
      router.currentRoute,
      () => {
        if (route.route.modules) {
          app
            .loadModules(Array.isArray(route.route.modules) ? route.route.modules : [route.route.modules])
            .then(() => {
              resolve();
            })
            .catch(() => {
              reject();
            });
        } else {
          resolve();
        }
      },
      () => {
        reject();
      },
    );

    // Return Router
    return router;
  }

  function tabLoad(tabRoute, loadOptions = {}) {
    const router = this;
    const options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      history: true,
      parentPageEl: null,
      preload: false,
      on: {},
    }, loadOptions);

    let currentRoute;
    let previousRoute;
    if (options.route) {
      // Set Route
      if (!options.preload && options.route !== router.currentRoute) {
        previousRoute = router.previousRoute;
        router.currentRoute = options.route;
      }
      if (options.preload) {
        currentRoute = options.route;
        previousRoute = router.currentRoute;
      } else {
        currentRoute = router.currentRoute;
        if (!previousRoute) previousRoute = router.previousRoute;
      }

      // Update Browser History
      if (router.params.pushState && options.pushState && !options.reloadPrevious) {
        History.replace(
          router.view.id,
          {
            url: options.route.url,
          },
          (router.params.pushStateRoot || '') + router.params.pushStateSeparator + options.route.url
        );
      }

      // Update Router History
      if (options.history) {
        router.history[Math.max(router.history.length - 1, 0)] = options.route.url;
        router.saveHistory();
      }
    }

    // Show Tab
    const $parentPageEl = $(options.parentPageEl || router.currentPageEl);
    let tabEl;
    if ($parentPageEl.length && $parentPageEl.find(`#${tabRoute.id}`).length) {
      tabEl = $parentPageEl.find(`#${tabRoute.id}`).eq(0);
    } else if (router.view.selector) {
      tabEl = `${router.view.selector} #${tabRoute.id}`;
    } else {
      tabEl = `#${tabRoute.id}`;
    }
    const tabShowResult = router.app.tab.show({
      tabEl,
      animate: options.animate,
      tabRoute: options.route,
    });

    const { $newTabEl, $oldTabEl, animated, onTabsChanged } = tabShowResult;

    if ($newTabEl && $newTabEl.parents('.page').length > 0 && options.route) {
      const tabParentPageData = $newTabEl.parents('.page')[0].f7Page;
      if (tabParentPageData && options.route) {
        tabParentPageData.route = options.route;
      }
    }

    // Tab Content Loaded
    function onTabLoaded(contentEl) {
      // Remove theme elements
      router.removeThemeElements($newTabEl);

      let tabEventTarget = $newTabEl;
      if (typeof contentEl !== 'string') tabEventTarget = $(contentEl);

      tabEventTarget.trigger('tab:init tab:mounted', tabRoute);
      router.emit('tabInit tabMounted', $newTabEl[0], tabRoute);

      if ($oldTabEl && $oldTabEl.length) {
        if (animated) {
          onTabsChanged(() => {
            router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
            if (router.params.unloadTabContent) {
              router.tabRemove($oldTabEl, $newTabEl, tabRoute);
            }
          });
        } else {
          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
          if (router.params.unloadTabContent) {
            router.tabRemove($oldTabEl, $newTabEl, tabRoute);
          }
        }
      }
    }

    if ($newTabEl[0].f7RouterTabLoaded) {
      if (!$oldTabEl || !$oldTabEl.length) return router;
      if (animated) {
        onTabsChanged(() => {
          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
        });
      } else {
        router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
      }
      return router;
    }

    // Load Tab Content
    function loadTab(loadTabParams, loadTabOptions) {
      // Load Tab Props
      const { url, content, el, template, templateUrl, component, componentUrl } = loadTabParams;
      // Component/Template Callbacks
      function resolve(contentEl) {
        router.allowPageChange = true;
        if (!contentEl) return;
        if (typeof contentEl === 'string') {
          $newTabEl.html(contentEl);
        } else {
          $newTabEl.html('');
          if (contentEl.f7Component) {
            contentEl.f7Component.$mount((componentEl) => {
              $newTabEl.append(componentEl);
            });
          } else {
            $newTabEl.append(contentEl);
          }
        }
        $newTabEl[0].f7RouterTabLoaded = true;
        onTabLoaded(contentEl);
      }
      function reject() {
        router.allowPageChange = true;
        return router;
      }

      if (content) {
        resolve(content);
      } else if (template || templateUrl) {
        try {
          router.tabTemplateLoader(template, templateUrl, loadTabOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (el) {
        resolve(el);
      } else if (component || componentUrl) {
        // Load from component (F7/Vue/React/...)
        try {
          router.tabComponentLoader($newTabEl[0], component, componentUrl, loadTabOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (url) {
        // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router.xhrRequest(url, loadTabOptions)
          .then((tabContent) => {
            resolve(tabContent);
          })
          .catch(() => {
            router.allowPageChange = true;
          });
      }
    }

    let hasContentLoadProp;
    ('url content component el componentUrl template templateUrl').split(' ').forEach((tabLoadProp) => {
      if (tabRoute[tabLoadProp]) {
        hasContentLoadProp = true;
        loadTab({ [tabLoadProp]: tabRoute[tabLoadProp] }, options);
      }
    });

    // Async
    function asyncResolve(resolveParams, resolveOptions) {
      loadTab(resolveParams, Utils.extend(options, resolveOptions));
    }
    function asyncReject() {
      router.allowPageChange = true;
    }
    if (tabRoute.async) {
      tabRoute.async.call(router, currentRoute, previousRoute, asyncResolve, asyncReject);
    } else if (tabRoute.asyncComponent) {
      asyncComponent(router, tabRoute.asyncComponent, asyncResolve, asyncReject);
    } else if (!hasContentLoadProp) {
      router.allowPageChange = true;
    }

    return router;
  }
  function tabRemove($oldTabEl, $newTabEl, tabRoute) {
    const router = this;

    let hasTabComponentChild;
    if ($oldTabEl[0]) {
      $oldTabEl[0].f7RouterTabLoaded = false;
      delete $oldTabEl[0].f7RouterTabLoaded;
    }
    $oldTabEl.children().each((index, tabChild) => {
      if (tabChild.f7Component) {
        hasTabComponentChild = true;
        $(tabChild).trigger('tab:beforeremove', tabRoute);
        tabChild.f7Component.$destroy();
      }
    });
    if (!hasTabComponentChild) {
      $oldTabEl.trigger('tab:beforeremove', tabRoute);
    }
    router.emit('tabBeforeRemove', $oldTabEl[0], $newTabEl[0], tabRoute);
    router.removeTabContent($oldTabEl[0], tabRoute);
  }

  function modalLoad(modalType, route, loadOptions = {}) {
    const router = this;
    const app = router.app;
    const isPanel = modalType === 'panel';
    const modalOrPanel = isPanel ? 'panel' : 'modal';

    const options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      history: true,
      on: {},
    }, loadOptions);

    const modalParams = Utils.extend({}, route.route[modalType]);
    const modalRoute = route.route;

    function onModalLoaded() {
      // Create Modal
      const modal = app[modalType].create(modalParams);
      modalRoute.modalInstance = modal;

      const hasEl = modal.el;

      function closeOnSwipeBack() {
        modal.close();
      }
      modal.on(`${modalOrPanel}Open`, () => {
        if (!hasEl) {
          // Remove theme elements
          router.removeThemeElements(modal.el);

          // Emit events
          modal.$el.trigger(`${modalType.toLowerCase()}:init ${modalType.toLowerCase()}:mounted`, route, modal);
          router.emit(`${!isPanel ? 'modalInit' : ''} ${modalType}Init ${modalType}Mounted`, modal.el, route, modal);
        }
        router.once('swipeBackMove', closeOnSwipeBack);
      });
      modal.on(`${modalOrPanel}Close`, () => {
        router.off('swipeBackMove', closeOnSwipeBack);
        if (!modal.closeByRouter) {
          router.back();
        }
      });

      modal.on(`${modalOrPanel}Closed`, () => {
        modal.$el.trigger(`${modalType.toLowerCase()}:beforeremove`, route, modal);
        modal.emit(`${!isPanel ? 'modalBeforeRemove ' : ''}${modalType}BeforeRemove`, modal.el, route, modal);
        const modalComponent = modal.el.f7Component;
        if (modalComponent) {
          modalComponent.$destroy();
        }
        Utils.nextTick(() => {
          if (modalComponent || modalParams.component) {
            router.removeModal(modal.el);
          }
          modal.destroy();
          delete modal.route;
          delete modalRoute.modalInstance;
        });
      });

      if (options.route) {
        // Update Browser History
        if (router.params.pushState && options.pushState) {
          History.push(
            router.view.id,
            {
              url: options.route.url,
              modal: modalType,
            },
            (router.params.pushStateRoot || '') + router.params.pushStateSeparator + options.route.url
          );
        }

        // Set Route
        if (options.route !== router.currentRoute) {
          modal.route = Utils.extend(options.route, { modal });
          router.currentRoute = modal.route;
        }

        // Update Router History
        if (options.history) {
          router.history.push(options.route.url);
          router.saveHistory();
        }
      }

      if (hasEl) {
        // Remove theme elements
        router.removeThemeElements(modal.el);

        // Emit events
        modal.$el.trigger(`${modalType.toLowerCase()}:init ${modalType.toLowerCase()}:mounted`, route, modal);
        router.emit(`${modalOrPanel}Init ${modalType}Init ${modalType}Mounted`, modal.el, route, modal);
      }

      // Open
      modal.open();
    }

    // Load Modal Content
    function loadModal(loadModalParams, loadModalOptions) {
      // Load Modal Props
      const { url, content, template, templateUrl, component, componentUrl } = loadModalParams;

      // Component/Template Callbacks
      function resolve(contentEl) {
        if (contentEl) {
          if (typeof contentEl === 'string') {
            modalParams.content = contentEl;
          } else if (contentEl.f7Component) {
            contentEl.f7Component.$mount((componentEl) => {
              modalParams.el = componentEl;
              app.root.append(componentEl);
            });
          } else {
            modalParams.el = contentEl;
          }
          onModalLoaded();
        }
      }
      function reject() {
        router.allowPageChange = true;
        return router;
      }

      if (content) {
        resolve(content);
      } else if (template || templateUrl) {
        try {
          router.modalTemplateLoader(template, templateUrl, loadModalOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (component || componentUrl) {
        // Load from component (F7/Vue/React/...)
        try {
          router.modalComponentLoader(app.root[0], component, componentUrl, loadModalOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (url) {
        // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router.xhrRequest(url, loadModalOptions)
          .then((modalContent) => {
            modalParams.content = modalContent;
            onModalLoaded();
          })
          .catch(() => {
            router.allowPageChange = true;
          });
      } else {
        onModalLoaded();
      }
    }

    let foundLoadProp;
    ('url content component el componentUrl template templateUrl').split(' ').forEach((modalLoadProp) => {
      if (modalParams[modalLoadProp] && !foundLoadProp) {
        foundLoadProp = true;
        loadModal({ [modalLoadProp]: modalParams[modalLoadProp] }, options);
      }
    });
    if (!foundLoadProp && modalType === 'actions') {
      onModalLoaded();
    }

    // Async
    function asyncResolve(resolveParams, resolveOptions) {
      loadModal(resolveParams, Utils.extend(options, resolveOptions));
    }
    function asyncReject() {
      router.allowPageChange = true;
    }
    if (modalParams.async) {
      modalParams.async.call(router, options.route, router.currentRoute, asyncResolve, asyncReject);
    }
    if (modalParams.asyncComponent) {
      asyncComponent(router, modalParams.asyncComponent, asyncResolve, asyncReject);
    }
    return router;
  }
  function modalRemove(modal) {
    Utils.extend(modal, { closeByRouter: true });
    modal.close();
  }

  function backward(el, backwardOptions) {
    const router = this;
    const $el = $(el);
    const app = router.app;
    const view = router.view;

    const options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      replaceState: false,
    }, backwardOptions);

    const masterDetailEnabled = router.params.masterDetailBreakpoint > 0;
    const isMaster = masterDetailEnabled && options.route && options.route.route && options.route.route.master === true;
    let masterPageEl;
    let masterPageRemoved;

    const dynamicNavbar = router.dynamicNavbar;

    const $newPage = $el;
    const $oldPage = router.$el.children('.page-current');
    const currentIsMaster = masterDetailEnabled && $oldPage.hasClass('page-master');

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    let $navbarsEl;
    let $newNavbarEl;
    let $oldNavbarEl;

    if (dynamicNavbar) {
      $newNavbarEl = $newPage.children('.navbar');
      $navbarsEl = router.$navbarsEl;
      if ($newNavbarEl.length === 0 && $newPage[0] && $newPage[0].f7Page) {
        // Try from pageData
        $newNavbarEl = $newPage[0].f7Page.$navbarEl;
      }
      $oldNavbarEl = $navbarsEl.find('.navbar-current');
    }

    router.allowPageChange = false;
    if ($newPage.length === 0 || $oldPage.length === 0) {
      router.allowPageChange = true;
      return router;
    }

    // Remove theme elements
    router.removeThemeElements($newPage);

    // Save Keep Alive Cache
    if (options.route && options.route.route && options.route.route.keepAlive && !options.route.route.keepAliveData) {
      options.route.route.keepAliveData = {
        pageEl: $el[0],
      };
    }

    // Pages In View
    let isDetail;
    let isDetailRoot;
    if (masterDetailEnabled) {
      const $pagesInView = router.$el
        .children('.page:not(.stacked)')
        .filter((index, pageInView) => pageInView !== $newPage[0]);

      // Find Detail' master page
      for (let i = 0; i < $pagesInView.length; i += 1) {
        if (!masterPageEl
          && $pagesInView[i].classList.contains('page-master')
        ) {
          masterPageEl = $pagesInView[i];
          continue; // eslint-disable-line
        }
      }

      isDetail = !isMaster
        && masterPageEl
        && (router.history.indexOf(options.route.url) > router.history.indexOf(masterPageEl.f7Page.route.url));

      if (!isDetail && !isMaster && masterPageEl && masterPageEl.f7Page && options.route.route.masterRoute) {
        isDetail = options.route.route.masterRoute.path === masterPageEl.f7Page.route.route.path;
      }
    }
    if (isDetail && masterPageEl && masterPageEl.f7Page) {
      isDetailRoot = router.history.indexOf(options.route.url) - router.history.indexOf(masterPageEl.f7Page.route.url) === 1;
    }

    // New Page
    $newPage
      .addClass(`page-previous${isMaster ? ' page-master' : ''}${isDetail ? ' page-master-detail' : ''}${isDetailRoot ? ' page-master-detail-root' : ''}`)
      .removeClass('stacked')
      .removeAttr('aria-hidden')
      .trigger('page:unstack')
      .trigger('page:position', { position: 'previous' });
    router.emit('pageUnstack', $newPage[0]);
    router.emit('pagePosition', $newPage[0], 'previous');
    if (isMaster || isDetail) {
      $newPage.trigger('page:role', { role: isMaster ? 'master' : 'detail', root: !!isDetailRoot });
      router.emit('pageRole', $newPage[0], { role: isMaster ? 'master' : 'detail', detailRoot: !!isDetailRoot });
    }

    if (dynamicNavbar && $newNavbarEl.length > 0) {
      $newNavbarEl
        .addClass(`navbar-previous${isMaster ? ' navbar-master' : ''}${isDetail ? ' navbar-master-detail' : ''}${isDetailRoot ? ' navbar-master-detail-root' : ''}`)
        .removeClass('stacked')
        .removeAttr('aria-hidden');
      $newNavbarEl.trigger('navbar:position', { position: 'previous' });
      router.emit('navbarPosition', $newNavbarEl[0], 'previous');
      if (isMaster || isDetailRoot) {
        router.emit('navbarRole', $newNavbarEl[0], { role: isMaster ? 'master' : 'detail', detailRoot: !!isDetailRoot });
      }
    }

    // Remove previous page in case of "forced"
    let backIndex;
    if (options.force) {
      if ($oldPage.prev('.page-previous:not(.stacked)').length > 0 || $oldPage.prev('.page-previous').length === 0) {
        if (router.history.indexOf(options.route.url) >= 0) {
          backIndex = router.history.length - router.history.indexOf(options.route.url) - 1;
          router.history = router.history.slice(0, router.history.indexOf(options.route.url) + 2);
          view.history = router.history;
        } else if (router.history[[router.history.length - 2]]) {
          router.history[router.history.length - 2] = options.route.url;
        } else {
          router.history.unshift(router.url);
        }

        if (backIndex && router.params.stackPages) {
          $oldPage.prevAll('.page-previous').each((index, pageToRemove) => {
            const $pageToRemove = $(pageToRemove);
            let $navbarToRemove;
            if (dynamicNavbar) {
              // $navbarToRemove = $oldNavbarEl.prevAll('.navbar-previous').eq(index);
              $navbarToRemove = $(app.navbar.getElByPage($pageToRemove));
            }
            if ($pageToRemove[0] !== $newPage[0] && $pageToRemove.index() > $newPage.index()) {
              if (router.initialPages.indexOf($pageToRemove[0]) >= 0) {
                $pageToRemove.addClass('stacked');
                $pageToRemove.trigger('page:stack');
                router.emit('pageStack', $pageToRemove[0]);
                if (dynamicNavbar) {
                  $navbarToRemove.addClass('stacked');
                }
              } else {
                router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined, options);
                if ($pageToRemove[0] === masterPageEl) {
                  masterPageRemoved = true;
                }
                router.removePage($pageToRemove);
                if (dynamicNavbar && $navbarToRemove.length > 0) {
                  router.removeNavbar($navbarToRemove);
                }
              }
            }
          });
        } else {
          const $pageToRemove = $oldPage.prev('.page-previous:not(.stacked)');
          let $navbarToRemove;
          if (dynamicNavbar) {
            // $navbarToRemove = $oldNavbarEl.prev('.navbar-inner:not(.stacked)');
            $navbarToRemove = $(app.navbar.getElByPage($pageToRemove));
          }
          if (router.params.stackPages && router.initialPages.indexOf($pageToRemove[0]) >= 0) {
            $pageToRemove.addClass('stacked');
            $pageToRemove.trigger('page:stack');
            router.emit('pageStack', $pageToRemove[0]);
            $navbarToRemove.addClass('stacked');
          } else if ($pageToRemove.length > 0) {
            router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined, options);
            if ($pageToRemove[0] === masterPageEl) {
              masterPageRemoved = true;
            }
            router.removePage($pageToRemove);
            if (dynamicNavbar && $navbarToRemove.length) {
              router.removeNavbar($navbarToRemove);
            }
          }
        }
      }
    }

    // Insert new page
    const newPageInDom = $newPage.parents(doc).length > 0;
    const f7Component = $newPage[0].f7Component;

    function insertPage() {
      if ($newPage.next($oldPage).length === 0) {
        if (!newPageInDom && f7Component) {
          f7Component.$mount((componentEl) => {
            $(componentEl).insertBefore($oldPage);
          });
        } else {
          $newPage.insertBefore($oldPage);
        }
      }
      if (dynamicNavbar && $newNavbarEl.length) {
        if ($newNavbarEl.find('.title-large').length) {
          $newNavbarEl.addClass('navbar-large');
        }
        $newNavbarEl.insertBefore($oldNavbarEl);
        if ($oldNavbarEl.length > 0) {
          $newNavbarEl.insertBefore($oldNavbarEl);
        } else {
          if (!router.$navbarsEl.parents(doc).length) {
            router.$el.prepend(router.$navbarsEl);
          }
          $navbarsEl.append($newNavbarEl);
        }
      }
      if (!newPageInDom) {
        router.pageCallback('mounted', $newPage, $newNavbarEl, 'previous', 'current', options, $oldPage);
      } else if (options.route && options.route.route && options.route.route.keepAlive && !$newPage[0].f7PageMounted) {
        $newPage[0].f7PageMounted = true;
        router.pageCallback('mounted', $newPage, $newNavbarEl, 'previous', 'current', options, $oldPage);
      }
    }

    if (options.preload) {
      // Insert Page
      insertPage();
      // Tab route
      if (options.route.route.tab) {
        router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
          history: false,
          pushState: false,
          preload: true,
        }));
      }
      if (isMaster) {
        $newPage
          .removeClass('page-master-stacked')
          .trigger('page:masterunstack');
        router.emit('pageMasterUnstack', $newPage[0]);
        if (dynamicNavbar) {
          $(app.navbar.getElByPage($newPage)).removeClass('navbar-master-stacked');
          router.emit('navbarMasterUnstack', app.navbar.getElByPage($newPage));
        }
      }
      // Page init and before init events
      router.pageCallback('init', $newPage, $newNavbarEl, 'previous', 'current', options, $oldPage);
      const $previousPages = $newPage.prevAll('.page-previous:not(.stacked):not(.page-master)');
      if ($previousPages.length > 0) {
        $previousPages.each((index, pageToRemove) => {
          const $pageToRemove = $(pageToRemove);
          let $navbarToRemove;
          if (dynamicNavbar) {
            // $navbarToRemove = $newNavbarEl.prevAll('.navbar-previous:not(.stacked)').eq(index);
            $navbarToRemove = $(app.navbar.getElByPage($pageToRemove));
          }
          if (router.params.stackPages && router.initialPages.indexOf(pageToRemove) >= 0) {
            $pageToRemove.addClass('stacked');
            $pageToRemove.trigger('page:stack');
            router.emit('pageStack', $pageToRemove[0]);
            if (dynamicNavbar) {
              $navbarToRemove.addClass('stacked');
            }
          } else {
            router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined);
            router.removePage($pageToRemove);
            if (dynamicNavbar && $navbarToRemove.length) {
              router.removeNavbar($navbarToRemove);
            }
          }
        });
      }
      router.allowPageChange = true;
      return router;
    }

    // History State
    if (!(Device.ie || Device.edge || (Device.firefox && !Device.ios))) {
      if (router.params.pushState && options.pushState) {
        if (options.replaceState) {
          const pushStateRoot = router.params.pushStateRoot || '';
          History.replace(
            view.id,
            {
              url: options.route.url,
            },
            pushStateRoot + router.params.pushStateSeparator + options.route.url
          );
        } else if (backIndex) {
          History.go(-backIndex);
        } else {
          History.back();
        }
      }
    }

    // Update History
    if (options.replaceState) {
      router.history[router.history.length - 1] = options.route.url;
    } else {
      if (router.history.length === 1) {
        router.history.unshift(router.url);
      }
      router.history.pop();
    }
    router.saveHistory();

    // Current Page & Navbar
    router.currentPageEl = $newPage[0];
    if (dynamicNavbar && $newNavbarEl.length) {
      router.currentNavbarEl = $newNavbarEl[0];
    } else {
      delete router.currentNavbarEl;
    }

    // Current Route
    router.currentRoute = options.route;

    // History State
    if (Device.ie || Device.edge || (Device.firefox && !Device.ios)) {
      if (router.params.pushState && options.pushState) {
        if (options.replaceState) {
          const pushStateRoot = router.params.pushStateRoot || '';
          History.replace(
            view.id,
            {
              url: options.route.url,
            },
            pushStateRoot + router.params.pushStateSeparator + options.route.url
          );
        } else if (backIndex) {
          History.go(-backIndex);
        } else {
          History.back();
        }
      }
    }

    // Insert Page
    insertPage();

    // Load Tab
    if (options.route.route.tab) {
      router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
        history: false,
        pushState: false,
      }));
    }

    // Check master detail

    if (masterDetailEnabled && (currentIsMaster || masterPageRemoved)) {
      view.checkMasterDetailBreakpoint(false);
    }

    // Page init and before init events
    router.pageCallback('init', $newPage, $newNavbarEl, 'previous', 'current', options, $oldPage);

    // Before animation callback
    router.pageCallback('beforeOut', $oldPage, $oldNavbarEl, 'current', 'next', options);
    router.pageCallback('beforeIn', $newPage, $newNavbarEl, 'previous', 'current', options);

    // Animation
    function afterAnimation() {
      // Set classes
      router.setPagePosition($newPage, 'current', false);
      router.setPagePosition($oldPage, 'next', true);
      if (dynamicNavbar) {
        router.setNavbarPosition($newNavbarEl, 'current', false);
        router.setNavbarPosition($oldNavbarEl, 'next', true);
      }

      // After animation event
      router.pageCallback('afterOut', $oldPage, $oldNavbarEl, 'current', 'next', options);
      router.pageCallback('afterIn', $newPage, $newNavbarEl, 'previous', 'current', options);

      // Remove Old Page
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        $oldPage.trigger('page:stack');
        router.emit('pageStack', $oldPage[0]);
        if (dynamicNavbar) {
          $oldNavbarEl.addClass('stacked');
        }
      } else {
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarEl, 'next', undefined, options);
        router.removePage($oldPage);
        if (dynamicNavbar && $oldNavbarEl.length) {
          router.removeNavbar($oldNavbarEl);
        }
      }

      router.allowPageChange = true;
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      // Preload previous page
      const preloadPreviousPage = router.params.preloadPreviousPage || router.params[`${app.theme}SwipeBack`];
      if (preloadPreviousPage && router.history[router.history.length - 2] && !isMaster) {
        router.back(router.history[router.history.length - 2], { preload: true });
      }
      if (router.params.pushState) {
        History.clearRouterQueue();
      }
    }

    function setPositionClasses() {
      router.setPagePosition($oldPage, 'current');
      router.setPagePosition($newPage, 'previous', false);
      if (dynamicNavbar) {
        router.setNavbarPosition($oldNavbarEl, 'current');
        router.setNavbarPosition($newNavbarEl, 'previous', false);
      }
    }

    if (options.animate && !(currentIsMaster && app.width >= router.params.masterDetailBreakpoint)) {
      let transition = router.params.transition;
      if ($oldPage[0] && $oldPage[0].f7PageTransition) {
        transition = $oldPage[0].f7PageTransition;
        delete $oldPage[0].f7PageTransition;
      }
      if (options.transition) transition = options.transition;
      if (!transition && router.previousRoute && router.previousRoute.route) {
        transition = router.previousRoute.route.transition;
      }
      if (!transition && router.previousRoute && router.previousRoute.route && router.previousRoute.route.options) {
        transition = router.previousRoute.route.options.transition;
      }
      setPositionClasses();
      router.animate($oldPage, $newPage, $oldNavbarEl, $newNavbarEl, 'backward', transition, () => {
        afterAnimation();
      });
    } else {
      afterAnimation();
    }

    return router;
  }
  function loadBack(backParams, backOptions, ignorePageChange) {
    const router = this;

    if (!router.allowPageChange && !ignorePageChange) return router;
    const params = backParams;
    const options = backOptions;
    const { url, content, el, pageName, template, templateUrl, component, componentUrl } = params;

    if (
      options.route.url
      && router.url === options.route.url
      && !(options.reloadCurrent || options.reloadPrevious)
      && !router.params.allowDuplicateUrls
    ) {
      return false;
    }

    if (!options.route && url) {
      options.route = router.parseRouteUrl(url);
    }

    // Component Callbacks
    function resolve(pageEl, newOptions) {
      return router.backward(pageEl, Utils.extend(options, newOptions));
    }
    function reject() {
      router.allowPageChange = true;
      return router;
    }

    if (url || templateUrl || componentUrl || component) {
      router.allowPageChange = false;
    }

    // Proceed
    if (content) {
      router.backward(router.getPageEl(content), options);
    } else if (template || templateUrl) {
      // Parse template and send page element
      try {
        router.pageTemplateLoader(template, templateUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (el) {
      // Load page from specified HTMLElement or by page name in pages container
      router.backward(router.getPageEl(el), options);
    } else if (pageName) {
      // Load page by page name in pages container
      router.backward(router.$el.children(`.page[data-name="${pageName}"]`).eq(0), options);
    } else if (component || componentUrl) {
      // Load from component (F7/Vue/React/...)
      try {
        router.pageComponentLoader(router.el, component, componentUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (url) {
      // Load using XHR
      if (router.xhr) {
        router.xhr.abort();
        router.xhr = false;
      }
      router.xhrRequest(url, options)
        .then((pageContent) => {
          router.backward(router.getPageEl(pageContent), options);
        })
        .catch(() => {
          router.allowPageChange = true;
        });
    }
    return router;
  }
  function back(...args) {
    const router = this;
    if (router.swipeBackActive) return router;
    let navigateUrl;
    let navigateOptions;
    let route;
    if (typeof args[0] === 'object') {
      navigateOptions = args[0] || {};
    } else {
      navigateUrl = args[0];
      navigateOptions = args[1] || {};
    }

    const { name, params, query } = navigateOptions;
    if (name) {
      navigateUrl = router.generateUrl({ name, params, query });
      if (navigateUrl) {
        return router.back(navigateUrl, Utils.extend({}, navigateOptions, {
          name: null,
          params: null,
          query: null,
        }));
      }
      return router;
    }

    const app = router.app;
    appRouterCheck(router, 'back');

    let currentRouteIsModal = router.currentRoute.modal;
    let modalType;
    if (!currentRouteIsModal) {
      ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach((modalLoadProp) => {
        if (router.currentRoute.route[modalLoadProp]) {
          currentRouteIsModal = true;
          modalType = modalLoadProp;
        }
      });
    }
    if (currentRouteIsModal) {
      const modalToClose = router.currentRoute.modal
                           || router.currentRoute.route.modalInstance
                           || app[modalType].get();
      const previousUrl = router.history[router.history.length - 2];
      let previousRoute;
      // check if previous route is modal too
      if (modalToClose && modalToClose.$el) {
        const prevOpenedModals = modalToClose.$el.prevAll('.modal-in');
        if (prevOpenedModals.length && prevOpenedModals[0].f7Modal) {
          const modalEl = prevOpenedModals[0];
          // check if current router not inside of the modalEl
          if (!router.$el.parents(modalEl).length) {
            previousRoute = modalEl.f7Modal.route;
          }
        }
      }
      if (!previousRoute) {
        previousRoute = router.findMatchingRoute(previousUrl);
      }

      if (!previousRoute && previousUrl) {
        previousRoute = {
          url: previousUrl,
          path: previousUrl.split('?')[0],
          query: Utils.parseUrlQuery(previousUrl),
          route: {
            path: previousUrl.split('?')[0],
            url: previousUrl,
          },
        };
      }
      if (!navigateUrl || navigateUrl.replace(/[# ]/g, '').trim().length === 0) {
        if (!previousRoute || !modalToClose) {
          return router;
        }
      }
      const forceOtherUrl = navigateOptions.force && previousRoute && navigateUrl;
      if (previousRoute && modalToClose) {
        const isBrokenPushState = Device.ie || Device.edge || (Device.firefox && !Device.ios);
        const needHistoryBack = router.params.pushState && navigateOptions.pushState !== false;
        if (needHistoryBack && !isBrokenPushState) {
          History.back();
        }
        router.currentRoute = previousRoute;
        router.history.pop();
        router.saveHistory();

        if (needHistoryBack && isBrokenPushState) {
          History.back();
        }

        router.modalRemove(modalToClose);
        if (forceOtherUrl) {
          router.navigate(navigateUrl, { reloadCurrent: true });
        }
      } else if (modalToClose) {
        router.modalRemove(modalToClose);
        if (navigateUrl) {
          router.navigate(navigateUrl, { reloadCurrent: true });
        }
      }
      return router;
    }
    let $previousPage = router.$el.children('.page-current').prevAll('.page-previous:not(.page-master)').eq(0);

    let skipMaster;
    if (router.params.masterDetailBreakpoint > 0) {
      const classes = [];
      router.$el.children('.page').each((index, pageEl) => {
        classes.push(pageEl.className);
      });

      const $previousMaster = router.$el.children('.page-current').prevAll('.page-master').eq(0);
      if ($previousMaster.length) {
        const expectedPreviousPageUrl = router.history[router.history.length - 2];
        const expectedPreviousPageRoute = router.findMatchingRoute(expectedPreviousPageUrl);
        if (expectedPreviousPageRoute && $previousMaster[0].f7Page && expectedPreviousPageRoute.route === $previousMaster[0].f7Page.route.route) {
          $previousPage = $previousMaster;
          if (!navigateOptions.preload) {
            skipMaster = app.width >= router.params.masterDetailBreakpoint;
          }
        }
      }
    }

    if (!navigateOptions.force && $previousPage.length && !skipMaster) {
      if (router.params.pushState
        && $previousPage[0].f7Page
        && router.history[router.history.length - 2] !== $previousPage[0].f7Page.route.url
      ) {
        router.back(
          router.history[router.history.length - 2],
          Utils.extend(navigateOptions, { force: true })
        );
        return router;
      }
      const previousPageRoute = $previousPage[0].f7Page.route;

      processRouteQueue.call(
        router,
        previousPageRoute,
        router.currentRoute,
        () => {
          router.loadBack({ el: $previousPage }, Utils.extend(navigateOptions, {
            route: previousPageRoute,
          }));
        },
        () => {}
      );

      return router;
    }

    // Navigate URL
    if (navigateUrl === '#') {
      navigateUrl = undefined;
    }
    if (navigateUrl && navigateUrl[0] !== '/' && navigateUrl.indexOf('#') !== 0) {
      navigateUrl = ((router.path || '/') + navigateUrl).replace('//', '/');
    }
    if (!navigateUrl && router.history.length > 1) {
      navigateUrl = router.history[router.history.length - 2];
    }
    if (skipMaster && !navigateOptions.force && router.history[router.history.length - 3]) {
      return router.back(router.history[router.history.length - 3], Utils.extend({}, navigateOptions || {}, {
        force: true,
        animate: false,
      }));
    }
    if (skipMaster && !navigateOptions.force) {
      return router;
    }

    // Find route to load
    route = router.findMatchingRoute(navigateUrl);
    if (!route) {
      if (navigateUrl) {
        route = {
          url: navigateUrl,
          path: navigateUrl.split('?')[0],
          query: Utils.parseUrlQuery(navigateUrl),
          route: {
            path: navigateUrl.split('?')[0],
            url: navigateUrl,
          },
        };
      }
    }
    if (!route) {
      return router;
    }

    if (route.route.redirect) {
      return redirect.call(router, 'back', route, navigateOptions);
    }

    const options = {};
    if (route.route.options) {
      Utils.extend(options, route.route.options, navigateOptions);
    } else {
      Utils.extend(options, navigateOptions);
    }
    options.route = route;

    if (options && options.context) {
      route.context = options.context;
      options.route.context = options.context;
    }

    let backForceLoaded;
    if (options.force && router.params.stackPages) {
      router.$el.children('.page-previous.stacked').each((index, pageEl) => {
        if (pageEl.f7Page && pageEl.f7Page.route && pageEl.f7Page.route.url === route.url) {
          backForceLoaded = true;
          router.loadBack({ el: pageEl }, options);
        }
      });
      if (backForceLoaded) {
        return router;
      }
    }
    function resolve() {
      let routerLoaded = false;
      if (route.route.keepAlive && route.route.keepAliveData) {
        router.loadBack({ el: route.route.keepAliveData.pageEl }, options);
        routerLoaded = true;
      }
      ('url content component pageName el componentUrl template templateUrl').split(' ').forEach((pageLoadProp) => {
        if (route.route[pageLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.loadBack({ [pageLoadProp]: route.route[pageLoadProp] }, options);
        }
      });
      if (routerLoaded) return;
      // Async
      function asyncResolve(resolveParams, resolveOptions) {
        router.allowPageChange = false;
        if (resolveOptions && resolveOptions.context) {
          if (!route.context) route.context = resolveOptions.context;
          else route.context = Utils.extend({}, route.context, resolveOptions.context);
          options.route.context = route.context;
        }
        router.loadBack(resolveParams, Utils.extend(options, resolveOptions), true);
      }
      function asyncReject() {
        router.allowPageChange = true;
      }
      if (route.route.async) {
        router.allowPageChange = false;
        route.route.async.call(router, route, router.currentRoute, asyncResolve, asyncReject);
      }
      if (route.route.asyncComponent) {
        asyncComponent(router, route.route.asyncComponent, asyncResolve, asyncReject);
      }
    }
    function reject() {
      router.allowPageChange = true;
    }

    if (options.preload) {
      resolve();
    } else {
      processRouteQueue.call(
        router,
        route,
        router.currentRoute,
        () => {
          if (route.route.modules) {
            app
              .loadModules(Array.isArray(route.route.modules) ? route.route.modules : [route.route.modules])
              .then(() => {
                resolve();
              })
              .catch(() => {
                reject();
              });
          } else {
            resolve();
          }
        },
        () => {
          reject();
        },
      );
    }

    // Return Router
    return router;
  }

  function clearPreviousPages(router) {
    appRouterCheck(router, 'clearPreviousPages');
    const app = router.app;
    const dynamicNavbar = router.dynamicNavbar;

    const $pagesToRemove = router.$el
      .children('.page')
      .filter((index, pageInView) => {
        if (router.currentRoute && (router.currentRoute.modal || router.currentRoute.panel)) return true;
        return pageInView !== router.currentPageEl;
      });

    $pagesToRemove.each((index, pageEl) => {
      const $oldPageEl = $(pageEl);
      const $oldNavbarEl = $(app.navbar.getElByPage($oldPageEl));
      if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
        $oldPageEl.addClass('stacked');
        if (dynamicNavbar) {
          $oldNavbarEl.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarEl, 'previous', undefined, {});
        router.removePage($oldPageEl);
        if (dynamicNavbar && $oldNavbarEl.length) {
          router.removeNavbar($oldNavbarEl);
        }
      }
    });
  }

  function clearPreviousHistory() {
    const router = this;
    appRouterCheck(router, 'clearPreviousHistory');
    const url = router.history[router.history.length - 1];

    clearPreviousPages(router);

    router.history = [url];
    router.view.history = [url];
    router.saveHistory();
  }

  class Router extends Framework7Class {
    constructor(app, view) {
      super({}, [typeof view === 'undefined' ? app : view]);
      const router = this;

      // Is App Router
      router.isAppRouter = typeof view === 'undefined';

      if (router.isAppRouter) {
        // App Router
        Utils.extend(false, router, {
          app,
          params: app.params.view,
          routes: app.routes || [],
          cache: app.cache,
        });
      } else {
        // View Router
        Utils.extend(false, router, {
          app,
          view,
          viewId: view.id,
          params: view.params,
          routes: view.routes,
          $el: view.$el,
          el: view.el,
          $navbarsEl: view.$navbarsEl,
          navbarsEl: view.navbarsEl,
          history: view.history,
          scrollHistory: view.scrollHistory,
          cache: app.cache,
          dynamicNavbar: app.theme === 'ios' && view.params.iosDynamicNavbar,
          initialPages: [],
          initialNavbars: [],
        });
      }

      // Install Modules
      router.useModules();

      // Temporary Dom
      router.tempDom = doc.createElement('div');

      // AllowPageChage
      router.allowPageChange = true;

      // Current Route
      let currentRoute = {};
      let previousRoute = {};
      Object.defineProperty(router, 'currentRoute', {
        enumerable: true,
        configurable: true,
        set(newRoute = {}) {
          previousRoute = Utils.extend({}, currentRoute);
          currentRoute = newRoute;
          if (!currentRoute) return;
          router.url = currentRoute.url;
          router.emit('routeChange', newRoute, previousRoute, router);
        },
        get() {
          return currentRoute;
        },
      });
      Object.defineProperty(router, 'previousRoute', {
        enumerable: true,
        configurable: true,
        get() {
          return previousRoute;
        },
        set(newRoute) {
          previousRoute = newRoute;
        },
      });

      return router;
    }

    animatableNavElements($newNavbarEl, $oldNavbarEl, toLarge, fromLarge, direction) {
      const router = this;
      const dynamicNavbar = router.dynamicNavbar;
      const animateIcon = router.params.iosAnimateNavbarBackIcon;

      let newNavEls;
      let oldNavEls;
      function animatableNavEl($el, $navbarInner) {
        const isSliding = $el.hasClass('sliding') || $navbarInner.hasClass('sliding');
        const isSubnavbar = $el.hasClass('subnavbar');
        const needsOpacityTransition = isSliding ? !isSubnavbar : true;
        const $iconEl = $el.find('.back .icon');
        let isIconLabel;
        if (isSliding && animateIcon && $el.hasClass('left') && $iconEl.length > 0 && $iconEl.next('span').length) {
          $el = $iconEl.next('span'); // eslint-disable-line
          isIconLabel = true;
        }
        return {
          $el,
          isIconLabel,
          leftOffset: $el[0].f7NavbarLeftOffset,
          rightOffset: $el[0].f7NavbarRightOffset,
          isSliding,
          isSubnavbar,
          needsOpacityTransition,
        };
      }
      if (dynamicNavbar) {
        newNavEls = [];
        oldNavEls = [];
        $newNavbarEl.children('.navbar-inner').children('.left, .right, .title, .subnavbar').each((index, navEl) => {
          const $navEl = $(navEl);
          if ($navEl.hasClass('left') && fromLarge && direction === 'forward') return;
          if ($navEl.hasClass('title') && toLarge) return;
          newNavEls.push(animatableNavEl($navEl, $newNavbarEl.children('.navbar-inner')));
        });
        if (!($oldNavbarEl.hasClass('navbar-master') && router.params.masterDetailBreakpoint > 0 && router.app.width >= router.params.masterDetailBreakpoint)) {
          $oldNavbarEl.children('.navbar-inner').children('.left, .right, .title, .subnavbar').each((index, navEl) => {
            const $navEl = $(navEl);
            if ($navEl.hasClass('left') && toLarge && !fromLarge && direction === 'forward') return;
            if ($navEl.hasClass('left') && toLarge && direction === 'backward') return;
            if ($navEl.hasClass('title') && fromLarge) {
              return;
            }
            oldNavEls.push(animatableNavEl($navEl, $oldNavbarEl.children('.navbar-inner')));
          });
        }
        [oldNavEls, newNavEls].forEach((navEls) => {
          navEls.forEach((navEl) => {
            const n = navEl;
            const { isSliding, $el } = navEl;
            const otherEls = navEls === oldNavEls ? newNavEls : oldNavEls;
            if (!(isSliding && $el.hasClass('title') && otherEls)) return;
            otherEls.forEach((otherNavEl) => {
              if (otherNavEl.isIconLabel) {
                const iconTextEl = otherNavEl.$el[0];
                n.leftOffset += iconTextEl ? (iconTextEl.offsetLeft || 0) : 0;
              }
            });
          });
        });
      }

      return { newNavEls, oldNavEls };
    }

    animate($oldPageEl, $newPageEl, $oldNavbarEl, $newNavbarEl, direction, transition, callback) {
      const router = this;
      if (router.params.animateCustom) {
        router.params.animateCustom.apply(router, [$oldPageEl, $newPageEl, $oldNavbarEl, $newNavbarEl, direction, callback]);
        return;
      }
      const dynamicNavbar = router.dynamicNavbar;
      const ios = router.app.theme === 'ios';
      if (transition) {
        const routerCustomTransitionClass = `router-transition-custom router-transition-${transition}-${direction}`;
        // Animate
        const onCustomTransitionDone = () => {
          router.$el.removeClass(routerCustomTransitionClass);
          if (dynamicNavbar && router.$navbarsEl.length) {
            if ($newNavbarEl) {
              router.$navbarsEl.prepend($newNavbarEl);
            }
            if ($oldNavbarEl) {
              router.$navbarsEl.prepend($oldNavbarEl);
            }
          }
          if (callback) callback();
        };

        (direction === 'forward' ? $newPageEl : $oldPageEl).animationEnd(onCustomTransitionDone);
        if (dynamicNavbar) {
          if ($newNavbarEl && $newPageEl) {
            router.setNavbarPosition($newNavbarEl, '');
            $newNavbarEl.removeClass('navbar-next navbar-previous navbar-current');
            $newPageEl.prepend($newNavbarEl);
          }
          if ($oldNavbarEl && $oldPageEl) {
            router.setNavbarPosition($oldNavbarEl, '');
            $oldNavbarEl.removeClass('navbar-next navbar-previous navbar-current');
            $oldPageEl.prepend($oldNavbarEl);
          }
        }

        router.$el.addClass(routerCustomTransitionClass);
        return;
      }


      // Router Animation class
      const routerTransitionClass = `router-transition-${direction} router-transition`;

      let newNavEls;
      let oldNavEls;

      let fromLarge;
      let toLarge;

      let oldIsLarge;
      let newIsLarge;

      if (ios && dynamicNavbar) {
        const betweenMasterAndDetail = router.params.masterDetailBreakpoint > 0 && router.app.width >= router.params.masterDetailBreakpoint
          && (
            ($oldNavbarEl.hasClass('navbar-master') && $newNavbarEl.hasClass('navbar-master-detail'))
            || ($oldNavbarEl.hasClass('navbar-master-detail') && $newNavbarEl.hasClass('navbar-master'))
          );
        if (!betweenMasterAndDetail) {
          oldIsLarge = $oldNavbarEl && $oldNavbarEl.hasClass('navbar-large');
          newIsLarge = $newNavbarEl && $newNavbarEl.hasClass('navbar-large');
          fromLarge = oldIsLarge && !$oldNavbarEl.hasClass('navbar-large-collapsed');
          toLarge = newIsLarge && !$newNavbarEl.hasClass('navbar-large-collapsed');
        }
        const navEls = router.animatableNavElements($newNavbarEl, $oldNavbarEl, toLarge, fromLarge, direction);
        newNavEls = navEls.newNavEls;
        oldNavEls = navEls.oldNavEls;
      }

      function animateNavbars(progress) {
        if (!(ios && dynamicNavbar)) return;
        if (progress === 1) {
          if (toLarge) {
            $newNavbarEl.addClass('router-navbar-transition-to-large');
            $oldNavbarEl.addClass('router-navbar-transition-to-large');
          }
          if (fromLarge) {
            $newNavbarEl.addClass('router-navbar-transition-from-large');
            $oldNavbarEl.addClass('router-navbar-transition-from-large');
          }
        }
        newNavEls.forEach((navEl) => {
          const $el = navEl.$el;
          const offset = direction === 'forward' ? navEl.rightOffset : navEl.leftOffset;
          if (navEl.isSliding) {
            if (navEl.isSubnavbar && newIsLarge) {
              $el[0].style.setProperty('transform', `translate3d(${offset * (1 - progress)}px, calc(-1 * var(--f7-navbar-large-collapse-progress) * var(--f7-navbar-large-title-height)), 0)`, 'important');
            } else {
              $el.transform(`translate3d(${offset * (1 - progress)}px,0,0)`);
            }
          }
        });
        oldNavEls.forEach((navEl) => {
          const $el = navEl.$el;
          const offset = direction === 'forward' ? navEl.leftOffset : navEl.rightOffset;
          if (navEl.isSliding) {
            if (navEl.isSubnavbar && oldIsLarge) {
              $el.transform(`translate3d(${offset * (progress)}px, calc(-1 * var(--f7-navbar-large-collapse-progress) * var(--f7-navbar-large-title-height)), 0)`);
            } else {
              $el.transform(`translate3d(${offset * (progress)}px,0,0)`);
            }
          }
        });
      }

      // AnimationEnd Callback
      function onDone() {
        if (router.dynamicNavbar) {
          if ($newNavbarEl) {
            $newNavbarEl.removeClass('router-navbar-transition-to-large router-navbar-transition-from-large');
            $newNavbarEl.addClass('navbar-no-title-large-transition');
            Utils.nextFrame(() => {
              $newNavbarEl.removeClass('navbar-no-title-large-transition');
            });
          }
          if ($oldNavbarEl) {
            $oldNavbarEl.removeClass('router-navbar-transition-to-large router-navbar-transition-from-large');
          }
          if ($newNavbarEl.hasClass('sliding') || $newNavbarEl.children('.navbar-inner.sliding').length) {
            $newNavbarEl.find('.title, .left, .right, .left .icon, .subnavbar').transform('');
          } else {
            $newNavbarEl.find('.sliding').transform('');
          }
          if ($oldNavbarEl.hasClass('sliding') || $oldNavbarEl.children('.navbar-inner.sliding').length) {
            $oldNavbarEl.find('.title, .left, .right, .left .icon, .subnavbar').transform('');
          } else {
            $oldNavbarEl.find('.sliding').transform('');
          }
        }
        router.$el.removeClass(routerTransitionClass);
        if (callback) callback();
      }

      (direction === 'forward' ? $newPageEl : $oldPageEl).animationEnd(() => {
        onDone();
      });

      // Animate
      if (dynamicNavbar) {
        // Prepare Navbars
        animateNavbars(0);
        Utils.nextFrame(() => {
          // Add class, start animation
          animateNavbars(1);
          router.$el.addClass(routerTransitionClass);
        });
      } else {
        // Add class, start animation
        router.$el.addClass(routerTransitionClass);
      }
    }

    removeModal(modalEl) {
      const router = this;
      router.removeEl(modalEl);
    }
    // eslint-disable-next-line
    removeTabContent(tabEl) {
      const $tabEl = $(tabEl);
      $tabEl.html('');
    }

    removeNavbar(el) {
      const router = this;
      router.removeEl(el);
    }

    removePage(el) {
      const $el = $(el);
      const f7Page = $el && $el[0] && $el[0].f7Page;
      const router = this;
      if (f7Page && f7Page.route && f7Page.route.route && f7Page.route.route.keepAlive) {
        $el.remove();
        return;
      }
      router.removeEl(el);
    }

    removeEl(el) {
      if (!el) return;
      const router = this;
      const $el = $(el);
      if ($el.length === 0) return;
      $el.find('.tab').each((tabIndex, tabEl) => {
        $(tabEl).children().each((index, tabChild) => {
          if (tabChild.f7Component) {
            $(tabChild).trigger('tab:beforeremove');
            tabChild.f7Component.$destroy();
          }
        });
      });
      if ($el[0].f7Component && $el[0].f7Component.$destroy) {
        $el[0].f7Component.$destroy();
      }
      if (!router.params.removeElements) {
        return;
      }
      if (router.params.removeElementsWithTimeout) {
        setTimeout(() => {
          $el.remove();
        }, router.params.removeElementsTimeout);
      } else {
        $el.remove();
      }
    }

    getPageEl(content) {
      const router = this;
      if (typeof content === 'string') {
        router.tempDom.innerHTML = content;
      } else {
        if ($(content).hasClass('page')) {
          return content;
        }
        router.tempDom.innerHTML = '';
        $(router.tempDom).append(content);
      }

      return router.findElement('.page', router.tempDom);
    }

    findElement(stringSelector, container, notStacked) {
      const router = this;
      const view = router.view;
      const app = router.app;

      // Modals Selector
      const modalsSelector = '.popup, .dialog, .popover, .actions-modal, .sheet-modal, .login-screen, .page';

      const $container = $(container);
      let selector = stringSelector;
      if (notStacked) selector += ':not(.stacked)';

      let found = $container
        .find(selector)
        .filter((index, el) => $(el).parents(modalsSelector).length === 0);

      if (found.length > 1) {
        if (typeof view.selector === 'string') {
          // Search in related view
          found = $container.find(`${view.selector} ${selector}`);
        }
        if (found.length > 1) {
          // Search in main view
          found = $container.find(`.${app.params.viewMainClass} ${selector}`);
        }
      }
      if (found.length === 1) return found;

      // Try to find not stacked
      if (!notStacked) found = router.findElement(selector, $container, true);
      if (found && found.length === 1) return found;
      if (found && found.length > 1) return $(found[0]);
      return undefined;
    }

    flattenRoutes(routes = this.routes) {
      const router = this;
      let flattenedRoutes = [];
      routes.forEach((route) => {
        let hasTabRoutes = false;
        if ('tabs' in route && route.tabs) {
          const mergedPathsRoutes = route.tabs.map((tabRoute) => {
            const tRoute = Utils.extend({}, route, {
              path: (`${route.path}/${tabRoute.path}`).replace('///', '/').replace('//', '/'),
              parentPath: route.path,
              tab: tabRoute,
            });
            delete tRoute.tabs;
            delete tRoute.routes;
            return tRoute;
          });
          hasTabRoutes = true;
          flattenedRoutes = flattenedRoutes.concat(router.flattenRoutes(mergedPathsRoutes));
        }
        if ('detailRoutes' in route) {
          const mergedPathsRoutes = route.detailRoutes.map((detailRoute) => {
            const dRoute = Utils.extend({}, detailRoute);
            dRoute.masterRoute = route;
            dRoute.masterRoutePath = route.path;
            return dRoute;
          });
          flattenedRoutes = flattenedRoutes.concat(route, router.flattenRoutes(mergedPathsRoutes));
        }
        if ('routes' in route) {
          const mergedPathsRoutes = route.routes.map((childRoute) => {
            const cRoute = Utils.extend({}, childRoute);
            cRoute.path = (`${route.path}/${cRoute.path}`).replace('///', '/').replace('//', '/');
            return cRoute;
          });
          if (hasTabRoutes) {
            flattenedRoutes = flattenedRoutes.concat(router.flattenRoutes(mergedPathsRoutes));
          } else {
            flattenedRoutes = flattenedRoutes.concat(route, router.flattenRoutes(mergedPathsRoutes));
          }
        }
        if (!('routes' in route) && !('tabs' in route && route.tabs) && !('detailRoutes' in route)) {
          flattenedRoutes.push(route);
        }
      });
      return flattenedRoutes;
    }

    // eslint-disable-next-line
    parseRouteUrl(url) {
      if (!url) return {};
      const query = Utils.parseUrlQuery(url);
      const hash = url.split('#')[1];
      const params = {};
      const path = url.split('#')[0].split('?')[0];
      return {
        query,
        hash,
        params,
        url,
        path,
      };
    }

    generateUrl(parameters = {}) {
      if (typeof parameters === 'string') {
        return parameters;
      }
      const { name, path, params, query } = parameters;
      if (!name && !path) {
        throw new Error('Framework7: "name" or "path" parameter is required');
      }
      const router = this;
      const route = name
        ? router.findRouteByKey('name', name)
        : router.findRouteByKey('path', path);

      if (!route) {
        if (name) {
          throw new Error(`Framework7: route with name "${name}" not found`);
        } else {
          throw new Error(`Framework7: route with path "${path}" not found`);
        }
      }
      const url = router.constructRouteUrl(route, { params, query });
      if (!url) {
        throw new Error(`Framework7: can't construct URL for route with name "${name}"`);
      }
      return url;
    }

    // eslint-disable-next-line
    constructRouteUrl(route, { params, query } = {}) {
      const { path } = route;
      const toUrl = compile(path);
      let url;
      try {
        url = toUrl(params || {});
      } catch (error) {
        throw new Error(`Framework7: error constructing route URL from passed params:\nRoute: ${path}\n${error.toString()}`);
      }

      if (query) {
        if (typeof query === 'string') url += `?${query}`;
        else url += `?${Utils.serializeObject(query)}`;
      }

      return url;
    }

    findTabRoute(tabEl) {
      const router = this;
      const $tabEl = $(tabEl);
      const parentPath = router.currentRoute.route.parentPath;
      const tabId = $tabEl.attr('id');
      const flattenedRoutes = router.flattenRoutes(router.routes);
      let foundTabRoute;
      flattenedRoutes.forEach((route) => {
        if (
          route.parentPath === parentPath
          && route.tab
          && route.tab.id === tabId
        ) {
          foundTabRoute = route;
        }
      });
      return foundTabRoute;
    }

    findRouteByKey(key, value) {
      const router = this;
      const routes = router.routes;
      const flattenedRoutes = router.flattenRoutes(routes);
      let matchingRoute;

      flattenedRoutes.forEach((route) => {
        if (matchingRoute) return;
        if (route[key] === value) {
          matchingRoute = route;
        }
      });
      return matchingRoute;
    }

    findMatchingRoute(url) {
      if (!url) return undefined;
      const router = this;
      const routes = router.routes;
      const flattenedRoutes = router.flattenRoutes(routes);
      const { path, query, hash, params } = router.parseRouteUrl(url);
      let matchingRoute;
      flattenedRoutes.forEach((route) => {
        if (matchingRoute) return;
        const keys = [];

        const pathsToMatch = [route.path];
        if (route.alias) {
          if (typeof route.alias === 'string') pathsToMatch.push(route.alias);
          else if (Array.isArray(route.alias)) {
            route.alias.forEach((aliasPath) => {
              pathsToMatch.push(aliasPath);
            });
          }
        }

        let matched;
        pathsToMatch.forEach((pathToMatch) => {
          if (matched) return;
          matched = pathToRegexp(pathToMatch, keys).exec(path);
        });

        if (matched) {
          keys.forEach((keyObj, index) => {
            if (typeof keyObj.name === 'number') return;
            const paramValue = matched[index + 1];
            if (typeof paramValue === 'undefined' || paramValue === null) {
              params[keyObj.name] = paramValue;
            } else {
              params[keyObj.name] = decodeURIComponent(paramValue);
            }
          });

          let parentPath;
          if (route.parentPath) {
            parentPath = path.split('/').slice(0, route.parentPath.split('/').length - 1).join('/');
          }

          matchingRoute = {
            query,
            hash,
            params,
            url,
            path,
            parentPath,
            route,
            name: route.name,
          };
        }
      });
      return matchingRoute;
    }

    // eslint-disable-next-line
    replaceRequestUrlParams(url = '', options = {}) {
      let compiledUrl = url;
      if (typeof compiledUrl === 'string'
        && compiledUrl.indexOf('{{') >= 0
        && options
        && options.route
        && options.route.params
        && Object.keys(options.route.params).length
      ) {
        Object.keys(options.route.params).forEach((paramName) => {
          const regExp = new RegExp(`{{${paramName}}}`, 'g');
          compiledUrl = compiledUrl.replace(regExp, options.route.params[paramName] || '');
        });
      }
      return compiledUrl;
    }

    removeFromXhrCache(url) {
      const router = this;
      const xhrCache = router.cache.xhr;
      let index = false;
      for (let i = 0; i < xhrCache.length; i += 1) {
        if (xhrCache[i].url === url) index = i;
      }
      if (index !== false) xhrCache.splice(index, 1);
    }

    xhrRequest(requestUrl, options) {
      const router = this;
      const params = router.params;
      const { ignoreCache } = options;
      let url = requestUrl;

      let hasQuery = url.indexOf('?') >= 0;
      if (params.passRouteQueryToRequest
        && options
        && options.route
        && options.route.query
        && Object.keys(options.route.query).length
      ) {
        url += `${hasQuery ? '&' : '?'}${Utils.serializeObject(options.route.query)}`;
        hasQuery = true;
      }

      if (params.passRouteParamsToRequest
        && options
        && options.route
        && options.route.params
        && Object.keys(options.route.params).length
      ) {
        url += `${hasQuery ? '&' : '?'}${Utils.serializeObject(options.route.params)}`;
        hasQuery = true;
      }

      if (url.indexOf('{{') >= 0) {
        url = router.replaceRequestUrlParams(url, options);
      }
      // should we ignore get params or not
      if (params.xhrCacheIgnoreGetParameters && url.indexOf('?') >= 0) {
        url = url.split('?')[0];
      }
      return new Promise((resolve, reject) => {
        if (params.xhrCache && !ignoreCache && url.indexOf('nocache') < 0 && params.xhrCacheIgnore.indexOf(url) < 0) {
          for (let i = 0; i < router.cache.xhr.length; i += 1) {
            const cachedUrl = router.cache.xhr[i];
            if (cachedUrl.url === url) {
              // Check expiration
              if (Utils.now() - cachedUrl.time < params.xhrCacheDuration) {
                // Load from cache
                resolve(cachedUrl.content);
                return;
              }
            }
          }
        }
        router.xhr = router.app.request({
          url,
          method: 'GET',
          beforeSend(xhr) {
            router.emit('routerAjaxStart', xhr, options);
          },
          complete(xhr, status) {
            router.emit('routerAjaxComplete', xhr);
            if ((status !== 'error' && status !== 'timeout' && (xhr.status >= 200 && xhr.status < 300)) || xhr.status === 0) {
              if (params.xhrCache && xhr.responseText !== '') {
                router.removeFromXhrCache(url);
                router.cache.xhr.push({
                  url,
                  time: Utils.now(),
                  content: xhr.responseText,
                });
              }
              router.emit('routerAjaxSuccess', xhr, options);
              resolve(xhr.responseText);
            } else {
              router.emit('routerAjaxError', xhr, options);
              reject(xhr);
            }
          },
          error(xhr) {
            router.emit('routerAjaxError', xhr, options);
            reject(xhr);
          },
        });
      });
    }

    setNavbarPosition($el, position, ariaHidden) {
      const router = this;
      $el.removeClass('navbar-previous navbar-current navbar-next');
      if (position) {
        $el.addClass(`navbar-${position}`);
      }

      if (ariaHidden === false) {
        $el.removeAttr('aria-hidden');
      } else if (ariaHidden === true) {
        $el.attr('aria-hidden', 'true');
      }
      $el.trigger('navbar:position', { position });
      router.emit('navbarPosition', $el[0], position);
    }

    setPagePosition($el, position, ariaHidden) {
      const router = this;
      $el.removeClass('page-previous page-current page-next');
      $el.addClass(`page-${position}`);
      if (ariaHidden === false) {
        $el.removeAttr('aria-hidden');
      } else if (ariaHidden === true) {
        $el.attr('aria-hidden', 'true');
      }
      $el.trigger('page:position', { position });
      router.emit('pagePosition', $el[0], position);
    }

    // Remove theme elements
    removeThemeElements(el) {
      const router = this;
      const theme = router.app.theme;
      let toRemove;
      if (theme === 'ios') {
        toRemove = '.md-only, .aurora-only, .if-md, .if-aurora, .if-not-ios, .not-ios';
      } else if (theme === 'md') {
        toRemove = '.ios-only, .aurora-only, .if-ios, .if-aurora, .if-not-md, .not-md';
      } else if (theme === 'aurora') {
        toRemove = '.ios-only, .md-only, .if-ios, .if-md, .if-not-aurora, .not-aurora';
      }
      $(el).find(toRemove).remove();
    }

    getPageData(pageEl, navbarEl, from, to, route = {}, pageFromEl) {
      const router = this;
      const $pageEl = $(pageEl).eq(0);
      const $navbarEl = $(navbarEl).eq(0);
      const currentPage = $pageEl[0].f7Page || {};
      let direction;
      let pageFrom;
      if ((from === 'next' && to === 'current') || (from === 'current' && to === 'previous')) direction = 'forward';
      if ((from === 'current' && to === 'next') || (from === 'previous' && to === 'current')) direction = 'backward';
      if (currentPage && !currentPage.fromPage) {
        const $pageFromEl = $(pageFromEl);
        if ($pageFromEl.length) {
          pageFrom = $pageFromEl[0].f7Page;
        }
      }
      pageFrom = currentPage.pageFrom || pageFrom;
      if (pageFrom && pageFrom.pageFrom) {
        pageFrom.pageFrom = null;
      }
      const page = {
        app: router.app,
        view: router.view,
        router,
        $el: $pageEl,
        el: $pageEl[0],
        $pageEl,
        pageEl: $pageEl[0],
        $navbarEl,
        navbarEl: $navbarEl[0],
        name: $pageEl.attr('data-name'),
        position: from,
        from,
        to,
        direction,
        route: currentPage.route ? currentPage.route : route,
        pageFrom,
      };

      $pageEl[0].f7Page = page;
      return page;
    }

    // Callbacks
    pageCallback(callback, pageEl, navbarEl, from, to, options = {}, pageFromEl) {
      if (!pageEl) return;
      const router = this;
      const $pageEl = $(pageEl);
      if (!$pageEl.length) return;
      const $navbarEl = $(navbarEl);
      const { route } = options;
      const restoreScrollTopOnBack = router.params.restoreScrollTopOnBack
        && !(
          router.params.masterDetailBreakpoint > 0
          && $pageEl.hasClass('page-master')
          && router.app.width >= router.params.masterDetailBreakpoint
        );
      const keepAlive = $pageEl[0].f7Page && $pageEl[0].f7Page.route && $pageEl[0].f7Page.route.route && $pageEl[0].f7Page.route.route.keepAlive;

      if (callback === 'beforeRemove' && keepAlive) {
        callback = 'beforeUnmount'; // eslint-disable-line
      }

      const camelName = `page${callback[0].toUpperCase() + callback.slice(1, callback.length)}`;
      const colonName = `page:${callback.toLowerCase()}`;

      let page = {};
      if (callback === 'beforeRemove' && $pageEl[0].f7Page) {
        page = Utils.extend($pageEl[0].f7Page, { from, to, position: from });
      } else {
        page = router.getPageData($pageEl[0], $navbarEl[0], from, to, route, pageFromEl);
      }
      page.swipeBack = !!options.swipeBack;

      const { on = {}, once = {} } = options.route ? options.route.route : {};
      if (options.on) {
        Utils.extend(on, options.on);
      }
      if (options.once) {
        Utils.extend(once, options.once);
      }

      function attachEvents() {
        if ($pageEl[0].f7RouteEventsAttached) return;
        $pageEl[0].f7RouteEventsAttached = true;
        if (on && Object.keys(on).length > 0) {
          $pageEl[0].f7RouteEventsOn = on;
          Object.keys(on).forEach((eventName) => {
            on[eventName] = on[eventName].bind(router);
            $pageEl.on(Utils.eventNameToColonCase(eventName), on[eventName]);
          });
        }
        if (once && Object.keys(once).length > 0) {
          $pageEl[0].f7RouteEventsOnce = once;
          Object.keys(once).forEach((eventName) => {
            once[eventName] = once[eventName].bind(router);
            $pageEl.once(Utils.eventNameToColonCase(eventName), once[eventName]);
          });
        }
      }

      function detachEvents() {
        if (!$pageEl[0].f7RouteEventsAttached) return;
        if ($pageEl[0].f7RouteEventsOn) {
          Object.keys($pageEl[0].f7RouteEventsOn).forEach((eventName) => {
            $pageEl.off(Utils.eventNameToColonCase(eventName), $pageEl[0].f7RouteEventsOn[eventName]);
          });
        }
        if ($pageEl[0].f7RouteEventsOnce) {
          Object.keys($pageEl[0].f7RouteEventsOnce).forEach((eventName) => {
            $pageEl.off(Utils.eventNameToColonCase(eventName), $pageEl[0].f7RouteEventsOnce[eventName]);
          });
        }
        $pageEl[0].f7RouteEventsAttached = null;
        $pageEl[0].f7RouteEventsOn = null;
        $pageEl[0].f7RouteEventsOnce = null;
        delete $pageEl[0].f7RouteEventsAttached;
        delete $pageEl[0].f7RouteEventsOn;
        delete $pageEl[0].f7RouteEventsOnce;
      }

      if (callback === 'mounted') {
        attachEvents();
      }
      if (callback === 'init') {
        if (restoreScrollTopOnBack && (from === 'previous' || !from) && to === 'current' && router.scrollHistory[page.route.url] && !$pageEl.hasClass('no-restore-scroll')) {
          let $pageContent = $pageEl.find('.page-content');
          if ($pageContent.length > 0) {
            // eslint-disable-next-line
            $pageContent = $pageContent.filter((pageContentIndex, pageContentEl) => {
              return (
                $(pageContentEl).parents('.tab:not(.tab-active)').length === 0
                && !$(pageContentEl).is('.tab:not(.tab-active)')
              );
            });
          }
          $pageContent.scrollTop(router.scrollHistory[page.route.url]);
        }
        attachEvents();
        if ($pageEl[0].f7PageInitialized) {
          $pageEl.trigger('page:reinit', page);
          router.emit('pageReinit', page);
          return;
        }
        $pageEl[0].f7PageInitialized = true;
      }
      if (restoreScrollTopOnBack && callback === 'beforeOut' && from === 'current' && to === 'previous') {
        // Save scroll position
        let $pageContent = $pageEl.find('.page-content');
        if ($pageContent.length > 0) {
          // eslint-disable-next-line
          $pageContent = $pageContent.filter((pageContentIndex, pageContentEl) => {
            return (
              $(pageContentEl).parents('.tab:not(.tab-active)').length === 0
              && !$(pageContentEl).is('.tab:not(.tab-active)')
            );
          });
        }
        router.scrollHistory[page.route.url] = $pageContent.scrollTop();
      }
      if (restoreScrollTopOnBack && callback === 'beforeOut' && from === 'current' && to === 'next') {
        // Delete scroll position
        delete router.scrollHistory[page.route.url];
      }

      $pageEl.trigger(colonName, page);
      router.emit(camelName, page);

      if (callback === 'beforeRemove' || callback === 'beforeUnmount') {
        detachEvents();
        if (!keepAlive) {
          if ($pageEl[0].f7Page && $pageEl[0].f7Page.navbarEl) {
            delete $pageEl[0].f7Page.navbarEl.f7Page;
          }
          $pageEl[0].f7Page = null;
        }
      }
    }

    saveHistory() {
      const router = this;
      router.view.history = router.history;
      if (router.params.pushState) {
        win.localStorage[`f7router-${router.view.id}-history`] = JSON.stringify(router.history);
      }
    }

    restoreHistory() {
      const router = this;
      if (router.params.pushState && win.localStorage[`f7router-${router.view.id}-history`]) {
        router.history = JSON.parse(win.localStorage[`f7router-${router.view.id}-history`]);
        router.view.history = router.history;
      }
    }

    clearHistory() {
      const router = this;
      router.history = [];
      if (router.view) router.view.history = [];
      router.saveHistory();
    }

    updateCurrentUrl(newUrl) {
      const router = this;
      appRouterCheck(router, 'updateCurrentUrl');
      // Update history
      if (router.history.length) {
        router.history[router.history.length - 1] = newUrl;
      } else {
        router.history.push(newUrl);
      }

      // Update current route params
      const { query, hash, params, url, path } = router.parseRouteUrl(newUrl);
      if (router.currentRoute) {
        Utils.extend(router.currentRoute, {
          query,
          hash,
          params,
          url,
          path,
        });
      }

      if (router.params.pushState) {
        const pushStateRoot = router.params.pushStateRoot || '';
        History.replace(
          router.view.id,
          {
            url: newUrl,
          },
          pushStateRoot + router.params.pushStateSeparator + newUrl
        );
      }

      // Save History
      router.saveHistory();

      router.emit('routeUrlUpdate', router.currentRoute, router);
    }

    init() {
      const router = this;
      const { app, view } = router;

      // Init Swipeback
      if (
        (view && router.params.iosSwipeBack && app.theme === 'ios')
        || (view && router.params.mdSwipeBack && app.theme === 'md')
        || (view && router.params.auroraSwipeBack && app.theme === 'aurora')
      ) {
        SwipeBack(router);
      }

      let initUrl = router.params.url;
      let documentUrl = doc.location.href.split(doc.location.origin)[1];
      let historyRestored;
      const { pushState, pushStateOnLoad, pushStateSeparator, pushStateAnimateOnLoad } = router.params;
      let { pushStateRoot } = router.params;
      if (win.cordova && pushState && !pushStateSeparator && !pushStateRoot && doc.location.pathname.indexOf('index.html')) {
        // eslint-disable-next-line
        console.warn('Framework7: wrong or not complete pushState configuration, trying to guess pushStateRoot');
        pushStateRoot = doc.location.pathname.split('index.html')[0];
      }
      if (!pushState || !pushStateOnLoad) {
        if (!initUrl) {
          initUrl = documentUrl;
        }
        if (doc.location.search && initUrl.indexOf('?') < 0) {
          initUrl += doc.location.search;
        }
        if (doc.location.hash && initUrl.indexOf('#') < 0) {
          initUrl += doc.location.hash;
        }
      } else {
        if (pushStateRoot && documentUrl.indexOf(pushStateRoot) >= 0) {
          documentUrl = documentUrl.split(pushStateRoot)[1];
          if (documentUrl === '') documentUrl = '/';
        }
        if (pushStateSeparator.length > 0 && documentUrl.indexOf(pushStateSeparator) >= 0) {
          initUrl = documentUrl.split(pushStateSeparator)[1];
        } else {
          initUrl = documentUrl;
        }
        router.restoreHistory();
        if (router.history.indexOf(initUrl) >= 0) {
          router.history = router.history.slice(0, router.history.indexOf(initUrl) + 1);
        } else if (router.params.url === initUrl) {
          router.history = [initUrl];
        } else if (History.state && History.state[view.id] && History.state[view.id].url === router.history[router.history.length - 1]) {
          initUrl = router.history[router.history.length - 1];
        } else {
          router.history = [documentUrl.split(pushStateSeparator)[0] || '/', initUrl];
        }
        if (router.history.length > 1) {
          historyRestored = true;
        } else {
          router.history = [];
        }
        router.saveHistory();
      }
      let currentRoute;
      if (router.history.length > 1) {
        // Will load page
        currentRoute = router.findMatchingRoute(router.history[0]);
        if (!currentRoute) {
          currentRoute = Utils.extend(router.parseRouteUrl(router.history[0]), {
            route: {
              url: router.history[0],
              path: router.history[0].split('?')[0],
            },
          });
        }
      } else {
        // Don't load page
        currentRoute = router.findMatchingRoute(initUrl);
        if (!currentRoute) {
          currentRoute = Utils.extend(router.parseRouteUrl(initUrl), {
            route: {
              url: initUrl,
              path: initUrl.split('?')[0],
            },
          });
        }
      }

      if (router.params.stackPages) {
        router.$el.children('.page').each((index, pageEl) => {
          const $pageEl = $(pageEl);
          router.initialPages.push($pageEl[0]);
          if (router.dynamicNavbar && $pageEl.children('.navbar').length > 0) {
            router.initialNavbars.push($pageEl.children('.navbar')[0]);
          }
        });
      }

      if (router.$el.children('.page:not(.stacked)').length === 0 && initUrl && router.params.loadInitialPage) {
        // No pages presented in DOM, reload new page
        router.navigate(initUrl, {
          initial: true,
          reloadCurrent: true,
          pushState: false,
        });
      } else if (router.$el.children('.page:not(.stacked)').length) {
        // Init current DOM page
        let hasTabRoute;
        router.currentRoute = currentRoute;
        router.$el.children('.page:not(.stacked)').each((index, pageEl) => {
          const $pageEl = $(pageEl);
          let $navbarEl;
          router.setPagePosition($pageEl, 'current');
          if (router.dynamicNavbar) {
            $navbarEl = $pageEl.children('.navbar');
            if ($navbarEl.length > 0) {
              if (!router.$navbarsEl.parents(doc).length) {
                router.$el.prepend(router.$navbarsEl);
              }
              router.setNavbarPosition($navbarEl, 'current');
              router.$navbarsEl.append($navbarEl);
              if ($navbarEl.children('.title-large').length) {
                $navbarEl.addClass('navbar-large');
              }
              $pageEl.children('.navbar').remove();
            } else {
              router.$navbarsEl.addClass('navbar-hidden');
              if ($navbarEl.children('.title-large').length) {
                router.$navbarsEl.addClass('navbar-hidden navbar-large-hidden');
              }
            }
          }
          if (router.currentRoute && router.currentRoute.route && router.currentRoute.route.master && router.params.masterDetailBreakpoint > 0) {
            $pageEl.addClass('page-master');
            $pageEl.trigger('page:role', { role: 'master' });
            if ($navbarEl && $navbarEl.length) {
              $navbarEl.addClass('navbar-master');
            }
            view.checkMasterDetailBreakpoint();
          }
          const initOptions = {
            route: router.currentRoute,
          };
          if (router.currentRoute && router.currentRoute.route && router.currentRoute.route.options) {
            Utils.extend(initOptions, router.currentRoute.route.options);
          }
          router.currentPageEl = $pageEl[0];
          if (router.dynamicNavbar && $navbarEl.length) {
            router.currentNavbarEl = $navbarEl[0];
          }
          router.removeThemeElements($pageEl);
          if (router.dynamicNavbar && $navbarEl.length) {
            router.removeThemeElements($navbarEl);
          }
          if (initOptions.route.route.tab) {
            hasTabRoute = true;
            router.tabLoad(initOptions.route.route.tab, Utils.extend({}, initOptions));
          }
          router.pageCallback('init', $pageEl, $navbarEl, 'current', undefined, initOptions);
        });
        if (historyRestored) {
          router.navigate(initUrl, {
            initial: true,
            pushState: false,
            history: false,
            animate: pushStateAnimateOnLoad,
            once: {
              pageAfterIn() {
                const preloadPreviousPage = router.params.preloadPreviousPage || router.params[`${app.theme}SwipeBack`];
                if (preloadPreviousPage && router.history.length > 2) {
                  router.back({ preload: true });
                }
              },
            },
          });
        }
        if (!historyRestored && !hasTabRoute) {
          router.history.push(initUrl);
          router.saveHistory();
        }
      }
      if (initUrl && pushState && pushStateOnLoad && (!History.state || !History.state[view.id])) {
        History.initViewState(view.id, {
          url: initUrl,
        });
      }
      router.emit('local::init routerInit', router);
    }

    destroy() {
      let router = this;

      router.emit('local::destroy routerDestroy', router);

      // Delete props & methods
      Object.keys(router).forEach((routerProp) => {
        router[routerProp] = null;
        delete router[routerProp];
      });

      router = null;
    }
  }

  // Load
  Router.prototype.forward = forward;
  Router.prototype.load = load;
  Router.prototype.navigate = navigate;
  Router.prototype.refreshPage = refreshPage;
  // Tab
  Router.prototype.tabLoad = tabLoad;
  Router.prototype.tabRemove = tabRemove;
  // Modal
  Router.prototype.modalLoad = modalLoad;
  Router.prototype.modalRemove = modalRemove;
  // Back
  Router.prototype.backward = backward;
  Router.prototype.loadBack = loadBack;
  Router.prototype.back = back;
  // Clear history
  Router.prototype.clearPreviousHistory = clearPreviousHistory;

  var RouterModule = {
    name: 'router',
    static: {
      Router,
    },
    instance: {
      cache: {
        xhr: [],
        templates: [],
        components: [],
      },
    },
    create() {
      const instance = this;
      if (instance.app) {
        // View Router
        if (instance.params.router) {
          instance.router = new Router(instance.app, instance);
        }
      } else {
        // App Router
        instance.router = new Router(instance);
      }
    },
  };

  function resizableView(view) {
    const app = view.app;
    if (view.resizableInitialized) return;
    Utils.extend(view, {
      resizable: true,
      resizableWidth: null,
      resizableInitialized: true,
    });
    const $htmlEl = $('html');
    const { $el } = view;
    if (!$el) return;

    let $resizeHandlerEl;

    let isTouched;
    let isMoved;
    const touchesStart = {};
    let touchesDiff;
    let width;

    let minWidth;
    let maxWidth;

    function transformCSSWidth(v) {
      if (!v) return null;
      if (v.indexOf('%') >= 0 || v.indexOf('vw') >= 0) {
        return parseInt(v, 10) / 100 * app.width;
      }
      const newV = parseInt(v, 10);
      if (Number.isNaN(newV)) return null;
      return newV;
    }

    function isResizable() {
      return view.resizable && $el.hasClass('view-resizable') && $el.hasClass('view-master-detail');
    }

    function handleTouchStart(e) {
      if (!isResizable()) return;
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      isMoved = false;
      isTouched = true;
      const $pageMasterEl = $el.children('.page-master');
      minWidth = transformCSSWidth($pageMasterEl.css('min-width'));
      maxWidth = transformCSSWidth($pageMasterEl.css('max-width'));
    }
    function handleTouchMove(e) {
      if (!isTouched) return;
      e.f7PreventSwipePanel = true;
      const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;

      if (!isMoved) {
        width = $resizeHandlerEl[0].offsetLeft + $resizeHandlerEl[0].offsetWidth;
        $el.addClass('view-resizing');
        $htmlEl.css('cursor', 'col-resize');
      }

      isMoved = true;

      e.preventDefault();

      touchesDiff = (pageX - touchesStart.x);

      let newWidth = width + touchesDiff;
      if (minWidth && !Number.isNaN(minWidth)) {
        newWidth = Math.max(newWidth, minWidth);
      }
      if (maxWidth && !Number.isNaN(maxWidth)) {
        newWidth = Math.min(newWidth, maxWidth);
      }
      newWidth = Math.min(Math.max(newWidth, 0), app.width);

      view.resizableWidth = newWidth;
      $htmlEl[0].style.setProperty('--f7-page-master-width', `${newWidth}px`);

      $el.trigger('view:resize', newWidth);
      view.emit('local::resize viewResize', view, newWidth);
    }
    function handleTouchEnd() {
      $('html').css('cursor', '');
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;

      $htmlEl[0].style.setProperty('--f7-page-master-width', `${view.resizableWidth}px`);
      $el.removeClass('view-resizing');
    }

    function handleResize() {
      if (!view.resizableWidth) return;
      minWidth = transformCSSWidth($resizeHandlerEl.css('min-width'));
      maxWidth = transformCSSWidth($resizeHandlerEl.css('max-width'));

      if (minWidth && !Number.isNaN(minWidth) && view.resizableWidth < minWidth) {
        view.resizableWidth = Math.max(view.resizableWidth, minWidth);
      }
      if (maxWidth && !Number.isNaN(maxWidth) && view.resizableWidth > maxWidth) {
        view.resizableWidth = Math.min(view.resizableWidth, maxWidth);
      }
      view.resizableWidth = Math.min(Math.max(view.resizableWidth, 0), app.width);

      $htmlEl[0].style.setProperty('--f7-page-master-width', `${view.resizableWidth}px`);
    }

    $resizeHandlerEl = view.$el.children('.view-resize-handler');
    if (!$resizeHandlerEl.length) {
      view.$el.append('<div class="view-resize-handler"></div>');
      $resizeHandlerEl = view.$el.children('.view-resize-handler');
    }
    view.$resizeHandlerEl = $resizeHandlerEl;

    $el.addClass('view-resizable');

    // Add Events
    const passive = Support.passiveListener ? { passive: true } : false;

    view.$el.on(app.touchEvents.start, '.view-resize-handler', handleTouchStart, passive);
    app.on('touchmove:active', handleTouchMove);
    app.on('touchend:passive', handleTouchEnd);
    app.on('resize', handleResize);
    view.on('beforeOpen', handleResize);

    view.once('viewDestroy', () => {
      $el.removeClass('view-resizable');
      view.$resizeHandlerEl.remove();
      view.$el.off(app.touchEvents.start, '.view-resize-handler', handleTouchStart, passive);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
      app.off('resize', handleResize);
      view.off('beforeOpen', handleResize);
    });
  }

  class View extends Framework7Class {
    constructor(appInstance, el, viewParams = {}) {
      super(viewParams, [appInstance]);

      const app = appInstance;
      const $el = $(el);
      const view = this;

      const defaults = {
        routes: [],
        routesAdd: [],
      };

      if ($el.length === 0) {
        let message = 'Framework7: can\'t create a View instance because ';
        message += (typeof el === 'string')
          ? `the selector "${el}" didn't match any element`
          : 'el must be an HTMLElement or Dom7 object';

        throw new Error(message);
      }

      // Default View params
      view.params = Utils.extend(defaults, app.params.view, viewParams);

      // Routes
      if (view.params.routes.length > 0) {
        view.routes = view.params.routes;
      } else {
        view.routes = [].concat(app.routes, view.params.routesAdd);
      }

      // Selector
      let selector;
      if (typeof el === 'string') selector = el;
      else {
        // Supposed to be HTMLElement or Dom7
        selector = ($el.attr('id') ? `#${$el.attr('id')}` : '') + ($el.attr('class') ? `.${$el.attr('class').replace(/ /g, '.').replace('.active', '')}` : '');
      }

      // DynamicNavbar
      let $navbarsEl;
      if (app.theme === 'ios' && view.params.iosDynamicNavbar) {
        $navbarsEl = $el.children('.navbars').eq(0);
        if ($navbarsEl.length === 0) {
          $navbarsEl = $('<div class="navbars"></div>');
        }
      }

      // View Props
      Utils.extend(false, view, {
        app,
        $el,
        el: $el[0],
        name: view.params.name,
        main: view.params.main || $el.hasClass('view-main'),
        $navbarsEl,
        navbarsEl: $navbarsEl ? $navbarsEl[0] : undefined,
        selector,
        history: [],
        scrollHistory: {},
      });

      // Save in DOM
      $el[0].f7View = view;

      // Install Modules
      view.useModules();

      // Add to app
      app.views.push(view);
      if (view.main) {
        app.views.main = view;
      }
      if (view.name) {
        app.views[view.name] = view;
      }

      // Index
      view.index = app.views.indexOf(view);

      // View ID
      let viewId;
      if (view.name) {
        viewId = `view_${view.name}`;
      } else if (view.main) {
        viewId = 'view_main';
      } else {
        viewId = `view_${view.index}`;
      }
      view.id = viewId;

      // Init View
      if (app.initialized) {
        view.init();
      } else {
        app.on('init', () => {
          view.init();
        });
      }

      return view;
    }

    destroy() {
      let view = this;
      const app = view.app;

      view.$el.trigger('view:beforedestroy');
      view.emit('local::beforeDestroy viewBeforeDestroy', view);

      app.off('resize', view.checkMasterDetailBreakpoint);

      if (view.main) {
        app.views.main = null;
        delete app.views.main;
      } else if (view.name) {
        app.views[view.name] = null;
        delete app.views[view.name];
      }
      view.$el[0].f7View = null;
      delete view.$el[0].f7View;

      app.views.splice(app.views.indexOf(view), 1);

      // Destroy Router
      if (view.params.router && view.router) {
        view.router.destroy();
      }

      view.emit('local::destroy viewDestroy', view);

      // Delete props & methods
      Object.keys(view).forEach((viewProp) => {
        view[viewProp] = null;
        delete view[viewProp];
      });

      view = null;
    }

    checkMasterDetailBreakpoint(force) {
      const view = this;
      const app = view.app;
      const wasMasterDetail = view.$el.hasClass('view-master-detail');
      const isMasterDetail = app.width >= view.params.masterDetailBreakpoint && view.$el.children('.page-master').length;
      if ((typeof force === 'undefined' && isMasterDetail) || force === true) {
        view.$el.addClass('view-master-detail');
        if (!wasMasterDetail) {
          view.emit('local::masterDetailBreakpoint viewMasterDetailBreakpoint', view);
          view.$el.trigger('view:masterDetailBreakpoint');
        }
      } else {
        view.$el.removeClass('view-master-detail');
        if (wasMasterDetail) {
          view.emit('local::masterDetailBreakpoint viewMasterDetailBreakpoint', view);
          view.$el.trigger('view:masterDetailBreakpoint');
        }
      }
    }

    initMasterDetail() {
      const view = this;
      const app = view.app;
      view.checkMasterDetailBreakpoint = view.checkMasterDetailBreakpoint.bind(view);
      view.checkMasterDetailBreakpoint();
      if (view.params.masterDetailResizable) {
        resizableView(view);
      }
      app.on('resize', view.checkMasterDetailBreakpoint);
    }

    init() {
      const view = this;
      if (view.params.router) {
        if (view.params.masterDetailBreakpoint > 0) {
          view.initMasterDetail();
        }
        view.router.init();
        view.$el.trigger('view:init');
        view.emit('local::init viewInit', view);
      }
    }
  }

  // Use Router
  View.use(RouterModule);

  function initClicks(app) {
    function handleClicks(e) {
      const $clickedEl = $(e.target);
      const $clickedLinkEl = $clickedEl.closest('a');
      const isLink = $clickedLinkEl.length > 0;
      const url = isLink && $clickedLinkEl.attr('href');
      // const isTabLink = isLink && $clickedLinkEl.hasClass('tab-link') && ($clickedLinkEl.attr('data-tab') || (url && url.indexOf('#') === 0));

      // Check if link is external
      if (isLink) {
        // eslint-disable-next-line
        if ($clickedLinkEl.is(app.params.clicks.externalLinks) || (url && url.indexOf('javascript:') >= 0)) {
          const target = $clickedLinkEl.attr('target');
          if (
            url
            && win.cordova
            && win.cordova.InAppBrowser
            && (target === '_system' || target === '_blank')
          ) {
            e.preventDefault();
            win.cordova.InAppBrowser.open(url, target);
          }
          return;
        }
      }

      // Modules Clicks
      Object.keys(app.modules).forEach((moduleName) => {
        const moduleClicks = app.modules[moduleName].clicks;
        if (!moduleClicks) return;
        if (e.preventF7Router) return;
        Object.keys(moduleClicks).forEach((clickSelector) => {
          const matchingClickedElement = $clickedEl.closest(clickSelector).eq(0);
          if (matchingClickedElement.length > 0) {
            moduleClicks[clickSelector].call(app, matchingClickedElement, matchingClickedElement.dataset(), e);
          }
        });
      });

      // Load Page
      let clickedLinkData = {};
      if (isLink) {
        e.preventDefault();
        clickedLinkData = $clickedLinkEl.dataset();
      }

      // Prevent Router
      if (e.preventF7Router) return;
      if ($clickedLinkEl.hasClass('prevent-router') || $clickedLinkEl.hasClass('router-prevent')) return;

      const validUrl = url && url.length > 0 && url[0] !== '#';
      if (validUrl || $clickedLinkEl.hasClass('back')) {
        let view;
        if (clickedLinkData.view && clickedLinkData.view === 'current') {
          view = app.views.current;
        } else if (clickedLinkData.view) {
          view = $(clickedLinkData.view)[0].f7View;
        } else {
          view = $clickedEl.parents('.view')[0] && $clickedEl.parents('.view')[0].f7View;
          if (!$clickedLinkEl.hasClass('back') && view && view.params.linksView) {
            if (typeof view.params.linksView === 'string') view = $(view.params.linksView)[0].f7View;
            else if (view.params.linksView instanceof View) view = view.params.linksView;
          }
        }
        if (!view) {
          if (app.views.main) view = app.views.main;
        }
        if (!view || !view.router) return;
        if (clickedLinkData.context && typeof clickedLinkData.context === 'string') {
          try {
            clickedLinkData.context = JSON.parse(clickedLinkData.context);
          } catch (err) {
            // something wrong there
          }
        }
        if ($clickedLinkEl[0].f7RouteProps) {
          clickedLinkData.props = $clickedLinkEl[0].f7RouteProps;
        }
        if ($clickedLinkEl.hasClass('back')) view.router.back(url, clickedLinkData);
        else view.router.navigate(url, clickedLinkData);
      }
    }

    app.on('click', handleClicks);
  }
  var ClicksModule = {
    name: 'clicks',
    params: {
      clicks: {
        // External Links
        externalLinks: '.external',
      },
    },
    on: {
      init() {
        const app = this;
        initClicks(app);
      },
    },
  };

  var HistoryModule = {
    name: 'history',
    static: {
      history: History,
    },
    on: {
      init() {
        History.init(this);
      },
    },
  };

  const SW = {
    registrations: [],
    register(path, scope) {
      const app = this;
      if (!('serviceWorker' in win.navigator) || !app.serviceWorker.container) {
        return new Promise((resolve, reject) => {
          reject(new Error('Service worker is not supported'));
        });
      }
      return new Promise((resolve, reject) => {
        app.serviceWorker.container.register(path, (scope ? { scope } : {}))
          .then((reg) => {
            SW.registrations.push(reg);
            app.emit('serviceWorkerRegisterSuccess', reg);
            resolve(reg);
          }).catch((error) => {
            app.emit('serviceWorkerRegisterError', error);
            reject(error);
          });
      });
    },
    unregister(registration) {
      const app = this;
      if (!('serviceWorker' in win.navigator) || !app.serviceWorker.container) {
        return new Promise((resolve, reject) => {
          reject(new Error('Service worker is not supported'));
        });
      }
      let registrations;
      if (!registration) registrations = SW.registrations;
      else if (Array.isArray(registration)) registrations = registration;
      else registrations = [registration];
      return Promise.all(registrations.map(reg => new Promise((resolve, reject) => {
        reg.unregister()
          .then(() => {
            if (SW.registrations.indexOf(reg) >= 0) {
              SW.registrations.splice(SW.registrations.indexOf(reg), 1);
            }
            app.emit('serviceWorkerUnregisterSuccess', reg);
            resolve();
          })
          .catch((error) => {
            app.emit('serviceWorkerUnregisterError', reg, error);
            reject(error);
          });
      })));
    },
  };

  var ServiceWorkerModule = {
    name: 'sw',
    params: {
      serviceWorker: {
        path: undefined,
        scope: undefined,
      },
    },
    create() {
      const app = this;
      Utils.extend(app, {
        serviceWorker: {
          container: ('serviceWorker' in win.navigator) ? win.navigator.serviceWorker : undefined,
          registrations: SW.registrations,
          register: SW.register.bind(app),
          unregister: SW.unregister.bind(app),
        },
      });
    },
    on: {
      init() {
        if (!('serviceWorker' in win.navigator)) return;
        const app = this;
        if (!app.serviceWorker.container) return;
        const paths = app.params.serviceWorker.path;
        const scope = app.params.serviceWorker.scope;
        if (!paths || (Array.isArray(paths) && !paths.length)) return;
        const toRegister = Array.isArray(paths) ? paths : [paths];
        toRegister.forEach((path) => {
          app.serviceWorker.register(path, scope);
        });
      },
    },
  };

  const Statusbar = {
    hide() {
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.hide();
      }
    },
    show() {
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.show();
      }
    },
    onClick() {
      const app = this;
      let pageContent;
      if ($('.popup.modal-in').length > 0) {
        // Check for opened popup
        pageContent = $('.popup.modal-in').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($('.panel.panel-in').length > 0) {
        // Check for opened panel
        pageContent = $('.panel.panel-in').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($('.views > .view.tab-active').length > 0) {
        // View in tab bar app layout
        pageContent = $('.views > .view.tab-active').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($('.views').length > 0) {
        pageContent = $('.views').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else {
        pageContent = app.root.children('.view').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      }

      if (pageContent && pageContent.length > 0) {
        // Check for tab
        if (pageContent.hasClass('tab')) {
          pageContent = pageContent.parent('.tabs').children('.page-content.tab-active');
        }
        if (pageContent.length > 0) pageContent.scrollTop(0, 300);
      }
    },
    setTextColor(color) {
      if (Device.cordova && win.StatusBar) {
        if (color === 'white') {
          win.StatusBar.styleLightContent();
        } else {
          win.StatusBar.styleDefault();
        }
      }
    },
    setBackgroundColor(color) {
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.backgroundColorByHexString(color);
      }
    },
    isVisible() {
      if (Device.cordova && win.StatusBar) {
        return win.StatusBar.isVisible;
      }
      return false;
    },
    overlaysWebView(overlays = true) {
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.overlaysWebView(overlays);
      }
    },
    init() {
      const app = this;
      const params = app.params.statusbar;
      if (!params.enabled) return;

      if (Device.cordova && win.StatusBar) {
        if (params.scrollTopOnClick) {
          $(win).on('statusTap', Statusbar.onClick.bind(app));
        }
        if (Device.ios) {
          if (params.iosOverlaysWebView) {
            win.StatusBar.overlaysWebView(true);
          } else {
            win.StatusBar.overlaysWebView(false);
          }
          if (params.iosTextColor === 'white') {
            win.StatusBar.styleLightContent();
          } else {
            win.StatusBar.styleDefault();
          }
        }
        if (Device.android) {
          if (params.androidOverlaysWebView) {
            win.StatusBar.overlaysWebView(true);
          } else {
            win.StatusBar.overlaysWebView(false);
          }
          if (params.androidTextColor === 'white') {
            win.StatusBar.styleLightContent();
          } else {
            win.StatusBar.styleDefault();
          }
        }
      }
      if (params.iosBackgroundColor && Device.ios) {
        Statusbar.setBackgroundColor(params.iosBackgroundColor);
      }
      if (params.androidBackgroundColor && Device.android) {
        Statusbar.setBackgroundColor(params.androidBackgroundColor);
      }
    },
  };

  var Statusbar$1 = {
    name: 'statusbar',
    params: {
      statusbar: {
        enabled: true,

        scrollTopOnClick: true,

        iosOverlaysWebView: true,
        iosTextColor: 'black',
        iosBackgroundColor: null,

        androidOverlaysWebView: false,
        androidTextColor: 'black',
        androidBackgroundColor: null,
      },
    },
    create() {
      const app = this;
      Utils.extend(app, {
        statusbar: {
          hide: Statusbar.hide,
          show: Statusbar.show,
          overlaysWebView: Statusbar.overlaysWebView,
          setTextColor: Statusbar.setTextColor,
          setBackgroundColor: Statusbar.setBackgroundColor,
          isVisible: Statusbar.isVisible,
          init: Statusbar.init.bind(app),
        },
      });
    },
    on: {
      init() {
        const app = this;
        Statusbar.init.call(app);
      },
    },
  };

  function getCurrentView(app) {
    const $popoverView = $('.popover.modal-in .view');
    const $popupView = $('.popup.modal-in .view');
    const $panelView = $('.panel.panel-in .view');
    let $viewsEl = $('.views');
    if ($viewsEl.length === 0) $viewsEl = app.root;
    // Find active view as tab
    let $viewEl = $viewsEl.children('.view');
    if ($viewEl.length === 0) {
      $viewEl = $viewsEl.children('.tabs').children('.view');
    }
    // Propably in tabs or split view
    if ($viewEl.length > 1) {
      if ($viewEl.hasClass('tab')) {
        // Tabs
        $viewEl = $viewsEl.children('.view.tab-active');
        if ($viewEl.length === 0) {
          $viewEl = $viewsEl.children('.tabs').children('.view.tab-active');
        }
      }
    }
    if ($popoverView.length > 0 && $popoverView[0].f7View) return $popoverView[0].f7View;
    if ($popupView.length > 0 && $popupView[0].f7View) return $popupView[0].f7View;
    if ($panelView.length > 0 && $panelView[0].f7View) return $panelView[0].f7View;
    if ($viewEl.length > 0) {
      if ($viewEl.length === 1 && $viewEl[0].f7View) return $viewEl[0].f7View;
      if ($viewEl.length > 1) {
        return app.views.main;
      }
    }
    return undefined;
  }

  var View$1 = {
    name: 'view',
    params: {
      view: {
        name: undefined,
        main: false,
        router: true,
        linksView: null,
        stackPages: false,
        xhrCache: true,
        xhrCacheIgnore: [],
        xhrCacheIgnoreGetParameters: false,
        xhrCacheDuration: 1000 * 60 * 10, // Ten minutes
        componentCache: true,
        preloadPreviousPage: true,
        allowDuplicateUrls: false,
        reloadPages: false,
        reloadDetail: false,
        masterDetailBreakpoint: 0,
        masterDetailResizable: false,
        removeElements: true,
        removeElementsWithTimeout: false,
        removeElementsTimeout: 0,
        restoreScrollTopOnBack: true,
        unloadTabContent: true,
        passRouteQueryToRequest: true,
        passRouteParamsToRequest: false,
        loadInitialPage: true,
        // Swipe Back
        iosSwipeBack: true,
        iosSwipeBackAnimateShadow: true,
        iosSwipeBackAnimateOpacity: true,
        iosSwipeBackActiveArea: 30,
        iosSwipeBackThreshold: 0,
        mdSwipeBack: false,
        mdSwipeBackAnimateShadow: true,
        mdSwipeBackAnimateOpacity: false,
        mdSwipeBackActiveArea: 30,
        mdSwipeBackThreshold: 0,
        auroraSwipeBack: false,
        auroraSwipeBackAnimateShadow: false,
        auroraSwipeBackAnimateOpacity: true,
        auroraSwipeBackActiveArea: 30,
        auroraSwipeBackThreshold: 0,
        // Push State
        pushState: false,
        pushStateRoot: undefined,
        pushStateAnimate: true,
        pushStateAnimateOnLoad: false,
        pushStateSeparator: '#!',
        pushStateOnLoad: true,
        // Animate Pages
        animate: true,
        // iOS Dynamic Navbar
        iosDynamicNavbar: true,
        // Animate iOS Navbar Back Icon
        iosAnimateNavbarBackIcon: true,
        // Delays
        iosPageLoadDelay: 0,
        mdPageLoadDelay: 0,
        auroraPageLoadDelay: 0,
        // Routes hooks
        routesBeforeEnter: null,
        routesBeforeLeave: null,
      },
    },
    static: {
      View,
    },
    create() {
      const app = this;
      Utils.extend(app, {
        views: Utils.extend([], {
          create(el, params) {
            return new View(app, el, params);
          },
          get(viewEl) {
            const $viewEl = $(viewEl);
            if ($viewEl.length && $viewEl[0].f7View) return $viewEl[0].f7View;
            return undefined;
          },
        }),
      });
      Object.defineProperty(app.views, 'current', {
        enumerable: true,
        configurable: true,
        get() {
          return getCurrentView(app);
        },
      });
      // Alias
      app.view = app.views;
    },
    on: {
      init() {
        const app = this;
        $('.view-init').each((index, viewEl) => {
          if (viewEl.f7View) return;
          const viewParams = $(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        });
      },
      'modalOpen panelOpen': function onOpen(instance) {
        const app = this;
        instance.$el.find('.view-init').each((index, viewEl) => {
          if (viewEl.f7View) return;
          const viewParams = $(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        });
      },
      'modalBeforeDestroy panelBeforeDestroy': function onClose(instance) {
        if (!instance || !instance.$el) return;
        instance.$el.find('.view-init').each((index, viewEl) => {
          const view = viewEl.f7View;
          if (!view) return;
          view.destroy();
        });
      },
    },
    vnode: {
      'view-init': {
        insert(vnode) {
          const app = this;
          const viewEl = vnode.elm;
          if (viewEl.f7View) return;
          const viewParams = $(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        },
        destroy(vnode) {
          const viewEl = vnode.elm;
          const view = viewEl.f7View;
          if (!view) return;
          view.destroy();
        },
      },
    },
  };

  const Navbar = {
    size(el) {
      const app = this;

      let $el = $(el);

      if ($el.hasClass('navbars')) {
        $el = $el.children('.navbar').each((index, navbarEl) => {
          app.navbar.size(navbarEl);
        });
        return;
      }

      const $innerEl = $el.children('.navbar-inner');
      if (!$innerEl.length) return;

      const needCenterTitle = (
        $innerEl.hasClass('navbar-inner-centered-title')
        || app.params.navbar[`${app.theme}CenterTitle`]
      );
      const needLeftTitle = app.theme === 'ios' && !app.params.navbar[`${app.theme}CenterTitle`];

      if (!needCenterTitle && !needLeftTitle) return;

      if (
        $el.hasClass('stacked')
        || $el.parents('.stacked').length > 0
        || $el.parents('.tab:not(.tab-active)').length > 0
        || $el.parents('.popup:not(.modal-in)').length > 0
      ) {
        return;
      }

      if (app.theme !== 'ios' && app.params.navbar[`${app.theme}CenterTitle`]) {
        $innerEl.addClass('navbar-inner-centered-title');
      }
      if (app.theme === 'ios' && !app.params.navbar.iosCenterTitle) {
        $innerEl.addClass('navbar-inner-left-title');
      }

      const $viewEl = $el.parents('.view').eq(0);
      const left = app.rtl ? $innerEl.children('.right') : $innerEl.children('.left');
      const right = app.rtl ? $innerEl.children('.left') : $innerEl.children('.right');
      const title = $innerEl.children('.title');
      const subnavbar = $innerEl.children('.subnavbar');
      const noLeft = left.length === 0;
      const noRight = right.length === 0;
      const leftWidth = noLeft ? 0 : left.outerWidth(true);
      const rightWidth = noRight ? 0 : right.outerWidth(true);
      const titleWidth = title.outerWidth(true);
      const navbarStyles = $innerEl.styles();
      const navbarWidth = $innerEl[0].offsetWidth;
      const navbarInnerWidth = navbarWidth - parseInt(navbarStyles.paddingLeft, 10) - parseInt(navbarStyles.paddingRight, 10);
      const isPrevious = $el.hasClass('navbar-previous');
      const sliding = $innerEl.hasClass('sliding');

      let router;
      let dynamicNavbar;

      if ($viewEl.length > 0 && $viewEl[0].f7View) {
        router = $viewEl[0].f7View.router;
        dynamicNavbar = router && router.dynamicNavbar;
      }

      let currLeft;
      let diff;
      if (noRight) {
        currLeft = navbarInnerWidth - titleWidth;
      }
      if (noLeft) {
        currLeft = 0;
      }
      if (!noLeft && !noRight) {
        currLeft = ((navbarInnerWidth - rightWidth - titleWidth) + leftWidth) / 2;
      }
      let requiredLeft = (navbarInnerWidth - titleWidth) / 2;
      if (navbarInnerWidth - leftWidth - rightWidth > titleWidth) {
        if (requiredLeft < leftWidth) {
          requiredLeft = leftWidth;
        }
        if (requiredLeft + titleWidth > navbarInnerWidth - rightWidth) {
          requiredLeft = navbarInnerWidth - rightWidth - titleWidth;
        }
        diff = requiredLeft - currLeft;
      } else {
        diff = 0;
      }

      // RTL inverter
      const inverter = app.rtl ? -1 : 1;

      if (dynamicNavbar && app.theme === 'ios') {
        if (title.hasClass('sliding') || (title.length > 0 && sliding)) {
          let titleLeftOffset = -(currLeft + diff) * inverter;
          const titleRightOffset = (navbarInnerWidth - currLeft - diff - titleWidth) * inverter;

          if (isPrevious) {
            if (router && router.params.iosAnimateNavbarBackIcon) {
              const activeNavbarBackLink = $el.parent().find('.navbar-current').children('.left.sliding').find('.back .icon ~ span');
              if (activeNavbarBackLink.length > 0) {
                titleLeftOffset += activeNavbarBackLink[0].offsetLeft;
              }
            }
          }
          title[0].f7NavbarLeftOffset = titleLeftOffset;
          title[0].f7NavbarRightOffset = titleRightOffset;
        }
        if (!noLeft && (left.hasClass('sliding') || sliding)) {
          if (app.rtl) {
            left[0].f7NavbarLeftOffset = (-(navbarInnerWidth - left[0].offsetWidth) / 2) * inverter;
            left[0].f7NavbarRightOffset = leftWidth * inverter;
          } else {
            left[0].f7NavbarLeftOffset = -leftWidth;
            left[0].f7NavbarRightOffset = ((navbarInnerWidth - left[0].offsetWidth) / 2);
            if (router && router.params.iosAnimateNavbarBackIcon && left.find('.back .icon').length > 0) {
              if (left.find('.back .icon ~ span').length) {
                const leftOffset = left[0].f7NavbarLeftOffset;
                const rightOffset = left[0].f7NavbarRightOffset;
                left[0].f7NavbarLeftOffset = 0;
                left[0].f7NavbarRightOffset = 0;
                left.find('.back .icon ~ span')[0].f7NavbarLeftOffset = leftOffset;
                left.find('.back .icon ~ span')[0].f7NavbarRightOffset = rightOffset - left.find('.back .icon')[0].offsetWidth;
              }
            }
          }
        }
        if (!noRight && (right.hasClass('sliding') || sliding)) {
          if (app.rtl) {
            right[0].f7NavbarLeftOffset = -rightWidth * inverter;
            right[0].f7NavbarRightOffset = ((navbarInnerWidth - right[0].offsetWidth) / 2) * inverter;
          } else {
            right[0].f7NavbarLeftOffset = -(navbarInnerWidth - right[0].offsetWidth) / 2;
            right[0].f7NavbarRightOffset = rightWidth;
          }
        }
        if (subnavbar.length && (subnavbar.hasClass('sliding') || sliding)) {
          subnavbar[0].f7NavbarLeftOffset = app.rtl ? subnavbar[0].offsetWidth : -subnavbar[0].offsetWidth;
          subnavbar[0].f7NavbarRightOffset = -subnavbar[0].f7NavbarLeftOffset;
        }
      }

      // Center title
      if (needCenterTitle) {
        let titleLeft = diff;
        if (app.rtl && noLeft && noRight && title.length > 0) titleLeft = -titleLeft;
        title.css({ left: `${titleLeft}px` });
      }
    },
    hide(el, animate = true, hideStatusbar = false) {
      const app = this;
      let $el = $(el);
      const isDynamic = $el.hasClass('navbar') && $el.parent('.navbars').length;
      if (isDynamic) $el = $el.parents('.navbars');
      if (!$el.length) return;
      if ($el.hasClass('navbar-hidden')) return;
      let className = `navbar-hidden${animate ? ' navbar-transitioning' : ''}`;
      const currentIsLarge = isDynamic
        ? $el.find('.navbar-current .title-large').length
        : $el.find('.title-large').length;
      if (currentIsLarge) {
        className += ' navbar-large-hidden';
      }
      if (hideStatusbar) {
        className += ' navbar-hidden-statusbar';
      }
      $el.transitionEnd(() => {
        $el.removeClass('navbar-transitioning');
      });
      $el.addClass(className);
      if (isDynamic) {
        $el.children('.navbar').each((index, subEl) => {
          $(subEl).trigger('navbar:hide');
          app.emit('navbarHide', subEl);
        });
      } else {
        $el.trigger('navbar:hide');
        app.emit('navbarHide', $el[0]);
      }
    },
    show(el = '.navbar-hidden', animate = true) {
      const app = this;
      let $el = $(el);
      const isDynamic = $el.hasClass('navbar') && $el.parent('.navbars').length;
      if (isDynamic) $el = $el.parents('.navbars');
      if (!$el.length) return;
      if (!$el.hasClass('navbar-hidden')) return;
      if (animate) {
        $el.addClass('navbar-transitioning');
        $el.transitionEnd(() => {
          $el.removeClass('navbar-transitioning');
        });
      }
      $el.removeClass('navbar-hidden navbar-large-hidden navbar-hidden-statusbar');
      if (isDynamic) {
        $el.children('.navbar').each((index, subEl) => {
          $(subEl).trigger('navbar:show');
          app.emit('navbarShow', subEl);
        });
      } else {
        $el.trigger('navbar:show');
        app.emit('navbarShow', $el[0]);
      }
    },
    getElByPage(page) {
      let $pageEl;
      let $navbarEl;
      let pageData;
      if (page.$navbarEl || page.$el) {
        pageData = page;
        $pageEl = page.$el;
      } else {
        $pageEl = $(page);
        if ($pageEl.length > 0) pageData = $pageEl[0].f7Page;
      }
      if (pageData && pageData.$navbarEl && pageData.$navbarEl.length > 0) {
        $navbarEl = pageData.$navbarEl;
      } else if ($pageEl) {
        $navbarEl = $pageEl.children('.navbar');
      }
      if (!$navbarEl || ($navbarEl && $navbarEl.length === 0)) return undefined;
      return $navbarEl[0];
    },
    getPageByEl(navbarEl) {
      const $navbarEl = $(navbarEl);
      if ($navbarEl.parents('.page').length) {
        return $navbarEl.parents('.page')[0];
      }
      let pageEl;
      $navbarEl.parents('.view').find('.page').each((index, el) => {
        if (el && el.f7Page && el.f7Page.navbarEl && $navbarEl[0] === el.f7Page.navbarEl) {
          pageEl = el;
        }
      });
      return pageEl;
    },

    collapseLargeTitle(navbarEl) {
      const app = this;
      let $navbarEl = $(navbarEl);
      if ($navbarEl.hasClass('navbars')) {
        $navbarEl = $navbarEl.find('.navbar');
        if ($navbarEl.length > 1) {
          $navbarEl = $(navbarEl).find('.navbar-large.navbar-current');
        }
        if ($navbarEl.length > 1 || !$navbarEl.length) {
          return;
        }
      }
      const $pageEl = $(app.navbar.getPageByEl($navbarEl));
      $navbarEl.addClass('navbar-large-collapsed');
      $pageEl.eq(0).addClass('page-with-navbar-large-collapsed').trigger('page:navbarlargecollapsed');
      app.emit('pageNavbarLargeCollapsed', $pageEl[0]);
      $navbarEl.trigger('navbar:collapse');
      app.emit('navbarCollapse', $navbarEl[0]);
    },
    expandLargeTitle(navbarEl) {
      const app = this;
      let $navbarEl = $(navbarEl);
      if ($navbarEl.hasClass('navbars')) {
        $navbarEl = $navbarEl.find('.navbar-large');
        if ($navbarEl.length > 1) {
          $navbarEl = $(navbarEl).find('.navbar-large.navbar-current');
        }
        if ($navbarEl.length > 1 || !$navbarEl.length) {
          return;
        }
      }
      const $pageEl = $(app.navbar.getPageByEl($navbarEl));
      $navbarEl.removeClass('navbar-large-collapsed');
      $pageEl.eq(0).removeClass('page-with-navbar-large-collapsed').trigger('page:navbarlargeexpanded');
      app.emit('pageNavbarLargeExpanded', $pageEl[0]);
      $navbarEl.trigger('navbar:expand');
      app.emit('navbarExpand', $navbarEl[0]);
    },
    toggleLargeTitle(navbarEl) {
      const app = this;
      let $navbarEl = $(navbarEl);
      if ($navbarEl.hasClass('navbars')) {
        $navbarEl = $navbarEl.find('.navbar-large');
        if ($navbarEl.length > 1) {
          $navbarEl = $(navbarEl).find('.navbar-large.navbar-current');
        }
        if ($navbarEl.length > 1 || !$navbarEl.length) {
          return;
        }
      }
      if ($navbarEl.hasClass('navbar-large-collapsed')) {
        app.navbar.expandLargeTitle($navbarEl);
      } else {
        app.navbar.collapseLargeTitle($navbarEl);
      }
    },
    initNavbarOnScroll(pageEl, navbarEl, needHide, needCollapse, needTransparent) {
      const app = this;
      const $pageEl = $(pageEl);
      const $navbarEl = $(navbarEl);
      const $titleLargeEl = $navbarEl.find('.title-large');
      const isLarge = $titleLargeEl.length || $navbarEl.hasClass('.navbar-large');
      let navbarHideHeight = 44;
      const snapPageScrollToLargeTitle = app.params.navbar.snapPageScrollToLargeTitle;
      const snapPageScrollToTransparentNavbar = app.params.navbar.snapPageScrollToTransparentNavbar;

      let previousScrollTop;
      let currentScrollTop;

      let scrollHeight;
      let offsetHeight;
      let reachEnd;
      let action;
      let navbarHidden;

      let navbarCollapsed;
      let navbarTitleLargeHeight;

      let navbarOffsetHeight;

      if (needCollapse || (needHide && isLarge)) {
        navbarTitleLargeHeight = $navbarEl.css('--f7-navbar-large-title-height');

        if (navbarTitleLargeHeight && navbarTitleLargeHeight.indexOf('px') >= 0) {
          navbarTitleLargeHeight = parseInt(navbarTitleLargeHeight, 10);
          if (Number.isNaN(navbarTitleLargeHeight) && $titleLargeEl.length) {
            navbarTitleLargeHeight = $titleLargeEl[0].offsetHeight;
          } else if (Number.isNaN(navbarTitleLargeHeight)) {
            if (app.theme === 'ios') navbarTitleLargeHeight = 52;
            else if (app.theme === 'md') navbarTitleLargeHeight = 48;
            else if (app.theme === 'aurora') navbarTitleLargeHeight = 38;
          }
        } else if ($titleLargeEl.length) {
          navbarTitleLargeHeight = $titleLargeEl[0].offsetHeight;
        } else { // eslint-disable-next-line
          if (app.theme === 'ios') navbarTitleLargeHeight = 52;
          else if (app.theme === 'md') navbarTitleLargeHeight = 48;
          else if (app.theme === 'aurora') navbarTitleLargeHeight = 38;
        }
      }

      if (needHide && isLarge) {
        navbarHideHeight += navbarTitleLargeHeight;
      }

      let scrollChanged;
      let scrollContent;
      let scrollTimeoutId;
      let touchEndTimeoutId;
      const touchSnapTimeout = 70;
      const desktopSnapTimeout = 300;

      function snapLargeNavbar() {
        const inSearchbarExpanded = $navbarEl.hasClass('with-searchbar-expandable-enabled');
        if (inSearchbarExpanded) return;
        if (!scrollContent || currentScrollTop < 0) return;
        if (currentScrollTop >= navbarTitleLargeHeight / 2 && currentScrollTop < navbarTitleLargeHeight) {
          $(scrollContent).scrollTop(navbarTitleLargeHeight, 100);
        } else if (currentScrollTop < navbarTitleLargeHeight) {
          $(scrollContent).scrollTop(0, 200);
        }
      }

      function snapTransparentNavbar() {
        const inSearchbarExpanded = $navbarEl.hasClass('with-searchbar-expandable-enabled');
        if (inSearchbarExpanded) return;
        if (!scrollContent || currentScrollTop < 0) return;
        if (currentScrollTop >= navbarOffsetHeight / 2 && currentScrollTop < navbarOffsetHeight) {
          $(scrollContent).scrollTop(navbarOffsetHeight, 100);
        } else if (currentScrollTop < navbarOffsetHeight) {
          $(scrollContent).scrollTop(0, 200);
        }
      }

      function handleNavbarTransparent() {
        const isHidden = $navbarEl.hasClass('navbar-hidden') || $navbarEl.parent('.navbars').hasClass('navbar-hidden');
        const inSearchbarExpanded = $navbarEl.hasClass('with-searchbar-expandable-enabled');
        if (inSearchbarExpanded || isHidden) return;
        if (!navbarOffsetHeight) {
          navbarOffsetHeight = navbarEl.offsetHeight;
        }
        let opacity = currentScrollTop / navbarOffsetHeight;
        const notTransparent = $navbarEl.hasClass('navbar-transparent-visible');
        opacity = Math.max(Math.min(opacity, 1), 0);

        if ((notTransparent && opacity === 1) || (!notTransparent && opacity === 0)) {
          $navbarEl.find('.navbar-bg, .title').css('opacity', '');
          return;
        }
        if (notTransparent && opacity === 0) {
          $navbarEl.trigger('navbar:transparenthide');
          app.emit('navbarTransparentHide', $navbarEl[0]);
          $navbarEl.removeClass('navbar-transparent-visible');
          $navbarEl.find('.navbar-bg, .title').css('opacity', '');
          return;
        }
        if (!notTransparent && opacity === 1) {
          $navbarEl.trigger('navbar:transparentshow');
          app.emit('navbarTransparentShow', $navbarEl[0]);
          $navbarEl.addClass('navbar-transparent-visible');
          $navbarEl.find('.navbar-bg, .title').css('opacity', '');
          return;
        }

        $navbarEl.find('.navbar-bg, .title').css('opacity', opacity);

        if (snapPageScrollToTransparentNavbar) {
          if (!Support.touch) {
            clearTimeout(scrollTimeoutId);
            scrollTimeoutId = setTimeout(() => {
              snapTransparentNavbar();
            }, desktopSnapTimeout);
          } else if (touchEndTimeoutId) {
            clearTimeout(touchEndTimeoutId);
            touchEndTimeoutId = null;
            touchEndTimeoutId = setTimeout(() => {
              snapTransparentNavbar();
              clearTimeout(touchEndTimeoutId);
              touchEndTimeoutId = null;
            }, touchSnapTimeout);
          }
        }
      }

      let previousCollapseProgress = null;
      let collapseProgress = null;
      function handleLargeNavbarCollapse() {
        const isHidden = $navbarEl.hasClass('navbar-hidden') || $navbarEl.parent('.navbars').hasClass('navbar-hidden');
        if (isHidden) return;
        const isLargeTransparent = $navbarEl.hasClass('navbar-large-transparent')
          || (
            $navbarEl.hasClass('navbar-large')
            && $navbarEl.hasClass('navbar-transparent')
          );
        previousCollapseProgress = collapseProgress;
        collapseProgress = Math.min(Math.max((currentScrollTop / navbarTitleLargeHeight), 0), 1);
        const previousCollapseWasInMiddle = previousCollapseProgress > 0 && previousCollapseProgress < 1;
        const inSearchbarExpanded = $navbarEl.hasClass('with-searchbar-expandable-enabled');
        if (inSearchbarExpanded) return;
        navbarCollapsed = $navbarEl.hasClass('navbar-large-collapsed');
        if (collapseProgress === 0 && navbarCollapsed) {
          app.navbar.expandLargeTitle($navbarEl[0]);
        } else if (collapseProgress === 1 && !navbarCollapsed) {
          app.navbar.collapseLargeTitle($navbarEl[0]);
        }
        if (
          (collapseProgress === 0 && navbarCollapsed)
          || (collapseProgress === 0 && previousCollapseWasInMiddle)
          || (collapseProgress === 1 && !navbarCollapsed)
          || (collapseProgress === 1 && previousCollapseWasInMiddle)
        ) {
          if (app.theme === 'md') {
            $navbarEl.find('.navbar-inner').css('overflow', '');
          }
          $navbarEl.find('.title').css('opacity', '');
          $navbarEl.find('.title-large-text, .subnavbar').css('transform', '');
          if (isLargeTransparent) {
            $navbarEl.find('.navbar-bg').css('opacity', '');
          } else {
            $navbarEl.find('.navbar-bg').css('transform', '');
          }
        } else if (collapseProgress > 0 && collapseProgress < 1) {
          if (app.theme === 'md') {
            $navbarEl.find('.navbar-inner').css('overflow', 'visible');
          }
          $navbarEl.find('.title').css('opacity', collapseProgress);
          $navbarEl.find('.title-large-text, .subnavbar').css('transform', `translate3d(0px, ${-1 * collapseProgress * navbarTitleLargeHeight}px, 0)`);
          if (isLargeTransparent) {
            $navbarEl.find('.navbar-bg').css('opacity', collapseProgress);
          } else {
            $navbarEl.find('.navbar-bg').css('transform', `translate3d(0px, ${-1 * collapseProgress * navbarTitleLargeHeight}px, 0)`);
          }
        }

        if (snapPageScrollToLargeTitle) {
          if (!Support.touch) {
            clearTimeout(scrollTimeoutId);
            scrollTimeoutId = setTimeout(() => {
              snapLargeNavbar();
            }, desktopSnapTimeout);
          } else if (touchEndTimeoutId) {
            clearTimeout(touchEndTimeoutId);
            touchEndTimeoutId = null;
            touchEndTimeoutId = setTimeout(() => {
              snapLargeNavbar();
              clearTimeout(touchEndTimeoutId);
              touchEndTimeoutId = null;
            }, touchSnapTimeout);
          }
        }
      }

      function handleTitleHideShow() {
        if ($pageEl.hasClass('page-with-card-opened')) return;
        scrollHeight = scrollContent.scrollHeight;
        offsetHeight = scrollContent.offsetHeight;
        reachEnd = currentScrollTop + offsetHeight >= scrollHeight;
        navbarHidden = $navbarEl.hasClass('navbar-hidden') || $navbarEl.parent('.navbars').hasClass('navbar-hidden');
        if (reachEnd) {
          if (app.params.navbar.showOnPageScrollEnd) {
            action = 'show';
          }
        } else if (previousScrollTop > currentScrollTop) {
          if (app.params.navbar.showOnPageScrollTop || currentScrollTop <= navbarHideHeight) {
            action = 'show';
          } else {
            action = 'hide';
          }
        } else if (currentScrollTop > navbarHideHeight) {
          action = 'hide';
        } else {
          action = 'show';
        }

        if (action === 'show' && navbarHidden) {
          app.navbar.show($navbarEl);
          navbarHidden = false;
        } else if (action === 'hide' && !navbarHidden) {
          app.navbar.hide($navbarEl);
          navbarHidden = true;
        }
        previousScrollTop = currentScrollTop;
      }

      function handleScroll(e) {
        scrollContent = this;
        if (e && e.target && e.target !== scrollContent) {
          return;
        }
        currentScrollTop = scrollContent.scrollTop;
        scrollChanged = currentScrollTop;
        if (needCollapse) {
          handleLargeNavbarCollapse();
        } else if (needTransparent) {
          handleNavbarTransparent();
        }
        if ($pageEl.hasClass('page-previous')) return;
        if (needHide) {
          handleTitleHideShow();
        }
      }
      function handeTouchStart() {
        scrollChanged = false;
      }
      function handleTouchEnd() {
        clearTimeout(touchEndTimeoutId);
        touchEndTimeoutId = null;
        touchEndTimeoutId = setTimeout(() => {
          if (scrollChanged !== false) {
            if (needTransparent && !needCollapse) {
              snapTransparentNavbar();
            } else {
              snapLargeNavbar();
            }
            clearTimeout(touchEndTimeoutId);
            touchEndTimeoutId = null;
          }
        }, touchSnapTimeout);
      }
      $pageEl.on('scroll', '.page-content', handleScroll, true);
      if (Support.touch && ((needCollapse && snapPageScrollToLargeTitle) || (needTransparent && snapPageScrollToTransparentNavbar))) {
        app.on('touchstart:passive', handeTouchStart);
        app.on('touchend:passive', handleTouchEnd);
      }
      if (needCollapse) {
        $pageEl.find('.page-content').each((pageContentIndex, pageContentEl) => {
          if (pageContentEl.scrollTop > 0) handleScroll.call(pageContentEl);
        });
      } else if (needTransparent) {
        $pageEl.find('.page-content').each((pageContentIndex, pageContentEl) => {
          if (pageContentEl.scrollTop > 0) handleScroll.call(pageContentEl);
        });
      }
      $pageEl[0].f7DetachNavbarScrollHandlers = function f7DetachNavbarScrollHandlers() {
        delete $pageEl[0].f7DetachNavbarScrollHandlers;
        $pageEl.off('scroll', '.page-content', handleScroll, true);
        if (Support.touch && ((needCollapse && snapPageScrollToLargeTitle) || (needTransparent && snapPageScrollToTransparentNavbar))) {
          app.off('touchstart:passive', handeTouchStart);
          app.off('touchend:passive', handleTouchEnd);
        }
      };
    },
  };
  var Navbar$1 = {
    name: 'navbar',
    create() {
      const app = this;
      Utils.extend(app, {
        navbar: {
          size: Navbar.size.bind(app),
          hide: Navbar.hide.bind(app),
          show: Navbar.show.bind(app),
          getElByPage: Navbar.getElByPage.bind(app),
          getPageByEl: Navbar.getPageByEl.bind(app),
          collapseLargeTitle: Navbar.collapseLargeTitle.bind(app),
          expandLargeTitle: Navbar.expandLargeTitle.bind(app),
          toggleLargeTitle: Navbar.toggleLargeTitle.bind(app),
          initNavbarOnScroll: Navbar.initNavbarOnScroll.bind(app),
        },
      });
    },
    params: {
      navbar: {
        scrollTopOnTitleClick: true,
        iosCenterTitle: true,
        mdCenterTitle: false,
        auroraCenterTitle: true,
        hideOnPageScroll: false,
        showOnPageScrollEnd: true,
        showOnPageScrollTop: true,
        collapseLargeTitleOnScroll: true,
        snapPageScrollToLargeTitle: true,
        snapPageScrollToTransparentNavbar: true,
      },
    },
    on: {
      'panelBreakpoint panelCollapsedBreakpoint panelResize viewResize resize viewMasterDetailBreakpoint': function onPanelResize() {
        const app = this;
        $('.navbar').each((index, navbarEl) => {
          app.navbar.size(navbarEl);
        });
      },
      pageBeforeRemove(page) {
        if (page.$el[0].f7DetachNavbarScrollHandlers) {
          page.$el[0].f7DetachNavbarScrollHandlers();
        }
      },
      pageBeforeIn(page) {
        const app = this;
        if (app.theme !== 'ios') return;
        let $navbarsEl;
        const view = page.$el.parents('.view')[0].f7View;
        const navbarEl = app.navbar.getElByPage(page);
        if (!navbarEl) {
          $navbarsEl = page.$el.parents('.view').children('.navbars');
        } else {
          $navbarsEl = $(navbarEl).parents('.navbars');
        }
        if (page.$el.hasClass('no-navbar') || (view.router.dynamicNavbar && !navbarEl)) {
          const animate = !!(page.pageFrom && page.router.history.length > 0);
          app.navbar.hide($navbarsEl, animate);
        } else {
          app.navbar.show($navbarsEl);
        }
      },
      pageReinit(page) {
        const app = this;
        const $navbarEl = $(app.navbar.getElByPage(page));
        if (!$navbarEl || $navbarEl.length === 0) return;
        app.navbar.size($navbarEl);
      },
      pageInit(page) {
        const app = this;
        const $navbarEl = $(app.navbar.getElByPage(page));
        if (!$navbarEl || $navbarEl.length === 0) return;

        // Size
        app.navbar.size($navbarEl);

        // Need Collapse On Scroll
        let needCollapseOnScrollHandler;
        if ($navbarEl.find('.title-large').length > 0) {
          $navbarEl.addClass('navbar-large');
        }
        if ($navbarEl.hasClass('navbar-large')) {
          if (app.params.navbar.collapseLargeTitleOnScroll) needCollapseOnScrollHandler = true;
          page.$el.addClass('page-with-navbar-large');
        }

        // Need transparent on scroll
        let needTransparentOnScroll;
        if (!needCollapseOnScrollHandler && $navbarEl.hasClass('navbar-transparent')) {
          needTransparentOnScroll = true;
        }

        // Need Hide On Scroll
        let needHideOnScrollHandler;
        if (
          app.params.navbar.hideOnPageScroll
          || page.$el.find('.hide-navbar-on-scroll').length
          || page.$el.hasClass('hide-navbar-on-scroll')
          || page.$el.find('.hide-bars-on-scroll').length
          || page.$el.hasClass('hide-bars-on-scroll')
        ) {
          if (
            page.$el.find('.keep-navbar-on-scroll').length
            || page.$el.hasClass('keep-navbar-on-scroll')
            || page.$el.find('.keep-bars-on-scroll').length
            || page.$el.hasClass('keep-bars-on-scroll')
          ) {
            needHideOnScrollHandler = false;
          } else {
            needHideOnScrollHandler = true;
          }
        }

        if (needCollapseOnScrollHandler || needHideOnScrollHandler || needTransparentOnScroll) {
          app.navbar.initNavbarOnScroll(page.el, $navbarEl[0], needHideOnScrollHandler, needCollapseOnScrollHandler, needTransparentOnScroll);
        }
      },
      'panelOpen panelSwipeOpen modalOpen': function onPanelModalOpen(instance) {
        const app = this;
        instance.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each((index, navbarEl) => {
          app.navbar.size(navbarEl);
        });
      },
      tabShow(tabEl) {
        const app = this;
        $(tabEl).find('.navbar:not(.navbar-previous):not(.stacked)').each((index, navbarEl) => {
          app.navbar.size(navbarEl);
        });
      },
    },
    clicks: {
      '.navbar .title': function onTitleClick($clickedEl) {
        const app = this;
        if (!app.params.navbar.scrollTopOnTitleClick) return;
        if ($clickedEl.closest('a').length > 0) {
          return;
        }
        let $pageContentEl;

        // Find active page
        const $navbarEl = $clickedEl.parents('.navbar');
        const $navbarsEl = $navbarEl.parents('.navbars');

        // Static Layout
        $pageContentEl = $navbarEl.parents('.page-content');

        if ($pageContentEl.length === 0) {
          // Fixed Layout
          if ($navbarEl.parents('.page').length > 0) {
            $pageContentEl = $navbarEl.parents('.page').find('.page-content');
          }
          // Through Layout iOS
          if ($pageContentEl.length === 0 && $navbarsEl.length) {
            if ($navbarsEl.nextAll('.page-current:not(.stacked)').length > 0) {
              $pageContentEl = $navbarsEl.nextAll('.page-current:not(.stacked)').find('.page-content');
            }
          }
          // Through Layout
          if ($pageContentEl.length === 0) {
            if ($navbarEl.nextAll('.page-current:not(.stacked)').length > 0) {
              $pageContentEl = $navbarEl.nextAll('.page-current:not(.stacked)').find('.page-content');
            }
          }
        }
        if ($pageContentEl && $pageContentEl.length > 0) {
          // Check for tab
          if ($pageContentEl.hasClass('tab')) {
            $pageContentEl = $pageContentEl.parent('.tabs').children('.page-content.tab-active');
          }
          if ($pageContentEl.length > 0) $pageContentEl.scrollTop(0, 300);
        }
      },
    },
    vnode: {
      navbar: {
        postpatch(vnode) {
          const app = this;
          app.navbar.size(vnode.elm);
        },
      },
    },
  };

  const Toolbar = {
    setHighlight(tabbarEl) {
      const app = this;
      if (app.theme !== 'md') return;

      const $tabbarEl = $(tabbarEl);

      if ($tabbarEl.length === 0 || !($tabbarEl.hasClass('tabbar') || $tabbarEl.hasClass('tabbar-labels'))) return;

      let $highlightEl = $tabbarEl.find('.tab-link-highlight');
      const tabLinksCount = $tabbarEl.find('.tab-link').length;
      if (tabLinksCount === 0) {
        $highlightEl.remove();
        return;
      }

      if ($highlightEl.length === 0) {
        $tabbarEl.children('.toolbar-inner').append('<span class="tab-link-highlight"></span>');
        $highlightEl = $tabbarEl.find('.tab-link-highlight');
      } else if ($highlightEl.next().length) {
        $tabbarEl.children('.toolbar-inner').append($highlightEl);
      }

      const $activeLink = $tabbarEl.find('.tab-link-active');
      let highlightWidth;
      let highlightTranslate;

      if ($tabbarEl.hasClass('tabbar-scrollable') && $activeLink && $activeLink[0]) {
        highlightWidth = `${$activeLink[0].offsetWidth}px`;
        highlightTranslate = `${$activeLink[0].offsetLeft}px`;
      } else {
        const activeIndex = $activeLink.index();
        highlightWidth = `${100 / tabLinksCount}%`;
        highlightTranslate = `${(app.rtl ? -activeIndex : activeIndex) * 100}%`;
      }

      Utils.nextFrame(() => {
        $highlightEl
          .css('width', highlightWidth)
          .transform(`translate3d(${highlightTranslate},0,0)`);
      });
    },
    init(tabbarEl) {
      const app = this;
      app.toolbar.setHighlight(tabbarEl);
    },
    hide(el, animate = true) {
      const app = this;
      const $el = $(el);
      if ($el.hasClass('toolbar-hidden')) return;
      const className = `toolbar-hidden${animate ? ' toolbar-transitioning' : ''}`;
      $el.transitionEnd(() => {
        $el.removeClass('toolbar-transitioning');
      });
      $el.addClass(className);
      $el.trigger('toolbar:hide');
      app.emit('toolbarHide', $el[0]);
    },
    show(el, animate = true) {
      const app = this;
      const $el = $(el);
      if (!$el.hasClass('toolbar-hidden')) return;
      if (animate) {
        $el.addClass('toolbar-transitioning');
        $el.transitionEnd(() => {
          $el.removeClass('toolbar-transitioning');
        });
      }
      $el.removeClass('toolbar-hidden');
      $el.trigger('toolbar:show');
      app.emit('toolbarShow', $el[0]);
    },
    initToolbarOnScroll(pageEl) {
      const app = this;
      const $pageEl = $(pageEl);
      let $toolbarEl = $pageEl.parents('.view').children('.toolbar');
      if ($toolbarEl.length === 0) {
        $toolbarEl = $pageEl.find('.toolbar');
      }
      if ($toolbarEl.length === 0) {
        $toolbarEl = $pageEl.parents('.views').children('.tabbar, .tabbar-labels');
      }
      if ($toolbarEl.length === 0) {
        return;
      }

      let previousScrollTop;
      let currentScrollTop;

      let scrollHeight;
      let offsetHeight;
      let reachEnd;
      let action;
      let toolbarHidden;
      function handleScroll(e) {
        if ($pageEl.hasClass('page-with-card-opened')) return;
        if ($pageEl.hasClass('page-previous')) return;
        const scrollContent = this;
        if (e && e.target && e.target !== scrollContent) {
          return;
        }
        currentScrollTop = scrollContent.scrollTop;
        scrollHeight = scrollContent.scrollHeight;
        offsetHeight = scrollContent.offsetHeight;
        reachEnd = currentScrollTop + offsetHeight >= scrollHeight;
        toolbarHidden = $toolbarEl.hasClass('toolbar-hidden');

        if (reachEnd) {
          if (app.params.toolbar.showOnPageScrollEnd) {
            action = 'show';
          }
        } else if (previousScrollTop > currentScrollTop) {
          if (app.params.toolbar.showOnPageScrollTop || currentScrollTop <= 44) {
            action = 'show';
          } else {
            action = 'hide';
          }
        } else if (currentScrollTop > 44) {
          action = 'hide';
        } else {
          action = 'show';
        }

        if (action === 'show' && toolbarHidden) {
          app.toolbar.show($toolbarEl);
          toolbarHidden = false;
        } else if (action === 'hide' && !toolbarHidden) {
          app.toolbar.hide($toolbarEl);
          toolbarHidden = true;
        }

        previousScrollTop = currentScrollTop;
      }
      $pageEl.on('scroll', '.page-content', handleScroll, true);
      $pageEl[0].f7ScrollToolbarHandler = handleScroll;
    },
  };
  var Toolbar$1 = {
    name: 'toolbar',
    create() {
      const app = this;
      Utils.extend(app, {
        toolbar: {
          hide: Toolbar.hide.bind(app),
          show: Toolbar.show.bind(app),
          setHighlight: Toolbar.setHighlight.bind(app),
          initToolbarOnScroll: Toolbar.initToolbarOnScroll.bind(app),
          init: Toolbar.init.bind(app),
        },
      });
    },
    params: {
      toolbar: {
        hideOnPageScroll: false,
        showOnPageScrollEnd: true,
        showOnPageScrollTop: true,
      },
    },
    on: {
      pageBeforeRemove(page) {
        if (page.$el[0].f7ScrollToolbarHandler) {
          page.$el.off('scroll', '.page-content', page.$el[0].f7ScrollToolbarHandler, true);
        }
      },
      pageBeforeIn(page) {
        const app = this;
        let $toolbarEl = page.$el.parents('.view').children('.toolbar');
        if ($toolbarEl.length === 0) {
          $toolbarEl = page.$el.parents('.views').children('.tabbar, .tabbar-labels');
        }
        if ($toolbarEl.length === 0) {
          $toolbarEl = page.$el.find('.toolbar');
        }
        if ($toolbarEl.length === 0) {
          return;
        }
        if (page.$el.hasClass('no-toolbar')) {
          app.toolbar.hide($toolbarEl);
        } else {
          app.toolbar.show($toolbarEl);
        }
      },
      pageInit(page) {
        const app = this;
        page.$el.find('.tabbar, .tabbar-labels').each((index, tabbarEl) => {
          app.toolbar.init(tabbarEl);
        });
        if (
          app.params.toolbar.hideOnPageScroll
          || page.$el.find('.hide-toolbar-on-scroll').length
          || page.$el.hasClass('hide-toolbar-on-scroll')
          || page.$el.find('.hide-bars-on-scroll').length
          || page.$el.hasClass('hide-bars-on-scroll')
        ) {
          if (
            page.$el.find('.keep-toolbar-on-scroll').length
            || page.$el.hasClass('keep-toolbar-on-scroll')
            || page.$el.find('.keep-bars-on-scroll').length
            || page.$el.hasClass('keep-bars-on-scroll')
          ) {
            return;
          }
          app.toolbar.initToolbarOnScroll(page.el);
        }
      },
      init() {
        const app = this;
        app.root.find('.tabbar, .tabbar-labels').each((index, tabbarEl) => {
          app.toolbar.init(tabbarEl);
        });
      },
    },
    vnode: {
      tabbar: {
        insert(vnode) {
          const app = this;
          app.toolbar.init(vnode.elm);
        },
      },
    },
  };

  var Subnavbar = {
    name: 'subnavbar',
    on: {
      pageInit(page) {
        if (page.$navbarEl && page.$navbarEl.length && page.$navbarEl.find('.subnavbar').length) {
          page.$el.addClass('page-with-subnavbar');
        }
        if (page.$el.find('.subnavbar').length) {
          page.$el.addClass('page-with-subnavbar');
        }
      },
    },
  };

  class TouchRipple {
    constructor($el, x, y) {
      const ripple = this;
      if (!$el) return undefined;
      const box = $el[0].getBoundingClientRect();
      const center = {
        x: x - box.left,
        y: y - box.top,
      };
      const width = box.width;
      const height = box.height;
      const diameter = Math.max((((height ** 2) + (width ** 2)) ** 0.5), 48);

      ripple.$rippleWaveEl = $(`<div class="ripple-wave" style="width: ${diameter}px; height: ${diameter}px; margin-top:-${diameter / 2}px; margin-left:-${diameter / 2}px; left:${center.x}px; top:${center.y}px;"></div>`);

      $el.prepend(ripple.$rippleWaveEl);

      ripple.rippleTransform = `translate3d(${-center.x + (width / 2)}px, ${-center.y + (height / 2)}px, 0) scale(1)`;

      Utils.nextFrame(() => {
        if (!ripple || !ripple.$rippleWaveEl) return;
        ripple.$rippleWaveEl.transform(ripple.rippleTransform);
      });

      return ripple;
    }

    destroy() {
      let ripple = this;
      if (ripple.$rippleWaveEl) {
        ripple.$rippleWaveEl.remove();
      }
      Object.keys(ripple).forEach((key) => {
        ripple[key] = null;
        delete ripple[key];
      });
      ripple = null;
    }

    remove() {
      const ripple = this;
      if (ripple.removing) return;
      const $rippleWaveEl = this.$rippleWaveEl;
      const rippleTransform = this.rippleTransform;
      let removeTimeout = Utils.nextTick(() => {
        ripple.destroy();
      }, 400);
      ripple.removing = true;
      $rippleWaveEl
        .addClass('ripple-wave-fill')
        .transform(rippleTransform.replace('scale(1)', 'scale(1.01)'))
        .transitionEnd(() => {
          clearTimeout(removeTimeout);
          Utils.nextFrame(() => {
            $rippleWaveEl
              .addClass('ripple-wave-out')
              .transform(rippleTransform.replace('scale(1)', 'scale(1.01)'));

            removeTimeout = Utils.nextTick(() => {
              ripple.destroy();
            }, 700);

            $rippleWaveEl.transitionEnd(() => {
              clearTimeout(removeTimeout);
              ripple.destroy();
            });
          });
        });
    }
  }

  var TouchRipple$1 = {
    name: 'touch-ripple',
    static: {
      TouchRipple,
    },
    create() {
      const app = this;
      app.touchRipple = {
        create(...args) {
          return new TouchRipple(...args);
        },
      };
    },
  };

  const openedModals = [];
  const dialogsQueue = [];
  function clearDialogsQueue() {
    if (dialogsQueue.length === 0) return;
    const dialog = dialogsQueue.shift();
    dialog.open();
  }
  class Modal extends Framework7Class {
    constructor(app, params) {
      super(params, [app]);

      const modal = this;

      const defaults = {};

      // Extend defaults with modules params
      modal.useModulesParams(defaults);

      modal.params = Utils.extend(defaults, params);
      modal.opened = false;

      // Install Modules
      modal.useModules();

      return this;
    }

    onOpen() {
      const modal = this;
      modal.opened = true;
      openedModals.push(modal);
      $('html').addClass(`with-modal-${modal.type.toLowerCase()}`);
      modal.$el.trigger(`modal:open ${modal.type.toLowerCase()}:open`);
      modal.emit(`local::open modalOpen ${modal.type}Open`, modal);
    }

    onOpened() {
      const modal = this;
      modal.$el.trigger(`modal:opened ${modal.type.toLowerCase()}:opened`);
      modal.emit(`local::opened modalOpened ${modal.type}Opened`, modal);
    }

    onClose() {
      const modal = this;
      modal.opened = false;
      if (!modal.type || !modal.$el) return;
      openedModals.splice(openedModals.indexOf(modal), 1);
      $('html').removeClass(`with-modal-${modal.type.toLowerCase()}`);
      modal.$el.trigger(`modal:close ${modal.type.toLowerCase()}:close`);
      modal.emit(`local::close modalClose ${modal.type}Close`, modal);
    }

    onClosed() {
      const modal = this;
      if (!modal.type || !modal.$el) return;
      modal.$el.removeClass('modal-out');
      modal.$el.hide();
      modal.$el.trigger(`modal:closed ${modal.type.toLowerCase()}:closed`);
      modal.emit(`local::closed modalClosed ${modal.type}Closed`, modal);
    }

    open(animateModal) {
      const modal = this;
      const app = modal.app;
      const $el = modal.$el;
      const $backdropEl = modal.$backdropEl;
      const type = modal.type;
      let animate = true;
      if (typeof animateModal !== 'undefined') animate = animateModal;
      else if (typeof modal.params.animate !== 'undefined') {
        animate = modal.params.animate;
      }

      if (!$el || $el.hasClass('modal-in')) {
        return modal;
      }

      if (type === 'dialog' && app.params.modal.queueDialogs) {
        let pushToQueue;
        if ($('.dialog.modal-in').length > 0) {
          pushToQueue = true;
        } else if (openedModals.length > 0) {
          openedModals.forEach((openedModal) => {
            if (openedModal.type === 'dialog') pushToQueue = true;
          });
        }
        if (pushToQueue) {
          dialogsQueue.push(modal);
          return modal;
        }
      }

      const $modalParentEl = $el.parent();
      const wasInDom = $el.parents(doc).length > 0;
      if (app.params.modal.moveToRoot && !$modalParentEl.is(app.root)) {
        app.root.append($el);
        modal.once(`${type}Closed`, () => {
          if (wasInDom) {
            $modalParentEl.append($el);
          } else {
            $el.remove();
          }
        });
      }
      // Show Modal
      $el.show();

      /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
      modal._clientLeft = $el[0].clientLeft;

      // Modal
      function transitionEnd() {
        if ($el.hasClass('modal-out')) {
          modal.onClosed();
        } else if ($el.hasClass('modal-in')) {
          modal.onOpened();
        }
      }
      if (animate) {
        if ($backdropEl) {
          $backdropEl.removeClass('not-animated');
          $backdropEl.addClass('backdrop-in');
        }
        $el
          .animationEnd(() => {
            transitionEnd();
          });
        $el
          .transitionEnd(() => {
            transitionEnd();
          });
        $el
          .removeClass('modal-out not-animated')
          .addClass('modal-in');
        modal.onOpen();
      } else {
        if ($backdropEl) {
          $backdropEl.addClass('backdrop-in not-animated');
        }
        $el.removeClass('modal-out').addClass('modal-in not-animated');
        modal.onOpen();
        modal.onOpened();
      }

      return modal;
    }

    close(animateModal) {
      const modal = this;
      const $el = modal.$el;
      const $backdropEl = modal.$backdropEl;

      let animate = true;
      if (typeof animateModal !== 'undefined') animate = animateModal;
      else if (typeof modal.params.animate !== 'undefined') {
        animate = modal.params.animate;
      }

      if (!$el || !$el.hasClass('modal-in')) {
        if (dialogsQueue.indexOf(modal) >= 0) {
          dialogsQueue.splice(dialogsQueue.indexOf(modal), 1);
        }
        return modal;
      }

      // backdrop
      if ($backdropEl) {
        let needToHideBackdrop = true;
        if (modal.type === 'popup') {
          modal.$el.prevAll('.popup.modal-in').each((index, popupEl) => {
            const popupInstance = popupEl.f7Modal;
            if (!popupInstance) return;
            if (
              popupInstance.params.closeByBackdropClick
              && popupInstance.params.backdrop
              && popupInstance.backdropEl === modal.backdropEl
            ) {
              needToHideBackdrop = false;
            }
          });
        }
        if (needToHideBackdrop) {
          $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');
          $backdropEl.removeClass('backdrop-in');
        }
      }

      // Modal
      $el[animate ? 'removeClass' : 'addClass']('not-animated');
      function transitionEnd() {
        if ($el.hasClass('modal-out')) {
          modal.onClosed();
        } else if ($el.hasClass('modal-in')) {
          modal.onOpened();
        }
      }
      if (animate) {
        $el
          .animationEnd(() => {
            transitionEnd();
          });
        $el
          .transitionEnd(() => {
            transitionEnd();
          });
        $el
          .removeClass('modal-in')
          .addClass('modal-out');
        // Emit close
        modal.onClose();
      } else {
        $el
          .addClass('not-animated')
          .removeClass('modal-in')
          .addClass('modal-out');
        // Emit close
        modal.onClose();
        modal.onClosed();
      }

      if (modal.type === 'dialog') {
        clearDialogsQueue();
      }

      return modal;
    }

    destroy() {
      const modal = this;
      if (modal.destroyed) return;
      modal.emit(`local::beforeDestroy modalBeforeDestroy ${modal.type}BeforeDestroy`, modal);
      if (modal.$el) {
        modal.$el.trigger(`modal:beforedestroy ${modal.type.toLowerCase()}:beforedestroy`);
        if (modal.$el.length && modal.$el[0].f7Modal) {
          delete modal.$el[0].f7Modal;
        }
      }
      Utils.deleteProps(modal);
      modal.destroyed = true;
    }
  }

  class CustomModal extends Modal {
    constructor(app, params) {
      const extendedParams = Utils.extend({
        backdrop: true,
        closeByBackdropClick: true,
        on: {},
      }, params);

      // Extends with open/close Modal methods;
      super(app, extendedParams);

      const customModal = this;

      customModal.params = extendedParams;

      // Find Element
      let $el;
      if (!customModal.params.el) {
        $el = $(customModal.params.content);
      } else {
        $el = $(customModal.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return customModal.destroy();
      }
      let $backdropEl;
      if (customModal.params.backdrop) {
        $backdropEl = app.root.children('.custom-modal-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="custom-modal-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      function handleClick(e) {
        if (!customModal || customModal.destroyed) return;
        if ($backdropEl && e.target === $backdropEl[0]) {
          customModal.close();
        }
      }

      customModal.on('customModalOpened', () => {
        if (customModal.params.closeByBackdropClick && customModal.params.backdrop) {
          app.on('click', handleClick);
        }
      });
      customModal.on('customModalClose', () => {
        if (customModal.params.closeByBackdropClick && customModal.params.backdrop) {
          app.off('click', handleClick);
        }
      });

      Utils.extend(customModal, {
        app,
        $el,
        el: $el[0],
        $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'customModal',
      });

      $el[0].f7Modal = customModal;

      return customModal;
    }
  }

  var Modal$1 = {
    name: 'modal',
    static: {
      Modal,
      CustomModal,
    },
    create() {
      const app = this;
      app.customModal = {
        create(params) {
          return new CustomModal(app, params);
        },
      };
    },
    params: {
      modal: {
        moveToRoot: true,
        queueDialogs: true,
      },
    },
  };

  /**
   * Framework7 5.7.10
   * Full featured mobile HTML framework for building iOS & Android apps
   * https://framework7.io/
   *
   * Copyright 2014-2020 Vladimir Kharlampidi
   *
   * Released under the MIT License
   *
   * Released on: July 14, 2020
   */

  // Install Core Modules & Components

  Framework7.use([
    DeviceModule,
    SupportModule,
    UtilsModule,
    ResizeModule,
    RequestModule,
    TouchModule,
    ClicksModule,
    RouterModule,
    HistoryModule,
    ServiceWorkerModule,
    Statusbar$1,
    View$1,
    Navbar$1,
    Toolbar$1,
    Subnavbar,
    TouchRipple$1,
    Modal$1,
    ]);

  //import Appbar from 'framework7/components/appbar/appbar.js';

  //import Dialog from 'framework7/components/dialog/dialog.js';
  //import Popup from 'framework7/components/popup/popup.js';
  //import LoginScreen from 'framework7/components/login-screen/login-screen.js';
  //import Popover from 'framework7/components/popover/popover.js';
  //import Actions from 'framework7/components/actions/actions.js';
  //import Sheet from 'framework7/components/sheet/sheet.js';
  //import Toast from 'framework7/components/toast/toast.js';

  //import Preloader from 'framework7/components/preloader/preloader.js';
  //import Progressbar from 'framework7/components/progressbar/progressbar.js';

  //import Sortable from 'framework7/components/sortable/sortable.js';
  //import Swipeout from 'framework7/components/swipeout/swipeout.js';
  //import Accordion from 'framework7/components/accordion/accordion.js';
  //import ContactsList from 'framework7/components/contacts-list/contacts-list.js';
  //import VirtualList from 'framework7/components/virtual-list/virtual-list.js';
  //import ListIndex from 'framework7/components/list-index/list-index.js';

  //import Timeline from 'framework7/components/timeline/timeline.js';

  //import Tabs from 'framework7/components/tabs/tabs.js';

  //import Panel from 'framework7/components/panel/panel.js';

  //import Card from 'framework7/components/card/card.js';

  //import Chip from 'framework7/components/chip/chip.js';

  //import Form from 'framework7/components/form/form.js';
  //import Input from 'framework7/components/input/input.js';
  //import Checkbox from 'framework7/components/checkbox/checkbox.js';
  //import Radio from 'framework7/components/radio/radio.js';
  //import Toggle from 'framework7/components/toggle/toggle.js';
  //import Range from 'framework7/components/range/range.js';
  //import Stepper from 'framework7/components/stepper/stepper.js';
  //import SmartSelect from 'framework7/components/smart-select/smart-select.js';

  //import Grid from 'framework7/components/grid/grid.js';

  //import Calendar from 'framework7/components/calendar/calendar.js';
  //import Picker from 'framework7/components/picker/picker.js';

  //import InfiniteScroll from 'framework7/components/infinite-scroll/infinite-scroll.js';
  //import PullToRefresh from 'framework7/components/pull-to-refresh/pull-to-refresh.js';
  //import Lazy from 'framework7/components/lazy/lazy.js';

  //import DataTable from 'framework7/components/data-table/data-table.js';

  //import Fab from 'framework7/components/fab/fab.js';

  //import Searchbar from 'framework7/components/searchbar/searchbar.js';

  //import Messages from 'framework7/components/messages/messages.js';
  //import Messagebar from 'framework7/components/messagebar/messagebar.js';

  //import Swiper from 'framework7/components/swiper/swiper.js';

  //import PhotoBrowser from 'framework7/components/photo-browser/photo-browser.js';

  //import Notification from 'framework7/components/notification/notification.js';

  //import Autocomplete from 'framework7/components/autocomplete/autocomplete.js';

  //import Tooltip from 'framework7/components/tooltip/tooltip.js';

  //import Gauge from 'framework7/components/gauge/gauge.js';

  //import Skeleton from 'framework7/components/skeleton/skeleton.js';

  //import Menu from 'framework7/components/menu/menu.js';

  //import ColorPicker from 'framework7/components/color-picker/color-picker.js';

  //import Treeview from 'framework7/components/treeview/treeview.js';

  //import Elevation from 'framework7/components/elevation/elevation.js';

  //import Typography from 'framework7/components/typography/typography.js';

  //import Vi from 'framework7/components/vi/vi.js';


  Framework7.use([
    //Appbar,

    //Dialog,
    //Popup,
    //LoginScreen,
    //Popover,
    //Actions,
    //Sheet,
    //Toast,

    //Preloader,
    //Progressbar,

    //Sortable,
    //Swipeout,
    //Accordion,
    //ContactsList,
    //VirtualList,
    //ListIndex,

    //Timeline,

    //Tabs,

    //Panel,

    //Card,

    //Chip,

    //Form,
    //Input,
    //Checkbox,
    //Radio,
    //Toggle,
    //Range,
    //Stepper,
    //SmartSelect,

    //Grid,

    //Calendar,
    //Picker,

    //InfiniteScroll,
    //PullToRefresh,
    //Lazy,

    //DataTable,

    //Fab,

    //Searchbar,

    //Messages,
    //Messagebar,

    //Swiper,

    //PhotoBrowser,

    //Notification,

    //Autocomplete,

    //Tooltip,

    //Gauge,

    //Skeleton,

    //Menu,

    //ColorPicker,

    //Treeview,

    //Elevation,

    //Typography,

    //Vi
  ]);

  function noop() { }
  function assign(tar, src) {
      // @ts-ignore
      for (const k in src)
          tar[k] = src[k];
      return tar;
  }
  function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
          loc: { file, line, column, char }
      };
  }
  function run(fn) {
      return fn();
  }
  function blank_object() {
      return Object.create(null);
  }
  function run_all(fns) {
      fns.forEach(run);
  }
  function is_function(thing) {
      return typeof thing === 'function';
  }
  function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }
  function validate_store(store, name) {
      if (store != null && typeof store.subscribe !== 'function') {
          throw new Error(`'${name}' is not a store with a 'subscribe' method`);
      }
  }
  function subscribe(store, ...callbacks) {
      if (store == null) {
          return noop;
      }
      const unsub = store.subscribe(...callbacks);
      return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  function component_subscribe(component, store, callback) {
      component.$$.on_destroy.push(subscribe(store, callback));
  }
  function create_slot(definition, ctx, $$scope, fn) {
      if (definition) {
          const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
          return definition[0](slot_ctx);
      }
  }
  function get_slot_context(definition, ctx, $$scope, fn) {
      return definition[1] && fn
          ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
          : $$scope.ctx;
  }
  function get_slot_changes(definition, $$scope, dirty, fn) {
      if (definition[2] && fn) {
          const lets = definition[2](fn(dirty));
          if ($$scope.dirty === undefined) {
              return lets;
          }
          if (typeof lets === 'object') {
              const merged = [];
              const len = Math.max($$scope.dirty.length, lets.length);
              for (let i = 0; i < len; i += 1) {
                  merged[i] = $$scope.dirty[i] | lets[i];
              }
              return merged;
          }
          return $$scope.dirty | lets;
      }
      return $$scope.dirty;
  }
  function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
      const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
      if (slot_changes) {
          const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
          slot.p(slot_context, slot_changes);
      }
  }
  function exclude_internal_props(props) {
      const result = {};
      for (const k in props)
          if (k[0] !== '$')
              result[k] = props[k];
      return result;
  }
  function compute_rest_props(props, keys) {
      const rest = {};
      keys = new Set(keys);
      for (const k in props)
          if (!keys.has(k) && k[0] !== '$')
              rest[k] = props[k];
      return rest;
  }

  function append$1(target, node) {
      target.appendChild(node);
  }
  function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
  }
  function detach$1(node) {
      node.parentNode.removeChild(node);
  }
  function element(name) {
      return document.createElement(name);
  }
  function text$1(data) {
      return document.createTextNode(data);
  }
  function space() {
      return text$1(' ');
  }
  function empty$1() {
      return text$1('');
  }
  function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
  }
  function attr$1(node, attribute, value) {
      if (value == null)
          node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
          node.setAttribute(attribute, value);
  }
  function set_attributes(node, attributes) {
      // @ts-ignore
      const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
      for (const key in attributes) {
          if (attributes[key] == null) {
              node.removeAttribute(key);
          }
          else if (key === 'style') {
              node.style.cssText = attributes[key];
          }
          else if (key === '__value') {
              node.value = node[key] = attributes[key];
          }
          else if (descriptors[key] && descriptors[key].set) {
              node[key] = attributes[key];
          }
          else {
              attr$1(node, key, attributes[key]);
          }
      }
  }
  function children$1(element) {
      return Array.from(element.childNodes);
  }
  function toggle_class(element, name, toggle) {
      element.classList[toggle ? 'add' : 'remove'](name);
  }
  function custom_event(type, detail) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, false, false, detail);
      return e;
  }

  let current_component;
  function set_current_component(component) {
      current_component = component;
  }
  function get_current_component() {
      if (!current_component)
          throw new Error(`Function called outside component initialization`);
      return current_component;
  }
  function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
  }
  function afterUpdate(fn) {
      get_current_component().$$.after_update.push(fn);
  }
  function onDestroy(fn) {
      get_current_component().$$.on_destroy.push(fn);
  }
  function createEventDispatcher() {
      const component = get_current_component();
      return (type, detail) => {
          const callbacks = component.$$.callbacks[type];
          if (callbacks) {
              // TODO are there situations where events could be dispatched
              // in a server (non-DOM) environment?
              const event = custom_event(type, detail);
              callbacks.slice().forEach(fn => {
                  fn.call(component, event);
              });
          }
      };
  }
  function setContext(key, context) {
      get_current_component().$$.context.set(key, context);
  }
  function getContext(key) {
      return get_current_component().$$.context.get(key);
  }

  const dirty_components = [];
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];
  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  function schedule_update() {
      if (!update_scheduled) {
          update_scheduled = true;
          resolved_promise.then(flush);
      }
  }
  function tick() {
      schedule_update();
      return resolved_promise;
  }
  function add_render_callback(fn) {
      render_callbacks.push(fn);
  }
  let flushing = false;
  const seen_callbacks = new Set();
  function flush() {
      if (flushing)
          return;
      flushing = true;
      do {
          // first, call beforeUpdate functions
          // and update components
          for (let i = 0; i < dirty_components.length; i += 1) {
              const component = dirty_components[i];
              set_current_component(component);
              update(component.$$);
          }
          dirty_components.length = 0;
          while (binding_callbacks.length)
              binding_callbacks.pop()();
          // then, once components are updated, call
          // afterUpdate functions. This may cause
          // subsequent updates...
          for (let i = 0; i < render_callbacks.length; i += 1) {
              const callback = render_callbacks[i];
              if (!seen_callbacks.has(callback)) {
                  // ...so guard against infinite loops
                  seen_callbacks.add(callback);
                  callback();
              }
          }
          render_callbacks.length = 0;
      } while (dirty_components.length);
      while (flush_callbacks.length) {
          flush_callbacks.pop()();
      }
      update_scheduled = false;
      flushing = false;
      seen_callbacks.clear();
  }
  function update($$) {
      if ($$.fragment !== null) {
          $$.update();
          run_all($$.before_update);
          const dirty = $$.dirty;
          $$.dirty = [-1];
          $$.fragment && $$.fragment.p($$.ctx, dirty);
          $$.after_update.forEach(add_render_callback);
      }
  }
  const outroing = new Set();
  let outros;
  function group_outros() {
      outros = {
          r: 0,
          c: [],
          p: outros // parent group
      };
  }
  function check_outros() {
      if (!outros.r) {
          run_all(outros.c);
      }
      outros = outros.p;
  }
  function transition_in(block, local) {
      if (block && block.i) {
          outroing.delete(block);
          block.i(local);
      }
  }
  function transition_out(block, local, detach, callback) {
      if (block && block.o) {
          if (outroing.has(block))
              return;
          outroing.add(block);
          outros.c.push(() => {
              outroing.delete(block);
              if (callback) {
                  if (detach)
                      block.d(1);
                  callback();
              }
          });
          block.o(local);
      }
  }
  function outro_and_destroy_block(block, lookup) {
      transition_out(block, 1, 1, () => {
          lookup.delete(block.key);
      });
  }
  function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
      let o = old_blocks.length;
      let n = list.length;
      let i = o;
      const old_indexes = {};
      while (i--)
          old_indexes[old_blocks[i].key] = i;
      const new_blocks = [];
      const new_lookup = new Map();
      const deltas = new Map();
      i = n;
      while (i--) {
          const child_ctx = get_context(ctx, list, i);
          const key = get_key(child_ctx);
          let block = lookup.get(key);
          if (!block) {
              block = create_each_block(key, child_ctx);
              block.c();
          }
          else if (dynamic) {
              block.p(child_ctx, dirty);
          }
          new_lookup.set(key, new_blocks[i] = block);
          if (key in old_indexes)
              deltas.set(key, Math.abs(i - old_indexes[key]));
      }
      const will_move = new Set();
      const did_move = new Set();
      function insert(block) {
          transition_in(block, 1);
          block.m(node, next);
          lookup.set(block.key, block);
          next = block.first;
          n--;
      }
      while (o && n) {
          const new_block = new_blocks[n - 1];
          const old_block = old_blocks[o - 1];
          const new_key = new_block.key;
          const old_key = old_block.key;
          if (new_block === old_block) {
              // do nothing
              next = new_block.first;
              o--;
              n--;
          }
          else if (!new_lookup.has(old_key)) {
              // remove old block
              destroy(old_block, lookup);
              o--;
          }
          else if (!lookup.has(new_key) || will_move.has(new_key)) {
              insert(new_block);
          }
          else if (did_move.has(old_key)) {
              o--;
          }
          else if (deltas.get(new_key) > deltas.get(old_key)) {
              did_move.add(new_key);
              insert(new_block);
          }
          else {
              will_move.add(old_key);
              o--;
          }
      }
      while (o--) {
          const old_block = old_blocks[o];
          if (!new_lookup.has(old_block.key))
              destroy(old_block, lookup);
      }
      while (n)
          insert(new_blocks[n - 1]);
      return new_blocks;
  }
  function validate_each_keys(ctx, list, get_context, get_key) {
      const keys = new Set();
      for (let i = 0; i < list.length; i++) {
          const key = get_key(get_context(ctx, list, i));
          if (keys.has(key)) {
              throw new Error(`Cannot have duplicate keys in a keyed each`);
          }
          keys.add(key);
      }
  }

  function get_spread_update(levels, updates) {
      const update = {};
      const to_null_out = {};
      const accounted_for = { $$scope: 1 };
      let i = levels.length;
      while (i--) {
          const o = levels[i];
          const n = updates[i];
          if (n) {
              for (const key in o) {
                  if (!(key in n))
                      to_null_out[key] = 1;
              }
              for (const key in n) {
                  if (!accounted_for[key]) {
                      update[key] = n[key];
                      accounted_for[key] = 1;
                  }
              }
              levels[i] = n;
          }
          else {
              for (const key in o) {
                  accounted_for[key] = 1;
              }
          }
      }
      for (const key in to_null_out) {
          if (!(key in update))
              update[key] = undefined;
      }
      return update;
  }
  function get_spread_object(spread_props) {
      return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
  }
  function create_component(block) {
      block && block.c();
  }
  function mount_component(component, target, anchor) {
      const { fragment, on_mount, on_destroy, after_update } = component.$$;
      fragment && fragment.m(target, anchor);
      // onMount happens before the initial afterUpdate
      add_render_callback(() => {
          const new_on_destroy = on_mount.map(run).filter(is_function);
          if (on_destroy) {
              on_destroy.push(...new_on_destroy);
          }
          else {
              // Edge case - component was destroyed immediately,
              // most likely as a result of a binding initialising
              run_all(new_on_destroy);
          }
          component.$$.on_mount = [];
      });
      after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
      const $$ = component.$$;
      if ($$.fragment !== null) {
          run_all($$.on_destroy);
          $$.fragment && $$.fragment.d(detaching);
          // TODO null out other refs, including component.$$ (but need to
          // preserve final state?)
          $$.on_destroy = $$.fragment = null;
          $$.ctx = [];
      }
  }
  function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
          dirty_components.push(component);
          schedule_update();
          component.$$.dirty.fill(0);
      }
      component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
  }
  function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
      const parent_component = current_component;
      set_current_component(component);
      const prop_values = options.props || {};
      const $$ = component.$$ = {
          fragment: null,
          ctx: null,
          // state
          props,
          update: noop,
          not_equal,
          bound: blank_object(),
          // lifecycle
          on_mount: [],
          on_destroy: [],
          before_update: [],
          after_update: [],
          context: new Map(parent_component ? parent_component.$$.context : []),
          // everything else
          callbacks: blank_object(),
          dirty
      };
      let ready = false;
      $$.ctx = instance
          ? instance(component, prop_values, (i, ret, ...rest) => {
              const value = rest.length ? rest[0] : ret;
              if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                  if ($$.bound[i])
                      $$.bound[i](value);
                  if (ready)
                      make_dirty(component, i);
              }
              return ret;
          })
          : [];
      $$.update();
      ready = true;
      run_all($$.before_update);
      // `false` as a special case of no DOM component
      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
      if (options.target) {
          if (options.hydrate) {
              const nodes = children$1(options.target);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.l(nodes);
              nodes.forEach(detach$1);
          }
          else {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.c();
          }
          if (options.intro)
              transition_in(component.$$.fragment);
          mount_component(component, options.target, options.anchor);
          flush();
      }
      set_current_component(parent_component);
  }
  class SvelteComponent {
      $destroy() {
          destroy_component(this, 1);
          this.$destroy = noop;
      }
      $on(type, callback) {
          const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
          callbacks.push(callback);
          return () => {
              const index = callbacks.indexOf(callback);
              if (index !== -1)
                  callbacks.splice(index, 1);
          };
      }
      $set() {
          // overridden by instance, if it has props
      }
  }

  function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
  }
  function append_dev(target, node) {
      dispatch_dev("SvelteDOMInsert", { target, node });
      append$1(target, node);
  }
  function insert_dev(target, node, anchor) {
      dispatch_dev("SvelteDOMInsert", { target, node, anchor });
      insert(target, node, anchor);
  }
  function detach_dev(node) {
      dispatch_dev("SvelteDOMRemove", { node });
      detach$1(node);
  }
  function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
      const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
      if (has_prevent_default)
          modifiers.push('preventDefault');
      if (has_stop_propagation)
          modifiers.push('stopPropagation');
      dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
      const dispose = listen(node, event, handler, options);
      return () => {
          dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
          dispose();
      };
  }
  function attr_dev(node, attribute, value) {
      attr$1(node, attribute, value);
      if (value == null)
          dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
      else
          dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
  }
  function set_data_dev(text, data) {
      data = '' + data;
      if (text.wholeText === data)
          return;
      dispatch_dev("SvelteDOMSetData", { node: text, data });
      text.data = data;
  }
  function validate_each_argument(arg) {
      if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
          let msg = '{#each} only iterates over array-like objects.';
          if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
              msg += ' You can use a spread to convert this iterable into an array.';
          }
          throw new Error(msg);
      }
  }
  function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
          if (!~keys.indexOf(slot_key)) {
              console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
          }
      }
  }
  class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
          if (!options || (!options.target && !options.$$inline)) {
              throw new Error(`'target' is a required option`);
          }
          super();
      }
      $destroy() {
          super.$destroy();
          this.$destroy = () => {
              console.warn(`Component was already destroyed`); // eslint-disable-line no-console
          };
      }
      $capture_state() { }
      $inject_state() { }
  }

  const Utils$1 = {
    text(text) {
      if (typeof text === 'undefined' || text === null) return '';
      return text;
    },
    noUndefinedProps(obj) {
      const o = {};
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] !== 'undefined') o[key] = obj[key];
      });
      return o;
    },
    isTrueProp(val) {
      return val === true || val === '';
    },
    isStringProp(val) {
      return typeof val === 'string' && val !== '';
    },
    isObject(o) {
      return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
    },
    now() {
      return Date.now();
    },
    extend(...args) {
      let deep = true;
      let to;
      let from;
      if (typeof args[0] === 'boolean') {
        [deep, to] = args;
        args.splice(0, 2);
        from = args;
      } else {
        [to] = args;
        args.splice(0, 1);
        from = args;
      }
      for (let i = 0; i < from.length; i += 1) {
        const nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          const keysArray = Object.keys(Object(nextSource));
          for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            const nextKey = keysArray[nextIndex];
            const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              if (!deep) {
                to[nextKey] = nextSource[nextKey];
              } else if (Utils$1.isObject(to[nextKey]) && Utils$1.isObject(nextSource[nextKey])) {
                Utils$1.extend(to[nextKey], nextSource[nextKey]);
              } else if (!Utils$1.isObject(to[nextKey]) && Utils$1.isObject(nextSource[nextKey])) {
                to[nextKey] = {};
                Utils$1.extend(to[nextKey], nextSource[nextKey]);
              } else {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
      }
      return to;
    },
    flattenArray(...args) {
      const arr = [];
      args.forEach((arg) => {
        if (Array.isArray(arg)) arr.push(...Utils$1.flattenArray(...arg));
        else arr.push(arg);
      });
      return arr;
    },
    classNames(...args) {
      const classes = [];
      args.forEach((arg) => {
        if (typeof arg === 'object' && arg.constructor === Object) {
          Object.keys(arg).forEach((key) => {
            if (arg[key]) classes.push(key);
          });
        } else if (arg) classes.push(arg);
      });
      const uniqueClasses = [];
      classes.forEach((c) => {
        if (uniqueClasses.indexOf(c) < 0) uniqueClasses.push(c);
      });
      return uniqueClasses.join(' ');
    },
    bindMethods(context, methods = []) {
      for (let i = 0; i < methods.length; i += 1) {
        if (context[methods[i]]) context[methods[i]] = context[methods[i]].bind(context);
      }
    },
  };

  const Mixins = {
    colorProps: {
      color: String,
      colorTheme: String,
      textColor: String,
      bgColor: String,
      borderColor: String,
      rippleColor: String,
      themeDark: Boolean,
    },
    colorClasses(props) {
      const {
        color,
        colorTheme,
        textColor,
        bgColor,
        borderColor,
        rippleColor,
        themeDark,
      } = props;

      return {
        'theme-dark': themeDark,
        [`color-${color}`]: color,
        [`color-theme-${colorTheme}`]: colorTheme,
        [`text-color-${textColor}`]: textColor,
        [`bg-color-${bgColor}`]: bgColor,
        [`border-color-${borderColor}`]: borderColor,
        [`ripple-color-${rippleColor}`]: rippleColor,
      };
    },
    linkIconProps: {
      icon: String,
      iconMaterial: String,
      iconF7: String,
      iconIos: String,
      iconMd: String,
      iconAurora: String,
      iconColor: String,
      iconSize: [String, Number],
    },
    linkRouterProps: {
      back: Boolean,
      external: Boolean,
      force: Boolean,
      animate: {
        type: Boolean,
        default: undefined,
      },
      ignoreCache: Boolean,
      reloadCurrent: Boolean,
      reloadAll: Boolean,
      reloadPrevious: Boolean,
      reloadDetail: {
        type: Boolean,
        default: undefined,
      },
      routeTabId: String,
      view: String,
      routeProps: Object,
      preventRouter: Boolean,
      transition: String,
    },
    linkRouterAttrs(props) {
      const {
        force,
        reloadCurrent,
        reloadPrevious,
        reloadAll,
        reloadDetail,
        animate,
        ignoreCache,
        routeTabId,
        view,
        transition,
      } = props;

      let dataAnimate;
      if ('animate' in props && typeof animate !== 'undefined') {
        dataAnimate = animate.toString();
      }

      let dataReloadDetail;
      if ('reloadDetail' in props && typeof reloadDetail !== 'undefined') {
        dataReloadDetail = reloadDetail.toString();
      }

      return {
        'data-force': force || undefined,
        'data-reload-current': reloadCurrent || undefined,
        'data-reload-all': reloadAll || undefined,
        'data-reload-previous': reloadPrevious || undefined,
        'data-reload-detail': dataReloadDetail,
        'data-animate': dataAnimate,
        'data-ignore-cache': ignoreCache || undefined,
        'data-route-tab-id': routeTabId || undefined,
        'data-view': Utils$1.isStringProp(view) ? view : undefined,
        'data-transition': Utils$1.isStringProp(transition) ? transition : undefined,
      };
    },
    linkRouterClasses(props) {
      const { back, linkBack, external, preventRouter } = props;

      return {
        back: back || linkBack,
        external,
        'prevent-router': preventRouter,
      };
    },
    linkActionsProps: {
      searchbarEnable: [Boolean, String],
      searchbarDisable: [Boolean, String],

      searchbarClear: [Boolean, String],
      searchbarToggle: [Boolean, String],

      // Panel
      panelOpen: [Boolean, String],
      panelClose: [Boolean, String],
      panelToggle: [Boolean, String],

      // Popup
      popupOpen: [Boolean, String],
      popupClose: [Boolean, String],

      // Actions
      actionsOpen: [Boolean, String],
      actionsClose: [Boolean, String],

      // Popover
      popoverOpen: [Boolean, String],
      popoverClose: [Boolean, String],

      // Login Screen
      loginScreenOpen: [Boolean, String],
      loginScreenClose: [Boolean, String],

      // Picker
      sheetOpen: [Boolean, String],
      sheetClose: [Boolean, String],

      // Sortable
      sortableEnable: [Boolean, String],
      sortableDisable: [Boolean, String],
      sortableToggle: [Boolean, String],

      // Card
      cardOpen: [Boolean, String],
      cardPreventOpen: [Boolean, String],
      cardClose: [Boolean, String],

      // Menu
      menuClose: {
        type: [Boolean, String],
        default: undefined,
      },
    },
    linkActionsAttrs(props) {
      const {
        searchbarEnable,
        searchbarDisable,
        searchbarClear,
        searchbarToggle,
        panelOpen,
        panelClose,
        panelToggle,
        popupOpen,
        popupClose,
        actionsOpen,
        actionsClose,
        popoverOpen,
        popoverClose,
        loginScreenOpen,
        loginScreenClose,
        sheetOpen,
        sheetClose,
        sortableEnable,
        sortableDisable,
        sortableToggle,
        cardOpen,
        cardClose,
      } = props;

      return {
        'data-searchbar': (Utils$1.isStringProp(searchbarEnable) && searchbarEnable)
                          || (Utils$1.isStringProp(searchbarDisable) && searchbarDisable)
                          || (Utils$1.isStringProp(searchbarClear) && searchbarClear)
                          || (Utils$1.isStringProp(searchbarToggle) && searchbarToggle) || undefined,
        'data-panel': (Utils$1.isStringProp(panelOpen) && panelOpen)
                      || (Utils$1.isStringProp(panelClose) && panelClose)
                      || (Utils$1.isStringProp(panelToggle) && panelToggle) || undefined,
        'data-popup': (Utils$1.isStringProp(popupOpen) && popupOpen)
                      || (Utils$1.isStringProp(popupClose) && popupClose) || undefined,
        'data-actions': (Utils$1.isStringProp(actionsOpen) && actionsOpen)
                      || (Utils$1.isStringProp(actionsClose) && actionsClose) || undefined,
        'data-popover': (Utils$1.isStringProp(popoverOpen) && popoverOpen)
                        || (Utils$1.isStringProp(popoverClose) && popoverClose) || undefined,
        'data-sheet': (Utils$1.isStringProp(sheetOpen) && sheetOpen)
                      || (Utils$1.isStringProp(sheetClose) && sheetClose) || undefined,
        'data-login-screen': (Utils$1.isStringProp(loginScreenOpen) && loginScreenOpen)
                             || (Utils$1.isStringProp(loginScreenClose) && loginScreenClose) || undefined,
        'data-sortable': (Utils$1.isStringProp(sortableEnable) && sortableEnable)
                         || (Utils$1.isStringProp(sortableDisable) && sortableDisable)
                         || (Utils$1.isStringProp(sortableToggle) && sortableToggle) || undefined,
        'data-card': (Utils$1.isStringProp(cardOpen) && cardOpen)
                      || (Utils$1.isStringProp(cardClose) && cardClose) || undefined,
      };
    },
    linkActionsClasses(props) {
      const {
        searchbarEnable,
        searchbarDisable,
        searchbarClear,
        searchbarToggle,
        panelOpen,
        panelClose,
        panelToggle,
        popupOpen,
        popupClose,
        actionsClose,
        actionsOpen,
        popoverOpen,
        popoverClose,
        loginScreenOpen,
        loginScreenClose,
        sheetOpen,
        sheetClose,
        sortableEnable,
        sortableDisable,
        sortableToggle,
        cardOpen,
        cardPreventOpen,
        cardClose,
        menuClose,
      } = props;

      return {
        'searchbar-enable': searchbarEnable || searchbarEnable === '',
        'searchbar-disable': searchbarDisable || searchbarDisable === '',
        'searchbar-clear': searchbarClear || searchbarClear === '',
        'searchbar-toggle': searchbarToggle || searchbarToggle === '',
        'panel-close': panelClose || panelClose === '',
        'panel-open': panelOpen || panelOpen === '',
        'panel-toggle': panelToggle || panelToggle === '',
        'popup-close': popupClose || popupClose === '',
        'popup-open': popupOpen || popupOpen === '',
        'actions-close': actionsClose || actionsClose === '',
        'actions-open': actionsOpen || actionsOpen === '',
        'popover-close': popoverClose || popoverClose === '',
        'popover-open': popoverOpen || popoverOpen === '',
        'sheet-close': sheetClose || sheetClose === '',
        'sheet-open': sheetOpen || sheetOpen === '',
        'login-screen-close': loginScreenClose || loginScreenClose === '',
        'login-screen-open': loginScreenOpen || loginScreenOpen === '',
        'sortable-enable': sortableEnable || sortableEnable === '',
        'sortable-disable': sortableDisable || sortableDisable === '',
        'sortable-toggle': sortableToggle || sortableToggle === '',
        'card-close': cardClose || cardClose === '',
        'card-open': cardOpen || cardOpen === '',
        'card-prevent-open': cardPreventOpen || cardPreventOpen === '',
        'menu-close': menuClose || menuClose === '',
      };
    },
  };

  function restProps(rest = {}) {
    const props = {};
    Object.keys(rest).forEach((key) => {
      if (key.indexOf('on') !== 0) {
        props[key] = rest[key];
      }
    });
    return props;
  }

  const f7 = {
    instance: null,
    Framework7: null,
    events: null,
    init(rootEl, params = {}, routes) {
      const { events, Framework7 } = f7;
      const f7Params = Utils$1.extend({}, params, {
        root: rootEl,
      });
      if (routes && routes.length && !f7Params.routes) f7Params.routes = routes;

      const instance = new Framework7(f7Params);
      if (instance.initialized) {
        f7.instance = instance;
        events.emit('ready', f7.instance);
      } else {
        instance.on('init', () => {
          f7.instance = instance;
          events.emit('ready', f7.instance);
        });
      }
    },
    ready(callback) {
      if (!callback) return;
      if (f7.instance) callback(f7.instance);
      else {
        f7.events.once('ready', callback);
      }
    },
    routers: {
      views: [],
      tabs: [],
      modals: null,
    },
  };

  function hasSlots (args, name) {
    return args && args[1] && args[1].$$slots && args[1].$$slots[name] && args[1].$$slots[name].length > 0;
  }

  /* node_modules\framework7-svelte\components\routable-modals.svelte generated by Svelte v3.24.0 */
  const file = "node_modules\\framework7-svelte\\components\\routable-modals.svelte";

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[5] = list[i];
  	return child_ctx;
  }

  // (33:2) {#each modals as modal (modal.id)}
  function create_each_block(key_1, ctx) {
  	let first;
  	let switch_instance;
  	let switch_instance_anchor;
  	let current;
  	const switch_instance_spread_levels = [/*modal*/ ctx[5].props];
  	var switch_value = /*modal*/ ctx[5].component;

  	function switch_props(ctx) {
  		let switch_instance_props = {};

  		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
  			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
  		}

  		return {
  			props: switch_instance_props,
  			$$inline: true
  		};
  	}

  	if (switch_value) {
  		switch_instance = new switch_value(switch_props());
  	}

  	const block = {
  		key: key_1,
  		first: null,
  		c: function create() {
  			first = empty$1();
  			if (switch_instance) create_component(switch_instance.$$.fragment);
  			switch_instance_anchor = empty$1();
  			this.first = first;
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, first, anchor);

  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert_dev(target, switch_instance_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const switch_instance_changes = (dirty & /*modals*/ 1)
  			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*modal*/ ctx[5].props)])
  			: {};

  			if (switch_value !== (switch_value = /*modal*/ ctx[5].component)) {
  				if (switch_instance) {
  					group_outros();
  					const old_component = switch_instance;

  					transition_out(old_component.$$.fragment, 1, 0, () => {
  						destroy_component(old_component, 1);
  					});

  					check_outros();
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props());
  					create_component(switch_instance.$$.fragment);
  					transition_in(switch_instance.$$.fragment, 1);
  					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance.$set(switch_instance_changes);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(first);
  			if (detaching) detach_dev(switch_instance_anchor);
  			if (switch_instance) destroy_component(switch_instance, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block.name,
  		type: "each",
  		source: "(33:2) {#each modals as modal (modal.id)}",
  		ctx
  	});

  	return block;
  }

  function create_fragment(ctx) {
  	let div;
  	let each_blocks = [];
  	let each_1_lookup = new Map();
  	let current;
  	let each_value = /*modals*/ ctx[0];
  	validate_each_argument(each_value);
  	const get_key = ctx => /*modal*/ ctx[5].id;
  	validate_each_keys(ctx, each_value, get_each_context, get_key);

  	for (let i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context(ctx, each_value, i);
  		let key = get_key(child_ctx);
  		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
  	}

  	const block = {
  		c: function create() {
  			div = element("div");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(div, "class", "framework7-modals");
  			add_location(div, file, 31, 0, 614);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div, null);
  			}

  			/*div_binding*/ ctx[2](div);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*modals*/ 1) {
  				const each_value = /*modals*/ ctx[0];
  				validate_each_argument(each_value);
  				group_outros();
  				validate_each_keys(ctx, each_value, get_each_context, get_key);
  				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].d();
  			}

  			/*div_binding*/ ctx[2](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance($$self, $$props, $$invalidate) {
  	let modals = [];
  	let el;
  	let routerData;

  	onMount(() => {
  		routerData = {
  			el,
  			modals,
  			setModals(m) {
  				tick().then(() => {
  					$$invalidate(0, modals = m);
  				});
  			}
  		};

  		f7.routers.modals = routerData;
  	});

  	afterUpdate(() => {
  		if (!routerData) return;
  		f7.events.emit("modalsRouterDidUpdate", routerData);
  	});

  	onDestroy(() => {
  		if (!routerData) return;
  		f7.routers.modals = null;
  		routerData = null;
  	});

  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Routable_modals> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Routable_modals", $$slots, []);

  	function div_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(1, el);
  		});
  	}

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		afterUpdate,
  		tick,
  		f7,
  		modals,
  		el,
  		routerData
  	});

  	$$self.$inject_state = $$props => {
  		if ("modals" in $$props) $$invalidate(0, modals = $$props.modals);
  		if ("el" in $$props) $$invalidate(1, el = $$props.el);
  		if ("routerData" in $$props) routerData = $$props.routerData;
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [modals, el, div_binding];
  }

  class Routable_modals extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance, create_fragment, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Routable_modals",
  			options,
  			id: create_fragment.name
  		});
  	}
  }

  /* node_modules\framework7-svelte\components\app.svelte generated by Svelte v3.24.0 */
  const file$1 = "node_modules\\framework7-svelte\\components\\app.svelte";

  function create_fragment$1(ctx) {
  	let div;
  	let t;
  	let routablemodals;
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[8].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);
  	routablemodals = new Routable_modals({ $$inline: true });

  	let div_levels = [
  		{ id: /*id*/ ctx[0] },
  		{ class: /*classes*/ ctx[2] },
  		restProps(/*$$restProps*/ ctx[3])
  	];

  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (default_slot) default_slot.c();
  			t = space();
  			create_component(routablemodals.$$.fragment);
  			set_attributes(div, div_data);
  			add_location(div, file$1, 34, 0, 804);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			if (default_slot) {
  				default_slot.m(div, null);
  			}

  			append_dev(div, t);
  			mount_component(routablemodals, div, null);
  			/*div_binding*/ ctx[9](div);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 128) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
  				}
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty & /*id*/ 1) && { id: /*id*/ ctx[0] },
  				(!current || dirty & /*classes*/ 4) && { class: /*classes*/ ctx[2] },
  				dirty & /*$$restProps*/ 8 && restProps(/*$$restProps*/ ctx[3])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			transition_in(routablemodals.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			transition_out(routablemodals.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (default_slot) default_slot.d(detaching);
  			destroy_component(routablemodals);
  			/*div_binding*/ ctx[9](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$1.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$1($$self, $$props, $$invalidate) {
  	const omit_props_names = ["id","params","routes","class"];
  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	let { id = "framework7-root" } = $$props;
  	let { params = {} } = $$props;
  	let { routes = [] } = $$props;
  	let { class: className = undefined } = $$props;
  	let el;

  	onMount(() => {
  		const parentEl = el.parentNode;

  		if (parentEl && parentEl !== document.body && parentEl.parentNode === document.body) {
  			parentEl.style.height = "100%";
  		}

  		if (f7.instance) return;
  		f7.init(el, params, routes);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("App", $$slots, ['default']);

  	function div_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(1, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(10, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
  		if ("params" in $$new_props) $$invalidate(4, params = $$new_props.params);
  		if ("routes" in $$new_props) $$invalidate(5, routes = $$new_props.routes);
  		if ("class" in $$new_props) $$invalidate(6, className = $$new_props.class);
  		if ("$$scope" in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		f7,
  		RoutableModals: Routable_modals,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		id,
  		params,
  		routes,
  		className,
  		el,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(10, $$props = assign(assign({}, $$props), $$new_props));
  		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
  		if ("params" in $$props) $$invalidate(4, params = $$new_props.params);
  		if ("routes" in $$props) $$invalidate(5, routes = $$new_props.routes);
  		if ("className" in $$props) $$invalidate(6, className = $$new_props.className);
  		if ("el" in $$props) $$invalidate(1, el = $$new_props.el);
  		if ("classes" in $$props) $$invalidate(2, classes = $$new_props.classes);
  	};

  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(2, classes = Utils$1.classNames(className, "framework7-root", Mixins.colorClasses($$props)));
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		id,
  		el,
  		classes,
  		$$restProps,
  		params,
  		routes,
  		className,
  		$$scope,
  		$$slots,
  		div_binding
  	];
  }

  class App extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$1, create_fragment$1, safe_not_equal, { id: 0, params: 4, routes: 5, class: 6 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "App",
  			options,
  			id: create_fragment$1.name
  		});
  	}

  	get id() {
  		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set id(value) {
  		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get params() {
  		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set params(value) {
  		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get routes() {
  		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set routes(value) {
  		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get class() {
  		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\badge.svelte generated by Svelte v3.24.0 */
  const file$2 = "node_modules\\framework7-svelte\\components\\badge.svelte";

  function create_fragment$2(ctx) {
  	let span;
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[6].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
  	let span_levels = [{ class: /*classes*/ ctx[0] }, restProps(/*$$restProps*/ ctx[1])];
  	let span_data = {};

  	for (let i = 0; i < span_levels.length; i += 1) {
  		span_data = assign(span_data, span_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			span = element("span");
  			if (default_slot) default_slot.c();
  			set_attributes(span, span_data);
  			add_location(span, file$2, 64, 0, 1406);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);

  			if (default_slot) {
  				default_slot.m(span, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 32) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
  				}
  			}

  			set_attributes(span, span_data = get_spread_update(span_levels, [
  				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] },
  				dirty & /*$$restProps*/ 2 && restProps(/*$$restProps*/ ctx[1])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$2.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$2($$self, $$props, $$invalidate) {
  	const omit_props_names = ["class","tooltip","tooltipTrigger"];
  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	let { class: className = undefined } = $$props;
  	let { tooltip = undefined } = $$props;
  	let { tooltipTrigger = undefined } = $$props;
  	let el;
  	let f7Tooltip;
  	let tooltipText = tooltip;

  	function watchTooltip(newText) {
  		const oldText = tooltipText;
  		if (oldText === newText) return;
  		tooltipText = newText;

  		if (!newText && f7Tooltip) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  			return;
  		}

  		if (newText && !f7Tooltip && f7.instance) {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: newText,
  				trigger: tooltipTrigger
  			});

  			return;
  		}

  		if (!newText || !f7Tooltip) return;
  		f7Tooltip.setText(newText);
  	}

  	onMount(() => {
  		if (!tooltip) return;

  		f7.ready(() => {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: tooltip,
  				trigger: tooltipTrigger
  			});
  		});
  	});

  	onDestroy(() => {
  		if (f7Tooltip && f7Tooltip.destroy) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  		}
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Badge", $$slots, ['default']);

  	$$self.$set = $$new_props => {
  		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
  		if ("tooltip" in $$new_props) $$invalidate(3, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$new_props) $$invalidate(4, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		f7,
  		className,
  		tooltip,
  		tooltipTrigger,
  		el,
  		f7Tooltip,
  		tooltipText,
  		watchTooltip,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
  		if ("tooltip" in $$props) $$invalidate(3, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$props) $$invalidate(4, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("el" in $$props) el = $$new_props.el;
  		if ("f7Tooltip" in $$props) f7Tooltip = $$new_props.f7Tooltip;
  		if ("tooltipText" in $$props) tooltipText = $$new_props.tooltipText;
  		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
  	};

  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(0, classes = Utils$1.classNames(className, "badge", Mixins.colorClasses($$props)));

  		if ($$self.$$.dirty & /*tooltip*/ 8) {
  			 watchTooltip(tooltip);
  		}
  	};

  	$$props = exclude_internal_props($$props);
  	return [classes, $$restProps, className, tooltip, tooltipTrigger, $$scope, $$slots];
  }

  class Badge extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$2, create_fragment$2, safe_not_equal, { class: 2, tooltip: 3, tooltipTrigger: 4 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Badge",
  			options,
  			id: create_fragment$2.name
  		});
  	}

  	get class() {
  		throw new Error("<Badge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Badge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltip() {
  		throw new Error("<Badge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltip(value) {
  		throw new Error("<Badge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltipTrigger() {
  		throw new Error("<Badge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltipTrigger(value) {
  		throw new Error("<Badge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\block.svelte generated by Svelte v3.24.0 */
  const file$3 = "node_modules\\framework7-svelte\\components\\block.svelte";

  function create_fragment$3(ctx) {
  	let div;
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[21].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);
  	let div_levels = [{ class: /*classes*/ ctx[1] }, restProps(/*$$restProps*/ ctx[2])];
  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (default_slot) default_slot.c();
  			set_attributes(div, div_data);
  			add_location(div, file$3, 81, 0, 2150);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			if (default_slot) {
  				default_slot.m(div, null);
  			}

  			/*div_binding*/ ctx[22](div);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 1048576) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[20], dirty, null, null);
  				}
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
  				dirty & /*$$restProps*/ 4 && restProps(/*$$restProps*/ ctx[2])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (default_slot) default_slot.d(detaching);
  			/*div_binding*/ ctx[22](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$3.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$3($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"inset","xsmallInset","smallInset","mediumInset","largeInset","xlargeInset","strong","tabs","tab","tabActive","accordionList","accordionOpposite","noHairlines","noHairlinesMd","noHairlinesIos","noHairlinesAurora","class"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { inset = false } = $$props;
  	let { xsmallInset = false } = $$props;
  	let { smallInset = false } = $$props;
  	let { mediumInset = false } = $$props;
  	let { largeInset = false } = $$props;
  	let { xlargeInset = false } = $$props;
  	let { strong = false } = $$props;
  	let { tabs = false } = $$props;
  	let { tab = false } = $$props;
  	let { tabActive = false } = $$props;
  	let { accordionList = false } = $$props;
  	let { accordionOpposite = false } = $$props;
  	let { noHairlines = false } = $$props;
  	let { noHairlinesMd = false } = $$props;
  	let { noHairlinesIos = false } = $$props;
  	let { noHairlinesAurora = false } = $$props;
  	let { class: className = undefined } = $$props;
  	let el;

  	function onTabShow(tabEl) {
  		if (el !== tabEl) return;
  		dispatch("tabShow");
  		if (typeof $$props.onTabShow === "function") $$props.onTabShow(tabEl);
  	}

  	function onTabHide(tabEl) {
  		if (el !== tabEl) return;
  		dispatch("tabHide");
  		if (typeof $$props.onTabHide === "function") $$props.onTabHide(tabEl);
  	}

  	onMount(() => {
  		f7.ready(() => {
  			f7.instance.on("tabShow", onTabShow);
  			f7.instance.on("tabHide", onTabHide);
  		});
  	});

  	onDestroy(() => {
  		if (f7.instance) {
  			f7.instance.off("tabShow", onTabShow);
  			f7.instance.off("tabHide", onTabHide);
  		}
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Block", $$slots, ['default']);

  	function div_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(0, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(26, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("inset" in $$new_props) $$invalidate(3, inset = $$new_props.inset);
  		if ("xsmallInset" in $$new_props) $$invalidate(4, xsmallInset = $$new_props.xsmallInset);
  		if ("smallInset" in $$new_props) $$invalidate(5, smallInset = $$new_props.smallInset);
  		if ("mediumInset" in $$new_props) $$invalidate(6, mediumInset = $$new_props.mediumInset);
  		if ("largeInset" in $$new_props) $$invalidate(7, largeInset = $$new_props.largeInset);
  		if ("xlargeInset" in $$new_props) $$invalidate(8, xlargeInset = $$new_props.xlargeInset);
  		if ("strong" in $$new_props) $$invalidate(9, strong = $$new_props.strong);
  		if ("tabs" in $$new_props) $$invalidate(10, tabs = $$new_props.tabs);
  		if ("tab" in $$new_props) $$invalidate(11, tab = $$new_props.tab);
  		if ("tabActive" in $$new_props) $$invalidate(12, tabActive = $$new_props.tabActive);
  		if ("accordionList" in $$new_props) $$invalidate(13, accordionList = $$new_props.accordionList);
  		if ("accordionOpposite" in $$new_props) $$invalidate(14, accordionOpposite = $$new_props.accordionOpposite);
  		if ("noHairlines" in $$new_props) $$invalidate(15, noHairlines = $$new_props.noHairlines);
  		if ("noHairlinesMd" in $$new_props) $$invalidate(16, noHairlinesMd = $$new_props.noHairlinesMd);
  		if ("noHairlinesIos" in $$new_props) $$invalidate(17, noHairlinesIos = $$new_props.noHairlinesIos);
  		if ("noHairlinesAurora" in $$new_props) $$invalidate(18, noHairlinesAurora = $$new_props.noHairlinesAurora);
  		if ("class" in $$new_props) $$invalidate(19, className = $$new_props.class);
  		if ("$$scope" in $$new_props) $$invalidate(20, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		createEventDispatcher,
  		f7,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		dispatch,
  		inset,
  		xsmallInset,
  		smallInset,
  		mediumInset,
  		largeInset,
  		xlargeInset,
  		strong,
  		tabs,
  		tab,
  		tabActive,
  		accordionList,
  		accordionOpposite,
  		noHairlines,
  		noHairlinesMd,
  		noHairlinesIos,
  		noHairlinesAurora,
  		className,
  		el,
  		onTabShow,
  		onTabHide,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(26, $$props = assign(assign({}, $$props), $$new_props));
  		if ("inset" in $$props) $$invalidate(3, inset = $$new_props.inset);
  		if ("xsmallInset" in $$props) $$invalidate(4, xsmallInset = $$new_props.xsmallInset);
  		if ("smallInset" in $$props) $$invalidate(5, smallInset = $$new_props.smallInset);
  		if ("mediumInset" in $$props) $$invalidate(6, mediumInset = $$new_props.mediumInset);
  		if ("largeInset" in $$props) $$invalidate(7, largeInset = $$new_props.largeInset);
  		if ("xlargeInset" in $$props) $$invalidate(8, xlargeInset = $$new_props.xlargeInset);
  		if ("strong" in $$props) $$invalidate(9, strong = $$new_props.strong);
  		if ("tabs" in $$props) $$invalidate(10, tabs = $$new_props.tabs);
  		if ("tab" in $$props) $$invalidate(11, tab = $$new_props.tab);
  		if ("tabActive" in $$props) $$invalidate(12, tabActive = $$new_props.tabActive);
  		if ("accordionList" in $$props) $$invalidate(13, accordionList = $$new_props.accordionList);
  		if ("accordionOpposite" in $$props) $$invalidate(14, accordionOpposite = $$new_props.accordionOpposite);
  		if ("noHairlines" in $$props) $$invalidate(15, noHairlines = $$new_props.noHairlines);
  		if ("noHairlinesMd" in $$props) $$invalidate(16, noHairlinesMd = $$new_props.noHairlinesMd);
  		if ("noHairlinesIos" in $$props) $$invalidate(17, noHairlinesIos = $$new_props.noHairlinesIos);
  		if ("noHairlinesAurora" in $$props) $$invalidate(18, noHairlinesAurora = $$new_props.noHairlinesAurora);
  		if ("className" in $$props) $$invalidate(19, className = $$new_props.className);
  		if ("el" in $$props) $$invalidate(0, el = $$new_props.el);
  		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
  	};

  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(1, classes = Utils$1.classNames(
  			className,
  			"block",
  			{
  				inset,
  				"xsmall-inset": xsmallInset,
  				"small-inset": smallInset,
  				"medium-inset": mediumInset,
  				"large-inset": largeInset,
  				"xlarge-inset": xlargeInset,
  				"block-strong": strong,
  				"accordion-list": accordionList,
  				"accordion-opposite": accordionOpposite,
  				tabs,
  				tab,
  				"tab-active": tabActive,
  				"no-hairlines": noHairlines,
  				"no-hairlines-md": noHairlinesMd,
  				"no-hairlines-ios": noHairlinesIos,
  				"no-hairlines-aurora": noHairlinesAurora
  			},
  			Mixins.colorClasses($$props)
  		));
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		el,
  		classes,
  		$$restProps,
  		inset,
  		xsmallInset,
  		smallInset,
  		mediumInset,
  		largeInset,
  		xlargeInset,
  		strong,
  		tabs,
  		tab,
  		tabActive,
  		accordionList,
  		accordionOpposite,
  		noHairlines,
  		noHairlinesMd,
  		noHairlinesIos,
  		noHairlinesAurora,
  		className,
  		$$scope,
  		$$slots,
  		div_binding
  	];
  }

  class Block extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
  			inset: 3,
  			xsmallInset: 4,
  			smallInset: 5,
  			mediumInset: 6,
  			largeInset: 7,
  			xlargeInset: 8,
  			strong: 9,
  			tabs: 10,
  			tab: 11,
  			tabActive: 12,
  			accordionList: 13,
  			accordionOpposite: 14,
  			noHairlines: 15,
  			noHairlinesMd: 16,
  			noHairlinesIos: 17,
  			noHairlinesAurora: 18,
  			class: 19
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Block",
  			options,
  			id: create_fragment$3.name
  		});
  	}

  	get inset() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set inset(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get xsmallInset() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set xsmallInset(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get smallInset() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set smallInset(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get mediumInset() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set mediumInset(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get largeInset() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set largeInset(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get xlargeInset() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set xlargeInset(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get strong() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set strong(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabs() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabs(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tab() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tab(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabActive() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabActive(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get accordionList() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set accordionList(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get accordionOpposite() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set accordionOpposite(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noHairlines() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noHairlines(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noHairlinesMd() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noHairlinesMd(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noHairlinesIos() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noHairlinesIos(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noHairlinesAurora() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noHairlinesAurora(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get class() {
  		throw new Error("<Block>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Block>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* eslint no-underscore-dangle: "off" */

  let routerComponentIdCounter = 0;

  var componentsRouter = {
    proto: {
      pageComponentLoader(routerEl, component, componentUrl, options, resolve, reject) {
        const router = this;
        const el = routerEl;
        let viewRouter;
        f7.routers.views.forEach((data) => {
          if (data.el && data.el === routerEl) {
            viewRouter = data;
          }
        });

        if (!viewRouter) {
          reject();
          return;
        }

        const id = `${Utils$1.now()}_${(routerComponentIdCounter += 1)}`;
        const pageData = {
          component,
          id,
          props: Utils$1.extend(
            {
              f7route: options.route,
              $f7route: options.route,
              f7router: router,
              $f7router: router,
            },
            options.route.params,
            options.props || {},
          ),
        };
        if (viewRouter.component) {
          viewRouter.component.$f7router = router;
          viewRouter.component.$f7route = options.route;
        }

        let resolved;
        function onDidUpdate(componentRouterData) {
          if (componentRouterData !== viewRouter || resolved) return;
          f7.events.off('viewRouterDidUpdate', onDidUpdate);

          const pageEl = el.children[el.children.length - 1];
          pageData.el = pageEl;

          resolve(pageEl);
          resolved = true;
        }

        f7.events.on('viewRouterDidUpdate', onDidUpdate);

        viewRouter.pages.push(pageData);
        viewRouter.setPages(viewRouter.pages);
      },
      removePage($pageEl) {
        if (!$pageEl) return;
        const router = this;
        let f7Page;
        if ('length' in $pageEl && $pageEl[0]) f7Page = $pageEl[0].f7Page;
        else f7Page = $pageEl.f7Page;
        if (f7Page && f7Page.route && f7Page.route.route && f7Page.route.route.keepAlive) {
          router.app.$($pageEl).remove();
          return;
        }
        let viewRouter;
        f7.routers.views.forEach((data) => {
          if (data.el && data.el === router.el) {
            viewRouter = data;
          }
        });

        let pageEl;
        if ('length' in $pageEl) {
          // Dom7
          if ($pageEl.length === 0) return;
          pageEl = $pageEl[0];
        } else {
          pageEl = $pageEl;
        }
        if (!pageEl) return;

        let pageComponentFound;
        viewRouter.pages.forEach((page, index) => {
          if (page.el === pageEl) {
            pageComponentFound = true;
            viewRouter.pages.splice(index, 1);
            viewRouter.setPages(viewRouter.pages);
          }
        });
        if (!pageComponentFound) {
          pageEl.parentNode.removeChild(pageEl);
        }
      },
      tabComponentLoader(tabEl, component, componentUrl, options, resolve, reject) {
        const router = this;
        if (!tabEl) reject();

        let tabRouter;
        f7.routers.tabs.forEach((tabData) => {
          if (tabData.el && tabData.el === tabEl) {
            tabRouter = tabData;
          }
        });
        if (!tabRouter) {
          reject();
          return;
        }

        const id = `${Utils$1.now()}_${(routerComponentIdCounter += 1)}`;
        const tabContent = {
          id,
          component,
          props: Utils$1.extend(
            {
              f7route: options.route,
              $f7route: options.route,
              f7router: router,
              $f7router: router,
            },
            options.route.params,
            options.props || {},
          ),
        };

        if (tabRouter.component) {
          tabRouter.component.$f7router = router;
          tabRouter.component.$f7route = options.route;
        }

        let resolved;
        function onDidUpdate(componentRouterData) {
          if (componentRouterData !== tabRouter || resolved) return;
          f7.events.off('tabRouterDidUpdate', onDidUpdate);

          const tabContentEl = tabEl.children[0];
          resolve(tabContentEl);

          resolved = true;
        }

        f7.events.on('tabRouterDidUpdate', onDidUpdate);

        tabRouter.setTabContent(tabContent);
      },
      removeTabContent(tabEl) {
        if (!tabEl) return;

        let tabRouter;
        f7.routers.tabs.forEach((tabData) => {
          if (tabData.el && tabData.el === tabEl) {
            tabRouter = tabData;
          }
        });
        const hasComponent = tabRouter && tabRouter.component;
        if (!tabRouter || !hasComponent) {
          tabEl.innerHTML = ''; // eslint-disable-line
          return;
        }
        tabRouter.setTabContent(null);
      },
      modalComponentLoader(rootEl, component, componentUrl, options, resolve, reject) {
        const router = this;
        const modalsRouter = f7.routers.modals;

        if (!modalsRouter) {
          reject();
          return;
        }

        const id = `${Utils$1.now()}_${(routerComponentIdCounter += 1)}`;
        const modalData = {
          component,
          id,
          props: Utils$1.extend(
            {
              f7route: options.route,
              $f7route: options.route,
              f7router: router,
              $f7router: router,
            },
            options.route.params,
            options.props || {},
          ),
        };
        if (modalsRouter.component) {
          modalsRouter.component.$f7router = router;
          modalsRouter.component.$f7route = options.route;
        }

        let resolved;
        function onDidUpdate() {
          if (resolved) return;
          f7.events.off('modalsRouterDidUpdate', onDidUpdate);

          const modalEl = modalsRouter.el.children[modalsRouter.el.children.length - 1];
          modalData.el = modalEl;

          resolve(modalEl);
          resolved = true;
        }

        f7.events.on('modalsRouterDidUpdate', onDidUpdate);

        modalsRouter.modals.push(modalData);
        modalsRouter.setModals(modalsRouter.modals);
      },
      removeModal(modalEl) {
        const modalsRouter = f7.routers.modals;
        if (!modalsRouter) return;

        let modalDataToRemove;
        modalsRouter.modals.forEach((modalData) => {
          if (modalData.el === modalEl) modalDataToRemove = modalData;
        });

        modalsRouter.modals.splice(modalsRouter.modals.indexOf(modalDataToRemove), 1);
        modalsRouter.setModals(modalsRouter.modals);
      },
    },
  };

  /* eslint no-underscore-dangle: "off" */
  const f7Theme = {};
  const Plugin = {
    name: 'phenomePlugin',
    installed: false,
    install(params = {}) {
      if (Plugin.installed) return;
      Plugin.installed = true;
      const Framework7 = this;
      f7.Framework7 = Framework7;
      f7.events = new Framework7.Events();
      // eslint-disable-next-line
      
      const { theme } = params;
      if (theme === 'md') f7Theme.md = true;
      if (theme === 'ios') f7Theme.ios = true;
      if (theme === 'aurora') f7Theme.aurora = true;
      if (!theme || theme === 'auto') {
        f7Theme.ios = !!Framework7.device.ios;
        f7Theme.aurora = Framework7.device.desktop && Framework7.device.electron;
        f7Theme.md = !f7Theme.ios && !f7Theme.aurora;
      }
      f7.ready(() => {
        f7Theme.ios = f7.instance.theme === 'ios';
        f7Theme.md = f7.instance.theme === 'md';
        f7Theme.aurora = f7.instance.theme === 'aurora';
      });
      
      // Extend F7 Router
      Framework7.Router.use(componentsRouter);
    },
  };

  /* node_modules\framework7-svelte\components\icon.svelte generated by Svelte v3.24.0 */
  const file$4 = "node_modules\\framework7-svelte\\components\\icon.svelte";

  function create_fragment$4(ctx) {
  	let i;
  	let t0_value = (/*iconText*/ ctx[2] || "") + "";
  	let t0;
  	let t1;
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[17].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

  	let i_levels = [
  		{ style: /*iconStyle*/ ctx[3] },
  		{ class: /*iconClasses*/ ctx[1] },
  		restProps(/*$$restProps*/ ctx[4])
  	];

  	let i_data = {};

  	for (let i = 0; i < i_levels.length; i += 1) {
  		i_data = assign(i_data, i_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			i = element("i");
  			t0 = text$1(t0_value);
  			t1 = space();
  			if (default_slot) default_slot.c();
  			set_attributes(i, i_data);
  			add_location(i, file$4, 135, 0, 3344);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, i, anchor);
  			append_dev(i, t0);
  			append_dev(i, t1);

  			if (default_slot) {
  				default_slot.m(i, null);
  			}

  			/*i_binding*/ ctx[18](i);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if ((!current || dirty & /*iconText*/ 4) && t0_value !== (t0_value = (/*iconText*/ ctx[2] || "") + "")) set_data_dev(t0, t0_value);

  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 65536) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[16], dirty, null, null);
  				}
  			}

  			set_attributes(i, i_data = get_spread_update(i_levels, [
  				(!current || dirty & /*iconStyle*/ 8) && { style: /*iconStyle*/ ctx[3] },
  				(!current || dirty & /*iconClasses*/ 2) && { class: /*iconClasses*/ ctx[1] },
  				dirty & /*$$restProps*/ 16 && restProps(/*$$restProps*/ ctx[4])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(i);
  			if (default_slot) default_slot.d(detaching);
  			/*i_binding*/ ctx[18](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$4.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$4($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"style","class","material","f7","icon","ios","aurora","md","tooltip","tooltipTrigger","size"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	let { style = undefined } = $$props;
  	let { class: className = undefined } = $$props;
  	let { material = undefined } = $$props;
  	let { f7: f7$1 = undefined } = $$props;
  	let { icon = undefined } = $$props;
  	let { ios = undefined } = $$props;
  	let { aurora = undefined } = $$props;
  	let { md = undefined } = $$props;
  	let { tooltip = undefined } = $$props;
  	let { tooltipTrigger = undefined } = $$props;
  	let { size = undefined } = $$props;

  	// eslint-disable-next-line
  	let _theme = f7.instance ? f7Theme : null;

  	let el;
  	let f7Tooltip;
  	let classes = { icon: true };

  	if (!f7.instance) {
  		f7.ready(() => {
  			$$invalidate(19, _theme = f7Theme);
  		});
  	}

  	let themeIcon;

  	function iconTextComputed(t) {
  		let textComputed = material || f7$1;

  		if (md && t && t.md && (md.indexOf("material:") >= 0 || md.indexOf("f7:") >= 0)) {
  			textComputed = md.split(":")[1];
  		} else if (ios && t && t.ios && (ios.indexOf("material:") >= 0 || ios.indexOf("f7:") >= 0)) {
  			textComputed = ios.split(":")[1];
  		} else if (aurora && t && t.aurora && (aurora.indexOf("material:") >= 0 || aurora.indexOf("f7:") >= 0)) {
  			textComputed = aurora.split(":")[1];
  		}

  		return textComputed;
  	}

  	let tooltipText = tooltip;

  	function watchTooltip(newText) {
  		const oldText = tooltipText;
  		if (oldText === newText) return;
  		tooltipText = newText;

  		if (!newText && f7Tooltip) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  			return;
  		}

  		if (newText && !f7Tooltip && f7.instance) {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: newText,
  				trigger: tooltipTrigger
  			});

  			return;
  		}

  		if (!newText || !f7Tooltip) return;
  		f7Tooltip.setText(newText);
  	}

  	onMount(() => {
  		if (!tooltip) return;

  		f7.ready(() => {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: tooltip,
  				trigger: tooltipTrigger
  			});
  		});
  	});

  	onDestroy(() => {
  		if (f7Tooltip && f7Tooltip.destroy) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  		}
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Icon", $$slots, ['default']);

  	function i_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(0, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(27, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(4, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("style" in $$new_props) $$invalidate(5, style = $$new_props.style);
  		if ("class" in $$new_props) $$invalidate(6, className = $$new_props.class);
  		if ("material" in $$new_props) $$invalidate(7, material = $$new_props.material);
  		if ("f7" in $$new_props) $$invalidate(8, f7$1 = $$new_props.f7);
  		if ("icon" in $$new_props) $$invalidate(9, icon = $$new_props.icon);
  		if ("ios" in $$new_props) $$invalidate(10, ios = $$new_props.ios);
  		if ("aurora" in $$new_props) $$invalidate(11, aurora = $$new_props.aurora);
  		if ("md" in $$new_props) $$invalidate(12, md = $$new_props.md);
  		if ("tooltip" in $$new_props) $$invalidate(13, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$new_props) $$invalidate(14, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("size" in $$new_props) $$invalidate(15, size = $$new_props.size);
  		if ("$$scope" in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		theme: f7Theme,
  		F7: f7,
  		style,
  		className,
  		material,
  		f7: f7$1,
  		icon,
  		ios,
  		aurora,
  		md,
  		tooltip,
  		tooltipTrigger,
  		size,
  		_theme,
  		el,
  		f7Tooltip,
  		classes,
  		themeIcon,
  		iconTextComputed,
  		tooltipText,
  		watchTooltip,
  		iconClasses,
  		iconText,
  		iconSize,
  		iconStyle
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(27, $$props = assign(assign({}, $$props), $$new_props));
  		if ("style" in $$props) $$invalidate(5, style = $$new_props.style);
  		if ("className" in $$props) $$invalidate(6, className = $$new_props.className);
  		if ("material" in $$props) $$invalidate(7, material = $$new_props.material);
  		if ("f7" in $$props) $$invalidate(8, f7$1 = $$new_props.f7);
  		if ("icon" in $$props) $$invalidate(9, icon = $$new_props.icon);
  		if ("ios" in $$props) $$invalidate(10, ios = $$new_props.ios);
  		if ("aurora" in $$props) $$invalidate(11, aurora = $$new_props.aurora);
  		if ("md" in $$props) $$invalidate(12, md = $$new_props.md);
  		if ("tooltip" in $$props) $$invalidate(13, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$props) $$invalidate(14, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("size" in $$props) $$invalidate(15, size = $$new_props.size);
  		if ("_theme" in $$props) $$invalidate(19, _theme = $$new_props._theme);
  		if ("el" in $$props) $$invalidate(0, el = $$new_props.el);
  		if ("f7Tooltip" in $$props) f7Tooltip = $$new_props.f7Tooltip;
  		if ("classes" in $$props) $$invalidate(21, classes = $$new_props.classes);
  		if ("themeIcon" in $$props) $$invalidate(22, themeIcon = $$new_props.themeIcon);
  		if ("tooltipText" in $$props) tooltipText = $$new_props.tooltipText;
  		if ("iconClasses" in $$props) $$invalidate(1, iconClasses = $$new_props.iconClasses);
  		if ("iconText" in $$props) $$invalidate(2, iconText = $$new_props.iconText);
  		if ("iconSize" in $$props) $$invalidate(24, iconSize = $$new_props.iconSize);
  		if ("iconStyle" in $$props) $$invalidate(3, iconStyle = $$new_props.iconStyle);
  	};

  	let iconClasses;
  	let iconText;
  	let iconSize;
  	let iconStyle;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*_theme, ios, md, aurora*/ 531456) {
  			 if (_theme) {
  				if (_theme.ios) $$invalidate(22, themeIcon = ios);
  				if (_theme.md) $$invalidate(22, themeIcon = md);
  				if (_theme.aurora) $$invalidate(22, themeIcon = aurora);
  			}
  		}

  		if ($$self.$$.dirty & /*themeIcon, material, f7, icon*/ 4195200) {
  			 if (themeIcon) {
  				const parts = themeIcon.split(":");
  				const prop = parts[0];
  				const value = parts[1];

  				if (prop === "material" || prop === "f7") {
  					$$invalidate(21, classes["material-icons"] = prop === "material", classes);
  					$$invalidate(21, classes["f7-icons"] = prop === "f7", classes);
  				}

  				if (prop === "icon") {
  					$$invalidate(21, classes[value] = true, classes);
  				}
  			} else {
  				$$invalidate(21, classes = {
  					icon: true,
  					"material-icons": material,
  					"f7-icons": f7$1
  				});

  				if (icon) $$invalidate(21, classes[icon] = true, classes);
  			}
  		}

  		 $$invalidate(1, iconClasses = Utils$1.classNames(className, classes, Mixins.colorClasses($$props)));

  		if ($$self.$$.dirty & /*_theme*/ 524288) {
  			 $$invalidate(2, iconText = iconTextComputed(_theme));
  		}

  		if ($$self.$$.dirty & /*size*/ 32768) {
  			 $$invalidate(24, iconSize = typeof size === "number" || parseFloat(size) === size * 1
  			? `${size}px`
  			: size);
  		}

  		if ($$self.$$.dirty & /*style, iconSize*/ 16777248) {
  			 $$invalidate(3, iconStyle = (style || "") + (iconSize
  			? `;font-size: ${iconSize}; width: ${iconSize}; height: ${iconSize}`.replace(";;", "")
  			: ""));
  		}

  		if ($$self.$$.dirty & /*tooltip*/ 8192) {
  			 watchTooltip(tooltip);
  		}
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		el,
  		iconClasses,
  		iconText,
  		iconStyle,
  		$$restProps,
  		style,
  		className,
  		material,
  		f7$1,
  		icon,
  		ios,
  		aurora,
  		md,
  		tooltip,
  		tooltipTrigger,
  		size,
  		$$scope,
  		$$slots,
  		i_binding
  	];
  }

  class Icon extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
  			style: 5,
  			class: 6,
  			material: 7,
  			f7: 8,
  			icon: 9,
  			ios: 10,
  			aurora: 11,
  			md: 12,
  			tooltip: 13,
  			tooltipTrigger: 14,
  			size: 15
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Icon",
  			options,
  			id: create_fragment$4.name
  		});
  	}

  	get style() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set style(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get class() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get material() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set material(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get f7() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set f7(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get icon() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set icon(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ios() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ios(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get aurora() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set aurora(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get md() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set md(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltip() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltip(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltipTrigger() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltipTrigger(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get size() {
  		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set size(value) {
  		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\button.svelte generated by Svelte v3.24.0 */
  const file$5 = "node_modules\\framework7-svelte\\components\\button.svelte";

  // (191:0) {:else}
  function create_else_block(ctx) {
  	let a;
  	let t0;
  	let t1;
  	let current;
  	let mounted;
  	let dispose;
  	let if_block0 = /*hasIcon*/ ctx[5] && create_if_block_4(ctx);
  	let if_block1 = typeof /*text*/ ctx[0] !== "undefined" && create_if_block_3(ctx);
  	const default_slot_template = /*$$slots*/ ctx[43].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[42], null);
  	let a_levels = [{ class: /*classes*/ ctx[3] }, /*attrs*/ ctx[2]];
  	let a_data = {};

  	for (let i = 0; i < a_levels.length; i += 1) {
  		a_data = assign(a_data, a_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			a = element("a");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			if (if_block1) if_block1.c();
  			t1 = space();
  			if (default_slot) default_slot.c();
  			set_attributes(a, a_data);
  			add_location(a, file$5, 191, 2, 5104);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, a, anchor);
  			if (if_block0) if_block0.m(a, null);
  			append_dev(a, t0);
  			if (if_block1) if_block1.m(a, null);
  			append_dev(a, t1);

  			if (default_slot) {
  				default_slot.m(a, null);
  			}

  			/*a_binding*/ ctx[45](a);
  			current = true;

  			if (!mounted) {
  				dispose = listen_dev(a, "click", /*onClick*/ ctx[6], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (/*hasIcon*/ ctx[5]) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);

  					if (dirty[0] & /*hasIcon*/ 32) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_4(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(a, t0);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (typeof /*text*/ ctx[0] !== "undefined") {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);
  				} else {
  					if_block1 = create_if_block_3(ctx);
  					if_block1.c();
  					if_block1.m(a, t1);
  				}
  			} else if (if_block1) {
  				if_block1.d(1);
  				if_block1 = null;
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[1] & /*$$scope*/ 2048) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[42], dirty, null, null);
  				}
  			}

  			set_attributes(a, a_data = get_spread_update(a_levels, [
  				(!current || dirty[0] & /*classes*/ 8) && { class: /*classes*/ ctx[3] },
  				dirty[0] & /*attrs*/ 4 && /*attrs*/ ctx[2]
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block0);
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block0);
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(a);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			if (default_slot) default_slot.d(detaching);
  			/*a_binding*/ ctx[45](null);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block.name,
  		type: "else",
  		source: "(191:0) {:else}",
  		ctx
  	});

  	return block;
  }

  // (167:0) {#if tagName === 'button'}
  function create_if_block(ctx) {
  	let button;
  	let t0;
  	let t1;
  	let current;
  	let mounted;
  	let dispose;
  	let if_block0 = /*hasIcon*/ ctx[5] && create_if_block_2(ctx);
  	let if_block1 = typeof /*text*/ ctx[0] !== "undefined" && create_if_block_1(ctx);
  	const default_slot_template = /*$$slots*/ ctx[43].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[42], null);
  	let button_levels = [{ class: /*classes*/ ctx[3] }, /*attrs*/ ctx[2]];
  	let button_data = {};

  	for (let i = 0; i < button_levels.length; i += 1) {
  		button_data = assign(button_data, button_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			button = element("button");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			if (if_block1) if_block1.c();
  			t1 = space();
  			if (default_slot) default_slot.c();
  			set_attributes(button, button_data);
  			add_location(button, file$5, 167, 2, 4589);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, button, anchor);
  			if (if_block0) if_block0.m(button, null);
  			append_dev(button, t0);
  			if (if_block1) if_block1.m(button, null);
  			append_dev(button, t1);

  			if (default_slot) {
  				default_slot.m(button, null);
  			}

  			/*button_binding*/ ctx[44](button);
  			current = true;

  			if (!mounted) {
  				dispose = listen_dev(button, "click", /*onClick*/ ctx[6], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (/*hasIcon*/ ctx[5]) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);

  					if (dirty[0] & /*hasIcon*/ 32) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_2(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(button, t0);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (typeof /*text*/ ctx[0] !== "undefined") {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);
  				} else {
  					if_block1 = create_if_block_1(ctx);
  					if_block1.c();
  					if_block1.m(button, t1);
  				}
  			} else if (if_block1) {
  				if_block1.d(1);
  				if_block1 = null;
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[1] & /*$$scope*/ 2048) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[42], dirty, null, null);
  				}
  			}

  			set_attributes(button, button_data = get_spread_update(button_levels, [
  				(!current || dirty[0] & /*classes*/ 8) && { class: /*classes*/ ctx[3] },
  				dirty[0] & /*attrs*/ 4 && /*attrs*/ ctx[2]
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block0);
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block0);
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(button);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			if (default_slot) default_slot.d(detaching);
  			/*button_binding*/ ctx[44](null);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block.name,
  		type: "if",
  		source: "(167:0) {#if tagName === 'button'}",
  		ctx
  	});

  	return block;
  }

  // (198:4) {#if hasIcon}
  function create_if_block_4(ctx) {
  	let icon;
  	let current;

  	icon = new Icon({
  			props: {
  				material: /*$$props*/ ctx[7].iconMaterial,
  				f7: /*$$props*/ ctx[7].iconF7,
  				icon: /*$$props*/ ctx[7].icon,
  				md: /*$$props*/ ctx[7].iconMd,
  				ios: /*$$props*/ ctx[7].iconIos,
  				aurora: /*$$props*/ ctx[7].iconAurora,
  				color: /*$$props*/ ctx[7].iconColor,
  				size: /*$$props*/ ctx[7].iconSize
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(icon.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(icon, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const icon_changes = {};
  			if (dirty[0] & /*$$props*/ 128) icon_changes.material = /*$$props*/ ctx[7].iconMaterial;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.f7 = /*$$props*/ ctx[7].iconF7;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.icon = /*$$props*/ ctx[7].icon;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.md = /*$$props*/ ctx[7].iconMd;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.ios = /*$$props*/ ctx[7].iconIos;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.aurora = /*$$props*/ ctx[7].iconAurora;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.color = /*$$props*/ ctx[7].iconColor;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.size = /*$$props*/ ctx[7].iconSize;
  			icon.$set(icon_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(icon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(icon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(icon, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_4.name,
  		type: "if",
  		source: "(198:4) {#if hasIcon}",
  		ctx
  	});

  	return block;
  }

  // (210:4) {#if typeof text !== 'undefined'}
  function create_if_block_3(ctx) {
  	let span;
  	let t_value = Utils$1.text(/*text*/ ctx[0]) + "";
  	let t;

  	const block = {
  		c: function create() {
  			span = element("span");
  			t = text$1(t_value);
  			add_location(span, file$5, 210, 6, 5537);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  			append_dev(span, t);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty[0] & /*text*/ 1 && t_value !== (t_value = Utils$1.text(/*text*/ ctx[0]) + "")) set_data_dev(t, t_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_3.name,
  		type: "if",
  		source: "(210:4) {#if typeof text !== 'undefined'}",
  		ctx
  	});

  	return block;
  }

  // (174:4) {#if hasIcon}
  function create_if_block_2(ctx) {
  	let icon;
  	let current;

  	icon = new Icon({
  			props: {
  				material: /*$$props*/ ctx[7].iconMaterial,
  				f7: /*$$props*/ ctx[7].iconF7,
  				icon: /*$$props*/ ctx[7].icon,
  				md: /*$$props*/ ctx[7].iconMd,
  				ios: /*$$props*/ ctx[7].iconIos,
  				aurora: /*$$props*/ ctx[7].iconAurora,
  				color: /*$$props*/ ctx[7].iconColor,
  				size: /*$$props*/ ctx[7].iconSize
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(icon.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(icon, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const icon_changes = {};
  			if (dirty[0] & /*$$props*/ 128) icon_changes.material = /*$$props*/ ctx[7].iconMaterial;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.f7 = /*$$props*/ ctx[7].iconF7;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.icon = /*$$props*/ ctx[7].icon;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.md = /*$$props*/ ctx[7].iconMd;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.ios = /*$$props*/ ctx[7].iconIos;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.aurora = /*$$props*/ ctx[7].iconAurora;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.color = /*$$props*/ ctx[7].iconColor;
  			if (dirty[0] & /*$$props*/ 128) icon_changes.size = /*$$props*/ ctx[7].iconSize;
  			icon.$set(icon_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(icon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(icon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(icon, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2.name,
  		type: "if",
  		source: "(174:4) {#if hasIcon}",
  		ctx
  	});

  	return block;
  }

  // (186:4) {#if typeof text !== 'undefined'}
  function create_if_block_1(ctx) {
  	let span;
  	let t_value = Utils$1.text(/*text*/ ctx[0]) + "";
  	let t;

  	const block = {
  		c: function create() {
  			span = element("span");
  			t = text$1(t_value);
  			add_location(span, file$5, 186, 6, 5027);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  			append_dev(span, t);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty[0] & /*text*/ 1 && t_value !== (t_value = Utils$1.text(/*text*/ ctx[0]) + "")) set_data_dev(t, t_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1.name,
  		type: "if",
  		source: "(186:4) {#if typeof text !== 'undefined'}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$5(ctx) {
  	let current_block_type_index;
  	let if_block;
  	let if_block_anchor;
  	let current;
  	const if_block_creators = [create_if_block, create_else_block];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*tagName*/ ctx[4] === "button") return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			if_block.c();
  			if_block_anchor = empty$1();
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			if_blocks[current_block_type_index].m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				}

  				transition_in(if_block, 1);
  				if_block.m(if_block_anchor.parentNode, if_block_anchor);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if_blocks[current_block_type_index].d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$5.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$5($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"class","text","tabLink","tabLinkActive","type","href","target","round","roundMd","roundIos","roundAurora","fill","fillMd","fillIos","fillAurora","large","largeMd","largeIos","largeAurora","small","smallMd","smallIos","smallAurora","raised","raisedMd","raisedIos","raisedAurora","outline","outlineMd","outlineIos","outlineAurora","active","disabled","tooltip","tooltipTrigger"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { class: className = undefined } = $$props;
  	let { text = undefined } = $$props;
  	let { tabLink = undefined } = $$props;
  	let { tabLinkActive = false } = $$props;
  	let { type = undefined } = $$props;
  	let { href = "#" } = $$props;
  	let { target = undefined } = $$props;
  	let { round = false } = $$props;
  	let { roundMd = false } = $$props;
  	let { roundIos = false } = $$props;
  	let { roundAurora = false } = $$props;
  	let { fill = false } = $$props;
  	let { fillMd = false } = $$props;
  	let { fillIos = false } = $$props;
  	let { fillAurora = false } = $$props;
  	let { large = false } = $$props;
  	let { largeMd = false } = $$props;
  	let { largeIos = false } = $$props;
  	let { largeAurora = false } = $$props;
  	let { small = false } = $$props;
  	let { smallMd = false } = $$props;
  	let { smallIos = false } = $$props;
  	let { smallAurora = false } = $$props;
  	let { raised = false } = $$props;
  	let { raisedMd = false } = $$props;
  	let { raisedIos = false } = $$props;
  	let { raisedAurora = false } = $$props;
  	let { outline = false } = $$props;
  	let { outlineMd = false } = $$props;
  	let { outlineIos = false } = $$props;
  	let { outlineAurora = false } = $$props;
  	let { active = false } = $$props;
  	let { disabled = false } = $$props;
  	let { tooltip = undefined } = $$props;
  	let { tooltipTrigger = undefined } = $$props;
  	let el;
  	let f7Tooltip;
  	let tooltipText = tooltip;

  	function watchTooltip(newText) {
  		const oldText = tooltipText;
  		if (oldText === newText) return;
  		tooltipText = newText;

  		if (!newText && f7Tooltip) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  			return;
  		}

  		if (newText && !f7Tooltip && f7.instance) {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: newText,
  				trigger: tooltipTrigger
  			});

  			return;
  		}

  		if (!newText || !f7Tooltip) return;
  		f7Tooltip.setText(newText);
  	}

  	function onClick() {
  		dispatch("click");
  		if (typeof $$props.onClick === "function") $$props.onClick();
  	}

  	onMount(() => {
  		if ($$props.routeProps) {
  			$$invalidate(1, el.f7RouteProps = $$props.routeProps, el);
  		}

  		if (!tooltip) return;

  		f7.ready(() => {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: tooltip,
  				trigger: tooltipTrigger
  			});
  		});
  	});

  	afterUpdate(() => {
  		if ($$props.routeProps) {
  			$$invalidate(1, el.f7RouteProps = $$props.routeProps, el);
  		}
  	});

  	onDestroy(() => {
  		if (el) delete el.f7RouteProps;

  		if (f7Tooltip && f7Tooltip.destroy) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  		}
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Button", $$slots, ['default']);

  	function button_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(1, el);
  		});
  	}

  	function a_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(1, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(51, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(8, className = $$new_props.class);
  		if ("text" in $$new_props) $$invalidate(0, text = $$new_props.text);
  		if ("tabLink" in $$new_props) $$invalidate(9, tabLink = $$new_props.tabLink);
  		if ("tabLinkActive" in $$new_props) $$invalidate(10, tabLinkActive = $$new_props.tabLinkActive);
  		if ("type" in $$new_props) $$invalidate(11, type = $$new_props.type);
  		if ("href" in $$new_props) $$invalidate(12, href = $$new_props.href);
  		if ("target" in $$new_props) $$invalidate(13, target = $$new_props.target);
  		if ("round" in $$new_props) $$invalidate(14, round = $$new_props.round);
  		if ("roundMd" in $$new_props) $$invalidate(15, roundMd = $$new_props.roundMd);
  		if ("roundIos" in $$new_props) $$invalidate(16, roundIos = $$new_props.roundIos);
  		if ("roundAurora" in $$new_props) $$invalidate(17, roundAurora = $$new_props.roundAurora);
  		if ("fill" in $$new_props) $$invalidate(18, fill = $$new_props.fill);
  		if ("fillMd" in $$new_props) $$invalidate(19, fillMd = $$new_props.fillMd);
  		if ("fillIos" in $$new_props) $$invalidate(20, fillIos = $$new_props.fillIos);
  		if ("fillAurora" in $$new_props) $$invalidate(21, fillAurora = $$new_props.fillAurora);
  		if ("large" in $$new_props) $$invalidate(22, large = $$new_props.large);
  		if ("largeMd" in $$new_props) $$invalidate(23, largeMd = $$new_props.largeMd);
  		if ("largeIos" in $$new_props) $$invalidate(24, largeIos = $$new_props.largeIos);
  		if ("largeAurora" in $$new_props) $$invalidate(25, largeAurora = $$new_props.largeAurora);
  		if ("small" in $$new_props) $$invalidate(26, small = $$new_props.small);
  		if ("smallMd" in $$new_props) $$invalidate(27, smallMd = $$new_props.smallMd);
  		if ("smallIos" in $$new_props) $$invalidate(28, smallIos = $$new_props.smallIos);
  		if ("smallAurora" in $$new_props) $$invalidate(29, smallAurora = $$new_props.smallAurora);
  		if ("raised" in $$new_props) $$invalidate(30, raised = $$new_props.raised);
  		if ("raisedMd" in $$new_props) $$invalidate(31, raisedMd = $$new_props.raisedMd);
  		if ("raisedIos" in $$new_props) $$invalidate(32, raisedIos = $$new_props.raisedIos);
  		if ("raisedAurora" in $$new_props) $$invalidate(33, raisedAurora = $$new_props.raisedAurora);
  		if ("outline" in $$new_props) $$invalidate(34, outline = $$new_props.outline);
  		if ("outlineMd" in $$new_props) $$invalidate(35, outlineMd = $$new_props.outlineMd);
  		if ("outlineIos" in $$new_props) $$invalidate(36, outlineIos = $$new_props.outlineIos);
  		if ("outlineAurora" in $$new_props) $$invalidate(37, outlineAurora = $$new_props.outlineAurora);
  		if ("active" in $$new_props) $$invalidate(38, active = $$new_props.active);
  		if ("disabled" in $$new_props) $$invalidate(39, disabled = $$new_props.disabled);
  		if ("tooltip" in $$new_props) $$invalidate(40, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$new_props) $$invalidate(41, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("$$scope" in $$new_props) $$invalidate(42, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		createEventDispatcher,
  		onMount,
  		afterUpdate,
  		onDestroy,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		f7,
  		Icon,
  		dispatch,
  		className,
  		text,
  		tabLink,
  		tabLinkActive,
  		type,
  		href,
  		target,
  		round,
  		roundMd,
  		roundIos,
  		roundAurora,
  		fill,
  		fillMd,
  		fillIos,
  		fillAurora,
  		large,
  		largeMd,
  		largeIos,
  		largeAurora,
  		small,
  		smallMd,
  		smallIos,
  		smallAurora,
  		raised,
  		raisedMd,
  		raisedIos,
  		raisedAurora,
  		outline,
  		outlineMd,
  		outlineIos,
  		outlineAurora,
  		active,
  		disabled,
  		tooltip,
  		tooltipTrigger,
  		el,
  		f7Tooltip,
  		tooltipText,
  		watchTooltip,
  		onClick,
  		hrefComputed,
  		attrs,
  		classes,
  		tagName,
  		hasIcon
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(8, className = $$new_props.className);
  		if ("text" in $$props) $$invalidate(0, text = $$new_props.text);
  		if ("tabLink" in $$props) $$invalidate(9, tabLink = $$new_props.tabLink);
  		if ("tabLinkActive" in $$props) $$invalidate(10, tabLinkActive = $$new_props.tabLinkActive);
  		if ("type" in $$props) $$invalidate(11, type = $$new_props.type);
  		if ("href" in $$props) $$invalidate(12, href = $$new_props.href);
  		if ("target" in $$props) $$invalidate(13, target = $$new_props.target);
  		if ("round" in $$props) $$invalidate(14, round = $$new_props.round);
  		if ("roundMd" in $$props) $$invalidate(15, roundMd = $$new_props.roundMd);
  		if ("roundIos" in $$props) $$invalidate(16, roundIos = $$new_props.roundIos);
  		if ("roundAurora" in $$props) $$invalidate(17, roundAurora = $$new_props.roundAurora);
  		if ("fill" in $$props) $$invalidate(18, fill = $$new_props.fill);
  		if ("fillMd" in $$props) $$invalidate(19, fillMd = $$new_props.fillMd);
  		if ("fillIos" in $$props) $$invalidate(20, fillIos = $$new_props.fillIos);
  		if ("fillAurora" in $$props) $$invalidate(21, fillAurora = $$new_props.fillAurora);
  		if ("large" in $$props) $$invalidate(22, large = $$new_props.large);
  		if ("largeMd" in $$props) $$invalidate(23, largeMd = $$new_props.largeMd);
  		if ("largeIos" in $$props) $$invalidate(24, largeIos = $$new_props.largeIos);
  		if ("largeAurora" in $$props) $$invalidate(25, largeAurora = $$new_props.largeAurora);
  		if ("small" in $$props) $$invalidate(26, small = $$new_props.small);
  		if ("smallMd" in $$props) $$invalidate(27, smallMd = $$new_props.smallMd);
  		if ("smallIos" in $$props) $$invalidate(28, smallIos = $$new_props.smallIos);
  		if ("smallAurora" in $$props) $$invalidate(29, smallAurora = $$new_props.smallAurora);
  		if ("raised" in $$props) $$invalidate(30, raised = $$new_props.raised);
  		if ("raisedMd" in $$props) $$invalidate(31, raisedMd = $$new_props.raisedMd);
  		if ("raisedIos" in $$props) $$invalidate(32, raisedIos = $$new_props.raisedIos);
  		if ("raisedAurora" in $$props) $$invalidate(33, raisedAurora = $$new_props.raisedAurora);
  		if ("outline" in $$props) $$invalidate(34, outline = $$new_props.outline);
  		if ("outlineMd" in $$props) $$invalidate(35, outlineMd = $$new_props.outlineMd);
  		if ("outlineIos" in $$props) $$invalidate(36, outlineIos = $$new_props.outlineIos);
  		if ("outlineAurora" in $$props) $$invalidate(37, outlineAurora = $$new_props.outlineAurora);
  		if ("active" in $$props) $$invalidate(38, active = $$new_props.active);
  		if ("disabled" in $$props) $$invalidate(39, disabled = $$new_props.disabled);
  		if ("tooltip" in $$props) $$invalidate(40, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$props) $$invalidate(41, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("el" in $$props) $$invalidate(1, el = $$new_props.el);
  		if ("f7Tooltip" in $$props) f7Tooltip = $$new_props.f7Tooltip;
  		if ("tooltipText" in $$props) tooltipText = $$new_props.tooltipText;
  		if ("hrefComputed" in $$props) $$invalidate(48, hrefComputed = $$new_props.hrefComputed);
  		if ("attrs" in $$props) $$invalidate(2, attrs = $$new_props.attrs);
  		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
  		if ("tagName" in $$props) $$invalidate(4, tagName = $$new_props.tagName);
  		if ("hasIcon" in $$props) $$invalidate(5, hasIcon = $$new_props.hasIcon);
  	};

  	let hrefComputed;
  	let attrs;
  	let classes;
  	let tagName;
  	let hasIcon;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty[0] & /*href*/ 4096) {
  			 $$invalidate(48, hrefComputed = href === true ? "#" : href || undefined);
  		}

  		 $$invalidate(2, attrs = Utils$1.extend(
  			{
  				href: hrefComputed,
  				target,
  				type,
  				"data-tab": Utils$1.isStringProp(tabLink) && tabLink || undefined,
  				...restProps($$restProps)
  			},
  			Mixins.linkRouterAttrs($$props),
  			Mixins.linkActionsAttrs($$props)
  		));

  		 $$invalidate(3, classes = Utils$1.classNames(
  			className,
  			"button",
  			{
  				"tab-link": tabLink || tabLink === "",
  				"tab-link-active": tabLinkActive,
  				"button-round": round,
  				"button-round-ios": roundIos,
  				"button-round-aurora": roundAurora,
  				"button-round-md": roundMd,
  				"button-fill": fill,
  				"button-fill-ios": fillIos,
  				"button-fill-aurora": fillAurora,
  				"button-fill-md": fillMd,
  				"button-large": large,
  				"button-large-ios": largeIos,
  				"button-large-aurora": largeAurora,
  				"button-large-md": largeMd,
  				"button-small": small,
  				"button-small-ios": smallIos,
  				"button-small-aurora": smallAurora,
  				"button-small-md": smallMd,
  				"button-raised": raised,
  				"button-raised-ios": raisedIos,
  				"button-raised-aurora": raisedAurora,
  				"button-raised-md": raisedMd,
  				"button-active": active,
  				"button-outline": outline,
  				"button-outline-ios": outlineIos,
  				"button-outline-aurora": outlineAurora,
  				"button-outline-md": outlineMd,
  				disabled
  			},
  			Mixins.colorClasses($$props),
  			Mixins.linkRouterClasses($$props),
  			Mixins.linkActionsClasses($$props)
  		));

  		if ($$self.$$.dirty[0] & /*type*/ 2048) {
  			 $$invalidate(4, tagName = type === "submit" || type === "reset" || type === "button"
  			? "button"
  			: "a");
  		}

  		 $$invalidate(5, hasIcon = $$props.icon || $$props.iconMaterial || $$props.iconF7 || $$props.iconMd || $$props.iconIos || $$props.iconAurora);

  		if ($$self.$$.dirty[1] & /*tooltip*/ 512) {
  			 watchTooltip(tooltip);
  		}
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		text,
  		el,
  		attrs,
  		classes,
  		tagName,
  		hasIcon,
  		onClick,
  		$$props,
  		className,
  		tabLink,
  		tabLinkActive,
  		type,
  		href,
  		target,
  		round,
  		roundMd,
  		roundIos,
  		roundAurora,
  		fill,
  		fillMd,
  		fillIos,
  		fillAurora,
  		large,
  		largeMd,
  		largeIos,
  		largeAurora,
  		small,
  		smallMd,
  		smallIos,
  		smallAurora,
  		raised,
  		raisedMd,
  		raisedIos,
  		raisedAurora,
  		outline,
  		outlineMd,
  		outlineIos,
  		outlineAurora,
  		active,
  		disabled,
  		tooltip,
  		tooltipTrigger,
  		$$scope,
  		$$slots,
  		button_binding,
  		a_binding
  	];
  }

  class Button extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(
  			this,
  			options,
  			instance$5,
  			create_fragment$5,
  			safe_not_equal,
  			{
  				class: 8,
  				text: 0,
  				tabLink: 9,
  				tabLinkActive: 10,
  				type: 11,
  				href: 12,
  				target: 13,
  				round: 14,
  				roundMd: 15,
  				roundIos: 16,
  				roundAurora: 17,
  				fill: 18,
  				fillMd: 19,
  				fillIos: 20,
  				fillAurora: 21,
  				large: 22,
  				largeMd: 23,
  				largeIos: 24,
  				largeAurora: 25,
  				small: 26,
  				smallMd: 27,
  				smallIos: 28,
  				smallAurora: 29,
  				raised: 30,
  				raisedMd: 31,
  				raisedIos: 32,
  				raisedAurora: 33,
  				outline: 34,
  				outlineMd: 35,
  				outlineIos: 36,
  				outlineAurora: 37,
  				active: 38,
  				disabled: 39,
  				tooltip: 40,
  				tooltipTrigger: 41
  			},
  			[-1, -1]
  		);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Button",
  			options,
  			id: create_fragment$5.name
  		});
  	}

  	get class() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get text() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set text(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabLink() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabLink(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabLinkActive() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabLinkActive(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get type() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set type(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get href() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set href(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get target() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set target(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get round() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set round(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get roundMd() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set roundMd(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get roundIos() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set roundIos(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get roundAurora() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set roundAurora(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get fill() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set fill(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get fillMd() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set fillMd(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get fillIos() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set fillIos(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get fillAurora() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set fillAurora(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get large() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set large(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get largeMd() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set largeMd(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get largeIos() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set largeIos(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get largeAurora() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set largeAurora(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get small() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set small(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get smallMd() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set smallMd(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get smallIos() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set smallIos(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get smallAurora() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set smallAurora(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get raised() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set raised(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get raisedMd() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set raisedMd(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get raisedIos() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set raisedIos(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get raisedAurora() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set raisedAurora(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get outline() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set outline(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get outlineMd() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set outlineMd(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get outlineIos() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set outlineIos(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get outlineAurora() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set outlineAurora(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get active() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set active(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get disabled() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set disabled(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltip() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltip(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltipTrigger() {
  		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltipTrigger(value) {
  		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\link.svelte generated by Svelte v3.24.0 */
  const file$6 = "node_modules\\framework7-svelte\\components\\link.svelte";

  // (159:2) {#if hasIcon}
  function create_if_block_2$1(ctx) {
  	let icon;
  	let current;

  	icon = new Icon({
  			props: {
  				material: /*$$props*/ ctx[10].iconMaterial,
  				f7: /*$$props*/ ctx[10].iconF7,
  				icon: /*$$props*/ ctx[10].icon,
  				md: /*$$props*/ ctx[10].iconMd,
  				ios: /*$$props*/ ctx[10].iconIos,
  				aurora: /*$$props*/ ctx[10].iconAurora,
  				color: /*$$props*/ ctx[10].iconColor,
  				size: /*$$props*/ ctx[10].iconSize,
  				$$slots: { default: [create_default_slot_1] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(icon.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(icon, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const icon_changes = {};
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.material = /*$$props*/ ctx[10].iconMaterial;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.f7 = /*$$props*/ ctx[10].iconF7;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.icon = /*$$props*/ ctx[10].icon;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.md = /*$$props*/ ctx[10].iconMd;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.ios = /*$$props*/ ctx[10].iconIos;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.aurora = /*$$props*/ ctx[10].iconAurora;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.color = /*$$props*/ ctx[10].iconColor;
  			if (dirty[0] & /*$$props*/ 1024) icon_changes.size = /*$$props*/ ctx[10].iconSize;

  			if (dirty[0] & /*$$scope, badgeColor, iconBadge*/ 33554444) {
  				icon_changes.$$scope = { dirty, ctx };
  			}

  			icon.$set(icon_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(icon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(icon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(icon, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2$1.name,
  		type: "if",
  		source: "(159:2) {#if hasIcon}",
  		ctx
  	});

  	return block;
  }

  // (169:5) {#if iconBadge}
  function create_if_block_3$1(ctx) {
  	let badge_1;
  	let current;

  	badge_1 = new Badge({
  			props: {
  				color: /*badgeColor*/ ctx[2],
  				$$slots: { default: [create_default_slot_2] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(badge_1.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(badge_1, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const badge_1_changes = {};
  			if (dirty[0] & /*badgeColor*/ 4) badge_1_changes.color = /*badgeColor*/ ctx[2];

  			if (dirty[0] & /*$$scope, iconBadge*/ 33554440) {
  				badge_1_changes.$$scope = { dirty, ctx };
  			}

  			badge_1.$set(badge_1_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(badge_1.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(badge_1.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(badge_1, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_3$1.name,
  		type: "if",
  		source: "(169:5) {#if iconBadge}",
  		ctx
  	});

  	return block;
  }

  // (169:20) <Badge color={badgeColor}>
  function create_default_slot_2(ctx) {
  	let t;

  	const block = {
  		c: function create() {
  			t = text$1(/*iconBadge*/ ctx[3]);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty[0] & /*iconBadge*/ 8) set_data_dev(t, /*iconBadge*/ ctx[3]);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_2.name,
  		type: "slot",
  		source: "(169:20) <Badge color={badgeColor}>",
  		ctx
  	});

  	return block;
  }

  // (160:4) <Icon       material={$$props.iconMaterial}       f7={$$props.iconF7}       icon={$$props.icon}       md={$$props.iconMd}       ios={$$props.iconIos}       aurora={$$props.iconAurora}       color={$$props.iconColor}       size={$$props.iconSize}     >
  function create_default_slot_1(ctx) {
  	let if_block_anchor;
  	let current;
  	let if_block = /*iconBadge*/ ctx[3] && create_if_block_3$1(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty$1();
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (/*iconBadge*/ ctx[3]) {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty[0] & /*iconBadge*/ 8) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block_3$1(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_1.name,
  		type: "slot",
  		source: "(160:4) <Icon       material={$$props.iconMaterial}       f7={$$props.iconF7}       icon={$$props.icon}       md={$$props.iconMd}       ios={$$props.iconIos}       aurora={$$props.iconAurora}       color={$$props.iconColor}       size={$$props.iconSize}     >",
  		ctx
  	});

  	return block;
  }

  // (172:2) {#if typeof text !== 'undefined' || typeof badge !== 'undefined'}
  function create_if_block$1(ctx) {
  	let span;
  	let t0_value = Utils$1.text(/*text*/ ctx[0]) + "";
  	let t0;
  	let t1;
  	let current;
  	let if_block = typeof /*badge*/ ctx[1] !== "undefined" && create_if_block_1$1(ctx);

  	const block = {
  		c: function create() {
  			span = element("span");
  			t0 = text$1(t0_value);
  			t1 = space();
  			if (if_block) if_block.c();
  			toggle_class(span, "tabbar-label", /*isTabbarLabel*/ ctx[5]);
  			add_location(span, file$6, 172, 4, 4480);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  			append_dev(span, t0);
  			append_dev(span, t1);
  			if (if_block) if_block.m(span, null);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if ((!current || dirty[0] & /*text*/ 1) && t0_value !== (t0_value = Utils$1.text(/*text*/ ctx[0]) + "")) set_data_dev(t0, t0_value);

  			if (typeof /*badge*/ ctx[1] !== "undefined") {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty[0] & /*badge*/ 2) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block_1$1(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(span, null);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}

  			if (dirty[0] & /*isTabbarLabel*/ 32) {
  				toggle_class(span, "tabbar-label", /*isTabbarLabel*/ ctx[5]);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  			if (if_block) if_block.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$1.name,
  		type: "if",
  		source: "(172:2) {#if typeof text !== 'undefined' || typeof badge !== 'undefined'}",
  		ctx
  	});

  	return block;
  }

  // (175:6) {#if typeof badge !== 'undefined'}
  function create_if_block_1$1(ctx) {
  	let badge_1;
  	let current;

  	badge_1 = new Badge({
  			props: {
  				color: /*badgeColor*/ ctx[2],
  				$$slots: { default: [create_default_slot] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(badge_1.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(badge_1, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const badge_1_changes = {};
  			if (dirty[0] & /*badgeColor*/ 4) badge_1_changes.color = /*badgeColor*/ ctx[2];

  			if (dirty[0] & /*$$scope, badge*/ 33554434) {
  				badge_1_changes.$$scope = { dirty, ctx };
  			}

  			badge_1.$set(badge_1_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(badge_1.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(badge_1.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(badge_1, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$1.name,
  		type: "if",
  		source: "(175:6) {#if typeof badge !== 'undefined'}",
  		ctx
  	});

  	return block;
  }

  // (175:40) <Badge color={badgeColor}>
  function create_default_slot(ctx) {
  	let t_value = Utils$1.text(/*badge*/ ctx[1]) + "";
  	let t;

  	const block = {
  		c: function create() {
  			t = text$1(t_value);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty[0] & /*badge*/ 2 && t_value !== (t_value = Utils$1.text(/*badge*/ ctx[1]) + "")) set_data_dev(t, t_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot.name,
  		type: "slot",
  		source: "(175:40) <Badge color={badgeColor}>",
  		ctx
  	});

  	return block;
  }

  function create_fragment$6(ctx) {
  	let a;
  	let t0;
  	let t1;
  	let current;
  	let mounted;
  	let dispose;
  	let if_block0 = /*hasIcon*/ ctx[8] && create_if_block_2$1(ctx);
  	const default_slot_template = /*$$slots*/ ctx[23].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[25], null);
  	let if_block1 = (typeof /*text*/ ctx[0] !== "undefined" || typeof /*badge*/ ctx[1] !== "undefined") && create_if_block$1(ctx);
  	let a_levels = [{ class: /*classes*/ ctx[7] }, /*attrs*/ ctx[6]];
  	let a_data = {};

  	for (let i = 0; i < a_levels.length; i += 1) {
  		a_data = assign(a_data, a_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			a = element("a");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			if (default_slot) default_slot.c();
  			t1 = space();
  			if (if_block1) if_block1.c();
  			set_attributes(a, a_data);
  			add_location(a, file$6, 152, 0, 3971);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, a, anchor);
  			if (if_block0) if_block0.m(a, null);
  			append_dev(a, t0);

  			if (default_slot) {
  				default_slot.m(a, null);
  			}

  			append_dev(a, t1);
  			if (if_block1) if_block1.m(a, null);
  			/*a_binding*/ ctx[24](a);
  			current = true;

  			if (!mounted) {
  				dispose = listen_dev(a, "click", /*onClick*/ ctx[9], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (/*hasIcon*/ ctx[8]) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);

  					if (dirty[0] & /*hasIcon*/ 256) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_2$1(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(a, t0);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[0] & /*$$scope*/ 33554432) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[25], dirty, null, null);
  				}
  			}

  			if (typeof /*text*/ ctx[0] !== "undefined" || typeof /*badge*/ ctx[1] !== "undefined") {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);

  					if (dirty[0] & /*text, badge*/ 3) {
  						transition_in(if_block1, 1);
  					}
  				} else {
  					if_block1 = create_if_block$1(ctx);
  					if_block1.c();
  					transition_in(if_block1, 1);
  					if_block1.m(a, null);
  				}
  			} else if (if_block1) {
  				group_outros();

  				transition_out(if_block1, 1, 1, () => {
  					if_block1 = null;
  				});

  				check_outros();
  			}

  			set_attributes(a, a_data = get_spread_update(a_levels, [
  				(!current || dirty[0] & /*classes*/ 128) && { class: /*classes*/ ctx[7] },
  				dirty[0] & /*attrs*/ 64 && /*attrs*/ ctx[6]
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block0);
  			transition_in(default_slot, local);
  			transition_in(if_block1);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block0);
  			transition_out(default_slot, local);
  			transition_out(if_block1);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(a);
  			if (if_block0) if_block0.d();
  			if (default_slot) default_slot.d(detaching);
  			if (if_block1) if_block1.d();
  			/*a_binding*/ ctx[24](null);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$6.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$6($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"class","noLinkClass","text","tabLink","tabLinkActive","tabbarLabel","iconOnly","badge","badgeColor","iconBadge","href","target","tooltip","tooltipTrigger","smartSelect","smartSelectParams"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { class: className = undefined } = $$props;
  	let { noLinkClass = false } = $$props;
  	let { text = undefined } = $$props;
  	let { tabLink = undefined } = $$props;
  	let { tabLinkActive = false } = $$props;
  	let { tabbarLabel = false } = $$props;
  	let { iconOnly = false } = $$props;
  	let { badge = undefined } = $$props;
  	let { badgeColor = undefined } = $$props;
  	let { iconBadge = undefined } = $$props;
  	let { href = "#" } = $$props;
  	let { target = undefined } = $$props;
  	let { tooltip = undefined } = $$props;
  	let { tooltipTrigger = undefined } = $$props;
  	let { smartSelect = false } = $$props;
  	let { smartSelectParams = undefined } = $$props;
  	let el;
  	let f7Tooltip;
  	let f7SmartSelect;
  	let isTabbarLabel = tabbarLabel;
  	let tooltipText = tooltip;

  	function watchTooltip(newText) {
  		const oldText = tooltipText;
  		if (oldText === newText) return;
  		tooltipText = newText;

  		if (!newText && f7Tooltip) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  			return;
  		}

  		if (newText && !f7Tooltip && f7.instance) {
  			f7Tooltip = f7.instance.tooltip.create({
  				targetEl: el,
  				text: newText,
  				trigger: tooltipTrigger
  			});

  			return;
  		}

  		if (!newText || !f7Tooltip) return;
  		f7Tooltip.setText(newText);
  	}

  	function onClick() {
  		dispatch("click");
  		if (typeof $$props.onClick === "function") $$props.onClick();
  	}

  	onMount(() => {
  		if ($$props.routeProps) {
  			$$invalidate(4, el.f7RouteProps = $$props.routeProps, el);
  		}

  		f7.ready(() => {
  			if (tabbarLabel || (tabLink || tabLink === "") && f7.instance.$(el).parents(".tabbar-labels").length) {
  				$$invalidate(5, isTabbarLabel = true);
  			}

  			if (smartSelect) {
  				const ssParams = Utils$1.extend({ el }, smartSelectParams || {});
  				f7SmartSelect = f7.instance.smartSelect.create(ssParams);
  			}

  			if (tooltip) {
  				f7Tooltip = f7.instance.tooltip.create({
  					targetEl: el,
  					text: tooltip,
  					trigger: tooltipTrigger
  				});
  			}
  		});
  	});

  	afterUpdate(() => {
  		if ($$props.routeProps) {
  			$$invalidate(4, el.f7RouteProps = $$props.routeProps, el);
  		}
  	});

  	onDestroy(() => {
  		if (el) delete el.f7RouteProps;

  		if (f7SmartSelect && f7SmartSelect.destroy) {
  			f7SmartSelect.destroy();
  			f7SmartSelect = null;
  		}

  		if (f7Tooltip && f7Tooltip.destroy) {
  			f7Tooltip.destroy();
  			f7Tooltip = null;
  		}
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Link", $$slots, ['default']);

  	function a_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(4, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(10, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(35, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(11, className = $$new_props.class);
  		if ("noLinkClass" in $$new_props) $$invalidate(12, noLinkClass = $$new_props.noLinkClass);
  		if ("text" in $$new_props) $$invalidate(0, text = $$new_props.text);
  		if ("tabLink" in $$new_props) $$invalidate(13, tabLink = $$new_props.tabLink);
  		if ("tabLinkActive" in $$new_props) $$invalidate(14, tabLinkActive = $$new_props.tabLinkActive);
  		if ("tabbarLabel" in $$new_props) $$invalidate(15, tabbarLabel = $$new_props.tabbarLabel);
  		if ("iconOnly" in $$new_props) $$invalidate(16, iconOnly = $$new_props.iconOnly);
  		if ("badge" in $$new_props) $$invalidate(1, badge = $$new_props.badge);
  		if ("badgeColor" in $$new_props) $$invalidate(2, badgeColor = $$new_props.badgeColor);
  		if ("iconBadge" in $$new_props) $$invalidate(3, iconBadge = $$new_props.iconBadge);
  		if ("href" in $$new_props) $$invalidate(17, href = $$new_props.href);
  		if ("target" in $$new_props) $$invalidate(18, target = $$new_props.target);
  		if ("tooltip" in $$new_props) $$invalidate(19, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$new_props) $$invalidate(20, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("smartSelect" in $$new_props) $$invalidate(21, smartSelect = $$new_props.smartSelect);
  		if ("smartSelectParams" in $$new_props) $$invalidate(22, smartSelectParams = $$new_props.smartSelectParams);
  		if ("$$scope" in $$new_props) $$invalidate(25, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		createEventDispatcher,
  		onMount,
  		afterUpdate,
  		onDestroy,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		f7,
  		hasSlots,
  		Badge,
  		Icon,
  		dispatch,
  		className,
  		noLinkClass,
  		text,
  		tabLink,
  		tabLinkActive,
  		tabbarLabel,
  		iconOnly,
  		badge,
  		badgeColor,
  		iconBadge,
  		href,
  		target,
  		tooltip,
  		tooltipTrigger,
  		smartSelect,
  		smartSelectParams,
  		el,
  		f7Tooltip,
  		f7SmartSelect,
  		isTabbarLabel,
  		tooltipText,
  		watchTooltip,
  		onClick,
  		hrefComputed,
  		attrs,
  		hasDefaultSlots,
  		iconOnlyComputed,
  		classes,
  		hasIcon,
  		hasIconBadge
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(10, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(11, className = $$new_props.className);
  		if ("noLinkClass" in $$props) $$invalidate(12, noLinkClass = $$new_props.noLinkClass);
  		if ("text" in $$props) $$invalidate(0, text = $$new_props.text);
  		if ("tabLink" in $$props) $$invalidate(13, tabLink = $$new_props.tabLink);
  		if ("tabLinkActive" in $$props) $$invalidate(14, tabLinkActive = $$new_props.tabLinkActive);
  		if ("tabbarLabel" in $$props) $$invalidate(15, tabbarLabel = $$new_props.tabbarLabel);
  		if ("iconOnly" in $$props) $$invalidate(16, iconOnly = $$new_props.iconOnly);
  		if ("badge" in $$props) $$invalidate(1, badge = $$new_props.badge);
  		if ("badgeColor" in $$props) $$invalidate(2, badgeColor = $$new_props.badgeColor);
  		if ("iconBadge" in $$props) $$invalidate(3, iconBadge = $$new_props.iconBadge);
  		if ("href" in $$props) $$invalidate(17, href = $$new_props.href);
  		if ("target" in $$props) $$invalidate(18, target = $$new_props.target);
  		if ("tooltip" in $$props) $$invalidate(19, tooltip = $$new_props.tooltip);
  		if ("tooltipTrigger" in $$props) $$invalidate(20, tooltipTrigger = $$new_props.tooltipTrigger);
  		if ("smartSelect" in $$props) $$invalidate(21, smartSelect = $$new_props.smartSelect);
  		if ("smartSelectParams" in $$props) $$invalidate(22, smartSelectParams = $$new_props.smartSelectParams);
  		if ("el" in $$props) $$invalidate(4, el = $$new_props.el);
  		if ("f7Tooltip" in $$props) f7Tooltip = $$new_props.f7Tooltip;
  		if ("f7SmartSelect" in $$props) f7SmartSelect = $$new_props.f7SmartSelect;
  		if ("isTabbarLabel" in $$props) $$invalidate(5, isTabbarLabel = $$new_props.isTabbarLabel);
  		if ("tooltipText" in $$props) tooltipText = $$new_props.tooltipText;
  		if ("hrefComputed" in $$props) $$invalidate(29, hrefComputed = $$new_props.hrefComputed);
  		if ("attrs" in $$props) $$invalidate(6, attrs = $$new_props.attrs);
  		if ("hasDefaultSlots" in $$props) $$invalidate(30, hasDefaultSlots = $$new_props.hasDefaultSlots);
  		if ("iconOnlyComputed" in $$props) $$invalidate(31, iconOnlyComputed = $$new_props.iconOnlyComputed);
  		if ("classes" in $$props) $$invalidate(7, classes = $$new_props.classes);
  		if ("hasIcon" in $$props) $$invalidate(8, hasIcon = $$new_props.hasIcon);
  		if ("hasIconBadge" in $$props) hasIconBadge = $$new_props.hasIconBadge;
  	};

  	let hrefComputed;
  	let attrs;
  	let hasDefaultSlots;
  	let iconOnlyComputed;
  	let classes;
  	let hasIcon;
  	let hasIconBadge;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty[0] & /*href*/ 131072) {
  			 $$invalidate(29, hrefComputed = href === true ? "#" : href || undefined);
  		}

  		 $$invalidate(6, attrs = Utils$1.extend(
  			{
  				href: hrefComputed,
  				target,
  				"data-tab": Utils$1.isStringProp(tabLink) && tabLink || undefined,
  				...restProps($$restProps)
  			},
  			Mixins.linkRouterAttrs($$props),
  			Mixins.linkActionsAttrs($$props)
  		));

  		if ($$self.$$.dirty[0] & /*iconOnly, text, hasDefaultSlots*/ 1073807361) {
  			 $$invalidate(31, iconOnlyComputed = iconOnly || !text && !hasDefaultSlots);
  		}

  		 $$invalidate(7, classes = Utils$1.classNames(
  			className,
  			{
  				link: !(noLinkClass || isTabbarLabel),
  				"icon-only": iconOnlyComputed,
  				"tab-link": tabLink || tabLink === "",
  				"tab-link-active": tabLinkActive,
  				"smart-select": smartSelect
  			},
  			Mixins.colorClasses($$props),
  			Mixins.linkRouterClasses($$props),
  			Mixins.linkActionsClasses($$props)
  		));

  		 $$invalidate(8, hasIcon = $$props.icon || $$props.iconMaterial || $$props.iconF7 || $$props.iconMd || $$props.iconIos || $$props.iconAurora);
  		 hasIconBadge = $$props.hasIconBadge;

  		if ($$self.$$.dirty[0] & /*tooltip*/ 524288) {
  			 watchTooltip(tooltip);
  		}
  	};

  	 $$invalidate(30, hasDefaultSlots = hasSlots(arguments, "default"));
  	$$props = exclude_internal_props($$props);

  	return [
  		text,
  		badge,
  		badgeColor,
  		iconBadge,
  		el,
  		isTabbarLabel,
  		attrs,
  		classes,
  		hasIcon,
  		onClick,
  		$$props,
  		className,
  		noLinkClass,
  		tabLink,
  		tabLinkActive,
  		tabbarLabel,
  		iconOnly,
  		href,
  		target,
  		tooltip,
  		tooltipTrigger,
  		smartSelect,
  		smartSelectParams,
  		$$slots,
  		a_binding,
  		$$scope
  	];
  }

  class Link extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(
  			this,
  			options,
  			instance$6,
  			create_fragment$6,
  			safe_not_equal,
  			{
  				class: 11,
  				noLinkClass: 12,
  				text: 0,
  				tabLink: 13,
  				tabLinkActive: 14,
  				tabbarLabel: 15,
  				iconOnly: 16,
  				badge: 1,
  				badgeColor: 2,
  				iconBadge: 3,
  				href: 17,
  				target: 18,
  				tooltip: 19,
  				tooltipTrigger: 20,
  				smartSelect: 21,
  				smartSelectParams: 22
  			},
  			[-1, -1]
  		);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Link",
  			options,
  			id: create_fragment$6.name
  		});
  	}

  	get class() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noLinkClass() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noLinkClass(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get text() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set text(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabLink() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabLink(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabLinkActive() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabLinkActive(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabbarLabel() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabbarLabel(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get iconOnly() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set iconOnly(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get badge() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set badge(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get badgeColor() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set badgeColor(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get iconBadge() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set iconBadge(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get href() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set href(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get target() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set target(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltip() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltip(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tooltipTrigger() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tooltipTrigger(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get smartSelect() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set smartSelect(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get smartSelectParams() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set smartSelectParams(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\nav-left.svelte generated by Svelte v3.24.0 */
  const file$7 = "node_modules\\framework7-svelte\\components\\nav-left.svelte";

  // (55:2) {#if backLink}
  function create_if_block$2(ctx) {
  	let link;
  	let current;

  	link = new Link({
  			props: {
  				href: /*backLinkUrl*/ ctx[1] || "#",
  				back: true,
  				icon: "icon-back",
  				force: /*backLinkForce*/ ctx[2] || undefined,
  				class: !/*backLinkText*/ ctx[4] ? "icon-only" : undefined,
  				text: /*backLinkText*/ ctx[4],
  				onClick: /*onBackClick*/ ctx[5]
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(link.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(link, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const link_changes = {};
  			if (dirty & /*backLinkUrl*/ 2) link_changes.href = /*backLinkUrl*/ ctx[1] || "#";
  			if (dirty & /*backLinkForce*/ 4) link_changes.force = /*backLinkForce*/ ctx[2] || undefined;
  			if (dirty & /*backLinkText*/ 16) link_changes.class = !/*backLinkText*/ ctx[4] ? "icon-only" : undefined;
  			if (dirty & /*backLinkText*/ 16) link_changes.text = /*backLinkText*/ ctx[4];
  			link.$set(link_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(link.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(link.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(link, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$2.name,
  		type: "if",
  		source: "(55:2) {#if backLink}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$7(ctx) {
  	let div;
  	let t;
  	let current;
  	let if_block = /*backLink*/ ctx[0] && create_if_block$2(ctx);
  	const default_slot_template = /*$$slots*/ ctx[11].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
  	let div_levels = [{ class: /*classes*/ ctx[3] }, restProps(/*$$restProps*/ ctx[6])];
  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (if_block) if_block.c();
  			t = space();
  			if (default_slot) default_slot.c();
  			set_attributes(div, div_data);
  			add_location(div, file$7, 50, 0, 1335);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			if (if_block) if_block.m(div, null);
  			append_dev(div, t);

  			if (default_slot) {
  				default_slot.m(div, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (/*backLink*/ ctx[0]) {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty & /*backLink*/ 1) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block$2(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(div, t);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 1024) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
  				}
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty & /*classes*/ 8) && { class: /*classes*/ ctx[3] },
  				dirty & /*$$restProps*/ 64 && restProps(/*$$restProps*/ ctx[6])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (if_block) if_block.d();
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$7.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$7($$self, $$props, $$invalidate) {
  	const omit_props_names = ["class","backLink","backLinkUrl","backLinkForce","backLinkShowText","sliding"];
  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { class: className = undefined } = $$props;
  	let { backLink = undefined } = $$props;
  	let { backLinkUrl = undefined } = $$props;
  	let { backLinkForce = undefined } = $$props;
  	let { backLinkShowText = undefined } = $$props;
  	let { sliding = undefined } = $$props;

  	// eslint-disable-next-line
  	let _theme = f7.instance ? f7Theme : null;

  	if (!f7.instance) {
  		f7.ready(() => {
  			$$invalidate(12, _theme = f7Theme);
  		});
  	}

  	function onBackClick() {
  		dispatch("clickBack");
  		if (typeof $$props.onClickBack === "function") $$props.onClickBack();
  		dispatch("backClick");
  		if (typeof $$props.onBackClick === "function") $$props.onBackClick();
  	}

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Nav_left", $$slots, ['default']);

  	$$self.$set = $$new_props => {
  		$$invalidate(15, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(7, className = $$new_props.class);
  		if ("backLink" in $$new_props) $$invalidate(0, backLink = $$new_props.backLink);
  		if ("backLinkUrl" in $$new_props) $$invalidate(1, backLinkUrl = $$new_props.backLinkUrl);
  		if ("backLinkForce" in $$new_props) $$invalidate(2, backLinkForce = $$new_props.backLinkForce);
  		if ("backLinkShowText" in $$new_props) $$invalidate(8, backLinkShowText = $$new_props.backLinkShowText);
  		if ("sliding" in $$new_props) $$invalidate(9, sliding = $$new_props.sliding);
  		if ("$$scope" in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		createEventDispatcher,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		f7,
  		theme: f7Theme,
  		Link,
  		dispatch,
  		className,
  		backLink,
  		backLinkUrl,
  		backLinkForce,
  		backLinkShowText,
  		sliding,
  		_theme,
  		onBackClick,
  		classes,
  		needBackLinkText,
  		backLinkText
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(15, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(7, className = $$new_props.className);
  		if ("backLink" in $$props) $$invalidate(0, backLink = $$new_props.backLink);
  		if ("backLinkUrl" in $$props) $$invalidate(1, backLinkUrl = $$new_props.backLinkUrl);
  		if ("backLinkForce" in $$props) $$invalidate(2, backLinkForce = $$new_props.backLinkForce);
  		if ("backLinkShowText" in $$props) $$invalidate(8, backLinkShowText = $$new_props.backLinkShowText);
  		if ("sliding" in $$props) $$invalidate(9, sliding = $$new_props.sliding);
  		if ("_theme" in $$props) $$invalidate(12, _theme = $$new_props._theme);
  		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
  		if ("needBackLinkText" in $$props) $$invalidate(13, needBackLinkText = $$new_props.needBackLinkText);
  		if ("backLinkText" in $$props) $$invalidate(4, backLinkText = $$new_props.backLinkText);
  	};

  	let classes;
  	let needBackLinkText;
  	let backLinkText;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(3, classes = Utils$1.classNames(className, "left", { sliding }, Mixins.colorClasses($$props)));

  		if ($$self.$$.dirty & /*backLinkShowText*/ 256) {
  			 $$invalidate(13, needBackLinkText = backLinkShowText);
  		}

  		if ($$self.$$.dirty & /*needBackLinkText, _theme*/ 12288) {
  			 if (typeof needBackLinkText === "undefined") $$invalidate(13, needBackLinkText = _theme && !_theme.md);
  		}

  		if ($$self.$$.dirty & /*backLink, needBackLinkText*/ 8193) {
  			 $$invalidate(4, backLinkText = backLink !== true && needBackLinkText
  			? backLink
  			: undefined);
  		}
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		backLink,
  		backLinkUrl,
  		backLinkForce,
  		classes,
  		backLinkText,
  		onBackClick,
  		$$restProps,
  		className,
  		backLinkShowText,
  		sliding,
  		$$scope,
  		$$slots
  	];
  }

  class Nav_left extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
  			class: 7,
  			backLink: 0,
  			backLinkUrl: 1,
  			backLinkForce: 2,
  			backLinkShowText: 8,
  			sliding: 9
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Nav_left",
  			options,
  			id: create_fragment$7.name
  		});
  	}

  	get class() {
  		throw new Error("<Nav_left>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Nav_left>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLink() {
  		throw new Error("<Nav_left>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLink(value) {
  		throw new Error("<Nav_left>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLinkUrl() {
  		throw new Error("<Nav_left>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLinkUrl(value) {
  		throw new Error("<Nav_left>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLinkForce() {
  		throw new Error("<Nav_left>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLinkForce(value) {
  		throw new Error("<Nav_left>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLinkShowText() {
  		throw new Error("<Nav_left>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLinkShowText(value) {
  		throw new Error("<Nav_left>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get sliding() {
  		throw new Error("<Nav_left>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set sliding(value) {
  		throw new Error("<Nav_left>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\nav-right.svelte generated by Svelte v3.24.0 */
  const file$8 = "node_modules\\framework7-svelte\\components\\nav-right.svelte";

  function create_fragment$8(ctx) {
  	let div;
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[5].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
  	let div_levels = [{ class: /*classes*/ ctx[0] }, restProps(/*$$restProps*/ ctx[1])];
  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (default_slot) default_slot.c();
  			set_attributes(div, div_data);
  			add_location(div, file$8, 19, 0, 371);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			if (default_slot) {
  				default_slot.m(div, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 16) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
  				}
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] },
  				dirty & /*$$restProps*/ 2 && restProps(/*$$restProps*/ ctx[1])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$8.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$8($$self, $$props, $$invalidate) {
  	const omit_props_names = ["class","sliding"];
  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	let { class: className = undefined } = $$props;
  	let { sliding = undefined } = $$props;
  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Nav_right", $$slots, ['default']);

  	$$self.$set = $$new_props => {
  		$$invalidate(6, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
  		if ("sliding" in $$new_props) $$invalidate(3, sliding = $$new_props.sliding);
  		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		className,
  		sliding,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(6, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
  		if ("sliding" in $$props) $$invalidate(3, sliding = $$new_props.sliding);
  		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
  	};

  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(0, classes = Utils$1.classNames(className, "right", { sliding }, Mixins.colorClasses($$props)));
  	};

  	$$props = exclude_internal_props($$props);
  	return [classes, $$restProps, className, sliding, $$scope, $$slots];
  }

  class Nav_right extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$8, create_fragment$8, safe_not_equal, { class: 2, sliding: 3 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Nav_right",
  			options,
  			id: create_fragment$8.name
  		});
  	}

  	get class() {
  		throw new Error("<Nav_right>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Nav_right>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get sliding() {
  		throw new Error("<Nav_right>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set sliding(value) {
  		throw new Error("<Nav_right>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\nav-title.svelte generated by Svelte v3.24.0 */
  const file$9 = "node_modules\\framework7-svelte\\components\\nav-title.svelte";

  // (26:2) {#if typeof title !== 'undefined'}
  function create_if_block_1$2(ctx) {
  	let t_value = Utils$1.text(/*title*/ ctx[0]) + "";
  	let t;

  	const block = {
  		c: function create() {
  			t = text$1(t_value);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*title*/ 1 && t_value !== (t_value = Utils$1.text(/*title*/ ctx[0]) + "")) set_data_dev(t, t_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$2.name,
  		type: "if",
  		source: "(26:2) {#if typeof title !== 'undefined'}",
  		ctx
  	});

  	return block;
  }

  // (27:2) {#if typeof subtitle !== 'undefined'}
  function create_if_block$3(ctx) {
  	let span;
  	let t_value = Utils$1.text(/*subtitle*/ ctx[1]) + "";
  	let t;

  	const block = {
  		c: function create() {
  			span = element("span");
  			t = text$1(t_value);
  			attr_dev(span, "class", "subtitle");
  			add_location(span, file$9, 27, 4, 598);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  			append_dev(span, t);
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*subtitle*/ 2 && t_value !== (t_value = Utils$1.text(/*subtitle*/ ctx[1]) + "")) set_data_dev(t, t_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$3.name,
  		type: "if",
  		source: "(27:2) {#if typeof subtitle !== 'undefined'}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$9(ctx) {
  	let div;
  	let t0;
  	let t1;
  	let current;
  	let if_block0 = typeof /*title*/ ctx[0] !== "undefined" && create_if_block_1$2(ctx);
  	let if_block1 = typeof /*subtitle*/ ctx[1] !== "undefined" && create_if_block$3(ctx);
  	const default_slot_template = /*$$slots*/ ctx[7].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
  	let div_levels = [{ class: /*classes*/ ctx[2] }, restProps(/*$$restProps*/ ctx[3])];
  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			if (if_block1) if_block1.c();
  			t1 = space();
  			if (default_slot) default_slot.c();
  			set_attributes(div, div_data);
  			add_location(div, file$9, 21, 0, 438);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			if (if_block0) if_block0.m(div, null);
  			append_dev(div, t0);
  			if (if_block1) if_block1.m(div, null);
  			append_dev(div, t1);

  			if (default_slot) {
  				default_slot.m(div, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (typeof /*title*/ ctx[0] !== "undefined") {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);
  				} else {
  					if_block0 = create_if_block_1$2(ctx);
  					if_block0.c();
  					if_block0.m(div, t0);
  				}
  			} else if (if_block0) {
  				if_block0.d(1);
  				if_block0 = null;
  			}

  			if (typeof /*subtitle*/ ctx[1] !== "undefined") {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);
  				} else {
  					if_block1 = create_if_block$3(ctx);
  					if_block1.c();
  					if_block1.m(div, t1);
  				}
  			} else if (if_block1) {
  				if_block1.d(1);
  				if_block1 = null;
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 64) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
  				}
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty & /*classes*/ 4) && { class: /*classes*/ ctx[2] },
  				dirty & /*$$restProps*/ 8 && restProps(/*$$restProps*/ ctx[3])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$9.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$9($$self, $$props, $$invalidate) {
  	const omit_props_names = ["class","title","subtitle","sliding"];
  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	let { class: className = undefined } = $$props;
  	let { title = undefined } = $$props;
  	let { subtitle = undefined } = $$props;
  	let { sliding = undefined } = $$props;
  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Nav_title", $$slots, ['default']);

  	$$self.$set = $$new_props => {
  		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
  		if ("title" in $$new_props) $$invalidate(0, title = $$new_props.title);
  		if ("subtitle" in $$new_props) $$invalidate(1, subtitle = $$new_props.subtitle);
  		if ("sliding" in $$new_props) $$invalidate(5, sliding = $$new_props.sliding);
  		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		className,
  		title,
  		subtitle,
  		sliding,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
  		if ("title" in $$props) $$invalidate(0, title = $$new_props.title);
  		if ("subtitle" in $$props) $$invalidate(1, subtitle = $$new_props.subtitle);
  		if ("sliding" in $$props) $$invalidate(5, sliding = $$new_props.sliding);
  		if ("classes" in $$props) $$invalidate(2, classes = $$new_props.classes);
  	};

  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(2, classes = Utils$1.classNames(className, "title", { sliding }, Mixins.colorClasses($$props)));
  	};

  	$$props = exclude_internal_props($$props);
  	return [title, subtitle, classes, $$restProps, className, sliding, $$scope, $$slots];
  }

  class Nav_title extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
  			class: 4,
  			title: 0,
  			subtitle: 1,
  			sliding: 5
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Nav_title",
  			options,
  			id: create_fragment$9.name
  		});
  	}

  	get class() {
  		throw new Error("<Nav_title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Nav_title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get title() {
  		throw new Error("<Nav_title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set title(value) {
  		throw new Error("<Nav_title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get subtitle() {
  		throw new Error("<Nav_title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set subtitle(value) {
  		throw new Error("<Nav_title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get sliding() {
  		throw new Error("<Nav_title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set sliding(value) {
  		throw new Error("<Nav_title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\navbar.svelte generated by Svelte v3.24.0 */
  const file$a = "node_modules\\framework7-svelte\\components\\navbar.svelte";
  const get_after_inner_slot_changes = dirty => ({});
  const get_after_inner_slot_context = ctx => ({});
  const get_title_large_slot_changes = dirty => ({});
  const get_title_large_slot_context = ctx => ({});
  const get_right_slot_changes = dirty => ({});
  const get_right_slot_context = ctx => ({});
  const get_nav_right_slot_changes = dirty => ({});
  const get_nav_right_slot_context = ctx => ({});
  const get_title_slot_changes = dirty => ({});
  const get_title_slot_context = ctx => ({});
  const get_left_slot_changes = dirty => ({});
  const get_left_slot_context = ctx => ({});
  const get_nav_left_slot_changes = dirty => ({});
  const get_nav_left_slot_context = ctx => ({});
  const get_before_inner_slot_changes = dirty => ({});
  const get_before_inner_slot_context = ctx => ({});

  // (218:4) {#if backLink || hasLeftSlots}
  function create_if_block_3$2(ctx) {
  	let navleft;
  	let current;

  	navleft = new Nav_left({
  			props: {
  				backLink: /*backLink*/ ctx[0],
  				backLinkUrl: /*backLinkUrl*/ ctx[1],
  				backLinkForce: /*backLinkForce*/ ctx[2],
  				backLinkShowText: /*backLinkShowText*/ ctx[3],
  				onBackClick: /*onBackClick*/ ctx[15],
  				$$slots: { default: [create_default_slot_2$1] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(navleft.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(navleft, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const navleft_changes = {};
  			if (dirty[0] & /*backLink*/ 1) navleft_changes.backLink = /*backLink*/ ctx[0];
  			if (dirty[0] & /*backLinkUrl*/ 2) navleft_changes.backLinkUrl = /*backLinkUrl*/ ctx[1];
  			if (dirty[0] & /*backLinkForce*/ 4) navleft_changes.backLinkForce = /*backLinkForce*/ ctx[2];
  			if (dirty[0] & /*backLinkShowText*/ 8) navleft_changes.backLinkShowText = /*backLinkShowText*/ ctx[3];

  			if (dirty[1] & /*$$scope*/ 4) {
  				navleft_changes.$$scope = { dirty, ctx };
  			}

  			navleft.$set(navleft_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(navleft.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(navleft.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(navleft, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_3$2.name,
  		type: "if",
  		source: "(218:4) {#if backLink || hasLeftSlots}",
  		ctx
  	});

  	return block;
  }

  // (219:6) <NavLeft         backLink={backLink}         backLinkUrl={backLinkUrl}         backLinkForce={backLinkForce}         backLinkShowText={backLinkShowText}         onBackClick={onBackClick}       >
  function create_default_slot_2$1(ctx) {
  	let t;
  	let current;
  	const nav_left_slot_template = /*$$slots*/ ctx[31]["nav-left"];
  	const nav_left_slot = create_slot(nav_left_slot_template, ctx, /*$$scope*/ ctx[33], get_nav_left_slot_context);
  	const left_slot_template = /*$$slots*/ ctx[31].left;
  	const left_slot = create_slot(left_slot_template, ctx, /*$$scope*/ ctx[33], get_left_slot_context);

  	const block = {
  		c: function create() {
  			if (nav_left_slot) nav_left_slot.c();
  			t = space();
  			if (left_slot) left_slot.c();
  		},
  		m: function mount(target, anchor) {
  			if (nav_left_slot) {
  				nav_left_slot.m(target, anchor);
  			}

  			insert_dev(target, t, anchor);

  			if (left_slot) {
  				left_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (nav_left_slot) {
  				if (nav_left_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(nav_left_slot, nav_left_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_nav_left_slot_changes, get_nav_left_slot_context);
  				}
  			}

  			if (left_slot) {
  				if (left_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(left_slot, left_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_left_slot_changes, get_left_slot_context);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(nav_left_slot, local);
  			transition_in(left_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(nav_left_slot, local);
  			transition_out(left_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (nav_left_slot) nav_left_slot.d(detaching);
  			if (detaching) detach_dev(t);
  			if (left_slot) left_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_2$1.name,
  		type: "slot",
  		source: "(219:6) <NavLeft         backLink={backLink}         backLinkUrl={backLinkUrl}         backLinkForce={backLinkForce}         backLinkShowText={backLinkShowText}         onBackClick={onBackClick}       >",
  		ctx
  	});

  	return block;
  }

  // (230:4) {#if title || subtitle || hasTitleSlots}
  function create_if_block_2$2(ctx) {
  	let navtitle;
  	let current;

  	navtitle = new Nav_title({
  			props: {
  				title: /*title*/ ctx[4],
  				subtitle: /*subtitle*/ ctx[5],
  				$$slots: { default: [create_default_slot_1$1] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(navtitle.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(navtitle, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const navtitle_changes = {};
  			if (dirty[0] & /*title*/ 16) navtitle_changes.title = /*title*/ ctx[4];
  			if (dirty[0] & /*subtitle*/ 32) navtitle_changes.subtitle = /*subtitle*/ ctx[5];

  			if (dirty[1] & /*$$scope*/ 4) {
  				navtitle_changes.$$scope = { dirty, ctx };
  			}

  			navtitle.$set(navtitle_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(navtitle.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(navtitle.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(navtitle, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2$2.name,
  		type: "if",
  		source: "(230:4) {#if title || subtitle || hasTitleSlots}",
  		ctx
  	});

  	return block;
  }

  // (231:6) <NavTitle         title={title}         subtitle={subtitle}       >
  function create_default_slot_1$1(ctx) {
  	let current;
  	const title_slot_template = /*$$slots*/ ctx[31].title;
  	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[33], get_title_slot_context);

  	const block = {
  		c: function create() {
  			if (title_slot) title_slot.c();
  		},
  		m: function mount(target, anchor) {
  			if (title_slot) {
  				title_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (title_slot) {
  				if (title_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(title_slot, title_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_title_slot_changes, get_title_slot_context);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(title_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(title_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (title_slot) title_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_1$1.name,
  		type: "slot",
  		source: "(231:6) <NavTitle         title={title}         subtitle={subtitle}       >",
  		ctx
  	});

  	return block;
  }

  // (238:4) {#if hasRightSlots}
  function create_if_block_1$3(ctx) {
  	let navright;
  	let current;

  	navright = new Nav_right({
  			props: {
  				$$slots: { default: [create_default_slot$1] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(navright.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(navright, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const navright_changes = {};

  			if (dirty[1] & /*$$scope*/ 4) {
  				navright_changes.$$scope = { dirty, ctx };
  			}

  			navright.$set(navright_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(navright.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(navright.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(navright, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$3.name,
  		type: "if",
  		source: "(238:4) {#if hasRightSlots}",
  		ctx
  	});

  	return block;
  }

  // (239:6) <NavRight>
  function create_default_slot$1(ctx) {
  	let t;
  	let current;
  	const nav_right_slot_template = /*$$slots*/ ctx[31]["nav-right"];
  	const nav_right_slot = create_slot(nav_right_slot_template, ctx, /*$$scope*/ ctx[33], get_nav_right_slot_context);
  	const right_slot_template = /*$$slots*/ ctx[31].right;
  	const right_slot = create_slot(right_slot_template, ctx, /*$$scope*/ ctx[33], get_right_slot_context);

  	const block = {
  		c: function create() {
  			if (nav_right_slot) nav_right_slot.c();
  			t = space();
  			if (right_slot) right_slot.c();
  		},
  		m: function mount(target, anchor) {
  			if (nav_right_slot) {
  				nav_right_slot.m(target, anchor);
  			}

  			insert_dev(target, t, anchor);

  			if (right_slot) {
  				right_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (nav_right_slot) {
  				if (nav_right_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(nav_right_slot, nav_right_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_nav_right_slot_changes, get_nav_right_slot_context);
  				}
  			}

  			if (right_slot) {
  				if (right_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(right_slot, right_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_right_slot_changes, get_right_slot_context);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(nav_right_slot, local);
  			transition_in(right_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(nav_right_slot, local);
  			transition_out(right_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (nav_right_slot) nav_right_slot.d(detaching);
  			if (detaching) detach_dev(t);
  			if (right_slot) right_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot$1.name,
  		type: "slot",
  		source: "(239:6) <NavRight>",
  		ctx
  	});

  	return block;
  }

  // (244:4) {#if largeTitle || hasTitleLargeSlots}
  function create_if_block$4(ctx) {
  	let div1;
  	let div0;
  	let t0_value = Utils$1.text(/*largeTitle*/ ctx[11]) + "";
  	let t0;
  	let t1;
  	let current;
  	const title_large_slot_template = /*$$slots*/ ctx[31]["title-large"];
  	const title_large_slot = create_slot(title_large_slot_template, ctx, /*$$scope*/ ctx[33], get_title_large_slot_context);

  	const block = {
  		c: function create() {
  			div1 = element("div");
  			div0 = element("div");
  			t0 = text$1(t0_value);
  			t1 = space();
  			if (title_large_slot) title_large_slot.c();
  			attr_dev(div0, "class", "title-large-text");
  			add_location(div0, file$a, 245, 8, 7906);
  			attr_dev(div1, "class", "title-large");
  			add_location(div1, file$a, 244, 6, 7872);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div1, anchor);
  			append_dev(div1, div0);
  			append_dev(div0, t0);
  			append_dev(div0, t1);

  			if (title_large_slot) {
  				title_large_slot.m(div0, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if ((!current || dirty[0] & /*largeTitle*/ 2048) && t0_value !== (t0_value = Utils$1.text(/*largeTitle*/ ctx[11]) + "")) set_data_dev(t0, t0_value);

  			if (title_large_slot) {
  				if (title_large_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(title_large_slot, title_large_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_title_large_slot_changes, get_title_large_slot_context);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(title_large_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(title_large_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div1);
  			if (title_large_slot) title_large_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$4.name,
  		type: "if",
  		source: "(244:4) {#if largeTitle || hasTitleLargeSlots}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$a(ctx) {
  	let div2;
  	let div0;
  	let t0;
  	let t1;
  	let div1;
  	let t2;
  	let t3;
  	let t4;
  	let t5;
  	let t6;
  	let current;
  	const before_inner_slot_template = /*$$slots*/ ctx[31]["before-inner"];
  	const before_inner_slot = create_slot(before_inner_slot_template, ctx, /*$$scope*/ ctx[33], get_before_inner_slot_context);
  	let if_block0 = (/*backLink*/ ctx[0] || /*hasLeftSlots*/ ctx[8]) && create_if_block_3$2(ctx);
  	let if_block1 = (/*title*/ ctx[4] || /*subtitle*/ ctx[5] || /*hasTitleSlots*/ ctx[10]) && create_if_block_2$2(ctx);
  	let if_block2 = /*hasRightSlots*/ ctx[9] && create_if_block_1$3(ctx);
  	let if_block3 = (/*largeTitle*/ ctx[11] || /*hasTitleLargeSlots*/ ctx[12]) && create_if_block$4(ctx);
  	const default_slot_template = /*$$slots*/ ctx[31].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[33], null);
  	const after_inner_slot_template = /*$$slots*/ ctx[31]["after-inner"];
  	const after_inner_slot = create_slot(after_inner_slot_template, ctx, /*$$scope*/ ctx[33], get_after_inner_slot_context);

  	let div2_levels = [
  		{ class: /*classes*/ ctx[13] },
  		{ "data-f7-slot": /*f7Slot*/ ctx[6] },
  		restProps(/*$$restProps*/ ctx[16])
  	];

  	let div2_data = {};

  	for (let i = 0; i < div2_levels.length; i += 1) {
  		div2_data = assign(div2_data, div2_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div2 = element("div");
  			div0 = element("div");
  			t0 = space();
  			if (before_inner_slot) before_inner_slot.c();
  			t1 = space();
  			div1 = element("div");
  			if (if_block0) if_block0.c();
  			t2 = space();
  			if (if_block1) if_block1.c();
  			t3 = space();
  			if (if_block2) if_block2.c();
  			t4 = space();
  			if (if_block3) if_block3.c();
  			t5 = space();
  			if (default_slot) default_slot.c();
  			t6 = space();
  			if (after_inner_slot) after_inner_slot.c();
  			attr_dev(div0, "class", "navbar-bg");
  			add_location(div0, file$a, 214, 2, 7093);
  			attr_dev(div1, "class", /*innerClasses*/ ctx[14]);
  			add_location(div1, file$a, 216, 2, 7161);
  			set_attributes(div2, div2_data);
  			add_location(div2, file$a, 208, 0, 6995);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div2, anchor);
  			append_dev(div2, div0);
  			append_dev(div2, t0);

  			if (before_inner_slot) {
  				before_inner_slot.m(div2, null);
  			}

  			append_dev(div2, t1);
  			append_dev(div2, div1);
  			if (if_block0) if_block0.m(div1, null);
  			append_dev(div1, t2);
  			if (if_block1) if_block1.m(div1, null);
  			append_dev(div1, t3);
  			if (if_block2) if_block2.m(div1, null);
  			append_dev(div1, t4);
  			if (if_block3) if_block3.m(div1, null);
  			append_dev(div1, t5);

  			if (default_slot) {
  				default_slot.m(div1, null);
  			}

  			append_dev(div2, t6);

  			if (after_inner_slot) {
  				after_inner_slot.m(div2, null);
  			}

  			/*div2_binding*/ ctx[32](div2);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (before_inner_slot) {
  				if (before_inner_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(before_inner_slot, before_inner_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_before_inner_slot_changes, get_before_inner_slot_context);
  				}
  			}

  			if (/*backLink*/ ctx[0] || /*hasLeftSlots*/ ctx[8]) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);

  					if (dirty[0] & /*backLink, hasLeftSlots*/ 257) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_3$2(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(div1, t2);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (/*title*/ ctx[4] || /*subtitle*/ ctx[5] || /*hasTitleSlots*/ ctx[10]) {
  				if (if_block1) {
  					if_block1.p(ctx, dirty);

  					if (dirty[0] & /*title, subtitle, hasTitleSlots*/ 1072) {
  						transition_in(if_block1, 1);
  					}
  				} else {
  					if_block1 = create_if_block_2$2(ctx);
  					if_block1.c();
  					transition_in(if_block1, 1);
  					if_block1.m(div1, t3);
  				}
  			} else if (if_block1) {
  				group_outros();

  				transition_out(if_block1, 1, 1, () => {
  					if_block1 = null;
  				});

  				check_outros();
  			}

  			if (/*hasRightSlots*/ ctx[9]) {
  				if (if_block2) {
  					if_block2.p(ctx, dirty);

  					if (dirty[0] & /*hasRightSlots*/ 512) {
  						transition_in(if_block2, 1);
  					}
  				} else {
  					if_block2 = create_if_block_1$3(ctx);
  					if_block2.c();
  					transition_in(if_block2, 1);
  					if_block2.m(div1, t4);
  				}
  			} else if (if_block2) {
  				group_outros();

  				transition_out(if_block2, 1, 1, () => {
  					if_block2 = null;
  				});

  				check_outros();
  			}

  			if (/*largeTitle*/ ctx[11] || /*hasTitleLargeSlots*/ ctx[12]) {
  				if (if_block3) {
  					if_block3.p(ctx, dirty);

  					if (dirty[0] & /*largeTitle, hasTitleLargeSlots*/ 6144) {
  						transition_in(if_block3, 1);
  					}
  				} else {
  					if_block3 = create_if_block$4(ctx);
  					if_block3.c();
  					transition_in(if_block3, 1);
  					if_block3.m(div1, t5);
  				}
  			} else if (if_block3) {
  				group_outros();

  				transition_out(if_block3, 1, 1, () => {
  					if_block3 = null;
  				});

  				check_outros();
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[33], dirty, null, null);
  				}
  			}

  			if (!current || dirty[0] & /*innerClasses*/ 16384) {
  				attr_dev(div1, "class", /*innerClasses*/ ctx[14]);
  			}

  			if (after_inner_slot) {
  				if (after_inner_slot.p && dirty[1] & /*$$scope*/ 4) {
  					update_slot(after_inner_slot, after_inner_slot_template, ctx, /*$$scope*/ ctx[33], dirty, get_after_inner_slot_changes, get_after_inner_slot_context);
  				}
  			}

  			set_attributes(div2, div2_data = get_spread_update(div2_levels, [
  				(!current || dirty[0] & /*classes*/ 8192) && { class: /*classes*/ ctx[13] },
  				(!current || dirty[0] & /*f7Slot*/ 64) && { "data-f7-slot": /*f7Slot*/ ctx[6] },
  				dirty[0] & /*$$restProps*/ 65536 && restProps(/*$$restProps*/ ctx[16])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(before_inner_slot, local);
  			transition_in(if_block0);
  			transition_in(if_block1);
  			transition_in(if_block2);
  			transition_in(if_block3);
  			transition_in(default_slot, local);
  			transition_in(after_inner_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(before_inner_slot, local);
  			transition_out(if_block0);
  			transition_out(if_block1);
  			transition_out(if_block2);
  			transition_out(if_block3);
  			transition_out(default_slot, local);
  			transition_out(after_inner_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div2);
  			if (before_inner_slot) before_inner_slot.d(detaching);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			if (if_block2) if_block2.d();
  			if (if_block3) if_block3.d();
  			if (default_slot) default_slot.d(detaching);
  			if (after_inner_slot) after_inner_slot.d(detaching);
  			/*div2_binding*/ ctx[32](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$a.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$a($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"class","backLink","backLinkUrl","backLinkForce","backLinkShowText","sliding","title","subtitle","hidden","noShadow","noHairline","innerClass","innerClassName","large","largeTransparent","transparent","titleLarge","f7Slot","hide","show","size"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { class: className = undefined } = $$props;
  	let { backLink = undefined } = $$props;
  	let { backLinkUrl = undefined } = $$props;
  	let { backLinkForce = false } = $$props;
  	let { backLinkShowText = undefined } = $$props;
  	let { sliding = true } = $$props;
  	let { title = undefined } = $$props;
  	let { subtitle = undefined } = $$props;
  	let { hidden = false } = $$props;
  	let { noShadow = false } = $$props;
  	let { noHairline = false } = $$props;
  	let { innerClass = undefined } = $$props;
  	let { innerClassName = undefined } = $$props;
  	let { large = false } = $$props;
  	let { largeTransparent = false } = $$props;
  	let { transparent = false } = $$props;
  	let { titleLarge = undefined } = $$props;
  	let { f7Slot = "fixed" } = $$props;
  	let el;

  	// eslint-disable-next-line
  	let _theme = f7.instance ? f7Theme : null;

  	let routerPositionClass = "";
  	let largeCollapsed = false;
  	let routerNavbarRole = null;
  	let routerNavbarRoleDetailRoot = false;
  	let routerNavbarMasterStack = false;
  	let transparentVisible = false;

  	function hide(animate) {
  		f7.navbar.hide(el, animate);
  	}

  	function show(animate) {
  		f7.navbar.show(el, animate);
  	}

  	function size() {
  		f7.navbar.size(el);
  	}

  	if (!f7.instance) {
  		f7.ready(() => {
  			$$invalidate(34, _theme = f7Theme);
  		});
  	}

  	function onHide(navbarEl) {
  		if (el !== navbarEl) return;
  		dispatch("navbarHide");
  		if (typeof $$props.onNavbarHide === "function") $$props.onNavbarHide();
  	}

  	function onShow(navbarEl) {
  		if (el !== navbarEl) return;
  		dispatch("navbarShow");
  		if (typeof $$props.onNavbarShow === "function") $$props.onNavbarShow();
  	}

  	function onNavbarTransparentShow(navbarEl) {
  		if (el !== navbarEl) return;
  		$$invalidate(40, transparentVisible = true);
  		dispatch("navbarTransparentShow");
  		if (typeof $$props.onNavbarTransparentShow === "function") $$props.onNavbarTransparentShow();
  	}

  	function onNavbarTransparentHide(navbarEl) {
  		if (el !== navbarEl) return;
  		$$invalidate(40, transparentVisible = false);
  		dispatch("navbarTransparentHide");
  		if (typeof $$props.onNavbarTransparentHide === "function") $$props.onNavbarTransparentHide();
  	}

  	function onExpand(navbarEl) {
  		if (el !== navbarEl) return;
  		$$invalidate(36, largeCollapsed = false);
  		dispatch("navbarExpand");
  		if (typeof $$props.onNavbarExpand === "function") $$props.onNavbarExpand();
  	}

  	function onCollapse(navbarEl) {
  		if (el !== navbarEl) return;
  		$$invalidate(36, largeCollapsed = true);
  		dispatch("navbarCollapse");
  		if (typeof $$props.onNavbarCollapse === "function") $$props.onNavbarCollapse();
  	}

  	function onNavbarPosition(navbarEl, position) {
  		if (el !== navbarEl) return;
  		$$invalidate(35, routerPositionClass = position ? `navbar-${position}` : position);
  	}

  	function onNavbarRole(navbarEl, rolesData) {
  		if (el !== navbarEl) return;
  		$$invalidate(37, routerNavbarRole = rolesData.role);
  		$$invalidate(38, routerNavbarRoleDetailRoot = rolesData.detailRoot);
  	}

  	function onNavbarMasterStack(navbarEl) {
  		if (el !== navbarEl) return;
  		$$invalidate(39, routerNavbarMasterStack = true);
  	}

  	function onNavbarMasterUnstack(navbarEl) {
  		if (el !== navbarEl) return;
  		$$invalidate(39, routerNavbarMasterStack = false);
  	}

  	function onBackClick() {
  		dispatch("clickBack");
  		if (typeof $$props.onClickBack === "function") $$props.onClickBack();
  	}

  	function mountNavbar() {
  		f7.instance.on("navbarShow", onShow);
  		f7.instance.on("navbarHide", onHide);
  		f7.instance.on("navbarCollapse", onCollapse);
  		f7.instance.on("navbarExpand", onExpand);
  		f7.instance.on("navbarPosition", onNavbarPosition);
  		f7.instance.on("navbarRole", onNavbarRole);
  		f7.instance.on("navbarMasterStack", onNavbarMasterStack);
  		f7.instance.on("navbarMasterUnstack", onNavbarMasterUnstack);
  		f7.instance.on("navbarTransparentShow", onNavbarTransparentShow);
  		f7.instance.on("navbarTransparentHide", onNavbarTransparentHide);
  	}

  	function destroyNavbar() {
  		f7.instance.off("navbarShow", onShow);
  		f7.instance.off("navbarHide", onHide);
  		f7.instance.off("navbarCollapse", onCollapse);
  		f7.instance.off("navbarExpand", onExpand);
  		f7.instance.off("navbarPosition", onNavbarPosition);
  		f7.instance.off("navbarRole", onNavbarRole);
  		f7.instance.off("navbarMasterStack", onNavbarMasterStack);
  		f7.instance.off("navbarMasterUnstack", onNavbarMasterUnstack);
  		f7.instance.off("navbarTransparentShow", onNavbarTransparentShow);
  		f7.instance.off("navbarTransparentHide", onNavbarTransparentHide);
  	}

  	onMount(() => {
  		f7.ready(() => {
  			mountNavbar();
  		});
  	});

  	afterUpdate(() => {
  		if (!f7.instance) return;
  		f7.instance.navbar.size(el);
  	});

  	onDestroy(() => {
  		if (!f7.instance) return;
  		destroyNavbar();
  	});

  	let { $$slots = {}, $$scope } = $$props;

  	validate_slots("Navbar", $$slots, [
  		'before-inner','nav-left','left','title','nav-right','right','title-large','default','after-inner'
  	]);

  	function div2_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(7, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(59, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(16, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("class" in $$new_props) $$invalidate(17, className = $$new_props.class);
  		if ("backLink" in $$new_props) $$invalidate(0, backLink = $$new_props.backLink);
  		if ("backLinkUrl" in $$new_props) $$invalidate(1, backLinkUrl = $$new_props.backLinkUrl);
  		if ("backLinkForce" in $$new_props) $$invalidate(2, backLinkForce = $$new_props.backLinkForce);
  		if ("backLinkShowText" in $$new_props) $$invalidate(3, backLinkShowText = $$new_props.backLinkShowText);
  		if ("sliding" in $$new_props) $$invalidate(18, sliding = $$new_props.sliding);
  		if ("title" in $$new_props) $$invalidate(4, title = $$new_props.title);
  		if ("subtitle" in $$new_props) $$invalidate(5, subtitle = $$new_props.subtitle);
  		if ("hidden" in $$new_props) $$invalidate(19, hidden = $$new_props.hidden);
  		if ("noShadow" in $$new_props) $$invalidate(20, noShadow = $$new_props.noShadow);
  		if ("noHairline" in $$new_props) $$invalidate(21, noHairline = $$new_props.noHairline);
  		if ("innerClass" in $$new_props) $$invalidate(22, innerClass = $$new_props.innerClass);
  		if ("innerClassName" in $$new_props) $$invalidate(23, innerClassName = $$new_props.innerClassName);
  		if ("large" in $$new_props) $$invalidate(24, large = $$new_props.large);
  		if ("largeTransparent" in $$new_props) $$invalidate(25, largeTransparent = $$new_props.largeTransparent);
  		if ("transparent" in $$new_props) $$invalidate(26, transparent = $$new_props.transparent);
  		if ("titleLarge" in $$new_props) $$invalidate(27, titleLarge = $$new_props.titleLarge);
  		if ("f7Slot" in $$new_props) $$invalidate(6, f7Slot = $$new_props.f7Slot);
  		if ("$$scope" in $$new_props) $$invalidate(33, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		createEventDispatcher,
  		onMount,
  		onDestroy,
  		afterUpdate,
  		Mixins,
  		Utils: Utils$1,
  		restProps,
  		theme: f7Theme,
  		f7,
  		hasSlots,
  		NavLeft: Nav_left,
  		NavTitle: Nav_title,
  		NavRight: Nav_right,
  		dispatch,
  		className,
  		backLink,
  		backLinkUrl,
  		backLinkForce,
  		backLinkShowText,
  		sliding,
  		title,
  		subtitle,
  		hidden,
  		noShadow,
  		noHairline,
  		innerClass,
  		innerClassName,
  		large,
  		largeTransparent,
  		transparent,
  		titleLarge,
  		f7Slot,
  		el,
  		_theme,
  		routerPositionClass,
  		largeCollapsed,
  		routerNavbarRole,
  		routerNavbarRoleDetailRoot,
  		routerNavbarMasterStack,
  		transparentVisible,
  		hide,
  		show,
  		size,
  		onHide,
  		onShow,
  		onNavbarTransparentShow,
  		onNavbarTransparentHide,
  		onExpand,
  		onCollapse,
  		onNavbarPosition,
  		onNavbarRole,
  		onNavbarMasterStack,
  		onNavbarMasterUnstack,
  		onBackClick,
  		mountNavbar,
  		destroyNavbar,
  		hasLeftSlots,
  		hasRightSlots,
  		hasTitleSlots,
  		largeTitle,
  		hasTitleLargeSlots,
  		addLeftTitleClass,
  		addCenterTitleClass,
  		isLarge,
  		isTransparent,
  		isTransparentVisible,
  		classes,
  		innerClasses
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(59, $$props = assign(assign({}, $$props), $$new_props));
  		if ("className" in $$props) $$invalidate(17, className = $$new_props.className);
  		if ("backLink" in $$props) $$invalidate(0, backLink = $$new_props.backLink);
  		if ("backLinkUrl" in $$props) $$invalidate(1, backLinkUrl = $$new_props.backLinkUrl);
  		if ("backLinkForce" in $$props) $$invalidate(2, backLinkForce = $$new_props.backLinkForce);
  		if ("backLinkShowText" in $$props) $$invalidate(3, backLinkShowText = $$new_props.backLinkShowText);
  		if ("sliding" in $$props) $$invalidate(18, sliding = $$new_props.sliding);
  		if ("title" in $$props) $$invalidate(4, title = $$new_props.title);
  		if ("subtitle" in $$props) $$invalidate(5, subtitle = $$new_props.subtitle);
  		if ("hidden" in $$props) $$invalidate(19, hidden = $$new_props.hidden);
  		if ("noShadow" in $$props) $$invalidate(20, noShadow = $$new_props.noShadow);
  		if ("noHairline" in $$props) $$invalidate(21, noHairline = $$new_props.noHairline);
  		if ("innerClass" in $$props) $$invalidate(22, innerClass = $$new_props.innerClass);
  		if ("innerClassName" in $$props) $$invalidate(23, innerClassName = $$new_props.innerClassName);
  		if ("large" in $$props) $$invalidate(24, large = $$new_props.large);
  		if ("largeTransparent" in $$props) $$invalidate(25, largeTransparent = $$new_props.largeTransparent);
  		if ("transparent" in $$props) $$invalidate(26, transparent = $$new_props.transparent);
  		if ("titleLarge" in $$props) $$invalidate(27, titleLarge = $$new_props.titleLarge);
  		if ("f7Slot" in $$props) $$invalidate(6, f7Slot = $$new_props.f7Slot);
  		if ("el" in $$props) $$invalidate(7, el = $$new_props.el);
  		if ("_theme" in $$props) $$invalidate(34, _theme = $$new_props._theme);
  		if ("routerPositionClass" in $$props) $$invalidate(35, routerPositionClass = $$new_props.routerPositionClass);
  		if ("largeCollapsed" in $$props) $$invalidate(36, largeCollapsed = $$new_props.largeCollapsed);
  		if ("routerNavbarRole" in $$props) $$invalidate(37, routerNavbarRole = $$new_props.routerNavbarRole);
  		if ("routerNavbarRoleDetailRoot" in $$props) $$invalidate(38, routerNavbarRoleDetailRoot = $$new_props.routerNavbarRoleDetailRoot);
  		if ("routerNavbarMasterStack" in $$props) $$invalidate(39, routerNavbarMasterStack = $$new_props.routerNavbarMasterStack);
  		if ("transparentVisible" in $$props) $$invalidate(40, transparentVisible = $$new_props.transparentVisible);
  		if ("hasLeftSlots" in $$props) $$invalidate(8, hasLeftSlots = $$new_props.hasLeftSlots);
  		if ("hasRightSlots" in $$props) $$invalidate(9, hasRightSlots = $$new_props.hasRightSlots);
  		if ("hasTitleSlots" in $$props) $$invalidate(10, hasTitleSlots = $$new_props.hasTitleSlots);
  		if ("largeTitle" in $$props) $$invalidate(11, largeTitle = $$new_props.largeTitle);
  		if ("hasTitleLargeSlots" in $$props) $$invalidate(12, hasTitleLargeSlots = $$new_props.hasTitleLargeSlots);
  		if ("addLeftTitleClass" in $$props) $$invalidate(41, addLeftTitleClass = $$new_props.addLeftTitleClass);
  		if ("addCenterTitleClass" in $$props) $$invalidate(42, addCenterTitleClass = $$new_props.addCenterTitleClass);
  		if ("isLarge" in $$props) $$invalidate(43, isLarge = $$new_props.isLarge);
  		if ("isTransparent" in $$props) $$invalidate(44, isTransparent = $$new_props.isTransparent);
  		if ("isTransparentVisible" in $$props) $$invalidate(45, isTransparentVisible = $$new_props.isTransparentVisible);
  		if ("classes" in $$props) $$invalidate(13, classes = $$new_props.classes);
  		if ("innerClasses" in $$props) $$invalidate(14, innerClasses = $$new_props.innerClasses);
  	};

  	let hasLeftSlots;
  	let hasRightSlots;
  	let hasTitleSlots;
  	let largeTitle;
  	let hasTitleLargeSlots;
  	let addLeftTitleClass;
  	let addCenterTitleClass;
  	let isLarge;
  	let isTransparent;
  	let isTransparentVisible;
  	let classes;
  	let innerClasses;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty[0] & /*titleLarge, large, title*/ 150994960) {
  			 $$invalidate(11, largeTitle = titleLarge || large && title);
  		}

  		if ($$self.$$.dirty[1] & /*_theme*/ 8) {
  			 $$invalidate(41, addLeftTitleClass = _theme && _theme.ios && f7.instance && !f7.instance.params.navbar.iosCenterTitle);
  		}

  		if ($$self.$$.dirty[1] & /*_theme*/ 8) {
  			 $$invalidate(42, addCenterTitleClass = _theme && _theme.md && f7.instance && f7.instance.params.navbar.mdCenterTitle || _theme && _theme.aurora && f7.instance && f7.instance.params.navbar.auroraCenterTitle);
  		}

  		if ($$self.$$.dirty[0] & /*large, largeTransparent*/ 50331648) {
  			 $$invalidate(43, isLarge = large || largeTransparent);
  		}

  		if ($$self.$$.dirty[0] & /*transparent, largeTransparent*/ 100663296 | $$self.$$.dirty[1] & /*isLarge*/ 4096) {
  			 $$invalidate(44, isTransparent = transparent || isLarge && largeTransparent);
  		}

  		if ($$self.$$.dirty[1] & /*isTransparent, transparentVisible*/ 8704) {
  			 $$invalidate(45, isTransparentVisible = isTransparent && transparentVisible);
  		}

  		 $$invalidate(13, classes = Utils$1.classNames(
  			className,
  			"navbar",
  			routerPositionClass,
  			{
  				"navbar-hidden": hidden,
  				"navbar-large": isLarge,
  				"navbar-large-collapsed": isLarge && largeCollapsed,
  				"navbar-transparent": isTransparent,
  				"navbar-transparent-visible": isTransparentVisible,
  				"navbar-master": routerNavbarRole === "master",
  				"navbar-master-detail": routerNavbarRole === "detail",
  				"navbar-master-detail-root": routerNavbarRoleDetailRoot === true,
  				"navbar-master-stacked": routerNavbarMasterStack === true,
  				"no-shadow": noShadow,
  				"no-hairline": noHairline
  			},
  			Mixins.colorClasses($$props)
  		));

  		if ($$self.$$.dirty[0] & /*innerClass, innerClassName, sliding*/ 12845056 | $$self.$$.dirty[1] & /*addLeftTitleClass, addCenterTitleClass*/ 3072) {
  			 $$invalidate(14, innerClasses = Utils$1.classNames("navbar-inner", innerClass, innerClassName, {
  				sliding,
  				"navbar-inner-left-title": addLeftTitleClass,
  				"navbar-inner-centered-title": addCenterTitleClass
  			}));
  		}
  	};

  	 $$invalidate(8, hasLeftSlots = hasSlots(arguments, "nav-left") || hasSlots(arguments, "left"));

  	// eslint-disable-next-line
  	 $$invalidate(9, hasRightSlots = hasSlots(arguments, "nav-right") || hasSlots(arguments, "right"));

  	// eslint-disable-next-line
  	 $$invalidate(10, hasTitleSlots = hasSlots(arguments, "title"));

  	// eslint-disable-next-line
  	 $$invalidate(12, hasTitleLargeSlots = hasSlots(arguments, "title-large"));

  	$$props = exclude_internal_props($$props);

  	return [
  		backLink,
  		backLinkUrl,
  		backLinkForce,
  		backLinkShowText,
  		title,
  		subtitle,
  		f7Slot,
  		el,
  		hasLeftSlots,
  		hasRightSlots,
  		hasTitleSlots,
  		largeTitle,
  		hasTitleLargeSlots,
  		classes,
  		innerClasses,
  		onBackClick,
  		$$restProps,
  		className,
  		sliding,
  		hidden,
  		noShadow,
  		noHairline,
  		innerClass,
  		innerClassName,
  		large,
  		largeTransparent,
  		transparent,
  		titleLarge,
  		hide,
  		show,
  		size,
  		$$slots,
  		div2_binding,
  		$$scope
  	];
  }

  class Navbar$2 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(
  			this,
  			options,
  			instance$a,
  			create_fragment$a,
  			safe_not_equal,
  			{
  				class: 17,
  				backLink: 0,
  				backLinkUrl: 1,
  				backLinkForce: 2,
  				backLinkShowText: 3,
  				sliding: 18,
  				title: 4,
  				subtitle: 5,
  				hidden: 19,
  				noShadow: 20,
  				noHairline: 21,
  				innerClass: 22,
  				innerClassName: 23,
  				large: 24,
  				largeTransparent: 25,
  				transparent: 26,
  				titleLarge: 27,
  				f7Slot: 6,
  				hide: 28,
  				show: 29,
  				size: 30
  			},
  			[-1, -1]
  		);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Navbar",
  			options,
  			id: create_fragment$a.name
  		});
  	}

  	get class() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLink() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLink(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLinkUrl() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLinkUrl(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLinkForce() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLinkForce(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get backLinkShowText() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set backLinkShowText(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get sliding() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set sliding(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get title() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set title(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get subtitle() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set subtitle(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hidden() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hidden(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noShadow() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noShadow(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noHairline() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noHairline(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get innerClass() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set innerClass(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get innerClassName() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set innerClassName(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get large() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set large(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get largeTransparent() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set largeTransparent(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get transparent() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set transparent(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get titleLarge() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set titleLarge(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get f7Slot() {
  		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set f7Slot(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hide() {
  		return this.$$.ctx[28];
  	}

  	set hide(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get show() {
  		return this.$$.ctx[29];
  	}

  	set show(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get size() {
  		return this.$$.ctx[30];
  	}

  	set size(value) {
  		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\preloader.svelte generated by Svelte v3.24.0 */
  const file$b = "node_modules\\framework7-svelte\\components\\preloader.svelte";

  // (67:2) {:else}
  function create_else_block$1(ctx) {
  	let span;

  	const block = {
  		c: function create() {
  			span = element("span");
  			attr_dev(span, "class", "preloader-inner");
  			add_location(span, file$b, 67, 2, 2080);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$1.name,
  		type: "else",
  		source: "(67:2) {:else}",
  		ctx
  	});

  	return block;
  }

  // (63:36) 
  function create_if_block_2$3(ctx) {
  	let span1;
  	let span0;

  	const block = {
  		c: function create() {
  			span1 = element("span");
  			span0 = element("span");
  			attr_dev(span0, "class", "preloader-inner-circle");
  			add_location(span0, file$b, 64, 4, 2013);
  			attr_dev(span1, "class", "preloader-inner");
  			add_location(span1, file$b, 63, 2, 1978);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span1, anchor);
  			append_dev(span1, span0);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span1);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2$3.name,
  		type: "if",
  		source: "(63:36) ",
  		ctx
  	});

  	return block;
  }

  // (48:33) 
  function create_if_block_1$4(ctx) {
  	let span12;
  	let span0;
  	let t0;
  	let span1;
  	let t1;
  	let span2;
  	let t2;
  	let span3;
  	let t3;
  	let span4;
  	let t4;
  	let span5;
  	let t5;
  	let span6;
  	let t6;
  	let span7;
  	let t7;
  	let span8;
  	let t8;
  	let span9;
  	let t9;
  	let span10;
  	let t10;
  	let span11;

  	const block = {
  		c: function create() {
  			span12 = element("span");
  			span0 = element("span");
  			t0 = space();
  			span1 = element("span");
  			t1 = space();
  			span2 = element("span");
  			t2 = space();
  			span3 = element("span");
  			t3 = space();
  			span4 = element("span");
  			t4 = space();
  			span5 = element("span");
  			t5 = space();
  			span6 = element("span");
  			t6 = space();
  			span7 = element("span");
  			t7 = space();
  			span8 = element("span");
  			t8 = space();
  			span9 = element("span");
  			t9 = space();
  			span10 = element("span");
  			t10 = space();
  			span11 = element("span");
  			attr_dev(span0, "class", "preloader-inner-line");
  			add_location(span0, file$b, 49, 4, 1369);
  			attr_dev(span1, "class", "preloader-inner-line");
  			add_location(span1, file$b, 50, 4, 1416);
  			attr_dev(span2, "class", "preloader-inner-line");
  			add_location(span2, file$b, 51, 4, 1463);
  			attr_dev(span3, "class", "preloader-inner-line");
  			add_location(span3, file$b, 52, 4, 1510);
  			attr_dev(span4, "class", "preloader-inner-line");
  			add_location(span4, file$b, 53, 4, 1557);
  			attr_dev(span5, "class", "preloader-inner-line");
  			add_location(span5, file$b, 54, 4, 1604);
  			attr_dev(span6, "class", "preloader-inner-line");
  			add_location(span6, file$b, 55, 4, 1651);
  			attr_dev(span7, "class", "preloader-inner-line");
  			add_location(span7, file$b, 56, 4, 1698);
  			attr_dev(span8, "class", "preloader-inner-line");
  			add_location(span8, file$b, 57, 4, 1745);
  			attr_dev(span9, "class", "preloader-inner-line");
  			add_location(span9, file$b, 58, 4, 1792);
  			attr_dev(span10, "class", "preloader-inner-line");
  			add_location(span10, file$b, 59, 4, 1839);
  			attr_dev(span11, "class", "preloader-inner-line");
  			add_location(span11, file$b, 60, 4, 1886);
  			attr_dev(span12, "class", "preloader-inner");
  			add_location(span12, file$b, 48, 2, 1334);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span12, anchor);
  			append_dev(span12, span0);
  			append_dev(span12, t0);
  			append_dev(span12, span1);
  			append_dev(span12, t1);
  			append_dev(span12, span2);
  			append_dev(span12, t2);
  			append_dev(span12, span3);
  			append_dev(span12, t3);
  			append_dev(span12, span4);
  			append_dev(span12, t4);
  			append_dev(span12, span5);
  			append_dev(span12, t5);
  			append_dev(span12, span6);
  			append_dev(span12, t6);
  			append_dev(span12, span7);
  			append_dev(span12, t7);
  			append_dev(span12, span8);
  			append_dev(span12, t8);
  			append_dev(span12, span9);
  			append_dev(span12, t9);
  			append_dev(span12, span10);
  			append_dev(span12, t10);
  			append_dev(span12, span11);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span12);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$4.name,
  		type: "if",
  		source: "(48:33) ",
  		ctx
  	});

  	return block;
  }

  // (38:2) {#if _theme && _theme.md}
  function create_if_block$5(ctx) {
  	let span5;
  	let span0;
  	let t0;
  	let span2;
  	let span1;
  	let t1;
  	let span4;
  	let span3;

  	const block = {
  		c: function create() {
  			span5 = element("span");
  			span0 = element("span");
  			t0 = space();
  			span2 = element("span");
  			span1 = element("span");
  			t1 = space();
  			span4 = element("span");
  			span3 = element("span");
  			attr_dev(span0, "class", "preloader-inner-gap");
  			add_location(span0, file$b, 39, 4, 1044);
  			attr_dev(span1, "class", "preloader-inner-half-circle");
  			add_location(span1, file$b, 41, 6, 1127);
  			attr_dev(span2, "class", "preloader-inner-left");
  			add_location(span2, file$b, 40, 4, 1085);
  			attr_dev(span3, "class", "preloader-inner-half-circle");
  			add_location(span3, file$b, 44, 6, 1231);
  			attr_dev(span4, "class", "preloader-inner-right");
  			add_location(span4, file$b, 43, 4, 1188);
  			attr_dev(span5, "class", "preloader-inner");
  			add_location(span5, file$b, 38, 2, 1009);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span5, anchor);
  			append_dev(span5, span0);
  			append_dev(span5, t0);
  			append_dev(span5, span2);
  			append_dev(span2, span1);
  			append_dev(span5, t1);
  			append_dev(span5, span4);
  			append_dev(span4, span3);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span5);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$5.name,
  		type: "if",
  		source: "(38:2) {#if _theme && _theme.md}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$b(ctx) {
  	let span;

  	function select_block_type(ctx, dirty) {
  		if (/*_theme*/ ctx[0] && /*_theme*/ ctx[0].md) return create_if_block$5;
  		if (/*_theme*/ ctx[0] && /*_theme*/ ctx[0].ios) return create_if_block_1$4;
  		if (/*_theme*/ ctx[0] && /*_theme*/ ctx[0].aurora) return create_if_block_2$3;
  		return create_else_block$1;
  	}

  	let current_block_type = select_block_type(ctx);
  	let if_block = current_block_type(ctx);

  	let span_levels = [
  		{ style: /*preloaderStyle*/ ctx[1] },
  		{ class: /*classes*/ ctx[2] },
  		restProps(/*$$restProps*/ ctx[3])
  	];

  	let span_data = {};

  	for (let i = 0; i < span_levels.length; i += 1) {
  		span_data = assign(span_data, span_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			span = element("span");
  			if_block.c();
  			set_attributes(span, span_data);
  			add_location(span, file$b, 36, 0, 905);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  			if_block.m(span, null);
  		},
  		p: function update(ctx, [dirty]) {
  			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
  				if_block.d(1);
  				if_block = current_block_type(ctx);

  				if (if_block) {
  					if_block.c();
  					if_block.m(span, null);
  				}
  			}

  			set_attributes(span, span_data = get_spread_update(span_levels, [
  				dirty & /*preloaderStyle*/ 2 && { style: /*preloaderStyle*/ ctx[1] },
  				dirty & /*classes*/ 4 && { class: /*classes*/ ctx[2] },
  				dirty & /*$$restProps*/ 8 && restProps(/*$$restProps*/ ctx[3])
  			]));
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  			if_block.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$b.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$b($$self, $$props, $$invalidate) {
  	const omit_props_names = ["style","class","size"];
  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	let { style = undefined } = $$props;
  	let { class: className = undefined } = $$props;
  	let { size = undefined } = $$props;

  	// eslint-disable-next-line
  	let _theme = f7.instance ? f7Theme : null;

  	if (!f7.instance) {
  		f7.ready(() => {
  			$$invalidate(0, _theme = f7Theme);
  		});
  	}

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Preloader", $$slots, []);

  	$$self.$set = $$new_props => {
  		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("style" in $$new_props) $$invalidate(4, style = $$new_props.style);
  		if ("class" in $$new_props) $$invalidate(5, className = $$new_props.class);
  		if ("size" in $$new_props) $$invalidate(6, size = $$new_props.size);
  	};

  	$$self.$capture_state = () => ({
  		theme: f7Theme,
  		Utils: Utils$1,
  		restProps,
  		Mixins,
  		f7,
  		style,
  		className,
  		size,
  		_theme,
  		sizeComputed,
  		preloaderStyle,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
  		if ("style" in $$props) $$invalidate(4, style = $$new_props.style);
  		if ("className" in $$props) $$invalidate(5, className = $$new_props.className);
  		if ("size" in $$props) $$invalidate(6, size = $$new_props.size);
  		if ("_theme" in $$props) $$invalidate(0, _theme = $$new_props._theme);
  		if ("sizeComputed" in $$props) $$invalidate(7, sizeComputed = $$new_props.sizeComputed);
  		if ("preloaderStyle" in $$props) $$invalidate(1, preloaderStyle = $$new_props.preloaderStyle);
  		if ("classes" in $$props) $$invalidate(2, classes = $$new_props.classes);
  	};

  	let sizeComputed;
  	let preloaderStyle;
  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*size*/ 64) {
  			 $$invalidate(7, sizeComputed = size && typeof size === "string" && size.indexOf("px") >= 0
  			? size.replace("px", "")
  			: size);
  		}

  		if ($$self.$$.dirty & /*style, sizeComputed*/ 144) {
  			 $$invalidate(1, preloaderStyle = ((style || "") + (sizeComputed
  			? `;width: ${sizeComputed}px; height: ${sizeComputed}px; --f7-preloader-size: ${sizeComputed}px`
  			: "")).replace(";;", ";"));
  		}

  		 $$invalidate(2, classes = Utils$1.classNames(className, "preloader", Mixins.colorClasses($$props)));
  	};

  	$$props = exclude_internal_props($$props);
  	return [_theme, preloaderStyle, classes, $$restProps, style, className, size];
  }

  class Preloader extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$b, create_fragment$b, safe_not_equal, { style: 4, class: 5, size: 6 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Preloader",
  			options,
  			id: create_fragment$b.name
  		});
  	}

  	get style() {
  		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set style(value) {
  		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get class() {
  		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get size() {
  		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set size(value) {
  		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\page-content.svelte generated by Svelte v3.24.0 */
  const file$c = "node_modules\\framework7-svelte\\components\\page-content.svelte";

  // (147:2) {#if ptr && ptrPreloader && !ptrBottom}
  function create_if_block_3$3(ctx) {
  	let div1;
  	let preloader;
  	let t;
  	let div0;
  	let current;
  	preloader = new Preloader({ $$inline: true });

  	const block = {
  		c: function create() {
  			div1 = element("div");
  			create_component(preloader.$$.fragment);
  			t = space();
  			div0 = element("div");
  			attr_dev(div0, "class", "ptr-arrow");
  			add_location(div0, file$c, 149, 6, 4501);
  			attr_dev(div1, "class", "ptr-preloader");
  			add_location(div1, file$c, 147, 4, 4447);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div1, anchor);
  			mount_component(preloader, div1, null);
  			append_dev(div1, t);
  			append_dev(div1, div0);
  			current = true;
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(preloader.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(preloader.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div1);
  			destroy_component(preloader);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_3$3.name,
  		type: "if",
  		source: "(147:2) {#if ptr && ptrPreloader && !ptrBottom}",
  		ctx
  	});

  	return block;
  }

  // (153:2) {#if infinite && infiniteTop && infinitePreloader}
  function create_if_block_2$4(ctx) {
  	let preloader;
  	let current;

  	preloader = new Preloader({
  			props: { class: "infinite-scroll-preloader" },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(preloader.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(preloader, target, anchor);
  			current = true;
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(preloader.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(preloader.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(preloader, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_2$4.name,
  		type: "if",
  		source: "(153:2) {#if infinite && infiniteTop && infinitePreloader}",
  		ctx
  	});

  	return block;
  }

  // (157:2) {#if infinite && !infiniteTop && infinitePreloader}
  function create_if_block_1$5(ctx) {
  	let preloader;
  	let current;

  	preloader = new Preloader({
  			props: { class: "infinite-scroll-preloader" },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(preloader.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(preloader, target, anchor);
  			current = true;
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(preloader.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(preloader.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(preloader, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$5.name,
  		type: "if",
  		source: "(157:2) {#if infinite && !infiniteTop && infinitePreloader}",
  		ctx
  	});

  	return block;
  }

  // (160:2) {#if ptr && ptrPreloader && ptrBottom}
  function create_if_block$6(ctx) {
  	let div1;
  	let preloader;
  	let t;
  	let div0;
  	let current;
  	preloader = new Preloader({ $$inline: true });

  	const block = {
  		c: function create() {
  			div1 = element("div");
  			create_component(preloader.$$.fragment);
  			t = space();
  			div0 = element("div");
  			attr_dev(div0, "class", "ptr-arrow");
  			add_location(div0, file$c, 162, 6, 4881);
  			attr_dev(div1, "class", "ptr-preloader");
  			add_location(div1, file$c, 160, 4, 4827);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div1, anchor);
  			mount_component(preloader, div1, null);
  			append_dev(div1, t);
  			append_dev(div1, div0);
  			current = true;
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(preloader.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(preloader.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div1);
  			destroy_component(preloader);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$6.name,
  		type: "if",
  		source: "(160:2) {#if ptr && ptrPreloader && ptrBottom}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$c(ctx) {
  	let div;
  	let t0;
  	let t1;
  	let t2;
  	let t3;
  	let div_data_ptr_mousewheel_value;
  	let div_data_infinite_distance_value;
  	let current;
  	let if_block0 = /*ptr*/ ctx[0] && /*ptrPreloader*/ ctx[2] && !/*ptrBottom*/ ctx[3] && create_if_block_3$3(ctx);
  	let if_block1 = /*infinite*/ ctx[5] && /*infiniteTop*/ ctx[6] && /*infinitePreloader*/ ctx[8] && create_if_block_2$4(ctx);
  	const default_slot_template = /*$$slots*/ ctx[21].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);
  	let if_block2 = /*infinite*/ ctx[5] && !/*infiniteTop*/ ctx[6] && /*infinitePreloader*/ ctx[8] && create_if_block_1$5(ctx);
  	let if_block3 = /*ptr*/ ctx[0] && /*ptrPreloader*/ ctx[2] && /*ptrBottom*/ ctx[3] && create_if_block$6(ctx);

  	let div_levels = [
  		{ class: /*pageContentClasses*/ ctx[10] },
  		{
  			"data-ptr-distance": /*ptrDistance*/ ctx[1]
  		},
  		{
  			"data-ptr-mousewheel": div_data_ptr_mousewheel_value = /*ptrMousewheel*/ ctx[4] || undefined
  		},
  		{
  			"data-infinite-distance": div_data_infinite_distance_value = /*infiniteDistance*/ ctx[7] || undefined
  		},
  		restProps(/*$$restProps*/ ctx[11])
  	];

  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (if_block0) if_block0.c();
  			t0 = space();
  			if (if_block1) if_block1.c();
  			t1 = space();
  			if (default_slot) default_slot.c();
  			t2 = space();
  			if (if_block2) if_block2.c();
  			t3 = space();
  			if (if_block3) if_block3.c();
  			set_attributes(div, div_data);
  			add_location(div, file$c, 138, 0, 4165);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			if (if_block0) if_block0.m(div, null);
  			append_dev(div, t0);
  			if (if_block1) if_block1.m(div, null);
  			append_dev(div, t1);

  			if (default_slot) {
  				default_slot.m(div, null);
  			}

  			append_dev(div, t2);
  			if (if_block2) if_block2.m(div, null);
  			append_dev(div, t3);
  			if (if_block3) if_block3.m(div, null);
  			/*div_binding*/ ctx[22](div);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (/*ptr*/ ctx[0] && /*ptrPreloader*/ ctx[2] && !/*ptrBottom*/ ctx[3]) {
  				if (if_block0) {
  					if (dirty[0] & /*ptr, ptrPreloader, ptrBottom*/ 13) {
  						transition_in(if_block0, 1);
  					}
  				} else {
  					if_block0 = create_if_block_3$3(ctx);
  					if_block0.c();
  					transition_in(if_block0, 1);
  					if_block0.m(div, t0);
  				}
  			} else if (if_block0) {
  				group_outros();

  				transition_out(if_block0, 1, 1, () => {
  					if_block0 = null;
  				});

  				check_outros();
  			}

  			if (/*infinite*/ ctx[5] && /*infiniteTop*/ ctx[6] && /*infinitePreloader*/ ctx[8]) {
  				if (if_block1) {
  					if (dirty[0] & /*infinite, infiniteTop, infinitePreloader*/ 352) {
  						transition_in(if_block1, 1);
  					}
  				} else {
  					if_block1 = create_if_block_2$4(ctx);
  					if_block1.c();
  					transition_in(if_block1, 1);
  					if_block1.m(div, t1);
  				}
  			} else if (if_block1) {
  				group_outros();

  				transition_out(if_block1, 1, 1, () => {
  					if_block1 = null;
  				});

  				check_outros();
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[0] & /*$$scope*/ 1048576) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[20], dirty, null, null);
  				}
  			}

  			if (/*infinite*/ ctx[5] && !/*infiniteTop*/ ctx[6] && /*infinitePreloader*/ ctx[8]) {
  				if (if_block2) {
  					if (dirty[0] & /*infinite, infiniteTop, infinitePreloader*/ 352) {
  						transition_in(if_block2, 1);
  					}
  				} else {
  					if_block2 = create_if_block_1$5(ctx);
  					if_block2.c();
  					transition_in(if_block2, 1);
  					if_block2.m(div, t3);
  				}
  			} else if (if_block2) {
  				group_outros();

  				transition_out(if_block2, 1, 1, () => {
  					if_block2 = null;
  				});

  				check_outros();
  			}

  			if (/*ptr*/ ctx[0] && /*ptrPreloader*/ ctx[2] && /*ptrBottom*/ ctx[3]) {
  				if (if_block3) {
  					if (dirty[0] & /*ptr, ptrPreloader, ptrBottom*/ 13) {
  						transition_in(if_block3, 1);
  					}
  				} else {
  					if_block3 = create_if_block$6(ctx);
  					if_block3.c();
  					transition_in(if_block3, 1);
  					if_block3.m(div, null);
  				}
  			} else if (if_block3) {
  				group_outros();

  				transition_out(if_block3, 1, 1, () => {
  					if_block3 = null;
  				});

  				check_outros();
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty[0] & /*pageContentClasses*/ 1024) && { class: /*pageContentClasses*/ ctx[10] },
  				(!current || dirty[0] & /*ptrDistance*/ 2) && {
  					"data-ptr-distance": /*ptrDistance*/ ctx[1]
  				},
  				(!current || dirty[0] & /*ptrMousewheel*/ 16 && div_data_ptr_mousewheel_value !== (div_data_ptr_mousewheel_value = /*ptrMousewheel*/ ctx[4] || undefined)) && {
  					"data-ptr-mousewheel": div_data_ptr_mousewheel_value
  				},
  				(!current || dirty[0] & /*infiniteDistance*/ 128 && div_data_infinite_distance_value !== (div_data_infinite_distance_value = /*infiniteDistance*/ ctx[7] || undefined)) && {
  					"data-infinite-distance": div_data_infinite_distance_value
  				},
  				dirty[0] & /*$$restProps*/ 2048 && restProps(/*$$restProps*/ ctx[11])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block0);
  			transition_in(if_block1);
  			transition_in(default_slot, local);
  			transition_in(if_block2);
  			transition_in(if_block3);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block0);
  			transition_out(if_block1);
  			transition_out(default_slot, local);
  			transition_out(if_block2);
  			transition_out(if_block3);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			if (default_slot) default_slot.d(detaching);
  			if (if_block2) if_block2.d();
  			if (if_block3) if_block3.d();
  			/*div_binding*/ ctx[22](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$c.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$c($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"tab","tabActive","ptr","ptrDistance","ptrPreloader","ptrBottom","ptrMousewheel","infinite","infiniteTop","infiniteDistance","infinitePreloader","hideBarsOnScroll","hideNavbarOnScroll","hideToolbarOnScroll","messagesContent","loginScreen","class"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { tab = false } = $$props;
  	let { tabActive = false } = $$props;
  	let { ptr = false } = $$props;
  	let { ptrDistance = undefined } = $$props;
  	let { ptrPreloader = true } = $$props;
  	let { ptrBottom = false } = $$props;
  	let { ptrMousewheel = false } = $$props;
  	let { infinite = false } = $$props;
  	let { infiniteTop = false } = $$props;
  	let { infiniteDistance = undefined } = $$props;
  	let { infinitePreloader = true } = $$props;
  	let { hideBarsOnScroll = false } = $$props;
  	let { hideNavbarOnScroll = false } = $$props;
  	let { hideToolbarOnScroll = false } = $$props;
  	let { messagesContent = false } = $$props;
  	let { loginScreen = false } = $$props;
  	let { class: className = undefined } = $$props;
  	let pageContentEl;

  	// Event handlers
  	function onPtrPullStart(ptrEl) {
  		if (ptrEl !== pageContentEl) return;
  		dispatch("ptrPullStart");
  		if (typeof $$props.onPtrPullStart === "function") $$props.onPtrPullStart();
  	}

  	function onPtrPullMove(ptrEl) {
  		if (ptrEl !== pageContentEl) return;
  		dispatch("ptrPullMove");
  		if (typeof $$props.onPtrPullMove === "function") $$props.onPtrPullMove();
  	}

  	function onPtrPullEnd(ptrEl) {
  		if (ptrEl !== pageContentEl) return;
  		dispatch("ptrPullEnd");
  		if (typeof $$props.onPtrPullEnd === "function") $$props.onPtrPullEnd();
  	}

  	function onPtrRefresh(ptrEl, done) {
  		if (ptrEl !== pageContentEl) return;
  		dispatch("ptrRefresh", [done]);
  		if (typeof $$props.onPtrRefresh === "function") $$props.onPtrRefresh(done);
  	}

  	function onPtrDone(ptrEl) {
  		if (ptrEl !== pageContentEl) return;
  		dispatch("ptrDone");
  		if (typeof $$props.onPtrDone === "function") $$props.onPtrDone();
  	}

  	function onInfinite(infEl) {
  		if (infEl !== pageContentEl) return;
  		dispatch("infinite");
  		if (typeof $$props.onInfinite === "function") $$props.onInfinite();
  	}

  	function onTabShow(tabEl) {
  		if (pageContentEl !== tabEl) return;
  		dispatch("tabShow");
  		if (typeof $$props.onTabShow === "function") $$props.onTabShow(tabEl);
  	}

  	function onTabHide(tabEl) {
  		if (pageContentEl !== tabEl) return;
  		dispatch("tabHide");
  		if (typeof $$props.onTabHide === "function") $$props.onTabHide(tabEl);
  	}

  	function mountPageContent() {
  		if (ptr) {
  			f7.instance.on("ptrPullStart", onPtrPullStart);
  			f7.instance.on("ptrPullMove", onPtrPullMove);
  			f7.instance.on("ptrPullEnd", onPtrPullEnd);
  			f7.instance.on("ptrRefresh", onPtrRefresh);
  			f7.instance.on("ptrDone", onPtrDone);
  		}

  		if (infinite) {
  			f7.instance.on("infinite", onInfinite);
  		}

  		if (tab) {
  			f7.instance.on("tabShow", onTabShow);
  			f7.instance.on("tabHide", onTabHide);
  		}
  	}

  	function destroyPageContent() {
  		if (ptr) {
  			f7.instance.off("ptrPullStart", onPtrPullStart);
  			f7.instance.off("ptrPullMove", onPtrPullMove);
  			f7.instance.off("ptrPullEnd", onPtrPullEnd);
  			f7.instance.off("ptrRefresh", onPtrRefresh);
  			f7.instance.off("ptrDone", onPtrDone);
  		}

  		if (infinite) {
  			f7.instance.off("infinite", onInfinite);
  		}

  		if (tab) {
  			f7.instance.off("tabShow", onTabShow);
  			f7.instance.off("tabHide", onTabHide);
  		}
  	}

  	onMount(() => {
  		f7.ready(() => {
  			mountPageContent();
  		});
  	});

  	onDestroy(() => {
  		if (!f7.instance) return;
  		destroyPageContent();
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Page_content", $$slots, ['default']);

  	function div_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			pageContentEl = $$value;
  			$$invalidate(9, pageContentEl);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(34, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("tab" in $$new_props) $$invalidate(12, tab = $$new_props.tab);
  		if ("tabActive" in $$new_props) $$invalidate(13, tabActive = $$new_props.tabActive);
  		if ("ptr" in $$new_props) $$invalidate(0, ptr = $$new_props.ptr);
  		if ("ptrDistance" in $$new_props) $$invalidate(1, ptrDistance = $$new_props.ptrDistance);
  		if ("ptrPreloader" in $$new_props) $$invalidate(2, ptrPreloader = $$new_props.ptrPreloader);
  		if ("ptrBottom" in $$new_props) $$invalidate(3, ptrBottom = $$new_props.ptrBottom);
  		if ("ptrMousewheel" in $$new_props) $$invalidate(4, ptrMousewheel = $$new_props.ptrMousewheel);
  		if ("infinite" in $$new_props) $$invalidate(5, infinite = $$new_props.infinite);
  		if ("infiniteTop" in $$new_props) $$invalidate(6, infiniteTop = $$new_props.infiniteTop);
  		if ("infiniteDistance" in $$new_props) $$invalidate(7, infiniteDistance = $$new_props.infiniteDistance);
  		if ("infinitePreloader" in $$new_props) $$invalidate(8, infinitePreloader = $$new_props.infinitePreloader);
  		if ("hideBarsOnScroll" in $$new_props) $$invalidate(14, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
  		if ("hideNavbarOnScroll" in $$new_props) $$invalidate(15, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
  		if ("hideToolbarOnScroll" in $$new_props) $$invalidate(16, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
  		if ("messagesContent" in $$new_props) $$invalidate(17, messagesContent = $$new_props.messagesContent);
  		if ("loginScreen" in $$new_props) $$invalidate(18, loginScreen = $$new_props.loginScreen);
  		if ("class" in $$new_props) $$invalidate(19, className = $$new_props.class);
  		if ("$$scope" in $$new_props) $$invalidate(20, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		onDestroy,
  		createEventDispatcher,
  		Utils: Utils$1,
  		restProps,
  		Mixins,
  		f7,
  		Preloader,
  		dispatch,
  		tab,
  		tabActive,
  		ptr,
  		ptrDistance,
  		ptrPreloader,
  		ptrBottom,
  		ptrMousewheel,
  		infinite,
  		infiniteTop,
  		infiniteDistance,
  		infinitePreloader,
  		hideBarsOnScroll,
  		hideNavbarOnScroll,
  		hideToolbarOnScroll,
  		messagesContent,
  		loginScreen,
  		className,
  		pageContentEl,
  		onPtrPullStart,
  		onPtrPullMove,
  		onPtrPullEnd,
  		onPtrRefresh,
  		onPtrDone,
  		onInfinite,
  		onTabShow,
  		onTabHide,
  		mountPageContent,
  		destroyPageContent,
  		pageContentClasses
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(34, $$props = assign(assign({}, $$props), $$new_props));
  		if ("tab" in $$props) $$invalidate(12, tab = $$new_props.tab);
  		if ("tabActive" in $$props) $$invalidate(13, tabActive = $$new_props.tabActive);
  		if ("ptr" in $$props) $$invalidate(0, ptr = $$new_props.ptr);
  		if ("ptrDistance" in $$props) $$invalidate(1, ptrDistance = $$new_props.ptrDistance);
  		if ("ptrPreloader" in $$props) $$invalidate(2, ptrPreloader = $$new_props.ptrPreloader);
  		if ("ptrBottom" in $$props) $$invalidate(3, ptrBottom = $$new_props.ptrBottom);
  		if ("ptrMousewheel" in $$props) $$invalidate(4, ptrMousewheel = $$new_props.ptrMousewheel);
  		if ("infinite" in $$props) $$invalidate(5, infinite = $$new_props.infinite);
  		if ("infiniteTop" in $$props) $$invalidate(6, infiniteTop = $$new_props.infiniteTop);
  		if ("infiniteDistance" in $$props) $$invalidate(7, infiniteDistance = $$new_props.infiniteDistance);
  		if ("infinitePreloader" in $$props) $$invalidate(8, infinitePreloader = $$new_props.infinitePreloader);
  		if ("hideBarsOnScroll" in $$props) $$invalidate(14, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
  		if ("hideNavbarOnScroll" in $$props) $$invalidate(15, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
  		if ("hideToolbarOnScroll" in $$props) $$invalidate(16, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
  		if ("messagesContent" in $$props) $$invalidate(17, messagesContent = $$new_props.messagesContent);
  		if ("loginScreen" in $$props) $$invalidate(18, loginScreen = $$new_props.loginScreen);
  		if ("className" in $$props) $$invalidate(19, className = $$new_props.className);
  		if ("pageContentEl" in $$props) $$invalidate(9, pageContentEl = $$new_props.pageContentEl);
  		if ("pageContentClasses" in $$props) $$invalidate(10, pageContentClasses = $$new_props.pageContentClasses);
  	};

  	let pageContentClasses;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		 $$invalidate(10, pageContentClasses = Utils$1.classNames(
  			className,
  			"page-content",
  			{
  				tab,
  				"tab-active": tabActive,
  				"ptr-content": ptr,
  				"ptr-bottom": ptrBottom,
  				"infinite-scroll-content": infinite,
  				"infinite-scroll-top": infiniteTop,
  				"hide-bars-on-scroll": hideBarsOnScroll,
  				"hide-navbar-on-scroll": hideNavbarOnScroll,
  				"hide-toolbar-on-scroll": hideToolbarOnScroll,
  				"messages-content": messagesContent,
  				"login-screen-content": loginScreen
  			},
  			Mixins.colorClasses($$props)
  		));
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		ptr,
  		ptrDistance,
  		ptrPreloader,
  		ptrBottom,
  		ptrMousewheel,
  		infinite,
  		infiniteTop,
  		infiniteDistance,
  		infinitePreloader,
  		pageContentEl,
  		pageContentClasses,
  		$$restProps,
  		tab,
  		tabActive,
  		hideBarsOnScroll,
  		hideNavbarOnScroll,
  		hideToolbarOnScroll,
  		messagesContent,
  		loginScreen,
  		className,
  		$$scope,
  		$$slots,
  		div_binding
  	];
  }

  class Page_content extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(
  			this,
  			options,
  			instance$c,
  			create_fragment$c,
  			safe_not_equal,
  			{
  				tab: 12,
  				tabActive: 13,
  				ptr: 0,
  				ptrDistance: 1,
  				ptrPreloader: 2,
  				ptrBottom: 3,
  				ptrMousewheel: 4,
  				infinite: 5,
  				infiniteTop: 6,
  				infiniteDistance: 7,
  				infinitePreloader: 8,
  				hideBarsOnScroll: 14,
  				hideNavbarOnScroll: 15,
  				hideToolbarOnScroll: 16,
  				messagesContent: 17,
  				loginScreen: 18,
  				class: 19
  			},
  			[-1, -1]
  		);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Page_content",
  			options,
  			id: create_fragment$c.name
  		});
  	}

  	get tab() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tab(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabActive() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabActive(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptr() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptr(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrDistance() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrDistance(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrPreloader() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrPreloader(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrBottom() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrBottom(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrMousewheel() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrMousewheel(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infinite() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infinite(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infiniteTop() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infiniteTop(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infiniteDistance() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infiniteDistance(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infinitePreloader() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infinitePreloader(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hideBarsOnScroll() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hideBarsOnScroll(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hideNavbarOnScroll() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hideNavbarOnScroll(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hideToolbarOnScroll() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hideToolbarOnScroll(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get messagesContent() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set messagesContent(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get loginScreen() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set loginScreen(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get class() {
  		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\framework7-svelte\components\page.svelte generated by Svelte v3.24.0 */
  const file$d = "node_modules\\framework7-svelte\\components\\page.svelte";
  const get_static_slot_changes_1 = dirty => ({});
  const get_static_slot_context_1 = ctx => ({});
  const get_static_slot_changes = dirty => ({});
  const get_static_slot_context = ctx => ({});
  const get_fixed_slot_changes = dirty => ({});
  const get_fixed_slot_context = ctx => ({});

  // (353:2) {:else}
  function create_else_block$2(ctx) {
  	let t;
  	let current;
  	const static_slot_template = /*$$slots*/ ctx[35].static;
  	const static_slot = create_slot(static_slot_template, ctx, /*$$scope*/ ctx[37], get_static_slot_context_1);
  	const default_slot_template = /*$$slots*/ ctx[35].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[37], null);

  	const block = {
  		c: function create() {
  			if (static_slot) static_slot.c();
  			t = space();
  			if (default_slot) default_slot.c();
  		},
  		m: function mount(target, anchor) {
  			if (static_slot) {
  				static_slot.m(target, anchor);
  			}

  			insert_dev(target, t, anchor);

  			if (default_slot) {
  				default_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (static_slot) {
  				if (static_slot.p && dirty[1] & /*$$scope*/ 64) {
  					update_slot(static_slot, static_slot_template, ctx, /*$$scope*/ ctx[37], dirty, get_static_slot_changes_1, get_static_slot_context_1);
  				}
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[1] & /*$$scope*/ 64) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[37], dirty, null, null);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(static_slot, local);
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(static_slot, local);
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (static_slot) static_slot.d(detaching);
  			if (detaching) detach_dev(t);
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$2.name,
  		type: "else",
  		source: "(353:2) {:else}",
  		ctx
  	});

  	return block;
  }

  // (327:2) {#if pageContent}
  function create_if_block$7(ctx) {
  	let pagecontent;
  	let current;

  	pagecontent = new Page_content({
  			props: {
  				ptr: /*ptr*/ ctx[2],
  				ptrDistance: /*ptrDistance*/ ctx[3],
  				ptrPreloader: /*ptrPreloader*/ ctx[4],
  				ptrBottom: /*ptrBottom*/ ctx[5],
  				ptrMousewheel: /*ptrMousewheel*/ ctx[6],
  				infinite: /*infinite*/ ctx[7],
  				infiniteTop: /*infiniteTop*/ ctx[8],
  				infiniteDistance: /*infiniteDistance*/ ctx[9],
  				infinitePreloader: /*infinitePreloader*/ ctx[10],
  				hideBarsOnScroll: /*hideBarsOnScroll*/ ctx[11],
  				hideNavbarOnScroll: /*hideNavbarOnScroll*/ ctx[12],
  				hideToolbarOnScroll: /*hideToolbarOnScroll*/ ctx[13],
  				messagesContent: /*messagesContent*/ ctx[14],
  				loginScreen: /*loginScreen*/ ctx[15],
  				onPtrPullStart: /*onPtrPullStart*/ ctx[18],
  				onPtrPullMove: /*onPtrPullMove*/ ctx[19],
  				onPtrPullEnd: /*onPtrPullEnd*/ ctx[20],
  				onPtrRefresh: /*onPtrRefresh*/ ctx[21],
  				onPtrDone: /*onPtrDone*/ ctx[22],
  				onInfinite: /*onInfinite*/ ctx[23],
  				$$slots: { default: [create_default_slot$2] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(pagecontent.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(pagecontent, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const pagecontent_changes = {};
  			if (dirty[0] & /*ptr*/ 4) pagecontent_changes.ptr = /*ptr*/ ctx[2];
  			if (dirty[0] & /*ptrDistance*/ 8) pagecontent_changes.ptrDistance = /*ptrDistance*/ ctx[3];
  			if (dirty[0] & /*ptrPreloader*/ 16) pagecontent_changes.ptrPreloader = /*ptrPreloader*/ ctx[4];
  			if (dirty[0] & /*ptrBottom*/ 32) pagecontent_changes.ptrBottom = /*ptrBottom*/ ctx[5];
  			if (dirty[0] & /*ptrMousewheel*/ 64) pagecontent_changes.ptrMousewheel = /*ptrMousewheel*/ ctx[6];
  			if (dirty[0] & /*infinite*/ 128) pagecontent_changes.infinite = /*infinite*/ ctx[7];
  			if (dirty[0] & /*infiniteTop*/ 256) pagecontent_changes.infiniteTop = /*infiniteTop*/ ctx[8];
  			if (dirty[0] & /*infiniteDistance*/ 512) pagecontent_changes.infiniteDistance = /*infiniteDistance*/ ctx[9];
  			if (dirty[0] & /*infinitePreloader*/ 1024) pagecontent_changes.infinitePreloader = /*infinitePreloader*/ ctx[10];
  			if (dirty[0] & /*hideBarsOnScroll*/ 2048) pagecontent_changes.hideBarsOnScroll = /*hideBarsOnScroll*/ ctx[11];
  			if (dirty[0] & /*hideNavbarOnScroll*/ 4096) pagecontent_changes.hideNavbarOnScroll = /*hideNavbarOnScroll*/ ctx[12];
  			if (dirty[0] & /*hideToolbarOnScroll*/ 8192) pagecontent_changes.hideToolbarOnScroll = /*hideToolbarOnScroll*/ ctx[13];
  			if (dirty[0] & /*messagesContent*/ 16384) pagecontent_changes.messagesContent = /*messagesContent*/ ctx[14];
  			if (dirty[0] & /*loginScreen*/ 32768) pagecontent_changes.loginScreen = /*loginScreen*/ ctx[15];

  			if (dirty[1] & /*$$scope*/ 64) {
  				pagecontent_changes.$$scope = { dirty, ctx };
  			}

  			pagecontent.$set(pagecontent_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(pagecontent.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(pagecontent.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(pagecontent, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$7.name,
  		type: "if",
  		source: "(327:2) {#if pageContent}",
  		ctx
  	});

  	return block;
  }

  // (328:2) <PageContent     ptr={ptr}     ptrDistance={ptrDistance}     ptrPreloader={ptrPreloader}     ptrBottom={ptrBottom}     ptrMousewheel={ptrMousewheel}     infinite={infinite}     infiniteTop={infiniteTop}     infiniteDistance={infiniteDistance}     infinitePreloader={infinitePreloader}     hideBarsOnScroll={hideBarsOnScroll}     hideNavbarOnScroll={hideNavbarOnScroll}     hideToolbarOnScroll={hideToolbarOnScroll}     messagesContent={messagesContent}     loginScreen={loginScreen}     onPtrPullStart={onPtrPullStart}     onPtrPullMove={onPtrPullMove}     onPtrPullEnd={onPtrPullEnd}     onPtrRefresh={onPtrRefresh}     onPtrDone={onPtrDone}     onInfinite={onInfinite}   >
  function create_default_slot$2(ctx) {
  	let t;
  	let current;
  	const static_slot_template = /*$$slots*/ ctx[35].static;
  	const static_slot = create_slot(static_slot_template, ctx, /*$$scope*/ ctx[37], get_static_slot_context);
  	const default_slot_template = /*$$slots*/ ctx[35].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[37], null);

  	const block = {
  		c: function create() {
  			if (static_slot) static_slot.c();
  			t = space();
  			if (default_slot) default_slot.c();
  		},
  		m: function mount(target, anchor) {
  			if (static_slot) {
  				static_slot.m(target, anchor);
  			}

  			insert_dev(target, t, anchor);

  			if (default_slot) {
  				default_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (static_slot) {
  				if (static_slot.p && dirty[1] & /*$$scope*/ 64) {
  					update_slot(static_slot, static_slot_template, ctx, /*$$scope*/ ctx[37], dirty, get_static_slot_changes, get_static_slot_context);
  				}
  			}

  			if (default_slot) {
  				if (default_slot.p && dirty[1] & /*$$scope*/ 64) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[37], dirty, null, null);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(static_slot, local);
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(static_slot, local);
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (static_slot) static_slot.d(detaching);
  			if (detaching) detach_dev(t);
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot$2.name,
  		type: "slot",
  		source: "(328:2) <PageContent     ptr={ptr}     ptrDistance={ptrDistance}     ptrPreloader={ptrPreloader}     ptrBottom={ptrBottom}     ptrMousewheel={ptrMousewheel}     infinite={infinite}     infiniteTop={infiniteTop}     infiniteDistance={infiniteDistance}     infinitePreloader={infinitePreloader}     hideBarsOnScroll={hideBarsOnScroll}     hideNavbarOnScroll={hideNavbarOnScroll}     hideToolbarOnScroll={hideToolbarOnScroll}     messagesContent={messagesContent}     loginScreen={loginScreen}     onPtrPullStart={onPtrPullStart}     onPtrPullMove={onPtrPullMove}     onPtrPullEnd={onPtrPullEnd}     onPtrRefresh={onPtrRefresh}     onPtrDone={onPtrDone}     onInfinite={onInfinite}   >",
  		ctx
  	});

  	return block;
  }

  function create_fragment$d(ctx) {
  	let div;
  	let t;
  	let current_block_type_index;
  	let if_block;
  	let current;
  	const fixed_slot_template = /*$$slots*/ ctx[35].fixed;
  	const fixed_slot = create_slot(fixed_slot_template, ctx, /*$$scope*/ ctx[37], get_fixed_slot_context);
  	const if_block_creators = [create_if_block$7, create_else_block$2];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*pageContent*/ ctx[1]) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	let div_levels = [
  		{ class: /*classes*/ ctx[17] },
  		{ "data-name": /*name*/ ctx[0] },
  		restProps(/*$$restProps*/ ctx[24])
  	];

  	let div_data = {};

  	for (let i = 0; i < div_levels.length; i += 1) {
  		div_data = assign(div_data, div_levels[i]);
  	}

  	const block = {
  		c: function create() {
  			div = element("div");
  			if (fixed_slot) fixed_slot.c();
  			t = space();
  			if_block.c();
  			set_attributes(div, div_data);
  			add_location(div, file$d, 324, 0, 11332);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			if (fixed_slot) {
  				fixed_slot.m(div, null);
  			}

  			append_dev(div, t);
  			if_blocks[current_block_type_index].m(div, null);
  			/*div_binding*/ ctx[36](div);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (fixed_slot) {
  				if (fixed_slot.p && dirty[1] & /*$$scope*/ 64) {
  					update_slot(fixed_slot, fixed_slot_template, ctx, /*$$scope*/ ctx[37], dirty, get_fixed_slot_changes, get_fixed_slot_context);
  				}
  			}

  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				}

  				transition_in(if_block, 1);
  				if_block.m(div, null);
  			}

  			set_attributes(div, div_data = get_spread_update(div_levels, [
  				(!current || dirty[0] & /*classes*/ 131072) && { class: /*classes*/ ctx[17] },
  				(!current || dirty[0] & /*name*/ 1) && { "data-name": /*name*/ ctx[0] },
  				dirty[0] & /*$$restProps*/ 16777216 && restProps(/*$$restProps*/ ctx[24])
  			]));
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(fixed_slot, local);
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(fixed_slot, local);
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (fixed_slot) fixed_slot.d(detaching);
  			if_blocks[current_block_type_index].d();
  			/*div_binding*/ ctx[36](null);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$d.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$d($$self, $$props, $$invalidate) {
  	const omit_props_names = [
  		"name","stacked","withSubnavbar","subnavbar","withNavbarLarge","navbarLarge","noNavbar","noToolbar","tabs","pageContent","noSwipeback","ptr","ptrDistance","ptrPreloader","ptrBottom","ptrMousewheel","infinite","infiniteTop","infiniteDistance","infinitePreloader","hideBarsOnScroll","hideNavbarOnScroll","hideToolbarOnScroll","messagesContent","loginScreen","class"
  	];

  	let $$restProps = compute_rest_props($$props, omit_props_names);
  	const dispatch = createEventDispatcher();
  	let { name = undefined } = $$props;
  	let { stacked = undefined } = $$props;
  	let { withSubnavbar = undefined } = $$props;
  	let { subnavbar = undefined } = $$props;
  	let { withNavbarLarge = undefined } = $$props;
  	let { navbarLarge = undefined } = $$props;
  	let { noNavbar = undefined } = $$props;
  	let { noToolbar = undefined } = $$props;
  	let { tabs = undefined } = $$props;
  	let { pageContent = true } = $$props;
  	let { noSwipeback = undefined } = $$props;
  	let { ptr = undefined } = $$props;
  	let { ptrDistance = undefined } = $$props;
  	let { ptrPreloader = true } = $$props;
  	let { ptrBottom = undefined } = $$props;
  	let { ptrMousewheel = undefined } = $$props;
  	let { infinite = undefined } = $$props;
  	let { infiniteTop = undefined } = $$props;
  	let { infiniteDistance = undefined } = $$props;
  	let { infinitePreloader = true } = $$props;
  	let { hideBarsOnScroll = undefined } = $$props;
  	let { hideNavbarOnScroll = undefined } = $$props;
  	let { hideToolbarOnScroll = undefined } = $$props;
  	let { messagesContent = undefined } = $$props;
  	let { loginScreen = undefined } = $$props;
  	let { class: className = undefined } = $$props;

  	// State
  	let el;

  	let hasSubnavbar = false;
  	let hasNavbarLarge = false;
  	let hasNavbarLargeCollapsed = false;
  	let hasCardExpandableOpened = false;
  	let routerPositionClass = "";
  	let routerForceUnstack = false;
  	let routerPageRole = null;
  	let routerPageRoleDetailRoot = false;
  	let routerPageMasterStack = false;

  	// Handlers
  	function onPtrPullStart() {
  		dispatch("ptrPullStart");
  		if (typeof $$props.onPtrPullStart === "function") $$props.onPtrPullStart();
  	}

  	function onPtrPullMove() {
  		dispatch("ptrPullMove");
  		if (typeof $$props.onPtrPullMove === "function") $$props.onPtrPullMove();
  	}

  	function onPtrPullEnd() {
  		dispatch("ptrPullEnd");
  		if (typeof $$props.onPtrPullEnd === "function") $$props.onPtrPullEnd();
  	}

  	function onPtrRefresh(done) {
  		dispatch("ptrRefresh", [done]);
  		if (typeof $$props.onPtrRefresh === "function") $$props.onPtrRefresh(done);
  	}

  	function onPtrDone() {
  		dispatch("ptrDone");
  		if (typeof $$props.onPtrDone === "function") $$props.onPtrDone();
  	}

  	function onInfinite() {
  		dispatch("infinite");
  		if (typeof $$props.onInfinite === "function") $$props.onInfinite();
  	}

  	// Main Page Events
  	function onPageMounted(page) {
  		if (el !== page.el) return;
  		dispatch("pageMounted", [page]);
  		if (typeof $$props.onPageMounted === "function") $$props.onPageMounted(page);
  	}

  	function onPageInit(page) {
  		if (el !== page.el) return;

  		if (typeof withSubnavbar === "undefined" && typeof subnavbar === "undefined") {
  			if (page.$navbarEl && page.$navbarEl.length && page.$navbarEl.find(".subnavbar").length || page.$el.children(".navbar").find(".subnavbar").length) {
  				$$invalidate(38, hasSubnavbar = true);
  			}
  		}

  		if (typeof withNavbarLarge === "undefined" && typeof navbarLarge === "undefined") {
  			if (page.$navbarEl && page.$navbarEl.hasClass("navbar-large") || page.$el.children(".navbar-large").length) {
  				$$invalidate(39, hasNavbarLarge = true);
  			}
  		}

  		dispatch("pageInit", [page]);
  		if (typeof $$props.onPageInit === "function") $$props.onPageInit(page);
  	}

  	function onPageReinit(page) {
  		if (el !== page.el) return;
  		dispatch("pageReinit", [page]);
  		if (typeof $$props.onPageReinit === "function") $$props.onPageReinit(page);
  	}

  	function onPageBeforeIn(page) {
  		if (el !== page.el) return;

  		if (!page.swipeBack) {
  			if (page.from === "next") {
  				$$invalidate(42, routerPositionClass = "page-next");
  			}

  			if (page.from === "previous") {
  				$$invalidate(42, routerPositionClass = "page-previous");
  			}
  		}

  		dispatch("pageBeforeIn", [page]);
  		if (typeof $$props.onPageBeforeIn === "function") $$props.onPageBeforeIn(page);
  	}

  	function onPageBeforeOut(page) {
  		if (el !== page.el) return;
  		dispatch("pageBeforeOut", [page]);
  		if (typeof $$props.onPageBeforeOut === "function") $$props.onPageBeforeOut(page);
  	}

  	function onPageAfterOut(page) {
  		if (el !== page.el) return;

  		if (page.to === "next") {
  			$$invalidate(42, routerPositionClass = "page-next");
  		}

  		if (page.to === "previous") {
  			$$invalidate(42, routerPositionClass = "page-previous");
  		}

  		dispatch("pageAfterOut", [page]);
  		if (typeof $$props.onPageAfterOut === "function") $$props.onPageAfterOut(page);
  	}

  	function onPageAfterIn(page) {
  		if (el !== page.el) return;
  		$$invalidate(42, routerPositionClass = "page-current");
  		dispatch("pageAfterIn", [page]);
  		if (typeof $$props.onPageAfterIn === "function") $$props.onPageAfterIn(page);
  	}

  	function onPageBeforeRemove(page) {
  		if (el !== page.el) return;

  		if (page.$navbarEl && page.$navbarEl[0] && page.$navbarEl.parent()[0] && page.$navbarEl.parent()[0] !== el) {
  			page.$el.prepend(page.$navbarEl);
  		}

  		dispatch("pageBeforeRemove", [page]);
  		if (typeof $$props.onPageBeforeRemove === "function") $$props.onPageBeforeRemove(page);
  	}

  	function onPageBeforeUnmount(page) {
  		if (el !== page.el) return;
  		dispatch("pageBeforeUnmount", [page]);
  		if (typeof $$props.onPageBeforeUnmount === "function") $$props.onPageBeforeUnmount(page);
  	}

  	// Helper events
  	function onPageStack(pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(43, routerForceUnstack = false);
  	}

  	function onPageUnstack(pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(43, routerForceUnstack = true);
  	}

  	function onPagePosition(pageEl, position) {
  		if (el !== pageEl) return;
  		$$invalidate(42, routerPositionClass = `page-${position}`);
  	}

  	function onPageRole(pageEl, rolesData) {
  		if (el !== pageEl) return;
  		$$invalidate(44, routerPageRole = rolesData.role);
  		$$invalidate(45, routerPageRoleDetailRoot = rolesData.detailRoot);
  	}

  	function onPageMasterStack(pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(46, routerPageMasterStack = true);
  	}

  	function onPageMasterUnstack(pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(46, routerPageMasterStack = false);
  	}

  	function onPageNavbarLargeCollapsed(pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(40, hasNavbarLargeCollapsed = true);
  	}

  	function onPageNavbarLargeExpanded(pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(40, hasNavbarLargeCollapsed = false);
  	}

  	function onCardOpened(cardEl, pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(41, hasCardExpandableOpened = true);
  	}

  	function onCardClose(cardEl, pageEl) {
  		if (el !== pageEl) return;
  		$$invalidate(41, hasCardExpandableOpened = false);
  	}

  	function onPageTabShow(pageEl) {
  		if (el !== pageEl) return;
  		dispatch("pageTabShow");
  		if (typeof $$props.onPageTabShow === "function") $$props.onPageTabShow();
  	}

  	function onPageTabHide(pageEl) {
  		if (el !== pageEl) return;
  		dispatch("pageTabHide");
  		if (typeof $$props.onPageTabHide === "function") $$props.onPageTabHide();
  	}

  	// Mount/destroy
  	function mountPage() {
  		f7.instance.on("pageMounted", onPageMounted);
  		f7.instance.on("pageInit", onPageInit);
  		f7.instance.on("pageReinit", onPageReinit);
  		f7.instance.on("pageBeforeIn", onPageBeforeIn);
  		f7.instance.on("pageBeforeOut", onPageBeforeOut);
  		f7.instance.on("pageAfterOut", onPageAfterOut);
  		f7.instance.on("pageAfterIn", onPageAfterIn);
  		f7.instance.on("pageBeforeRemove", onPageBeforeRemove);
  		f7.instance.on("pageBeforeUnmount", onPageBeforeUnmount);
  		f7.instance.on("pageStack", onPageStack);
  		f7.instance.on("pageUnstack", onPageUnstack);
  		f7.instance.on("pagePosition", onPagePosition);
  		f7.instance.on("pageRole", onPageRole);
  		f7.instance.on("pageMasterStack", onPageMasterStack);
  		f7.instance.on("pageMasterUnstack", onPageMasterUnstack);
  		f7.instance.on("pageNavbarLargeCollapsed", onPageNavbarLargeCollapsed);
  		f7.instance.on("pageNavbarLargeExpanded", onPageNavbarLargeExpanded);
  		f7.instance.on("cardOpened", onCardOpened);
  		f7.instance.on("cardClose", onCardClose);
  		f7.instance.on("pageTabShow", onPageTabShow);
  		f7.instance.on("pageTabHide", onPageTabHide);
  	}

  	function destroyPage() {
  		f7.instance.off("pageMounted", onPageMounted);
  		f7.instance.off("pageInit", onPageInit);
  		f7.instance.off("pageReinit", onPageReinit);
  		f7.instance.off("pageBeforeIn", onPageBeforeIn);
  		f7.instance.off("pageBeforeOut", onPageBeforeOut);
  		f7.instance.off("pageAfterOut", onPageAfterOut);
  		f7.instance.off("pageAfterIn", onPageAfterIn);
  		f7.instance.off("pageBeforeRemove", onPageBeforeRemove);
  		f7.instance.off("pageBeforeUnmount", onPageBeforeUnmount);
  		f7.instance.off("pageStack", onPageStack);
  		f7.instance.off("pageUnstack", onPageUnstack);
  		f7.instance.off("pagePosition", onPagePosition);
  		f7.instance.off("pageRole", onPageRole);
  		f7.instance.off("pageMasterStack", onPageMasterStack);
  		f7.instance.off("pageMasterUnstack", onPageMasterUnstack);
  		f7.instance.off("pageNavbarLargeCollapsed", onPageNavbarLargeCollapsed);
  		f7.instance.off("pageNavbarLargeExpanded", onPageNavbarLargeExpanded);
  		f7.instance.off("cardOpened", onCardOpened);
  		f7.instance.off("cardClose", onCardClose);
  		f7.instance.off("pageTabShow", onPageTabShow);
  		f7.instance.off("pageTabHide", onPageTabHide);
  	}

  	onMount(() => {
  		f7.ready(() => {
  			if (el) {
  				const dom7 = f7.instance.$;
  				const fixedEls = dom7(el).children(".page-content").children("[data-f7-slot=\"fixed\"]");

  				if (fixedEls.length) {
  					for (let i = fixedEls.length - 1; i >= 0; i -= 1) {
  						dom7(el).prepend(fixedEls[i]);
  					}
  				}
  			}

  			mountPage();
  		});
  	});

  	afterUpdate(() => {
  		if (el && f7.instance) {
  			const dom7 = f7.instance.$;
  			const fixedEls = dom7(el).children(".page-content").children("[data-f7-slot=\"fixed\"]");

  			if (fixedEls.length) {
  				for (let i = fixedEls.length - 1; i >= 0; i -= 1) {
  					dom7(el).prepend(fixedEls[i]);
  				}
  			}
  		}
  	});

  	onDestroy(() => {
  		if (!f7.instance) return;
  		destroyPage();
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Page", $$slots, ['fixed','static','default']);

  	function div_binding($$value) {
  		binding_callbacks[$$value ? "unshift" : "push"](() => {
  			el = $$value;
  			$$invalidate(16, el);
  		});
  	}

  	$$self.$set = $$new_props => {
  		$$invalidate(73, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		$$invalidate(24, $$restProps = compute_rest_props($$props, omit_props_names));
  		if ("name" in $$new_props) $$invalidate(0, name = $$new_props.name);
  		if ("stacked" in $$new_props) $$invalidate(25, stacked = $$new_props.stacked);
  		if ("withSubnavbar" in $$new_props) $$invalidate(26, withSubnavbar = $$new_props.withSubnavbar);
  		if ("subnavbar" in $$new_props) $$invalidate(27, subnavbar = $$new_props.subnavbar);
  		if ("withNavbarLarge" in $$new_props) $$invalidate(28, withNavbarLarge = $$new_props.withNavbarLarge);
  		if ("navbarLarge" in $$new_props) $$invalidate(29, navbarLarge = $$new_props.navbarLarge);
  		if ("noNavbar" in $$new_props) $$invalidate(30, noNavbar = $$new_props.noNavbar);
  		if ("noToolbar" in $$new_props) $$invalidate(31, noToolbar = $$new_props.noToolbar);
  		if ("tabs" in $$new_props) $$invalidate(32, tabs = $$new_props.tabs);
  		if ("pageContent" in $$new_props) $$invalidate(1, pageContent = $$new_props.pageContent);
  		if ("noSwipeback" in $$new_props) $$invalidate(33, noSwipeback = $$new_props.noSwipeback);
  		if ("ptr" in $$new_props) $$invalidate(2, ptr = $$new_props.ptr);
  		if ("ptrDistance" in $$new_props) $$invalidate(3, ptrDistance = $$new_props.ptrDistance);
  		if ("ptrPreloader" in $$new_props) $$invalidate(4, ptrPreloader = $$new_props.ptrPreloader);
  		if ("ptrBottom" in $$new_props) $$invalidate(5, ptrBottom = $$new_props.ptrBottom);
  		if ("ptrMousewheel" in $$new_props) $$invalidate(6, ptrMousewheel = $$new_props.ptrMousewheel);
  		if ("infinite" in $$new_props) $$invalidate(7, infinite = $$new_props.infinite);
  		if ("infiniteTop" in $$new_props) $$invalidate(8, infiniteTop = $$new_props.infiniteTop);
  		if ("infiniteDistance" in $$new_props) $$invalidate(9, infiniteDistance = $$new_props.infiniteDistance);
  		if ("infinitePreloader" in $$new_props) $$invalidate(10, infinitePreloader = $$new_props.infinitePreloader);
  		if ("hideBarsOnScroll" in $$new_props) $$invalidate(11, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
  		if ("hideNavbarOnScroll" in $$new_props) $$invalidate(12, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
  		if ("hideToolbarOnScroll" in $$new_props) $$invalidate(13, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
  		if ("messagesContent" in $$new_props) $$invalidate(14, messagesContent = $$new_props.messagesContent);
  		if ("loginScreen" in $$new_props) $$invalidate(15, loginScreen = $$new_props.loginScreen);
  		if ("class" in $$new_props) $$invalidate(34, className = $$new_props.class);
  		if ("$$scope" in $$new_props) $$invalidate(37, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		afterUpdate,
  		onDestroy,
  		createEventDispatcher,
  		Utils: Utils$1,
  		restProps,
  		Mixins,
  		f7,
  		PageContent: Page_content,
  		dispatch,
  		name,
  		stacked,
  		withSubnavbar,
  		subnavbar,
  		withNavbarLarge,
  		navbarLarge,
  		noNavbar,
  		noToolbar,
  		tabs,
  		pageContent,
  		noSwipeback,
  		ptr,
  		ptrDistance,
  		ptrPreloader,
  		ptrBottom,
  		ptrMousewheel,
  		infinite,
  		infiniteTop,
  		infiniteDistance,
  		infinitePreloader,
  		hideBarsOnScroll,
  		hideNavbarOnScroll,
  		hideToolbarOnScroll,
  		messagesContent,
  		loginScreen,
  		className,
  		el,
  		hasSubnavbar,
  		hasNavbarLarge,
  		hasNavbarLargeCollapsed,
  		hasCardExpandableOpened,
  		routerPositionClass,
  		routerForceUnstack,
  		routerPageRole,
  		routerPageRoleDetailRoot,
  		routerPageMasterStack,
  		onPtrPullStart,
  		onPtrPullMove,
  		onPtrPullEnd,
  		onPtrRefresh,
  		onPtrDone,
  		onInfinite,
  		onPageMounted,
  		onPageInit,
  		onPageReinit,
  		onPageBeforeIn,
  		onPageBeforeOut,
  		onPageAfterOut,
  		onPageAfterIn,
  		onPageBeforeRemove,
  		onPageBeforeUnmount,
  		onPageStack,
  		onPageUnstack,
  		onPagePosition,
  		onPageRole,
  		onPageMasterStack,
  		onPageMasterUnstack,
  		onPageNavbarLargeCollapsed,
  		onPageNavbarLargeExpanded,
  		onCardOpened,
  		onCardClose,
  		onPageTabShow,
  		onPageTabHide,
  		mountPage,
  		destroyPage,
  		forceSubnavbar,
  		forceNavbarLarge,
  		classes
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(73, $$props = assign(assign({}, $$props), $$new_props));
  		if ("name" in $$props) $$invalidate(0, name = $$new_props.name);
  		if ("stacked" in $$props) $$invalidate(25, stacked = $$new_props.stacked);
  		if ("withSubnavbar" in $$props) $$invalidate(26, withSubnavbar = $$new_props.withSubnavbar);
  		if ("subnavbar" in $$props) $$invalidate(27, subnavbar = $$new_props.subnavbar);
  		if ("withNavbarLarge" in $$props) $$invalidate(28, withNavbarLarge = $$new_props.withNavbarLarge);
  		if ("navbarLarge" in $$props) $$invalidate(29, navbarLarge = $$new_props.navbarLarge);
  		if ("noNavbar" in $$props) $$invalidate(30, noNavbar = $$new_props.noNavbar);
  		if ("noToolbar" in $$props) $$invalidate(31, noToolbar = $$new_props.noToolbar);
  		if ("tabs" in $$props) $$invalidate(32, tabs = $$new_props.tabs);
  		if ("pageContent" in $$props) $$invalidate(1, pageContent = $$new_props.pageContent);
  		if ("noSwipeback" in $$props) $$invalidate(33, noSwipeback = $$new_props.noSwipeback);
  		if ("ptr" in $$props) $$invalidate(2, ptr = $$new_props.ptr);
  		if ("ptrDistance" in $$props) $$invalidate(3, ptrDistance = $$new_props.ptrDistance);
  		if ("ptrPreloader" in $$props) $$invalidate(4, ptrPreloader = $$new_props.ptrPreloader);
  		if ("ptrBottom" in $$props) $$invalidate(5, ptrBottom = $$new_props.ptrBottom);
  		if ("ptrMousewheel" in $$props) $$invalidate(6, ptrMousewheel = $$new_props.ptrMousewheel);
  		if ("infinite" in $$props) $$invalidate(7, infinite = $$new_props.infinite);
  		if ("infiniteTop" in $$props) $$invalidate(8, infiniteTop = $$new_props.infiniteTop);
  		if ("infiniteDistance" in $$props) $$invalidate(9, infiniteDistance = $$new_props.infiniteDistance);
  		if ("infinitePreloader" in $$props) $$invalidate(10, infinitePreloader = $$new_props.infinitePreloader);
  		if ("hideBarsOnScroll" in $$props) $$invalidate(11, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
  		if ("hideNavbarOnScroll" in $$props) $$invalidate(12, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
  		if ("hideToolbarOnScroll" in $$props) $$invalidate(13, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
  		if ("messagesContent" in $$props) $$invalidate(14, messagesContent = $$new_props.messagesContent);
  		if ("loginScreen" in $$props) $$invalidate(15, loginScreen = $$new_props.loginScreen);
  		if ("className" in $$props) $$invalidate(34, className = $$new_props.className);
  		if ("el" in $$props) $$invalidate(16, el = $$new_props.el);
  		if ("hasSubnavbar" in $$props) $$invalidate(38, hasSubnavbar = $$new_props.hasSubnavbar);
  		if ("hasNavbarLarge" in $$props) $$invalidate(39, hasNavbarLarge = $$new_props.hasNavbarLarge);
  		if ("hasNavbarLargeCollapsed" in $$props) $$invalidate(40, hasNavbarLargeCollapsed = $$new_props.hasNavbarLargeCollapsed);
  		if ("hasCardExpandableOpened" in $$props) $$invalidate(41, hasCardExpandableOpened = $$new_props.hasCardExpandableOpened);
  		if ("routerPositionClass" in $$props) $$invalidate(42, routerPositionClass = $$new_props.routerPositionClass);
  		if ("routerForceUnstack" in $$props) $$invalidate(43, routerForceUnstack = $$new_props.routerForceUnstack);
  		if ("routerPageRole" in $$props) $$invalidate(44, routerPageRole = $$new_props.routerPageRole);
  		if ("routerPageRoleDetailRoot" in $$props) $$invalidate(45, routerPageRoleDetailRoot = $$new_props.routerPageRoleDetailRoot);
  		if ("routerPageMasterStack" in $$props) $$invalidate(46, routerPageMasterStack = $$new_props.routerPageMasterStack);
  		if ("forceSubnavbar" in $$props) $$invalidate(47, forceSubnavbar = $$new_props.forceSubnavbar);
  		if ("forceNavbarLarge" in $$props) $$invalidate(48, forceNavbarLarge = $$new_props.forceNavbarLarge);
  		if ("classes" in $$props) $$invalidate(17, classes = $$new_props.classes);
  	};

  	let forceSubnavbar;
  	let forceNavbarLarge;
  	let classes;

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty[0] & /*subnavbar, withSubnavbar*/ 201326592 | $$self.$$.dirty[1] & /*hasSubnavbar*/ 128) {
  			 $$invalidate(47, forceSubnavbar = typeof subnavbar === "undefined" && typeof withSubnavbar === "undefined"
  			? hasSubnavbar
  			: false);
  		}

  		if ($$self.$$.dirty[0] & /*navbarLarge, withNavbarLarge*/ 805306368 | $$self.$$.dirty[1] & /*hasNavbarLarge*/ 256) {
  			 $$invalidate(48, forceNavbarLarge = typeof navbarLarge === "undefined" && typeof withNavbarLarge === "undefined"
  			? hasNavbarLarge
  			: false);
  		}

  		 $$invalidate(17, classes = Utils$1.classNames(
  			className,
  			"page",
  			routerPositionClass,
  			{
  				stacked: stacked && !routerForceUnstack,
  				tabs,
  				"page-with-subnavbar": subnavbar || withSubnavbar || forceSubnavbar,
  				"page-with-navbar-large": navbarLarge || withNavbarLarge || forceNavbarLarge,
  				"no-navbar": noNavbar,
  				"no-toolbar": noToolbar,
  				"no-swipeback": noSwipeback,
  				"page-master": routerPageRole === "master",
  				"page-master-detail": routerPageRole === "detail",
  				"page-master-detail-root": routerPageRoleDetailRoot === true,
  				"page-master-stacked": routerPageMasterStack === true,
  				"page-with-navbar-large-collapsed": hasNavbarLargeCollapsed === true,
  				"page-with-card-opened": hasCardExpandableOpened === true,
  				"login-screen-page": loginScreen
  			},
  			Mixins.colorClasses($$props)
  		));
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		name,
  		pageContent,
  		ptr,
  		ptrDistance,
  		ptrPreloader,
  		ptrBottom,
  		ptrMousewheel,
  		infinite,
  		infiniteTop,
  		infiniteDistance,
  		infinitePreloader,
  		hideBarsOnScroll,
  		hideNavbarOnScroll,
  		hideToolbarOnScroll,
  		messagesContent,
  		loginScreen,
  		el,
  		classes,
  		onPtrPullStart,
  		onPtrPullMove,
  		onPtrPullEnd,
  		onPtrRefresh,
  		onPtrDone,
  		onInfinite,
  		$$restProps,
  		stacked,
  		withSubnavbar,
  		subnavbar,
  		withNavbarLarge,
  		navbarLarge,
  		noNavbar,
  		noToolbar,
  		tabs,
  		noSwipeback,
  		className,
  		$$slots,
  		div_binding,
  		$$scope
  	];
  }

  class Page extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(
  			this,
  			options,
  			instance$d,
  			create_fragment$d,
  			safe_not_equal,
  			{
  				name: 0,
  				stacked: 25,
  				withSubnavbar: 26,
  				subnavbar: 27,
  				withNavbarLarge: 28,
  				navbarLarge: 29,
  				noNavbar: 30,
  				noToolbar: 31,
  				tabs: 32,
  				pageContent: 1,
  				noSwipeback: 33,
  				ptr: 2,
  				ptrDistance: 3,
  				ptrPreloader: 4,
  				ptrBottom: 5,
  				ptrMousewheel: 6,
  				infinite: 7,
  				infiniteTop: 8,
  				infiniteDistance: 9,
  				infinitePreloader: 10,
  				hideBarsOnScroll: 11,
  				hideNavbarOnScroll: 12,
  				hideToolbarOnScroll: 13,
  				messagesContent: 14,
  				loginScreen: 15,
  				class: 34
  			},
  			[-1, -1, -1]
  		);

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Page",
  			options,
  			id: create_fragment$d.name
  		});
  	}

  	get name() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set name(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get stacked() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set stacked(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get withSubnavbar() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set withSubnavbar(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get subnavbar() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set subnavbar(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get withNavbarLarge() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set withNavbarLarge(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get navbarLarge() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set navbarLarge(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noNavbar() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noNavbar(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noToolbar() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noToolbar(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get tabs() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set tabs(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get pageContent() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set pageContent(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get noSwipeback() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set noSwipeback(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptr() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptr(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrDistance() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrDistance(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrPreloader() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrPreloader(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrBottom() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrBottom(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get ptrMousewheel() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set ptrMousewheel(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infinite() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infinite(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infiniteTop() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infiniteTop(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infiniteDistance() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infiniteDistance(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get infinitePreloader() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set infinitePreloader(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hideBarsOnScroll() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hideBarsOnScroll(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hideNavbarOnScroll() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hideNavbarOnScroll(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get hideToolbarOnScroll() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set hideToolbarOnScroll(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get messagesContent() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set messagesContent(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get loginScreen() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set loginScreen(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get class() {
  		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set class(value) {
  		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /**
   * Framework7 Svelte 5.7.10
   * Build full featured iOS & Android apps using Framework7 & Svelte
   * https://framework7.io/svelte/
   *
   * Copyright 2014-2020 Vladimir Kharlampidi
   *
   * Released under the MIT License
   *
   * Released on: July 14, 2020
   */

  /* src\svelte-shared\components\styles\OtherStyles.svelte generated by Svelte v3.24.0 */

  function create_fragment$e(ctx) {
  	const block = {
  		c: noop,
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$e.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$e($$self, $$props) {
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OtherStyles> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("OtherStyles", $$slots, []);
  	return [];
  }

  class OtherStyles extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "OtherStyles",
  			options,
  			id: create_fragment$e.name
  		});
  	}
  }

  /* src\svelte-shared\components\styles\MarginStyles.svelte generated by Svelte v3.24.0 */

  function create_fragment$f(ctx) {
  	const block = {
  		c: noop,
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$f.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$f($$self, $$props) {
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MarginStyles> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("MarginStyles", $$slots, []);
  	return [];
  }

  class MarginStyles extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "MarginStyles",
  			options,
  			id: create_fragment$f.name
  		});
  	}
  }

  /* src\svelte-shared\components\styles\PaddingStyles.svelte generated by Svelte v3.24.0 */

  function create_fragment$g(ctx) {
  	const block = {
  		c: noop,
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$g.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$g($$self, $$props) {
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PaddingStyles> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("PaddingStyles", $$slots, []);
  	return [];
  }

  class PaddingStyles extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "PaddingStyles",
  			options,
  			id: create_fragment$g.name
  		});
  	}
  }

  /* src\svelte-shared\components\styles\GridStyles.svelte generated by Svelte v3.24.0 */

  function create_fragment$h(ctx) {
  	const block = {
  		c: noop,
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$h.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$h($$self, $$props) {
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GridStyles> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("GridStyles", $$slots, []);
  	return [];
  }

  class GridStyles extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "GridStyles",
  			options,
  			id: create_fragment$h.name
  		});
  	}
  }

  /* src\svelte-framework7-shared\components\styles\Framework7Styles.svelte generated by Svelte v3.24.0 */

  function create_fragment$i(ctx) {
  	const block = {
  		c: noop,
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: noop,
  		p: noop,
  		i: noop,
  		o: noop,
  		d: noop
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$i.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$i($$self, $$props) {
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Framework7Styles> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Framework7Styles", $$slots, []);
  	return [];
  }

  class Framework7Styles extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Framework7Styles",
  			options,
  			id: create_fragment$i.name
  		});
  	}
  }

  /* src\pages\HomePage.svelte generated by Svelte v3.24.0 */

  const file$e = "src\\pages\\HomePage.svelte";

  // (16:2) <NavTitle>
  function create_default_slot_6(ctx) {
  	let t;

  	const block = {
  		c: function create() {
  			t = text$1("Home Page");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_6.name,
  		type: "slot",
  		source: "(16:2) <NavTitle>",
  		ctx
  	});

  	return block;
  }

  // (17:2) <NavRight>
  function create_default_slot_5(ctx) {
  	let link;
  	let current;

  	link = new Link({
  			props: {
  				iconIos: "f7:search",
  				iconAurora: "f7:search",
  				iconMd: "material:search"
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(link.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(link, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(link.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(link.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(link, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_5.name,
  		type: "slot",
  		source: "(17:2) <NavRight>",
  		ctx
  	});

  	return block;
  }

  // (15:1) <Navbar style="position: fixed">
  function create_default_slot_4(ctx) {
  	let navtitle;
  	let t;
  	let navright;
  	let current;

  	navtitle = new Nav_title({
  			props: {
  				$$slots: { default: [create_default_slot_6] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	navright = new Nav_right({
  			props: {
  				$$slots: { default: [create_default_slot_5] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(navtitle.$$.fragment);
  			t = space();
  			create_component(navright.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(navtitle, target, anchor);
  			insert_dev(target, t, anchor);
  			mount_component(navright, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const navtitle_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				navtitle_changes.$$scope = { dirty, ctx };
  			}

  			navtitle.$set(navtitle_changes);
  			const navright_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				navright_changes.$$scope = { dirty, ctx };
  			}

  			navright.$set(navright_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(navtitle.$$.fragment, local);
  			transition_in(navright.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(navtitle.$$.fragment, local);
  			transition_out(navright.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(navtitle, detaching);
  			if (detaching) detach_dev(t);
  			destroy_component(navright, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_4.name,
  		type: "slot",
  		source: "(15:1) <Navbar style=\\\"position: fixed\\\">",
  		ctx
  	});

  	return block;
  }

  // (26:3) <Button>
  function create_default_slot_3(ctx) {
  	let t;

  	const block = {
  		c: function create() {
  			t = text$1("This is a button");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_3.name,
  		type: "slot",
  		source: "(26:3) <Button>",
  		ctx
  	});

  	return block;
  }

  // (31:3) <Button>
  function create_default_slot_2$2(ctx) {
  	let t;
  	let icon;
  	let current;

  	icon = new Icon({
  			props: { material: "settings" },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			t = text$1("Now this... is an icon inside a button!\r\n\t\t\t\t");
  			create_component(icon.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, t, anchor);
  			mount_component(icon, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(icon.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(icon.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(t);
  			destroy_component(icon, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_2$2.name,
  		type: "slot",
  		source: "(31:3) <Button>",
  		ctx
  	});

  	return block;
  }

  // (23:1) <Block class="p-0">
  function create_default_slot_1$2(ctx) {
  	let div;
  	let span0;
  	let t1;
  	let button0;
  	let t2;
  	let span1;
  	let t3;
  	let icon;
  	let t4;
  	let button1;
  	let current;

  	button0 = new Button({
  			props: {
  				$$slots: { default: [create_default_slot_3] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	icon = new Icon({
  			props: { material: "settings" },
  			$$inline: true
  		});

  	button1 = new Button({
  			props: {
  				$$slots: { default: [create_default_slot_2$2] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			div = element("div");
  			span0 = element("span");
  			span0.textContent = "Hello world";
  			t1 = space();
  			create_component(button0.$$.fragment);
  			t2 = space();
  			span1 = element("span");
  			t3 = text$1("And this is an icon\r\n\t\t\t\t");
  			create_component(icon.$$.fragment);
  			t4 = space();
  			create_component(button1.$$.fragment);
  			add_location(span0, file$e, 24, 3, 426);
  			add_location(span1, file$e, 26, 3, 493);
  			attr_dev(div, "class", "grid-x-center");
  			add_location(div, file$e, 23, 2, 394);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, span0);
  			append_dev(div, t1);
  			mount_component(button0, div, null);
  			append_dev(div, t2);
  			append_dev(div, span1);
  			append_dev(span1, t3);
  			mount_component(icon, span1, null);
  			append_dev(div, t4);
  			mount_component(button1, div, null);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const button0_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				button0_changes.$$scope = { dirty, ctx };
  			}

  			button0.$set(button0_changes);
  			const button1_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				button1_changes.$$scope = { dirty, ctx };
  			}

  			button1.$set(button1_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(button0.$$.fragment, local);
  			transition_in(icon.$$.fragment, local);
  			transition_in(button1.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(button0.$$.fragment, local);
  			transition_out(icon.$$.fragment, local);
  			transition_out(button1.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			destroy_component(button0);
  			destroy_component(icon);
  			destroy_component(button1);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_1$2.name,
  		type: "slot",
  		source: "(23:1) <Block class=\\\"p-0\\\">",
  		ctx
  	});

  	return block;
  }

  // (14:0) <Page>
  function create_default_slot$3(ctx) {
  	let navbar;
  	let t0;
  	let br0;
  	let t1;
  	let br1;
  	let t2;
  	let block;
  	let current;

  	navbar = new Navbar$2({
  			props: {
  				style: "position: fixed",
  				$$slots: { default: [create_default_slot_4] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	block = new Block({
  			props: {
  				class: "p-0",
  				$$slots: { default: [create_default_slot_1$2] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block_1 = {
  		c: function create() {
  			create_component(navbar.$$.fragment);
  			t0 = space();
  			br0 = element("br");
  			t1 = space();
  			br1 = element("br");
  			t2 = space();
  			create_component(block.$$.fragment);
  			add_location(br0, file$e, 20, 1, 353);
  			add_location(br1, file$e, 21, 1, 362);
  		},
  		m: function mount(target, anchor) {
  			mount_component(navbar, target, anchor);
  			insert_dev(target, t0, anchor);
  			insert_dev(target, br0, anchor);
  			insert_dev(target, t1, anchor);
  			insert_dev(target, br1, anchor);
  			insert_dev(target, t2, anchor);
  			mount_component(block, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const navbar_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				navbar_changes.$$scope = { dirty, ctx };
  			}

  			navbar.$set(navbar_changes);
  			const block_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				block_changes.$$scope = { dirty, ctx };
  			}

  			block.$set(block_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(navbar.$$.fragment, local);
  			transition_in(block.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(navbar.$$.fragment, local);
  			transition_out(block.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(navbar, detaching);
  			if (detaching) detach_dev(t0);
  			if (detaching) detach_dev(br0);
  			if (detaching) detach_dev(t1);
  			if (detaching) detach_dev(br1);
  			if (detaching) detach_dev(t2);
  			destroy_component(block, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block: block_1,
  		id: create_default_slot$3.name,
  		type: "slot",
  		source: "(14:0) <Page>",
  		ctx
  	});

  	return block_1;
  }

  function create_fragment$j(ctx) {
  	let page;
  	let current;

  	page = new Page({
  			props: {
  				$$slots: { default: [create_default_slot$3] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(page.$$.fragment);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			mount_component(page, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			const page_changes = {};

  			if (dirty & /*$$scope*/ 1) {
  				page_changes.$$scope = { dirty, ctx };
  			}

  			page.$set(page_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(page.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(page.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(page, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$j.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$j($$self, $$props, $$invalidate) {
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HomePage> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("HomePage", $$slots, []);

  	$$self.$capture_state = () => ({
  		Page,
  		Navbar: Navbar$2,
  		NavTitle: Nav_title,
  		NavRight: Nav_right,
  		Link,
  		Block,
  		Button,
  		Icon
  	});

  	return [];
  }

  class HomePage extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "HomePage",
  			options,
  			id: create_fragment$j.name
  		});
  	}
  }

  const subscriber_queue = [];
  /**
   * Creates a `Readable` store that allows reading by subscription.
   * @param value initial value
   * @param {StartStopNotifier}start start and stop notifications for subscriptions
   */
  function readable(value, start) {
      return {
          subscribe: writable(value, start).subscribe,
      };
  }
  /**
   * Create a `Writable` store that allows both updating and reading by subscription.
   * @param {*=}value initial value
   * @param {StartStopNotifier=}start start and stop notifications for subscriptions
   */
  function writable(value, start = noop) {
      let stop;
      const subscribers = [];
      function set(new_value) {
          if (safe_not_equal(value, new_value)) {
              value = new_value;
              if (stop) { // store is ready
                  const run_queue = !subscriber_queue.length;
                  for (let i = 0; i < subscribers.length; i += 1) {
                      const s = subscribers[i];
                      s[1]();
                      subscriber_queue.push(s, value);
                  }
                  if (run_queue) {
                      for (let i = 0; i < subscriber_queue.length; i += 2) {
                          subscriber_queue[i][0](subscriber_queue[i + 1]);
                      }
                      subscriber_queue.length = 0;
                  }
              }
          }
      }
      function update(fn) {
          set(fn(value));
      }
      function subscribe(run, invalidate = noop) {
          const subscriber = [run, invalidate];
          subscribers.push(subscriber);
          if (subscribers.length === 1) {
              stop = start(set) || noop;
          }
          run(value);
          return () => {
              const index = subscribers.indexOf(subscriber);
              if (index !== -1) {
                  subscribers.splice(index, 1);
              }
              if (subscribers.length === 0) {
                  stop();
                  stop = null;
              }
          };
      }
      return { set, update, subscribe };
  }
  function derived(stores, fn, initial_value) {
      const single = !Array.isArray(stores);
      const stores_array = single
          ? [stores]
          : stores;
      const auto = fn.length < 2;
      return readable(initial_value, (set) => {
          let inited = false;
          const values = [];
          let pending = 0;
          let cleanup = noop;
          const sync = () => {
              if (pending) {
                  return;
              }
              cleanup();
              const result = fn(single ? values[0] : values, set);
              if (auto) {
                  set(result);
              }
              else {
                  cleanup = is_function(result) ? result : noop;
              }
          };
          const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
              values[i] = value;
              pending &= ~(1 << i);
              if (inited) {
                  sync();
              }
          }, () => {
              pending |= (1 << i);
          }));
          inited = true;
          sync();
          return function stop() {
              run_all(unsubscribers);
              cleanup();
          };
      });
  }

  const LOCATION = {};
  const ROUTER = {};

  /**
   * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
   *
   * https://github.com/reach/router/blob/master/LICENSE
   * */

  function getLocation(source) {
    return {
      ...source.location,
      state: source.history.state,
      key: (source.history.state && source.history.state.key) || "initial"
    };
  }

  function createHistory(source, options) {
    const listeners = [];
    let location = getLocation(source);

    return {
      get location() {
        return location;
      },

      listen(listener) {
        listeners.push(listener);

        const popstateListener = () => {
          location = getLocation(source);
          listener({ location, action: "POP" });
        };

        source.addEventListener("popstate", popstateListener);

        return () => {
          source.removeEventListener("popstate", popstateListener);

          const index = listeners.indexOf(listener);
          listeners.splice(index, 1);
        };
      },

      navigate(to, { state, replace = false } = {}) {
        state = { ...state, key: Date.now() + "" };
        // try...catch iOS Safari limits to 100 pushState calls
        try {
          if (replace) {
            source.history.replaceState(state, null, to);
          } else {
            source.history.pushState(state, null, to);
          }
        } catch (e) {
          source.location[replace ? "replace" : "assign"](to);
        }

        location = getLocation(source);
        listeners.forEach(listener => listener({ location, action: "PUSH" }));
      }
    };
  }

  // Stores history entries in memory for testing or other platforms like Native
  function createMemorySource(initialPathname = "/") {
    let index = 0;
    const stack = [{ pathname: initialPathname, search: "" }];
    const states = [];

    return {
      get location() {
        return stack[index];
      },
      addEventListener(name, fn) {},
      removeEventListener(name, fn) {},
      history: {
        get entries() {
          return stack;
        },
        get index() {
          return index;
        },
        get state() {
          return states[index];
        },
        pushState(state, _, uri) {
          const [pathname, search = ""] = uri.split("?");
          index++;
          stack.push({ pathname, search });
          states.push(state);
        },
        replaceState(state, _, uri) {
          const [pathname, search = ""] = uri.split("?");
          stack[index] = { pathname, search };
          states[index] = state;
        }
      }
    };
  }

  // Global history uses window.history as the source if available,
  // otherwise a memory history
  const canUseDOM = Boolean(
    typeof window !== "undefined" &&
      window.document &&
      window.document.createElement
  );
  const globalHistory = createHistory(canUseDOM ? window : createMemorySource());

  /**
   * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
   *
   * https://github.com/reach/router/blob/master/LICENSE
   * */

  const paramRe = /^:(.+)/;

  const SEGMENT_POINTS = 4;
  const STATIC_POINTS = 3;
  const DYNAMIC_POINTS = 2;
  const SPLAT_PENALTY = 1;
  const ROOT_POINTS = 1;

  /**
   * Check if `segment` is a root segment
   * @param {string} segment
   * @return {boolean}
   */
  function isRootSegment(segment) {
    return segment === "";
  }

  /**
   * Check if `segment` is a dynamic segment
   * @param {string} segment
   * @return {boolean}
   */
  function isDynamic(segment) {
    return paramRe.test(segment);
  }

  /**
   * Check if `segment` is a splat
   * @param {string} segment
   * @return {boolean}
   */
  function isSplat(segment) {
    return segment[0] === "*";
  }

  /**
   * Split up the URI into segments delimited by `/`
   * @param {string} uri
   * @return {string[]}
   */
  function segmentize(uri) {
    return (
      uri
        // Strip starting/ending `/`
        .replace(/(^\/+|\/+$)/g, "")
        .split("/")
    );
  }

  /**
   * Strip `str` of potential start and end `/`
   * @param {string} str
   * @return {string}
   */
  function stripSlashes(str) {
    return str.replace(/(^\/+|\/+$)/g, "");
  }

  /**
   * Score a route depending on how its individual segments look
   * @param {object} route
   * @param {number} index
   * @return {object}
   */
  function rankRoute(route, index) {
    const score = route.default
      ? 0
      : segmentize(route.path).reduce((score, segment) => {
          score += SEGMENT_POINTS;

          if (isRootSegment(segment)) {
            score += ROOT_POINTS;
          } else if (isDynamic(segment)) {
            score += DYNAMIC_POINTS;
          } else if (isSplat(segment)) {
            score -= SEGMENT_POINTS + SPLAT_PENALTY;
          } else {
            score += STATIC_POINTS;
          }

          return score;
        }, 0);

    return { route, score, index };
  }

  /**
   * Give a score to all routes and sort them on that
   * @param {object[]} routes
   * @return {object[]}
   */
  function rankRoutes(routes) {
    return (
      routes
        .map(rankRoute)
        // If two routes have the exact same score, we go by index instead
        .sort((a, b) =>
          a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
        )
    );
  }

  /**
   * Ranks and picks the best route to match. Each segment gets the highest
   * amount of points, then the type of segment gets an additional amount of
   * points where
   *
   *  static > dynamic > splat > root
   *
   * This way we don't have to worry about the order of our routes, let the
   * computers do it.
   *
   * A route looks like this
   *
   *  { path, default, value }
   *
   * And a returned match looks like:
   *
   *  { route, params, uri }
   *
   * @param {object[]} routes
   * @param {string} uri
   * @return {?object}
   */
  function pick(routes, uri) {
    let match;
    let default_;

    const [uriPathname] = uri.split("?");
    const uriSegments = segmentize(uriPathname);
    const isRootUri = uriSegments[0] === "";
    const ranked = rankRoutes(routes);

    for (let i = 0, l = ranked.length; i < l; i++) {
      const route = ranked[i].route;
      let missed = false;

      if (route.default) {
        default_ = {
          route,
          params: {},
          uri
        };
        continue;
      }

      const routeSegments = segmentize(route.path);
      const params = {};
      const max = Math.max(uriSegments.length, routeSegments.length);
      let index = 0;

      for (; index < max; index++) {
        const routeSegment = routeSegments[index];
        const uriSegment = uriSegments[index];

        if (routeSegment !== undefined && isSplat(routeSegment)) {
          // Hit a splat, just grab the rest, and return a match
          // uri:   /files/documents/work
          // route: /files/* or /files/*splatname
          const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

          params[splatName] = uriSegments
            .slice(index)
            .map(decodeURIComponent)
            .join("/");
          break;
        }

        if (uriSegment === undefined) {
          // URI is shorter than the route, no match
          // uri:   /users
          // route: /users/:userId
          missed = true;
          break;
        }

        let dynamicMatch = paramRe.exec(routeSegment);

        if (dynamicMatch && !isRootUri) {
          const value = decodeURIComponent(uriSegment);
          params[dynamicMatch[1]] = value;
        } else if (routeSegment !== uriSegment) {
          // Current segments don't match, not dynamic, not splat, so no match
          // uri:   /users/123/settings
          // route: /users/:id/profile
          missed = true;
          break;
        }
      }

      if (!missed) {
        match = {
          route,
          params,
          uri: "/" + uriSegments.slice(0, index).join("/")
        };
        break;
      }
    }

    return match || default_ || null;
  }

  /**
   * Check if the `path` matches the `uri`.
   * @param {string} path
   * @param {string} uri
   * @return {?object}
   */
  function match(route, uri) {
    return pick([route], uri);
  }

  /**
   * Combines the `basepath` and the `path` into one path.
   * @param {string} basepath
   * @param {string} path
   */
  function combinePaths(basepath, path) {
    return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
  }

  /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.24.0 */

  function create_fragment$k(ctx) {
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[6].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

  	const block = {
  		c: function create() {
  			if (default_slot) default_slot.c();
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			if (default_slot) {
  				default_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope*/ 32) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$k.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$k($$self, $$props, $$invalidate) {
  	let $base;
  	let $location;
  	let $routes;
  	let { basepath = "/" } = $$props;
  	let { url = null } = $$props;
  	const locationContext = getContext(LOCATION);
  	const routerContext = getContext(ROUTER);
  	const routes = writable([]);
  	validate_store(routes, "routes");
  	component_subscribe($$self, routes, value => $$invalidate(10, $routes = value));
  	const activeRoute = writable(null);
  	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

  	// If locationContext is not set, this is the topmost Router in the tree.
  	// If the `url` prop is given we force the location to it.
  	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

  	validate_store(location, "location");
  	component_subscribe($$self, location, value => $$invalidate(9, $location = value));

  	// If routerContext is set, the routerBase of the parent Router
  	// will be the base for this Router's descendants.
  	// If routerContext is not set, the path and resolved uri will both
  	// have the value of the basepath prop.
  	const base = routerContext
  	? routerContext.routerBase
  	: writable({ path: basepath, uri: basepath });

  	validate_store(base, "base");
  	component_subscribe($$self, base, value => $$invalidate(8, $base = value));

  	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
  		// If there is no activeRoute, the routerBase will be identical to the base.
  		if (activeRoute === null) {
  			return base;
  		}

  		const { path: basepath } = base;
  		const { route, uri } = activeRoute;

  		// Remove the potential /* or /*splatname from
  		// the end of the child Routes relative paths.
  		const path = route.default
  		? basepath
  		: route.path.replace(/\*.*$/, "");

  		return { path, uri };
  	});

  	function registerRoute(route) {
  		const { path: basepath } = $base;
  		let { path } = route;

  		// We store the original path in the _path property so we can reuse
  		// it when the basepath changes. The only thing that matters is that
  		// the route reference is intact, so mutation is fine.
  		route._path = path;

  		route.path = combinePaths(basepath, path);

  		if (typeof window === "undefined") {
  			// In SSR we should set the activeRoute immediately if it is a match.
  			// If there are more Routes being registered after a match is found,
  			// we just skip them.
  			if (hasActiveRoute) {
  				return;
  			}

  			const matchingRoute = match(route, $location.pathname);

  			if (matchingRoute) {
  				activeRoute.set(matchingRoute);
  				hasActiveRoute = true;
  			}
  		} else {
  			routes.update(rs => {
  				rs.push(route);
  				return rs;
  			});
  		}
  	}

  	function unregisterRoute(route) {
  		routes.update(rs => {
  			const index = rs.indexOf(route);
  			rs.splice(index, 1);
  			return rs;
  		});
  	}

  	if (!locationContext) {
  		// The topmost Router in the tree is responsible for updating
  		// the location store and supplying it through context.
  		onMount(() => {
  			const unlisten = globalHistory.listen(history => {
  				location.set(history.location);
  			});

  			return unlisten;
  		});

  		setContext(LOCATION, location);
  	}

  	setContext(ROUTER, {
  		activeRoute,
  		base,
  		routerBase,
  		registerRoute,
  		unregisterRoute
  	});

  	const writable_props = ["basepath", "url"];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Router", $$slots, ['default']);

  	$$self.$set = $$props => {
  		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
  		if ("url" in $$props) $$invalidate(4, url = $$props.url);
  		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		getContext,
  		setContext,
  		onMount,
  		writable,
  		derived,
  		LOCATION,
  		ROUTER,
  		globalHistory,
  		pick,
  		match,
  		stripSlashes,
  		combinePaths,
  		basepath,
  		url,
  		locationContext,
  		routerContext,
  		routes,
  		activeRoute,
  		hasActiveRoute,
  		location,
  		base,
  		routerBase,
  		registerRoute,
  		unregisterRoute,
  		$base,
  		$location,
  		$routes
  	});

  	$$self.$inject_state = $$props => {
  		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
  		if ("url" in $$props) $$invalidate(4, url = $$props.url);
  		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*$base*/ 256) {
  			// This reactive statement will update all the Routes' path when
  			// the basepath changes.
  			 {
  				const { path: basepath } = $base;

  				routes.update(rs => {
  					rs.forEach(r => r.path = combinePaths(basepath, r._path));
  					return rs;
  				});
  			}
  		}

  		if ($$self.$$.dirty & /*$routes, $location*/ 1536) {
  			// This reactive statement will be run when the Router is created
  			// when there are no Routes and then again the following tick, so it
  			// will not find an active Route in SSR and in the browser it will only
  			// pick an active Route after all Routes have been registered.
  			 {
  				const bestMatch = pick($routes, $location.pathname);
  				activeRoute.set(bestMatch);
  			}
  		}
  	};

  	return [routes, location, base, basepath, url, $$scope, $$slots];
  }

  class Router$1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$k, create_fragment$k, safe_not_equal, { basepath: 3, url: 4 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Router",
  			options,
  			id: create_fragment$k.name
  		});
  	}

  	get basepath() {
  		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set basepath(value) {
  		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get url() {
  		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set url(value) {
  		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.24.0 */

  const get_default_slot_changes = dirty => ({
  	params: dirty & /*routeParams*/ 2,
  	location: dirty & /*$location*/ 16
  });

  const get_default_slot_context = ctx => ({
  	params: /*routeParams*/ ctx[1],
  	location: /*$location*/ ctx[4]
  });

  // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
  function create_if_block$8(ctx) {
  	let current_block_type_index;
  	let if_block;
  	let if_block_anchor;
  	let current;
  	const if_block_creators = [create_if_block_1$6, create_else_block$3];
  	const if_blocks = [];

  	function select_block_type(ctx, dirty) {
  		if (/*component*/ ctx[0] !== null) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	const block = {
  		c: function create() {
  			if_block.c();
  			if_block_anchor = empty$1();
  		},
  		m: function mount(target, anchor) {
  			if_blocks[current_block_type_index].m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			let previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);

  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(ctx, dirty);
  			} else {
  				group_outros();

  				transition_out(if_blocks[previous_block_index], 1, 1, () => {
  					if_blocks[previous_block_index] = null;
  				});

  				check_outros();
  				if_block = if_blocks[current_block_type_index];

  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				}

  				transition_in(if_block, 1);
  				if_block.m(if_block_anchor.parentNode, if_block_anchor);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if_blocks[current_block_type_index].d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$8.name,
  		type: "if",
  		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
  		ctx
  	});

  	return block;
  }

  // (43:2) {:else}
  function create_else_block$3(ctx) {
  	let current;
  	const default_slot_template = /*$$slots*/ ctx[10].default;
  	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

  	const block = {
  		c: function create() {
  			if (default_slot) default_slot.c();
  		},
  		m: function mount(target, anchor) {
  			if (default_slot) {
  				default_slot.m(target, anchor);
  			}

  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			if (default_slot) {
  				if (default_slot.p && dirty & /*$$scope, routeParams, $location*/ 530) {
  					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
  				}
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(default_slot, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(default_slot, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (default_slot) default_slot.d(detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_else_block$3.name,
  		type: "else",
  		source: "(43:2) {:else}",
  		ctx
  	});

  	return block;
  }

  // (41:2) {#if component !== null}
  function create_if_block_1$6(ctx) {
  	let switch_instance;
  	let switch_instance_anchor;
  	let current;

  	const switch_instance_spread_levels = [
  		{ location: /*$location*/ ctx[4] },
  		/*routeParams*/ ctx[1],
  		/*routeProps*/ ctx[2]
  	];

  	var switch_value = /*component*/ ctx[0];

  	function switch_props(ctx) {
  		let switch_instance_props = {};

  		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
  			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
  		}

  		return {
  			props: switch_instance_props,
  			$$inline: true
  		};
  	}

  	if (switch_value) {
  		switch_instance = new switch_value(switch_props());
  	}

  	const block = {
  		c: function create() {
  			if (switch_instance) create_component(switch_instance.$$.fragment);
  			switch_instance_anchor = empty$1();
  		},
  		m: function mount(target, anchor) {
  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert_dev(target, switch_instance_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
  			? get_spread_update(switch_instance_spread_levels, [
  					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
  					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
  					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
  				])
  			: {};

  			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
  				if (switch_instance) {
  					group_outros();
  					const old_component = switch_instance;

  					transition_out(old_component.$$.fragment, 1, 0, () => {
  						destroy_component(old_component, 1);
  					});

  					check_outros();
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props());
  					create_component(switch_instance.$$.fragment);
  					transition_in(switch_instance.$$.fragment, 1);
  					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance.$set(switch_instance_changes);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(switch_instance_anchor);
  			if (switch_instance) destroy_component(switch_instance, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1$6.name,
  		type: "if",
  		source: "(41:2) {#if component !== null}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$l(ctx) {
  	let if_block_anchor;
  	let current;
  	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block$8(ctx);

  	const block = {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty$1();
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert_dev(target, if_block_anchor, anchor);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty & /*$activeRoute*/ 8) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block$8(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);
  			if (detaching) detach_dev(if_block_anchor);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$l.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$l($$self, $$props, $$invalidate) {
  	let $activeRoute;
  	let $location;
  	let { path = "" } = $$props;
  	let { component = null } = $$props;
  	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
  	validate_store(activeRoute, "activeRoute");
  	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
  	const location = getContext(LOCATION);
  	validate_store(location, "location");
  	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

  	const route = {
  		path,
  		// If no path prop is given, this Route will act as the default Route
  		// that is rendered if no other Route in the Router is a match.
  		default: path === ""
  	};

  	let routeParams = {};
  	let routeProps = {};
  	registerRoute(route);

  	// There is no need to unregister Routes in SSR since it will all be
  	// thrown away anyway.
  	if (typeof window !== "undefined") {
  		onDestroy(() => {
  			unregisterRoute(route);
  		});
  	}

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("Route", $$slots, ['default']);

  	$$self.$set = $$new_props => {
  		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
  		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
  		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
  	};

  	$$self.$capture_state = () => ({
  		getContext,
  		onDestroy,
  		ROUTER,
  		LOCATION,
  		path,
  		component,
  		registerRoute,
  		unregisterRoute,
  		activeRoute,
  		location,
  		route,
  		routeParams,
  		routeProps,
  		$activeRoute,
  		$location
  	});

  	$$self.$inject_state = $$new_props => {
  		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
  		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
  		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
  		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
  		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
  			 if ($activeRoute && $activeRoute.route === route) {
  				$$invalidate(1, routeParams = $activeRoute.params);
  			}
  		}

  		 {
  			const { path, component, ...rest } = $$props;
  			$$invalidate(2, routeProps = rest);
  		}
  	};

  	$$props = exclude_internal_props($$props);

  	return [
  		component,
  		routeParams,
  		routeProps,
  		$activeRoute,
  		$location,
  		activeRoute,
  		location,
  		route,
  		path,
  		$$scope,
  		$$slots
  	];
  }

  class Route extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$l, create_fragment$l, safe_not_equal, { path: 8, component: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Route",
  			options,
  			id: create_fragment$l.name
  		});
  	}

  	get path() {
  		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set path(value) {
  		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get component() {
  		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set component(value) {
  		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src\App.svelte generated by Svelte v3.24.0 */

  // (15:2) <Router url="{url}">
  function create_default_slot_1$3(ctx) {
  	let route0;
  	let t0;
  	let route1;
  	let t1;
  	let route2;
  	let current;

  	route0 = new Route({
  			props: { path: "/", component: HomePage },
  			$$inline: true
  		});

  	route1 = new Route({
  			props: { path: "/home", component: HomePage },
  			$$inline: true
  		});

  	route2 = new Route({
  			props: { path: "/index.html", component: HomePage },
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(route0.$$.fragment);
  			t0 = space();
  			create_component(route1.$$.fragment);
  			t1 = space();
  			create_component(route2.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(route0, target, anchor);
  			insert_dev(target, t0, anchor);
  			mount_component(route1, target, anchor);
  			insert_dev(target, t1, anchor);
  			mount_component(route2, target, anchor);
  			current = true;
  		},
  		p: noop,
  		i: function intro(local) {
  			if (current) return;
  			transition_in(route0.$$.fragment, local);
  			transition_in(route1.$$.fragment, local);
  			transition_in(route2.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(route0.$$.fragment, local);
  			transition_out(route1.$$.fragment, local);
  			transition_out(route2.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(route0, detaching);
  			if (detaching) detach_dev(t0);
  			destroy_component(route1, detaching);
  			if (detaching) detach_dev(t1);
  			destroy_component(route2, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot_1$3.name,
  		type: "slot",
  		source: "(15:2) <Router url=\\\"{url}\\\">",
  		ctx
  	});

  	return block;
  }

  // (14:0) <App>
  function create_default_slot$4(ctx) {
  	let router;
  	let current;

  	router = new Router$1({
  			props: {
  				url: /*url*/ ctx[0],
  				$$slots: { default: [create_default_slot_1$3] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	const block = {
  		c: function create() {
  			create_component(router.$$.fragment);
  		},
  		m: function mount(target, anchor) {
  			mount_component(router, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, dirty) {
  			const router_changes = {};

  			if (dirty & /*$$scope*/ 2) {
  				router_changes.$$scope = { dirty, ctx };
  			}

  			router.$set(router_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(router.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(router.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(router, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_default_slot$4.name,
  		type: "slot",
  		source: "(14:0) <App>",
  		ctx
  	});

  	return block;
  }

  function create_fragment$m(ctx) {
  	let app;
  	let t0;
  	let otherstyles;
  	let t1;
  	let marginstyles;
  	let t2;
  	let paddingstyles;
  	let t3;
  	let gridstyles;
  	let current;

  	app = new App({
  			props: {
  				$$slots: { default: [create_default_slot$4] },
  				$$scope: { ctx }
  			},
  			$$inline: true
  		});

  	otherstyles = new OtherStyles({ $$inline: true });
  	marginstyles = new MarginStyles({ $$inline: true });
  	paddingstyles = new PaddingStyles({ $$inline: true });
  	gridstyles = new GridStyles({ $$inline: true });

  	const block = {
  		c: function create() {
  			create_component(app.$$.fragment);
  			t0 = space();
  			create_component(otherstyles.$$.fragment);
  			t1 = space();
  			create_component(marginstyles.$$.fragment);
  			t2 = space();
  			create_component(paddingstyles.$$.fragment);
  			t3 = space();
  			create_component(gridstyles.$$.fragment);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			mount_component(app, target, anchor);
  			insert_dev(target, t0, anchor);
  			mount_component(otherstyles, target, anchor);
  			insert_dev(target, t1, anchor);
  			mount_component(marginstyles, target, anchor);
  			insert_dev(target, t2, anchor);
  			mount_component(paddingstyles, target, anchor);
  			insert_dev(target, t3, anchor);
  			mount_component(gridstyles, target, anchor);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			const app_changes = {};

  			if (dirty & /*$$scope*/ 2) {
  				app_changes.$$scope = { dirty, ctx };
  			}

  			app.$set(app_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(app.$$.fragment, local);
  			transition_in(otherstyles.$$.fragment, local);
  			transition_in(marginstyles.$$.fragment, local);
  			transition_in(paddingstyles.$$.fragment, local);
  			transition_in(gridstyles.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(app.$$.fragment, local);
  			transition_out(otherstyles.$$.fragment, local);
  			transition_out(marginstyles.$$.fragment, local);
  			transition_out(paddingstyles.$$.fragment, local);
  			transition_out(gridstyles.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			destroy_component(app, detaching);
  			if (detaching) detach_dev(t0);
  			destroy_component(otherstyles, detaching);
  			if (detaching) detach_dev(t1);
  			destroy_component(marginstyles, detaching);
  			if (detaching) detach_dev(t2);
  			destroy_component(paddingstyles, detaching);
  			if (detaching) detach_dev(t3);
  			destroy_component(gridstyles, detaching);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$m.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$m($$self, $$props, $$invalidate) {
  	let url = window.location.pathname;
  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
  	});

  	let { $$slots = {}, $$scope } = $$props;
  	validate_slots("App", $$slots, []);

  	$$self.$capture_state = () => ({
  		OtherStyles,
  		MarginStyles,
  		PaddingStyles,
  		GridStyles,
  		Framework7Styles,
  		HomePage,
  		Router: Router$1,
  		Route,
  		App,
  		url
  	});

  	$$self.$inject_state = $$props => {
  		if ("url" in $$props) $$invalidate(0, url = $$props.url);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [url];
  }

  class App_1 extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "App_1",
  			options,
  			id: create_fragment$m.name
  		});
  	}
  }

  // Import Framework7

  // Init F7 Svelte Plugin
  Framework7.use(Plugin);

  // Mount Svelte App
  const app = new App_1({
    target: document.body
  });

}());
//# sourceMappingURL=bundle.js.map
