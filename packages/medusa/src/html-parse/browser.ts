import {AssetItem, COMMENT_REGEX, fetchContents, FetchFn, resetUrl} from './utils';

const cachedPromiseScripts: Array<Promise<string>> = [];
const cachedPromiseStyles: Array<Promise<string>> = [];

class BrowerParser {
  private document: Document
  private assetPublicPath?: string

  constructor(html: string, assetPublicPath?: string) {
    this.document = new DOMParser().parseFromString(html.replace(COMMENT_REGEX, ''), 'text/html');
    this.assetPublicPath = assetPublicPath;
    if (assetPublicPath) {
      const base = document.createElement('base');
      base.href = assetPublicPath;
      this.document.getElementsByTagName('head')[0]?.appendChild(base);
    }
  }

  private replaceWithComment(node: HTMLElement) {
    if (node?.parentNode) {
      const commentNode = document.createComment(`${node.tagName} replaced by medusa`);
      node.parentNode.appendChild(commentNode);
      node.parentNode.removeChild(node);
    }
  }

  private removeElements(list: HTMLElement[]) {
    list.map(this.replaceWithComment);
  }

  extract(fetchFn?: FetchFn, onUrlFix?: (url: string) => string | undefined) {
    const scriptEles = Array.from(this.document.getElementsByTagName('script'));
    const inlineStyleEles = Array.from(this.document.getElementsByTagName('style'));
    const externalStyleEles = Array.from(this.document.getElementsByTagName('link')).filter((t) => {
      return !t.rel || t.rel.includes('stylesheet');
    });

    const scriptJson: Record<string, any> = {};

    /**
     * 乾坤可能会用到
     */
    let entry: string | undefined;
    const scripts = scriptEles.map((t) => {
      let src = t.src;
      if (src) {
        if (onUrlFix) {
          const fixUrl = onUrlFix(src);
          if (!fixUrl) {
            return null;
          }
          src = fixUrl;
        }
        src = resetUrl(src, this.assetPublicPath);
        if (t.getAttribute('entry')) {
          entry = src;
        }
        return {
          src,
          async: true,
          id: t.id,
          fetching: fetchContents(src, cachedPromiseScripts, fetchFn)
        };
      }
      const code = t.textContent || '';
      const id = t.id;
      if (t.type === 'application/json') {
        if (id) {
          scriptJson[id] = code;
        }
        return null;
      }
      return {
        content: code,
        async: false,
        hasRisk: code.indexOf('document.') !== -1
      };
    }).filter(Boolean);

    const inlineStyles = inlineStyleEles.map((t) => {
      const code = t.textContent;
      return {
        content: code,
        async: false,
        attrs: Array.from(t.attributes).map((t) => ({key: t.name, value: t.value}))
      };
    });

    const externalStyles = externalStyleEles.map((t) => {
      let src = t.href;
      if (src) {
        if (onUrlFix) {
          const fixUrl = onUrlFix(src);
          if (!fixUrl) {
            return null;
          }
          src = fixUrl;
        }
        src = resetUrl(src, this.assetPublicPath);
        return {
          src,
          async: true,
          id: t.id,
          fetching: fetchContents(src, cachedPromiseStyles, fetchFn)
        };
      }
      return {
        content: '',
        async: false,
      };
    }).filter(Boolean);

    this.removeElements(scriptEles);
    this.removeElements(inlineStyleEles);
    this.removeElements(externalStyleEles);

    return {
      template: this.document.getElementsByTagName('html')[0].innerHTML,
      scripts: scripts as AssetItem[],
      styles: [...externalStyles, ...inlineStyles] as AssetItem[],
      scriptJson,
      entry: entry || scripts.map((t) => t?.src).filter(Boolean).pop(),
      assetPublicPath: this.assetPublicPath
    };
  }
};

export default BrowerParser;
