<?php
require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/guards.php';

require_method('GET');
$judgeId = require_login();

// Scores THIS judge has already committed - the frontend uses this to lock inputs
// after a refresh, on another device, or with browser storage cleared.
$safeJudge = mysqli_real_escape_string($conn, (string)$judgeId);

$query = "SELECT s.score_id, s.cand_id, s.voice_tone_quality, s.mastery_and_timing, s.vocal_expression, s.diction, s.stage_presence, s.entertainment_value, s.total_score, s.created_at, sc.cand_name, sc.cand_team
          FROM vocal_score s
          INNER JOIN vocal_contestants sc ON s.cand_id = sc.cand_id
          WHERE s.judge_id = '$safeJudge'";

$result = mysqli_query($conn, $query);
if (!$result) {
    json_out(500, ['message' => 'Internal Server Error']);
}

json_out(200, [
    'message' => 'Vocal scores fetched successfully',
    'data' => mysqli_fetch_all($result, MYSQLI_ASSOC),
]);
