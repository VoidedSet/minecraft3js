import { ChunkRenderer } from "./ChunkRender";

export default class ChunkManager {
    constructor(chunkSize, loadRadius, world, modifiedMap) {
        this.chunkSize = chunkSize;
        this.loadRadius = loadRadius;
        this.world = world;
        this.modifiedMap = modifiedMap;

        this.renderer = new ChunkRenderer(world.scene, world.factory, world.material, chunkSize, world.world);
        this.lastDebugChunkX = null;
        this.lastDebugChunkZ = null;
    }

    chunkChangeCheck(player, world) {
        const pos = player.position;
        const chunkSize = world.chunkSize;
        const cx = Math.floor(pos.x / chunkSize);
        const cz = Math.floor(pos.z / chunkSize);
        const radius = this.loadRadius;

        if (cx !== this.lastDebugChunkX || cz !== this.lastDebugChunkZ) {
            this.lastDebugChunkX = cx;
            this.lastDebugChunkZ = cz;

            const toKeep = new Set();

            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const nx = cx + dx;
                    const nz = cz + dz;
                    const key = `${nx},${nz}`;
                    toKeep.add(key);

                    if (!world.world.has(key)) {
                        world.genChunks(nx, nz);
                    }
                }
            }
            for (const [k, chunk] of world.world.entries()) {

                if (!toKeep.has(k)) {
                    const meshesToDispose = Object.values(chunk.meshes);

                    // Delay the unload to not overlap with chunk generation/render
                    requestAnimationFrame(() => {
                        for (const { mesh } of meshesToDispose) {
                            world.scene.remove(mesh);
                            if (mesh.geometry) mesh.geometry.dispose();
                            if (mesh.material) {
                                if (Array.isArray(mesh.material)) {
                                    mesh.material.forEach(mat => mat.dispose());
                                } else {
                                    mesh.material.dispose();
                                }
                            }
                        }
                    });
                    // Save fluid data into modifiedMap before deleting
                    if (world.fluidMap.has(k)) {
                        const fluidChunk = world.fluidMap.get(k);
                        if (!this.modifiedMap.has(k)) {
                            this.modifiedMap.set(k, new Map());
                        }
                        const modChunk = this.modifiedMap.get(k);

                        for (const posKey in fluidChunk) {
                            if (!fluidChunk.hasOwnProperty(posKey)) continue;
                            this.world.modifiedMap.get(k).set(posKey, fluidChunk[posKey].blockId);
                        }
                    }
                    world.fluidMap.delete(k);
                    world.world.delete(k);
                }
            }

            const wx = cx * chunkSize;
            const wz = cz * chunkSize;
            const biome = world.getBiome(wx, wz);
            console.log(`Entered Chunk [${cx}, ${cz}] - Biome: ${biome}`);

            // 🔥 Add this logging block here:
            console.log(
                `Chunks loaded: ${world.world.size}`,
                performance.memory
                    ? `Memory usage: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
                    : "Memory usage: N/A (performance.memory unsupported)"
            );
        }
    }


    placeBlockAt(blockId, targetPos) {
        const { chunkSize } = this.world;

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
        this.renderer.reRender(chunk, cx, cz);
        for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const neighborKey = `${cx + dx},${cz + dz}`;
            const neighborChunk = this.world.world.get(neighborKey);
            if (neighborChunk) {
                this.renderer.reRender(neighborChunk, cx + dx, cz + dz);
            }
        }

        // console.log(this.modifiedMap)

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

        // console.log(chunk.blocks[lx][ly][lz])

        return chunk.blocks[lx][ly][lz] || 0;
    }

    addRandomBlocksToChunk(modifiedMap, chunkKey, chunkSize = 16, maxHeight = 128, count = 32 * 32) {
        const key = chunkKey;
        let blockMap = modifiedMap.get(key);

        if (!blockMap) {
            blockMap = new Map();
            modifiedMap.set(key, blockMap);
        }

        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * chunkSize);
            const y = Math.floor(Math.random() * maxHeight);
            const z = Math.floor(Math.random() * chunkSize);
            const blockId = Math.floor(Math.random() * 10) + 1; // Random blockId from 1 to 10

            blockMap.set(`${x},${y},${z}`, blockId);
        }

        console.log(`Injected ${count} random blocks into chunk (${chunkKey})`);
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

        // console.log(this.world.modifiedMap)
        console.log(chunkKey, "\nblock coords", blockKey);

        if (blockId === 3) {
            const localKey = `${blockPos.x},${blockPos.y},${blockPos.z}`;

            if (!this.world.fluidMap.has(chunkKey))
                this.world.fluidMap.set(chunkKey, {});
            this.world.fluidMap.get(chunkKey)[localKey] = {
                blockId: 3,
                level: 8
            };
        }

        // this.addRandomBlocksToChunk(this.world.modifiedMap, chunkKey)    
    }
}