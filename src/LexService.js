import PubSub from 'pubsub-js';
import {promisedPubSub as pps} from './utils';
import {default as AWS} from 'aws-sdk';

export default class AuthenticationService {
  constructor() {
    this._region = 'eu-west-1';
    this._botName = 'CookBot';
    this._botAlias = 'webVersion';
    PubSub.subscribe('system.getLexTextResponse.request', this._getTextResponseService.bind(this));
  }

  _getTextResponseService(topic, data) {
    this._getTextResponse(data.request, data.user).then(res => {
      PubSub.publish(`system.getLexTextResponse.response.${topic.split('.')[3]}`, {
        textResponse: res
      });
    });
  }

  _getTextResponse(request, user) {
    return pps('system.getAwsCredentials').then(cred => {
      let lexruntime = new AWS.LexRuntime({
        region: this._region,
        credentials: cred.awsCredentials
      });

      return new Promise((resolve, reject) => {
        lexruntime.postContent({
          botName: this._botName,
          botAlias: this._botAlias,
          userId: user,
          inputStream: request,
          contentType: 'text/plain; charset=utf-8',
          accept: 'text/plain; charset=utf-8'
        }, (err, data) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(data);
        });
      });
    });
  }
}
