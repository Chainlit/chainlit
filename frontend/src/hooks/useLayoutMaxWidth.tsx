const useLayoutMaxWidth = () => {
  // @ts-expect-error custom property
  return window.theme?.layout === 'wide' ? '60rem' : '48rem';
};

export { useLayoutMaxWidth };
