package unseen.agent
import rego.v1

default allow := false

allow if {
  input.tool in data.personas[input.agent]
  not injection_suspected
  input.args.target != "control-plane"
}

injection_suspected if regex.match(`(?i)ignore (all )?previous|exfiltrate|disable (logging|audit)`, input.intent)
