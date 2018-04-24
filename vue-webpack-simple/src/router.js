import app from 'src/App.vue'
const error = r => require.ensure([],()=>r(require('src/pages/Error.vue')),'error')
const login = r => require.ensure([],()=>r(require('src/pages/Login.vue')),'login')
const register = r => require.ensure([],()=>r(require('src/pages/Register.vue')),'register')

const home = r => require.ensure([],()=>r(require('src/pages/Home.vue')),'home')



export default[{
	path:"/",
	component:app,//顶层路由,对应index.html
	children:[
	 	{
			path:'/',
			redirect:'/login',
		},
		{
			path:'/login',
			component:login,
			meta: {title: '登录'}
		},
		{
			path:'/register',
			component:register,
			meta: {title: '注册'}
		},
		{
			path:'/home',
			component:home,
			meta: {title: '首页'}
		},
		{
			path:'*',
			component:error,
			meta: {title: '404'}
		},
	]
}]