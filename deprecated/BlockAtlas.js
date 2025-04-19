

export class BlockAtlas {
    constructor(texture, tileSize = 16, atlasSize = 256) {
        this.texture = texture;
        this.UV_SCALE = tileSize / atlasSize;
        // this.UVs = {
        //     grass: { top: [0, 0], side: [1, 0], bottom: [2, 0] },
        //     dirt: { top: [2, 0], side: [2, 0], bottom: [2, 0] },
        //     stone: { top: [3, 0], side: [3, 0], bottom: [3, 0] },
        //     coal: { top: [4, 0], side: [4, 0], bottom: [4, 0] },
        //     iron: { top: [5, 0], side: [5, 0], bottom: [5, 0] },
        //     water: { top: [0, 15], side: [0, 15], bottom: [0, 15] },
        //     sand: { top: [0, 1], side: [0, 1], bottom: [0, 1] }
        // };
    }

    getFaceUV([x, y]) {
        const s = this.UV_SCALE;
        return [
            x * s, y * s,
            (x + 1) * s, y * s,
            (x + 1) * s, (y + 1) * s,
            x * s, (y + 1) * s
        ];
    }

    getUVs(type) {
        const block = Object.values(BlockDict).find(b => b.name.toLowerCase() === type.toLowerCase());
        if (!block || !block.uv) throw new Error(`Unknown or UV-less block type: ${type}`);

        const { top, side, bottom } = block.uv;

        return new Float32Array([
            ...this.getFaceUV(side),   // Top (assuming block-based face order)
            ...this.getFaceUV(side),   // Bottom
            ...this.getFaceUV(top),    // Left
            ...this.getFaceUV(bottom), // Right
            ...this.getFaceUV(side),   // Front
            ...this.getFaceUV(side)    // Back
        ]);
    }
}
