//! Hybrid PQC + CBOM. Backends (aws-lc-rs / liboqs) plug in behind these traits.
use serde::Serialize;

pub trait Kem { fn encaps(&self, pk: &[u8]) -> (Vec<u8>, Vec<u8>); } // (ciphertext, shared secret)
pub trait Signer { fn sign(&self, msg: &[u8]) -> Vec<u8>; }

#[derive(Serialize, Clone)]
pub struct CbomEntry { pub asset: String, pub algorithm: String, pub standard: String, pub mode: String, pub quantum_safe: bool }
pub struct Suite { pub id: &'static str, pub entries: Vec<CbomEntry> }

pub fn suites() -> Vec<Suite> {
    let e = |a: &str, al: &str, s: &str, m: &str, q| CbomEntry { asset: a.into(), algorithm: al.into(), standard: s.into(), mode: m.into(), quantum_safe: q };
    vec![
        Suite { id: "hybrid-v1", entries: vec![
            e("tls-kex", "X25519+ML-KEM-768", "FIPS 203", "hybrid", true),
            e("artifact-sig", "ML-DSA-65", "FIPS 204", "pure", true),
            e("root-sig", "SLH-DSA-SHA2-128s", "FIPS 205", "pure", true)] },
        Suite { id: "classical-fallback", entries: vec![
            e("tls-kex", "X25519", "RFC 7748", "classical", false),
            e("artifact-sig", "Ed25519", "RFC 8032", "classical", false)] },
    ]
}

/// Hybrid secret = HKDF(ss_classical || ss_pq): safe if either primitive survives.
pub fn combine(ss_classic: &[u8], ss_pq: &[u8]) -> Vec<u8> {
    use hkdf::Hkdf; use sha2::Sha384;
    let mut ikm = ss_classic.to_vec(); ikm.extend_from_slice(ss_pq);
    let mut out = vec![0u8; 32];
    Hkdf::<Sha384>::new(None, &ikm).expand(b"unseen-hybrid-v1", &mut out).unwrap();
    out
}

pub struct Rotator { pub active: &'static str, pub previous: Option<&'static str> }
impl Rotator {
    pub fn rotate(&mut self, to: &'static str) { self.previous = Some(self.active); self.active = to; }
    pub fn rollback(&mut self) { if let Some(p) = self.previous.take() { self.active = p; } }
    pub fn cbom_json(&self) -> String {
        let s = suites().into_iter().find(|s| s.id == self.active).unwrap();
        serde_json::to_string_pretty(&serde_json::json!({"bomFormat":"CycloneDX","specVersion":"1.6","suite":s.id,"cryptoAssets":s.entries})).unwrap()
    }
}
