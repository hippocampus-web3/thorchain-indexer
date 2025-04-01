import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { Template, TemplateSchema } from '../types';

export class TemplateLoader {
  private templatesDir: string;

  constructor(templatesDir: string = join(process.cwd(), 'src', 'templates')) {
    this.templatesDir = templatesDir;
  }

  loadTemplates(): Template[] {
    const files = readdirSync(this.templatesDir)
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

    return files.map(file => {
      const content = readFileSync(join(this.templatesDir, file), 'utf-8');
      const parsed = parse(content);
      
      try {
        return TemplateSchema.parse(parsed);
      } catch (error) {
        throw new Error(`Error validating template ${file}: ${error}`);
      }
    });
  }
} 