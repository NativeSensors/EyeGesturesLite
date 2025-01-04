class Fixation {
    /**
     * Creates a new Fixation instance.
     * @param {number} x - The initial x-coordinate.
     * @param {number} y - The initial y-coordinate.
     * @param {number} radius - The radius within which fixation is detected (default is 100).
     */
    constructor(x, y, radius = 100) {
        this.radius = radius;
        this.fixation = 0.0;
        this.x = x;
        this.y = y;
    }

    /**
     * Processes the given x and y coordinates to detect fixation.
     * @param {number} x - The current x-coordinate.
     * @param {number} y - The current y-coordinate.
     * @returns {number} - The current fixation level (between 0.0 and 1.0).
     */
    process(x, y) {
        const distanceSquared = (x - this.x) ** 2 + (y - this.y) ** 2;
        const radiusSquared = this.radius ** 2;

        if (distanceSquared < radiusSquared) {
            this.fixation = Math.min(this.fixation + 0.02, 1.0);
        } else {
            this.x = x;
            this.y = y;
            this.fixation = 0.0;
        }

        return this.fixation;
    }
}

export {Fixation}