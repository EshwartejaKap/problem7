const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const startConnectionAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`the db error is ${error.message}`);
    process.exit(1);
  }
};
startConnectionAndServer();

const convertDbObjectIntoResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectIntoResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertLastObjectIntoResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.score,
    totalFours: dbObject.fours,
    totalSixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const playerQuery = `SELECT * FROM player_details;`;
  const dbResponse = await db.all(playerQuery);
  response.send(
    dbResponse.map((eachPlayer) =>
      convertDbObjectIntoResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerGetQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(playerGetQuery);
  response.send(convertDbObjectIntoResponseObject(dbResponse));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const playerPutQuery = `UPDATE player_details SET player_name = '${playerName}';`;
  const dbResponse = await db.run(playerPutQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchGetQuery = `SELECT * FROM match_details WHERE match_id= ${matchId};`;
  const dbResponse = await db.get(matchGetQuery);
  response.send(convertMatchDbObjectIntoResponseObject(dbResponse));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerGetQuery = `
    SELECT 
       match_details.match_id,
       match_details.match,
       match_details.year
        FROM match_details NATURAL JOIN player_match_score
       WHERE player_match_score.player_id = ${playerId};`;
  const dbResponse = await db.all(playerGetQuery);
  response.send(
    dbResponse.map((eachMatch) =>
      convertMatchDbObjectIntoResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerGetQuery = `SELECT *
    FROM  player_details NATURAL JOIN player_match_score
    WHERE player_match_score.match_id = ${matchId};`;
  const dbResponse = await db.all(playerGetQuery);
  response.send(
    dbResponse.map((eachPlayer) =>
      convertDbObjectIntoResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerGetQuery = `
    SELECT 
    player_details.player_id,
    player_details.player_name,
    player_match_score.SUM(score),
    player_match_score.SUM(fours),
    player_match_score.SUM(sixes)
    FROM  player_details NATURAL JOIN player_match_score
    WHERE player_details.player_id = ${playerId};`;
  const dbResponse = await db.get(playerGetQuery);
  response.send(convertLastObjectIntoResponseObject(dbResponse));
});

module.exports = app;
