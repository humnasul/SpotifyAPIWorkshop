// API DEPENDENCIES & CREDENTIALS
const http = require('http');
const querystring = require('querystring');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Spotify OAuth Credentials
// These are used for the OAuth 2.0 Authorization Code flow
// - client_id: identifies our application to Spotify
// - client_secret: used to securely exchange auth code for access token
// - redirect_uri: where Spotify redirects user after authorization

// TODO: FILL IN YOUR SPOTIFY CREDENTIALS HERE
const client_id = '';
const client_secret = '';
const redirect_uri = 'http://127.0.0.1:8888/callback';

// Ticketmaster API Key
// Used to search for concert events by artist name

// TODO: FILL IN YOUR TICKETMASTER CREDENTIALS HERE
const ticketmaster_key = '';

// ========================================
// GENERIC HTTPS REQUEST HELPER
// ========================================
// This is a reusable wrapper around Node's HTTPS module
// It handles the complexity of making HTTPS requests and automatically parses JSON responses
function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      // Stream the response data as it arrives
      res.on('data', chunk => data += chunk);
      // Once all data is received, parse and resolve
      res.on('end', () => {
        try { 
          // Try to parse as JSON (works for API responses)
          resolve({ status: res.statusCode, body: JSON.parse(data) }); 
        }
        catch (e) { 
          // Fall back to plain text if not JSON
          resolve({ status: res.statusCode, body: data }); 
        }
      });
    });
    req.on('error', reject);
    // Write request body if provided (e.g., for POST requests)
    if (body) req.write(body);
    req.end();
  });
}

// ========================================
// SPOTIFY API: TOKEN EXCHANGE
// ========================================
// Spotify uses OAuth 2.0!
// OAuth Step 2: Exchange authorization code for access token
// This implements the "Authorization Code" flow from OAuth 2.0 spec
// We send our credentials + the auth code to Spotify's token endpoint
async function getToken(code) {
  // Build request body with OAuth parameters
  const body = querystring.stringify({ grant_type: 'authorization_code', code, redirect_uri });
  
  // Spotify requires Basic Auth: base64(client_id:client_secret)
  // This proves we're the legitimate app owner
  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  
  // TODO: create the HTTPS request to Spotify's token endpoint
  

  // Response contains: { access_token, token_type, expires_in, refresh_token }
}

// ========================================
// TICKETMASTER API: SEARCH EVENTS
// ========================================
// Search Ticketmaster's database for upcoming concerts by artist name
// This is a simple REST API that doesn't require OAuth
async function ticketmasterGet(artistName) {
  // Build query parameters for the search
  const qs = new URLSearchParams({
    apikey: ticketmaster_key,              // API key for authentication
    keyword: artistName,                   // Artist name to search for
    classificationName: 'music',           // Only music events
    sort: 'date,asc',                      // Sort by date (earliest first)
    size: 3,                               // Return top 3 results
  });
  
  // TODO: create the HTTPS request to Ticketmaster's search endpoint with the query parameters

  // Response contains: { _embedded: { events: [...] }, ... }
}

// ========================================
// SPOTIFY API: DATA REQUESTS
// ========================================
// Make authenticated requests to Spotify's REST API
// Uses Bearer token authentication (obtained from getToken())
async function spotifyGet(path, token) {
  // TODO: create the HTTPS request to Spotify's API endpoint with the access token
  // response depends on the provided path for endpoint!

}

