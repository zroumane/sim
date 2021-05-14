const getRandomColor = () => '#' + Array.from({ length: 6 }, () => '0123456789ABCDEF'.split('')[Math.floor(Math.random() * 16)]).join('')
document.querySelectorAll('input[data-type="color"]').forEach(e => e.value = getRandomColor())

const showError = (zoneErr) => zoneErr.style.display = 'block'

const $allelesErr = document.querySelector('#allelesErrEl')
const addAllele = document.querySelector('#addAllele')

/* Cache ou montre la colone suppression en fonction du nombre d'allèle */
const checkAllele = () => {

  let delCol = document.querySelectorAll('.del-col')
  if (document.querySelectorAll('.alleles .allele').length === 2) {
    delCol.forEach(d => d.style.display = 'none')
  }
  else {
    delCol.forEach(d => d.style.display = 'block')
  }
}
checkAllele()

/* Fonction suppression d'une allèle */
const addDelListener = (alleleRef, delBtn) => {
  delBtn.addEventListener('click', () => {
    alleleRef.remove()
    checkAllele()
  })
}
document.querySelectorAll('.delete-allele').forEach(delBtn => {
  let alleleRef = delBtn.parentElement.parentElement
  addDelListener(alleleRef, delBtn)
})

/* Fonction ajout d'un allèle */
addAllele.firstElementChild.firstElementChild.addEventListener('click', () => {
  let ref = document.querySelector('.alleles .allele')
  let clone = ref.cloneNode(true)
  clone.querySelectorAll('input').forEach(input => {
    if (input.type === 'number' || input.type === 'text') input.value = ''
    if (input.type === 'color') input.value = getRandomColor()
  })
  addDelListener(clone, clone.querySelector('.delete-allele'))
  document.querySelector('.alleles').insertBefore(clone, addAllele)
  checkAllele()
})

const $migErr = document.querySelector('#migErrEl')

const enableMigration = document.querySelector('#enableMigration')
enableMigration.checked = false
enableMigration.addEventListener('click', () => {
  if (enableMigration.checked) {
    document.querySelector('#migrationContent').style.display = 'block'
    document.querySelector('#migrationLabel').style.opacity = 1
    document.querySelectorAll('.chart').forEach(c => c.classList.add('isMig'))
    document.querySelector('.mig-chart').style.display = 'block'
  }
  else {
    document.querySelector('#migrationContent').style.display = 'none'
    document.querySelector('#migrationLabel').style.opacity = 0.6
    document.querySelectorAll('.chart').forEach(c => c.classList.remove('isMig'))
    document.querySelector('.mig-chart').style.display = 'none'
  }
})

const $mainChart = document.querySelector('#mainChartEl')
const $migChart = document.querySelector('#migChartEl')

/* Fonction qui retourne la configuration graphique */
const getChartOption = (alleles) => {
  let chartData = { labels: [], datasets: [] }
  alleles.forEach((allele, i) => {
    let fill = (i == 0) ? 'start' : '-1'
    chartData.datasets.push({
      // radius: 0,
      label: allele.name,
      data: [],
      borderColor: allele.color,
      backgroundColor: allele.color,
      fill: fill,
      yAxisID: 'y',
    })
  })
  return {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      scales: { y: { min: 0, max: 1, alignToPixels: true } }
    }
  }
}

/* Fonction de mise à jour du graphique */
const addChartData = (chart, generation, frequences) => {
  chart.data.labels.push('Génération ' + generation.toString())
  frequences.reduce((somme, actuel, i) => {
    let frequence = somme + actuel
    chart.data.datasets[i].data.push(frequence)
    return frequence
  }, 0);
  chart.update();
}


/* Création des couples d'allèles avec la probabilité associée */
const getAlleleCouple = (alleles) => {
  let couples = []
  alleles.forEach((ac, i) => {
    alleles.forEach((ag, o) => {
      couples.push({ a1Index: i, a2Index: o, frequence: ac.frequence * ag.frequence })
    })
  });
  return couples
}

