// 명세 검증 후 복원 도구의 임시 인증 설정 기록
try {
    const lib = require((process.env.FLOWCAST_INIT_DIR || "/docker-entrypoint-initdb.d") + "/lib.cjs");
    lib.readManifest();
    const login = lib.credentials();
    const target = process.env.FLOWCAST_RESTORE_CONFIG;
    if (!target) {
        throw new Error("The temporary restore configuration path is missing.");
    }
    lib.fs.writeFileSync(target, JSON.stringify({
        uri: "mongodb://" + encodeURIComponent(login.username)
            + "@127.0.0.1:27017/?authSource=admin&directConnection=true&serverSelectionTimeoutMS=5000",
        password: login.password,
    }), {mode: 0o600});
    lib.fs.chmodSync(target, 0o600);
} catch (error) {
    console.error("Failed to prepare the Flowcast seed manifest or restore configuration.");
    process.exit(1);
}
