'use strict' 


//视频制作上传页面

var ReactNative = require('react-native')
var React = require('react')
var Icon = require('react-native-vector-icons/Ionicons')
var Video = require('react-native-video').default
var ImagePicker = require('react-native-image-picker')
var CountDown = require('react-native-sk-countdown').CountDownText
var Progress = require('react-native-progress')
var RnAudio = require('react-native-audio')
var AudioUtils = RnAudio.AudioUtils
var AudioRecorder = RnAudio.AudioRecorder
var Modal = ReactNative.Modal

var _ = require('lodash')



var config = require('../common/config')
var request = require('../common/request')

var StyleSheet = ReactNative.StyleSheet
var Text = ReactNative.Text
var TextInput = ReactNative.TextInput
var View = ReactNative.View
var Image = ReactNative.Image
var Dimensions = ReactNative.Dimensions
var TouchableOpacity = ReactNative.TouchableOpacity
var AlertIOS = ReactNative.AlertIOS
var AsyncStorage = ReactNative.AsyncStorage
var ProgressViewIOS = ReactNative.ProgressViewIOS




var height = Dimensions.get('window').height
var width = Dimensions.get('window').width

var videoOptions = {
  title: '选择配音视频',
  cancelButtonTitle: '取消',
  takePhotoButtonTitle: '录制10秒视频',
  chooseFromLibraryButtonTitle: '选择已有视频',
  mediaType:'video',
  videoQuality: 'medium',
  durationLimit:10,
  noData: false,
  storageOptions: { 
    skipBackup: true, 
    path: 'video'
  }
}

