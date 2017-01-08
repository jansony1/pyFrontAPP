/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// //ES6
// import React, { Component } from 'react';

// import {
//   AppRegistry,
//   StyleSheet,
//   Text,
//   View
// } from 'react-native';


//Es:5
var ReactNative= require('react-native')
var React = require('react')
var Icon = require('react-native-vector-icons/Ionicons')


var List = require('./app/creation/index')
var Edit = require('./app/edit/index')

var Account = require('./app/account/index')
var Login = require('./app/account/login')
var Slider = require ('./app/account/slider')


var Component = React.Component
var AppRegistry = ReactNative.AppRegistry
var StyleSheet = ReactNative.StyleSheet
var Text = ReactNative.Text
var View = ReactNative.View
var TabBarIOS = ReactNative.TabBarIOS
var Navigator = ReactNative.Navigator
var AsyncStorage = ReactNative.AsyncStorage
var AlertIOS = ReactNative.AlertIOS
var ActivityIndicator = ReactNative.ActivityIndicator

var Dimensions = ReactNative.Dimensions
var width = Dimensions.get('window').width
var height = Dimensions.get('window').height

var AwesomeProject1 = React.createClass({
  getInitialState: function(){
    return {
      selectedTab: 'list',
      logined: false,
      user: null,
      booted: false,
      entered: false,
    }
  },
  componentDidMount(){
     this._asyncAppStatus()
  },
  
  _asyncAppStatus(){
    var that = this

    AsyncStorage.multiGet(['user','entered'])
      .then(function(data){
        userData = data[0][1]
        enterData = data[1][1]
        var user 
        var status = {}   

        if(userData){
          user = JSON.parse(userData) //数据存贮在本地是字符串形式，这边给他转换为对象，更stringify相反
        }

        if(user && user.accessToken){
            status.logined = true
            status.user = user
        }else{
            status.logined = false
        }
        status.booted = true
        if(enterData == 'yes')
        status.entered = true
        // console.log(JSON.stringify(status))
        that.setState(status)

      })
  },

  afterLogin(user){

    AsyncStorage.setItem('user', user)
      .then(()=>{
         this.setState({
         logined: true,
         user : user
         })
      })
  },

 _logout() {
    AsyncStorage.removeItem('user')

    this.setState({
      logined: false,
      user: null
    })
  },
  _enterSlide(){

    this.setState({
      enterd: true
    },function(){
      AsyncStorage.setItem('entered', 'yes')
    })
  },
  render() {
    if(!this.state.booted){ //是否在初始化中
      return (
          <View  style = {styles.bootPage}>
            <ActivityIndicator color='#ee735c' />
          </View>
        )
    }

    if(!this.state.entered){ //是否第一次登陆
      return (
          <Slider enterSlide = {this._enterSlide}/>
        )
    }

    if(!this.state.logined){
      return <Login afterLogin={this.afterLogin} /> 
    }


    return (
      <TabBarIOS tintColor='#ee735c'>
         <Icon.TabBarItem
        iconName='ios-videocam-outline'
        selectedIconNmae='ios-videocam'
        selected={this.state.selectedTab ==='list'}
        onPress={()=>{
            this.setState({
              selectedTab: 'list'
            })
          }}>
         <Navigator
            initialRoute={{
              name: 'list',
              component: List
            }}
            configureScene={(route) => {
              return Navigator.SceneConfigs.FloatFromRight
            }}
            renderScene={(route, navigator) => {
              var Component = route.component

              return <Component {...route.params} navigator={navigator} />
            }} 
            />
         </Icon.TabBarItem>
         <Icon.TabBarItem
        iconName='ios-recording-outline'
        selectedIconNmae='ios-recording'
        selected={this.state.selectedTab ==='edit'}
        onPress={()=>{
            this.setState({
              selectedTab: 'edit'
            })
          }}>
         <Edit />
         </Icon.TabBarItem>
         <Icon.TabBarItem
        iconName='ios-more-outline'
        selectedIconNmae='ios-more'
        selected={this.state.selectedTab ==='account'}
        onPress={()=>{
            this.setState({
              selectedTab: 'account'
            })
          }}>
         <Account user={this.state.user}  logout={this._logout}/>
         </Icon.TabBarItem>
       </TabBarIOS>
    )
  }
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  bootPage:{
    width: width,
    height: height,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
})


AppRegistry.registerComponent('AwesomeProject1', () => AwesomeProject1);
