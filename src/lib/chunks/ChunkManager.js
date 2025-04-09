import { ChunkRenderer } from "./ChunkRender";

export default class ChunkManager {
    constructor(chunkSize, loadRadius, world, modifiedMap) {
        this.chunkSize = chunkSize;
        this.loadRadius = loadRadius;
        this.world = world;
        this.modifiedMap = modifiedMap;

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

            // console.log("Looking for key:", key);
            // console.log("All keys in modifiedMap:", [...this.modifiedMap.keys()]);
            let modifiedBlocks = null;
            if (this.modifiedMap.has(key)) {
                modifiedBlocks = this.modifiedMap.get(key);
            } else {
                modifiedBlocks = null; // or use a default empty map if needed
            }
            if (!world.world.has(key)) {
                console.log(modifiedBlocks)
                world.genChunks(cx, cz, modifiedBlocks);
                const radius = 4;

                // unload distant chunks
                for (const [k, chunk] of world.world.entries()) {
                    const [x, z] = k.split(',').map(Number);
                    if (Math.max(Math.abs(cx - x), Math.abs(cz - z)) > radius) {
                        for (const { mesh } of Object.values(chunk.meshes)) {
                            world.scene.remove(mesh);
                        }
                        world.world.delete(k);
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
        const { chunkSize, scene, factory, material } = this.world;

        const cx = Math.floor(targetPos.x / chunkSize);
        const cz = Math.floor(targetPos.z / chunkSize);
        const key = `${cx},${cz}`;
        const chunk = this.world.world.get(key);

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
        let blockPos = {
            x: lx,
            y: ly,
            z: lz
        };
        chunk.updateBlock(lx, ly, lz, blockId);
        const renderer = new ChunkRenderer(scene, factory, material, chunkSize);
        renderer.reRender(chunk, cx, cz);

        console.log(this.modifiedMap)

        this.setModifiedBlock(key, blockPos, blockId)
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

    setModifiedBlock(chunkKey, blockPos, blockId) {
        const blockKey = `${blockPos.x},${blockPos.y},${blockPos.z}`;


        if (!this.world.modifiedMap.has(chunkKey)) {
            this.world.modifiedMap.set(chunkKey, new Map());
        }

        if (blockId == 0) {
            blockId = -1;
        }

        this.world.modifiedMap.get(chunkKey).set(blockKey, blockId);

        console.log(this.world.modifiedMap)
    }
}