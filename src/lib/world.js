import { makeNoise2D } from "open-simplex-noise";
import { Chunk } from "./chunks/Chunk";
import { ChunkRenderer } from "./chunks/ChunkRender";
import { FluidSim } from "./chunks/FluidSimulator";

export default class World {
    constructor(scene, factory, material) {
        this.scene = scene;
        this.factory = factory;
        this.material = material;

        this.chunkSize = 16;
        this.numChunks = 3;
        this.waterLevel = 10;
        this.maxHeight = 128;

        this.biomeNoise = makeNoise2D(Date.now() * 2);
        this.chunkHeightNoise = makeNoise2D(Date.now() + 1);

        this.biomeMap = [];
        this.world = new Map();
        this.modifiedMap = new Map();
        this.fluidMap = new Map(); // key will be coords obviuosly and the values will be water level 0 to 8

        this.biomeSettings = {
            ocean: { heightScale: 5, waterLevel: 12 },
            plains: { heightScale: 25, waterLevel: 10 },
            hills: { heightScale: 40, waterLevel: 9 },
            mushroom_fields: { heightScale: 12, waterLevel: 13 },
            mountains: { heightScale: 100, waterLevel: 5 }
        };

        this.crenderer = new ChunkRenderer(
            this.scene,
            this.factory,
            this.material,
            this.chunkSize,
            this.world,
            this.fluidMap
        );

        this.init();
    }

    getBiome(wx, wz) {
        const noiseVal = this.biomeNoise(wx * 0.005, wz * 0.001);

        // Random seed for swamp chance
        const rand = Math.abs(this.biomeNoise(wx * 0.01 + 100, wz * 0.01 - 100));

        if (noiseVal < -0.4) return "ocean";

        // SWAMP 10% CHANCE
        if (noiseVal >= -0.4 && noiseVal < -0.1 && rand < 0.1) return "mushroom_fields";

        if (noiseVal < 0.3) return "plains";
        if (noiseVal < 0.4) return "hills";

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
        const fluid_map = new Map();

        this.modifiedMap.set("fluid_map", fluid_map)

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
                    { topLeft, topRight, bottomLeft, bottomRight }, // 4-corner biome data
                    this.modifiedMap,
                    this.getBiome(wx, wz),
                    this.fluidMap
                );

                this.crenderer.render(chunk, cx, cz);

                const key = `${cx},${cz}`;
                this.world.set(key, chunk);
            }
            this.fluidSim = new FluidSim(this.world, this.fluidMap, this.modifiedMap, this.crenderer)

        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "f") {
                this.downloadModifiedMap(this.modifiedMap)
            }
        });

    }

    // printBiomeGrid() {
    //     for (let cz = 0; cz < this.numChunks; cz++) {
    //         let row = "";
    //         for (let cx = 0; cx < this.numChunks; cx++) {
    //             const wx = cx * this.chunkSize;
    //             const wz = cz * this.chunkSize;
    //             row += this.getBiome(wx, wz).padEnd(10, ' ') + " ";
    //         }
    //         console.log(row);
    //     }
    // }

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

        const wx = cx * this.chunkSize;
        const wz = cz * this.chunkSize;

        const key = `${cx},${cz}`;
        if (!this.world.has(key)) {
            if (this.modifiedMap.has(key))
                console.log("This chunk is modified");

            const chunk = new Chunk(
                cx,
                cz,
                this.chunkSize,
                this.chunkHeightNoise,
                this.getBiomeCorners(cx, cz),
                this.modifiedMap,
                this.getBiome(wx, wz),
                this.fluidMap
            );
            this.world.set(key, chunk);
            this.crenderer.render(chunk, cx, cz);
        }
    }

    safeSpawn(player) {
        const key = `1,1`;
        const chunk = this.world.get(key);

        player.controls.object.position.set(24, 8, 24);
        while (chunk.blocks[8][player.controls.object.position.y][8] != 0)
            player.controls.object.position.y++;

        player.controls.object.position.y += 3;

    }

    downloadModifiedMap(modifiedMap) {
        const serializable = {};

        for (const [chunkCoord, blockMap] of modifiedMap.entries()) {
            serializable[chunkCoord] = Object.fromEntries(blockMap);
        }

        const json = JSON.stringify(serializable, null, 2);

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "modifiedMap.json";
        a.click();

        URL.revokeObjectURL(url);
    }


}
