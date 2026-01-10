import { BlockDict } from "../Blocks";
import { MOUNTAIN_STRUCTURE } from "../Structures";

export class Chunk {
    constructor(cx, cz, size, chunkNoise, biomeCorners, modifiedMap, biome, fluidMap, dimension = 'overworld') {
        this.cx = cx;
        this.cz = cz;
        this.size = size;
        this.maxHeight = 128;
        this.meshes;
        this.needsUpdate = false;
        this.chunkHeight = 0;

        this.biome = biome;
        this.dimension = dimension;

        this.blocks = this._generate(chunkNoise, biomeCorners, modifiedMap, fluidMap);
    }


    _generate(chunkNoise, biomeCorners, modifiedMap, fluidMap) {
        let CHUNK;
        if (this.dimension === 'nether') {
            CHUNK = this._generateNetherChunk(chunkNoise);
        }
        CHUNK = this._generateBaseChunk(chunkNoise, biomeCorners, fluidMap);

        const key = `${this.cx},${this.cz}`;

        if (modifiedMap.has(key)) {
            const modifiedBlocks = modifiedMap.get(key);
            this._applyModifications(CHUNK, modifiedBlocks);
        }

        return CHUNK;
    }

    _generateNetherChunk(chunkNoise) {
        const CHUNK = Array(this.size).fill().map(() =>
            Array(this.maxHeight).fill().map(() =>
                Array(this.size).fill(0)
            )
        );

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const wx = this.cx * this.size + x;
                const wz = this.cz * this.size + z;

                // 1. Noise for Terrain (Ground and Ceiling)
                // We use 3D-ish noise logic or just simple 2D heightmap for floor + ceiling for now
                // "Simplex" noise usually better here, but we'll use your 2D noise for a cave-like feel.

                const baseFreq = 0.02;
                const ceilingFreq = 0.03;

                // Floor Noise
                const floorNoise = chunkNoise(wx * baseFreq, wz * baseFreq);
                const floorHeight = 30 + Math.floor(floorNoise * 15); // Hills from y=30 to y=45

                // Ceiling Noise (Stalactites)
                const ceilingNoise = chunkNoise(wx * ceilingFreq + 1000, wz * ceilingFreq + 1000); // Offset for variety
                const ceilingHeight = 100 - Math.floor(ceilingNoise * 10); // Ceiling around y=90 to 100

                // Lava Ocean Level
                const lavaLevel = 32;

                for (let y = 0; y < this.maxHeight; y++) {
                    if (y === 0 || y === 127) {
                        CHUNK[x][y][z] = BlockDict.bedrock.id;
                        continue;
                    }

                    // Lava Ocean
                    if (y < lavaLevel) {
                        CHUNK[x][y][z] = BlockDict.lava.id;
                        continue;
                    }

                    // Terrain Generation
                    if (y <= floorHeight) {
                        CHUNK[x][y][z] = BlockDict.netherrack.id;
                    }
                    else if (y >= ceilingHeight) {
                        CHUNK[x][y][z] = BlockDict.netherrack.id;
                    }

                    if (y >= ceilingHeight && Math.random() < 0.02) {
                        CHUNK[x][y][z] = BlockDict.glowstone.id;
                    }
                }
            }
        }
        return CHUNK;
    }

    _generateBaseChunk(chunkNoise, biomeCorners, fluidMap) {

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
                const snowLine = 35 + Math.floor(Math.random() * 20);

                for (let y = 0; y <= height; y++) {
                    let block = 0;

                    if (y === 0)
                        CHUNK[x][y][z] = BlockDict.bedrock.id;

                    if (y > this.chunkHeight)
                        this.chunkHeight = y;

                    if (y === height) {
                        if ((this.biome == 'mountains' || this.biome == 'hills') && y >= snowLine)
                            block = BlockDict.snow.id;
                        else if (this.biome == 'mushroom_fields')
                            block = BlockDict.mycelium.id;
                        else
                            block = BlockDict.grass.id;
                    }
                    else if (y >= height - stoneDepth) block = 2;
                    else {
                        block = BlockDict.stone.id;
                        const r = Math.random();
                        if (y > 0 && y < 40 && r < 0.05) block = BlockDict.coal.id;
                        if (y > 5 && y < 30 && r < 0.02) block = BlockDict.iron.id;
                    }
                    CHUNK[x][y][z] = block;

                    if (CHUNK[x][y][z] === 1 && CHUNK[x][y + 1][z] === 0 && y > 10) {
                        if (Math.random() < 0.01 && !this.hasNearbyTree(CHUNK, x, y + 1, z, 2)) {
                            this.placeTree(CHUNK, x, y, z);
                        }
                    }
                }

                for (let y = 1; y <= 10; y++) {
                    if (CHUNK[x][y][z] === 0 && y === 10) {
                        // if (this.biome !== 'ocean') {
                        //     const chunkKey = `${this.cx},${this.cz}`;
                        //     const localKey = `${x},${y},${z}`;

                        //     if (!fluidMap.has(chunkKey)) fluidMap.set(chunkKey, {});
                        //     fluidMap.get(chunkKey)[localKey] = {
                        //         blockId: 3,
                        //         level: 8
                        //     };
                        // }
                        CHUNK[x][y][z] = BlockDict.water.id;
                    } else if (CHUNK[x][y][z] === 1) {
                        CHUNK[x][y][z] = (y < 7) ? 7 : 6;
                    }
                }


            }
        }
        this._generateStructures(CHUNK);

        return CHUNK;
    }

    _generateStructures(CHUNK) {

        if (this.biome === "ocean") {
            const spawnChance = 0.01;
            if (Math.random() > spawnChance) return;

            const baseY = this.chunkHeight - 10;
            console.log("mountain structure here")
            // Get structure dimensions
            let maxX = 0, maxZ = 0;
            for (const coord of Object.keys(MOUNTAIN_STRUCTURE)) {
                const [x, , z] = coord.split(',').map(Number);
                if (x > maxX) maxX = x;
                if (z > maxZ) maxZ = z;
            }

            // Offset to keep structure inside chunk
            const offsetX = Math.floor(Math.random() * (this.size - maxX));
            const offsetZ = Math.floor(Math.random() * (this.size - maxZ));

            for (const [coord, blockId] of Object.entries(MOUNTAIN_STRUCTURE)) {
                const [x, y, z] = coord.split(',').map(Number);
                const lx = offsetX + x;
                const ly = baseY + y;
                const lz = offsetZ + z;

                if (
                    lx >= 0 && lx < this.size &&
                    ly >= 0 && ly < this.maxHeight &&
                    lz >= 0 && lz < this.size
                ) {
                    CHUNK[lx][ly][lz] = blockId;
                }
            }
        }
    }


    _applyModifications(CHUNK, modifiedBlocks) {
        if (!modifiedBlocks) return;

        for (const [key, blockId] of modifiedBlocks.entries()) {
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
        let height = 0;
        if (this.biome == 'hills' || this.biome == 'mountains') {
            height = 3 + Math.floor(Math.random() * 4)
        }
        else {
            height = 2 + Math.floor(Math.random() * 4);
        }

        for (let i = 0; i < height; i++) {
            const yy = y + i + 1;
            if (yy < this.maxHeight) {
                if (this.biome == 'hills' || this.biome == 'mountains')
                    chunk[x][yy][z] = 15; // log
                else
                    chunk[x][yy][z] = 4;
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
                        if (this.biome == 'hills' || this.biome == 'mountains')
                            chunk[lx][ly][lz] = 16; // log
                        else
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
