pub struct LinearRegression {
    x_data: Vec<Vec<f64>>,
    y_data: Vec<f64>,
    weights: Vec<f64>,
    fitted: bool,
}

impl LinearRegression {
    fn new() -> Self {
        Self {
            x_data: Vec::new(),
            y_data: Vec::new(),
            weights: Vec::new(),
            fitted: false,
        }
    }

    fn add(&mut self, x: &[f64], y: f64) {
        self.x_data.push(x.to_vec());
        self.y_data.push(y);
        self.fit();
    }

    fn fit(&mut self) {
        if self.x_data.len() < 2 {
            return;
        }

        let n = self.x_data.len();
        let m = self.x_data[0].len();
        let mut xtx = vec![vec![0.0; m]; m];
        let mut xty = vec![0.0; m];

        for i in 0..n {
            for j in 0..m {
                xty[j] += self.x_data[i][j] * self.y_data[i];
                for k in 0..m {
                    xtx[j][k] += self.x_data[i][j] * self.x_data[i][k];
                }
            }
        }

        self.weights = Self::solve(xtx, xty);
        self.fitted = true;
    }

    fn predict(&self, x: &[f64]) -> f64 {
        if !self.fitted || self.weights.is_empty() {
            return 0.0;
        }
        x.iter().zip(&self.weights).map(|(a, b)| a * b).sum()
    }

    fn solve(a: Vec<Vec<f64>>, b: Vec<f64>) -> Vec<f64> {
        let n = a.len();
        let mut a = a;
        let mut b = b;

        for i in 0..n {
            let mut max_row = i;
            for k in i + 1..n {
                if a[k][i].abs() > a[max_row][i].abs() {
                    max_row = k;
                }
            }
            a.swap(i, max_row);
            b.swap(i, max_row);

            for k in i + 1..n {
                let factor = a[k][i] / a[i][i];
                for j in i..n {
                    a[k][j] -= factor * a[i][j];
                }
                b[k] -= factor * b[i];
            }
        }

        let mut x = vec![0.0; n];
        for i in (0..n).rev() {
            x[i] = b[i];
            for j in i + 1..n {
                x[i] -= a[i][j] * x[j];
            }
            x[i] /= a[i][i];
        }
        x
    }
}

pub struct Calibrator {
    reg_x: LinearRegression,
    reg_y: LinearRegression,
    points: Vec<[f64; 2]>,
    point_index: usize,
    fitted: bool,
}

impl Calibrator {
    pub fn new() -> Self {
        Self {
            reg_x: LinearRegression::new(),
            reg_y: LinearRegression::new(),
            points: vec![
                [0.25, 0.25], [0.5, 0.75], [1.0, 0.5], [0.75, 0.5], [0.0, 0.75],
                [0.5, 0.5], [1.0, 0.25], [0.75, 0.0], [0.25, 0.5], [0.5, 0.0],
                [0.0, 0.5], [1.0, 1.0], [0.75, 1.0], [0.25, 0.0], [1.0, 0.0],
                [0.0, 1.0], [0.25, 1.0], [0.75, 0.75], [0.5, 0.25], [0.0, 0.25],
                [1.0, 0.5], [0.75, 0.25], [0.5, 1.0], [0.25, 0.75], [0.0, 0.0],
            ],
            point_index: 0,
            fitted: false,
        }
    }

    pub fn add(&mut self, keypoints: &[f64], target: [f64; 2]) {
        self.reg_x.add(keypoints, target[0]);
        self.reg_y.add(keypoints, target[1]);
        self.fitted = true;
    }

    pub fn predict(&self, keypoints: &[f64]) -> [f64; 2] {
        if !self.fitted {
            return [0.0, 0.0];
        }
        [self.reg_x.predict(keypoints), self.reg_y.predict(keypoints)]
    }

    pub fn current_point(&self, width: f64, height: f64) -> [f64; 2] {
        let p = self.points[self.point_index];
        [p[0] * width, p[1] * height]
    }

    pub fn next_point(&mut self) {
        self.point_index = (self.point_index + 1) % self.points.len();
    }

    pub fn reset(&mut self) {
        self.reg_x = LinearRegression::new();
        self.reg_y = LinearRegression::new();
        self.fitted = false;
    }
}
