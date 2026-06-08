import * as vscode from 'vscode';
import { DaveProvider } from './dave';
import { VibeHoverProvider } from './hoverProvider';
import { VibeCheckPanel } from './panel';

export function activate(context: vscode.ExtensionContext) {

  const dave = new DaveProvider(context);

  // ── Hover provider ──────────────────────────────────────────────
  const hoverProvider = new VibeHoverProvider(dave);
  const hoverDisposable = vscode.languages.registerHoverProvider(
    { scheme: 'file' },
    hoverProvider
  );

  // ── Command: review selected code ───────────────────────────────
  const reviewSelectionCmd = vscode.commands.registerCommand(
    'vibecheck.reviewSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const code = editor.document.getText(selection);
      if (!code.trim()) {
        vscode.window.showInformationMessage('VibeCheck: Select some code first.');
        return;
      }

      const lang = editor.document.languageId;
      await VibeCheckPanel.show(context, dave, code, lang, 'Selection');
    }
  );

  // ── Command: review entire file ─────────────────────────────────
  const reviewFileCmd = vscode.commands.registerCommand(
    'vibecheck.reviewFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const code = editor.document.getText();
      const lang = editor.document.languageId;
      const fileName = editor.document.fileName.split('/').pop() || 'file';

      await VibeCheckPanel.show(context, dave, code, lang, fileName);
    }
  );

  // ── Command: set API key ─────────────────────────────────────────
  const setKeyCmd = vscode.commands.registerCommand(
    'vibecheck.setApiKey',
    async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Google Gemini API key',
        placeHolder: 'AIza...',
        password: true,
        ignoreFocusOut: true
      });
      if (key) {
        await vscode.workspace.getConfiguration('vibecheck').update(
          'geminiApiKey', key, vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage('VibeCheck: API key saved. Dave is ready.');
      }
    }
  );

  context.subscriptions.push(hoverDisposable, reviewSelectionCmd, reviewFileCmd, setKeyCmd);

  // First-run prompt
  const config = vscode.workspace.getConfiguration('vibecheck');
  if (!config.get<string>('geminiApiKey')) {
    vscode.window.showInformationMessage(
      'VibeCheck Technologies installed. Add your Gemini API key to get started.',
      'Set API Key'
    ).then(choice => {
      if (choice === 'Set API Key') {
        vscode.commands.executeCommand('vibecheck.setApiKey');
      }
    });
  }
}

export function deactivate() {}
