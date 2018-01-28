import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';

import AuthenticationPresenter from './AuthenticationPresenter';

export default class AuthenticationDialog extends React.Component {
  state = {
    open: false,
    user: '',
    pass: '',
    passwordOnly: false
  };

  set open(value) {
    this.setState({open: value});
  }

  set passwordOnly(value) {
    this.setState({passwordOnly: value});
  }

  set username(value) {
    this.setState({username: value});
  }

  get username() {
    return this.state.user;
  }

  set password(value) {
    this.setState({password: value});
  }

  get password() {
    return this.state.pass;
  }

  handleClose = () => {
    this._pres.credentialsObtained();
  };

  handleChange(prop, event) {
    let newState = {};

    newState[prop] = event.target.value;

    this.setState(newState);
  }

  componentDidMount() {
    this._pres = new AuthenticationPresenter(this);
  }

  componentWillUnmount() {
    this._pres.finalize();
  }

  render() {
    const actions = [
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleClose}
      />,
    ];

    const usernameField = (
      <TextField
        id='usernameField'
        hintText="username"
        floatingLabelText="username"
        fullWidth={true}
        value={this.state.user}
        onChange={this.handleChange.bind(this, 'user')}
      />
    );

    const newPasswordRules = (
      <p>the new password needs to contain at least 8 characters with one letter in lower case, one letter in upper case, one digit, and one punctuation mark.</p>
    );

    return (
      <div>
        <Dialog
          actions={actions}
          modal={true}
          open={this.state.open}
          onRequestClose={this.handleClose}
          autoScrollBodyContent={true}
        >
          {this.state.passwordOnly ? newPasswordRules : usernameField}
          <TextField
            id='passwordField'
            hintText={this.state.passwordOnly ? 'new password' : 'password'}
            floatingLabelText={this.state.passwordOnly ? 'new password' : 'password'}
            type="password"
            fullWidth={true}
            value={this.state.pass}
            onChange={this.handleChange.bind(this, 'pass')}
          />
        </Dialog>
      </div>
    );
  }
}
