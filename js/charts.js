  // Función para cargar datos desde un archivo JSON
  function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', "./data/output.json", true); // Asegúrate de que la ruta 'output.json' sea correcta
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            if (xobj.status == 200) {
                callback(null, JSON.parse(xobj.responseText));
            } else {
                callback(new Error('No se pudo cargar el archivo JSON'));
            }
        }
    };
    xobj.send(null);
}

// Función para contar medallas por género, año y ubicación
function countMedalsByGenderYearLocation(data) {
    const medalCounts = {};

    data.forEach(entry => {
        if (entry.participant_type === "Athlete") {
            const year = entry.year;
            const event = entry.event_title;
            const gender = determineGender(event); // Determinar género basado en el título del evento
            const medalType = entry.medal_type;
            const location = entry.location;

            // Incrementar el contador correspondiente
            if (gender && (medalType === 'GOLD' || medalType === 'SILVER' || medalType === 'BRONZE')) {
                const key = `${year}_${location}_${gender}_${event}_${medalType}`;

                if (!medalCounts[key]) {
                    medalCounts[key] = {
                        year: year,
                        location: location,
                        gender: gender,
                        event: event,
                        medalType: medalType,
                        count: 0
                    };
                }
                medalCounts[key].count++;
            }
        }
    });

    // Convertir el objeto en un array de valores
    return Object.values(medalCounts);
}

// Función para determinar el género basado en el título del evento
function determineGender(eventTitle) {
    const titleLowerCase = eventTitle.toLowerCase();
    if (titleLowerCase.includes('women')) {
        return 'Women';
    } else if (titleLowerCase.includes('men')) {
        return 'Men';
    } else {
        return 'Unknown'; // Si no se puede determinar el género
    }
}

