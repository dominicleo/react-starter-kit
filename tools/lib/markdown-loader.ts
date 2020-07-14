import webpack from 'webpack';
import path from 'path';
import fm from 'front-matter';
import MarkdownIt from 'markdown-it';

module.exports = function markdownLoader(
  this: webpack.loader.LoaderContext,
  source: string,
) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
  });

  const frontmatter = fm<{ key: string; html: string }>(source);
  frontmatter.attributes.key = path.basename(this.resourcePath, '.md');
  frontmatter.attributes.html = md.render(frontmatter.body);

  return `module.exports = ${JSON.stringify(frontmatter.attributes)};`;
};
