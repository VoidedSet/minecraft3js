import { BlockDict } from "../Blocks";

export class UI {
    constructor(controls) {
        this.controls = controls;

        this.hotbar = [1, 2, 3, 4, 5, 6, 7, 8, 10];
        this.selectedSlot = 0;
        this.maxSlots = 9;

        this.initUI();
        this.initHotbarScroll();
        this.updateHotbarUI();
        this.initInventoryUI();
    }

    initUI() {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        const crosshair = document.getElementById('crosshair');

        instructions.addEventListener('click', () => this.controls.lock());

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
            crosshair.style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
            crosshair.style.display = 'none';
        });
    }

    initHotbarScroll() {
        window.addEventListener('wheel', (event) => {
            this.selectedSlot = (this.selectedSlot + (event.deltaY > 0 ? 1 : -1) + this.maxSlots) % this.maxSlots;
            this.updateHotbarUI();
        });
    }

    fillHotbar() {
        const blockValues = Object.values(BlockDict);
        for (let i = 0; i < this.maxSlots; i++) {
            this.hotbar[i] = blockValues[i % blockValues.length].id;
        }
        this.updateHotbarUI();
    }

    updateHotbarUI() {
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.getElementById(`slot${i + 1}`);
            const icon = document.getElementById(`icon${i + 1}`);

            const blockId = this.hotbar[i];
            const blockData = blockId != null
                ? Object.values(BlockDict).find(b => b.id === blockId)
                : null;

            if (slot) {
                slot.style.borderWidth = i === this.selectedSlot ? "3px" : "2px";
                slot.style.borderColor = i === this.selectedSlot ? "black" : "white";
            }

            if (icon) {
                if (blockData && blockData.uv && blockData.uv.top) {
                    const [u, v] = blockData.uv.top;
                    const texSize = 32;
                    icon.style.backgroundImage = "url('blocks.png')";
                    icon.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
                } else {
                    icon.style.backgroundImage = '';
                    icon.style.backgroundPosition = '';
                }
            }
        }
    }

    initInventoryUI() {
        const inventory = document.getElementById("inventory");
        document.addEventListener("keydown", (e) => {
            if (e.key === "e") {
                this.controls.unlock();
                inventory.style.display = inventory.style.display === "none" ? "flex" : "none";
            }
        });

        const texSize = 32; // if you use 512/16 = 32px per tile
        const blockValues = Object.values(BlockDict);

        for (const block of blockValues) {
            const div = document.createElement("div");
            div.className = "block-slot";

            const [u, v] = block.uv?.top || [0, 0];

            div.style.width = "16px";
            div.style.height = "16px";
            div.style.backgroundImage = "url('blocks.png')";
            div.style.backgroundSize = "256px 256px"; // match your atlas
            div.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
            div.style.border = "2px solid #444";
            div.style.margin = "4px";
            div.style.cursor = "pointer";

            div.onclick = () => {
                // Add block to current selected hotbar slot
                this.hotbar[this.selectedSlot] = block.id;
                this.updateHotbarUI();
                inventory.style.display = "none";
            };

            inventory.appendChild(div);
        }
    }

    setHotbarSlot(blockID) {
        this.hotbar[this.selectedSlot] = blockID;
        this.updateHotbarUI();
    }
}