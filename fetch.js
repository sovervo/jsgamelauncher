import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

globalThis.oldFetch = fetch;

export default function createFetch(gameDir) {
  let resourcePath = gameDir;
  // Check if gameDir has a public/ folder in it
  const publicDir = path.join(gameDir, 'public');
  if (fs.existsSync(publicDir)) {
    resourcePath = publicDir;
  }

  // console.log('resourcePath', resourcePath);

  async function localFetch(url, options = {}) {
    // console.log('localFetch', url, options);
    const { method } = options;
    const lcUrl = String(url).toLowerCase();

    // For non-local files or non-GET methods, fall back to global fetch
    if (lcUrl.startsWith('http') || lcUrl.startsWith('//') || (method && (method !== 'GET'))) {
      return globalThis.oldFetch(url, options);
    }

    // Construct the file path
    const filePath = path.join(resourcePath, url);

    try {
      // Read the file content
      const fileBuffer = await fsPromises.readFile(filePath);

      // Guess the MIME type based on file extension
      const mime = (await import('mime-types')).default;
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';

      // Create a Response-like object
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': mimeType,
        },
        text: () => Promise.resolve(fileBuffer.toString('utf-8')),
        json: () => Promise.resolve(JSON.parse(fileBuffer.toString('utf-8'))),
        arrayBuffer: () => Promise.resolve(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)),
        blob: () => Promise.resolve(fileBuffer),
      };
    } catch (err) {
      // Handle file not found or other errors
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {},
        text: () => Promise.resolve(''),
        json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(null),
      };
    }
  }

  return localFetch;
}
