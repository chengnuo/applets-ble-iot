import { config } from '../config.js'
import md5 from './md5.js'
import { Base64 } from './base64.js'
let util = require('./util.js');

class HTTP {
  constructor() {
    this.baseRestUrl = config.api_blink_url
  }

  //http 请求类, 当noRefech为true时，不做未授权重试机制
  request(params) {
    var that = this
    var url = params.host ? params.host + params.url : this.baseRestUrl + params.url;
    
    //1.1版本需要的参数
    params.data.mercId = '888000000000004';
    params.data.platform = 'ZBMALL';

    //1.4版本需要的参数
    params.data.sysCnl = 'WX-APPLET';
    params.data.timestamp = new Date().getTime().toString().substr(0, 10);

    var head = jsSign(params.data);
    var userToken = wx.getStorageSync('zhuanbologs') ? wx.getStorageSync('zhuanbologs').userToken : ''
    
    if (!params.method) {
      params.method = 'GET';
    }
    wx.request({
      url: url,
      data: params.data,
      method: params.method,
      header: {
        'X-MPMALL-SignVer': head['X-MP-SignVer'],
        'X-MPMALL-Sign': head['X-MP-Sign'],
        'X-MPMALL-Token': userToken,
        'LoginVersion': '20200413'
        // 'X-MPMALL-Token': '8d4tdnger0g7t2pvsghhgpww5uxyfi1j',
        // 'content-type': 'multipart/form-data' // 默认值
      },
      success: function (res) {
        // 异常不要返回到回调中，就在request中处理，记录日志并showToast一个统一的错误即可
        var code = res.data.code;
        // var startChar = code.charAt(0);
        // if (startChar == '2') {
        console.log(res.data);
        if (code == 10000 || code == 10036 || code == 10014 || code == 10062 || code == 10065 || code == 10067) {
          params.success && params.success(res.data);
        } else if (code == 10007){
          params.error && params.error(res);
        } else if (code == 10047) {
          params.error && params.error(res);
          // wx.showToast({
          //   title: res.data.msg,
          //   icon: 'none',
          // })
        } else if (code == 10023 || code == 10404){ //未登录
          params.error && params.error(res);
        } else if (code == 10501) {
          params.error && params.error(res.data);
          wx.setStorageSync('zhuanbologs', null);
          wx.navigateTo({
            url: '/pages/quickLogin/index?type=index',
          })
        }else{
          params.error && params.error(res);
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
          })
        }
      },
      fail: function (err) {
        console.log(err)
        // wx.navigateTo({
        //   url: '/pages/noNet/index'
        // })

        wx.showModal({
          // content: res.data.msg,
          content: '网络异常，请检查你的网络',
          showCancel: false,
        })

        params.error && params.error(err);
        return false;
      }
    });
  }
};

//生成签名

function jsSign(obj) {
  // var json = Object.assign({}, obj, config.signJson);
  var json = Object.assign({}, obj, {})
  var arr = [];

  for (var key in json) {
    if ((typeof (json[key]) != 'object' && json[key]) || (typeof (json[key]) != 'object' && json[key] === 0)) {
      arr.push(key)
    }
  }
  arr.sort();

  var str = '';
  for (var i = 0; i < arr.length; i++) {
    str += `${arr[i]}=${json[arr[i]]}&`;
  }
  str = `${str}key=${config.appkey}`;

  console.log(str)
  str = Base64.encode(md5(str));

  return {
    'X-MP-SignVer': config.signJson['X-MPMALL-SignVer'],
    'X-MP-Sign': str
  }
}
export { HTTP };