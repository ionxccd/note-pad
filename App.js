import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TextInput,
   SafeAreaView, TouchableOpacity, TouchableWithoutFeedback, FlatList, Button, Alert } from 'react-native';
import styles from './style/styles.js';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import Overlay from 'react-native-modal-overlay';
import { FloatingAction } from "react-native-floating-action";

const db = SQLite.openDatabase("test.db", "1.0", "", 1);

const actions = [
  {
    text: "Delete All Posts",
    icon: require("./assets/delete.png"),
    name: "bt_delete",
    position: 1,
    textColor:'red'
  },
  {
    text: "Create Post",
    icon: require("./assets/add-btn.png"),
    name: "bt_add",
    position: 2
  }
]

export default class App extends React.Component {
  constructor(props) {
    super(props);
      this.state={
        myitems:[],
        noteContent:"",
        tasks:0,
        modalVisible: false,
        editVisible:false,
        currentData:"",
        editData:"",
        currentContent:""
      };
      this.refresh = this.refresh.bind(this);
      this.myTextInput = React.createRef();

    db.transaction(txn => {
        txn.executeSql("CREATE TABLE IF NOT EXISTS notepad_posts(id INTEGER primary key, content TEXT, date_created INTEGER)", [], (tx, res) => {
      });
    });
  }

  refresh() {
    this.setState({ myitems: null });
    this.reloadPosts();
  }

  componentDidMount = () => {
    this.reloadPosts();
  }

  reloadPosts = () => {
    db.transaction(txn => {
      txn.executeSql("SELECT * FROM 'notepad_posts' ORDER BY id DESC", [], (tx, res) => {
        var temp = [];
        for (let i = 0; i < res.rows.length; ++i) {
          temp.push(res.rows.item(i));
        }
        this.setState({myitems:temp})
      });
    });
  }

  createPost = () => {
    if (this.state.noteContent == ""){
      Alert.alert("ERROR", "Please enter input field");
    }else{

      var date = new Date().toDateString();
      db.transaction(txn => {
        txn.executeSql("INSERT INTO 'notepad_posts' (content, date_created) VALUES (?, ?)", [this.state.noteContent, date], (tx, res) => {
          this.setState({noteContent:""})
        })
      });
      this.refresh();
      this.myTextInput.current.clear();
    }
  }

  editPost = (item, newcontent) => {
    db.transaction(txn => {
      txn.executeSql("UPDATE 'notepad_posts' SET content = ? WHERE id = ?", [newcontent, item], (tx, res) => {
      })
    });
    this.setState({editVisible:false, modalVisible:false});
    this.refresh();
  }

  onClose = () => this.setState({ modalVisible: false});
  onClose2 = () => this.setState({editVisible:false});

  confirmDelete = (item) => {
    db.transaction(txn => {
      txn.executeSql("DELETE FROM 'notepad_posts' WHERE id = ?", [item], (tx, res) => {
      })
    });
    this.setState({modalVisible:false});
    this.refresh();
  }

  deleteAllPosts = () => {
    Alert.alert("WARNING", "Are you sure you want to delete all posts?",
    [
        {
          text: "Yes",
          onPress: () => {
            db.transaction(txn => {
              txn.executeSql("DELETE FROM 'notepad_posts'", [], (tx, res) => {
              })
            });
            this.refresh();
          },
        },
        {
          text: "No",
        },
      ]
    )
  }

  deletePost = (item) => {
    Alert.alert("WARNING", "Are you sure you want to delete post?",
    [
        {
          text: "Yes",
          onPress: () => {
            this.confirmDelete(item)
          },
        },
        {
          text: "No",
          onPress: () => {
            this.setState({modalVisible:false})
          }
        },
      ]
    )
  }

  postClick = (id, content) => {
    this.setState({
      modalVisible:true,
      currentData:id,
      currentContent:content
    })
  }

  selectAction = (name) => {
    if (name == "bt_add"){
      this.createPost();
    }
    if (name == "bt_delete"){
      this.deleteAllPosts();
    }
  }

  renderItemComponent = ({item, index}) => {
        return (
          <View style={[styles.postStyles, {backgroundColor: index % 2 === 0 ? '#bfbdbd' : '#dbd9d9'}]}>
            <TouchableWithoutFeedback onPress={() => this.postClick(item.id, item.content)}>
              <View style={{flexDirection:'column'}}>
                <Text style={{fontWeight: 'bold', textAlign: 'left', fontSize: 18}}>{item.content}</Text>
                <Text style={styles.dateStyle}>{item.date_created}</Text>
              </View>
              </TouchableWithoutFeedback>
              <Overlay visible={this.state.modalVisible} onClose={this.onClose} closeOnTouchOutside>
                <Text style={{fontWeight:'bold', fontSize: 20}}>POST OPTIONS</Text>
                <TouchableOpacity style={styles.optionsStyle} onPress={() => this.setState({editVisible:true})}>
                  <Text style={[styles.optionItemStyle,{backgroundColor: '#bfbdbd'}]}>Edit Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionsStyle} onPress={(item) => this.deletePost(this.state.currentData)}>
                  <Text style={[styles.optionItemStyle,{backgroundColor: '#bfbdbd', color: 'red'}]}>Delete Post</Text>
                </TouchableOpacity>
              </Overlay>
              <Overlay visible={this.state.editVisible} onClose={this.onClose2} closeOnTouchOutside childrenWrapperStyle={{backgroundColor:  '#e6e3e3'}}>
                <Text style={{fontWeight:'bold'}}>Edit Post</Text>
                <TextInput
                style={styles.editInput}
                onChangeText={(data) => this.setState({editData:data})}
                defaultValue={this.state.currentContent}/>
              <TouchableOpacity style={styles.editBtnStyle} onPress={(item) => this.editPost(this.state.editData, this.state.editData)}>
                <Text style={{textAlign:'center', padding: 10, fontSize: 18}}>EDIT</Text>
              </TouchableOpacity>
              </Overlay>
            </View>
        );
    };

  render(){
  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        <TextInput
          onChangeText={(text) => this.setState({noteContent:text})}
          placeholder={"Enter New Task"}
          ref={this.myTextInput}
          style={styles.input}/>
        {/* <TouchableOpacity
          onPress={this.createPost}
          style={styles.roundButton1}>
          <Text>➤</Text>
        </TouchableOpacity> */}
      </View>
      <FlatList
      data={this.state.myitems}
      renderItem={item => this.renderItemComponent(item)}
      keyExtractor={(item, index) => index}/>
      <FloatingAction
        color={'#007CBE'}
        actions={actions}
        onPressItem={name => {
          this.selectAction(name)
        }}
      />
  </View>
  );
}
}
