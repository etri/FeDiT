// 초기 자료와 준비 마커 검증
const fs = require("fs");
const path = require("path");

const databaseName = "flowcast3d";
const markerSchema = "flowcast.init-ready/1";

function readManifest() {
    // 복원 명세 검증
    const directory = process.env.FLOWCAST_DB_INPUT_DIR || "/initial-data";
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, "flowcast3d.manifest.json"), "utf8"));
    const checksum = fs.readFileSync(path.join(directory, "flowcast3d.sha256"), "utf8");
    const matched = /^([a-fA-F0-9]{64}) [ *]flowcast3d\.archive\.gz\r?\n?$/.exec(checksum);
    if (!matched || manifest.database !== databaseName
            || !/^[a-fA-F0-9]{64}$/.test(manifest.archive_sha256 || "")
            || matched[1].toLowerCase() !== manifest.archive_sha256.toLowerCase()) {
        throw new Error("Invalid seed filename or manifest SHA256 format.");
    }
    if (!manifest.collections || Array.isArray(manifest.collections)
            || typeof manifest.collections !== "object" || !Object.keys(manifest.collections).length) {
        throw new Error("The seed collection list is missing.");
    }
    for (const [name, count] of Object.entries(manifest.collections)) {
        if (!name || !Number.isSafeInteger(count) || count < 0) {
            throw new Error("Invalid seed collection name or document count.");
        }
    }
    if (!manifest.indexes || Array.isArray(manifest.indexes) || typeof manifest.indexes !== "object"
            || JSON.stringify(Object.keys(manifest.indexes).sort())
                !== JSON.stringify(Object.keys(manifest.collections).sort())) {
        throw new Error("The seed index list must match all collections.");
    }
    for (const name of Object.keys(manifest.collections)) {
        if (!Array.isArray(manifest.indexes[name]) || !manifest.indexes[name].length) {
            throw new Error("Every seed collection requires an index specification.");
        }
    }
    return manifest;
}

function effectiveManifest(manifest) {
    // 원본 명세를 보존하고 메모리 작업 컬렉션만 복원 대상에서 제외
    const excluded = new Set(["jobs", "worker_jobs"]);
    const keep = entries => Object.fromEntries(Object.entries(entries).filter(([name]) => !excluded.has(name)));
    return {...manifest, collections: keep(manifest.collections), indexes: keep(manifest.indexes)};
}

function credentials() {
    const username = process.env.MONGO_INITDB_ROOT_USERNAME;
    const password = process.env.MONGO_INITDB_ROOT_PASSWORD;
    if (!username || !password) {
        throw new Error("MongoDB initialization credentials are required.");
    }
    return {username, password};
}

async function connect(Mongo) {
    // 지정된 로컬 서버 인증
    const port = process.env.FLOWCAST_DB_PORT || "27017";
    if (!/^[0-9]+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
        throw new Error("FLOWCAST_DB_PORT must be an integer between 1 and 65535.");
    }
    const login = credentials();
    const connection = await new Mongo("mongodb://127.0.0.1:" + port + "/?directConnection=true&serverSelectionTimeoutMS=5000");
    const admin = await connection.getDB("admin");
    const authenticated = await admin.auth(login.username, login.password);
    if (!(authenticated === 1 || authenticated === true || authenticated && authenticated.ok === 1)) {
        throw new Error("Failed to authenticate with MongoDB.");
    }
    if ((await admin.runCommand({ping: 1})).ok !== 1) {
        throw new Error("Failed to verify the MongoDB connection.");
    }
    return {connection, admin};
}

function dataPath(name) {
    return path.join(process.env.FLOWCAST_DB_PATH || "/data/db", name);
}

function readReady() {
    // 미완료 마커를 완료 마커보다 우선 확인
    if (fs.existsSync(dataPath(".flowcast-init-pending")) || fs.existsSync(dataPath(".flowcast-seed-pending"))) {
        throw new Error("Data initialization is incomplete.");
    }

    // 기존 볼륨의 이전 형식 마커 호환
    const current = fs.existsSync(dataPath(".flowcast-init-ready.json"));
    const name = current ? ".flowcast-init-ready.json" : ".flowcast-seed-ready.json";
    const schema = current ? markerSchema : "flowcast.seed-ready/1";
    const ready = JSON.parse(fs.readFileSync(dataPath(name), "utf8"));
    if (ready.schema !== schema || ready.status !== "verified" || ready.database !== databaseName
            || !/^[a-fA-F0-9]{64}$/.test(ready.archive_sha256 || "")
            || !ready.verified_at || !Number.isFinite(Date.parse(ready.verified_at))) {
        throw new Error("Invalid initialization completion marker.");
    }
    return ready;
}

module.exports = {fs, path, databaseName, markerSchema, readManifest, effectiveManifest,
    credentials, connect, dataPath, readReady};
