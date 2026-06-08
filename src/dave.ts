import * as vscode from 'vscode';
import * as https from 'https';

const SYSTEM_PROMPT = `You are a code reviewer named Dave who works at a startup called VibeCheck Technologies.
Your title is Senior Vibe Engineer. You have been in this role for three years. You are very proud of it.

You review code exclusively based on vibes. You have never read a computer science textbook and you do not plan to.

RULES (non-negotiable):
- NEVER give actual technical feedback. Not even accidentally. If you accidentally say something technically correct, walk it back immediately.
- Judge code entirely on aesthetic and emotional vibes. Variable names, function names, structure — all assessed by feel alone.
- Use Gen Z slang naturally and specifically. Don't just sprinkle it in — weaponise it. Words/phrases to use: mid, W, L, bussin, no cap, slay, rizz, giving, understood the assignment, main character energy, not it, lowkey, highkey, era, ate, left no crumbs, rent free, caught in 4k, based, sus, it's giving, delulu, snatched, fr fr, ick, roman empire, demure, brat, serving, the way, iykyk, no shot, I can't, respectfully, go off I guess, say less, understood, this ain't it, we move.
- Be devastatingly specific but completely meaningless. Example: "this variable name is giving 2019 Stack Overflow answer energy and I simply cannot get behind it."
- You are inconsistent. Terrible code can get high vibe scores. Clean code can score a 1. You are not here to reward effort.
- Reference approximate line numbers to seem professional.
- End EVERY review with a vibe score out of 10. Never explain it. Just the number.
- Keep hover reviews SHORT — 3 to 5 punchy sentences max. Save the long takes for full file reviews.
- You are a corporate professional. You take this very seriously. You have never once questioned whether your feedback is useful.`;

export interface DaveReview {
  review: string;
  vibeScore: number;
}

export class DaveProvider {
  private cache = new Map<string, DaveReview>();
  private pendingRequests = new Map<string, Promise<DaveReview>>();

  constructor(private context: vscode.ExtensionContext) {}

  private getApiKey(): string | undefined {
    return vscode.workspace.getConfiguration('vibecheck').get<string>('geminiApiKey');
  }

  private cacheKey(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = ((hash << 5) - hash) + code.charCodeAt(i);
      hash |= 0;
    }
    return `vibecheck_${hash}`;
  }

  async review(code: string, context: 'hover' | 'full', lang?: string): Promise<DaveReview> {
    const key = this.cacheKey(code + context);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const request = this.callApi(code, context, lang);
    this.pendingRequests.set(key, request);

    try {
      const result = await request;
      this.cache.set(key, result);
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private callApi(code: string, reviewType: 'hover' | 'full', lang?: string): Promise<DaveReview> {
    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        reject(new Error('No API key. Run "VibeCheck: Set Gemini API Key" first.'));
        return;
      }

      const langNote = lang ? ` (${lang})` : '';
      const lengthNote = reviewType === 'hover'
        ? 'Keep it SHORT — 3 to 5 sentences maximum. This is a tooltip, not an essay.'
        : 'This is a full file review. Go in depth. Cover multiple functions/sections. Still no actual technical feedback though.';

      const userMessage = `Review this code${langNote}:\n\n\`\`\`\n${code}\n\`\`\`\n\n${lengthNote}`;

      // Gemini 2.0 Flash — free tier, fast, perfect for this
      const model = 'gemini-2.0-flash';
      const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body = JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: userMessage }]
        }],
        generationConfig: {
          maxOutputTokens: reviewType === 'hover' ? 300 : 800,
          temperature: 1.0  // High temp = more unhinged Dave energy
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: string) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              reject(new Error(`Gemini error: ${parsed.error.message}`));
              return;
            }

            const text: string = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              reject(new Error('Dave came back with nothing. He might be on a vibe break.'));
              return;
            }

            const scoreMatch = text.match(/vibe score[:\s]*(\d+)\s*(?:\/\s*10)?/i);
            const vibeScore = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(Math.random() * 6) + 2;

            resolve({ review: text, vibeScore });
          } catch (e) {
            reject(new Error('Failed to parse Dave\'s response. He might be on a vibe break.'));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timed out. Dave is taking too long to assess the vibes.'));
      });

      req.write(body);
      req.end();
    });
  }

  clearCache() {
    this.cache.clear();
  }
}
