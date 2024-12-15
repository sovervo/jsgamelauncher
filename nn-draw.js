// nearest neighbor draw image implementation with fast path for integer scaling
const nnCache = new Map();

function getMapping(srcWidth, srcHeight, destWidth, destHeight) {
  const cacheKey = `${srcWidth}x${srcHeight}->${destWidth}x${destHeight}`;
  if (nnCache.has(cacheKey)) return nnCache.get(cacheKey);

  const map = new Array(destWidth * destHeight);

  if (destWidth % srcWidth === 0 && destHeight % srcHeight === 0) {
    const xScale = destWidth / srcWidth;
    const yScale = destHeight / srcHeight;

    for (let y = 0; y < destHeight; y++) {
      const srcY = Math.floor(y / yScale);
      for (let x = 0; x < destWidth; x++) {
        const srcX = Math.floor(x / xScale);
        map[y * destWidth + x] = (srcY * srcWidth + srcX) * 4;
      }
    }
  } else {
    const xRatio = srcWidth / destWidth;
    const yRatio = srcHeight / destHeight;

    for (let y = 0; y < destHeight; y++) {
      const srcY = Math.floor(y * yRatio);
      for (let x = 0; x < destWidth; x++) {
        const srcX = Math.floor(x * xRatio);
        map[y * destWidth + x] = (srcY * srcWidth + srcX) * 4;
      }
    }
  }

  nnCache.set(cacheKey, map);
  return map;
}

export default function nnDrawImage(
  destBuffer, destBufferWidth, destBufferHeight,
  srcBuffer, srcBufferWidth, srcBufferHeight,
  x, y, width, height
) {
  const map = getMapping(srcBufferWidth, srcBufferHeight, width, height);

  if (width % srcBufferWidth === 0 && height % srcBufferHeight === 0) {
    const xScale = width / srcBufferWidth;
    const yScale = height / srcBufferHeight;

    let destIndexBase = y * destBufferWidth + x;
    for (let srcY = 0; srcY < srcBufferHeight; srcY++) {
      for (let sy = 0; sy < yScale; sy++) {
        let destIndex = destIndexBase * 4;
        for (let srcX = 0; srcX < srcBufferWidth; srcX++) {
          const srcIndex = (srcY * srcBufferWidth + srcX) * 4;
          for (let sx = 0; sx < xScale; sx++) {
            destBuffer[destIndex] = srcBuffer[srcIndex];         // Red
            destBuffer[destIndex + 1] = srcBuffer[srcIndex + 1]; // Green
            destBuffer[destIndex + 2] = srcBuffer[srcIndex + 2]; // Blue
            destBuffer[destIndex + 3] = srcBuffer[srcIndex + 3]; // Alpha
            destIndex += 4;
          }
        }
        destIndexBase += destBufferWidth;
      }
    }
  } else {
    let destIndexBase = y * destBufferWidth + x;
    for (let destY = 0; destY < height; destY++) {
      let destIndex = destIndexBase * 4;
      for (let destX = 0; destX < width; destX++) {
        const srcIndex = map[destY * width + destX];

        destBuffer[destIndex] = srcBuffer[srcIndex];         // Red
        destBuffer[destIndex + 1] = srcBuffer[srcIndex + 1]; // Green
        destBuffer[destIndex + 2] = srcBuffer[srcIndex + 2]; // Blue
        destBuffer[destIndex + 3] = srcBuffer[srcIndex + 3]; // Alpha

        destIndex += 4;
      }
      destIndexBase += destBufferWidth;
    }
  }
}
