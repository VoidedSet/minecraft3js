import { traaPass } from "three/examples/jsm/tsl/display/TRAAPassNode.js";
import { ChunkRenderer } from "./ChunkRender";

export default class ChunkManager {
    constructor(chunkSize, loadRadius, world) {
        this.chunkSize = chunkSize;
        this.loadRadius = loadRadius;
        this.world = world;

        this.lastDebugChunkX = null;
        this.lastDebugChunkZ = null;
    }

    chunkChangeCheck(player, world) {
        const pos = player.position;
        const chunkSize = world.chunkSize;
        const cx = Math.floor(pos.x / chunkSize);
        const cz = Math.floor(pos.z / chunkSize);

        if (cx !== this.lastDebugChunkX || cz !== this.lastDebugChunkZ) {
            this.lastDebugChunkX = cx;
            this.lastDebugChunkZ = cz;

            const key = `${cx},${cz}`;
            if (!world.world.has(key)) {
                console.log("NEED A NEW CHUNK HERE");
                world.genChunks(cx, cz);

                const radius = 4;

                for (const key of world.world.keys()) {
                    const [x, z] = key.split(',').map(Number);
                    const dx = Math.abs(cx - x);
                    const dz = Math.abs(cz - z);

                    if (Math.max(dx, dz) > radius) {
                        const chunk = world.world.get(key);
                        for (const { mesh } of Object.values(chunk.meshes)) {
                            world.scene.remove(mesh);
                        }
                        world.world.delete(key);
                        // console.log("unloaded a chunk: ", world.world)
                    }
                }
            }

            const wx = cx * chunkSize;
            const wz = cz * chunkSize;
            const biome = world.getBiome(wx, wz);
            console.log(`Entered Chunk [${cx}, ${cz}] - Biome: ${biome}`);
        }
    }

    placeBlockAt(blockId, targetPos) {
        const { chunkSize, world, scene, factory, material } = this.world;

        const cx = Math.floor(targetPos.x / chunkSize);
        const cz = Math.floor(targetPos.z / chunkSize);
        const key = `${cx},${cz}`;
        const chunk = world.get(key);

        if (!chunk) {
            console.warn("No chunk found at", key);
            return;
        }

        // Local chunk coords
        let lx = Math.floor(targetPos.x % chunkSize);
        let ly = Math.floor(targetPos.y);
        let lz = Math.floor(targetPos.z % chunkSize);

        lx = (lx + chunkSize) % chunkSize;
        lz = (lz + chunkSize) % chunkSize;

        chunk.updateBlock(lx, ly, lz, blockId);

        const renderer = new ChunkRenderer(scene, factory, material, chunkSize);
        renderer.reRender(chunk, cx, cz);
    }

    returnBlockId(targetPos) {
        const chunkSize = this.world.chunkSize;

        const cx = Math.floor(targetPos.x / chunkSize);
        const cz = Math.floor(targetPos.z / chunkSize);
        const key = `${cx},${cz}`;
        const chunk = this.world.world.get(key);

        if (!chunk) {
            console.warn(`Chunk ${key} not found`);
            return 0;
        }

        let lx = Math.floor(targetPos.x) % chunkSize;
        let ly = Math.floor(targetPos.y);
        let lz = Math.floor(targetPos.z) % chunkSize;

        lx = (lx + chunkSize) % chunkSize;
        lz = (lz + chunkSize) % chunkSize;

        if (ly < 0 || ly >= chunk.blocks[0].length) {
            console.warn(`Y index ${ly} out of bounds`);
            return 0;
        }

        return chunk.blocks[lx][ly][lz] || 0;
    }


}