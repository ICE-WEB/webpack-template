webpackJsonp([4],[
/* 0 */
/***/ (function(module, exports) {

/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file.
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  var hook
  if (moduleIdentifier) { // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = injectStyles
  }

  if (hook) {
    var functional = options.functional
    var existing = functional
      ? options.render
      : options.beforeCreate

    if (!functional) {
      // inject component registration as beforeCreate hook
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    } else {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functioal component in vue file
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return existing(h, context)
      }
    }
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),
/* 1 */,
/* 2 */,
/* 3 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/

var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

var listToStyles = __webpack_require__(19)

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}
var options = null
var ssrIdKey = 'data-vue-ssr-id'

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

module.exports = function (parentId, list, _isProduction, _options) {
  isProduction = _isProduction

  options = _options || {}

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[' + ssrIdKey + '~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }
  if (options.ssrId) {
    styleElement.setAttribute(ssrIdKey, obj.id)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["a"] = ({});

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["a"] = ({
	data: function data() {
		return {
			display: false
		};
	},
	created: function created() {
		var that = this;
		window.loading = {};
		window.loading.show = function () {
			that.display = true;
		};
		window.loading.hide = function () {
			that.display = false;
		};
	}
});

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["a"] = ({
	props: ['title', 'icon'],
	computed: {
		name: function name() {
			console.log(this.$store);
			return this.$store.name;
		}
	}
});

/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["a"] = ({
	computed: {
		name: function name() {
			return this.$router.name;
		}
	}
});

/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vuex__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue_router__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_src_router_js__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_src_components_Loading__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_src_components_navigation__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_src_components_tabbar__ = __webpack_require__(31);








window.Vue = __WEBPACK_IMPORTED_MODULE_0_vue___default.a;
__WEBPACK_IMPORTED_MODULE_0_vue___default.a.config.ignoredElements = ['gmx-app-title'];

__WEBPACK_IMPORTED_MODULE_0_vue___default.a.use(__WEBPACK_IMPORTED_MODULE_1_vuex__["default"]);
__WEBPACK_IMPORTED_MODULE_0_vue___default.a.use(__WEBPACK_IMPORTED_MODULE_2_vue_router__["default"]);

__WEBPACK_IMPORTED_MODULE_0_vue___default.a.use(__WEBPACK_IMPORTED_MODULE_4_src_components_Loading__["a" /* default */]);
__WEBPACK_IMPORTED_MODULE_0_vue___default.a.use(__WEBPACK_IMPORTED_MODULE_5_src_components_navigation__["a" /* default */]);
__WEBPACK_IMPORTED_MODULE_0_vue___default.a.use(__WEBPACK_IMPORTED_MODULE_6_src_components_tabbar__["a" /* default */]);

var store = new __WEBPACK_IMPORTED_MODULE_1_vuex__["default"].Store({
	state: { name: 'HELLO' },
	mutations: {
		updaeState: function updaeState(state, val) {
			state.name = val;
		}
	}
});

var router = new __WEBPACK_IMPORTED_MODULE_2_vue_router__["default"]({
	routes: __WEBPACK_IMPORTED_MODULE_3_src_router_js__["a" /* default */],
	mode: 'history', //url规则
	scrollBehavior: function scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		} else {
			return { x: 0, y: 0 };
		}
	}
});

new __WEBPACK_IMPORTED_MODULE_0_vue___default.a({
	router: router,
	store: store
}).$mount('#app');

/***/ }),
/* 13 */,
/* 14 */,
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_src_App_vue__ = __webpack_require__(16);

