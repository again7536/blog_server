import { unified } from 'unified';
import remarkParse from 'remark-parse';
import fs from 'fs';
import path from 'path';

interface AstNode {
  children?: AstNode[];
  type: string;
  value?: string;
  url?: string;
}

const recursiveExtractText: (root: AstNode) => string = root => {
  if (!root.children) return root.value ?? '';

  return root.children
    .map((child, idx) => recursiveExtractText(child))
    .join('');
};

const recursiveFindBuilder = (type: string) => {
  let imageNode: AstNode[] = [];

  const recursiveFind = (root: AstNode) => {
    if (!root.children) return imageNode;

    for (const child of root.children) {
      if (child.type === type) imageNode.push(child);
      else recursiveFind(child);
    }
    return imageNode;
  };

  return recursiveFind;
};

const removeUnusedImage = (
  relativePath: string,
  imageNodes: AstNode[] | undefined
) => {
  const fileNames = fs.readdirSync(relativePath);
  const imagePaths = imageNodes
    ? imageNodes.map(node => path.resolve(relativePath, node.url as string))
    : [];

  fileNames.map((name, idx) => {
    const filePath = path.resolve('/', relativePath, name);
    if (!imagePaths.some(imagePath => imagePath === filePath)) {
      fs.rmSync(filePath);
    }
  });
};

const extractAndClear = (markdown: string) => {
  const ast = unified().use(remarkParse).parse(markdown);

  const titleNode = ast.children.find(child => child.type === 'heading');
  const title = recursiveExtractText(titleNode as AstNode);

  const summaryNode = ast.children.find(child => child.type === 'paragraph');
  const summary = recursiveExtractText(summaryNode as AstNode);

  const recursiveFind = recursiveFindBuilder('image');
  const imageNodes = recursiveFind(ast);
  const imgUrl = imageNodes[0]?.url ?? '';

  return { title, summary, imgUrl, imageNodes };
};

export { extractAndClear, removeUnusedImage };
