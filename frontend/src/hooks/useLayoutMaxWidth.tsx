const useLayoutMaxWidth = () => {
  // @ts-expect-error custom property
  return window.theme?.layout === 'wide'
    ? 'min(80rem, 100vw)'
    : 'min(48rem, 100vw)';
};

export { useLayoutMaxWidth };
