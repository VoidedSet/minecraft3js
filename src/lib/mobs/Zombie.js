import * as THREE from 'three';
import { PlayerPhysics } from '../player/PlayerPhysics.js';

export class Zombie {
    constructor(world, startPos, player) {
        this.world = world;
        this.player = player; // We need the player to chase them!
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3();
        this.onGround = false;

        // --- ZOMBIE STATS ---
        const width = 0.6;
        const height = 1.9; // Taller than cow
        const depth = 0.6;
        this.moveSpeed = 4.5; // Faster than cow (Cow is 2.0)

        // --- PHYSICS SETUP ---
        // Pivot at FEET (Offset = -Height/2)
        this.collider = {
            size: new THREE.Vector3(width, height, depth),
            offset: new THREE.Vector3(0, -height / 2, 0)
        };

        this.physics = new PlayerPhysics(this, world.chunkManager);
        this.physics.collider = this.collider;

        // --- BUILD VISUALS ---
        this.buildMesh(width, height, depth);
    }

    buildMesh(w, h, d) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.world.scene.add(this.mesh);

        // Materials
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x2e8544 }); // Zombie Green
        const shirtMat = new THREE.MeshLambertMaterial({ color: 0x3d56a6 }); // Blue Shirt
        const pantsMat = new THREE.MeshLambertMaterial({ color: 0x223377 }); // Darker Blue Pants

        // 1. HEAD (Top)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
        head.position.y = 1.75; // Top of body
        this.mesh.add(head);

        // 2. BODY (Shirt)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), shirtMat);
        body.position.y = 1.15; // Middle
        this.mesh.add(body);

        // 3. ARMS (Sticking forward like a zombie)
        const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);

        const leftArm = new THREE.Mesh(armGeo, skinMat);
        leftArm.position.set(-0.4, 1.3, 0.4);
        leftArm.rotation.x = -Math.PI / 2; // Point forward 90 degrees
        this.mesh.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, skinMat);
        rightArm.position.set(0.4, 1.3, 0.4);
        rightArm.rotation.x = -Math.PI / 2;
        this.mesh.add(rightArm);

        // 4. LEGS (Pants) - The requested legs!
        const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);

        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.set(-0.15, 0.4, 0); // Offset from center
        this.mesh.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.set(0.15, 0.4, 0);
        this.mesh.add(rightLeg);

        const debugBox = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }));
        debugBox.position.copy(this.collider.offset).negate();
        this.mesh.add(debugBox);
    }

    update(delta) {
        // --- CHASE AI ---
        const dist = this.position.distanceTo(this.player.position);

        // Chase if player is close (within 20 blocks) but not touching (1 block)
        if (dist < 20 && dist > 1.0) {
            const direction = new THREE.Vector3()
                .subVectors(this.player.position, this.position)
                .normalize();

            this.velocity.x += direction.x * this.moveSpeed * delta;
            this.velocity.z += direction.z * this.moveSpeed * delta;

            // Make him face you
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);

            // Simple Jump: If moving but stuck (e.g., hitting a block), jump!
            // We use a random chance to simulate "trying" to jump up
            if (this.onGround && Math.random() < 0.01) {
                this.velocity.y = 7;
                this.onGround = false;
            }
        }

        // --- PHYSICS & GRAVITY ---
        this.velocity.y -= 18 * delta;
        if (this.onGround && this.velocity.y < 0) this.velocity.y = 0;

        this.position.addScaledVector(this.velocity, delta);
        this.physics.update(this.velocity);

        // Friction
        const friction = this.onGround ? 6.0 : 0.1;
        this.velocity.x -= this.velocity.x * friction * delta;
        this.velocity.z -= this.velocity.z * friction * delta;

        // Sync Mesh
        this.mesh.position.copy(this.position);
    }
}