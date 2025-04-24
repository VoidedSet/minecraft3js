export class FluidSim {
    constructor(worldMap, fluidMap, modifiedMap, renderer) {
        this.worldMap = worldMap;
        this.fluidMap = fluidMap;
        this.modifiedMap = modifiedMap;
        this.renderer = renderer;

        this.tickTimer = 0;
        this.tickRate = 0.5; // seconds
    }

    update(delta) {
        this.tickTimer += delta;
        if (this.tickTimer < this.tickRate) return;

        this.tickTimer = 0;
        this.runSim();
    }

    runSim() {
        const chunkSize = 16;
        let totalNewPlaced = 0;

        // console.log(this.fluidMap.entries())
        // Loop over fluidMap entries (chunkKey -> { localPosKey -> fluidData })
        for (const [chunkKey, fluidData] of this.fluidMap.entries()) {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);

            for (const [localPosKey, data] of Object.entries(fluidData)) {
                const [lx, y, lz] = localPosKey.split(',').map(Number);
                const { blockId, level } = data;

                if (level <= 1) continue;

                const worldX = chunkX * chunkSize + lx;
                const worldZ = chunkZ * chunkSize + lz;

                const directions = [
                    [1, 0, 0], [-1, 0, 0],
                    [0, 0, 1], [0, 0, -1]
                ];

                for (const [dx, dy, dz] of directions) {
                    const nx = worldX + dx;
                    const ny = y + dy;
                    const nz = worldZ + dz;

                    const ncx = Math.floor(nx / chunkSize);
                    const ncz = Math.floor(nz / chunkSize);
                    const nlx = nx - ncx * chunkSize;
                    const nlz = nz - ncz * chunkSize;

                    const chunk = this.worldMap.get(`${ncx},${ncz}`);
                    // console.log(chunk)
                    if (!chunk) {
                        // console.warn(`[FluidSim] No chunk at ${ncx},${ncz} (from world pos ${nx},${ny},${nz})`);
                        continue;
                    }

                    if (nlx < 0 || nlx >= chunkSize || ny < 0 || ny >= chunk.height || nlz < 0 || nlz >= chunkSize) {
                        console.warn(`[FluidSim] Invalid local pos: ${nlx},${ny},${nlz} in chunk ${ncx},${ncz}`);
                        continue;
                    }

                    if (chunk.blocks[nlx]?.[ny]?.[nlz] !== 0) continue;

                    const newLevel = level - 1;
                    const newChunkKey = `${ncx},${ncz}`;
                    const newLocalKey = `${nlx},${ny},${nlz}`;

                    // Check if existing fluid exists there with higher or equal level
                    const existingChunk = this.fluidMap.get(newChunkKey);
                    const existing = existingChunk?.[newLocalKey];
                    if (existing && existing.level >= newLevel) continue;

                    // ✅ Update fluidMap
                    if (!this.fluidMap.has(newChunkKey)) this.fluidMap.set(newChunkKey, {});
                    this.fluidMap.get(newChunkKey)[newLocalKey] = { blockId, level: newLevel };

                    // ✅ Update actual chunk
                    chunk.blocks[nlx][ny][nlz] = blockId;

                    // ✅ Update modifiedMap
                    if (!this.modifiedMap.fluid_dat) this.modifiedMap.fluid_dat = {};
                    if (!this.modifiedMap.fluid_dat[newChunkKey]) this.modifiedMap.fluid_dat[newChunkKey] = {};
                    this.modifiedMap.fluid_dat[newChunkKey][newLocalKey] = {
                        blockId,
                        level: newLevel
                    };

                    totalNewPlaced++;
                    console.log(`[FluidSim] Fluid placed at ${nx},${ny},${nz} (chunk ${ncx},${ncz}) -> level ${newLevel}`);

                    this.renderer.reRender(chunk, chunkX, chunkZ)
                }
            }
        }

        if (totalNewPlaced > 0) {
            console.log(`[FluidSim] Placed ${totalNewPlaced} new fluid blocks.`);
        }
    }
}
