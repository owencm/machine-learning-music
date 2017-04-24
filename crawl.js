const fetch = require('node-fetch')
const fsp = require('fs-promise')
const dir = 'xml'

var numWorkers = 10
var workersLeft = numWorkers
var sleepBetweenFetches = 30000

var id = 9478
var maxId = id + 3000
var songs = []

const sleep = (ms) => {
  return () => {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms)
    })
  }
}

const fetchXMLForSong = (id) => {
  return fetch(`https://www.hooktheory.com/songs/getXmlByPk?pk=${id}`).then((response) => {
    if (!response.ok) {
      if (response.status === 503) {
        console.log('Server currently unavailable, recommend pausing program and restarting in a while and with longer sleep between fetches')
      }
      throw new Error('Response failed', response.status)
    }
    return response.text()
  }).catch((e) => {
    console.log(`Either song ${id} was invalid or an error occurred while requesting it`)
    throw e
  })
}

const writeDataToFile = (id, responseText) => {
  return fsp.writeFile(`${__dirname}/xml/${id}.xml`, responseText).then(() => {
    console.log(`Wrote song ${id} to a file successfully`)
  }).catch((err) => {
    console.log('Failed to write file, continuing.', err)
  })
}

const runWorker = () => {
  if (id < maxId) {
    const myId = id++
    fetchXMLForSong(myId)
    .then((data) => writeDataToFile(myId, data))
    .catch((e) => {})
    .then(sleep(sleepBetweenFetches))
    .then(runWorker)
  } else {
    workersLeft--
    console.log('Task queue empty for a worker,', workersLeft, 'left')
    if (workersLeft == 0) {
      console.log('All workers done.')
    }
  }
}

if (!fsp.existsSync(dir)){
    fsp.mkdirSync(dir)
}

for (var i = 0; i < numWorkers; i++) {
  sleep(Math.random() * sleepBetweenFetches).then(runWorker)
}
