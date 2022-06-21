// Copyright 2017 - 2017, dominictarr and the markdown-summary contributors
// SPDX-License-Identifier: MIT

// Modified : 2022.06.20 again7536

const IMAGE_RX = /(\!\[[^\]]+\]\([^\)]+\))/g;

const extractTitle = (source: string, lineLength: number) => {
  source = source.trim().replace(IMAGE_RX, '');
  const line = source.trim().split('\n').shift()?.trim();

  if (!line) return '';

  const i = line.indexOf(' ', lineLength || 80);
  const title = line.substring(0, ~i ? i : line.length);
  if (title.length < line.length) return title + '...';
  else return title;
};

const extractSummary = (source: string, lineLength: number) => {
  source = source.trim().replace(IMAGE_RX, '');
  const title = extractTitle(source, lineLength);

  const lines = source
    .trim()
    .split('\n')
    .map(function (e) {
      return e.trim();
    })
    .filter(Boolean);

  //check if the elipsis was added... to the first paragraph.
  if (/\.\.\.$/.test(title) && source.indexOf(title) != 0) {
    const firstLine = lines[0].trim();
    return '...' + firstLine.substring(title.length - 3).trim();
  } else if (lines[1]) return lines[1];
  else return '';
};

export { extractTitle, extractSummary };
