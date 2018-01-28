import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import ChatView from './ChatView';
// import registerServiceWorker from './registerServiceWorker';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import AuthenticationService from './AuthenticationService';
import LexService from './LexService';

new AuthenticationService();
new LexService();

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
