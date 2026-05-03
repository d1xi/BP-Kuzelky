/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { DatabaseSync } from "node:sqlite"
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import  { ChildProcess, spawn } from "node:child_process";

let database: DatabaseSync | null = null;
let mainWindow: BrowserWindow | null = null;
let pythonProcess: ChildProcess;

ipcMain.handle('dbRun',  (event, query, ...args) => {
  if (database === null) {
    return null;
  }
  
  const statement = database.prepare(query);
  return statement.run(...args);  
});

ipcMain.handle('dbGet',  (event, query, ...args) => {
  if (database === null) {
    return null;
  }

  const statement = database.prepare(query);
  return statement.get(...args);  
});

ipcMain.handle('dbAll',  (event, query, ...args) => {
  if (database === null) {
    return null;
  }

  const statement = database.prepare(query);
  return statement.all(...args);  
});

ipcMain.handle("createNewMatch", (event, data) => {
  if(!database) return null;

  try{
    database.exec("BEGIN");
    const{
      date,
      leagueId,
      totalThrows,
      playerCount,
      homeTeamId,
      guestTeamId,
      homePlayerIds,
      guestPlayerIds
    } = data;

    const insertMatch = database.prepare(`
      INSERT INTO matches(date, leagueId, totalThrows, playerCount)
      VALUES (?,?,?,?)
      `);

    const insertTeam = database.prepare(`
      INSERT INTO matchTeams(matchId, teamId)
      VALUES (?,?)
      `);

    const insertPlayer = database.prepare(`
      INSERT INTO matchPlayers(matchId, teamId, memberId, teamName, memberName)
      SELECT ?, t.id, m.id, t.name, m.name
      FROM members m
      LEFT JOIN teams t ON t.id = m.teamId
      WHERE m.id = ?
      `);

    const result = insertMatch.run(
      date,
      leagueId,
      totalThrows,
      playerCount
    );

    const matchId = result.lastInsertRowid as number;

    insertTeam.run(matchId, homeTeamId);
    insertTeam.run(matchId, guestTeamId);

    for(const id of homePlayerIds){
      insertPlayer.run(matchId, id);
    }

    for(const id of guestPlayerIds){
      insertPlayer.run(matchId, id);
    }

    database.exec("COMMIT");
    return matchId; 
    
  }
  catch (error){
    database.exec("ROLLBACK");
    throw error;
  }
});

ipcMain.handle("updateMatch", (event, data) => {
  if(!database){
    return;
  }

  const {
    matchId,
    homePlayerIds,
    guestPlayerIds,
  } = data;

  try{
    database.exec("BEGIN");
    database.prepare("DELETE FROM matchPlayers WHERE matchId = ?").run(matchId);

    const insertNewPlayers = database.prepare(`
      INSERT INTO matchPlayers(matchId, teamId, memberId, teamName, memberName)
      SELECT ?, t.id, m.id, t.name, m.name
      FROM members m
      JOIN teams t ON t.id = m.teamId
      WHERE m.id = ?
      `);

      for(const id of [...homePlayerIds, ...guestPlayerIds]){
        insertNewPlayers.run(matchId, id);
      };

      database.exec("COMMIT");
  }
  catch(error){
    database.exec("ROLLBACK");
    throw error;
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const userData = app.getPath('userData');
  database = new DatabaseSync(path.join(userData, "data.db"));

  database.exec(`PRAGMA foreign_keys = ON;`);

  
database.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leagueId INTEGER,
    leaderId INTEGER,
    FOREIGN KEY (leagueId) REFERENCES leagues(id) ON DELETE SET NULL,
    FOREIGN KEY (leaderId) REFERENCES members(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    registrationNumber INTEGER NOT NULL,
    teamId INTEGER,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL,
    leagueId INTEGER NOT NULL,
    totalThrows INTEGER NOT NULL,
    playerCount INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    FOREIGN KEY (leagueId) REFERENCES leagues(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS matchPlayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchId INTEGER NOT NULL,
    teamId INTEGER,
    memberId INTEGER,
    teamName TEXT NOT NULL,
    memberName TEXT NOT NULL,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE SET NULL,
    UNIQUE(matchId, memberId)
  );

  CREATE TABLE IF NOT EXISTS matchTeams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchId INTEGER NOT NULL,
    teamId INTEGER,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE(matchId, teamId)
  );

  CREATE TABLE IF NOT EXISTS throwSeries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchPlayerId INTEGER NOT NULL,
    line INTEGER NOT NULL,
    FOREIGN KEY (matchPlayerId) REFERENCES matchPlayers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS throws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    throwSeriesId INTEGER NOT NULL,
    throwNumber INTEGER NOT NULL,
    fallenPins INTEGER NOT NULL,
    fallenPinsMap INTEGER NOT NULL,
    FOREIGN KEY (throwSeriesId) REFERENCES throwSeries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matchState(
    matchId INTEGER PRIMARY KEY,
    currentPlayerIndex INTEGER NOT NULL DEFAULT 0,
    currentTeamId INTEGER,
    currentRound INTEGER NOT NULL DEFAULT 0,
    isFinished INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS matchDraft (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_matchPlayers_matchId ON matchPlayers(matchId);
  CREATE INDEX IF NOT EXISTS idx_matchTeams_matchId ON matchTeams(matchId);
  CREATE INDEX IF NOT EXISTS idx_throws_series ON throws(throwSeriesId);
`);

  const seedDatabase = database
    .prepare("SELECT COUNT(*) as count FROM teams")
    .get() as {count: number};
  
  if(seedDatabase.count === 0){
    database.exec(`
    INSERT INTO leagues (name) VALUES ('Krajský přebor Vysočina');
    INSERT INTO leagues (name) VALUES ('Krajská soutěž Vysočiny');
    INSERT INTO leagues (name) VALUES ('Divize Jih');
    INSERT INTO leagues (name) VALUES ('Přebory');

    INSERT INTO teams (name, leagueID) VALUES ('TJ Nové Město na Moravě C', 1);
    INSERT INTO teams (name, leagueID) VALUES ('TJ Třebíč D', 1);
    INSERT INTO teams (name, leagueID) VALUES ('TJ Slovan Kamenice nad Lipou D', 1);
    INSERT INTO teams (name, leagueID) VALUES ('TJ Spartak Pelhřimov b', 2);

    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Jana Novakova', 41234, 1);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Petr Svoboda', 12345, 1);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Marta', 7855, 1);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Jan', 14455, 1);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Jana', 4545, 1);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Anna Vesela', 3245, 2);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Žaneta', 6565, 2);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Pavla', 5485, 2);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Pavel', 3575, 2);
    INSERT INTO members (name, registrationNumber, teamId) VALUES ('Martin', 3548, 2);
  `);
  }
  
  //backend python

  
  pythonProcess = spawn("python", [path.join(__dirname, '../../src/backend/main.py')], {
    stdio:["ignore", "inherit", process.stderr],
    windowsHide:true
  });
  pythonProcess.on('close', (retCode) => {
      console.log(`child process exited with code ${retCode}`);
  });

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  /* Results Window */
  function createResultsWindow(){
    const resultsWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: true,
      webPreferences: {
        preload: app.isPackaged
          ?path.join(__dirname, "preload.js")
          :path.join(__dirname, "../../.erb/dll/preload.js"),
      },
    });

    resultsWindow.loadURL(
      resolveHtmlPath("index.html")
    );
    resultsWindow.webContents.send("navigate", "/Results")
  }

  ipcMain.on("openResultsWindow", () => {
    createResultsWindow();
  })


  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
 };

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed  
  pythonProcess.kill("SIGINT"); 
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
