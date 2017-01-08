var ReactNative = require('react-native')
var React = require('react')
var Icon = require('react-native-vector-icons/Ionicons')
var ImagePicker = require('react-native-image-picker')
var Progress = require('react-native-progress')
var sha1 = require('sha1')


var request = require('../common/request')
var config = require('../common/config')

var StyleSheet = ReactNative.StyleSheet
var Text = ReactNative.Text
var TextInput = ReactNative.TextInput
var View = ReactNative.View
var TouchableOpacity = ReactNative.TouchableOpacity
var Dimensions = ReactNative.Dimensions
var Image = ReactNative.Image
var AsyncStorage = ReactNative.AsyncStorage
var AlertIOS  = ReactNative.AlertIOS
var Modal = ReactNative.Modal


var width = Dimensions.get('window').width



var photoOptions = {
  title: '选择头像',
  cancelButtonTitle: '取消',
  takePhotoButtonTitle: '拍照',
  chooseFromLibraryButtonTitle: '选择相册',
  quality: 0.1,
  allowsEditing: true,
  noData: false,
  storageOptions: { 
    skipBackup: true, 
    path: 'images'
  }
}
function avatar(id, type){
  if(id.indexOf('http')> -1){ //某个网络上新搞来的图片
    return id
  }

  if(id.indexOf('data:image')> -1){//本地长传的图片
    return id
  }
   if(id.indexOf('avatar/')> -1){//cloudinary 返回的图片地址格式
    return config.cloudinary.base+'/'+type+'/upload/'+id
  }

  //七牛中返回的图片地址
  return 'http://ohial6ho5.bkt.clouddn.com/'+id
}

