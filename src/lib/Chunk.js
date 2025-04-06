import { makeNoise2D } from 'open-simplex-noise';

export class Chunk {
    constructor(cx, cz, size, heightScale, waterLevel, noise) {
        this.cx = cx;
        this.cz = cz;
        this.size = size;
        this.heightScale = heightScale;
        this.waterLevel = waterLevel;
        this.maxHeight = heightScale + 20; // Add buffer to avoid overflow
        this.blocks = this._generate(noise);
    }

    _generate(noise) {
        const CHUNK = Array(this.size).fill().map(() =>
            Array(this.maxHeight).fill().map(() =>
                Array(this.size).fill(0)
            )
        );

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const wx = this.cx * this.size + x;
                const wz = this.cz * this.size + z;

                const height = Math.floor((noise(wx * 0.1, wz * 0.1) + 1) / 2 * this.heightScale);
                const stoneDepth = Math.floor((noise(wx * 0.2, wz * 0.2) + 1) * 1.5) + 1;
                console.log("x: ", x, "height / noise", height)
                for (let y = 0; y <= height; y++) {
                    let block = 0;
                    if (y === height) block = 1; // grass
                    else if (y >= height - stoneDepth) block = 2; // dirt
                    else {
                        block = 7; // stone
                        const r = Math.random();
                        if (y > 0 && y < 40 && r < 0.05) block = 8; // coal
                        if (y > 5 && y < 30 && r < 0.02) block = 9; // iron
                    }
                    CHUNK[x][y][z] = block;
                }

                for (let y = 0; y <= this.waterLevel; y++) {
                    if (CHUNK[x][y][z] === 0) CHUNK[x][y][z] = 3; // water
                    else if (CHUNK[x][y][z] === 1) CHUNK[x][y][z] = 6; // sand
                }
            }
        }

        return CHUNK;
    }

    returnBlockID(playerPos) {
        const pX = Math.floor(playerPos.x) % this.size;
        const pY = Math.floor(playerPos.y);
        const pZ = Math.floor(playerPos.z) % this.size;

        if (pX < 0 || pX >= this.size || pZ < 0 || pZ >= this.size || pY < 0 || pY >= this.maxHeight) {
            console.warn("Invalid block lookup at", pX, pY, pZ);
            return null;
        }

        return this.blocks[pX][pY][pZ];
    }
}
