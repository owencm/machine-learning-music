// This reads in XML files, filters them to only those with segments containing only 8 bar progressions of simple chords, and then writes a simplified representation to JSON files
// TODO: filter by mode too

const fsp = require('fs-promise');
const convert = require('xml-to-json-promise')

const concat = (arrs) => {
  return arrs.reduce((a, b) => { return a.concat(b) }, [])
}

console.logObj = (obj) => {
  console.log(JSON.stringify(obj, null, 4))
}

throwErr = (err) => { setTimeout(() => { throw err }) }

const findAllValuesWithKey = (obj, targetKey) => {
  if (typeof obj === 'string' || Object.keys(obj).length === 0) {
    return []
  }
  return concat(Object.keys(obj).map((key) => {
    if (key === targetKey) {
      // console.log('Found a key matching in', obj)
      return [obj[key]]
    } else {
      // console.log(key, '!==', targetKey, 'in', obj)
      return concat(findAllValuesWithKey(obj[key], targetKey))
    }
  }))
}

const isChordSimple = (chord) => {
  const checks = [
    ['', '7'].indexOf(chord.fb[0]) > -1,
    chord.sec === undefined || chord.sec[0] === '',
    chord.flat === undefined || chord.flat[0] === '',
    chord.pedal === undefined || chord.pedal[0] === '',
    chord.alternate === undefined || chord.alternate[0] === '',
    chord.borrowed === undefined || chord.borrowed[0] === ''  ,
    chord.chord_duration[0] === '1' || chord.chord_duration[0] === '2' || chord.chord_duration[0] === '4',
  ]
  return checks.reduce((a, b) => a && b)
}

const simplifyChord = (chord) => {
  return {
    root: chord.sd[0],
    figuredBass: chord.fb[0],
    duration: chord.chord_duration[0]
  }
}

const isEveryChordSimple = (segment) => {
  var chords = findAllValuesWithKey(segment, 'chord')
  return chords.map(isChordSimple).reduce((a, b) => a && b)
}

const isSegmentEightBars = (segment) => {
  // Not every segment includes numBeats, but if it does, require it be 8 bars
  if (segment.numBeats !== undefined && segment.numBeats[0] !== '16') {
    return false
  }
  var chords = findAllValuesWithKey(segment, 'chord')
  var beats = chords.reduce((beats, chord) => beats + parseInt(chord.chord_duration[0]), 0)
  return beats === 16
}

const getSimpleChordsFromSegments = (segments) => {
  segments = segments.filter(isEveryChordSimple)
  segments = segments.filter(isSegmentEightBars)
  var nSegmentsChords = segments.map((segment) => findAllValuesWithKey(segment, 'chord'))
  var nSSegmentsChords = nSegmentsChords.map((segmentChords) => { return segmentChords.map(simplifyChord) })
  return nSSegmentsChords
}

const getSimpleChordSegmentsById = (id) => {
  return fsp.readFile(`${__dirname}/xml/${id}.xml`, 'utf8').then(convert.xmlDataToJSON).then((json) => {
    var beatsInMeasure = findAllValuesWithKey(json, 'beats_in_measure')[0]
    var segments = findAllValuesWithKey(json, 'segment')
    return getSimpleChordsFromSegments(segments)
  })
}

for (var id = 4104; id < 9828; id++) {
  ((id) => {
    // TODO: refactor into read files then filter then simplify then write
    getSimpleChordSegmentsById(id).then((segments) => {
      if (segments.length > 0) {
        fsp.writeFileSync(`${__dirname}/chords/${id}.json`, JSON.stringify(segments, null, 2))
      }
    }).catch((e) => {})
  })(id)
}
