// 복원 결과 검증 후 완료 마커 기록
(async () => {
try {
    const lib = require((process.env.FLOWCAST_INIT_DIR || "/docker-entrypoint-initdb.d") + "/lib.cjs");
    const manifest = lib.effectiveManifest(lib.readManifest());
    const active = await lib.connect(Mongo);
    const database = await active.connection.getDB(lib.databaseName);
    const actualNames = (await database.getCollectionNames()).sort();
    const expectedNames = Object.keys(manifest.collections).sort();
    if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
        throw new Error("The restored collection list does not match the source.");
    }

    function ordered(value) {
        // 인덱스 옵션의 필드 순서는 비교에서 제외
        if (Array.isArray(value)) {
            return value.map(item => ordered(item));
        }
        if (value && typeof value === "object") {
            return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]));
        }
        return value;
    }

    function indexValue(index) {
        // ns는 제외하되 복합 인덱스 key 순서는 보존
        return JSON.stringify(Object.fromEntries(Object.keys(index).filter(key => key !== "ns").sort()
            .map(key => [key, key === "key" ? Object.entries(index[key]) : ordered(index[key])])));
    }

    for (const name of expectedNames) {
        const collection = await database.getCollection(name);
        if (Number(await collection.countDocuments({})) !== manifest.collections[name]) {
            throw new Error("The restored document count does not match the source.");
        }
        const expected = manifest.indexes[name].map(indexValue).sort();
        const actual = (await collection.getIndexes()).map(indexValue).sort();
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error("The restored indexes do not match the source.");
        }
    }
    const ready = {
        schema: lib.markerSchema,
        status: "verified",
        database: lib.databaseName,
        archive_sha256: manifest.archive_sha256.toLowerCase(),
        verified_at: new Date().toISOString(),
        collections: manifest.collections,
    };
    const temporary = lib.dataPath(".flowcast-init-ready." + process.pid + ".tmp");
    lib.fs.writeFileSync(temporary, JSON.stringify(ready) + "\n", {mode: 0o644});
    lib.fs.renameSync(temporary, lib.dataPath(".flowcast-init-ready.json"));
    console.log("Flowcast 초기 자료 컬렉션과 인덱스 검증 완료");
} catch (error) {
    console.error("Failed to verify restored Flowcast seed data.");
    process.exit(1);
}
})();
