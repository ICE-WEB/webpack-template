//表格验证
function Valid(from){
   
    this.elments = $(from).find("[g-require]");
    this.verify = {
      phone:function(val){
        var regex = /^1[34578]\d{9}$/;
        if (regex.test(val)==false) {
          return "手机号码格式错误！";
        }
        return true;
      },
      pwd:function(val){
        var regex = /^[a-zA-Z0-9_-]{1,32}$/;
        if (regex.test(val)==false) {
          return "密码格式错误，（1到32位，字母，数字，下划线，减号）";
        }
        return true;
      },
      name:function(val){
        var regex = /^[\u4E00-\u9FA5A-Za-z0-9_]{1,16}$/;
        if (regex.test(val)==false) {
          return "用户名格式错误，（1到16位，字母 数字 下划线 中文）";
        }
        return true;
      },
      des:function(val){
        if (val.length < 1 || val.length > 100) {
          return "组织描述格式错误，（1到100位。）";
        }
        return true;
      },
      imgCode:function(val){
        var regex = /^-?\d*\.?\d+$/;
        if (regex.test(val)==false) {
          return "图片验证码格式错误";
        }
        return true;
      },
      smsCode:function(val){
        var regex = /^-?\d*\.?\d+$/;
        if (regex.test(val)==false) {
          return "短信验证码格式错误";
        }
        return true;
      },
      key:function(val){
        var regex = /^[a-zA-Z0-9_-]{8,16}$/;
        if (regex.test(val)==false) {
          return "key格式错误，（8到16位，字母，数字，下划线，减号）";
        }
        return true;
      }
    };


    var that = this;
    // this.elments.blur(function(){
    //     var msg = that.verifyEl(this);
    //     if (msg != true) {
    //         layer.msg(msg, {icon: 7});  
    //         // $(this).focus();
    //     }
    // });

    Valid.prototype.verifyEl = function(el){
      var name = $(el).attr("g-verify");
      var val = "";
      if ($(el).is("input")||$(el).is("textarea")) {
        val = $(el).val();
      }else{
        val = $(el).text();
      }

      var func = this.verify[name];
      if (typeof func == "function") {
        var msg = func(val);
        return msg;
      }
      return true;
    }

    Valid.prototype.getVals = function(){
      var f = {};
      this.elments.each(function(){
        var name = $(this).attr("g-verify");
        var val = "";
        if ($(this).is("input")||$(this).is("textarea")) {
          val = $(this).val();
        }else{
          val = $(this).text();
        }
        f[name]=val;
      });
      return f;
    }

    Valid.prototype.check = function(){
      var args = arguments;
      var result = true;
      this.elments.each(function(){
        var needCheck = false;
        if (args.length == 0) {
          needCheck = true;
        }else{
          var name = $(this).attr("g-verify");
          for (var i = 0; i < args.length; i++) {
            var a = args[i];
            if (a==name) {
              needCheck = true;
              break;
            }
          }
        }
        if (needCheck) {
          var msg = that.verifyEl(this);
          if (msg != true) {
            layer.open({
              content: msg
              ,skin: 'msg'
              ,time: 2 
            });
            // $(this).focus();
            $("input").blur();
            result = false;
            return false;
          }
        }
      });
      return result;
    }
}




$.fn.extend({
  valid: function() {
        var id = $(this).attr("g-valid");
        if (id == undefined) {
            id = 0;
            $("[g-valid]").each(function(){
                var v = $(this).attr("g-valid");
                v = parseInt(v);
                if (v >= id) {
                  id = v + 1;
                }
            })
            $(this).attr("g-valid",id);
            
            var valid = new Valid(this);
            window["gvalid"+id] = valid;
            return valid;
        }else{
            return window["gvalid"+id];
        }
  }
});