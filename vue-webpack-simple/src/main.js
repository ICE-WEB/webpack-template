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


//全局状态的双向绑定。主要 用于跨越多个组件之间动态变量的双向绑定。
var store = new Vuex.Store({
	state:{name:'HELLO'},
	mutations:{
		updateName:function(state,val){
			state.name = val;
		}
	}
});


//页面跳转的管理。包括url的管理，静态资源加载的管理，页面渲染的管理。
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