var Account = React.createClass({

  getInitialState(){
    
    var user = this.props.user || {}

    console.log("user:"+user)
    
      return {
        user: user,
        avatarUploading: false,
        avatarProgress: 0,
        modalVisible:false
      }

  },

  //control modal 
  _edit(){
    this.setState({
       modalVisible: true
    })
  },

  _closedeModal(){
     this.setState({
       modalVisible: false
    })
  },

  _changeUserState(key,value){
    var user = this.state.user
    user[key] = value

    this.setState({
      user:user
    })
  },


  _submit(){
    this._asyncUser()
    //session中需求修改
    //localStorage需要修改
    //服务器端需要同步

  },
  //control model end



  //
  componentDidMount(){

      var that = this
     console.log('here')
      AsyncStorage.getItem('user')
        .then((data)=>{
            var user 
            if(data){
                user = JSON.parse(data)
            }
             // user.avatar = ''
             // AsyncStorage.setItem('user', user.avatar)

            if(user && user.accessToken){
              that.setState({
                user: user
              })
            }
        })
  },

  _logout() {

    console.log(JSON.stringify(this.props.user))
    this.props.logout()
  },

  _uploadImage(body){
    //这之前先从我们服务器端拿到签名，拿到签名后再去上传图片
    var that = this
    var xhr = new XMLHttpRequest() //这个哥们有点吊
    var url = config.qiniu.upload


    this.setState({
        avatarProgress:0,
        avatarUploading:true
    })


    xhr.open('POST', url)

    xhr.onload =()=>{

       console.log('xhr.status:'+xhr.status)
      //当请求成功完成时触发，此时xhr.readystate=4
      if(xhr.status==200){

         var curTime = new Date()
        
        // console.log('请求状态：'+curTime.toISOString())
         if(!xhr.responseText){
            console.log('222:'+xhr.responseText)
            AlertIOS.alert('请求失败')

            return
         }

         try {
             response = JSON.parse(xhr.response)
         }
         catch(e){ 
            console.log(e)
            console.log('parse fails')
         }

         console.log(JSON.stringify(response))
         if(response){
            var user = this.state.user
            
            if(response.public_id){
              user.avatar = response.public_id
            }

            if(response.key){
              user.avatar = response.key
            }
         }
          that.setState({
            user: user ,
            avatarUploading: false,
            avatarProgress: 0,
          })
         
         that._asyncUser(true) //上传完头像以后，在1）服务器 2）本地 同步一下user.
                   // 其中1里的服务器是指应用后台服务器，
                   //其并不知道你上传的图数据，以及上传成功后图床返回的新地址
       }

 
    }

    //console.log('xhr.upload'+ JSON.stringify(xhr.upload))

    if(xhr.upload){
       xhr.upload.onprogress= (event) =>{  //xhr.upload.onprogress在上传阶段(即xhr.send()之后，xhr.readystate=2之前)触发，每50ms触发一次；xhr.onprogress在下载阶段（即xhr.readystate=3时）触发，每50ms触发一次。
                                           //默认情况下这个事件每50ms触发一次。需要注意的是，上传过程和下载过程触发的是不同对象的onprogress事件：
            if(event.lengthComputable){
              var percentComplete = Number((event.loaded / event.total).toFixed(2))
              console.log('precent:'+ percentComplete)
            }
            that.setState({
              avatarProgress: percentComplete
            })
         } 
     }

    xhr.send(body)
  },

  _asyncUser(modifyAvatar){

    //localstorage更新
    //服务器数据更新

    var that = this

    var user = this.state.user 

    var url = config.api.base2 + config.api.update

    var body = {
         accessToken: user.accessToken,
         avatar: user.avatar,
         breed: user.breed,
         gender: user.gender,
         age: user.age,
         nickname: user.nickname
    }

    console.log('11')

    request.post(url,body)  //负责去服务器同步新的图片数据

      .then(function(data){
          console.log('data:'+JSON.stringify(data))

        //返回用户标识，更新的头像数据（地址）
          //接下来同步本地的状态
          //console.log('23'+data)
        if(data && data.success){

            var user = data.data

            if(modifyAvatar) {
              AlertIOS.alert('头像更新成功')
            }

            if(user && user.accessToken){

              console.log('23'+JSON.stringify(user))
              that.setState({
                  // 更新当前session里面的user
                  user: user
              }, function(){
                  //更新本地存储里的user
                  AsyncStorage.setItem('user', JSON.stringify(user))
                  if(that.state.modalVisible){
                    that._closedeModal()
                  }
              })
            }
        }

     

      })

  },
  //获取七牛的token
  _getQiNiuToken(){
        var accessToken = this.state.user.accessToken
        var body = {
          accessToken : accessToken,
          type: 'image',
          cloud: 'qiniu',
        }
        var signatureURL = config.api.base2+config.api.signature  // 本地地址
        console.log("signatureURL:"+signatureURL)
        return request.post(signatureURL, body)

  },

  //切换图片以及执行图片的本地，云端更新操作
  _pickPhoto(){
    var that  = this

    ImagePicker.showImagePicker(photoOptions, (response) => {

        console.log('Response:'+ response)
        
        var user = that.state.user

        var avatarData= 'data:image/jpeg;base64,'+ response.data //返回的选取结果

        var accessToken = this.state.user.accessToken

        var uri = response.uri

         that._getQiNiuToken()
            .then(function(data){
                if(data && data.success){
                    console.log('here')
                    var token = data.data.token
                    var key = data.data.key

                    var body = new FormData()
                    body.append('token',token)
                    body.append('key',key)
                    body.append('file', {
                      type: 'image/png',
                      uri: uri,
                      name: key
                    })

                    that._uploadImage(body)
                }
            })
            .catch((err)=>{
              console.log(err)
           })

      })

    //老cloudinary那一套
        // var timestamp = Date.now()
        // var tags = 'app.avatar'
        // var folder = 'avatar'
        // var signatureURL = config.api.base2 + config.api.signature
      //   request.post(signatureURL, body) 
      //       .then(function(data){
      //           if(data && data.success){
                 
      //               var signature = data.signature

      //               var body = new FormData()

      //               body.append('folder',folder)
      //               body.append('tags',tags)
      //               body.append('timestamp',timestamp)
      //               body.append('signature',signature)
      //               body.append('api_key',config.cloudinary.api_key)
      //               body.append('file', avatarData)
      //               body.append('resource_type','image')
      //               console.log('after signature')
      //               that._uploadImage(body)
      //           }
      //       })
      //       .catch((err)=>{
      //         console.log(err)
      //      })

      // })
  },

	render() {

    var user  = this.state.user

    //console.log('user:'+ user.avatar)

		return(
			<View style={styles.container}>
				<View style = {styles.toolbar}>
          <Text style ={styles.toolbarTitle}>狗狗界面</Text>
          <Text style ={styles.toolbarExtra} onPress={this._edit}>编辑</Text>
			  </View>
        {
          user.avatar
          ? <TouchableOpacity onPress={this._pickPhoto} style={styles.avatarContainer}>
             <Image style={styles.avatarContainer}  source={{uri: avatar(user.avatar)}}> 
                <View style={styles.avatarBox}>
                    {
                    this.state.avatarUploading
                    ?<Progress.Circle
                        showsText ={true}
                        color = '#ee735c'
                        progress ={this.state.avatarProgress}
                        size={75} 
                        style={styles.avatar} />
                    :<Image          
                          source={{uri: avatar(user.avatar)}}
                          style={styles.avatar} />
                    }
                </View>
                <Text style={styles.avatarTip}>更换狗狗头像</Text>
             </Image> 
           </TouchableOpacity>
         : <TouchableOpacity onPress={this._pickPhoto} style={styles.avatarContainer}>
              <Text style={styles.avatarTip}>添加狗狗头像</Text>
              <View style={styles.avatarBox}>
                {
                this.state.avatarUploading
                ?<Progress.Circle
                    showsText = {true}
                    color = '#ee735c'
                    progress ={this.state.avatarProgress}
                    size={75}  />
                :<Icon          
                      name='ios-cloud-upload-outline'
                      style={styles.plusIcon} />
                }
              </View>
            </TouchableOpacity>

        }

        <Modal visible ={this.state.modalVisible}>
          <View style= {styles.modalContainer}>
            <Icon
              name = 'ios-close-outline'
              style = {styles.closeIcon}
              onPress = {this._clodeModal}
            />
            <View style ={styles.filedContainer}>
              <Text style = {styles.label}>姓名</Text>
              <TextInput
                  placeholder = '请输入姓名'
                  style = {styles.input}
                  autoCapitalize = {'none'}
                  autoCorrect= {false}
                  defaultValue = {user.nickname}
                  onChangeText= {(text)=>{
                      this._changeUserState('nickname',text)
                  }}
              />
            </View>
            <View style ={styles.filedContainer}>
              <Text style = {styles.label}>品种</Text>
              <TextInput
                  placeholder = '请输入品种'
                  style = {styles.input}
                  autoCapitalize = {'none'}
                  autoCorrect= {false}
                  defaultValue = {user.breed}
                  onChangeText= {(text)=>{
                      this._changeUserState('breed',text)
                  }}
              />
            </View>
             <View style ={styles.filedContainer}>
              <Text style = {styles.label}>年龄</Text>
              <TextInput
                  placeholder = '请输入年龄'
                  style = {styles.input}
                  autoCapitalize = {'none'}
                  autoCorrect= {false}
                  defaultValue = {user.age}
                  onChangeText= {(text)=>{
                      this._changeUserState('age',text)
                  }}
              />
            </View>
             <View style ={styles.filedContainer}>
              <Text style = {styles.label}>性别</Text>
              <Icon.Button
                onPress={()=>{
                  this._changeUserState('gender','male')
                }}
                style ={[
                  styles.gender,user.gender ==='male' && styles.genderChecked
                ]}
                name='ios-paw-outline'>男</Icon.Button>
              <Icon.Button
                onPress={()=>{
                  this._changeUserState('gender','female')
                }}
                style ={[
                  styles.gender,user.gender ==='female' && styles.genderChecked
                ]}
                name='ios-paw'>女</Icon.Button>
            </View>

            <Text style= {styles.btn} onPress = {this._submit}>提交修改</Text>
            
          </View>
        </Modal>

        <Text style= {styles.btn} onPress={this._logout}>logout</Text>
      </View>
		)
	}
})

