import { PREDICTORTOOL_URL } from 'apis/NDXPRO/config';
import Layout from 'components/layout/layout';
import { useState } from 'react';
import './predictor-creator-tool.scss';

export default function PredictorCreatorTool() {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  return (
    <Layout>
      {isIframeLoading && (
        <div className="loading-mask">
          <div className="loading-mask__spinner" />
        </div>
      )}
      <iframe
        title="predictor-creator-tool"
        src={PREDICTORTOOL_URL}
        className="predictor-creator-tool"
        onLoad={() => setIsIframeLoading(false)}
      />
    </Layout>
  );
}
