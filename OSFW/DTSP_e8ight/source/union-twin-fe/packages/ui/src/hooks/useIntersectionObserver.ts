import { useEffect, useState } from 'react';

export const useIntersectionObserver = <T extends HTMLElement>(
  rootMargin = '0px',
  root?: Element | null,
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const [observerElement, setObserverElement] = useState<T | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        setIsIntersecting(entry.isIntersecting);
      },
      {
        root,
        rootMargin,
      },
    );

    if (observerElement) {
      observer.observe(observerElement);
    }

    return () => observer.disconnect();
  }, [observerElement, rootMargin, root]);

  return { isIntersecting, registerObserver: setObserverElement };
};
