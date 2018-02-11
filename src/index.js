import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import ChatView from './ChatView';
// import registerServiceWorker from './registerServiceWorker';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import PubSub from 'pubsub-js';

import AuthenticationService from './AuthenticationService';
import LexService from './LexService';
import SpeechSynthesisService from './SpeechSynthesisService';
import SpeechRecognitionService from './SpeechRecognitionService';

new AuthenticationService();
new LexService();
new SpeechSynthesisService(PubSub);
new SpeechRecognitionService(PubSub);

injectTapEventPlugin();

ReactDOM.render(
  <Router>
    <App>
      <Switch>
        <Route exact path="/" component={ChatView}/>
      </Switch>
    </App>
  </Router>, document.getElementById('root')
);

// registerServiceWorker();
