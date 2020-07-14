export function updateTag(
  tagName: string,
  keyName: string,
  keyValue: string,
  attrName: string,
  attrValue: string,
) {
  const node = document.head.querySelector(
    `${tagName}[${keyName}="${keyValue}"]`,
  );
  if (node && node.getAttribute(attrName) === attrValue) return;

  // Remove and create a new tag in order to make it work with bookmarks in Safari
  if (node) {
    node.parentNode!.removeChild(node);
  }
  if (typeof attrValue === 'string') {
    const nextNode = document.createElement(tagName);
    nextNode.setAttribute(keyName, keyValue);
    nextNode.setAttribute(attrName, attrValue);
    document.head.appendChild(nextNode);
  }
}

export function updateMeta(name: string, content: string) {
  updateTag('meta', 'name', name, 'content', content);
}

export function updateCustomMeta(property: string, content: string) {
  updateTag('meta', 'property', property, 'content', content);
}

export function updateLink(rel: string, href: string) {
  updateTag('link', 'rel', rel, 'href', href);
}
