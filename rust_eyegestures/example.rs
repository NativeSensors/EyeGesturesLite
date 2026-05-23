use eyegestures::{Calibrator, Fixation};

fn main() {
    let mut calibrator = Calibrator::new();
    let mut fixation = Fixation::new(500.0, 500.0, 100.0);

    let keypoints = vec![
        0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
        1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0,
        2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
        3.1, 3.2,
    ];

    for i in 0..5 {
        let target = [100.0 + i as f64 * 50.0, 150.0 + i as f64 * 50.0];
        calibrator.add(&keypoints, target);
    }

    let prediction = calibrator.predict(&keypoints);
    println!("Predicted gaze: {:?}", prediction);

    let current = calibrator.current_point(1920.0, 1080.0);
    println!("Current calibration point: {:?}", current);

    let fix_level = fixation.process(500.0, 500.0);
    println!("Fixation level: {}", fix_level);
}
