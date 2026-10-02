"""Flow classifier: 1D-CNN over payload bytes + Transformer over packet sequence. ONNX for edge."""
import torch, torch.nn as nn

class FlowNet(nn.Module):
    def __init__(self, n_cls=6, d=64):
        super().__init__()
        self.emb = nn.Embedding(256, 32)
        self.conv = nn.Sequential(nn.Conv1d(32, d, 7, padding=3), nn.GELU(), nn.MaxPool1d(2),
                                  nn.Conv1d(d, d, 5, padding=2), nn.GELU(), nn.AdaptiveMaxPool1d(1))
        self.seq = nn.TransformerEncoder(nn.TransformerEncoderLayer(d, 4, 128, batch_first=True), 2)
        self.head = nn.Linear(2 * d, n_cls)  # benign, scan, c2-beacon, covert-channel, exfil, zero-day

    def forward(self, payload, pkt_feats):  # (B,L) bytes, (B,T,d) timing/size features
        a = self.conv(self.emb(payload).transpose(1, 2)).squeeze(-1)
        return self.head(torch.cat([a, self.seq(pkt_feats).mean(1)], -1))

def energy_ood(logits, t=1.0):  # high energy => unseen class => zero-day candidate
    return -t * torch.logsumexp(logits / t, dim=-1)

if __name__ == "__main__":
    torch.onnx.export(FlowNet().eval(), (torch.randint(0, 256, (1, 512)), torch.randn(1, 32, 64)), "flownet.onnx", opset_version=17)
