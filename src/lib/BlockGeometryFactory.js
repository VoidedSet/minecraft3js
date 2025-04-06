import * as THREE from 'three';

export class BlockGeometryFactory {
    constructor(atlas) {
        this.atlas = atlas;
    }

    create(type) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        geo.setAttribute('uv', new THREE.BufferAttribute(this.atlas.getUVs(type), 2));
        return geo;
    }
}
