import {
  loadState as loadStateFromStorage,
  saveState as saveStateToStorage,
  loadSession as loadSessionFromStorage,
  saveSession as saveSessionToStorage,
} from '../utils/storage.js';

let state = null;
let session = null;

export function initializeState(defaultState) {
  state = loadStateFromStorage(defaultState);
  return state;
}

export function initializeSession() {
  session = loadSessionFromStorage();
  return session;
}

export function getState() {
  return state;
}

export function getSession() {
  return session;
}

export function setState(nextState) {
  state = nextState;
}

export function setSession(nextSession) {
  session = nextSession;
}

export function saveState() {
  if (!state) return;
  saveStateToStorage(state);
}

export function saveSession() {
  saveSessionToStorage(session);
}

export function clearSession() {
  session = null;
  saveSessionToStorage(null);
}