var defaultState = {  //将视频上传的初始状态作为基数保存，那么更换视频之后，我们整个参数其实都不存在了，那么通过集成default恢复初始状态
        previewVideo: null, //视频是否已上传
        renderTime:0 ,
      

        title: '',
        modalVisible: false,
        publishProgress: 0.2,
        publishing: false,
        // video uploads
        video: null,
        videoId: null,
        videoUploading:false,
        videoUploaded: false,
        videoUploadingProgress: 0.2,

        //video control 
        videoChooseing: false, //是否已经点击了选择视频按钮
        videoTotal: 0,
        currentTime: 0,

        //after upload video and before record audio
        counting: false,
        recording: false,

        // video player
        rate: 1,
        muted: false,
        resizeMode: 'contain', 
        repeat: false,

        //audio related:
        audio: null,
        audioId: null,
        audioName: '新的运动视频.aac',
        audioPlaying: false,
        audioRecordDone: false,
        currentTime: 0,
        finished: 0,
        audioPath:  AudioUtils.DocumentDirectoryPath + 'zhenyuAudio.aac',

        audioUploading: false,
        audioUploadingProgress: 0.2,
        audioUploadDone: false,

}
var Edit = React.createClass({


  getInitialState(){
      console.log('intial')
      var user = this.props.user || {}  
      var state = _.clone(defaultState)

      state.user = user
      return state

  },

  componentDidMount(){
    console.log('componentDidMount')
    var that = this

    AsyncStorage.getItem('user')
      .then(function(data){
        var user 
        var status = {}   

        if(data){
          user = JSON.parse(data) //数据存贮在本地是字符串形式，这边给他转换为对象，更stringify相反
        }

        if(user && user.accessToken){
            status.logined = true
            status.user = user
        }else{
            status.logined = false
        }

        // console.log(JSON.stringify(status))
        that.setState(status)

      })

      //初始化audio
     
      this.prepareRecordingPath(this.state.audioPath);

      AudioRecorder.onProgress = (data) => {
        this.setState({currentTime: Math.floor(data.currentTime)})
      }
      AudioRecorder.onFinished = (data) => {
        this.setState({finished: data.finished});
        console.log(`Finished recording: ${data.finished}`);
      }
  },

  //录音选项
  prepareRecordingPath(audioPath){
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: "High",
      AudioEncoding: "aac",
    })
  },

  //得到图床的签名，业务逻辑在后台做
  _getToken(body){

        var body = body

        body.accessToken = this.state.user.accessToken

        var signatureURL = config.api.base2+config.api.signature  // 本地地址

        console.log("signatureURL:"+signatureURL)

        return request.post(signatureURL, body)

  },

  _upload(body,type){  //音频视频的逻辑相同，通过type来判断
    //上传音频视频到图床之上
    var that = this
    var xhr = new XMLHttpRequest() //这个哥们有点吊
    var url = null
    var type = type 

    console.log('00')

    if(type =='video'){
      url = config.qiniu.upload
    }else if ( type == 'audio'){
      url = config.cloudinary.video
    }

    var newState = {}

    newState[type+'UploadingProgress']=0
    newState[type+'Uploading'] = true,
    newState[type+'Uploaded'] = false,

    this.setState(newState)


    xhr.open('POST', url)

    xhr.onload =()=>{ //上传到图床

       console.log('xhr.status:'+xhr.status)
       console.log('xhr.response:'+xhr.response)
      //当请求成功完成时触发，此时xhr.readystate=4
      if(xhr.status==200){ 
        //上传完毕后，同步到后台
        
        // console.log('请求状态：'+curTime.toISOString())
         if(!xhr.responseText){
            console.log('222:'+xhr.responseText)
            AlertIOS.alert('请求失败')

            return
         }

         try {
             var response = JSON.parse(xhr.response)
             console.log('response:'+ xhr.response)
         }
         catch(e){ 
            console.log(e)
            console.log('parse fails')
         }


        var newState = {}
        newState[type] = response
        newState[type+'Uploading'] = false
        newState[type+'Uploaded'] = true
        newState[type+'UploadingProgress'] = 0
        that.setState(newState)

        var user = that.state.user
        var accessToken = user.accessToken



        var updatedBody ={
          accessToken: accessToken,
      
        }
        updatedBody[type+'Data'] = response

        var updateUrl = config.api.base2+ config.api['upload'+type]

        if(type === 'audio'){
          updatedBody['videoId'] = that.state.videoId
        }

        request.post(updateUrl, updatedBody)
          .catch((err)=>{
            if(type == 'video')
              AlertIOS.alert('视频同步失败')
            else if(type == 'audio')
              AlertIOS.alert('音频同步失败')
          })
          .then(function(data){
            console.log('同步资料成功:'+JSON.stringify(data))
            if(data && data.success){
              var media = data.data

              if(type == 'audio'){
                that.setState({
                  audioId: media
                })
                that._showModal()//调出浮窗

              }else if(type == 'video'){
                that.setState({
                  videoId: media
                })
              }
            }else{
             if(type == 'video')
              AlertIOS.alert('视频同步失败')
             else if(type == 'audio')
              AlertIOS.alert('音频同步失败')
            }
          })
          
         
       //  that._asyncUser(true) //上传完头像以后，在1）服务器 2）本地 同步一下user.
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
            }
            var newState = {}
            newState[type+ 'UploadingProgress'] = percentComplete
            that.setState(newState)
         } 
     }

    xhr.send(body)
  },

  _uploadAudio(){

    //——————————————————待思考————————————————————————
    // 如果用户已经点击上传，那么是否该阻止他再上传？不阻止造成什么样的影响
    //
    var that = this
    var tags = 'app.audio'
    var folder = 'audio'
    var timestamp = Date.now()

    var TokenNeed = {
      cloud: 'cloudinary',  //判断去哪个图床存
      //下面两个是cloudinary所需要我们上传的
      type: 'audio',
      timestamp: timestamp,
    }

    that._getToken(TokenNeed)
        .then(function(data){
            if(data && data.success){
              var signature = data.data.signature
              var key = data.data.key

              var body = new FormData()

              body.append('folder',folder)
              body.append('tags',tags)
              body.append('timestamp',timestamp)
              body.append('signature',signature)
              body.append('api_key',config.cloudinary.api_key)
              body.append('resource_type','audio')
              body.append('file',{
                type: 'video/mp4',
                uri: that.state.audioPath,
                name: key
              })

              that._upload(body,'audio')
            }
        })
        .catch((err)=>{
          console.log(err)
        })

      
  },
  //*****video choose begin*****
    _pickVideo(){

    var that = this

    if(this.state.videoChooseing) return  //点过了就不能再点了

    this.setState({
         videoChooseing: true,
    })

    ImagePicker.showImagePicker(videoOptions, (response) => {

        console.log('Response:'+ response)
        
        var user = that.state.user

        var uri = response.uri

        var state = _.clone(defaultState)

        state.user = user
        state.previewVideo = uri

        that.setState(state)

        var accessToken = this.state.user.accessToken

        var TokenNeed = {
          type: 'video',
          cloud: 'qiniu',
        }

         that._getToken(TokenNeed)
            .then(function(data){
                if(data && data.success){
                    console.log('data:'+ data)
                    var token = data.data.token
                    var key = data.data.key

                    var body = new FormData()
                    body.append('token',token)
                    body.append('key',key)
                    body.append('file', {
                      type: 'video/mp4',
                      uri: uri,
                      name: key
                    })

                    that._upload(body,'video')
                }
            })
            .catch((err)=>{
              console.log(err)
           })

      })
  },
  //*****video choose end*****
  //video control related begin
  _pop(){
    this.props.navigator.pop()
  },
   _onLoadStart() {
    console.log('load start')
  },

  _onLoad() {
    console.log('loading')
  },

  _onProgress(data) {
    var duration = data.playableDuration
    var currentTime = data.currentTime
    var position = Number((currentTime/duration).toFixed(2))
  


    this.setState({
       videoTotal: duration,
       currentTime: Number(data.currentTime.toFixed(2)),
       videoProgress: position
    })

    console.log('video onprogress')
    // if (!this.state.videoLoaded) {
    //   this.setState({
    //     videoLoaded: true
    //   })
    // } 
  },
  _onEnd() {
   if (this.state.recording) {
      AudioRecorder.stopRecording()
      console.log('onEnd')
      this.setState({
        videoProgress: 1,
        recording: false,
        audioRecordDone: true,
        audioPlaying: false, //录音和video播放时同步的。
      })
    }
  },

  _onError(e) {
    console.log(e)
    this.setState({
      videoOk: false
    })
  },

  _counting(){
    if(!this.state.counting && !this.state.recording){
      this.setState({
        counting: true,
      })
      //点击录音后激活倒计时的方法
      this.refs.videoPlayer.seek(this.state.videoTotal - 0.01) //这样拿到视频有点吊啊
    }
  },

  _preview(){

    if(this.state.audioPlaying){
      AudioRecorder.stopRecording()
    }
    this.setState({
      audioPlaying: true
    })
    AudioRecorder.playRecording()
    this.refs.videoPlayer.seek(0)
  },

  _record(){
    //倒计时结束后激活的方法,激活录音
    this.setState({
      counting: false,
      recording: true,
      audioRecordDone: false

    })

    AudioRecorder.startRecording()
    this.refs.videoPlayer.seek(0)
  },
  //video control related end 
  //model control begin
  _closeModal(){
     this.setState({
       modalVisible: false
    })
  },
  _showModal(){
    this.setState({
       modalVisible: true
    })
  },

  _submit(){
    var user = this.state.user
    var token = user.accessToken
    var that = this

    
    if(user && user.accessToken){

      var body = {
      accessToken: token,
      videoId:this.state.videoId,
      audioId: this.state.audioId,
      title: this.state.title
     }

     var url = config.api.base2+ config.api.creations

      that.setState({
        publishing: true
      })
      request.post(url, body)
        .catch((err)=>{
          AlertIOS.alert('保存配音完整视频失败')
          that._closeModal() 
        })
        .then((data)=>{
            console.log(data)
            that._closeModal() 
            if(data && data.success){
              let state = _.clone(defaultState)
              that.setState(state)
              console.log(that.state)
            }else{
              that.setState({
                publishing: false
              })
              AlertIOS.alert('保存配音完整视频s失败')
            }

        })
    }

  },
  //model control end
  render(){
    var that = this

		return(
			 <View style={styles.container}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>
            {
              this.state.previewVideo ? '点击按钮配音' : '开始上传视频'}
          </Text>
          {
            this.state.previewVideo && this.state.videoUploaded
            ? <Text style={styles.toolbarExtra} onPress={this._pickVideo}>更换视频</Text>
            : null
          }
        </View>
        <View style={styles.page}>
          {
              this.state.previewVideo 
              ?<View style= {styles.videoBox}>
                <View style = {styles.videoContainer}>
                  <Video
                    ref='videoPlayer'
                    source={{uri: this.state.previewVideo}}
                    style={styles.video}
                    volume={3}
                    paused={this.state.paused}
                    rate={this.state.rate}
                    muted={this.state.muted}
                    repeat={this.state.repeat}

                    onLoadStart={this._onLoadStart}
                    onLoad={this._onLoad}
                    onProgress={this._onProgress}
                    onEnd={this._onEnd}
                    onError={this._onError} />
                  {
                    this.state.audioRecordDone
                    ? <TouchableOpacity onPress={this._preview}>
                        <View style={styles.previewBox} onPress={this._preview}>
                          <Icon name='ios-play' style={styles.previewIcon} onPress={this._preview}/>
                          <Text style={styles.previewText} onPress={this._preview}>
                            预览
                            </Text>
                        </View>
                    </TouchableOpacity>
                    : null
                  }
                  {
                    !this.state.videoUploaded && this.state.videoUploading
                    ? <View style={styles.progressTipBox}>
                        <ProgressViewIOS style={styles.progressBar} progressTintColor='#ee735c' progress={this.state.videoUploadingProgress} />
                        <Text style={styles.progressTip}>
                          正在生成静音视频，已完成{(this.state.videoUploadingProgress * 100).toFixed(2)}%
                        </Text>
                      </View>
                    : null
                 }
                 {
                    this.state.recording || this.state.audioPlaying
                    ? <View style={styles.progressTipBox}>
                        <ProgressViewIOS style={styles.progressBar} progressTintColor='#ee735c' progress={this.state.videoProgress} />
                        {
                          this.state.recording
                          ? <Text style={styles.progressTip}>
                            录制声音中
                            </Text>
                          : null
                        }
                      </View>
                    : null
                 }
                </View>
              </View>
                :<TouchableOpacity style={styles.uploadContainer} onPress={this._pickVideo}>
                  <View style={styles.uploadBox}>
                    <Image source = {require('../static/image/log.png')} style = {styles.uploadImage} />
                    <Text style={styles.uploadTitle}>点我上传视频</Text>
                    <Text style={styles.uploadDesc}>建议时长不超过 20 秒</Text>
                  </View>
                </TouchableOpacity>
            
          }
          { //控制倒计时窗口,录音那妞
            this.state.videoUploaded && this.state.previewVideo 
            ? <View style={styles.recordContainer}>  
                <View style={[styles.recordBox, (this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
                 {
                  this.state.counting && !this.state.recording
                  ?<CountDown
                          style={styles.countBtn}
                          countType='seconds' // 计时类型：seconds / date
                          auto={true} // 自动开始
                          afterEnd={this._record} // 结束回调
                          timeLeft={4} // 正向计时 时间起点为0秒
                          step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                          startText='GO' // 开始的文本
                          endText='' // 结束的文本
                          intervalText={(sec) => '' + sec} // 定时的文本回调
                        />
                  : <TouchableOpacity onPress={this._counting}>
                      <Icon name='ios-mic' style={styles.recordIcon}
                      />
                    </TouchableOpacity>
                 }
                </View>
              </View>
            : null
          }
          {
            this.state.videoUploaded && this.state.audioRecordDone
            ?<View style = {styles.audioUploadBox} >
              <Text style = {styles.audioUploadText} onPress = {this._uploadAudio}>下一步</Text> 
             </View>
            : null
          } 
          {
            this.state.audioUploading 
            ?<View style = {styles.audioUploadBox}>
              <Progress.Circle
                        showsText ={true}
                        color = '#ee735c'
                        progress ={this.state.audioUploadingProgress}
                        size={75} 
                        style={styles.audioUploadingCircle} />
             </View>
            : null
          } 
        </View>
        <Modal visible ={this.state.modalVisible}>
          <View style= {styles.modalContainer}>
            <Icon
              name = 'ios-close-outline'
              style = {styles.closeIcon}
              onPress = {this._closeModal}
            />
            <View style ={styles.fieldContainer}>
              <TextInput
                  placeholder = '请输入配音的标题'
                  style = {styles.inputField}
                  autoCapitalize = {'none'}
                  autoCorrect= {false}
                  defaultValue = {this.state.title}
                  onChangeText= {(text)=>{
                      this.setState({
                        title: text
                      })
                  }}
              />
            </View>
              <View style = {styles.loadingBox}>
                <Text style = {styles.loadingText}>耐心等一下，正在生成视频中...</Text>
                <Text style = {styles.loadingText}>马上完成啦...</Text>
                <Progress.Circle
                          showsText ={true}
                          color = '#ee735c'
                          progress ={this.state.publishProgress}
                          size={60} 
                          style={styles.audioPublishingCircle} />
              </View>
            <View style = {styles.submitBox}>
               <Text style= {styles.btn} onPress = {this._submit}>提交视频</Text>
            </View>
          </View>
        </Modal>
    </View>
    )
  }
})

var styles = StyleSheet.create({

  container: {
    flex: 1
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
    top: 26,
    color: '#fff',
    textAlign: 'right',
    fontWeight: '600',
    fontSize: 14
  },

  page: {
    flex: 1,
    alignItems: 'center'
  },

  uploadContainer: {
    marginTop: 90,
    marginBottom: 300,
    width: width - 40,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#ee735c',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#fff'
   
  },

  uploadTitle: {
    //marginTop:-300,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#000'
  },

  uploadDesc: {
    color: '#999',
    textAlign: 'center',
    fontSize: 12
  },

  uploadImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    paddingBottom: 0,
    marginBottom:10
  },
  uploadBox: {
    //flex: 1,  //充满整个空间

    justifyContent: 'center',
    alignItems: 'center'
  },
  videoBox:{
    width: width,
    //heigth:heigth,
    justifyContent: 'center',
    alignItems: 'flex-start'

  },
  videoContainer:{
    width: width,
    height:0.6* height,
  },
  video:{
    width: width,
    height:0.6* height,
    backgroundColor: '#333'
  },
  progressTipBox: {
    width: width,
    height: 30,
    backgroundColor: 'rgba(244,244,244,0.65)' //带透明度的背景色，最后一位为透明度
  },

  progressTip: {
    color: '#333',
    width: width - 10,
    padding: 5
  },

  progressBar: {
    width: width
  },
  recordContainer:{
    marginTop: -34,
    width: width,
    height: 68,
    alignItems:'center'
  },
  recordBox:{
    width: 68,
    height: 68,
    
    borderRadius: 34, //圆的radius
    backgroundColor: '#ee735c',
    borderWidth:1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent:'center'
  },
  countBtn:{
    fontSize: 32,
    fontWeight: '600',
    color: '#fff' //黑色
  },
  recordIcon:{
    fontSize: 58,
    color: '#fff',
    backgroundColor: 'transparent'
  },
  recordOn:{
    backgroundColor:'#eee'
  },
  previewBox:{
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 80,
    height: 30,
    borderColor: '#ee735c',
    borderWidth: 1,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewIcon:{
    fontSize: 20,
    color: '#ee735c',
    backgroundColor: 'transparent'
  },
  previewText:{
    fontSize: 20,
    color: '#ee735c',
    backgroundColor: 'transparent'
  },
  audioUploadBox:{
    width: width ,
    height: 60 ,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioUploadText:{
    width: width-40,
    padding: 5,
    textAlign: 'center',
    fontSize: 30,
    color: '#ee735c',
    borderColor: '#ee735c',
    borderRadius: 5,
    borderWidth: 1
  },
  modalContainer: {
    width: width,
    height: height,
    backgroundColor: '#fff',
    paddingTop: 50
  },

  fieldContainer:{
    width: width-40,
    height: 36,
    marginRight: 20,
    marginLeft: 20,
    marginTop: 30,
    borderColor: '#eaeaea',
    borderBottomWidth: 1
  },
  inputField:{
    height: 50,
    color: '#666',
    fontSize:14,
    textAlign: 'center'
  },
  loadingBox:{
    width: width,
    height: 50,
    marginTop: 10,
    padding: 15,
    alignItems: 'center'
  },
  loadingText:{
    padding: 5
  },
  audioPublishingCircle:{
    marginTop: 10
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
  submitBox:{
    marginTop: 100,
    padding: 15,
  },
  btn: {
    marginTop: 0,
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

module.exports = Edit