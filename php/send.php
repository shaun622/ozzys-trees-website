<?php
/**
 * Ozzy's Tree & Stump Services — quote enquiry handler.
 * Sends form submissions to your inbox via the Resend API (https://resend.com).
 *
 * SETUP (one time):
 *   1. Create a free Resend account and an API key.
 *   2. (Recommended) Verify ozzystrees.com.au as a sending domain in Resend so
 *      mail can come "from" your own domain. Until then you can use the test
 *      sender onboarding@resend.dev (it only delivers to your Resend account email).
 *   3. Copy php/config.sample.php to php/config.php and fill in your key + emails.
 *      config.php is git-ignored so your key never ends up in the repo.
 *
 * The contact form posts here via fetch(); we reply with JSON.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond($ok, $message = '', $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'success' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

/* ---- Config ---- */
$cfgFile = __DIR__ . '/config.php';
$config  = file_exists($cfgFile) ? include $cfgFile : [];
$apiKey   = $config['resend_api_key'] ?? getenv('RESEND_API_KEY') ?: '';
$mailTo   = $config['mail_to']        ?? 'info@ozzystrees.com.au';
$mailFrom = $config['mail_from']      ?? "Ozzy's Website <onboarding@resend.dev>";
$turnstileSecret = $config['turnstile_secret'] ?? getenv('TURNSTILE_SECRET') ?: '';

/* ---- Honeypot: silently accept bots ---- */
if (!empty($_POST['company'])) {
    respond(true, 'Thanks.');
}

/* ---- Collect + sanitise ---- */
function clean($v, $max = 2000) {
    $v = is_string($v) ? trim($v) : '';
    $v = str_replace(["\r", "\n"], [' ', ' '], substr($v, 0, $max));
    return htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
}
$name    = clean($_POST['name'] ?? '', 120);
$phone   = clean($_POST['phone'] ?? '', 40);
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$suburb  = clean($_POST['suburb'] ?? '', 120);
$service = clean($_POST['service'] ?? '', 120);
$message = nl2br(htmlspecialchars(trim(substr($_POST['message'] ?? '', 0, 5000)), ENT_QUOTES, 'UTF-8'));

/* ---- Validate ---- */
if ($name === '' || $phone === '' || trim(strip_tags($message)) === '') {
    respond(false, 'Please add your name, phone and a few details about the job.', 422);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'That email address does not look right. Please check it or leave it blank.', 422);
}

/* ---- Cloudflare Turnstile (only enforced when a secret is configured) ---- */
function turnstile_verify($secret, $token, $ip) {
    $data = http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => $ip]);
    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $data, CURLOPT_TIMEOUT => 10]);
        $resp = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $data, 'timeout' => 10, 'ignore_errors' => true]]);
        $resp = @file_get_contents($url, false, $ctx);
    }
    if ($resp === false) return false;
    $json = json_decode($resp, true);
    return isset($json['success']) && $json['success'] === true;
}
if ($turnstileSecret !== '') {
    $token = $_POST['cf-turnstile-response'] ?? '';
    if ($token === '' || !turnstile_verify($turnstileSecret, $token, $_SERVER['REMOTE_ADDR'] ?? '')) {
        respond(false, 'Bot check failed. Please refresh the page and try again, or call us on 0451 308 349.', 422);
    }
}

if ($apiKey === '') {
    respond(false, 'The quote form is not finished being set up yet. Please call or text us on 0451 308 349.', 500);
}

/* ---- Build email ---- */
$replyTo = ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) ? $email : null;
$safeEmail = $replyTo ? htmlspecialchars($replyTo, ENT_QUOTES, 'UTF-8') : 'not supplied';
$subject = 'New quote enquiry' . ($name ? " from $name" : '') . ($suburb ? " ($suburb)" : '');

$html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#142318;max-width:560px">'
      . '<h2 style="color:#2C5740;margin:0 0 12px">New website quote enquiry</h2>'
      . '<table style="border-collapse:collapse;width:100%;font-size:15px">'
      . "<tr><td style=\"padding:6px 0;color:#6B7B72;width:120px\">Name</td><td style=\"padding:6px 0\"><strong>$name</strong></td></tr>"
      . "<tr><td style=\"padding:6px 0;color:#6B7B72\">Phone</td><td style=\"padding:6px 0\"><a href=\"tel:$phone\">$phone</a></td></tr>"
      . "<tr><td style=\"padding:6px 0;color:#6B7B72\">Email</td><td style=\"padding:6px 0\">$safeEmail</td></tr>"
      . "<tr><td style=\"padding:6px 0;color:#6B7B72\">Suburb</td><td style=\"padding:6px 0\">" . ($suburb ?: '&mdash;') . "</td></tr>"
      . "<tr><td style=\"padding:6px 0;color:#6B7B72\">Service</td><td style=\"padding:6px 0\">" . ($service ?: '&mdash;') . "</td></tr>"
      . '</table>'
      . "<p style=\"margin:16px 0 6px;color:#6B7B72;font-size:15px\">Message</p>"
      . "<div style=\"background:#F3EFE4;border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.6\">$message</div>"
      . '<p style="margin-top:18px;color:#6B7B72;font-size:13px">Sent from the ozzystrees.com.au quote form.</p>'
      . '</div>';

$payload = [
    'from'    => $mailFrom,
    'to'      => [$mailTo],
    'subject' => $subject,
    'html'    => $html,
];
if ($replyTo) { $payload['reply_to'] = $replyTo; }

/* ---- Send via Resend ---- */
$body = json_encode($payload);
$ok = false; $errText = '';

if (function_exists('curl_init')) {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
    ]);
    $resp = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errText = curl_error($ch);
    curl_close($ch);
    $ok = ($status >= 200 && $status < 300);
} else {
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Authorization: Bearer $apiKey\r\nContent-Type: application/json\r\n",
        'content'       => $body,
        'timeout'       => 15,
        'ignore_errors' => true,
    ]]);
    $resp = @file_get_contents('https://api.resend.com/emails', false, $ctx);
    $ok = ($resp !== false && strpos(implode(' ', $http_response_header ?? []), ' 200') !== false)
       || ($resp !== false && strpos($resp, '"id"') !== false);
}

if ($ok) {
    respond(true, 'Thanks, your enquiry is on its way.');
}
respond(false, 'Sorry, we could not send that just now. Please call or text us on 0451 308 349.', 502);
