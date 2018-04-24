<template>
	<span>
		<div class="spinner loading" :style="{'display':display?'block':'none'}">
			<div class="rect1"></div>
			<div class="rect2"></div>
			<div class="rect3"></div>
			<div class="rect4"></div>
			<div class="rect5"></div>
		</div>
		<div class="loading-shadow" :style="{'display':display?'block':'none'}"></div>
	</span>
</template>

<script>

export default {
	data:function(){
		return{
			display:false
		}
	},
	created:function(){
		var that = this;
		window.loading = {};
		window.loading.show = function(){
			that.display = true;
		};	
		window.loading.hide = function(){
			that.display = false;
		};
	},
}

</script>

<style>
.loading-shadow{position: absolute;left: 0;top: 0;width: 100%;height: 100%;background-color: #000;opacity: 0.5;z-index: 999999999;}
.loading{position: absolute;left: 50%;top: 50%;margin-left: -50px!important;margin-top: -50px!important;}
.spinner { margin: 100px auto; width: 100px; height: 100px; text-align: center; font-size: 10px; z-index: 9999999; }   
.spinner > div { margin-left: 5px;background-color: #67CF22; height: 100%; width: 6px; display: inline-block;   -webkit-animation: stretchdelay 1.2s infinite ease-in-out; animation: stretchdelay 1.2s infinite ease-in-out; }   
.spinner .rect2 { -webkit-animation-delay: -1.1s; animation-delay: -1.1s; }   
.spinner .rect3 { -webkit-animation-delay: -1.0s; animation-delay: -1.0s; }   
.spinner .rect4 { -webkit-animation-delay: -0.9s; animation-delay: -0.9s; }   
.spinner .rect5 { -webkit-animation-delay: -0.8s; animation-delay: -0.8s; }  
@-webkit-keyframes stretchdelay {   0%, 40%, 100% { -webkit-transform: scaleY(0.4) }    20% { -webkit-transform: scaleY(1.0) } }   
@keyframes stretchdelay { 0%, 40%, 100% {     transform: scaleY(0.4);     -webkit-transform: scaleY(0.4); }  20% { transform: scaleY(1.0); -webkit-transform: scaleY(1.0); } }  

</style>