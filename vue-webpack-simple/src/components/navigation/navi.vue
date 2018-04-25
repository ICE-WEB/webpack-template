<template>
	<div class="topbar">
		<span class="title" style="font-size:.8em" v-text="title"></span>
		<div>{{name}}</div>
	</div>
</template>

<script>

export default {
	props:['title','icon'],
	computed:{
		name:function(){
			console.log(this.$store);
			return this.$store.state.name;
		}
	}
}

</script>

<style>
	
</style>
