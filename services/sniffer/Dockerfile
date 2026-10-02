FROM rust:1.82 AS b
WORKDIR /src
COPY . .
RUN cargo build --release
FROM gcr.io/distroless/cc-debian12
COPY --from=b /src/target/release/unseen-sniffer /sniffer
ENTRYPOINT ["/sniffer"]
