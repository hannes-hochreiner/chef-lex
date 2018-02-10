export default class SpeechSynthesisService {
  constructor(ps) {
    this._ps = ps;
    this._ps.subscribe('system.speakText.request', this._speak.bind(this));
  }

  _speak(topic, data) {
    var msg = new SpeechSynthesisUtterance(data.text);

    // msg.onend = () => {
    //   console.log('speech end');
    //   this._ps.publish(`system.speakText.response.${topic.split('.')[3]}`);
    // };

    window.speechSynthesis.speak(msg);
    this._ps.publish(`system.speakText.response.${topic.split('.')[3]}`);
  }
}
