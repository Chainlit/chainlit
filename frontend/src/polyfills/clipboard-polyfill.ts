// clipboard-polyfill.ts
interface ClipboardItemData {
  [mimeType: string]: Blob;
}

interface ClipboardItemOptions {
  presentationStyle?: 'unspecified' | 'inline' | 'attachment';
}
  
class ClipboardItemPolyfill {
  private _items: ClipboardItemData;
  private _options: ClipboardItemOptions;
  private _types: string[];

  constructor(items: ClipboardItemData, options: ClipboardItemOptions = {}) {
    if (typeof items !== 'object' || items === null) {
      throw new TypeError('Failed to construct "ClipboardItem": parameter 1 is not an object');
    }

    this._items = {};
    this._types = [];

    for (const [mimeType, blob] of Object.entries(items)) {
      if (!(blob instanceof Blob)) {
        throw new TypeError(`Failed to construct "ClipboardItem": Failed to read the '${mimeType}' property from ClipboardItemData: The provided value is not of type 'Blob'`);
      }
      this._items[mimeType] = blob;
      this._types.push(mimeType);
    }

    this._options = options;
  }

  get types(): ReadonlyArray<string> {
    return Object.freeze([...this._types]);
  }

  async getType(type: string): Promise<Blob> {
    if (!this._items[type]) {
      throw new DOMException(`The type '${type}' is not supported`, 'NotFoundError');
    }
    return this._items[type];
  }

  async presentationStyle(): Promise<string> {
    return this._options.presentationStyle || 'unspecified';
  }

  static supports(type: string): boolean {
    const supportedTypes = [
      'text/plain',
      'text/html',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp'
    ];
    return supportedTypes.includes(type);
  }
}

// HTTP unsecure polyfill
(function applyPolyfill() {
  if (typeof window === 'undefined' || window.isSecureContext) return;

  // 1. ClipboardItem
  if (!window.ClipboardItem) {
    (window as any).ClipboardItem = ClipboardItemPolyfill;
  }

  // 2. navigator.clipboard
  if (!navigator.clipboard) {
    (navigator as any).clipboard = {};
  }

  // 3. other methods
  const clip = navigator.clipboard as any;

  if (!clip.write) {
    clip.write = async function (items: ClipboardItemPolyfill[]) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new TypeError('parameter 1 is not iterable');
      }

      // polyfill:try text/plain
      for (const item of items) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          return fallbackCopyText(text);
        }
      }
      throw new Error('No text/plain type found');
    };
  }

  if (!clip.writeText) {
    clip.writeText = fallbackCopyText;
  }

  // 4. command func polyfill
  async function fallbackCopyText(text: string) {
    return new Promise<void>((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();

      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) return resolve();
        reject(new Error('execCommand returned false'));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }
})();

// export sth
export { ClipboardItemPolyfill as ClipboardItem };
export type { ClipboardItemData, ClipboardItemOptions };
