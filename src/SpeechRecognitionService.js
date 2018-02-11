export default class SpeechRecognitionService {
  constructor(ps) {
    this._ps = ps;
    this._ps.subscribe('system.recognizeSpeech.request', this._recognizeSpeech.bind(this));
  }

  _recognizeSpeech(topic, data) {
    let sr = window.webkitSpeechRecognition || window.SpeechRecognition;
    let recognition = new sr();

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let trans = event.results[0][0].transcript;

      this._ps.publish(`system.recognizeSpeech.response.${topic.split('.')[3]}`, {
        text: trans
      });
    };

    recognition.start();
  }
}
