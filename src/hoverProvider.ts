import * as vscode from 'vscode';
import { DaveProvider } from './dave';

function extractReviewableBlock(document: vscode.TextDocument, position: vscode.Position): string | null {
  const text = document.getText();
  const lines = text.split('\n');
  const lineIndex = position.line;

  let startLine = lineIndex;
  for (let i = lineIndex; i >= Math.max(0, lineIndex - 20); i--) {
    const line = lines[i].trim();
    if (
      line.match(/^(def |async def |function |const |let |var |class |public |private |protected |static |async )/) ||
      line.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:]\s*(function|\(|async)/) ||
      line.match(/^\s*(export\s+)?(default\s+)?(function|class|const|let|var)\s/)
    ) {
      startLine = i;
      break;
    }
  }

  const endLine = Math.min(lines.length - 1, startLine + 30);
  const block = lines.slice(startLine, endLine + 1).join('\n');

  if (block.trim().length < 10) return null;
  return block;
}

export class VibeHoverProvider implements vscode.HoverProvider {
  private lastHoverTime = 0;

  constructor(private dave: DaveProvider) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const config = vscode.workspace.getConfiguration('vibecheck');
    if (!config.get<boolean>('hoverEnabled')) return null;

    const delay = config.get<number>('hoverDelayMs') ?? 800;
    const now = Date.now();
    this.lastHoverTime = now;
    await sleep(delay);
    if (this.lastHoverTime !== now || token.isCancellationRequested) return null;

    const code = extractReviewableBlock(document, position);
    if (!code) return null;

    try {
      const review = await this.dave.review(code, 'hover', document.languageId);

      if (token.isCancellationRequested) return null;

      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.supportHtml = true;
      md.appendMarkdown(`**🧠 VibeCheck Technologies** — *Dave, Senior Vibe Engineer*\n\n`);
      md.appendMarkdown(`---\n\n`);
      md.appendMarkdown(review.review);
      md.appendMarkdown(`\n\n---\n`);
      md.appendMarkdown(`*[VibeCheck v1.0.0 — Enterprise Code Intelligence Platform]*`);

      return new vscode.Hover(md);

    } catch (err: any) {
      if (token.isCancellationRequested) return null;

      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**🧠 VibeCheck Technologies**\n\nDave is temporarily unavailable. ${err.message}`);
      return new vscode.Hover(md);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
