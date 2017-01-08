'use strict'


var Mock = require('mockjs')
var _ = require('lodash')
var queryString = require('query-string')
var config = require('./config')

var request = {}

request.get = function (url, param){
	if(param){
		var url = url +'?'+ queryString.stringify(param) 
	}

	return fetch(url)
      .then((response) => response.json())
      .then((responseJson) => Mock.mock(responseJson))
}

request.post = function (url,body){
	var options = _.extend(config.header,{
		body: JSON.stringify(body)
	})

	return fetch(url,options)
      .then((response) => response.json())
      .then((responseJson) => Mock.mock(responseJson))
}

module.exports = request