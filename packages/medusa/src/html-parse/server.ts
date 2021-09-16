import {ElementType, parseDocument, DomUtils} from 'htmlparser2';
import {Document, Node, Element, isTag, hasChildren, isText} from 'domhandler';
import render from 'dom-serializer';
import {AssetItem, COMMENT_REGEX, fetchContents, FetchFn, resetUrl} from './utils';

const cachedPromiseScripts: Array<Promise<string>> = [];
const cachedPromiseStyles: Array<Promise<string>> = [];

class ServerParser {
  private document: Document
  private assetPublicPath?: string

  constructor(html: string, assetPublicPath?: string) {
    this.document = parseDocument(html.replace(COMMENT_REGEX, ''));
    this.assetPublicPath = assetPublicPath;
  }

  private text(elements?: ArrayLike<Node>) {
    const elems = elements ? elements : [];
    let ret = '';
    for (let i = 0; i < elems.length; i++) {
      const elem = elems[i];
      if (isText(elem)) ret += elem.data;
      else if (
        hasChildren(elem) &&
        elem.type !== ElementType.Comment &&
        elem.type !== ElementType.Script &&
        elem.type !== ElementType.Style
      ) {
        ret += this.text(elem.children);
      }
    }
    return ret;
  }

  private getElementsByTagName(tag: string): Element[] {
    const list: Element[] = [];
    const stack: Node[] = [];
    stack.push(this.document);
    while (stack.length) {
      const current = stack.shift()!;
      if (isTag(current) && current.tagName.toLowerCase() === tag) {
        list.push(current);
      } else if (hasChildren(current)) {
        stack.push(...current.children || []);
      }
    }
    return list;
  }

  private remove(node: Element) {
    DomUtils.removeElement(node);
    node.prev = node.next = node.parent = null;
  }

  private replaceWithComment(node: Element) {
    const child = parseDocument(`<!--${node.tagName} replaced by medusa-->`).children?.[0];
    if (child) {
      DomUtils.replaceElement(node, child);
    }
  }

  private removeElements(elements: Element[]) {
    elements.forEach(this.replaceWithComment);
  }

  extract(fetchFn?: FetchFn) {
    const scriptEles = this.getElementsByTagName('script');
    const inlineStyleEles = this.getElementsByTagName('style');
    const externalStyleEles = this.getElementsByTagName('link').filter((t) => {
      return !t.attribs.rel || t.attribs.rel.includes('stylesheet');
    });

    const scriptJson: Record<string, any> = {};

    /**
     * 乾坤可能会用到
     */
    let entry: string | undefined;
    const scripts = scriptEles.map((t) => {
      let src = t.attribs.src;
      if (src) {
        src = resetUrl(src, this.assetPublicPath);
        if (t.attribs.entry) {
          entry = src;
        }
        return {
          src,
          async: true,
          id: t.attribs.id,
          fetching: fetchContents(src, cachedPromiseScripts, fetchFn)
        };
      }
      const code = this.text(t.children);
      const id = t.attribs.id;
      if (t.attribs.type === 'application/json') {
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
      const code = this.text(t.children);
      return {
        content: code,
        async: false,
      };
    });

    const externalStyles = externalStyleEles.map((t) => {
      let src = t.attribs.href;
      if (src) {
        src = resetUrl(src, this.assetPublicPath);
        return {
          src,
          async: true,
          id: t.attribs.id,
          fetching: fetchContents(src, cachedPromiseStyles, fetchFn)
        };
      }
      return {
        content: '',
        async: false,
      };
    });

    this.removeElements(scriptEles);
    this.removeElements(inlineStyleEles);
    this.removeElements(externalStyleEles);

    return {
      template: render(this.document),
      scripts: scripts as AssetItem[],
      styles: [...externalStyles, ...inlineStyles] as AssetItem[],
      scriptJson,
      entry: entry || scripts.map((t) => t?.src).filter(Boolean).pop(),
      assetPublicPath: this.assetPublicPath
    };
  }
};

export default ServerParser;
