// actions.js
export function hidePlaceholder(node) {
  const originalPlaceholder = node.getAttribute('placeholder') || '';
  
  const focusHandler = () => { node.placeholder = ''; };
  const blurHandler = () => { node.placeholder = originalPlaceholder; };

  node.addEventListener('focus', focusHandler);
  node.addEventListener('blur', blurHandler);

  return {
    destroy() {
      node.removeEventListener('focus', focusHandler);
      node.removeEventListener('blur', blurHandler);
    }
  };
}