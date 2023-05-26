const fs = require('fs-extra')
const path = require('path')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const items = []

module.exports = async (processingConfig, tmpDir, axios, log, apiKey) => {
  await log.step('Téléchargement des données')
  await log.info('Récupération des communes...')
  let done = false
  let tryCount = 0
  while (!done && tryCount < 10) {
    await wait(2000)
    const communes = await axios({
      method: 'get',
      url: 'https://api.insee.fr/metadonnees/V1/geo/communes?com=true',
      headers: {
        Authorization: 'Bearer ' + apiKey
      }
    }).catch((err) => {
      console.log(err)
    })
    if (communes) {
      for (const commune of communes.data) {
        items.push(commune)
      }
      await log.info('Récupération des communes terminée')
      done = true
    } else {
      await log.info('Erreur lors de la récupération des communes, réessai dans 2 secondes')
      tryCount++
    }
  }
  done = false
  tryCount = 0
  while (!done && tryCount < 10) {
    await wait(2000)
    const communes = await axios({
      method: 'get',
      url: 'https://api.insee.fr/metadonnees/V1/geo/arrondissementsMunicipaux',
      headers: {
        Authorization: 'Bearer ' + apiKey
      }
    }).catch((err) => {
      console.log(err)
    })
    if (communes.data) {
      for (const commune of communes.data) {
        items.push(commune)
      }
      await fs.writeFileSync(path.join(tmpDir, 'communes.json'), JSON.stringify(items, null, 2))
      await log.info('Récupération des arrondissements terminée')
      done = true
    } else {
      await log.info('Erreur lors de la récupération des arrondissements, réessai dans 2 secondes')
      tryCount++
    }
  }
}
