import { Node, mergeAttributes } from "@tiptap/core";

// Tiptap has no built-in video/embed node. This is a minimal leaf node so
// pasted YouTube/Vimeo embed URLs (or any iframe src) survive round-tripping
// through the editor's schema instead of being stripped as unknown HTML.
export const Iframe = Node.create({
  name: "iframe",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "iframe" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(HTMLAttributes, {
        frameborder: "0",
        allowfullscreen: "true",
        style: "width: 100%; aspect-ratio: 16 / 9;",
      }),
    ];
  },
});
