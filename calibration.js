// import { PolynomialRegression } from 'ml-regression-polynomial';

// Utility function for Euclidean distance
const euclideanDistance = (point1, point2) => {
    return Math.sqrt(
        point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
};

class NonlinearRegression {
    constructor(alpha = 0.1, degree = 2) {
        this.learningRate = 0.001;
        this.iterations = 1000;
        this.tolerance = 1e-6;
        this.parameters = [1, 1, 0]; // Initial parameters [a, b, c]
        this.degree = degree;  // Kept for compatibility
    }

    // Transform features (kept for compatibility with existing interface)
    transformFeatures(X) {
        return X;
    }

    // Function to predict values using the current parameters
    predict(x) {
        const flatX = Array.isArray(x[0]) ? x[0] : x;
        // Using a combination of exponential and polynomial terms for better fitting
        return this.parameters[0] * Math.exp(this.parameters[1] * flatX[0]) + 
               this.parameters[2] * Math.pow(flatX[0], 2);
    }

    // Calculate mean squared error
    meanSquaredError(X, y) {
        return X.reduce((error, x, i) => {
            const pred = this.predict(x);
            return error + Math.pow(pred - y[i], 2);
        }, 0) / X.length;
    }

    // Calculate gradients for parameters
    calculateGradients(X, y) {
        const gradients = [0, 0, 0];
        const n = X.length;

        for (let i = 0; i < n; i++) {
            const x = Array.isArray(X[i][0]) ? X[i][0] : X[i];
            const predicted = this.predict([x]);
            const error = predicted - y[i];
            
            // Gradient for a (exponential term)
            gradients[0] += (2 * error * Math.exp(this.parameters[1] * x[0])) / n;
            // Gradient for b (exponential coefficient)
            gradients[1] += (2 * error * this.parameters[0] * x[0] * 
                           Math.exp(this.parameters[1] * x[0])) / n;
            // Gradient for c (polynomial term)
            gradients[2] += (2 * error * Math.pow(x[0], 2)) / n;
        }

        return gradients;
    }

    // Fit the model to the data
    fit(X, y) {
        let prevError = Infinity;

        for (let iter = 0; iter < this.iterations; iter++) {
            // Calculate gradients
            const gradients = this.calculateGradients(X, y);
            
            // Update parameters with gradient descent
            this.parameters = this.parameters.map(
                (param, i) => param - this.learningRate * gradients[i]
            );
            
            // Calculate error
            const error = this.meanSquaredError(X, y);
            
            // Check for convergence
            if (Math.abs(prevError - error) < this.tolerance) {
                break;
            }
            prevError = error;
        }
    }
}

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

        this.reg_x = new NonlinearRegression(0.1,2);
        this.reg_y = new NonlinearRegression(0.1,2);
        this.currentAlgorithm = "Ridge";
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
        this.__tmp_Y_y.push(y[0]);
        this.__tmp_Y_x.push(y[1]);
        
        if(this.__tmp_Y_y.length > 40){
            this.__tmp_Y_y.shift();
            this.__tmp_Y_x.shift();
            this.__tmp_X.shift();
        }
        console.log("add: ", [].concat(this.Y_y,this.__tmp_Y_y),[].concat(this.Y_x,this.__tmp_Y_x));
        console.log([].concat(this.__tmp_X,this.X)[0],this.Y_y.length);
        
        console.log(ML,[].concat(this.__tmp_X,this.X), [].concat(this.Y_y,this.__tmp_Y_y));
        
        this.reg_x.fit([].concat(this.__tmp_X,this.X), [].concat(this.Y_y,this.__tmp_Y_y));
        this.reg_y.fit([].concat(this.__tmp_X,this.X), [].concat(this.Y_x,this.__tmp_Y_x));
        this.fitted = true;
    }

    predict(x) {
        console.log("predict");
        if(this.fitted)
        {
            const flatX = [].concat(x.flat());
            const yx = this.reg_x.predict(flatX);
            const yy = this.reg_y.predict(flatX);
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
    }
}

// Fisher-Yates Shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [array[i], array[j]] = [array[j], array[i]];  // Swap elements
    }
}

class CalibrationMatrix {
    constructor() {
        this.iterator = 0;
        // this.points = [
        //     [0.5, 0.5], [0.75, 0.5], [1, 0.5], [0.25, 0.5], [0, 0.5],
        //     [1.0, 1.0], [0.75, 1.0], [0.5, 1.0], [0.25, 1.0], [0, 1.0],
        //     [1.0, 0.0], [0.75, 0.0], [0.5, 0.0], [0.25, 0.0], [0, 0.0],
        //     [0.0, 0.75], [0.75, 0.75], [0.5, 0.75], [0.25, 0.75], [0, 0.75],
        //     [1.0, 0.25], [0.75, 0.25], [0.5, 0.25], [0.25, 0.25], [0, 0.25]
        // ];
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
}

// export { Calibrator, CalibrationMatrix, euclideanDistance };
