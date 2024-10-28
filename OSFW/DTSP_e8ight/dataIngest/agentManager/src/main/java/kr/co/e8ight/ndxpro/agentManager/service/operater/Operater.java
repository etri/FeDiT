package kr.co.e8ight.ndxpro.agentManager.service.operater;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;

public abstract class Operater {
    protected static final Logger log = LoggerFactory.getLogger(Operater.class);

    @Value("${flume.home}")
    private String flumeHomePath;
    @Value("${flume.conf-dir}")
    private String flumeConfPath;
    @Value("${flume.log-dir}")
    private String flumeLogPath;
    @Value("${logging.logstash.url}")
    private String logstashUrl;

    @Transactional
    public abstract Agent operate(Agent agent);

    protected boolean isRunning(long pid) {
        try {
            String[] commands = {"ps --no-headers --pid ", String.valueOf(pid)};
            log.debug("command :{}", Arrays.toString(commands));

            ProcessBuilder builder = new ProcessBuilder(commands);
            Process checker = builder.start();
            checker.waitFor();

            BufferedReader bufferedReader =
                    new BufferedReader(new InputStreamReader(checker.getInputStream()));
            boolean isRunning = bufferedReader.readLine() != null;

            bufferedReader.close();

            return isRunning;

        } catch (Exception e) {
            log.error("Exception : "+ ExceptionUtils.getStackTrace(e));
            throw new RuntimeException(e);
        }
    }

    protected long runAgent(Agent agent) {
        String logstashHost = logstashUrl.split(":")[0];
        String logstashPort = logstashUrl.split(":")[1];

        String runAgentCommand =
                flumeHomePath + "/bin/flume-ng agent -n " + agent.getName() +
                        " --conf " + flumeConfPath +
                        " -f " + agent.getConfigFileFullPath() +
                        " -DagentId=" + agent.getId() +
                        " -DlogDir=" + flumeLogPath +
                        " -DlogstashHost=" + logstashHost +
                        " -DlogstashPort=" + logstashPort;
        log.debug("cmd::::::::::::::::::::::::::"+ runAgentCommand);
        Process run = exec(runAgentCommand.split(" ", -1));
        return run.pid();
    }

    protected void killAgent(Agent agent) {
        try {
            String pid = getAgentPidById(agent);
            killProcess(pid);
        } catch (Exception e) {
            log.error("Exception : "+ ExceptionUtils.getStackTrace(e));
        }
    }

    private String getAgentPidById(Agent agent) throws IOException {
        String configFileName = agent.getConfigFileName();
        String[] commands = {"/bin/sh", "-c", "ps -ef | grep '" + configFileName + "' | grep -v grep | awk '{print $2}'"};

        ProcessBuilder builder = new ProcessBuilder(commands);
        Process process = builder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        return reader.readLine();
    }

    private void killProcess(String pid) throws IOException {
        if ( pid == null || pid.equals("")) {
            return;
        }

        String[] commands = {"kill", pid};
        log.info("kill: {}", Arrays.toString(commands));

        ProcessBuilder builder = new ProcessBuilder(commands);
        builder.start();
    }

    protected Process exec(String[] command) {
        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            builder.redirectError(ProcessBuilder.Redirect.INHERIT);
            return builder.start();
        } catch (Exception e) {
            log.error("Exception : "+ExceptionUtils.getStackTrace(e));
            throw new RuntimeException(e);
        }
    }
}
