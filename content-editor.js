(function () {
  "use strict";

  var replacements = new Map();
  var observer;

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function replaceTextNode(node) {
    var original = node.nodeValue;
    var key = normalize(original);
    var replacement = replacements.get(key);

    if (!replacement || replacement === key) return;

    var leading = original.match(/^\s*/)[0];
    var trailing = original.match(/\s*$/)[0];
    node.nodeValue = leading + replacement + trailing;
  }

  function scan(root) {
    if (!root || root.nodeType === Node.COMMENT_NODE) return;

    if (root.nodeType === Node.TEXT_NODE) {
      replaceTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(root.tagName)) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) replaceTextNode(node);
  }

  fetch("/content/website.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Website-Inhalte konnten nicht geladen werden");
      return response.json();
    })
    .then(function (content) {
      (content.texts || []).forEach(function (entry) {
        var original = normalize(entry.original);
        var text = normalize(entry.text);
        if (original && text) replacements.set(original, text);
      });

      scan(document.body);
      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === "characterData") replaceTextNode(mutation.target);
          mutation.addedNodes.forEach(scan);
        });
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    })
    .catch(function (error) {
      console.warn("Halde Guide CMS:", error.message);
    });
})();
