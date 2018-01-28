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

  componentDidMount() {
    // this._pres = new InfoPresenter(this);
  }

  componentWillUnmount() {
    // this._pres.finalize();
    // delete this._pres;
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
        <ul>
          {this.state.history.map(e => {
            return <li>{e}</li>;
          })}
        </ul>
      </div>
    );
  }
}
