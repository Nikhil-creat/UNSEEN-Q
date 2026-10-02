//! Passive flow sniffer: groups IPv4 TCP/UDP packets into flows, prints JSON lines every 5s.
//! Needs CAP_NET_RAW. Capture only on networks you own or are authorised to monitor.
use pnet::datalink::{self, Channel::Ethernet, Config};
use pnet::packet::{ethernet::{EtherTypes, EthernetPacket}, ip::IpNextHeaderProtocols as P, ipv4::Ipv4Packet, tcp::TcpPacket, udp::UdpPacket, Packet};
use std::{collections::HashMap, time::{Duration, Instant}};

#[derive(Default)]
struct Flow { pkts: u64, bytes: u64, last: Option<Instant>, gaps: Vec<f64> }
type Key = (String, u16, String, u16, u8);

fn report(flows: &mut HashMap<Key, Flow>) {
    for ((s, sp, d, dp, pr), f) in flows.iter() {
        let n = f.gaps.len() as f64;
        let (mean, cv) = if n >= 6.0 {
            let m = f.gaps.iter().sum::<f64>() / n;
            let sd = (f.gaps.iter().map(|g| (g - m).powi(2)).sum::<f64>() / n).sqrt();
            (m, if m > 0.0 { sd / m } else { 9.9 })
        } else { (0.0, 9.9) };
        // Regular, slow, repeated packets = classic C2 beacon shape.
        let beacon = cv < 0.1 && mean > 1.0;
        println!("{{\"src\":\"{s}\",\"sport\":{sp},\"dst\":\"{d}\",\"dport\":{dp},\"proto\":{pr},\"pkts\":{},\"bytes\":{},\"mean_gap\":{mean:.3},\"cv\":{cv:.3},\"beacon_suspect\":{beacon}}}", f.pkts, f.bytes);
    }
    flows.clear();
}

fn main() {
    let name = std::env::args().nth(1).or_else(|| std::env::var("IFACE").ok()).expect("usage: unseen-sniffer <interface>");
    let iface = datalink::interfaces().into_iter().find(|i| i.name == name).expect("interface not found");
    let cfg = Config { read_timeout: Some(Duration::from_secs(1)), ..Default::default() };
    let mut rx = match datalink::channel(&iface, cfg) { Ok(Ethernet(_, rx)) => rx, _ => panic!("cannot open capture (need CAP_NET_RAW)") };
    let mut flows: HashMap<Key, Flow> = HashMap::new();
    let mut tick = Instant::now();
    loop {
        if let Ok(frame) = rx.next() {
            if let Some(eth) = EthernetPacket::new(frame).filter(|e| e.get_ethertype() == EtherTypes::Ipv4) {
                if let Some(ip) = Ipv4Packet::new(eth.payload()) {
                    let proto = ip.get_next_level_protocol();
                    let (sp, dp) = match proto {
                        P::Tcp => TcpPacket::new(ip.payload()).map(|t| (t.get_source(), t.get_destination())).unwrap_or((0, 0)),
                        P::Udp => UdpPacket::new(ip.payload()).map(|u| (u.get_source(), u.get_destination())).unwrap_or((0, 0)),
                        _ => (0, 0),
                    };
                    let f = flows.entry((ip.get_source().to_string(), sp, ip.get_destination().to_string(), dp, proto.0)).or_default();
                    let now = Instant::now();
                    if let Some(l) = f.last { f.gaps.push(now.duration_since(l).as_secs_f64()); if f.gaps.len() > 200 { f.gaps.remove(0); } }
                    f.last = Some(now); f.pkts += 1; f.bytes += ip.get_total_length() as u64;
                }
            }
        }
        if tick.elapsed() >= Duration::from_secs(5) { report(&mut flows); tick = Instant::now(); }
    }
}
