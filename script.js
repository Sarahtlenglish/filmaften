const apiKey = 'c0d225ff0e4e651b810694d8f0cdf5ec';

const movieGenresMap = {};
const tvGenresMap = {};

let allResults = [];

fetch('https://api.themoviedb.org/3/genre/movie/list?api_key=' + apiKey)
  .then(response => response.json())
  .then(movieGenres => {
    movieGenres.genres.forEach(genre => {
      movieGenresMap[genre.id] = genre.name;
    });

    fetch('https://api.themoviedb.org/3/genre/tv/list?api_key=' + apiKey)
      .then(response => response.json())
      .then(tvGenres => {
        tvGenres.genres.forEach(genre => {
          tvGenresMap[genre.id] = genre.name;
        });

        setupCode();
      })
      .catch(error => console.error('Fejl under hentning af tv-seriegenrer:', error));
  })
  .catch(error => console.error('Fejl under hentning af filmgenrer:', error));

function setupCode() {
  const categorySelect = document.getElementById('category');
  const genreSelect = document.getElementById('genre');
  const minScoreInput = document.getElementById('minScore');
  const findButton = document.getElementById('findButton');
  const resultContainer = document.getElementById('result');
  const backButton = document.createElement('button');

  setupGenreSelect(genreSelect, movieGenresMap, 'Filmsgenrer');
  setupGenreSelect(genreSelect, tvGenresMap, 'TV-seriegenrer');

  categorySelect.addEventListener('change', updateGenreSelect);
  findButton.addEventListener('click', generateRandom);

  function updateGenreSelect() {
    const category = categorySelect.value;
    genreSelect.innerHTML = '';

    // Tilføj "Alle" som en ekstra indstilling
    const allOption = document.createElement('option');
    allOption.value = 'alle';
    allOption.textContent = 'Alle';
    genreSelect.appendChild(allOption);

    if (category === 'movie') {
      setupGenreSelect(genreSelect, movieGenresMap, 'Filmsgenrer');
    } else if (category === 'tv') {
      setupGenreSelect(genreSelect, tvGenresMap, 'TV-seriegenrer');
    }
  }

  function setupGenreSelect(selectElement, genreMap, label) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;

    for (const id in genreMap) {
      if (genreMap.hasOwnProperty(id)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = genreMap[id];
        optgroup.appendChild(option);
      }
    }

    selectElement.appendChild(optgroup);
  }

  function generateRandom() {
    const category = categorySelect.value;
    const genre = genreSelect.value;
    let minScore = minScoreInput.value;

    if (minScore === 'tilfældig') {
      minScore = Math.floor(Math.random() * 10) + 1;
    } else {
      minScore = parseInt(minScore, 10);
    }

    if (isNaN(minScore) || minScore < 1 || minScore > 10) {
      alert('Minimum score skal være mellem 1 og 10.');
      return;
    }

    const randomPage = Math.floor(Math.random() * 50) + 1;
    const originalLanguage = 'en';

    const apiURL = `https://api.themoviedb.org/3/discover/${category}?api_key=${apiKey}&with_genres=${genre}&vote_average.gte=${minScore}&page=${randomPage}&with_original_language=${originalLanguage}`;

    fetch(apiURL)
      .then(response => response.json())
      .then(data => {
        allResults = data.results; // Gem resultater globalt
        displayResults(allResults, category);
      })
      .catch(error => console.error('Fejl under API-kald:', error));
  }

  function displayResults(results, category) {
    resultContainer.innerHTML = '';

    if (results.length === 0) {
      resultContainer.innerHTML = '<p>Ingen resultater fundet.</p>';
      return;
    }

    results.slice(0, 3).forEach((result, index) => {
      const title = result.title || result.name;
      const score = result.vote_average;
      const posterPath = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : 'billede-til-standard-størrelse.jpg';

      const resultElement = document.createElement('div');
      resultElement.classList.add('result-item');
      resultElement.id = result.id.toString(); // Gem filmens ID i elementets id-attribut
      resultElement.style.opacity = '0';
      resultElement.innerHTML = `
        <img src="${posterPath}" alt "${title} Billede">
        <div class="info">
          <h3>${title}</h3>
          <p class="score">Score: ${score} <span class="star">★</span></p>
        `;

      resultContainer.appendChild(resultElement);

      resultElement.addEventListener('click', () => {
        const selectedResult = allResults.find(result => result.id.toString() === resultElement.id);
        enlargeResult(selectedResult, category);
      });

      setTimeout(() => {
        resultElement.style.opacity = '1';
      }, 120 * index);
    });
  }

  function enlargeResult(selectedResult, category) {
    const title = selectedResult.title || selectedResult.name;
    const score = selectedResult.vote_average;
    const posterPath = selectedResult.poster_path ? `https://image.tmdb.org/t/p/w500${selectedResult.poster_path}` : 'billede-til-standard-størrelse.jpg';

    // Hent skuespilleroplysninger ved hjælp af API-endepunktet for film eller tv-serie, afhængigt af kategorien
    fetch(`https://api.themoviedb.org/3/${category}/${selectedResult.id}?api_key=${apiKey}&append_to_response=credits`)
      .then(response => response.json())
      .then(data => {
        let actors = '';

        if (data.credits && data.credits.cast) {
          actors = data.credits.cast.map(actor => actor.name).join(', ');
        }

        const overview = selectedResult.overview;

        // Fjern det eksisterende resultatindhold og knap
        resultContainer.innerHTML = '';

        // Tilføj en tilbageknap
        backButton.textContent = 'Tilbage';
        backButton.classList.add('back-button'); // Tilføj en klasse til knappen
        backButton.addEventListener('click', () => {
          // Når brugeren klikker på tilbageknappen, gendan det oprindelige resultatindhold
          displayResults(allResults, category);

          // Opsæt begivenhedslyttere og indhold for den udvidede filmvisning igen
          setupEnlargedResult();
        });
        resultContainer.appendChild(backButton);

        const enlargedResult = document.createElement('div');
        enlargedResult.classList.add('enlarged-result');
        enlargedResult.innerHTML = `
          <img src="${posterPath}" alt "${title} Billede">
          <div class="info">
            <h3>${title}</h3>
            <p class="score">Score: ${score} <span class="star">★</span></p>
            <p class="description"><b>Beskrivelse:</b> </br>${overview || 'Beskrivelse ikke tilgængelig'}</p>
            <p class="actors" ><b>Skuespillere:</b> </br> ${actors || 'Skuespillere ikke tilgængelige'}</p>
          `;

        resultContainer.appendChild(enlargedResult);

        // Opsæt begivenhedslyttere og indhold for den udvidede filmvisning igen
        setupEnlargedResult();
      })
      .catch(error => console.error('Fejl under hentning af detaljer:', error));
  }

  // Funktion til at opsætte begivenhedslyttere og indhold for den udvidede filmvisning
  function setupEnlargedResult() {
    // Find alle result-elementer
    const resultElements = document.querySelectorAll('.result-item');

    // Tilføj en klikbegivenhed til hvert result-element
    resultElements.forEach(resultElement => {
      resultElement.addEventListener('click', () => {
        const selectedResult = allResults.find(result => result.id.toString() === resultElement.id);
        enlargeResult(selectedResult, categorySelect.value);
      });
    });
  }

  // Opsæt begivenhedslyttere og indhold for den udvidede filmvisning på sidenindlæsning
  setupEnlargedResult();
}
