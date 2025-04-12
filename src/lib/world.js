import { makeNoise2D } from "open-simplex-noise";
import { Chunk } from "./chunks/Chunk";
import { ChunkRenderer } from "./chunks/ChunkRender";
import * as THREE from 'three';

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

        this.biomeSettings = {
            ocean: { heightScale: 10, waterLevel: 12 },
            plains: { heightScale: 25, waterLevel: 10 },
            mountains: { heightScale: 60, waterLevel: 5 }
        };

        this.init();

        this.time = 0.2;
    }

    getBiome(wx, wz) {
        const value = this.biomeNoise(wx * 0.005, wz * 0.001);
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
                    { topLeft, topRight, bottomLeft, bottomRight }, // 4-corner biome data
                    this.modifiedMap,
                    this.getBiome(wx, wz)
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

        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
        this.sunLight.position.set(100, 100, 100);
        this.scene.add(this.sunLight);

        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

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
                this.getBiome(wx, wz)
            );
            this.world.set(key, chunk);

            const renderer = new ChunkRenderer(
                this.scene,
                this.factory,
                this.material,
                this.chunkSize
            );

            renderer.render(chunk, cx, cz);
        }
    }

    safeSpawn(player) {
        const key = `1,1`;
        const chunk = this.world.get(key);

        player.controls.object.position.set(24, 8, 24);
        while (chunk.blocks[8][player.controls.object.position.y][8] != 0)
            player.controls.object.position.y++;

        player.controls.object.position.y++;
    }

    dayNightCycle(delta, renderer) {
        this.time += delta * 0.01;
        this.time %= 1;

        let lightFactor;
        let sunsetFactor = 0;

        if (this.time < 0.2) {
            lightFactor = 0;
        } else if (this.time < 0.4) {
            lightFactor = THREE.MathUtils.smoothstep(this.time, 0.2, 0.4);
            sunsetFactor = 1 - Math.abs((this.time - 0.3) / 0.1); // peaks at 0.3
        } else if (this.time < 0.75) {
            lightFactor = 1;
        } else if (this.time < 0.95) {
            lightFactor = 1 - THREE.MathUtils.smoothstep(this.time, 0.75, 0.95);
            sunsetFactor = 1 - Math.abs((this.time - 0.85) / 0.1); // peaks at 0.85
        } else {
            lightFactor = 0;
        }

        this.ambientLight.intensity = THREE.MathUtils.lerp(0.2, 1.2, lightFactor);
        this.sunLight.intensity = THREE.MathUtils.lerp(0.0, 2.0, lightFactor);

        const nightColor = new THREE.Color(0x000000);
        const dayColor = new THREE.Color(0x87ceeb);
        const sunsetColor = new THREE.Color(0xff8c42);

        const baseFog = new THREE.Color().lerpColors(nightColor, dayColor, lightFactor);
        const finalFog = baseFog.lerp(sunsetColor, sunsetFactor);

        this.scene.fog.color = finalFog;
        this.scene.fog.density = THREE.MathUtils.lerp(0.025, 0.007, lightFactor);
        renderer.setClearColor(finalFog);
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
