const radius = 200;
const maxMarbleSize = 20;
const minMarbleSize = 5;
const octaveHeight = radius * 0.9;
const speed = 0.01;
const marbleChaosFactor = 100;
const maxMarbleAmp = 5;
const minAge = 500;
const maxAge = 2000;

const testNoteEvent = {
  type: 'noteon',
  note: {
    number: 4,
    name: 'F',
    octave: 7,
    velocity: 0.3937007874015748,
    rawVelocity: 50
  }
};

const center = { x: 0, y: 0 };

const objects = [];

function setup() {
  createCanvas(800, 800);
  center.x = width / 2;
  center.y = height / 2;

  document.addEventListener('keydown', e => {
    handleMidiEvent(e);
    testNoteEvent.note.number = floor(random(108));
    testNoteEvent.note.velocity = random(0.7) + 0.2;
  });

  document.addEventListener('midiEvent', e => {
    handleExternalMidiEvent(e.detail);
  });

  ////
  //Setting up MIDI
  ////
  WebMidi.enable(function (err) {
    //check if WebMidi.js is enabled
    if (err) {
      console.log('WebMidi could not be enabled.', err);
    } else {
      console.log('WebMidi enabled!');
    }

    //Choose an input port
    inputSoftware = WebMidi?.inputs[0];
    //The 0 value is the first value in the array

    //listen to all incoming "note on" input events
    inputSoftware &&
      inputSoftware.addListener('all', function (e) {
        handleMidiEvent(e);
      });
  });
}

function draw() {
  background(0, 20);
  objects.forEach(obj => obj.update());
}

function devMode() {
  strokeWeight(10);
  stroke('red');
  point(center.x, center.y);
}

function handleMidiEvent(event) {
  //All logic for how to handle different Midi Events happens here
  switch (event.type) {
    case 'noteon':
      generateMarble(event.note || testNoteEvent.note);
    case 'noteoff':
      handleNoteOff(event.note);
    default:
      return;
  }
}

function handleExternalMidiEvent(event) {
  if (event.name === 'Note on' || event.name === 'Note off') {
    console.log(event);
  }
  const formattedMidiEvent = {
    type: event?.name?.toLowerCase().replace(/\s/g, ''),
    note: event.noteNumber && {
      name: event.noteName,
      number: event.noteNumber,
      velocity: event.velocity / 127
    }
  };
  handleMidiEvent(formattedMidiEvent);
}

//+++++++++++++++++++++++++++

function handleNoteOff(note) {
  const marble = objects.find(({ noteNumber }) => noteNumber === note.number);
  if (marble) {
    marble.isActive = false;
  }
}

function generateMarble(note) {
  const marbleRadius = (((note.number % 12) + 1) / 12) * octaveHeight;
  const Marble = {
    noteNumber: note.number,
    angle: HALF_PI,
    age: 0,
    maxAge: random(maxAge - minAge),
    radius: marbleRadius + radius,
    position: createVector(0, 0),
    size: note.velocity * (maxMarbleSize - minMarbleSize),
    isActive: true
  };
  // Marble.position.x = center.x;
  // Marble.position.y = center.y - Marble.radius;
  Marble.spawn = function () {
    objects.push(Marble);
    Marble.draw();
  };
  Marble.destroy = function () {
    const i = objects.indexOf(Marble);
    objects.splice(i, 1);
  };
  Marble.update = function () {
    Marble.move();
    Marble.draw();
    Marble.ageUp();
  };
  Marble.draw = function (size = Marble.size) {
    const color = Marble.isActive ? 'red' : 'white';
    stroke(color);
    strokeWeight(size);
    point(Marble.position);
  };
  Marble.move = function () {
    Marble.position.x = Marble.radius * cos(Marble.angle) + center.x;
    Marble.position.y = Marble.radius * sin(Marble.angle) + center.y;
    Marble.angle -= speed;
  };
  Marble.ageUp = function () {
    Marble.maxAge <= Marble.age && Marble.destroy();
    Marble.age += 1;
  };

  Marble.spawn();

  return Marble;
}
