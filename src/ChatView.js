import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import TextField from 'material-ui/TextField';
import {List, ListItem} from 'material-ui/List';
import CommunicationChatBubble from 'material-ui/svg-icons/communication/chat-bubble';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import IconAvMic from 'material-ui/svg-icons/av/mic';
import {Tabs, Tab} from 'material-ui/Tabs';

import RecipeList from './RecipeList';

import {promisedPubSub as pps} from './utils';

export default class ChatView extends Component {
  state = {
    history: [],
    text: '',
    user: 'test' + (new Date()).toISOString(),
    sessionAttributes: {},
    processing: false,
    stage: 'SelectRecipe'
  };

  constructor() {
    super();
    this.recipes = {
      'cereal': {},
      'meat': {}
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
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

  _speak(text) {
    this._setState({processing: true}).then(() => {
      return pps('system.speakText', {text: text});
    }).then(() => {
      this._setState({processing: false});
    });
  }

  handleChange(event) {
    this.setState({text: event.target.value});
  }

  render() {
    return (
      <div>
        <AppBar title="Chef Lex" />
        <Toolbar>
          <ToolbarGroup firstChild={true}>
            <TextField
              disabled={this.state.processing}
              hintText='Start chatting'
              value={this.state.text}
              onChange={this.handleChange.bind(this)}
              onKeyPress={this.handleKeyPress.bind(this)}
              fullWidth={true}
            />
            <IconButton disabled={this.state.processing}>
              <IconAvMic/>
            </IconButton>
          </ToolbarGroup>
        </Toolbar>
        <Tabs>
          <Tab label="Chat">
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
          </Tab>
          <Tab label="Info">
            <RecipeList recipes={this.recipes}/>
          </Tab>
        </Tabs>
      </div>
    );
  }
}
