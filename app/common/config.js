'use strict'

module.exports ={
	header: {
		 method: 'POST',
		 headers: {
		    'Accept': 'application/json',
		    'Content-Type': 'application/json',
		 }
	},
	backup:{
		avatar: 'http://ohial6ho5.bkt.clouddn.com/image/jpg/defaultAvatar.jpegdefaultAvatar.jpeg'
	},
	qiniu:{
		upload: 'http://upload.qiniu.com',
		thumb: 'http://ohial6ho5.bkt.clouddn.com/',
		video: 'http://ohial6ho5.bkt.clouddn.com/',
		avatar: 'http://ohial6ho5.bkt.clouddn.com/',
	},
	cloudinary: {
	  'cloud_name': 'dkll20hc1',  
	  'api_key': '838832678279277',  
	  'api_secret': 'VnSrEVrojen__XVw_pomF1Sbd8c',  
	  'base': 'http://res.cloudinary.com/dkll20hc1',
	  'image':  'https://api.cloudinary.com/v1_1/dkll20hc1/image/upload',
	   'video': 'https://api.cloudinary.com/v1_1/dkll20hc1/video/upload',
	   'audio': 'https://api.cloudinary.com/v1_1/dkll20hc1/raw/upload',
	},
	api: {
		base2: 'http://localhost:1234/',
		base: 'http://rap.taobao.org/mockjs/9469/',
		creations: 'api/creations',
		uploadvideo: 'api/uploadvideo',
		uploadaudio: 'api/uploadaudio',
		up:'api/votes',
		comment: 'api/comments',
		signup: 'api/u/signup',
	    verify: 'api/u/verify',
	    update: 'api/u/update',
	    signature: 'api/signature'
	},
	accessToken: 'abbc'
}