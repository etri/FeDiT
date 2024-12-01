package kr.co.e8ight.ndxpro.agentManager.service.operater;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonField;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Map;

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
    public abstract Agent operate(Agent agent, Map<String, JsonField> bodyInfo);

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

    protected long runAgent(Agent agent, Map<String, JsonField> bodyInfo) {
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

        StringBuilder commandBuilder = new StringBuilder(runAgentCommand);

        if ( bodyInfo != null ) {
            String bodyKeys = Arrays.toString(bodyInfo.keySet().toArray()).replace(" ", "");
            commandBuilder.append(" -DbodyKeys=").append(bodyKeys);
            for (String key : bodyInfo.keySet()) {
                commandBuilder.append(" -D").append(key).append(".type=").append(bodyInfo.get(key).getType());
                commandBuilder.append(" -D").append(key).append(".incremental=").append(bodyInfo.get(key).getIncremental());
                commandBuilder.append(" -D").append(key).append(".value=").append(bodyInfo.get(key).getValue());
            }
        }

        log.debug("cmd::::::::::::::::::::::::::"+ commandBuilder);
        Process run = exec(commandBuilder.toString().split(" ", -1));
        clear(run);
        return run.pid();
    }

    private void clear(Process process) {
        try {
            InputStream inputStream = process.getInputStream();
            InputStream errorStream = process.getErrorStream();
            inputStream.close();
            errorStream.close();
        } catch (IOException ioe) {
            log.error(ExceptionUtils.getStackTrace(ioe));
        }
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