var error = function error(r) {
	return __webpack_require__.e/* require.ensure */(3).then((function () {
		return r(__webpack_require__(35));
	}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};
var login = function login(r) {
	return __webpack_require__.e/* require.ensure */(1).then((function () {
		return r(__webpack_require__(36));
	}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};
var register = function register(r) {
	return __webpack_require__.e/* require.ensure */(0).then((function () {
		return r(__webpack_require__(37));
	}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};

var home = function home(r) {
	return __webpack_require__.e/* require.ensure */(2).then((function () {
		return r(__webpack_require__(38));
	}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};

/* harmony default export */ __webpack_exports__["a"] = ([{
	path: "/",
	component: __WEBPACK_IMPORTED_MODULE_0_src_App_vue__["a" /* default */], //顶层路由,对应index.html
	children: [{
		path: '/',
		redirect: '/login'
	}, {
		path: '/login',
		component: login,
		meta: { title: '登录' }
	}, {
		path: '/register',
		component: register,
		meta: { title: '注册' }
	}, {
		path: '/home',
		component: home,
		meta: { title: '首页' }
	}, {
		path: '*',
		component: error,
		meta: { title: '404' }
	}]
}]);

/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_App_vue__ = __webpack_require__(8);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_04c2046b_hasScoped_true_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_App_vue__ = __webpack_require__(20);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(17)
}
var normalizeComponent = __webpack_require__(0)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-04c2046b"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_App_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_04c2046b_hasScoped_true_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_App_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src\\App.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-04c2046b", Component.options)
  } else {
    hotAPI.reload("data-v-04c2046b", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["a"] = (Component.exports);


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(18);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(4)("27a760a6", content, false, {});
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../node_modules/_css-loader@0.28.11@css-loader/index.js?sourceMap!../node_modules/_vue-loader@13.7.1@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-04c2046b\",\"scoped\":true,\"hasInlineConfig\":false}!../node_modules/_vue-loader@13.7.1@vue-loader/lib/selector.js?type=styles&index=0!./App.vue", function() {
     var newContent = require("!!../node_modules/_css-loader@0.28.11@css-loader/index.js?sourceMap!../node_modules/_vue-loader@13.7.1@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-04c2046b\",\"scoped\":true,\"hasInlineConfig\":false}!../node_modules/_vue-loader@13.7.1@vue-loader/lib/selector.js?type=styles&index=0!./App.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(true);
// imports


// module
exports.push([module.i, "\nhtml[data-v-04c2046b],body[data-v-04c2046b],.page[data-v-04c2046b]{width: 100%;height: 100%;\n}\r\n\r\n", "", {"version":3,"sources":["F:/web work space/wanliyun.ss/src/src/App.vue"],"names":[],"mappings":";AAgBA,mEAAA,YAAA,aAAA;CAAA","file":"App.vue","sourcesContent":["<template>\r\n  <div class=\"page\">\r\n    <router-view class=\"page-content\"></router-view>\r\n    <loading ref=\"loading\"></loading>\r\n  </div>\r\n</template>\r\n\r\n<script>\r\n\r\n\r\nexport default {\r\n\r\n}\r\n</script>\r\n\r\n<style scoped>\r\nhtml,body,.page{width: 100%;height: 100%;}\r\n\r\n</style>\r\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 19 */
/***/ (function(module, exports) {

/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
module.exports = function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "div",
    { staticClass: "page" },
    [
      _c("router-view", { staticClass: "page-content" }),
      _vm._v(" "),
      _c("loading", { ref: "loading" })
    ],
    1
  )
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-04c2046b", esExports)
  }
}

/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Loading_vue__ = __webpack_require__(22);


var temp = {
    install: function install(Vue) {
        Vue.component('Loading', __WEBPACK_IMPORTED_MODULE_0__Loading_vue__["a" /* default */]);
    }
};

/* harmony default export */ __webpack_exports__["a"] = (temp);

/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_Loading_vue__ = __webpack_require__(9);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_00050c9c_hasScoped_false_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_Loading_vue__ = __webpack_require__(25);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(23)
}
var normalizeComponent = __webpack_require__(0)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = null
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_Loading_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_00050c9c_hasScoped_false_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_Loading_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src\\components\\Loading\\Loading.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-00050c9c", Component.options)
  } else {
    hotAPI.reload("data-v-00050c9c", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["a"] = (Component.exports);


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(24);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(4)("4516c31e", content, false, {});
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../node_modules/_css-loader@0.28.11@css-loader/index.js?sourceMap!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-00050c9c\",\"scoped\":false,\"hasInlineConfig\":false}!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/selector.js?type=styles&index=0!./Loading.vue", function() {
     var newContent = require("!!../../../node_modules/_css-loader@0.28.11@css-loader/index.js?sourceMap!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-00050c9c\",\"scoped\":false,\"hasInlineConfig\":false}!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/selector.js?type=styles&index=0!./Loading.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(true);
// imports


// module
exports.push([module.i, "\n.loading-shadow{position: absolute;left: 0;top: 0;width: 100%;height: 100%;background-color: #000;opacity: 0.5;z-index: 999999999;\n}\n.loading{position: absolute;left: 50%;top: 50%;margin-left: -50px!important;margin-top: -50px!important;\n}\n.spinner { margin: 100px auto; width: 100px; height: 100px; text-align: center; font-size: 10px; z-index: 9999999;\n}\n.spinner > div { margin-left: 5px;background-color: #67CF22; height: 100%; width: 6px; display: inline-block;   -webkit-animation: stretchdelay 1.2s infinite ease-in-out; animation: stretchdelay 1.2s infinite ease-in-out;\n}\n.spinner .rect2 { -webkit-animation-delay: -1.1s; animation-delay: -1.1s;\n}\n.spinner .rect3 { -webkit-animation-delay: -1.0s; animation-delay: -1.0s;\n}\n.spinner .rect4 { -webkit-animation-delay: -0.9s; animation-delay: -0.9s;\n}\n.spinner .rect5 { -webkit-animation-delay: -0.8s; animation-delay: -0.8s;\n}\n@-webkit-keyframes stretchdelay {\n0%, 40%, 100% { -webkit-transform: scaleY(0.4)\n}\n20% { -webkit-transform: scaleY(1.0)\n}\n}\n@keyframes stretchdelay {\n0%, 40%, 100% {     transform: scaleY(0.4);     -webkit-transform: scaleY(0.4);\n}\n20% { transform: scaleY(1.0); -webkit-transform: scaleY(1.0);\n}\n}  \r\n\r\n", "", {"version":3,"sources":["F:/web work space/wanliyun.ss/src/components/Loading/src/components/Loading/Loading.vue"],"names":[],"mappings":";AAoCA,gBAAA,mBAAA,QAAA,OAAA,YAAA,aAAA,uBAAA,aAAA,mBAAA;CAAA;AACA,SAAA,mBAAA,UAAA,SAAA,6BAAA,4BAAA;CAAA;AACA,WAAA,mBAAA,CAAA,aAAA,CAAA,cAAA,CAAA,mBAAA,CAAA,gBAAA,CAAA,iBAAA;CAAA;AACA,iBAAA,iBAAA,0BAAA,CAAA,aAAA,CAAA,WAAA,CAAA,sBAAA,GAAA,0DAAA,CAAA,kDAAA;CAAA;AACA,kBAAA,+BAAA,CAAA,uBAAA;CAAA;AACA,kBAAA,+BAAA,CAAA,uBAAA;CAAA;AACA,kBAAA,+BAAA,CAAA,uBAAA;CAAA;AACA,kBAAA,+BAAA,CAAA,uBAAA;CAAA;AACA;AAAA,gBAAA,8BAAA;CAAA;AAAA,MAAA,8BAAA;CAAA;CAAA;AACA;AAAA,oBAAA,uBAAA,KAAA,+BAAA;CAAA;AAAA,MAAA,uBAAA,CAAA,+BAAA;CAAA;CAAA","file":"Loading.vue","sourcesContent":["<template>\r\n\t<span>\r\n\t\t<div class=\"spinner loading\" :style=\"{'display':display?'block':'none'}\">\r\n\t\t\t<div class=\"rect1\"></div>\r\n\t\t\t<div class=\"rect2\"></div>\r\n\t\t\t<div class=\"rect3\"></div>\r\n\t\t\t<div class=\"rect4\"></div>\r\n\t\t\t<div class=\"rect5\"></div>\r\n\t\t</div>\r\n\t\t<div class=\"loading-shadow\" :style=\"{'display':display?'block':'none'}\"></div>\r\n\t</span>\r\n</template>\r\n\r\n<script>\r\n\r\nexport default {\r\n\tdata:function(){\r\n\t\treturn{\r\n\t\t\tdisplay:false\r\n\t\t}\r\n\t},\r\n\tcreated:function(){\r\n\t\tvar that = this;\r\n\t\twindow.loading = {};\r\n\t\twindow.loading.show = function(){\r\n\t\t\tthat.display = true;\r\n\t\t};\t\r\n\t\twindow.loading.hide = function(){\r\n\t\t\tthat.display = false;\r\n\t\t};\r\n\t},\r\n}\r\n\r\n</script>\r\n\r\n<style>\r\n.loading-shadow{position: absolute;left: 0;top: 0;width: 100%;height: 100%;background-color: #000;opacity: 0.5;z-index: 999999999;}\r\n.loading{position: absolute;left: 50%;top: 50%;margin-left: -50px!important;margin-top: -50px!important;}\r\n.spinner { margin: 100px auto; width: 100px; height: 100px; text-align: center; font-size: 10px; z-index: 9999999; }   \r\n.spinner > div { margin-left: 5px;background-color: #67CF22; height: 100%; width: 6px; display: inline-block;   -webkit-animation: stretchdelay 1.2s infinite ease-in-out; animation: stretchdelay 1.2s infinite ease-in-out; }   \r\n.spinner .rect2 { -webkit-animation-delay: -1.1s; animation-delay: -1.1s; }   \r\n.spinner .rect3 { -webkit-animation-delay: -1.0s; animation-delay: -1.0s; }   \r\n.spinner .rect4 { -webkit-animation-delay: -0.9s; animation-delay: -0.9s; }   \r\n.spinner .rect5 { -webkit-animation-delay: -0.8s; animation-delay: -0.8s; }  \r\n@-webkit-keyframes stretchdelay {   0%, 40%, 100% { -webkit-transform: scaleY(0.4) }    20% { -webkit-transform: scaleY(1.0) } }   \r\n@keyframes stretchdelay { 0%, 40%, 100% {     transform: scaleY(0.4);     -webkit-transform: scaleY(0.4); }  20% { transform: scaleY(1.0); -webkit-transform: scaleY(1.0); } }  \r\n\r\n</style>"],"sourceRoot":""}]);

// exports


/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("span", [
    _c(
      "div",
      {
        staticClass: "spinner loading",
        style: { display: _vm.display ? "block" : "none" }
      },
      [
        _c("div", { staticClass: "rect1" }),
        _vm._v(" "),
        _c("div", { staticClass: "rect2" }),
        _vm._v(" "),
        _c("div", { staticClass: "rect3" }),
        _vm._v(" "),
        _c("div", { staticClass: "rect4" }),
        _vm._v(" "),
        _c("div", { staticClass: "rect5" })
      ]
    ),
    _vm._v(" "),
    _c("div", {
      staticClass: "loading-shadow",
      style: { display: _vm.display ? "block" : "none" }
    })
  ])
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-00050c9c", esExports)
  }
}

/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__navi_vue__ = __webpack_require__(27);


var temp = {
    install: function install(Vue) {
        Vue.component('Navigation', __WEBPACK_IMPORTED_MODULE_0__navi_vue__["a" /* default */]);
    }
};

/* harmony default export */ __webpack_exports__["a"] = (temp);

/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_navi_vue__ = __webpack_require__(10);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_3baee4a4_hasScoped_false_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_navi_vue__ = __webpack_require__(30);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(28)
}
var normalizeComponent = __webpack_require__(0)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = null
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_navi_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_3baee4a4_hasScoped_false_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_navi_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src\\components\\navigation\\navi.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-3baee4a4", Component.options)
  } else {
    hotAPI.reload("data-v-3baee4a4", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["a"] = (Component.exports);


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(29);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(4)("35d7bd25", content, false, {});
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../node_modules/_css-loader@0.28.11@css-loader/index.js?sourceMap!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-3baee4a4\",\"scoped\":false,\"hasInlineConfig\":false}!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/selector.js?type=styles&index=0!./navi.vue", function() {
     var newContent = require("!!../../../node_modules/_css-loader@0.28.11@css-loader/index.js?sourceMap!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-3baee4a4\",\"scoped\":false,\"hasInlineConfig\":false}!../../../node_modules/_vue-loader@13.7.1@vue-loader/lib/selector.js?type=styles&index=0!./navi.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(true);
// imports


// module
exports.push([module.i, "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", "", {"version":3,"sources":[],"names":[],"mappings":"","file":"navi.vue","sourceRoot":""}]);

// exports


/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div", { staticClass: "topbar" }, [
    _c("span", {
      staticClass: "title",
      staticStyle: { "font-size": ".8em" },
      domProps: { textContent: _vm._s(_vm.title) }
    }),
    _vm._v(" "),
    _c("div", [_vm._v(_vm._s(_vm.name))])
  ])
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-3baee4a4", esExports)
  }
}

/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tabbar_vue__ = __webpack_require__(32);


var temp = {
	install: function install(Vue) {
		Vue.component("Tabbar", __WEBPACK_IMPORTED_MODULE_0__tabbar_vue__["a" /* default */]);
	}
};

/* harmony default export */ __webpack_exports__["a"] = (temp);

/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_tabbar_vue__ = __webpack_require__(11);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_46ca45dc_hasScoped_false_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_tabbar_vue__ = __webpack_require__(33);
var disposed = false
var normalizeComponent = __webpack_require__(0)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = null
/* scopeId */
var __vue_scopeId__ = null
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_script_index_0_tabbar_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__node_modules_vue_loader_13_7_1_vue_loader_lib_template_compiler_index_id_data_v_46ca45dc_hasScoped_false_buble_transforms_node_modules_vue_loader_13_7_1_vue_loader_lib_selector_type_template_index_0_tabbar_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src\\components\\tabbar\\tabbar.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-46ca45dc", Component.options)
  } else {
    hotAPI.reload("data-v-46ca45dc", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["a"] = (Component.exports);


/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div", [
    _vm._v("底部栏\r\n\t"),
    _c("div", [_vm._v(_vm._s(_vm.name))])
  ])
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-46ca45dc", esExports)
  }
}

/***/ })
],[12]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9fdnVlLXN0eWxlLWxvYWRlckAzLjEuMkB2dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanMiLCJ3ZWJwYWNrOi8vL3NyYy9BcHAudnVlIiwid2VicGFjazovLy9zcmMvY29tcG9uZW50cy9Mb2FkaW5nL0xvYWRpbmcudnVlIiwid2VicGFjazovLy9zcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uL25hdmkudnVlIiwid2VicGFjazovLy9zcmMvY29tcG9uZW50cy90YWJiYXIvdGFiYmFyLnZ1ZSIsIndlYnBhY2s6Ly8vLi9zcmMvbWFpbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvcm91dGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9BcHAudnVlIiwid2VicGFjazovLy8uL3NyYy9BcHAudnVlPzc2MTEiLCJ3ZWJwYWNrOi8vLy4vc3JjL0FwcC52dWU/YmY0MCIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvX3Z1ZS1zdHlsZS1sb2FkZXJAMy4xLjJAdnVlLXN0eWxlLWxvYWRlci9saWIvbGlzdFRvU3R5bGVzLmpzIiwid2VicGFjazovLy8uL3NyYy9BcHAudnVlP2ZmNTgiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvTG9hZGluZy9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9Mb2FkaW5nL0xvYWRpbmcudnVlIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL0xvYWRpbmcvTG9hZGluZy52dWU/M2Q0NCIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9Mb2FkaW5nL0xvYWRpbmcudnVlPzVhZDYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvTG9hZGluZy9Mb2FkaW5nLnZ1ZT9hM2NlIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL25hdmlnYXRpb24vaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbmF2aWdhdGlvbi9uYXZpLnZ1ZSIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uL25hdmkudnVlP2Q3Y2IiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvbmF2aWdhdGlvbi9uYXZpLnZ1ZT8xZDNhIiwid2VicGFjazovLy8uL3NyYy9jb21wb25lbnRzL25hdmlnYXRpb24vbmF2aS52dWU/N2RjOCIsIndlYnBhY2s6Ly8vLi9zcmMvY29tcG9uZW50cy90YWJiYXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvdGFiYmFyL3RhYmJhci52dWUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbXBvbmVudHMvdGFiYmFyL3RhYmJhci52dWU/YWIyOCJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJWdWUiLCJjb25maWciLCJpZ25vcmVkRWxlbWVudHMiLCJ1c2UiLCJzdG9yZSIsIlZ1ZXgiLCJTdG9yZSIsInN0YXRlIiwibmFtZSIsIm11dGF0aW9ucyIsInVwZGFlU3RhdGUiLCJ2YWwiLCJyb3V0ZXIiLCJyb3V0ZXMiLCJtb2RlIiwic2Nyb2xsQmVoYXZpb3IiLCJ0byIsImZyb20iLCJzYXZlZFBvc2l0aW9uIiwieCIsInkiLCIkbW91bnQiLCJlcnJvciIsInIiLCJyZXF1aXJlIiwibG9naW4iLCJyZWdpc3RlciIsImhvbWUiLCJwYXRoIiwiY29tcG9uZW50IiwiY2hpbGRyZW4iLCJyZWRpcmVjdCIsIm1ldGEiLCJ0aXRsZSIsInRlbXAiLCJpbnN0YWxsIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVEOzs7Ozs7OztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEMiLCJmaWxlIjoibWFpbi43NTMwMGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIF9fVlVFX1NTUl9DT05URVhUX18gKi9cblxuLy8gSU1QT1JUQU5UOiBEbyBOT1QgdXNlIEVTMjAxNSBmZWF0dXJlcyBpbiB0aGlzIGZpbGUuXG4vLyBUaGlzIG1vZHVsZSBpcyBhIHJ1bnRpbWUgdXRpbGl0eSBmb3IgY2xlYW5lciBjb21wb25lbnQgbW9kdWxlIG91dHB1dCBhbmQgd2lsbFxuLy8gYmUgaW5jbHVkZWQgaW4gdGhlIGZpbmFsIHdlYnBhY2sgdXNlciBidW5kbGUuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbm9ybWFsaXplQ29tcG9uZW50IChcbiAgcmF3U2NyaXB0RXhwb3J0cyxcbiAgY29tcGlsZWRUZW1wbGF0ZSxcbiAgZnVuY3Rpb25hbFRlbXBsYXRlLFxuICBpbmplY3RTdHlsZXMsXG4gIHNjb3BlSWQsXG4gIG1vZHVsZUlkZW50aWZpZXIgLyogc2VydmVyIG9ubHkgKi9cbikge1xuICB2YXIgZXNNb2R1bGVcbiAgdmFyIHNjcmlwdEV4cG9ydHMgPSByYXdTY3JpcHRFeHBvcnRzID0gcmF3U2NyaXB0RXhwb3J0cyB8fCB7fVxuXG4gIC8vIEVTNiBtb2R1bGVzIGludGVyb3BcbiAgdmFyIHR5cGUgPSB0eXBlb2YgcmF3U2NyaXB0RXhwb3J0cy5kZWZhdWx0XG4gIGlmICh0eXBlID09PSAnb2JqZWN0JyB8fCB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXNNb2R1bGUgPSByYXdTY3JpcHRFeHBvcnRzXG4gICAgc2NyaXB0RXhwb3J0cyA9IHJhd1NjcmlwdEV4cG9ydHMuZGVmYXVsdFxuICB9XG5cbiAgLy8gVnVlLmV4dGVuZCBjb25zdHJ1Y3RvciBleHBvcnQgaW50ZXJvcFxuICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBzY3JpcHRFeHBvcnRzID09PSAnZnVuY3Rpb24nXG4gICAgPyBzY3JpcHRFeHBvcnRzLm9wdGlvbnNcbiAgICA6IHNjcmlwdEV4cG9ydHNcblxuICAvLyByZW5kZXIgZnVuY3Rpb25zXG4gIGlmIChjb21waWxlZFRlbXBsYXRlKSB7XG4gICAgb3B0aW9ucy5yZW5kZXIgPSBjb21waWxlZFRlbXBsYXRlLnJlbmRlclxuICAgIG9wdGlvbnMuc3RhdGljUmVuZGVyRm5zID0gY29tcGlsZWRUZW1wbGF0ZS5zdGF0aWNSZW5kZXJGbnNcbiAgICBvcHRpb25zLl9jb21waWxlZCA9IHRydWVcbiAgfVxuXG4gIC8vIGZ1bmN0aW9uYWwgdGVtcGxhdGVcbiAgaWYgKGZ1bmN0aW9uYWxUZW1wbGF0ZSkge1xuICAgIG9wdGlvbnMuZnVuY3Rpb25hbCA9IHRydWVcbiAgfVxuXG4gIC8vIHNjb3BlZElkXG4gIGlmIChzY29wZUlkKSB7XG4gICAgb3B0aW9ucy5fc2NvcGVJZCA9IHNjb3BlSWRcbiAgfVxuXG4gIHZhciBob29rXG4gIGlmIChtb2R1bGVJZGVudGlmaWVyKSB7IC8vIHNlcnZlciBidWlsZFxuICAgIGhvb2sgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgICAgLy8gMi4zIGluamVjdGlvblxuICAgICAgY29udGV4dCA9XG4gICAgICAgIGNvbnRleHQgfHwgLy8gY2FjaGVkIGNhbGxcbiAgICAgICAgKHRoaXMuJHZub2RlICYmIHRoaXMuJHZub2RlLnNzckNvbnRleHQpIHx8IC8vIHN0YXRlZnVsXG4gICAgICAgICh0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC4kdm5vZGUgJiYgdGhpcy5wYXJlbnQuJHZub2RlLnNzckNvbnRleHQpIC8vIGZ1bmN0aW9uYWxcbiAgICAgIC8vIDIuMiB3aXRoIHJ1bkluTmV3Q29udGV4dDogdHJ1ZVxuICAgICAgaWYgKCFjb250ZXh0ICYmIHR5cGVvZiBfX1ZVRV9TU1JfQ09OVEVYVF9fICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb250ZXh0ID0gX19WVUVfU1NSX0NPTlRFWFRfX1xuICAgICAgfVxuICAgICAgLy8gaW5qZWN0IGNvbXBvbmVudCBzdHlsZXNcbiAgICAgIGlmIChpbmplY3RTdHlsZXMpIHtcbiAgICAgICAgaW5qZWN0U3R5bGVzLmNhbGwodGhpcywgY29udGV4dClcbiAgICAgIH1cbiAgICAgIC8vIHJlZ2lzdGVyIGNvbXBvbmVudCBtb2R1bGUgaWRlbnRpZmllciBmb3IgYXN5bmMgY2h1bmsgaW5mZXJyZW5jZVxuICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dC5fcmVnaXN0ZXJlZENvbXBvbmVudHMpIHtcbiAgICAgICAgY29udGV4dC5fcmVnaXN0ZXJlZENvbXBvbmVudHMuYWRkKG1vZHVsZUlkZW50aWZpZXIpXG4gICAgICB9XG4gICAgfVxuICAgIC8vIHVzZWQgYnkgc3NyIGluIGNhc2UgY29tcG9uZW50IGlzIGNhY2hlZCBhbmQgYmVmb3JlQ3JlYXRlXG4gICAgLy8gbmV2ZXIgZ2V0cyBjYWxsZWRcbiAgICBvcHRpb25zLl9zc3JSZWdpc3RlciA9IGhvb2tcbiAgfSBlbHNlIGlmIChpbmplY3RTdHlsZXMpIHtcbiAgICBob29rID0gaW5qZWN0U3R5bGVzXG4gIH1cblxuICBpZiAoaG9vaykge1xuICAgIHZhciBmdW5jdGlvbmFsID0gb3B0aW9ucy5mdW5jdGlvbmFsXG4gICAgdmFyIGV4aXN0aW5nID0gZnVuY3Rpb25hbFxuICAgICAgPyBvcHRpb25zLnJlbmRlclxuICAgICAgOiBvcHRpb25zLmJlZm9yZUNyZWF0ZVxuXG4gICAgaWYgKCFmdW5jdGlvbmFsKSB7XG4gICAgICAvLyBpbmplY3QgY29tcG9uZW50IHJlZ2lzdHJhdGlvbiBhcyBiZWZvcmVDcmVhdGUgaG9va1xuICAgICAgb3B0aW9ucy5iZWZvcmVDcmVhdGUgPSBleGlzdGluZ1xuICAgICAgICA/IFtdLmNvbmNhdChleGlzdGluZywgaG9vaylcbiAgICAgICAgOiBbaG9va11cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm9yIHRlbXBsYXRlLW9ubHkgaG90LXJlbG9hZCBiZWNhdXNlIGluIHRoYXQgY2FzZSB0aGUgcmVuZGVyIGZuIGRvZXNuJ3RcbiAgICAgIC8vIGdvIHRocm91Z2ggdGhlIG5vcm1hbGl6ZXJcbiAgICAgIG9wdGlvbnMuX2luamVjdFN0eWxlcyA9IGhvb2tcbiAgICAgIC8vIHJlZ2lzdGVyIGZvciBmdW5jdGlvYWwgY29tcG9uZW50IGluIHZ1ZSBmaWxlXG4gICAgICBvcHRpb25zLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcldpdGhTdHlsZUluamVjdGlvbiAoaCwgY29udGV4dCkge1xuICAgICAgICBob29rLmNhbGwoY29udGV4dClcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nKGgsIGNvbnRleHQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBlc01vZHVsZTogZXNNb2R1bGUsXG4gICAgZXhwb3J0czogc2NyaXB0RXhwb3J0cyxcbiAgICBvcHRpb25zOiBvcHRpb25zXG4gIH1cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplci5qc1xuLy8gbW9kdWxlIGlkID0gMFxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCIvKlxuXHRNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuXHRBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xuLy8gY3NzIGJhc2UgY29kZSwgaW5qZWN0ZWQgYnkgdGhlIGNzcy1sb2FkZXJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXNlU291cmNlTWFwKSB7XG5cdHZhciBsaXN0ID0gW107XG5cblx0Ly8gcmV0dXJuIHRoZSBsaXN0IG9mIG1vZHVsZXMgYXMgY3NzIHN0cmluZ1xuXHRsaXN0LnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG5cdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0XHR2YXIgY29udGVudCA9IGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSwgdXNlU291cmNlTWFwKTtcblx0XHRcdGlmKGl0ZW1bMl0pIHtcblx0XHRcdFx0cmV0dXJuIFwiQG1lZGlhIFwiICsgaXRlbVsyXSArIFwie1wiICsgY29udGVudCArIFwifVwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGNvbnRlbnQ7XG5cdFx0XHR9XG5cdFx0fSkuam9pbihcIlwiKTtcblx0fTtcblxuXHQvLyBpbXBvcnQgYSBsaXN0IG9mIG1vZHVsZXMgaW50byB0aGUgbGlzdFxuXHRsaXN0LmkgPSBmdW5jdGlvbihtb2R1bGVzLCBtZWRpYVF1ZXJ5KSB7XG5cdFx0aWYodHlwZW9mIG1vZHVsZXMgPT09IFwic3RyaW5nXCIpXG5cdFx0XHRtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCBcIlwiXV07XG5cdFx0dmFyIGFscmVhZHlJbXBvcnRlZE1vZHVsZXMgPSB7fTtcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGlkID0gdGhpc1tpXVswXTtcblx0XHRcdGlmKHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIilcblx0XHRcdFx0YWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpZF0gPSB0cnVlO1xuXHRcdH1cblx0XHRmb3IoaSA9IDA7IGkgPCBtb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgaXRlbSA9IG1vZHVsZXNbaV07XG5cdFx0XHQvLyBza2lwIGFscmVhZHkgaW1wb3J0ZWQgbW9kdWxlXG5cdFx0XHQvLyB0aGlzIGltcGxlbWVudGF0aW9uIGlzIG5vdCAxMDAlIHBlcmZlY3QgZm9yIHdlaXJkIG1lZGlhIHF1ZXJ5IGNvbWJpbmF0aW9uc1xuXHRcdFx0Ly8gIHdoZW4gYSBtb2R1bGUgaXMgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXMgd2l0aCBkaWZmZXJlbnQgbWVkaWEgcXVlcmllcy5cblx0XHRcdC8vICBJIGhvcGUgdGhpcyB3aWxsIG5ldmVyIG9jY3VyIChIZXkgdGhpcyB3YXkgd2UgaGF2ZSBzbWFsbGVyIGJ1bmRsZXMpXG5cdFx0XHRpZih0eXBlb2YgaXRlbVswXSAhPT0gXCJudW1iZXJcIiB8fCAhYWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpdGVtWzBdXSkge1xuXHRcdFx0XHRpZihtZWRpYVF1ZXJ5ICYmICFpdGVtWzJdKSB7XG5cdFx0XHRcdFx0aXRlbVsyXSA9IG1lZGlhUXVlcnk7XG5cdFx0XHRcdH0gZWxzZSBpZihtZWRpYVF1ZXJ5KSB7XG5cdFx0XHRcdFx0aXRlbVsyXSA9IFwiKFwiICsgaXRlbVsyXSArIFwiKSBhbmQgKFwiICsgbWVkaWFRdWVyeSArIFwiKVwiO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpc3QucHVzaChpdGVtKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHJldHVybiBsaXN0O1xufTtcblxuZnVuY3Rpb24gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtLCB1c2VTb3VyY2VNYXApIHtcblx0dmFyIGNvbnRlbnQgPSBpdGVtWzFdIHx8ICcnO1xuXHR2YXIgY3NzTWFwcGluZyA9IGl0ZW1bM107XG5cdGlmICghY3NzTWFwcGluZykge1xuXHRcdHJldHVybiBjb250ZW50O1xuXHR9XG5cblx0aWYgKHVzZVNvdXJjZU1hcCAmJiB0eXBlb2YgYnRvYSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHZhciBzb3VyY2VNYXBwaW5nID0gdG9Db21tZW50KGNzc01hcHBpbmcpO1xuXHRcdHZhciBzb3VyY2VVUkxzID0gY3NzTWFwcGluZy5zb3VyY2VzLm1hcChmdW5jdGlvbiAoc291cmNlKSB7XG5cdFx0XHRyZXR1cm4gJy8qIyBzb3VyY2VVUkw9JyArIGNzc01hcHBpbmcuc291cmNlUm9vdCArIHNvdXJjZSArICcgKi8nXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gW2NvbnRlbnRdLmNvbmNhdChzb3VyY2VVUkxzKS5jb25jYXQoW3NvdXJjZU1hcHBpbmddKS5qb2luKCdcXG4nKTtcblx0fVxuXG5cdHJldHVybiBbY29udGVudF0uam9pbignXFxuJyk7XG59XG5cbi8vIEFkYXB0ZWQgZnJvbSBjb252ZXJ0LXNvdXJjZS1tYXAgKE1JVClcbmZ1bmN0aW9uIHRvQ29tbWVudChzb3VyY2VNYXApIHtcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5cdHZhciBiYXNlNjQgPSBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpO1xuXHR2YXIgZGF0YSA9ICdzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCwnICsgYmFzZTY0O1xuXG5cdHJldHVybiAnLyojICcgKyBkYXRhICsgJyAqLyc7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXG4vLyBtb2R1bGUgaWQgPSAzXG4vLyBtb2R1bGUgY2h1bmtzID0gNCIsIi8qXG4gIE1JVCBMaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4gIEF1dGhvciBUb2JpYXMgS29wcGVycyBAc29rcmFcbiAgTW9kaWZpZWQgYnkgRXZhbiBZb3UgQHl5eDk5MDgwM1xuKi9cblxudmFyIGhhc0RvY3VtZW50ID0gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJ1xuXG5pZiAodHlwZW9mIERFQlVHICE9PSAndW5kZWZpbmVkJyAmJiBERUJVRykge1xuICBpZiAoIWhhc0RvY3VtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2dWUtc3R5bGUtbG9hZGVyIGNhbm5vdCBiZSB1c2VkIGluIGEgbm9uLWJyb3dzZXIgZW52aXJvbm1lbnQuICcgK1xuICAgIFwiVXNlIHsgdGFyZ2V0OiAnbm9kZScgfSBpbiB5b3VyIFdlYnBhY2sgY29uZmlnIHRvIGluZGljYXRlIGEgc2VydmVyLXJlbmRlcmluZyBlbnZpcm9ubWVudC5cIlxuICApIH1cbn1cblxudmFyIGxpc3RUb1N0eWxlcyA9IHJlcXVpcmUoJy4vbGlzdFRvU3R5bGVzJylcblxuLypcbnR5cGUgU3R5bGVPYmplY3QgPSB7XG4gIGlkOiBudW1iZXI7XG4gIHBhcnRzOiBBcnJheTxTdHlsZU9iamVjdFBhcnQ+XG59XG5cbnR5cGUgU3R5bGVPYmplY3RQYXJ0ID0ge1xuICBjc3M6IHN0cmluZztcbiAgbWVkaWE6IHN0cmluZztcbiAgc291cmNlTWFwOiA/c3RyaW5nXG59XG4qL1xuXG52YXIgc3R5bGVzSW5Eb20gPSB7LypcbiAgW2lkOiBudW1iZXJdOiB7XG4gICAgaWQ6IG51bWJlcixcbiAgICByZWZzOiBudW1iZXIsXG4gICAgcGFydHM6IEFycmF5PChvYmo/OiBTdHlsZU9iamVjdFBhcnQpID0+IHZvaWQ+XG4gIH1cbiovfVxuXG52YXIgaGVhZCA9IGhhc0RvY3VtZW50ICYmIChkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0pXG52YXIgc2luZ2xldG9uRWxlbWVudCA9IG51bGxcbnZhciBzaW5nbGV0b25Db3VudGVyID0gMFxudmFyIGlzUHJvZHVjdGlvbiA9IGZhbHNlXG52YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9XG52YXIgb3B0aW9ucyA9IG51bGxcbnZhciBzc3JJZEtleSA9ICdkYXRhLXZ1ZS1zc3ItaWQnXG5cbi8vIEZvcmNlIHNpbmdsZS10YWcgc29sdXRpb24gb24gSUU2LTksIHdoaWNoIGhhcyBhIGhhcmQgbGltaXQgb24gdGhlICMgb2YgPHN0eWxlPlxuLy8gdGFncyBpdCB3aWxsIGFsbG93IG9uIGEgcGFnZVxudmFyIGlzT2xkSUUgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiAvbXNpZSBbNi05XVxcYi8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBhcmVudElkLCBsaXN0LCBfaXNQcm9kdWN0aW9uLCBfb3B0aW9ucykge1xuICBpc1Byb2R1Y3Rpb24gPSBfaXNQcm9kdWN0aW9uXG5cbiAgb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9XG5cbiAgdmFyIHN0eWxlcyA9IGxpc3RUb1N0eWxlcyhwYXJlbnRJZCwgbGlzdClcbiAgYWRkU3R5bGVzVG9Eb20oc3R5bGVzKVxuXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKG5ld0xpc3QpIHtcbiAgICB2YXIgbWF5UmVtb3ZlID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBzdHlsZXNbaV1cbiAgICAgIHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdXG4gICAgICBkb21TdHlsZS5yZWZzLS1cbiAgICAgIG1heVJlbW92ZS5wdXNoKGRvbVN0eWxlKVxuICAgIH1cbiAgICBpZiAobmV3TGlzdCkge1xuICAgICAgc3R5bGVzID0gbGlzdFRvU3R5bGVzKHBhcmVudElkLCBuZXdMaXN0KVxuICAgICAgYWRkU3R5bGVzVG9Eb20oc3R5bGVzKVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMgPSBbXVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heVJlbW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRvbVN0eWxlID0gbWF5UmVtb3ZlW2ldXG4gICAgICBpZiAoZG9tU3R5bGUucmVmcyA9PT0gMCkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRvbVN0eWxlLnBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgZG9tU3R5bGUucGFydHNbal0oKVxuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBzdHlsZXNJbkRvbVtkb21TdHlsZS5pZF1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkU3R5bGVzVG9Eb20gKHN0eWxlcyAvKiBBcnJheTxTdHlsZU9iamVjdD4gKi8pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IHN0eWxlc1tpXVxuICAgIHZhciBkb21TdHlsZSA9IHN0eWxlc0luRG9tW2l0ZW0uaWRdXG4gICAgaWYgKGRvbVN0eWxlKSB7XG4gICAgICBkb21TdHlsZS5yZWZzKytcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZG9tU3R5bGUucGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgZG9tU3R5bGUucGFydHNbal0oaXRlbS5wYXJ0c1tqXSlcbiAgICAgIH1cbiAgICAgIGZvciAoOyBqIDwgaXRlbS5wYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBkb21TdHlsZS5wYXJ0cy5wdXNoKGFkZFN0eWxlKGl0ZW0ucGFydHNbal0pKVxuICAgICAgfVxuICAgICAgaWYgKGRvbVN0eWxlLnBhcnRzLmxlbmd0aCA+IGl0ZW0ucGFydHMubGVuZ3RoKSB7XG4gICAgICAgIGRvbVN0eWxlLnBhcnRzLmxlbmd0aCA9IGl0ZW0ucGFydHMubGVuZ3RoXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwYXJ0cyA9IFtdXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGl0ZW0ucGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgcGFydHMucHVzaChhZGRTdHlsZShpdGVtLnBhcnRzW2pdKSlcbiAgICAgIH1cbiAgICAgIHN0eWxlc0luRG9tW2l0ZW0uaWRdID0geyBpZDogaXRlbS5pZCwgcmVmczogMSwgcGFydHM6IHBhcnRzIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU3R5bGVFbGVtZW50ICgpIHtcbiAgdmFyIHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgc3R5bGVFbGVtZW50LnR5cGUgPSAndGV4dC9jc3MnXG4gIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbGVtZW50KVxuICByZXR1cm4gc3R5bGVFbGVtZW50XG59XG5cbmZ1bmN0aW9uIGFkZFN0eWxlIChvYmogLyogU3R5bGVPYmplY3RQYXJ0ICovKSB7XG4gIHZhciB1cGRhdGUsIHJlbW92ZVxuICB2YXIgc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc3R5bGVbJyArIHNzcklkS2V5ICsgJ349XCInICsgb2JqLmlkICsgJ1wiXScpXG5cbiAgaWYgKHN0eWxlRWxlbWVudCkge1xuICAgIGlmIChpc1Byb2R1Y3Rpb24pIHtcbiAgICAgIC8vIGhhcyBTU1Igc3R5bGVzIGFuZCBpbiBwcm9kdWN0aW9uIG1vZGUuXG4gICAgICAvLyBzaW1wbHkgZG8gbm90aGluZy5cbiAgICAgIHJldHVybiBub29wXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGhhcyBTU1Igc3R5bGVzIGJ1dCBpbiBkZXYgbW9kZS5cbiAgICAgIC8vIGZvciBzb21lIHJlYXNvbiBDaHJvbWUgY2FuJ3QgaGFuZGxlIHNvdXJjZSBtYXAgaW4gc2VydmVyLXJlbmRlcmVkXG4gICAgICAvLyBzdHlsZSB0YWdzIC0gc291cmNlIG1hcHMgaW4gPHN0eWxlPiBvbmx5IHdvcmtzIGlmIHRoZSBzdHlsZSB0YWcgaXNcbiAgICAgIC8vIGNyZWF0ZWQgYW5kIGluc2VydGVkIGR5bmFtaWNhbGx5LiBTbyB3ZSByZW1vdmUgdGhlIHNlcnZlciByZW5kZXJlZFxuICAgICAgLy8gc3R5bGVzIGFuZCBpbmplY3QgbmV3IG9uZXMuXG4gICAgICBzdHlsZUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzdHlsZUVsZW1lbnQpXG4gICAgfVxuICB9XG5cbiAgaWYgKGlzT2xkSUUpIHtcbiAgICAvLyB1c2Ugc2luZ2xldG9uIG1vZGUgZm9yIElFOS5cbiAgICB2YXIgc3R5bGVJbmRleCA9IHNpbmdsZXRvbkNvdW50ZXIrK1xuICAgIHN0eWxlRWxlbWVudCA9IHNpbmdsZXRvbkVsZW1lbnQgfHwgKHNpbmdsZXRvbkVsZW1lbnQgPSBjcmVhdGVTdHlsZUVsZW1lbnQoKSlcbiAgICB1cGRhdGUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGVFbGVtZW50LCBzdHlsZUluZGV4LCBmYWxzZSlcbiAgICByZW1vdmUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGVFbGVtZW50LCBzdHlsZUluZGV4LCB0cnVlKVxuICB9IGVsc2Uge1xuICAgIC8vIHVzZSBtdWx0aS1zdHlsZS10YWcgbW9kZSBpbiBhbGwgb3RoZXIgY2FzZXNcbiAgICBzdHlsZUVsZW1lbnQgPSBjcmVhdGVTdHlsZUVsZW1lbnQoKVxuICAgIHVwZGF0ZSA9IGFwcGx5VG9UYWcuYmluZChudWxsLCBzdHlsZUVsZW1lbnQpXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgc3R5bGVFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc3R5bGVFbGVtZW50KVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZShvYmopXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlIChuZXdPYmogLyogU3R5bGVPYmplY3RQYXJ0ICovKSB7XG4gICAgaWYgKG5ld09iaikge1xuICAgICAgaWYgKG5ld09iai5jc3MgPT09IG9iai5jc3MgJiZcbiAgICAgICAgICBuZXdPYmoubWVkaWEgPT09IG9iai5tZWRpYSAmJlxuICAgICAgICAgIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXApIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB1cGRhdGUob2JqID0gbmV3T2JqKVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmUoKVxuICAgIH1cbiAgfVxufVxuXG52YXIgcmVwbGFjZVRleHQgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgdGV4dFN0b3JlID0gW11cblxuICByZXR1cm4gZnVuY3Rpb24gKGluZGV4LCByZXBsYWNlbWVudCkge1xuICAgIHRleHRTdG9yZVtpbmRleF0gPSByZXBsYWNlbWVudFxuICAgIHJldHVybiB0ZXh0U3RvcmUuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJ1xcbicpXG4gIH1cbn0pKClcblxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyAoc3R5bGVFbGVtZW50LCBpbmRleCwgcmVtb3ZlLCBvYmopIHtcbiAgdmFyIGNzcyA9IHJlbW92ZSA/ICcnIDogb2JqLmNzc1xuXG4gIGlmIChzdHlsZUVsZW1lbnQuc3R5bGVTaGVldCkge1xuICAgIHN0eWxlRWxlbWVudC5zdHlsZVNoZWV0LmNzc1RleHQgPSByZXBsYWNlVGV4dChpbmRleCwgY3NzKVxuICB9IGVsc2Uge1xuICAgIHZhciBjc3NOb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKVxuICAgIHZhciBjaGlsZE5vZGVzID0gc3R5bGVFbGVtZW50LmNoaWxkTm9kZXNcbiAgICBpZiAoY2hpbGROb2Rlc1tpbmRleF0pIHN0eWxlRWxlbWVudC5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSlcbiAgICBpZiAoY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHN0eWxlRWxlbWVudC5pbnNlcnRCZWZvcmUoY3NzTm9kZSwgY2hpbGROb2Rlc1tpbmRleF0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlRWxlbWVudC5hcHBlbmRDaGlsZChjc3NOb2RlKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVRvVGFnIChzdHlsZUVsZW1lbnQsIG9iaikge1xuICB2YXIgY3NzID0gb2JqLmNzc1xuICB2YXIgbWVkaWEgPSBvYmoubWVkaWFcbiAgdmFyIHNvdXJjZU1hcCA9IG9iai5zb3VyY2VNYXBcblxuICBpZiAobWVkaWEpIHtcbiAgICBzdHlsZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdtZWRpYScsIG1lZGlhKVxuICB9XG4gIGlmIChvcHRpb25zLnNzcklkKSB7XG4gICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZShzc3JJZEtleSwgb2JqLmlkKVxuICB9XG5cbiAgaWYgKHNvdXJjZU1hcCkge1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vZGV2dG9vbHMvZG9jcy9qYXZhc2NyaXB0LWRlYnVnZ2luZ1xuICAgIC8vIHRoaXMgbWFrZXMgc291cmNlIG1hcHMgaW5zaWRlIHN0eWxlIHRhZ3Mgd29yayBwcm9wZXJseSBpbiBDaHJvbWVcbiAgICBjc3MgKz0gJ1xcbi8qIyBzb3VyY2VVUkw9JyArIHNvdXJjZU1hcC5zb3VyY2VzWzBdICsgJyAqLydcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNjYwMzg3NVxuICAgIGNzcyArPSAnXFxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCwnICsgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKSArICcgKi8nXG4gIH1cblxuICBpZiAoc3R5bGVFbGVtZW50LnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZUVsZW1lbnQuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzXG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0eWxlRWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICBzdHlsZUVsZW1lbnQucmVtb3ZlQ2hpbGQoc3R5bGVFbGVtZW50LmZpcnN0Q2hpbGQpXG4gICAgfVxuICAgIHN0eWxlRWxlbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKVxuICB9XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9fdnVlLXN0eWxlLWxvYWRlckAzLjEuMkB2dWUtc3R5bGUtbG9hZGVyL2xpYi9hZGRTdHlsZXNDbGllbnQuanNcbi8vIG1vZHVsZSBpZCA9IDRcbi8vIG1vZHVsZSBjaHVua3MgPSA0IiwiPHRlbXBsYXRlPlxyXG4gIDxkaXYgY2xhc3M9XCJwYWdlXCI+XHJcbiAgICA8cm91dGVyLXZpZXcgY2xhc3M9XCJwYWdlLWNvbnRlbnRcIj48L3JvdXRlci12aWV3PlxyXG4gICAgPGxvYWRpbmcgcmVmPVwibG9hZGluZ1wiPjwvbG9hZGluZz5cclxuICA8L2Rpdj5cclxuPC90ZW1wbGF0ZT5cclxuXHJcbjxzY3JpcHQ+XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG5cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxzdHlsZSBzY29wZWQ+XHJcbmh0bWwsYm9keSwucGFnZXt3aWR0aDogMTAwJTtoZWlnaHQ6IDEwMCU7fVxyXG5cclxuPC9zdHlsZT5cclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHNyYy9BcHAudnVlIiwiPHRlbXBsYXRlPlxyXG5cdDxzcGFuPlxyXG5cdFx0PGRpdiBjbGFzcz1cInNwaW5uZXIgbG9hZGluZ1wiIDpzdHlsZT1cInsnZGlzcGxheSc6ZGlzcGxheT8nYmxvY2snOidub25lJ31cIj5cclxuXHRcdFx0PGRpdiBjbGFzcz1cInJlY3QxXCI+PC9kaXY+XHJcblx0XHRcdDxkaXYgY2xhc3M9XCJyZWN0MlwiPjwvZGl2PlxyXG5cdFx0XHQ8ZGl2IGNsYXNzPVwicmVjdDNcIj48L2Rpdj5cclxuXHRcdFx0PGRpdiBjbGFzcz1cInJlY3Q0XCI+PC9kaXY+XHJcblx0XHRcdDxkaXYgY2xhc3M9XCJyZWN0NVwiPjwvZGl2PlxyXG5cdFx0PC9kaXY+XHJcblx0XHQ8ZGl2IGNsYXNzPVwibG9hZGluZy1zaGFkb3dcIiA6c3R5bGU9XCJ7J2Rpc3BsYXknOmRpc3BsYXk/J2Jsb2NrJzonbm9uZSd9XCI+PC9kaXY+XHJcblx0PC9zcGFuPlxyXG48L3RlbXBsYXRlPlxyXG5cclxuPHNjcmlwdD5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuXHRkYXRhOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm57XHJcblx0XHRcdGRpc3BsYXk6ZmFsc2VcclxuXHRcdH1cclxuXHR9LFxyXG5cdGNyZWF0ZWQ6ZnVuY3Rpb24oKXtcclxuXHRcdHZhciB0aGF0ID0gdGhpcztcclxuXHRcdHdpbmRvdy5sb2FkaW5nID0ge307XHJcblx0XHR3aW5kb3cubG9hZGluZy5zaG93ID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0dGhhdC5kaXNwbGF5ID0gdHJ1ZTtcclxuXHRcdH07XHRcclxuXHRcdHdpbmRvdy5sb2FkaW5nLmhpZGUgPSBmdW5jdGlvbigpe1xyXG5cdFx0XHR0aGF0LmRpc3BsYXkgPSBmYWxzZTtcclxuXHRcdH07XHJcblx0fSxcclxufVxyXG5cclxuPC9zY3JpcHQ+XHJcblxyXG48c3R5bGU+XHJcbi5sb2FkaW5nLXNoYWRvd3twb3NpdGlvbjogYWJzb2x1dGU7bGVmdDogMDt0b3A6IDA7d2lkdGg6IDEwMCU7aGVpZ2h0OiAxMDAlO2JhY2tncm91bmQtY29sb3I6ICMwMDA7b3BhY2l0eTogMC41O3otaW5kZXg6IDk5OTk5OTk5OTt9XHJcbi5sb2FkaW5ne3Bvc2l0aW9uOiBhYnNvbHV0ZTtsZWZ0OiA1MCU7dG9wOiA1MCU7bWFyZ2luLWxlZnQ6IC01MHB4IWltcG9ydGFudDttYXJnaW4tdG9wOiAtNTBweCFpbXBvcnRhbnQ7fVxyXG4uc3Bpbm5lciB7IG1hcmdpbjogMTAwcHggYXV0bzsgd2lkdGg6IDEwMHB4OyBoZWlnaHQ6IDEwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGZvbnQtc2l6ZTogMTBweDsgei1pbmRleDogOTk5OTk5OTsgfSAgIFxyXG4uc3Bpbm5lciA+IGRpdiB7IG1hcmdpbi1sZWZ0OiA1cHg7YmFja2dyb3VuZC1jb2xvcjogIzY3Q0YyMjsgaGVpZ2h0OiAxMDAlOyB3aWR0aDogNnB4OyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7ICAgLXdlYmtpdC1hbmltYXRpb246IHN0cmV0Y2hkZWxheSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0OyBhbmltYXRpb246IHN0cmV0Y2hkZWxheSAxLjJzIGluZmluaXRlIGVhc2UtaW4tb3V0OyB9ICAgXHJcbi5zcGlubmVyIC5yZWN0MiB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMS4xczsgYW5pbWF0aW9uLWRlbGF5OiAtMS4xczsgfSAgIFxyXG4uc3Bpbm5lciAucmVjdDMgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7IGFuaW1hdGlvbi1kZWxheTogLTEuMHM7IH0gICBcclxuLnNwaW5uZXIgLnJlY3Q0IHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjlzOyBhbmltYXRpb24tZGVsYXk6IC0wLjlzOyB9ICAgXHJcbi5zcGlubmVyIC5yZWN0NSB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC44czsgYW5pbWF0aW9uLWRlbGF5OiAtMC44czsgfSAgXHJcbkAtd2Via2l0LWtleWZyYW1lcyBzdHJldGNoZGVsYXkgeyAgIDAlLCA0MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDAuNCkgfSAgICAyMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDEuMCkgfSB9ICAgXHJcbkBrZXlmcmFtZXMgc3RyZXRjaGRlbGF5IHsgMCUsIDQwJSwgMTAwJSB7ICAgICB0cmFuc2Zvcm06IHNjYWxlWSgwLjQpOyAgICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgwLjQpOyB9ICAyMCUgeyB0cmFuc2Zvcm06IHNjYWxlWSgxLjApOyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDEuMCk7IH0gfSAgXHJcblxyXG48L3N0eWxlPlxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBzcmMvY29tcG9uZW50cy9Mb2FkaW5nL0xvYWRpbmcudnVlIiwiPHRlbXBsYXRlPlxyXG5cdDxkaXYgY2xhc3M9XCJ0b3BiYXJcIj5cclxuXHRcdDxzcGFuIGNsYXNzPVwidGl0bGVcIiBzdHlsZT1cImZvbnQtc2l6ZTouOGVtXCIgdi10ZXh0PVwidGl0bGVcIj48L3NwYW4+XHJcblx0XHQ8ZGl2Pnt7bmFtZX19PC9kaXY+XHJcblx0PC9kaXY+XHJcbjwvdGVtcGxhdGU+XHJcblxyXG48c2NyaXB0PlxyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG5cdHByb3BzOlsndGl0bGUnLCdpY29uJ10sXHJcblx0Y29tcHV0ZWQ6e1xyXG5cdFx0bmFtZTpmdW5jdGlvbigpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyh0aGlzLiRzdG9yZSk7XHJcblx0XHRcdHJldHVybiB0aGlzLiRzdG9yZS5uYW1lO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuPC9zY3JpcHQ+XHJcblxyXG48c3R5bGU+XHJcblx0XHJcbjwvc3R5bGU+XHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyBzcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uL25hdmkudnVlIiwiPHRlbXBsYXRlPlxyXG48ZGl2PuW6lemDqOagj1xyXG5cdDxkaXY+e3tuYW1lfX08L2Rpdj5cclxuPC9kaXY+XHJcbjwvdGVtcGxhdGU+XHJcblxyXG48c2NyaXB0PlxyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG5cdGNvbXB1dGVkOntcclxuXHRcdG5hbWU6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuJHJvdXRlci5uYW1lO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuPC9zY3JpcHQ+XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHNyYy9jb21wb25lbnRzL3RhYmJhci90YWJiYXIudnVlIiwiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXHJcbmltcG9ydCBWdWV4IGZyb20gJ3Z1ZXgnXHJcbmltcG9ydCBWdWVSb3V0ZXIgZnJvbSAndnVlLXJvdXRlcidcclxuaW1wb3J0IHJvdXRlcyBmcm9tICdzcmMvcm91dGVyLmpzJ1xyXG5pbXBvcnQgTG9hZGluZyBmcm9tICdzcmMvY29tcG9uZW50cy9Mb2FkaW5nJ1xyXG5pbXBvcnQgTmF2aWdhdGlvbiBmcm9tICdzcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uJ1xyXG5pbXBvcnQgVGFiYmFyIGZyb20gJ3NyYy9jb21wb25lbnRzL3RhYmJhcidcclxuXHJcbndpbmRvdy5WdWUgPSBWdWU7XHJcblZ1ZS5jb25maWcuaWdub3JlZEVsZW1lbnRzID0gWydnbXgtYXBwLXRpdGxlJ107XHJcblxyXG5WdWUudXNlKFZ1ZXgpO1xyXG5WdWUudXNlKFZ1ZVJvdXRlcik7XHJcblxyXG5WdWUudXNlKExvYWRpbmcpO1xyXG5WdWUudXNlKE5hdmlnYXRpb24pO1xyXG5WdWUudXNlKFRhYmJhcik7XHJcblxyXG52YXIgc3RvcmUgPSBuZXcgVnVleC5TdG9yZSh7XHJcblx0c3RhdGU6e25hbWU6J0hFTExPJ30sXHJcblx0bXV0YXRpb25zOntcclxuXHRcdHVwZGFlU3RhdGU6ZnVuY3Rpb24oc3RhdGUsdmFsKXtcclxuXHRcdFx0c3RhdGUubmFtZSA9IHZhbDtcclxuXHRcdH1cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcbnZhciByb3V0ZXIgPSBuZXcgVnVlUm91dGVyKHtcclxuXHRyb3V0ZXMsXHJcblx0bW9kZTonaGlzdG9yeScsLy91cmzop4TliJlcclxuXHRzY3JvbGxCZWhhdmlvciAodG8sIGZyb20sIHNhdmVkUG9zaXRpb24pIHtcclxuXHRcdGlmIChzYXZlZFBvc2l0aW9uKSB7XHJcblx0XHRcdHJldHVybiBzYXZlZFBvc2l0aW9uXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4geyB4OiAwLCB5OiAwIH1cclxuXHRcdH1cclxuXHR9XHJcbn0pO1xyXG5cclxubmV3IFZ1ZSh7XHJcblx0cm91dGVyLFxyXG5cdHN0b3JlLFxyXG59KS4kbW91bnQoJyNhcHAnKVxyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbWFpbi5qcyIsImltcG9ydCBhcHAgZnJvbSAnc3JjL0FwcC52dWUnXHJcbmNvbnN0IGVycm9yID0gciA9PiByZXF1aXJlLmVuc3VyZShbXSwoKT0+cihyZXF1aXJlKCdzcmMvcGFnZXMvRXJyb3IudnVlJykpLCdlcnJvcicpXHJcbmNvbnN0IGxvZ2luID0gciA9PiByZXF1aXJlLmVuc3VyZShbXSwoKT0+cihyZXF1aXJlKCdzcmMvcGFnZXMvTG9naW4udnVlJykpLCdsb2dpbicpXHJcbmNvbnN0IHJlZ2lzdGVyID0gciA9PiByZXF1aXJlLmVuc3VyZShbXSwoKT0+cihyZXF1aXJlKCdzcmMvcGFnZXMvUmVnaXN0ZXIudnVlJykpLCdyZWdpc3RlcicpXHJcblxyXG5jb25zdCBob21lID0gciA9PiByZXF1aXJlLmVuc3VyZShbXSwoKT0+cihyZXF1aXJlKCdzcmMvcGFnZXMvSG9tZS52dWUnKSksJ2hvbWUnKVxyXG5cclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdFt7XHJcblx0cGF0aDpcIi9cIixcclxuXHRjb21wb25lbnQ6YXBwLC8v6aG25bGC6Lev55SxLOWvueW6lGluZGV4Lmh0bWxcclxuXHRjaGlsZHJlbjpbXHJcblx0IFx0e1xyXG5cdFx0XHRwYXRoOicvJyxcclxuXHRcdFx0cmVkaXJlY3Q6Jy9sb2dpbicsXHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHRwYXRoOicvbG9naW4nLFxyXG5cdFx0XHRjb21wb25lbnQ6bG9naW4sXHJcblx0XHRcdG1ldGE6IHt0aXRsZTogJ+eZu+W9lSd9XHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHRwYXRoOicvcmVnaXN0ZXInLFxyXG5cdFx0XHRjb21wb25lbnQ6cmVnaXN0ZXIsXHJcblx0XHRcdG1ldGE6IHt0aXRsZTogJ+azqOWGjCd9XHJcblx0XHR9LFxyXG5cdFx0e1xyXG5cdFx0XHRwYXRoOicvaG9tZScsXHJcblx0XHRcdGNvbXBvbmVudDpob21lLFxyXG5cdFx0XHRtZXRhOiB7dGl0bGU6ICfpppbpobUnfVxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0cGF0aDonKicsXHJcblx0XHRcdGNvbXBvbmVudDplcnJvcixcclxuXHRcdFx0bWV0YToge3RpdGxlOiAnNDA0J31cclxuXHRcdH0sXHJcblx0XVxyXG59XVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9yb3V0ZXIuanMiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLWxvYWRlci9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wNGMyMDQ2YlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vQXBwLnZ1ZVwiKVxufVxudmFyIG5vcm1hbGl6ZUNvbXBvbmVudCA9IHJlcXVpcmUoXCIhLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9jb21wb25lbnQtbm9ybWFsaXplclwiKVxuLyogc2NyaXB0ICovXG5leHBvcnQgKiBmcm9tIFwiISFiYWJlbC1sb2FkZXIhLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vQXBwLnZ1ZVwiXG5pbXBvcnQgX192dWVfc2NyaXB0X18gZnJvbSBcIiEhYmFiZWwtbG9hZGVyIS4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL0FwcC52dWVcIlxuLyogdGVtcGxhdGUgKi9cbmltcG9ydCBfX3Z1ZV90ZW1wbGF0ZV9fIGZyb20gXCIhIS4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0wNGMyMDQ2YlxcXCIsXFxcImhhc1Njb3BlZFxcXCI6dHJ1ZSxcXFwiYnVibGVcXFwiOntcXFwidHJhbnNmb3Jtc1xcXCI6e319fSEuLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL0FwcC52dWVcIlxuLyogdGVtcGxhdGUgZnVuY3Rpb25hbCAqL1xudmFyIF9fdnVlX3RlbXBsYXRlX2Z1bmN0aW9uYWxfXyA9IGZhbHNlXG4vKiBzdHlsZXMgKi9cbnZhciBfX3Z1ZV9zdHlsZXNfXyA9IGluamVjdFN0eWxlXG4vKiBzY29wZUlkICovXG52YXIgX192dWVfc2NvcGVJZF9fID0gXCJkYXRhLXYtMDRjMjA0NmJcIlxuLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG52YXIgX192dWVfbW9kdWxlX2lkZW50aWZpZXJfXyA9IG51bGxcbnZhciBDb21wb25lbnQgPSBub3JtYWxpemVDb21wb25lbnQoXG4gIF9fdnVlX3NjcmlwdF9fLFxuICBfX3Z1ZV90ZW1wbGF0ZV9fLFxuICBfX3Z1ZV90ZW1wbGF0ZV9mdW5jdGlvbmFsX18sXG4gIF9fdnVlX3N0eWxlc19fLFxuICBfX3Z1ZV9zY29wZUlkX18sXG4gIF9fdnVlX21vZHVsZV9pZGVudGlmaWVyX19cbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwic3JjXFxcXEFwcC52dWVcIlxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkgeyhmdW5jdGlvbiAoKSB7XG4gIHZhciBob3RBUEkgPSByZXF1aXJlKFwidnVlLWxvYWRlci9ub2RlX21vZHVsZXMvdnVlLWhvdC1yZWxvYWQtYXBpXCIpXG4gIGhvdEFQSS5pbnN0YWxsKHJlcXVpcmUoXCJ2dWVcIiksIGZhbHNlKVxuICBpZiAoIWhvdEFQSS5jb21wYXRpYmxlKSByZXR1cm5cbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAoIW1vZHVsZS5ob3QuZGF0YSkge1xuICAgIGhvdEFQSS5jcmVhdGVSZWNvcmQoXCJkYXRhLXYtMDRjMjA0NmJcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH0gZWxzZSB7XG4gICAgaG90QVBJLnJlbG9hZChcImRhdGEtdi0wNGMyMDQ2YlwiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfVxuICBtb2R1bGUuaG90LmRpc3Bvc2UoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBkaXNwb3NlZCA9IHRydWVcbiAgfSlcbn0pKCl9XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudC5leHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9BcHAudnVlXG4vLyBtb2R1bGUgaWQgPSAxNlxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vbm9kZV9tb2R1bGVzL19jc3MtbG9hZGVyQDAuMjguMTFAY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMDRjMjA0NmJcXFwiLFxcXCJzY29wZWRcXFwiOnRydWUsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6ZmFsc2V9IS4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0FwcC52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vbm9kZV9tb2R1bGVzL192dWUtc3R5bGUtbG9hZGVyQDMuMS4yQHZ1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjI3YTc2MGE2XCIsIGNvbnRlbnQsIGZhbHNlLCB7fSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi9ub2RlX21vZHVsZXMvX2Nzcy1sb2FkZXJAMC4yOC4xMUBjc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wNGMyMDQ2YlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQXBwLnZ1ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgdmFyIG5ld0NvbnRlbnQgPSByZXF1aXJlKFwiISEuLi9ub2RlX21vZHVsZXMvX2Nzcy1sb2FkZXJAMC4yOC4xMUBjc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wNGMyMDQ2YlxcXCIsXFxcInNjb3BlZFxcXCI6dHJ1ZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vQXBwLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvX3Z1ZS1zdHlsZS1sb2FkZXJAMy4xLjJAdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0wNGMyMDQ2YlwiLFwic2NvcGVkXCI6dHJ1ZSxcImhhc0lubGluZUNvbmZpZ1wiOmZhbHNlfSEuL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL3NyYy9BcHAudnVlXG4vLyBtb2R1bGUgaWQgPSAxN1xuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vbm9kZV9tb2R1bGVzL19jc3MtbG9hZGVyQDAuMjguMTFAY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5odG1sW2RhdGEtdi0wNGMyMDQ2Yl0sYm9keVtkYXRhLXYtMDRjMjA0NmJdLC5wYWdlW2RhdGEtdi0wNGMyMDQ2Yl17d2lkdGg6IDEwMCU7aGVpZ2h0OiAxMDAlO1xcbn1cXHJcXG5cXHJcXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiRjovd2ViIHdvcmsgc3BhY2Uvd2FubGl5dW4uc3Mvc3JjL3NyYy9BcHAudnVlXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUFnQkEsbUVBQUEsWUFBQSxhQUFBO0NBQUFcIixcImZpbGVcIjpcIkFwcC52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiPHRlbXBsYXRlPlxcclxcbiAgPGRpdiBjbGFzcz1cXFwicGFnZVxcXCI+XFxyXFxuICAgIDxyb3V0ZXItdmlldyBjbGFzcz1cXFwicGFnZS1jb250ZW50XFxcIj48L3JvdXRlci12aWV3PlxcclxcbiAgICA8bG9hZGluZyByZWY9XFxcImxvYWRpbmdcXFwiPjwvbG9hZGluZz5cXHJcXG4gIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuXFxyXFxuPHNjcmlwdD5cXHJcXG5cXHJcXG5cXHJcXG5leHBvcnQgZGVmYXVsdCB7XFxyXFxuXFxyXFxufVxcclxcbjwvc2NyaXB0PlxcclxcblxcclxcbjxzdHlsZSBzY29wZWQ+XFxyXFxuaHRtbCxib2R5LC5wYWdle3dpZHRoOiAxMDAlO2hlaWdodDogMTAwJTt9XFxyXFxuXFxyXFxuPC9zdHlsZT5cXHJcXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcblxuLy8gZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvX2Nzcy1sb2FkZXJAMC4yOC4xMUBjc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMDRjMjA0NmJcIixcInNjb3BlZFwiOnRydWUsXCJoYXNJbmxpbmVDb25maWdcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zcmMvQXBwLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMThcbi8vIG1vZHVsZSBjaHVua3MgPSA0IiwiLyoqXG4gKiBUcmFuc2xhdGVzIHRoZSBsaXN0IGZvcm1hdCBwcm9kdWNlZCBieSBjc3MtbG9hZGVyIGludG8gc29tZXRoaW5nXG4gKiBlYXNpZXIgdG8gbWFuaXB1bGF0ZS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaXN0VG9TdHlsZXMgKHBhcmVudElkLCBsaXN0KSB7XG4gIHZhciBzdHlsZXMgPSBbXVxuICB2YXIgbmV3U3R5bGVzID0ge31cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgdmFyIGlkID0gaXRlbVswXVxuICAgIHZhciBjc3MgPSBpdGVtWzFdXG4gICAgdmFyIG1lZGlhID0gaXRlbVsyXVxuICAgIHZhciBzb3VyY2VNYXAgPSBpdGVtWzNdXG4gICAgdmFyIHBhcnQgPSB7XG4gICAgICBpZDogcGFyZW50SWQgKyAnOicgKyBpLFxuICAgICAgY3NzOiBjc3MsXG4gICAgICBtZWRpYTogbWVkaWEsXG4gICAgICBzb3VyY2VNYXA6IHNvdXJjZU1hcFxuICAgIH1cbiAgICBpZiAoIW5ld1N0eWxlc1tpZF0pIHtcbiAgICAgIHN0eWxlcy5wdXNoKG5ld1N0eWxlc1tpZF0gPSB7IGlkOiBpZCwgcGFydHM6IFtwYXJ0XSB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdTdHlsZXNbaWRdLnBhcnRzLnB1c2gocGFydClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0eWxlc1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvX3Z1ZS1zdHlsZS1sb2FkZXJAMy4xLjJAdnVlLXN0eWxlLWxvYWRlci9saWIvbGlzdFRvU3R5bGVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxOVxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCJ2YXIgcmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBfdm0gPSB0aGlzXG4gIHZhciBfaCA9IF92bS4kY3JlYXRlRWxlbWVudFxuICB2YXIgX2MgPSBfdm0uX3NlbGYuX2MgfHwgX2hcbiAgcmV0dXJuIF9jKFxuICAgIFwiZGl2XCIsXG4gICAgeyBzdGF0aWNDbGFzczogXCJwYWdlXCIgfSxcbiAgICBbXG4gICAgICBfYyhcInJvdXRlci12aWV3XCIsIHsgc3RhdGljQ2xhc3M6IFwicGFnZS1jb250ZW50XCIgfSksXG4gICAgICBfdm0uX3YoXCIgXCIpLFxuICAgICAgX2MoXCJsb2FkaW5nXCIsIHsgcmVmOiBcImxvYWRpbmdcIiB9KVxuICAgIF0sXG4gICAgMVxuICApXG59XG52YXIgc3RhdGljUmVuZGVyRm5zID0gW11cbnJlbmRlci5fd2l0aFN0cmlwcGVkID0gdHJ1ZVxudmFyIGVzRXhwb3J0cyA9IHsgcmVuZGVyOiByZW5kZXIsIHN0YXRpY1JlbmRlckZuczogc3RhdGljUmVuZGVyRm5zIH1cbmV4cG9ydCBkZWZhdWx0IGVzRXhwb3J0c1xuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICBpZiAobW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgcmVxdWlyZShcInZ1ZS1sb2FkZXIvbm9kZV9tb2R1bGVzL3Z1ZS1ob3QtcmVsb2FkLWFwaVwiKSAgICAgIC5yZXJlbmRlcihcImRhdGEtdi0wNGMyMDQ2YlwiLCBlc0V4cG9ydHMpXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXI/e1wiaWRcIjpcImRhdGEtdi0wNGMyMDQ2YlwiLFwiaGFzU2NvcGVkXCI6dHJ1ZSxcImJ1YmxlXCI6e1widHJhbnNmb3Jtc1wiOnt9fX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3NyYy9BcHAudnVlXG4vLyBtb2R1bGUgaWQgPSAyMFxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCJpbXBvcnQgTG9hZGluZyBmcm9tICcuL0xvYWRpbmcudnVlJ1xyXG5cclxuY29uc3QgdGVtcCA9IHtcclxuICAgIGluc3RhbGw6IGZ1bmN0aW9uKFZ1ZSl7XHJcbiAgICAgICAgVnVlLmNvbXBvbmVudCgnTG9hZGluZycsTG9hZGluZylcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgdGVtcFxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9jb21wb25lbnRzL0xvYWRpbmcvaW5kZXguanMiLCJ2YXIgZGlzcG9zZWQgPSBmYWxzZVxuZnVuY3Rpb24gaW5qZWN0U3R5bGUgKHNzckNvbnRleHQpIHtcbiAgaWYgKGRpc3Bvc2VkKSByZXR1cm5cbiAgcmVxdWlyZShcIiEhdnVlLWxvYWRlci9ub2RlX21vZHVsZXMvdnVlLXN0eWxlLWxvYWRlciFjc3MtbG9hZGVyP3NvdXJjZU1hcCEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4P3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wMDA1MGM5Y1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6ZmFsc2V9IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0xvYWRpbmcudnVlXCIpXG59XG52YXIgbm9ybWFsaXplQ29tcG9uZW50ID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL2NvbXBvbmVudC1ub3JtYWxpemVyXCIpXG4vKiBzY3JpcHQgKi9cbmV4cG9ydCAqIGZyb20gXCIhIWJhYmVsLWxvYWRlciEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi9Mb2FkaW5nLnZ1ZVwiXG5pbXBvcnQgX192dWVfc2NyaXB0X18gZnJvbSBcIiEhYmFiZWwtbG9hZGVyIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL0xvYWRpbmcudnVlXCJcbi8qIHRlbXBsYXRlICovXG5pbXBvcnQgX192dWVfdGVtcGxhdGVfXyBmcm9tIFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtMDAwNTBjOWNcXFwiLFxcXCJoYXNTY29wZWRcXFwiOmZhbHNlLFxcXCJidWJsZVxcXCI6e1xcXCJ0cmFuc2Zvcm1zXFxcIjp7fX19IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vTG9hZGluZy52dWVcIlxuLyogdGVtcGxhdGUgZnVuY3Rpb25hbCAqL1xudmFyIF9fdnVlX3RlbXBsYXRlX2Z1bmN0aW9uYWxfXyA9IGZhbHNlXG4vKiBzdHlsZXMgKi9cbnZhciBfX3Z1ZV9zdHlsZXNfXyA9IGluamVjdFN0eWxlXG4vKiBzY29wZUlkICovXG52YXIgX192dWVfc2NvcGVJZF9fID0gbnVsbFxuLyogbW9kdWxlSWRlbnRpZmllciAoc2VydmVyIG9ubHkpICovXG52YXIgX192dWVfbW9kdWxlX2lkZW50aWZpZXJfXyA9IG51bGxcbnZhciBDb21wb25lbnQgPSBub3JtYWxpemVDb21wb25lbnQoXG4gIF9fdnVlX3NjcmlwdF9fLFxuICBfX3Z1ZV90ZW1wbGF0ZV9fLFxuICBfX3Z1ZV90ZW1wbGF0ZV9mdW5jdGlvbmFsX18sXG4gIF9fdnVlX3N0eWxlc19fLFxuICBfX3Z1ZV9zY29wZUlkX18sXG4gIF9fdnVlX21vZHVsZV9pZGVudGlmaWVyX19cbilcbkNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwic3JjXFxcXGNvbXBvbmVudHNcXFxcTG9hZGluZ1xcXFxMb2FkaW5nLnZ1ZVwiXG5cbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhvdEFQSSA9IHJlcXVpcmUoXCJ2dWUtbG9hZGVyL25vZGVfbW9kdWxlcy92dWUtaG90LXJlbG9hZC1hcGlcIilcbiAgaG90QVBJLmluc3RhbGwocmVxdWlyZShcInZ1ZVwiKSwgZmFsc2UpXG4gIGlmICghaG90QVBJLmNvbXBhdGlibGUpIHJldHVyblxuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghbW9kdWxlLmhvdC5kYXRhKSB7XG4gICAgaG90QVBJLmNyZWF0ZVJlY29yZChcImRhdGEtdi0wMDA1MGM5Y1wiLCBDb21wb25lbnQub3B0aW9ucylcbiAgfSBlbHNlIHtcbiAgICBob3RBUEkucmVsb2FkKFwiZGF0YS12LTAwMDUwYzljXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9XG4gIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbiAoZGF0YSkge1xuICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICB9KVxufSkoKX1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50LmV4cG9ydHNcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vc3JjL2NvbXBvbmVudHMvTG9hZGluZy9Mb2FkaW5nLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjJcbi8vIG1vZHVsZSBjaHVua3MgPSA0IiwiLy8gc3R5bGUtbG9hZGVyOiBBZGRzIHNvbWUgY3NzIHRvIHRoZSBET00gYnkgYWRkaW5nIGEgPHN0eWxlPiB0YWdcblxuLy8gbG9hZCB0aGUgc3R5bGVzXG52YXIgY29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTAwMDUwYzljXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vTG9hZGluZy52dWVcIik7XG5pZih0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbmlmKGNvbnRlbnQubG9jYWxzKSBtb2R1bGUuZXhwb3J0cyA9IGNvbnRlbnQubG9jYWxzO1xuLy8gYWRkIHRoZSBzdHlsZXMgdG8gdGhlIERPTVxudmFyIHVwZGF0ZSA9IHJlcXVpcmUoXCIhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtc3R5bGUtbG9hZGVyQDMuMS4yQHZ1ZS1zdHlsZS1sb2FkZXIvbGliL2FkZFN0eWxlc0NsaWVudC5qc1wiKShcIjQ1MTZjMzFlXCIsIGNvbnRlbnQsIGZhbHNlLCB7fSk7XG4vLyBIb3QgTW9kdWxlIFJlcGxhY2VtZW50XG5pZihtb2R1bGUuaG90KSB7XG4gLy8gV2hlbiB0aGUgc3R5bGVzIGNoYW5nZSwgdXBkYXRlIHRoZSA8c3R5bGU+IHRhZ3NcbiBpZighY29udGVudC5sb2NhbHMpIHtcbiAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX2Nzcy1sb2FkZXJAMC4yOC4xMUBjc3MtbG9hZGVyL2luZGV4LmpzP3NvdXJjZU1hcCEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3N0eWxlLWNvbXBpbGVyL2luZGV4LmpzP3tcXFwidnVlXFxcIjp0cnVlLFxcXCJpZFxcXCI6XFxcImRhdGEtdi0wMDA1MGM5Y1xcXCIsXFxcInNjb3BlZFxcXCI6ZmFsc2UsXFxcImhhc0lubGluZUNvbmZpZ1xcXCI6ZmFsc2V9IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT1zdHlsZXMmaW5kZXg9MCEuL0xvYWRpbmcudnVlXCIsIGZ1bmN0aW9uKCkge1xuICAgICB2YXIgbmV3Q29udGVudCA9IHJlcXVpcmUoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTAwMDUwYzljXFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vTG9hZGluZy52dWVcIik7XG4gICAgIGlmKHR5cGVvZiBuZXdDb250ZW50ID09PSAnc3RyaW5nJykgbmV3Q29udGVudCA9IFtbbW9kdWxlLmlkLCBuZXdDb250ZW50LCAnJ11dO1xuICAgICB1cGRhdGUobmV3Q29udGVudCk7XG4gICB9KTtcbiB9XG4gLy8gV2hlbiB0aGUgbW9kdWxlIGlzIGRpc3Bvc2VkLCByZW1vdmUgdGhlIDxzdHlsZT4gdGFnc1xuIG1vZHVsZS5ob3QuZGlzcG9zZShmdW5jdGlvbigpIHsgdXBkYXRlKCk7IH0pO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL192dWUtc3R5bGUtbG9hZGVyQDMuMS4yQHZ1ZS1zdHlsZS1sb2FkZXIhLi9ub2RlX21vZHVsZXMvX2Nzcy1sb2FkZXJAMC4yOC4xMUBjc3MtbG9hZGVyP3NvdXJjZU1hcCEuL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXI/e1widnVlXCI6dHJ1ZSxcImlkXCI6XCJkYXRhLXYtMDAwNTBjOWNcIixcInNjb3BlZFwiOmZhbHNlLFwiaGFzSW5saW5lQ29uZmlnXCI6ZmFsc2V9IS4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vc3JjL2NvbXBvbmVudHMvTG9hZGluZy9Mb2FkaW5nLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMjNcbi8vIG1vZHVsZSBjaHVua3MgPSA0IiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXIvbGliL2Nzcy1iYXNlLmpzXCIpKHRydWUpO1xuLy8gaW1wb3J0c1xuXG5cbi8vIG1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiXFxuLmxvYWRpbmctc2hhZG93e3Bvc2l0aW9uOiBhYnNvbHV0ZTtsZWZ0OiAwO3RvcDogMDt3aWR0aDogMTAwJTtoZWlnaHQ6IDEwMCU7YmFja2dyb3VuZC1jb2xvcjogIzAwMDtvcGFjaXR5OiAwLjU7ei1pbmRleDogOTk5OTk5OTk5O1xcbn1cXG4ubG9hZGluZ3twb3NpdGlvbjogYWJzb2x1dGU7bGVmdDogNTAlO3RvcDogNTAlO21hcmdpbi1sZWZ0OiAtNTBweCFpbXBvcnRhbnQ7bWFyZ2luLXRvcDogLTUwcHghaW1wb3J0YW50O1xcbn1cXG4uc3Bpbm5lciB7IG1hcmdpbjogMTAwcHggYXV0bzsgd2lkdGg6IDEwMHB4OyBoZWlnaHQ6IDEwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGZvbnQtc2l6ZTogMTBweDsgei1pbmRleDogOTk5OTk5OTtcXG59XFxuLnNwaW5uZXIgPiBkaXYgeyBtYXJnaW4tbGVmdDogNXB4O2JhY2tncm91bmQtY29sb3I6ICM2N0NGMjI7IGhlaWdodDogMTAwJTsgd2lkdGg6IDZweDsgZGlzcGxheTogaW5saW5lLWJsb2NrOyAgIC13ZWJraXQtYW5pbWF0aW9uOiBzdHJldGNoZGVsYXkgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDsgYW5pbWF0aW9uOiBzdHJldGNoZGVsYXkgMS4ycyBpbmZpbml0ZSBlYXNlLWluLW91dDtcXG59XFxuLnNwaW5uZXIgLnJlY3QyIHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0xLjFzOyBhbmltYXRpb24tZGVsYXk6IC0xLjFzO1xcbn1cXG4uc3Bpbm5lciAucmVjdDMgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7IGFuaW1hdGlvbi1kZWxheTogLTEuMHM7XFxufVxcbi5zcGlubmVyIC5yZWN0NCB7IC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAtMC45czsgYW5pbWF0aW9uLWRlbGF5OiAtMC45cztcXG59XFxuLnNwaW5uZXIgLnJlY3Q1IHsgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC0wLjhzOyBhbmltYXRpb24tZGVsYXk6IC0wLjhzO1xcbn1cXG5ALXdlYmtpdC1rZXlmcmFtZXMgc3RyZXRjaGRlbGF5IHtcXG4wJSwgNDAlLCAxMDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgwLjQpXFxufVxcbjIwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMS4wKVxcbn1cXG59XFxuQGtleWZyYW1lcyBzdHJldGNoZGVsYXkge1xcbjAlLCA0MCUsIDEwMCUgeyAgICAgdHJhbnNmb3JtOiBzY2FsZVkoMC40KTsgICAgIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMC40KTtcXG59XFxuMjAlIHsgdHJhbnNmb3JtOiBzY2FsZVkoMS4wKTsgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlWSgxLjApO1xcbn1cXG59ICBcXHJcXG5cXHJcXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wiRjovd2ViIHdvcmsgc3BhY2Uvd2FubGl5dW4uc3Mvc3JjL2NvbXBvbmVudHMvTG9hZGluZy9zcmMvY29tcG9uZW50cy9Mb2FkaW5nL0xvYWRpbmcudnVlXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCI7QUFvQ0EsZ0JBQUEsbUJBQUEsUUFBQSxPQUFBLFlBQUEsYUFBQSx1QkFBQSxhQUFBLG1CQUFBO0NBQUE7QUFDQSxTQUFBLG1CQUFBLFVBQUEsU0FBQSw2QkFBQSw0QkFBQTtDQUFBO0FBQ0EsV0FBQSxtQkFBQSxDQUFBLGFBQUEsQ0FBQSxjQUFBLENBQUEsbUJBQUEsQ0FBQSxnQkFBQSxDQUFBLGlCQUFBO0NBQUE7QUFDQSxpQkFBQSxpQkFBQSwwQkFBQSxDQUFBLGFBQUEsQ0FBQSxXQUFBLENBQUEsc0JBQUEsR0FBQSwwREFBQSxDQUFBLGtEQUFBO0NBQUE7QUFDQSxrQkFBQSwrQkFBQSxDQUFBLHVCQUFBO0NBQUE7QUFDQSxrQkFBQSwrQkFBQSxDQUFBLHVCQUFBO0NBQUE7QUFDQSxrQkFBQSwrQkFBQSxDQUFBLHVCQUFBO0NBQUE7QUFDQSxrQkFBQSwrQkFBQSxDQUFBLHVCQUFBO0NBQUE7QUFDQTtBQUFBLGdCQUFBLDhCQUFBO0NBQUE7QUFBQSxNQUFBLDhCQUFBO0NBQUE7Q0FBQTtBQUNBO0FBQUEsb0JBQUEsdUJBQUEsS0FBQSwrQkFBQTtDQUFBO0FBQUEsTUFBQSx1QkFBQSxDQUFBLCtCQUFBO0NBQUE7Q0FBQVwiLFwiZmlsZVwiOlwiTG9hZGluZy52dWVcIixcInNvdXJjZXNDb250ZW50XCI6W1wiPHRlbXBsYXRlPlxcclxcblxcdDxzcGFuPlxcclxcblxcdFxcdDxkaXYgY2xhc3M9XFxcInNwaW5uZXIgbG9hZGluZ1xcXCIgOnN0eWxlPVxcXCJ7J2Rpc3BsYXknOmRpc3BsYXk/J2Jsb2NrJzonbm9uZSd9XFxcIj5cXHJcXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVxcXCJyZWN0MVxcXCI+PC9kaXY+XFxyXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cXFwicmVjdDJcXFwiPjwvZGl2PlxcclxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XFxcInJlY3QzXFxcIj48L2Rpdj5cXHJcXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVxcXCJyZWN0NFxcXCI+PC9kaXY+XFxyXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cXFwicmVjdDVcXFwiPjwvZGl2PlxcclxcblxcdFxcdDwvZGl2PlxcclxcblxcdFxcdDxkaXYgY2xhc3M9XFxcImxvYWRpbmctc2hhZG93XFxcIiA6c3R5bGU9XFxcInsnZGlzcGxheSc6ZGlzcGxheT8nYmxvY2snOidub25lJ31cXFwiPjwvZGl2PlxcclxcblxcdDwvc3Bhbj5cXHJcXG48L3RlbXBsYXRlPlxcclxcblxcclxcbjxzY3JpcHQ+XFxyXFxuXFxyXFxuZXhwb3J0IGRlZmF1bHQge1xcclxcblxcdGRhdGE6ZnVuY3Rpb24oKXtcXHJcXG5cXHRcXHRyZXR1cm57XFxyXFxuXFx0XFx0XFx0ZGlzcGxheTpmYWxzZVxcclxcblxcdFxcdH1cXHJcXG5cXHR9LFxcclxcblxcdGNyZWF0ZWQ6ZnVuY3Rpb24oKXtcXHJcXG5cXHRcXHR2YXIgdGhhdCA9IHRoaXM7XFxyXFxuXFx0XFx0d2luZG93LmxvYWRpbmcgPSB7fTtcXHJcXG5cXHRcXHR3aW5kb3cubG9hZGluZy5zaG93ID0gZnVuY3Rpb24oKXtcXHJcXG5cXHRcXHRcXHR0aGF0LmRpc3BsYXkgPSB0cnVlO1xcclxcblxcdFxcdH07XFx0XFxyXFxuXFx0XFx0d2luZG93LmxvYWRpbmcuaGlkZSA9IGZ1bmN0aW9uKCl7XFxyXFxuXFx0XFx0XFx0dGhhdC5kaXNwbGF5ID0gZmFsc2U7XFxyXFxuXFx0XFx0fTtcXHJcXG5cXHR9LFxcclxcbn1cXHJcXG5cXHJcXG48L3NjcmlwdD5cXHJcXG5cXHJcXG48c3R5bGU+XFxyXFxuLmxvYWRpbmctc2hhZG93e3Bvc2l0aW9uOiBhYnNvbHV0ZTtsZWZ0OiAwO3RvcDogMDt3aWR0aDogMTAwJTtoZWlnaHQ6IDEwMCU7YmFja2dyb3VuZC1jb2xvcjogIzAwMDtvcGFjaXR5OiAwLjU7ei1pbmRleDogOTk5OTk5OTk5O31cXHJcXG4ubG9hZGluZ3twb3NpdGlvbjogYWJzb2x1dGU7bGVmdDogNTAlO3RvcDogNTAlO21hcmdpbi1sZWZ0OiAtNTBweCFpbXBvcnRhbnQ7bWFyZ2luLXRvcDogLTUwcHghaW1wb3J0YW50O31cXHJcXG4uc3Bpbm5lciB7IG1hcmdpbjogMTAwcHggYXV0bzsgd2lkdGg6IDEwMHB4OyBoZWlnaHQ6IDEwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGZvbnQtc2l6ZTogMTBweDsgei1pbmRleDogOTk5OTk5OTsgfSAgIFxcclxcbi5zcGlubmVyID4gZGl2IHsgbWFyZ2luLWxlZnQ6IDVweDtiYWNrZ3JvdW5kLWNvbG9yOiAjNjdDRjIyOyBoZWlnaHQ6IDEwMCU7IHdpZHRoOiA2cHg7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgICAtd2Via2l0LWFuaW1hdGlvbjogc3RyZXRjaGRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7IGFuaW1hdGlvbjogc3RyZXRjaGRlbGF5IDEuMnMgaW5maW5pdGUgZWFzZS1pbi1vdXQ7IH0gICBcXHJcXG4uc3Bpbm5lciAucmVjdDIgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMXM7IGFuaW1hdGlvbi1kZWxheTogLTEuMXM7IH0gICBcXHJcXG4uc3Bpbm5lciAucmVjdDMgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTEuMHM7IGFuaW1hdGlvbi1kZWxheTogLTEuMHM7IH0gICBcXHJcXG4uc3Bpbm5lciAucmVjdDQgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOXM7IGFuaW1hdGlvbi1kZWxheTogLTAuOXM7IH0gICBcXHJcXG4uc3Bpbm5lciAucmVjdDUgeyAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLTAuOHM7IGFuaW1hdGlvbi1kZWxheTogLTAuOHM7IH0gIFxcclxcbkAtd2Via2l0LWtleWZyYW1lcyBzdHJldGNoZGVsYXkgeyAgIDAlLCA0MCUsIDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDAuNCkgfSAgICAyMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDEuMCkgfSB9ICAgXFxyXFxuQGtleWZyYW1lcyBzdHJldGNoZGVsYXkgeyAwJSwgNDAlLCAxMDAlIHsgICAgIHRyYW5zZm9ybTogc2NhbGVZKDAuNCk7ICAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGVZKDAuNCk7IH0gIDIwJSB7IHRyYW5zZm9ybTogc2NhbGVZKDEuMCk7IC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZVkoMS4wKTsgfSB9ICBcXHJcXG5cXHJcXG48L3N0eWxlPlwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0wMDA1MGM5Y1wiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zcmMvY29tcG9uZW50cy9Mb2FkaW5nL0xvYWRpbmcudnVlXG4vLyBtb2R1bGUgaWQgPSAyNFxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCJ2YXIgcmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBfdm0gPSB0aGlzXG4gIHZhciBfaCA9IF92bS4kY3JlYXRlRWxlbWVudFxuICB2YXIgX2MgPSBfdm0uX3NlbGYuX2MgfHwgX2hcbiAgcmV0dXJuIF9jKFwic3BhblwiLCBbXG4gICAgX2MoXG4gICAgICBcImRpdlwiLFxuICAgICAge1xuICAgICAgICBzdGF0aWNDbGFzczogXCJzcGlubmVyIGxvYWRpbmdcIixcbiAgICAgICAgc3R5bGU6IHsgZGlzcGxheTogX3ZtLmRpc3BsYXkgPyBcImJsb2NrXCIgOiBcIm5vbmVcIiB9XG4gICAgICB9LFxuICAgICAgW1xuICAgICAgICBfYyhcImRpdlwiLCB7IHN0YXRpY0NsYXNzOiBcInJlY3QxXCIgfSksXG4gICAgICAgIF92bS5fdihcIiBcIiksXG4gICAgICAgIF9jKFwiZGl2XCIsIHsgc3RhdGljQ2xhc3M6IFwicmVjdDJcIiB9KSxcbiAgICAgICAgX3ZtLl92KFwiIFwiKSxcbiAgICAgICAgX2MoXCJkaXZcIiwgeyBzdGF0aWNDbGFzczogXCJyZWN0M1wiIH0pLFxuICAgICAgICBfdm0uX3YoXCIgXCIpLFxuICAgICAgICBfYyhcImRpdlwiLCB7IHN0YXRpY0NsYXNzOiBcInJlY3Q0XCIgfSksXG4gICAgICAgIF92bS5fdihcIiBcIiksXG4gICAgICAgIF9jKFwiZGl2XCIsIHsgc3RhdGljQ2xhc3M6IFwicmVjdDVcIiB9KVxuICAgICAgXVxuICAgICksXG4gICAgX3ZtLl92KFwiIFwiKSxcbiAgICBfYyhcImRpdlwiLCB7XG4gICAgICBzdGF0aWNDbGFzczogXCJsb2FkaW5nLXNoYWRvd1wiLFxuICAgICAgc3R5bGU6IHsgZGlzcGxheTogX3ZtLmRpc3BsYXkgPyBcImJsb2NrXCIgOiBcIm5vbmVcIiB9XG4gICAgfSlcbiAgXSlcbn1cbnZhciBzdGF0aWNSZW5kZXJGbnMgPSBbXVxucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG52YXIgZXNFeHBvcnRzID0geyByZW5kZXI6IHJlbmRlciwgc3RhdGljUmVuZGVyRm5zOiBzdGF0aWNSZW5kZXJGbnMgfVxuZXhwb3J0IGRlZmF1bHQgZXNFeHBvcnRzXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICByZXF1aXJlKFwidnVlLWxvYWRlci9ub2RlX21vZHVsZXMvdnVlLWhvdC1yZWxvYWQtYXBpXCIpICAgICAgLnJlcmVuZGVyKFwiZGF0YS12LTAwMDUwYzljXCIsIGVzRXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTAwMDUwYzljXCIsXCJoYXNTY29wZWRcIjpmYWxzZSxcImJ1YmxlXCI6e1widHJhbnNmb3Jtc1wiOnt9fX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3NyYy9jb21wb25lbnRzL0xvYWRpbmcvTG9hZGluZy52dWVcbi8vIG1vZHVsZSBpZCA9IDI1XG4vLyBtb2R1bGUgY2h1bmtzID0gNCIsImltcG9ydCBOYXZpZ2F0aW9uIGZyb20gJy4vbmF2aS52dWUnXHJcblxyXG5jb25zdCB0ZW1wID0ge1xyXG4gICAgaW5zdGFsbDogZnVuY3Rpb24oVnVlKXtcclxuICAgICAgICBWdWUuY29tcG9uZW50KCdOYXZpZ2F0aW9uJyxOYXZpZ2F0aW9uKVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB0ZW1wXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2NvbXBvbmVudHMvbmF2aWdhdGlvbi9pbmRleC5qcyIsInZhciBkaXNwb3NlZCA9IGZhbHNlXG5mdW5jdGlvbiBpbmplY3RTdHlsZSAoc3NyQ29udGV4dCkge1xuICBpZiAoZGlzcG9zZWQpIHJldHVyblxuICByZXF1aXJlKFwiISF2dWUtbG9hZGVyL25vZGVfbW9kdWxlcy92dWUtc3R5bGUtbG9hZGVyIWNzcy1sb2FkZXI/c291cmNlTWFwIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXg/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTNiYWVlNGE0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXN0eWxlcyZpbmRleD0wIS4vbmF2aS52dWVcIilcbn1cbnZhciBub3JtYWxpemVDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIilcbi8qIHNjcmlwdCAqL1xuZXhwb3J0ICogZnJvbSBcIiEhYmFiZWwtbG9hZGVyIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL25hdmkudnVlXCJcbmltcG9ydCBfX3Z1ZV9zY3JpcHRfXyBmcm9tIFwiISFiYWJlbC1sb2FkZXIhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXNjcmlwdCZpbmRleD0wIS4vbmF2aS52dWVcIlxuLyogdGVtcGxhdGUgKi9cbmltcG9ydCBfX3Z1ZV90ZW1wbGF0ZV9fIGZyb20gXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvdGVtcGxhdGUtY29tcGlsZXIvaW5kZXg/e1xcXCJpZFxcXCI6XFxcImRhdGEtdi0zYmFlZTRhNFxcXCIsXFxcImhhc1Njb3BlZFxcXCI6ZmFsc2UsXFxcImJ1YmxlXFxcIjp7XFxcInRyYW5zZm9ybXNcXFwiOnt9fX0hLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvcj90eXBlPXRlbXBsYXRlJmluZGV4PTAhLi9uYXZpLnZ1ZVwiXG4vKiB0ZW1wbGF0ZSBmdW5jdGlvbmFsICovXG52YXIgX192dWVfdGVtcGxhdGVfZnVuY3Rpb25hbF9fID0gZmFsc2Vcbi8qIHN0eWxlcyAqL1xudmFyIF9fdnVlX3N0eWxlc19fID0gaW5qZWN0U3R5bGVcbi8qIHNjb3BlSWQgKi9cbnZhciBfX3Z1ZV9zY29wZUlkX18gPSBudWxsXG4vKiBtb2R1bGVJZGVudGlmaWVyIChzZXJ2ZXIgb25seSkgKi9cbnZhciBfX3Z1ZV9tb2R1bGVfaWRlbnRpZmllcl9fID0gbnVsbFxudmFyIENvbXBvbmVudCA9IG5vcm1hbGl6ZUNvbXBvbmVudChcbiAgX192dWVfc2NyaXB0X18sXG4gIF9fdnVlX3RlbXBsYXRlX18sXG4gIF9fdnVlX3RlbXBsYXRlX2Z1bmN0aW9uYWxfXyxcbiAgX192dWVfc3R5bGVzX18sXG4gIF9fdnVlX3Njb3BlSWRfXyxcbiAgX192dWVfbW9kdWxlX2lkZW50aWZpZXJfX1xuKVxuQ29tcG9uZW50Lm9wdGlvbnMuX19maWxlID0gXCJzcmNcXFxcY29tcG9uZW50c1xcXFxuYXZpZ2F0aW9uXFxcXG5hdmkudnVlXCJcblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1sb2FkZXIvbm9kZV9tb2R1bGVzL3Z1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTNiYWVlNGE0XCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtM2JhZWU0YTRcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9zcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uL25hdmkudnVlXG4vLyBtb2R1bGUgaWQgPSAyN1xuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCIvLyBzdHlsZS1sb2FkZXI6IEFkZHMgc29tZSBjc3MgdG8gdGhlIERPTSBieSBhZGRpbmcgYSA8c3R5bGU+IHRhZ1xuXG4vLyBsb2FkIHRoZSBzdHlsZXNcbnZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL19jc3MtbG9hZGVyQDAuMjguMTFAY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtM2JhZWU0YTRcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOmZhbHNlfSEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9uYXZpLnZ1ZVwiKTtcbmlmKHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJykgY29udGVudCA9IFtbbW9kdWxlLmlkLCBjb250ZW50LCAnJ11dO1xuaWYoY29udGVudC5sb2NhbHMpIG1vZHVsZS5leHBvcnRzID0gY29udGVudC5sb2NhbHM7XG4vLyBhZGQgdGhlIHN0eWxlcyB0byB0aGUgRE9NXG52YXIgdXBkYXRlID0gcmVxdWlyZShcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1zdHlsZS1sb2FkZXJAMy4xLjJAdnVlLXN0eWxlLWxvYWRlci9saWIvYWRkU3R5bGVzQ2xpZW50LmpzXCIpKFwiMzVkN2JkMjVcIiwgY29udGVudCwgZmFsc2UsIHt9KTtcbi8vIEhvdCBNb2R1bGUgUmVwbGFjZW1lbnRcbmlmKG1vZHVsZS5ob3QpIHtcbiAvLyBXaGVuIHRoZSBzdHlsZXMgY2hhbmdlLCB1cGRhdGUgdGhlIDxzdHlsZT4gdGFnc1xuIGlmKCFjb250ZW50LmxvY2Fscykge1xuICAgbW9kdWxlLmhvdC5hY2NlcHQoXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXIvaW5kZXguanM/c291cmNlTWFwIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc3R5bGUtY29tcGlsZXIvaW5kZXguanM/e1xcXCJ2dWVcXFwiOnRydWUsXFxcImlkXFxcIjpcXFwiZGF0YS12LTNiYWVlNGE0XFxcIixcXFwic2NvcGVkXFxcIjpmYWxzZSxcXFwiaGFzSW5saW5lQ29uZmlnXFxcIjpmYWxzZX0hLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zZWxlY3Rvci5qcz90eXBlPXN0eWxlcyZpbmRleD0wIS4vbmF2aS52dWVcIiwgZnVuY3Rpb24oKSB7XG4gICAgIHZhciBuZXdDb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL19jc3MtbG9hZGVyQDAuMjguMTFAY3NzLWxvYWRlci9pbmRleC5qcz9zb3VyY2VNYXAhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlci9pbmRleC5qcz97XFxcInZ1ZVxcXCI6dHJ1ZSxcXFwiaWRcXFwiOlxcXCJkYXRhLXYtM2JhZWU0YTRcXFwiLFxcXCJzY29wZWRcXFwiOmZhbHNlLFxcXCJoYXNJbmxpbmVDb25maWdcXFwiOmZhbHNlfSEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9uYXZpLnZ1ZVwiKTtcbiAgICAgaWYodHlwZW9mIG5ld0NvbnRlbnQgPT09ICdzdHJpbmcnKSBuZXdDb250ZW50ID0gW1ttb2R1bGUuaWQsIG5ld0NvbnRlbnQsICcnXV07XG4gICAgIHVwZGF0ZShuZXdDb250ZW50KTtcbiAgIH0pO1xuIH1cbiAvLyBXaGVuIHRoZSBtb2R1bGUgaXMgZGlzcG9zZWQsIHJlbW92ZSB0aGUgPHN0eWxlPiB0YWdzXG4gbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uKCkgeyB1cGRhdGUoKTsgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvX3Z1ZS1zdHlsZS1sb2FkZXJAMy4xLjJAdnVlLXN0eWxlLWxvYWRlciEuL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0zYmFlZTRhNFwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uL25hdmkudnVlXG4vLyBtb2R1bGUgaWQgPSAyOFxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL19jc3MtbG9hZGVyQDAuMjguMTFAY3NzLWxvYWRlci9saWIvY3NzLWJhc2UuanNcIikodHJ1ZSk7XG4vLyBpbXBvcnRzXG5cblxuLy8gbW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJcXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cXG5cIiwgXCJcIiwge1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwiZmlsZVwiOlwibmF2aS52dWVcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuXG4vLyBleHBvcnRzXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9fY3NzLWxvYWRlckAwLjI4LjExQGNzcy1sb2FkZXI/c291cmNlTWFwIS4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi9zdHlsZS1jb21waWxlcj97XCJ2dWVcIjp0cnVlLFwiaWRcIjpcImRhdGEtdi0zYmFlZTRhNFwiLFwic2NvcGVkXCI6ZmFsc2UsXCJoYXNJbmxpbmVDb25maWdcIjpmYWxzZX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9c3R5bGVzJmluZGV4PTAhLi9zcmMvY29tcG9uZW50cy9uYXZpZ2F0aW9uL25hdmkudnVlXG4vLyBtb2R1bGUgaWQgPSAyOVxuLy8gbW9kdWxlIGNodW5rcyA9IDQiLCJ2YXIgcmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBfdm0gPSB0aGlzXG4gIHZhciBfaCA9IF92bS4kY3JlYXRlRWxlbWVudFxuICB2YXIgX2MgPSBfdm0uX3NlbGYuX2MgfHwgX2hcbiAgcmV0dXJuIF9jKFwiZGl2XCIsIHsgc3RhdGljQ2xhc3M6IFwidG9wYmFyXCIgfSwgW1xuICAgIF9jKFwic3BhblwiLCB7XG4gICAgICBzdGF0aWNDbGFzczogXCJ0aXRsZVwiLFxuICAgICAgc3RhdGljU3R5bGU6IHsgXCJmb250LXNpemVcIjogXCIuOGVtXCIgfSxcbiAgICAgIGRvbVByb3BzOiB7IHRleHRDb250ZW50OiBfdm0uX3MoX3ZtLnRpdGxlKSB9XG4gICAgfSksXG4gICAgX3ZtLl92KFwiIFwiKSxcbiAgICBfYyhcImRpdlwiLCBbX3ZtLl92KF92bS5fcyhfdm0ubmFtZSkpXSlcbiAgXSlcbn1cbnZhciBzdGF0aWNSZW5kZXJGbnMgPSBbXVxucmVuZGVyLl93aXRoU3RyaXBwZWQgPSB0cnVlXG52YXIgZXNFeHBvcnRzID0geyByZW5kZXI6IHJlbmRlciwgc3RhdGljUmVuZGVyRm5zOiBzdGF0aWNSZW5kZXJGbnMgfVxuZXhwb3J0IGRlZmF1bHQgZXNFeHBvcnRzXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmIChtb2R1bGUuaG90LmRhdGEpIHtcbiAgICByZXF1aXJlKFwidnVlLWxvYWRlci9ub2RlX21vZHVsZXMvdnVlLWhvdC1yZWxvYWQtYXBpXCIpICAgICAgLnJlcmVuZGVyKFwiZGF0YS12LTNiYWVlNGE0XCIsIGVzRXhwb3J0cylcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL192dWUtbG9hZGVyQDEzLjcuMUB2dWUtbG9hZGVyL2xpYi90ZW1wbGF0ZS1jb21waWxlcj97XCJpZFwiOlwiZGF0YS12LTNiYWVlNGE0XCIsXCJoYXNTY29wZWRcIjpmYWxzZSxcImJ1YmxlXCI6e1widHJhbnNmb3Jtc1wiOnt9fX0hLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yLmpzP3R5cGU9dGVtcGxhdGUmaW5kZXg9MCEuL3NyYy9jb21wb25lbnRzL25hdmlnYXRpb24vbmF2aS52dWVcbi8vIG1vZHVsZSBpZCA9IDMwXG4vLyBtb2R1bGUgY2h1bmtzID0gNCIsImltcG9ydCBUYWJiYXIgZnJvbSAnLi90YWJiYXIudnVlJ1xyXG5cclxuY29uc3QgdGVtcCA9IHtcclxuXHRpbnN0YWxsOmZ1bmN0aW9uKFZ1ZSl7XHJcblx0XHRWdWUuY29tcG9uZW50KFwiVGFiYmFyXCIsVGFiYmFyKTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHRlbXA7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2NvbXBvbmVudHMvdGFiYmFyL2luZGV4LmpzIiwidmFyIGRpc3Bvc2VkID0gZmFsc2VcbnZhciBub3JtYWxpemVDb21wb25lbnQgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvY29tcG9uZW50LW5vcm1hbGl6ZXJcIilcbi8qIHNjcmlwdCAqL1xuZXhwb3J0ICogZnJvbSBcIiEhYmFiZWwtbG9hZGVyIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT1zY3JpcHQmaW5kZXg9MCEuL3RhYmJhci52dWVcIlxuaW1wb3J0IF9fdnVlX3NjcmlwdF9fIGZyb20gXCIhIWJhYmVsLWxvYWRlciEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3NlbGVjdG9yP3R5cGU9c2NyaXB0JmluZGV4PTAhLi90YWJiYXIudnVlXCJcbi8qIHRlbXBsYXRlICovXG5pbXBvcnQgX192dWVfdGVtcGxhdGVfXyBmcm9tIFwiISEuLi8uLi8uLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyL2luZGV4P3tcXFwiaWRcXFwiOlxcXCJkYXRhLXYtNDZjYTQ1ZGNcXFwiLFxcXCJoYXNTY29wZWRcXFwiOmZhbHNlLFxcXCJidWJsZVxcXCI6e1xcXCJ0cmFuc2Zvcm1zXFxcIjp7fX19IS4uLy4uLy4uL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3I/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vdGFiYmFyLnZ1ZVwiXG4vKiB0ZW1wbGF0ZSBmdW5jdGlvbmFsICovXG52YXIgX192dWVfdGVtcGxhdGVfZnVuY3Rpb25hbF9fID0gZmFsc2Vcbi8qIHN0eWxlcyAqL1xudmFyIF9fdnVlX3N0eWxlc19fID0gbnVsbFxuLyogc2NvcGVJZCAqL1xudmFyIF9fdnVlX3Njb3BlSWRfXyA9IG51bGxcbi8qIG1vZHVsZUlkZW50aWZpZXIgKHNlcnZlciBvbmx5KSAqL1xudmFyIF9fdnVlX21vZHVsZV9pZGVudGlmaWVyX18gPSBudWxsXG52YXIgQ29tcG9uZW50ID0gbm9ybWFsaXplQ29tcG9uZW50KFxuICBfX3Z1ZV9zY3JpcHRfXyxcbiAgX192dWVfdGVtcGxhdGVfXyxcbiAgX192dWVfdGVtcGxhdGVfZnVuY3Rpb25hbF9fLFxuICBfX3Z1ZV9zdHlsZXNfXyxcbiAgX192dWVfc2NvcGVJZF9fLFxuICBfX3Z1ZV9tb2R1bGVfaWRlbnRpZmllcl9fXG4pXG5Db21wb25lbnQub3B0aW9ucy5fX2ZpbGUgPSBcInNyY1xcXFxjb21wb25lbnRzXFxcXHRhYmJhclxcXFx0YWJiYXIudnVlXCJcblxuLyogaG90IHJlbG9hZCAqL1xuaWYgKG1vZHVsZS5ob3QpIHsoZnVuY3Rpb24gKCkge1xuICB2YXIgaG90QVBJID0gcmVxdWlyZShcInZ1ZS1sb2FkZXIvbm9kZV9tb2R1bGVzL3Z1ZS1ob3QtcmVsb2FkLWFwaVwiKVxuICBob3RBUEkuaW5zdGFsbChyZXF1aXJlKFwidnVlXCIpLCBmYWxzZSlcbiAgaWYgKCFob3RBUEkuY29tcGF0aWJsZSkgcmV0dXJuXG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKCFtb2R1bGUuaG90LmRhdGEpIHtcbiAgICBob3RBUEkuY3JlYXRlUmVjb3JkKFwiZGF0YS12LTQ2Y2E0NWRjXCIsIENvbXBvbmVudC5vcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIGhvdEFQSS5yZWxvYWQoXCJkYXRhLXYtNDZjYTQ1ZGNcIiwgQ29tcG9uZW50Lm9wdGlvbnMpXG4gIH1cbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZGlzcG9zZWQgPSB0cnVlXG4gIH0pXG59KSgpfVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnQuZXhwb3J0c1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9zcmMvY29tcG9uZW50cy90YWJiYXIvdGFiYmFyLnZ1ZVxuLy8gbW9kdWxlIGlkID0gMzJcbi8vIG1vZHVsZSBjaHVua3MgPSA0IiwidmFyIHJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgX3ZtID0gdGhpc1xuICB2YXIgX2ggPSBfdm0uJGNyZWF0ZUVsZW1lbnRcbiAgdmFyIF9jID0gX3ZtLl9zZWxmLl9jIHx8IF9oXG4gIHJldHVybiBfYyhcImRpdlwiLCBbXG4gICAgX3ZtLl92KFwi5bqV6YOo5qCPXFxyXFxuXFx0XCIpLFxuICAgIF9jKFwiZGl2XCIsIFtfdm0uX3YoX3ZtLl9zKF92bS5uYW1lKSldKVxuICBdKVxufVxudmFyIHN0YXRpY1JlbmRlckZucyA9IFtdXG5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcbnZhciBlc0V4cG9ydHMgPSB7IHJlbmRlcjogcmVuZGVyLCBzdGF0aWNSZW5kZXJGbnM6IHN0YXRpY1JlbmRlckZucyB9XG5leHBvcnQgZGVmYXVsdCBlc0V4cG9ydHNcbmlmIChtb2R1bGUuaG90KSB7XG4gIG1vZHVsZS5ob3QuYWNjZXB0KClcbiAgaWYgKG1vZHVsZS5ob3QuZGF0YSkge1xuICAgIHJlcXVpcmUoXCJ2dWUtbG9hZGVyL25vZGVfbW9kdWxlcy92dWUtaG90LXJlbG9hZC1hcGlcIikgICAgICAucmVyZW5kZXIoXCJkYXRhLXYtNDZjYTQ1ZGNcIiwgZXNFeHBvcnRzKVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvX3Z1ZS1sb2FkZXJAMTMuNy4xQHZ1ZS1sb2FkZXIvbGliL3RlbXBsYXRlLWNvbXBpbGVyP3tcImlkXCI6XCJkYXRhLXYtNDZjYTQ1ZGNcIixcImhhc1Njb3BlZFwiOmZhbHNlLFwiYnVibGVcIjp7XCJ0cmFuc2Zvcm1zXCI6e319fSEuL25vZGVfbW9kdWxlcy9fdnVlLWxvYWRlckAxMy43LjFAdnVlLWxvYWRlci9saWIvc2VsZWN0b3IuanM/dHlwZT10ZW1wbGF0ZSZpbmRleD0wIS4vc3JjL2NvbXBvbmVudHMvdGFiYmFyL3RhYmJhci52dWVcbi8vIG1vZHVsZSBpZCA9IDMzXG4vLyBtb2R1bGUgY2h1bmtzID0gNCJdLCJzb3VyY2VSb290IjoiIn0=