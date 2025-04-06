import { makeNoise2D } from "open-simplex-noise";
import { Chunk } from "./chunks/Chunk";
import { ChunkRenderer } from "./chunks/ChunkRender";
import { mapLinear } from "three/src/math/MathUtils.js";

export default class WorldBiomes {
    constructor(scene, factory, material) {
        this.scene = scene;
        this.factory = factory;
        this.material = material;

        this.chunkSize = 16;
        this.numChunks = 16;
        this.waterLevel = 10;
        this.maxHeight = 128;

        this.biomeNoise = makeNoise2D(Date.now());
        this.chunkHeightNoise = makeNoise2D(Date.now() + 1);

        this.biomeMap = [];
        this.world = new Map();

        this.biomeSettings = {
            ocean: { heightScale: 10, waterLevel: 12 },
            plains: { heightScale: 25, waterLevel: 10 },
            mountains: { heightScale: 60, waterLevel: 5 }
        };

        this.init();
    }

    getBiome(wx, wz) {
        const value = this.biomeNoise(wx * 0.01, wz * 0.01);
        if (value < -0.3) return "ocean";
        if (value < 0.2) return "plains";
        return "mountains";
    }

    getBiomeParams(wx, wz) {
        const biome = this.getBiome(wx, wz);
        return {
            biome,
            ...this.biomeSettings[biome]
        };
    }

    init() {
        for (let cx = 0; cx < this.numChunks; cx++) {
            for (let cz = 0; cz < this.numChunks; cz++) {
                const wx = cx * this.chunkSize;
                const wz = cz * this.chunkSize;

                // Get the 4 biome corners
                const topLeft = this.getBiomeParams(wx, wz);
                const topRight = this.getBiomeParams(wx + this.chunkSize, wz);
                const bottomLeft = this.getBiomeParams(wx, wz + this.chunkSize);
                const bottomRight = this.getBiomeParams(wx + this.chunkSize, wz + this.chunkSize);

                const chunk = new Chunk(
                    cx,
                    cz,
                    this.chunkSize,
                    this.chunkHeightNoise,
                    { topLeft, topRight, bottomLeft, bottomRight } // 4-corner biome data
                );

                const renderer = new ChunkRenderer(
                    this.scene,
                    this.factory,
                    this.material,
                    this.chunkSize
                );

                renderer.render(chunk, cx, cz);

                const key = `${cx},${cz}`;
                this.world.set(key, chunk);
            }
        }

        console.log(this.world)
    }


    printBiomeGrid() {
        for (let cz = 0; cz < this.numChunks; cz++) {
            let row = "";
            for (let cx = 0; cx < this.numChunks; cx++) {
                const wx = cx * this.chunkSize;
                const wz = cz * this.chunkSize;
                row += this.getBiome(wx, wz).padEnd(10, ' ') + " ";
            }
            console.log(row);
        }
    }

    getBiomeCorners(cx, cz) {
        const wx = cx * this.chunkSize;
        const wz = cz * this.chunkSize;

        // Get the 4 biome corners
        const topLeft = this.getBiomeParams(wx, wz);
        const topRight = this.getBiomeParams(wx + this.chunkSize, wz);
        const bottomLeft = this.getBiomeParams(wx, wz + this.chunkSize);
        const bottomRight = this.getBiomeParams(wx + this.chunkSize, wz + this.chunkSize);

        return { topLeft, topRight, bottomLeft, bottomRight };
    }

    genChunks(cx, cz) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const nx = cx + dx;
                const nz = cz + dz;
                const key = `${nx},${nz}`;
                if (!this.world.has(key)) {
                    const chunk = new Chunk(
                        nx,
                        nz,
                        this.chunkSize,
                        this.chunkHeightNoise,
                        this.getBiomeCorners(nx, nz)
                    );
                    this.world.set(key, chunk);
                    const renderer = new ChunkRenderer(
                        this.scene,
                        this.factory,
                        this.material,
                        this.chunkSize
                    );
                    renderer.render(chunk, nx, nz);
                }
            }
        }
    }


}
