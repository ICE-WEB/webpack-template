<template>
<div>底部栏
	<div>{{name}}</div>
</div>
</template>

<script>

export default {
	computed:{
		name:function(){
			return this.$store.state.name;
		}
	}
}

</script>