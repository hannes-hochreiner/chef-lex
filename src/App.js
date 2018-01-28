import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import AuthenticationDialog from './AuthenticationDialog';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {lightGreen800, deepOrangeA400} from 'material-ui/styles/colors';

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: lightGreen800,
    accent1Color: deepOrangeA400,
  }
});

class App extends Component {
  render() {
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <AuthenticationDialog/>
          {this.props.children}
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
