<?php
require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/guards.php';

require_method('GET');

// These tables key on team_id and join `teams`; the previous version was a
// copy of the pageant endpoint and joined a `contestants` table that does not exist.
$query = "SELECT
            fs.team_id,
            t.team,
            fs.final_score,
            fs.created_at,
            fs.updated_at
          FROM interpretative_final_score fs
          INNER JOIN teams t ON fs.team_id = t.team_id
          ORDER BY fs.final_score DESC";

$result = mysqli_query($conn, $query);

if (!$result) {
    json_out(500, ['message' => 'Internal Server Error']);
}

if (mysqli_num_rows($result) === 0) {
    json_out(404, ['message' => 'No Interpretative Dance Final Scores Found']);
}

json_out(200, [
    'message' => 'Interpretative Dance Final Scores Fetched Successfully',
    'data' => mysqli_fetch_all($result, MYSQLI_ASSOC),
]);
