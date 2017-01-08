

const Swiper = require('react-native-swiper')
import React, {Component} from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableHighlight,
  Dimensions,
} from 'react-native'

const {height, width} = Dimensions.get('window')

var Slider = React.createClass({

	getInitialState(){
		return {
			loop: false,
			banners:[
				require('../static/slider/s1.jpg'),
				require('../static/slider/s2.jpg'),
				require('../static/slider/s3.jpg'),
			],
		}
	},

	_enter(){
		this.props.enterSlide()
	},

	render () {
	        let innerButton = null
	        var banners = this.state.banners
		    
		    return (
		      <Swiper
		        dot={<View style={styles.dot} />}
		        activeDot={<View style={styles.activeDot} />}
		        paginationStyle={styles.pagination}
		        loop={this.state.loop}>
		        <View style={styles.slide}>
		          <Image style={styles.image} resizeMode ={'contain'} source={banners[0]}>
		            {innerButton}
		          </Image>
		        </View>
		        <View style={styles.slide}>
		          <Image style={styles.image} resizeMode ={'contain'} source={banners[1]}>
		            {innerButton}
		          </Image>
		        </View>
		        <View style={styles.slide}>
		          <Image style={styles.image} resizeMode ={'contain'} source={banners[2]}>
		            {innerButton}
		          </Image>
		          <TouchableHighlight style={styles.btn} onPress={this._enter}>
		            <Text style={styles.btnText}>马上体验</Text>
		          </TouchableHighlight>
		        </View>
		      </Swiper>
		    )
	}

})

var styles = StyleSheet.create({
	  container:{
	  	flex: 1
	  },
	  slide: {
	    flex: 1,
	    width: width,
	  },
	  image:{
	  	flex: 1,
	  	width: width,
	  	height: height
	  },
	  dot:{
	  	width: 14,
	  	height: 14,
	  	backgroundColor: 'transparent',
	  	borderWidth: 1,
	  	borderColor: '#ff6600',
	  	borderRadius: 7,
	  	marginLeft :12,
	  	marginRight: 12,
	  	marginBottom: 25,
	  },
	  activeDot:{
	  	width: 14,
	  	height: 14,
	  	borderWidth: 1,
	  	backgroundColor: '#ee735c',
	  	borderColor: '#ee735c',
	  	borderRadius: 7,
	  	marginLeft :12,
	  	marginRight: 12,
	  	marginBottom: 25,
	  },
	  pagination:{
	  	bottom:30
	  },
	  btn: {
        position: 'absolute',
	    width: width - 20,
	    left: 10,
	    bottom: 80,
	    height: 50,
	    padding: 15,
	    backgroundColor: 'transparent',
	    borderColor: '#ee735c',
	    borderWidth: 1,
	    borderRadius: 3,
	  },
	   btnText: {
	    color: '#ee735c',
	    fontSize: 20,
	    textAlign: 'center'
	  }
})


module.exports = Slider