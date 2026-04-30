import * as fs from "fs";
import * as path from "path";

export interface SyncAdapter<T> {
  read(): T | null;
  write(data: T): void;
}

export interface SyncDatabase<T> {
  adapter: SyncAdapter<T>;
  data: T;
  read(): void;
  write(): void;
}

export class JsonFileSyncAdapter<T> implements SyncAdapter<T> {
  private readonly tempPath: string;

  constructor(private readonly filePath: string) {
    const f = filePath.toString();
    this.tempPath = path.join(path.dirname(f), `.${path.basename(f)}.tmp`);
  }

  read(): T | null {
    let raw: string;
    try {
      raw = fs.readFileSync(this.filePath, "utf-8");
    } catch (e: any) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return JSON.parse(raw) as T;
  }

  write(data: T): void {
    fs.writeFileSync(this.tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(this.tempPath, this.filePath);
  }
}

export class SyncDb<T> implements SyncDatabase<T> {
  data: T;

  constructor(
    readonly adapter: SyncAdapter<T>,
    defaultData: T,
  ) {
    if (adapter === undefined) {
      throw new Error("SyncDb: missing adapter");
    }
    this.data = defaultData;
  }

  read(): void {
    const result = this.adapter.read();
    if (result) {
      this.data = result;
    }
  }

  write(): void {
    if (this.data) {
      this.adapter.write(this.data);
    }
  }
}
