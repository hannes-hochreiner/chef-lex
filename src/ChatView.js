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
      pps('system.getLexTextResponse', {
        request: this.state.history[0],
        user: this.state.user,
        sessionAttributes: this.state.sessionAttributes
      }).then(res => {
        console.log(res.textResponse);
        this.setState((prevState) => {
          let history = prevState.history;

          history.unshift(res.textResponse.message);

          return {
            history: history,
            sessionAttributes: res.textResponse.sessionAttributes
          };
        });
      }).catch(err => {
        console.log(err);
      });
    });
    event.preventDefault();
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
