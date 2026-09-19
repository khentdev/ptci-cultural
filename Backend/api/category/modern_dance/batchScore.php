<?php
require_once __DIR__ . '/../../../config/session_config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/guards.php';

require_method('POST');
$judgeId = require_login();

/** criterion => maximum points; mirrors the frontend so the API rejects impossible scores. */
$CRITERIA = [
    'mastery_of_steps' => 25,
    'choreography_and_style' => 30,
    'costume_and_props' => 20,
    'stage_presence' => 15,
    'audience_impact' => 10
];

$rows = json_body();
if (!is_array($rows) || !$rows || array_keys($rows) !== range(0, count($rows) - 1)) {
    json_out(422, ['message' => 'Expected a non-empty array of scores.']);
}

$safeJudge = mysqli_real_escape_string($conn, (string)$judgeId);

// Validate everything up front: this submission is all-or-nothing.
$clean = [];
foreach ($rows as $row) {
    if (!is_array($row)) json_out(422, ['message' => 'Each score must be an object.']);

    $subjectId = $row['team_id'] ?? null;
    if ($subjectId === null || $subjectId === '' || !is_numeric($subjectId)) {
        json_out(422, ['message' => 'Each score needs a valid team_id.']);
    }

    $entry = ['team_id' => (int)$subjectId];
    foreach ($CRITERIA as $field => $max) {
        // A legitimate score of 0 must be accepted, so test for presence, not truthiness.
        if (!array_key_exists($field, $row) || $row[$field] === '' || $row[$field] === null) {
            json_out(422, ['message' => "Missing score for $field."]);
        }
        if (!is_numeric($row[$field])) {
            json_out(422, ['message' => "$field must be a number."]);
        }
        $value = (float)$row[$field];
        if ($value < 0 || $value > $max) {
            json_out(422, ['message' => "$field must be between 0 and $max."]);
        }
        $entry[$field] = $value;
    }
    $clean[] = $entry;
}

$subjectIds = array_map(fn($e) => $e['team_id'], $clean);
if (count(array_unique($subjectIds)) !== count($subjectIds)) {
    json_out(422, ['message' => 'Duplicate entries in this submission.']);
}

$idList = implode(',', array_map('intval', $subjectIds));
$already = mysqli_query(
    $conn,
    "SELECT team_id FROM modern_score WHERE judge_id = '$safeJudge' AND team_id IN ($idList)"
);
if ($already && mysqli_num_rows($already) > 0) {
    json_out(409, ['message' => 'You have already submitted scores for this category.']);
}

mysqli_begin_transaction($conn);

try {
    $results = [];

    foreach ($clean as $entry) {
        do {
            $scoreId = rand(100000, 999999);
            $check = mysqli_query($conn, "SELECT score_id FROM modern_score WHERE score_id = '$scoreId'");
        } while ($check && mysqli_num_rows($check) > 0);

        $columns = ['score_id', 'team_id', 'judge_id'];
        $values = ["'$scoreId'", "'" . (int)$entry['team_id'] . "'", "'$safeJudge'"];
        foreach ($CRITERIA as $field => $max) {
            $columns[] = $field;
            $values[] = "'" . (float)$entry[$field] . "'";
        }

        // total_score is a STORED generated column - never write to it.
        $insert = "INSERT INTO modern_score (" . implode(',', $columns) . ")
                   VALUES (" . implode(',', $values) . ")";
        if (!mysqli_query($conn, $insert)) {
            throw new Exception(mysqli_error($conn));
        }

        $results[] = ['team_id' => (int)$entry['team_id'], 'score_id' => $scoreId];
    }

    // Recompute the averaged final score for every subject this submission touched.
    foreach ($subjectIds as $subjectId) {
        $sid = (int)$subjectId;
        $avgResult = mysqli_query(
            $conn,
            "SELECT AVG(total_score) AS avg_total FROM modern_score WHERE team_id = '$sid'"
        );
        if (!$avgResult) throw new Exception(mysqli_error($conn));
        $avg = (float)(mysqli_fetch_assoc($avgResult)['avg_total'] ?? 0);

        $exists = mysqli_query($conn, "SELECT team_id FROM modern_final_score WHERE team_id = '$sid'");
        if (!$exists) throw new Exception(mysqli_error($conn));

        $upsert = mysqli_num_rows($exists) > 0
            ? "UPDATE modern_final_score SET final_score = '$avg' WHERE team_id = '$sid'"
            : "INSERT INTO modern_final_score (team_id, final_score) VALUES ('$sid', '$avg')";
        if (!mysqli_query($conn, $upsert)) throw new Exception(mysqli_error($conn));
    }

    mysqli_commit($conn);
} catch (Throwable $e) {
    mysqli_rollback($conn);
    json_out(500, ['message' => 'Could not save the scores. Nothing was recorded.']);
}

json_out(201, [
    'message' => 'Modern Dance scores submitted successfully',
    'results' => $results,
    'has_submitted' => true,
]);
