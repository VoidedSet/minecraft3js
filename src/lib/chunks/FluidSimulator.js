import { BlockDict } from "../Blocks";

export class FluidSim {
    constructor(worldMap, renderer) {
        this.worldMap = worldMap;
        this.renderer = renderer;

        this.timers = { 3: 0, 21: 0 };

        // Configuration:
        // spreadChance: 1.0 = Spreads every tick (Fast, perfect shape)
        // spreadChance: 0.6 = 60% chance to spread (Slower, organic shape)
        this.fluidConfig = {
            3: { tickRate: 0.2, spreadChance: 0.3 }, // Water
            21: { tickRate: 0.8, spreadChance: 0.1 } // Lava (Very slow spread)
        };
    }

    addFluidSource(x, y, z, blockId, direction = null) {
        const info = this.getLocalInfo(x, y, z);
        console.log(info)
        if (info.chunk) {
            info.chunk.setFluid(info.lx, info.ly, info.lz, blockId, 8, direction);
            this.renderer.reRender(info.chunk, info.chunk.cx, info.chunk.cz);
        }
    }

    getLocalInfo(wx, wy, wz) {
        const chunkSize = 16;
        const cx = Math.floor(wx / chunkSize);
        const cz = Math.floor(wz / chunkSize);
        const key = `${cx},${cz}`;

        // Safety: Only interact with loaded chunks
        if (!this.worldMap.has(key)) return { chunk: null };

        const chunk = this.worldMap.get(key);
        const lx = ((wx % chunkSize) + chunkSize) % chunkSize;
        const lz = ((wz % chunkSize) + chunkSize) % chunkSize;

        return { chunk, lx, ly: wy, lz };
    }

    update(delta) {
        let shouldRun = false;
        const processFlags = {};

        for (const [id, config] of Object.entries(this.fluidConfig)) {
            this.timers[id] += delta;
            if (this.timers[id] >= config.tickRate) {
                this.timers[id] = 0;
                processFlags[id] = true;
                shouldRun = true;
            }
        }

        if (shouldRun) this.runSim(processFlags);
    }

    runSim(processFlags) {
        const chunkSize = 16;
        const maxLevel = 8;
        const updates = [];

        // 1. Scan active fluids
        for (const chunk of this.worldMap.values()) {
            for (const [key, data] of chunk.fluidLevels) {
                const { blockId, level, direction } = data;

                if (!processFlags[blockId]) continue;

                const config = this.fluidConfig[blockId];
                const [lx, ly, lz] = key.split(',').map(Number);
                const worldX = chunk.cx * chunkSize + lx;
                const worldY = ly;
                const worldZ = chunk.cz * chunkSize + lz;

                // CHECK DOWN (Falling)
                // Falling is deterministic (always happens if possible)
                const down = this.getLocalInfo(worldX, worldY - 1, worldZ);
                if (down.chunk) {
                    const downId = down.chunk.blocks[down.lx][down.ly][down.lz];
                    if (downId === 0) {
                        // Falling into Air -> Creates Source (Max Level)
                        updates.push({ ...down, blockId, level: maxLevel, direction });
                        continue; // Don't spread sideways if falling
                    } else if (downId === blockId) {
                        // Falling into same fluid -> Refill it
                        const downLevel = down.chunk.getFluidLevel(down.lx, down.ly, down.lz);
                        if (downLevel < maxLevel) {
                            updates.push({ ...down, blockId, level: maxLevel, direction });
                        }
                    }
                }

                // CHECK SIDES (Spreading)
                // Only spread if sitting on something solid
                const downBlockDef = down.chunk ? Object.values(BlockDict).find(b => b.id === down.chunk.blocks[down.lx][down.ly][down.lz]) : null;
                const isOnGround = downBlockDef && downBlockDef.isSolid;

                // Stop if level is 1 (Limit reached!)
                if (isOnGround && level > 1) {
                    const neighbors = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];

                    for (const { dx, dz } of neighbors) {
                        // 1. Direction check (optional constraint)
                        if (direction && (dx !== direction.x || dz !== direction.z)) continue;

                        // 2. Probability check (Stochastic flow)
                        if (Math.random() > (config.spreadChance || 1.0)) continue;

                        const n = this.getLocalInfo(worldX + dx, worldY, worldZ + dz);
                        if (n.chunk) {
                            const nId = n.chunk.blocks[n.lx][n.ly][n.lz];
                            if (nId === 0) {
                                // Spread decreases level by 1
                                updates.push({ ...n, blockId, level: level - 1, direction });
                            }
                        }
                    }
                }
            }
        }

        // 2. Apply Updates
        for (const u of updates) {
            const chunkKey = `${u.chunk.cx},${u.chunk.cz}`;
            // Double check chunk is still loaded
            if (!this.worldMap.has(chunkKey)) continue;

            // Don't overwrite higher levels (e.g. source block flowing into stream)
            const currentLevel = u.chunk.getFluidLevel(u.lx, u.ly, u.lz);
            if (currentLevel >= u.level) continue;

            // Commit
            u.chunk.setFluid(u.lx, u.ly, u.lz, u.blockId, u.level, u.direction);

            // Render
            this.renderer.reRender(u.chunk, u.chunk.cx, u.chunk.cz);
        }
    }
}