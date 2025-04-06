export class Chunk {
    constructor(cx, cz, size, chunkNoise, biomeCorners) {
        this.cx = cx;
        this.cz = cz;
        this.size = size;
        this.maxHeight = 128;
        this.meshes;
        this.needsUpdate = false;
        this.blocks = this._generate(chunkNoise, biomeCorners);
    }

    _generate(chunkNoise, biomeCorners) {
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
                    if (y === height) block = 1;
                    else if (y >= height - stoneDepth) block = 2;
                    else {
                        block = 7;
                        const r = Math.random();
                        if (y > 0 && y < 40 && r < 0.05) block = 8;
                        if (y > 5 && y < 30 && r < 0.02) block = 9;
                    }
                    CHUNK[x][y][z] = block;
                }

                for (let y = 0; y <= 10; y++) {
                    if (CHUNK[x][y][z] === 0) CHUNK[x][y][z] = 3;
                    else if (CHUNK[x][y][z] === 1) CHUNK[x][y][z] = 6;
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

}
