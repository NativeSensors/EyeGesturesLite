mod calibrator;
mod fixation;
mod eyegestures;

pub use calibrator::Calibrator;
pub use fixation::Fixation;
pub use eyegestures::EyeGestures;

pub fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}
