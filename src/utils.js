import PubSub from 'pubsub-js';
import uuid from 'uuid';

export function promisedPubSub(topic, data) {
  return new Promise(_promisedPubSub.bind(null, topic, data));
}

function _promisedPubSub(topic, data, resolve, reject) {
  let requestId = uuid();
  let cancelToken = PubSub.subscribe(`${topic}.response.${requestId}`, (resTopic, resData) => {
    PubSub.unsubscribe(cancelToken);

    if (resData && resData.error) {
      reject(resData.error);
      return;
    }

    resolve(resData);
  });

  PubSub.publish(`${topic}.request.${requestId}`, data);
}
