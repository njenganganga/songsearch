const form = document.querySelector("#search-form");
const input = document.querySelector("#artist-input");
const button = document.querySelector("#search-button");
const statusBox = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
let activeAudio = null;

function formatDuration(milliseconds) {
  const seconds = Math.floor((milliseconds || 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function makeText(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

function makeTrackCard(track, index) {
  const card = document.createElement("article");
  card.className = "track-card";
  const artwork = document.createElement("div");
  artwork.className = "track-artwork";
  if (track.image) {
    const image = document.createElement("img");
    image.src = track.image;
    image.alt = `Cover art for ${track.album || track.name}`;
    image.loading = "lazy";
    artwork.append(image);
  } else {
    artwork.textContent = "♫";
    artwork.setAttribute("aria-label", "No album artwork available");
  }
  const number = makeText("span", "track-number", String(index + 1).padStart(2, "0"));
  const info = document.createElement("div");
  info.className = "track-info";
  info.append(makeText("h3", "track-name", track.name));
  info.append(makeText("p", "track-album", track.album || track.artists || "Spotify track"));
  const actions = document.createElement("div");
  actions.className = "track-actions";
  actions.append(makeText("span", "track-duration", formatDuration(track.duration_ms)));
  if (track.preview_url) {
    const audio = new Audio(track.preview_url);
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "preview-button";
    playButton.textContent = "▶ Preview";
    playButton.setAttribute("aria-label", `Preview ${track.name}`);
    playButton.addEventListener("click", async () => {
      if (activeAudio && activeAudio !== audio) activeAudio.pause();
      if (audio.paused) {
        try {
          await audio.play();
          activeAudio = audio;
          playButton.textContent = "Ⅱ Pause";
        } catch {
          statusBox.textContent = "This preview could not be played. Open the track on Spotify instead.";
        }
      } else {
        audio.pause();
        playButton.textContent = "▶ Preview";
      }
    });
    audio.addEventListener("ended", () => { playButton.textContent = "▶ Preview"; });
    audio.addEventListener("pause", () => { playButton.textContent = "▶ Preview"; });
    actions.append(playButton);
  }
  if (track.spotify_url) {
    const openLink = document.createElement("a");
    openLink.className = "spotify-link";
    openLink.href = track.spotify_url;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "Open ↗";
    openLink.setAttribute("aria-label", `Open ${track.name} on Spotify`);
    actions.append(openLink);
  }
  card.append(number, artwork, info, actions);
  return card;
}

function renderResults(data) {
  resultsBox.replaceChildren();
  const artist = data.artist;
  const header = document.createElement("div");
  header.className = "results-header";
  const artistInfo = document.createElement("div");
  artistInfo.className = "artist-info";
  if (artist.image) {
    const image = document.createElement("img");
    image.src = artist.image;
    image.alt = `${artist.name} artist portrait`;
    image.loading = "lazy";
    artistInfo.append(image);
  } else {
    artistInfo.append(makeText("span", "artist-placeholder", "♫"));
  }
  const heading = document.createElement("div");
  heading.append(makeText("p", "eyebrow", "YOUR ARTIST SPOTLIGHT"));
  heading.append(makeText("h2", "", artist.name));
  const details = [];
  if (artist.followers) details.push(`${new Intl.NumberFormat().format(artist.followers)} followers`);
  if (artist.genres.length) details.push(artist.genres.join(" · "));
  if (details.length) heading.append(makeText("p", "artist-meta", details.join("  /  ")));
  artistInfo.append(heading);
  if (artist.spotify_url) {
    const profileLink = document.createElement("a");
    profileLink.href = artist.spotify_url;
    profileLink.target = "_blank";
    profileLink.rel = "noopener noreferrer";
    profileLink.className = "profile-link";
    profileLink.textContent = "Artist profile ↗";
    artistInfo.append(profileLink);
  }
  header.append(artistInfo, makeText("span", "track-count", `${data.tracks.length} TOP TRACKS`));
  const grid = document.createElement("div");
  grid.className = "track-list";
  if (!data.tracks.length) grid.append(makeText("p", "empty-state", "No top tracks were returned for this artist."));
  data.tracks.forEach((track, index) => grid.append(makeTrackCard(track, index)));
  resultsBox.append(header, grid);
  resultsBox.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const artist = input.value.trim();
  if (!artist) return;
  button.disabled = true;
  button.textContent = "Searching…";
  statusBox.className = "status is-visible";
  statusBox.textContent = `Finding the sound of ${artist}…`;
  resultsBox.hidden = true;
  try {
    const response = await fetch(`/api/search?artist=${encodeURIComponent(artist)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    renderResults(data);
    statusBox.textContent = "";
    statusBox.className = "status";
  } catch (error) {
    statusBox.className = "status is-visible is-error";
    statusBox.textContent = error.message || "Could not reach the server. Please try again.";
  } finally {
    button.disabled = false;
    button.innerHTML = 'Find tracks <span aria-hidden="true">↗</span>';
  }
});
