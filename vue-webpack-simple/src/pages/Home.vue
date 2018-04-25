<template>
	<div>
		<navigation :title="'试试'" />
		<tabbar />
		<input type="text" name="" v-model="name">
	</div>

</template>

<script>

export default {
	data:function(){
		return {
			name:'',
		}
	},
	watch:{
		name:function(nv){
			this.$store.commit('updateName',this.name);
		}
	}
}

</script>