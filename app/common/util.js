'use strict'

var config = require('./config')
exports.thumb = function(key ){
	if(key.indexOf('http')>-1) return key

	return config.qiniu.thumb + key
}

exports.avatar = function(key ){
	console.log('key：' + key)
	if(!key){
		return config.backup.avatar
	}
	if(key.indexOf('http')>-1) return key

	if(key.indexOf('data:image')> -1) return key 

	if(key.indexOf('avatar/')>-1) {
		return config.cloudinary.base + '/image/upload'+ key
	}

	return config.qiniu.avatar + key
}

exports.video = function(key){
	if(key.indexOf('http')>-1) return key

	if(key.indexOf('video/')>-1) {
		return config.cloudinary.base + '/video/upload'+ key
	}

	return config.qiniu.video + key
}



// exports.hashMap = function(){
//      /** Map 大小 **/
//      var size = 0;
//      /** 对象 **/
//      var entry = new Object();
      
//      /** 存 **/
//      this.put = function (key , value)
//      {
//          if(!this.containsKey(key))
//          {
//              size ++ ;
//          }
//          entry[key] = value;
//      }
      
//      /** 取 **/
//      this.get = function (key)
//      {
//          return this.containsKey(key) ? entry[key] : null;
//      }
      
//      /** 删除 **/
//      this.remove = function ( key )
//      {
//          if( this.containsKey(key) && ( delete entry[key] ) )
//          {
//              size --;
//          }
//      }
      
//      /** 是否包含 Key **/
//      this.containsKey = function ( key )
//      {
//          return (key in entry);
//      }
      
//      /** 是否包含 Value **/
//      this.containsValue = function ( value )
//      {
//          for(var prop in entry)
//          {
//              if(entry[prop] == value)
//              {
//                  return true;
//              }
//          }
//          return false;
//      }
      
//      /** 所有 Value **/
//      this.values = function ()
//      {
//          var values = new Array();
//          for(var prop in entry)
//          {
//              values.push(entry[prop]);
//          }
//          return values;
//      }
      
//      /** 所有 Key **/
//      this.keys = function ()
//      {
//          var keys = new Array();
//          for(var prop in entry)
//          {
//              keys.push(prop);
//          }
//          return keys;
//      }
      
//      /** Map Size **/
//      this.size = function ()
//      {
//          return size;
//      }
      
//      /* 清空 */
//      this.clear = function ()
//      {
//          size = 0;
//          entry = new Object();
//      }
//  }