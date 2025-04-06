export const BlockDict = {
    air: {
        id: 0,
        name: "Air",
        isSolid: false,
        isTransparent: true,
        isAnimated: false,
        uv: null
    },
    grass: {
        id: 1,
        name: "Grass",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        uv: {
            top: [0, 0],
            side: [1, 0],
            bottom: [2, 0]
        }
    },
    dirt: {
        id: 2,
        name: "Dirt",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        uv: {
            top: [2, 0],
            side: [2, 0],
            bottom: [2, 0]
        }
    },
    water: {
        id: 3,
        name: "Water",
        isSolid: false,
        isTransparent: true,
        isAnimated: true,
        uv: {
            top: [0, 15],
            side: [0, 15],
            bottom: [0, 15]
        }
    },
    stone: {
        id: 7,
        name: "Stone",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        uv: {
            top: [3, 0],
            side: [3, 0],
            bottom: [3, 0]
        }
    },
    coal: {
        id: 8,
        name: "Coal",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        uv: {
            top: [4, 0],
            side: [4, 0],
            bottom: [4, 0]
        }
    },
    iron: {
        id: 9,
        name: "Iron",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        uv: {
            top: [5, 0],
            side: [5, 0],
            bottom: [5, 0]
        }
    },
    sand: {
        id: 6,
        name: "Sand",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        uv: {
            top: [0, 1],
            side: [0, 1],
            bottom: [0, 1]
        }
    }
};

export class BlockAtlas {
    constructor(texture, tileSize = 16, atlasSize = 256) {
        this.texture = texture;
        this.UV_SCALE = tileSize / atlasSize;
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

export default class Blocks {

}