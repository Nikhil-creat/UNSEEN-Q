use unseen_pqc::Rotator;
fn main() {
    let r = Rotator { active: "hybrid-v1", previous: None };
    println!("{}", r.cbom_json()); // CycloneDX CBOM for the active suite
}
