const useLayoutMaxWidth = () => {
  // @ts-expect-error custom property
  return window.theme?.layout === 'wide' ? '80rem' : '48rem';
};

export { useLayoutMaxWidth };
