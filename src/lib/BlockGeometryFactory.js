import * as THREE from 'three';

export class BlockGeometryFactory {
    constructor(atlas) {
        this.atlas = atlas;

        // this.biomeColors = {
        //     plains: [0.6, 0.8, 0.5],
        //     mountains: [0.5, 0.6, 0.5],
        //     ocean: [0.5, 0.5, 0.7],
        //     swamp: [0.4, 0.5, 0.2],
        //     default: [1, 1, 1],
        // };

        this.biomeColors = {
            swamps: [0x4c / 255, 0x76 / 255, 0x3c / 255],               // #4c763c
            dark_forest: [0x50 / 255, 0x7a / 255, 0x32 / 255],         // #507a32
            badlands: [0x90 / 255, 0x81 / 255, 0x4d / 255],            // #90814d
            savanna: [0xbf / 255, 0xb7 / 255, 0x55 / 255],             // #bfb755
            cherry_grove: [0xb6 / 255, 0xdb / 255, 0x61 / 255],        // #b6db61
            stony_peaks: [0x9a / 255, 0xbe / 255, 0xb4 / 255],         // #9abe4b
            plains: [0x91 / 255, 0xbd / 255, 0x59 / 255],              // #91bd59
            ocean: [0x8e / 255, 0xb9 / 255, 0x71 / 255],               // #8eb971
            hills: [0x8a / 255, 0xb6 / 255, 0x89 / 255],     // #8ab689
            snowy_plains: [0x80 / 255, 0xb4 / 255, 0x97 / 255],        // #80b497
            snowy_beach: [0x83 / 255, 0xb5 / 255, 0x93 / 255],         // #83b593
            taiga: [0x86 / 255, 0xb7 / 255, 0x83 / 255],               // #86b783
            mountains: [0x86 / 255, 0xb7 / 255, 0x8f / 255], // #86b78f
            meadow: [0x83 / 255, 0xbb / 255, 0x6d / 255],              // #83bb6d
            birch_forest: [0x88 / 255, 0xbb / 255, 0x67 / 255],        // #88bb67
            forest: [0x79 / 255, 0xc0 / 255, 0x5a / 255],              // #79c05a
            sparse_jungle: [0x64 / 255, 0xc7 / 255, 0x3f / 255],       // #64c73f
            jungle: [0x59 / 255, 0xc9 / 255, 0x3c / 255],              // #59c93c
            mushroom_fields: [0x55 / 255, 0xc9 / 255, 0x3f / 255],     // #55c93f
            default: [1, 1, 1],
        };

    }

    create(type, biome = 'plains', options = {}) {
        let geo;

        if (type === "torch") {
            geo = new THREE.BoxGeometry(0.23, 0.8, 0.3);
            geo.translate(0, -0.2, 0);
        } else if (type === 'water' || type === 'lava') {
            const level = options.level ?? 8;
            console.log(options.level, level)
            const height = (level / 8) * 1.0; // full block = 1
            geo = new THREE.BoxGeometry(1, height, 1);
        } else {
            geo = new THREE.BoxGeometry(1, 1, 1);
        }

        // Set UVs
        const uvs = this.atlas.getUVs(type);
        if (uvs) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        const colorsArray = [];
        let biomeColor = [1, 1, 1];

        if (['grass', 'leaves', 'water'].includes(type)) {
            biomeColor = this.biomeColors[biome] || this.biomeColors.default;
        }

        for (let i = 0; i < geo.attributes.position.count; i++) {
            colorsArray.push(...biomeColor);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colorsArray, 3));

        return geo;
    }

}
