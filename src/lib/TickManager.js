import { seededRandom } from "three/src/math/MathUtils.js";
import { BlockDict } from "./Blocks";

export class TickManager {
    constructor(chunkManager, world) {
        this.chunkManager = chunkManager;
        this.world = world;
        this.tickTimer = 0;
        this.tickRate = 0.05;
        this.randomTicksPerChunk = 50;
    }

    update(delta) {
        this.tickTimer += delta;
        if (this.tickTimer < this.tickRate) return;
        this.tickTimer = 0;

        for (const [key, chunk] of this.world.world.entries()) {
            this.processChunk(chunk, key);
        }
    }

    processChunk(chunk, key) {
        const size = chunk.size;
        const height = chunk.blocks[0].length;

        const [cx, cz] = key.split(',').map(Number);

        for (let i = 0; i < this.randomTicksPerChunk; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * height);
            const z = Math.floor(Math.random() * size);

            const blockId = chunk.blocks[x][y][z];

            if (blockId === 0) continue;

            if (blockId === BlockDict.dirt.id) {
                this.handleDirtGrowth(chunk, x, y, z, cx, cz);
            } else if (blockId === BlockDict.grass.id) {
                this.handleGrassDeath(chunk, x, y, z, cx, cz);
            } else if (blockId === BlockDict.mycelium.id)
                this.handleGrassDeath(chunk, x, y, z, cx, cz);
        }
    }

    handleDirtGrowth(chunk, x, y, z, cx, cz) {
        if (y + 1 < chunk.blocks[0].length && chunk.blocks[x][y + 1][z] !== 0) return;

        if (this.hasNeighborBlock(chunk, x, y, z, BlockDict.grass.id)) {
            chunk.blocks[x][y][z] = BlockDict.grass.id;
            this.chunkManager.renderer.reRender(chunk, cx, cz);
        }

        if (this.hasNeighborBlock(chunk, x, y, z, BlockDict.mycelium.id)) {
            if (Math.random() > 0.5) {
                chunk.blocks[x][y][z] = BlockDict.mycelium.id;
                this.chunkManager.renderer.reRender(chunk, cx, cz);
            }
        }
    }

    handleGrassDeath(chunk, x, y, z, cx, cz) {
        if (y + 1 >= chunk.blocks[0].length) return;

        const blockAbove = chunk.blocks[x][y + 1][z];
        if (blockAbove !== 0 && blockAbove !== BlockDict.torch.id) {
            chunk.blocks[x][y][z] = BlockDict.dirt.id;
            this.chunkManager.renderer.reRender(chunk, cx, cz);
        }
    }

    hasNeighborBlock(chunk, x, y, z, targetId) {
        const directions = [
            [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
            [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1],
            [1, -1, 0], [-1, -1, 0], [0, -1, 1], [0, -1, -1]
        ];

        for (const [dx, dy, dz] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const nz = z + dz;

            if (nx >= 0 && nx < chunk.size && nz >= 0 && nz < chunk.size && ny >= 0 && ny < 128) {
                if (chunk.blocks[nx][ny][nz] === targetId) return true;
            }
        }
        return false;
    }
}