function stringToHslColor(str: string, s: number, l: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

export const getAuthorColor = (author: string) => {
  if (author === 'User') {
    return 'primary.main';
  }
  return stringToHslColor(author, 50, 50);
};
