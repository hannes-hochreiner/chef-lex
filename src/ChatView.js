import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import {List, ListItem} from 'material-ui/List';
import CommunicationChatBubble from 'material-ui/svg-icons/communication/chat-bubble';

import {promisedPubSub as pps} from './utils';

export default class ChatView extends Component {
  state = {
    history: [],
    text: '',
    user: 'test' + (new Date()).toISOString(),
    sessionAttributes: {},
    processing: false
  };

  // constructor() {
    // super();
    // console.log(MediaRecorder.isTypeSupported('audio/webm\;codecs=opus'));
    // let that = this;
    // navigator.mediaDevices.getUserMedia({audio:true, video:false}).then(function(stream) {
    //   that._mediaRecorder = new MediaRecorder(stream, {audioBitsPerSecond: 16000, mimeType: 'audio/webm\;codecs=opus'});
    //   that._audioChunks = [];
    //   that._mediaRecorder.ondataavailable = that.handleAudioDataAvailable.bind(that);
    //   that._mediaRecorder.onstop = that.handleAudioRecorderStopped.bind(that);
    // });
  // }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  handleAudioDataAvailable(event) {
    this._audioChunks.push(event.data);
  }

  handleAudioRecorderStopped() {
    var blob = new Blob(this._audioChunks, { 'type' : 'audio/webm\;codecs=opus' });
    this._audioChunks = [];
    // let audio = new Audio();
    // audio.src = URL.createObjectURL(blob);
    // audio.addEventListener('ended', function() {
    //   audio.currentTime = 0;
    //   audio.src = null;
    // });
    // audio.play();
    pps('system.getLexAudioResponse', {
      request: blob,
      user: this.state.user,
      sessionAttributes: this.state.sessionAttributes
    }).then(res => {
      return Promise.all([
        this._playAudio(res.audioResponse.audioStream),
        this._setState((prevState) => {
          let history = prevState.history;

          history.unshift(res.audioResponse.message);

          return {
            history: history,
            sessionAttributes: res.audioResponse.sessionAttributes
          };
        })
      ]);
    }).catch(err => {
      console.log(err);
    });
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.handleSubmit(e);
      e.preventDefault();
    }
  }

  handleSubmit(event) {
    this.setState((prevState) => {
      let text = prevState.text;
      let history = prevState.history;

      history.unshift({
        text: text,
        source: 'me'
      });

      return {
        history: history,
        text: ''
      };
    }, () => {
      pps('system.getLexTextResponse', {
        request: this.state.history[0].text,
        user: this.state.user,
        sessionAttributes: this.state.sessionAttributes
      }).then(res => {
        console.log(res);
        if (res.textResponse.dialogState === 'ReadyForFulfillment') {
          if (res.textResponse.intentName === 'SelectRecipe') {
            return this._setState((prevState) => {
              let history = prevState.history;

              history.unshift({
                text: `Great! Let's cook ${res.textResponse.slots['Recipe']} for ${res.textResponse.slots['NumberOfPortions']} people.`,
                source: 'lex'
              });

              return history;
            }).then(() => {
              this._speak(this.state.history[0].text);
            });
          }
        } else {
          return Promise.all([
            this._speak(res.textResponse.message),
            this._setState((prevState) => {
              let history = prevState.history;

              history.unshift({
                text: res.textResponse.message,
                source: 'lex'
              });

              return {
                history: history,
                sessionAttributes: res.textResponse.sessionAttributes
              };
            })
          ]);
        }
      }).catch(err => {
        console.log(err);
      });
    });

    if (event) {
      event.preventDefault();
    }
  }

  _setState(state) {
    return new Promise((resolve, reject) => {
      this.setState((prevState) => {
        if (typeof state === 'function') {
          return state(prevState);
        }

        return state;
      }, () => {
        resolve();
      });
    });
  }

  _startAudioRecording() {
    // this._mediaRecorder.start();

    // var msg = new SpeechSynthesisUtterance('this is a test');
    // window.speechSynthesis.speak(msg);
    this._sr = new window.webkitSpeechRecognition();
    this._sr.onresult = (e) => {
      this._setState({text: e.results[0][0].transcript}).then(() => {
        this.handleSubmit();
      });
    };
    this._sr.start();
  }

  _stopAudioRecording() {
    this._sr.stop();
    delete this._sr;
    // this._mediaRecorder.stop();
  }

  _speak(text) {
    this._setState({processing: true}).then(() => {
      return pps('system.speakText', {text: text});
    }).then(() => {
      this._setState({processing: false});
    });
  }

  _playAudio(stream) {
    return new Promise((resolve, reject) => {
      let audio = new Audio();
      audio.src = URL.createObjectURL(new Blob([stream], { type: 'audio/mpeg' }));
      audio.addEventListener('ended', function() {
        audio.currentTime = 0;
        audio.src = null;
        resolve();
      });
      audio.play();
    });
  }

  handleChange(event) {
    this.setState({text: event.target.value});
  }

  render() {
    return (
      <div>
        <AppBar title="ChatView" />
        <form onSubmit={this.handleSubmit.bind(this)}>
          <TextField
            disabled={this.state.processing}
            hintText='Start chatting'
            value={this.state.text}
            onChange={this.handleChange.bind(this)}
            onKeyPress={this.handleKeyPress.bind(this)}
          />
        </form>
        <button onClick={this._startAudioRecording.bind(this)}>start</button>
        <button onClick={this._stopAudioRecording.bind(this)}>stop</button>
        <List style={{'width': '500px'}}>
          {this.state.history.map((e, idx) => {
            if (e.source === 'me') {
              return <ListItem
                  key={idx}
                  primaryText={e.text}
                  leftIcon={<CommunicationChatBubble />}
                />;
            }
            return <ListItem
                key={idx}
                primaryText={e.text}
                rightIcon={<CommunicationChatBubble />}
              />;
          })}
        </List>
      </div>
    );
  }
}
