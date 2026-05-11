import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(__dirname, '../prompts');

export function renderPrompt(filename: string, variables: Record<string, string> = {}): string {
  const filePath = path.join(PROMPTS_DIR, filename);
  let content = fs.readFileSync(filePath, 'utf-8');

  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }

  return content;
}