/**
* Génération d'une valeur aléatoire compris entre 0 et 1
* Avec la fonction reduce, on vérifie si la valeur aléatoire
* est comprise entre la somme des probabilités des couples 
* d'allèles antérieur et cette même somme en ajoutant la
* probabilté du couple actuel. On augmente alors l'effectif
* des allèle fesant parties du couple choisi.
*/
const pickCouple = (couples, alleles) => {
  let randomFloat = Math.random()
  couples.reduce((somme, actuel) => {
    if (somme <= randomFloat && randomFloat < (somme + actuel.frequence)) {
      alleles[actuel.a1Index].effectif++;
      alleles[actuel.a2Index].effectif++;
    }
    return somme + actuel.frequence
  }, 0);
}


/* Simulation */
document.querySelector('#startBtn').addEventListener('click', async () => {
  if (window.mainChart) window.mainChart.destroy()
  if (window.migChart) window.migChart.destroy()

  /* Récuperation et validation population et génération */
  let population = parseFloat(document.querySelector('#population').value)
  let generations = parseFloat(document.querySelector('#generation').value)
  if (population < 2 || generation < 1) return showError($allelesErr)

  /**
   * Création de la liste des allèles à partir
   * des enfant de l'élément .alleles.
   * Vérification que la somme des fréquences = 1
   */
  let error = false
  let alleles = []
  let totalfrequence = 0
  document.querySelectorAll('.allele').forEach(allele => {
    let n = allele.querySelector('input[data-type="name"]').value
    let f = parseFloat(allele.querySelector('input[data-type="frequence"]').value)
    let c = allele.querySelector('input[data-type="color"]').value
    if (typeof f != 'number') return error = true
    alleles.push({
      name: n,
      frequence: f,
      color: c
    })
    totalfrequence += f
  })
  if (totalfrequence != 1 || error) return showError($allelesErr)
  $allelesErr.style.display = 'none'

  /* Récupération des données de la branche migrations */
  let mg_start, mg_population, mg_alleles, isMig = false;
  if (enableMigration.checked) {
    mg_start = parseFloat(document.querySelector('#mgStart').value)
    mg_population = parseFloat(document.querySelector('#mgPopulation').value)
    if (typeof mg_start != 'number' || typeof mg_population != 'number') return showError($migErr)
    if (mg_start < 1 || mg_start >= generations) return showError($migErr)
  }
  $migErr.style.display = 'none'


  /* Initialisation Graphiques */
  window.mainChart = new Chart($mainChart, getChartOption(alleles))
  addChartData(window.mainChart, 0, Array.from(alleles, allele => allele.frequence))
  if (mg_start) window.migChart = new Chart($migChart, getChartOption(alleles))


  /* Boucle Génération */
  for (let generation = 1; generation <= generations; generation++) {

    /* initialisation de la branche migration */
    if (generation == mg_start) {
      isMig = true
      alleles = alleles
      mg_alleles = JSON.parse(JSON.stringify(alleles))
      population = population - mg_population
    }

    /* Mise à 0 des effectifs d'allèles */
    alleles.forEach(a => { a.effectif = 0 })
    if (isMig) mg_alleles.forEach(a => { a.effectif = 0 })

    /* Génération des couples */
    let couples = getAlleleCouple(alleles)
    let mg_couples
    if (isMig) mg_couples = getAlleleCouple(mg_alleles)

    /* Boucle enfant, 2 enfant par couple, la population est constante */
    for (let child = 1; child <= population; child++) pickCouple(couples, alleles)
    if (isMig) for (let child = 1; child <= mg_population; child++) pickCouple(mg_couples, mg_alleles)

    /* Calcul des nouvelles fréquences d'allèles en fonction du nouveau effectif de population.*/
    alleles.forEach(a => { a.frequence = a.effectif / (population * 2) })
    addChartData(window.mainChart, generation, Array.from(alleles, a => a.frequence))
    if (mg_start == generation) addChartData(window.migChart, generation, Array.from(alleles, a => a.frequence))
    else if (isMig) {
      mg_alleles.forEach(a => { a.frequence = a.effectif / (mg_population * 2) })
      addChartData(window.migChart, generation, Array.from(mg_alleles, a => a.frequence))
    }

  }

});