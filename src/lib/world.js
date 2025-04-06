import { makeNoise2D } from "open-simplex-noise";
import { Chunk } from "./Chunk";
import { ChunkRenderer } from "./ChunkRender";

export default class WorldBiomes {
    constructor(scene, factory, material) {
        this.scene = scene;
        this.factory = factory;
        this.material = material;

        this.chunkSize = 32;
        this.numChunks = 4;
        this.heightScale = 30;
        this.waterLevel = 9;

        this.biomeNoise = makeNoise2D(Date.now());
        this.chunkHeightNoise = makeNoise2D(Date.now() + 1); // diff seed for terrain

        this.biomeMap = [];

        this.init();
    }

    getBiome(wx, wz) {
        const value = this.biomeNoise(wx * 0.02, wz * 0.02); // low freq
        if (value < -0.3) return "ocean";
        if (value < 0.2) return "plains";
        return "mountains";
    }

    init() {
        for (let cx = 0; cx < this.numChunks; cx++) {
            for (let cz = 0; cz < this.numChunks; cz++) {
                const wx = cx * this.chunkSize;
                const wz = cz * this.chunkSize;

                const biome = this.getBiome(wx, wz);
                this.biomeMap[cx] = biome

                if (biome == "ocean") {
                    this.heightScale = 12;
                    this.waterLevel = 10;
                } else if (biome == "plains") {
                    this.heightScale = 20
                    this.waterLevel = 10;
                }
                else if (biome == "mountains") {
                    this.waterLevel = 5;
                    this.heightScale = 35;
                }

                console.log(biome)
                // Create a chunk with biome
                const chunk = new Chunk(
                    cx,
                    cz,
                    this.chunkSize,
                    this.heightScale,
                    this.waterLevel,
                    this.chunkHeightNoise,
                    biome // Pass biome name
                );

                // Render the chunk
                const chunkRenderer = new ChunkRenderer(
                    this.scene,
                    this.factory,
                    this.material,
                    this.chunkSize
                );

                chunkRenderer.render(chunk, cx, cz);
            }
        }
    }
}