// building the amazing HTML page with the data we got from Spotify and Ticketmaster
function buildPage(profile, topTracks, concerts = []) {
  const sanitize = s => String(s).replace(/[<>&]/g, ' ');

  const allTracksJson = JSON.stringify(
    topTracks.items.slice(0, 15).map(t => ({
      name:       sanitize(t.name),
      artist:     sanitize(t.artists.map(a => a.name).join(', ')),
      album:      t.album && t.album.images && t.album.images[2] ? t.album.images[2].url : (t.album && t.album.images && t.album.images[0] ? t.album.images[0].url : ''),
      url:        t.external_urls && t.external_urls.spotify ? t.external_urls.spotify : '',
      popularity: t.popularity || 0,
      year:       parseInt(((t.album && t.album.release_date) ? t.album.release_date : '2000').slice(0, 4)),
    }))
  );

  const concertsJson = JSON.stringify(concerts);

  const trackListHtml = topTracks.items.slice(0, 15).map((track, i) => {
    const artists = track.artists.map(a => a.name).join(', ');
    const albumArt = track.album && track.album.images && track.album.images[2] ? track.album.images[2].url : (track.album && track.album.images && track.album.images[0] ? track.album.images[0].url : '');
    const emojis = ['🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎤','🎧','✨','🌟','💫','🎀','🌸','⭐'];
    return `<div class="track-card">
        ${albumArt ? `<img class="album-thumb" src="${albumArt}" alt="album">` : `<div class="album-thumb-placeholder">${emojis[i]}</div>`}
        <div class="track-info">
          <span class="track-name">${sanitize(track.name)}</span>
          <span class="track-artist">${sanitize(artists)}</span>
        </div>
        <div class="track-num">${i + 1}</div>
      </div>`;
  }).join('');

  const avatar = profile.images && profile.images[0] ? profile.images[0].url : '';
  const name = sanitize(profile.display_name || profile.id);
  const followers = profile.followers && profile.followers.total ? profile.followers.total.toLocaleString() : '0';
  const plan = profile.product || 'free';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>humna's analysis hehe</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="page">
  <!-- Header section with title -->
  <div class="header">
    <div class="header-tag">// music.profile</div>
    <h1>your musical journey :)</h1>
    <p>// top tracks · short_term · sorted by era + popularity</p>
  </div>

  <!-- Show user's profile info (pic, name, followers) -->
  <div class="profile-card">
    ${avatar ? `<img class="avatar" src="${avatar}" alt="avatar">` : `<div class="avatar-placeholder">🎧</div>`}
    <div>
      <div class="profile-name">hi, <span>${name}</span>!</div>
      <div class="profile-badges">
        <span class="badge badge-pink">🎵 ${followers} followers</span>
        <span class="badge badge-purple">✨ ${plan} listener</span>
      </div>
    </div>
  </div>

  <!-- Display the 15 top tracks from Spotify -->
  <div class="section">
    <div class="section-title">top_tracks [ 15 ]</div>
    ${trackListHtml}
  </div>

  <!-- Show tracks organized into categories (new, old, popular, etc) -->
  <div class="mood-section">
    <div class="mood-title">vibe breakdown</div>
    <div class="mood-subtitle">// era · popularity · sorted</div>
    <div id="recsContent"></div>
  </div>

  <!-- Divider before concerts section -->
  <div class="concerts-divider"><span>live events</span></div>

  <!-- Show upcoming concerts for the user's favorite artists -->
  <div class="concert-section">
    <div class="section-title" style="color:rgba(244,114,182,0.7)">upcoming events</div>
    <div id="concertList"></div>
  </div>

  <!-- Footer -->
  <div class="footer">made with <span>♥</span> · made by humna :P </div>
</div>

