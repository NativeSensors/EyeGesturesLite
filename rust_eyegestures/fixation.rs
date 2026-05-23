pub struct Fixation {
    x: f64,
    y: f64,
    radius: f64,
    level: f64,
}

impl Fixation {
    pub fn new(x: f64, y: f64, radius: f64) -> Self {
        Self {
            x,
            y,
            radius,
            level: 0.0,
        }
    }

    pub fn process(&mut self, x: f64, y: f64) -> f64 {
        let dx = x - self.x;
        let dy = y - self.y;
        let dist_sq = dx * dx + dy * dy;
        let radius_sq = self.radius * self.radius;

        if dist_sq < radius_sq {
            self.level = (self.level + 0.02).min(1.0);
        } else {
            self.x = x;
            self.y = y;
            self.level = 0.0;
        }

        self.level
    }

    pub fn get_level(&self) -> f64 {
        self.level
    }
}
