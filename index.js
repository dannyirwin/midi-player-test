const MidiPlayer = require('./node_modules/midi-player-js/build/index');
const Soundfont = require('./node_modules/soundfont-player/lib/index');

let loadFile;
let Player = new MidiPlayer.Player();

const audioContext = new AudioContext() || new webkitAudioContext();
const fileInputElement = document.querySelector('input[type=file]');
const playButtonElement = document.querySelector('#play-button');
const pauseButtonElement = document.querySelector('#pause-button');

fileInputElement.addEventListener('change', () => {
  loadFile();
  playButtonElement.removeAttribute('disabled');
  pauseButtonElement.removeAttribute('disabled');
});

playButtonElement.addEventListener('click', () => {
  Player.isPlaying() ? stop() : play();
});

pauseButtonElement.addEventListener('click', () => {
  pause();
});

const play = () => {
  Player.play();
  playButtonElement.innerHTML = 'Stop';
  pauseButtonElement.innerHTML = 'Pause';

  pauseButtonElement.removeAttribute('disabled');
};

const pause = () => {
  Player.pause();
  playButtonElement.innerHTML = 'Resume';
  pauseButtonElement.innerHTML = 'Paused';
  pauseButtonElement.setAttribute('disabled', true);
};

const stop = () => {
  Player.stop();
  playButtonElement.innerHTML = 'Play';
};

Soundfont.instrument(
  audioContext,
  'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js'
).then(instrument => {
  loadFile = async () => {
    Player.stop();

    const song = fileInputElement.files[0];
    const reader = new FileReader();
    song && reader.readAsArrayBuffer(song);

    reader.addEventListener(
      'load',
      function () {
        Player = new MidiPlayer.Player(function (event) {
          const midiEvent = new CustomEvent('midiEvent', { detail: event });
          document.dispatchEvent(midiEvent);
          if (event.name == 'Note on') {
            instrument.play(event.noteName, audioContext.currentTime, {
              gain: event.velocity / 100
            });
          }
        });

        Player.loadArrayBuffer(reader.result);
        play();
      },
      false
    );
  };
});

module.exports = Player;
