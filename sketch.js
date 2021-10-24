const radius = 390;
const maxMarbleSize = 20;
const minMarbleSize = 5;
const octaveHeight = radius * 0.9;
const baseSpeed = 0.05;
const marbleChaosFactor = 100;
const maxMarbleAmp = 5;
const minAge = 0;
const maxAge = 1;

let sustainValue = 0;

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

let objects = [];

function setup() {
  createCanvas(800, 800);
  center.x = width / 2;
  center.y = height / 2;
  background(0);

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
  background(0, 10);
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
      handleNoteOn(event.note);
      break;
    case 'noteoff':
      handleNoteOff(event.note);
      break;
    case 'controllerchange':
      handleControllerChange(event);
      break;
    default:
      break;
  }
}

function handleExternalMidiEvent(event) {
  const formattedMidiEvent = {
    type: event?.name?.toLowerCase().replace(/\s/g, ''),
    note: event.noteNumber && {
      name: event.noteName,
      number: event.noteNumber,
      velocity: event.velocity / 127
    },
    value: event?.value
  };
  handleMidiEvent(formattedMidiEvent);
}

//+++++++++++++++++++++++++++
function handleNoteOn(note) {
  const existingMarble = objects.find(
    ({ noteNumber, isActive }) => noteNumber === note?.number && isActive
  );

  handleNoteOff(note);
  generateMarble(note);
}

function handleNoteOff(note) {
  const existingMarble = objects.find(
    ({ noteNumber, isActive }) => noteNumber === note?.number && isActive
  );

  if (existingMarble) {
    existingMarble.isActive = false;
  }
}

function handleControllerChange(event) {
  sustainValue = event.value;
  if (sustainValue === 0) {
    objects = objects.filter(object => {
      return object.isActive;
    });
  }
}

function generateMarble(note) {
  const marbleRadius =
    (note.number / 90) * octaveHeight + (radius - octaveHeight);
  const Marble = {
    noteNumber: note.number,
    noteVelocity: note.velocity,
    angle: -1 * HALF_PI,
    speed: baseSpeed * note.velocity,
    age: 0,
    maxAge: random(maxAge - minAge),
    radius: marbleRadius,
    position: createVector(0, 0),
    size: 3,
    isActive: true
  };

  Marble.spawn = function () {
    objects.unshift(Marble);
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
    const color = Marble.isActive ? 'yellow' : 'grey';
    stroke(color);
    strokeWeight(size);
    point(Marble.position);
  };
  Marble.move = function () {
    Marble.position.x = Marble.radius * cos(Marble.angle) + center.x;
    Marble.position.y = Marble.radius * sin(Marble.angle) + center.y;
    Marble.angle -= Marble.speed * (Marble.age / 500 + 1);
  };
  Marble.ageUp = function () {
    // Marble.maxAge <= Marble.age && Marble.destroy();
    !Marble.isActive && Marble.age++;
  };

  Marble.spawn();

  return Marble;
}
