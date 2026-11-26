"""Flask web interface for Spotify artist top-track search."""

from flask import Flask, jsonify, render_template, request

from main import SpotifyAPIError, get_songs_by_artist, get_token, search_for_artist

app = Flask(__name__)


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/search")
def search():
    artist_name = request.args.get("artist", "").strip()[:100]
    if not artist_name:
        return jsonify({"error": "Enter an artist name to start your search."}), 400

    try:
        token = get_token()
        artist = search_for_artist(token, artist_name)
        if artist is None:
            return jsonify({"error": f'No artist found for "{artist_name}". Try another name.'}), 404
        tracks = get_songs_by_artist(
            token, artist["id"], artist_name=artist.get("name", artist_name)
        )
    except SpotifyAPIError as error:
        return jsonify({"error": str(error)}), 502

    artist_images = artist.get("images") or []
    results = []
    for track in tracks:
        album = track.get("album") or {}
        album_images = album.get("images") or []
        artists = track.get("artists") or []
        results.append(
            {
                "id": track.get("id"),
                "name": track.get("name", "Untitled track"),
                "artists": ", ".join(item.get("name", "") for item in artists),
                "album": album.get("name", ""),
                "image": album_images[0].get("url") if album_images else None,
                "preview_url": track.get("preview_url"),
                "spotify_url": (track.get("external_urls") or {}).get("spotify"),
                "duration_ms": track.get("duration_ms", 0),
            }
        )

    return jsonify(
        {
            "artist": {
                "name": artist.get("name", artist_name),
                "image": artist_images[0].get("url") if artist_images else None,
                "followers": (artist.get("followers") or {}).get("total", 0),
                "genres": artist.get("genres", [])[:3],
                "spotify_url": (artist.get("external_urls") or {}).get("spotify"),
            },
            "tracks": results,
        }
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
