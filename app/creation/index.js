/**
* 
author:zhenyu
revised-date: 2016-02-07
intro:this site is used for creation list and home page of this app
*/


var ReactNative = require('react-native')
var React = require('react')
var Icon = require('react-native-vector-icons/Ionicons')

var request = require('../common/request')
var config = require('../common/config')
var util = require('../common/util')
var Detail = require('./detail')

var StyleSheet = ReactNative.StyleSheet
var Text = ReactNative.Text
var View = ReactNative.View
var TouchableHighlight = ReactNative.TouchableHighlight
var ListView = ReactNative.ListView
var Image = ReactNative.Image
var Dimensions = ReactNative.Dimensions
var ActivityIndicator = ReactNative.ActivityIndicator
var RefreshControl = ReactNative.RefreshControl
var AlertIOS = ReactNative.AlertIOS
var AsyncStorage = ReactNative.AsyncStorage


var width = Dimensions.get('window').width
//存储临时数据，这个地方是不是之后可以放到 react里面去存储
var cachedResults = {
  nextPage: 1,
  items: [],
  total:0
}

var Item = React.createClass({
    getInitialState() {
      var row = this.props.row

     return {
        up: row.voted, //暂时还没有找到出处
        row: row
      }
    },

    _up(){
       var that = this
       var up = this.state.up

       var row = this.state.row
       var url = config.api.base2 + config.api.up

       request.post(url, {
         creation: row._id,
         accessToken: this.props.user.accessToken,
         up: up ? 'true':'false'
        })
        .then((data) => {
            if(data.success){
              console.log('点赞成功')
              that.setState({
                up: !up
              })
            }else{
              console.log('点赞失败，请稍后再试')
              AlertIOS.alert('点赞失败，稍后重试')
            }
        })
       .catch((error) => {
           AlertIOS.alert('点赞失败，稍后重试')
        })
    },

    render(){
      var row = this.state.row
      return(
        <TouchableHighlight onPress = {this.props.onSelect}>
        <View style = {styles.item}>
          <Text  style = {styles.title}>{row.title}></Text>
          <Image
             source = {{uri:util.thumb(row.qiniu_thumb)}}
             style = {styles.thumb}
          >
          <Icon
            name = 'ios-play'
            size = {28}
            style = {styles.play}/>
          </Image>
          <View style = {styles.itemFooter}>
            <View style = {styles.handleBox}>
              <Icon
                 name={this.state.up ? 'ios-heart' : 'ios-heart-outline'}
                 size = {28}
                 style = {this.state.up? styles.up:styles.down}
                 onPress = {this._up}
              />
              <Text style = {styles.handleText}>喜欢</Text>
            </View>
             <View style = {styles.handleBox}>
              <Icon
                name = 'ios-chatboxes-outline'
                size = {28}
                style = {styles.commentIcon}
              />
              <Text style = {styles.handleText}>评论</Text>
            </View>
          </View>
        </View> 
      </TouchableHighlight>
      )}
}) 


