import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// The API resolves its db/ paths against the working directory, so running it
// from a temp directory keeps test data away from local db/ files.
const seedSource = path.resolve(__dirname, '../../db/seed');
const runDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'api-smoke-'));

fs.cpSync(seedSource, path.join(runDirectory, 'db/seed'), { recursive: true });
process.chdir(runDirectory);

function removeRunDirectoryAndExit(): void {
  fs.rmSync(runDirectory, { recursive: true, force: true });
  process.exit(0);
}

process.on('SIGTERM', removeRunDirectoryAndExit);
process.on('SIGINT', removeRunDirectoryAndExit);

// Imported only after chdir, because importing it loads the data and starts the server.
void import('../../src/index');
