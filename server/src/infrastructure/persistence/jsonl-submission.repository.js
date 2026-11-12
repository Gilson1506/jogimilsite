import fs from 'node:fs';
import { ISubmissionRepository } from '../../application/ports/submission-repository.port.js';
import { ENV } from '../config/env.config.js';

export class JsonlSubmissionRepository extends ISubmissionRepository {
  constructor(filePath = ENV.SUBMISSIONS_FILE) {
    super();
    this.filePath = filePath;
    this._ensureFile();
  }

  _ensureFile() {
    if (!fs.existsSync(ENV.DATA_DIR)) {
      fs.mkdirSync(ENV.DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '', 'utf-8');
    }
  }

  async save(submissionEntity) {
    this._ensureFile();
    const line = JSON.stringify(submissionEntity.toJSON()) + '\n';
    await fs.promises.appendFile(this.filePath, line, 'utf-8');
    return submissionEntity;
  }

  async findById(id) {
    this._ensureFile();
    const content = await fs.promises.readFile(this.filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    for (const l of lines) {
      try {
        const item = JSON.parse(l);
        if (item.id === id) return item;
      } catch {
        // ignore parse error
      }
    }
    return null;
  }

  async findRecent(limit = 20) {
    this._ensureFile();
    const content = await fs.promises.readFile(this.filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const items = [];
    for (let i = lines.length - 1; i >= 0 && items.length < limit; i--) {
      try {
        items.push(JSON.parse(lines[i]));
      } catch {
        // ignore parse error
      }
    }
    return items;
  }

  async updateStatus(id, status, metadata = {}) {
    this._ensureFile();
    const content = await fs.promises.readFile(this.filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let updated = false;
    const newLines = lines.map((l) => {
      try {
        const item = JSON.parse(l);
        if (item.id === id) {
          updated = true;
          return JSON.stringify({
            ...item,
            status,
            metadata: { ...item.metadata, ...metadata },
            updatedAt: new Date().toISOString(),
          });
        }
        return l;
      } catch {
        return l;
      }
    });

    if (updated) {
      await fs.promises.writeFile(this.filePath, newLines.join('\n') + '\n', 'utf-8');
    }
    return updated;
  }
}
