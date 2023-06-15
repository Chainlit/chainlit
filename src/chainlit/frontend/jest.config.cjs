module.exports = {
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    '/node_modules/(?!react-markdown|vfile|unified|bail|is-plain-obj|trough|remark.*|trim-lines|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|micromark.*|decode-named-character-reference|mdast.*|ccount|escape-string-regexp|unist-.*|markdown-table|react-syntax-highlighter)'
  ]
};
