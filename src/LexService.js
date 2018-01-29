import PubSub from 'pubsub-js';
import {promisedPubSub as pps} from './utils';
import {default as AWS} from 'aws-sdk';

export default class AuthenticationService {
  constructor() {
    this._region = 'eu-west-1';
    this._botName = 'CookBot';
    this._botAlias = 'webVersion';
    PubSub.subscribe('system.getLexTextResponse.request', this._getTextResponseService.bind(this));
    PubSub.subscribe('system.getLexAudioResponse.request', this._getAudioResponseService.bind(this));
  }

  _getTextResponseService(topic, data) {
    this._getLexResponse(data.request, data.user, 'text/plain; charset=utf-8', 'audio/mpeg').then(res => {
      PubSub.publish(`system.getLexTextResponse.response.${topic.split('.')[3]}`, {
        textResponse: res
      });
    });
  }

  _getAudioResponseService(topic, data) {
    this._getLexResponse(data.request, data.user, 'audio/x-cbr-opus-with-preamble; preamble-size=0; bit-rate=256000; frame-size-milliseconds=4', 'audio/mpeg').then(res => {
      PubSub.publish(`system.getLexAudioResponse.response.${topic.split('.')[3]}`, {
        audioResponse: res
      });
    });
  }

  _getLexResponse(request, user, contentType, accept) {
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
          contentType: contentType,
          accept: accept
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
