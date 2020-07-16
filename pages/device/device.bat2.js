const app = getApp()

const fun_aes = require('../../utils/aes.js')


Page({
  data: {
    // inputText: '0x06 0x01 0x01 0x01',
    inputText: '0x05 0x01 0x06 psd[6]',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
    services: {},
    characteristics: {},
    connected: true,
    token: [0x00, 0x00, 0x00, 0x00],
    hasToken: false,
    defaultpsw: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  },
  bindInput: function (e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  // 写入
  Send: function () {
    console.log(`写入`)
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(that.data.inputText.length)

      let serviceId = `0000FEE7-0000-1000-8000-00805F9B34FB`
      let characteristicId = `000036F5-0000-1000-8000-00805F9B34FB`



      console.log(`buffer`, buffer)


      var hex = 'AA5504B10000B5'
      var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
          return parseInt(h, 16)
      }))
      console.log(`typedArray`,typedArray)
      console.log(`typedArray2`,[0xAA, 0x55, 0x04, 0xB1, 0x00, 0x00, 0xB5])
      var buffer1 = typedArray.buffer
      console.log(`buffer1`, buffer1)


      // gettoken

      // let gettoken = [0x06, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; // token

      let gettoken = [0x06, 0x01, 0x01, 0x01, 0x2c, 0xbc, 0x62, 0x58, 0x96, 0x67, 0x42, 0x92, 0x01, 0x33, 0x31, 0x41]; // token


      let value = that.aesEncrypt1(gettoken).buffer


      var dataView = new Uint8Array(value)

      console.log(`value`, value)
      console.log(`dataView`, dataView)

      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: serviceId,
        characteristicId: characteristicId,
        value: value,
        // value: buffer,
        success: function (res) {
          console.log('发送成功', res)
        },
        fail: function (res) {
          console.log('fail', res)
        },
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  onLoad: function (options) {
    var that = this
    console.log(options)
    that.setData({
      name: options.name,
      connectedDeviceId: options.connectedDeviceId
    })
    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
        console.log(res.services)
        that.setData({
          services: res.services
        })


        let serviceId = `0000FEE7-0000-1000-8000-00805F9B34FB`
        let characteristicId = `000036F6-0000-1000-8000-00805F9B34FB`



        wx.getBLEDeviceCharacteristics({
          deviceId: options.connectedDeviceId,
          // serviceId: res.services[1].uuid,
          serviceId: serviceId,
          success: function (res) {
            console.log(res.characteristics)
            for (var i = 0; i < res.characteristics.length; i++) {
              console.log('特征值：' + res.characteristics[i].uuid)
            }
            that.setData({
              characteristics: res.characteristics
            })
            wx.notifyBLECharacteristicValueChange({
              state: true,
              deviceId: options.connectedDeviceId,
              // serviceId: that.data.services[1].uuid,
              serviceId: serviceId,
              characteristicId: characteristicId,
              // characteristicId: that.data.characteristics[1].uuid,
              success: function (res) {
                console.log('启用notify成功')
              },
              fail: function (res) {
                console.log('fail', res)
              },
            })
          }
        })
      }
    })
    wx.onBLEConnectionStateChange(function (res) {
      console.log(res.connected)
      that.setData({
        connected: res.connected
      })
    })
    wx.onBLECharacteristicValueChange(function (res) {

      var array = new Uint8Array(res.value);
      // console.log(`array`, array)
      var resxx = that.aesDecrypt(array) // 解密
      console.log(`解密`, resxx)
      
      var receiveText = that.ab2hex(resxx)
      // console.log(`接收到数据1：`, res)
      console.log(`接收到数据2：${receiveText}`)

      let receiveTextSplit = receiveText.split(',')
      if (receiveTextSplit[0] == '0x06' && receiveTextSplit[1] == '0x02') {

        //设备返回 LEN 字节令牌
        let token = []
        // console.log( new Uint8Array(result) )
        let arrayToken = new Uint8Array(resxx)
        // let resUint8ArrayToArray  = that.uint8ArrayToArray(resxx)
        token[0] = arrayToken[3];
        token[1] = arrayToken[4];
        token[2] = arrayToken[5];
        token[3] = arrayToken[6];
        // console.log(`解密2`)

        
        // console.log(`resUint8ArrayToArray`, resUint8ArrayToArray)
        console.log(`token`, token)
        console.log(`resxx`, resxx)
        console.log(`arrayToken`, arrayToken)

        that.setData({
          token: token,
          hasToken: true,
          receiveText: receiveText
        })
      }else if (receiveTextSplit[0] == '0x05' && receiveTextSplit[1] == '0x02') {
        that.setData({
          receiveText: receiveText
        })
      }
    })
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  },
  // 加密
  aesEncrypt1: function (code) { //key和code需要使用十进制的数组表示
    console.log(`加密code`, code)
    var a = this;
    var o = [32, 87, 47, 82, 54, 75, 63, 71, 48, 80, 65, 88, 17, 99, 45, 43]; //key的密钥10进制
    var t = fun_aes.CryptoJS.enc.int8array.parse(o); // code
    var r = fun_aes.CryptoJS.enc.int8array.parse(code);
    var n = (r.toString(fun_aes.CryptoJS.enc.Base64),
      fun_aes.CryptoJS.AES.encrypt(r, t, {
        iv: [],
        mode: fun_aes.CryptoJS.mode.ECB,
        padding: fun_aes.CryptoJS.pad.NoPadding
      }));
    var w = fun_aes.CryptoJS.enc.int8array.stringify(n.ciphertext);
    return w;
  },
  //解密
  aesDecrypt: function (code) {
    // l = [186, 19, 158, 249, 192, 228, 128, 165, 171, 212, 226, 171, 211, 219, 145, 71],
    console.log(`解密code`, code)
    var a = this,
      l = code,
      o = [32, 87, 47, 82, 54, 75, 63, 71, 48, 80, 65, 88, 17, 99, 45, 43], // key
      t = fun_aes.CryptoJS.enc.int8array.parse(o), // code
      r = fun_aes.CryptoJS.enc.int8array.parse(l).toString(fun_aes.CryptoJS.enc.Base64),
      n = fun_aes.CryptoJS.AES.decrypt(r, t, {
        iv: [],
        mode: fun_aes.CryptoJS.mode.ECB,
        padding: fun_aes.CryptoJS.pad.NoPadding
      });

    n = fun_aes.CryptoJS.enc.int8array.stringify(n);

    return n;
  },

  buf2hex: function (buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return '0x'+('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join(',');
  },
  // 开锁
  unlockLock(){
    console.log(`写入`)
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(that.data.inputText.length)

      let serviceId = `0000FEE7-0000-1000-8000-00805F9B34FB`
      let characteristicId = `000036F5-0000-1000-8000-00805F9B34FB`



      console.log(`buffer`, buffer)


      var hex = 'AA5504B10000B5'
      var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
          return parseInt(h, 16)
      }))
      console.log(`typedArray`,typedArray)
      console.log(`typedArray2`,[0xAA, 0x55, 0x04, 0xB1, 0x00, 0x00, 0xB5])
      var buffer1 = typedArray.buffer
      console.log(`buffer1`, buffer1)


      // gettoken

      // let gettoken = [0x06, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; // token

      let token = that.data.token;
      let defaultpsw = that.data.defaultpsw;

      console.log(`token`, token)
      console.log(`defaultpsw`, defaultpsw)

      let kaisuo = [0x05, 0x01, 0x06, defaultpsw[0], defaultpsw[1], defaultpsw[2], defaultpsw[3], defaultpsw[4], defaultpsw[5], token[0], token[1], token[2], token[3], 0x00, 0x00, 0x00]; // 开锁
      
      // 110, 184, 51, 1
      // let kaisuo = [0x02, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; // 电量


      console.log(`kaisuo`, kaisuo)


      // let value = that.aesEncrypt1(kaisuo).buffer
      let value = that.aesEncrypt1(kaisuo).buffer


      var dataView = new Uint8Array(value)

      console.log(`加密value`, value)
      console.log(`dataView`, dataView)

      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: serviceId,
        characteristicId: characteristicId,
        value: value,
        // value: buffer,
        success: function (res) {
          console.log('发送成功', res)
        },
        fail: function (res) {
          console.log('fail', res)
        },
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  uint8ArrayToArray(uint8Array) {
      var array = [];

      for (var i = 0; i < uint8Array.byteLength; i++) {
          array[i] = uint8Array[i];
      }

      return array;
  }

})