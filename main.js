const zoneErr = document.querySelector('#zoneErr')
const showError = () => zoneErr.style.display = 'block'

const zoneChart = document.querySelector('#zoneChart')
const destroyChart = () => window.simChart.destroy()

const addAllele = document.querySelector('#addAllele')

/* Fonction de mise à jour du graphique */
const addChartData = (generation, frequences) => {
  let chart = window.simChart
  chart.data.labels.push('Génération ' + generation.toString())

  frequences.reduce((somme, actuel, i) => {
    let frequence = somme + actuel
    chart.data.datasets[i].data.push(frequence)
    return frequence
  }, 0);


  // chart.data.datasets.forEach((dataset, i) => {
  //   dataset.data.push(frequences[i])
  // })
  chart.update();
}

/* Cache ou montre la colone suppression en fonction du nombre d'allèle */
const checkAllele = () => {

  var delCol = document.querySelectorAll('.del-col')
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
  var alleleRef = delBtn.parentElement.parentElement
  addDelListener(alleleRef, delBtn)
})

/* Fonction ajout d'un allèle */
addAllele.firstElementChild.firstElementChild.addEventListener('click', () => {
  var ref = document.querySelector('.alleles .allele')
  var clone = ref.cloneNode(true)
  clone.querySelectorAll('input').forEach(input => {
    if (input.type === 'number' || input.type === 'text') input.value = ''
  })
  addDelListener(clone, clone.querySelector('.delete-allele'))
  document.querySelector('.alleles').insertBefore(clone, addAllele)
  checkAllele()
})


/* Simulation */
document.querySelector('#startBtn').addEventListener('click', async () => {
  if (window.simChart) destroyChart()

  /* Récuperation et validation population et génération */
  let population = parseFloat(document.querySelector('#population').value)
  const generations = parseFloat(document.querySelector('#generation').value)
  if (population < 2 || generation < 1) return showError()

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
    if (typeof f != 'number') return error = true
    alleles.push({
      name: n,
      frequence: f,
    })
    totalfrequence += f
  })
  if (totalfrequence != 1 || error) return showError()
  zoneErr.style.display = 'none'


  /* Initialisation Graphique */
  let chartData = { labels: [], datasets: [] }
  alleles.forEach((allele, i) => {
    let color = '#' + Array.from({ length: 6 }, () => '0123456789ABCDEF'.split('')[Math.floor(Math.random() * 16)]).join('');
    let fill = (i == 0) ? 'start' : '-1'
    chartData.datasets.push({
      radius: 0,
      label: allele.name,
      data: [],
      borderColor: color,
      backgroundColor: color,
      fill: fill,
      yAxisID: 'y',
    })
  })
  window.simChart = new Chart(zoneChart, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      scales: { y: { min: 0, max: 1, alignToPixels: true } }
    }
  });
  addChartData(0, Array.from(alleles, allele => allele.frequence))


  /* Boucle Génération */
  for (let generation = 1; generation <= generations; generation++) {

    /* Mise à 0 des effectifs d'allèles */
    alleles.forEach(allele => { allele.effectif = 0 })

    /* Création des couples d'allèles avec la probabilité associée */
    let couple = []
    alleles.forEach((ac, i) => {
      alleles.forEach((ag, o) => {
        couple.push({ a1Index: i, a2Index: o, frequence: ac.frequence * ag.frequence })
      })
    });

    /* Boucle enfant, 2 enfant par couple, la population est constante */
    for (let child = 1; child <= population; child++) {

      /**
       * Génération d'une valeur aléatoire compris entre 0 et 1
       * Avec la fonction reduce, on vérifie si la valeur aléatoire
       * est comprise entre la somme des probabilités des couples 
       * d'allèles antérieur et cette même somme en ajoutant la
       * probabilté du couple actuel. On augmente alors l'effectif
       * des allèle fesant parties du couple choisi.
       */
      let randomFloat = Math.random()
      couple.reduce((somme, actuel) => {
        if (somme <= randomFloat && randomFloat < (somme + actuel.frequence)) {
          alleles[actuel.a1Index].effectif++;
          alleles[actuel.a2Index].effectif++;
        }
        return somme + actuel.frequence
      }, 0);

    }

    /**
     * Calcul des nouvelles fréquences d'allèles
     * en fonction du nouveau effectif de population.
     */
    alleles.forEach(allele => { allele.frequence = allele.effectif / (population * 2) })

    addChartData(generation, Array.from(alleles, allele => allele.frequence))

  }

});