import { BlockDict } from "../Blocks";
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

            // CLEAN UNLOAD LOGIC
            for (const [k, chunk] of world.world.entries()) {
                if (!toKeep.has(k)) {
                    const meshesToDispose = Object.values(chunk.meshes);

                    requestAnimationFrame(() => {
                        for (const { mesh } of meshesToDispose) {
                            world.scene.remove(mesh);
                            if (mesh.geometry) mesh.geometry.dispose();
                            if (mesh.material) {
                                if (Array.isArray(mesh.material)) mesh.material.forEach(mat => mat.dispose());
                                else mesh.material.dispose();
                            }
                        }
                    });

                    // We ONLY save solid block modifications, not fluids
                    // Fluids are discarded as requested
                    world.world.delete(k);
                }
            }

            const wx = cx * chunkSize;
            const wz = cz * chunkSize;
            const biome = world.getBiome(wx, wz);
            // console.log(`Entered Chunk [${cx}, ${cz}] - Biome: ${biome}`);

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
        // if (blockId !== 0) {
        //     // Calculate coordinate below
        //     const belowY = ly - 1;

        //     // If it's valid and is Grass/Mycelium, kill it instantly
        //     if (belowY >= 0) {
        //         const blockBelow = chunk.blocks[lx][belowY][lz];
        //         if (blockBelow === BlockDict.grass.id || blockBelow === BlockDict.mycelium.id) { // 1=Grass, 17=Mycelium
        //             chunk.updateBlock(lx, belowY, lz, BlockDict.dirt.id)
        //             // setTimeout(() => chunk.updateBlock(lx, belowY, lz, BlockDict.dirt.id), 1000); // 2=Dirt
        //         }
        //     }
        // }

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
            // console.warn(`Y index ${ly} out of bounds`);
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

        console.log(chunkKey, "\nblock coords", blockKey);

        // [FIXED] Coordinate Calculation logic
        if (blockId === 3 || blockId === 21) { // 3=Water, 21=Lava

            // 1. Parse Chunk Key "cx,cz"
            const [cxStr, czStr] = chunkKey.split(',');
            const cx = parseInt(cxStr);
            const cz = parseInt(czStr);

            // 2. Calculate Global Coordinates
            // Global = (ChunkIndex * Size) + LocalIndex
            const globalX = (cx * this.chunkSize) + blockPos.x;
            const globalY = blockPos.y;
            const globalZ = (cz * this.chunkSize) + blockPos.z;

            // 3. Pass GLOBAL coordinates to FluidSim
            this.world.fluidSim.addFluidSource(globalX, globalY, globalZ, blockId);
        }
    }
}