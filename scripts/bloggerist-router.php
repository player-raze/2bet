<?php
declare(strict_types=1);

// Local PHP development router. The built-in server does not read .htaccess.
$root = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
$requestPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$path = is_string($requestPath) ? rawurldecode($requestPath) : '';

function bloggerist_not_found(): never
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Not found.';
    exit;
}

if (!$root || $path === '' || preg_match('~[\x00-\x1f\x7f\\\\]~', $path)
    || preg_match('~(?:^|/)\.~', $path)
    || preg_match('~(?:^|/)(?:includes|scripts|storage|chats|data|update-packages)(?:/|$)~i', $path)) {
    bloggerist_not_found();
}

if ($path === '/__bloggerist_health') {
    header('Content-Type: application/json');
    echo '{"service":"2bet-bloggerist"}';
    exit;
}

if ($path === '/' || $path === '/admin' || $path === '/admin/') {
    header('Location: /admin/blogs.php', true, 302);
    exit;
}

if (preg_match('~^/(login(?:-handler)?|logout)\.php$~', $path)) $path = '/admin' . $path;

// Bloggerist stores uploaded files in admin/uploads but publishes /uploads URLs.
if (str_starts_with($path, '/uploads/') && !is_file($root . $path)) $path = '/admin' . $path;
$file = realpath($root . $path);
if (!$file || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) bloggerist_not_found();

$extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
if ($extension === 'php') {
    // Uploaded content must never be executable; only actual admin/API entrypoints run.
    if (!preg_match('~^/(?:admin/[^/]+|api/[^/]+)\.php$~', $path)) bloggerist_not_found();
    $_SERVER['SCRIPT_FILENAME'] = $file;
    $_SERVER['SCRIPT_NAME'] = $path;
    require $file;
    exit;
}

$types = [
    'css' => 'text/css; charset=UTF-8', 'js' => 'application/javascript; charset=UTF-8',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'gif' => 'image/gif', 'webp' => 'image/webp', 'avif' => 'image/avif',
    'svg' => 'image/svg+xml', 'ico' => 'image/x-icon',
    'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf',
];
if (!isset($types[$extension])) bloggerist_not_found();
header('Content-Type: ' . $types[$extension]);
header('X-Content-Type-Options: nosniff');
readfile($file);
