import * as vscode from 'vscode';
import { DaveProvider } from './dave';

export class VibeCheckPanel {
  static async show(
    context: vscode.ExtensionContext,
    dave: DaveProvider,
    code: string,
    lang: string,
    label: string
  ) {
    const panel = vscode.window.createWebviewPanel(
      'vibecheckReview',
      `VibeCheck: ${label}`,
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    // Show loading state immediately
    panel.webview.html = getLoadingHtml(label);

    try {
      const review = await dave.review(code, 'full', lang);
      panel.webview.html = getReviewHtml(label, review.review, review.vibeScore);
    } catch (err: any) {
      panel.webview.html = getErrorHtml(err.message);
    }
  }
}

function getLoadingHtml(label: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeCheck</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d0d0d;
      color: #e0e0e0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 24px;
    }
    .logo {
      font-size: 13px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #555;
      font-weight: 600;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 2px solid #222;
      border-top-color: #7fff7f;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }
    .file { color: #aaa; font-size: 12px; margin-top: -12px; }
  </style>
</head>
<body>
  <div class="logo">VibeCheck Technologies</div>
  <div class="spinner"></div>
  <div class="status">Dave is assessing the vibes...</div>
  <div class="file">${escapeHtml(label)}</div>
</body>
</html>`;
}

function getReviewHtml(label: string, review: string, vibeScore: number): string {
  const scoreColor = vibeScore >= 7 ? '#7fff7f' : vibeScore >= 4 ? '#ffcc44' : '#ff5555';
  const reviewHtml = review
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeCheck</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d0d0d;
      color: #e0e0e0;
      padding: 32px;
      line-height: 1.7;
      max-width: 680px;
    }
    header {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #1e1e1e;
    }
    .brand {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #444;
      font-weight: 600;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      color: #f0f0f0;
      margin-bottom: 4px;
    }
    .meta {
      font-size: 12px;
      color: #555;
    }
    .score-block {
      display: inline-flex;
      align-items: baseline;
      gap: 6px;
      margin: 24px 0;
      padding: 16px 24px;
      border: 1px solid #1e1e1e;
      background: #111;
    }
    .score-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #555;
    }
    .score-value {
      font-size: 42px;
      font-weight: 700;
      color: ${scoreColor};
      line-height: 1;
    }
    .score-denom {
      font-size: 18px;
      color: #333;
    }
    .review {
      font-size: 14px;
      color: #ccc;
    }
    .review p { margin-bottom: 16px; }
    .review p:last-child { margin-bottom: 0; }
    .review code {
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      background: #1a1a1a;
      padding: 2px 6px;
      border-radius: 3px;
      color: #e0e0e0;
    }
    .review strong { color: #f0f0f0; }
    footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #1a1a1a;
      font-size: 11px;
      color: #333;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">VibeCheck Technologies — Senior Vibe Engineer Report</div>
    <h1>${escapeHtml(label)}</h1>
    <div class="meta">Reviewed by Dave · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </header>

  <div class="score-block">
    <div class="score-label">Vibe Score</div>
    <div class="score-value">${vibeScore}</div>
    <div class="score-denom">/ 10</div>
  </div>

  <div class="review">${reviewHtml}</div>

  <footer>VibeCheck Technologies v1.0.0 — Enterprise Code Intelligence Platform — No technical feedback was given or implied</footer>
</body>
</html>`;
}

function getErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d0d0d; color: #e0e0e0;
      padding: 32px; line-height: 1.6;
    }
    .brand { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #444; margin-bottom: 16px; }
    h2 { color: #ff5555; margin-bottom: 12px; }
    p { color: #888; font-size: 14px; }
    code { background: #1a1a1a; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="brand">VibeCheck Technologies</div>
  <h2>Dave is unavailable</h2>
  <p>${escapeHtml(message)}</p>
  <p style="margin-top:16px">Run <code>VibeCheck: Set Gemini API Key</code> from the command palette if you haven't already.</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