<!-- Client-side JavaScript that runs in the browser -->
<script>
  // Load the data from the server
  var allTracks = ${allTracksJson};
  var concerts  = ${concertsJson};

  // Get references to the HTML elements we'll fill in with data
  var recsEl    = document.getElementById('recsContent');
  var concertEl = document.getElementById('concertList');
  var debugEl   = document.getElementById('debugOut');

  // Sort tracks into categories based on year and popularity
  var newReleases = [], throwbacks = [], popular = [], deepCuts = [];
  allTracks.forEach(function(t) {
    if      (t.year >= 2022)     newReleases.push(t);
    else if (t.year < 2010)      throwbacks.push(t);
    else if (t.popularity >= 70) popular.push(t);
    else                         deepCuts.push(t);
  });

  if (debugEl) debugEl.innerHTML =
    '<div>// CLIENT JS RUNNING OK</div>' +
    '<div>allTracks: ' + allTracks.length + ' | concerts: ' + concerts.length + '</div>' +
    '<div>buckets — new:' + newReleases.length + ' throwback:' + throwbacks.length + ' popular:' + popular.length + ' deepcuts:' + deepCuts.length + '</div>' +
    '<div>track[0] year=' + (allTracks[0] ? allTracks[0].year : '?') + ' pop=' + (allTracks[0] ? allTracks[0].popularity : '?') + '</div>';

  function renderTrack(s) {
    var thumb = s.album
      ? '<img class="album-thumb" src="' + s.album + '" alt="">'
      : '<div class="album-thumb-placeholder">music</div>';
    return '<div class="vibe-track" data-url="' + (s.url || '') + '">' + thumb +
      '<div class="vibe-track-info">' +
        '<div class="vibe-track-name">' + s.name + '</div>' +
        '<div class="vibe-track-artist">' + s.artist + ' · ' + s.year + '</div>' +
      '</div></div>';
  }

  function renderSection(emoji, label, sublabel, color, border, accent, tracks) {
    if (!tracks.length) return '';
    return '<div class="vibe-bucket" style="background:' + color + ';border-color:' + border + '">' +
      '<div class="vibe-bucket-header">' +
        '<span class="vibe-emoji">' + emoji + '</span>' +
        '<div><span class="vibe-mood-name" style="color:' + accent + '">' + label + '</span>' +
        '<span class="vibe-sublabel">' + sublabel + '</span></div>' +
      '</div>' +
      '<div class="vibe-tracks">' + tracks.map(renderTrack).join('') + '</div>' +
    '</div>';
  }

  var sectionsHtml =
    renderSection('🆕', 'new releases',  'from 2022 onwards', 'rgba(109,223,168,0.06)', 'rgba(109,223,168,0.25)', '#6edfa8', newReleases) +
    renderSection('📻', 'throwbacks',    'before 2010',       'rgba(255,216,77,0.05)',  'rgba(255,216,77,0.2)',   '#ffd84d', throwbacks)  +
    renderSection('🔥', 'popular',       'popularity 70+',    'rgba(181,122,255,0.08)', 'rgba(181,122,255,0.3)', '#b57aff', popular)     +
    renderSection('🌙', 'deep cuts',     'under the radar',   'rgba(244,114,182,0.06)', 'rgba(244,114,182,0.25)','#f472b6', deepCuts);

  if (recsEl) recsEl.innerHTML = sectionsHtml ||
    '<div style="font-family:monospace;font-size:0.72rem;color:#7a6a8a;padding:1rem">// all buckets empty</div>';

  // concerts
  if (concertEl) {
    if (!concerts || !concerts.length) {
      concertEl.innerHTML = '<div class="no-concerts">// no upcoming shows found</div>';
    } else {
      concertEl.innerHTML = concerts.map(function(c) {
        var dateStr = c.date && c.date !== 'TBD'
          ? c.date.slice(5).replace('-', '/') + '<br>' + c.date.slice(0, 4) : 'TBD';
        return '<div class="concert-card" data-url="' + (c.url || '') + '">' +
          '<div class="concert-date">' + dateStr + '</div>' +
          '<div class="concert-info">' +
            '<span class="concert-artist">' + c.artist + '</span>' +
            '<span class="concert-venue">' + c.venue + (c.city ? ' · ' + c.city : '') + '</span>' +
          '</div>' +
          (c.url ? '<span class="concert-arrow">→</span>' : '') +
        '</div>';
      }).join('');
    }
  }

  // click handler via event delegation — no inline onclick needed
  document.addEventListener('click', function(e) {
    var card = e.target.closest('[data-url]');
    if (card && card.dataset.url) window.open(card.dataset.url);
  });
