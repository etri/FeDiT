// 복원 완료와 운영 mongod의 인증 상태 확인
(async () => {
try {
    const lib = require((process.env.FLOWCAST_INIT_DIR || "/docker-entrypoint-initdb.d") + "/lib.cjs");
    lib.readReady();

    function liveInitializationServer() {
        // 남은 PID 파일이 아닌 실제 초기화 서버 식별
        const pidfile = lib.path.join(process.env.TMPDIR || "/tmp", "docker-entrypoint-temp-mongod.pid");
        let pid;
        try {
            pid = lib.fs.readFileSync(pidfile, "utf8").trim();
        } catch (error) {
            if (error.code === "ENOENT") return false;
            throw error;
        }
        if (!/^[1-9][0-9]*$/.test(pid) || !Number.isSafeInteger(Number(pid))) {
            throw new Error("Cannot validate the initialization PID format.");
        }
        let command;
        try {
            const status = lib.fs.readFileSync("/proc/" + pid + "/status", "utf8");
            const state = /^State:[\t ]+([A-Za-z])(?:[\t ]|$)/m.exec(status);
            if (!state || !"RSDTtXZPIW".includes(state[1])) {
                throw new Error("Cannot determine the initialization process state.");
            }
            if (state[1] === "Z" || state[1] === "X") return false;
            command = lib.fs.readFileSync("/proc/" + pid + "/cmdline").toString("utf8");
        } catch (error) {
            if (error.code === "ENOENT") return false;
            throw error;
        }
        if (!command || !command.endsWith("\0") || command.includes("\uFFFD")) {
            throw new Error("Cannot read the initialization process arguments.");
        }
        const argv = command.slice(0, -1).split("\0");
        if (!argv[0]) throw new Error("The initialization process executable is missing.");
        if (lib.path.basename(argv[0]) !== "mongod") return false;
        const paths = [];
        for (let index = 1; index < argv.length; index++) {
            if (argv[index] === "--pidfilepath") {
                const value = argv[++index];
                if (!value || value.startsWith("--")) {
                    throw new Error("Cannot determine the initialization PID path argument.");
                }
                paths.push(value);
            } else if (argv[index].startsWith("--pidfilepath=")) {
                const value = argv[index].slice("--pidfilepath=".length);
                if (!value) throw new Error("The initialization PID path argument is empty.");
                paths.push(value);
            }
        }
        if (paths.length > 1) throw new Error("The initialization PID path argument is duplicated.");
        return paths.length === 1 && lib.path.resolve(paths[0]) === lib.path.resolve(pidfile);
    }

    // 초기화 서버가 종료된 뒤 연결
    if (liveInitializationServer()) {
        throw new Error("The official initialization server is still running.");
    }
    const active = await lib.connect(Mongo);
    const options = await active.admin.runCommand({getCmdLineOpts: 1});
    if (options.ok !== 1 || !options.parsed || !options.parsed.security
            || options.parsed.security.authorization !== "enabled") {
        throw new Error("The temporary initialization mongod is not ready.");
    }
    console.log("Flowcast MongoDB 준비 완료");
} catch (error) {
    console.error("Flowcast MongoDB is not ready.");
    process.exit(1);
}
})();
