<?php
require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/guards.php';

require_method('GET');
$judgeId = require_login();

// Scores THIS judge has already committed - the frontend uses this to lock inputs
// after a refresh, on another device, or with browser storage cleared.
$safeJudge = mysqli_real_escape_string($conn, (string)$judgeId);

$query = "SELECT s.score_id, s.team_id, s.originality, s.mastery_of_steps, s.choreography_and_style, s.costume_and_props, s.stage_presence, s.total_score, s.created_at, sc.team
          FROM interpretative_score s
          INNER JOIN teams sc ON s.team_id = sc.team_id
          WHERE s.judge_id = '$safeJudge'";

$result = mysqli_query($conn, $query);
if (!$result) {
    json_out(500, ['message' => 'Internal Server Error']);
}

json_out(200, [
    'message' => 'Interpretative Dance scores fetched successfully',
    'data' => mysqli_fetch_all($result, MYSQLI_ASSOC),
]);
