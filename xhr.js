import fs from 'fs';
import path from 'path';
import XHRShim from 'xhr-shim'; // Install xhr-shim: npm install xhr-shim
import mime from 'mime-types';

export default function createXMLHttpRequest(gameDir) {
  const resourcePath = fs.existsSync(path.join(gameDir, 'public')) 
    ? path.join(gameDir, 'public') 
    : gameDir;

  return class LocalXMLHttpRequest extends XHRShim {
    constructor() {
      super();
      this.isLocalFile = false;
      this.localFilePath = '';
    }

    open(method, url, async = true, user = null, password = null) {
      const lcUrl = String(url).toLowerCase();

      // Determine if it's a local file
      if (!lcUrl.startsWith('http') && !lcUrl.startsWith('//')) {
        this.isLocalFile = true;
        this.localFilePath = path.join(resourcePath, url);
      } else {
        this.isLocalFile = false;
      }

      super.open(method, url, async, user, password); // Call the parent class's open method
    }

    send(data = null) {
      if (this.isLocalFile) {
        // Handle local file requests
        fs.readFile(this.localFilePath, (err, fileContent) => {
          if (err) {
            this.status = 404;
            this.statusText = 'Not Found';
            this.readyState = 4;
            this.onreadystatechange && this.onreadystatechange();
            return;
          }

          // Set up response headers and content
          this.status = 200;
          this.statusText = 'OK';
          this.responseText = fileContent.toString('utf-8');
          this.responseType = 'text';
          this.response = this.responseText;
          this.readyState = 4;
          this.getAllResponseHeaders = () =>
            `Content-Type: ${mime.lookup(this.localFilePath) || 'application/octet-stream'}`;

          // Trigger the onreadystatechange callback
          this.onreadystatechange && this.onreadystatechange();
        });
      } else {
        // Fall back to the parent class's send method for web requests
        super.send(data);
      }
    }
  };
}
