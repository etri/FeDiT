import { getContextData } from 'apis/NDXPRO/contextApi';
import { useEffect, useState } from 'react';

import AccordionContext from './AccordionContext';

interface IProps {
  pagePath: string;
}

// import 예시 : <Accordion pagePath="data-model" />

function Accordion({ pagePath }: IProps) {
  // const [contexts, setContexts] = useState({});
  const [contexts, setContexts] = useState<string[]>([]);

  useEffect(() => {
    getContextData().then((res: string[]) => {
      const contexts = Array.isArray(res) ? res : [];
      const findStr = contexts.filter((el) => el.includes('ngsi-ld'));
      if (findStr.length === 0) {
        setContexts(contexts);
        return;
      }
      const idx = contexts.indexOf(findStr[0]);
      const reordered = [...contexts];
      const temp = reordered.splice(idx, 1)[0];
      reordered.unshift(temp);
      setContexts(reordered);
    });
  }, []);

  const contextList = Object.entries(contexts).map((context) => (
    <AccordionContext
      key={context[0]}
      context={context}
      pagePath={pagePath}
      // params={params}
    />
  ));

  return <div className="accordion">{contextList}</div>;
}

export default Accordion;
