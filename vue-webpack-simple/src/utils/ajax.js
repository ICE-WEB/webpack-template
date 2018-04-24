
/*
	json中的参数
	url:请求地址, 	不能为空
	data:参数      	可以为空
	success:成功的回调函数 可以为空 
	error: 失败的回调函数 可以为空
	loading: 是否隐藏加载动画 可以为空	默认显示 true/false
	alert: 是否隐藏错误提示 可以为空 默认提示 true/false
	            
	//模板
	ajax({
		url:"",
		data:data,
		success:function(data){

		}
	});

*/
function adapterErrInfo(data){
	if (data.errorCode != undefined) {
		data.errCode = data.errorCode;
		data.errMsg = data.errorMsg;
	}else if(data.code != undefined){
		data.errCode = data.code;
		data.errMsg = data.message;
	}
}

export default  function(json){

	var loading = window.loading;
	if (typeof json.data == "undefined") {json.data = {};}

	if (false != json.loading) {
		loading.show();
	}
	var temp = {    
		url:json.url,
		data:json.data,
		type:'post',
		cache:false,    
		dataType:'json',
		success:function(data) {
			adapterErrInfo(data);
			if (false != json.loading) {
				loading.hide();
			}

			if (data.errCode == 0) {
				if (typeof json.success == "function"){
					json.success(data);
				}
			}else{
				if (false != json.alert && typeof data.errMsg != "undefined") {
					layer.open({content: data.errMsg,btn: '确定'});
				}

				if (typeof json.error == "function") {
					json.error(data);
				}
			}
		},    
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			console.log("网络错误码："+textStatus);
			if (XMLHttpRequest.status == 200) {
				if (false != json.loading) {
					loading.hide();
				}
				if (false != json.alert) {
					layer.open({
						content: '登录超时，请重新登录！'
						,btn: ['确定', '取消']
						,yes: function(index){
							window.location.href = "/login";
							layer.close(index);
						}
					});
				}
			}else{

				if (false != json.loading) {
					loading.hide();
				}
				if (errorThrown != "abort" ) {
					if (false != json.alert) {
						layer.open({content: '系统错误（链接中断）！',btn: '确定'});
					}
					if (typeof json.error == "function") {
						json.error();
					}
				}
			}
		},
		complete:function(XHR,TS){
			if (typeof json.complete == "function"){
				json.complete(TS);
			}
		}
	};
	if (json.contentType) {
		temp.contentType = json.contentType;
	}
	var ajax = $.ajax(temp);

    return ajax;
}

  