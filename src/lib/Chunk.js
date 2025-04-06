import { makeNoise2D } from 'open-simplex-noise';

export class Chunk {
    constructor(cx, cz, size, chunkNoise, subBiomeMap) {
        this.cx = cx;
        this.cz = cz;
        this.size = size;
        this.maxHeight = 128;
        this.chunkNoise = chunkNoise;
        this.subBiomeMap = subBiomeMap;
        this.seaLevel = 11;

        this.blocks = this._generate();
    }

    _generate() {
        const CHUNK = Array(this.size).fill().map(() =>
            Array(this.maxHeight).fill().map(() =>
                Array(this.size).fill(0)
            )
        );

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const wx = this.cx * this.size + x;
                const wz = this.cz * this.size + z;

                const biomeVal = this.subBiomeMap?.[wx]?.[wz] ?? 0;
                const { heightScale, waterLevel } = this.getBiomeParams(biomeVal);

                // Multi-octave noise
                const baseFreq = 0.01;
                const octaves = 4;
                const persistence = 0.5;
                const lacunarity = 2.0;

                let amp = 1;
                let freq = baseFreq;
                let noiseVal = 0;
                let maxAmp = 0;

                for (let i = 0; i < octaves; i++) {
                    noiseVal += this.chunkNoise(wx * freq, wz * freq) * amp;
                    maxAmp += amp;
                    amp *= persistence;
                    freq *= lacunarity;
                }

                noiseVal = (noiseVal / maxAmp + 1) / 2; // Normalize to [0,1]
                const height = Math.floor(noiseVal * heightScale);
                const stoneDepth = Math.floor(noiseVal + 1);

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

                for (let y = 0; y <= waterLevel; y++) {
                    if (CHUNK[x][y][z] === 0) CHUNK[x][y][z] = 3; // water
                    else if (CHUNK[x][y][z] === 1) CHUNK[x][y][z] = 6; // sand
                }
            }
        }

        return CHUNK;
    }
    lerp(a, b, t) {
        return a * (1 - t) + b * t;
    }


    getBiomeParams(biomeValue) {
        // biomeValue in range [-1, 1]
        const value = (biomeValue + 1) / 2; // Normalize to [0, 1]

        // Instead of hard-coded steps, use smooth interpolation
        let heightScale, waterLevel;

        if (value < 0.3) {
            // Ocean
            heightScale = this.lerp(12, 15, value / 0.3);  // shallow ocean to deep ocean
            waterLevel = 12;
        } else if (value < 0.6) {
            // Plains
            heightScale = this.lerp(15, 25, (value - 0.3) / 0.3);  // gentle rolling hills
            waterLevel = 9;
        } else {
            // Mountains
            heightScale = this.lerp(30, 50, (value - 0.6) / 0.4);  // steeper rise
            waterLevel = 6;
        }

        return { heightScale, waterLevel };
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
