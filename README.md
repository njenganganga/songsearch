# Sonora — Spotify artist top tracks

A small Flask web app and command-line tool that searches Spotify for an artist and shows their top tracks. The responsive frontend uses a cream, near-black, and burnt-orange palette, with a music-inspired bento hero and track previews when Spotify provides them.

## Requirements

- Python 3.9 or newer
- A Spotify Developer app with a Client ID and Client Secret

## Setup on Windows (Command Prompt)

1. Open Command Prompt and change to the project folder:

   ```bat
   cd C:\path\to\songsearch
   ```

2. Create and activate a virtual environment:

   ```bat
   py -m venv .venv
   .venv\Scripts\activate
   ```

3. Install dependencies and create your local credentials file:

   ```bat
   py -m pip install -r requirements.txt
   copy .env.example .env
   notepad .env
   ```

   Replace the example values in `.env` with your Spotify app's credentials. Keep `.env` private; it is ignored by Git.

4. Start the website:

   ```bat
   py app.py
   ```

   Visit <http://127.0.0.1:5000>. Stop the development server with `Ctrl+C`.

## Command-line search

With the virtual environment active and `.env` configured:

```bat
py main.py
```

Or provide an artist directly:

```bat
py main.py "Sauti Sol"
```

## Notes

- Results use Spotify's top-tracks endpoint for the Kenya market (`KE`), matching the original project.
- Preview audio is shown only when Spotify returns a preview URL; not every track has one.
- The hero photography loads from Unsplash, and Google Fonts are loaded online.
- If Spotify credentials were ever committed to a public repository, revoke or rotate the Client Secret in the Spotify Developer Dashboard before using the app again. Never put credentials in frontend code.
