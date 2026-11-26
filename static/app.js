const form = document.querySelector("#search-form");
const input = document.querySelector("#artist-input");
const button = document.querySelector("#search-button");
const statusBox = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
let activeAudio = null;

// Keep the existing hero image in each tile. Only try alternatives if that
// image fails, and leave the tile's styled background as the final fallback.
const heroImageFallbacks = {
  "tile-afro": [
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1000&q=85",
  ],
  "tile-house": [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85",
  ],
  "tile-beats": [
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85",
  ],
  "tile-classical": [
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=85",
  ],
};

document.querySelectorAll(".bento-tile").forEach((tile) => {
  const image = tile.querySelector("img");
  if (!image) return;
  const candidates = heroImageFallbacks[tile.classList[1]] || [];
  let nextCandidate = 0;
  image.addEventListener("error", () => {
    // Skip candidates that are the same URL as the current image.
    while (nextCandidate < candidates.length && candidates[nextCandidate] === image.src) {
      nextCandidate += 1;
    }
    if (nextCandidate < candidates.length) {
      image.src = candidates[nextCandidate++];
    } else {
      image.hidden = true;
      tile.classList.add("image-unavailable");
    }
  });
});

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
    image.addEventListener("error", () => {
      image.remove();
      artwork.textContent = "♫";
      artwork.setAttribute("aria-label", "Album artwork unavailable");
    }, { once: true });
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
    image.addEventListener("error", () => image.remove(), { once: true });
    artistInfo.append(image);
  } else {
    artistInfo.append(makeText("span", "artist-placeholder", "♫"));
  }
  const heading = document.createElement("div");
  heading.append(makeText("p", "eyebrow", "YOUR ARTIST SPOTLIGHT"));
  heading.append(makeText("h2", "", artist.name));
  const details = [];
  if (artist.followers) details.push(`${new Intl.NumberFormat().format(artist.followers)} followers`);
  if (artist.genres?.length) details.push(artist.genres.join(" · "));
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
  if (!data.tracks.length) grid.append(makeText("p", "empty-state", "No tracks were returned. Try another artist."));
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
