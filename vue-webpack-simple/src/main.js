import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import routes from 'src/router.js'
import Loading from 'src/components/Loading'
import Navigation from 'src/components/navigation'
import Tabbar from 'src/components/tabbar'

window.Vue = Vue;
Vue.config.ignoredElements = ['gmx-app-title'];

Vue.use(Vuex);
Vue.use(VueRouter);

Vue.use(Loading);
Vue.use(Navigation);
Vue.use(Tabbar);

var store = new Vuex.Store({
	state:{},
	mutations:{}
});


var router = new VueRouter({
	routes,
	mode:'history',//url规则
	scrollBehavior (to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition
		} else {
			return { x: 0, y: 0 }
		}
	}
});

new Vue({
	router,
	store,
}).$mount('#app')
