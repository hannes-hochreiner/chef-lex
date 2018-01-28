import PubSub from 'pubsub-js';

export default class AuthenticationPresenter {
  constructor(authenticationView) {
    this._av = authenticationView;
    this._cancelTokenCreds = PubSub.subscribe('ui.getCredentials.request', this._authRequest.bind(this, false));
    this._cancelTokenNewPass = PubSub.subscribe('ui.getNewPassword.request', this._authRequest.bind(this, true));
  }

  finalize() {
    PubSub.unsubscribe(this._cancelTokenCreds);
    delete this._cancelTokenCreds;
    PubSub.unsubscribe(this._cancelTokenNewPass);
    delete this._cancelTokenNewPass;
    delete this._av;
  }

  _authRequest(passwordOnly, topic, data) {
    this._currentRequest = { topic: topic, data: data, passwordOnly: passwordOnly};
    this._av.passwordOnly = passwordOnly;
    this._av.username = '';
    this._av.password = '';
    this._av.open = true;
  }

  credentialsObtained() {
    this._av.open = false;

    if (this._currentRequest.passwordOnly) {
      PubSub.publish(`ui.getNewPassword.response.${this._currentRequest.topic.split('.')[3]}`, {
        newPassword: this._av.password
      });
    } else {
      PubSub.publish(`ui.getCredentials.response.${this._currentRequest.topic.split('.')[3]}`, {
        username: this._av.username,
        password: this._av.password
      });
    }
    delete this._currentRequest;
  }
}
