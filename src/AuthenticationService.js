import PubSub from 'pubsub-js';
import {promisedPubSub as pps} from './utils';
import {CognitoUserPool, CognitoUser, AuthenticationDetails} from 'amazon-cognito-identity-js';
import {default as AWS} from 'aws-sdk';

export default class AuthenticationService {
  constructor() {
    this._idPoolRegion = 'eu-west-1';
    this._idPoolId = 'eu-west-1:69308eea-5bcd-489e-9164-99f1e2bc2f90';
    this._userPoolEndPoint = 'cognito-idp.eu-central-1.amazonaws.com/eu-central-1_PmcVsBCje';
    this._userPoolId = 'eu-central-1_PmcVsBCje';
    this._clientId = '355eg1qgvlb380brt267d1rjfv';
    PubSub.subscribe('system.getIdToken.request', this._getIdTokenService.bind(this));
    PubSub.subscribe('system.getAwsCredentials.request', this._getAwsCredentialsService.bind(this));
    PubSub.subscribe('system.logout.request', this._logout.bind(this));
  }

  _logout(topic, data) {
    let userPool = new CognitoUserPool({
      UserPoolId : this._userPoolId,
      ClientId : this._clientId
    });

    if (userPool.getCurrentUser()) {
      userPool.getCurrentUser().signOut();
    }

    PubSub.publish(`system.logout.response.${topic.split('.')[3]}`);
  }

  _getCurrentIdToken() {
    return new Promise((resolve, reject) => {
      let userPool = new CognitoUserPool({
        UserPoolId : this._userPoolId,
        ClientId : this._clientId
      });

      userPool.getCurrentUser().getSession((error, session) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(session.getIdToken().jwtToken);
      });
    });
  }

  _authenticate() {
    return pps('ui.getCredentials').then(creds => {
      return new Promise((resolve, reject) => {
        let authenticationDetails = new AuthenticationDetails({
            Username : creds.username,
            Password : creds.password,
        });
        let userPool = new CognitoUserPool({
          UserPoolId : this._userPoolId,
          ClientId : this._clientId
        });
        let userData = {
            Username : creds.username,
            Pool : userPool
        };
        let cognitoUser = new CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: function (result) {
            // User authentication was successful
            resolve(result.getIdToken().jwtToken);
          },
          onFailure: function(err) {
            // User authentication was not successful
            reject(err);
          },
          newPasswordRequired: function(userAttributes, requiredAttributes) {
            // User was signed up by an admin and must provide new
            // password and required attributes, if any, to complete
            // authentication.
            pps('ui.getNewPassword').then(resNewPassword => {
              // the api doesn't accept this field back
              delete userAttributes.email_verified;

              // Get these details and call
              cognitoUser.completeNewPasswordChallenge(resNewPassword.newPassword, userAttributes, this);
            }).catch(e => {
              reject(e);
            });
          }
        });
      });
    });
  }

  _getIdTokenService(topic, data) {
    this._getIdToken().then(idToken => {
      PubSub.publish(`system.getIdToken.response.${topic.split('.')[3]}`, {
        idToken: idToken
      });
    });
  }

  _getIdToken() {
    return this._getCurrentIdToken().catch(err => {
      return this._authenticate();
    });
  }

  _getAwsCredentialsService(topic, data) {
    this._getAwsCredentials().then(cred => {
      PubSub.publish(`system.getAwsCredentials.response.${topic.split('.')[3]}`, {
        awsCredentials: cred
      });
    });
  }

  _getAwsCredentials() {
    return this._getIdToken().then(idToken => {
      let logins = {};

      logins[this._userPoolEndPoint] = idToken;
      AWS.config.region = this._idPoolRegion;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: this._idPoolId,
        Logins: logins
      });

      return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function(err, data){
          if (err) {
            reject(err);
            return;
          }

          resolve(AWS.config.credentials);
        });
      });
    });
  }
}
