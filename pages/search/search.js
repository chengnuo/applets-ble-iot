const app = getApp()


const fun_aes = require('../../utils/aes.js')


Page({
  data: {
    searching: false,
    devicesList: []
  },
  // 搜索蓝牙设备
  Search: function () {
    var that = this
    if (!that.data.searching) {
      // 关闭蓝牙模块。调用该方法将断开所有已建立的连接并释放系统资源。建议在使用蓝牙流程后，与 wx.openBluetoothAdapter 成对调用
      wx.closeBluetoothAdapter({
        complete: function (res) {
          console.log(res)
          // 初始化蓝牙模块。iOS 上开启主机/从机模式时需分别调用一次，指定对应的 mode。
          wx.openBluetoothAdapter({
            success: function (res) {
              console.log(res)
              wx.getBluetoothAdapterState({
                success: function (res) {
                  console.log(res)
                }
              })
              // 开始搜寻附近的蓝牙外围设备。此操作比较耗费系统资源，请在搜索并连接到设备后调用 wx.stopBluetoothDevicesDiscovery 方法停止搜索。
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                success: function (res) {
                  console.log(res)
                  that.setData({
                    searching: true,
                    devicesList: []
                  })
                }
              })
            },
            fail: function (res) {
              console.log(res)
              wx.showModal({
                title: '提示',
                content: '请检查手机蓝牙是否打开',
                showCancel: false,
                success: function (res) {
                  that.setData({
                    searching: false
                  })
                }
              })
            }
          })
        }
      })
    } else {
      // 停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  // 蓝牙连接
  Connect: function (e) {
    var that = this
    var advertisData, name
    console.log(e.currentTarget.id)
    for (var i = 0; i < that.data.devicesList.length; i++) {
      if (e.currentTarget.id == that.data.devicesList[i].deviceId) {
        name = that.data.devicesList[i].name
        advertisData = that.data.devicesList[i].advertisData
      }
    }
    // 停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log(res)
        that.setData({
          searching: false
        })
      }
    })
    wx.showLoading({
      title: '连接蓝牙设备中...',
    })
    // 连接低功耗蓝牙设备。若小程序在之前已有搜索过某个蓝牙设备，并成功建立连接，可直接传入之前搜索获取的 deviceId 直接尝试连接该设备，无需进行搜索操作。
    wx.createBLEConnection({
      deviceId: e.currentTarget.id,
      success: function (res) {
        console.log('连接蓝牙设备中', res, e.currentTarget.id, name)
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        wx.navigateTo({
          url: '../device/device?connectedDeviceId=' + e.currentTarget.id + '&name=' + name
        })
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    })
  },
  onLoad: function (options) {

    let result = this.aesEncrypt1([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]); // 加密
    // let result = this.aesEncrypt1([32,87,47,82,54,75,63,71,48,80,65,88,17,99,45,43]); // 加密
    console.log(`result`, result)

    let jiemiresult = this.aesDecrypt(result)

    console.log(`jiemiresult`, jiemiresult)


    console.log( `jiemiresult2`, new Uint8Array(jiemiresult) )

    
    var that = this
    var list_height = ((app.globalData.SystemInfo.windowHeight - 50) * (750 / app.globalData.SystemInfo.windowWidth)) - 60
    that.setData({
      list_height: list_height
    })
    // 监听蓝牙适配器状态变化事件
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(res)
      that.setData({
        searching: res.discovering
      })
      if (!res.available) {
        that.setData({
          searching: false
        })
      }
    })
    // 监听寻找到新设备的事件
    wx.onBluetoothDeviceFound(function (devices) {
      //剔除重复设备，兼容不同设备API的不同返回值
      var isnotexist = true
      if (devices.deviceId) {
        if (devices.advertisData) {
          devices.advertisData = app.buf2hex(devices.advertisData)
        } else {
          devices.advertisData = ''
        }
        console.log(devices)
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices)
        }
      } else if (devices.devices) {
        if (devices.devices[0].advertisData) {
          devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
        } else {
          devices.devices[0].advertisData = ''
        }
        console.log(devices.devices[0])
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices.devices[0])
        }
      } else if (devices[0]) {
        if (devices[0].advertisData) {
          devices[0].advertisData = app.buf2hex(devices[0].advertisData)
        } else {
          devices[0].advertisData = ''
        }
        console.log(devices[0])
        for (var i = 0; i < devices_list.length; i++) {
          if (devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices[0])
        }
      }
      that.setData({
        devicesList: that.data.devicesList
      })
    })
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {
    var that = this
    that.setData({
      devicesList: []
    })
    if (this.data.searching) {
      // 停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  // 加密
  aesEncrypt1: function (code) { //key和code需要使用十进制的数组表示
    console.log(`code`, code)
    var a = this;
    var o = [32,87,47,82,54,75,63,71,48,80,65,88,17,99,45,43]; //key的密钥10进制
    var t = fun_aes.CryptoJS.enc.int8array.parse(o);
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
    var a = this,
      l = code,
      o = [32,87,47,82,54,75,63,71,48,80,65,88,17,99,45,43],
      t = fun_aes.CryptoJS.enc.int8array.parse(o),
      r = fun_aes.CryptoJS.enc.int8array.parse(l).toString(fun_aes.CryptoJS.enc.Base64),
      n = fun_aes.CryptoJS.AES.decrypt(r, t, {
        iv: [],
        mode: fun_aes.CryptoJS.mode.ECB,
        padding: fun_aes.CryptoJS.pad.NoPadding
      });

    n = fun_aes.CryptoJS.enc.int8array.stringify(n);

    return n;
  },

})