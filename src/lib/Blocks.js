// src/lib/Blocks.js

export const BlockDict = {
    air: {
        id: 0,
        name: "Air",
        isSolid: false,
        isTransparent: true,
        isAnimated: false,
        isLuminous: false,
        uv: null
    },
    grass: {
        id: 1,
        name: "Grass",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
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
        isLuminous: false,
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
        isTransparent: false,
        isAnimated: true,
        isLuminous: false, animation: {
            type: 'scroll',      // How many frames in your strip?
            speed: 0.2,          // Seconds per frame (lower = faster)
            direction: 'x'       // 'x' for horizontal strip, 'y' for vertical
        },
        uv: {
            top: [0, 15],
            side: [0, 15],
            bottom: [0, 15]
        }
    },
    oak_log: {
        id: 4,
        name: "Oak Log",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [3, 1],
            side: [2, 1],
            bottom: [3, 1]
        }
    },
    oak_leaves: {
        id: 5,
        name: "Oak Leaves",
        isSolid: true,
        isTransparent: true,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [4, 1],
            side: [4, 1],
            bottom: [4, 1]
        }
    },
    sand: {
        id: 6,
        name: "Sand",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [0, 1],
            side: [0, 1],
            bottom: [0, 1]
        }
    },
    stone: {
        id: 7,
        name: "Stone",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
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
        isLuminous: false,
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
        isLuminous: false,
        uv: {
            top: [5, 0],
            side: [5, 0],
            bottom: [5, 0]
        }
    },
    torch: {
        id: 10,
        name: "Torch",
        isSolid: false,
        isTransparent: true,
        isAnimated: false,
        isLuminous: true,
        uv: {
            top: [1, 2],
            side: [0, 2],
            bottom: [1, 2]
        }
    },
    glass: {
        id: 11,
        name: "Glass",
        isSolid: true,
        isTransparent: true,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [1, 1],
            side: [1, 1],
            bottom: [1, 1]
        }
    },
    granite: {
        id: 12,
        name: "Granite",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [5, 1],
            side: [5, 1],
            bottom: [5, 1]
        }
    },
    wooden_planks: {
        id: 13,
        name: "Oak Planks",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [10, 1],
            side: [10, 1],
            bottom: [10, 1]
        }
    },
    snow: {
        id: 14,
        name: "Snow",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [8, 0],
            side: [7, 0],
            bottom: [2, 0]
        }
    },
    spruce_log: {
        id: 15,
        name: "Spruce Log",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [5, 3],
            side: [4, 3],
            bottom: [5, 3]
        }
    },
    spruce_leaves: {
        id: 16,
        name: "Spruce Leaves",
        isSolid: true,
        isTransparent: true,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [6, 3],
            side: [6, 3],
            bottom: [6, 3]
        }
    },
    mycelium: {
        id: 17,
        name: "Mycelium",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [10, 0],
            side: [9, 0],
            bottom: [2, 0]
        }
    },
    netherrack: {
        id: 18,
        name: "Netherrack",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [10, 3],
            side: [10, 3],
            bottom: [10, 3]
        }
    },
    glowstone: {
        id: 19,
        name: "Glowstone",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: true,
        uv: {
            top: [7, 2],
            side: [7, 2],
            bottom: [7, 2]
        }
    },
    soul_sand: {
        id: 20,
        name: "Soul Sand",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: true,
        uv: {
            top: [8, 2],
            side: [8, 2],
            bottom: [8, 2]
        }
    }, lava: {
        id: 21,
        name: "Lava",
        isSolid: false,
        isTransparent: false,
        isAnimated: false,
        isLuminous: true,
        animation: {
            type: 'scroll',    // New type: 'scroll' vs 'frame'
            speed: 0.1,        // UV units per second (adjust to control flow speed)
            direction: 'x'     // 'x' for horizontal flow
        },
        uv: {
            top: [0, 14],
            side: [0, 14],
            bottom: [0, 14]
        }
    }, bedrock: {
        id: 22,
        name: "Bedrock",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [15, 13],
            side: [15, 13],
            bottom: [15, 13]
        }
    },
    nether_quartz_ore: {
        id: 23,
        name: "Nether Quartz Ore",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [9, 2],
            side: [9, 2],
            bottom: [9, 2]
        }
    },
    gravel: {
        id: 24,
        name: "Gravel",
        isSolid: true,
        isTransparent: false,
        isAnimated: false,
        isLuminous: false,
        uv: {
            top: [10, 2],
            side: [10, 2],
            bottom: [10, 2]
        }
    },
};

