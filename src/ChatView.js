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
import RecipeView from './RecipeView';

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
      'salad': {
        'ingredients': [
          {'title': 'lettuce'},
          {'title': 'tomatos'},
          {'title': 'mushrooms'}
        ],
        'steps': [
          {'description': 'wash the lettuce, the tomatos, and the mushrooms'},
          {'description': 'chop the tomatos and the mushrooms'},
          {'description': 'add dressing'}
        ]
      },
      'soup': {
        'ingredients': [
          {'title': 'onions'},
          {'title': 'beef broth'},
          {'title': 'white wine'}
        ],
        'steps': [
          {'description': 'peel and chop the onions'},
          {'description': 'sauté the onions'},
          {'description': 'add the salt'},
          {'description': 'stir in the wine'},
          {'description': 'add the broth'}
        ]
      },
      'fish': {
        'ingredients': [
          {'title': 'fish'},
          {'title': 'flour'},
          {'title': 'spices'}
        ],
        'steps': [
          {'description': 'wash the fish'},
          {'description': 'fillet the fish'},
          {'description': 'mix the flour and the spices'},
          {'description': 'dip the fish into the mixture'},
          {'description': 'fry the fish for 5 minutes'}
        ]
      }
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
    if (event) {
      event.preventDefault();
    }

    this._setState((prevState) => {
      let text = prevState.text;
      let history = prevState.history;

      history.unshift({
        text: text,
        source: 'me'
      });

      return {
        history: history,
        text: '',
        processing: true
      };
    }).then(() => {
      return pps('system.getLexTextResponse', {
        request: this.state.history[0].text,
        user: this.state.user,
        sessionAttributes: this.state.sessionAttributes
      });
    }).then(res => {
      console.log(res);
      if (res.textResponse.dialogState === 'ReadyForFulfillment') {
        if (res.textResponse.intentName === 'SelectRecipe') {
          if (typeof this.recipes[res.textResponse.slots['Recipe']] === 'undefined') {
            return this._setState((prevState) => {
              let history = prevState.history;

              history.unshift({
                text: `Sorry, I don't know how to cook ${res.textResponse.slots['Recipe']} yet.`,
                source: 'lex'
              });

              return {history: history};
            }).then(() => {
              return this._speak(this.state.history[0].text);
            });
          }

          let responseText = `Great! Let's cook ${res.textResponse.slots['Recipe']} for ${res.textResponse.slots['NumberOfPortions']} people.`;
          let selectedRecipe = JSON.parse(JSON.stringify(this.recipes[res.textResponse.slots['Recipe']]));

          return this._setState((prevState) => {
            let history = prevState.history;

            history.unshift({
              text: responseText,
              source: 'lex'
            });

            return {
              history: history,
              selectedRecipe: selectedRecipe,
              currentStep: -1
            };
          }).then(() => {
            return this._speak(this.state.history[0].text);
          }).then(() => {
            return this._describeNextStep();
          });
        } else if (res.textResponse.intentName === 'AddStep') {
          if (res.textResponse.slots['stepPosition'] - 1 > 0) {
            let idx = Math.min(res.textResponse.slots['stepPosition'] - 1, this.state.selectedRecipe.steps.length);

            return this._setState((prevState) => {
              this.state.selectedRecipe.steps.splice(idx, 0, {'description': res.textResponse.slots['stepAction']});
            });
          }
        } else if (res.textResponse.intentName === 'GoToNextStep') {
          if (this.state.currentStep + 1 < this.state.selectedRecipe.steps.length) {
            return this._setState(prevState => {
              prevState.selectedRecipe.steps[this.state.currentStep].done = true;

              return prevState;
            }).then(() => {
              return this._describeNextStep();
            });
          }

          return this._setState((prevState) => {
            let history = prevState.history;

            history.unshift({
              text: `You are all done. Enjoy your meal!`,
              source: 'lex'
            });

            return {
              history: history,
              sessionAttributes: res.textResponse.sessionAttributes,
              selectedRecipe: null,
              currentStep: null
            };
          }).then(() => {
            return this._speak(this.state.history[0].text);
          });
        }
      } else {
        return this._setState((prevState) => {
          let history = prevState.history;

          history.unshift({
            text: res.textResponse.message,
            source: 'lex'
          });

          return {
            history: history,
            sessionAttributes: res.textResponse.sessionAttributes
          };
        }).then(() => {
          return this._speak(this.state.history[0].text);
        });
      }
    }).then(() => {
      return this._setState({
        processing: false
      });
    }).catch(err => {
      console.log(err);
    });
  }

  _describeNextStep() {
    return this._setState((prevState) => {
      let nextStep = prevState.currentStep + 1;
      let responseText = `Step ${nextStep + 1} is to ${this.state.selectedRecipe.steps[nextStep].description}`;
      let history = prevState.history;

      history.unshift({
        text: responseText,
        source: 'lex'
      });

      return {
        history: history,
        currentStep: nextStep
      };
    }).then(() => {
      return this._speak(this.state.history[0].text);
    });
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
    return pps('system.speakText', {text: text});
  }

  _recognizeSpeech() {
    pps('system.recognizeSpeech').then(res => {
      return this._setState({text: res.text});
    }).then(() => {
      this.handleSubmit();
    });
  }

  handleChange(event) {
    this.setState({text: event.target.value});
  }

  render() {
    let info = <RecipeList recipes={this.recipes}/>;

    if (this.state.selectedRecipe) {
      info = <RecipeView recipe={this.state.selectedRecipe} currentStep={this.state.currentStep}/>;
    }

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
              <IconAvMic onClick={this._recognizeSpeech.bind(this)}/>
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
            {info}
          </Tab>
        </Tabs>
      </div>
    );
  }
}
