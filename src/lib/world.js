import { makeNoise2D } from "open-simplex-noise";
import { Chunk } from "./Chunk";
import { ChunkRenderer } from "./ChunkRender";

export default class WorldBiomes {
    constructor(scene, factory, material) {
        this.scene = scene;
        this.factory = factory;
        this.material = material;

        this.chunkSize = 16;
        this.numChunks = 4;
        this.waterLevel = 9;

        this.biomeNoise = makeNoise2D(Date.now());
        this.chunkHeightNoise = makeNoise2D(Date.now() + 1);

        this.subBiomeMap = this.generateSubBiomeMap(); // 👈 actual blend map

        this.init();
    }

    getBiome(val) {
        if (val < -0.3) return "ocean";
        if (val < 0.2) return "plains";
        return "mountains";
    }

    generateSubBiomeMap() {
        const worldSize = this.numChunks * this.chunkSize;
        const map = Array(worldSize).fill().map(() =>
            Array(worldSize).fill(0)
        );

        for (let wx = 0; wx < worldSize; wx++) {
            for (let wz = 0; wz < worldSize; wz++) {
                const cx = Math.floor(wx / this.chunkSize);
                const cz = Math.floor(wz / this.chunkSize);

                const xInChunk = wx % this.chunkSize;
                const zInChunk = wz % this.chunkSize;

                const getNoise = (x, z) => this.biomeNoise(x * this.chunkSize * 0.02, z * this.chunkSize * 0.02);

                const topLeft = getNoise(cx, cz);
                const topRight = getNoise(cx + 1, cz);
                const bottomLeft = getNoise(cx, cz + 1);
                const bottomRight = getNoise(cx + 1, cz + 1);

                const tx = xInChunk / (this.chunkSize - 1);
                const tz = zInChunk / (this.chunkSize - 1);

                const top = this.lerp(topLeft, topRight, tx);
                const bottom = this.lerp(bottomLeft, bottomRight, tx);
                const blended = this.lerp(top, bottom, tz);

                map[wx][wz] = blended;
            }
        }

        return map;
    }

    init() {
        for (let cx = 0; cx < this.numChunks; cx++) {
            for (let cz = 0; cz < this.numChunks; cz++) {
                const chunkSubMap = [];

                for (let x = 0; x < this.chunkSize; x++) {
                    chunkSubMap[x] = [];
                    for (let z = 0; z < this.chunkSize; z++) {
                        const wx = cx * this.chunkSize + x;
                        const wz = cz * this.chunkSize + z;
                        chunkSubMap[x][z] = this.subBiomeMap[wx]?.[wz] ?? 0;
                    }
                }

                const chunk = new Chunk(
                    cx,
                    cz,
                    this.chunkSize,
                    this.chunkHeightNoise,
                    this.waterLevel,
                    chunkSubMap
                );

                const chunkRenderer = new ChunkRenderer(
                    this.scene,
                    this.factory,
                    this.material,
                    this.chunkSize
                );

                chunkRenderer.render(chunk, cx, cz);
            }
        }
        // Just before end of init()
        let biomeGrid = "";
        for (let cz = 0; cz < this.numChunks; cz++) {
            let row = "";
            for (let cx = 0; cx < this.numChunks; cx++) {
                const centerX = cx * this.chunkSize + Math.floor(this.chunkSize / 2);
                const centerZ = cz * this.chunkSize + Math.floor(this.chunkSize / 2);
                const value = this.subBiomeMap[centerX]?.[centerZ] ?? 0;
                const biome = this.getBiome(value);

                if (biome === "plains") row += " P ";
                else if (biome === "ocean") row += " O ";
                else if (biome === "mountains") row += " M ";
                else row += " ? ";
            }
            biomeGrid += row + "\n";
        }
        console.log("🌍 Biome Grid (Chunk-Level):\n" + biomeGrid);

    }

    lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }
}
