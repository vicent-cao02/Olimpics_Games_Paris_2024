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
  
 // Función para cargar datos desde un archivo JSON
async function cargarDatos() {
    const response = await fetch('./data/output.json');  // Ruta de tu archivo JSON
    const data = await response.json();
    return data;
  }
  
//   // Función para crear el gráfico de líneas multilinea
//   async function crearGraficoLineasMultilinea() {
//     // Cargar los datos
//     const data = await cargarDatos();
  
//     // Filtrar los eventos de mujeres y contar las medallas por país y año
//     const womenEvents = data.filter(event => event.event_title && event.event_title.toLowerCase().includes("women"));
  
//     // Obtiene la lista de países únicos y años únicos
//     const countries = [...new Set(womenEvents.map(event => event.country_name))];
//     const years = [...new Set(womenEvents.map(event => event.year))];
  
//     // Crear estructura de datos para almacenar medallas por país y por año
//     const medalsByCountryAndYear = {};
//     countries.forEach(country => {
//       medalsByCountryAndYear[country] = {};
//       years.forEach(year => {
//         medalsByCountryAndYear[country][year] = { gold: 0, silver: 0, bronze: 0 };
//       });
//     });
  
//     // Contar las medallas por país y por año
//     womenEvents.forEach(event => {
//       medalsByCountryAndYear[event.country_name][event.year][event.medal_type.toLowerCase()]++;
//     });
  
//     // Prepara los datasets para el gráfico de líneas
//     const datasets = [];
//     countries.forEach(country => {
//       const dataPoints = years.map(year => {
//         return {
//           x: year,
//           y: [
//             medalsByCountryAndYear[country][year].gold,
//             medalsByCountryAndYear[country][year].silver,
//             medalsByCountryAndYear[country][year].bronze
//           ]
//         };
//       });
//       datasets.push({
//         label: country,
//         data: dataPoints,
//         borderColor: getRandomColor(),
//         backgroundColor: 'transparent',
//         pointRadius: 5,
//         pointHoverRadius: 10,
//       });
//     });
  
//     const config = {
//       type: "line",
//       data: {
//         labels: years,
//         datasets: datasets,
//       },
//       options: {
//         plugins: {
//           legend: {
//             labels: {
//               usePointStyle: true,
//             },
//           },
//           title: {
//             display: true,
//             text: "Medallas ganadas por las mujeres por país y año",
//           },
//           tooltip: {
//             mode: "index",
//             intersect: false,
//           },
//           hover: {
//             mode: "nearest",
//             intersect: true,
//           },
//         },
//         scales: {
//           x: {
//             type: 'linear',
//             title: {
//               display: true,
//               text: 'Año',
//             },
//           },
//           y: {
//             beginAtZero: true,
//             title: {
//               display: true,
//               text: "Medallas",
//             },
//           },
//         },
//         interaction: {
//           mode: "index",
//           intersect: false,
//         },
//       },
//     };
  
//     // Crea el gráfico
//     const ctx = document.getElementById("myChart").getContext("2d");
//     const myChart = new Chart(ctx, config);
  
//     function getRandomColor() {
//       const letters = "0123456789ABCDEF";
//       let color = "#";
//       for (let i = 0; i < 6; i++) {
//         color += letters[Math.floor(Math.random() * 16)];
//       }
//       return color;
//     }
//   }
  
//   // Llama a la función para crear el gráfico al cargar la página
//   document.addEventListener('DOMContentLoaded', crearGraficoLineasMultilinea);
  