// TODO: handle modes

const shiftToSubSeven = (note) => {
  return (note % 7)
}

const getIntervals = (figuredBass) => {
  if (figuredBass === '') {
    return [0, 2, 4]
  } else if (figuredBass === '7') {
    return [0, 2, 4, 6]
  } else {
    throw 'invalid figured bass provided'
  }
}

const getChromaticNote = (note) => {
  const intervalMapping = {
    0: 0,
    1: 2,
    2: 4,
    3: 5,
    4: 7,
    5: 9,
    6: 11
  }
  return intervalMapping[note]
}

const getChromaticNoteName = (cNote) => {
  cNoteToName = {
    0: 'C',
    1: 'C#',
    2: 'D',
    3: 'D#',
    4: 'E',
    5: 'F',
    6: 'F#',
    7: 'G',
    8: 'G#',
    9: 'A',
    10: 'A#',
    11: 'B',
  }
  return cNoteToName[cNote]
}

const cNotesToBinary = (cNotes) => {
  var hot = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  cNotes.forEach((cNote) => {
    hot[cNote] = 1
  })
  return hot
}

// Start app code

const chord = {
  "root": "6",
  "figuredBass": ""
}
chord.root = parseInt(chord.root) - 1

var notes = getIntervals(chord.figuredBass).map((interval) => chord.root + interval).map(shiftToSubSeven)
var cNotes = notes.map(getChromaticNote)
var hot = cNotesToBinary(cNotes)

console.log(hot)
