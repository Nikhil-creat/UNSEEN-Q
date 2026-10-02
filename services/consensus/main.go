package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"time"

	clientv3 "go.etcd.io/etcd/client/v3"
	"go.etcd.io/etcd/client/v3/concurrency"
)

// Leader election with fencing: the etcd revision at election time is a monotonic
// term. Downstream writers reject stale terms (split-brain guard).
func main() {
	id := os.Getenv("NODE_ID")
	cli, err := clientv3.New(clientv3.Config{Endpoints: []string{os.Getenv("ETCD")}, DialTimeout: 3 * time.Second})
	if err != nil { log.Fatal(err) }
	defer cli.Close()
	for { // session TTL expiry == automatic demotion; re-campaign forever
		sess, err := concurrency.NewSession(cli, concurrency.WithTTL(5))
		if err != nil { time.Sleep(time.Second); continue }
		el := concurrency.NewElection(sess, "/unseen/leader")
		if err := el.Campaign(context.Background(), id); err != nil { sess.Close(); continue }
		term := el.Rev()
		log.Printf("LEADER %s term=%d", id, term)
		cli.Put(context.Background(), "/unseen/term", strconv.FormatInt(term, 10))
		<-sess.Done()
		log.Printf("lost leadership %s", id)
	}
}