<\/script>
</html>`;
}

// ========================================
// HTTP SERVER & API ORCHESTRATION
// ========================================
http.createServer(async (req, res) => {
  // ROUTE: /login
  // OAuth Step 1: Redirect user to Spotify for authorization
  // This initiates the OAuth 2.0 Authorization Code flow
  if (req.url === '/login') {
    // Generate a random state param (security measure to prevent CSRF)
    const state = Math.random().toString(36).substring(2, 18);
    
    // Scopes define what permissions we're requesting
    // TODO: define the scope that we are using
    
    // Build the authorization URL that redirects to Spotify
    // TODO: create authURL with the appropriate query parameters (client_id, response_type, redirect_uri, scope, state)
    
    // Redirect browser to Spotify's login/authorization page
    res.writeHead(302, { Location: authUrl });
    return res.end();
  }

  // ROUTE: /callback
  // OAuth Step 3 & 4: Handle Spotify's redirect with authorization code
  // Then make API requests to fetch user data and concert info
  if (req.url.startsWith('/callback')) {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const code = params.get('code');      // Authorization code from Spotify
    const error = params.get('error');    // Any error from authorization

    if (error || !code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Auth error: ' + (error || 'no code'));
    }

    try {
      // ========================================
      // API CALL 1: EXCHANGE CODE FOR TOKEN
      // ========================================
      const tokenRes = await getToken(code);
      if (tokenRes.status !== 200) throw new Error('Token exchange failed');
      const access_token = tokenRes.body.access_token;
      console.log('✓ Spotify token obtained');

      // ========================================
      // API CALLS 2 & 3: FETCH USER DATA (in parallel)
      // ========================================
      // TODO: API calls to get Spotify data!

      if (profileRes.status !== 200) throw new Error('Could not fetch profile');
      if (topRes.status !== 200) throw new Error('Could not fetch top tracks');
      console.log('✓ Spotify profile & top tracks fetched');

      // ========================================
      // API CALLS 4+: SEARCH TICKETMASTER FOR CONCERTS
      // ========================================
      // Extract top 5 unique artist names from the user's top tracks
      const topArtists = [...new Set(topRes.body.items.map(t => t.artists[0].name))].slice(0, 5);
      console.log('Fetching concert info for:', topArtists);
      
      // Make parallel Ticketmaster API requests for each artist
      const concertResults = await Promise.all(
        topArtists.map(name => ticketmasterGet(name).catch(() => null))
      );
      console.log('✓ Ticketmaster searches completed');
      // ========================================
      // PARSE TICKETMASTER RESPONSES
      // ========================================
      // Convert Ticketmaster API responses into our concert format
      const concerts = [];
      concertResults.forEach((res, i) => {
        // Skip failed requests or non-200 responses
        if (!res || res.status !== 200) return;
        
        // Ticketmaster response structure: { _embedded: { events: [...] } }
        const events = res.body && res.body._embedded && res.body._embedded.events;
        if (!events) return;
        
        // Extract relevant concert info from each event
        events.forEach(ev => {
          // Get venue info from nested structure
          const venue = ev._embedded && ev._embedded.venues && ev._embedded.venues[0];
          concerts.push({
            artist: topArtists[i],
            name:   ev.name,
            date:   ev.dates && ev.dates.start ? ev.dates.start.localDate : 'TBD',
            venue:  venue ? venue.name : 'Unknown Venue',
            city:   venue ? (venue.city && venue.city.name ? venue.city.name : '') + (venue.state && venue.state.stateCode ? ', ' + venue.state.stateCode : '') : '',
            url:    ev.url || '',
          });
        });
      });
      console.log(`✓ Found ${concerts.length} upcoming concerts`);

      // ========================================
      // BUILD & RENDER HTML RESPONSE
      // ========================================
      // Now that we have all API data, generate the HTML page
      const html = buildPage(profileRes.body, topRes.body, concerts);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);

    } catch (err) {
      // Handle any API errors (token exchange, Spotify calls, etc)
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error: ' + err.message);
    }
  }

  // ROUTE: /styles.css
  // Serve the external CSS stylesheet that the HTML references
  if (req.url === '/styles.css') {
    try {
      const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      return res.end(css);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Styles not found');
    }
  }

  // Default: 404 for unmatched routes
  res.writeHead(404);
  res.end('Not found');

}).listen(8888);

console.log('\n========================================');
console.log('🎵 Spotify Music & Event Analyzer');
console.log('========================================');
console.log('\nServer running at http://127.0.0.1:8888/login');
console.log('\nAPI Integration:');
console.log('- Spotify OAuth 2.0 (user auth & data)');
console.log('- Spotify Web API (profile, top tracks)');
console.log('- Ticketmaster API (concert search)');
console.log('========================================\n');

console.log('Server running at http://127.0.0.1:8888/login');