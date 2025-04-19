// for blocks.png
export const NonSolidBlockIds = new Set([0, 3, 10]);
export const TransparentBlockIds = new Set([0, 3, 5, 10, 11, 16]);
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
        isTransparent: true,
        isAnimated: true,
        isLuminous: false,
        uv: {
            top: [0, 15],
            side: [6, 2],
            bottom: [6, 2]
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
};

// export const BlockDict = {
//     air: {
//         id: 0,
//         name: "Air",
//         isSolid: false,
//         isTransparent: true,
//         isAnimated: false,
//         isLuminous: false,
//         uv: null
//     },
//     grass: {
//         id: 1,
//         name: "Grass",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [3, 10],
//             side: [0, 10],
//             bottom: [8, 4]
//         }
//     },
//     dirt: {
//         id: 2,
//         name: "Dirt",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [8, 4],
//             side: [8, 4],
//             bottom: [8, 4]
//         }
//     },
//     water: {
//         id: 3,
//         name: "Water",
//         isSolid: false,
//         isTransparent: true,
//         isAnimated: true,
//         isLuminous: false,
//         uv: {
//             top: [3, 0],
//             side: [22, 22],
//             bottom: [22, 22]
//         }
//     },
//     oak_log: {
//         id: 4,
//         name: "Oak Log",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [3, 1],
//             side: [2, 1],
//             bottom: [3, 1]
//         }
//     },
//     oak_leaves: {
//         id: 5,
//         name: "Oak Leaves",
//         isSolid: true,
//         isTransparent: true,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [4, 1],
//             side: [4, 1],
//             bottom: [4, 1]
//         }
//     },
//     sand: {
//         id: 6,
//         name: "Sand",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [0, 1],
//             side: [0, 1],
//             bottom: [0, 1]
//         }
//     },
//     stone: {
//         id: 7,
//         name: "Stone",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [3, 0],
//             side: [3, 0],
//             bottom: [3, 0]
//         }
//     },
//     coal: {
//         id: 8,
//         name: "Coal",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [4, 0],
//             side: [4, 0],
//             bottom: [4, 0]
//         }
//     },
//     iron: {
//         id: 9,
//         name: "Iron",
//         isSolid: true,
//         isTransparent: false,
//         isAnimated: false,
//         isLuminous: false,
//         uv: {
//             top: [5, 0],
//             side: [5, 0],
//             bottom: [5, 0]
//         }
//     },
//     torch: {
//         id: 10,
//         name: "Torch",
//         isSolid: false,
//         isTransparent: true,
//         isAnimated: false,
//         isLuminous: true,
//         uv: {
//             top: [1, 2],
//             side: [0, 2],
//             bottom: [1, 2]
//         }
//     }
// };

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
}

export default class Blocks {

}