export class BlockAtlas {
    constructor(texture, tileSize = 16, atlasWidth = 256, atlasHeight = 256) {
        this.texture = texture;
        this.UV_SCALE_X = tileSize / atlasWidth;
        this.UV_SCALE_Y = tileSize / atlasHeight;
    }


    getFaceUV([x, y]) {
        const sx = this.UV_SCALE_X;
        const sy = this.UV_SCALE_Y;
        const eps = 0.001;

        return [
            x * sx + eps, y * sy + eps,
            (x + 1) * sx - eps, y * sy + eps,
            x * sx + eps, (y + 1) * sy - eps,
            (x + 1) * sx - eps, (y + 1) * sy - eps
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

    getRotatedFaceUV([x, y]) {
        const sx = this.UV_SCALE_X;
        const sy = this.UV_SCALE_Y;
        const eps = 0.001;

        const x1 = x * sx + eps;
        const y1 = y * sy + eps;
        const x2 = (x + 1) * sx - eps;
        const y2 = (y + 1) * sy - eps;

        // Map Texture U (Horizontal) to Face V (Vertical)
        // Texture Left (Low U) -> Face Bottom (Low V)
        // Texture Right (High U) -> Face Top (High V)
        return [
            x2, y1,  // Face TR gets Texture BR
            x2, y2, // Face TL gets Texture TR
            x1, y1, // Face BR gets Texture BL
            x1, y2, // Face BL gets Texture TL
        ];
    }

    getUVs(type, offsetX = 0, offsetY = 0) {
        const block = Object.values(BlockDict).find(b => b.name.toLowerCase() === type.toLowerCase());
        if (!block || !block.uv) throw new Error(`Unknown or UV-less block type: ${type}`);

        const { top, side, bottom } = block.uv;

        // Apply scroll offset
        const applyOffset = (faceUV) => [faceUV[0] + offsetX, faceUV[1] + offsetY];

        // [SPECIAL HANDLING FOR LAVA]
        if (type.toLowerCase() === 'lava' || type.toLowerCase() === 'water') {
            const sideRotated = this.getRotatedFaceUV(applyOffset(side));
            const topStandard = this.getFaceUV(applyOffset(top));
            const bottomStandard = this.getFaceUV(applyOffset(bottom));

            return new Float32Array([
                ...sideRotated,     // Front (Rotated)
                ...sideRotated,     // Back (Rotated)
                ...topStandard,     // Top (Standard flow)
                ...bottomStandard,  // Bottom (Standard flow)
                ...sideRotated,     // Left (Rotated)
                ...sideRotated      // Right (Rotated)
            ]);
        }

        // Standard behavior for all other blocks
        return new Float32Array([
            ...this.getFaceUV(applyOffset(side)),   // Front
            ...this.getFaceUV(applyOffset(side)),   // Back
            ...this.getFaceUV(applyOffset(top)),    // Top
            ...this.getFaceUV(applyOffset(bottom)), // Bottom
            ...this.getFaceUV(applyOffset(side)),   // Left
            ...this.getFaceUV(applyOffset(side))    // Right
        ]);
    }
}

// Automatically derive these sets from the dictionary
export const NonSolidBlockIds = new Set(
    Object.values(BlockDict)
        .filter(b => !b.isSolid)
        .map(b => b.id)
);

export const TransparentBlockIds = new Set(
    Object.values(BlockDict)
        .filter(b => b.isTransparent)
        .map(b => b.id)
);