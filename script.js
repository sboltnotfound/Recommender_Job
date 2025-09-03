let jobs = [];
let previousSearches = [];
let filteredResults = [];

// Load jobs CSV manually
fetch('omg.csv')
  .then(response => response.text())
  .then(text => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    jobs = lines.slice(1).map(line => {
      const values = line.split(',');
      let obj = {};
      headers.forEach((h, i) => obj[h] = values[i]);
      return obj;
    });
  });

function searchJobs() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  filteredResults = jobs.filter(job =>
    Object.values(job).some(val => val && val.toLowerCase().includes(query))
  );

  if (filteredResults.length === 0) {
    resultsDiv.innerHTML = '<p>No jobs found.</p>';
    document.getElementById('readMoreBtn')?.remove();
    return;
  }

  // show top 10 results
  displaySearchResults(10);

  // store last 5 searches
  filteredResults.slice(0, 10).forEach(job => {
    if (!previousSearches.includes(parseInt(job.ID))) {
      previousSearches.push(parseInt(job.ID));
      if (previousSearches.length > 5) previousSearches.shift();
    }
  });
  console.log("Previous searches array:", previousSearches);


  fetchRecommendations();
}

function displaySearchResults(limit) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  filteredResults.slice(0, limit).forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <h3>ID: ${job.ID} — ${job.Position} - ${job.Company}</h3>
      <p><strong>Location:</strong> ${job.Location}</p>
      <p><strong>Job Type:</strong> ${job['Job Type']}</p>
      <p><strong>Pay:</strong> ${job.Pay}</p>
      <p><strong>Schedule:</strong> ${job['Shift and Schedule']}</p>
      <p>${job['Job Description']}</p>
      <a href="${job.URL}" target="_blank">Apply Here</a>
    `;
    resultsDiv.appendChild(card);
  });

  // Add Read More button if there are more results
  if (filteredResults.length > limit) {
    let readMoreBtn = document.getElementById('readMoreBtn');
    if (!readMoreBtn) {
      readMoreBtn = document.createElement('button');
      readMoreBtn.id = 'readMoreBtn';
      readMoreBtn.innerText = 'Read More';
      readMoreBtn.onclick = () => displaySearchResults(filteredResults.length);
      resultsDiv.appendChild(readMoreBtn);
    }
  } else {
    document.getElementById('readMoreBtn')?.remove();
  }
}

// Fetch recommendations from Flask backend
function fetchRecommendations() {
  if (!previousSearches.length) return;

  fetch('http://127.0.0.1:5000/recommend', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ previous_searches: previousSearches, top_n: 5 })
  })
  .then(res => res.json())
    .then(data => {
        console.log("Recommendations received:", data); // <-- add this
        displayRecommendations(data)
    })
    
    .catch(err => console.error(err));
}

function displayRecommendations(recommendedJobs) {
    const recDiv = document.getElementById('recommendations');

    // Clear old recommendations
    recDiv.innerHTML = '<h2>Recommended Jobs</h2>';

    if (!recommendedJobs || recommendedJobs.length === 0) {
        recDiv.innerHTML += '<p>No recommendations yet.</p>';
        return;
    }

    recommendedJobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <h3>ID: ${job.ID} — ${job.Position} - ${job.Company}</h3>
            <p><strong>Location:</strong> ${job.Location}</p>
            <p><strong>Job Type:</strong> ${job['Job Type']}</p>
            <p><strong>Pay:</strong> ${job.Pay}</p>
            <p><strong>Schedule:</strong> ${job['Shift and Schedule']}</p>
            <p>${job['Job Description']}</p>
            <a href="${job.URL}" target="_blank">Apply Here</a>
        `;
        recDiv.appendChild(card);
    });
}
