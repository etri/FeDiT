package kr.co.e8ight.ndxpro.dataAdapter.sink;

import org.apache.flume.Context;
import org.apache.flume.EventDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SignalableKafkaSink extends CustomKafkaSink {

    private static final Logger log = LoggerFactory.getLogger(SignalableKafkaSink.class);

    @Override
    public Status process() throws EventDeliveryException {
        return super.process();
    }

    @Override
    public void configure(Context context) {
        agentId = context.getLong("AGENT_ID");
        super.configure(context);
    }
}