var List = React.createClass({

  getInitialState() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return (
      this.state = {
        isLoadingTail: false ,
        isRefreshing: false,
        dataSource: ds.cloneWithRows([])
        
      })
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

  _fetchData(page){
    var that = this
    var user = this.state.user
    if(page!=0){
      this.setState({
            isLoadingTail:true
       })
    }else{
      this.setState({
            isRefreshing:true
       })
    }

    var url = config.api.base2 +config.api.creations

    request.get(url, {
       accessToken: user.accessToken,
       page: page
      })
      .then((data) => {
         console.log('data:'+ JSON.stringify(data))
         if(data && data.success){
            if(data.data.length > 0 && (cachedResults.total !== data.total)){ //第二个判断是为了没有新视频更新的逻辑
              var items = cachedResults.items.slice()

              //判断哪个视频被点了赞了
              data.data.map(function(item){ //遍历每个视频数据
                if(item.votes[user._id]){ //点赞列表里面发现了current user
                    item.up = 'true'
                }else{
                    item.up = 'false'
                }
                return item
              })

              if(page!=0){
                items = items.concat(data.data)
              }else{
                items = data.data.concat(items)
              }
              cachedResults.total = data.total
              cachedResults.items = items
              
              if(page!=0){
                that.setState({
                    isLoadingTail:false,
                    dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
                })
              }else{
                 that.setState({
                    isRefreshing:false,
                    dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
                })
              }

            }
        }    
      })
      .catch((error) => {
        console.error(error);
      })
  },
  _hasMore(){
    //前提是能够拿到视频数据的总数，将其存储为total， 这个判断实际工程里（在刷出新视频的时候）不能这样做，因为后台总视频数一直在变，但是加载原有视频的时候可以这样做，因为total是可以得到的
    //然后比较拿到的数据和total是否相等

     console.log('length:'+cachedResults.items.length)
     console.log('total:'+cachedResults.total)
     return cachedResults.items.length !== cachedResults.total
  },

  //向下刷新的时候读取更多的数据

  _fetchMoreData(){
    if(this._hasMore() || this.state.isLoadingTail){
      this.setState({
          isLoadingTail: false   //加载完数据了   
      })
      return 
    }

    var page = cachedResults.nextPage
    
    console.log('page:'+page)

    this._fetchData(page)

  },
  _renderFooter(){ //加载数据时候的样式，这个是加载老的视频，不考虑新添加的
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

//上拉的时候加载数据
  _onRefresh(){
    if(this.state.isRefreshing){
          console.log('no more ?')
          return
    }
    this._fetchData(0)
  },

  _renderRow(row){
    return <Item  
    key ={row._id}
    user = {this.state.user}
    onSelect={()=>this._loadPage(row)}
    row = {row}
    />
  },

  //加载详情页
  _loadPage(data){
    console.log('推送数据为：'+JSON.stringify(data))
    this.props.navigator.push({
      name:'detail',
      component: Detail,
      params: {
        data: data
      }
    })
  },

	render: function(){
		return(
			<View style={styles.container}>
        <View style={styles.header}>
				<Text style={styles.headerTitle}>列表页面</Text>
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          enableEmptySections={true}
          onEndReached = {this._fetchMoreData}
          onEndReachedThreshold={10}  //给一些刷新的提前量
          renderFooter = {this._renderFooter}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          refreshControl={
            <RefreshControl
            refreshing={this.state.isRefreshing}
            onRefresh={this._onRefresh}
            tintColor="#ff0000"
            title="Loading..."
            titleColor="#00ff00"
            colors={['#ff0000', '#00ff00', '#0000ff']}
            progressBackgroundColor="#ffff00"
            />
          }
        />
			</View>
		)
	}
})

var styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  header: {
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#ee735c'
  },
  
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600'
  },

  item: {
    width: width,
    marginBottom: 10,
    backgroundColor: '#fff'
  },

  thumb: {
    width: width,
    height: width * 0.56,
    resizeMode: 'cover'
  },

  title: {
    padding: 10,
    fontSize: 18,
    color: '#333'
  },

  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eee'
  },

  handleBox: {
    padding: 10,
    flexDirection: 'row',
    width: width / 2 - 0.5,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  play: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 46,
    height: 46,
    paddingTop: 9,
    paddingLeft: 18,
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 23,
    color: '#ed7b66'
  },

  handleText: {
    paddingLeft: 12,
    fontSize: 18,
    color: '#333'
  },

  down: {
    fontSize: 22,
    color: '#333'
  },

  up: {
    fontSize: 22,
    color: '#ed7b66'
  },

  commentIcon: {
    fontSize: 22,
    color: '#333'
  },

  loadingMore: {
    marginVertical: 20
  },

  loadingText: {
    color: '#777',
    textAlign: 'center'
  }
})

module.exports = List