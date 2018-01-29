import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import {promisedPubSub as pps} from './utils';

export default class ChatView extends Component {
  state = {
    history: [],
    text: '',
    user: 'test' + (new Date()).toISOString(),
    sessionAttributes: {}
  };

  constructor() {
    super();
    console.log(MediaRecorder.isTypeSupported('audio/webm\;codecs=opus'));
    let that = this;
    navigator.mediaDevices.getUserMedia({audio:true, video:false}).then(function(stream) {
      that._mediaRecorder = new MediaRecorder(stream, {audioBitsPerSecond: 16000, mimeType: 'audio/webm\;codecs=opus'});
      that._audioChunks = [];
      that._mediaRecorder.ondataavailable = that.handleAudioDataAvailable.bind(that);
      that._mediaRecorder.onstop = that.handleAudioRecorderStopped.bind(that);
    });
  }

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

  handleSubmit(event) {
    this.setState((prevState) => {
      let text = prevState.text;
      let history = prevState.history;

      history.unshift(text);

      return {
        history: history,
        text: ''
      };
    }, () => {
      pps('system.getLexAudioResponse', {
        request: this.state.history[0],
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
    });
    event.preventDefault();
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
    this._mediaRecorder.start();
  }

  _stopAudioRecording() {
    this._mediaRecorder.stop();
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
          <input type="text" value={this.state.text} onChange={this.handleChange.bind(this)} />
        </form>
        <button onClick={this._startAudioRecording.bind(this)}>start</button>
        <button onClick={this._stopAudioRecording.bind(this)}>stop</button>
        <ul>
          {this.state.history.map(e => {
            return <li>{e}</li>;
          })}
        </ul>
      </div>
    );
  }
}
