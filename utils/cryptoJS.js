var CryptoJS = require('./crypto-js.min.js');
import { config } from '../config.js';
// 注意，这边需要环境变量。手动切换
// http://showdoc.sys.jxblot.com/web/#/3?page_id=744
// 参考文章：https://blog.csdn.net/gao36951/article/details/77942419


// 使用说明
// import cryptoJS from '../../utils/cryptoJS.js'

// console.log('cryptoJS', cryptoJS)

// console.log('cryptoJS', cryptoJS.encrypted('AES'))
// console.log('cryptoJS', cryptoJS.decrypted('CIDtcy7H0suSWQC49L8bSQ=='))


/**
 *
 * @param {*} sourceValue 加密value
 */

var key = {}
var iv = {}

// if (process.env.NODE_ENV === 'development') {
//   key = CryptoJS.enc.Utf8.parse('y2W8CL6BkRrFlJPN')
//   iv = CryptoJS.enc.Utf8.parse('dMbtHORyqseYwE0o')
// } else {
//   key = CryptoJS.enc.Utf8.parse('G4OVYZye84xquqP7')
//   iv = CryptoJS.enc.Utf8.parse('IOhUDME4NFD596dm')
// }

key = CryptoJS.enc.Utf8.parse(config.cryptojs_key)
iv = CryptoJS.enc.Utf8.parse(config.cryptojs_iv)

function encrypted(sourceValue) {
  if (sourceValue) {
    var password = CryptoJS.enc.Utf8.parse(sourceValue)
    var encryptedObj = CryptoJS.AES.encrypt(password, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }) // CryptoJS.pad.Pkcs7
    return encryptedObj.toString()
  } else {
    new Error('加密错误')
  }
}

/**
 *
 * @param {*} sourceValue 解密value
 */
function decrypted(sourceValue) {
  if (sourceValue) {
    var decryptedObj = CryptoJS.AES.decrypt(sourceValue, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }) // CryptoJS.pad.Pkcs7
    return decryptedObj.toString(CryptoJS.enc.Utf8)
  } else {
    new Error('解密错误')
  }
}

export default {
  encrypted,
  decrypted
}

