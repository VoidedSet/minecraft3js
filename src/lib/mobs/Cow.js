import * as THREE from 'three';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { BlockDict } from '../Blocks.js';

// Define Block IDs we want to avoid (adjust based on your Blocks.js)
const DANGEROUS_BLOCKS = [BlockDict.air.id, BlockDict.water.id, BlockDict.lava.id]; // 0=Air, 8/9=Water, 10/11=Lava

export class Cow {
    constructor(world, startPos) {
        this.world = world;
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3();
        this.onGround = false;

        // --- AI SETTINGS ---
        this.state = 'idle';
        this.timer = 0;
        this.moveDir = new THREE.Vector3();
        this.moveSpeed = 2.0; // Cows are slow
        // -------------------

        // Dimensions
        const width = 0.9;
        const height = 1.3;
        const depth = 1.3;

        this.collider = {
            size: new THREE.Vector3(width, height, depth),
            offset: new THREE.Vector3(0, -height / 2, 0)
        };

        this.physics = new PlayerPhysics(this, world.chunkManager);
        this.physics.collider = this.collider;

        this.buildMesh(width, height, depth);
    }

    buildMesh(w, h, d) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.world.scene.add(this.mesh);

        const material = new THREE.MeshLambertMaterial({ color: 0x885533 });

        // 1. Body (Lifted up to make room for legs)
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.6, d), material);
        body.position.y = h * 0.7;
        this.mesh.add(body);

        // 2. Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material);
        head.position.set(0, h * 0.9, d * 0.5);
        this.mesh.add(head);

        // 3. Legs (4 legs)
        const legGeo = new THREE.BoxGeometry(0.25, h * 0.4, 0.25);
        const legPositions = [
            [-0.3, h * 0.2, 0.4],  // Front Left
            [0.3, h * 0.2, 0.4],   // Front Right
            [-0.3, h * 0.2, -0.4], // Back Left
            [0.3, h * 0.2, -0.4]   // Back Right
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, material);
            leg.position.set(...pos);
            this.mesh.add(leg);
        });

        const debugBox = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }));
        debugBox.position.copy(this.collider.offset).negate();
        this.mesh.add(debugBox);
    }

    update(delta) {
        this.aiUpdate(delta);

        if (this.state === 'walk') {
            this.velocity.x += this.moveDir.x * this.moveSpeed * delta;
            this.velocity.z += this.moveDir.z * this.moveSpeed * delta;

            // Random jump if stuck
            if (this.onGround && Math.random() < 0.002) {
                this.velocity.y = 7;
                this.onGround = false;
            }
        }

        // Gravity & Physics
        this.velocity.y -= 18 * delta;
        if (this.onGround && this.velocity.y < 0) this.velocity.y = 0;

        this.position.addScaledVector(this.velocity, delta);
        this.physics.update(this.velocity);

        // Friction
        const friction = this.onGround ? 6.0 : 0.1;
        this.velocity.x -= this.velocity.x * friction * delta;
        this.velocity.z -= this.velocity.z * friction * delta;

        this.mesh.position.copy(this.position);

        // Rotation
        if (new THREE.Vector2(this.velocity.x, this.velocity.z).length() > 0.1) {
            this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
        }
    }

    aiUpdate(delta) {
        this.timer -= delta;
        if (this.timer <= 0) {
            this.pickNewState();
        }
    }

    pickNewState() {
        const random = Math.random();

        if (random < 0.4) {
            this.state = 'idle';
            this.timer = 2;
        } else {
            // Try to find a SAFE direction
            this.state = 'idle'; // Default to idle if we can't find a path

            for (let attempt = 0; attempt < 5; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const testDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

                // Look 2 blocks ahead
                const lookAheadPos = this.position.clone().add(testDir.multiplyScalar(2));

                // Check the block AT THE FEET at that position
                const blockPos = new THREE.Vector3(
                    Math.floor(lookAheadPos.x),
                    Math.floor(lookAheadPos.y - 1), // Check feet level
                    Math.floor(lookAheadPos.z)
                );

                const blockId = this.world.chunkManager.returnBlockId(blockPos);

                // Also check block BELOW feet (to avoid falling off cliffs)
                const groundBlockId = this.world.chunkManager.returnBlockId(new THREE.Vector3(blockPos.x, blockPos.y - 1, blockPos.z));

                // IF path is safe (Not water/lava AND there is ground below)
                if (!DANGEROUS_BLOCKS.includes(blockId) && groundBlockId !== 0) {
                    this.state = 'walk';
                    this.moveDir.set(Math.sin(angle), 0, Math.cos(angle));
                    this.timer = 3;
                    return; // Found a good path!
                }
            }
        }
    }
}