var styles = StyleSheet.create({
  container: {
    flex: 1,  //1,1, 0%， 最后一个意思为没有初始的空间分配，如果有一个元素，那么这个元素100%，有3个，那么这三个3等分，前提是每个元素没有设置大小
  },

  toolbar: {
    flexDirection: 'row',
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#ee735c'
  },

  toolbarTitle: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600'
  },

  toolbarExtra: {
    position: 'absolute',
    right: 10,
    //top: 26,
    color: '#fff',
    //textAlign: 'right',
    fontWeight: '600',
    fontSize: 14
  },

  avatarContainer: {
    width: width,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666'
  },

  avatarTip: {
    color: '#fff',
    backgroundColor: 'transparent',
    fontSize: 14
  },

  avatarBox: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },

  avatar: {
    marginBottom: 15,
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1
  },

  plusIcon: {
    padding: 20,
    paddingLeft: 25,
    paddingRight: 25,
    color: '#999',
    fontSize: 24,
    backgroundColor: '#fff',
    borderRadius: 8
  },

  modalContainer: {
    flex:1,
    backgroundColor: '#fff',
    paddingTop: 50
  },

  filedContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingLeft: 15,
    paddingRight: 15,
    borderColor: '#eee',
    borderBottomWidth: 1
  },

  label:{
    color: '#ccc',
    marginRight: 10,
    marginLeft: 20,
    fontSize:14
  },

  input:{
    height: 50,
    flex: 1,
    color: '#666',
    fontSize:14
  },

  closeIcon:{
    position: 'absolute',
    width:40,
    left: width*0.5,
    height:40,
    top: 30,
    fontSize: 30,
    color: '#ee735c'
  },
  gender:{
    backgroundColor: '#ccc'
  },

  genderChecked:{
    backgroundColor: '#ee735c'
  },

  btn: {
    marginTop: 10,
    marginLeft: 15,
    marginRight: 15,
    padding: 10,
    backgroundColor: 'transparent',
    borderColor: '#ee735c',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ee735c'
  }

})

module.exports = Account