// Cargar datos y generar el gráfico al completar la carga
loadJSON(function(err, data) {
    if (err) {
        console.error(err);
        return;
    }

    try {
        const processedData = countMedalsByGenderYearLocation(data);

        // Obtener los años únicos, ubicaciones únicas y géneros únicos para configurar los datasets
        const years = [...new Set(processedData.map(item => item.year))];
        const locations = [...new Set(processedData.map(item => item.location))];
        const genders = ['Men', 'Women'];

        // Crear datasets para hombres y mujeres
        const datasets = genders.map(gender => {
            const dataPoints = years.map(year => {
                const filteredData = processedData.filter(item => item.year === year && item.gender === gender);
                return filteredData.length > 0 ? filteredData.reduce((acc, curr) => acc + curr.count, 0) : 0;
            });

            return {
                label: gender,
                data: dataPoints,
                backgroundColor: gender === 'Men' ? 'rgba(54, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
                borderColor: gender === 'Men' ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            };
        });

        // Configurar el gráfico con Chart.js
        const ctx = document.getElementById('myChart2').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years.map(year => {
                    const yearLocations = locations.filter(loc => {
                        return processedData.some(item => item.year === year && item.location === loc);
                    });
                    return yearLocations.length > 1 ? `${year} - paris` : `${year} - ${yearLocations[0]}`;
                }),
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Medallas por Género, Año y Ubicación'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Año - Ubicación'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Cantidad de Medallas'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al procesar los datos:', error);
    }
});
   // Cargar los datos desde el archivo JSON
   fetch('./data/output.json')
   .then(response => response.json())
   .then(data => {
     // Filtrar eventos que contienen "women" en event_title y años menores a cierto valor (por ejemplo, 2022)
     const filteredData = data.filter(item => item.event_title.toLowerCase().includes('women') && item.year <= 2022);

     // Contar eventos por año y localización
     const eventsByYearAndLocation = {};
     filteredData.forEach(item => {
       const key = `${item.year} - ${item.location}`; // Utilizamos año y localización como clave
       if (!eventsByYearAndLocation[key]) {
         eventsByYearAndLocation[key] = 0;
       }
       eventsByYearAndLocation[key]++;
     });

     // Preparar datos para Chart.js
     const labels = Object.keys(eventsByYearAndLocation);
     const dataCounts = labels.map(key => eventsByYearAndLocation[key]);

     // Configuración del gráfico usando Chart.js
     const ctx = document.getElementById('myChart1').getContext('2d');
     const myChart = new Chart(ctx, {
       type: 'bar',
       data: {
         labels: labels,
         datasets: [{
           label: 'Eventos de Mujeres por Año y Localización',
           data: dataCounts,
           backgroundColor: 'rgba(255, 99, 132, 0.8)',
           borderColor: 'rgba(255, 99, 132, 1)',
           borderWidth: 1
         }]
       },
       options: {
         scales: {
           y: {
             beginAtZero: true,
             stepSize: 1,
             ticks: {
               callback: function(value, index, values) {
                 // Asegurarse de que value sea una cadena de texto antes de dividirla
                 if (typeof value === 'string') {
                   const parts = value.split(' - ');
                   if (parts.length === 2) {
                     return `${parts[0]} (${parts[1]})`;
                   }
                 }
                 return value; // Devolver el valor original si no se puede dividir
               }
             }
           }
         }
       }
     });
   })
   .catch(error => {
     console.error('Error al cargar o procesar los datos:', error);
   });
   document.addEventListener('DOMContentLoaded', function() {
    let data = []; // Variable para almacenar los datos del archivo JSON
    let myChart;   // Variable para almacenar la instancia de Chart.js

    // Función para obtener los países que aparecen en el JSON en el año 2020
    function getCountriesInYear(data, year) {
        const countries = new Set(); // Utilizamos un Set para asegurar valores únicos

        // Iterar sobre los datos y agregar los países que participaron en el año especificado
        data.forEach(entry => {
            if (entry.year === year) {
                countries.add(entry.country_name);
            }
        });

        return Array.from(countries); // Convertir el Set a un array de países
    }

    // Función para actualizar el selector de países
    function updateCountrySelector(countries) {
        const countrySelector = document.getElementById('countrySelector');

        // Limpiar opciones existentes
        countrySelector.innerHTML = '';

        // Crear y añadir nuevas opciones al selector
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelector.appendChild(option);
        });
    }

    // Función para contar medallas por género
    function countMedalsByGender(data, selectedCountry) {
        let maleCount = 0;
        let femaleCount = 0;

        data.forEach(entry => {
            if (entry.country_name === selectedCountry && entry.participant_type === "Athlete") {
                const eventTitle = entry.event_title.toLowerCase();
                const medalType = entry.medal_type;

                if (eventTitle.includes('men') && (medalType === 'GOLD' || medalType === 'SILVER' || medalType === 'BRONZE')) {
                    maleCount++;
                } if (eventTitle.includes('women') && (medalType === 'GOLD' || medalType === 'SILVER' || medalType === 'BRONZE')) {
                    femaleCount++;
                }
            }
        });

        return { male: maleCount, female: femaleCount };
    }

    // Función para actualizar el gráfico según el país seleccionado
    function updateChart(selectedCountry) {
        // Contar las medallas para hombres y mujeres
        const { male, female } = countMedalsByGender(data, selectedCountry);

        // Actualizar el gráfico usando Chart.js
        if (myChart) {
            myChart.destroy(); // Destruir el gráfico anterior si existe
        }

        const ctx = document.getElementById('myChart3').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Medallas Hombres', 'Medallas Mujeres'],
                datasets: [{
                    label: selectedCountry,
                    data: [male, female],
                    backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Cargar los datos desde el archivo JSON
    fetch('./data/output.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData; // Almacenar los datos en la variable data

            // Obtener los países únicos que participaron en Tokio 2020
            const countriesIn2020 = getCountriesInYear(data, 2020);

            // Actualizar el selector de países
            updateCountrySelector(countriesIn2020);

            // Manejar el cambio en el selector de países
            const countrySelector = document.getElementById('countrySelector');
            countrySelector.addEventListener('change', function() {
                const selectedCountry = this.value;
                updateChart(selectedCountry);
            });

            // Mostrar el gráfico inicialmente con el primer país
            if (countriesIn2020.length > 0) {
                const initialCountry = countriesIn2020[0]; // Seleccionar el primer país por defecto
                updateChart(initialCountry);
            } else {
                console.error('No hay países disponibles para mostrar.');
            }

        })
        .catch(error => {
            console.error('Error al cargar o procesar los datos:', error);
        });
});
