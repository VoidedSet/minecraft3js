export class Chunk {
    constructor(cx, cz, size, chunkNoise, biomeCorners, modifiedMap) {
        this.cx = cx;
        this.cz = cz;
        this.size = size;
        this.maxHeight = 128;
        this.meshes;
        this.needsUpdate = false;
        this.blocks = this._generate(chunkNoise, biomeCorners, modifiedMap);
    }

    _generate(chunkNoise, biomeCorners, modifiedMap) {

        const CHUNK = Array(this.size).fill().map(() =>
            Array(this.maxHeight).fill().map(() =>
                Array(this.size).fill(0)
            )
        );

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const wx = this.cx * this.size + x;
                const wz = this.cz * this.size + z;

                const tx = x / (this.size - 1);
                const tz = z / (this.size - 1);

                const tl = biomeCorners.topLeft;
                const tr = biomeCorners.topRight;
                const bl = biomeCorners.bottomLeft;
                const br = biomeCorners.bottomRight;

                const heightScale = this.bilerp(tl.heightScale, tr.heightScale, bl.heightScale, br.heightScale, tx, tz);
                const waterLevel = this.bilerp(tl.waterLevel, tr.waterLevel, bl.waterLevel, br.waterLevel, tx, tz);

                const baseFreq = 0.01;
                const octaves = 3;
                const persistence = 0.5;
                const lacunarity = 2.0;

                let amp = 1, freq = baseFreq, noiseVal = 0, maxAmp = 0;
                for (let i = 0; i < octaves; i++) {
                    noiseVal += chunkNoise(wx * freq, wz * freq) * amp;
                    maxAmp += amp;
                    amp *= persistence;
                    freq *= lacunarity;
                }

                noiseVal = (noiseVal / maxAmp + 1) / 2;
                const height = Math.floor(noiseVal * heightScale);
                const stoneDepth = Math.floor(noiseVal + 1);

                for (let y = 0; y <= height; y++) {
                    let block = 0;
                    if (y === height) {
                        block = 1;
                    }
                    else if (y >= height - stoneDepth) block = 2;
                    else {
                        block = 7;
                        const r = Math.random();
                        if (y > 0 && y < 40 && r < 0.05) block = 8;
                        if (y > 5 && y < 30 && r < 0.02) block = 9;
                    }
                    CHUNK[x][y][z] = block;

                    if (CHUNK[x][y][z] === 1 && CHUNK[x][y + 1][z] === 0 && y > 10) {
                        if (Math.random() < 0.01 && !this.hasNearbyTree(CHUNK, x, y + 1, z, 2)) {
                            this.placeTree(CHUNK, x, y, z);
                        }
                    }
                }

                for (let y = 0; y <= 10; y++) {
                    if (CHUNK[x][y][z] === 0) CHUNK[x][y][z] = 3;
                    else if (CHUNK[x][y][z] === 1) CHUNK[x][y][z] = 6;
                }

                if (modifiedMap) {
                    console.log("Modifying the chunk");
                    for (const [key, blockId] of modifiedMap.entries()) {
                        const [x, y, z] = key.split(',').map(Number);
                        if (
                            x >= 0 && x < this.size &&
                            y >= 0 && y < this.maxHeight &&
                            z >= 0 && z < this.size
                        ) {
                            CHUNK[x][y][z] = blockId === -1 ? 0 : blockId;
                        }
                    }
                }

            }
        }
        return CHUNK;
    }

    bilerp(tl, tr, bl, br, tx, tz) {
        const top = this.lerp(tl, tr, tx);
        const bottom = this.lerp(bl, br, tx);
        return this.lerp(top, bottom, tz);
    }

    lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }

    returnBlockID(playerPos) {
        const px = Math.floor(playerPos.x) % this.size;
        const py = Math.floor(playerPos.y);
        const pz = Math.floor(playerPos.z) % this.size;

        if (px < 0 || px >= this.size || pz < 0 || pz >= this.size || py < 0 || py >= this.maxHeight) {
            return null;
        }

        return this.blocks[px][py][pz];
    }

    updateBlock(x, y, z, blockId) {
        this.blocks[x][y][z] = blockId;
        this.needsUpdate = true;
    }

    placeTree(chunk, x, y, z) {
        const height = 2 + Math.floor(Math.random() * 4);

        for (let i = 0; i < height; i++) {
            const yy = y + i + 1;
            if (yy < this.maxHeight) {
                chunk[x][yy][z] = 4; // log
            }
        }

        const leafStart = y + height;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = 0; dy <= 2; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const lx = x + dx;
                    const ly = leafStart + dy;
                    const lz = z + dz;
                    if (
                        lx >= 0 && lx < this.size &&
                        ly >= 0 && ly < this.maxHeight &&
                        lz >= 0 && lz < this.size &&
                        chunk[lx][ly][lz] === 0 &&
                        Math.random() > 0.2
                    ) {
                        chunk[lx][ly][lz] = 5; // leaves
                    }
                }
            }
        }
    }

    hasNearbyTree(chunk, x, y, z, radius) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -1; dy <= 5; dy++) { // log/leaf height
                for (let dz = -radius; dz <= radius; dz++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const nz = z + dz;

                    if (
                        nx >= 0 && nx < this.size &&
                        ny >= 0 && ny < this.maxHeight &&
                        nz >= 0 && nz < this.size
                    ) {
                        const b = chunk[nx][ny][nz];
                        if (b === 10 || b === 11) return true; // tree log or leaves
                    }
                }
            }
        }
        return false;
    }

}
