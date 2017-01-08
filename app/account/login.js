

var ReactNative = require('react-native')
var React = require('react')
var CountDown = require('react-native-sk-countdown').CountDownText


var request = require('../common/request')
var config = require('../common/config')

var StyleSheet = ReactNative.StyleSheet
var Text = ReactNative.Text
var View = ReactNative.View
var ActivityIndicator = ReactNative.ActivityIndicator

var TextInput = ReactNative.TextInput
var Modal = ReactNative.Modal
var AlertIOS = ReactNative.AlertIOS



var Login = React.createClass({

  getInitialState() {
    return {
      verifyCode: '',
      phoneNumber: '',
      countingDone: false,
      codeSent: false
    }
  },


  _sendVerifyCode(){
    var that = this
    var phoneNumber = this.state.phoneNumber

    if(!phoneNumber){
      return AlertIOS.alert('手机号不能为空')
    }

    var body = {
      phoneNumber: phoneNumber 
    }
    var signUpurl = config.api.base2 + config.api.signup

    request.post(signUpurl,body)
      .then(function(data){
        if(data && data.success){
          that._showVerifyCode(true) //表示得到了verifycode
        }
        else{
          AlertIOS.alert('获取验证码失败，请检查手机号是否正确')       
        }
      })
      .catch((err) => {
         AlertIOS.alert('获取验证码失败，请检查网络是否良好')
      })
  },

  _showVerifyCode(state){
    this.setState({
      codeSent:state
    })
  },

  _submit(){
    var that = this
    var phoneNumber = this.state.phoneNumber
    var verifyCode = this.state.verifyCode

    if(!phoneNumber){
      return AlertIOS.alert('手机号不能为空')
    }
    if(!verifyCode){
      return AlertIOS.alert('验证码不能为空')
    }

    var body = {
      phoneNumber: phoneNumber,
      verifyCode: verifyCode 
    }
    var verifyUrl = config.api.base2 + config.api.verify

    request.post(verifyUrl,body)
      .then(function(data){
        if(data && data.success){
          that._showVerifyCode(true) //表示得到了verifycode

          console.log(JSON.stringify(data.data))
          that.props.afterLogin(JSON.stringify(data.data))
        }
        else{
          AlertIOS.alert('用户验证码不正确')       
        }
      })
      .catch((err) => {
         AlertIOS.alert('验证验证码失败，请检查网络是否良好')
      })
  },

  // es5 写法 render:function(){}
	render() {
		return(
			<View style={styles.container}>
        <View style = {styles.signupBox}>
				  <Text style = {styles.title}>账户页面</Text>
          <TextInput
               placeholder='输入手机号'
               autoCaptialize={'none'}
               autoCorrect={false}
               keyboardType={'number-pad'}
               style={styles.inputField}
               onChangeText={(text) => {
                  this.setState({
                    phoneNumber: text
                  })
              }}
          />
          {   
              this.state.codeSent
              ? <View style={styles.verifyCodeBox}>
                  <TextInput
                    placeholder='输入验证码'
                    autoCaptialize={'none'}
                    autoCorrect={false}
                    keyboardType={'number-pad'}
                    style={styles.inputField}
                    onChangeText={(text) => {
                      this.setState({
                        verifyCode: text
                      })
                    }}
                  />

                  {
                    this.state.countingDone
                    ? <Text
                      style={styles.countBtn}
                      onPress={this._sendVerifyCode}>获取验证码</Text>
                    : <CountDown
                        style={styles.countBtn}
                        countType='seconds' // 计时类型：seconds / date
                        auto={true} // 自动开始
                        afterEnd={this._countingDone} // 结束回调
                        timeLeft={60} // 正向计时 时间起点为0秒
                        step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                        startText='获取验证码' // 开始的文本
                        endText='获取验证码' // 结束的文本
                        intervalText={(sec) => '剩余秒数:' + sec} // 定时的文本回调
                      />
                  }
               </View>
              : null
          }

          {   
              this.state.codeSent
              ? <Text style= {styles.btn} onPress = {this._submit}>登录</Text>
              : <Text style= {styles.btn} onPress = {this._sendVerifyCode}>获取验证码</Text>
          }
        </View>
			</View>
		)
	}
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },

  signupBox: {
    marginTop: 30
  },

  title: {
    marginBottom: 20,
    color: '#333',
    fontSize: 20,
    textAlign: 'center'
  },

  inputField: {
    flex: 1,
    height: 40,
    padding: 5,
    color: '#666',
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 4
  },

  verifyCodeBox: {
    marginTop: 10,
    flexDirection: 'row',  //默认为view里面的数据一行一行的排列，刺此处设置为挤在一行
    justifyContent: 'space-between'
  },

  countBtn: {
    width: 110,
    height: 40,
    padding: 10,
    marginLeft: 8,
    backgroundColor: '#ee735c',
    borderColor: '#ee735c',
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
    borderRadius: 2
  },

  btn: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'transparent',
    borderColor: '#ee735c',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ee735c'
  }
})

module.exports = Login