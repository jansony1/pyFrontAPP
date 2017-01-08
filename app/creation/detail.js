


var ReactNative = require('react-native')
var React = require('react')
var Video = require('react-native-video').default
var Icon = require('react-native-vector-icons/Ionicons')
var Button = require('react-native-button')


var request = require('../common/request')
var config = require('../common/config')
var util = require ('../common/util')

var StyleSheet = ReactNative.StyleSheet
var Text = ReactNative.Text
var View = ReactNative.View
var ActivityIndicator = ReactNative.ActivityIndicator
var Dimensions = ReactNative.Dimensions
var TouchableOpacity = ReactNative.TouchableOpacity
var ListView = ReactNative.ListView
var Image = ReactNative.Image
var TextInput = ReactNative.TextInput
var Modal = ReactNative.Modal
var AlertIOS = ReactNative.AlertIOS
var AsyncStorage = ReactNative.AsyncStorage
var width = Dimensions.get('window').width

var cachedResults = {
  nextPage: 1,
  items: [],
  total:0
}

var detail = React.createClass({

  getInitialState() {
     var data = this.props.data

    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
     return {
      data: data,

      // comment
      dataSource: ds.cloneWithRows([]),
      isLoadingTail : false,
      // video loads
      videoOk: true,
      videoLoaded: false,
      playing: false,
      paused: false,
      videoProgress: 0.01,
      videoTotal: 0,
      currentTime: 0,

      // modal
      content: '',
      animationType: 'none',
      modalVisible: false,
      isSending: false,

      // video player
      rate: 1,
      muted: false,
      resizeMode: 'contain',
      repeat: false
      }
    },
  //返回
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
   // console.log('videoLoaded')

    var duration = data.playableDuration
    var currentTime = data.currentTime
    var position = Number((currentTime/duration).toFixed(2))
    
    var curState = {
       videoTotal: duration,
       currentTime: Number(data.currentTime.toFixed(2)),
       videoProgress: position
    } 

    if (!this.state.videoLoaded) {
      curState.videoLoaded = true
    }
    if (!this.state.playing) {
      curState.playing = true
    }

    this.setState(curState)

   // console.log('onprogress')
    // if (!this.state.videoLoaded) {
    //   this.setState({
    //     videoLoaded: true
    //   })
    // } 
  },

  _onEnd() {
     console.log('onEnd')
    this.setState({
      videoProgress: 1,
      playing: false
    })
  },

  _onError(e) {
    console.log(e)
    this.setState({
      videoOk: false
    })
  },

  _rePlay() {
    this.refs.videoPlayer.seek(0)
  },

  _pause() {
    if (!this.state.paused) {
      this.setState({
        paused: true
      })
    }
  },

  _resume() {
    if (this.state.paused) {
      this.setState({
        paused: false
      })
    }
  },


/******上述是视频控制的，下面是评论区的控制********/

//激活评论浮窗
_focus(){
  this._setModalVisible(true)
},

_setModalVisible(condition){
  this.setState({
    modalVisible: condition
  })
},

// 关闭评论浮窗
_closeModal(){
  this._setModalVisible(false)
},

//提交评论
_submit(){
  var that = this
  var user = this.state.user
  if (!this.state.content) {
    return AlertIOS.alert('留言不能为空！')
  }

  if (this.state.isSending) {
    return AlertIOS.alert('正在评论中！')
  }

  this.setState({  //看清楚此函数的范围
    isSending:true,
  }, function(){    
    var body = {
      accessToken: user.accessToken ,
      comment:{
        creation: this.state.data._id,
        content: this.state.content
      }
    }
  
  var url =config.api.base2 + config.api.comment

  request.post(url, body)
    .then(function(data){
        if(data && data.success){
          if(data && data.data.length> 0){
            var items = cachedResults.items.slice()

            items = data.data.concat(items)

            console.log('item:'+ JSON.stringify(items))

            cachedResults.items = items 
            cachedResults.total = cachedResults.total + 1 

            that.setState({
              content: '',
              isSending: false,
              dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
            })
            that._setModalVisible(false)
          }
        }
    })
    .catch((err) => {
        console.log(err)
        that.setState({
          isSending: false
        })
        that._setModalVisible(false)
        AlertIOS.alert('留言失败，稍后重试！')
      })
   })
},

    // for header of comment area control
   _renderHeader() {
      var data = this.state.data

      return (
        <View style={styles.listHeader}>
          <View style={styles.infoBox}>
            <Image style={styles.avatar} source={{uri: util.avatar(data.author.avatar)}} />
            <View style={styles.descBox}>
              <Text style={styles.nickname}>{data.author.nickname}</Text>
              <Text style={styles.title}>{data.title}</Text>
            </View>
          </View>
          <View style= {styles.commentBox}>
            <View style= {styles.comment}>
               <TextInput
                placeholder='敢不敢评论一个...'
                style={styles.content}
                multiline={true}
                onFocus={this._focus}
              />
            </View>
          </View>
          <View style={styles.commentArea}>
            <Text style={styles.commentTitle}>精彩评论</Text>
          </View>
        </View>
      )
    },

  componentDidMount(){

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
        that.setState(status, function(){
          that._fetchData(1)  
        })      
      })
  },

  _renderRow(row) {
    var user = this.state.user
    //console.log('*************replyBy:'+ row.replyBy)
    if(typeof row.replyBy == 'string'){ //这个地方因为下面row.replyBy.avatar 没返回，所以这样写，也可以改后端让其返回
      var row = {
        replyBy:{
          avatar: user.avatar,
          nickname: user.nickname,
        },
        content: row.content
      }

    //  console.log('here:'+ row.replyBy.avatar)
    }
    return (
      <View key={row._id} style={styles.replyBox}>
        <Image style={styles.replyAvatar} source={{uri:util.avatar(row.replyBy.avatar)}} />
        <View style={styles.reply}>
          <Text style={styles.replyNickname}>{row.replyBy.nickname}</Text>
          <Text style={styles.replyContent}>{row.content}</Text>
        </View>
      </View>
    )
  },

  _fetchData(page){
    var that = this
    var user = this.state.user
    this.setState({
          isLoadingTail:true
     })


    var url = config.api.base2 +config.api.comment

    request.get(url, {
       accessToken: user.accessToken,
       creation: that.state.data._id,
       page: page
      })
      .then((data) => {
         if(data && data.success){
          if(data.data.length>0){
            var items = cachedResults.items.slice()
            items = items.concat(data.data)
            cachedResults.nextPage += 1
            //j将总共的数据存入缓存出数据中
            cachedResults.total = data.total
            cachedResults.items = items

            that.setState({
                isLoadingTail:false,
                dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
            })
            
          }
         }
      })
      .catch((error) => {
        console.error(error);
      })
  },
  _hasMore(){
    //前提是能够拿到评论数据的总数，将其存储为total，
    //然后比较拿到的数据和total是否相等
     return cachedResults.items.length !== cachedResults.total
  },

  //向下刷新的时候读取更多的数据

  _fetchMoreData(){

    if(!this._hasMore() || this.state.isLoadingTail){
      this.setState({
          isLoadingTail: false   //加载完数据了   
      })
      return 
    }

    var page = cachedResults.nextPage //加载下一页的数据
    
    console.log('page:'+page)

    this._fetchData(page) 

  },
  _renderFooter(){ //加载数据时候的样式

    if (!this._hasMore() && cachedResults.total !== 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>没有更多了</Text>
        </View>
      )
    }

    if (!this.state.isLoadingTail) {
      return <View style={styles.loadingMore} />
    }
    return <ActivityIndicator style={styles.loadingMore} />

  },

  render() {

    var data = this.state.data    
    return (
      <View style={styles.container}>
        <View style={styles.header}> 
           <Text style={styles.headerTitle} numberOflines={1}>
            详情页面
          </Text>
          <TouchableOpacity onPress={this._pop} style={styles.backBox}>
            <Icon
                name='ios-arrow-back'
                size={24}
                style={styles.backIcon} />
            <Text style = {styles.backText}>返回</Text>
                
          </TouchableOpacity>
        </View>
        <View style={styles.videoBox}>
          <Video
            ref='videoPlayer'
            source={{uri: util.video(data.qiniu_video)}}
            style={styles.video}
            volume={3}
            paused={this.state.paused}
            rate={this.state.rate}
            muted={this.state.muted}
            resizeMode={this.state.resizeMode}
            repeat={this.state.repeat}

            onLoadStart={this._onLoadStart}
            onLoad={this._onLoad}
            onProgress={this._onProgress}
            onEnd={this._onEnd}
            onError={this._onError} />
            {
                //判断是否加载错误呀
              this.state.videoOk
              ? null 
              : <Text style={styles.failText}>哎呀出错了</Text>
            }
            {
                //判断是否要显示载入的小菊花
              this.state.videoLoaded 
              ? null 
              : <ActivityIndicator colors = '#ee735c' style={styles.loading} /> 
            }
            
            {
              //视频播放结束后，显示一个可重新播放的按钮
              this.state.videoLoaded && !this.state.playing
              ? <Icon
                  onPress={this._rePlay}
                  name='ios-play'
                  size={48}
                  style={styles.playIcon} />
              : null
            }

            {
              //显示一个可以暂停的按钮
              this.state.videoLoaded && this.state.playing
              ? <TouchableOpacity onPress={this._pause} style={styles.pauseBtn}>
                {
                  this.state.paused
                  ? <Icon onPress={this._resume} size={48} name='ios-play' style={styles.resumeIcon} />
                  : null
                }
              </TouchableOpacity>
              : null
            } 
             <View style={styles.progressBox}>
              <View style={[styles.progressBar, {width: width * this.state.videoProgress}]}></View>
            </View>
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderHeader={this._renderHeader}
          renderFooter={this._renderFooter}
          onEndReached={this._fetchMoreData}
          onEndReachedThreshold={20}
          enableEmptySections={true}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
        />

        <Modal
          visible ={this.state.modalVisible}
          >
          <View style={styles.modalContainer}>
            <Icon
              onPress = {this._closeModal}
              name = 'ios-close-outline'
              style = {styles.closeIcon}
            />
            <View style={styles.commentBox}>
              <View style={styles.comment}>
                <TextInput
                  placeholder='敢不敢评论一个...'
                  style={styles.content}
                  multiline={true}
                  defaultValue={this.state.content}
                  onChangeText={(text) => {
                    this.setState({
                      content: text
                    })
                  }}
                />
              </View>
            </View> 

               <Text style={styles.submitBtn} onPress={this._submit}>评论</Text>
          </View>
        </Modal>
      </View> 
     )}

})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: 64,
    paddingTop: 20,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff'
  },
  videoBox: {
    width: width,
    height: width * 0.56,
    backgroundColor: '#000'
  },
  video: {
    width: width,
    height: width * 0.56,
    backgroundColor: '#000'
  },
  loading: {
    position: 'absolute',
    left:0,
    top:140,
    width:width,
    alignSelf: 'center',
    backgroundColor: 'transparent'
  },
  progressBox: {
    width: width,
    height: 2,
    backgroundColor: '#ccc'
  },

  progressBar: {
    width: 1,
    height: 2,
    backgroundColor: '#ff6600'
  },
  playIcon: {
    position: 'absolute',
    top: 90,
    left: width / 2 - 30,
    width: 60,
    height: 60,
    paddingTop: 8,
    paddingLeft: 22,
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 30,
    color: '#ed7b66'
  },
   pauseBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width,
    height: width * 0.56
  },

  resumeIcon: {
    position: 'absolute',
    top: 80,
    left: width / 2 - 30,
    width: 60,
    height: 60,
    paddingTop: 8,
    paddingLeft: 22,
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 30,
    color: '#ed7b66'
  },
  failText: {
    position: 'absolute',
    left: 0,
    top: 90,
    width: width,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: 'transparent'
  },
  headerTitle:{
    width:width - 120,
    textAlign: 'center'
  },
  backBox:{
    position: 'absolute',
    left:12,
    top:32,
    width: 50,
    flexDirection: 'row',
    alignItems:'center'
  },
  backIcon:{
    color: '#999',
    fontSize: 20,
    marginRight:5
  },
  backText:{
    color: '#999'

  },
   infoBox: {
    width: width,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },

  avatar: {
    width: 60,
    height: 60,
    marginRight: 10,
    marginLeft: 10,
    borderRadius: 30
  },

  descBox: {
    flex: 1
  },

  nickname: {
    fontSize: 18
  },

  title: {
    marginTop: 8,
    fontSize: 16,
    color: '#666'
  },

  replyBox: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10
  },

  replyAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    marginLeft: 10,
    borderRadius: 20
  },

  replyNickname: {
    color: '#666'
  },

  replyContent: {
    marginTop: 4,
    color: '#666'
  },

  reply: {
    flex: 1
  },

  loadingMore: {
    marginVertical: 20
  },

  loadingText: {
    color: '#777',
    textAlign: 'center'
  },
  commentBox:{
    marginTop:10,
    marginBottom:10,
    padding:8,
    width:width
  },
  content:{
    paddingLeft:2,
    color:'#333',
    borderWidth:1,
    borderColor: '#ddd',
    borderRadius:4,
    fontSize:14,
    height:80
  },
   commentArea: {
    width: width,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalContainer: {
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#fff'
  },

  closeIcon: {
    alignSelf: 'center',
    fontSize: 30,
    color: '#ee753c'
  },
  submitBtn:{
    width:width-20,
    padding:16,  //文字内容和边框的距离
    marginTop:20,
    marginBottom: 20, 
    borderWidth:1,
    borderColor: '#ee753c',
    borderRadius:4,
    fontSize:18,
    color: '#ee753c',
    alignSelf: 'center',
    textAlign: 'center',
  }

  
})

module.exports = detail