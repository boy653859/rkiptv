<?php
// ============================================================
// api.php — REST API for RK IP TV
//
// GET    api.php?type=auth                       — verify token
// GET    api.php?type=matches[&sport=cricket]
// POST   api.php?type=matches
// PUT    api.php?type=matches&id=N
// DELETE api.php?type=matches&id=N
//
// GET    api.php?type=channels
// POST   api.php?type=channels
// PUT    api.php?type=channels&id=N
// DELETE api.php?type=channels&id=N
// ============================================================

require_once 'config.php';

date_default_timezone_set('Asia/Dhaka');

$method = $_SERVER['REQUEST_METHOD'];
$type   = $_GET['type'] ?? '';
$id     = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ---- Verify admin token ----
function check_admin() {
    $auth = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    if ($auth !== ADMIN_PASS) {
        json_out(['error' => 'Unauthorized'], 401);
    }
}

// ============================================================
// AUTH — login check
// ============================================================
if ($type === 'auth') {
    check_admin(); // 401 if wrong, else falls through
    json_out(['ok' => true]);
}

// ============================================================
// MATCHES
// ============================================================
if ($type === 'matches') {

    if ($method === 'GET') {

        // Build query — only filter by sport (status is auto-calculated)
        $where  = [];
        $params = [];
        $types  = '';

        if (!empty($_GET['sport']) && $_GET['sport'] !== 'all') {
            $where[]  = 'sport = ?';
            $params[] = $_GET['sport'];
            $types   .= 's';
        }

        $sql = 'SELECT * FROM matches';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY match_date ASC, match_time ASC';

        $stmt = $conn->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $now        = time();
        $toDelete   = [];
        $result     = [];

        foreach ($rows as $r) {
            // matches without date/time treated as upcoming
            if (!$r['match_date'] || !$r['match_time']) {
                $r['status']       = 'upcoming';
                $r['is_live']      = false;
                $r['display_time'] = '';
                $result[]          = $r;
                continue;
            }

            $matchTime = strtotime($r['match_date'] . ' ' . $r['match_time']);

            // Auto-delete: live for more than 4 hours
            if ($now >= $matchTime + (4 * 3600)) {
                $toDelete[] = (int) $r['id'];
                continue; // skip — don't include in response
            }

            // Status logic:
            // upcoming : > 24h before match
            // recent   : within 24h before match (shows in both recent + upcoming tabs)
            // live     : match time passed, < 4h ago
            if ($now < $matchTime - 86400) {
                $r['status'] = 'upcoming';
            } elseif ($now < $matchTime) {
                $r['status'] = 'recent';
            } else {
                $r['status'] = 'live';
            }

            $r['is_live']      = ($r['status'] === 'live');
            $r['display_time'] = date('d M', $matchTime) . ' | ' . date('h:i A', $matchTime);
            $result[]          = $r;
        }

        // Batch delete expired matches
        if ($toDelete) {
            $placeholders = implode(',', array_fill(0, count($toDelete), '?'));
            $delStmt = $conn->prepare("DELETE FROM matches WHERE id IN ($placeholders)");
            $delTypes = str_repeat('i', count($toDelete));
            $delStmt->bind_param($delTypes, ...$toDelete);
            $delStmt->execute();
        }

        json_out($result);
    }

    if ($method === 'POST') {
        check_admin();
        $f = $body;

        if (empty($f['sport']) || empty($f['tournament']) || empty($f['team1_name']) || empty($f['team2_name'])) {
            json_out(['error' => 'Missing required fields'], 400);
        }

        $stmt = $conn->prepare(
            'INSERT INTO matches
             (sport, tournament, team1_name, team1_logo, team2_name, team2_logo, match_date, match_time, stream_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param(
            'sssssssss',
            $f['sport'],
            $f['tournament'],
            $f['team1_name'],
            $f['team1_logo'],
            $f['team2_name'],
            $f['team2_logo'],
            $f['match_date'],
            $f['match_time'],
            $f['stream_url']
        );
        $stmt->execute();
        json_out(['id' => $conn->insert_id, 'message' => 'Match added']);
    }

    if ($method === 'PUT' && $id) {
        check_admin();
        $f = $body;

        if (empty($f['sport']) || empty($f['tournament']) || empty($f['team1_name']) || empty($f['team2_name'])) {
            json_out(['error' => 'Missing required fields'], 400);
        }

        $stmt = $conn->prepare(
            'UPDATE matches SET
             sport=?, tournament=?,
             team1_name=?, team1_logo=?,
             team2_name=?, team2_logo=?,
             match_date=?, match_time=?, stream_url=?
             WHERE id=?'
        );
        $stmt->bind_param(
            'sssssssssi',
            $f['sport'],
            $f['tournament'],
            $f['team1_name'],
            $f['team1_logo'],
            $f['team2_name'],
            $f['team2_logo'],
            $f['match_date'],
            $f['match_time'],
            $f['stream_url'],
            $id
        );
        $stmt->execute();
        json_out(['message' => 'Match updated']);
    }

    if ($method === 'DELETE' && $id) {
        check_admin();
        $stmt = $conn->prepare('DELETE FROM matches WHERE id=?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        json_out(['message' => 'Match deleted']);
    }
}

// ============================================================
// CHANNELS
// ============================================================
if ($type === 'channels') {

    if ($method === 'GET') {
        $rows = $conn->query('SELECT * FROM channels ORDER BY name ASC')
            ->fetch_all(MYSQLI_ASSOC);
        foreach ($rows as &$r)
            $r['is_live'] = (bool) $r['is_live'];
        json_out($rows);
    }

    if ($method === 'POST') {
        check_admin();
        $f    = $body;
        $live = !empty($f['is_live']) ? 1 : 0;

        if (empty($f['name'])) {
            json_out(['error' => 'Channel name is required'], 400);
        }

        $stmt = $conn->prepare(
            'INSERT INTO channels (name, logo, stream_url, is_live, meta) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('sssis', $f['name'], $f['logo'], $f['stream_url'], $live, $f['meta']);
        $stmt->execute();
        json_out(['id' => $conn->insert_id, 'message' => 'Channel added']);
    }

    if ($method === 'PUT' && $id) {
        check_admin();
        $f    = $body;
        $live = !empty($f['is_live']) ? 1 : 0;

        $stmt = $conn->prepare(
            'UPDATE channels SET name=?, logo=?, stream_url=?, is_live=?, meta=? WHERE id=?'
        );
        $stmt->bind_param('sssisi', $f['name'], $f['logo'], $f['stream_url'], $live, $f['meta'], $id);
        $stmt->execute();
        json_out(['message' => 'Channel updated']);
    }

    if ($method === 'DELETE' && $id) {
        check_admin();
        $stmt = $conn->prepare('DELETE FROM channels WHERE id=?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        json_out(['message' => 'Channel deleted']);
    }
}

json_out(['error' => 'Invalid request'], 400);
