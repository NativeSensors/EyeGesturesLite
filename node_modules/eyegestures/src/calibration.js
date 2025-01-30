// Utility function for Euclidean distance
const euclideanDistance = (point1, point2) => {
    return Math.sqrt(
        point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
};

// Update Calibrator to
class Calibrator {
    static PRECISION_LIMIT = 50;
    static PRECISION_STEP = 10;
    static ACCEPTANCE_RADIUS = 500;

    constructor(CALIBRATION_RADIUS = 1000) {
        this.X = [];
        this.__tmp_X = [];
        this.Y_y = [];
        this.Y_x = [];
        this.__tmp_Y_y = [];
        this.__tmp_Y_x = [];
        this.reg = null;

        this.reg_x = null;
        this.reg_y = null;
        this.currentAlgorithm = "MLR";
        this.fitted = false;
        this.cvNotSet = true;

        this.matrix = new CalibrationMatrix();

        this.precisionLimit = Calibrator.PRECISION_LIMIT;
        this.precisionStep = Calibrator.PRECISION_STEP;
        this.acceptanceRadius = Math.floor(CALIBRATION_RADIUS / 2);
        this.calibrationRadius = Math.floor(CALIBRATION_RADIUS);
    }

    add(x, y) {
        const flatX = [].concat(x.flat());
        this.__tmp_X.push(flatX);
        this.__tmp_Y_y.push([y[0]]);
        this.__tmp_Y_x.push([y[1]]);
        
        if(this.__tmp_Y_y.length > 40){
            this.__tmp_Y_y.shift();
            this.__tmp_Y_x.shift();
            this.__tmp_X.shift();
        }
        console.log(ML);
        this.reg_x = new ML.MultivariateLinearRegression([].concat(this.__tmp_X,this.X), [].concat(this.__tmp_Y_y,this.Y_y));
        this.reg_y = new ML.MultivariateLinearRegression([].concat(this.__tmp_X,this.X), [].concat(this.__tmp_Y_x,this.Y_x));
        this.fitted = true;
    }

    predict(x) {
        if(this.fitted)
        {
            const flatX = [].concat(x.flat());
            const yx = this.reg_x.predict(flatX)[0];
            const yy = this.reg_y.predict(flatX)[0];
            return [yx, yy];
        }
        return [0.0,0.0];
    }

    movePoint() {
        this.matrix.movePoint();
        this.Y_y = this.Y_y.concat(this.__tmp_Y_y);
        this.Y_x = this.Y_x.concat(this.__tmp_Y_x);
        this.X = this.X.concat(this.__tmp_X);
        this.__tmp_X = [];
        this.__tmp_Y_y = [];
        this.__tmp_Y_x = [];
    }

    getCurrentPoint(width, height) {
        return this.matrix.getCurrentPoint(width, height);
    }

    updMatrix(points) {
        return this.matrix.updMatrix(points);
    }

    unfit() {
        this.acceptanceRadius = Calibrator.ACCEPTANCE_RADIUS;
        this.calibrationRadius = this.calibrationRadius;
        this.fitted = false;
        this.Y_y = [];
        this.Y_x = [];
        this.X = [];
    }
}

class CalibrationMatrix {
    constructor() {
        this.iterator = 0;

        this.points = [
            [0.25, 0.25], [0.5, 0.75], [1, 0.5], [0.75, 0.5],  [0, 0.75],
            [0.5, 0.5], [1.0, 0.25], [0.75, 0.0], [0.25, 0.5], [0.5, 0.0],
            [0, 0.5], [1.0, 1.0], [0.75, 1.0], [0.25, 0.0], [1.0, 0.0],
            [0, 1.0], [0.25, 1.0], [0.75, 0.75], [0.5, 0.25], [0, 0.25],
            [1.0, 0.5], [0.75, 0.25], [0.5, 1.0], [0.25, 0.75], [0.0, 0.0]
        ];
        
        // this.points = shuffle(this.points);
    }

    updMatrix(points) {
        this.points = points;
        this.iterator = 0;
    }

    movePoint() {
        this.iterator = (this.iterator + 1) % this.points.length;
    }

    getCurrentPoint(width = 1.0, height = 1.0) {
        const point = this.points[this.iterator];
        return [point[0] * width, point[1] * height];
    }
};

// export { Calibrator, CalibrationMatrix, euclideanDistance };
