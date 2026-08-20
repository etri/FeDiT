import { useEffect, useRef } from 'react';

export const useOutSideRef = <T extends HTMLElement>(
  closePopup: () => void,
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (ref.current && !ref.current.contains(targetNode)) {
        closePopup();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closePopup]);

  return ref;
};

export default useOutSideRef;
