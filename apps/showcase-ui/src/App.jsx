import { useEffect, useState } from 'react';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

const TOKEN_STORAGE_KEY = 'tournament_showcase_access_token';
const PLAYER_ID_STORAGE_KEY = 'tournament_showcase_player_id';

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

async function parseResponse(response) {
  const text = await response.text();
  let json = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.payload = json;
    throw error;
  }

  return json;
}

export default function App() {
  const [playerId, setPlayerId] = useState(
    localStorage.getItem(PLAYER_ID_STORAGE_KEY) || 'user1',
  );
  const [token, setToken] = useState(
    localStorage.getItem(TOKEN_STORAGE_KEY) || '',
  );
  const [entryFee, setEntryFee] = useState('10');
  const [gameType, setGameType] = useState('chess');
  const [tournamentType, setTournamentType] = useState('solo');
  const [lookupPlayerId, setLookupPlayerId] = useState('user1');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(PLAYER_ID_STORAGE_KEY, playerId);
  }, [playerId]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      return;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, [token]);

  async function runRequest(label, fn) {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fn();
      setResult({ label, data });
    } catch (requestError) {
      setError({
        label,
        status: requestError.status || null,
        payload: requestError.payload ?? requestError.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function login() {
    await runRequest('POST /auth/login', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      const data = await parseResponse(response);
      setToken(data.accessToken || '');
      return data;
    });
  }

  async function checkHealth() {
    await runRequest('GET /health', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      return parseResponse(response);
    });
  }

  async function joinTournament() {
    await runRequest('POST /tournaments/join', async () => {
      const response = await fetch(`${API_BASE_URL}/tournaments/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          gameType,
          tournamentType,
          entryFee: Number(entryFee),
        }),
      });
      return parseResponse(response);
    });
  }

  async function getMyTournaments() {
    await runRequest('GET /tournaments/my-tournaments', async () => {
      const response = await fetch(`${API_BASE_URL}/tournaments/my-tournaments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return parseResponse(response);
    });
  }

  async function getPlayerTournaments() {
    await runRequest('GET /players/:playerId/tournaments', async () => {
      const response = await fetch(
        `${API_BASE_URL}/players/${encodeURIComponent(lookupPlayerId)}/tournaments`,
      );
      return parseResponse(response);
    });
  }

  function clearToken() {
    setToken('');
    setResult(null);
    setError(null);
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Tournament System</p>
          <h1>Showcase UI</h1>
          <p className="muted">
            Simple React client for the interview assignment. It exercises auth,
            join tournament, and query flows through the gateway.
          </p>
        </div>
        <div className="hero-links">
          <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer">
            Swagger Docs
          </a>
          <a href={`${API_BASE_URL}/health`} target="_blank" rel="noreferrer">
            Gateway Health
          </a>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Auth</h2>
          <label>
            Player ID
            <input
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              placeholder="user1"
            />
          </label>
          <div className="row">
            <button onClick={login} disabled={isLoading}>
              Login (JWT)
            </button>
            <button onClick={clearToken} disabled={isLoading || !token}>
              Clear Token
            </button>
          </div>
          <label>
            Access Token
            <textarea
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="JWT appears here after login"
              rows={5}
            />
          </label>
          <p className="hint">
            Demo login only issues a token. User existence is still validated by
            the backend when joining tournaments.
          </p>
        </div>

        <div className="card">
          <h2>Join Tournament</h2>
          <label>
            Game Type
            <input
              value={gameType}
              onChange={(event) => setGameType(event.target.value)}
              placeholder="chess"
            />
          </label>
          <label>
            Tournament Type
            <input
              value={tournamentType}
              onChange={(event) => setTournamentType(event.target.value)}
              placeholder="solo"
            />
          </label>
          <label>
            Entry Fee
            <input
              type="number"
              min="0"
              value={entryFee}
              onChange={(event) => setEntryFee(event.target.value)}
            />
          </label>
          <div className="row">
            <button onClick={joinTournament} disabled={isLoading}>
              Join Tournament
            </button>
            <button onClick={getMyTournaments} disabled={isLoading}>
              My Tournaments
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Lookup Player Tournaments</h2>
          <label>
            Player ID
            <input
              value={lookupPlayerId}
              onChange={(event) => setLookupPlayerId(event.target.value)}
              placeholder="user1"
            />
          </label>
          <button onClick={getPlayerTournaments} disabled={isLoading}>
            Fetch Player Tournaments
          </button>
          <button
            className="secondary"
            onClick={checkHealth}
            disabled={isLoading}
          >
            Check Gateway Health
          </button>
        </div>
      </section>

      <section className="output-grid">
        <div className="card">
          <h2>Last Result</h2>
          <pre>{result ? prettyJson(result) : 'No successful request yet.'}</pre>
        </div>
        <div className="card">
          <h2>Last Error</h2>
          <pre>{error ? prettyJson(error) : 'No errors yet.'}</pre>
        </div>
      </section>
    </main>
  );
}

