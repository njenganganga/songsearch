"""Spotify artist search helpers and command-line interface."""

import argparse
import base64
import os

import requests
from dotenv import load_dotenv

load_dotenv()

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_URL = "https://api.spotify.com/v1"
REQUEST_TIMEOUT = 15


class SpotifyAPIError(RuntimeError):
    """Raised when Spotify credentials or an API request is invalid."""


def get_token():
    """Request a Spotify client-credentials access token."""
    client_id = os.getenv("CLIENT_ID")
    client_secret = os.getenv("CLIENT_SECRET")
    if not client_id or not client_secret:
        raise SpotifyAPIError(
            "Spotify credentials are missing. Add CLIENT_ID and CLIENT_SECRET to your .env file."
        )

    credentials = f"{client_id}:{client_secret}".encode("utf-8")
    encoded_credentials = base64.b64encode(credentials).decode("utf-8")
    try:
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            headers={
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials"},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        token = response.json().get("access_token")
    except (requests.RequestException, ValueError) as error:
        raise SpotifyAPIError("Spotify could not provide an access token. Check your credentials and connection.") from error

    if not token:
        raise SpotifyAPIError("Spotify returned an empty access token.")
    return token


def get_auth_header(token):
    """Return the authorization header used by Spotify API requests."""
    return {"Authorization": f"Bearer {token}"}


def search_for_artist(token, artist_name):
    """Return the best matching Spotify artist, or None if no match exists."""
    try:
        response = requests.get(
            f"{SPOTIFY_API_URL}/search",
            headers=get_auth_header(token),
            params={"q": artist_name, "type": "artist", "limit": 1},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        artists = response.json().get("artists", {}).get("items", [])
    except (requests.RequestException, ValueError) as error:
        raise SpotifyAPIError("Artist search failed. Please try again in a moment.") from error
    return artists[0] if artists else None


def get_songs_by_artist(token, artist_id, country="KE"):
    """Return the artist's top tracks for the selected Spotify market."""
    try:
        response = requests.get(
            f"{SPOTIFY_API_URL}/artists/{artist_id}/top-tracks",
            headers=get_auth_header(token),
            params={"country": country},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json().get("tracks", [])
    except (requests.RequestException, ValueError) as error:
        raise SpotifyAPIError("Could not load top tracks. Please try again in a moment.") from error


def main():
    """Run the original interactive command-line search."""
    parser = argparse.ArgumentParser(description="Find an artist's top Spotify tracks.")
    parser.add_argument("artist", nargs="?", help="artist to search for (prompts if omitted)")
    args = parser.parse_args()
    artist_name = (args.artist or input("Which artist would you like to search for? ")).strip()
    if not artist_name:
        parser.error("Please enter an artist name.")

    try:
        token = get_token()
        artist = search_for_artist(token, artist_name)
        if artist is None:
            print(f'No artist found for "{artist_name}".')
            return
        tracks = get_songs_by_artist(token, artist["id"])
    except SpotifyAPIError as error:
        parser.exit(1, f"Error: {error}\n")

    print(f"Top tracks for {artist['name']}:")
    for index, track in enumerate(tracks, start=1):
        print(f"{index}. {track['name']}")


if __name__ == "__main__":
    main()
